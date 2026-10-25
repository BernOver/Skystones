import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import {
  ADVENTURE_STORAGE,
  ADVENTURE_NOTE_STORAGE,
  newAdventure,
  enterAdventureNode,
  resolveAdventureEvent,
  transformAdventureCards,
  adventureSpireMemoryCards,
} from "../../src/adventure.ts";
import type { Adventure } from "../../src/adventure.ts";
import { POTIONS } from "../../src/potions.ts";
import type { Potion } from "../../src/potions.ts";
import { getSpireEvent } from "../../src/spireEvents.ts";
import { placeStone, EMPTY_BOARD } from "../../src/game.ts";
import type { Edges } from "../../src/game.ts";
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
async function reload(page: Page) {
  await page.reload();
  await page.getByRole("button", { name: "Adventure", exact: true }).click();
}
function battle(type: Potion): Adventure {
  const run = enterAdventureNode(
    { ...newAdventure(4, 61), potions: [type] },
    "moss",
  );
  const own = {
      ...run.inventory[0],
      keywords: [],
      edges: [3, 3, 3, 3] as Edges,
    },
    enemy = {
      ...run.inventory[1],
      id: "custom-enemy-snapshot",
      name: "Keeper Stone",
      portrait: "spyro",
      origin: "skylanders" as const,
      keywords: [],
      edges: [4, 3, 2, 1] as Edges,
    };
  run.battle!.board[0] = {
    stone: own,
    owner: 0,
    edges: [1, 1, 1, 1],
    reductions: [2, 2, 2, 2],
  };
  run.battle!.board[1] = { stone: enemy, owner: 1, edges: [4, 3, 2, 1] };
  run.battle!.board[2] = {
    stone: { ...enemy, id: "custom-enemy-other" },
    owner: 1,
    edges: [1, 1, 1, 1],
  };
  run.battle!.board[4] = {
    stone: { ...own, id: "custom-friendly-other" },
    owner: 0,
    edges: [3, 3, 3, 3],
  };
  run.battle!.hands[0][0] = {
    ...run.battle!.hands[0][0],
    edges: [1, 2, 3, 4],
    element: "fire",
    keywords: [{ type: "head-start", side: 0 }],
  };
  run.battle!.turns = 4;
  if (type === "hush") {
    const card = { ...enemy, keywords: [{ type: "dizzy" as const }] };
    run.battle!.board[1] = placeStone(EMPTY_BOARD(4), 1, card, 1, [], {
      seed: 7,
    }).board[1];
  }
  return run;
}
const cases: {
  type: Potion;
  target?: RegExp;
  side?: string;
  element?: string;
  second?: RegExp;
}[] = [
  { type: "sharpen", target: /^Sharpen /, side: "North" },
  { type: "fortify", target: /^Fortify A1/ },
  { type: "shatter", target: /^Shatter A2/, side: "North" },
  { type: "hush", target: /^Silence A2/ },
  { type: "compass", target: /^Rotate / },
  { type: "prism", target: /^Recolor /, element: "Water" },
  { type: "mend", target: /^Restore A1/ },
  { type: "frost", target: /^Freeze row A/ },
  { type: "resonance", target: /^Enchant /, side: "South" },
  { type: "gambit", target: /^Reshape / },
  { type: "treasure" },
  { type: "transposition", target: /^Swap A1/, second: /^With B1/ },
];
for (const option of cases)
  test(`${POTIONS[option.type].name} applies its targeted effect and saves without spending a turn`, async ({
    page,
  }) => {
    const run = battle(option.type),
      original = JSON.parse(JSON.stringify(run));
    await open(page, run);
    await page
      .getByRole("button", {
        name: `Use ${POTIONS[option.type].name}`,
        exact: true,
      })
      .click();
    if (option.target)
      await page
        .getByRole("dialog")
        .getByRole("button", { name: option.target })
        .first()
        .click();
    if (option.side)
      await page
        .getByRole("button", {
          name: `Choose ${option.side} edge`,
          exact: true,
        })
        .click();
    if (option.element)
      await page
        .getByRole("group", { name: "Choose potion element" })
        .getByRole("button", { name: option.element, exact: true })
        .click();
    if (option.second)
      await page
        .getByRole("group", { name: "Choose second friendly card" })
        .getByRole("button", { name: option.second })
        .click();
    const saved = await stored(page);
    expect(saved.potions).toEqual([]);
    expect(saved.battle!.turns).toBe(4);
    expect(saved.battle!.current).toBe(0);
    expect(saved.inventory).toEqual(original.inventory);
    switch (option.type) {
      case "sharpen":
        expect(saved.battle!.hands[0][0].edges).toEqual([4, 2, 3, 4]);
        break;
      case "fortify":
        expect(saved.battle!.board[0]!.edges).toEqual([2, 2, 2, 2]);
        break;
      case "shatter":
        expect(saved.battle!.board[1]!.edges).toEqual([1, 3, 2, 1]);
        break;
      case "hush":
        expect(saved.battle!.board[1]!.silenced).toBe(true);
        expect(saved.battle!.board[1]!.edges).toEqual([4, 3, 2, 1]);
        break;
      case "compass":
        expect(saved.battle!.hands[0][0].edges).toEqual([4, 1, 2, 3]);
        expect(saved.battle!.hands[0][0].keywords).toEqual([
          { type: "head-start", side: 1 },
        ]);
        break;
      case "prism":
        expect(saved.battle!.hands[0][0].element).toBe("water");
        break;
      case "mend":
        expect(saved.battle!.board[0]!.edges).toEqual([3, 3, 3, 3]);
        break;
      case "frost":
        expect(saved.battle!.board[1]!.edges).toEqual([3, 2, 1, 0]);
        expect(saved.battle!.board[0]).toEqual(original.battle.board[0]);
        break;
      case "resonance":
        expect(saved.battle!.hands[0][0].keywords).toContainEqual({
          type: "resonance",
          side: 2,
          element: "fire",
        });
        break;
      case "gambit":
        expect(saved.battle!.hands[0][0].edges.reduce((a, b) => a + b, 0)).toBe(
          12,
        );
        expect(saved.battle!.hands[0][0].edges.every((edge) => edge <= 4)).toBe(
          true,
        );
        break;
      case "treasure":
        expect(saved.gold).toBe(original.gold + 30);
        break;
      case "transposition":
        expect(saved.battle!.board[0]).toEqual(original.battle.board[4]);
        expect(saved.battle!.board[4]).toEqual(original.battle.board[0]);
        break;
    }
    await reload(page);
    expect((await stored(page)).battle).toEqual(saved.battle);
  });
