import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import type { Page } from "@playwright/test";
import type { Stone, BoardSize } from "../../src/game.ts";
import { coordinate } from "../../src/game.ts";
import { TRIBE_IDS, hasTribe } from "../../src/tribes.ts";
import { CHARACTER_STONES } from "../../src/characters.ts";
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
      failures.push(`Unexpected external request: ${route.request().url()}`);
      return route.abort();
    });
  });
  test.afterEach(() => expect(failures).toEqual([]));
}

async function stored(page: Page): Promise<Adventure> {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    ADVENTURE_STORAGE,
  );
}
async function openRun(page: Page, run: Adventure) {
  await page.clock.install({ time: new Date("2026-11-06T12:00:00Z") });
  await page.clock.pauseAt(new Date("2026-11-06T12:00:01Z"));
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
function replaceHand(
  run: Adventure,
  index: number,
  changes: Partial<Stone>,
): Stone {
  const card = { ...run.inventory[index], ...changes };
  run.inventory[index] = card;
  run.battle!.hands[0][index] = card;
  return card;
}
function weakOpponents(run: Adventure) {
  run.battle!.hands[1] = run.battle!.hands[1].map((card) => ({
    ...card,
    edges: [1, 1, 1, 1],
    keywords: [],
    tribes: ["giants"],
  }));
}

test("collection distinguishes Giants from its game family and offers Imaginators without a Sensei tribe", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^Collection/ }).click();
  const filter = page.getByLabel("Filter by tribe");
  expect(await filter.locator("option").count()).toBe(TRIBE_IDS.length + 1);
  await expect(filter.locator("option")).not.toContainText(["Sensei"]);
  await filter.selectOption("giants");
  await expect(
    page.getByRole("button", { name: "View Tree Rex", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "View Pop Fizz", exact: true }),
  ).toHaveCount(0);
  await filter.selectOption("giants-era");
  await expect(
    page.getByRole("button", { name: "View Pop Fizz", exact: true }),
  ).toBeVisible();
  await filter.selectOption("imaginators");
  await expect(
    page.getByRole("button", { name: "View King Pen", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".collection-grid .collection-item")).toHaveCount(
    CHARACTER_STONES.filter((card) => hasTribe(card, "imaginators")).length,
  );
  await page
    .getByRole("button", { name: "View King Pen", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByLabel("Card tribes")).toHaveText(
    "Imaginators",
  );
});

