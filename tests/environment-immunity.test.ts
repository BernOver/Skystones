import { test } from "node:test";
import assert from "node:assert/strict";
import {
  STARTER_STONES,
  EMPTY_BOARD,
  placeStone,
  castSpell,
  cardEdges,
  attackEdges,
  defenseEdges,
  environmentImmunity,
  validateKeywords,
  withArenaElement,
} from "../src/game.ts";
import type { Stone, StoneKeyword, Edges, Board, Owner } from "../src/game.ts";
import { ENVIRONMENTS, defaultEnvironment } from "../src/effects.ts";
import type { EnvironmentKind, TileEnvironment } from "../src/effects.ts";
import { DEFAULT_TRAPS, withTrap, validTrap } from "../src/traps.ts";
import { resolveDiscards } from "../src/discard.ts";
import { postPlayTrapGrants } from "../src/turns.ts";
import { pendingAmplify } from "../src/amplify.ts";
import { rollKeywords } from "../src/randomKeywords.ts";
import {
  newAdventure,
  enterAdventureNode,
  playAdventureCard,
  validateAdventure,
  restoreAdventure,
} from "../src/adventure.ts";
import { useAdventurePotion } from "../src/potions.ts";

const immunity: StoneKeyword = { type: "environment-immunity" };
const make = (
  name: string,
  keywords: StoneKeyword[] = [],
  edges: Edges = [0, 1, 2, 3],
): Stone => ({
  ...STARTER_STONES[0],
  id: `custom-${name}`,
  name,
  element: "magic",
  custom: true,
  edges,
  keywords,
});
const paint = (
  board: Board,
  target: number,
  env: TileEnvironment,
  owner: Owner = 1,
) =>
  placeStone(
    board,
    0,
    make("painter", [{ type: "environment", environment: env }], [0, 0, 0, 0]),
    owner,
    [{ keywordIndex: 0, boardIndex: target }],
  ).board;

test("Environment Immunity is a unique, directionless keyword and can be granted or randomly generated", () => {
  assert.ok(validateKeywords([immunity]));
  assert.equal(validateKeywords([{ ...immunity, side: 0 }]), false);
  assert.equal(validateKeywords([immunity, immunity]), false);
  for (const keyword of [
    { type: "combo", keywords: [immunity] },
    {
      type: "next-play",
      side: 0,
      amount: 0,
      recipient: "self",
      keywords: [immunity],
    },
    {
      type: "conjure",
      mode: "random",
      count: 1,
      recipient: "self",
      keywords: [immunity],
    },
    { type: "enchant", target: "hand", keywords: [immunity] },
  ])
    assert.ok(validateKeywords([keyword]));
  assert.deepEqual(
    rollKeywords({ count: 1, pool: ["environment-immunity"] }, 81),
    [immunity],
  );
  assert.equal(
    validateKeywords([
      { type: "amplify", effect: "environment-immunity", duration: "always" },
    ]),
    false,
  );
});

for (const size of [3, 4] as const)
  for (const owner of [0, 1] as const)
    test(`${size}×${size}, player ${owner}: immunity ignores all seven environments, including beneficial effects`, () => {
      for (const kind of Object.keys(ENVIRONMENTS) as EnvironmentKind[]) {
        const target = size + 1;
        const board = paint(
          EMPTY_BOARD(size),
          target,
          defaultEnvironment(kind, "magic"),
        );
        const card = make("immune", [
          immunity,
          { type: "shield", side: 0, amount: 2 },
        ]);
        const result = placeStone(board, target, card, owner);
        const cell = result.board[target]!;
        assert.ok(environmentImmunity(cell), kind);
        assert.deepEqual(cardEdges(cell), [0, 1, 2, 3], kind);
        assert.deepEqual(attackEdges(cell), [0, 1, 2, 3], kind);
        assert.deepEqual(defenseEdges(cell), [2, 1, 2, 3], kind);
        assert.equal(cell.environment?.kind, kind);
        assert.ok(
          environmentImmunity({ ...cell, owner: (1 - owner) as Owner }),
        );
        const normal = placeStone(board, target, make("normal"), owner).board[
          target
        ]!;
        assert.notDeepEqual(
          kind === "bastion"
            ? defenseEdges(normal)
            : kind === "war-banner"
              ? attackEdges(normal)
              : cardEdges(normal),
          card.edges,
          kind,
        );
      }
    });

