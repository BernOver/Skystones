import { expect, test } from "@playwright/test";

test("play a complete match against Willow and start again", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  for (let turn = 0; turn < 5; turn++) {
    await expect(page.locator(".hand-card-button").first()).toBeEnabled();
    await page.locator(".hand-card-button").first().click();
    await page.locator(".board-cell.empty:enabled").first().click();
    if (turn < 4)
      await expect(page.locator(".board-cell.filled")).toHaveCount(
        (turn + 1) * 2,
      );
  }
  await expect(page.locator(".board-cell.filled")).toHaveCount(9);
  await expect(page.locator(".result-card")).toBeVisible();
  const scores = await page.locator(".score-display strong").allTextContents();
  expect(scores.map(Number).reduce((a, b) => a + b)).toBe(9);
  await page.getByRole("button", { name: "Another round" }).click();
  await page.getByRole("button", { name: "Find a little magic" }).click();
  await expect(page.locator(".board-cell.empty")).toHaveCount(9);
  expect(errors).toEqual([]);
});

test("local two-player mode alternates hands and finishes a match", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New match", exact: true }).click();
  await page.getByRole("button", { name: /Bring a friend/ }).click();
  await page.getByRole("button", { name: "Find a little magic" }).click();
  for (let turn = 0; turn < 9; turn++) {
    await expect(page.locator(".turn-indicator")).toContainText(
      turn % 2 ? "Player two" : "Player one",
    );
    await page.locator(".hand-card-button").first().click();
    await page.locator(".board-cell.empty:enabled").first().click();
  }
  await expect(page.locator(".result-card")).toBeVisible();
});

test("Willow can start and a replaced match cancels the old computer turn", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New match", exact: true }).click();
  await page.getByLabel("Who makes the first move?").selectOption("1");
  await page.getByRole("button", { name: "Find a little magic" }).click();
  await expect(page.locator(".board-cell.filled")).toHaveCount(1);
  await expect(page.locator(".turn-indicator")).toContainText("Your move");
  await page.locator(".hand-card-button").first().click();
  await page.locator(".board-cell.empty:enabled").first().click();
  await page.getByRole("button", { name: "New match", exact: true }).click();
  await page.getByRole("button", { name: /Bring a friend/ }).click();
  await page.getByLabel("Who makes the first move?").selectOption("0");
  await page.getByRole("button", { name: "Find a little magic" }).click();
  // Let any timer from the old match expire; the replacement board must remain empty.
  await page.waitForTimeout(1000);
  await expect(page.locator(".board-cell.filled")).toHaveCount(0);
  await expect(page.locator(".turn-indicator")).toContainText("Player one");
});

