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
import type { Element, Side, Stone } from "../src/game.ts";

const plain = (
  element: Element = "earth",
  edges: Stone["edges"] = [2, 2, 2, 2],
): Stone => ({ ...STARTER_STONES[0], element, edges, keywords: [] });
const resonant = (side: Side = 1, element: Element = "fire"): Stone => ({
  ...plain("water"),
  keywords: [{ type: "resonance", side, element }],
});

test("Resonance counts matching elements across both owners, independently of the score", () => {
  const board = EMPTY_BOARD();
  board[0] = { stone: plain("fire"), owner: 0 };
  board[2] = { stone: plain("fire"), owner: 1 };
  board[6] = { stone: plain("fire"), owner: 1 };
  board[8] = { stone: plain("water"), owner: 0 };
  assert.deepEqual(score(board), [2, 2]);
  for (const owner of [0, 1] as const) {
    const result = evaluateKeywords(resonant(), board, owner);
    assert.deepEqual(result.edges, [2, 5, 2, 2]);
    assert.deepEqual(result.activeKeywords, [
      { type: "resonance", side: 1, element: "fire", bonus: 3 },
    ]);
  }
  assert.deepEqual(
    evaluateKeywords(resonant(1, "water"), board, 0).edges,
    [2, 3, 2, 2],
  );
  assert.deepEqual(
    evaluateKeywords(resonant(1, "magic"), board, 0).edges,
    [2, 2, 2, 2],
  );
});

test("the incoming card never counts itself and an empty board gives no bonus", () => {
  const card = { ...resonant(), element: "fire" as const };
  const empty = placeStone(EMPTY_BOARD(), 4, card, 0);
  assert.deepEqual(empty.board[4]?.edges, [2, 2, 2, 2]);
  assert.deepEqual(empty.board[4]?.activeKeywords, []);
  const board = EMPTY_BOARD();
  board[0] = { stone: plain("fire"), owner: 0 };
  board[8] = { stone: plain("fire"), owner: 1 };
  const move = placeStone(board, 4, card, 0);
  assert.equal(
    move.board.filter((cell) => cell?.stone.element === "fire").length,
    3,
  );
  assert.equal(
    move.board[4]?.edges?.[1],
    4,
    "only the two existing Fire cards count",
  );
  assert.deepEqual(card.edges, [2, 2, 2, 2], "printed edges are unchanged");
});

test("the counted bonus wins captures on each specified facing edge", () => {
  const positions = [7, 3, 1, 5];
  for (let side = 0; side < 4; side++) {
    const board = EMPTY_BOARD();
    board[0] = { stone: plain("fire"), owner: 0 };
    board[8] = { stone: plain("fire"), owner: 1 };
    board[4] = { stone: plain("earth", [3, 3, 3, 3]), owner: 1 };
    const move = placeStone(board, positions[side], resonant(side as Side), 0);
    assert.deepEqual(move.captured, [4]);
    assert.equal(move.board[positions[side]]?.edges?.[side], 4);
  }
});

test("Resonance remains locked after new matching cards, capture, and score changes", () => {
  const board = EMPTY_BOARD();
  board[0] = { stone: plain("fire"), owner: 0 };
  board[8] = { stone: plain("fire"), owner: 1 };
  const placed = placeStone(board, 3, resonant(), 0).board;
  const later = placeStone(placed, 2, plain("fire", [0, 0, 0, 0]), 1).board;
  assert.equal(
    later.filter((cell) => cell?.stone.element === "fire").length,
    3,
  );
  assert.equal(later[3]?.edges?.[1], 4);
  const tie = placeStone(later, 4, plain("earth", [0, 0, 0, 4]), 1);
  assert.equal(tie.board[3]?.owner, 0, "the saved bonus also defends the card");
  const captured = placeStone(later, 4, plain("earth", [0, 0, 0, 5]), 1);
  assert.equal(captured.board[3]?.owner, 1);
  assert.equal(captured.board[3]?.playedBy, 0);
  assert.equal(captured.board[3]?.edges?.[1], 4);
  assert.deepEqual(captured.board[3]?.activeKeywords, [
    { type: "resonance", side: 1, element: "fire", bonus: 2 },
  ]);
});

test("a zero-count Resonance stays at zero when matching cards appear later", () => {
  const placed = placeStone(EMPTY_BOARD(), 4, resonant(), 0).board;
  const later = placeStone(placed, 0, plain("fire", [0, 0, 0, 0]), 1).board;
  assert.deepEqual(later[4]?.edges, [2, 2, 2, 2]);
  assert.deepEqual(later[4]?.activeKeywords, []);
});

test("different element counts resolve independently and stack with fixed-pip keywords", () => {
  const board = EMPTY_BOARD();
  board[0] = { stone: plain("fire"), owner: 0 };
  board[2] = { stone: plain("fire"), owner: 0 };
  board[8] = { stone: plain("water"), owner: 1 };
  const card: Stone = {
    ...plain(),
    keywords: [
      { type: "head-start", side: 1 },
      { type: "resonance", side: 1, element: "fire" },
      { type: "resonance", side: 3, element: "water" },
    ],
  };
  assert.deepEqual(evaluateKeywords(card, board, 0).edges, [2, 5, 2, 3]);
  const full = EMPTY_BOARD();
  for (let i = 0; i < 9; i++)
    if (i !== 4) full[i] = { stone: plain("fire"), owner: 0 };
  const high: Stone = { ...card, edges: [1, 5, 1, 1] };
  assert.equal(
    placeStone(full, 4, high, 0).board[4]?.edges?.[1],
    14,
    "eight counted pips plus Head Start can exceed the printed limit",
  );
});

test("the computer uses the full Resonance count when selecting a capture", () => {
  const board = EMPTY_BOARD();
  board[0] = { stone: plain("fire"), owner: 0 };
  board[2] = { stone: plain("fire"), owner: 0 };
  board[4] = { stone: plain("earth", [3, 3, 3, 3]), owner: 0 };
  const move = chooseMove(board, [resonant()], [], 1);
  assert.equal(move.index, 3);
  assert.deepEqual(placeStone(board, move.index, resonant(), 1).captured, [4]);
});

test("Resonance imports require a valid element and preserve the keyword assignment limits", () => {
  const card = { ...resonant(), id: "custom-resonance" };
  assert.equal(validateStone(card), true);
  for (const element of [
    undefined,
    null,
    "Fire",
    "__proto__",
    "unknown",
    1,
    {},
  ]) {
    assert.equal(
      validateStone({
        ...card,
        keywords: [{ type: "resonance", side: 1, element }],
      }),
      false,
    );
  }
  assert.equal(
    validateStone({
      ...card,
      keywords: [
        { type: "resonance", side: 1, element: "fire" },
        { type: "resonance", side: 1, element: "water" },
      ],
    }),
    false,
  );
  const keywords = Array.from({ length: 4 }, (_, side) => [
    { type: "head-start", side },
    { type: "comeback", side },
    { type: "resonance", side, element: "fire" },
  ]).flat();
  assert.equal(validateStone({ ...card, keywords }), true);
  assert.equal(
    validateStone({ ...card, keywords: [...keywords, keywords[0]] }),
    false,
  );
});