test("immunity applies before captures, follows captures, and does not block Trap or arena effects", () => {
  let board = paint(EMPTY_BOARD(), 4, {
    kind: "blight",
    side: "all",
    amount: 2,
  });
  board = placeStone(board, 5, make("enemy", [], [0, 0, 0, 2]), 1).board;
  assert.deepEqual(
    placeStone(board, 4, make("ordinary", [], [0, 3, 0, 0]), 0).captured,
    [],
  );
  const moved = placeStone(
    board,
    4,
    make("immune", [immunity], [0, 3, 0, 0]),
    0,
  );
  assert.deepEqual(moved.captured, [5]);
  const captured = placeStone(
    moved.board,
    3,
    make("captor", [], [0, 5, 0, 0]),
    1,
  ).board;
  assert.equal(captured[4]!.owner, 1);
  assert.ok(environmentImmunity(captured[4]!));
  const trap = {
    ...DEFAULT_TRAPS[0],
    affects: {},
    effects: [{ kind: "pips" as const, side: "all" as const, amount: 1 }],
  };
  const field = withArenaElement(withTrap(moved.board, trap), "magic");
  assert.deepEqual(cardEdges(field[4]!), [2, 5, 2, 2]);
});

test("Silence and live Trap nullification disable immunity, and replacing the Trap restores it", () => {
  const board = placeStone(
    paint(EMPTY_BOARD(), 4, { kind: "crosswind" }),
    4,
    make("immune", [immunity]),
    0,
  ).board;
  const nullifier = {
    ...DEFAULT_TRAPS[0],
    affects: {},
    effects: [
      { kind: "nullify" as const, effect: "environment-immunity" as const },
    ],
  };
  assert.ok(validTrap(nullifier));
  const disabled = withTrap(board, nullifier);
  assert.equal(environmentImmunity(disabled[4]!), false);
  assert.deepEqual(cardEdges(disabled[4]!), [3, 0, 1, 2]);
  const restored = withTrap(disabled, undefined);
  assert.ok(environmentImmunity(restored[4]!));
  assert.deepEqual(cardEdges(restored[4]!), [0, 1, 2, 3]);
  const silenced = placeStone(
    board,
    8,
    make("silencer", [{ type: "silence" }]),
    1,
    [{ keywordIndex: 0, boardIndex: 4 }],
  ).board;
  assert.equal(environmentImmunity(silenced[4]!), false);
  assert.deepEqual(cardEdges(silenced[4]!), [3, 0, 1, 2]);
});

test("Combo immunity requires activation, Next Play can grant it, and immunity does not spend queued Amplify", () => {
  for (const active of [false, true]) {
    let board = paint(EMPTY_BOARD(), 4, { kind: "crosswind" });
    board = placeStone(
      board,
      8,
      { ...make("previous"), element: active ? "magic" : "fire" },
      0,
    ).board;
    const combo = make("combo", [{ type: "combo", keywords: [immunity] }]);
    const cell = placeStone(board, 4, combo, 0).board[4]!;
    assert.equal(environmentImmunity(cell), active);
    assert.deepEqual(cardEdges(cell), active ? [0, 1, 2, 3] : [3, 0, 1, 2]);
  }
  let board = paint(EMPTY_BOARD(), 4, { kind: "crosswind" });
  board = placeStone(
    board,
    8,
    make("grant", [
      {
        type: "next-play",
        side: 0,
        amount: 0,
        recipient: "self",
        keywords: [immunity],
      },
      { type: "amplify", effect: "all", duration: "next", count: 1 },
    ]),
    0,
  ).board;
  board = placeStone(board, 4, make("recipient"), 0).board;
  assert.ok(environmentImmunity(board[4]!));
  assert.deepEqual(cardEdges(board[4]!), [0, 1, 2, 3]);
  assert.equal(pendingAmplify(board, 0)[0].count, 1);
});

