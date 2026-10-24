import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_BOARD,
  STARTER_STONES,
  chooseMove,
  evaluateKeywords,
  placeStone,
  prepareTargeting,
  score,
  validateStone,
} from "../src/game.ts";
import type { Board, Edges, Side, Stone, StoneKeyword } from "../src/game.ts";

const card = (
  keywords: StoneKeyword[] = [],
  edges: Edges = [2, 2, 2, 2],
): Stone => ({ ...STARTER_STONES[0], id: "custom-effect", keywords, edges });
const choice = (keywordIndex: number, boardIndex: number) => ({
  keywordIndex,
  boardIndex,
});

test("Sunder weakens the correct edge before captures in all four directions", () => {
  for (let side = 0; side < 4; side++) {
    const board = EMPTY_BOARD();
    board[4] = { stone: card(), owner: 1 };
    const incoming = card([{ type: "sunder", side: side as Side }]);
    const positions = [1, 5, 7, 3];
    const move = placeStone(board, positions[side], incoming, 0, [
      choice(0, 4),
    ]);
    assert.deepEqual(move.captured, [4]);
    assert.equal(move.board[4]?.edges?.[side], 1);
    assert.equal(move.board[4]?.reductions?.[side], 1);
    assert.deepEqual(board[4]?.stone.edges, [2, 2, 2, 2]);
    assert.equal(board[4]?.edges, undefined, "input board is unchanged");
    assert.deepEqual(move.effects, [{ type: "sunder", side, target: 4 }]);
  }
});

test("Sunder can target either owner and nonadjacent cards without creating remote captures", () => {
  for (const owner of [0, 1] as const) {
    const board = EMPTY_BOARD();
    board[8] = { stone: card([], [1, 0, 0, 0]), owner };
    const move = placeStone(board, 0, card([{ type: "sunder", side: 0 }]), 0, [
      choice(0, 8),
    ]);
    assert.deepEqual(move.captured, []);
    assert.equal(move.board[8]?.owner, owner);
    assert.equal(move.board[8]?.edges?.[0], 0);
    assert.equal(
      prepareTargeting(
        move.board,
        card([{ type: "sunder", side: 0 }]),
      ).pending?.candidates.includes(8),
      false,
    );
  }
});

test("no eligible target skips effects, including the first move, and zero pips never become negative", () => {
  const incoming = card([{ type: "sunder", side: 1 }, { type: "silence" }]);
  const first = placeStone(EMPTY_BOARD(), 4, incoming, 0);
  assert.deepEqual(first.effects, []);
  assert.deepEqual(first.board[4]?.edges, incoming.edges);
  const board = EMPTY_BOARD();
  board[8] = { stone: card([], [0, 0, 0, 0]), owner: 1 };
  assert.equal(prepareTargeting(board, incoming).pending, null);
  assert.deepEqual(
    placeStone(board, 0, incoming, 0).board[8]?.stone.edges,
    [0, 0, 0, 0],
  );
});

test("missing, duplicate, empty, zero-edge, self, and unexpected target choices are rejected", () => {
  const board = EMPTY_BOARD();
  board[4] = { stone: card(), owner: 1 };
  board[8] = { stone: card([], [0, 0, 0, 0]), owner: 0 };
  const incoming = card([{ type: "sunder", side: 0 }, { type: "silence" }]);
  assert.throws(() => placeStone(board, 0, incoming, 0), /Choose a target/);
  for (const targets of [
    [choice(0, 0)],
    [choice(0, 8)],
    [choice(0, -1)],
    [choice(0, 9)],
    [choice(0, 4), choice(0, 4)],
    [choice(1, 4)],
    [choice(0, 4), choice(9, 4)],
  ]) {
    assert.throws(() => placeStone(board, 0, incoming, 0, targets));
  }
  assert.equal(board[4]?.edges, undefined);
});

test("Silence removes stored Head Start and Resonance bonuses before the new card captures", () => {
  let board = EMPTY_BOARD();
  board[0] = { stone: card(), owner: 1 };
  board[8] = { stone: card(), owner: 1 };
  const boosted = card([
    { type: "head-start", side: 3 },
    { type: "resonance", side: 3, element: "fire" },
  ]);
  board = placeStone(board, 4, boosted, 1).board;
  assert.equal(board[4]?.edges?.[3], 5);
  const move = placeStone(
    board,
    3,
    card([{ type: "silence" }], [0, 3, 0, 0]),
    0,
    [choice(0, 4)],
  );
  assert.deepEqual(move.captured, [4]);
  assert.equal(move.board[4]?.silenced, true);
  assert.deepEqual(move.board[4]?.edges, [2, 2, 2, 2]);
  assert.deepEqual(move.board[4]?.activeKeywords, []);
  assert.equal(move.board[4]?.playedBy, 1);
  assert.equal(board[4]?.silenced, undefined);
  assert.equal(board[4]?.edges?.[3], 5);
  assert.deepEqual(
    prepareTargeting(
      move.board,
      card([{ type: "silence" }]),
    ).pending?.candidates.includes(4),
    false,
  );
});

test("Silence removes Comeback, keeps printed stats and element, and can target inactive keywords", () => {
  const board = EMPTY_BOARD();
  board[0] = { stone: card(), owner: 1 };
  const comeback = card([{ type: "comeback", side: 0 }]);
  const placed = placeStone(board, 4, comeback, 0).board;
  assert.equal(placed[4]?.edges?.[0], 3);
  const silent = placeStone(placed, 8, card([{ type: "silence" }]), 1, [
    choice(0, 4),
  ]).board;
  assert.deepEqual(silent[4]?.edges, comeback.edges);
  assert.equal(silent[4]?.stone.element, "fire");
  const tied = placeStone(EMPTY_BOARD(), 4, comeback, 0).board;
  assert.deepEqual(tied[4]?.activeKeywords, []);
  assert.ok(
    prepareTargeting(
      tied,
      card([{ type: "silence" }]),
    ).pending?.candidates.includes(4),
  );
});

