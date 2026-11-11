import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { STARTER_STONES, handSize } from "../../src/game.ts";
import type { Stone } from "../../src/game.ts";
import { DEFAULT_SPELLS } from "../../src/spellCards.ts";
import {
  newAdventure,
  enterAdventureNode,
  ADVENTURE_STORAGE,
  validateAdventure,
} from "../../src/adventure.ts";

if (process.env.SKYSTONES_STANDALONE === "1") {
  const html = readFileSync("standalone/Skystones.html", "utf8");
  test.beforeEach(async ({ page }) => {
    const unexpected: string[] = [];
    (page as Page & { unexpected: string[] }).unexpected = unexpected;
    await page.route("**/*", (route) => {
      if (route.request().url() === "http://127.0.0.1:5173/")
        return route.fulfill({
          status: 200,
          contentType: "text/html",
          body: html,
        });
      unexpected.push(route.request().url());
      return route.abort();
    });
  });
  test.afterEach(({ page }) =>
    expect((page as Page & { unexpected: string[] }).unexpected).toEqual([]),
  );
}
test.beforeEach(({ page }) =>
  page.on("pageerror", (error) => {
    throw error;
  }),
);

const spark = DEFAULT_SPELLS.find((card) => card.name === "Stored Spark")!;
const broken = DEFAULT_SPELLS.find((card) => card.name === "Broken Portal")!;
const custom = Array.from(
  { length: 5 },
  (_, i): Stone => ({
    ...STARTER_STONES[0],
    id: `custom-spell-test-${i}`,
    name:
      i === 0
        ? "Spell Conjurer"
        : i === 1
          ? "Spell Discarder"
          : `Spell Friend ${i}`,
    custom: true,
    edges: [1, 1, 1, 1],
    keywords:
      i === 0
        ? [
            { type: "flash" },
            {
              type: "conjure",
              mode: "token",
              token: spark.id,
              count: 1,
              recipient: "self",
            },
            {
              type: "conjure",
              mode: "token",
              token: broken.id,
              count: 1,
              recipient: "self",
            },
          ]
        : i === 1
          ? [
              { type: "flash" },
              { type: "discard", mode: "chosen", count: 1, recipient: "self" },
            ]
          : [],
  }),
);

test("studio saves a discard-only spell, lists it under Spells, and configures specified and random spell Conjure", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Card studio", exact: true }).click();
  await page.getByLabel("Card type", { exact: true }).selectOption("discard");
  await page.getByLabel("Stone name").fill("Discard Burst");
  await expect(
    page.getByRole("button", { name: "Increase north strength", exact: true }),
  ).toBeHidden();
  await expect(page.locator(".studio-preview .edge")).toHaveCount(0);
  await page.getByRole("button", { name: /^Add keyword/ }).click();
  await page.getByLabel("Keyword 1", { exact: true }).selectOption("next-play");
  await page.getByLabel("Card type", { exact: true }).selectOption("cast");
  await expect(page.getByLabel("Keyword 1", { exact: true })).toHaveValue(
    "next-play",
  );
  await page.getByLabel("Card type", { exact: true }).selectOption("discard");
  await page.getByRole("button", { name: "Save spell", exact: true }).click();
  await expect(page.locator(".toast")).toContainText("Discard Burst");
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("skystones-library-v1")!).custom.find(
      (card: Stone) => card.name === "Discard Burst",
    ),
  );
  expect(saved.spell).toBe("discard");
  expect(saved.token).toBe(true);
  expect(saved.edges).toEqual([0, 0, 0, 0]);
  await page
    .getByRole("button", { name: "Back to collection", exact: true })
    .click();
  await page.getByRole("button", { name: /^Spells\s*\d+/ }).click();
  await expect(
    page.getByRole("button", { name: "View Discard Burst", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Add Discard Burst to deck",
      exact: true,
    }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Create a spell", exact: true })
    .click();
  await page.getByLabel("Card type", { exact: true }).selectOption("stone");
  await page.getByLabel("Stone name").fill("Spell Caller");
  await page.getByRole("button", { name: /^Add keyword/ }).click();
  await page.getByLabel("Keyword 1", { exact: true }).selectOption("conjure");
  await page.getByLabel("Card source · Keyword 1").selectOption("token");
  await page.getByLabel("Specified token · Keyword 1").selectOption(saved.id);
  await page
    .getByRole("button", { name: "Save to collection", exact: true })
    .click();
  await page.getByLabel("Card source · Keyword 1").selectOption("random");
  await page.getByLabel("Random pool · Keyword 1").selectOption("spells");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  const caller = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("skystones-library-v1")!).custom.find(
      (card: Stone) => card.name === "Spell Caller",
    ),
  );
  expect(caller.keywords[0].pool).toBe("spells");
});