test("spells and Traps grant immunity immediately to board cards without removing terrain", () => {
  const original = placeStone(
    paint(EMPTY_BOARD(), 4, { kind: "crosswind" }),
    4,
    make("recipient"),
    0,
  ).board;
  const spell: Stone = {
    ...make("ward", [
      { type: "enchant", target: "allies", keywords: [immunity] },
    ]),
    token: true,
    conjured: true,
    spell: "cast",
  };
  const move = castSpell(original, spell, 0);
  const result = resolveDiscards(move.board, move.sourceIndex!, [[], []], 81);
  assert.ok(environmentImmunity(result.board[4]!));
  assert.deepEqual(cardEdges(result.board[4]!), [0, 1, 2, 3]);
  assert.equal(result.board[4]!.environment?.kind, "crosswind");
  assert.deepEqual(cardEdges(original[4]!), [3, 0, 1, 2]);
  const trap = {
    ...DEFAULT_TRAPS[0],
    affects: {},
    effects: [
      {
        kind: "grant" as const,
        target: "board" as const,
        timing: "placed" as const,
        keywords: [immunity],
      },
    ],
  };
  const placed = placeStone(
    original,
    8,
    make("trap", [{ type: "trap", trap }]),
    0,
  );
  const granted = postPlayTrapGrants(
    placed.board,
    [[], []],
    original,
    [[], []],
    8,
    81,
  );
  assert.ok(environmentImmunity(granted.board[4]!));
  assert.deepEqual(cardEdges(granted.board[4]!), [0, 1, 2, 3]);
});

for (const size of [3, 4] as const)
  test(`${size}×${size} immunity, terrain and correct Sunder/potion sides survive Adventure reloads and movement`, () => {
    const target = size + 1;
    let run = enterAdventureNode(newAdventure(size, 81), "moss");
    run = {
      ...run,
      battle: {
        ...run.battle!,
        board: placeStone(
          paint(EMPTY_BOARD(size), target, { kind: "crosswind" }),
          target,
          make("immune", [immunity]),
          0,
        ).board,
        hands: [
          [
            make("sunder", [{ type: "sunder", side: "any" }]),
            ...run.battle!.hands[0],
          ],
          run.battle!.hands[1],
        ],
      },
    };
    run = playAdventureCard(run, size * size - 1, 0, [
      { keywordIndex: 0, boardIndex: target, side: 1 },
    ]);
    assert.deepEqual(run.battle!.board[target]!.edges, [0, 0, 2, 3]);
    run = {
      ...run,
      potions: ["shatter"],
      battle: {
        ...run.battle!,
        current: 0,
        board: run.battle!.board.map((cell, index) =>
          index === target ? { ...cell!, owner: 1 as const } : cell,
        ),
      },
    };
    run = useAdventurePotion(run, 0, target, { side: 3 });
    assert.deepEqual(run.battle!.board[target]!.edges, [0, 0, 2, 0]);
    assert.ok(validateAdventure(run));
    const restored = restoreAdventure(JSON.parse(JSON.stringify(run)))!;
    assert.ok(restored);
    assert.deepEqual(cardEdges(restored.battle!.board[target]!), [0, 0, 2, 0]);
    assert.ok(environmentImmunity(restored.battle!.board[target]!));
    const move: Stone = {
      ...make("move", [{ type: "relocate", affects: "allies" }]),
      spell: "cast",
      token: true,
      conjured: true,
    };
    const relocated = castSpell(restored.battle!.board, move, 1, [
      { keywordIndex: 0, boardIndex: target, to: 1 },
    ]);
    assert.ok(environmentImmunity(relocated.board[1]!));
    assert.equal(relocated.board[1]!.environment, undefined);
    assert.equal(relocated.board[0]!.effects?.[0].type, "environment");
  });
