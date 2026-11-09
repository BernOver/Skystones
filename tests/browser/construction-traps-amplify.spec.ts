import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { STARTER_STONES, handSize } from "../../src/game.ts";
import type { Stone } from "../../src/game.ts";
import {
  ADVENTURE_STORAGE,
  newAdventure,
  enterAdventureNode,
  validateAdventure,
} from "../../src/adventure.ts";
if (process.env.SKYSTONES_STANDALONE === "1") {
  const html = readFileSync("standalone/Skystones.html", "utf8");
  test.beforeEach(async ({ page }) => {
    const unexpected: string[] = [];
    (page as Page & { unexpected: string[] }).unexpected = unexpected;
    await page.route("**/*", (route) => {
      if (route.request().url() === "http://127.0.0.1:5173/")
        return route.fulfill({
          status: 200,
          contentType: "text/html",
          body: html,
        });
      unexpected.push(route.request().url());
      return route.abort();
    });
  });
  test.afterEach(({ page }) =>
    expect((page as Page & { unexpected: string[] }).unexpected).toEqual([]),
  );
}
test.beforeEach(({ page }) =>
  page.on("pageerror", (error) => {
    throw error;
  }),
);
const builder: Stone = {
  ...STARTER_STONES[0],
  id: "custom-workshop-builder",
  name: "Workshop Builder",
  element: "fire",
  edges: [1, 1, 1, 1],
  keywords: [
    { type: "assemble", count: 2 },
    { type: "amplify", effect: "shield", duration: "next", count: 1 },
  ],
  custom: true,
};
async function targets(page: Page) {
  while (await page.locator(".target-cell.available").count()) {
    await page.locator(".target-cell.available").first().click();
    const sides = page
      .getByRole("group", { name: "Choose the edge that loses pips" })
      .locator("button:enabled");
    if (await sides.count()) await sides.first().click();
  }
}
async function local(page: Page, size: 3 | 4 = 3, cards?: Stone[]) {
  const custom = cards || [
    builder,
    ...Array.from({ length: handSize(size) - 1 }, (_, i) => ({
      ...STARTER_STONES[0],
      id: `custom-workshop-filler-${i}`,
      name: `Workshop Filler ${i}`,
      edges: [1, 1, 1, 1] as Stone["edges"],
      keywords: [],
      custom: true,
    })),
  ];
  await page.addInitScript(
    (data) =>
      localStorage.setItem("skystones-library-v1", JSON.stringify(data)),
    { custom, deck: custom.map((c) => c.id), boardSize: size, sound: false },
  );
  await page.goto("/");
  await page.getByRole("button", { name: "New match", exact: true }).click();
  await page.getByRole("button", { name: /Bring a friend/ }).click();
  await page
    .getByRole("button", { name: "Find a little magic", exact: true })
    .click();
}

