import { test, expect } from "@playwright/test";
import {
  ADVENTURE_STORAGE,
  enterAdventureNode,
  newAdventure,
} from "../../src/adventure.ts";
import {
  ADVENTURE_CHARACTERS,
  hasSkystonesArtwork,
} from "../../src/characters.ts";
import type { Adventure } from "../../src/adventure.ts";
import type { Page } from "@playwright/test";
import type { Element } from "../../src/game.ts";

const cycle: Element[] = [
  "fire",
  "water",
  "life",
  "undead",
  "air",
  "earth",
  "tech",
  "magic",
  "light",
  "dark",
];
async function saved(page: Page): Promise<Adventure> {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    ADVENTURE_STORAGE,
  );
}
for (const size of [3, 4] as const) {
  test(`${size}×${size} vortex changes arena colors and actual pips each turn, forecasts the next element, and restores`, async ({
    page,
  }) => {
    const run = newAdventure(size, 81);
    const fire = ADVENTURE_CHARACTERS.find(
      (card) => card.element === "fire" && !hasSkystonesArtwork(card),
    )!;
    run.inventory[0] = { ...fire, id: run.inventory[0].id, keywords: [] };
    const battle = enterAdventureNode({ ...run, floor: 8 }, "elemental-vortex");
    battle.battle!.elementCycle = cycle;
    await page.addInitScript(
      ({ run, key }) => {
        if (!localStorage.getItem(key))
          localStorage.setItem(key, JSON.stringify(run));
      },
      { run: battle, key: ADVENTURE_STORAGE },
    );
    await page.clock.install({ time: new Date("2026-10-25T12:00:00Z") });
    await page.clock.pauseAt(new Date("2026-10-25T12:00:01Z"));
    await page.goto("/");
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    await expect(
      page.getByRole("heading", {
        name: "Kaos · Elemental Vortex",
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.locator(".adventure-square.occupied")).toHaveCount(0);
    const arena = page.getByRole("region", { name: "Elemental Vortex arena" });
    await expect(
      arena.getByLabel("Current element: Fire", { exact: true }),
    ).toBeVisible();
    await expect(
      arena.getByLabel("Next element: Water", { exact: true }),
    ).toBeVisible();
    await expect(arena.locator(".elemental-next svg")).toBeVisible();
    const section = page.locator(".elemental-battle");
    await expect(section).toHaveAttribute("data-arena-element", "fire");
    const fireBackground = await section.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    const hand = page.locator(".run-hand-card").first();
    for (let side = 0; side < 4; side++)
      await expect(hand.locator(`.edge-${side} > b`)).toHaveText(
        String(fire.edges[side] + 1),
      );
    await hand.click();
    await page
      .getByRole("button", { name: "Inspect selected adventure card" })
      .click();
    await expect(
      page.getByRole("dialog").locator(".arena-bonus-notice"),
    ).toContainText("Fire arena · +1 on every edge");
    await page.keyboard.press("Escape");
    await page.locator("#adventure-board-0").click();
    await expect(section).toHaveAttribute("data-arena-element", "water");
    await expect(
      arena.getByLabel("Next element: Life", { exact: true }),
    ).toBeVisible();
    await page.clock.runFor(400);
    expect(
      await section.evaluate((el) => getComputedStyle(el).backgroundColor),
    ).not.toBe(fireBackground);
    const board = page.locator("#adventure-board-0");
    for (let side = 0; side < 4; side++)
      await expect(
        board.locator(`.capture-flip-back .edge-${side} > b`),
      ).toHaveText(String(fire.edges[side]));
    await page.clock.runFor(200);
    await expect(section).toHaveAttribute("data-arena-element", "life");
    await expect(
      arena.getByLabel("Next element: Undead", { exact: true }),
    ).toBeVisible();
    const state = await saved(page);
    expect(state.battle!.turns).toBe(2);
    expect(state.battle!.board[0]!.edges).toEqual(fire.edges);
    expect(state.inventory[0].edges).toEqual(fire.edges);
    await page.reload();
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    await expect(section).toHaveAttribute("data-arena-element", "life");
    await expect(
      arena.getByLabel("Next element: Undead", { exact: true }),
    ).toBeVisible();
    await page.mouse.move(0, 0);
    await page.setViewportSize({ width: 390, height: 950 });
    await expect(arena.locator(".elemental-next svg")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await board
        .locator(".capture-flip-back .stone-art")
        .evaluate((el) => el.getBoundingClientRect().height),
    ).toBeGreaterThan(18);
    if (size === 3)
      await page.screenshot({
        path: "/tmp/skystones-vortex-mobile.png",
        fullPage: true,
      });
  });
}
test("the Act I map offers both Kaos boss variants", async ({ page }) => {
  const run = { ...newAdventure(3, 81), floor: 8 };
  await page.addInitScript(
    ({ run, key }) => localStorage.setItem(key, JSON.stringify(run)),
    { run, key: ADVENTURE_STORAGE },
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Adventure", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /Kaos · Throne of Chaos/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Kaos · Elemental Vortex/ }).click();
  await expect(
    page.getByRole("region", { name: "Elemental Vortex arena" }),
  ).toBeVisible();
});