test("create a card, enforce its budget, persist it, and use it in a deck", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Card studio", exact: true }).click();
  await page.getByLabel("Stone name").fill("Little Thunder");
  await page
    .getByLabel("A tiny backstory")
    .fill("Small paws, enormous thunderclouds.");
  await page.getByRole("button", { name: "Use Scratch portrait" }).click();
  await page.getByRole("button", { name: "Air", exact: true }).click();
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "Increase north strength" }).click();
  await page.getByRole("button", { name: "Increase east strength" }).click();
  await expect(
    page.getByRole("button", { name: "Increase south strength" }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Save to collection", exact: true })
    .click();
  await expect(page.locator(".toast")).toContainText("Little Thunder is saved");
  await page.reload();
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page.getByRole("button", { name: "My creations" }).click();
  await expect(
    page.getByRole("heading", { name: "Little Thunder" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Remove Spyro from deck" })
    .click();
  await page
    .getByRole("button", { name: "Add Little Thunder to deck" })
    .click();
  await page.getByRole("button", { name: "Let’s play" }).click();
  await page.getByRole("button", { name: "Find a little magic" }).click();
  await expect(
    page.getByRole("button", { name: /^Select Little Thunder/ }),
  ).toBeVisible();
});

test("export a custom card as JSON and a real PNG, then import the file", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Card studio", exact: true }).click();
  await page.getByLabel("Stone name").fill("Pocket Dragon");
  await page
    .getByRole("button", { name: "Save to collection", exact: true })
    .click();
  const imageDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download card image" }).click();
  const image = await imageDownload;
  expect(image.suggestedFilename()).toBe("pocket-dragon.png");
  const stream = await image.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const png = Buffer.concat(chunks);
  expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  expect(png.length).toBeGreaterThan(10000);
  await page.getByRole("button", { name: "Back to collection" }).click();
  await page.getByRole("button", { name: "View Pocket Dragon" }).click();
  const cardDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export card file" }).click();
  const card = await cardDownload;
  const cardStream = await card.createReadStream();
  const jsonChunks: Buffer[] = [];
  for await (const chunk of cardStream!) jsonChunks.push(chunk);
  const json = Buffer.concat(jsonChunks);
  expect(JSON.parse(json.toString()).card.name).toBe("Pocket Dragon");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByLabel("Import card file").setInputFiles({
    name: "pocket-dragon.skystone.json",
    mimeType: "application/json",
    buffer: json,
  });
  await expect(
    page.getByRole("button", { name: "View Pocket Dragon" }),
  ).toHaveCount(2);
});

test("uploaded artwork is previewed and persists after a reload", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Card studio", exact: true }).click();
  await page.getByLabel("Stone name").fill("Art Friend");
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=",
    "base64",
  );
  await page
    .getByLabel("Upload card artwork")
    .setInputFiles({ name: "art.png", mimeType: "image/png", buffer: png });
  await expect(page.locator(".preview-card img.uploaded-art")).toBeVisible();
  await page
    .getByRole("button", { name: "Save to collection", exact: true })
    .click();
  await page.reload();
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page.getByRole("button", { name: "View Art Friend" }).click();
  await expect(page.locator(".detail-card img.uploaded-art")).toBeVisible();
});

test("reject invalid imports, filter collections, and edit and delete creations", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Import card file").setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"format":"unknown"}'),
  });
  await expect(page.locator(".toast")).toContainText(
    "not a valid Skystones card",
  );
  await page.getByRole("button", { name: "Card studio", exact: true }).click();
  await page.getByLabel("Stone name").fill("First Name");
  await page
    .getByRole("button", { name: "Save to collection", exact: true })
    .click();
  await page.getByLabel("Stone name").fill("Better Name");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.getByRole("button", { name: "Back to collection" }).click();
  await page.getByLabel("Search stones").fill("Better");
  await expect(page.locator(".collection-item")).toHaveCount(1);
  await page.getByLabel("Filter by element").selectOption("fire");
  await expect(page.locator(".collection-empty")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await page.getByRole("button", { name: "View Better Name" }).click();
  await page.getByRole("button", { name: "Delete Better Name" }).click();
  await page.getByRole("button", { name: "Delete stone", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "View Better Name" }),
  ).toHaveCount(0);
});

test("rules dialog supports keyboard dismissal and returns focus", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "How to play" }).click();
  await expect(page.getByRole("dialog", { name: "How to play" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "How to play" })).toBeFocused();
});

test("table, collection and studio fit phone and desktop screens", async ({
  page,
}) => {
  for (const width of [360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    for (const name of ["The table", /^Collection/, "Card studio"]) {
      await page.getByRole("navigation").getByRole("button", { name }).click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  }
});

test("an incomplete saved deck cannot strand the initial practice match", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page
    .locator(".deck-slots")
    .getByRole("button", { name: "Remove Spyro from deck" })
    .click();
  await page.reload();
  await expect(page.locator(".hand-card-button")).toHaveCount(5);
  await page.getByRole("button", { name: /^Collection/ }).click();
  await expect(page.locator(".deck-count")).toContainText("4 / 5");
  await expect(page.getByRole("button", { name: "Let’s play" })).toBeDisabled();
});
