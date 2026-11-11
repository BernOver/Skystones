import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { STARTER_STONES, handSize, validateStone } from "../../src/game.ts";
import type { Stone, StoneKeyword } from "../../src/game.ts";
import { DEFAULT_TOKENS } from "../../src/tokens.ts";
import { CHARACTER_STONES, ENEMY_STONES } from "../../src/characters.ts";
import { CHARACTER_DEFAULTS_STORAGE } from "../../src/cardDefaults.ts";
import {
  newAdventure,
  enterAdventureNode,
  ADVENTURE_STORAGE,
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
const token: Stone = {
  ...DEFAULT_TOKENS[2],
  id: "custom-token-parting-sprite",
  name: "Parting Sprite",
  edges: [0, 0, 0, 0],
  keywords: [
    { type: "discard-priority", priority: 99 },
    {
      type: "parting-gift",
      target: "allies",
      mode: "chosen",
      count: 1,
      pips: [{ side: 0, amount: 2 }],
      keywords: [{ type: "shield", side: 1, amount: 1 }],
    },
  ],
};
const casterKeywords: StoneKeyword[] = [
  {
    type: "conjure",
    mode: "token",
    token: token.id,
    count: 1,
    recipient: "self",
  },
  { type: "discard", mode: "random", recipient: "self", count: 1 },
];
const custom = Array.from(
  { length: 5 },
  (_, i): Stone => ({
    ...STARTER_STONES[0],
    id: `custom-parting-local-${i}`,
    name: i === 0 ? "Parting Caster" : `Gift Friend ${i}`,
    edges: [1, 1, 1, 1],
    element: "fire",
    keywords: i === 0 ? casterKeywords : [],
    custom: true,
  }),
);
async function giftOptions(page: Page) {
  return page
    .getByRole("group", { name: "Eligible Parting Gift targets" })
    .getByRole("button");
}
async function stored(page: Page) {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    ADVENTURE_STORAGE,
  );
}

