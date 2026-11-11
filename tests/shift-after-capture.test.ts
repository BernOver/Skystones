import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_BOARD,
  STARTER_STONES,
  placeStone,
  prepareTargeting,
  defenseEdges,
  chooseKeywordTargets,
  chooseMove,
} from "../src/game.ts";
import type { Stone, StoneKeyword, Board, Owner } from "../src/game.ts";
import { DEFAULT_TRAPS, withTrap } from "../src/traps.ts";
import {
  newAdventure,
  enterAdventureNode,
  resolveAdventureEvent,
  playAdventureCard,
  restoreAdventure,
  validateAdventure,
} from "../src/adventure.ts";
const make = (
  name: string,
  edges: Stone["edges"] = [0, 0, 0, 0],
  keywords: StoneKeyword[] = [],
): Stone => ({
  ...STARTER_STONES[0],
  id: `custom-shift-${name}`,
  name,
  element: "fire",
  edges,
  keywords,
});
const shift = (
  affects: "allies" | "enemies" | "both" = "enemies",
  side: 0 | 1 | 2 | 3 = 0,
  direction: 0 | 1 | 2 | 3 = 1,
): StoneKeyword => ({ type: "shift", side, direction, affects });
const cast = (b: Board, i: number, s: Stone, o: Owner = 0) =>
  placeStone(b, i, s, o, chooseKeywordTargets(b, i, s, o));
for (const size of [3, 4] as const)
  for (const owner of [0, 1] as const)
    test(`${size}×${size}, owner ${owner}: capture first, then push the captured enemy and its flip marker`, () => {
      const rival = (1 - owner) as Owner;
      const original = cast(EMPTY_BOARD(size), 1, make("enemy"), rival).board;
      const snapshot = structuredClone(original);
      const move = cast(
        original,
        size + 1,
        make("shifter", [2, 0, 0, 0], [shift()]),
        owner,
      );
      assert.equal(move.board[1], null);
      assert.equal(move.board[2]!.stone.name, "enemy");
      assert.equal(move.board[2]!.owner, owner);
      assert.equal(move.board[2]!.playedBy, rival);
      assert.deepEqual(move.captured, [2]);
      assert.equal(move.effects[0].type, "shift");
      assert.ok(move.effects[0].type === "shift" && move.effects[0].moved);
      assert.deepEqual(original, snapshot);
      assert.deepEqual(move.board[size + 1]!.effects, move.effects);
    });
