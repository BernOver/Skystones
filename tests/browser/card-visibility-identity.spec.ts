import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import {
  newAdventure,
  enterAdventureNode,
  ADVENTURE_STORAGE,
} from "../../src/adventure.ts";
import {
  newDraft,
  nominateDraftCards,
  nominationCount,
  pickDraftCard,
  DRAFT_STORAGE,
} from "../../src/draft.ts";
import {
  ADVENTURE_CHARACTERS,
  ENEMY_STONES,
  hasSkystonesArtwork,
} from "../../src/characters.ts";
import type { Adventure } from "../../src/adventure.ts";
async function openRun(page: Page, run: Adventure) {
  await page.addInitScript(
    ({ run, key }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(run));
    },
    { run, key: ADVENTURE_STORAGE },
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Adventure", exact: true }).click();
}
async function saved(page: Page): Promise<Adventure> {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    ADVENTURE_STORAGE,
  );
}
for (const size of [3, 4] as const)
  for (const mode of ["normal", "draft", "adventure"] as const)
    test(`${mode} ${size}×${size} shows artwork and pips on the board without hovering, including on a phone`, async ({
      page,
    }) => {
      if (mode === "adventure")
        await openRun(page, enterAdventureNode(newAdventure(size, 4), "moss"));
      else {
        if (mode === "draft") {
          let draft = newDraft(size, 17);
          const n = nominationCount(size);
          draft = nominateDraftCards(
            draft,
            draft.cards.slice(0, n).map((card) => card.id),
          );
          draft = nominateDraftCards(
            draft,
            draft.cards.slice(n, n * 2).map((card) => card.id),
          );
          while (draft.phase === "draft")
            draft = pickDraftCard(draft, draft.offered[0]);
          await page.addInitScript(
            ({ key, draft }) =>
              localStorage.setItem(key, JSON.stringify(draft)),
            { key: DRAFT_STORAGE, draft },
          );
        }
        await page.goto("/");
        if (mode === "draft") {
          await page
            .getByRole("button", { name: "Draft", exact: true })
            .click();
          await page
            .getByRole("button", { name: "Play drafted match" })
            .click();
        } else {
          await page
            .getByRole("button", { name: "New match", exact: true })
            .click();
          await page
            .getByRole("dialog")
            .getByLabel("Board size", { exact: true })
            .selectOption(String(size));
          await page.getByRole("button", { name: /Bring a friend/ }).click();
          await page
            .getByRole("button", { name: "Find a little magic" })
            .click();
        }
      }
      await page
        .locator(mode === "adventure" ? ".run-hand-card" : ".hand-card-button")
        .first()
        .click();
      await page
        .locator(
          mode === "adventure"
            ? ".adventure-square.vacant:enabled"
            : ".board-cell.empty:enabled",
        )
        .first()
        .click();
      await page.mouse.move(0, 0);
      const card = page
        .locator(
          mode === "adventure"
            ? ".adventure-square.occupied"
            : ".board-cell.filled",
        )
        .first();
      await expect(page.getByRole("tooltip")).toHaveCount(0);
      for (const width of [1280, 390]) {
        await page.setViewportSize({ width, height: 1000 });
        await expect
          .poll(() =>
            card
              .locator(".stone-art")
              .evaluate((art) => art.getBoundingClientRect().height),
          )
          .toBeGreaterThan(size === 4 && width === 390 ? 18 : 30);
        expect(
          await card
            .locator(".stone-art img")
            .last()
            .evaluate(
              (image: HTMLImageElement) =>
                image.complete && image.naturalWidth > 0,
            ),
        ).toBe(true);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
      }
    });
