import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import {
  ADVENTURE_STORAGE,
  enterAdventureNode,
  newAdventure,
  resolveAdventureEvent,
  adventureWorkshopOffer,
  cardPrice,
  POTIONS,
} from "../../src/adventure.ts";
import type { Adventure } from "../../src/adventure.ts";
import { chooseMove, coordinate, STARTER_STONES } from "../../src/game.ts";
import type { BoardSize } from "../../src/game.ts";

async function stored(page: Page): Promise<Adventure> {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    ADVENTURE_STORAGE,
  );
}
async function openRun(page: Page, run: Adventure) {
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

test("normal four-by-four games use eight-card decks, finish sixteen squares, and persist board settings", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New match", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByLabel("Board size", { exact: true })
    .selectOption("4");
  await page.getByRole("button", { name: /Bring a friend/ }).click();
  await page.getByRole("button", { name: "Find a little magic" }).click();
  await expect(page.locator(".board-cell")).toHaveCount(16);
  await expect(page.locator(".hand-card-button")).toHaveCount(8);
  for (let turn = 0; turn < 16; turn++) {
    await page.locator(".hand-card-button").first().click();
    await page.locator(".board-cell.empty:enabled").first().click();
  }
  await expect(page.locator(".board-cell.filled")).toHaveCount(16);
  await expect(page.locator(".result-card")).toBeVisible();
  await expect(page.locator(".board-progress")).toContainText("16 of 16");
  await expect(page.locator("#board-15")).toHaveAccessibleName(/^D4:/);
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("skystones-library-v1")!),
  );
  expect(saved.boardSize).toBe(4);
  expect(saved.deck).toHaveLength(8);
  await page.getByRole("button", { name: /^Collection/ }).click();
  await expect(page.locator(".deck-count")).toContainText("8 / 8");
  await page.getByLabel("Deck board size").selectOption("3");
  await expect(page.locator(".deck-count")).toContainText("5 / 5");
});

