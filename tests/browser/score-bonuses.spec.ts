import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { placeStone } from "../../src/game.ts";
import {
  newAdventure,
  enterAdventureNode,
  ADVENTURE_STORAGE,
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
async function stored(page: Page): Promise<Adventure> {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    ADVENTURE_STORAGE,
  );
}
test("configure stronger score bonuses directly and through Combo, Conjure and Next Play, then share and reload them", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.goto("/");
  await page.getByRole("button", { name: "Card studio", exact: true }).click();
  await page.getByLabel("Stone name").fill("Turning the Tide");
  await page.getByRole("button", { name: /^Add keyword/ }).click();
  await page.getByLabel("Affected edge 1", { exact: true }).selectOption("1");
  await page.getByLabel("Bonus pips 1", { exact: true }).fill("4");
  await page.getByRole("button", { name: /^Add keyword/ }).click();
  await page.getByLabel("Keyword 2", { exact: true }).selectOption("comeback");
  await page.getByLabel("Affected edge 2", { exact: true }).selectOption("3");
  await page.getByLabel("Bonus pips 2", { exact: true }).fill("3");
  await page.getByRole("button", { name: /^Add keyword/ }).click();
  await page.getByLabel("Keyword 3", { exact: true }).selectOption("combo");
  await page
    .getByRole("button", { name: "Add Combo keyword", exact: true })
    .click();
  await page
    .getByLabel("Combo keyword 1", { exact: true })
    .selectOption("head-start");
  await page
    .getByLabel("Bonus pips Combo keyword 1", { exact: true })
    .fill("7");
  await page.getByRole("button", { name: /^Add keyword/ }).click();
  await page.getByLabel("Keyword 4", { exact: true }).selectOption("conjure");
  await page
    .getByRole("button", {
      name: "Add Conjure keyword · Keyword 4",
      exact: true,
    })
    .click();
  await page
    .getByLabel("Keyword 4 grant 1", { exact: true })
    .selectOption("comeback");
  await page.getByLabel("Bonus pips 4 grant 1", { exact: true }).fill("5");
  await page.getByRole("button", { name: /^Add keyword/ }).click();
  await page.getByLabel("Keyword 5", { exact: true }).selectOption("next-play");
  await page
    .getByRole("button", {
      name: "Add Next Play keyword · Keyword 5",
      exact: true,
    })
    .click();
  await page
    .getByLabel("Keyword 5 grant 1", { exact: true })
    .selectOption("head-start");
  await page.getByLabel("Bonus pips 5 grant 1", { exact: true }).fill("6");
  await expect(page.locator(".preview-card .keyword-head-start")).toContainText(
    "E +4",
  );
  await expect(page.locator(".preview-card .keyword-comeback")).toContainText(
    "W +3",
  );
  await page.setViewportSize({ width: 390, height: 1000 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    (await page.getByLabel("Bonus pips 1", { exact: true }).boundingBox())!
      .width,
  ).toBeGreaterThanOrEqual(60);
  await page
    .getByRole("button", { name: "Save to collection", exact: true })
    .click();
  await page.reload();
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page
    .getByRole("button", { name: "View Turning the Tide", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("East +4 pips");
  await expect(page.getByRole("dialog")).toContainText("West +3 pips");
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export card file", exact: true })
    .click();
  const stream = await (await download).createReadStream(),
    chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const buffer = Buffer.concat(chunks),
    keywords = JSON.parse(buffer.toString()).card.keywords;
  expect(keywords[0]).toEqual({ type: "head-start", side: 1, amount: 4 });
  expect(keywords[1]).toEqual({ type: "comeback", side: 3, amount: 3 });
  expect(keywords[2].keywords[0].amount).toBe(7);
  expect(keywords[3].keywords[0].amount).toBe(5);
  expect(keywords[4].keywords[0].amount).toBe(6);
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page
    .getByLabel("Import card file")
    .setInputFiles({
      name: "strong.skystone.json",
      mimeType: "application/json",
      buffer,
    });
  await expect(page.locator(".toast")).toContainText(
    "has joined your collection",
  );
  await page
    .getByRole("button", { name: "View Turning the Tide", exact: true })
    .last()
    .click();
  await page.getByRole("button", { name: "Edit stone", exact: true }).click();
  await expect(page.getByLabel("Bonus pips 1", { exact: true })).toHaveValue(
    "4",
  );
  await expect(page.getByLabel("Bonus pips 2", { exact: true })).toHaveValue(
    "3",
  );
});

for (const size of [3, 4] as const)
  for (const type of ["head-start", "comeback"] as const)
    test(`${size}×${size} ${type} gains three pips before captures and preserves them after the score changes and reloads`, async ({
      page,
    }) => {
      const run = enterAdventureNode(newAdventure(size, 81), "moss"),
        last = size * size - 1,
        placement = size + 1;
      const source = {
        ...run.inventory[0],
        name: "Strong Score Stone",
        edges: [1, 1, 1, 1] as [number, number, number, number],
        keywords: [{ type, side: 0 as const, amount: 3 }],
      };
      run.inventory[0] = source;
      run.battle!.hands[0][0] = source;
      const guard = {
        ...run.battle!.hands[1][0],
        id: "custom-score-guard",
        edges: [0, 0, 3, 0] as [number, number, number, number],
        keywords: [],
      };
      run.battle!.board = placeStone(run.battle!.board, 1, guard, 1).board;
      if (type === "head-start")
        for (const index of [last, last - 1])
          run.battle!.board = placeStone(
            run.battle!.board,
            index,
            { ...guard, id: `custom-score-ally-${index}`, edges: [0, 0, 0, 0] },
            0,
          ).board;
      run.battle!.turns = run.battle!.board.filter(Boolean).length;
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
      await page
        .getByRole("button", { name: "Adventure", exact: true })
        .click();
      const hand = page.getByRole("button", {
        name: /^Select Strong Score Stone, adventure card/,
      });
      await expect(hand.locator(".edge > b")).toHaveText(["4", "1", "1", "1"]);
      await expect(hand.locator(`.keyword-${type}`)).toContainText("N +3");
      await hand.click();
      await page.locator(`#adventure-board-${placement}`).click();
      const snapshot = (await stored(page)).battle!;
      expect(snapshot.board[1]!.owner).toBe(0);
      expect(snapshot.board[placement]!.edges).toEqual([4, 1, 1, 1]);
      expect(snapshot.board[placement]!.activeKeywords).toEqual([
        { type, side: 0, amount: 3 },
      ]);
      await page.reload();
      await page
        .getByRole("button", { name: "Adventure", exact: true })
        .click();
      expect((await stored(page)).battle).toEqual(snapshot);
      await page.locator(`#adventure-board-${placement}`).click();
      await expect(page.getByRole("dialog")).toContainText("North +3 pips");
      await expect(page.getByRole("dialog")).toContainText(
        "Activated when played",
      );
    });