test("studio creates signed Parting Gifts with chosen enemy-hand recipients and keyword grants, then exports and imports them", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Card studio", exact: true }).click();
  await page.getByLabel("Stone name").fill("Parting Hex");
  await page.getByRole("button", { name: /^Add keyword/ }).click();
  await page
    .getByLabel("Keyword 1", { exact: true })
    .selectOption("parting-gift");
  await page
    .getByLabel("Parting Gift recipients · Keyword 1", { exact: true })
    .selectOption("enemy-hand");
  await page
    .getByLabel("Parting Gift selection · Keyword 1", { exact: true })
    .selectOption("chosen");
  await page
    .getByLabel("Parting Gift targets · Keyword 1", { exact: true })
    .selectOption("2");
  await page
    .getByLabel("Parting Gift · Keyword 1 North pips", { exact: true })
    .selectOption("-2");
  await page
    .getByRole("button", {
      name: "Add Parting Gift keyword · Keyword 1",
      exact: true,
    })
    .click();
  await page
    .getByLabel("Keyword 1 grant 1", { exact: true })
    .selectOption("shield");
  await page
    .getByRole("button", { name: "Save to collection", exact: true })
    .click();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("skystones-library-v1")!).custom.find(
      (c: Stone) => c.name === "Parting Hex",
    ),
  );
  expect(validateStone(saved)).toBe(true);
  expect(saved.keywords[0]).toMatchObject({
    target: "enemy-hand",
    mode: "chosen",
    count: 2,
    pips: [{ side: 0, amount: -2 }],
    keywords: [{ type: "shield" }],
  });
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page
    .getByRole("button", { name: "View Parting Hex", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("-2 North");
  const waiting = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export card file", exact: true })
    .click();
  const stream = await (await waiting).createReadStream(),
    chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const buffer = Buffer.concat(chunks);
  expect(JSON.parse(buffer.toString()).card.keywords).toEqual(saved.keywords);
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.getByLabel("Import card file").setInputFiles({
    name: "parting.skystone.json",
    mimeType: "application/json",
    buffer,
  });
  await expect(page.locator(".toast")).toContainText(
    "has joined your collection",
  );
});
test("normal local play chooses a Parting Gift board target, supports cancel, and adds Shield without repeating placement", async ({
  page,
}) => {
  await page.addInitScript(
    (data) =>
      localStorage.setItem("skystones-library-v1", JSON.stringify(data)),
    {
      custom: [...custom, token],
      deck: custom.map((c) => c.id),
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
  async function play() {
    const caster = page.getByRole("button", {
      name: /^Select Parting Caster,/,
    });
    if ((await caster.getAttribute("aria-pressed")) !== "true")
      await caster.click();
    await page.locator("#board-0").click();
    await expect(page.locator(".parting-gift-picker")).toBeVisible();
  }
  await play();
  await expect(page.locator("#board-0 .stone-card")).toHaveCount(0);
  await page.getByRole("button", { name: "Cancel play", exact: true }).click();
  await expect(page.locator("#board-0 .stone-card")).toHaveCount(0);
  await play();
  await (await giftOptions(page)).first().click();
  await page
    .getByRole("button", { name: "Apply Parting Gift", exact: true })
    .click();
  await expect(page.locator("#board-0")).toHaveAttribute(
    "aria-label",
    /edges north 3, east 1, south 1, west 1/,
  );
  await expect(
    page.locator("#board-0 .capture-flip-back .edge-1 .shield-pip"),
  ).toContainText("+1");
  await page.locator("#board-0").click();
  await expect(page.locator(".inspection-dialog")).toContainText(
    "Gains Shield",
  );
});
for (const size of [3, 4] as const)
  test(`${size}×${size} Adventure selects a hand gift and applies random enemy-hand penalties and keywords through reload`, async ({
    page,
  }) => {
    let run = enterAdventureNode(newAdventure(size, 81), "moss");
    const donor = {
      ...token,
      keywords: [
        { type: "discard-priority", priority: 99 },
        {
          type: "parting-gift",
          target: "hand",
          mode: "chosen",
          count: 1,
          pips: [{ side: 0, amount: 2 }],
          keywords: [{ type: "shield", side: 1, amount: 1 }],
        },
        {
          type: "parting-gift",
          target: "enemy-hand",
          mode: "random",
          count: 2,
          pips: [{ side: 0, amount: -2 }],
          keywords: [{ type: "dizzy", sides: [3] }],
        },
      ] as StoneKeyword[],
    };
    const first = { ...run.battle!.hands[0][0], keywords: casterKeywords };
    run = {
      ...run,
      battle: {
        ...run.battle!,
        hands: [
          [
            first,
            ...run.battle!.hands[0].slice(1).map((c) => ({
              ...c,
              edges: [1, 1, 1, 1] as Stone["edges"],
              keywords: [],
              baseEdges: [1, 1, 1, 1] as Stone["edges"],
              baseKeywords: [],
            })),
          ],
          run.battle!.hands[1].map((c) => ({
            ...c,
            edges: [1, 1, 1, 1] as Stone["edges"],
            keywords: [],
            baseEdges: [1, 1, 1, 1] as Stone["edges"],
            baseKeywords: [],
          })),
        ],
      },
    };
    await page.addInitScript(
      ({ key, data, donor }) => {
        if (!localStorage.getItem(key))
          localStorage.setItem(key, JSON.stringify(data));
        localStorage.setItem(
          "skystones-library-v1",
          JSON.stringify({ custom: [donor], sound: false }),
        );
      },
      { key: ADVENTURE_STORAGE, data: run, donor },
    );
    await page.goto("/");
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    await page
      .getByRole("button", {
        name: new RegExp("^Select " + first.name + ", adventure card"),
      })
      .click();
    await page.locator("#adventure-board-0").click();
    await expect(page.locator(".parting-gift-picker")).toBeVisible();
    await expect(await giftOptions(page)).toHaveCount(handSize(size) - 1);
    await page.setViewportSize({ width: 390, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page
      .locator(".parting-gift-picker")
      .screenshot({ path: `/tmp/skystones-parting-${size}.png` });
    await (await giftOptions(page)).first().click();
    await page
      .getByRole("button", { name: "Apply Parting Gift", exact: true })
      .click();
    let saved = await stored(page);
    expect(validateAdventure(saved)).toBe(true);
    const received = saved.battle.hands[0].filter(
      (c: Stone) => c.discardBuffs?.pips[0] === 2,
    );
    expect(received).toHaveLength(1);
    expect(received[0].keywords).toContainEqual({
      type: "shield",
      side: 1,
      amount: 1,
    });
    await page.reload();
    await page.getByRole("button", { name: "Adventure", exact: true }).click();
    saved = await stored(page);
    expect(validateAdventure(saved)).toBe(true);
    expect(
      saved.battle.hands[0].some(
        (c: Stone) => c.id === received[0].id && c.discardBuffs?.pips[0] === 2,
      ),
    ).toBe(true);
    const enemyCards = [
      ...saved.battle.hands[1],
      ...saved.battle.board
        .filter((c: any) => c?.playedBy === 1)
        .map((c: any) => c.stone),
    ];
    expect(
      enemyCards.filter(
        (c: Stone) =>
          c.discardBuffs?.pips[0] === -1 &&
          c.keywords?.some((k) => k.type === "dizzy"),
      ),
    ).toHaveLength(2);
  });
test("an enemy Adventure discard pauses for the player's gift targets and offers an automatic fallback", async ({
  page,
}) => {
  let run = enterAdventureNode(newAdventure(3, 81), "moss");
  const battle = run.battle!;
  const donor = {
    ...battle.hands[0][0],
    name: "Reactive Friend",
    keywords: [
      { type: "discard-priority", priority: 99 },
      {
        type: "parting-gift",
        target: "hand",
        mode: "chosen",
        count: 1,
        pips: [{ side: 0, amount: 2 }],
      },
    ] as StoneKeyword[],
  };
  run = {
    ...run,
    battle: {
      ...battle,
      current: 1,
      hands: [
        [donor, ...battle.hands[0].slice(1)],
        battle.hands[1].map((c) => ({
          ...c,
          keywords: [
            {
              type: "discard",
              mode: "random",
              recipient: "opponent",
              count: 1,
            },
          ] as StoneKeyword[],
        })),
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
  await expect(page.locator(".parting-gift-picker")).toBeVisible({
    timeout: 15000,
  });
  await expect(page.locator(".parting-gift-picker")).toContainText("You");
  let saved = await stored(page);
  expect(saved.battle.turns).toBe(0);
  await page.reload();
  await page.getByRole("button", { name: "Adventure", exact: true }).click();
  await expect(page.locator(".parting-gift-picker")).toBeVisible({
    timeout: 15000,
  });
  await page
    .getByRole("button", { name: "Choose automatically", exact: true })
    .click();
  await expect(page.locator(".parting-gift-picker")).toHaveCount(0);
  saved = await stored(page);
  expect(saved.battle.turns).toBe(1);
  expect(saved.battle.current).toBe(0);
  expect(validateAdventure(saved)).toBe(true);
  expect(
    saved.battle.hands[0].filter((c: Stone) => c.discardBuffs?.pips[0] === 2),
  ).toHaveLength(1);
});
test("a normal computer opponent pauses for the player's chosen Parting Gift and resumes after selection", async ({
  page,
}) => {
  const defaults = Object.fromEntries(
    [...CHARACTER_STONES, ...ENEMY_STONES].map((card) => [
      card.portrait,
      {
        revision: 1,
        card: {
          ...card,
          characterKey: card.portrait,
          edges: [1, 1, 1, 1],
          keywords: [
            {
              type: "discard",
              mode: "random",
              recipient: "opponent",
              count: 1,
            },
          ],
        },
      },
    ]),
  );
  const playerCards = custom.map((c, i) => ({
    ...c,
    keywords:
      i === 0
        ? [
            { type: "discard-priority", priority: 99 },
            {
              type: "parting-gift",
              target: "hand",
              mode: "chosen",
              count: 1,
              pips: [{ side: 0, amount: 2 }],
            },
          ]
        : [],
  }));
  await page.addInitScript(
    ({ defaults, key, playerCards }) => {
      localStorage.setItem(key, JSON.stringify(defaults));
      localStorage.setItem(
        "skystones-library-v1",
        JSON.stringify({
          custom: playerCards,
          deck: playerCards.map((c) => c.id),
          boardSize: 3,
          sound: false,
        }),
      );
    },
    { defaults, key: CHARACTER_DEFAULTS_STORAGE, playerCards },
  );
  await page.goto("/");
  await page.getByRole("button", { name: "New match", exact: true }).click();
  await page
    .getByLabel("Who makes the first move?", { exact: true })
    .selectOption("1");
  await page
    .getByRole("button", { name: "Find a little magic", exact: true })
    .click();
  await expect(page.locator(".parting-gift-picker")).toBeVisible({
    timeout: 15000,
  });
  await (await giftOptions(page)).first().click();
  await page
    .getByRole("button", { name: "Apply Parting Gift", exact: true })
    .click();
  await expect(page.locator(".parting-gift-picker")).toHaveCount(0);
  await expect(page.locator(".board-cell.filled")).toHaveCount(1);
  await expect(
    page.locator(".hand-card-button .edge-0 > b").filter({ hasText: /^3$/ }),
  ).toHaveCount(1);
});
