import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  STARTER_STONES,
  coordinate,
  handSize,
  evaluateKeywords,
} from "../../src/game.ts";
import type { Stone, BoardSize } from "../../src/game.ts";
import {
  ADVENTURE_STORAGE,
  newAdventure,
  enterAdventureNode,
} from "../../src/adventure.ts";
import type { Adventure } from "../../src/adventure.ts";
import {
  newDraft,
  nominateDraftCards,
  pickDraftCard,
  DRAFT_STORAGE,
} from "../../src/draft.ts";
import {
  CHARACTER_DEFAULTS_STORAGE,
  editedCharacterDefault,
  originalCharacter,
} from "../../src/cardDefaults.ts";
import { pendingPipEffects } from "../../src/effects.ts";

if (process.env.SKYSTONES_STANDALONE === "1") {
  const html = readFileSync("standalone/Skystones.html", "utf8");
  let failures: string[];
  test.beforeEach(async ({ page }) => {
    failures = [];
    page.on("pageerror", (error) => failures.push(error.message));
    await page.route("**/*", (route) => {
      if (route.request().url() === "http://127.0.0.1:5173/")
        return route.fulfill({
          status: 200,
          contentType: "text/html",
          body: html,
        });
      failures.push(`External request: ${route.request().url()}`);
      return route.abort();
    });
  });
  test.afterEach(() => expect(failures).toEqual([]));
}
async function stored(page: Page): Promise<Adventure> {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    ADVENTURE_STORAGE,
  );
}
async function targets(page: Page) {
  while (await page.locator(".target-cell.available").count()) {
    await page.locator(".target-cell.available").first().click();
    const sides = page
      .getByRole("group", { name: "Choose the edge that loses pips" })
      .locator("button:enabled");
    if (await sides.count()) await sides.first().click();
  }
}
const weaver: Stone = {
  ...STARTER_STONES[0],
  id: "custom-hand-weaver",
  name: "Hand Weaver",
  edges: [0, 0, 0, 0],
  custom: true,
  keywords: [
    {
      type: "conjure",
      mode: "specific",
      card: "tree-rex",
      count: 2,
      recipient: "self",
    },
    {
      type: "conjure",
      mode: "random",
      element: "fire",
      tribe: "giants",
      count: 1,
      recipient: "opponent",
    },
  ],
};

test("studio configures specified and random Conjure plus a Combo grant, then saves, exports, imports, and edits it", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Card studio", exact: true }).click();
  await page.getByLabel("Stone name").fill("Hand Weaver");
  for (const [i, type] of ["conjure", "conjure", "combo"].entries()) {
    await page.getByRole("button", { name: /Add keyword/ }).click();
    await page
      .getByLabel(`Keyword ${i + 1}`, { exact: true })
      .selectOption(type);
  }
  await page
    .getByLabel("Specified card · Keyword 1", { exact: true })
    .selectOption("tree-rex");
  await page
    .getByLabel("Cards added · Keyword 1", { exact: true })
    .selectOption("2");
  await page
    .getByLabel("Card source · Keyword 2", { exact: true })
    .selectOption("random");
  await page
    .getByLabel("Random element · Keyword 2", { exact: true })
    .selectOption("fire");
  await page
    .getByLabel("Random tribe · Keyword 2", { exact: true })
    .selectOption("giants");
  await page
    .getByLabel("Receiving player · Keyword 2", { exact: true })
    .selectOption("both");
  await page.getByLabel("Combo trigger", { exact: true }).selectOption("tribe");
  await page.getByLabel("Combo tribe", { exact: true }).selectOption("giants");
  await page
    .getByRole("button", { name: "Add Combo keyword", exact: true })
    .click();
  await page
    .getByLabel("Combo keyword 1", { exact: true })
    .selectOption("conjure");
  await page
    .getByLabel("Receiving player · Combo keyword 1", { exact: true })
    .selectOption("opponent");
  await expect(page.locator(".preview-card .keyword-conjure")).toHaveText([
    "Conjure 2 Tree Rex",
    "Conjure 1 Random Fire Giants · BOTH",
  ]);
  await page.setViewportSize({ width: 390, height: 1000 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "/tmp/skystones-conjure-studio-phone.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Save to collection", exact: true })
    .click();
  await page.reload();
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page
    .getByRole("button", { name: "View Hand Weaver", exact: true })
    .click();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export card file", exact: true })
    .click();
  const stream = await (await download).createReadStream(),
    chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const buffer = Buffer.concat(chunks),
    card: Stone = JSON.parse(buffer.toString()).card;
  expect(card.keywords).toEqual([
    {
      type: "conjure",
      mode: "specific",
      card: "tree-rex",
      count: 2,
      recipient: "self",
    },
    {
      type: "conjure",
      mode: "random",
      element: "fire",
      tribe: "giants",
      count: 1,
      recipient: "both",
    },
    {
      type: "combo",
      condition: "tribe",
      tribe: "giants",
      pips: [{ side: 0, amount: 1 }],
      keywords: [
        {
          type: "conjure",
          mode: "specific",
          card: "spyro",
          count: 1,
          recipient: "opponent",
        },
      ],
    },
  ]);
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.getByLabel("Import card file").setInputFiles({
    name: "conjure.skystone.json",
    mimeType: "application/json",
    buffer,
  });
  await expect(page.locator(".toast")).toContainText(
    "has joined your collection",
  );
  await page
    .getByRole("button", { name: "View Hand Weaver", exact: true })
    .last()
    .click();
  await page.getByRole("button", { name: "Edit stone", exact: true }).click();
  await expect(
    page.getByLabel("Specified card · Keyword 1", { exact: true }),
  ).toHaveValue("tree-rex");
  await expect(
    page.getByLabel("Random tribe · Keyword 2", { exact: true }),
  ).toHaveValue("giants");
});

