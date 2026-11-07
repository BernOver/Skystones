import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { DEFAULT_TOKENS, LIBRARY_STORAGE } from "../../src/tokens.ts";
import { STARTER_STONES, DEFAULT_DECK, handSize } from "../../src/game.ts";
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
const ember: Stone = {
  ...DEFAULT_TOKENS[2],
  id: "custom-token-little-ember",
  name: "Little Ember",
  edges: [1, 0, 1, 0],
  keywords: [{ type: "shield", side: 0, amount: 2 }],
};
const caller: Stone = {
  ...STARTER_STONES[0],
  id: "custom-token-caller",
  name: "Token Caller",
  edges: [0, 0, 0, 0],
  custom: true,
  keywords: [
    {
      type: "conjure",
      mode: "token",
      token: ember.id,
      count: 2,
      recipient: "both",
    },
  ],
};
async function stored(page: Page): Promise<Adventure> {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    ADVENTURE_STORAGE,
  );
}
async function collection(page: Page) {
  await page.getByRole("button", { name: /^Collection/ }).click();
}
async function tokensTab(page: Page) {
  await collection(page);
  await page.getByRole("button", { name: /^Tokens/ }).click();
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

test("create a Conjure-only token, keep it out of decks, and share its definition with a Conjure card", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto("/");
  await tokensTab(page);
  await expect(page.locator(".collection-item")).toHaveCount(6);
  await expect(page.locator(".deck-toggle")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Create a token", exact: true })
    .click();
  await expect(
    page.getByLabel("Token only · available through Conjure", { exact: true }),
  ).toBeChecked();
  await page.getByLabel("Stone name").fill("Little Ember");
  await page.getByRole("button", { name: /Add keyword/ }).click();
  await page.getByLabel("Keyword 1", { exact: true }).selectOption("shield");
  await page.getByLabel("Shield pips 1", { exact: true }).fill("2");
  await page
    .getByRole("button", { name: "Save token template", exact: true })
    .click();
  const token: Stone = await page.evaluate(
    (key) =>
      JSON.parse(localStorage.getItem(key)!).custom.find(
        (card: Stone) => card.token && card.name === "Little Ember",
      ),
    LIBRARY_STORAGE,
  );
  expect(token.id).toMatch(/^custom-token-/);
  await tokensTab(page);
  await page
    .getByRole("button", { name: "View Little Ember", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Add to deck", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Edit stone", exact: true }).click();
  await expect(
    page.getByLabel("Token only · available through Conjure", { exact: true }),
  ).toBeDisabled();
  await collection(page);
  await page.getByRole("button", { name: /^All stones/ }).click();
  await page
    .getByRole("button", { name: "Create a stone", exact: true })
    .click();
  await page.getByLabel("Stone name").fill("Token Caller");
  await page.getByRole("button", { name: /Add keyword/ }).click();
  await page.getByLabel("Keyword 1", { exact: true }).selectOption("conjure");
  await page
    .getByLabel("Card source · Keyword 1", { exact: true })
    .selectOption("token");
  await page
    .getByLabel("Specified token · Keyword 1", { exact: true })
    .selectOption(token.id);
  await page
    .getByLabel("Cards added · Keyword 1", { exact: true })
    .selectOption("2");
  await expect(page.locator(".preview-card .keyword-conjure")).toHaveText(
    "Conjure 2 Little Ember · Token",
  );
  await page
    .getByRole("button", { name: "Save to collection", exact: true })
    .click();
  await collection(page);
  await page
    .getByRole("button", { name: "View Token Caller", exact: true })
    .click();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export card file", exact: true })
    .click();
  const stream = await (await download).createReadStream(),
    chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const buffer = Buffer.concat(chunks),
    bundle = JSON.parse(buffer.toString());
  expect(bundle.tokens).toEqual([token]);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await collection(page);
  await page
    .getByLabel("Import card file")
    .setInputFiles({
      name: "caller-and-token.skystone.json",
      mimeType: "application/json",
      buffer,
    });
  await expect(page.locator(".toast")).toContainText(
    "has joined your collection",
  );
  const imported = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    LIBRARY_STORAGE,
  );
  expect(imported.custom.find((card: Stone) => card.id === token.id)).toEqual(
    token,
  );
  await tokensTab(page);
  await page
    .getByRole("button", { name: "View Little Ember", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Add to deck", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 1000 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "/tmp/skystones-token-collection-phone.png",
    fullPage: true,
  });
});