test("Sunder persists after Silence, capture, and later score changes without negative edges", () => {
  let board = EMPTY_BOARD();
  board[8] = { stone: card(), owner: 0 };
  board = placeStone(
    board,
    4,
    card([{ type: "head-start", side: 1 }], [0, 0, 0, 0]),
    0,
  ).board;
  assert.equal(board[4]?.edges?.[1], 1);
  board = placeStone(board, 0, card([{ type: "sunder", side: 1 }]), 1, [
    choice(0, 4),
  ]).board;
  assert.equal(board[4]?.edges?.[1], 0);
  board = placeStone(board, 5, card([{ type: "silence" }]), 1, [
    choice(0, 4),
  ]).board;
  assert.equal(board[4]?.silenced, true);
  assert.equal(board[4]?.owner, 1);
  assert.equal(board[4]?.playedBy, 0);
  assert.deepEqual(board[4]?.reductions, [0, 1, 0, 0]);
  assert.deepEqual(board[4]?.edges, [0, 0, 0, 0]);
  board = placeStone(board, 7, card(), 0).board;
  assert.equal(board[4]?.silenced, true);
  assert.deepEqual(board[4]?.edges, [0, 0, 0, 0]);
});

test("silencing an on-play source never undoes its earlier reduction or capture", () => {
  let board = EMPTY_BOARD();
  board[4] = { stone: card(), owner: 1 };
  board = placeStone(board, 3, card([{ type: "sunder", side: 3 }]), 0, [
    choice(0, 4),
  ]).board;
  assert.equal(board[4]?.owner, 0);
  assert.equal(board[4]?.edges?.[3], 1);
  const move = placeStone(board, 8, card([{ type: "silence" }]), 1, [
    choice(0, 3),
  ]);
  assert.equal(move.board[3]?.silenced, true);
  assert.equal(move.board[4]?.owner, 0);
  assert.equal(move.board[4]?.edges?.[3], 1);
  assert.deepEqual(move.board[3]?.effects, [
    { type: "sunder", side: 3, target: 4 },
  ]);
});

test("multiple effects use printed order and previewing them leaves the real board untouched", () => {
  const board = EMPTY_BOARD();
  board[4] = {
    stone: card([{ type: "head-start", side: 0 }], [0, 0, 0, 0]),
    owner: 1,
    edges: [1, 0, 0, 0],
    activeKeywords: [{ type: "head-start", side: 0 }],
  };
  const incoming = card([
    { type: "silence" },
    { type: "sunder", side: 0 },
    { type: "resonance", side: 2, element: "fire" },
  ]);
  const preview = prepareTargeting(board, incoming, [choice(0, 4)]);
  assert.equal(
    preview.pending,
    null,
    "Sunder skips because Silence left no positive North edge",
  );
  assert.equal(preview.effects.length, 1);
  assert.equal(board[4]?.silenced, undefined);
  assert.equal(board[4]?.edges?.[0], 1);
  const move = placeStone(board, 8, incoming, 0, [choice(0, 4)]);
  assert.equal(
    move.board[8]?.edges?.[2],
    3,
    "Silenced cards still count for Resonance",
  );
  assert.deepEqual(score(move.board), [1, 1]);
  assert.deepEqual(evaluateKeywords(incoming, board, 0).edges, [2, 2, 3, 2]);
});

test("the computer chooses Sunder and Silence targets that enable captures and handles targeted replies", () => {
  for (const keyword of [
    { type: "sunder", side: 3 },
    { type: "silence" },
  ] as StoneKeyword[]) {
    const board = EMPTY_BOARD();
    board[4] = {
      stone: card([{ type: "resonance", side: 3, element: "fire" }]),
      owner: 0,
      edges: [5, 5, 5, 3],
      activeKeywords: [
        { type: "resonance", side: 3, element: "fire", bonus: 1 },
      ],
    };
    const incoming = card([keyword], [0, 3, 0, 0]);
    const move = chooseMove(
      board,
      [incoming],
      [card([{ type: "silence" }, { type: "sunder", side: 1 }])],
      1,
    );
    assert.equal(move.index, 3);
    assert.deepEqual(move.targets, [choice(0, 4)]);
    assert.deepEqual(
      placeStone(board, move.index, incoming, 1, move.targets).captured,
      [4],
    );
  }
});

test("card imports validate Sunder sides and singleton Silence while accepting all 17 assignments", () => {
  assert.equal(
    validateStone(card([{ type: "sunder", side: 2 }, { type: "silence" }])),
    true,
  );
  for (const keywords of [
    [{ type: "sunder" }],
    [{ type: "sunder", side: -1 }],
    [{ type: "sunder", side: 4 }],
    [{ type: "silence", side: 0 }],
    [{ type: "silence" }, { type: "silence" }],
    [
      { type: "sunder", side: 1 },
      { type: "sunder", side: 1 },
    ],
  ]) {
    assert.equal(validateStone({ ...card(), keywords }), false);
  }
  const keywords: StoneKeyword[] = [{ type: "silence" }];
  for (let side = 0; side < 4; side++)
    keywords.push(
      { type: "head-start", side: side as Side },
      { type: "comeback", side: side as Side },
      { type: "resonance", side: side as Side, element: "fire" },
      { type: "sunder", side: side as Side },
    );
  assert.equal(validateStone(card(keywords)), true);
  assert.equal(validateStone(card([...keywords, { type: "silence" }])), false);
});