test("Giants catalogue consolidates ranks, bundles character images and the studio offers unused portraits", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^Collection/ }).click();
  await page.getByRole("button", { name: /^Giants/ }).click();
  await expect(page.locator(".collection-card-button")).toHaveCount(39);
  await expect(page.locator(".giants-reference-note")).toContainText(
    "one card per character",
  );
  await page
    .getByRole("button", { name: "View CONQUERTRON", exact: true })
    .click();
  await expect(page.getByRole("dialog").locator(".edge b")).toHaveText([
    "4",
    "4",
    "4",
    "4",
  ]);
  expect(
    await page
      .getByRole("dialog")
      .locator("img.character-art")
      .evaluate(
        (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
      ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Card studio", exact: true }).click();
  await page.getByLabel("Portraits without a default card").check();
  await expect(page.locator(".portrait-grid button")).toHaveCount(116);
  await page.getByLabel("Find a character portrait").fill("Dark Spyro");
  await page
    .getByRole("button", { name: "Use Dark Spyro portrait", exact: true })
    .click();
  await expect(page.getByLabel("Stone name")).toHaveValue("Dark Spyro");
  expect(
    await page
      .locator(".preview-card img")
      .evaluate(
        (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
      ),
  ).toBe(true);
});

test("start, play and resume a four-by-four adventure, use a potion, claim a reward, and enter a chest event", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openRun(page, newAdventure(4, 102));
  await expect(page.locator(".run-toolbar")).toContainText("8/8");
  await page.getByRole("button", { name: /Mossy Footpath/ }).click();
  await expect(page.locator(".adventure-square")).toHaveCount(16);
  const original = await stored(page);
  await page
    .getByRole("button", { name: "Use Power Tonic", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /^Empower/ })
    .first()
    .click();
  let current = await stored(page);
  expect(current.battle!.hands[0][0].edges).toEqual(
    original.battle!.hands[0][0].edges.map((edge) => edge + 1),
  );
  expect(current.battle!.turns).toBe(0);
  expect(current.potions).toHaveLength(1);
  for (let moveNumber = 0; moveNumber < 8; moveNumber++) {
    await expect(page.locator(".run-hand-card").first()).toBeEnabled();
    current = await stored(page);
    const battle = current.battle!,
      move = chooseMove(battle.board, battle.hands[0], battle.hands[1], 0);
    await page.locator(".run-hand-card").nth(move.cardIndex).click();
    await page
      .getByRole("button", {
        name: `${coordinate(move.index, 4)}, empty adventure square`,
        exact: true,
      })
      .click();
    if (moveNumber === 0) {
      await expect.poll(async () => (await stored(page)).battle!.turns).toBe(2);
      await page.reload();
      await page
        .getByRole("button", { name: "Adventure", exact: true })
        .click();
      await expect(page.locator(".adventure-square.occupied")).toHaveCount(2);
    }
    if (moveNumber < 7)
      await expect(page.locator(".run-hand-card").first()).toBeEnabled();
  }
  await expect.poll(async () => (await stored(page)).phase).toBe("reward");
  current = await stored(page);
  if (current.relicOffers?.length)
    await page.getByRole("button", { name: "Skip relic", exact: true }).click();
  if (current.rewards.length) {
    expect(current.rewards[0].edges.reduce((a, b) => a + b, 0)).toBe(4);
    await page
      .getByRole("button", { name: /^Take / })
      .first()
      .click();
    await expect(page.locator(".run-card-grid")).toBeVisible();
    await page.getByRole("button", { name: "Close deck", exact: true }).click();
  } else
    await page
      .getByRole("button", { name: "Continue expedition", exact: true })
      .click();
  await page.getByRole("button", { name: /The Brass Chest/ }).click();
  await page
    .getByRole("button", { name: /Challenge the chest keeper/ })
    .click();
  await expect(page.locator(".run-objective")).toContainText("B2");
  await expect(page.locator(".adventure-square.occupied")).toHaveCount(1);
  await expect(page.locator(".objective-badge")).toHaveText("CHEST");
  expect(errors).toEqual([]);
});

test("shop purchases, all three workshop services, deck changes, and gold survive reload", async ({
  page,
}) => {
  const run = enterAdventureNode(
    { ...newAdventure(3, 14), floor: 2, gold: 220, potions: [] },
    "shop-one",
  );
  await openRun(page, run);
  await page
    .getByRole("button", { name: /^Buy card/ })
    .first()
    .click();
  let current = await stored(page);
  expect(current.inventory).toHaveLength(run.inventory.length + 1);
  expect(current.shopCards).toHaveLength(2);
  const purchased = current.inventory.at(-1)!;
  await page
    .getByRole("button", { name: /^Buy potion/ })
    .first()
    .click();
  expect((await stored(page)).potions).toEqual([run.shopPotions[0].type]);
  const id = run.inventory[0].id;
  const offer = adventureWorkshopOffer(run);
  await page.getByLabel("Workshop card").selectOption(id);
  await expect(page.getByLabel("Workshop edge")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Buy upgrade · 25 gold", exact: true })
    .click();
  expect((await stored(page)).inventory[0].edges[offer.pipSide]).toBe(
    run.inventory[0].edges[offer.pipSide] + 1,
  );
  await page.getByLabel("Workshop service").selectOption("element");
  const element = run.inventory[0].element === "water" ? "fire" : "water";
  await page.getByLabel("Workshop element").selectOption(element);
  await page
    .getByRole("button", { name: "Buy upgrade · 20 gold", exact: true })
    .click();
  await page.getByLabel("Workshop service").selectOption("keyword");
  await expect(
    page.getByLabel("Workshop keyword", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Workshop edge")).toHaveCount(0);
  const offerHeading = await page
    .getByRole("region", { name: "Shop keyword offer" })
    .getByRole("heading")
    .textContent();
  await page.getByLabel("Workshop card").selectOption(run.inventory[1].id);
  await expect(
    page
      .getByRole("region", { name: "Shop keyword offer" })
      .getByRole("heading"),
  ).toHaveText(offerHeading!);
  await page.getByLabel("Workshop card").selectOption(id);
  await page
    .getByRole("button", { name: "Buy upgrade · 35 gold", exact: true })
    .click();
  current = await stored(page);
  expect(current.inventory[0].element).toBe(element);
  expect(current.inventory[0].keywords).toEqual([offer.keyword]);
  expect(current.gold).toBe(
    220 -
      cardPrice(run.shopCards[0]) -
      POTIONS[run.shopPotions[0].type].price -
      25 -
      20 -
      35,
  );
  await page.reload();
  await page.getByRole("button", { name: "Adventure", exact: true }).click();
  expect((await stored(page)).gold).toBe(current.gold);
  await page.getByLabel("Workshop service").selectOption("keyword");
  await expect(
    page
      .getByRole("region", { name: "Shop keyword offer" })
      .getByRole("heading"),
  ).toHaveText(offerHeading!);
  await expect(
    page.getByRole("button", { name: "Buy upgrade · 35 gold", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: /^Expedition deck/ }).click();
  await page
    .getByRole("button", {
      name: `Remove ${run.inventory[0].name} ${id} from expedition deck`,
      exact: true,
    })
    .click();
  await page
    .getByRole("button", {
      name: `Add ${purchased.name} ${purchased.id} to expedition deck`,
      exact: true,
    })
    .click();
  expect((await stored(page)).deck).toContain(purchased.id);
  await page.getByRole("button", { name: "Close deck", exact: true }).click();
  await page.getByRole("button", { name: "Leave shop", exact: true }).click();
  await expect(page.locator(".run-map")).toBeVisible();
  expect((await stored(page)).floor).toBe(3);
});

function almostDone(
  kind: "chest" | "boss",
  throneHeld = true,
  size: BoardSize = 3,
): Adventure {
  let run = { ...newAdventure(size, 40), floor: kind === "boss" ? 8 : 1 };
  run = enterAdventureNode(run, kind === "boss" ? "warden" : "chest-one");
  if (kind === "chest") run = resolveAdventureEvent(run, "fight");
  const battle = run.battle!,
    objective = battle.objective!;
  const board = battle.board.map((cell, index) =>
    index === size ** 2 - 1
      ? null
      : {
          stone: cell?.stone || {
            ...STARTER_STONES[0],
            id: `custom-test-board-${index}`,
            keywords: [],
            edges: [0, 0, 0, 0] as [number, number, number, number],
          },
          owner: (index === objective && !throneHeld ? 1 : 0) as 0 | 1,
          playedBy: cell?.playedBy || 0,
          edges: [0, 0, 0, 0] as [number, number, number, number],
          activeKeywords: [],
        },
  );
  return {
    ...run,
    battle: {
      ...battle,
      board,
      current: 0,
      hands: [
        [{ ...run.inventory[0], edges: [0, 0, 0, 0], keywords: [] }],
        [run.inventory[0]],
      ],
      turns: size ** 2 - 2,
    },
  };
}
test("holding the chest pays extra gold, and claiming its reward cannot pay twice", async ({
  page,
}) => {
  await openRun(page, almostDone("chest"));
  await page.locator(".run-hand-card").first().click();
  await page
    .getByRole("button", { name: "C3, empty adventure square", exact: true })
    .click();
  await expect(page.locator(".run-message")).toContainText(
    "Chest secured: +45 bonus gold",
  );
  expect((await stored(page)).gold).toBe(135);
  await page.getByRole("button", { name: "Skip relic", exact: true }).click();
  await page
    .getByRole("button", { name: /^Take / })
    .first()
    .click();
  await page.reload();
  await page.getByRole("button", { name: "Adventure", exact: true }).click();
  expect((await stored(page)).gold).toBe(135);
  expect((await stored(page)).floor).toBe(2);
});
for (const held of [true, false])
  test(`boss ending ${held ? "wins with" : "requires"} throne control as well as the score`, async ({
    page,
  }) => {
    await openRun(page, almostDone("boss", held, 4));
    await expect(page.locator(".run-objective")).toContainText("throne at B2");
    await page.locator(".run-hand-card").first().click();
    await page
      .getByRole("button", { name: "D4, empty adventure square", exact: true })
      .click();
    if (held) {
      await expect(page.locator(".run-message")).toContainText(
        "Kaos is defeated",
      );
      expect((await stored(page)).victory).toBe(false);
      await page
        .getByRole("button", { name: "Skip relic", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Skip card reward", exact: true })
        .click();
      expect((await stored(page)).floor).toBe(9);
    } else {
      await expect(page.locator(".run-message")).toContainText(
        "You did not secure the throne",
      );
      expect((await stored(page)).lives).toBe(2);
      await page
        .getByRole("button", { name: "Continue expedition", exact: true })
        .click();
      expect((await stored(page)).floor).toBe(8);
      await expect(page.locator(".run-map-row.current")).toContainText(
        "Kaos · Throne of Chaos",
      );
    }
  });

test("adventure map, battle, chest and shop fit a phone and malformed saves recover", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const run = enterAdventureNode(
    { ...newAdventure(4, 81), floor: 2, gold: 200 },
    "shop-one",
  );
  await openRun(page, run);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Leave shop", exact: true }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: /Tideglass Crossing/ }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.locator(".run-hand-card").first().click();
  await page
    .getByRole("button", { name: "A1, empty adventure square", exact: true })
    .click();
  await expect(page.locator(".adventure-square.occupied")).toHaveCount(2);
  await page.locator(".adventure-square.occupied").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.evaluate(
    (key) => localStorage.setItem(key, '{"version":1,"phase":"battle"}'),
    ADVENTURE_STORAGE,
  );
  await page.reload();
  await page.getByRole("button", { name: "Adventure", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Start adventure", exact: true }),
  ).toBeVisible();
});
