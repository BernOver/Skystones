import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import {
  ADVENTURE_STORAGE,
  dizzyEventCard,
  enterAdventureNode,
  newAdventure,
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
test("create, export, import, and edit a whole-card Dizzy keyword", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Card studio", exact: true }).click();
  await page.getByLabel("Stone name").fill("Whirligig");
  await page.getByRole("button", { name: /Add keyword/ }).click();
  await page.getByLabel("Keyword 1", { exact: true }).selectOption("dizzy");
  await expect(page.getByLabel("Affected edge 1")).toHaveCount(0);
  await expect(page.locator(".keyword-editor")).toContainText(
    "After this card is placed and finishes its captures",
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
    { type: "dizzy" },
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
test("Loaded Dice shuffles once, Oracle reveals the keeper, and Stout Heart displays four lives across reload", async ({
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
  expect(snapshot.edges!.reduce((a, b) => a + b, 0)).toBe(12);
  expect(snapshot.edges!.every((edge) => edge >= 2 && edge <= 5)).toBe(true);
  const boardCard = page
    .locator(".adventure-square.occupied")
    .filter({ hasText: card.name });
  await page.mouse.move(0, 0);
  await boardCard.hover();
  await expect(page.getByRole("tooltip")).toContainText("Shuffled once");
  await page.reload();
  await page.getByRole("button", { name: "Adventure", exact: true }).click();
  expect(
    (await stored(page)).battle!.board.find(
      (cell) => cell?.stone.id === card.id,
    )!.edges,
  ).toEqual(snapshot.edges);
});
for (const size of [3, 4] as const)
  test(`${size}×${size} boosted Dizzy reaches five on every edge and keeps that snapshot after reload`, async ({
    page,
  }) => {
    const run = enterAdventureNode(
      { ...newAdventure(size, 42), relics: ["loaded-dice"] },
      "moss",
    );
    const card = {
      ...run.inventory[0],
      name: "Dizzy Five",
      portrait: "pop-fizz",
      origin: "skylanders" as const,
      edges: [3, 3, 3, 3] as [number, number, number, number],
      baseEdges: [3, 3, 3, 3] as [number, number, number, number],
      keywords: [{ type: "dizzy" as const }],
      baseKeywords: [{ type: "dizzy" as const }],
    };
    run.inventory[0] = card;
    run.battle!.hands[0][0] = card;
    run.potions = ["power", "power"];
    await page.clock.install({ time: new Date("2026-10-25T12:00:00Z") });
    await page.clock.pauseAt(new Date("2026-10-25T12:00:01Z"));
    await open(page, run);
    for (let use = 0; use < 2; use++) {
      await page
        .getByRole("button", { name: "Use Power Tonic", exact: true })
        .first()
        .click();
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Empower Dizzy Five", exact: true })
        .click();
    }
    await page.locator(".run-hand-card").first().click();
    await page.locator("#adventure-board-0").click();
    await expect(
      page.locator("#adventure-board-0 .capture-flip-back .edge > b"),
    ).toHaveText(["5", "5", "5", "5"]);
    const snapshot = (await stored(page)).battle!.board[0]!;
    expect(snapshot.dizzy!.after).toEqual([5, 5, 5, 5]);
    await page.locator("#adventure-board-0").click();
    await expect(page.getByRole("dialog")).toContainText(
      "at most 5 pips per edge",
    );
    await expect(page.getByRole("dialog")).toContainText("up to 20");
    await page.reload();
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    expect((await stored(page)).battle!.board[0]).toEqual(snapshot);
    await expect(
      page.locator("#adventure-board-0 .capture-flip-back .edge > b"),
    ).toHaveText(["5", "5", "5", "5"]);
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