test("studio auto-tags portraits, edits tribes, and round-trips all four tribe-aware effects on a phone", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Card studio", exact: true }).click();
  const portrait = page.getByLabel("Find a character portrait");
  await portrait.fill("Tree Rex");
  await page
    .getByRole("button", { name: "Use Tree Rex portrait", exact: true })
    .click();
  await expect(page.getByLabel("Tribe Giants", { exact: true })).toBeChecked();
  await expect(
    page.getByLabel("Tribe Giants Era", { exact: true }),
  ).toBeChecked();
  await portrait.fill("King Pen");
  await page
    .getByRole("button", { name: "Use King Pen portrait", exact: true })
    .click();
  await expect(
    page.getByLabel("Tribe Imaginators", { exact: true }),
  ).toBeChecked();
  await expect(
    page.getByLabel("Tribe Giants", { exact: true }),
  ).not.toBeChecked();
  await expect(page.getByRole("checkbox", { name: /Sensei/ })).toHaveCount(0);
  await page.getByLabel("Tribe SWAP Force", { exact: true }).check();
  await page.getByLabel("Stone name").fill("Tribal Weaver");
  for (const [i, type] of [
    "resonance",
    "combo",
    "next-play",
    "environment",
  ].entries()) {
    await page.getByRole("button", { name: /Add keyword/ }).click();
    await page
      .getByLabel(`Keyword ${i + 1}`, { exact: true })
      .selectOption(type);
  }
  await page
    .getByLabel("Count by · Keyword 1", { exact: true })
    .selectOption("tribe");
  await page
    .getByLabel("Counted tribe 1", { exact: true })
    .selectOption("swap-force");
  const comboLabel = page.locator(".preview-card .keyword-combo");
  await expect(comboLabel).toHaveText("Combo Water");
  await page.getByLabel("Combo trigger", { exact: true }).selectOption("tribe");
  await expect(comboLabel).toHaveText("Combo Shared tribe");
  await page.getByLabel("Combo tribe", { exact: true }).selectOption("giants");
  await expect(comboLabel).toHaveText("Combo Giants");
  await page
    .getByLabel("Combo trigger", { exact: true })
    .selectOption("either");
  await expect(comboLabel).toHaveText("Combo Water / Giants");
  await page.getByLabel("Combo trigger", { exact: true }).selectOption("both");
  await expect(comboLabel).toHaveText("Combo Water + Giants");
  await page
    .getByLabel("Combo tribe", { exact: true })
    .selectOption("imaginators");
  await page
    .getByLabel("Recipient tribe · Keyword 3", { exact: true })
    .selectOption("giants");
  await page
    .getByLabel("Match by · Keyword 4", { exact: true })
    .selectOption("tribe");
  await page
    .getByLabel("Affected tribe · Keyword 4", { exact: true })
    .selectOption("trap-masters");
  await page.setViewportSize({ width: 390, height: 1000 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "/tmp/skystones-tribes-studio-phone.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Save to collection", exact: true })
    .click();
  await page.reload();
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page.getByLabel("Filter by tribe").selectOption("swap-force");
  await page
    .getByRole("button", { name: "View Tribal Weaver", exact: true })
    .click();
  await expect(page.getByRole("dialog").locator(".keyword-combo")).toHaveText(
    "Combo Water + Imaginators",
  );
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export card file", exact: true })
    .click();
  const stream = await (await download).createReadStream(),
    chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const buffer = Buffer.concat(chunks),
    card: Stone = JSON.parse(buffer.toString()).card;
  expect(card.tribes).toEqual(["imaginators", "swap-force"]);
  expect(card.keywords).toEqual([
    { type: "resonance", side: 0, element: "water", tribe: "swap-force" },
    {
      type: "combo",
      pips: [{ side: 0, amount: 1 }],
      condition: "both",
      tribe: "imaginators",
    },
    {
      type: "next-play",
      side: 0,
      amount: 1,
      recipient: "self",
      tribe: "giants",
    },
    {
      type: "environment",
      environment: {
        kind: "elemental",
        element: "water",
        side: "all",
        amount: 1,
        tribe: "trap-masters",
      },
    },
  ]);
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.getByLabel("Import card file").setInputFiles({
    name: "tribal.skystone.json",
    mimeType: "application/json",
    buffer,
  });
  await expect(page.locator(".toast")).toContainText(
    "has joined your collection",
  );
});

