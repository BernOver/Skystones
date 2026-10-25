import { expect, test } from "@playwright/test";

test("hover and keyboard focus enlarge hand cards and explain keywords and flavor text", async ({
  page,
}) => {
  await page.goto("/");
  const handCard = page.getByRole("button", { name: /^Select Spyro/ });
  await handCard.hover();
  const tooltip = page.getByRole("tooltip");
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText("Head Start");
  await expect(tooltip).toContainText("winning before placement");
  await expect(tooltip).toContainText(
    "Will not activate with the current score",
  );
  await expect(tooltip).toContainText(
    "Pips adapt the character",
  );
  await expect(tooltip).toContainText("Flavor text — no gameplay effect");
  const normal = await handCard.boundingBox();
  const large = await tooltip.locator(".stone-card").boundingBox();
  expect(large!.width).toBeGreaterThan(normal!.width);
  await expect(page.locator(".board-cell.filled")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(tooltip).toHaveCount(0);
  await page.mouse.move(0, 0);
  await page.keyboard.press("Tab");
  await handCard.focus();
  await expect(tooltip).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(tooltip).toHaveCount(0);
});

test("Comeback activates before placement and stays visible on a board card after the score changes", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New match", exact: true }).click();
  await page.getByLabel("Who makes the first move?").selectOption("1");
  await page.getByRole("button", { name: "Find a little magic" }).click();
  await expect(page.locator(".board-cell.filled")).toHaveCount(1);
  const mossback = page.getByRole("button", { name: /^Select Stump Smash/ });
  await mossback.hover();
  await expect(page.getByRole("tooltip")).toContainText(
    "Will activate if played now",
  );
  await expect(mossback.locator(".edge-0 b")).toHaveText("2");
  await mossback.click();
  await page.locator(".board-cell.empty:enabled").first().click();
  await expect(page.locator(".board-cell.filled")).toHaveCount(3);
  const boardCard = page
    .locator(".board-cell.filled")
    .filter({ hasText: "Stump Smash" });
  await boardCard.hover();
  await expect(page.getByRole("tooltip")).toContainText(
    "Activated when played · bonus locked in",
  );
  await expect(page.getByRole("tooltip")).toContainText("Played by You");
  await expect(boardCard.locator(".edge-0 b")).toHaveText("2");
  await boardCard.click();
  await expect(
    page.getByRole("dialog", { name: "Inspect Stump Smash" }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("Comeback");
  await expect(page.getByRole("dialog")).toContainText(
    "losing before placement",
  );
  await page.getByRole("button", { name: "Back to the table" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("custom directional keywords save, export, import and reopen for editing", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Card studio", exact: true }).click();
  await page.getByLabel("Stone name").fill("Turning Tide");
  await page.getByRole("button", { name: "Add keyword", exact: false }).click();
  await page.getByRole("button", { name: "Add keyword", exact: false }).click();
  await page.getByLabel("Keyword 2", { exact: true }).selectOption("comeback");
  await page.getByLabel("Affected edge 2").selectOption("3");
  await page.getByLabel("Affected edge 1").selectOption("1");
  await expect(page.locator(".preview-card")).toContainText("Head Start");
  await expect(page.locator(".preview-card")).toContainText("Comeback");
  await page
    .getByRole("button", { name: "Save to collection", exact: true })
    .click();
  await page.reload();
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page.getByRole("button", { name: "View Turning Tide" }).click();
  await expect(page.getByRole("dialog")).toContainText("Head Start");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export card file" }).click();
  const download = await pending;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const json = Buffer.concat(chunks);
  expect(JSON.parse(json.toString()).card.keywords).toEqual([
    { type: "head-start", side: 1 },
    { type: "comeback", side: 3 },
  ]);
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page
    .getByLabel("Import card file")
    .setInputFiles({
      name: "turning-tide.skystone.json",
      mimeType: "application/json",
      buffer: json,
    });
  await expect(
    page.getByRole("button", { name: "View Turning Tide" }),
  ).toHaveCount(2);
  await page.getByRole("button", { name: "View Turning Tide" }).first().click();
  await page.getByRole("button", { name: "Edit stone" }).click();
  await expect(page.getByLabel("Keyword 1", { exact: true })).toHaveValue(
    "head-start",
  );
  await expect(page.getByLabel("Affected edge 2")).toHaveValue("3");
  await page.getByRole("button", { name: "Remove keyword 2" }).click();
  await expect(page.locator(".keyword-editor-row")).toHaveCount(1);
});

test.describe("touch inspection", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  test("select a hand card and inspect its keyword rules without hover", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /^Select Stump Smash/ }).tap();
    await expect(page.getByRole("tooltip")).toHaveCount(0);
    await page.getByRole("button", { name: "Inspect selected" }).tap();
    await expect(
      page.getByRole("dialog", { name: "Inspect Stump Smash" }),
    ).toBeVisible();
    await expect(page.getByRole("dialog")).toContainText("Comeback");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: "Close dialog" }).tap();
    await expect(
      page.getByRole("button", { name: /^Select Stump Smash/ }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
