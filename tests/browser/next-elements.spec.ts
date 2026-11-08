import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { STARTER_STONES, handSize, withArenaElement } from "../../src/game.ts";
import type { Stone, StoneKeyword } from "../../src/game.ts";
import {
  newAdventure,
  enterAdventureNode,
  playAdventureCard,
  ADVENTURE_STORAGE,
} from "../../src/adventure.ts";
import type { Adventure } from "../../src/adventure.ts";
import {
  newDraft,
  nominateDraftCards,
  pickDraftCard,
  DRAFT_STORAGE,
} from "../../src/draft.ts";
import {
  originalCharacter,
  editedCharacterDefault,
  CHARACTER_DEFAULTS_STORAGE,
} from "../../src/cardDefaults.ts";
import { pendingPipEffects } from "../../src/effects.ts";
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
const effect: StoneKeyword = {
  type: "next-play",
  side: "all",
  amount: 1,
  recipient: "self",
  element: "water",
  tribe: "giants",
  changeElement: "fire",
};
async function targets(page: Page) {
  while (await page.locator(".target-cell.available").count()) {
    await page.locator(".target-cell.available").first().click();
    const sides = page
      .getByRole("group", { name: "Choose the edge that loses pips" })
      .locator("button:enabled");
    if (await sides.count()) await sides.first().click();
  }
}
async function stored(page: Page): Promise<Adventure> {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    ADVENTURE_STORAGE,
  );
}
test("studio saves element-only changes, combined requirements, and nested changes through Combo and Conjure", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.goto("/");
  await page.getByRole("button", { name: "Card studio", exact: true }).click();
  await page.getByLabel("Stone name").fill("Element Caller");
  await page.getByRole("button", { name: /^Add keyword/ }).click();
  await page.getByLabel("Keyword 1", { exact: true }).selectOption("next-play");
  await page
    .getByLabel("Recipient element · Keyword 1", { exact: true })
    .selectOption("water");
  await page
    .getByLabel("Recipient tribe · Keyword 1", { exact: true })
    .selectOption("giants");
  await page
    .getByLabel("Change element · Keyword 1", { exact: true })
    .selectOption("fire");
  await page
    .getByLabel("Pip change · Keyword 1", { exact: true })
    .selectOption("0");
  await page
    .getByRole("button", {
      name: "Add Next Play keyword · Keyword 1",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Remove Keyword 1 grant 1", exact: true })
    .click();
  await expect(
    page.getByLabel("Pip change · Keyword 1", { exact: true }),
  ).toHaveValue("0");
  await page.getByRole("button", { name: /^Add keyword/ }).click();
  await page.getByLabel("Keyword 2", { exact: true }).selectOption("combo");
  await page
    .getByRole("button", { name: "Add Combo keyword", exact: true })
    .click();
  await page
    .getByLabel("Combo keyword 1", { exact: true })
    .selectOption("next-play");
  await page
    .getByLabel("Recipient element · Combo keyword 1", { exact: true })
    .selectOption("air");
  await page
    .getByLabel("Change element · Combo keyword 1", { exact: true })
    .selectOption("magic");
  await page
    .getByLabel("Pip change · Combo keyword 1", { exact: true })
    .selectOption("0");
  await page.getByRole("button", { name: /^Add keyword/ }).click();
  await page.getByLabel("Keyword 3", { exact: true }).selectOption("conjure");
  await page
    .getByRole("button", {
      name: "Add Conjure keyword · Keyword 3",
      exact: true,
    })
    .click();
  await page
    .getByLabel("Keyword 3 grant 1", { exact: true })
    .selectOption("next-play");
  await page
    .getByLabel("Recipient element · Keyword 3 grant 1", { exact: true })
    .selectOption("dark");
  await page
    .getByLabel("Change element · Keyword 3 grant 1", { exact: true })
    .selectOption("light");
  await page
    .getByLabel("Pip change · Keyword 3 grant 1", { exact: true })
    .selectOption("0");
  await expect(page.locator(".preview-card .keyword-next-play")).toContainText(
    "Become Fire",
  );
  await expect(page.locator(".preview-card .keyword-next-play")).toContainText(
    "IF Water Giants",
  );
  await page.setViewportSize({ width: 390, height: 1000 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .locator(".keyword-editor")
    .screenshot({ path: "/tmp/skystones-next-elements-studio-phone.png" });
  await page
    .getByRole("button", { name: "Save to collection", exact: true })
    .click();
  await page.reload();
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page
    .getByRole("button", { name: "View Element Caller", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Your next Water Giants card",
  );
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export card file", exact: true })
    .click();
  const stream = await (await download).createReadStream(),
    chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const buffer = Buffer.concat(chunks),
    keywords = JSON.parse(buffer.toString()).card.keywords;
  expect(keywords[0]).toEqual({
    type: "next-play",
    side: 0,
    amount: 0,
    recipient: "self",
    element: "water",
    tribe: "giants",
    changeElement: "fire",
  });
  expect(keywords[1].keywords[0]).toMatchObject({
    type: "next-play",
    element: "air",
    changeElement: "magic",
    amount: 0,
  });
  expect(keywords[2].keywords[0]).toMatchObject({
    type: "next-play",
    element: "dark",
    changeElement: "light",
    amount: 0,
  });
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page
    .getByLabel("Import card file")
    .setInputFiles({
      name: "element-caller.skystone.json",
      mimeType: "application/json",
      buffer,
    });
  await expect(page.locator(".toast")).toContainText(
    "has joined your collection",
  );
  await page
    .getByRole("button", { name: "View Element Caller", exact: true })
    .last()
    .click();
  await page.getByRole("button", { name: "Edit stone", exact: true }).click();
  await expect(
    page.getByLabel("Recipient element · Keyword 1", { exact: true }),
  ).toHaveValue("water");
  await expect(
    page.getByLabel("Change element · Keyword 1", { exact: true }),
  ).toHaveValue("fire");
});

for (const size of [3, 4] as const) {
  test(`${size}×${size} normal play waits for both requirements, previews the new element and applies its pips once`, async ({
    page,
  }) => {
    const custom: Stone[] = Array.from({ length: handSize(size) }, (_, i) => ({
      ...STARTER_STONES[i],
      id: `custom-next-element-${i}`,
      name:
        i === 0
          ? "Element Caller"
          : i === 1
            ? "Mini Scout"
            : i === 2
              ? "Giant Receiver"
              : `Filler ${i}`,
      custom: true,
      element: i ? "water" : "fire",
      tribes: i === 2 ? ["giants"] : ["minis"],
      edges: i ? [1, 1, 1, 1] : [0, 0, 0, 0],
      keywords: i ? [] : [effect],
    }));
    await page.addInitScript(
      (library) =>
        localStorage.setItem("skystones-library-v1", JSON.stringify(library)),
      {
        custom,
        deck: custom.map((card) => card.id),
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
    await page.getByRole("button", { name: /^Select Element Caller,/ }).click();
    await page.locator("#board-0").click();
    await page.locator(".hand-card-button").first().click();
    await page.locator(`#board-${size * size - 1}`).click();
    await targets(page);
    const mini = page.getByRole("button", { name: /^Select Mini Scout,/ });
    await expect(mini.locator(".edge > b")).toHaveText(["1", "1", "1", "1"]);
    await mini.click();
    await page.locator("#board-1").click();
    await expect(page.locator(".next-play-status")).toContainText(
      "next Water Giants card",
    );
    await page.locator(".hand-card-button").first().click();
    await page.locator(`#board-${size * (size - 1)}`).click();
    await targets(page);
    const giant = page.getByRole("button", { name: /^Select Giant Receiver,/ });
    await expect(giant.locator(".edge > b")).toHaveText(["2", "2", "2", "2"]);
    await giant.hover();
    await expect(page.getByRole("tooltip")).toContainText(
      "Next Play element preview",
    );
    await expect(page.getByRole("tooltip")).toContainText("Water → Fire");
    await page.keyboard.press("Escape");
    await giant.click();
    await page.locator(`#board-${size + 1}`).click();
    await expect(page.locator(".next-play-status")).toHaveCount(0);
    await page.locator(`#board-${size + 1}`).click();
    await expect(page.getByRole("dialog")).toContainText(
      "Next Play element received",
    );
    await expect(page.getByRole("dialog")).toContainText("Water → Fire");
  });

  test(`${size}×${size} Adventure previews changed-element Combo and boss bonuses, cancels safely, captures with terrain, then reloads exactly`, async ({
    page,
  }) => {
    let run = enterAdventureNode(newAdventure(size, 81), "moss");
    const placement = size + 1,
      guardIndex = size + 2;
    const source = {
      ...run.inventory[0],
      name: "Element Caller",
      element: "fire" as const,
      edges: [0, 0, 0, 0] as Stone["edges"],
      keywords: [
        {
          ...effect,
          keywords: [
            { type: "sunder" as const, side: 0 as const },
            { type: "shield" as const, side: 2 as const, amount: 2 },
          ],
        },
        {
          type: "environment" as const,
          environment: {
            kind: "elemental" as const,
            element: "fire" as const,
            side: "all" as const,
            amount: 1,
          },
        },
      ],
    };
    const receiver = {
      ...run.inventory[1],
      name: "Giant Receiver",
      element: "water" as const,
      tribes: ["giants" as const],
      edges: [1, 1, 1, 1] as Stone["edges"],
      keywords: [
        { type: "combo" as const, pips: [{ side: 1 as const, amount: 2 }] },
      ],
    };
    run.inventory[0] = source;
    run.inventory[1] = receiver;
    run.battle!.hands[0][0] = source;
    run.battle!.hands[0][1] = receiver;
    run = playAdventureCard(run, 0, 0, [
      { keywordIndex: 1, boardIndex: placement },
    ]);
    run.battle!.hands[1][0] = {
      ...run.battle!.hands[1][0],
      name: "Stone Guard",
      element: "earth",
      edges: [2, 1, 1, 5],
      keywords: [],
    };
    run = playAdventureCard(run, guardIndex, 0);
    run.battle!.boss = "kaos-vortex";
    run.battle!.elementCycle = [
      "magic",
      "water",
      "fire",
      "life",
      "air",
      "earth",
      "tech",
      "undead",
      "light",
      "dark",
    ];
    run.battle!.board = withArenaElement(run.battle!.board, "fire");
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
    const hand = page.getByRole("button", {
      name: /^Select Giant Receiver, adventure card/,
    });
    await expect(hand.locator(".edge > b")).toHaveText(["3", "5", "3", "3"]);
    await expect(hand.locator(".keyword-combo")).toContainText("Fire");
    const before = await stored(page);
    await hand.click();
    await page.locator(`#adventure-board-${placement}`).click();
    await expect(page.getByRole("dialog")).toContainText("Sunder");
    await page
      .getByRole("button", { name: "Cancel play", exact: true })
      .click();
    expect(await stored(page)).toEqual(before);
    if ((await hand.getAttribute("aria-pressed")) !== "true")
      await hand.click();
    await page.locator(`#adventure-board-${placement}`).click();
    await page.getByRole("button", { name: /^Target B3:/ }).click();
    const after = await stored(page),
      cell = after.battle!.board[placement]!;
    expect(cell.stone.element).toBe("fire");
    expect(cell.playedElement).toBe("water");
    expect(cell.comboActive).toBe(true);
    expect(cell.stone.receivedElement).toEqual({
      before: "water",
      after: "fire",
    });
    expect(after.battle!.board[guardIndex]!.owner).toBe(0);
    expect(pendingPipEffects(after.battle!.board, 0)).toHaveLength(0);
    expect(after.inventory).toEqual(before.inventory);
    await page.reload();
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    expect((await stored(page)).battle).toEqual(after.battle);
    await page.locator(`#adventure-board-${placement}`).click();
    await expect(page.getByRole("dialog")).toContainText(
      "Next Play element received",
    );
    await page.setViewportSize({ width: 390, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}

test("Draft defaults queue element-only changes and keep saved picks unchanged", async ({
  page,
}) => {
  const base = newDraft(3, 47, {}).cards[0],
    original = originalCharacter(base.portrait)!;
  const defaults = editedCharacterDefault(
    original.portrait!,
    {
      ...original,
      name: "Draft Element Caller",
      element: "magic",
      edges: [0, 0, 0, 0],
      keywords: [
        {
          type: "next-play",
          side: 0,
          amount: 0,
          recipient: "self",
          changeElement: "dark",
        },
      ],
    },
    {},
  );
  let draft = newDraft(3, 47, defaults, true, true, true, false);
  draft = nominateDraftCards(
    draft,
    draft.cards.slice(0, 6).map((card) => card.id),
  );
  draft = nominateDraftCards(
    draft,
    draft.cards.slice(6, 12).map((card) => card.id),
  );
  while (draft.phase === "draft")
    draft = pickDraftCard(
      draft,
      draft.offered.includes(base.id) ? base.id : draft.offered[0],
    );
  const owner = draft.hands[0].includes(base.id) ? 0 : 1;
  await page.addInitScript(
    ({ draft, defaults, key, defaultsKey }) => {
      localStorage.setItem(key, JSON.stringify(draft));
      localStorage.setItem(defaultsKey, JSON.stringify(defaults));
    },
    {
      draft,
      defaults,
      key: DRAFT_STORAGE,
      defaultsKey: CHARACTER_DEFAULTS_STORAGE,
    },
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Draft", exact: true }).click();
  await page
    .getByRole("button", { name: "Play drafted match", exact: true })
    .click();
  if (owner === 1) {
    await page.locator(".hand-card-button").first().click();
    await page.locator("#board-8").click();
    await targets(page);
  }
  await page
    .getByRole("button", { name: /^Select Draft Element Caller,/ })
    .click();
  await page.locator("#board-0").click();
  await expect(page.locator(".next-play-status")).toContainText("Become Dark");
  await page.locator(".hand-card-button").first().click();
  await page.locator(".board-cell.empty:enabled").first().click();
  await targets(page);
  await page.locator(".hand-card-button").first().hover();
  await expect(page.getByRole("tooltip")).toContainText("→ Dark");
  await page.keyboard.press("Escape");
  await page.locator(".hand-card-button").first().click();
  await page.locator("#board-4").click();
  await targets(page);
  await expect(page.locator(".next-play-status")).toHaveCount(0);
  await page.locator("#board-4").click();
  await expect(page.getByRole("dialog")).toContainText(
    "Next Play element received",
  );
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      DRAFT_STORAGE,
    ),
  ).toEqual(JSON.parse(JSON.stringify(draft)));
});