test("maker exposes Unique, Parts, Assemble and next-use Amplify, and all vehicle images can be selected", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Card studio/ }).click();
  await page
    .getByLabel("Unique card · excluded from normal Conjure", { exact: true })
    .check();
  await page.getByLabel("Find a character portrait").fill("Hot Streak");
  await page
    .getByRole("button", { name: "Use Hot Streak portrait", exact: true })
    .click();
  await expect(page.getByLabel("Stone name")).toHaveValue("Hot Streak");
  const img = page
    .getByRole("button", { name: "Use Hot Streak portrait", exact: true })
    .locator("img");
  await expect(img).toBeVisible();
  expect(
    await img.evaluate((el) => (el as HTMLImageElement).naturalWidth),
  ).toBeGreaterThan(0);
  await page.getByLabel("Stone name").fill("Unique Mechanic");
  await page.getByRole("button", { name: /Add keyword/ }).click();
  await page.getByLabel("Keyword 1", { exact: true }).selectOption("assemble");
  await page
    .getByLabel("Assemble count · Keyword 1", { exact: true })
    .selectOption("2");
  await page.getByRole("button", { name: /Add keyword/ }).click();
  await page.getByLabel("Keyword 2", { exact: true }).selectOption("amplify");
  await page
    .getByLabel("Amplify effect · Keyword 2", { exact: true })
    .selectOption("assemble");
  await page
    .getByLabel("Amplify uses · Keyword 2", { exact: true })
    .selectOption("3");
  await page
    .getByRole("button", { name: "Save to collection", exact: true })
    .click();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("skystones-library-v1")!).custom.find(
      (c: Stone) => c.name === "Unique Mechanic",
    ),
  );
  expect(saved.unique).toBe(true);
  expect(saved.token).toBeUndefined();
  expect(saved.keywords).toEqual([
    { type: "assemble", count: 2 },
    { type: "amplify", effect: "assemble", duration: "next", count: 3 },
  ]);
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page.getByRole("button", { name: /^Unique/ }).click();
  await expect(page.locator(".collection-item")).toHaveCount(1);
  await expect(
    page.getByRole("button", {
      name: "Add Unique Mechanic to deck",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^Tokens/ }).click();
  await page
    .getByRole("button", { name: "Create a token", exact: true })
    .click();
  await page.getByLabel("Part token · Assemble pool", { exact: true }).check();
  await page.getByLabel("Stone name").fill("Custom Engine");
  await page
    .getByRole("button", { name: "Save token template", exact: true })
    .click();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("skystones-library-v1")!).custom.find(
          (c: Stone) => c.name === "Custom Engine",
        ).part,
    ),
  ).toBe(true);
});

