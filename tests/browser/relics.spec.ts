import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import {
  ADVENTURE_STORAGE,
  ROUTE,
  adventureEnemyMove,
  enterAdventureNode,
  newAdventure,
  playAdventureCard,
  rewardCards,
} from "../../src/adventure.ts";
import type { Adventure } from "../../src/adventure.ts";
import { RELICS } from "../../src/relics.ts";
import type { BoardSize } from "../../src/game.ts";

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

test("choose a relic before rewards, pick two different cards, and resume between picks", async ({
  page,
}) => {
  const base = {
    ...newAdventure(4, 50),
    relics: ["fated-lens"] as Adventure["relics"],
  };
  const run: Adventure = {
    ...base,
    phase: "reward",
    node: ROUTE[0][0],
    gold: 85,
    rewards: rewardCards(base),
    rewardPicksRemaining: 1,
    relicOffers: ["twin-sigil", "phoenix-feather", "gilded-compass"],
  };
  await open(page, run);
  await expect(
    page.getByRole("region", { name: "Choose a relic" }),
  ).toBeVisible();
  await expect(page.locator(".reward-options")).toHaveCount(0);
  await page
    .getByRole("button", {
      name: `Take relic ${RELICS["twin-sigil"].name}`,
      exact: true,
    })
    .click();
  await expect(page.locator(".reward-options article")).toHaveCount(5);
  await expect(page.locator(".reward-picks")).toContainText(
    "2 card picks remaining",
  );
  await page
    .getByRole("button", { name: /^Take / })
    .first()
    .click();
  await expect(page.locator(".reward-picks")).toContainText(
    "1 card pick remaining",
  );
  expect((await stored(page)).inventory).toHaveLength(run.inventory.length + 1);
  await expect(page.locator(".reward-options article")).toHaveCount(4);
  await page.reload();
  await page.getByRole("button", { name: "Adventure", exact: true }).click();
  await expect(page.locator(".reward-picks")).toContainText(
    "1 card pick remaining",
  );
  await page
    .getByRole("button", { name: /^Take / })
    .first()
    .click();
  const saved = await stored(page);
  expect(saved.inventory).toHaveLength(run.inventory.length + 2);
  expect(saved.floor).toBe(1);
  expect(saved.gold).toBe(85);
  expect(saved.relics).toEqual(["fated-lens", "twin-sigil"]);
});

test("a relic event awards one-time gold, survives reload, and the guide explains all thirty-one relics", async ({
  page,
}) => {
  const run = enterAdventureNode(
    { ...newAdventure(3, 8), floor: 4, relics: ["gilded-compass"] },
    "reliquary",
  );
  run.relicOffers = ["merchants-purse", "travelers-satchel", "phoenix-feather"];
  await open(page, run);
  await page
    .getByRole("button", {
      name: `Take relic ${RELICS["merchants-purse"].name}`,
      exact: true,
    })
    .click();
  expect((await stored(page)).gold).toBe(160);
  expect((await stored(page)).floor).toBe(5);
  await expect(
    page.getByRole("button", {
      name: `Inspect relic ${RELICS["merchants-purse"].name}`,
    }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Adventure", exact: true }).click();
  expect((await stored(page)).gold).toBe(160);
  await page
    .getByRole("button", { name: "Relic guide · 31", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Relic guide" });
  await expect(dialog.locator(".relic-card")).toHaveCount(31);
  await expect(dialog).toContainText("25% more gold");
  await expect(dialog).toContainText("two different card rewards");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Relic guide · 31", exact: true }),
  ).toBeFocused();
});

test("larger belts and stronger healing, power and hex potions display and apply their exact effects", async ({
  page,
}) => {
  let run = enterAdventureNode(
    {
      ...newAdventure(4, 11),
      lives: 1,
      relics: ["travelers-satchel", "alchemists-mortar", "bubbling-flask"],
      potions: ["power", "heal", "hex", "power", "hex"],
    },
    "moss",
  );
  run = playAdventureCard(run, 0, 0);
  run = adventureEnemyMove(run);
  const at = run.battle!.board.findIndex((cell) => cell?.owner === 1),
    cell = run.battle!.board[at]!;
  run.battle!.board[at] = {
    ...cell,
    stone: { ...cell.stone, name: "Hex Target", edges: [0, 1, 3, 5] },
    edges: [0, 1, 3, 5],
    activeKeywords: [],
  };
  await open(page, run);
  await expect(page.getByRole("region", { name: "Your relics" })).toContainText(
    "Relics · 3/31",
  );
  await expect(page.getByLabel("Potion belt")).toContainText("5/5 slots");
  await page
    .getByRole("button", { name: "Use Healing Draught", exact: true })
    .click();
  expect((await stored(page)).lives).toBe(3);
  await page
    .getByRole("button", { name: "Use Power Tonic", exact: true })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toContainText("gain +2");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /^Empower/ })
    .first()
    .click();
  expect((await stored(page)).battle!.hands[0][0].edges).toEqual(
    run.battle!.hands[0][0].edges.map((edge) => edge + 2),
  );
  await page
    .getByRole("button", { name: "Use Hex Vial", exact: true })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toContainText("lose 2 pips");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Hex .*Hex Target/ })
    .click();
  const saved = await stored(page);
  expect(saved.battle!.board[at]?.edges).toEqual([0, 0, 1, 3]);
  expect(saved.battle!.turns).toBe(run.battle!.turns);
  expect(saved.potions).toHaveLength(2);
  await expect(page.getByLabel("Potion belt")).toContainText("2/5 slots");
});