for (const size of [3, 4] as BoardSize[]) {
  test(`${size}×${size} normal local play adds specified cards and random opponent cards, wraps the larger hand, and plays a new card`, async ({
    page,
  }) => {
    const custom: Stone[] = [
      weaver,
      ...Array.from({ length: handSize(size) - 1 }, (_, i) => ({
        ...STARTER_STONES[0],
        id: `custom-filler-${i}`,
        name: `Filler ${i}`,
        custom: true,
        edges: [1, 1, 1, 1] as Stone["edges"],
        keywords: [],
      })),
    ];
    await page.addInitScript(
      (library) =>
        localStorage.setItem("skystones-library-v1", JSON.stringify(library)),
      {
        custom,
        deck: custom.map((card) => card.id),
        boardSize: size,
        sound: false,
      },
    );
    await page.goto("/");
    await page.getByRole("button", { name: "New match", exact: true }).click();
    await page.getByRole("button", { name: /Bring a friend/ }).click();
    await page
      .getByRole("button", { name: "Find a little magic", exact: true })
      .click();
    await page.getByRole("button", { name: /^Select Hand Weaver,/ }).click();
    await page.locator("#board-0").click();
    await expect(page.locator(".hand-card-button")).toHaveCount(
      handSize(size) + 1,
    );
    await expect(
      page.locator(".hand-card-button").filter({ hasText: "Conjured" }),
    ).toHaveCount(1);
    await page.locator("#board-0").click();
    await expect(page.getByRole("dialog")).toContainText(
      "Player one +2: Tree Rex, Tree Rex",
    );
    await page
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
    await page.locator(".hand-card-button").first().click();
    await page.locator(`#board-${size * size - 1}`).click();
    await targets(page);
    const trees = page.getByRole("button", { name: /^Select Tree Rex,/ });
    await expect(trees).toHaveCount(2);
    await page.setViewportSize({ width: 390, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const widths = await page
      .locator(".hand-card-button")
      .evaluateAll((cards) =>
        cards.map((card) => card.getBoundingClientRect().width),
      );
    expect(Math.min(...widths)).toBeGreaterThan(40);
    await page.screenshot({
      path: `/tmp/skystones-conjure-normal-${size}-phone.png`,
      fullPage: true,
    });
    await trees.first().click();
    await page.locator("#board-1").click();
    await expect(
      page.locator("#board-1 .capture-flip-back .stone-caption"),
    ).toContainText("Tree Rex");
  });

  test(`${size}×${size} Adventure cancellation grants nothing, then saves generated hands, keeps intentional duplicates, and applies queued pips only on play`, async ({
    page,
  }) => {
    const run = enterAdventureNode(newAdventure(size, 81), "moss"),
      last = size * size - 1;
    const card: Stone = {
      ...run.inventory[0],
      name: "Hand Weaver",
      edges: [0, 0, 0, 0],
      keywords: [
        {
          type: "conjure",
          mode: "specific",
          card: "tree-rex",
          count: 2,
          recipient: "both",
        },
        {
          type: "conjure",
          mode: "random",
          count: 1,
          element: "fire",
          tribe: "giants",
          recipient: "self",
        },
        { type: "next-play", side: 0, amount: 1, recipient: "self" },
        {
          type: "environment",
          environment: { kind: "bastion", amount: 1, tribe: "giants" },
        },
      ],
    };
    run.inventory[0] = card;
    run.battle!.hands[0][0] = card;
    const inventory = JSON.parse(JSON.stringify(run.inventory));
    await page.clock.install({ time: new Date("2026-11-07T12:00:00Z") });
    await page.clock.pauseAt(new Date("2026-11-07T12:00:01Z"));
    await page.addInitScript(
      ({ key, run }) => {
        if (!localStorage.getItem(key))
          localStorage.setItem(key, JSON.stringify(run));
      },
      { key: ADVENTURE_STORAGE, run },
    );
    await page.goto("/");
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    await page.locator(".run-hand-card").first().click();
    await page.locator("#adventure-board-0").click();
    await expect(page.getByRole("dialog")).toContainText(
      "Environment: choose a tile",
    );
    expect((await stored(page)).battle!.hands).toEqual(
      JSON.parse(JSON.stringify(run.battle!.hands)),
    );
    await page
      .getByRole("button", { name: "Cancel play", exact: true })
      .click();
    expect((await stored(page)).battle!.board.every((cell) => !cell)).toBe(
      true,
    );
    if (
      (await page
        .locator(".run-hand-card")
        .first()
        .getAttribute("aria-pressed")) !== "true"
    )
      await page.locator(".run-hand-card").first().click();
    await page.locator("#adventure-board-0").click();
    await page
      .getByRole("button", {
        name: `${coordinate(last, size)}, empty`,
        exact: true,
      })
      .click();
    const gained = (await stored(page)).battle!;
    expect(gained.hands.map((hand) => hand.length)).toEqual([
      handSize(size) + 2,
      handSize(size) + 2,
    ]);
    expect(gained.hands[0].filter((card) => card.conjured)).toHaveLength(3);
    expect(pendingPipEffects(gained.board, 0)).toHaveLength(1);
    await page.reload();
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    expect((await stored(page)).battle).toEqual(gained);
    await page.clock.runFor(1000);
    await expect.poll(async () => (await stored(page)).battle!.current).toBe(0);
    const before = await stored(page),
      generated = before.battle!.hands[0].find(
        (card) => card.conjured && card.portrait === "tree-rex",
      )!;
    const expectedEdges = evaluateKeywords(
      generated,
      before.battle!.board,
      0,
    ).edges;
    const index = before.battle!.hands[0].findIndex(
      (card) => card.id === generated.id,
    );
    await page.locator(".run-hand-card").nth(index).click();
    await page.locator(`#adventure-board-${last}`).click();
    expect((await stored(page)).battle!.board[last]!.edges).toEqual(
      expectedEdges,
    );
    await expect(
      page.locator(`#adventure-board-${last} .capture-flip-back .shield-pip`),
    ).toHaveCount(4);
    expect(
      pendingPipEffects((await stored(page)).battle!.board, 0),
    ).toHaveLength(0);
    expect((await stored(page)).inventory).toEqual(inventory);
    const snapshot = (await stored(page)).battle!;
    await page.reload();
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    expect((await stored(page)).battle).toEqual(snapshot);
    await page.locator(`#adventure-board-${last}`).click();
    await expect(page.getByRole("dialog")).toContainText(
      "Conjured card · lasts for this battle only.",
    );
    await page
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
    await page.setViewportSize({ width: 390, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}

test("a drafted character default conjures playable cards without changing saved draft picks", async ({
  page,
}) => {
  const base = newDraft(3, 47, {}).cards[0],
    original = originalCharacter(base.portrait)!;
  const defaults = editedCharacterDefault(
    original.portrait!,
    {
      ...original,
      name: "Draft Conjurer",
      edges: [0, 0, 0, 0],
      keywords: [
        {
          type: "conjure",
          mode: "specific",
          card: "enemy-enfuego-chompy",
          count: 2,
          recipient: "both",
        },
      ],
    },
    {},
  );
  let draft = newDraft(3, 47, defaults);
  draft = nominateDraftCards(
    draft,
    draft.cards.slice(0, 6).map((card) => card.id),
  );
  draft = nominateDraftCards(
    draft,
    draft.cards.slice(6, 12).map((card) => card.id),
  );
  while (draft.phase === "draft")
    draft = pickDraftCard(
      draft,
      draft.offered.includes(base.id) ? base.id : draft.offered[0],
    );
  const owner = draft.hands[0].includes(base.id) ? 0 : 1;
  await page.addInitScript(
    ({ draft, defaults, key, defaultsKey }) => {
      localStorage.setItem(key, JSON.stringify(draft));
      localStorage.setItem(defaultsKey, JSON.stringify(defaults));
    },
    {
      draft,
      defaults,
      key: DRAFT_STORAGE,
      defaultsKey: CHARACTER_DEFAULTS_STORAGE,
    },
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Draft", exact: true }).click();
  await page
    .getByRole("button", { name: "Play drafted match", exact: true })
    .click();
  if (owner === 1) {
    await page.locator(".hand-card-button").first().click();
    await page.locator("#board-0").click();
    await targets(page);
  }
  await page.getByRole("button", { name: /^Select Draft Conjurer,/ }).click();
  await page.locator("#board-4").click();
  const chompies = page.getByRole("button", {
    name: /^Select Enfuego Chompy,/,
  });
  await expect(chompies).toHaveCount(2);
  await chompies.first().click();
  await page.locator("#board-8").click();
  await expect(
    page.locator("#board-8 .capture-flip-back .stone-caption"),
  ).toContainText("Enfuego Chompy");
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      DRAFT_STORAGE,
    ),
  ).toEqual(JSON.parse(JSON.stringify(draft)));
});
