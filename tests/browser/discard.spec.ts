import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { STARTER_STONES, handSize } from "../../src/game.ts";
import type { Stone, StoneKeyword } from "../../src/game.ts";
import { DEFAULT_TOKENS, LIBRARY_STORAGE } from "../../src/tokens.ts";
import {
  newAdventure,
  enterAdventureNode,
  ADVENTURE_STORAGE,
} from "../../src/adventure.ts";
import type { Adventure } from "../../src/adventure.ts";
import {
  newDraft,
  nominateDraftCards,
  pickDraftCard,
  DRAFT_STORAGE,
} from "../../src/draft.ts";
import {
  originalCharacter,
  editedCharacterDefault,
  CHARACTER_DEFAULTS_STORAGE,
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
const gift: Stone = {
  ...DEFAULT_TOKENS[2],
  id: "custom-token-gift-spark",
  name: "Gift Spark",
  edges: [0, 0, 0, 0],
  keywords: [
    { type: "discard-priority", priority: 9 },
    {
      type: "parting-gift",
      target: "discarder",
      shields: [{ side: 1, amount: 1 }],
    },
  ],
};
const recycler: StoneKeyword[] = [
  { type: "discard", mode: "chosen", recipient: "both", count: 2 },
  { type: "scavenge", from: "both", pips: [{ side: 0, amount: 1 }] },
  {
    type: "conjure",
    mode: "token",
    token: gift.id,
    count: 2,
    recipient: "both",
  },
];
async function stored(page: Page): Promise<Adventure> {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    ADVENTURE_STORAGE,
  );
}
async function selectGifts(page: Page, count: number) {
  const cards = page.getByRole("button", { name: /^Discard Gift Spark, card/ });
  await expect(cards).toHaveCount(count);
  for (let i = 0; i < count; i++) await cards.nth(i).click();
  await page
    .getByRole("button", { name: "Discard selected cards", exact: true })
    .click();
}
test("studio creates all discard abilities and Conjure-only gifts, then saves, exports, imports, and edits them", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.goto("/");
  await page.getByRole("button", { name: "Card studio", exact: true }).click();
  await page.getByLabel("Stone name").fill("Cycle Warden");
  for (const [i, type] of [
    "discard",
    "scavenge",
    "parting-gift",
    "discard-priority",
    "conjure",
  ].entries()) {
    await page.getByRole("button", { name: /^Add keyword/ }).click();
    await page
      .getByLabel(`Keyword ${i + 1}`, { exact: true })
      .selectOption(type);
  }
  await page
    .getByLabel("Discard selection · Keyword 1", { exact: true })
    .selectOption("chosen");
  await page
    .getByLabel("Discard from · Keyword 1", { exact: true })
    .selectOption("both");
  await page
    .getByLabel("Discard count · Keyword 1", { exact: true })
    .selectOption("2");
  await page
    .getByLabel("Scavenge from · Keyword 2", { exact: true })
    .selectOption("both");
  await page
    .getByLabel("Scavenge · Keyword 2 North pips", { exact: true })
    .selectOption("2");
  await page
    .getByLabel("Scavenge · Keyword 2 East shields", { exact: true })
    .selectOption("1");
  await page
    .getByLabel("Parting Gift recipients · Keyword 3", { exact: true })
    .selectOption("hand");
  await page
    .getByLabel("Parting Gift · Keyword 3 West pips", { exact: true })
    .selectOption("3");
  await page
    .getByLabel("Parting Gift · Keyword 3 North pips", { exact: true })
    .selectOption("0");
  await page
    .getByLabel("Discard priority · Keyword 4", { exact: true })
    .fill("9");
  await page
    .getByLabel("Card source · Keyword 5", { exact: true })
    .selectOption("token");
  await page
    .getByRole("button", {
      name: "Add Conjure keyword · Keyword 5",
      exact: true,
    })
    .click();
  await page
    .getByLabel("Keyword 5 grant 1", { exact: true })
    .selectOption("parting-gift");
  await page
    .getByLabel("Parting Gift recipients · Keyword 5 grant 1", { exact: true })
    .selectOption("discarder");
  await page
    .getByRole("button", {
      name: "Add Conjure keyword · Keyword 5",
      exact: true,
    })
    .click();
  await page
    .getByLabel("Keyword 5 grant 2", { exact: true })
    .selectOption("discard-priority");
  await page
    .getByLabel("Discard priority · Keyword 5 grant 2", { exact: true })
    .fill("7");
  await page.setViewportSize({ width: 390, height: 1000 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .locator(".keyword-editor")
    .screenshot({ path: "/tmp/skystones-discard-studio-phone.png" });
  await page
    .getByRole("button", { name: "Save to collection", exact: true })
    .click();
  await page.reload();
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page
    .getByRole("button", { name: "View Cycle Warden", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Conjure is resolved first",
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
  expect(payload.card.keywords.slice(0, 4)).toEqual([
    { type: "discard", mode: "chosen", recipient: "both", count: 2 },
    {
      type: "scavenge",
      from: "both",
      pips: [{ side: 0, amount: 2 }],
      shields: [{ side: 1, amount: 1 }],
    },
    { type: "parting-gift", target: "hand", pips: [{ side: 3, amount: 3 }] },
    { type: "discard-priority", priority: 9 },
  ]);
  expect(
    payload.card.keywords[4].keywords.map(
      (keyword: StoneKeyword) => keyword.type,
    ),
  ).toEqual(["parting-gift", "discard-priority"]);
  expect(payload.tokens).toHaveLength(1);
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page
    .getByLabel("Import card file")
    .setInputFiles({
      name: "cycle.skystone.json",
      mimeType: "application/json",
      buffer,
    });
  await expect(page.locator(".toast")).toContainText(
    "has joined your collection",
  );
  await page
    .getByRole("button", { name: "View Cycle Warden", exact: true })
    .last()
    .click();
  await page.getByRole("button", { name: "Edit stone", exact: true }).click();
  await expect(
    page.getByLabel("Discard priority · Keyword 4", { exact: true }),
  ).toHaveValue("9");
});

for (const size of [3, 4] as const) {
  test(`${size}×${size} normal chosen discards can select new Conjure cards in both hands and cancel the entire transaction`, async ({
    page,
  }) => {
    const custom: Stone[] = Array.from({ length: handSize(size) }, (_, i) => ({
      ...STARTER_STONES[i],
      id: `custom-cycle-${i}`,
      name: i ? `Filler ${i}` : "Cycle Warden",
      edges: [0, 0, 0, 0],
      keywords: i ? [] : recycler,
      custom: true,
    }));
    await page.addInitScript(
      (library) =>
        localStorage.setItem("skystones-library-v1", JSON.stringify(library)),
      {
        custom: [...custom, gift],
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
    const source = page.getByRole("button", { name: /^Select Cycle Warden,/ });
    await source.click();
    await page.locator("#board-0").click();
    await expect(page.getByRole("dialog")).toContainText("Keep");
    await expect(page.locator(".board-cell.filled")).toHaveCount(0);
    await page.setViewportSize({ width: 390, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const art = await page
      .locator(".discard-card-button .stone-art")
      .first()
      .boundingBox();
    expect(art!.height).toBeGreaterThan(100);
    const actions = await page
      .locator(".discard-picker .detail-actions")
      .boundingBox();
    const note = await page
      .locator(".discard-picker .dialog-small-note")
      .boundingBox();
    expect(note!.y).toBeGreaterThanOrEqual(actions!.y + actions!.height + 8);
    await page
      .getByRole("dialog")
      .screenshot({ path: `/tmp/skystones-discard-picker-${size}-phone.png` });
    await selectGifts(page, 2);
    await expect(page.getByRole("dialog")).toContainText("Player two");
    await page
      .getByRole("button", { name: "Cancel play", exact: true })
      .click();
    await expect(page.locator(".board-cell.filled")).toHaveCount(0);
    await expect(page.locator(".hand-card-button")).toHaveCount(handSize(size));
    if ((await source.getAttribute("aria-pressed")) !== "true")
      await source.click();
    await page.locator("#board-0").click();
    await selectGifts(page, 2);
    await selectGifts(page, 2);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator(".board-cell.filled")).toHaveCount(1);
    await expect(
      page.locator("#board-0 .capture-flip-back .edge > b"),
    ).toHaveText(["4", "0", "0", "0"]);
    await expect(
      page.locator("#board-0 .capture-flip-back .shield-pip"),
    ).toHaveText("+4");
    await expect(page.locator(".hand-card-button")).toHaveCount(handSize(size));
    await page.locator("#board-0").click();
    await expect(page.getByRole("dialog")).toContainText("Gift Spark");
    const library = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("skystones-library-v1")!),
    );
    expect(
      library.custom.find((card: Stone) => card.name === "Cycle Warden").edges,
    ).toEqual([0, 0, 0, 0]);
  });

  test(`${size}×${size} Adventure resolves ${size === 3 ? "random priority" : "chosen"} discards, saves hand gifts and board buffs, and preserves the pack`, async ({
    page,
  }) => {
    const token: Stone = {
      ...gift,
      keywords: [
        { type: "discard-priority", priority: 99 },
        {
          type: "parting-gift",
          target: "hand",
          pips: [{ side: 1, amount: 1 }],
          shields: [{ side: 2, amount: 1 }],
        },
      ],
    };
    const run = enterAdventureNode(newAdventure(size, 81), "moss");
    run.inventory[0] = {
      ...run.inventory[0],
      name: "Cycle Warden",
      edges: [0, 0, 0, 0],
      keywords: [
        {
          type: "discard",
          mode: size === 3 ? "random" : "chosen",
          recipient: "self",
          count: 1,
        },
        { type: "scavenge", from: "self", pips: [{ side: 0, amount: 2 }] },
        {
          type: "conjure",
          mode: "token",
          token: token.id,
          count: 1,
          recipient: "self",
        },
      ],
    };
    run.battle!.hands[0] = run.battle!.hands[0].map((card, i) =>
      i
        ? {
            ...card,
            name: `Gift Receiver ${i}`,
            edges: [1, 1, 1, 1],
            keywords: [],
          }
        : run.inventory[0],
    );
    run.battle!.hands[1] = run.battle!.hands[1].map((card) => ({
      ...card,
      edges: [1, 1, 1, 1],
      keywords: [],
    }));
    await page.clock.install({ time: new Date("2026-11-08T12:00:00Z") });
    await page.clock.pauseAt(new Date("2026-11-08T12:00:01Z"));
    await page.addInitScript(
      ({ key, run, token, libraryKey }) => {
        if (!localStorage.getItem(key))
          localStorage.setItem(key, JSON.stringify(run));
        localStorage.setItem(
          libraryKey,
          JSON.stringify({ custom: [token], deck: [], boardSize: 3 }),
        );
      },
      { key: ADVENTURE_STORAGE, run, token, libraryKey: LIBRARY_STORAGE },
    );
    await page.goto("/");
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    const before = await stored(page);
    await page.locator(".run-hand-card").first().click();
    await page.locator("#adventure-board-0").click();
    if (size === 4) {
      await expect(page.getByRole("dialog")).toContainText("Keep 7");
      await page
        .getByRole("button", { name: "Cancel play", exact: true })
        .click();
      expect(await stored(page)).toEqual(before);
      await page.locator("#adventure-board-0").click();
      await selectGifts(page, 1);
    }
    const gained = await stored(page),
      battle = gained.battle!;
    expect(
      battle.board[0]!.discards![0].cards.map((card) => card.name),
    ).toEqual(["Gift Spark"]);
    expect(battle.board[0]!.edges![0]).toBe(2);
    for (const card of battle.hands[0])
      expect(card.discardBuffs).toEqual({
        pips: [0, 1, 0, 0],
        shields: [0, 0, 1, 0],
      });
    expect(gained.inventory).toEqual(before.inventory);
    await page.reload();
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    expect((await stored(page)).battle).toEqual(battle);
    await page.clock.runFor(1000);
    await expect.poll(async () => (await stored(page)).battle!.current).toBe(0);
    const current = await stored(page),
      placement = current.battle!.board.findIndex((cell) => !cell);
    const receiver = page.locator(".run-hand-card").first();
    await expect(receiver.locator(".edge > b")).toHaveText([
      "1",
      "2",
      "1",
      "1",
    ]);
    await expect(receiver.locator(".shield-pip")).toHaveCount(1);
    await receiver.click();
    await page.locator(`#adventure-board-${placement}`).click();
    const played = await stored(page);
    expect(played.battle!.board[placement]!.edges).toEqual([1, 2, 1, 1]);
    expect(played.inventory).toEqual(before.inventory);
    await page.reload();
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    expect((await stored(page)).battle).toEqual(played.battle);
    await page.locator(`#adventure-board-${placement}`).click();
    await expect(page.getByRole("dialog")).toContainText("Hand gift bonuses");
  });
}

test("4×4 unsafe discards are skipped with no buffs, even when protected cards have priority", async ({
  page,
}) => {
  const custom: Stone[] = Array.from({ length: 8 }, (_, i) => ({
    ...STARTER_STONES[i],
    id: `custom-protected-${i}`,
    name: i ? `Protected ${i}` : "Protected Warden",
    edges: [0, 0, 0, 0],
    custom: true,
    keywords: i
      ? [{ type: "discard-priority", priority: 9 }]
      : [
          { type: "discard", mode: "random", recipient: "both", count: 5 },
          { type: "scavenge", from: "both", pips: [{ side: 0, amount: 5 }] },
        ],
  }));
  await page.addInitScript(
    (library) =>
      localStorage.setItem("skystones-library-v1", JSON.stringify(library)),
    { custom, deck: custom.map((card) => card.id), boardSize: 4, sound: false },
  );
  await page.goto("/");
  await page.getByRole("button", { name: "New match", exact: true }).click();
  await page.getByRole("button", { name: /Bring a friend/ }).click();
  await page
    .getByRole("button", { name: "Find a little magic", exact: true })
    .click();
  await page.getByRole("button", { name: /^Select Protected Warden,/ }).click();
  await page.locator("#board-0").click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".hand-card-button")).toHaveCount(8);
  await expect(
    page.locator("#board-0 .capture-flip-back .edge > b"),
  ).toHaveText(["0", "0", "0", "0"]);
  await page.locator("#board-0").click();
  await expect(page.getByRole("dialog")).toContainText(
    "protected to finish the board",
  );
});

test("a drafted character can Conjure, discard and Scavenge without changing the saved draft pool", async ({
  page,
}) => {
  const base = newDraft(3, 47, {}).cards[0],
    original = originalCharacter(base.portrait)!;
  const defaults = editedCharacterDefault(
    original.portrait!,
    {
      ...original,
      name: "Draft Recycler",
      edges: [0, 0, 0, 0],
      keywords: [
        { type: "conjure", mode: "random", count: 2, recipient: "self" },
        { type: "discard", mode: "chosen", recipient: "self", count: 1 },
        { type: "scavenge", from: "self", pips: [{ side: 3, amount: 2 }] },
      ],
    },
    {},
  );
  let draft = newDraft(3, 47, defaults, true, true, true, true, false);
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
    while (await page.locator(".target-cell.available").count())
      await page.locator(".target-cell.available").first().click();
  }
  await page.getByRole("button", { name: /^Select Draft Recycler,/ }).click();
  await page.locator("#board-4").click();
  await expect(page.locator(".discard-picker")).toBeVisible();
  await page.locator(".discard-card-button").first().click();
  await page
    .getByRole("button", { name: "Discard selected cards", exact: true })
    .click();
  await expect(
    page.locator("#board-4 .capture-flip-back .edge > b"),
  ).toHaveText(["0", "0", "0", "2"]);
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      DRAFT_STORAGE,
    ),
  ).toEqual(JSON.parse(JSON.stringify(draft)));
});
