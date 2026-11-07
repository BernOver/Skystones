import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { STARTER_STONES, coordinate } from "../../src/game.ts";
import type { Stone } from "../../src/game.ts";
import {
  ENVIRONMENTS,
  defaultEnvironment,
  pendingPipEffects,
} from "../../src/effects.ts";
import {
  ADVENTURE_STORAGE,
  enterAdventureNode,
  newAdventure,
  playAdventureCard,
} from "../../src/adventure.ts";
import type { Adventure } from "../../src/adventure.ts";
import {
  editedCharacterDefault,
  CHARACTER_DEFAULTS_STORAGE,
  originalCharacter,
} from "../../src/cardDefaults.ts";
import {
  newDraft,
  nominateDraftCards,
  pickDraftCard,
  DRAFT_STORAGE,
} from "../../src/draft.ts";
const caster: Stone = {
  ...STARTER_STONES[0],
  id: "custom-tile-weaver",
  name: "Tile Weaver",
  edges: [0, 0, 0, 0],
  custom: true,
  keywords: [
    { type: "next-play", side: "all", amount: 1, recipient: "self" },
    { type: "environment", environment: defaultEnvironment("blight") },
  ],
};
async function stored(page: Page): Promise<Adventure> {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    ADVENTURE_STORAGE,
  );
}
async function openRun(page: Page, run: Adventure) {
  await page.addInitScript(
    ({ key, run }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(run));
    },
    { key: ADVENTURE_STORAGE, run },
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Adventure", exact: true }).click();
}
async function freeze(page: Page) {
  await page.clock.install({ time: new Date("2026-11-06T12:00:00Z") });
  await page.clock.pauseAt(new Date("2026-11-06T12:00:01Z"));
}
test("studio configures all four next-card changes and all seven environments, then saves, shares, and imports them", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.goto("/");
  await page.getByRole("button", { name: "Card studio", exact: true }).click();
  await page.getByLabel("Stone name").fill("Future Weaver");
  for (let i = 1; i <= 4; i++) {
    await page.getByRole("button", { name: /Add keyword/ }).click();
    await page
      .getByLabel(`Keyword ${i}`, { exact: true })
      .selectOption("next-play");
    await page
      .getByLabel(`Affected edge ${i}`, { exact: true })
      .selectOption(i % 2 === 0 ? "all" : "0");
    await page
      .getByLabel(`Pip change · Keyword ${i}`, { exact: true })
      .selectOption(i <= 2 ? "1" : "-1");
  }
  await page
    .getByLabel("Next player · Keyword 4", { exact: true })
    .selectOption("opponent");
  await page.getByRole("button", { name: /Add keyword/ }).click();
  await page
    .getByLabel("Keyword 5", { exact: true })
    .selectOption("environment");
  for (const [value, info] of Object.entries(ENVIRONMENTS)) {
    await page
      .getByLabel("Tile environment · Keyword 5", { exact: true })
      .selectOption(value);
    await expect(
      page.locator(".keyword-editor .keyword-details"),
    ).toContainText(info.name);
  }
  await page
    .getByLabel("Tile environment · Keyword 5", { exact: true })
    .selectOption("elemental");
  await page
    .getByLabel("Boosted element · Keyword 5", { exact: true })
    .selectOption("water");
  await page
    .getByLabel("Terrain sides · Keyword 5", { exact: true })
    .selectOption("1");
  await page
    .getByLabel("Terrain pips · Keyword 5", { exact: true })
    .selectOption("2");
  await page.setViewportSize({ width: 390, height: 1000 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Save to collection", exact: true })
    .click();
  await page.reload();
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page
    .getByRole("button", { name: "View Future Weaver", exact: true })
    .click();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export card file", exact: true })
    .click();
  const stream = await (await download).createReadStream(),
    chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const buffer = Buffer.concat(chunks),
    card = JSON.parse(buffer.toString()).card;
  expect(card.keywords).toEqual([
    { type: "next-play", side: 0, amount: 1, recipient: "self" },
    { type: "next-play", side: "all", amount: 1, recipient: "self" },
    { type: "next-play", side: 0, amount: -1, recipient: "self" },
    { type: "next-play", side: "all", amount: -1, recipient: "opponent" },
    {
      type: "environment",
      environment: { kind: "elemental", element: "water", side: 1, amount: 2 },
    },
  ]);
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.getByLabel("Import card file").setInputFiles({
    name: "weaver.skystone.json",
    mimeType: "application/json",
    buffer,
  });
  await expect(page.locator(".toast")).toContainText(
    "has joined your collection",
  );
});
test("normal local games show a chosen empty terrain tile and preserve pending effects through the opponent’s play", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const custom = [
    caster,
    ...STARTER_STONES.slice(1, 5).map((card, index) => ({
      ...card,
      id: `custom-receiver-${index}`,
      name: `Receiver ${index}`,
      edges: [1, 1, 1, 1],
      keywords: [],
      custom: true,
    })),
  ];
  await page.addInitScript(
    (library) =>
      localStorage.setItem("skystones-library-v1", JSON.stringify(library)),
    { custom, deck: custom.map((card) => card.id), boardSize: 3, sound: false },
  );
  await page.goto("/");
  await page.getByRole("button", { name: "New match", exact: true }).click();
  await page.getByRole("button", { name: /Bring a friend/ }).click();
  await page
    .getByRole("button", { name: "Find a little magic", exact: true })
    .click();
  await page
    .locator(".hand-card-button")
    .filter({ hasText: "Tile Weaver" })
    .click();
  await page.locator("#board-0").click();
  await expect(page.getByRole("dialog")).toContainText(
    "Environment: choose a tile",
  );
  await expect(page.locator(".target-cell.available")).toHaveCount(9);
  await page.getByRole("button", { name: "C3, empty", exact: true }).click();
  await expect(page.locator("#board-8 .tile-environment-mark")).toHaveAttribute(
    "aria-label",
    /Blight/,
  );
  await expect(page.locator(".next-play-status")).toContainText("+1 per side");
  await page.locator(".hand-card-button").first().click();
  await page.locator("#board-1").click();
  while (await page.locator(".target-cell.available").count())
    await page.locator(".target-cell.available").first().click();
  const receiver = page
    .locator(".hand-card-button")
    .filter({ hasText: "Receiver 0" });
  await expect(receiver.locator(".edge > b")).toHaveText(["2", "2", "2", "2"]);
  await receiver.click();
  await page.locator("#board-8").click();
  await expect(
    page.locator("#board-8 .capture-flip-back .edge > b"),
  ).toHaveText(["1", "1", "1", "1"]);
  await expect(page.locator(".next-play-status")).toHaveCount(0);
  await page.locator("#board-8").click();
  await expect(page.getByRole("dialog")).toContainText("Next Play received");
  await expect(page.getByRole("dialog")).toContainText("Blight");
});
test("a drafted character default can place terrain on its own tile and queue a future pip change", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const base = newDraft(3, 47, {}).cards[0],
    original = originalCharacter(base.portrait)!;
  const defaults = editedCharacterDefault(
    original.portrait!,
    {
      ...original,
      name: "Draft Weaver",
      edges: [0, 0, 0, 0],
      keywords: [
        { type: "next-play", side: 0, amount: 1, recipient: "self" },
        { type: "environment", environment: defaultEnvironment("war-banner") },
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
      draft.offered.find((id) => id === base.id) || draft.offered[0],
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
    while (await page.locator(".target-cell.available").count())
      await page.locator(".target-cell.available").first().click();
  }
  await page
    .locator(".hand-card-button")
    .filter({ hasText: "Draft Weaver" })
    .click();
  await page.locator("#board-4").click();
  await page
    .getByRole("button", { name: "B2, placing here", exact: true })
    .click();
  const played = page.locator("#board-4 .capture-flip-back");
  await expect(played.locator(".edge > b")).toHaveText(["0", "0", "0", "0"]);
  await expect(played.locator(".attack-pip")).toHaveCount(4);
  await expect(page.locator(".environment-legend")).toContainText(
    "B2 · War Banner",
  );
  await expect(page.locator(".next-play-status")).toContainText("+1 on North");
});
for (const size of [3, 4] as const)
  test(`${size}×${size} Adventure saves empty terrain and queued changes, uses them before captures, and spends them once`, async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const run = enterAdventureNode(newAdventure(size, 81), "moss"),
      last = size * size - 1;
    const source = {
      ...run.inventory[0],
      name: "Tile Weaver",
      edges: [0, 0, 0, 0] as [number, number, number, number],
      baseEdges: [0, 0, 0, 0] as [number, number, number, number],
      keywords: caster.keywords,
    };
    const receiver = {
      ...run.inventory[1],
      name: "Receiver",
      edges: [1, 1, 1, 1] as [number, number, number, number],
      baseEdges: [1, 1, 1, 1] as [number, number, number, number],
      keywords: [],
    };
    run.inventory[0] = source;
    run.inventory[1] = receiver;
    run.battle!.hands[0][0] = source;
    run.battle!.hands[0][1] = receiver;
    run.battle!.hands[1] = run.battle!.hands[1].map((card) => ({
      ...card,
      edges: [1, 1, 1, 1],
      keywords: [],
    }));
    await freeze(page);
    await openRun(page, run);
    await page.locator(".run-hand-card").first().click();
    await page.locator("#adventure-board-0").click();
    await expect(page.locator(".target-cell.available")).toHaveCount(
      size * size,
    );
    await page
      .getByRole("button", {
        name: `${coordinate(last, size)}, empty`,
        exact: true,
      })
      .click();
    const queued = await stored(page);
    expect(pendingPipEffects(queued.battle!.board, 0)).toHaveLength(1);
    await expect(
      page.locator(`#adventure-board-${last} .tile-environment-mark`),
    ).toBeVisible();
    await page.reload();
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    await expect(page.locator(".next-play-status")).toContainText(
      "Tile Weaver",
    );
    expect((await stored(page)).battle!.board).toEqual(queued.battle!.board);
    await page.clock.runFor(1000);
    await expect.poll(async () => (await stored(page)).battle!.turns).toBe(2);
    const hand = page.locator(".run-hand-card").filter({ hasText: "Receiver" });
    await expect(hand.locator(".edge > b")).toHaveText(["2", "2", "2", "2"]);
    await hand.click();
    await page.locator(`#adventure-board-${last}`).click();
    await expect(
      page.locator(`#adventure-board-${last} .capture-flip-back .edge > b`),
    ).toHaveText(["1", "1", "1", "1"]);
    await expect(page.locator(".next-play-status")).toHaveCount(0);
    const snapshot = (await stored(page)).battle!.board[last];
    await page.setViewportSize({ width: 390, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `/tmp/skystones-terrain-adventure-${size}-phone.png`,
      fullPage: true,
    });
    await page.reload();
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    expect((await stored(page)).battle!.board[last]).toEqual(snapshot);
  });
