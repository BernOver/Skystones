import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  STARTER_STONES,
  handSize,
  placeStone,
  coordinate,
} from "../../src/game.ts";
import type { Stone, Side } from "../../src/game.ts";
import { CONJURE_CARDS } from "../../src/conjure.ts";
import type { ConjureKeyword } from "../../src/conjure.ts";
import { DEFAULT_TOKENS } from "../../src/tokens.ts";
import {
  ADVENTURE_STORAGE,
  newAdventure,
  enterAdventureNode,
  adventureCardStrengths,
} from "../../src/adventure.ts";
import type { Adventure } from "../../src/adventure.ts";
import {
  DRAFT_STORAGE,
  newDraft,
  nominateDraftCards,
  pickDraftCard,
} from "../../src/draft.ts";
import {
  CHARACTER_DEFAULTS_STORAGE,
  originalCharacter,
  editedCharacterDefault,
} from "../../src/cardDefaults.ts";

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
      failures.push(route.request().url());
      return route.abort();
    });
  });
  test.afterEach(() => expect(failures).toEqual([]));
}
const pips = ([0, 1, 2, 3] as Side[]).map((side) => ({ side, amount: 2 }));
const conjure: ConjureKeyword = {
  type: "conjure",
  mode: "specific",
  card: "tree-rex",
  count: 2,
  recipient: "self",
  pips,
  keywords: [{ type: "shield", side: 2, amount: 2 }],
};
async function targets(page: Page) {
  while (await page.locator(".target-cell.available").count()) {
    await page.locator(".target-cell.available").first().click();
    const sides = page
      .getByRole("group", { name: "Choose the edge that loses pips" })
      .locator("button:enabled");
    if (await sides.count()) await sides.first().click();
  }
}
async function stored(page: Page): Promise<Adventure> {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    ADVENTURE_STORAGE,
  );
}

test("studio configures pip and keyword buffs, retains them across source changes, and shares nested token dependencies", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.goto("/");
  await page.getByRole("button", { name: "Card studio", exact: true }).click();
  await page.getByLabel("Stone name").fill("Empowered Caller");
  await page.getByRole("button", { name: /^Add keyword/ }).click();
  await page.getByLabel("Keyword 1", { exact: true }).selectOption("conjure");
  for (const side of ["North", "East", "South", "West"])
    await page
      .getByLabel(`Conjure ${side} pips · Keyword 1`, { exact: true })
      .selectOption("2");
  await page
    .getByRole("button", {
      name: "Add Conjure keyword · Keyword 1",
      exact: true,
    })
    .click();
  await page.getByLabel("Shield pips 1 grant 1", { exact: true }).fill("2");
  await page
    .getByRole("button", {
      name: "Add Conjure keyword · Keyword 1",
      exact: true,
    })
    .click();
  await page
    .getByLabel("Keyword 1 grant 2", { exact: true })
    .selectOption("conjure");
  await page
    .getByLabel("Card source · Keyword 1 grant 2", { exact: true })
    .selectOption("token");
  await page
    .getByLabel("Conjure North pips · Keyword 1 grant 2", { exact: true })
    .selectOption("1");
  await page
    .getByLabel("Card source · Keyword 1", { exact: true })
    .selectOption("token");
  await page
    .getByLabel("Card source · Keyword 1", { exact: true })
    .selectOption("random");
  await page
    .getByLabel("Random element · Keyword 1", { exact: true })
    .selectOption("fire");
  await page
    .getByLabel("Random tribe · Keyword 1", { exact: true })
    .selectOption("giants");
  await page
    .getByLabel("Cards added · Keyword 1", { exact: true })
    .selectOption("2");
  await expect(
    page.getByLabel("Conjure North pips · Keyword 1", { exact: true }),
  ).toHaveValue("2");
  await page.getByRole("button", { name: /^Add keyword/ }).click();
  await page.getByLabel("Keyword 2", { exact: true }).selectOption("combo");
  await page
    .getByRole("button", { name: "Add Combo keyword", exact: true })
    .click();
  await page
    .getByLabel("Combo keyword 1", { exact: true })
    .selectOption("conjure");
  await page
    .getByLabel("Conjure East pips · Combo keyword 1", { exact: true })
    .selectOption("3");
  await page.getByRole("button", { name: /^Add keyword/ }).click();
  await page.getByLabel("Keyword 3", { exact: true }).selectOption("next-play");
  await page
    .getByRole("button", {
      name: "Add Next Play keyword · Keyword 3",
      exact: true,
    })
    .click();
  await page
    .getByLabel("Keyword 3 grant 1", { exact: true })
    .selectOption("conjure");
  await page
    .getByLabel("Conjure South pips · Keyword 3 grant 1", { exact: true })
    .selectOption("1");
  await expect(page.locator(".preview-card .keyword-conjure")).toContainText(
    "+2 per side",
  );
  await page.setViewportSize({ width: 390, height: 1000 });
  const strength = await page
    .getByLabel("Shield pips 1 grant 1", { exact: true })
    .boundingBox();
  expect(strength!.width).toBeGreaterThanOrEqual(60);
  const nestedType = await page
    .getByLabel("Combo keyword 1", { exact: true })
    .boundingBox();
  const nestedRecipient = await page
    .getByLabel("Receiving player · Combo keyword 1", { exact: true })
    .boundingBox();
  expect(nestedType!.y).toBeLessThan(nestedRecipient!.y);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .locator(".keyword-editor")
    .screenshot({ path: "/tmp/skystones-conjure-buffs-studio-phone.png" });
  await page
    .getByRole("button", { name: "Save to collection", exact: true })
    .click();
  await page.reload();
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page
    .getByRole("button", { name: "View Empowered Caller", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Keywords added to each generated card",
  );
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export card file", exact: true })
    .click();
  const stream = await (await download).createReadStream(),
    chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const buffer = Buffer.concat(chunks),
    payload = JSON.parse(buffer.toString());
  expect(payload.card.keywords[0]).toMatchObject({
    type: "conjure",
    mode: "random",
    element: "fire",
    tribe: "giants",
    pips,
    keywords: [
      { type: "shield", side: 0, amount: 2 },
      {
        type: "conjure",
        mode: "token",
        token: DEFAULT_TOKENS[0].id,
        pips: [{ side: 0, amount: 1 }],
      },
    ],
  });
  expect(payload.tokens).toHaveLength(1);
  expect(payload.card.keywords[1].keywords[0].pips).toEqual([
    { side: 1, amount: 3 },
  ]);
  expect(payload.card.keywords[2].keywords[0].pips).toEqual([
    { side: 2, amount: 1 },
  ]);
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.getByLabel("Import card file").setInputFiles({
    name: "buffed-conjure.skystone.json",
    mimeType: "application/json",
    buffer,
  });
  await expect(page.locator(".toast")).toContainText(
    "has joined your collection",
  );
  await page
    .getByRole("button", { name: "View Empowered Caller", exact: true })
    .last()
    .click();
  await page.getByRole("button", { name: "Edit stone", exact: true }).click();
  await expect(
    page.getByLabel("Conjure West pips · Keyword 1", { exact: true }),
  ).toHaveValue("2");
  await expect(
    page.getByLabel("Card source · Keyword 1 grant 2", { exact: true }),
  ).toHaveValue("token");
});

