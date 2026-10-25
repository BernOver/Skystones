import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { DRAFT_STORAGE, newDraft, nominationCount } from "../../src/draft.ts";
import type { DraftState } from "../../src/draft.ts";
import { handSize } from "../../src/game.ts";
async function stored(page: Page): Promise<DraftState> {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    DRAFT_STORAGE,
  );
}
for (const size of [3, 4] as const)
  test(`complete ${size}×${size} draft, reload between picks, and play with the exact drafted hands`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(
      ({ key, draft }) => {
        if (!localStorage.getItem(key))
          localStorage.setItem(key, JSON.stringify(draft));
      },
      { key: DRAFT_STORAGE, draft: newDraft(size, 47) },
    );
    await page.goto("/");
    await page.getByRole("button", { name: "Draft", exact: true }).click();
    await expect(page.locator(".draft-grid .draft-card")).toHaveCount(25);
    await expect(
      page.getByRole("button", { name: "Lock Player 1’s nominations" }),
    ).toBeDisabled();
    for (let player = 1; player <= 2; player++) {
      for (let pick = 0; pick < nominationCount(size); pick++)
        await page
          .getByRole("button", { name: "Nominate", exact: true })
          .first()
          .click();
      await page
        .getByRole("button", { name: `Lock Player ${player}’s nominations` })
        .click();
      if (player === 1) {
        await expect(
          page.getByRole("button", { name: "Reserved by Player 1" }),
        ).toHaveCount(nominationCount(size));
      }
    }
    await expect(page.locator(".draft-offers .draft-card")).toHaveCount(3);
    await page
      .getByRole("button", { name: /^Pick .+$/ })
      .first()
      .click();
    await page.reload();
    await page.getByRole("button", { name: "Draft", exact: true }).click();
    await expect(page.locator(".draft-status")).toContainText(
      "Player 2’s pick",
    );
    await expect(page.locator(".draft-offers .draft-card")).toHaveCount(2);
    for (let pick = 1; pick < handSize(size) * 2; pick++) {
      if (pick % 2 === 0)
        await expect(page.locator(".draft-status")).toContainText(
          `Player ${(Math.floor(pick / 2) % 2) + 1}’s pick`,
        );
      await page
        .getByRole("button", { name: /^Pick .+$/ })
        .first()
        .click();
    }
    await expect(
      page.getByText("Draft complete", { exact: true }),
    ).toBeVisible();
    const draft = await stored(page);
    expect(draft.hands.map((hand) => hand.length)).toEqual([
      handSize(size),
      handSize(size),
    ]);
    expect(draft.discarded).toHaveLength(handSize(size));
    await page.getByRole("button", { name: "Play drafted match" }).click();
    await expect(
      page.getByRole("heading", { name: "Draft showdown." }),
    ).toBeVisible();
    await expect(page.locator(".board-cell")).toHaveCount(size * size);
    await expect(page.locator(".hand-card-button")).toHaveCount(handSize(size));
    for (const id of draft.hands[0])
      await expect(
        page.locator(".hand-card-button").filter({
          hasText: draft.cards.find((card) => card.id === id)!.name,
        }),
      ).toHaveCount(1);
    for (let turn = 0; turn < size * size; turn++) {
      await page.locator(".hand-card-button").first().click();
      await page.locator(".board-cell.empty:enabled").first().click();
      // Resolve any printed targeted keywords in the drafted hand.
      while (await page.locator(".target-cell.available").count()) {
        await page.locator(".target-cell.available").first().click();
        const sides = page
          .getByRole("group", { name: "Choose the edge that loses pips" })
          .locator("button:enabled");
        if (await sides.count()) await sides.first().click();
      }
      await expect(page.locator(".board-cell.filled")).toHaveCount(turn + 1);
    }
    await expect(page.locator(".result-card")).toBeVisible();
    await page.getByRole("button", { name: /^Collection/ }).click();
    await expect(page.locator(".collection-card-button")).toHaveCount(221);
    expect(errors).toEqual([]);
  });
test("draft setup changes board size and card inspection explains Dizzy without selecting it", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Draft", exact: true }).click();
  await page.getByLabel("Draft board size").selectOption("4");
  await expect(page.locator(".draft-setup")).toContainText(
    "Each player nominates 9",
  );
  await page.getByRole("button", { name: "Start draft", exact: true }).click();
  const dizzy = page
    .locator(".draft-card")
    .filter({ hasText: "Dizzy" })
    .first();
  await dizzy.locator(".draft-preview").hover();
  await expect(page.getByRole("tooltip")).toContainText(
    "at most 5 pips per edge",
  );
  await dizzy.locator(".draft-preview").click();
  await expect(page.getByRole("dialog")).toContainText("Dizzy");
  await page.keyboard.press("Escape");
  expect((await stored(page)).nominations).toEqual([[], []]);
  await page.getByRole("button", { name: "New draft", exact: true }).click();
  await page.getByLabel("Draft board size").selectOption("3");
  await page
    .getByRole("button", { name: "Start new draft", exact: true })
    .click();
  expect((await stored(page)).size).toBe(3);
});
test("draft grid and offers fit a phone screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Draft", exact: true }).click();
  await page.getByRole("button", { name: "Start draft", exact: true }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "/tmp/skystones-draft-mobile.png",
    fullPage: false,
  });
});
