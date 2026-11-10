import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { STARTER_STONES, handSize, placedKeywords } from "../../src/game.ts";
import type { Stone, StoneKeyword } from "../../src/game.ts";
import { validTrap, DEFAULT_TRAPS } from "../../src/traps.ts";
import type { Trap } from "../../src/traps.ts";
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
  page.on("pageerror", (e) => {
    throw e;
  }),
);
const crystal: Trap = {
  id: "trap-custom-options",
  name: "Directional Echo",
  element: "magic",
  description: "Directional shared effects",
  effects: [
    { kind: "pips", side: "all", sides: [0, 2], amount: 1 },
    { kind: "multiply", side: "all", sides: [1, 3] },
    { kind: "amplify", effect: "shield" },
    { kind: "amplify", effect: "conjure" },
  ],
};
const keywords: StoneKeyword[] = [
  { type: "trap", trap: crystal },
  { type: "shield", side: 0, amount: 1 },
  {
    type: "conjure",
    mode: "specific",
    card: "spyro",
    count: 1,
    recipient: "self",
  },
];
async function local(page: Page, size: 3 | 4) {
  const cards: Stone[] = Array.from({ length: handSize(size) }, (_, i) => ({
    ...STARTER_STONES[0],
    id: `custom-options-${i}`,
    name: i === 0 ? "Crystal Keeper" : `Safe Filler ${i}`,
    element: "fire",
    edges: [1, 1, 1, 1],
    keywords: i === 0 ? keywords : [],
    custom: true,
  }));
  await page.addInitScript(
    (data) =>
      localStorage.setItem("skystones-library-v1", JSON.stringify(data)),
    {
      custom: cards,
      deck: cards.map((c) => c.id),
      boardSize: size,
      sound: false,
    },
  );
  await page.goto("/");
  await page.getByRole("button", { name: "New match", exact: true }).click();
  await page.getByRole("button", { name: /Bring a friend/ }).click();
  await page
    .getByRole("button", { name: "Find a little magic", exact: true })
    .click();
}

test("Trap editor saves selected sides and every new rule, reorders effects, and survives reload on mobile", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page.getByRole("button", { name: "Traps", exact: true }).click();
  await expect(page.locator(".trap-grid article")).toHaveCount(
    DEFAULT_TRAPS.length,
  );
  await page
    .getByRole("button", { name: "Create a Trap", exact: true })
    .click();
  await page.getByLabel("Trap name", { exact: true }).fill("Eightfold Crystal");
  await page
    .getByLabel("Trap matching element", { exact: true })
    .selectOption("fire");
  await page
    .getByLabel("Trap direction 1", { exact: true })
    .selectOption("selected");
  await page.getByLabel("Trap South 1", { exact: true }).check();
  await page.getByLabel("Trap pips 1", { exact: true }).fill("2");
  for (const [i, kind] of [
    "amplify",
    "multiply",
    "mirror",
    "equalizer",
    "ceiling",
    "steady",
    "defense",
  ].entries()) {
    await page.getByRole("button", { name: "Add effect", exact: true }).click();
    await page
      .getByLabel(`Trap effect ${i + 2}`, { exact: true })
      .selectOption(kind);
  }
  await page
    .getByLabel("Trap doubled keyword 2", { exact: true })
    .selectOption("sunder");
  await page
    .getByLabel("Trap direction 3", { exact: true })
    .selectOption("selected");
  await page.getByLabel("Trap West 3", { exact: true }).check();
  await page.getByLabel("Trap North 3", { exact: true }).uncheck();
  await page.getByLabel("Trap pip ceiling 6", { exact: true }).fill("4");
  await page.getByLabel("Trap minimum Dizzy roll 7", { exact: true }).fill("3");
  await expect(
    page.getByRole("button", { name: "Add effect", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Move Trap effect 5 up", exact: true })
    .click();
  await expect(page.getByLabel("Trap effect 4", { exact: true })).toHaveValue(
    "equalizer",
  );
  await page.setViewportSize({ width: 390, height: 1000 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "/tmp/skystones-trap-editor-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Save Trap", exact: true }).click();
  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem("skystones-traps-v1")!)[0],
  );
  expect(validTrap(saved)).toBe(true);
  expect(saved.effects).toEqual([
    { kind: "pips", side: "all", sides: [0, 2], amount: 2 },
    { kind: "amplify", effect: "sunder" },
    { kind: "multiply", side: "all", sides: [3] },
    { kind: "equalizer" },
    { kind: "mirror" },
    { kind: "ceiling", side: "all", maximum: 4 },
    { kind: "steady", minimum: 3 },
    { kind: "defense", side: "all", amount: 1 },
  ]);
  await page.reload();
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page.getByRole("button", { name: "Traps", exact: true }).click();
  await page
    .locator(".trap-grid article")
    .filter({ hasText: "Eightfold Crystal" })
    .getByRole("button", { name: "Edit Trap", exact: true })
    .click();
  await expect(page.getByLabel("Trap South 1", { exact: true })).toBeChecked();
  await expect(page.getByLabel("Trap West 3", { exact: true })).toBeChecked();
  await expect(
    page.getByLabel("Trap doubled keyword 2", { exact: true }),
  ).toHaveValue("sunder");
  await expect(page.getByLabel("Trap effect 4", { exact: true })).toHaveValue(
    "equalizer",
  );
});

