import { test, expect } from "@playwright/test";
import { CHARACTER_STONES } from "../../src/characters.ts";
import { CHARACTER_DEFAULTS_STORAGE } from "../../src/cardDefaults.ts";
import { draftCards, DRAFT_STORAGE } from "../../src/draft.ts";
import { ADVENTURE_STORAGE } from "../../src/adventure.ts";

test("edit a character default in the studio, use it in new normal and Draft games, and restore the original", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const original = CHARACTER_STONES[0];
  await page.goto("/");
  const oldPips = await page
    .locator(".hand-card-button")
    .filter({ hasText: original.name })
    .locator(".edge > b")
    .allTextContents();
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page
    .getByRole("button", { name: `View ${original.name}`, exact: true })
    .click();
  await page
    .getByRole("button", { name: "Edit character default", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Edit character default." }),
  ).toBeVisible();
  await page.getByLabel("Find a character portrait").fill("Dark Spyro");
  await page
    .getByRole("button", { name: "Use Dark Spyro portrait", exact: true })
    .click();
  await expect(page.getByLabel("Stone name")).toHaveValue("Dark Spyro");
  await page.getByLabel("Stone name").fill("My Shared Dragon");
  await page
    .getByRole("button", { name: "Save character default", exact: true })
    .click();
  const defaults = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    CHARACTER_DEFAULTS_STORAGE,
  );
  expect(defaults[original.portrait!].card.name).toBe("My Shared Dragon");
  expect(defaults[original.portrait!].card.characterKey).toBe(
    original.portrait,
  );
  await page.getByRole("button", { name: "The table", exact: true }).click();
  const oldHand = page
    .locator(".hand-card-button")
    .filter({ hasText: original.name });
  await expect(oldHand).toHaveCount(1);
  await expect(oldHand.locator(".edge > b")).toHaveText(oldPips);
  await page.getByRole("button", { name: "New match", exact: true }).click();
  await page
    .getByRole("button", { name: "Find a little magic", exact: true })
    .click();
  const updated = page
    .locator(".hand-card-button")
    .filter({ hasText: "My Shared Dragon" });
  await expect(updated).toHaveCount(1);
  await expect(updated.locator(".edge > b")).toHaveText(
    defaults[original.portrait!].card.edges.map(String),
  );
  await page.reload();
  await expect(
    page.locator(".hand-card-button").filter({ hasText: "My Shared Dragon" }),
  ).toHaveCount(1);
  let seed = 1;
  while (
    !draftCards(seed, {}).some((card) => card.portrait === original.portrait)
  )
    seed++;
  await page.clock.setFixedTime(new Date(seed));
  await page.getByRole("button", { name: "Draft", exact: true }).click();
  await page.getByRole("button", { name: "Start draft", exact: true }).click();
  const draft = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    DRAFT_STORAGE,
  );
  const dragon = draft.cards.find(
    (card: { characterKey: string }) => card.characterKey === original.portrait,
  );
  expect(dragon.name).toBe("My Shared Dragon");
  expect(dragon.edges).toEqual(defaults[original.portrait!].card.edges);
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page
    .getByRole("button", { name: "View My Shared Dragon", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Restore original default", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("heading", { name: original.name, exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "Draft", exact: true }).click();
  await expect(
    page.locator(".draft-card").filter({ hasText: "My Shared Dragon" }),
  ).toHaveCount(1);
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      CHARACTER_DEFAULTS_STORAGE,
    ),
  ).toEqual({});
});

for (const size of [3, 4] as const)
  test(`${size}×${size} Adventure starts with an empty potion belt`, async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    await page.getByLabel("Adventure board size").selectOption(String(size));
    await page
      .getByRole("button", { name: "Start adventure", exact: true })
      .click();
    const run = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      ADVENTURE_STORAGE,
    );
    expect(run.potions).toEqual([]);
    await expect(page.locator(".run-toolbar")).toContainText(
      "Empty potion belt",
    );
    await page.reload();
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    expect(
      (
        await page.evaluate(
          (key) => JSON.parse(localStorage.getItem(key)!),
          ADVENTURE_STORAGE,
        )
      ).potions,
    ).toEqual([]);
  });
