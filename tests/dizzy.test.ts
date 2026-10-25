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
} from "../src/adventure.ts";
const stone = (edges: Edges, keywords: Stone["keywords"] = []): Stone => ({
  ...STARTER_STONES[0],
  id: "custom-dizzy-test",
  edges,
  keywords,
  custom: true,
});
test("Dizzy redistributes totals once, has varied seeded outcomes, and caps every edge at five", () => {
  const outcomes = new Set<string>();
  for (let total = 0; total <= 24; total++)
    for (let seed = 1; seed <= 40; seed++) {
      const input: Edges = [total, 0, 0, 0],
        rolled = rollDizzy(input, seed);
      assert.equal(
        rolled.reduce((a, b) => a + b, 0),
        Math.min(20, total),
      );
      assert.ok(
        rolled.every(
          (edge) => Number.isInteger(edge) && edge >= 0 && edge <= 5,
        ),
      );
      assert.deepEqual(rollDizzy(input, seed), rolled);
      assert.deepEqual(input, [total, 0, 0, 0]);
      if (total === 12) outcomes.add(rolled.join());
    }
  assert.ok(outcomes.size > 5);
  assert.deepEqual(rollDizzy([5, 5, 5, 5], 42), [5, 5, 5, 5]);
});
test("Dizzy captures with pre-shuffle strengths, then keeps its defensive snapshot through later turns and capture", () => {
  const board = EMPTY_BOARD();
  board[5] = { stone: stone([0, 0, 0, 3]), owner: 1 };
  const card = stone([0, 4, 0, 0], [{ type: "dizzy" }]);
  const move = placeStone(board, 4, card, 0, [], { seed: 1 });
  assert.deepEqual(move.captured, [5]);
  assert.ok(move.board[4]!.edges![1] < 4);
  assert.deepEqual(move.board[4]!.dizzy!.before, [0, 4, 0, 0]);
  const snapshot = JSON.parse(JSON.stringify(move.board[4]));
  const captured = placeStone(move.board, 1, stone([0, 0, 5, 0]), 1);
  assert.equal(captured.board[4]!.owner, 1);
  assert.deepEqual(captured.board[4], { ...snapshot, owner: 1 });
  assert.equal(board[4], null);
  assert.deepEqual(card.edges, [0, 4, 0, 0]);
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
test("Dizzy is a singleton with no direction, and valid cards round-trip through imports", () => {
  const card = stone([4, 4, 4, 0], [{ type: "dizzy" }]);
  assert.ok(validateStone(JSON.parse(JSON.stringify(card))));
  assert.ok(validateKeywords([{ type: "dizzy" }, { type: "silence" }]));
  assert.equal(validateKeywords([{ type: "dizzy" }, { type: "dizzy" }]), false);
  assert.equal(validateKeywords([{ type: "dizzy", side: 0 }]), false);
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
test("Loaded Dice preserves total and ceiling while imposing the feasible minimum; saved Dizzy never rerolls", () => {
  for (let total = 0; total <= 20; total++) {
    const rolled = rollDizzy([total, 0, 0, 0], 15, 2);
    assert.ok(
      rolled.every(
        (edge) => edge >= Math.min(2, Math.floor(total / 4)) && edge <= 5,
      ),
    );
    assert.equal(
      rolled.reduce((a, b) => a + b, 0),
      total,
    );
  }
  const run = enterAdventureNode(
    { ...newAdventure(3, 42), relics: ["loaded-dice"] },
    "moss",
  );
  run.battle!.hands[0][0] = stone([4, 4, 4, 0], [{ type: "dizzy" }]);
  const result = playAdventureCard(run, 4, 0);
  assert.ok(
    result.battle!.board[4]!.edges!.every((edge) => edge >= 2 && edge <= 5),
  );
  assert.deepEqual(playAdventureCard(run, 4, 0), result);
  assert.deepEqual(
    restoreAdventure(JSON.parse(JSON.stringify(result))),
    JSON.parse(JSON.stringify(result)),
  );
  const malformed = JSON.parse(JSON.stringify(result));
  malformed.battle.board[4].dizzy.after = [6, 4, 2, 0];
  assert.equal(validateAdventure(malformed), false);
});
test("five-pip Dizzy snapshots and legacy capped snapshots both survive saves without rerolling", () => {
  const run = enterAdventureNode(newAdventure(3, 42), "moss");
  run.battle!.hands[0][0] = stone([6, 6, 6, 6], [{ type: "dizzy" }]);
  const result = playAdventureCard(run, 4, 0);
  assert.deepEqual(result.battle!.board[4]!.edges, [5, 5, 5, 5]);
  assert.deepEqual(
    restoreAdventure(JSON.parse(JSON.stringify(result))),
    JSON.parse(JSON.stringify(result)),
  );
  const legacy = JSON.parse(JSON.stringify(result));
  legacy.battle.board[4].edges = [4, 4, 4, 4];
  legacy.battle.board[4].dizzy.after = [4, 4, 4, 4];
  assert.deepEqual(restoreAdventure(legacy), legacy);
  const malformed = JSON.parse(JSON.stringify(result));
  malformed.battle.board[4].dizzy.after = [5, 5, 5, 4];
  assert.equal(
    validateAdventure(malformed),
    false,
    "new snapshots must preserve the total up to twenty",
  );
});