const enfuego = ENEMY_STONES.find((card) => card.name === "Enfuego Chompy")!;
function pack(): Adventure {
  const run = newAdventure(3, 5);
  const heroes = ADVENTURE_CHARACTERS.filter(
    (card) =>
      !hasSkystonesArtwork(card) && card.edges.reduce((a, b) => a + b) <= 3,
  ).slice(0, 6);
  run.inventory = [
    {
      ...enfuego,
      keywords: [],
      baseEdges: [...enfuego.edges],
      baseKeywords: [],
    },
    ...heroes,
  ].map((card, i) => ({
    ...card,
    id: `custom-run-${run.seed}-test-${i}`,
    custom: true,
  }));
  run.deck = run.inventory.slice(0, 5).map((card) => card.id);
  return run;
}
test("Adventure Enfuego shows two North pips and no keywords; a potion removes obsolete image markings while keeping the fixed base", async ({
  page,
}) => {
  const run = enterAdventureNode({ ...pack(), potions: ["power"] }, "moss");
  await openRun(page, run);
  const card = page.locator(".run-hand-card").first();
  await expect(card.locator(".edge-0 > b")).toHaveText("2");
  await expect(card.locator("img.skystones-original-art")).toBeVisible();
  await expect(card.locator(".stone-keyword")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Use Power Tonic", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /^Empower Enfuego/ })
    .click();
  await expect(card.locator(".edge-0 > b")).toHaveText("3");
  await expect(card.locator("img.skystones-portrait-art")).toBeVisible();
  await card.click();
  await page
    .getByRole("button", { name: "A1, empty adventure square", exact: true })
    .click();
  const board = page
    .locator(".adventure-square.occupied")
    .filter({ hasText: "Enfuego Chompy" });
  await expect(board.locator(".stone-art")).toBeVisible();
  await expect(board.locator(".stone-keyword")).toHaveCount(0);
  await board.click();
  await expect(page.getByRole("dialog")).toContainText("Fixed Adventure base");
  await expect(page.getByRole("dialog")).toContainText("2/0/0/0");
  await expect(page.getByRole("dialog")).toContainText("upgrades or effects");
});
test("saved duplicate Enfuego cards are repaired once while the deck keeps its slots", async ({
  page,
}) => {
  const run = pack(),
    ids = [...run.deck];
  run.inventory[1] = {
    ...run.inventory[0],
    id: run.inventory[1].id,
    keywords: [{ type: "shield", side: 0 }],
  };
  await openRun(page, run);
  await page.getByRole("button", { name: /^Expedition deck/ }).click();
  const fixed = await saved(page);
  expect(
    fixed.inventory.filter((card) => card.portrait === enfuego.portrait),
  ).toHaveLength(1);
  expect(new Set(fixed.inventory.map((card) => card.portrait)).size).toBe(
    fixed.inventory.length,
  );
  expect(fixed.deck).toEqual(ids);
  expect(fixed.inventory[0].keywords).toEqual([]);
  await page.reload();
  await page.getByRole("button", { name: "Adventure", exact: true }).click();
  expect((await saved(page)).inventory).toEqual(fixed.inventory);
});
test("Adventure workshop explains why Skystones cannot gain keywords and still inscribes character cards", async ({
  page,
}) => {
  const run = enterAdventureNode(
    { ...pack(), floor: 2, gold: 300 },
    "shop-one",
  );
  await openRun(page, run);
  await page.getByLabel("Workshop card").selectOption(run.inventory[0].id);
  await page.getByLabel("Workshop service").selectOption("keyword");
  await expect(
    page.getByRole("button", { name: "Buy upgrade · 35 gold", exact: true }),
  ).toBeDisabled();
  await expect(page.locator(".stone-workshop")).toContainText(
    "stay keyword-free",
  );
  await page.getByLabel("Workshop card").selectOption(run.inventory[1].id);
  await page
    .getByRole("button", { name: "Buy upgrade · 35 gold", exact: true })
    .click();
  const current = await saved(page);
  expect(current.inventory[0].keywords).toEqual([]);
  expect(current.inventory[1].keywords!.length).toBeGreaterThan(0);
  expect(current.gold).toBe(265);
});
test("card maker loads original Skystones pips and crops their baked markings after a manual edit", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Card studio", exact: true }).click();
  await page.getByLabel("Find a character portrait").fill("Enfuego");
  await page
    .getByRole("button", { name: "Use Enfuego Chompy portrait", exact: true })
    .click();
  await expect(page.locator(".preview-card .edge > b")).toHaveText([
    "2",
    "0",
    "0",
    "0",
  ]);
  await expect(
    page.locator(".preview-card img.skystones-original-art"),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Increase north strength", exact: true })
    .click();
  await expect(
    page.locator(".preview-card img.skystones-portrait-art"),
  ).toBeVisible();
  await expect(page.locator(".preview-card .edge-0 > b")).toHaveText("3");
});