function encounter(id: string, size: 3 | 4 = 3, stage = 0): Adventure {
  const event = getSpireEvent(id)!,
    floor = event.act === 1 ? 1 : event.act === 3 ? 7 : 4;
  return {
    ...enterAdventureNode(
      { ...newAdventure(size, 61), floor },
      `spire-crossroads-${floor === 1 ? 1 : floor === 4 ? 2 : 3}`,
    ),
    spireEvent: { id, stage, visits: 0 },
    seenSpireEvents: [id],
  };
}
test("potion targeting can be canceled and both guides list the full expansion on a phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const run = battle("sharpen");
  await open(page, run);
  await page
    .getByRole("button", { name: "Use Sharpening Oil", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /^Sharpen / })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Cancel potion", exact: true })
    .click();
  expect((await stored(page)).potions).toEqual(["sharpen"]);
  await page
    .getByRole("button", { name: "Potion guide · 15", exact: true })
    .click();
  await expect(page.locator(".potion-guide-card")).toHaveCount(15);
  expect(
    await page
      .getByRole("dialog")
      .evaluate((node) => node.scrollWidth <= node.clientWidth),
  ).toBe(true);
  await page.screenshot({ path: "/tmp/skystones-potion-guide-mobile.png" });
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Event guide · 54", exact: true })
    .click();
  await expect(page.locator(".spire-guide-grid article")).toHaveCount(54);
  await page.getByLabel("Search event guide").fill("transmogrifier");
  await expect(page.locator(".spire-guide-grid article")).toHaveCount(1);
  await page.screenshot({ path: "/tmp/skystones-event-guide-mobile.png" });
  await page.keyboard.press("Escape");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
for (const size of [3, 4] as const)
  test(`transforming a stone on ${size}×${size} preserves deck identity and supports five keywords`, async ({
    page,
  }) => {
    let run = encounter("transmogrifier", size);
    for (let seed = 0; seed < 1000; seed++) {
      const candidate = { ...run, seed };
      if (
        transformAdventureCards(candidate, [run.inventory[0].id], 0)
          .inventory[0].keywords!.length === 5
      ) {
        run = candidate;
        break;
      }
    }
    await open(page, run);
    await page
      .getByRole("button", {
        name: "Transform one stone · enhanced keyword odds, up to five",
        exact: true,
      })
      .click();
    await expect(page.locator(".spire-selection")).toContainText("90% chance");
    await page
      .getByRole("button", { name: "Confirm event choice", exact: true })
      .click();
    const saved = await stored(page);
    expect(saved.inventory[0].id).toBe(run.inventory[0].id);
    expect(saved.inventory[0].keywords).toHaveLength(5);
    expect(saved.deck).toEqual(run.deck);
    await reload(page);
    expect((await stored(page)).inventory).toEqual(saved.inventory);
  });
test("matching game resumes after a reveal and grants one matched card once", async ({
  page,
}) => {
  const run = encounter("match-keep"),
    cards = adventureSpireMemoryCards(run),
    a = cards.findIndex((card) => !card.id.startsWith("custom-curse")),
    b = cards.findIndex(
      (card, index) => index !== a && card.id === cards[a].id,
    );
  await open(page, run);
  await page
    .getByRole("button", {
      name: "Play · five attempts to match six pairs",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: `Reveal stone ${a + 1}`, exact: true })
    .click();
  await reload(page);
  await expect(
    page.getByRole("button", { name: `Revealed stone ${a + 1}`, exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: `Reveal stone ${b + 1}`, exact: true })
    .click();
  expect((await stored(page)).inventory).toHaveLength(run.inventory.length + 1);
  await expect(
    page.getByRole("button", { name: `Matched stone ${a + 1}`, exact: true }),
  ).toBeDisabled();
  await page.screenshot({ path: "/tmp/skystones-matching-event.png" });
  await page
    .getByRole("button", { name: "Keep matches and continue", exact: true })
    .click();
  expect((await stored(page)).floor).toBe(5);
});
test("curse bargains create a zero-pip battle hand slot which can still be strengthened with a potion", async ({
  page,
}) => {
  const run = encounter("serpent", 4);
  await open(page, run);
  await page
    .getByRole("button", {
      name: "Accept · gain 100 gold and Doubt",
      exact: true,
    })
    .click();
  await expect(page.getByLabel("Encounter conditions")).toContainText("Doubt");
  await page.getByRole("button", { name: /The Wandering Merchant/ }).click();
  await page.getByRole("button", { name: "Leave shop", exact: true }).click();
  await page.getByRole("button", { name: /Tideglass Crossing/ }).click();
  await expect(
    page.locator(".run-hand-card").filter({ hasText: "Doubt" }),
  ).toHaveCount(1);
  await page
    .getByRole("button", { name: "Use Power Tonic", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Empower Doubt", exact: true })
    .click();
  expect((await stored(page)).battle!.hands[0][0].edges).toEqual([1, 1, 1, 1]);
});
test("the Colosseum resumes at its second-stage decision after victory", async ({
  page,
}) => {
  let run = resolveAdventureEvent(encounter("colosseum"), "choice:0");
  const stone = {
    ...run.inventory[0],
    edges: [0, 0, 0, 0] as Edges,
    keywords: [],
  };
  run = {
    ...run,
    battle: {
      ...run.battle!,
      board: Array.from({ length: 9 }, (_, i) =>
        i === 8 ? null : { stone, owner: 0, edges: [0, 0, 0, 0] as Edges },
      ),
      hands: [[stone], []],
      current: 0,
      turns: 8,
    },
  };
  await open(page, run);
  await page.locator(".run-hand-card").first().click();
  await page
    .getByRole("button", { name: "C3, empty adventure square", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /Enter the main event/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Enter the main event/ }).click();
  expect((await stored(page)).battle!.eventRelics).toBe(2);
  await reload(page);
  expect((await stored(page)).phase).toBe("battle");
});
test("A Note for Yourself stores an offered stone for the next new adventure", async ({
  page,
}) => {
  const run = encounter("note");
  await open(page, run);
  await page.getByRole("button", { name: /Give and receive/ }).click();
  await page
    .getByRole("button", { name: "Confirm event choice", exact: true })
    .click();
  const note = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    ADVENTURE_NOTE_STORAGE,
  );
  expect(note.id).toBe(run.inventory[0].id);
  await page
    .getByRole("button", { name: "New adventure", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Start a new adventure", exact: true })
    .click();
  expect((await stored(page)).note).toEqual(note);
  expect((await stored(page)).floor).toBe(0);
});
