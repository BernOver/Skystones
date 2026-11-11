import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { STARTER_STONES, EMPTY_BOARD } from "../../src/game.ts";
import type { Stone, StoneKeyword } from "../../src/game.ts";
import {
  ADVENTURE_STORAGE,
  newAdventure,
  enterAdventureNode,
  playAdventureCard,
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
  page.on("pageerror", (error) => {
    throw error;
  }),
);
const make = (name: string, keywords: StoneKeyword[] = []): Stone => ({
  ...STARTER_STONES[0],
  id: `custom-${name.toLowerCase().replaceAll(" ", "-")}`,
  custom: true,
  name,
  element: "magic",
  edges: [4, 0, 1, 0],
  keywords,
});
const read = (page: Page) =>
  page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    ADVENTURE_STORAGE,
  );

test("studio creates a selected-side Shuffle and an Enchant spell granting Shield and Comeback", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Card studio", exact: true }).click();
  await page.getByLabel("Stone name").fill("Shuffle Smith");
  await page.getByRole("button", { name: /^Add keyword/ }).click();
  await page.getByLabel("Keyword 1", { exact: true }).selectOption("shuffle");
  await expect(page.getByLabel("Shuffle North · Keyword 1")).toBeChecked();
  await expect(page.getByLabel("Shuffle East · Keyword 1")).toBeChecked();
  await expect(page.getByLabel("Shuffle North · Keyword 1")).toBeDisabled();
  await page.getByLabel("Shuffle South · Keyword 1").check();
  await page.getByLabel("Shuffle East · Keyword 1").uncheck();
  await page
    .getByRole("button", { name: "Save to collection", exact: true })
    .click();
  let library = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("skystones-library-v1")!),
  );
  expect(
    library.custom.find((card: Stone) => card.name === "Shuffle Smith")
      .keywords,
  ).toEqual([{ type: "shuffle", sides: [0, 2] }]);
  await page.getByLabel("Card type", { exact: true }).selectOption("cast");
  await page.getByLabel("Stone name").fill("Keyword Blessing");
  await page.getByRole("button", { name: /^Add keyword/ }).click();
  await page.getByLabel("Keyword 1", { exact: true }).selectOption("enchant");
  await page
    .getByLabel("Enchant recipients · Keyword 1")
    .selectOption("allies");
  await page
    .getByRole("button", {
      name: "Add Enchant keyword · Keyword 1",
      exact: true,
    })
    .click();
  await page
    .getByLabel("Keyword 1 grant 2", { exact: true })
    .selectOption("comeback");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  library = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("skystones-library-v1")!),
  );
  const saved = library.custom.find(
    (card: Stone) => card.name === "Keyword Blessing",
  );
  expect(saved.spell).toBe("cast");
  expect(saved.keywords[0]).toMatchObject({
    type: "enchant",
    target: "allies",
    keywords: [{ type: "shield" }, { type: "comeback" }],
  });
});

