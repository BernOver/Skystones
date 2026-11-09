import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { CHARACTER_STONES } from "../../src/characters.ts";
import { STARTER_STONES, handSize } from "../../src/game.ts";
import type { Stone } from "../../src/game.ts";
import { isSwapForce, swapCards } from "../../src/swapForce.ts";
import {
  newAdventure,
  enterAdventureNode,
  ADVENTURE_STORAGE,
} from "../../src/adventure.ts";
import {
  newDraft,
  nominateDraftCards,
  pickDraftCard,
  nominationCount,
  DRAFT_STORAGE,
} from "../../src/draft.ts";
if (process.env.SKYSTONES_STANDALONE === "1") {
  const html = readFileSync("standalone/Skystones.html", "utf8");
  let requests: string[];
  test.beforeEach(async ({ page }) => {
    requests = [];
    await page.route("**/*", (route) => {
      if (route.request().url() === "http://127.0.0.1:5173/")
        return route.fulfill({
          status: 200,
          contentType: "text/html",
          body: html,
        });
      requests.push(route.request().url());
      return route.abort();
    });
  });
  test.afterEach(() => expect(requests).toEqual([]));
}
test.beforeEach(({ page }) => {
  page.on("pageerror", (error) => {
    throw error;
  });
});
const native = (name: string) =>
  CHARACTER_STONES.find((card) => card.name === name)!;
