import { test } from "node:test";
import assert from "node:assert/strict";
import {
  POTIONS,
  POTION_IDS,
  adventurePotionAvailability,
  adventurePotionOffers,
  adventurePotionTargets,
  potionSideOptions,
  rotatedPotionStone,
  useAdventurePotion,
} from "../src/potions.ts";
import type { Potion } from "../src/potions.ts";
import {
  enterAdventureNode,
  newAdventure,
  rerollAdventureShop,
  resolveAdventureEvent,
  restoreAdventure,
  validateAdventure,
  adventureStoneForPlay,
} from "../src/adventure.ts";
import { placeStone, EMPTY_BOARD, validateKeywords } from "../src/game.ts";
import type { BoardSize, Edges, Stone } from "../src/game.ts";
import type { Adventure } from "../src/adventure.ts";
function battle(type: Potion, size: BoardSize = 3): Adventure {
  const run = enterAdventureNode(
    { ...newAdventure(size, 21), potions: [type] },
    "moss",
  );
  const card = (id: string, edges: Edges): Stone => ({
    ...run.inventory[0],
    id: `custom-${id}`,
    edges,
    keywords: [],
  });
  run.battle!.board[0] = {
    stone: card("friendly", [3, 3, 3, 3]),
    owner: 0,
    edges: [1, 1, 1, 1],
    reductions: [2, 2, 2, 2],
  };
  run.battle!.board[1] = {
    stone: card("enemy", [4, 3, 2, 1]),
    owner: 1,
    edges: [4, 3, 2, 1],
  };
  run.battle!.board[2] = {
    stone: card("enemy-two", [1, 1, 1, 1]),
    owner: 1,
    edges: [1, 1, 1, 1],
  };
  run.battle!.board[size] = {
    stone: card("friendly-two", [2, 2, 2, 2]),
    owner: 0,
    edges: [2, 2, 2, 2],
  };
  run.battle!.turns = 4;
  return run;
}
function saved(run: Adventure) {
  const copy = JSON.parse(JSON.stringify(run));
  assert.ok(validateAdventure(copy));
  assert.deepEqual(restoreAdventure(copy), copy);
}
test("there are fifteen complete potions; all are reachable in distinct stable shop stocks and drops", () => {
  assert.equal(POTION_IDS.length, 15);
  const seen = new Set();
  for (let seed = 0; seed < 90; seed++) {
    const run = { ...newAdventure(3, seed), floor: 2 };
    const offers = adventurePotionOffers(run);
    assert.equal(offers.length, 3);
    assert.equal(new Set(offers).size, 3);
    assert.deepEqual(offers, adventurePotionOffers(run));
    offers.forEach((type) => seen.add(type));
    let shop = enterAdventureNode(run, "shop-one");
    shop = rerollAdventureShop({ ...shop, gold: 100 });
    assert.ok(shop.shopPotions.every((item) => POTION_IDS.includes(item.type)));
    saved(shop);
  }
  assert.equal(seen.size, 15);
  for (const type of POTION_IDS) {
    assert.ok(
      POTIONS[type].name &&
        POTIONS[type].description.length > 20 &&
        POTIONS[type].price > 0,
    );
    const event = enterAdventureNode(
      { ...newAdventure(3, 9), floor: 4, potions: [] },
      "alchemy",
    );
    assert.deepEqual(resolveAdventureEvent(event, type).potions, [type]);
  }
});
test("Sharpening Oil chooses one edge, scales with Mortar, leaves inventory unchanged, and uses no turn", () => {
  const run = battle("sharpen");
  run.relics = ["alchemists-mortar"];
  const id = run.battle!.hands[0][0].id,
    before = run.battle!.hands[0][0].edges;
  assert.throws(() => useAdventurePotion(run, 0, id));
  const next = useAdventurePotion(run, 0, id, { side: 2 });
  assert.deepEqual(
    next.battle!.hands[0][0].edges,
    before.map((edge, side) => edge + (side === 2 ? 4 : 0)),
  );
  assert.deepEqual(next.inventory, run.inventory);
  assert.equal(next.battle!.turns, 4);
  assert.equal(next.battle!.potionsUsed, 1);
  saved(next);
});
test("Fortress Brew buffs only a friendly board stone, causes no capture, and its boost survives Silence", () => {
  const run = battle("fortify"),
    next = useAdventurePotion(run, 0, 0);
  assert.deepEqual(next.battle!.board[0]!.edges, [2, 2, 2, 2]);
  assert.deepEqual(next.battle!.board[0]!.stone.edges, [4, 4, 4, 4]);
  assert.deepEqual(next.battle!.board[1], run.battle!.board[1]);
  assert.equal(next.battle!.board[1]!.owner, 1);
  const cell = next.battle!.board[0]!;
  cell.stone = { ...cell.stone, keywords: [{ type: "head-start", side: 0 }] };
  const hush = useAdventurePotion({ ...next, potions: ["hush"] }, 0, 0);
  assert.deepEqual(hush.battle!.board[0]!.edges, [2, 2, 2, 2]);
  saved(hush);
  assert.throws(() => useAdventurePotion(run, 0, 1));
});
test("Shatter Flask removes only the chosen enemy edge, records actual damage, and zero edges cannot be targeted", () => {
  const run = battle("shatter"),
    next = useAdventurePotion(run, 0, 1, { side: 1 });
  assert.deepEqual(next.battle!.board[1]!.edges, [4, 0, 2, 1]);
  assert.deepEqual(next.battle!.board[1]!.reductions, [0, 3, 0, 0]);
  assert.throws(() =>
    useAdventurePotion({ ...next, potions: ["shatter"] }, 0, 1, { side: 1 }),
  );
  assert.throws(() => useAdventurePotion(run, 0, 0, { side: 0 }));
  const stronger = useAdventurePotion(
    { ...run, relics: ["alchemists-mortar"] },
    0,
    1,
    { side: 0 },
  );
  assert.equal(stronger.battle!.board[1]!.edges![0], 0);
  saved(stronger);
});
test("Hush Elixir removes keyword snapshots and Dizzy reshuffles, preserving damage and prior effects", () => {
  const run = battle("hush"),
    stone = {
      ...run.inventory[0],
      edges: [4, 4, 4, 0] as Edges,
      keywords: [{ type: "dizzy" as const }],
    };
  const placed = placeStone(EMPTY_BOARD(), 4, stone, 1, [], { seed: 4 })
    .board[4]!;
  run.battle!.board[4] = {
    ...placed,
    reductions: [1, 0, 0, 0],
    edges: placed.edges!.map((edge, side) =>
      side === 0 ? Math.max(0, edge - 1) : edge,
    ) as Edges,
  };
  const next = useAdventurePotion(run, 0, 4);
  assert.equal(next.battle!.board[4]!.silenced, true);
  assert.deepEqual(next.battle!.board[4]!.edges, [3, 4, 4, 0]);
  saved(next);
  assert.equal(
    adventurePotionAvailability({ ...next, potions: ["hush"] }, 0).usable,
    false,
  );
});
test("Compass Cordial rotates all four edges and directional keywords, while flexible and whole-card effects stay flexible", () => {
  const run = battle("compass"),
    stone = run.battle!.hands[0][0];
  stone.edges = [1, 2, 3, 4];
  stone.keywords = [
    { type: "resonance", side: 3, element: "fire" },
    { type: "sunder", side: "any", amount: 3 },
    { type: "dizzy" },
    { type: "silence" },
  ];
  const next = useAdventurePotion(run, 0, stone.id),
    rotated = next.battle!.hands[0][0];
  assert.deepEqual(rotated.edges, [4, 1, 2, 3]);
  assert.deepEqual(rotated.keywords, [
    { type: "resonance", side: 0, element: "fire" },
    { type: "sunder", side: "any", amount: 3 },
    { type: "dizzy" },
    { type: "silence" },
  ]);
  assert.deepEqual(
    rotatedPotionStone(rotatedPotionStone(rotatedPotionStone(rotated))),
    stone,
  );
  saved(next);
});
test("Prismatic Phial changes only a hand card's battle element and keeps Resonance count settings", () => {
  const run = battle("prism"),
    stone = run.battle!.hands[0][0];
  stone.element = "fire";
  stone.keywords = [{ type: "resonance", side: 0, element: "water" }];
  assert.throws(() =>
    useAdventurePotion(run, 0, stone.id, { element: "fire" }),
  );
  const next = useAdventurePotion(run, 0, stone.id, { element: "life" });
  assert.equal(next.battle!.hands[0][0].element, "life");
  assert.deepEqual(next.battle!.hands[0][0].keywords, stone.keywords);
  assert.equal(run.battle!.hands[0][0].element, "fire");
  saved(next);
});
test("Restoration Salve repairs recorded damage only, supports Silence, and never resurrects removed bonuses", () => {
  const run = battle("mend"),
    next = useAdventurePotion(run, 0, 0);
  assert.deepEqual(next.battle!.board[0]!.edges, [3, 3, 3, 3]);
  assert.deepEqual(next.battle!.board[0]!.reductions, [0, 0, 0, 0]);
  assert.equal(
    adventurePotionTargets({ ...next, potions: ["mend"] }, "mend").length,
    0,
  );
  run.battle!.board[0] = {
    ...run.battle!.board[0]!,
    stone: { ...run.battle!.board[0]!.stone, edges: [1, 1, 1, 1] },
    edges: [0, 0, 0, 0],
    reductions: [3, 3, 3, 3],
    silenced: true,
  };
  const capped = useAdventurePotion(
    { ...run, relics: ["alchemists-mortar"] },
    0,
    0,
  );
  assert.deepEqual(capped.battle!.board[0]!.edges, [1, 1, 1, 1]);
  saved(capped);
});
for (const size of [3, 4] as const)
  test(`Frostfire Flask affects only enemy cards in one row on ${size}×${size}`, () => {
    const run = battle("frost", size),
      next = useAdventurePotion(
        { ...run, relics: ["alchemists-mortar"] },
        0,
        1,
      );
    assert.deepEqual(next.battle!.board[1]!.edges, [2, 1, 0, 0]);
    assert.deepEqual(next.battle!.board[2]!.edges, [0, 0, 0, 0]);
    assert.deepEqual(next.battle!.board[0], run.battle!.board[0]);
    assert.deepEqual(next.battle!.board[size], run.battle!.board[size]);
    assert.equal(next.battle!.turns, 4);
    saved(next);
  });