test("starter token templates can be edited and restored, and random Conjure pools are explicit", async ({
  page,
}) => {
  await page.goto("/");
  await tokensTab(page);
  await page
    .getByRole("button", { name: "View Fire Spark", exact: true })
    .click();
  await page.getByRole("button", { name: "Edit stone", exact: true }).click();
  await page.getByLabel("Stone name").fill("My Fire Spark");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await collection(page);
  await page
    .getByRole("button", { name: "View My Fire Spark", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Restore token default", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("heading", { name: "Fire Spark", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.getByRole("button", { name: "Card studio", exact: true }).click();
  await page.getByRole("button", { name: /Add keyword/ }).click();
  await page.getByLabel("Keyword 1", { exact: true }).selectOption("conjure");
  await page
    .getByLabel("Card source · Keyword 1", { exact: true })
    .selectOption("random");
  await expect(
    page.getByLabel("Random pool · Keyword 1", { exact: true }),
  ).toHaveValue("cards");
  await page
    .getByLabel("Random pool · Keyword 1", { exact: true })
    .selectOption("tokens");
  await page
    .getByLabel("Random element · Keyword 1", { exact: true })
    .selectOption("fire");
  await page
    .getByLabel("Random tribe · Keyword 1", { exact: true })
    .selectOption("giants");
  await expect(page.locator(".preview-card .keyword-conjure")).toHaveText(
    "Conjure 1 Random Fire Giants tokens",
  );
  await page
    .getByLabel("Random pool · Keyword 1", { exact: true })
    .selectOption("all");
  await expect(page.locator(".preview-card .keyword-conjure")).toContainText(
    "cards/tokens",
  );
});

test("a token ID injected into a saved starting deck is removed instead of becoming playable", async ({
  page,
}) => {
  await page.addInitScript(
    (library) =>
      localStorage.setItem("skystones-library-v1", JSON.stringify(library)),
    {
      custom: [ember],
      deck: [ember.id, ...DEFAULT_DECK.slice(1)],
      boardSize: 3,
      sound: false,
    },
  );
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: /^Select Little Ember,/ }),
  ).toHaveCount(0);
  await expect(page.locator(".hand-card-button")).toHaveCount(5);
  await collection(page);
  await expect(page.locator(".deck-count")).toContainText("4 / 5");
  await page.getByRole("button", { name: /^Tokens/ }).click();
  await expect(page.locator(".deck-toggle")).toHaveCount(0);
  await page.getByLabel("Deck board size", { exact: true }).selectOption("4");
  const library = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    LIBRARY_STORAGE,
  );
  expect(library.deck).not.toContain(ember.id);
});