test("War Banner shows attack-only pips and a silenced Bastion occupant keeps its terrain defense pips", async ({
  page,
}) => {
  await freeze(page);
  for (const kind of ["war-banner", "bastion"] as const) {
    let run = enterAdventureNode(newAdventure(3, 81), "moss");
    const card = {
      ...run.inventory[0],
      edges: [1, 1, 1, 1] as [number, number, number, number],
      keywords: [
        { type: "environment" as const, environment: defaultEnvironment(kind) },
      ],
    };
    run.inventory[0] = card;
    run.battle!.hands[0][0] = card;
    run = playAdventureCard(run, 4, 0, [{ keywordIndex: 0, boardIndex: 4 }]);
    if (kind === "bastion") {
      run.battle!.hands[1][0] = {
        ...run.battle!.hands[1][0],
        keywords: [{ type: "silence" }],
      };
      run = playAdventureCard(run, 0, 0, [{ keywordIndex: 0, boardIndex: 4 }]);
      await page.evaluate(
        ({ key, run }) => localStorage.setItem(key, JSON.stringify(run)),
        { key: ADVENTURE_STORAGE, run },
      );
      await page.reload();
      await page
        .getByRole("button", { name: "Adventure", exact: true })
        .click();
    } else await openRun(page, run);
    const cardView = page.locator("#adventure-board-4 .capture-flip-back");
    await expect(
      cardView.locator(kind === "bastion" ? ".shield-pip" : ".attack-pip"),
    ).toHaveCount(4);
    await expect(cardView.locator(".edge > b")).toHaveText([
      "1",
      "1",
      "1",
      "1",
    ]);
    await page.locator("#adventure-board-4").click();
    await expect(page.getByRole("dialog")).toContainText(
      kind === "bastion" ? "defends 2" : "attacks 2",
    );
    await page
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
  }
});
test("directional damage follows the displayed side on Crosswind tiles", async ({
  page,
}) => {
  test.setTimeout(60_000);
  let run = enterAdventureNode(
    { ...newAdventure(3, 81), potions: ["shatter"] },
    "moss",
  );
  const caster = {
    ...run.inventory[0],
    edges: [0, 0, 0, 0] as [number, number, number, number],
    keywords: [
      {
        type: "environment" as const,
        environment: defaultEnvironment("crosswind"),
      },
    ],
  };
  const breaker = {
    ...run.inventory[1],
    name: "Wind Breaker",
    edges: [0, 0, 0, 0] as [number, number, number, number],
    keywords: [
      { type: "sunder" as const, side: 0 as const },
      { type: "sunder" as const, side: "any" as const },
    ],
  };
  run.inventory[0] = caster;
  run.inventory[1] = breaker;
  run.battle!.hands[0][0] = caster;
  run.battle!.hands[0][1] = breaker;
  run = playAdventureCard(run, 0, 0, [{ keywordIndex: 0, boardIndex: 4 }]);
  run.battle!.hands[1] = run.battle!.hands[1].map((card) => ({
    ...card,
    edges: [1, 1, 1, 1],
    keywords: [],
  }));
  run.battle!.hands[1][0] = { ...run.battle!.hands[1][0], edges: [0, 1, 4, 3] };
  run = playAdventureCard(run, 4, 0);
  await freeze(page);
  await openRun(page, run);
  await expect(
    page.locator("#adventure-board-4 .capture-flip-back .edge > b"),
  ).toHaveText(["3", "0", "1", "4"]);
  await page.locator(".run-hand-card").first().click();
  await page.locator("#adventure-board-1").click();
  await page.getByRole("button", { name: /^Target B2:/ }).click();
  await page.getByRole("button", { name: /^Target B2:/ }).click();
  await expect(
    page.getByRole("button", { name: "East: 0 → 0", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "North: 2 → 1", exact: true }).click();
  expect((await stored(page)).battle!.board[4]!.edges).toEqual([0, 1, 4, 1]);
  await expect(
    page.locator("#adventure-board-4 .capture-flip-back .edge > b"),
  ).toHaveText(["1", "0", "1", "4"]);
  await page.clock.runFor(1000);
  await expect.poll(async () => (await stored(page)).battle!.current).toBe(0);
  await page
    .getByRole("button", { name: "Use Shatter Flask", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /^Shatter B2/ })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Choose North edge", exact: true })
    .click();
  await expect(
    page.locator("#adventure-board-4 .capture-flip-back .edge > b"),
  ).toHaveText(["0", "0", "1", "4"]);
  const snapshot = (await stored(page)).battle!.board[4];
  await page.reload();
  await page.getByRole("button", { name: "Adventure", exact: true }).click();
  expect((await stored(page)).battle!.board[4]).toEqual(snapshot);
});
