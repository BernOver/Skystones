import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { CHARACTER_STONES, ENEMY_STONES } from "../../src/characters.ts";
import { DEFAULT_TOKENS } from "../../src/tokens.ts";
import { DEFAULT_PARTS } from "../../src/assemble.ts";
import { DEFAULT_SPELLS } from "../../src/spellCards.ts";
import { DELETED_CONTENT_STORAGE } from "../../src/deletedContent.ts";
import { DEFAULT_DECK } from "../../src/game.ts";
import type { Stone } from "../../src/game.ts";
if (process.env.SKYSTONES_STANDALONE === "1") {
  const html = readFileSync("standalone/Skystones.html", "utf8");
  test.beforeEach(async ({ page }) => {
    const unexpected: string[] = [];
    (page as Page & { unexpected: string[] }).unexpected = unexpected;
    await page.route("**/*", (route) =>
      route.request().url() === "http://127.0.0.1:5173/"
        ? route.fulfill({ status: 200, contentType: "text/html", body: html })
        : (unexpected.push(route.request().url()), route.abort()),
    );
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
const library = (page: Page) =>
  page.evaluate(() =>
    JSON.parse(localStorage.getItem("skystones-library-v1")!),
  );
const wild: Stone = {
  ...CHARACTER_STONES[0],
  id: "custom-wild-guide",
  custom: true,
  name: "Wild Guide",
  keywords: [
    {
      type: "enchant",
      target: "hand",
      mode: "all",
      randomKeywords: { count: 2 },
    },
  ],
};

test("Rules opens on mobile from a random grant, searches clarifications, and preserves the unfinished editor", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Card studio", exact: true }).click();
  await page.getByLabel("Stone name").fill("Unfinished Guide");
  await page.getByRole("button", { name: /^Add keyword/ }).click();
  await page
    .getByLabel("Search keywords · Keyword 1", { exact: true })
    .fill("enchant");
  await expect(
    page
      .getByLabel("Keyword 1", { exact: true })
      .getByRole("option", { name: /^Conjure/ }),
  ).toHaveCount(0);
  await page.getByLabel("Keyword 1", { exact: true }).selectOption("enchant");
  await page
    .getByLabel("Keyword 1 generate random keywords", { exact: true })
    .check();
  await expect(page.locator(".keyword-editor")).not.toContainText(
    /except Flash|never include Flash|Flash is never|Flash is excluded/,
  );
  await page
    .locator('.keyword-editor [data-rules-topic="random-keywords"]')
    .first()
    .click();
  const rules = page.getByRole("dialog", {
    name: "Rules & clarifications",
    exact: true,
  });
  await expect(rules).toBeVisible();
  await expect(rules.locator("details[open]")).toContainText(
    "Flash is excluded from random keyword generation",
  );
  await rules.getByLabel("Search rules and keywords").fill("Amplify");
  await expect(rules.locator("details[open]")).toContainText("Trap doubling");
  await page.keyboard.press("Escape");
  await expect(rules).toHaveCount(0);
  await expect(page.getByLabel("Stone name")).toHaveValue("Unfinished Guide");
  await expect(
    page.getByLabel("Keyword 1 generate random keywords", { exact: true }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Rules", exact: true }).click();
  await expect(rules).toBeVisible();
  await rules.getByRole("button", { name: "Close rules", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Rules", exact: true }),
  ).toBeFocused();
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
});

test("card text omits random exclusions and closing its Rules overlay preserves the card dialog", async ({
  page,
}) => {
  await page.addInitScript(
    (card) =>
      localStorage.setItem(
        "skystones-library-v1",
        JSON.stringify({ custom: [card], deck: [] }),
      ),
    wild,
  );
  await page.goto("/");
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page
    .getByRole("button", { name: "View Wild Guide", exact: true })
    .click();
  const card = page.getByRole("dialog", { name: "Wild Guide", exact: true });
  await expect(card).toContainText("2 RANDOM KEYWORDS");
  await expect(card).not.toContainText("Flash");
  await card
    .getByRole("button", { name: "Rules & clarifications", exact: true })
    .click();
  const rules = page.getByRole("dialog", {
    name: "Rules & clarifications",
    exact: true,
  });
  await expect(rules).toContainText("Flash is excluded");
  await page.keyboard.press("Tab");
  await expect
    .poll(() =>
      page.evaluate(() =>
        document
          .querySelector("dialog[open]")
          ?.contains(document.activeElement),
      ),
    )
    .toBe(true);
  await page.keyboard.press("Escape");
  await expect(rules).toHaveCount(0);
  await expect(card).toBeVisible();
  await expect(
    card.getByRole("button", { name: "Rules & clarifications", exact: true }),
  ).toBeFocused();
});

for (const [kind, card] of [
  ["stone", CHARACTER_STONES[0]],
  ["token", DEFAULT_TOKENS[0]],
  ["spell", DEFAULT_SPELLS[0]],
  ["part", DEFAULT_PARTS[0]],
] as const)
  test(`delete and restore a default ${kind} across reloads and remove deleted stones from every saved deck`, async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /^Collection/ }).click();
    async function tab() {
      if (kind === "token")
        await page.getByRole("button", { name: /^Tokens/ }).click();
      if (kind === "spell")
        await page.getByRole("button", { name: /^Spells/ }).click();
      if (kind === "part")
        await page.getByRole("button", { name: /^Parts & recipes/ }).click();
    }
    await tab();
    await page
      .getByRole("button", { name: `View ${card.name}`, exact: true })
      .click();
    await page
      .getByRole("button", { name: `Delete ${card.name}`, exact: true })
      .click();
    await page
      .getByRole("button", { name: "Keep this friend", exact: true })
      .click();
    await expect(
      page.getByRole("dialog", { name: card.name, exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: `Delete ${card.name}`, exact: true })
      .click();
    await page
      .getByRole("button", { name: "Delete card", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: `View ${card.name}`, exact: true }),
    ).toHaveCount(0);
    const saved = await library(page);
    if (kind === "stone")
      expect(
        saved.decks.every(
          (deck: { cards: string[] }) => !deck.cards.includes(card.id),
        ),
      ).toBe(true);
    await page.reload();
    await page.getByRole("button", { name: /^Collection/ }).click();
    await tab();
    await expect(
      page.getByRole("button", { name: `View ${card.name}`, exact: true }),
    ).toHaveCount(0);
    await page.locator(".deleted-defaults > summary").click();
    await page
      .getByRole("button", { name: `Restore ${card.name}`, exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: `View ${card.name}`, exact: true }),
    ).toBeVisible();
  });

test("default Traps can be deleted, kept or restored in the same collection view", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page.getByRole("button", { name: "Traps", exact: true }).click();
  await page
    .getByRole("button", { name: "Delete Fire Tiki", exact: true })
    .click();
  await page.getByRole("button", { name: "Keep Trap", exact: true }).click();
  await expect(page.locator(".trap-grid")).toContainText("Fire Tiki");
  await page
    .getByRole("button", { name: "Delete Fire Tiki", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm delete Trap", exact: true })
    .click();
  await expect(page.locator(".trap-grid")).not.toContainText("Fire Tiki");
  await page.reload();
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page.getByRole("button", { name: "Traps", exact: true }).click();
  await expect(page.locator(".trap-grid")).not.toContainText("Fire Tiki");
  await page.locator(".deleted-defaults > summary").click();
  await page
    .getByRole("button", { name: "Restore Fire Tiki", exact: true })
    .click();
  await expect(page.locator(".trap-grid")).toContainText("Fire Tiki");
});

test("collection keyword searches include granted abilities and combine with an exact keyword filter", async ({
  page,
}) => {
  const cards: Stone[] = [
    {
      ...wild,
      id: "custom-search-amplifier",
      name: "Search Amplifier",
      keywords: [
        {
          type: "combo",
          keywords: [{ type: "amplify", effect: "all", duration: "always" }],
        },
      ],
    },
    {
      ...wild,
      id: "custom-search-breaker",
      name: "Search Breaker",
      keywords: [{ type: "sunder", side: 0 }],
    },
  ];
  await page.addInitScript(
    (custom) =>
      localStorage.setItem(
        "skystones-library-v1",
        JSON.stringify({ custom, deck: [] }),
      ),
    cards,
  );
  await page.goto("/");
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page.getByLabel("Search stones").fill("Amplify");
  await expect(
    page.getByRole("button", { name: "View Search Amplifier", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "View Search Breaker", exact: true }),
  ).toHaveCount(0);
  await page.getByLabel("Search stones").fill("Search");
  await page
    .getByLabel("Filter by keyword", { exact: true })
    .selectOption("sunder");
  await expect(
    page.getByRole("button", { name: "View Search Amplifier", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "View Search Breaker", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Filter by keyword", { exact: true })
    .selectOption("amplify");
  await expect(
    page.getByRole("button", { name: "View Search Amplifier", exact: true }),
  ).toBeVisible();
});

test("deleting every default character leaves the app usable and explains how to restore depleted mode pools", async ({
  page,
}) => {
  const removed = [...CHARACTER_STONES, ...ENEMY_STONES].map((card) => ({
    kind: "card",
    id: card.id,
    name: card.name,
  }));
  await page.addInitScript(
    ({ key, removed, deck }) => {
      localStorage.setItem(key, JSON.stringify(removed));
      localStorage.setItem(
        "skystones-library-v1",
        JSON.stringify({ custom: [], deck }),
      );
    },
    { key: DELETED_CONTENT_STORAGE, removed, deck: DEFAULT_DECK },
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Adventure", exact: true }).click();
  await page
    .getByRole("button", { name: "Start adventure", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Restore deleted cards");
  await page.getByRole("button", { name: "Draft", exact: true }).click();
  await page.getByRole("button", { name: "Start draft", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "25 available characters",
  );
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page.locator(".deleted-defaults > summary").click();
  await page
    .getByRole("button", { name: "Restore all deleted content", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "View Spyro", exact: true }),
  ).toBeVisible();
});

test("deletion updates from another tab preserve the latest custom cards", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^Collection/ }).click();
  const peer = await context.newPage();
  if (process.env.SKYSTONES_STANDALONE === "1") {
    const html = readFileSync("standalone/Skystones.html", "utf8");
    await peer.route("**/*", (route) =>
      route.request().url() === "http://127.0.0.1:5173/"
        ? route.fulfill({ status: 200, contentType: "text/html", body: html })
        : ((page as Page & { unexpected: string[] }).unexpected.push(
            route.request().url(),
          ),
          route.abort()),
    );
  }
  await peer.goto("/");
  await peer.evaluate(
    ({ custom, key, id, name }) => {
      const library = JSON.parse(
        localStorage.getItem("skystones-library-v1") || "null",
      ) || { custom: [], deck: [] };
      library.custom.push(custom);
      localStorage.setItem("skystones-library-v1", JSON.stringify(library));
      localStorage.setItem(key, JSON.stringify([{ kind: "card", id, name }]));
    },
    {
      custom: wild,
      key: DELETED_CONTENT_STORAGE,
      id: CHARACTER_STONES[0].id,
      name: CHARACTER_STONES[0].name,
    },
  );
  await expect(
    page.getByRole("button", { name: "View Wild Guide", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "View Spyro", exact: true }),
  ).toHaveCount(0);
  expect((await library(page)).custom).toContainEqual(wild);
  await peer.close();
});