for (const size of [3, 4] as BoardSize[]) {
  test(`${size}×${size} tribe-filtered Next Play waits for a matching card and Bastion applies only to Giants`, async ({
    page,
  }) => {
    let run = enterAdventureNode(newAdventure(size, 81), "moss");
    const last = size * size - 1;
    replaceHand(run, 0, {
      name: "Tribal Herald",
      edges: [0, 0, 0, 0],
      tribes: ["core"],
      keywords: [
        {
          type: "next-play",
          side: "all",
          amount: 1,
          recipient: "self",
          tribe: "giants",
        },
        {
          type: "environment",
          environment: { kind: "bastion", amount: 1, tribe: "giants" },
        },
      ],
    });
    replaceHand(run, 1, {
      name: "Mini Scout",
      edges: [1, 1, 1, 1],
      keywords: [],
      tribes: ["minis"],
    });
    replaceHand(run, 2, {
      name: "Giant Receiver",
      edges: [1, 1, 1, 1],
      keywords: [],
      tribes: ["giants"],
    });
    weakOpponents(run);
    run = playAdventureCard(run, 0, 0, [{ keywordIndex: 1, boardIndex: last }]);
    run = playAdventureCard(run, last - 1, 0);
    await openRun(page, run);
    await expect(page.locator(".next-play-status")).toContainText(
      "next Giants card",
    );
    const mini = page
      .locator(".run-hand-card")
      .filter({ hasText: "Mini Scout" });
    await expect(mini.locator(".edge > b")).toHaveText(["1", "1", "1", "1"]);
    await mini.click();
    await page.locator("#adventure-board-1").click();
    expect(
      pendingPipEffects((await stored(page)).battle!.board, 0),
    ).toHaveLength(1);
    await expect(page.locator("#adventure-board-1 .shield-pip")).toHaveCount(0);
    await page.clock.runFor(1000);
    await expect.poll(async () => (await stored(page)).battle!.current).toBe(0);
    const giant = page
      .locator(".run-hand-card")
      .filter({ hasText: "Giant Receiver" });
    await expect(giant.locator(".edge > b")).toHaveText(["2", "2", "2", "2"]);
    await giant.click();
    await page.locator(`#adventure-board-${last}`).click();
    const placed = page.locator(`#adventure-board-${last} .capture-flip-back`);
    await expect(placed.locator(".edge > b")).toHaveText(["2", "2", "2", "2"]);
    await expect(placed.locator(".shield-pip")).toHaveCount(4);
    await expect(page.locator(".next-play-status")).toHaveCount(0);
    const snapshot = (await stored(page)).battle!.board;
    await page.setViewportSize({ width: 390, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `/tmp/skystones-tribes-${size}-phone.png`,
      fullPage: true,
    });
    await page.reload();
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    expect((await stored(page)).battle!.board).toEqual(snapshot);
  });

  test(`${size}×${size} shared-tribe Combo grants terrain before captures and Resonance counts both owners`, async ({
    page,
  }) => {
    let run = enterAdventureNode(newAdventure(size, 81), "moss");
    replaceHand(run, 0, {
      name: "First Giant",
      element: "fire",
      edges: [1, 1, 1, 1],
      keywords: [],
      tribes: ["giants"],
    });
    replaceHand(run, 1, {
      name: "Giant Relay",
      element: "water",
      edges: [1, 1, 1, 1],
      tribes: ["giants"],
      keywords: [
        { type: "resonance", element: "water", side: 0, tribe: "giants" },
        {
          type: "combo",
          condition: "tribe",
          tribe: "giants",
          pips: [{ side: 1, amount: 1 }],
          keywords: [
            {
              type: "environment",
              environment: { kind: "war-banner", amount: 1, tribe: "giants" },
            },
          ],
        },
      ],
    });
    weakOpponents(run);
    run = playAdventureCard(run, 0, 0);
    run = playAdventureCard(run, size * size - 1, 0);
    await openRun(page, run);
    const relay = page
      .locator(".run-hand-card")
      .filter({ hasText: "Giant Relay" });
    await expect(relay.locator(".edge > b")).toHaveText(["3", "2", "1", "1"]);
    await relay.click();
    await page.locator("#adventure-board-4").click();
    await page
      .getByRole("button", {
        name: `${coordinate(4, size)}, placing here`,
        exact: true,
      })
      .click();
    const placed = page.locator("#adventure-board-4 .capture-flip-back");
    await expect(placed.locator(".keyword-combo")).toHaveText("Combo Giants");
    await expect(placed.locator(".attack-pip")).toHaveCount(4);
    await expect(placed.locator(".edge > b")).toHaveText(["3", "2", "1", "1"]);
    const snapshot = (await stored(page)).battle!.board[4]!;
    expect(snapshot.comboActive).toBe(true);
    expect(snapshot.comboPrevious).toBe("fire");
    expect(snapshot.comboPreviousTribes).toEqual(["giants"]);
    expect(snapshot.activeKeywords).toEqual([
      {
        type: "resonance",
        side: 0,
        element: "water",
        tribe: "giants",
        bonus: 2,
      },
    ]);
    await page.locator("#adventure-board-4").click();
    await expect(page.getByRole("dialog")).toContainText("Giants");
    await expect(page.getByRole("dialog")).toContainText("War Banner");
    await page
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
    await page.reload();
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    expect((await stored(page)).battle!.board[4]).toEqual(snapshot);
  });
}