test("Echo Essence adds one valid Resonance keyword, blocks duplicate edges, and leaves the pack unchanged", () => {
  const run = battle("resonance"),
    stone = run.battle!.hands[0][0],
    next = useAdventurePotion(run, 0, stone.id, { side: 3 });
  assert.deepEqual(next.battle!.hands[0][0].keywords, [
    { type: "resonance", side: 3, element: stone.element },
  ]);
  assert.ok(validateKeywords(next.battle!.hands[0][0].keywords));
  assert.ok(!potionSideOptions(next, "resonance", stone.id).includes(3));
  assert.deepEqual(next.inventory, run.inventory);
  saved(next);
});
test("Gambler's Brew adds pips before one fixed capped shuffle and cannot be rerolled by saving", () => {
  const run = battle("gambit"),
    stone = run.battle!.hands[0][0],
    total = stone.edges.reduce((a, b) => a + b, 0),
    next = useAdventurePotion(
      { ...run, relics: ["alchemists-mortar"] },
      0,
      stone.id,
    );
  assert.equal(
    next.battle!.hands[0][0].edges.reduce((a, b) => a + b, 0),
    total + 3,
  );
  assert.ok(next.battle!.hands[0][0].edges.every((edge) => edge <= 4));
  assert.deepEqual(
    useAdventurePotion({ ...run, relics: ["alchemists-mortar"] }, 0, stone.id),
    next,
  );
  saved(next);
});
test("Liquid Gold works between battles, stacks with Mortar and Compass, and Bottomless Bottle saves only one use", () => {
  const run = {
    ...newAdventure(3, 6),
    potions: ["treasure"] as Potion[],
    relics: ["alchemists-mortar", "gilded-compass"] as Adventure["relics"],
  };
  assert.equal(useAdventurePotion(run, 0).gold, run.gold + 50);
  const combat = battle("treasure");
  combat.relics = ["bottomless-bottle"];
  const first = useAdventurePotion(combat, 0),
    second = useAdventurePotion(first, 0);
  assert.equal(first.potions.length, 1);
  assert.equal(second.potions.length, 0);
  assert.equal(second.gold, combat.gold + 60);
  saved(second);
});
test("Transposition Tonic moves two friendly snapshots without captures and cannot move an objective or enemy", () => {
  const run = battle("transposition"),
    a = run.battle!.board[0],
    b = run.battle!.board[3],
    next = useAdventurePotion(run, 0, 0, { second: 3 });
  assert.deepEqual(next.battle!.board[0], b);
  assert.deepEqual(next.battle!.board[3], a);
  assert.deepEqual(next.battle!.board[1], run.battle!.board[1]);
  assert.equal(next.battle!.turns, 4);
  saved(next);
  assert.throws(() => useAdventurePotion(run, 0, 0, { second: 0 }));
  assert.throws(() => useAdventurePotion(run, 0, 0, { second: 1 }));
  assert.throws(() =>
    useAdventurePotion(
      { ...run, battle: { ...run.battle!, objective: 0 } },
      0,
      0,
      { second: 3 },
    ),
  );
});
test("all invalid potion attempts leave charges and state untouched; ended runs and enemy turns block uses", () => {
  for (const type of POTION_IDS) {
    const run = battle(type),
      snapshot = JSON.stringify(run);
    assert.throws(() =>
      useAdventurePotion({ ...run, battle: { ...run.battle!, current: 1 } }, 0),
    );
    assert.throws(() => useAdventurePotion({ ...run, phase: "ended" }, 0));
    assert.equal(JSON.stringify(run), snapshot);
  }
  assert.equal(
    adventurePotionAvailability({ ...newAdventure(3, 5), potions: ["hex"] }, 0)
      .usable,
    false,
  );
  assert.equal(
    validateAdventure({ ...newAdventure(3, 5), potions: ["unknown"] }),
    false,
  );
});
