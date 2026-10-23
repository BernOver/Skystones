import { expect, test } from "@playwright/test";

for (const restriction of ["randomUUID", "crypto"] as const) {
  test(`game and card studio work without ${restriction}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript((feature) => {
      if (feature === "randomUUID") {
        Object.defineProperty(window.crypto, "randomUUID", {
          value: undefined,
          configurable: true,
        });
      } else {
        Object.defineProperty(window, "crypto", {
          value: undefined,
          configurable: true,
        });
      }
    }, restriction);
    await page.goto("/");
    await expect(page.locator(".board-cell")).toHaveCount(9);
    await page.locator(".hand-card-button").first().click();
    await page.locator(".board-cell.empty:enabled").first().click();
    await expect(page.locator(".board-cell.filled")).toHaveCount(2);
    await page
      .getByRole("button", { name: "Card studio", exact: true })
      .click();
    await page.getByLabel("Stone name").fill("Preview Friend");
    await page
      .getByRole("button", { name: "Save to collection", exact: true })
      .click();
    await expect(page.locator(".toast")).toContainText(
      "Preview Friend is saved",
    );
    await page.getByRole("button", { name: "Back to collection" }).click();
    await expect(
      page.getByRole("button", { name: "View Preview Friend" }),
    ).toBeVisible();
    await page.getByLabel("Import card file").setInputFiles({
      name: "preview.skystone.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({
          format: "skystones-card",
          version: 1,
          card: {
            id: "custom-preview-import",
            name: "Imported Preview Friend",
            description: "A friend from a restricted preview.",
            element: "magic",
            creature: "dragon",
            edges: [2, 2, 2, 2],
            custom: true,
          },
        }),
      ),
    });
    await expect(
      page.getByRole("button", { name: "View Imported Preview Friend" }),
    ).toBeVisible();
    await page.reload();
    await page.getByRole("button", { name: /^Collection/ }).click();
    await expect(
      page.getByRole("button", { name: "View Imported Preview Friend" }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });
}
