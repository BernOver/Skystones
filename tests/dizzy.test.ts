import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_BOARD,
  MAX_KEYWORDS,
  STARTER_STONES,
  placeStone,
  rollDizzy,
  validateKeywords,
  validateStone,
} from "../src/game.ts";
import type { Edges, Stone } from "../src/game.ts";
import {
  dizzyEventCard,
  enterAdventureNode,
  newAdventure,
  playAdventureCard,
  resolveAdventureEvent,
  restoreAdventure,
  validateAdventure,
  adventureFusionPreview,
} from "../src/adventure.ts";
import { rotatedPotionStone } from "../src/potions.ts";
import { newDraft, restoreDraft } from "../src/draft.ts";
const stone = (edges: Edges, keywords: Stone["keywords"] = []): Stone => ({
  ...STARTER_STONES[0],
  id: "custom-dizzy-test",
  edges,
  keywords,
  custom: true,
});
test("selected Dizzy sides rotate with their pips, combine in fusion, and preserve legacy Draft sides", () => {
  const base = stone([1, 2, 3, 4], [{ type: "dizzy", sides: [0, 3] }]);
  const rotated = rotatedPotionStone(base);
  assert.deepEqual(rotated.keywords, [{ type: "dizzy", sides: [1, 0] }]);
  const fused = adventureFusionPreview(base, {
    ...base,
    id: "custom-donor",
    keywords: [{ type: "dizzy", sides: [1] }],
  });
  assert.deepEqual(fused.keywords, [{ type: "dizzy", sides: [0, 1, 3] }]);
  const legacy = newDraft(3, 47, {});
  for (const card of legacy.cards)
    card.keywords = card.keywords?.map((keyword) =>
      keyword.type === "dizzy" ? { type: "dizzy" } : keyword,
    );
  assert.deepEqual(
    restoreDraft(JSON.parse(JSON.stringify(legacy)))!.cards,
    legacy.cards,
  );
});
test("Dizzy independently rolls only selected sides from zero to five with stable seeded results", () => {
  const outcomes = new Set<number>();
  for (let seed = 1; seed <= 100; seed++) {
    const input: Edges = [9, 8, 7, 6],
      result = rollDizzy(input, seed, 0, [0, 2]);
    assert.equal(result[1], 8);
    assert.equal(result[3], 6);
    assert.ok([result[0], result[2]].every((pip) => pip >= 0 && pip <= 5));
    outcomes.add(result[0]);
    outcomes.add(result[2]);
    assert.deepEqual(rollDizzy(input, seed, 0, [0, 2]), result);
    assert.deepEqual(input, [9, 8, 7, 6]);
  }
  assert.equal(outcomes.size, 6);
});
test("Dizzy rolls before captures, then keeps its result through later turns and captures", () => {
  const board = EMPTY_BOARD();
  board[5] = { stone: stone([0, 0, 0, 3]), owner: 1 };
  const incoming = stone([2, 0, 1, 3], [{ type: "dizzy", sides: [1] }]);
  let seed = 1;
  while (rollDizzy(incoming.edges, seed, 0, [1])[1] <= 3) seed++;
  const move = placeStone(board, 4, incoming, 0, [], { seed });
  assert.deepEqual(
    move.captured,
    [5],
    "the printed zero edge captures using its rolled strength",
  );
  assert.deepEqual(move.board[4]!.dizzy!.before, [2, 0, 1, 3]);
  assert.deepEqual(move.board[4]!.dizzy!.sides, [1]);
  assert.equal(move.board[4]!.dizzy!.timing, "before-captures");
  assert.deepEqual(
    [
      move.board[4]!.edges![0],
      move.board[4]!.edges![2],
      move.board[4]!.edges![3],
    ],
    [2, 1, 3],
  );
  const snapshot = JSON.parse(JSON.stringify(move.board[4]));
  const captured = placeStone(move.board, 1, stone([0, 0, 5, 0]), 1);
  assert.equal(captured.board[4]!.owner, 1);
  assert.deepEqual(captured.board[4], { ...snapshot, owner: 1 });
  assert.deepEqual(incoming.edges, [2, 0, 1, 3]);
});
test("Silence removes a Dizzy reshuffle but preserves recorded damage and earlier captures", () => {
  let board = placeStone(
    EMPTY_BOARD(),
    4,
    stone([4, 4, 4, 0], [{ type: "dizzy" }]),
    0,
    [],
    { seed: 3 },
  ).board;
  const side = board[4]!.edges!.findIndex((edge) => edge > 0) as 0 | 1 | 2 | 3;
  const amount = Math.min(2, board[4]!.edges![side]);
  board = placeStone(
    board,
    0,
    stone([0, 0, 0, 0], [{ type: "sunder", side, amount: 2 }]),
    1,
    [{ keywordIndex: 0, boardIndex: 4 }],
  ).board;
  board = placeStone(board, 8, stone([0, 0, 0, 0], [{ type: "silence" }]), 1, [
    { keywordIndex: 0, boardIndex: 4 },
  ]).board;
  assert.equal(board[4]!.silenced, true);
  assert.deepEqual(
    board[4]!.edges,
    [4, 4, 4, 0].map((edge, i) =>
      Math.max(0, edge - (i === side ? amount : 0)),
    ),
  );
});
test("Dizzy is a singleton with selected sides, and legacy cards still import", () => {
  const card = stone([4, 4, 4, 0], [{ type: "dizzy" }]);
  assert.ok(validateStone(JSON.parse(JSON.stringify(card))));
  assert.ok(validateKeywords([{ type: "dizzy" }, { type: "silence" }]));
  assert.equal(validateKeywords([{ type: "dizzy" }, { type: "dizzy" }]), false);
  assert.equal(validateKeywords([{ type: "dizzy", side: 0 }]), false);
  assert.ok(validateKeywords([{ type: "dizzy", sides: [0, 2] }]));
  for (const sides of [[], [0, 0], [4], [-1], [1.5], [0, 1, 2, 3, 0]])
    assert.equal(validateKeywords([{ type: "dizzy", sides }]), false);
  assert.equal(MAX_KEYWORDS, 24);
});
test("the Whirling Idol event gives exactly one 12-pip Dizzy card on both board sizes", () => {
  for (const size of [3, 4] as const) {
    const event = enterAdventureNode(
      { ...newAdventure(size, 24), floor: 1 },
      "whirling-idol",
    );
    const card = dizzyEventCard(event),
      won = resolveAdventureEvent(event, "dizzy-card");
    assert.equal(
      card.edges.reduce((a, b) => a + b, 0),
      12,
    );
    assert.deepEqual(card.keywords, [{ type: "dizzy" }]);
    assert.equal(won.inventory.length, event.inventory.length + 1);
    assert.deepEqual(won.deck, event.deck);
    assert.equal(won.floor, 2);
    assert.throws(() => resolveAdventureEvent(won, "dizzy-card"));
    assert.ok(validateAdventure(won));
  }
});
test("Loaded Dice gives marked edges a two-to-five range and saved rolls never reroll", () => {
  for (let seed = 0; seed < 100; seed++) {
    const rolled = rollDizzy([7, 1, 8, 0], seed, 2, [1, 3]);
    assert.equal(rolled[0], 7);
    assert.equal(rolled[2], 8);
    assert.ok(
      rolled[1] >= 2 && rolled[1] <= 5 && rolled[3] >= 2 && rolled[3] <= 5,
    );
  }
  const run = enterAdventureNode(
    { ...newAdventure(3, 42), relics: ["loaded-dice"] },
    "moss",
  );
  run.battle!.hands[0][0] = stone(
    [6, 4, 4, 0],
    [{ type: "dizzy", sides: [1, 3] }],
  );
  const result = playAdventureCard(run, 4, 0),
    cell = result.battle!.board[4]!;
  assert.equal(cell.edges![0], 6);
  assert.equal(cell.edges![2], 4);
  assert.ok(
    cell.edges![1] >= 2 &&
      cell.edges![1] <= 5 &&
      cell.edges![3] >= 2 &&
      cell.edges![3] <= 5,
  );
  assert.deepEqual(
    restoreAdventure(JSON.parse(JSON.stringify(result))),
    JSON.parse(JSON.stringify(result)),
  );
  const invalid = JSON.parse(JSON.stringify(result));
  invalid.battle.board[4].dizzy.after[1] = 6;
  assert.equal(validateAdventure(invalid), false);
  const changed = JSON.parse(JSON.stringify(result));
  changed.battle.board[4].dizzy.after[0] = 5;
  assert.equal(
    validateAdventure(changed),
    false,
    "unmarked edges must remain unchanged",
  );
});
test("legacy four- and five-pip Dizzy snapshots survive without rerolling", () => {
  for (const cap of [4, 5]) {
    const run = enterAdventureNode(newAdventure(3, 42), "moss");
    run.battle!.board[4] = {
      stone: stone([5, 5, 5, 5], [{ type: "dizzy" }]),
      owner: 0,
      edges: [cap, cap, cap, cap],
      dizzy: { before: [6, 6, 6, 6], after: [cap, cap, cap, cap] },
    };
    run.battle!.turns = 1;
    assert.deepEqual(
      restoreAdventure(JSON.parse(JSON.stringify(run))),
      JSON.parse(JSON.stringify(run)),
    );
  }
});