const first: Stone = {
  ...native("Wash Buckler"),
  id: "custom-swap-wash",
  custom: true,
  edges: [5, 1, 2, 3],
  keywords: [
    { type: "shield", side: 0, amount: 2, half: "top" },
    { type: "head-start", side: 1, amount: 2, half: "bottom" },
  ],
};
const second: Stone = {
  ...native("Blast Zone"),
  id: "custom-swap-blast",
  custom: true,
  edges: [1, 4, 3, 2],
  keywords: [
    { type: "comeback", side: 3, amount: 1, half: "top" },
    { type: "shield", side: 2, amount: 3, half: "bottom" },
  ],
};
async function selectPair(page: Page) {
  await page.locator(".swap-card-choice").nth(0).click();
  await page.locator(".swap-card-choice").nth(1).click();
}
async function local(page: Page, size: 3 | 4, onlyOne = false) {
  const cards: Stone[] = [
    first,
    onlyOne ? { ...second, tribes: ["core"] } : second,
    ...Array.from({ length: handSize(size) - 2 }, (_, i) => ({
      ...STARTER_STONES[i],
      id: `custom-filler-${i}`,
      custom: true,
      tribes: ["core"] as Stone["tribes"],
    })),
  ];
  await page.addInitScript(
    (library) =>
      localStorage.setItem("skystones-library-v1", JSON.stringify(library)),
    {
      custom: cards,
      deck: cards.map((card) => card.id),
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
for (const size of [3, 4] as const)
  test(`${size}×${size} normal matches preview, cancel and apply SWAP Force halves without spending a turn`, async ({
    page,
  }) => {
    await local(page, size);
    await page
      .getByRole("button", {
        name: "Swap Force · exchange halves",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("button", { name: "Swap halves", exact: true }),
    ).toBeDisabled();
    await selectPair(page);
    await expect(
      page.locator(".swap-result-card .stone-caption > span"),
    ).toHaveText(["Wash Zone", "Blast Buckler"]);
    await expect(
      page.locator(".swap-result-card").first().locator(".edge > b"),
    ).toHaveText(["5", "4", "3", "3"]);
    await expect(page.locator(".swap-result .swap-art")).toHaveCount(2);
    const top = page.locator(".swap-result .swap-art-top").first();
    expect(
      await top.evaluate((element) => getComputedStyle(element).clipPath),
    ).not.toContain("50%");
    await page.setViewportSize({ width: 390, height: 1050 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page
      .locator(".swap-result")
      .screenshot({ path: `/tmp/skystones-swap-${size}-diagonal.png` });
    await page
      .getByLabel("Show SWAP Force artwork as top and bottom", { exact: true })
      .check();
    expect(
      await top.evaluate((element) => getComputedStyle(element).clipPath),
    ).toContain("50%");
    await page
      .locator(".swap-result")
      .screenshot({ path: `/tmp/skystones-swap-${size}-horizontal.png` });
    await page
      .getByRole("button", { name: "Cancel swap", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: /^Select Wash Buckler,/ }),
    ).toBeVisible();
    await expect(page.locator(".board-cell.filled")).toHaveCount(0);
    await page
      .getByRole("button", {
        name: "Swap Force · exchange halves",
        exact: true,
      })
      .click();
    await selectPair(page);
    await page
      .getByRole("button", { name: "Swap halves", exact: true })
      .click();
    await expect(page.locator(".hand-card-button")).toHaveCount(handSize(size));
    await expect(page.locator(".board-cell.filled")).toHaveCount(0);
    await page.getByRole("button", { name: /^Select Wash Zone,/ }).click();
    await page.locator("#board-0").click();
    await expect(
      page.locator("#board-0 .capture-flip-back .edge > b"),
    ).toHaveText(["5", "4", "3", "3"]);
    await expect(
      page.locator("#board-0 .capture-flip-back .shield-pip strong"),
    ).toHaveText(["+2", "+3"]);
    await page.locator("#board-0").click();
    await expect(
      page.getByRole("dialog").getByLabel("SWAP Force halves"),
    ).toContainText("Wash Buckler");
    await expect(
      page.getByRole("dialog").getByLabel("SWAP Force halves"),
    ).toContainText("Blast Zone");
    await page.keyboard.press("Escape");
    const stored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("skystones-library-v1")!),
    );
    expect(
      stored.custom.find((card: Stone) => card.id === first.id).edges,
    ).toEqual(first.edges);
    await page.reload();
    await page
      .getByRole("button", { name: "Board skins", exact: true })
      .click();
    await expect(
      page.getByLabel("Show SWAP Force artwork as top and bottom", {
        exact: true,
      }),
    ).toBeChecked();
  });
test("a single eligible card cannot swap with a card already in play or a non-SWAP Force hand card", async ({
  page,
}) => {
  await local(page, 3, true);
  await expect(
    page.getByRole("button", {
      name: "Swap Force · exchange halves",
      exact: true,
    }),
  ).toBeDisabled();
});
test("the card studio saves, exports and imports explicit top and bottom keywords", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Card studio", exact: true }).click();
  await page.getByLabel("Find a character portrait").fill("Wash Buckler");
  await page
    .getByRole("button", { name: "Use Wash Buckler portrait", exact: true })
    .click();
  await page.getByLabel("Stone name").fill("Half Warden");
  await page.getByRole("button", { name: /Add keyword/ }).click();
  await page.getByLabel("Keyword 1", { exact: true }).selectOption("shield");
  await page
    .getByLabel("Keyword half 1", { exact: true })
    .selectOption("bottom");
  await page.getByLabel("Shield pips 1", { exact: true }).fill("3");
  await expect(page.getByLabel("Keyword half 1", { exact: true })).toHaveValue(
    "bottom",
  );
  await page.getByRole("button", { name: /Add keyword/ }).click();
  await page.getByLabel("Keyword 2", { exact: true }).selectOption("conjure");
  await expect(page.getByLabel("Keyword half 2", { exact: true })).toHaveValue(
    "top",
  );
  await page
    .getByRole("button", { name: "Save to collection", exact: true })
    .click();
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page
    .getByRole("button", { name: "View Half Warden", exact: true })
    .click();
  const waiting = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export card file", exact: true })
    .click();
  const stream = await (await waiting).createReadStream(),
    chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const buffer = Buffer.concat(chunks),
    payload = JSON.parse(buffer.toString());
  expect(
    payload.card.keywords.map((keyword: { half: string }) => keyword.half),
  ).toEqual(["bottom", "top"]);
  await page.keyboard.press("Escape");
  await page.getByLabel("Import card file").setInputFiles({
    name: "half.skystone.json",
    mimeType: "application/json",
    buffer,
  });
  await page
    .getByRole("button", { name: "View Half Warden", exact: true })
    .last()
    .click();
  await page.getByRole("button", { name: "Edit stone", exact: true }).click();
  await expect(page.getByLabel("Keyword half 1", { exact: true })).toHaveValue(
    "bottom",
  );
  await expect(page.getByLabel("Keyword half 2", { exact: true })).toHaveValue(
    "top",
  );
});
for (const size of [3, 4] as const)
  test(`${size}×${size} Adventure keeps swaps and both portraits through reloads without changing the pack`, async ({
    page,
  }) => {
    let run = enterAdventureNode(newAdventure(size, 89), "moss");
    for (const [index, source] of [first, second].entries()) {
      const card = {
        ...source,
        id: run.inventory[index].id,
        baseEdges: source.edges,
        baseKeywords: source.keywords,
      };
      run.inventory[index] = card;
      run.battle!.hands[0][index] = card;
    }
    await page.clock.install({ time: new Date("2026-11-08T12:00:00Z") });
    await page.clock.pauseAt(new Date("2026-11-08T12:00:01Z"));
    await page.addInitScript(
      ({ key, run }) => {
        if (!localStorage.getItem(key))
          localStorage.setItem(key, JSON.stringify(run));
      },
      { key: ADVENTURE_STORAGE, run },
    );
    await page.goto("/");
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    const before = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      ADVENTURE_STORAGE,
    );
    await page
      .getByRole("button", {
        name: "Swap Force · exchange halves",
        exact: true,
      })
      .click();
    await selectPair(page);
    await page
      .getByRole("button", { name: "Swap halves", exact: true })
      .click();
    let saved = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      ADVENTURE_STORAGE,
    );
    expect(saved.battle.turns).toBe(0);
    expect(saved.inventory).toEqual(before.inventory);
    expect(saved.gold).toBe(before.gold);
    await page.reload();
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    await page.getByRole("button", { name: /^Select Wash Zone,/ }).click();
    await page.locator(".adventure-square.vacant:enabled").first().click();
    saved = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      ADVENTURE_STORAGE,
    );
    expect(saved.battle.board[0].stone.name).toBe("Wash Zone");
    expect(saved.battle.hands[0][0].name).toBe("Blast Buckler");
    expect(saved.inventory).toEqual(before.inventory);
    await page.reload();
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    await expect(
      page.locator(".adventure-square.occupied .capture-flip-back .swap-art"),
    ).toHaveCount(1);
    await expect(
      page.locator(".adventure-square.occupied .capture-flip-back .edge > b"),
    ).toHaveText(["5", "4", "3", "3"]);
  });
