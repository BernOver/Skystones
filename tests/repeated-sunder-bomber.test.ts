import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  EMPTY_BOARD,
  MAX_KEYWORDS,
  STARTER_STONES,
  chooseKeywordTargets,
  placeStone,
  prepareTargeting,
  validateKeywords,
} from "../src/game.ts";
import type { Stone } from "../src/game.ts";
import { ADVENTURE_CHARACTERS, ENEMY_STONES } from "../src/characters.ts";
import {
  adventureFusionPreview,
  enterAdventureNode,
  newAdventure,
  restoreAdventure,
} from "../src/adventure.ts";
const stone = (
  edges: Stone["edges"] = [0, 0, 0, 0],
  keywords: Stone["keywords"] = [],
): Stone => ({
  ...STARTER_STONES[0],
  id: "custom-twin-sunder",
  name: "Twin Sunder",
  edges,
  keywords,
});
const repeated: NonNullable<Stone["keywords"]> = [
  { type: "sunder", side: 0, amount: 2 },
  { type: "sunder", side: 0, amount: 3 },
];
test("repeated fixed and flexible Sunder validate, including Combo grants, while other duplicate keywords and card limits remain enforced", () => {
  assert.ok(validateKeywords(repeated));
  assert.ok(
    validateKeywords([
      { type: "sunder", side: "any" },
      { type: "sunder", side: "any" },
    ]),
  );
  assert.ok(validateKeywords([{ type: "combo", keywords: repeated }]));
  assert.ok(validateKeywords(Array(MAX_KEYWORDS).fill(repeated[0])));
  assert.equal(
    validateKeywords(Array(MAX_KEYWORDS + 1).fill(repeated[0])),
    false,
  );
  assert.equal(
    validateKeywords([
      { type: "shield", side: 0 },
      { type: "shield", side: 0 },
    ]),
    false,
  );
  assert.equal(
    validateKeywords([{ type: "silence" }, { type: "silence" }]),
    false,
  );
});
test("same-direction Sunder chooses separate cards or cumulatively damages the same edge, before captures, without mutating the board", () => {
  const board = EMPTY_BOARD(3);
  board[4] = { stone: stone([5, 0, 0, 0]), owner: 1 };
  board[8] = { stone: stone([4, 0, 0, 0]), owner: 0 };
  const incoming = stone([0, 0, 1, 0], repeated),
    snapshot = JSON.stringify(board);
  const first = prepareTargeting(board, incoming, [
    { keywordIndex: 0, boardIndex: 4 },
  ]);
  assert.equal(first.board[4]!.edges![0], 3);
  assert.equal(first.pending!.keywordIndex, 1);
  const split = placeStone(board, 1, incoming, 0, [
    { keywordIndex: 0, boardIndex: 4 },
    { keywordIndex: 1, boardIndex: 8 },
  ]);
  assert.equal(split.board[4]!.edges![0], 3);
  assert.equal(split.board[8]!.edges![0], 1);
  assert.deepEqual(
    split.effects.map((effect) => effect.keywordIndex),
    [0, 1],
  );
  const cumulative = placeStone(board, 1, incoming, 0, [
    { keywordIndex: 0, boardIndex: 4 },
    { keywordIndex: 1, boardIndex: 4 },
  ]);
  assert.equal(cumulative.board[4]!.edges![0], 0);
  assert.equal(cumulative.board[4]!.reductions![0], 5);
  assert.deepEqual(cumulative.captured, [4]);
  assert.equal(JSON.stringify(board), snapshot);
});
test("repeated Sunder skips exhausted edges and the computer chooses each valid effect independently", () => {
  const board = EMPTY_BOARD(4);
  board[6] = { stone: stone([1, 0, 0, 0]), owner: 1 };
  const incoming = stone([0, 0, 1, 0], repeated);
  const targets = chooseKeywordTargets(board, 2, incoming, 0);
  assert.equal(targets.length, 1);
  const move = placeStone(board, 2, incoming, 0, targets);
  assert.equal(move.effects.length, 1);
  assert.equal(move.effects[0].keywordIndex, 0);
  assert.deepEqual(move.captured, [6]);
});
test("Combo-granted repeated Sunder keeps distinct occurrence indices alongside printed effects", () => {
  let board = placeStone(EMPTY_BOARD(3), 8, stone(), 0).board;
  board[4] = { stone: stone([5, 0, 0, 0]), owner: 1 };
  const incoming = stone();
  incoming.edges = [0, 0, 1, 0];
  incoming.keywords = [
    { type: "sunder", side: 0 },
    { type: "combo", keywords: repeated },
  ];
  const targets = chooseKeywordTargets(board, 1, incoming, 0);
  assert.deepEqual(
    targets.map((target) => target.keywordIndex),
    [0, 1, 2],
  );
  const move = placeStone(board, 1, incoming, 0, targets);
  assert.deepEqual(
    move.effects.map((effect) => effect.keywordIndex),
    [0, 1, 2],
  );
  assert.equal(move.board[4]!.edges![0], 0);
});
test("fusion retains repeated Sunder independently and respects the total keyword limit", () => {
  const base = stone([1, 1, 1, 1], repeated),
    donor = { ...stone([1, 1, 1, 1], repeated), id: "custom-donor" };
  assert.deepEqual(adventureFusionPreview(base, donor).keywords, [
    ...repeated,
    ...repeated,
  ]);
  const full = { ...base, keywords: Array(MAX_KEYWORDS).fill(repeated[0]) };
  const fused = adventureFusionPreview(full, donor);
  assert.equal(fused.keywords!.length, MAX_KEYWORDS);
  assert.ok(validateKeywords(fused.keywords));
});
test("Arkeyan Bomber has right 3 / left 0 in both catalogues, and untouched saved Adventure copies repair once", () => {
  const bomber = ENEMY_STONES.find(
    (card) => card.portrait === "enemy-arkeyan-bomber",
  )!;
  assert.deepEqual(bomber.edges, [2, 3, 1, 0]);
  assert.deepEqual(
    ADVENTURE_CHARACTERS.find((card) => card.portrait === bomber.portrait)!
      .edges,
    bomber.edges,
  );
  const reference = JSON.parse(
    readFileSync(new URL("../src/giants-data.json", import.meta.url), "utf8"),
  );
  assert.deepEqual(
    reference.find((card: Stone) => card.id === bomber.id).edges,
    bomber.edges,
  );
  const run = enterAdventureNode(newAdventure(3, 81), "moss");
  const old = {
    ...bomber,
    id: run.inventory[0].id,
    edges: [2, 0, 1, 3] as Stone["edges"],
    baseEdges: [2, 0, 1, 3] as Stone["edges"],
  };
  run.inventory[0] = old;
  run.battle!.hands[0][0] = old;
  run.battle!.board[0] = {
    stone: old,
    owner: 0,
    playedBy: 0,
    edges: [2, 0, 1, 2],
    reductions: [0, 0, 0, 1],
  };
  run.battle!.turns = 1;
  run.battle!.hands[0].shift();
  const restored = restoreAdventure(JSON.parse(JSON.stringify(run)))!;
  assert.deepEqual(restored.inventory[0].edges, bomber.edges);
  assert.deepEqual(restored.inventory[0].baseEdges, bomber.edges);
  assert.deepEqual(restored.battle!.board[0]!.edges, [2, 3, 1, 0]);
  assert.deepEqual(restored.deck, run.deck);
  assert.deepEqual(
    restoreAdventure(JSON.parse(JSON.stringify(restored))),
    restored,
  );
});