for (const size of [3, 4] as const) {
  test(`${size}×${size} normal match shows directional pips, doubled Shield and doubled card additions in the board and inspector`, async ({
    page,
  }) => {
    await local(page, size);
    await page.getByRole("button", { name: /^Select Crystal Keeper,/ }).click();
    await page.locator("#board-0").click();
    await expect(page.locator(".trap-panel")).toContainText("Directional Echo");
    await expect(page.locator("#board-0")).toHaveAttribute(
      "aria-label",
      /edges north 2, east 2, south 2, west 2/,
    );
    await expect(page.locator("#board-0 .edge-0 .shield-pip")).toContainText(
      "+2",
    );
    await page.locator("#board-0").click();
    await expect(
      page.locator(".inspection-dialog .edge-0 .shield-pip"),
    ).toContainText("+2");
    await expect(
      page.locator(".inspection-dialog .inspection-stats"),
    ).toContainText("Defense +2 · defends 4");
    await expect(page.locator(".inspection-dialog")).toContainText(
      "Player one +2: Spyro, Spyro",
    );
    await page.setViewportSize({ width: 390, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
  test(`${size}×${size} Adventure saves new Trap rules and doubled effects, and restores the same board`, async ({
    page,
  }) => {
    let run = enterAdventureNode(newAdventure(size, 81), "moss");
    const first = { ...run.battle!.hands[0][0], keywords };
    run = {
      ...run,
      battle: {
        ...run.battle!,
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
    await page
      .getByRole("button", {
        name: new RegExp("^Select " + first.name + ", adventure card"),
      })
      .click();
    await page.locator("#adventure-board-0").click();
    await expect(page.locator(".trap-panel")).toContainText("Directional Echo");
    await expect(
      page.locator("#adventure-board-0 .edge-0 .shield-pip"),
    ).toContainText("+2");
    const saved = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      ADVENTURE_STORAGE,
    );
    expect(validateAdventure(saved)).toBe(true);
    expect(saved.battle.traps.active.trap).toEqual(crystal);
    expect(
      placedKeywords(saved.battle.board[0]).find((k) => k.type === "conjure")!
        .count,
    ).toBe(2);
    await page.reload();
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    await expect(page.locator(".trap-panel")).toContainText("Directional Echo");
    await expect(
      page.locator("#adventure-board-0 .edge-0 .shield-pip"),
    ).toContainText("+2");
  });
}
