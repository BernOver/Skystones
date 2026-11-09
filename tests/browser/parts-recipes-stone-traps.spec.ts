import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { STARTER_STONES } from "../../src/game.ts";
import type { Stone } from "../../src/game.ts";
import { DEFAULT_PARTS } from "../../src/assemble.ts";
import { DEFAULT_TRAPS } from "../../src/traps.ts";
import {
  ADVENTURE_STORAGE,
  enterAdventureNode,
  newAdventure,
  validateAdventure,
} from "../../src/adventure.ts";
import type { SuperchargerRecipe } from "../../src/recipes.ts";
if (process.env.SKYSTONES_STANDALONE === "1") {
  const html = readFileSync("standalone/Skystones.html", "utf8");
  test.beforeEach(async ({ page }) => {
    const external: string[] = [];
    (page as Page & { external: string[] }).external = external;
    await page.route("**/*", (r) => {
      if (r.request().url() === "http://127.0.0.1:5173/")
        return r.fulfill({ status: 200, contentType: "text/html", body: html });
      external.push(r.request().url());
      return r.abort();
    });
  });
  test.afterEach(({ page }) =>
    expect((page as Page & { external: string[] }).external).toEqual([]),
  );
}
test.beforeEach(({ page }) =>
  page.on("pageerror", (e) => {
    throw e;
  }),
);
async function collection(page: Page) {
  await page.getByRole("button", { name: /^Collection/ }).click();
}
async function parts(page: Page) {
  await collection(page);
  await page.getByRole("button", { name: /^Parts & recipes/ }).click();
}
async function localStart(page: Page) {
  await page.getByRole("button", { name: "The table", exact: true }).click();
  await page.getByRole("button", { name: "New match", exact: true }).click();
  await page.getByRole("button", { name: /Bring a friend/ }).click();
  await page
    .getByRole("button", { name: "Find a little magic", exact: true })
    .click();
}
async function targets(page: Page) {
  while (await page.locator(".target-cell.available").count()) {
    await page.locator(".target-cell.available").first().click();
    const s = page
      .getByRole("group", { name: "Choose the edge that loses pips" })
      .locator("button:enabled");
    if (await s.count()) await s.first().click();
  }
}
async function downloadCard(page: Page) {
  const waiting = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export card file", exact: true })
    .click();
  const stream = await (await waiting).createReadStream(),
    chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  return Buffer.concat(chunks);
}

