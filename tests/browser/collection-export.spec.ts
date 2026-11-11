import { DEFAULT_SPELLS } from "../../src/spellCards.ts";
import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { CHARACTER_STONES, ENEMY_STONES } from "../../src/characters.ts";
import { DEFAULT_TOKENS, LIBRARY_STORAGE } from "../../src/tokens.ts";
import {
  CHARACTER_DEFAULTS_STORAGE,
  editedCharacterDefault,
} from "../../src/cardDefaults.ts";
import { CUSTOM_TRIBES_STORAGE, customTribe } from "../../src/tribes.ts";
import type { Stone } from "../../src/game.ts";

if (process.env.SKYSTONES_STANDALONE === "1") {
  const html = readFileSync("standalone/Skystones.html", "utf8");
  let unexpected: string[];
  test.beforeEach(async ({ page }) => {
    unexpected = [];
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
  test.afterEach(() => expect(unexpected).toEqual([]));
}
test.beforeEach(({ page }) =>
  page.on("pageerror", (error) => {
    throw error;
  }),
);

async function downloadCollection(page: Page) {
  const waiting = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export all cards", exact: true })
    .click();
  const download = await waiting;
  expect(download.suggestedFilename()).toBe("Skystones-all-cards.json");
  const stream = await download.createReadStream(),
    chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString());
}

test("export all includes edited built-ins, their originals, custom cards, token overrides, images and tribes despite active filters", async ({
  page,
}) => {
  const image =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j6mQAAAAASUVORK5CYII=";
  const tribe = customTribe("Clockwork Crew");
  const customCard: Stone = {
    ...CHARACTER_STONES[0],
    id: "custom-review-stone",
    custom: true,
    name: "Review Stone",
    image,
    tribes: [tribe],
    keywords: [{ type: "head-start", side: 0, amount: 3 }],
  };
  const token: Stone = {
    ...DEFAULT_TOKENS[5],
    id: "custom-token-review-echo",
    name: "Review Echo",
    tribes: ["swap-force", tribe],
    image,
    keywords: [{ type: "shield", side: 2, amount: 2, half: "bottom" }],
  };
  const override: Stone = {
    ...DEFAULT_TOKENS[0],
    name: "Root Sprout",
    edges: [1, 1, 1, 1],
  };
  const original = CHARACTER_STONES[0],
    giant = ENEMY_STONES.find(
      (card) => card.portrait === "enemy-arkeyan-bomber",
    )!;
  const defaults = editedCharacterDefault(
    giant.portrait!,
    {
      ...giant,
      name: "Workshop Bomber",
      edges: [1, 4, 1, 0],
      keywords: [{ type: "sunder", side: "any", amount: 3 }],
    },
    editedCharacterDefault(
      original.portrait!,
      {
        ...original,
        name: "Shared Dragon",
        portrait: "dark-spyro",
        edges: [1, 2, 3, 4],
        image,
        tribes: ["swap-force", tribe],
        keywords: [
          {
            type: "conjure",
            mode: "token",
            token: token.id,
            count: 2,
            recipient: "self",
            half: "top",
          },
        ],
      },
      {},
    ),
  );
  await page.addInitScript(
    ({ keys, custom, defaults, tribe }) => {
      localStorage.setItem(
        keys.library,
        JSON.stringify({ custom, deck: [], boardSize: 3, sound: false }),
      );
      localStorage.setItem(keys.defaults, JSON.stringify(defaults));
      localStorage.setItem(
        keys.tribes,
        JSON.stringify([{ id: tribe, name: "Clockwork Crew" }]),
      );
      localStorage.setItem("unrelated-private-value", "DO-NOT-EXPORT-THIS");
    },
    {
      keys: {
        library: LIBRARY_STORAGE,
        defaults: CHARACTER_DEFAULTS_STORAGE,
        tribes: CUSTOM_TRIBES_STORAGE,
      },
      custom: [customCard, token, override],
      defaults,
      tribe,
    },
  );
  await page.goto("/");
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page.getByRole("button", { name: /^My creations/ }).click();
  await page.getByLabel("Search stones").fill("No matching card exists");
  await expect(page.locator(".collection-card-button")).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 900 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .locator(".page-collection .page-heading")
    .screenshot({ path: "/tmp/skystones-export-all-phone.png" });
  const before = await page.evaluate(() => ({ ...localStorage }));
  const payload = await downloadCollection(page);
  expect(payload.format).toBe("skystones-collection");
  expect(payload.summary).toEqual({
    builtInCards: 221,
    editedCharacters: 2,
    customCards: 1,
    tokenTemplates: 13 + DEFAULT_SPELLS.length,
  });
  expect(payload.cards).toHaveLength(222);
  expect(new Set(payload.cards.map((card: Stone) => card.id)).size).toBe(222);
  expect(
    payload.cards.find((card: Stone) => card.id === original.id),
  ).toMatchObject({
    name: "Shared Dragon",
    characterKey: original.portrait,
    portrait: "dark-spyro",
    edges: [1, 2, 3, 4],
    image,
    keywords: [{ type: "conjure", token: token.id, half: "top" }],
  });
  expect(
    payload.cards.find((card: Stone) => card.id === giant.id),
  ).toMatchObject({
    name: "Workshop Bomber",
    edges: [1, 4, 1, 0],
    keywords: [{ type: "sunder", side: "any", amount: 3 }],
  });
  expect(
    payload.cards.find((card: Stone) => card.id === customCard.id),
  ).toEqual(customCard);
  expect(payload.originalCards).toEqual(
    JSON.parse(JSON.stringify([original, giant])),
  );
  expect(payload.characterDefaults).toEqual(defaults);
  expect(payload.tokens.find((card: Stone) => card.id === token.id)).toEqual(
    token,
  );
  expect(
    payload.tokens.filter((card: Stone) => card.id === override.id),
  ).toEqual([override]);
  expect(
    payload.originalTokens.find((card: Stone) => card.id === override.id).name,
  ).toBe("Chompy Seedling");
  expect(payload.customTribes).toContainEqual({
    id: tribe,
    name: "Clockwork Crew",
  });
  expect(JSON.stringify(payload)).not.toContain("DO-NOT-EXPORT-THIS");
  expect(await page.evaluate(() => ({ ...localStorage }))).toEqual(before);
  await expect(page.locator(".toast")).toContainText(
    `222 cards and ${13 + DEFAULT_SPELLS.length} token templates`,
  );
});

test("a fresh collection exports every built-in and starter token in one file", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page.getByRole("button", { name: /^Tokens/ }).click();
  const payload = await downloadCollection(page);
  expect(payload.cards).toHaveLength(221);
  expect(payload.tokens).toHaveLength(12 + DEFAULT_SPELLS.length);
  expect(payload.tokens.filter((card: Stone) => !!card.spell)).toHaveLength(
    DEFAULT_SPELLS.length,
  );
  expect(payload.summary.editedCharacters).toBe(0);
  expect(payload.customTribes).toEqual([]);
  expect(payload.characterDefaults).toEqual({});
  expect(payload.originalCards).toEqual([]);
  expect(
    payload.cards.find((card: Stone) => card.id === CHARACTER_STONES[0].id),
  ).toEqual(CHARACTER_STONES[0]);
});