for (const size of [3, 4] as const)
  test(`${size}×${size} board collapses three keywords, keeps two visible, and shows full Shuffle rules on hover`, async ({
    page,
  }) => {
    let run = enterAdventureNode(newAdventure(size, 81), "moss");
    const card = make("Shuffle Trio", [
      { type: "shuffle", sides: [0, 1] },
      { type: "shield", side: 2 },
      { type: "comeback", side: 3 },
    ]);
    const two = make("Two Words", [
      { type: "shield", side: 0 },
      { type: "comeback", side: 2 },
    ]);
    run = {
      ...run,
      battle: {
        ...run.battle!,
        hands: [[card, ...run.battle!.hands[0]], []],
        board: EMPTY_BOARD(size).map((cell, i) =>
          i === size * size - 1 ? { stone: two, owner: 1 } : cell,
        ),
      },
    };
    const expected = playAdventureCard(run, 0, 0);
    expect(validateAdventure(run)).toBe(true);
    await page.addInitScript(
      ({ key, run }) => {
        if (!localStorage.getItem(key))
          localStorage.setItem(key, JSON.stringify(run));
      },
      { key: ADVENTURE_STORAGE, run },
    );
    await page.goto("/");
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    await expect(
      page.getByRole("button", { name: /^Select Shuffle Trio,/ }),
    ).toContainText("Shuffle");
    await expect(
      page.locator(`#adventure-board-${size * size - 1} .stone-keywords`),
    ).toContainText("Shield");
    await page.getByRole("button", { name: /^Select Shuffle Trio,/ }).click();
    await page.locator("#adventure-board-0").click();
    const count = page.locator(
      "#adventure-board-0 .capture-flip-back .stone-keywords",
    );
    await expect(count).toHaveText("3 keywords");
    await page
      .locator(`.adventure-board-${size}`)
      .screenshot({ path: `/tmp/skystones-compact-keywords-${size}.png` });
    const saved = await read(page);
    expect(saved.battle.board[0].edges).toEqual(
      expected.battle!.board[0]!.edges,
    );
    await page.mouse.move(0, 0);
    await page.locator("#adventure-board-0").hover();
    await expect(page.locator("#card-inspector")).toContainText("Shuffle");
    await expect(page.locator("#card-inspector")).toContainText(
      "No pips are added or removed",
    );
    await expect(page.locator("#card-inspector")).toContainText("Comeback");
    await page.reload();
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    expect((await read(page)).battle.board[0].edges).toEqual(
      saved.battle.board[0].edges,
    );
  });

test("an Enchant spell chooses a board card, cancels cleanly, grants Shield and Comeback, then grants hand keywords", async ({
  page,
}) => {
  let run = enterAdventureNode(newAdventure(3, 81), "moss");
  const enchant = (name: string, target: "allies" | "hand"): Stone => ({
    ...make(name, [
      {
        type: "enchant",
        target,
        mode: "chosen",
        count: 1,
        keywords: [
          { type: "shield", side: 0, amount: 2 },
          { type: "comeback", side: 1, amount: 3 },
        ],
      },
    ]),
    spell: "cast",
    token: true,
    conjured: true,
    edges: [0, 0, 0, 0],
  });
  run = {
    ...run,
    battle: {
      ...run.battle!,
      board: EMPTY_BOARD().map((cell, i) =>
        i === 0
          ? { stone: make("Ally"), owner: 0 }
          : [4, 7, 8].includes(i)
            ? { stone: make(`Enemy${i}`), owner: 1 }
            : cell,
      ),
      hands: [
        [
          enchant("Board Blessing", "allies"),
          enchant("Hand Blessing", "hand"),
          ...run.battle!.hands[0],
        ],
        run.battle!.hands[1],
      ],
    },
  };
  await page.addInitScript(
    ({ key, run }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(run));
    },
    { key: ADVENTURE_STORAGE, run },
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Adventure", exact: true }).click();
  const before = await read(page);
  await page.getByRole("button", { name: /^Select Board Blessing,/ }).click();
  await expect(
    page.getByRole("dialog", { name: "Choose Enchant targets", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancel play", exact: true }).click();
  expect(await read(page)).toEqual(before);
  await page.getByRole("button", { name: /^Select Board Blessing,/ }).click();
  await page
    .getByRole("group", { name: "Eligible Enchant targets" })
    .getByRole("button")
    .first()
    .click();
  await page
    .getByRole("button", { name: "Apply Enchant", exact: true })
    .click();
  let saved = await read(page);
  expect(saved.battle.current).toBe(0);
  expect(saved.battle.board[0].edges).toEqual([4, 3, 1, 0]);
  expect(saved.battle.board[0].shields[0]).toBe(2);
  await page.getByRole("button", { name: /^Select Hand Blessing,/ }).click();
  await page
    .getByRole("group", { name: "Eligible Enchant targets" })
    .getByRole("button")
    .first()
    .click();
  await page
    .getByRole("button", { name: "Apply Enchant", exact: true })
    .click();
  saved = await read(page);
  expect(saved.battle.hands[0][0].keywords).toEqual(
    expect.arrayContaining([
      { type: "shield", side: 0, amount: 2 },
      { type: "comeback", side: 1, amount: 3 },
    ]),
  );
  expect(saved.battle.board.filter(Boolean)).toHaveLength(4);
  expect(validateAdventure(saved)).toBe(true);
});