for (const size of [3, 4] as const) {
  test(`${size}×${size} normal games display the buffed pips and Shield on generated cards and allow playing them`, async ({
    page,
  }) => {
    const custom: Stone[] = Array.from({ length: handSize(size) }, (_, i) => ({
      ...STARTER_STONES[0],
      id: `custom-buffed-${i}`,
      name: i ? `Filler ${i}` : "Empowered Caller",
      custom: true,
      edges: [0, 0, 0, 0],
      keywords: i ? [] : [conjure],
    }));
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
    await page
      .getByRole("button", { name: /^Select Empowered Caller,/ })
      .click();
    await page.locator("#board-0").click();
    await page.locator(".hand-card-button").first().click();
    await page.locator(`#board-${size * size - 1}`).click();
    await targets(page);
    const copies = page.getByRole("button", { name: /^Select Tree Rex,/ }),
      base = CONJURE_CARDS.find((card) => card.portrait === "tree-rex")!;
    await expect(copies).toHaveCount(2);
    await expect(copies.first().locator(".edge > b")).toHaveText(
      base.edges.map((n) => String(n + 2)),
    );
    await expect(copies.first().locator(".shield-pip")).toHaveCount(1);
    await page.setViewportSize({ width: 390, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await copies.first().click();
    await page.locator(`#board-${size}`).click();
    await targets(page);
    await expect(
      page.locator(`#board-${size} .capture-flip-back .stone-caption`),
    ).toContainText("Tree Rex");
    await expect(
      page.locator(`#board-${size} .capture-flip-back .shield-pip`),
    ).toHaveCount(1);
  });

  test(`${size}×${size} Adventure cancels generation transactionally and saves random buffed cards for both players across hand and board reloads`, async ({
    page,
  }) => {
    const run = enterAdventureNode(newAdventure(size, 81), "moss"),
      last = size * size - 1;
    const source: Stone = {
      ...run.inventory[0],
      name: "Empowered Caller",
      edges: [0, 0, 0, 0],
      keywords: [
        {
          type: "conjure",
          mode: "random",
          element: "fire",
          tribe: "giants",
          count: 2,
          recipient: "both",
          pips: pips.map((pip) => ({ ...pip, amount: 5 })),
          keywords: [
            { type: "shield", side: 2, amount: 2 },
            { type: "sunder", side: 0 },
          ],
        },
        { type: "silence" },
      ],
    };
    run.inventory[0] = source;
    run.battle!.hands[0][0] = source;
    run.battle!.hands[1] = run.battle!.hands[1].map((card) => ({
      ...card,
      edges: [1, 1, 1, 1],
      keywords: [],
    }));
    const guard = {
      ...run.battle!.hands[1].pop()!,
      keywords: [{ type: "shield" as const, side: 0 as const }],
    };
    run.battle!.board = placeStone(run.battle!.board, last, guard, 1).board;
    run.battle!.turns = 1;
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
    const before = await stored(page);
    await page.locator(".run-hand-card").first().click();
    await page.locator("#adventure-board-0").click();
    await page
      .getByRole("button", { name: "Cancel play", exact: true })
      .click();
    expect(await stored(page)).toEqual(before);
    await page.locator("#adventure-board-0").click();
    await page
      .getByRole("button", {
        name: new RegExp(`^Target ${coordinate(last, size)}:`),
      })
      .click();
    const gained = await stored(page),
      battle = gained.battle!;
    expect(
      battle.hands.map((hand) => hand.filter((card) => card.conjured).length),
    ).toEqual([2, 2]);
    for (const hand of battle.hands)
      for (const card of hand.filter((card) => card.conjured)) {
        expect(card.element).toBe("fire");
        expect(card.edges).toEqual(card.baseEdges!.map((n) => n + 5));
        expect(card.keywords).toContainEqual({ type: "sunder", side: 0 });
      }
    expect(gained.inventory).toEqual(before.inventory);
    await page.reload();
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    expect((await stored(page)).battle).toEqual(battle);
    await page.clock.runFor(1000);
    await expect.poll(async () => (await stored(page)).battle!.current).toBe(0);
    const next = await stored(page),
      cardIndex = next.battle!.hands[0].findIndex((card) => card.conjured),
      copy = next.battle!.hands[0][cardIndex];
    const placement = next.battle!.board.findIndex((cell) => !cell);
    await expect(
      page.locator(".run-hand-card").nth(cardIndex).locator(".edge > b"),
    ).toHaveText(adventureCardStrengths(next, copy).edges.map(String));
    await page.locator(".run-hand-card").nth(cardIndex).click();
    await page.locator(`#adventure-board-${placement}`).click();
    await expect(page.getByRole("dialog")).toContainText("Sunder");
    await targets(page);
    const played = await stored(page);
    expect(played.battle!.board[placement]!.stone.edges).toEqual(copy.edges);
    expect(played.battle!.board[placement]!.stone.conjured).toBe(true);
    expect(played.inventory).toEqual(before.inventory);
    await page.reload();
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    expect((await stored(page)).battle).toEqual(played.battle);
    await page.locator(`#adventure-board-${placement}`).click();
    await expect(page.getByRole("dialog")).toContainText("Conjured card");
    await page.setViewportSize({ width: 390, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}

test("Draft's saved character defaults conjure buffed tokens without changing the drafted pool", async ({
  page,
}) => {
  const base = newDraft(3, 47, {}).cards[0],
    original = originalCharacter(base.portrait)!;
  const defaults = editedCharacterDefault(
    original.portrait!,
    {
      ...original,
      name: "Draft Buff Caller",
      edges: [0, 0, 0, 0],
      keywords: [
        {
          type: "conjure",
          mode: "token",
          token: DEFAULT_TOKENS[0].id,
          count: 1,
          recipient: "both",
          pips,
          keywords: [{ type: "shield", side: 2, amount: 2 }],
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
    await page.locator("#board-8").click();
    await targets(page);
  }
  await page
    .getByRole("button", { name: /^Select Draft Buff Caller,/ })
    .click();
  await page.locator("#board-0").click();
  const token = page.getByRole("button", { name: /^Select Chompy Seedling,/ });
  await expect(token.locator(".edge > b")).toHaveText(
    DEFAULT_TOKENS[0].edges.map((n) => String(n + 2)),
  );
  await expect(token.locator(".shield-pip")).toHaveCount(1);
  await token.click();
  await page.locator("#board-4").click();
  await expect(
    page.locator("#board-4 .capture-flip-back .stone-caption"),
  ).toContainText("Chompy Seedling");
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      DRAFT_STORAGE,
    ),
  ).toEqual(JSON.parse(JSON.stringify(draft)));
});

test("temporary buffs cannot be imported as an over-budget permanent base card", async ({
  page,
}) => {
  await page.goto("/");
  const card: Stone = {
    ...STARTER_STONES[0],
    id: "custom-conjured-invalid-base",
    name: "Temporary Strong Copy",
    custom: true,
    conjured: true,
    edges: [9, 9, 9, 9],
    keywords: [],
  };
  await page.getByLabel("Import card file").setInputFiles({
    name: "temporary.skystone.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({ format: "skystones-card", version: 1, card }),
    ),
  });
  await expect(page.locator(".toast")).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("skystones-library-v1") || "{}")
          .custom || [],
    ),
  ).toEqual([]);
});