test("a drafted hand can swap its actual eligible cards while saved picks and card definitions stay intact", async ({
  page,
}) => {
  let ready: ReturnType<typeof newDraft> | undefined;
  for (let seed = 1; seed <= 250 && !ready; seed++) {
    let draft = newDraft(3, seed),
      quota = nominationCount(3);
    draft = nominateDraftCards(
      draft,
      draft.cards.slice(0, quota).map((card) => card.id),
    );
    draft = nominateDraftCards(
      draft,
      draft.cards.slice(quota, quota * 2).map((card) => card.id),
    );
    while (draft.phase === "draft")
      draft = pickDraftCard(draft, draft.offered[0]);
    const hand = draft.hands[0].map(
      (id) => draft.cards.find((card) => card.id === id)!,
    );
    if (hand.filter(isSwapForce).length >= 2) ready = draft;
  }
  expect(ready).toBeTruthy();
  await page.addInitScript(
    ({ key, draft }) => localStorage.setItem(key, JSON.stringify(draft)),
    { key: DRAFT_STORAGE, draft: ready },
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Draft", exact: true }).click();
  const before = await page.evaluate(
    (key) => localStorage.getItem(key),
    DRAFT_STORAGE,
  );
  await page
    .getByRole("button", { name: "Play drafted match", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Swap Force · exchange halves", exact: true })
    .click();
  await selectPair(page);
  const selected = ready!.hands[0]
      .map((id) => ready!.cards.find((card) => card.id === id)!)
      .filter(isSwapForce)
      .slice(0, 2),
    expected = swapCards(selected[0], selected[1]);
  await expect(
    page.locator(".swap-result-card .stone-caption > span"),
  ).toHaveText(expected.map((card) => card.name));
  await page.getByRole("button", { name: "Swap halves", exact: true }).click();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), DRAFT_STORAGE),
  ).toBe(before);
  await expect(page.locator(".board-cell.filled")).toHaveCount(0);
});
