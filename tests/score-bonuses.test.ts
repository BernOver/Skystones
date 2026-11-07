import { test } from "node:test";
import assert from "node:assert/strict";
import {
  STARTER_STONES,
  EMPTY_BOARD,
  validateKeywords,
  placeStone,
  evaluateKeywords,
  cardEdges,
} from "../src/game.ts";
import type { Stone, StoneKeyword, Side } from "../src/game.ts";
import { applyConjure, CONJURE_CARDS } from "../src/conjure.ts";
import { rotatedPotionStone } from "../src/potions.ts";
import {
  newAdventure,
  enterAdventureNode,
  playAdventureCard,
  restoreAdventure,
  validateAdventure,
} from "../src/adventure.ts";
const card = (
  keywords: StoneKeyword[] = [],
  edges: Stone["edges"] = [1, 1, 1, 1],
): Stone => ({
  ...STARTER_STONES[0],
  id: "custom-score-test",
  keywords,
  edges,
});

test("Head Start and Comeback accept 1–99 pips and reject invalid amounts, including nested grants", () => {
  for (const type of ["head-start", "comeback"] as const) {
    for (const amount of [undefined, 1, 3, 99])
      assert.ok(
        validateKeywords([
          { type, side: 0, ...(amount === undefined ? {} : { amount }) },
        ]),
      );
    for (const amount of [0, -1, 100, 1.5, "3", null])
      assert.equal(validateKeywords([{ type, side: 0, amount }]), false);
    assert.ok(
      validateKeywords([
        { type: "combo", keywords: [{ type, side: 0, amount: 4 }] },
      ]),
    );
    assert.ok(
      validateKeywords([
        {
          type: "next-play",
          side: 0,
          amount: 0,
          recipient: "self",
          keywords: [{ type, side: 0, amount: 4 }],
        },
      ]),
    );
  }
});
test("score checks use the configured amount before placement on every side and ties activate neither", () => {
  for (const type of ["head-start", "comeback"] as const)
    for (const side of [0, 1, 2, 3] as Side[]) {
      let board = EMPTY_BOARD();
      board = placeStone(board, 4, card([], [4, 4, 4, 4]), 1).board;
      if (type === "head-start") {
        board = placeStone(board, 0, card([], [0, 0, 0, 0]), 0).board;
        board = placeStone(board, 8, card([], [0, 0, 0, 0]), 0).board;
      }
      const keyword = { type, side, amount: 4 },
        stone = card([keyword]);
      const result = placeStone(board, [7, 3, 1, 5][side], stone, 0);
      assert.deepEqual(result.captured, [4]);
      assert.equal(result.board[[7, 3, 1, 5][side]]!.edges![side], 5);
      assert.deepEqual(stone.edges, [1, 1, 1, 1]);
      assert.deepEqual(
        evaluateKeywords(stone, EMPTY_BOARD(), 0).edges,
        stone.edges,
      );
      assert.deepEqual(result.board[[7, 3, 1, 5][side]]!.activeKeywords, [
        keyword,
      ]);
    }
});
test("large bonuses cap ordinary strengths at 99 and a legacy keyword without amount still grants one", () => {
  const board = placeStone(EMPTY_BOARD(), 0, card([], [0, 0, 0, 0]), 0).board;
  assert.equal(
    evaluateKeywords(
      card([{ type: "head-start", side: 0, amount: 99 }], [5, 1, 1, 1]),
      board,
      0,
    ).edges[0],
    99,
  );
  assert.equal(
    evaluateKeywords(card([{ type: "head-start", side: 0 }]), board, 0)
      .edges[0],
    2,
  );
});
test("strong Comeback stays locked through later score changes and captures, while Silence removes it without undoing damage", () => {
  let board = placeStone(EMPTY_BOARD(), 0, card([], [0, 0, 0, 0]), 1).board;
  board = placeStone(
    board,
    4,
    card([{ type: "comeback", side: 1, amount: 5 }]),
    0,
  ).board;
  assert.equal(cardEdges(board[4]!)[1], 6);
  board = placeStone(board, 8, card([], [0, 0, 0, 0]), 0).board;
  assert.equal(cardEdges(board[4]!)[1], 6);
  board = placeStone(
    board,
    6,
    card([{ type: "sunder", side: 1, amount: 2 }, { type: "silence" }]),
    1,
    [
      { keywordIndex: 0, boardIndex: 4 },
      { keywordIndex: 1, boardIndex: 4 },
    ],
  ).board;
  assert.equal(board[4]!.edges![1], 0);
  assert.equal(board[4]!.silenced, true);
});
test("configured amounts survive Compass and activate when granted through Combo, Next Play, or Conjure", () => {
  const bonus = { type: "head-start" as const, side: 1 as const, amount: 4 };
  let board = placeStone(EMPTY_BOARD(), 0, card([], [0, 0, 0, 0]), 0).board;
  const combo = card([{ type: "combo", keywords: [bonus] }]);
  assert.equal(placeStone(board, 4, combo, 0).board[4]!.edges![1], 5);
  board = placeStone(
    board,
    8,
    card([
      {
        type: "next-play",
        side: 0,
        amount: 0,
        recipient: "self",
        keywords: [bonus],
      },
    ]),
    0,
  ).board;
  assert.equal(placeStone(board, 4, card(), 0).board[4]!.edges![1], 5);
  const caster = card([
    {
      type: "conjure",
      mode: "specific",
      card: "spyro",
      count: 1,
      recipient: "self",
      keywords: [bonus],
    },
  ]);
  const cast = applyConjure(
    placeStone(EMPTY_BOARD(), 0, caster, 0).board,
    0,
    [[], []],
    CONJURE_CARDS.map((stone) => ({ ...stone, keywords: [] })),
    81,
  );
  const copy = cast.hands[0][0];
  assert.equal(
    placeStone(cast.board, 4, copy, 0).board[4]!.edges![1],
    copy.edges[1] + 4,
  );
  assert.deepEqual(rotatedPotionStone(card([bonus])).keywords, [
    { ...bonus, side: 2 },
  ]);
});
test("Adventure saves high configured bonuses and rejects malformed resolved bonus histories", () => {
  let run = enterAdventureNode(newAdventure(3, 81), "moss");
  const stone = {
    ...run.battle!.hands[0][0],
    keywords: [{ type: "comeback" as const, side: 0 as const, amount: 99 }],
  };
  run.battle!.hands[0][0] = stone;
  run.battle!.board = placeStone(
    run.battle!.board,
    8,
    card([], [0, 0, 0, 0]),
    1,
  ).board;
  run = playAdventureCard(run, 0, 0);
  assert.equal(run.battle!.board[0]!.edges![0], 99);
  assert.ok(restoreAdventure(JSON.parse(JSON.stringify(run))));
  const invalid = structuredClone(run);
  invalid.battle!.board[0]!.activeKeywords = [
    { type: "comeback", side: 0, amount: 100 },
  ];
  assert.equal(validateAdventure(invalid), false);
});
