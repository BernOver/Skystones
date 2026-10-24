import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_BOARD,
  STARTER_STONES,
  chooseMove,
  placeStone,
  prepareTargeting,
  validateStone,
} from "../src/game.ts";
import type { Side, Stone, StoneKeyword } from "../src/game.ts";

const card = (keywords: StoneKeyword[] = []): Stone => ({
  ...STARTER_STONES[0],
  id: "custom-sunder-choice",
  edges: [1, 2, 3, 4],
  keywords,
});
const flexible = () => card([{ type: "sunder", side: "any" }]);

test("Sunder strength works for fixed and flexible edges, clamps at zero, and records only pips actually removed", () => {
  for (const side of [1, "any"] as const) {
    for (const amount of [2, 3, 99]) {
      const board = EMPTY_BOARD();
      board[8] = { stone: card(), owner: 1 };
      const incoming = card([{ type: "sunder", side, amount }]);
      const move = placeStone(board, 0, incoming, 0, [
        {
          keywordIndex: 0,
          boardIndex: 8,
          ...(side === "any" ? { side: 1 as Side } : {}),
        },
      ]);
      assert.equal(move.board[8]?.edges?.[1], 0);
      assert.equal(move.board[8]?.reductions?.[1], 2);
      assert.equal(
        move.effects[0]?.type === "sunder" && move.effects[0].amount,
        2,
      );
      assert.deepEqual(board[8]?.stone.edges, [1, 2, 3, 4]);
    }
  }
  const board = EMPTY_BOARD();
  board[8] = { stone: card(), owner: 1 };
  const move = placeStone(
    board,
    0,
    card([{ type: "sunder", side: 3, amount: 3 }]),
    0,
    [{ keywordIndex: 0, boardIndex: 8 }],
  );
  assert.deepEqual(move.board[8]?.edges, [1, 2, 3, 1]);
  assert.deepEqual(move.board[8]?.reductions, [0, 0, 0, 3]);
  assert.equal(
    validateStone(card([{ type: "sunder", side: "any", amount: 99 }])),
    true,
  );
  for (const amount of [0, -1, 100, 1.5, "2", null])
    assert.equal(
      validateStone({
        ...card(),
        keywords: [{ type: "sunder", side: "any", amount }],
      }),
      false,
    );
});

test("flexible Sunder can remove a pip from any chosen edge on either owner's distant card", () => {
  for (const owner of [0, 1] as const) {
    for (let side = 0; side < 4; side++) {
      const board = EMPTY_BOARD();
      board[8] = { stone: card(), owner };
      const move = placeStone(board, 0, flexible(), 0, [
        { keywordIndex: 0, boardIndex: 8, side: side as Side },
      ]);
      const expected = [1, 2, 3, 4];
      expected[side]--;
      assert.deepEqual(move.board[8]?.edges, expected);
      assert.equal(move.board[8]?.owner, owner);
      assert.deepEqual(move.captured, []);
      assert.deepEqual(move.effects, [
        { type: "sunder", side, target: 8, flexible: true },
      ]);
      assert.equal(board[8]?.edges, undefined, "input is unchanged");
    }
  }
});

test("flexible target choices include only positive edges and reject missing or invalid edges", () => {
  const board = EMPTY_BOARD();
  board[4] = { stone: { ...card(), edges: [0, 1, 0, 2] }, owner: 1 };
  board[8] = { stone: { ...card(), edges: [0, 0, 0, 0] }, owner: 0 };
  const state = prepareTargeting(board, flexible());
  assert.deepEqual(state.pending?.candidates, [4]);
  assert.deepEqual(state.pending?.options, [
    { keywordIndex: 0, boardIndex: 4, side: 1 },
    { keywordIndex: 0, boardIndex: 4, side: 3 },
  ]);
  for (const side of [undefined, 0, 2, -1, 4, 1.5, "1", "any"]) {
    assert.throws(() =>
      placeStone(board, 0, flexible(), 0, [
        { keywordIndex: 0, boardIndex: 4, side } as never,
      ]),
    );
  }
  for (const boardIndex of [0, 8, -1, 9]) {
    assert.throws(() =>
      placeStone(board, 0, flexible(), 0, [
        { keywordIndex: 0, boardIndex, side: 1 },
      ]),
    );
  }
  assert.throws(
    () =>
      placeStone(board, 0, card([{ type: "sunder", side: 1 }]), 0, [
        { keywordIndex: 0, boardIndex: 4, side: 3 },
      ]),
    "fixed-edge Sunder cannot change edges at play time",
  );
  assert.deepEqual(placeStone(EMPTY_BOARD(), 0, flexible(), 0).effects, []);
  assert.deepEqual(
    placeStone(
      [null, null, null, null, null, null, null, null, board[8]],
      0,
      flexible(),
      0,
    ).effects,
    [],
  );
});

