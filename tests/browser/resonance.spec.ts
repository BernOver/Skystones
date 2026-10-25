import { expect, test } from "@playwright/test";

test("choose a Resonance element and side, save, export, import, and change keyword type", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Card studio", exact: true }).click();
  await page.getByLabel("Stone name").fill("Resonant Fox");
  await page.getByRole("button", { name: "Add keyword", exact: false }).click();
  await page.getByLabel("Keyword 1", { exact: true }).selectOption("resonance");
  await page.getByLabel("Counted element 1").selectOption("fire");
  await page.getByLabel("Affected edge 1").selectOption("1");
  await expect(page.locator(".preview-card")).toContainText("Resonance Fire");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Save to collection", exact: true })
    .click();
  await page.reload();
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page.getByRole("button", { name: "View Resonant Fox" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Count both players’ cards",
  );
  await expect(
    page.getByRole("dialog").locator(".resonance-rule-row"),
  ).toContainText("Fire");
  await expect(
    page.getByRole("dialog").locator(".resonance-rule-row"),
  ).toContainText("East edge");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export card file" }).click();
  const download = await pending;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const json = Buffer.concat(chunks);
  expect(JSON.parse(json.toString()).card.keywords).toEqual([
    { type: "resonance", side: 1, element: "fire" },
  ]);
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page
    .getByLabel("Import card file")
    .setInputFiles({
      name: "resonant.skystone.json",
      mimeType: "application/json",
      buffer: json,
    });
  await expect(
    page.getByRole("button", { name: "View Resonant Fox" }),
  ).toHaveCount(2);
  await page.getByRole("button", { name: "View Resonant Fox" }).first().click();
  await page.getByRole("button", { name: "Edit stone" }).click();
  await expect(page.getByLabel("Counted element 1")).toHaveValue("fire");
  await page
    .getByLabel("Keyword 1", { exact: true })
    .selectOption("head-start");
  await expect(page.getByLabel("Counted element 1")).toHaveCount(0);
  await page.getByRole("button", { name: "Save changes" }).click();
  const saved = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("skystones-library-v1")!).custom[0]
        .keywords,
  );
  expect(saved).toEqual([{ type: "head-start", side: 1 }]);
});

test("hand previews count three matching cards and the board keeps that count when a fourth arrives", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
    const make = (id: string, name: string, element: string) => ({
      id,
      name,
      element,
      creature: "fox",
      edges: [0, 0, 0, 0],
      description: "A test stone.",
      custom: true,
    });
    const custom = [
      make("custom-fire-a", "Fire A", "fire"),
      make("custom-fire-b", "Fire B", "fire"),
      make("custom-fire-c", "Fire C", "fire"),
      {
        ...make("custom-echo", "Fire Echo", "water"),
        edges: [1, 2, 1, 1],
        keywords: [{ type: "resonance", side: 1, element: "fire" }],
      },
      make("custom-last", "Last Stone", "earth"),
    ];
    localStorage.setItem(
      "skystones-library-v1",
      JSON.stringify({
        custom,
        deck: custom.map((card) => card.id),
        sound: false,
      }),
    );
  });
  await page.goto("/");
  await page.getByRole("button", { name: "New match", exact: true }).click();
  await page.getByRole("button", { name: /Bring a friend/ }).click();
  await page.getByRole("button", { name: "Find a little magic" }).click();
  const sequence: [string, string][] = [
    ["Fire A", "A1"],
    ["Whirlwind", "C3"],
    ["Fire B", "A2"],
    ["Shroomboom", "C2"],
    ["Fire C", "A3"],
    ["Jet-Vac", "C1"],
  ];
  for (const [name, square] of sequence) {
    await page
      .getByRole("button", { name: new RegExp(`^Select ${name},`) })
      .click();
    await page
      .getByRole("button", { name: `${square}, empty square`, exact: true })
      .click();
  }
  const echo = page.getByRole("button", { name: /^Select Fire Echo,/ });
  await echo.hover();
  await expect(echo.locator(".edge-1 b")).toHaveText("5");
  await expect(
    page.getByRole("tooltip").locator(".resonance-amount b"),
  ).toHaveText("+3");
  await expect(page.getByRole("tooltip")).toContainText(
    "3 matching · if played now",
  );
  await echo.click();
  await page
    .getByRole("button", { name: "B1, empty square", exact: true })
    .click();
  await page.getByRole("button", { name: /^Select Flameslinger,/ }).click();
  await page
    .getByRole("button", { name: "B2, empty square", exact: true })
    .click();
  const placed = page
    .locator(".board-cell.filled")
    .filter({ hasText: "Fire Echo" });
  await expect(placed.locator(".edge-1 b")).toHaveText("5");
  await placed.hover();
  await expect(
    page.getByRole("tooltip").locator(".resonance-amount b"),
  ).toHaveText("+3");
  await expect(page.getByRole("tooltip")).toContainText(
    "3 matching · locked in",
  );
  await expect(
    page.getByRole("tooltip").locator(".stat-boosted"),
  ).toContainText("2 + 3");
  await placed.click();
  await expect(
    page.getByRole("dialog", { name: "Inspect Fire Echo" }),
  ).toContainText("Later cards and captures do not change it");
});
