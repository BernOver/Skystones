import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { STARTER_STONES, coordinate, placeStone } from "../../src/game.ts";
import type { Stone, StoneKeyword } from "../../src/game.ts";
import { DEFAULT_TOKENS } from "../../src/tokens.ts";
import { pendingPipEffects } from "../../src/effects.ts";
import {
  ADVENTURE_STORAGE,
  enterAdventureNode,
  newAdventure,
  playAdventureCard,
} from "../../src/adventure.ts";
import type { Adventure } from "../../src/adventure.ts";

if (process.env.SKYSTONES_STANDALONE === "1") {
  const html = readFileSync("standalone/Skystones.html", "utf8");
  let failures: string[];
  test.beforeEach(async ({ page }) => {
    failures = [];
    page.on("pageerror", (error) => failures.push(error.message));
    await page.route("**/*", (route) => {
      if (route.request().url() === "http://127.0.0.1:5173/")
        return route.fulfill({
          status: 200,
          contentType: "text/html",
          body: html,
        });
      failures.push(route.request().url());
      return route.abort();
    });
  });
  test.afterEach(() => expect(failures).toEqual([]));
}
const gifts: StoneKeyword[] = [
  { type: "shift", side: 0, direction: 1, affects: "enemies" },
  { type: "shield", side: 2, amount: 2 },
  { type: "sunder", side: 0, amount: 1 },
  {
    type: "conjure",
    mode: "token",
    token: DEFAULT_TOKENS[0].id,
    count: 1,
    recipient: "self",
  },
];
async function stored(page: Page): Promise<Adventure> {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    ADVENTURE_STORAGE,
  );
}
async function openRun(page: Page, run: Adventure) {
  await page.clock.install({ time: new Date("2026-11-07T12:00:00Z") });
  await page.clock.pauseAt(new Date("2026-11-07T12:00:01Z"));
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
async function targets(page: Page) {
  while (await page.locator(".target-cell.available").count()) {
    await page.locator(".target-cell.available").first().click();
    const sides = page
      .getByRole("group", { name: "Choose the edge that loses pips" })
      .locator("button:enabled");
    if (await sides.count()) await sides.first().click();
  }
}
test("studio saves, shares and imports keyword-only Next Play, nested Combo, and fixed adjacent Shift", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.goto("/");
  await page.getByRole("button", { name: "Card studio", exact: true }).click();
  await page.getByLabel("Stone name").fill("Wind Tutor");
  await page.getByRole("button", { name: /Add keyword/ }).click();
  await page.getByLabel("Keyword 1", { exact: true }).selectOption("next-play");
  await page
    .getByRole("button", {
      name: "Add Next Play keyword · Keyword 1",
      exact: true,
    })
    .click();
  await page
    .getByLabel("Keyword 1 grant 1", { exact: true })
    .selectOption("shift");
  await page
    .getByLabel("Adjacent side 1 grant 1", { exact: true })
    .selectOption("1");
  await page
    .getByLabel("Shift direction · Keyword 1 grant 1", { exact: true })
    .selectOption("0");
  await page
    .getByLabel("Shift affects · Keyword 1 grant 1", { exact: true })
    .selectOption("enemies");
  await page
    .getByRole("button", {
      name: "Add Next Play keyword · Keyword 1",
      exact: true,
    })
    .click();
  await page
    .getByLabel("Keyword 1 grant 2", { exact: true })
    .selectOption("conjure");
  await page
    .getByLabel("Card source · Keyword 1 grant 2", { exact: true })
    .selectOption("token");
  await page
    .getByRole("button", {
      name: "Add Next Play keyword · Keyword 1",
      exact: true,
    })
    .click();
  await page
    .getByLabel("Keyword 1 grant 3", { exact: true })
    .selectOption("combo");
  await page
    .getByLabel("Keyword 1 grant 3 · Combo trigger", { exact: true })
    .selectOption("tribe");
  await page
    .getByLabel("Keyword 1 grant 3 · Combo tribe", { exact: true })
    .selectOption("giants");
  await page
    .getByLabel("Pip change · Keyword 1", { exact: true })
    .selectOption("0");
  await page.getByRole("button", { name: /^Add keyword/ }).click();
  await page.getByLabel("Keyword 2", { exact: true }).selectOption("shift");
  await page.getByLabel("Adjacent side 2", { exact: true }).selectOption("3");
  await page
    .getByLabel("Shift direction · Keyword 2", { exact: true })
    .selectOption("2");
  await page
    .getByLabel("Shift affects · Keyword 2", { exact: true })
    .selectOption("allies");
  await page.getByRole("button", { name: /^Add keyword/ }).click();
  await page.getByLabel("Keyword 3", { exact: true }).selectOption("combo");
  await page
    .locator(".keyword-editor-entry")
    .nth(2)
    .getByRole("button", { name: "Add Combo keyword", exact: true })
    .click();
  await page
    .getByLabel("Combo keyword 1", { exact: true })
    .selectOption("next-play");
  await page
    .getByRole("button", {
      name: "Add Next Play keyword · Combo keyword 1",
      exact: true,
    })
    .click();
  await page
    .getByLabel("Pip change · Combo keyword 1", { exact: true })
    .selectOption("0");
  await page.setViewportSize({ width: 390, height: 1000 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "/tmp/skystones-next-keywords-studio-phone.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Save to collection", exact: true })
    .click();
  await page.reload();
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page
    .getByRole("button", { name: "View Wind Tutor", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Gain Shift, Conjure, Combo",
  );
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export card file", exact: true })
    .click();
  const stream = await (await download).createReadStream(),
    chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const buffer = Buffer.concat(chunks),
    payload = JSON.parse(buffer.toString());
  expect(payload.card.keywords[0]).toMatchObject({
    type: "next-play",
    amount: 0,
    keywords: [
      { type: "shift", side: 1, direction: 0, affects: "enemies" },
      { type: "conjure", mode: "token" },
      { type: "combo", condition: "tribe", tribe: "giants" },
    ],
  });
  expect(payload.card.keywords[1]).toEqual({
    type: "shift",
    side: 3,
    direction: 2,
    affects: "allies",
  });
  expect(payload.tokens).toHaveLength(1);
  expect(payload.card.keywords[2]).toMatchObject({
    type: "combo",
    keywords: [
      { type: "next-play", amount: 0, keywords: [{ type: "shield", side: 0 }] },
    ],
  });
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.getByLabel("Import card file").setInputFiles({
    name: "tutor.skystone.json",
    mimeType: "application/json",
    buffer,
  });
  await expect(page.locator(".toast")).toContainText(
    "has joined your collection",
  );
});

for (const size of [3, 4] as const) {
  test(`${size}×${size} received keywords preview in hand, target before captures, then capture and shift, cancel without spending, and survive reload`, async ({
    page,
  }) => {
    const run = enterAdventureNode(newAdventure(size, 81), "moss"),
      last = size * size - 1;
    const source = {
      ...run.inventory[0],
      name: "Wind Tutor",
      edges: [0, 0, 0, 0] as Stone["edges"],
      keywords: [
        {
          type: "next-play" as const,
          side: 0 as const,
          amount: 1,
          recipient: "self" as const,
          tribe: "giants" as const,
          keywords: gifts,
        },
      ],
    };
    const receiver = {
      ...run.inventory[1],
      name: "Giant Receiver",
      edges: [1, 1, 1, 1] as Stone["edges"],
      tribes: ["giants" as const],
      keywords: [],
    };
    run.inventory[0] = source;
    run.inventory[1] = receiver;
    run.battle!.hands[0][0] = source;
    run.battle!.hands[0][1] = receiver;
    let prepared = playAdventureCard(run, last, 0);
    prepared.battle!.hands[1][0] = {
      ...prepared.battle!.hands[1][0],
      name: "North Guard",
      edges: [2, 0, 0, 0],
      keywords: [],
    };
    prepared = playAdventureCard(prepared, 1, 0);
    await openRun(page, prepared);
    const hand = page.getByRole("button", {
      name: /^Select Giant Receiver, adventure card/,
    });
    await expect(hand).toContainText("Shift");
    await expect(hand.locator(".edge > b")).toHaveText(["2", "1", "1", "1"]);
    const before = await stored(page);
    await hand.click();
    await page.locator(`#adventure-board-${size + 1}`).click();
    await expect(page.getByRole("dialog")).toContainText("Sunder");
    await expect(
      page.getByRole("button", { name: /^Target A2:/ }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Cancel play", exact: true })
      .click();
    expect(await stored(page)).toEqual(before);
    if ((await hand.getAttribute("aria-pressed")) !== "true")
      await hand.click();
    await page.locator(`#adventure-board-${size + 1}`).click();
    await page.getByRole("button", { name: /^Target A2:/ }).click();
    const after = await stored(page),
      cell = after.battle!.board[size + 1]!;
    expect(after.battle!.board[1]).toBeNull();
    expect(after.battle!.board[2]!.stone.name).toBe("North Guard");
    expect(after.battle!.board[2]!.owner).toBe(0);
    expect(after.battle!.board[2]!.edges![0]).toBe(1);
    expect(cell.stone.receivedKeywords).toEqual(gifts);
    expect(cell.edges).toEqual([2, 1, 1, 1]);
    expect(cell.shields).toEqual([0, 0, 2, 0]);
    expect(after.battle!.hands[0].filter((card) => card.token)).toHaveLength(1);
    expect(pendingPipEffects(after.battle!.board, 0)).toHaveLength(0);
    await page.reload();
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    expect((await stored(page)).battle).toEqual(after.battle);
    await page.locator(`#adventure-board-${size + 1}`).click();
    await expect(page.getByRole("dialog")).toContainText(
      "Next Play keywords received",
    );
    await page.setViewportSize({ width: 390, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });

  test(`${size}×${size} fixed Shift captures its printed-side enemy, then pushes it with the new owner and capture marker`, async ({
    page,
  }) => {
    const run = enterAdventureNode(newAdventure(size, 81), "moss");
    const enemy = {
      ...run.battle!.hands[1][0],
      name: "North Guard",
      edges: [0, 0, 0, 0] as Stone["edges"],
      keywords: [],
    };
    run.battle!.board = placeStone(run.battle!.board, 1, enemy, 1).board;
    run.battle!.hands[1].splice(0, 1);
    run.battle!.turns = 1;
    const shifter = {
      ...run.inventory[0],
      name: "Fixed Shifter",
      edges: [0, 2, 0, 0] as Stone["edges"],
      keywords: [
        {
          type: "shift" as const,
          side: 1 as const,
          direction: 0 as const,
          affects: "enemies" as const,
        },
      ],
    };
    run.inventory[0] = shifter;
    run.battle!.hands[0][0] = shifter;
    await openRun(page, run);
    await page
      .getByRole("button", { name: /^Select Fixed Shifter, adventure card/ })
      .click();
    await page.locator("#adventure-board-0").click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    const after = (await stored(page)).battle!,
      destination = size * (size - 1) + 1;
    expect(after.board[1]).toBeNull();
    expect(after.board[destination]!.stone.name).toBe("North Guard");
    expect(after.board[destination]!.owner).toBe(0);
    expect(after.lastCaptured).toContain(destination);
    expect(after.board[0]!.effects![0]).toMatchObject({
      type: "shift",
      target: 1,
      to: destination,
      moved: true,
    });
    await page.reload();
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    expect((await stored(page)).battle).toEqual(after);
    await page.locator("#adventure-board-0").click();
    await expect(page.getByRole("dialog")).toContainText(
      `Shift A2 → ${coordinate(destination, size)}`,
    );
  });
}

test("normal local games preview queued Shift and resolve its automatic wrap without selecting a target", async ({
  page,
}) => {
  const custom = STARTER_STONES.slice(0, 5).map(
    (card, i): Stone => ({
      ...card,
      id: `custom-wind-${i}`,
      name: i === 0 ? "Wind Tutor" : `Receiver ${i}`,
      custom: true,
      edges: [0, 0, 0, 0],
      keywords:
        i === 0
          ? [
              {
                type: "next-play",
                side: 0,
                amount: 0,
                recipient: "self",
                keywords: [
                  { type: "shift", side: 1, direction: 0, affects: "enemies" },
                ],
              },
            ]
          : [],
    }),
  );
  await page.addInitScript(
    (library) =>
      localStorage.setItem("skystones-library-v1", JSON.stringify(library)),
    {
      custom,
      deck: custom.map((card) => card.id),
      boardSize: 3,
      sound: false,
    },
  );
  await page.goto("/");
  await page.getByRole("button", { name: "New match", exact: true }).click();
  await page.getByRole("button", { name: /Bring a friend/ }).click();
  await page
    .getByRole("button", { name: "Find a little magic", exact: true })
    .click();
  await page
    .locator(".hand-card-button")
    .filter({ hasText: "Wind Tutor" })
    .click();
  await page.locator("#board-8").click();
  await expect(page.locator(".next-play-status")).toContainText("Gain Shift");
  await page.locator(".hand-card-button").first().click();
  await page.locator("#board-1").click();
  await targets(page);
  const enemyName = await page
    .locator("#board-1 .capture-flip-back .stone-caption")
    .innerText();
  const receiver = page
    .locator(".hand-card-button")
    .filter({ hasText: "Receiver 1" });
  await expect(receiver).toContainText("Shift");
  await receiver.click();
  await page.locator("#board-0").click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.locator("#board-7 .capture-flip-back .stone-caption"),
  ).toHaveText(enemyName);
  await expect(page.locator("#board-1 .capture-flip-back")).toHaveCount(0);
  await expect(page.locator(".next-play-status")).toHaveCount(0);
});
