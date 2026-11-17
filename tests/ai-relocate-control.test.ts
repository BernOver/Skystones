import { resolveDiscards } from "../src/discard.ts";
import { collectCommands } from "../src/turns.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_BOARD,
  STARTER_STONES,
  chooseMove,
  placeStone,
  castSpell,
  prepareTargeting,
  validateStone,
  validateKeywords,
  cardEdges,
} from "../src/game.ts";
import type { Stone, StoneKeyword, Owner } from "../src/game.ts";
import { validAIProfile } from "../src/ai.ts";
import { advanceTurn } from "../src/turns.ts";
import { DEFAULT_SPELLS } from "../src/spellCards.ts";
import { DEFAULT_TRAPS } from "../src/traps.ts";
import { DEFAULT_TOKENS } from "../src/tokens.ts";
import { BUILTIN_ENCOUNTERS, validEncounter } from "../src/encounters.ts";
import {
  newAdventure,
  enterAdventureNode,
  playAdventureCard,
  adventureEnemyMove,
  restoreAdventure,
  validateAdventure,
  testAdventureEncounter,
} from "../src/adventure.ts";
const make = (
  name: string,
  edges: Stone["edges"] = [1, 1, 1, 1],
  keywords: StoneKeyword[] = [],
): Stone => ({
  ...STARTER_STONES[0],
  id: `custom-${name}`,
  name,
  element: "magic",
  edges,
  keywords,
});
const hands = (): [Stone[], Stone[]] => [
  Array.from({ length: 5 }, (_, i) => make(`a${i}`)),
  Array.from({ length: 5 }, (_, i) => make(`b${i}`)),
];
const moveSpell = (): Stone => ({
  ...make("move", [0, 0, 0, 0], [{ type: "relocate", affects: "allies" }]),
  token: true,
  conjured: true,
  spell: "cast",
});