for (const size of [3, 4] as BoardSize[]) {
  test(`${size}×${size} normal games generate custom tokens for both hands and let each player place them`, async ({
    page,
  }) => {
    const custom = [
      caller,
      ember,
      ...Array.from({ length: handSize(size) - 1 }, (_, i) => ({
        ...STARTER_STONES[0],
        id: `custom-fill-${i}`,
        name: `Filler ${i}`,
        edges: [1, 1, 1, 1],
        keywords: [],
        custom: true,
      })),
    ];
    await page.addInitScript(
      (library) =>
        localStorage.setItem("skystones-library-v1", JSON.stringify(library)),
      {
        custom,
        deck: custom.filter((card) => !card.token).map((card) => card.id),
        boardSize: size,
        sound: false,
      },
    );
    await page.goto("/");
    await expect(
      page.getByRole("button", { name: /^Select Little Ember,/ }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "New match", exact: true }).click();
    await page.getByRole("button", { name: /Bring a friend/ }).click();
    await page
      .getByRole("button", { name: "Find a little magic", exact: true })
      .click();
    await page.getByRole("button", { name: /^Select Token Caller,/ }).click();
    await page.locator("#board-0").click();
    await expect(
      page.getByRole("button", { name: /^Select Little Ember,/ }),
    ).toHaveCount(2);
    await page
      .getByRole("button", { name: /^Select Little Ember,/ })
      .first()
      .click();
    await page.locator(`#board-${size * size - 1}`).click();
    await expect(
      page.getByRole("button", { name: /^Select Little Ember,/ }),
    ).toHaveCount(2);
    await page
      .getByRole("button", { name: /^Select Little Ember,/ })
      .first()
      .click();
    await page.locator("#board-1").click();
    await expect(
      page.locator("#board-1 .capture-flip-back .edge > b"),
    ).toHaveText(ember.edges.map(String));
    await page.locator("#board-1").click();
    await expect(page.getByRole("dialog")).toContainText(
      "Token · available only through Conjure.",
    );
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
    await page.screenshot({
      path: `/tmp/skystones-token-normal-${size}-phone.png`,
      fullPage: true,
    });
  });

  test(`${size}×${size} Adventure saves token copies, triggers their keywords only on play, and isolates existing copies from template edits`, async ({
    page,
  }) => {
    const template: Stone = {
      ...ember,
      keywords: [
        ...ember.keywords!,
        {
          type: "conjure",
          mode: "token",
          token: DEFAULT_TOKENS[5].id,
          count: 1,
          recipient: "self",
        },
      ],
    };
    const run = enterAdventureNode(newAdventure(size, 81), "moss");
    run.inventory[0] = {
      ...run.inventory[0],
      name: caller.name,
      edges: caller.edges,
      keywords: caller.keywords,
    };
    run.battle!.hands[0][0] = run.inventory[0];
    const inventory = JSON.parse(JSON.stringify(run.inventory));
    await page.clock.install({ time: new Date("2026-11-07T12:00:00Z") });
    await page.clock.pauseAt(new Date("2026-11-07T12:00:01Z"));
    await page.addInitScript(
      ({ key, run, libraryKey, template }) => {
        if (!localStorage.getItem(key))
          localStorage.setItem(key, JSON.stringify(run));
        if (!localStorage.getItem(libraryKey))
          localStorage.setItem(
            libraryKey,
            JSON.stringify({ custom: [template], deck: [], boardSize: 3 }),
          );
      },
      { key: ADVENTURE_STORAGE, run, libraryKey: LIBRARY_STORAGE, template },
    );
    await page.goto("/");
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    await page.locator(".run-hand-card").first().click();
    await page.locator("#adventure-board-0").click();
    const gained = (await stored(page)).battle!;
    expect(
      gained.hands.map((hand) => hand.filter((card) => card.token).length),
    ).toEqual([2, 2]);
    expect(gained.hands.flat().some((card) => card.name === "Magic Echo")).toBe(
      false,
    );
    await page.reload();
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    expect((await stored(page)).battle).toEqual(gained);
    await page.clock.runFor(1000);
    await expect.poll(async () => (await stored(page)).battle!.current).toBe(0);
    const before = (await stored(page)).battle!,
      index = before.hands[0].findIndex((card) => card.token);
    await page.locator(".run-hand-card").nth(index).click();
    await page.locator(`#adventure-board-${size * size - 1}`).click();
    const played = (await stored(page)).battle!;
    expect(played.hands[0]).toHaveLength(before.hands[0].length);
    expect(
      played.hands[0].filter((card) => card.name === "Magic Echo"),
    ).toHaveLength(1);
    expect((await stored(page)).inventory).toEqual(inventory);
    await page.evaluate((key) => {
      const library = JSON.parse(localStorage.getItem(key)!);
      library.custom[0] = {
        ...library.custom[0],
        name: "Future Ember",
        edges: [0, 0, 0, 0],
      };
      localStorage.setItem(key, JSON.stringify(library));
    }, LIBRARY_STORAGE);
    await page.reload();
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    expect((await stored(page)).battle).toEqual(played);
    await expect(
      page.locator(
        `#adventure-board-${size * size - 1} .capture-flip-back .edge > b`,
      ),
    ).toHaveText(ember.edges.map(String));
  });
}

test("Draft picks remain normal cards while a drafted Conjure effect generates a token", async ({
  page,
}) => {
  const base = newDraft(3, 47, {}).cards[0],
    original = originalCharacter(base.portrait)!;
  const defaults = editedCharacterDefault(
    original.portrait!,
    {
      ...original,
      name: "Draft Token Caller",
      edges: [0, 0, 0, 0],
      keywords: [
        {
          type: "conjure",
          mode: "token",
          token: DEFAULT_TOKENS[2].id,
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
  expect(draft.cards.every((card) => !card.token)).toBe(true);
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
  await page
    .getByRole("button", { name: /^Select Draft Token Caller,/ })
    .click();
  await page.locator("#board-4").click();
  await expect(
    page.getByRole("button", { name: /^Select Fire Spark,/ }),
  ).toHaveCount(2);
  await page
    .getByRole("button", { name: /^Select Fire Spark,/ })
    .first()
    .click();
  await page.locator("#board-8").click();
  await expect(
    page.locator("#board-8 .capture-flip-back .stone-caption"),
  ).toContainText("Fire Spark");
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      DRAFT_STORAGE,
    ),
  ).toEqual(JSON.parse(JSON.stringify(draft)));
});
