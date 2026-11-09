import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  CHARACTER_DEFAULTS_STORAGE,
  editedCharacterDefault,
} from "../../src/cardDefaults.ts";
import { CHARACTER_STONES } from "../../src/characters.ts";
if (process.env.SKYSTONES_STANDALONE === "1") {
  const html = readFileSync("standalone/Skystones.html", "utf8");
  let external: string[];
  test.beforeEach(async ({ page }) => {
    external = [];
    await page.route("**/*", (route) => {
      if (route.request().url() === "http://127.0.0.1:5173/")
        return route.fulfill({
          status: 200,
          contentType: "text/html",
          body: html,
        });
      external.push(route.request().url());
      return route.abort();
    });
  });
  test.afterEach(() => expect(external).toEqual([]));
}
test.beforeEach(({ page }) =>
  page.on("pageerror", (error) => {
    throw error;
  }),
);
test("element filters explain the new identities and card inspection shows character-specific flavor", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^Collection/ }).click();
  for (const [element, theme] of [
    ["fire", "Fuel the flames"],
    ["life", "Grow together"],
    ["undead", "Wear them down"],
    ["magic", "Make the impossible"],
  ]) {
    await page.getByLabel("Filter by element").selectOption(element);
    await expect(page.locator(".element-card-theme")).toContainText(theme);
    await expect(page.locator(".collection-card-button").first()).toBeVisible();
  }
  await page.getByRole("button", { name: "View Spyro", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "A purple dragon with fiery breath",
  );
  await expect(page.getByRole("dialog")).toContainText("Conjure");
  await page.keyboard.press("Escape");
  await page.getByLabel("Filter by element").selectOption("fire");
  await page
    .getByRole("button", { name: "View Blast Zone", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("bomb-throwing knight");
  await expect(page.getByRole("dialog")).toContainText("Scavenge");
  await expect(page.getByRole("dialog")).toContainText("Discard");
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 390, height: 900 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .locator(".element-card-theme")
    .screenshot({ path: "/tmp/skystones-fire-theme-phone.png" });
});
test("rebalancing preserves user-edited default stats, keywords and authored flavor", async ({
  page,
}) => {
  const original = CHARACTER_STONES.find((card) => card.portrait === "spyro")!;
  const defaults = editedCharacterDefault(
    "spyro",
    {
      ...original,
      name: "My Custom Spyro",
      edges: [1, 1, 1, 1],
      keywords: [{ type: "shield", side: 3, amount: 4 }],
      description: "A dragon described by the player.",
    },
    {},
  );
  await page.addInitScript(
    ({ key, defaults }) => localStorage.setItem(key, JSON.stringify(defaults)),
    { key: CHARACTER_DEFAULTS_STORAGE, defaults },
  );
  await page.goto("/");
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page
    .getByRole("button", { name: "View My Custom Spyro", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "A dragon described by the player.",
  );
  await expect(page.getByRole("dialog").locator(".edge > b")).toHaveText([
    "1",
    "1",
    "1",
    "1",
  ]);
  await expect(page.getByRole("dialog")).toContainText("Shield");
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      CHARACTER_DEFAULTS_STORAGE,
    ),
  ).toEqual(defaults);
});