test("AI priorities override the usual spell preference, then pip ordering and tactical ties apply", () => {
  const spell: Stone = {
    ...moveSpell(),
    keywords: [
      { type: "conjure", mode: "random", count: 1, recipient: "self" },
    ],
  };
  const low = { ...make("low", [1, 0, 0, 0]), element: "fire" as const },
    high = { ...make("high", [2, 2, 2, 2]), element: "fire" as const };
  const hand = [spell, high, low];
  assert.equal(
    chooseMove(EMPTY_BOARD(), hand, [], 1, {
      ai: { priority: { element: "fire" }, order: "low-pips" },
    }).cardIndex,
    2,
  );
  assert.equal(
    chooseMove(EMPTY_BOARD(), hand, [], 1, {
      ai: { priority: { element: "fire" }, order: "high-pips" },
    }).cardIndex,
    1,
  );
  assert.equal(
    chooseMove(EMPTY_BOARD(), hand, [], 1, {
      ai: { priority: { type: "spell" } },
    }).cardIndex,
    0,
  );
  assert.equal(
    chooseMove(EMPTY_BOARD(), [low, high], [], 1, {
      ai: { priority: { element: "water" }, order: "low-pips" },
    }).cardIndex,
    0,
  );
});
test("AI can prioritize tribes and keywords, skips Parts and discard-only spells, and accepts an explicit forced choice", () => {
  const giant = {
    ...make("giant", [2, 2, 1, 1], [{ type: "shield", side: 0 }]),
    tribes: ["giants"] as Stone["tribes"],
  };
  const low = make("low", [0, 0, 1, 0]),
    part = { ...DEFAULT_TOKENS[0], part: true as const };
  const locked = { ...moveSpell(), spell: "discard" as const };
  const hand = [low, part, locked, giant];
  assert.equal(
    chooseMove(EMPTY_BOARD(), hand, [], 1, {
      ai: {
        priority: { tribe: "giants", keyword: "shield" },
        order: "low-pips",
      },
    }).cardIndex,
    3,
  );
  assert.equal(
    chooseMove(EMPTY_BOARD(), hand, [], 1, {
      ai: { order: "high-pips" },
      forcedCardIndex: 0,
    }).cardIndex,
    0,
  );
  assert.throws(
    () => chooseMove(EMPTY_BOARD(), hand, [], 1, { forcedCardIndex: 1 }),
    /playable bot card/,
  );
  assert.throws(
    () => chooseMove(EMPTY_BOARD(), hand, [], 1, { forcedCardIndex: 2 }),
    /playable bot card/,
  );
  assert.equal(validAIProfile({ order: "random-unrecognized" }), false);
  assert.equal(validAIProfile({ controlTurns: -1 }), false);
});
test("Command controls whole bot turns, survives Flash, spends once at turn start, and expires", () => {
  const board = placeStone(
    EMPTY_BOARD(),
    0,
    make("commander", [1, 1, 1, 1], [{ type: "command", turns: 2 }]),
    0,
  ).board;
  const first = advanceTurn(board, hands(), 0, 0, false, 81, undefined, {
    botOwners: [1],
  });
  assert.equal(first.owner, 1);
  assert.equal(first.state.controlledBy, 0);
  assert.deepEqual(first.state.control, [1, 0]);
  const flash = advanceTurn(
    first.board,
    first.hands,
    1,
    first.turnNumber,
    true,
    81,
    first.state,
    { botOwners: [1] },
  );
  assert.equal(flash.state.controlledBy, 0);
  assert.deepEqual(flash.state.control, [1, 0]);
  assert.equal(flash.turnNumber, first.turnNumber);
  const own = advanceTurn(
    flash.board,
    flash.hands,
    1,
    flash.turnNumber,
    false,
    81,
    flash.state,
    { botOwners: [1] },
  );
  assert.equal(own.state.controlledBy, undefined);
  const second = advanceTurn(
    own.board,
    own.hands,
    0,
    own.turnNumber,
    false,
    81,
    own.state,
    { botOwners: [1] },
  );
  assert.equal(second.state.controlledBy, 0);
  assert.equal(second.state.control[0], 0);
  const back = advanceTurn(
    second.board,
    second.hands,
    1,
    second.turnNumber,
    false,
    81,
    second.state,
    { botOwners: [1] },
  );
  const expired = advanceTurn(
    back.board,
    back.hands,
    0,
    back.turnNumber,
    false,
    81,
    back.state,
    { botOwners: [1] },
  );
  assert.equal(expired.state.controlledBy, undefined);
});
test("Command does not take control of human opponents or spend credits on an empty bot hand", () => {
  const board = placeStone(
    EMPTY_BOARD(),
    0,
    make("commander", [1, 1, 1, 1], [{ type: "command", turns: 1 }]),
    0,
  ).board;
  const local = advanceTurn(board, hands(), 0, 0, false, 1, undefined, {
    botOwners: [],
  });
  assert.equal(local.state.controlledBy, undefined);
  const empty = advanceTurn(
    board,
    [hands()[0], []],
    0,
    0,
    false,
    1,
    undefined,
    { botOwners: [1] },
  );
  assert.equal(empty.owner, 0);
  assert.equal(empty.state.control[0], 1);
});
for (const size of [3, 4] as const)
  for (const owner of [0, 1] as const)
    test(`${size}×${size}, owner ${owner}: Relocate keeps the card and its buffs without captures or on-play effects`, () => {
      const source = make("ally", [3, 0, 2, 1], [{ type: "shield", side: 0 }]);
      const board = placeStone(EMPTY_BOARD(size), 0, source, owner).board;
      const before = structuredClone(board),
        spell = moveSpell(),
        to = size * size - 1;
      const state = prepareTargeting(board, spell, [], owner);
      assert.equal(state.pending?.keyword.type, "relocate");
      const result = castSpell(board, spell, owner, [
        { keywordIndex: 0, boardIndex: 0, to },
      ]);
      assert.equal(result.board[0], null);
      assert.deepEqual(result.board[to], board[0]);
      assert.deepEqual(result.captured, []);
      assert.equal(result.keepsTurn, true);
      assert.equal(result.board.filter(Boolean).length, 1);
      assert.deepEqual(board, before);
    });