test("Shift affinities use ownership before captures, preserving both enemies-only and allies-only rules", () => {
  const board = cast(EMPTY_BOARD(), 1, make("enemy")).board;
  for (const affects of ["allies", "enemies", "both"] as const) {
    const result = cast(
      board,
      4,
      make("shifter", [2, 0, 0, 0], [shift(affects)]),
      1,
    );
    assert.equal(result.board[affects === "allies" ? 1 : 2]!.owner, 1);
    assert.deepEqual(result.captured, [affects === "allies" ? 1 : 2]);
  }
});
test("a blocked push still permits the normal capture", () => {
  let board = cast(EMPTY_BOARD(), 1, make("target"), 1).board;
  board = cast(board, 2, make("blocker"), 1).board;
  const result = cast(board, 4, make("shifter", [2, 0, 0, 0], [shift()]));
  assert.equal(result.board[1]!.owner, 0);
  assert.deepEqual(result.captured, [1]);
  assert.equal(result.board[2]!.owner, 1);
  assert.ok(
    result.effects[0].type === "shift" &&
      !result.effects[0].moved &&
      result.effects[0].reason === "blocked",
  );
});
test("pushing an uncaptured card into another facing edge does not start a second capture", () => {
  const board = cast(EMPTY_BOARD(), 1, make("guard", [0, 0, 5, 0]), 1).board;
  const result = cast(
    board,
    4,
    make("shifter", [0, 0, 5, 0], [shift("enemies", 0, 0)]),
  );
  assert.equal(result.board[1], null);
  assert.equal(result.board[7]!.owner, 1);
  assert.deepEqual(result.captured, []);
});
test("multiple captures keep their capture order while Shift markers follow final positions", () => {
  let board = cast(EMPTY_BOARD(), 1, make("north"), 1).board;
  board = cast(board, 5, make("east"), 1).board;
  const result = cast(
    board,
    4,
    make("shifter", [2, 2, 0, 0], [shift(), shift("enemies", 1, 0)]),
  );
  assert.deepEqual(result.captured, [2, 5]);
  assert.equal(result.board[2]!.owner, 0);
  assert.equal(result.board[5]!.owner, 0);
  assert.ok(result.effects[0].type === "shift" && result.effects[0].moved);
  assert.ok(result.effects[1].type === "shift" && !result.effects[1].moved);
});
test("Sunder targets the original square before captures even when Shift is printed first", () => {
  const board = cast(EMPTY_BOARD(), 1, make("guard", [0, 0, 3, 0]), 1).board;
  const source = make(
    "shifter",
    [2, 0, 0, 0],
    [shift(), { type: "sunder", side: 2, amount: 2 }],
  );
  const preview = prepareTargeting(board, source, [], 0, 4);
  assert.ok(preview.board[1]);
  assert.equal(preview.board[2], null);
  assert.ok(preview.pending!.candidates.includes(1));
  const result = placeStone(board, 4, source, 0, [
    { keywordIndex: 1, boardIndex: 1 },
  ]);
  assert.deepEqual(result.captured, [2]);
  assert.equal(result.board[2]!.edges![2], 1);
  assert.deepEqual(
    result.effects.map((e) => e.type),
    ["sunder", "shift"],
  );
});
test("destination terrain cannot prevent a capture that already happened", () => {
  let board = cast(
    EMPTY_BOARD(),
    8,
    make(
      "terrain",
      [0, 0, 0, 0],
      [{ type: "environment", environment: { kind: "bastion", amount: 5 } }],
    ),
    1,
  ).board;
  // Explicitly place Bastion at the Shift destination.
  board = placeStone(
    EMPTY_BOARD(),
    8,
    make(
      "terrain",
      [0, 0, 0, 0],
      [{ type: "environment", environment: { kind: "bastion", amount: 5 } }],
    ),
    1,
    [{ keywordIndex: 0, boardIndex: 2 }],
  ).board;
  board = cast(board, 1, make("guard", [3, 3, 3, 3]), 1).board;
  const result = cast(board, 4, make("shifter", [4, 0, 0, 0], [shift()]));
  assert.deepEqual(result.captured, [2]);
  assert.equal(result.board[2]!.owner, 0);
  assert.equal(defenseEdges(result.board[2]!)[2], 8);
});
test("Combo and queued Shift gifts use the same capture-then-push phase", () => {
  for (const combo of [true, false]) {
    let board = cast(
      EMPTY_BOARD(),
      0,
      make(
        "giver",
        [0, 0, 0, 0],
        combo
          ? []
          : [
              {
                type: "next-play",
                side: 0,
                amount: 0,
                recipient: "self",
                keywords: [shift()],
              },
            ],
      ),
    ).board;
    board = cast(board, 1, make("enemy"), 1).board;
    const source = make(
      "receiver",
      [2, 0, 0, 0],
      combo ? [{ type: "combo", keywords: [shift()] }] : [],
    );
    const result = cast(board, 4, source);
    assert.deepEqual(result.captured, [2]);
    assert.equal(result.board[2]!.owner, 0);
  }
});
test("Shift nullification preserves normal captures and doubled Shift preserves the captured owner", () => {
  const start = cast(EMPTY_BOARD(), 1, make("enemy"), 1).board;
  const nullify = {
    ...DEFAULT_TRAPS[0],
    affects: undefined,
    effects: [{ kind: "nullify" as const, effect: "shift" as const }],
  };
  const result = cast(
    withTrap(start, nullify),
    4,
    make("shifter", [2, 0, 0, 0], [shift()]),
  );
  assert.deepEqual(result.captured, [1]);
  assert.equal(result.board[1]!.owner, 0);
  const doubled = cast(
    start,
    4,
    make(
      "double",
      [2, 0, 0, 0],
      [{ type: "amplify", effect: "shift", duration: "always" }, shift()],
    ),
  );
  assert.equal(doubled.effects.filter((e) => e.type === "shift").length, 2);
  assert.deepEqual(doubled.captured, [2]);
  assert.equal(doubled.board[2]!.owner, 0);
  const ai = chooseMove(
    start,
    [make("AI", [2, 0, 0, 0], [shift()])],
    [make("reply")],
    0,
  );
  assert.ok(Number.isInteger(ai.index));
});
for (const size of [3, 4] as const)
  test(`${size}×${size} Adventure captures a chest before pushing it, tracks the new objective and saves the flip destination`, () => {
    let run = resolveAdventureEvent(
      enterAdventureNode({ ...newAdventure(size, 77), floor: 1 }, "chest-one"),
      "fight",
    );
    const origin = run.battle!.objective!,
      destination = origin + 1;
    run = {
      ...run,
      battle: {
        ...run.battle!,
        hands: [
          [
            {
              ...run.battle!.hands[0][0],
              edges: [5, 0, 0, 0],
              keywords: [shift()],
            },
            ...run.battle!.hands[0].slice(1),
          ],
          run.battle!.hands[1],
        ],
      },
    };
    run = playAdventureCard(run, origin + size, 0);
    assert.equal(run.battle!.objective, destination);
    assert.equal(run.battle!.board[destination]!.owner, 0);
    assert.ok(run.battle!.lastCaptured.includes(destination));
    assert.ok(validateAdventure(run));
    const restored = restoreAdventure(JSON.parse(JSON.stringify(run)))!;
    assert.ok(restored);
    assert.equal(restored.battle!.objective, destination);
    assert.equal(restored.battle!.board[destination]!.owner, 0);
  });
