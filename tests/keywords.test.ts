import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_BOARD,
  STARTER_STONES,
  chooseMove,
  evaluateKeywords,
  placeStone,
  score,
  validateStone,
} from "../src/game.ts";
import type { Board, Side, Stone, StoneKeyword } from "../src/game.ts";

const plain = (edges: Stone["edges"] = [2, 2, 2, 2]): Stone => ({
  ...STARTER_STONES[0],
  edges,
  keywords: [],
});
const withKeywords = (...keywords: StoneKeyword[]): Stone => ({
  ...plain(),
  keywords,
});

test("Head Start needs a lead, Comeback needs a deficit, and ties activate neither", () => {
  const card = withKeywords(
    { type: "head-start", side: 0 },
    { type: "comeback", side: 2 },
  );
  const board = EMPTY_BOARD();
  assert.deepEqual(evaluateKeywords(card, board, 0).edges, [2, 2, 2, 2]);
  board[0] = { stone: plain(), owner: 0 };
  assert.deepEqual(evaluateKeywords(card, board, 0).edges, [3, 2, 2, 2]);
  assert.deepEqual(evaluateKeywords(card, board, 1).edges, [2, 2, 3, 2]);
  board[8] = { stone: plain(), owner: 1 };
  assert.deepEqual(evaluateKeywords(card, board, 0).activeKeywords, []);
  assert.deepEqual(evaluateKeywords(card, board, 1).activeKeywords, []);
});

test("eligibility uses the score before placement, not the stone being added", () => {
  const board = EMPTY_BOARD();
  board[0] = { stone: plain(), owner: 1 };
  const card = withKeywords({ type: "comeback", side: 1 });
  const placed = placeStone(board, 8, card, 0);
  assert.deepEqual(score(placed.board), [1, 1]);
  assert.deepEqual(placed.board[8]?.edges, [2, 3, 2, 2]);
  assert.deepEqual(placed.board[8]?.activeKeywords, [
    { type: "comeback", side: 1 },
  ]);
  const tieBoard = EMPTY_BOARD();
  const headStart = placeStone(
    tieBoard,
    4,
    withKeywords({ type: "head-start", side: 0 }),
    0,
  );
  assert.deepEqual(
    headStart.board[4]?.edges,
    [2, 2, 2, 2],
    "placing the first stone must not trigger Head Start",
  );
});

test("a Comeback pip changes a capture result on each of the four edges", () => {
  const positions = [7, 3, 1, 5];
  for (let side = 0; side < 4; side++) {
    const board = EMPTY_BOARD();
    board[4] = { stone: plain(), owner: 1 };
    const card = withKeywords({ type: "comeback", side: side as Side });
    const move = placeStone(board, positions[side], card, 0);
    assert.deepEqual(move.captured, [4]);
    assert.equal(move.board[positions[side]]?.edges?.[side], 3);
    assert.deepEqual(
      card.edges,
      [2, 2, 2, 2],
      "printed card values stay immutable",
    );
  }
});

test("all captures in a move use the same pre-placement bonus snapshot", () => {
  const board = EMPTY_BOARD();
  board[1] = { stone: plain(), owner: 1 };
  board[5] = { stone: plain(), owner: 1 };
  board[8] = { stone: plain(), owner: 0 };
  const card = withKeywords(
    { type: "comeback", side: 0 },
    { type: "comeback", side: 1 },
  );
  const move = placeStone(board, 4, card, 0);
  assert.deepEqual(move.captured, [1, 5]);
  assert.deepEqual(score(move.board), [4, 0]);
  assert.deepEqual(move.board[4]?.edges, [3, 3, 2, 2]);
  assert.equal(move.board[4]?.activeKeywords?.length, 2);
});

test("a Head Start bonus remains for defense after losing the lead and being captured", () => {
  const board = EMPTY_BOARD();
  board[0] = { stone: plain(), owner: 0 };
  const card = withKeywords({ type: "head-start", side: 1 });
  const winningMove = placeStone(board, 3, card, 0);
  const laterBoard: Board = [...winningMove.board];
  for (const spot of [1, 2, 5, 8])
    laterBoard[spot] = { stone: plain(), owner: 1 };
  assert.deepEqual(score(laterBoard), [2, 4]);
  const equal = placeStone(laterBoard, 4, plain([0, 0, 0, 3]), 1);
  assert.equal(
    equal.board[3]?.owner,
    0,
    "the locked +1 prevents a base-strength capture",
  );
  assert.deepEqual(equal.board[3]?.edges, [2, 3, 2, 2]);
  const capture = placeStone(laterBoard, 4, plain([0, 0, 0, 4]), 1);
  assert.equal(capture.board[3]?.owner, 1);
  assert.equal(capture.board[3]?.playedBy, 0);
  assert.deepEqual(capture.board[3]?.edges, [2, 3, 2, 2]);
  assert.deepEqual(capture.board[3]?.activeKeywords, [
    { type: "head-start", side: 1 },
  ]);
});

test("inactive keywords never turn on later, and bonuses may increase a base edge of five to six", () => {
  const card = {
    ...withKeywords({ type: "comeback", side: 0 }),
    edges: [5, 1, 1, 1] as Stone["edges"],
  };
  const initial = placeStone(EMPTY_BOARD(), 4, card, 0);
  assert.equal(initial.board[4]?.edges?.[0], 5);
  const later = [...initial.board];
  for (const spot of [0, 2, 8]) later[spot] = { stone: plain(), owner: 1 };
  assert.equal(later[4]?.edges?.[0], 5);
  const losing = EMPTY_BOARD();
  losing[0] = { stone: plain(), owner: 1 };
  assert.equal(placeStone(losing, 4, card, 0).board[4]?.edges?.[0], 6);
});

test("the computer considers keyword captures when selecting a move", () => {
  const board = EMPTY_BOARD();
  board[0] = { stone: plain(), owner: 0 };
  board[4] = { stone: plain(), owner: 0 };
  const card = withKeywords({ type: "comeback", side: 1 });
  const move = chooseMove(board, [card], [], 1);
  assert.equal(move.index, 3);
  assert.deepEqual(placeStone(board, move.index, card, 1).captured, [4]);
});

test("imports accept legacy cards and valid keywords, and reject invalid or duplicate assignments", () => {
  const card = { ...plain(), id: "custom-keywords" };
  const { keywords: _, ...legacy } = card;
  assert.equal(validateStone(legacy), true);
  assert.equal(
    validateStone({
      ...card,
      keywords: [
        { type: "head-start", side: 0 },
        { type: "comeback", side: 0 },
      ],
    }),
    true,
  );
  for (const keywords of [
    null,
    {},
    [{ type: "unknown", side: 0 }],
    [{ type: "__proto__", side: 0 }],
    [{ type: {}, side: 0 }],
    [{ type: "comeback", side: -1 }],
    [{ type: "comeback", side: 4 }],
    [{ type: "comeback", side: 1.5 }],
    [
      { type: "comeback", side: 1 },
      { type: "comeback", side: 1 },
    ],
  ]) {
    assert.equal(validateStone({ ...card, keywords }), false);
  }
});
