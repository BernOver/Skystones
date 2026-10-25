import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import {
  ADVENTURE_STORAGE,
  enterAdventureNode,
  newAdventure,
} from "../../src/adventure.ts";
import type { Adventure } from "../../src/adventure.ts";
import { EMPTY_BOARD, STARTER_STONES, placeStone } from "../../src/game.ts";
import type { Stone } from "../../src/game.ts";
const spark: Stone = {
  ...STARTER_STONES[0],
  id: "custom-spark",
  name: "Fire Spark",
  element: "fire",
  portrait: "flameslinger",
  edges: [0, 0, 0, 0],
  keywords: [],
};
const relay: Stone = {
  ...spark,
  id: "custom-relay",
  name: "Fire Relay",
  edges: [1, 2, 1, 1],
  keywords: [
    { type: "shield", side: 0 },
    {
      type: "combo",
      pips: [{ side: 1, amount: 2 }],
      keywords: [
        { type: "shield", side: 3, amount: 2 },
        { type: "sunder", side: "any", amount: 2 },
      ],
    },
  ],
};
async function stored(page: Page): Promise<Adventure> {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    ADVENTURE_STORAGE,
  );
}
async function openRun(page: Page, run: Adventure) {
  await page.addInitScript(
    ({ key, run }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(run));
    },
    { key: ADVENTURE_STORAGE, run },
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Adventure", exact: true }).click();
}

test("studio configures defense-only Shield and Combo pip/keyword grants, then exports, imports and reloads the portrait", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Card studio", exact: true }).click();
  await page.getByLabel("Find a character portrait").fill("Dark Spyro");
  await page
    .getByRole("button", { name: "Use Dark Spyro portrait", exact: true })
    .click();
  await page.getByLabel("Stone name").fill("Chained Shield");
  await page.getByRole("button", { name: "Add keyword", exact: false }).click();
  await page.getByLabel("Keyword 1", { exact: true }).selectOption("shield");
  await page.getByLabel("Affected edge 1").selectOption("3");
  await page.getByLabel("Shield pips 1").fill("2");
  await page.getByRole("button", { name: "Add keyword", exact: false }).click();
  await page.getByLabel("Keyword 2", { exact: true }).selectOption("combo");
  await page.getByLabel("Combo East pips").selectOption("2");
  await page
    .getByRole("button", { name: "Add Combo keyword", exact: true })
    .click();
  await page
    .getByLabel("Combo keyword 1", { exact: true })
    .selectOption("sunder");
  await page.getByLabel("Target edge Combo keyword 1").selectOption("any");
  await page.getByLabel("Pips removed Combo keyword 1").fill("3");
  await expect(page.locator(".preview-card")).toContainText("Shield");
  await expect(page.locator(".preview-card")).toContainText("Combo");
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
  await page.getByRole("button", { name: "View Chained Shield" }).click();
  await expect(page.getByRole("dialog")).toContainText("only when defending");
  await expect(page.getByRole("dialog")).toContainText(
    "the last card you played",
  );
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export card file" }).click();
  const stream = await (await pending).createReadStream(),
    chunks: Buffer[] = [];
  for await (const c of stream!) chunks.push(c);
  const buffer = Buffer.concat(chunks),
    card = JSON.parse(buffer.toString()).card;
  expect(card.portrait).toBe("dark-spyro");
  expect(card.keywords).toEqual([
    { type: "shield", side: 3, amount: 2 },
    {
      type: "combo",
      pips: [
        { side: 0, amount: 1 },
        { side: 1, amount: 2 },
      ],
      keywords: [{ type: "sunder", side: "any", amount: 3 }],
    },
  ]);
  await page.keyboard.press("Escape");
  await page.getByLabel("Import card file").setInputFiles({
    name: "combo.skystone.json",
    mimeType: "application/json",
    buffer,
  });
  await expect(
    page.getByRole("button", { name: "View Chained Shield" }),
  ).toHaveCount(2);
});