test("create and edit Parts, define a fixed recipe, generate the exact pair and share the complete recipe", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto("/");
  await parts(page);
  await expect(page.locator(".part-shortcuts button")).toHaveCount(6);
  await page
    .getByRole("button", { name: "Create a Part", exact: true })
    .click();
  await expect(
    page.getByLabel("Part token · Assemble pool", { exact: true }),
  ).toBeChecked();
  await page.getByLabel("Stone name").fill("Turbo Intake");
  await page.getByRole("button", { name: /Add keyword/ }).click();
  await page.getByLabel("Keyword 1", { exact: true }).selectOption("shield");
  await page.getByLabel("Shield pips 1", { exact: true }).fill("2");
  await page
    .getByRole("button", { name: "Save token template", exact: true })
    .click();
  const customPart: Stone = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("skystones-library-v1")!).custom.find(
      (c: Stone) => c.name === "Turbo Intake",
    ),
  );
  await parts(page);
  await page
    .getByRole("button", { name: "Edit Part: Blaze Engine", exact: true })
    .click();
  await page.getByLabel("Stone name").fill("Red Engine");
  await page
    .getByRole("button", { name: "Increase north strength", exact: true })
    .click();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await parts(page);
  await expect(
    page.getByRole("button", { name: "Edit Part: Red Engine", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Create a recipe", exact: true })
    .click();
  await page
    .getByLabel("Recipe Part 1", { exact: true })
    .selectOption(customPart.id);
  await page
    .getByLabel("Recipe Part 2", { exact: true })
    .selectOption(DEFAULT_PARTS[0].id);
  await page
    .getByLabel("Recipe vehicle portrait", { exact: true })
    .selectOption("vehicle-hot-streak");
  await page
    .getByLabel("Recipe Supercharger name", { exact: true })
    .fill("Custom Roadster");
  await page
    .getByLabel("Recipe Supercharger element", { exact: true })
    .selectOption("tech");
  await expect(page.locator(".recipe-preview")).toContainText(
    "Custom Roadster",
  );
  await expect(page.locator(".recipe-preview img").first()).toBeVisible();
  await page.locator(".parts-workshop").screenshot({path:"/tmp/skystones-parts-recipes.png"});
  await page.getByRole("button", { name: "Save recipe", exact: true }).click();
  await expect(
    page.getByLabel("Saved Supercharger recipes", { exact: true }),
  ).toContainText("Turbo Intake + Red Engine → Custom Roadster");
  await page.getByRole("button", { name: /^All stones/ }).click();
  await page
    .getByRole("button", { name: "Create a stone", exact: true })
    .click();
  await page.getByLabel("Stone name").fill("Roadster Builder");
  for (let i = 1; i <= 2; i++) {
    await page.getByRole("button", { name: /Add keyword/ }).click();
    await page
      .getByLabel(`Keyword ${i}`, { exact: true })
      .selectOption("assemble");
    await page
      .getByLabel(`Assemble count · Keyword ${i}`, { exact: true })
      .selectOption("1");
    await page
      .getByLabel(`Assemble source · Keyword ${i}`, { exact: true })
      .selectOption("specific");
    await page
      .getByLabel(`Assemble Part · Keyword ${i}`, { exact: true })
      .selectOption(i === 1 ? customPart.id : DEFAULT_PARTS[0].id);
  }
  await page
    .getByRole("button", { name: "Save to collection", exact: true })
    .click();
  await collection(page);
  await page.getByRole("button", { name: /^All stones/ }).click();
  await page
    .getByRole("button", { name: "View Roadster Builder", exact: true })
    .click();
  const buffer = await downloadCard(page),
    bundle = JSON.parse(buffer.toString());
  expect(bundle.recipes).toHaveLength(1);
  expect(bundle.tokens).toHaveLength(2);
  expect(
    bundle.tokens.find((c: Stone) => c.id === DEFAULT_PARTS[0].id).name,
  ).toBe("Red Engine");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await collection(page);
  await page.getByLabel("Import card file").setInputFiles({
    name: "roadster.skystone.json",
    mimeType: "application/json",
    buffer,
  });
  await expect(page.locator(".toast")).toContainText(
    "has joined your collection",
  );
  await parts(page);
  await expect(
    page.getByLabel("Saved Supercharger recipes", { exact: true }),
  ).toContainText("Custom Roadster");
  await page.evaluate((starter) => {
    const library = JSON.parse(localStorage.getItem("skystones-library-v1")!),
      builder = library.custom.find(
        (c: Stone) => c.name === "Roadster Builder",
      ),
      fillers = Array.from({ length: 4 }, (_, i) => ({
        ...starter,
        id: `custom-recipe-filler-${i}`,
        name: `Recipe filler ${i}`,
        keywords: [],
        custom: true,
      }));
    localStorage.setItem(
      "skystones-library-v1",
      JSON.stringify({
        custom: [...library.custom, ...fillers],
        deck: [builder.id, ...fillers.map((c) => c.id)],
        boardSize: 3,
        sound: false,
      }),
    );
  }, STARTER_STONES[0]);
  await page.reload();
  await localStart(page);
  await page.getByRole("button", { name: /^Select Roadster Builder,/ }).click();
  await page.locator("#board-0").click();
  await page.locator(".hand-card-button").filter({hasNot:page.locator(".keyword-discard, .keyword-combo, .keyword-flash")}).first().click();
  await page.locator("#board-8").click();
  await targets(page);
  const result = page.getByRole("button", { name: /^Select Custom Roadster,/ });
  await expect(result).toHaveCount(1);
  await expect(result.locator(".stone-tribes")).toContainText("Supercharger");
  await expect(result.locator("img").first()).toBeVisible();
  await page.setViewportSize({ width: 390, height: 1000 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("recipe editor handles invalid names and can update and delete a fixed result", async ({
  page,
}) => {
  await page.goto("/");
  await parts(page);
  await page
    .getByRole("button", { name: "Create a recipe", exact: true })
    .click();
  await page.getByLabel("Recipe Supercharger name", { exact: true }).fill("");
  await page.getByRole("button", { name: "Save recipe", exact: true }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await page
    .getByLabel("Recipe Supercharger name", { exact: true })
    .fill("Fixed Engine");
  await page.getByRole("button", { name: "Save recipe", exact: true }).click();
  await page
    .getByRole("button", { name: "Edit Fixed Engine recipe", exact: true })
    .click();
  await page
    .getByLabel("Recipe Supercharger name", { exact: true })
    .fill("Tuned Engine");
  await page.getByRole("button", { name: "Save recipe", exact: true }).click();
  await expect(
    page.getByLabel("Saved Supercharger recipes", { exact: true }),
  ).not.toContainText("Fixed Engine");
  await page
    .getByRole("button", { name: "Delete Tuned Engine recipe", exact: true })
    .click();
  await expect(
    page.getByLabel("Saved Supercharger recipes", { exact: true }),
  ).toContainText("No fixed recipes yet");
});

test("SWAP Force studio assigns the same keyword independently to top and bottom, displays both, and shares them", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Card studio/ }).click();
  await page.getByLabel("Find a character portrait").fill("Wash Buckler");
  await page
    .getByRole("button", { name: "Use Wash Buckler portrait", exact: true })
    .click();
  await page.getByLabel("Stone name").fill("Twin Shields");
  await page
    .getByRole("button", { name: "Add top-half keyword", exact: true })
    .click();
  await page.getByLabel("Keyword 1", { exact: true }).selectOption("shield");
  await page.getByLabel("Affected edge 1", { exact: true }).selectOption("0");
  await page
    .getByRole("button", { name: "Add bottom-half keyword", exact: true })
    .click();
  await page.getByLabel("Keyword 2", { exact: true }).selectOption("shield");
  await page.getByLabel("Affected edge 2", { exact: true }).selectOption("0");
  await page.getByLabel("Shield pips 2", { exact: true }).fill("2");
  await expect(page.getByLabel("Keyword half 1", { exact: true })).toHaveValue(
    "top",
  );
  await expect(page.getByLabel("Keyword half 2", { exact: true })).toHaveValue(
    "bottom",
  );
  await page
    .getByRole("button", { name: "Save to collection", exact: true })
    .click();
  const saved: Stone = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("skystones-library-v1")!).custom.find(
      (c: Stone) => c.name === "Twin Shields",
    ),
  );
  expect(saved.keywords!.filter((k) => k.type === "shield")).toHaveLength(2);
  expect(saved.keywords!.map((k) => k.half)).toEqual(["top", "bottom"]);
  await collection(page);
  await page
    .getByRole("button", { name: "View Twin Shields", exact: true })
    .click();
  await expect(page.locator(".card-dialog .keyword-shield")).toHaveCount(2);
  expect(
    JSON.parse((await downloadCard(page)).toString()).card.keywords.map(
      (k: { half: string }) => k.half,
    ),
  ).toEqual(["top", "bottom"]);
});

for (const size of [3, 4] as const)
  test(`${size}×${size} Adventure generates a fixed recipe, places its stone Trap, and restores both after reload`, async ({
    page,
  }) => {
    const recipe: SuperchargerRecipe = {
      id: "recipe-adventure-test",
      parts: [DEFAULT_PARTS[0].id, DEFAULT_PARTS[1].id],
      portrait: "vehicle-hot-streak",
      name: "Adventure Hot Streak",
      element: "tech",
    };
    let run = enterAdventureNode(newAdventure(size, 81), "moss");
    const first = {
      ...run.battle!.hands[0][0],
      keywords: [
        {
          type: "assemble",
          mode: "specific",
          part: DEFAULT_PARTS[0].id,
          count: 1,
        },
        {
          type: "assemble",
          mode: "specific",
          part: DEFAULT_PARTS[1].id,
          count: 1,
        },
        { type: "trap", trap: DEFAULT_TRAPS[0] },
      ] as Stone["keywords"],
    };
    run = {
      ...run,
      battle: {
        ...run.battle!,
        recipes: [recipe],
        hands: [
          [first, ...run.battle!.hands[0].slice(1)],
          run.battle!.hands[1],
        ],
      },
    };
    await page.addInitScript(
      ({ key, data }) => {
        if (!localStorage.getItem(key))
          localStorage.setItem(key, JSON.stringify(data));
      },
      { key: ADVENTURE_STORAGE, data: run },
    );
    await page.goto("/");
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    await expect(page.locator(".trap-panel")).toContainText("No active Trap");
    await expect(
      page.getByRole("button", { name: "Activate Trap", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", {
        name: new RegExp("^Select " + first.name + ", adventure card"),
      })
      .click();
    await page.locator("#adventure-board-0").click();
    await targets(page);
    await expect(page.locator(".trap-panel")).toContainText("Fire Tiki");
    await expect(
      page.getByRole("button", { name: /^Select Adventure Hot Streak,/ }),
    ).toBeVisible();
    const saved = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      ADVENTURE_STORAGE,
    );
    expect(validateAdventure(saved)).toBe(true);
    expect(saved.battle.recipes).toEqual([recipe]);
    await page.reload();
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    await expect(page.locator(".trap-panel")).toContainText("Fire Tiki");
    await expect(
      page.getByRole("button", { name: /^Select Adventure Hot Streak,/ }),
    ).toBeVisible();
  });