test("Relocate rejects enemies, occupied destinations and the incoming stone’s placement tile", () => {
  let board = placeStone(EMPTY_BOARD(), 0, make("ally"), 0).board;
  board = placeStone(board, 8, make("enemy"), 1).board;
  const spell = moveSpell();
  assert.throws(
    () =>
      castSpell(board, spell, 0, [{ keywordIndex: 0, boardIndex: 8, to: 1 }]),
    /valid card/,
  );
  assert.throws(
    () =>
      castSpell(board, spell, 0, [{ keywordIndex: 0, boardIndex: 0, to: 8 }]),
    /valid card/,
  );
  const mover = make(
    "stone",
    [1, 1, 1, 1],
    [{ type: "relocate", affects: "allies" }],
  );
  const pending = prepareTargeting(board, mover, [], 0, 1);
  assert.ok(pending.pending!.options.every((option) => option.to !== 1));
});
for (const size of [3, 4] as const)
  test(`${size}×${size} Relocate leaves terrain on its tile, moves a chest objective and survives reload`, () => {
    let run = enterAdventureNode(newAdventure(size, 81), "moss");
    const base = placeStone(
      EMPTY_BOARD(size),
      0,
      make(
        "ally",
        [1, 1, 1, 1],
        [{ type: "environment", environment: { kind: "bastion", amount: 1 } }],
      ),
      0,
      [{ keywordIndex: 0, boardIndex: 0 }],
    ).board;
    run = {
      ...run,
      battle: {
        ...run.battle!,
        board: base,
        objective: 0,
        objectiveKind: "chest",
        hands: [[moveSpell(), ...run.battle!.hands[0]], run.battle!.hands[1]],
      },
    };
    const after = playAdventureCard(run, -1, 0, [
      { keywordIndex: 0, boardIndex: 0, to: size * size - 1 },
    ]);
    assert.equal(after.battle!.current, 0);
    assert.equal(after.battle!.objective, size * size - 1);
    assert.equal(after.battle!.board.at(-1)?.environment, undefined);
    assert.ok(validateAdventure(after));
    const restored = restoreAdventure(JSON.parse(JSON.stringify(after)))!;
    assert.ok(restored);
    assert.equal(restored.battle!.objective, size * size - 1);
    assert.equal(restored.battle!.board[0], null);
  });
test("the new default relocation and random-grant spells validate and remain Conjure-only templates", () => {
  for (const card of DEFAULT_SPELLS) {
    assert.ok(validateStone(card), card.name);
    assert.ok(card.token);
    assert.ok(card.spell);
  }
  assert.ok(
    DEFAULT_SPELLS.some((card) =>
      card.keywords?.some(
        (k) => k.type === "relocate" && k.affects === "allies",
      ),
    ),
  );
  assert.ok(
    DEFAULT_SPELLS.some((card) =>
      card.keywords?.some((k) => k.type === "enchant" && k.randomKeywords),
    ),
  );
});
test("encounter AI settings are validated, copied into test fights, frozen during a battle and restored", () => {
  const encounter = {
    ...BUILTIN_ENCOUNTERS[0],
    id: "custom-ai",
    ai: {
      order: "low-pips" as const,
      priority: { element: "fire" as const },
      controlTurns: 2,
    },
    deck: [make("high", [2, 2, 2, 2]), make("low", [0, 1, 0, 0])],
  };
  assert.ok(validEncounter(encounter));
  const run = testAdventureEncounter(encounter, 3, 1, "easy", 81);
  assert.deepEqual(run.battle!.ai, encounter.ai);
  assert.deepEqual(run.battle!.turnState!.control, [2, 0]);
  const after = playAdventureCard(run, 0, 0);
  assert.equal(after.battle!.turnState!.controlledBy, 0);
  const forced = adventureEnemyMove(after, undefined, 0);
  assert.ok(forced.battle!.board.some((cell) => cell?.stone.name === "high"));
  const restored = restoreAdventure(JSON.parse(JSON.stringify(after)))!;
  assert.ok(restored);
  assert.deepEqual(restored.battle!.ai, encounter.ai);
  assert.deepEqual(restored.battle!.turnState, after.battle!.turnState);
});

test("Command granted to a board card does not replay its on-play effect", () => {
  const source = make(
    "self-grant",
    [1, 1, 1, 1],
    [
      {
        type: "enchant",
        target: "self",
        keywords: [{ type: "command", turns: 3 }],
      },
    ],
  );
  const board = placeStone(EMPTY_BOARD(), 0, source, 0).board;
  const granted = resolveDiscards(board, 0, hands(), 31);
  assert.ok(
    granted.board[0]!.stone.keywords!.some((k) => k.type === "command"),
  );
  assert.deepEqual(collectCommands(granted.board).control, [0, 0]);
});
