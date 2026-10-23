import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_BOARD,
  STARTER_STONES,
  chooseMove,
  placeStone,
  score,
  validateStone,
} from "../src/game.ts";
import type { Board, Stone } from "../src/game.ts";

const stone = (edges: Stone["edges"]): Stone => ({
  ...STARTER_STONES[0],
  edges,
  keywords: [],
});

test("a stronger facing edge captures, equal or weaker edges do not", () => {
  let board = placeStone(EMPTY_BOARD(), 4, stone([2, 2, 2, 2]), 1).board;
  const capture = placeStone(board, 1, stone([0, 0, 3, 0]), 0);
  assert.deepEqual(capture.captured, [4]);
  assert.equal(capture.board[4]?.owner, 0);
  assert.equal(board[4]?.owner, 1, "the input board must remain unchanged");
  assert.equal(placeStone(board, 1, stone([0, 0, 2, 0]), 0).captured.length, 0);
  assert.equal(placeStone(board, 1, stone([0, 0, 1, 0]), 0).captured.length, 0);
});

test("all four facing edges are compared in their correct orientation", () => {
  const board = EMPTY_BOARD();
  board[1] = { stone: stone([5, 5, 0, 5]), owner: 1 };
  board[5] = { stone: stone([5, 5, 5, 1]), owner: 1 };
  board[7] = { stone: stone([2, 5, 5, 5]), owner: 1 };
  board[3] = { stone: stone([5, 3, 5, 5]), owner: 1 };
  const move = placeStone(board, 4, stone([1, 2, 3, 4]), 0);
  assert.deepEqual(move.captured.sort(), [1, 3, 5, 7]);
  assert.deepEqual(score(move.board), [5, 0]);
});

test("edges never wrap rows and diagonal stones are never captured", () => {
  const board = EMPTY_BOARD();
  board[2] = { stone: stone([0, 0, 0, 0]), owner: 1 };
  board[0] = { stone: stone([0, 0, 0, 0]), owner: 1 };
  const move = placeStone(board, 3, stone([5, 5, 5, 5]), 0);
  assert.equal(move.board[2]?.owner, 1, "opposite row edge must not wrap");
  // A1 touches B1, so only that stone is captured.
  assert.deepEqual(move.captured, [0]);
  const diagonal = EMPTY_BOARD();
  diagonal[0] = { stone: stone([0, 0, 0, 0]), owner: 1 };
  assert.deepEqual(
    placeStone(diagonal, 4, stone([5, 5, 5, 5]), 0).captured,
    [],
  );
});

test("captured stones do not trigger chain captures or change orientation", () => {
  const board = EMPTY_BOARD();
  board[4] = { stone: stone([0, 5, 0, 0]), owner: 1 };
  board[5] = { stone: stone([0, 0, 0, 0]), owner: 1 };
  const move = placeStone(board, 3, stone([0, 1, 0, 0]), 0);
  assert.deepEqual(move.captured, [4]);
  assert.equal(move.board[5]?.owner, 1);
  assert.deepEqual(move.board[4]?.stone.edges, [0, 5, 0, 0]);
});

test("invalid placements and occupied squares are rejected", () => {
  const board = placeStone(EMPTY_BOARD(), 4, STARTER_STONES[0], 0).board;
  for (const index of [-1, 9, 1.5, 4])
    assert.throws(() => placeStone(board, index, STARTER_STONES[1], 1));
});

test("computer chooses a legal capture over an empty corner", () => {
  const board = EMPTY_BOARD();
  board[4] = { stone: stone([0, 0, 0, 0]), owner: 0 };
  const move = chooseMove(board, [stone([2, 2, 2, 2])], [], 1);
  assert.ok([1, 3, 5, 7].includes(move.index));
  assert.equal(move.cardIndex, 0);
  assert.equal(
    placeStone(board, move.index, stone([2, 2, 2, 2]), 1).captured.length,
    1,
  );
});

test("a complete game places exactly nine unique stones and scores all of them", () => {
  let board: Board = EMPTY_BOARD();
  const hands = [STARTER_STONES.slice(0, 5), STARTER_STONES.slice(5, 10)];
  for (let turn = 0; turn < 9; turn++) {
    const owner = (turn % 2) as 0 | 1;
    const move = chooseMove(
      board,
      hands[owner],
      hands[owner === 0 ? 1 : 0],
      owner,
    );
    board = placeStone(
      board,
      move.index,
      hands[owner][move.cardIndex],
      owner,
    ).board;
    hands[owner].splice(move.cardIndex, 1);
    assert.equal(board.filter(Boolean).length, turn + 1);
  }
  assert.equal(new Set(board.map((cell) => cell?.stone.id)).size, 9);
  assert.equal(
    score(board).reduce((a, b) => a + b),
    9,
  );
  assert.equal(hands[0].length + hands[1].length, 1);
  assert.throws(() => chooseMove(board, hands[1], [], 1));
});

test("card imports enforce valid elements, artwork, strength limits, and image types", () => {
  const valid = { ...STARTER_STONES[0], id: "custom-test", custom: true };
  assert.ok(validateStone(valid));
  for (const replacement of [
    { name: "" },
    { element: "__proto__" },
    { creature: "unknown" },
    { edges: [5, 5, 5, 5] },
    { edges: [2, 2, 2] },
    { edges: [1.5, 0, 0, 0] },
    { image: "javascript:alert(1)" },
    { image: "data:image/svg+xml;base64,eA==" },
  ]) {
    assert.equal(validateStone({ ...valid, ...replacement }), false);
  }
});
