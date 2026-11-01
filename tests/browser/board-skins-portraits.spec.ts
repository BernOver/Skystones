import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { BOARD_SKINS, OPPONENTS } from "../../src/presentation.ts";
import { DEFAULT_DECK } from "../../src/game.ts";
import {
  ADVENTURE_STORAGE,
  newAdventure,
  enterAdventureNode,
} from "../../src/adventure.ts";
import {
  DRAFT_STORAGE,
  newDraft,
  nominateDraftCards,
  nominationCount,
  pickDraftCard,
} from "../../src/draft.ts";
async function chooseSkin(page: Page, name: string) {
  await page.getByRole("button", { name: "Board skins", exact: true }).click();
  await expect(
    page.getByRole("dialog").locator(".board-skin-option"),
  ).toHaveCount(6);
  await page
    .getByRole("button", { name: `Use ${name} skin`, exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: `Use ${name} skin`, exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Escape");
}
for (const size of [3, 4] as const)
  for (const mode of ["normal", "draft", "adventure"] as const) {
    test(`${mode} ${size}×${size}: all six skins preserve a played card, fit a phone and save the preference`, async ({
      page,
    }) => {
      if (mode === "adventure") {
        const run = enterAdventureNode(newAdventure(size, 81), "moss");
        await page.addInitScript(
          ({ run, key }) => {
            if (!localStorage.getItem(key))
              localStorage.setItem(key, JSON.stringify(run));
          },
          { run, key: ADVENTURE_STORAGE },
        );
      } else if (mode === "draft") {
        let draft = newDraft(size, 17),
          n = nominationCount(size);
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
          ({ draft, key }) => localStorage.setItem(key, JSON.stringify(draft)),
          { draft, key: DRAFT_STORAGE },
        );
      }
      if (mode === "adventure") {
        await page.clock.install({ time: new Date("2026-11-01T12:00:00Z") });
        await page.clock.pauseAt(new Date("2026-11-01T12:00:01Z"));
      }
      await page.goto("/");
      if (mode === "adventure")
        await page
          .getByRole("button", { name: "Adventure", exact: true })
          .click();
      else if (mode === "draft") {
        await page.getByRole("button", { name: "Draft", exact: true }).click();
        await page.getByRole("button", { name: "Play drafted match" }).click();
      } else {
        await page
          .getByRole("button", { name: "New match", exact: true })
          .click();
        await page
          .getByRole("dialog")
          .getByLabel("Board size", { exact: true })
          .selectOption(String(size));
        await page.getByRole("button", { name: /Bring a friend/ }).click();
        await page.getByRole("button", { name: "Find a little magic" }).click();
      }
      const board = page.locator(
        mode === "adventure" ? ".adventure-board" : ".game-board",
      );
      await expect(board).toHaveAttribute("data-board-skin", "giants");
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
      const card = board
        .locator(
          mode === "adventure"
            ? ".adventure-square.occupied"
            : ".board-cell.filled",
        )
        .first();
      const name = await card.locator(".stone-caption").last().textContent();
      const savedBefore =
        mode === "adventure"
          ? await page.evaluate(
              (key) => JSON.parse(localStorage.getItem(key)!),
              ADVENTURE_STORAGE,
            )
          : null;
      const backgrounds = new Set<string>();
      for (const skin of BOARD_SKINS) {
        await chooseSkin(page, skin.name);
        await expect(board).toHaveAttribute("data-board-skin", skin.id);
        await expect(card.locator(".stone-caption").last()).toHaveText(name!);
        await expect(
          board.locator(
            mode === "adventure" ? ".adventure-square" : ".board-cell",
          ),
        ).toHaveCount(size * size);
        backgrounds.add(
          await board.evaluate((el) => getComputedStyle(el).backgroundImage),
        );
        if (mode === "normal" && size === 3)
          await board.screenshot({
            path: `/tmp/skystones-board-${skin.id}.png`,
          });
      }
      expect(backgrounds.size).toBe(6);
      if (savedBefore)
        expect(
          await page.evaluate(
            (key) => JSON.parse(localStorage.getItem(key)!),
            ADVENTURE_STORAGE,
          ),
        ).toEqual(savedBefore);
      await page.mouse.move(0, 0);
      await page.setViewportSize({ width: 390, height: 1000 });
      await expect
        .poll(() =>
          card
            .locator(".capture-flip-back .stone-art")
            .evaluate((el) => el.getBoundingClientRect().height),
        )
        .toBeGreaterThan(18);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page
        .getByRole("button", { name: "Board skins", exact: true })
        .click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page
        .getByRole("button", { name: "Use Lava Forge skin", exact: true })
        .click();
      await page.keyboard.press("Escape");
      await expect(board).toHaveAttribute("data-board-skin", "lava");
      await page.reload();
      if (mode === "adventure")
        await page
          .getByRole("button", { name: "Adventure", exact: true })
          .click();
      await expect(
        page.locator(mode === "adventure" ? ".adventure-board" : ".game-board"),
      ).toHaveAttribute("data-board-skin", "lava");
    });
  }
test("all ten normal opponent portraits load; chosen villain appears in the match and survives reload", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New match", exact: true }).click();
  for (const enemy of OPPONENTS) {
    await page.getByLabel("Opponent", { exact: true }).selectOption(enemy.id);
    const image = page
      .getByRole("dialog")
      .getByRole("img", { name: `${enemy.name} portrait`, exact: true });
    await expect(image).toBeVisible();
    await expect
      .poll(() =>
        image.evaluate(
          (el: HTMLImageElement) => el.complete && el.naturalWidth > 0,
        ),
      )
      .toBe(true);
  }
  await page.getByLabel("Opponent", { exact: true }).selectOption("wolfgang");
  await page.getByRole("button", { name: "Find a little magic" }).click();
  await expect(page.locator(".player-two")).toContainText("Wolfgang");
  await expect(
    page.locator(".player-two").getByRole("img", { name: "Wolfgang portrait" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator(".player-two")).toContainText("Wolfgang");
});
test("Adventure map choices have distinct enemy portraits that match their battle and stay after reload", async ({
  page,
}) => {
  const run = newAdventure(3, 81);
  await page.addInitScript(
    ({ run, key }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(run));
    },
    { run, key: ADVENTURE_STORAGE },
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Adventure", exact: true }).click();
  const options = page.locator(".run-map-row.current .run-node"),
    images = options.locator("img");
  await expect(images).toHaveCount(2);
  const portraits = await images.evaluateAll((els: HTMLImageElement[]) =>
    els.map((el) => el.alt),
  );
  expect(new Set(portraits).size).toBe(2);
  await expect
    .poll(() =>
      page
        .locator(".run-node img")
        .evaluateAll((els: HTMLImageElement[]) =>
          els.every((el) => el.complete && el.naturalWidth > 0),
        ),
    )
    .toBe(true);
  const selected = await options.nth(1).locator("img").getAttribute("alt");
  await page.setViewportSize({ width: 390, height: 1000 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .locator(".run-map-row.current")
    .screenshot({ path: "/tmp/skystones-map-enemy-portraits.png" });
  await options.nth(1).click();
  await expect(page.locator(".encounter-opponent img")).toHaveAttribute(
    "alt",
    selected!,
  );
  await chooseSkin(page, "Arkeyan Ruins");
  await page.reload();
  await page.getByRole("button", { name: "Adventure", exact: true }).click();
  await expect(page.locator(".encounter-opponent img")).toHaveAttribute(
    "alt",
    selected!,
  );
  await expect(page.locator(".adventure-board")).toHaveAttribute(
    "data-board-skin",
    "arkeyan",
  );
});
for (const [floor, id, name] of [
  [8, "elemental-vortex", "Kaos"],
  [17, "golden-queen", "Golden Queen"],
] as const)
  test(`${name} portrait appears on the Adventure boss map and in its encounter`, async ({
    page,
  }) => {
    const run = { ...newAdventure(4, 81), floor };
    await page.addInitScript(
      ({ run, key }) => localStorage.setItem(key, JSON.stringify(run)),
      { run, key: ADVENTURE_STORAGE },
    );
    await page.goto("/");
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    const node = page
      .locator(".run-map-row.current .run-node")
      .filter({
        hasText:
          id === "elemental-vortex" ? "Elemental Vortex" : "The Golden Court",
      });
    await expect(
      node.getByRole("img", { name: `${name} portrait`, exact: true }),
    ).toBeVisible();
    await node.click();
    await expect(
      page
        .locator(".encounter-opponent")
        .getByRole("img", { name: `${name} portrait`, exact: true }),
    ).toBeVisible();
  });
test("old or unknown appearance preferences safely use the Giants table and preserve the selected deck", async ({
  page,
}) => {
  await page.addInitScript(
    (deck) =>
      localStorage.setItem(
        "skystones-library-v1",
        JSON.stringify({
          custom: [],
          deck,
          boardSize: 3,
          sound: false,
          boardSkin: "invalid",
          opponent: "invalid",
        }),
      ),
    DEFAULT_DECK,
  );
  await page.goto("/");
  await expect(page.locator(".game-board")).toHaveAttribute(
    "data-board-skin",
    "giants",
  );
  await expect(page.locator(".player-two")).toContainText("Chompy Mage");
  await chooseSkin(page, "Frozen Vault");
  const library = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("skystones-library-v1")!),
  );
  expect(library.deck).toEqual(DEFAULT_DECK);
  expect(library.boardSkin).toBe("frost");
});
