import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { EMPTY_BOARD, STARTER_STONES, placeStone } from "../../src/game.ts";
import type { Stone, StoneKeyword } from "../../src/game.ts";
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
    await page.route("**/*", (route) =>
      route.request().url() === "http://127.0.0.1:5173/"
        ? route.fulfill({ status: 200, contentType: "text/html", body: html })
        : (unexpected.push(route.request().url()), route.abort()),
    );
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
const make = (name: string, keywords: StoneKeyword[] = []): Stone => ({
  ...STARTER_STONES[0],
  id: `custom-${name.toLowerCase().replaceAll(" ", "-")}`,
  name,
  custom: true,
  element: "magic",
  edges: [0, 1, 2, 3],
  keywords,
});
const read = (page: Page) =>
  page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    ADVENTURE_STORAGE,
  );

test("studio creates and exports Environment Immunity and lets Enchant grant it", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Card studio", exact: true }).click();
  await page.getByLabel("Stone name").fill("Ward Weaver");
  await page.getByRole("button", { name: /^Add keyword/ }).click();
  await page
    .getByLabel("Keyword 1", { exact: true })
    .selectOption("environment-immunity");
  await expect(page.getByLabel("Affected edge 1", { exact: true })).toHaveCount(
    0,
  );
  await expect(
    page.getByText(
      /Ignore every tile environment, including beneficial bonuses/,
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: /^Add keyword/ }).click();
  await page.getByLabel("Keyword 2", { exact: true }).selectOption("enchant");
  await page
    .getByLabel("Keyword 2 grant 1", { exact: true })
    .selectOption("environment-immunity");
  await page
    .getByRole("button", { name: "Save to collection", exact: true })
    .click();
  const library = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("skystones-library-v1")!),
  );
  const card = library.custom.find((c: Stone) => c.name === "Ward Weaver");
  expect(card.keywords).toMatchObject([
    { type: "environment-immunity" },
    { type: "enchant", keywords: [{ type: "environment-immunity" }] },
  ]);
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page
    .getByRole("button", { name: "View Ward Weaver", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Ignore all tile environments",
  );
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export card file", exact: true })
    .click();
  const stream = await (await pending).createReadStream(),
    chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  expect(JSON.parse(Buffer.concat(chunks).toString()).card.keywords).toEqual(
    card.keywords,
  );
});

for (const size of [3, 4] as const)
  test(`${size}×${size} granting immunity updates displayed terrain, Sunder uses the immune side, and Silence restores Crosswind`, async ({
    page,
  }) => {
    const target = size + 1;
    let run = enterAdventureNode(newAdventure(size, 81), "moss");
    const painted = placeStone(
      EMPTY_BOARD(size),
      0,
      {
        ...make("Painter", [
          { type: "environment", environment: { kind: "crosswind" } },
        ]),
        edges: [0, 0, 0, 0],
      },
      1,
      [{ keywordIndex: 0, boardIndex: target }],
    ).board;
    const board = placeStone(painted, target, make("Recipient"), 0).board;
    const spell = (name: string, keyword: StoneKeyword): Stone => ({
      ...make(name, [keyword]),
      spell: "cast",
      token: true,
      conjured: true,
      edges: [0, 0, 0, 0],
    });
    run = {
      ...run,
      battle: {
        ...run.battle!,
        board,
        hands: [
          [
            spell("Ward", {
              type: "enchant",
              target: "allies",
              mode: "chosen",
              count: 1,
              keywords: [{ type: "environment-immunity" }],
            }),
            spell("Chisel", { type: "sunder", side: "any" }),
            spell("Hush Ward", { type: "silence" }),
            ...run.battle!.hands[0],
          ],
          run.battle!.hands[1],
        ],
      },
    };
    expect(validateAdventure(run)).toBe(true);
    await page.addInitScript(
      ({ key, run }) => {
        if (!localStorage.getItem(key))
          localStorage.setItem(key, JSON.stringify(run));
      },
      { key: ADVENTURE_STORAGE, run },
    );
    await page.goto("/");
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    await expect(
      page.getByRole("button", {
        name: /^B2: Recipient, You, north 3, east 0, south 1, west 2/,
      }),
    ).toBeVisible();
    await page.getByRole("button", { name: /^Select Ward,/ }).click();
    await page
      .getByRole("group", { name: "Eligible Enchant targets" })
      .getByRole("button")
      .first()
      .click();
    await page
      .getByRole("button", { name: "Apply Enchant", exact: true })
      .click();
    await expect(
      page.getByRole("button", {
        name: /^B2: Recipient, You, north 0, east 1, south 2, west 3/,
      }),
    ).toBeVisible();
    await page.getByRole("button", { name: /^B2: Recipient/ }).click();
    await expect(page.getByRole("dialog")).toContainText(
      "Environment Immunity is active: this tile has no effect on this card.",
    );
    await page
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
    await page.reload();
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    await expect(
      page.getByRole("button", {
        name: /^B2: Recipient, You, north 0, east 1, south 2, west 3/,
      }),
    ).toBeVisible();
    await page.getByRole("button", { name: /^Select Chisel,/ }).click();
    await page.getByRole("button", { name: /^Target B2:/ }).click();
    await page
      .getByRole("button", { name: "East: 1 → 0", exact: true })
      .click();
    expect((await read(page)).battle.board[target].edges).toEqual([0, 0, 2, 3]);
    await page.getByRole("button", { name: /^Select Hush Ward,/ }).click();
    await page.getByRole("button", { name: /^Target B2:/ }).click();
    await expect(
      page.getByRole("button", {
        name: /^B2: Recipient, You, north 3, east 0, south 0, west 2/,
      }),
    ).toBeVisible();
    const saved = await read(page);
    expect(saved.battle.board[target].silenced).toBe(true);
    expect(saved.battle.board[target].environment.kind).toBe("crosswind");
    expect(saved.battle.current).toBe(0);
    expect(validateAdventure(saved)).toBe(true);
  });