test("relics can be bought in a shop and discounts affect relics, potions, cards and workshop services", async ({
  page,
}) => {
  const run = enterAdventureNode(
    {
      ...newAdventure(3, 14),
      floor: 2,
      gold: 200,
      relics: ["hagglers-coin"],
      potions: [],
    },
    "shop-one",
  );
  run.shopRelic = "travelers-satchel";
  await open(page, run);
  await page
    .getByRole("button", { name: "Buy relic · 60 gold", exact: true })
    .click();
  expect((await stored(page)).gold).toBe(140);
  await expect(page.getByRole("button", { name: /^Buy relic/ })).toHaveCount(0);
  await expect(
    page.getByRole("heading", {
      name: "Potions · belt capacity 5",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Buy potion · 20 gold", exact: true })
    .first()
    .click();
  expect((await stored(page)).gold).toBe(120);
  await page
    .getByRole("button", { name: "Buy card · 31 gold", exact: true })
    .first()
    .click();
  expect((await stored(page)).gold).toBe(89);
  await page
    .getByRole("button", { name: "Buy upgrade · 20 gold", exact: true })
    .click();
  expect((await stored(page)).gold).toBe(69);
  await page.getByLabel("Workshop service").selectOption("keyword");
  await page
    .getByRole("button", { name: "Buy upgrade · 28 gold", exact: true })
    .click();
  expect((await stored(page)).gold).toBe(41);
  await page.reload();
  await page.getByRole("button", { name: "Adventure", exact: true }).click();
  expect((await stored(page)).gold).toBe(41);
  expect((await stored(page)).relics).toEqual([
    "hagglers-coin",
    "travelers-satchel",
  ]);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

for (const size of [3, 4] as BoardSize[])
  test(`${size}x${size} throne room begins with the throne and no extra guard`, async ({
    page,
  }) => {
    await open(
      page,
      enterAdventureNode({ ...newAdventure(size, 22), floor: 8 }, "warden"),
    );
    await expect(page.locator(".adventure-square.occupied")).toHaveCount(1);
    await expect(page.locator(".run-objective")).toContainText(
      "No extra guard",
    );
    await expect(
      page.getByRole("button", { name: /Crown Sentinel/ }),
    ).toHaveCount(0);
    await expect(page.locator(".objective-badge")).toHaveText("THRONE");
    await page.locator(".run-hand-card").first().click();
    await page
      .getByRole("button", { name: "A1, empty adventure square", exact: true })
      .click();
    await expect(page.locator(".adventure-square.occupied")).toHaveCount(3);
  });

test("Vanguard Banner previews a first-card boost once and remembers it after reload", async ({
  page,
}) => {
  const run = enterAdventureNode(
    { ...newAdventure(4, 11), relics: ["vanguard-banner"] },
    "moss",
  );
  await open(page, run);
  const first = run.battle!.hands[0][0];
  await expect(
    page.locator(".run-hand-card").first().locator(".edge b"),
  ).toHaveText(first.edges.map((edge) => String(edge + 1)));
  await page.locator(".run-hand-card").first().click();
  await page
    .getByRole("button", { name: "A1, empty adventure square", exact: true })
    .click();
  await expect(page.locator(".adventure-square.occupied")).toHaveCount(2);
  await expect(page.locator(".run-hand-card").first()).toBeEnabled();
  let saved = await stored(page);
  expect(saved.battle!.vanguardUsed).toBe(true);
  await expect(
    page.locator(".run-hand-card").first().locator(".edge b"),
  ).toHaveText(saved.battle!.hands[0][0].edges.map(String));
  await page.reload();
  await page.getByRole("button", { name: "Adventure", exact: true }).click();
  saved = await stored(page);
  expect(saved.battle!.vanguardUsed).toBe(true);
  await expect(
    page.locator(".run-hand-card").first().locator(".edge b"),
  ).toHaveText(saved.battle!.hands[0][0].edges.map(String));
});
