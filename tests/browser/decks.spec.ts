import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { STARTER_STONES } from "../../src/game.ts";
import type { Stone } from "../../src/game.ts";
import type { DeckState } from "../../src/decks.ts";

const KEY = "skystones-library-v1";
const custom: Stone[] = Array.from({ length: 10 }, (_, i) => ({
  ...STARTER_STONES[i],
  id: `custom-deck-stone-${i + 1}`,
  name: `Deck Stone ${i + 1}`,
  custom: true,
  edges: [1, i % 2, 0, 1],
  keywords: [],
}));
type Library = DeckState & { custom: Stone[] };
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
async function setup(page: Page) {
  await page.addInitScript(
    ({ key, custom }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(
          key,
          JSON.stringify({
            custom,
            deck: custom.slice(0, 5).map((card) => card.id),
            boardSize: 3,
            sound: false,
          }),
        );
    },
    { key: KEY, custom },
  );
  await page.goto("/");
  await collection(page);
}
async function collection(page: Page) {
  await page.getByRole("button", { name: /^Collection/ }).click();
}
async function stored(page: Page): Promise<Library> {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), KEY);
}
async function nameAction(
  page: Page,
  action: "New deck" | "Duplicate deck" | "Rename deck",
  name: string,
  size?: 3 | 4,
) {
  const title = action === "New deck" ? "Create a deck" : action;
  await page.getByRole("button", { name: action, exact: true }).click();
  const dialog = page.getByRole("dialog", { name: title, exact: true });
  await dialog.getByLabel("Deck name", { exact: true }).fill(name);
  if (size)
    await dialog.getByLabel("New deck board size").selectOption(String(size));
  await dialog.getByRole("button", { name: title, exact: true }).click();
  await expect(dialog).toHaveCount(0);
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

test("migrate the current deck, duplicate and edit independent slots, rename them, reload, and start the exact selected hand", async ({
  page,
}) => {
  await setup(page);
  await expect(
    page.getByLabel("Saved deck", { exact: true }).locator("option:checked"),
  ).toHaveText("My deck · 3×3 · 5/5 cards");
  await nameAction(page, "Duplicate deck", "Fire team");
  const original = (await stored(page)).decks[0];
  await page
    .locator(".deck-slots")
    .getByRole("button", { name: "Remove Deck Stone 1 from deck", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Add Deck Stone 6 to deck", exact: true })
    .click();
  const edited = await stored(page),
    second = edited.decks.find((deck) => deck.id === edited.activeDeckId)!;
  expect(edited.decks[0].cards).toEqual(original.cards);
  expect(second.cards).toEqual(custom.slice(1, 6).map((card) => card.id));
  await page
    .getByLabel("Saved deck", { exact: true })
    .selectOption(original.id);
  await expect(
    page.locator(".deck-slots").getByRole("button", {
      name: "Remove Deck Stone 1 from deck",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByLabel("Saved deck", { exact: true }).selectOption(second.id);
  await nameAction(page, "Rename deck", "Fire friends");
  await page.reload();
  await collection(page);
  await expect(page.getByLabel("Saved deck", { exact: true })).toHaveValue(
    second.id,
  );
  await expect(
    page.getByLabel("Saved deck", { exact: true }).locator("option:checked"),
  ).toContainText("Fire friends");
  expect((await stored(page)).deck).toEqual(second.cards);
  await page.getByRole("button", { name: "The table", exact: true }).click();
  await page.getByRole("button", { name: "New match", exact: true }).click();
  await expect(page.getByLabel("Match deck")).toHaveValue(second.id);
  await page.getByRole("button", { name: /Bring a friend/ }).click();
  await page
    .getByRole("button", { name: "Find a little magic", exact: true })
    .click();
  await expect(page.locator(".hand-card-button .stone-caption")).toHaveText(
    custom.slice(1, 6).map((card) => card.name),
  );
  await page.locator(".hand-card-button").first().click();
  await page.locator("#board-0").click();
  await targets(page);
  await expect(
    page.locator("#board-0 .capture-flip-back .stone-caption"),
  ).toHaveText("Deck Stone 2");
});

test("new empty decks save for either size, incomplete hands cannot start, and board switches recall the last eight-card deck", async ({
  page,
}) => {
  await setup(page);
  await nameAction(page, "New deck", "Big idea", 4);
  const empty = await stored(page),
    original = empty.decks[0],
    big = empty.activeDeckId;
  expect(empty.deck).toEqual([]);
  await expect(page.locator(".deck-count")).toContainText("0 / 8");
  await expect(page.locator(".deck-play")).toBeDisabled();
  await page.getByRole("button", { name: "The table", exact: true }).click();
  await expect(page.locator(".board-cell")).toHaveCount(9);
  await expect(page.locator(".hand-card-button .stone-caption")).toHaveText(
    custom.slice(0, 5).map((card) => card.name),
  );
  await page.getByRole("button", { name: "New match", exact: true }).click();
  await expect(page.getByLabel("Board size", { exact: true })).toHaveValue("4");
  await expect(
    page.getByRole("button", { name: "Find a little magic", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Match deck").selectOption(original.id);
  await expect(
    page.getByRole("button", { name: "Find a little magic", exact: true }),
  ).toBeEnabled();
  await page.getByLabel("Match deck").selectOption(big);
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await collection(page);
  for (const card of custom.slice(0, 8))
    await page
      .getByRole("button", { name: `Add ${card.name} to deck`, exact: true })
      .click();
  await nameAction(page, "Duplicate deck", "Large alternate");
  await page
    .locator(".deck-slots")
    .getByRole("button", { name: "Remove Deck Stone 1 from deck", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Add Deck Stone 9 to deck", exact: true })
    .click();
  const edited = await stored(page),
    alternate = edited.activeDeckId,
    cards = [...edited.deck];
  await page.getByLabel("Deck board size", { exact: true }).selectOption("3");
  await expect(page.getByLabel("Saved deck", { exact: true })).toHaveValue(
    original.id,
  );
  await page.getByLabel("Deck board size", { exact: true }).selectOption("4");
  await expect(page.getByLabel("Saved deck", { exact: true })).toHaveValue(
    alternate,
  );
  expect((await stored(page)).deck).toEqual(cards);
  expect(
    (await stored(page)).decks.find((deck) => deck.id === big)!.cards,
  ).toEqual(custom.slice(0, 8).map((card) => card.id));
  await page.reload();
  await collection(page);
  await page.setViewportSize({ width: 390, height: 1000 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .locator(".saved-deck-manager")
    .screenshot({ path: "/tmp/skystones-saved-decks-phone.png" });
  await page.getByRole("button", { name: /Let’s play/ }).click();
  await expect(page.getByLabel("Match deck")).toHaveValue(alternate);
  await page.getByRole("button", { name: /Bring a friend/ }).click();
  await page
    .getByRole("button", { name: "Find a little magic", exact: true })
    .click();
  await expect(page.locator(".board-cell")).toHaveCount(16);
  await expect(page.locator(".hand-card-button .stone-caption")).toHaveText(
    cards.map((id) => custom.find((card) => card.id === id)!.name),
  );
});

test("resizing a complete legacy deck makes a separate deck instead of overwriting the original", async ({
  page,
}) => {
  await setup(page);
  await page.getByLabel("Deck board size", { exact: true }).selectOption("4");
  const large = await stored(page);
  expect(large.decks).toHaveLength(2);
  expect(large.deck).toHaveLength(8);
  expect(large.decks[0].cards).toEqual(
    custom.slice(0, 5).map((card) => card.id),
  );
  await page.getByLabel("Deck board size", { exact: true }).selectOption("3");
  expect((await stored(page)).deck).toEqual(large.decks[0].cards);
  await page.getByLabel("Deck board size", { exact: true }).selectOption("4");
  expect((await stored(page)).deck).toEqual(large.deck);
  expect((await stored(page)).decks).toHaveLength(2);
});

test("duplicate names show an inline error; deleting a slot supports cancel and keeps every card", async ({
  page,
}) => {
  await setup(page);
  await nameAction(page, "Duplicate deck", "Disposable");
  const before = await stored(page);
  await page.getByRole("button", { name: "Rename deck", exact: true }).click();
  const rename = page.getByRole("dialog", { name: "Rename deck", exact: true });
  await rename.getByLabel("Deck name").fill("my DECK");
  await rename
    .getByRole("button", { name: "Rename deck", exact: true })
    .click();
  await expect(rename.getByRole("alert")).toContainText("already used");
  expect(await stored(page)).toEqual(before);
  await rename.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("button", { name: "Delete deck", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  expect(await stored(page)).toEqual(before);
  await page.getByRole("button", { name: "Delete deck", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete deck", exact: true })
    .click();
  const after = await stored(page);
  expect(after.decks).toHaveLength(1);
  expect(after.activeDeckId).toBe(before.decks[0].id);
  expect(after.custom).toEqual(before.custom);
  await expect(
    page.getByRole("button", { name: "Delete deck", exact: true }),
  ).toBeDisabled();
});

test("deleting a custom stone removes it from every slot and leaves the running match intact", async ({
  page,
}) => {
  await setup(page);
  await nameAction(page, "Duplicate deck", "Second deck");
  await page.getByLabel("Deck board size", { exact: true }).selectOption("4");
  const before = await stored(page);
  expect(before.decks.every((deck) => deck.cards.includes(custom[0].id))).toBe(
    true,
  );
  await page
    .getByRole("button", { name: "View Deck Stone 1", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Delete Deck Stone 1", exact: true })
    .click();
  await page.getByRole("button", { name: "Delete stone", exact: true }).click();
  const after = await stored(page);
  expect(after.custom.some((card) => card.id === custom[0].id)).toBe(false);
  expect(after.decks.every((deck) => !deck.cards.includes(custom[0].id))).toBe(
    true,
  );
  for (const deck of after.decks)
    expect(deck.cards).toHaveLength(deck.boardSize === 4 ? 7 : 4);
  await expect(page.locator(".deck-play")).toBeDisabled();
  await page.getByRole("button", { name: "The table", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /^Select Deck Stone 1,/ }),
  ).toBeVisible();
  await page.reload();
  await collection(page);
  expect((await stored(page)).decks).toEqual(after.decks);
});

test("converting a card to a token removes its old ID from all deck slots", async ({
  page,
}) => {
  await setup(page);
  await nameAction(page, "Duplicate deck", "Token experiment");
  await page
    .getByRole("button", { name: "View Deck Stone 1", exact: true })
    .click();
  await page.getByRole("button", { name: "Edit stone", exact: true }).click();
  await page.getByLabel("Token only · available through Conjure").check();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  const after = await stored(page);
  expect(
    after.custom.some((card) => card.token && card.name === "Deck Stone 1"),
  ).toBe(true);
  expect(after.decks.every((deck) => !deck.cards.includes(custom[0].id))).toBe(
    true,
  );
  expect(after.deck).toHaveLength(4);
  await page.reload();
  await collection(page);
  expect((await stored(page)).decks).toEqual(after.decks);
});

test("storage failure preserves the saved deck and leaves the name form open for retry", async ({
  page,
}) => {
  await setup(page);
  await nameAction(page, "Duplicate deck", "Real deck");
  const before = await stored(page);
  await page.evaluate((key) => {
    const old = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      if (k === key)
        throw new DOMException("Storage full", "QuotaExceededError");
      return old.call(this, k, v);
    };
  }, KEY);
  await page.getByRole("button", { name: "Rename deck", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Rename deck", exact: true });
  await dialog.getByLabel("Deck name").fill("Unsaved name");
  await dialog
    .getByRole("button", { name: "Rename deck", exact: true })
    .click();
  await expect(page.locator(".toast")).toContainText(
    "storage is full or unavailable",
  );
  await expect(dialog).toBeVisible();
  expect(await stored(page)).toEqual(before);
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByLabel("Saved deck", { exact: true }).locator("option:checked"),
  ).toContainText("Real deck");
});