test("normal local match conjures spells, casts without a tile or turn cost, then resolves a chosen discard-only spell", async ({
  page,
}) => {
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
  await page.getByRole("button", { name: /^Select Spell Conjurer,/ }).click();
  await page.locator("#board-0").click();
  const stored = page.getByRole("button", { name: /^Select Stored Spark,/ });
  const discardOnly = page.getByRole("button", {
    name: /^Select Broken Portal,/,
  });
  await expect(stored).toBeEnabled();
  await expect(stored.locator(".edge")).toHaveCount(0);
  await expect(discardOnly).toBeDisabled();
  await expect(discardOnly).toContainText("DISCARD ONLY");
  await stored.click();
  await expect(stored).toHaveCount(0);
  await expect(page.locator(".board-cell.filled")).toHaveCount(1);
  await expect(page.locator(".next-play-status")).toContainText("+1");
  await page.getByRole("button", { name: /^Select Spell Discarder,/ }).click();
  await page.locator("#board-1").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Broken Portal/ })
    .click();
  await page
    .getByRole("button", { name: "Discard selected cards", exact: true })
    .click();
  await expect(discardOnly).toHaveCount(0);
  await expect(page.locator(".board-cell.filled")).toHaveCount(2);
  await expect(page.locator("#board-1")).toHaveAttribute(
    "aria-label",
    /edges north 2, east 2, south 2, west 2/,
  );
  await expect(page.locator(".hand-card-button")).toHaveCount(5);
});

test("targeted spells support cancel, choose an edge, and leave tile ownership and turn unchanged", async ({
  page,
}) => {
  let run = enterAdventureNode(newAdventure(3, 81), "moss");
  const fracture: Stone = {
    ...DEFAULT_SPELLS[0],
    id: "custom-conjured-fracture",
    conjured: true,
  };
  run = {
    ...run,
    battle: {
      ...run.battle!,
      board: run.battle!.board.map((cell, i) =>
        i === 4
          ? {
              stone: {
                ...run.battle!.hands[1][0],
                edges: [3, 3, 3, 3],
                keywords: [],
              },
              owner: 1,
            }
          : cell,
      ),
      hands: [[fracture, ...run.battle!.hands[0]], run.battle!.hands[1]],
    },
  };
  await page.addInitScript(
    ({ key, run }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(run));
    },
    { key: ADVENTURE_STORAGE, run },
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Adventure", exact: true }).click();
  const read = () =>
    page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      ADVENTURE_STORAGE,
    );
  const before = await read();
  await page
    .getByRole("button", { name: /^Select Fracture, adventure card/ })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Sunder");
  await page.getByRole("button", { name: "Cancel play", exact: true }).click();
  expect(await read()).toEqual(before);
  await page
    .getByRole("button", { name: /^Select Fracture, adventure card/ })
    .click();
  await page.getByRole("button", { name: /^Target B2:/ }).click();
  await page.getByRole("button", { name: "North: 3 → 1", exact: true }).click();
  const after = await read();
  expect(after.battle.board[4].edges).toEqual([1, 3, 3, 3]);
  expect(after.battle.board[4].owner).toBe(1);
  expect(after.battle.board.filter(Boolean)).toHaveLength(1);
  expect(after.battle.current).toBe(0);
  expect(after.battle.hands[0].some((card: Stone) => card.spell)).toBe(false);
});

for (const size of [3, 4] as const)
  test(`${size}×${size} Adventure casts, reloads its queued effect, and triggers a discard-only spell`, async ({
    page,
  }) => {
    let run = enterAdventureNode(newAdventure(size, 81), "moss");
    run = {
      ...run,
      battle: {
        ...run.battle!,
        hands: [
          [
            { ...spark, id: "custom-conjured-spark", conjured: true },
            { ...broken, id: "custom-conjured-broken", conjured: true },
            ...run.battle!.hands[0].map(
              (card, i): Stone => ({
                ...card,
                edges: [1, 1, 1, 1],
                keywords:
                  i === 0
                    ? [
                        { type: "flash" },
                        {
                          type: "discard",
                          mode: "chosen",
                          count: 1,
                          recipient: "self",
                        },
                      ]
                    : [],
              }),
            ),
          ],
          run.battle!.hands[1],
        ],
      },
    };
    expect(validateAdventure(run)).toBe(true);
    await page.addInitScript(
      ({ key, run }) => {
        if (!localStorage.getItem(key))
          localStorage.setItem(key, JSON.stringify(run));
      },
      { key: ADVENTURE_STORAGE, run },
    );
    await page.goto("/");
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    await page
      .getByRole("button", { name: /^Select Stored Spark, adventure card/ })
      .click();
    const read = () =>
      page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)!),
        ADVENTURE_STORAGE,
      );
    let state = await read();
    expect(state.battle.current).toBe(0);
    expect(state.battle.board.filter(Boolean)).toHaveLength(0);
    expect(state.battle.spellHistory).toHaveLength(1);
    await page.reload();
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    await expect(
      page.getByRole("button", {
        name: /^Select Broken Portal, adventure card/,
      }),
    ).toBeDisabled();
    const first = run.battle!.hands[0][2];
    await page
      .getByRole("button", {
        name: `Select ${first.name}, adventure card 2`,
        exact: true,
      })
      .click();
    await page.locator("#adventure-board-0").click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /Broken Portal/ })
      .click();
    await page
      .getByRole("button", { name: "Discard selected cards", exact: true })
      .click();
    state = await read();
    expect(state.battle.current).toBe(0);
    expect(state.battle.board.filter(Boolean)).toHaveLength(1);
    expect(state.battle.board[0].edges).toEqual([2, 2, 2, 2]);
    expect(state.battle.hands[0]).toHaveLength(handSize(size) + 1);
    expect(state.battle.spellHistory).toHaveLength(2);
    expect(validateAdventure(state)).toBe(true);
    await page.setViewportSize({ width: 390, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page
      .locator(".run-hand")
      .screenshot({ path: `/tmp/skystones-spells-${size}.png` });
  });
