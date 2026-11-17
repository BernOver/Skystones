import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { STARTER_STONES, EMPTY_BOARD, placeStone } from "../../src/game.ts";
import type { Stone, StoneKeyword } from "../../src/game.ts";
import { DEFAULT_SPELLS } from "../../src/spellCards.ts";
import { DEFAULT_TRAPS, validTrap } from "../../src/traps.ts";
import {
  BUILTIN_ENCOUNTERS,
  ENCOUNTERS_STORAGE,
} from "../../src/encounters.ts";
import {
  newAdventure,
  enterAdventureNode,
  testAdventureEncounter,
  ADVENTURE_STORAGE,
  validateAdventure,
} from "../../src/adventure.ts";
import type { Adventure } from "../../src/adventure.ts";
if (process.env.SKYSTONES_STANDALONE === "1") {
  const html = readFileSync("standalone/Skystones.html", "utf8");
  test.beforeEach(async ({ page }) => {
    const unexpected: string[] = [];
    (page as Page & { unexpected: string[] }).unexpected = unexpected;
    await page.route("**/*", (route) =>
      route.request().url() === "http://127.0.0.1:5173/"
        ? route.fulfill({ status: 200, contentType: "text/html", body: html })
        : (unexpected.push(route.request().url()), route.abort()),
    );
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
const make = (
  name: string,
  edges: Stone["edges"] = [1, 1, 1, 1],
  keywords: StoneKeyword[] = [],
): Stone => ({
  ...STARTER_STONES[0],
  id: `custom-${name.toLowerCase().replaceAll(" ", "-")}`,
  custom: true,
  name,
  element: "magic",
  edges,
  keywords,
});
const read = (page: Page) =>
  page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    ADVENTURE_STORAGE,
  );
async function seedRun(page: Page, run: Adventure) {
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
}
test("studio configures Flash-free random spell grants and repeatable turn-start effects", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Card studio", exact: true }).click();
  await page.getByLabel("Card type", { exact: true }).selectOption("cast");
  await page.getByLabel("Stone name").fill("Wild Maker");
  await page.getByRole("button", { name: /^Add keyword/ }).click();
  await page.getByLabel("Keyword 1", { exact: true }).selectOption("enchant");
  await page
    .getByLabel("Keyword 1 generate random keywords", { exact: true })
    .check();
  await page
    .getByLabel("Keyword 1 random keyword count", { exact: true })
    .selectOption("3");
  await page
    .getByLabel("Keyword 1 custom random keyword pool", { exact: true })
    .check();
  await expect(
    page.getByLabel("Keyword 1 random Flash", { exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Remove Keyword 1 grant 1", exact: true })
    .click();
  await page.getByRole("button", { name: "Save spell", exact: true }).click();
  let data = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("skystones-library-v1")!),
  );
  const wild = data.custom.find((c: Stone) => c.name === "Wild Maker");
  expect(wild.keywords[0].randomKeywords).toMatchObject({
    count: 3,
    pool: ["shield", "comeback"],
  });
  expect(wild.keywords[0].keywords).toBeUndefined();
  expect(wild.keywords[0].pips).toBeUndefined();
  await page.reload();
  await page.getByRole("button", { name: "Card studio", exact: true }).click();
  await page.getByLabel("Stone name").fill("Clock Stone");
  await page.getByRole("button", { name: /^Add keyword/ }).click();
  await page
    .getByLabel("Keyword 1", { exact: true })
    .selectOption("turn-start");
  await page
    .getByLabel("Turn Start timing · Keyword 1", { exact: true })
    .selectOption("both");
  await page
    .getByLabel("Keyword 1 grant 1", { exact: true })
    .selectOption("conjure");
  await page.getByRole("button", { name: /^Add keyword/ }).click();
  await page.getByLabel("Keyword 2", { exact: true }).selectOption("command");
  await page
    .getByLabel("Command turns · Keyword 2", { exact: true })
    .selectOption("3");
  await page
    .getByRole("button", { name: "Save to collection", exact: true })
    .click();
  data = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("skystones-library-v1")!),
  );
  const clock = data.custom.find((c: Stone) => c.name === "Clock Stone");
  expect(clock.keywords).toMatchObject([
    { type: "turn-start", when: "both", keywords: [{ type: "conjure" }] },
    { type: "command", turns: 3 },
  ]);
});
test("Trap editor saves a zero-side bonus and random keyword grants with turn timing", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page.getByRole("button", { name: "Traps", exact: true }).click();
  await page
    .getByRole("button", { name: "Create a Trap", exact: true })
    .click();
  await page
    .getByLabel("Trap name", { exact: true })
    .fill("Zero Point Crystal");
  await page
    .getByRole("button", {
      name: "Preset: stones gain +2 on zero-pip sides",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Add effect", exact: true }).click();
  await page.getByLabel("Trap effect 2", { exact: true }).selectOption("grant");
  await page
    .getByLabel("Trap grant recipients 2", { exact: true })
    .selectOption("both");
  await page
    .getByLabel("Trap grant timing 2", { exact: true })
    .selectOption("turn-start");
  await page
    .getByLabel("Trap grant turns 2", { exact: true })
    .selectOption("active");
  await page
    .getByLabel("Trap grant 2 generate random keywords", { exact: true })
    .check();
  await page
    .getByLabel("Trap grant 2 random keyword count", { exact: true })
    .selectOption("2");
  await page
    .getByRole("button", { name: "Remove Trap grant 2 grant 1", exact: true })
    .click();
  await page.getByRole("button", { name: "Save Trap", exact: true }).click();
  const crystals = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("skystones-traps-v1")!),
  );
  const saved = crystals.find(
    (c: { name: string }) => c.name === "Zero Point Crystal",
  );
  expect(validTrap(saved)).toBe(true);
  expect(saved.effects[0]).toMatchObject({
    kind: "pips",
    amount: 2,
    condition: { type: "stone" },
    sideCondition: { compare: "eq", value: 0 },
  });
  expect(saved.effects[1]).toMatchObject({
    kind: "grant",
    timing: "turn-start",
    target: "both",
    recipients: "active",
    randomKeywords: { count: 2 },
  });
  await page.reload();
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page.getByRole("button", { name: "Traps", exact: true }).click();
  await expect(page.locator(".trap-grid")).toContainText("Zero Point Crystal");
});
test("encounter editor saves AI priority, pip order and initial controlled turns", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Adventure", exact: true }).click();
  await page
    .getByRole("button", { name: "Adventure workshop", exact: true })
    .click();
  await page
    .getByRole("button", { name: "New encounter", exact: true })
    .click();
  await page
    .getByLabel("Bot play order", { exact: true })
    .selectOption("low-pips");
  await page.getByLabel("Bot card priority", { exact: true }).check();
  await page
    .getByLabel("Bot priority card type", { exact: true })
    .selectOption("spell");
  await page
    .getByLabel("Bot priority element", { exact: true })
    .selectOption("magic");
  await page.getByLabel("Initial bot control turns", { exact: true }).fill("3");
  await page
    .getByRole("button", { name: "Save encounter", exact: true })
    .click();
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    ENCOUNTERS_STORAGE,
  );
  expect(
    saved.encounters.find((e: { id: string }) => e.id.startsWith("custom-")).ai,
  ).toMatchObject({
    order: "low-pips",
    priority: { type: "spell", element: "magic" },
    controlTurns: 3,
  });
});
test("controlled bot turns wait for choices, allow choosing against AI priority, and keep Flash in the same turn", async ({
  page,
}) => {
  const encounter = {
    ...BUILTIN_ENCOUNTERS[0],
    id: "custom-control-test",
    ai: { order: "low-pips" as const, controlTurns: 2 },
    deck: [
      make("High Flash", [2, 2, 2, 2], [{ type: "flash" }]),
      make("Low", [0, 1, 0, 0]),
      make("Middle", [1, 1, 1, 1]),
      make("Last", [1, 0, 1, 1]),
    ],
  };
  let run = testAdventureEncounter(encounter, 3, 1, "easy", 81);
  run = {
    ...run,
    battle: {
      ...run.battle!,
      hands: [
        Array.from({ length: 5 }, (_, i) => make(`Ally${i}`)),
        run.battle!.hands[1],
      ],
    },
  };
  await seedRun(page, run);
  async function playAlly(name: string) {
    await page
      .getByRole("button", { name: new RegExp(`^Select ${name},`) })
      .click();
    await page.locator(".adventure-square.vacant:enabled").first().click();
  }
  await playAlly("Ally0");
  const panel = page.getByRole("region", { name: "Choose the bot’s card" });
  await expect(panel).toBeVisible();
  await page.waitForTimeout(1100); // Must remain paused beyond the bot's 850ms automatic delay.
  expect((await read(page)).battle.turns).toBe(1);
  await page
    .getByRole("button", { name: "Bot play High Flash", exact: true })
    .click();
  let state = await read(page);
  expect(state.battle.current).toBe(1);
  expect(state.battle.turnState.control[0]).toBe(1);
  await page.reload();
  await page.getByRole("button", { name: "Adventure", exact: true }).click();
  await expect(panel).toBeVisible();
  await page.getByRole("button", { name: "Bot play Low", exact: true }).click();
  expect((await read(page)).battle.current).toBe(0);
  await playAlly("Ally1");
  await expect(panel).toBeVisible();
  expect((await read(page)).battle.turnState.control[0]).toBe(0);
  await page
    .getByRole("button", { name: "Bot play Middle", exact: true })
    .click();
  await playAlly("Ally2");
  await expect(panel).toHaveCount(0);
  await expect.poll(async () => (await read(page)).battle.current).toBe(0);
  state = await read(page);
  expect(
    state.battle.board.some(
      (cell: { stone: Stone } | null) => cell?.stone.name === "Last",
    ),
  ).toBe(true);
});
for (const size of [3, 4] as const)
  test(`${size}×${size} Wayfinder Call chooses an allied card and destination, cancels safely, and moves a chest without captures`, async ({
    page,
  }) => {
    let run = enterAdventureNode(newAdventure(size, 81), "moss");
    let board = placeStone(
      EMPTY_BOARD(size),
      0,
      make("Chest Ally", [3, 0, 1, 0], [{ type: "shield", side: 0 }]),
      0,
    ).board;
    board = placeStone(board, 1, make("Enemy", [1, 1, 1, 0]), 1).board;
    const spell = {
      ...DEFAULT_SPELLS.find((c) => c.name === "Wayfinder Call")!,
      id: "custom-conjured-wayfinder",
      conjured: true as const,
    };
    run = {
      ...run,
      battle: {
        ...run.battle!,
        board,
        objective: 0,
        objectiveKind: "chest",
        hands: [[spell, ...run.battle!.hands[0]], run.battle!.hands[1]],
      },
    };
    await seedRun(page, run);
    const before = await read(page),
      destination = size * size - 1,
      coordinate = `${String.fromCharCode(64 + size)}${size}`;
    await page.getByRole("button", { name: /^Select Wayfinder Call,/ }).click();
    await page.getByRole("button", { name: /^Target A1:/ }).click();
    await expect(
      page.getByRole("group", { name: "Choose relocation destination" }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Cancel play", exact: true })
      .click();
    expect(await read(page)).toEqual(before);
    await page.getByRole("button", { name: /^Select Wayfinder Call,/ }).click();
    await page.getByRole("button", { name: /^Target A1:/ }).click();
    await page
      .getByRole("button", {
        name: `Move to ${coordinate}, empty`,
        exact: true,
      })
      .click();
    const after = await read(page);
    expect(after.battle.current).toBe(0);
    expect(after.battle.objective).toBe(destination);
    expect(after.battle.board[0]).toBeNull();
    expect(after.battle.board[destination].stone.name).toBe("Chest Ally");
    expect(after.battle.board[1].owner).toBe(1);
    expect(after.battle.board.filter(Boolean)).toHaveLength(2);
    expect(after.battle.hands[0]).toHaveLength(
      before.battle.hands[0].length - 1,
    );
    expect(validateAdventure(after)).toBe(true);
  });

test("a normal-game Command stone pauses the opponent and lets the player choose a bot card", async ({
  page,
}) => {
  const cards = Array.from({ length: 5 }, (_, i) =>
    make(
      i === 0 ? "Captain Order" : `Crew${i}`,
      [1, 1, 1, 1],
      i === 0 ? [{ type: "command", turns: 1 }] : [],
    ),
  );
  await page.addInitScript(
    (cards) =>
      localStorage.setItem(
        "skystones-library-v1",
        JSON.stringify({
          custom: cards,
          deck: cards.map((c: Stone) => c.id),
          boardSize: 3,
          sound: false,
        }),
      ),
    cards,
  );
  await page.goto("/");
  await page.getByRole("button", { name: "New match", exact: true }).click();
  await page
    .getByRole("button", { name: "Find a little magic", exact: true })
    .click();
  await page.getByRole("button", { name: /^Select Captain Order,/ }).click();
  await page.locator("#board-0").click();
  const panel = page.getByRole("region", { name: "Choose the bot’s card" });
  await expect(panel).toBeVisible();
  await page.waitForTimeout(1100);
  expect(await page.locator(".board-cell.filled").count()).toBe(1);
  await panel
    .getByRole("button")
    .filter({ hasNotText: "Flash" })
    .first()
    .click();
  await expect(page.locator(".board-cell.filled")).toHaveCount(2);
});