test("flexible and fixed Sunder stack in order, log separately, and both persist through Silence", () => {
  const board = EMPTY_BOARD();
  board[8] = {
    stone: card([{ type: "head-start", side: 0 }]),
    owner: 1,
    edges: [2, 2, 3, 4],
    activeKeywords: [{ type: "head-start", side: 0 }],
  };
  const incoming = card([
    { type: "sunder", side: "any" },
    { type: "sunder", side: 1 },
    { type: "silence" },
  ]);
  const targets = [
    { keywordIndex: 0, boardIndex: 8, side: 0 as Side },
    { keywordIndex: 1, boardIndex: 8 },
    { keywordIndex: 2, boardIndex: 8 },
  ];
  const preview = prepareTargeting(board, incoming, targets.slice(0, 1));
  assert.equal(preview.pending?.keywordIndex, 1);
  assert.deepEqual(preview.board[8]?.edges, [1, 2, 3, 4]);
  assert.deepEqual(board[8]?.edges, [2, 2, 3, 4]);
  const move = placeStone(board, 0, incoming, 0, targets);
  assert.deepEqual(move.board[8]?.edges, [0, 1, 3, 4]);
  assert.deepEqual(move.board[8]?.reductions, [1, 1, 0, 0]);
  assert.equal(move.board[8]?.silenced, true);
  assert.deepEqual(move.effects, [
    { type: "sunder", side: 0, target: 8, flexible: true },
    { type: "sunder", side: 1, target: 8 },
    { type: "silence", target: 8 },
  ]);
});

test("the computer chooses a target and edge that enables a capture and can simulate flexible replies", () => {
  const board = EMPTY_BOARD();
  board[4] = { stone: { ...card(), edges: [4, 4, 4, 2] }, owner: 0 };
  const incoming = { ...flexible(), edges: [0, 2, 0, 0] as Stone["edges"] };
  const move = chooseMove(board, [incoming], [flexible()], 1);
  assert.equal(move.index, 3);
  assert.deepEqual(move.targets, [{ keywordIndex: 0, boardIndex: 4, side: 3 }]);
  assert.deepEqual(
    placeStone(board, move.index, incoming, 1, move.targets).captured,
    [4],
  );
});

test("imports accept one flexible Sunder alongside the fixed edges and validate all 18 assignments", () => {
  const keywords: StoneKeyword[] = [
    { type: "silence" },
    { type: "sunder", side: "any" },
  ];
  for (let side = 0; side < 4; side++)
    keywords.push(
      { type: "head-start", side: side as Side },
      { type: "comeback", side: side as Side },
      { type: "resonance", side: side as Side, element: "fire" },
      { type: "sunder", side: side as Side },
    );
  assert.equal(validateStone(card(keywords)), true);
  assert.equal(
    validateStone(
      card([
        { type: "sunder", side: "any" },
        { type: "sunder", side: "any" },
      ]),
    ),
    false,
  );
  assert.equal(validateStone(card([...keywords, { type: "silence" }])), false);
  for (const side of [undefined, null, "ANY", "choose", 4])
    assert.equal(
      validateStone({ ...card(), keywords: [{ type: "sunder", side }] }),
      false,
    );
});