test("custom Trap editor saves a shared effect and normal play replaces the active crystal", async ({
  page,
}) => {
  await local(page);
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page.getByRole("button", { name: "Traps", exact: true }).click();
  await expect(page.locator(".trap-grid article")).toHaveCount(11);
  await page
    .getByRole("button", { name: "Create a Trap", exact: true })
    .click();
  await page
    .getByLabel("Trap name", { exact: true })
    .fill("Shared Fire Crystal");
  await page
    .getByLabel("Trap matching element", { exact: true })
    .selectOption("fire");
  await page.getByLabel("Trap pips 1", { exact: true }).fill("2");
  await page.getByRole("button", { name: "Save Trap", exact: true }).click();
  await expect(page.locator(".trap-grid article")).toHaveCount(12);
  await page.getByRole("button", { name: "The table", exact: true }).click();
  const custom = await page.evaluate(
    () => JSON.parse(localStorage.getItem("skystones-traps-v1")!)[0],
  );
  await page.getByLabel("Choose Trap", { exact: true }).selectOption(custom.id);
  await page
    .getByRole("button", { name: "Activate Trap", exact: true })
    .click();
  await expect(page.locator(".trap-panel")).toContainText(
    "Shared Fire Crystal",
  );
  await expect(
    page.getByRole("button", {
      name: /^Select Workshop Builder, current strengths north, east, south, west: 3, 3, 3, 3/,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Activate Trap", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: /^Select Workshop Builder,/ }).click();
  await page.locator("#board-0").click();
  await page
    .getByLabel("Choose Trap", { exact: true })
    .selectOption("trap-water");
  await page
    .getByRole("button", { name: "Activate Trap", exact: true })
    .click();
  await expect(page.locator(".trap-panel")).toContainText("Water Tiki");
  await expect(page.locator("#board-0")).toHaveAttribute(
    "aria-label",
    /edges north 1, east 1, south 1, west 1/,
  );
  await page.setViewportSize({ width: 390, height: 1000 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

for (const size of [3, 4] as const)
  test(`${size}×${size} local Assemble creates a pictured Flash vehicle, keeps the turn and Trap allowance, and covering ends the turn`, async ({
    page,
  }) => {
    await local(page, size);
    await page
      .getByRole("button", { name: /^Select Workshop Builder,/ })
      .click();
    await page.locator("#board-0").click();
    await page.locator(".hand-card-button").first().click();
    await page.locator(`#board-${size * size - 1}`).click();
    await targets(page);
    const vehicle = page.locator(".hand-card-button").filter({
      has: page.locator(".stone-tribes").filter({ hasText: "Supercharger" }),
    });
    await expect(vehicle).toHaveCount(1);
    await expect(vehicle.locator("img").first()).toBeVisible();
    await page
      .getByRole("button", { name: "Activate Trap", exact: true })
      .click();
    await vehicle.click();
    await page.locator("#board-1").click();
    await targets(page);
    await expect(page.locator("#board-1")).toContainText("Supercharger");
    await expect(
      page.getByRole("button", { name: "Activate Trap", exact: true }),
    ).toBeDisabled();
    await expect(page.locator(".hand-card-button").first()).toHaveAttribute(
      "aria-label",
      /^Select Workshop Filler/,
    );
    await page.locator(".hand-card-button").first().click();
    await page.locator("#board-1").click();
    await targets(page);
    await expect(page.locator("#board-1 .supercharger-cover")).toHaveCount(0);
    await expect(page.locator(".hand-card-button").first()).not.toHaveAttribute(
      "aria-label",
      /^Select Workshop Filler/,
    );
    await expect(page.locator(".game-board .filled")).toHaveCount(3);
  });

test("normal next Amplify waits, doubles one Sunder target dialog, then disappears", async ({
  page,
}) => {
  const cards = [
    {
      ...builder,
      name: "Echo Queue",
      keywords: [
        { type: "amplify", effect: "sunder", duration: "next", count: 1 },
      ],
    },
    ...Array.from({ length: 4 }, (_, i) => ({
      ...builder,
      id: `custom-breaker-${i}`,
      name: `Breaker ${i}`,
      keywords: [{ type: "sunder", side: 0 }],
    })),
  ] as Stone[];
  await local(page, 3, cards);
  await page.getByRole("button", { name: /^Select Echo Queue,/ }).click();
  await page.locator("#board-0").click();
  await page.locator(".hand-card-button").first().click();
  await page.locator("#board-8").click();
  await targets(page);
  await expect(
    page.getByLabel("Ready Amplify effects", { exact: true }),
  ).toContainText("1 use ready");
  await page.getByRole("button", { name: /^Select Breaker 0,/ }).click();
  await page.locator("#board-1").click();
  await expect(page.getByRole("dialog")).toContainText("up to 2");
  await targets(page);
  await expect(
    page.getByLabel("Ready Amplify effects", { exact: true }),
  ).toHaveCount(0);
});

test("Unique Conjure sharing exports and imports the actual Unique dependency and offers the explicit source", async ({
  page,
}) => {
  const unique: Stone = {
    ...builder,
    id: "custom-unique-gadget",
    name: "Unique Gadget",
    unique: true,
    keywords: [{ type: "shield", side: 0 }],
  };
  const caller: Stone = {
    ...builder,
    id: "custom-unique-caller",
    name: "Unique Caller",
    keywords: [
      {
        type: "conjure",
        mode: "unique",
        unique: unique.id,
        count: 1,
        recipient: "self",
      },
    ],
  };
  await page.addInitScript(
    (cards) =>
      localStorage.setItem(
        "skystones-library-v1",
        JSON.stringify({ custom: cards, deck: [], sound: false }),
      ),
    [unique, caller],
  );
  await page.goto("/");
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page
    .getByRole("button", { name: "View Unique Caller", exact: true })
    .click();
  const waiting = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export card file", exact: true })
    .click();
  const stream = await (await waiting).createReadStream(),
    chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const buffer = Buffer.concat(chunks);
  expect(JSON.parse(buffer.toString()).uniques).toEqual([unique]);
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.getByLabel("Import card file").setInputFiles({
    name: "unique-caller.skystone.json",
    mimeType: "application/json",
    buffer,
  });
  await expect(page.locator(".toast")).toContainText(
    "has joined your collection",
  );
  await page
    .getByRole("button", { name: "View Unique Caller", exact: true })
    .last()
    .click();
  await page.getByRole("button", { name: "Edit stone", exact: true }).click();
  await expect(
    page.getByLabel("Card source · Keyword 1", { exact: true }),
  ).toHaveValue("unique");
  await expect(
    page.getByLabel("Specified Unique card · Keyword 1", { exact: true }),
  ).toHaveValue(unique.id);
});

test("Adventure saves the shared Trap and pictured Supercharger through Flash, covering and reload", async ({
  page,
}) => {
  let run = enterAdventureNode(newAdventure(3, 81), "moss");
  const first = { ...run.battle!.hands[0][0], keywords: builder.keywords };
  run = {
    ...run,
    battle: {
      ...run.battle!,
      hands: [[first, ...run.battle!.hands[0].slice(1)], run.battle!.hands[1]],
    },
  };
  await page.addInitScript(
    ({ key, data }) =>
      !localStorage.getItem(key) &&
      localStorage.setItem(key, JSON.stringify(data)),
    { key: ADVENTURE_STORAGE, data: run },
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Adventure", exact: true }).click();
  await page
    .getByRole("button", { name: "Activate Trap", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: new RegExp("^Select " + first.name + ", adventure card"),
    })
    .click();
  await page.locator("#adventure-board-0").click();
  await targets(page);
  const vehicle = page.locator(".run-hand-card").filter({
    has: page.locator(".stone-tribes").filter({ hasText: "Supercharger" }),
  });
  await expect(vehicle).toBeEnabled({ timeout: 15000 });
  const placement = await page
    .locator(".adventure-square.vacant")
    .first()
    .getAttribute("id");
  await vehicle.click();
  await page.locator("#" + placement).click();
  await targets(page);
  await expect(page.locator("#" + placement)).toContainText("Supercharger");
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    ADVENTURE_STORAGE,
  );
  expect(validateAdventure(saved)).toBe(true);
  expect(saved.battle.current).toBe(0);
  expect(saved.battle.traps.active).toBeTruthy();
  await page.reload();
  await page.getByRole("button", { name: "Adventure", exact: true }).click();
  await expect(page.locator("#" + placement)).toContainText("Supercharger");
  await page.locator(".run-hand-card:enabled").first().click();
  await page.locator("#" + placement).click();
  await targets(page);
  await expect(
    page.locator("#" + placement + " .supercharger-cover"),
  ).toHaveCount(0);
});

test("an imported Unique card can explicitly Conjure itself without losing its stable reference", async ({
  page,
}) => {
  const unique: Stone = {
    ...builder,
    id: "custom-unique-loop",
    name: "Unique Loop",
    unique: true,
    keywords: [
      {
        type: "conjure",
        mode: "unique",
        unique: "custom-unique-loop",
        count: 1,
        recipient: "self",
      },
    ],
  };
  await page.goto("/");
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page
    .getByLabel("Import card file")
    .setInputFiles({
      name: "unique-loop.skystone.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({ format: "skystones-card", version: 1, card: unique }),
      ),
    });
  await expect(page.locator(".toast")).toContainText(
    "has joined your collection",
  );
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("skystones-library-v1")!).custom.find(
      (c: Stone) => c.name === "Unique Loop",
    ),
  );
  expect(saved.id).toBe(unique.id);
  expect(saved.keywords[0].unique).toBe(unique.id);
  await page
    .getByRole("button", { name: "View Unique Loop", exact: true })
    .click();
  const waiting = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export card file", exact: true })
    .click();
  const stream = await (await waiting).createReadStream(),
    chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const payload = JSON.parse(Buffer.concat(chunks).toString());
  expect(payload.card.id).toBe(unique.id);
  expect(payload.uniques).toBeUndefined();
});