test("normal match shows a real capture flip, then resolves an activated Combo target after the previous card was captured", async ({
  page,
}) => {
  await page.addInitScript(
    ({ spark, relay }) => {
      Math.random = () => 0;
      const custom = [
        spark,
        relay,
        ...Array.from({ length: 3 }, (_, i) => ({
          ...spark,
          id: `custom-filler-${i}`,
          name: `Filler ${i}`,
        })),
      ];
      localStorage.setItem(
        "skystones-library-v1",
        JSON.stringify({ custom, deck: custom.map((s) => s.id) }),
      );
    },
    { spark, relay },
  );
  await page.goto("/");
  await page.getByRole("button", { name: "New match", exact: true }).click();
  await page.getByRole("button", { name: /Bring a friend/ }).click();
  await page.getByRole("button", { name: "Find a little magic" }).click();
  await page.getByRole("button", { name: /^Select Fire Spark,/ }).click();
  await page
    .getByRole("button", { name: "B2, empty square", exact: true })
    .click();
  await page.getByRole("button", { name: /^Select Whirlwind,/ }).click();
  await page
    .getByRole("button", { name: "B3, empty square", exact: true })
    .click();
  const flip = page.locator("#board-4 .capture-flip-inner");
  await expect(page.locator("#board-4 .is-flipping")).toBeVisible();
  expect(await flip.evaluate((el) => getComputedStyle(el).animationName)).toBe(
    "card-capture-flip",
  );
  await expect(page.locator("#board-4 .capture-flip-front")).toHaveCount(0);
  const chain = page.getByRole("button", { name: /^Select Fire Relay,/ });
  await chain.hover();
  await expect(page.getByRole("tooltip")).toContainText(
    "Will activate if played now",
  );
  await expect(chain.locator(".edge-1 > b")).toHaveText("4");
  await expect(chain.locator(".edge-3 .shield-pip")).toContainText("+2");
  await chain.click();
  await page
    .getByRole("button", { name: "B1, empty square", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Choose keyword target" });
  await expect(dialog).toContainText("Sunder");
  await dialog.getByRole("button", { name: /Target B3: Whirlwind/ }).click();
  await dialog.getByRole("button", { name: /^West:/ }).click();
  await expect(page.locator("#board-4")).toHaveAccessibleName(
    /controlled by Player one/,
  );
  await expect(page.locator("#board-3 .edge-1 > b")).toHaveText("4");
  await page.locator("#board-3").hover();
  await expect(page.getByRole("tooltip")).toContainText(
    "Activated when played · bonuses locked in",
  );
});
for (const size of [3, 4] as const)
  test(`${size}×${size} Adventure Combo grants targets, keeps shields, and resumes its play history`, async ({
    page,
  }) => {
    let run = enterAdventureNode(newAdventure(size, 92), "moss");
    let board = placeStone(EMPTY_BOARD(size), size * size - 1, spark, 0).board;
    board = placeStone(
      board,
      size * size - 2,
      { ...spark, name: "Keeper Stone", edges: [0, 1, 0, 0] },
      1,
    ).board;
    run = {
      ...run,
      potions: ["hush"],
      battle: {
        ...run.battle!,
        board,
        turns: 2,
        current: 0,
        hands: [
          [relay, ...run.battle!.hands[0].slice(1)],
          run.battle!.hands[1],
        ],
      },
    };
    await openRun(page, run);
    const chain = page.getByRole("button", { name: /^Select Fire Relay/ });
    await chain.hover();
    await expect(page.getByRole("tooltip")).toContainText(
      "Will activate if played now",
    );
    await chain.click();
    await page
      .getByRole("button", { name: "A1, empty adventure square", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Adventure keyword target",
    });
    await expect(dialog).toContainText("Sunder");
    await dialog.locator(".target-cell.available").first().click();
    await dialog
      .getByRole("group", { name: "Choose the edge that loses pips" })
      .getByRole("button")
      .filter({ hasText: "East" })
      .click();
    await expect(page.locator(".adventure-square.occupied")).toHaveCount(4);
    const saved = await stored(page);
    expect(saved.battle!.board[0]!.comboActive).toBe(true);
    expect(saved.battle!.board[0]!.shields).toEqual([1, 0, 0, 2]);
    await page.reload();
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    expect((await stored(page)).battle!.board[0]!.comboPrevious).toBe("fire");
    await page.locator(".adventure-square.occupied").first().click();
    await expect(page.getByRole("dialog")).toContainText("bonuses locked in");
    await expect(page.getByRole("dialog")).toContainText("defense");
  });
for (const size of [3, 4] as const)
  test(`${size}×${size} Golden Queen has a separate boss setup, corner requirement, and saved victory`, async ({
    page,
  }) => {
    let run = enterAdventureNode(
      { ...newAdventure(size, 75), floor: 17 },
      "golden-queen",
    );
    const b = run.battle!,
      last = size * size - 2;
    run = {
      ...run,
      battle: {
        ...b,
        current: 0,
        turns: size * size - 2,
        board: b.board.map((cell, i) =>
          i === last
            ? null
            : {
                stone: {
                  ...(cell?.stone || spark),
                  keywords: [],
                  edges: [0, 0, 0, 0],
                },
                owner: 0,
                edges: [0, 0, 0, 0],
              },
        ),
        hands: [[spark], [spark]],
      },
    };
    await openRun(page, run);
    await expect(page.locator(".run-objective")).toContainText(
      "at least two corners",
    );
    await expect(page.locator(".run-battle-heading")).toContainText(
      "Golden Queen",
    );
    await page.locator(".run-hand-card").first().click();
    await page.locator(".adventure-square.vacant").click();
    await expect(page.locator(".run-ending")).toContainText("Golden Queen");
    expect((await stored(page)).victory).toBe(true);
    await page.reload();
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    await expect(page.locator(".run-ending")).toBeVisible();
  });

test("Adventure capture flips finish even when the keeper starts its next turn", async ({
  page,
}) => {
  const run = enterAdventureNode(newAdventure(3, 17), "moss");
  run.battle!.board[1] = { stone: spark, owner: 1, edges: [0, 0, 0, 0] };
  run.battle!.hands[0][0] = { ...spark, edges: [2, 2, 2, 2] };
  run.battle!.hands[1] = run.battle!.hands[1].map((stone) => ({
    ...stone,
    keywords: [],
    edges: [0, 0, 0, 0],
  }));
  await openRun(page, run);
  await page.evaluate(() => {
    (window as unknown as { captureFlipFinished: number }).captureFlipFinished =
      0;
    document.addEventListener("animationend", (event) => {
      if (event.animationName === "card-capture-flip")
        (window as unknown as { captureFlipFinished: number })
          .captureFlipFinished++;
    });
  });
  await page.locator(".run-hand-card").first().click();
  await page
    .getByRole("button", { name: "A1, empty adventure square", exact: true })
    .click();
  await expect(page.locator(".adventure-square.occupied")).toHaveCount(3);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { captureFlipFinished: number })
            .captureFlipFinished,
      ),
    )
    .toBe(1);
  await expect(
    page.locator(".adventure-square").nth(1).locator(".capture-flip-front"),
  ).toHaveCount(0);
});
