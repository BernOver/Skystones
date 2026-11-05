import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import {
  ADVENTURE_STORAGE,
  dizzyEventCard,
  enterAdventureNode,
  newAdventure,
  playAdventureCard,
} from "../../src/adventure.ts";
import type { Adventure } from "../../src/adventure.ts";
async function open(page: Page, run: Adventure) {
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
async function stored(page: Page): Promise<Adventure> {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    ADVENTURE_STORAGE,
  );
}
test("create, export, import, and edit selected Dizzy sides", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Card studio", exact: true }).click();
  await page.getByLabel("Stone name").fill("Whirligig");
  await page.getByRole("button", { name: /Add keyword/ }).click();
  await page.getByLabel("Keyword 1", { exact: true }).selectOption("dizzy");
  await page.getByLabel("Dizzy East · Keyword 1", { exact: true }).check();
  await page.getByLabel("Dizzy North · Keyword 1", { exact: true }).uncheck();
  await expect(page.locator(".preview-card .dizzy-pip")).toHaveCount(1);
  await expect(page.locator(".preview-card .edge-1 .dizzy-pip")).toHaveText(
    "?",
  );
  await expect(page.locator(".keyword-editor")).toContainText(
    "Before captures",
  );
  await page
    .getByRole("button", { name: "Save to collection", exact: true })
    .click();
  await page.reload();
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page.getByRole("button", { name: "View Whirligig" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export card file" }).click();
  const stream = await (await downloadPromise).createReadStream(),
    chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const buffer = Buffer.concat(chunks);
  expect(JSON.parse(buffer.toString()).card.keywords).toEqual([
    { type: "dizzy", sides: [1] },
  ]);
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByLabel("Import card file").setInputFiles({
    name: "whirl.skystone.json",
    mimeType: "application/json",
    buffer,
  });
  await expect(page.locator(".toast")).toContainText(
    "Whirligig has joined your collection.",
  );
});
test("Whirling Idol event awards the 12-pip Dizzy card once and saves it without changing the selected deck", async ({
  page,
}) => {
  const run = enterAdventureNode(
    { ...newAdventure(3, 30), floor: 1 },
    "whirling-idol",
  );
  await open(page, run);
  await expect(page.locator(".dizzy-event-card .edge b")).toHaveText([
    "4",
    "4",
    "4",
    "0",
  ]);
  await page
    .getByRole("button", { name: "Claim Whirling Idol · 12 pips" })
    .click();
  const saved = await stored(page);
  expect(saved.floor).toBe(2);
  expect(saved.inventory.at(-1)!.keywords).toEqual([{ type: "dizzy" }]);
  expect(saved.deck).toEqual(run.deck);
  await page.reload();
  await page.getByRole("button", { name: "Adventure", exact: true }).click();
  expect((await stored(page)).inventory).toHaveLength(run.inventory.length + 1);
  await expect(
    page.getByRole("button", { name: "Claim Whirling Idol · 12 pips" }),
  ).toHaveCount(0);
});
test("Loaded Dice rolls once, Oracle reveals the keeper, and Stout Heart displays four lives across reload", async ({
  page,
}) => {
  const run = enterAdventureNode(
    {
      ...newAdventure(4, 72),
      lives: 4,
      relics: ["loaded-dice", "oracles-eye", "stout-heart"],
    },
    "moss",
  );
  const card = dizzyEventCard(run);
  run.battle!.hands[0][0] = card;
  await open(page, run);
  await expect(page.locator(".run-enemy-card")).toHaveCount(8);
  await page.locator(".run-enemy-card").first().hover();
  await expect(page.getByRole("tooltip")).toContainText("Keeper’s hand");
  await expect(page.locator(".run-toolbar")).toContainText("4/4");
  await page.locator(".run-hand-card").first().click();
  await page.locator(".adventure-square.vacant").first().click();
  await expect.poll(async () => (await stored(page)).battle!.turns).toBe(2);
  const snapshot = (await stored(page)).battle!.board.find(
    (cell) => cell?.stone.id === card.id,
  )!;
  expect(snapshot.dizzy!.timing).toBe("before-captures");
  expect(snapshot.edges!.every((edge) => edge >= 2 && edge <= 5)).toBe(true);
  const boardCard = page
    .locator(".adventure-square.occupied")
    .filter({ hasText: card.name });
  await page.mouse.move(0, 0);
  await boardCard.hover();
  await expect(page.getByRole("tooltip")).toContainText("Rolled once");
  await page.reload();
  await page.getByRole("button", { name: "Adventure", exact: true }).click();
  expect(
    (await stored(page)).battle!.board.find(
      (cell) => cell?.stone.id === card.id,
    )!.edges,
  ).toEqual(snapshot.edges);
});
for (const size of [3, 4] as const)
  test(`${size}×${size} Dizzy marks only East, rolls before captures, and keeps its result after reload`, async ({
    page,
  }) => {
    const run = enterAdventureNode(newAdventure(size, 42), "moss");
    const card = {
      ...run.inventory[0],
      name: "Dizzy East",
      portrait: "pop-fizz",
      origin: "skylanders" as const,
      edges: [2, 0, 1, 3] as [number, number, number, number],
      baseEdges: [2, 0, 1, 3] as [number, number, number, number],
      keywords: [{ type: "dizzy" as const, sides: [1 as const] }],
      baseKeywords: [{ type: "dizzy" as const, sides: [1 as const] }],
    };
    run.inventory[0] = card;
    run.battle!.hands[0][0] = card;
    run.battle!.board[5] = {
      stone: { ...run.battle!.hands[1][0], keywords: [], edges: [0, 0, 0, 3] },
      owner: 1,
    };
    for (let seed = 1; seed < 1000; seed++) {
      run.seed = seed;
      if (playAdventureCard(run, 4, 0).battle!.board[5]!.owner === 0) break;
    }
    await page.clock.install({ time: new Date("2026-10-25T12:00:00Z") });
    await page.clock.pauseAt(new Date("2026-10-25T12:00:01Z"));
    await open(page, run);
    const hand = page.locator(".run-hand-card").first();
    await expect(hand.locator(".dizzy-pip")).toHaveCount(1);
    await expect(hand.locator(".edge-1 .dizzy-pip")).toHaveText("?");
    await hand.click();
    await page.locator("#adventure-board-4").click();
    const snapshot = (await stored(page)).battle!.board[4]!;
    expect(snapshot.dizzy!.sides).toEqual([1]);
    expect(snapshot.dizzy!.timing).toBe("before-captures");
    expect(snapshot.edges![1]).toBeGreaterThan(3);
    expect([
      snapshot.edges![0],
      snapshot.edges![2],
      snapshot.edges![3],
    ]).toEqual([2, 1, 3]);
    expect((await stored(page)).battle!.board[5]!.owner).toBe(0);
    const played = page.locator("#adventure-board-4 .capture-flip-back");
    await expect(played.locator(".dizzy-pip")).toHaveCount(0);
    await page.locator("#adventure-board-4").click();
    await expect(page.getByRole("dialog")).toContainText("Before captures");
    await expect(page.getByRole("dialog")).toContainText("Rolled once");
    await expect(page.getByRole("dialog").locator(".dizzy-pip")).toHaveCount(0);
    await page.reload();
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    expect((await stored(page)).battle!.board[4]).toEqual(snapshot);
    await expect(played.locator(".edge > b")).toHaveText(
      snapshot.edges!.map(String),
    );
  });
test("Market Map and Rune Echo show expanded stock and opposite-edge upgrades", async ({
  page,
}) => {
  const run = enterAdventureNode(
    {
      ...newAdventure(3, 40),
      floor: 2,
      gold: 300,
      relics: ["market-map", "rune-echo", "whetstone-ring", "elemental-prism"],
    },
    "shop-one",
  );
  await open(page, run);
  await expect(page.locator(".shop-card")).toHaveCount(4);
  await expect(page.getByLabel("Workshop service")).toContainText(
    "Sharpen · +2",
  );
  await page.getByLabel("Workshop service").selectOption("keyword");
  await expect(page.locator(".workshop-offer")).toContainText(
    "Rune Echo also inscribes",
  );
  await page.screenshot({
    path: "/tmp/skystones-thirty-relic-shop.png",
    fullPage: true,
  });
});
test("Bottomless Bottle keeps the first combat potion and consumes the second use", async ({
  page,
}) => {
  const run = enterAdventureNode(
    {
      ...newAdventure(3, 8),
      lives: 1,
      potions: ["heal"],
      relics: ["bottomless-bottle"],
    },
    "moss",
  );
  await open(page, run);
  await page.getByRole("button", { name: /Use Healing Draught/ }).click();
  expect((await stored(page)).lives).toBe(2);
  expect((await stored(page)).potions).toEqual(["heal"]);
  await page.getByRole("button", { name: /Use Healing Draught/ }).click();
  expect((await stored(page)).lives).toBe(3);
  expect((await stored(page)).potions).toEqual([]);
});
