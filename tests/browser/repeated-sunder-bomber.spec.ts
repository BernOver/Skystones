import { test, expect } from "@playwright/test";
import {
  ADVENTURE_STORAGE,
  enterAdventureNode,
  newAdventure,
} from "../../src/adventure.ts";
import { ENEMY_STONES } from "../../src/characters.ts";
import type { Page } from "@playwright/test";
import type { Adventure } from "../../src/adventure.ts";
async function openRun(page: Page, run: Adventure) {
  await page.addInitScript(
    ({ run, key }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(run));
    },
    { run, key: ADVENTURE_STORAGE },
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Adventure", exact: true }).click();
}
test("studio saves, exports and imports two Sunder entries on the same fixed edge and two on any edge", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Card studio", exact: true }).click();
  await page.getByLabel("Stone name").fill("Repeated Cutter");
  for (let index = 1; index <= 4; index++) {
    await page.getByRole("button", { name: /Add keyword/ }).click();
    await page
      .getByLabel(`Keyword ${index}`, { exact: true })
      .selectOption("sunder");
    await page
      .getByLabel(`Target edge ${index}`)
      .selectOption(index < 3 ? "1" : "any");
    await page.getByLabel(`Pips removed ${index}`).fill(String(index));
  }
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.locator(".preview-card .stone-keyword")).toHaveCount(4);
  await page
    .getByRole("button", { name: "Save to collection", exact: true })
    .click();
  await page.reload();
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page.getByRole("button", { name: "View Repeated Cutter" }).click();
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export card file" }).click();
  const stream = await (await pending).createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const buffer = Buffer.concat(chunks),
    keywords = JSON.parse(buffer.toString()).card.keywords;
  expect(keywords).toEqual([
    { type: "sunder", side: 1 },
    { type: "sunder", side: 1, amount: 2 },
    { type: "sunder", side: "any", amount: 3 },
    { type: "sunder", side: "any", amount: 4 },
  ]);
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByLabel("Import card file").setInputFiles({
    name: "repeat.skystone.json",
    mimeType: "application/json",
    buffer,
  });
  await expect(
    page.getByRole("button", { name: "View Repeated Cutter" }),
  ).toHaveCount(2);
});
for (const size of [3, 4] as const)
  test(`${size}×${size} separate same-edge Sunder targets can be canceled, resolve in order, and retain separate hover histories after reload`, async ({
    page,
  }) => {
    const run = enterAdventureNode(newAdventure(size, 81), "moss");
    const template = run.inventory[0];
    const cutter = {
      ...template,
      portrait: "spyro",
      origin: "skylanders" as const,
      name: "Twin Cutter",
      edges: [0, 0, 1, 0] as [number, number, number, number],
      keywords: [
        { type: "sunder" as const, side: 0 as const, amount: 2 },
        { type: "sunder" as const, side: 0 as const, amount: 1 },
      ],
    };
    run.inventory[0] = cutter;
    run.battle!.hands[0][0] = cutter;
    const victim = (id: string, north: number) => ({
      ...template,
      id,
      portrait: "gill-grunt",
      origin: "skylanders" as const,
      name: id,
      edges: [north, 0, 0, 0] as [number, number, number, number],
      keywords: [],
    });
    run.battle!.board[4] = { stone: victim("Target One", 5), owner: 1 };
    run.battle!.board[8] = { stone: victim("Target Two", 3), owner: 0 };
    run.battle!.turns = 2;
    await page.clock.install({ time: new Date("2026-10-25T12:00:00Z") });
    await page.clock.pauseAt(new Date("2026-10-25T12:00:01Z"));
    await openRun(page, run);
    await page.getByRole("button", { name: /^Select Twin Cutter,/ }).click();
    await page.locator("#adventure-board-1").click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /Target .*Target One/ })
      .click();
    await expect(
      page.getByRole("dialog").locator(".target-progress"),
    ).toContainText("Sunder");
    await page.getByRole("button", { name: "Cancel play" }).click();
    await expect(
      page.locator("#adventure-board-4 .capture-flip-back .edge-0 > b"),
    ).toHaveText("5");
    await page.locator("#adventure-board-1").click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /Target .*Target One/ })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /Target .*Target Two/ })
      .click();
    await expect(
      page.locator("#adventure-board-4 .capture-flip-back .edge-0 > b"),
    ).toHaveText("3");
    await expect(
      page.locator("#adventure-board-8 .capture-flip-back .edge-0 > b"),
    ).toHaveText("2");
    await page.locator("#adventure-board-1").click();
    const rules = page.getByRole("dialog").locator(".target-keyword-rule");
    await expect(rules).toHaveCount(2);
    await expect(rules.nth(0)).toContainText("North −2 on");
    await expect(rules.nth(0)).not.toContainText("North −1 on");
    await expect(rules.nth(1)).toContainText("North −1 on");
    await expect(rules.nth(1)).not.toContainText("North −2 on");
    await page.keyboard.press("Escape");
    // Pause the match by leaving the Adventure tab before its queued AI turn.
    await page.getByRole("button", { name: "The table", exact: true }).click();
    await page.reload();
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    await page.locator("#adventure-board-1").click();
    await expect(
      page.getByRole("dialog").locator(".target-keyword-rule").nth(1),
    ).toContainText("North −1 on");
  });
test("Bomber collection, maker and an old Adventure hand show right 3 / left 0", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page.getByLabel("Search stones").fill("Arkeyan Bomber");
  await page.getByRole("button", { name: "View Arkeyan Bomber" }).click();
  await expect(page.getByRole("dialog").locator(".edge > b")).toHaveText([
    "2",
    "3",
    "1",
    "0",
  ]);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Card studio", exact: true }).click();
  await page.getByLabel("Find a character portrait").fill("Arkeyan Bomber");
  await page
    .getByRole("button", { name: "Use Arkeyan Bomber portrait", exact: true })
    .click();
  await expect(page.locator(".preview-card .edge > b")).toHaveText([
    "2",
    "3",
    "1",
    "0",
  ]);
  const run = enterAdventureNode(newAdventure(3, 81), "moss"),
    bomber = ENEMY_STONES.find(
      (card) => card.portrait === "enemy-arkeyan-bomber",
    )!;
  const old = {
    ...bomber,
    id: run.inventory[0].id,
    edges: [2, 0, 1, 3],
    baseEdges: [2, 0, 1, 3],
  };
  run.inventory[0] = old as typeof bomber;
  run.battle!.hands[0][0] = old as typeof bomber;
  await page.evaluate(
    ({ key, run }) => localStorage.setItem(key, JSON.stringify(run)),
    { key: ADVENTURE_STORAGE, run },
  );
  await page.reload();
  await page.getByRole("button", { name: "Adventure", exact: true }).click();
  await expect(
    page.locator(".run-hand-card").first().locator(".edge > b"),
  ).toHaveText(["2", "3", "1", "0"]);
  await expect(
    page
      .locator(".run-hand-card")
      .first()
      .locator("img.skystones-original-art"),
  ).toBeVisible();
});
