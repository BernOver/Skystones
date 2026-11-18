import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_BOARD,
  STARTER_STONES,
  placeStone,
  castSpell,
  validateKeywords,
  validateStone,
  playHistory,
  cardEdges,
} from "../src/game.ts";
import type { Stone, StoneKeyword, Board, Owner } from "../src/game.ts";
import {
  rollKeywords,
  randomKeywordTypes,
  keywordSeed,
  validRandomKeywords,
} from "../src/randomKeywords.ts";
import { cardMatches, validCardFilter } from "../src/cardFilters.ts";
import { resolveDiscards } from "../src/discard.ts";
import { DEFAULT_TRAPS, validTrap, trapEdges } from "../src/traps.ts";
import type { Trap } from "../src/traps.ts";
import {
  beginTurn,
  advanceTurn,
  postPlayTrapGrants,
  validTurnState,
} from "../src/turns.ts";
import {
  newAdventure,
  enterAdventureNode,
  playAdventureCard,
  restoreAdventure,
  validateAdventure,
} from "../src/adventure.ts";
const make = (
  name: string,
  keywords: StoneKeyword[] = [],
  edges: Stone["edges"] = [1, 1, 1, 1],
): Stone => ({
  ...STARTER_STONES[0],
  id: `custom-${name}`,
  name,
  element: "magic",
  edges,
  keywords,
});
const hand = (): [Stone[], Stone[]] => [
  Array.from({ length: 5 }, (_, i) => make(`a${i}`)),
  Array.from({ length: 5 }, (_, i) => make(`b${i}`)),
];
const asSpell = (keywords: StoneKeyword[]): Stone => ({
  ...make("spell", keywords, [0, 0, 0, 0]),
  token: true,
  conjured: true,
  spell: "cast",
});
const trap = (effects: Trap["effects"]): Trap => ({
  ...DEFAULT_TRAPS[0],
  id: "trap-test-grants",
  name: "Test Crystal",
  affects: undefined,
  effects,
});

test("random generation validates pools, never generates Flash, and reaches every other keyword with reproducible valid definitions", () => {
  assert.equal(randomKeywordTypes().includes("flash"), false);
  assert.equal(validRandomKeywords({ count: 1, pool: ["flash"] }), false);
  assert.equal(validRandomKeywords({ count: 1, pool: [] }), false);
  assert.equal(
    validRandomKeywords({ count: 1, pool: ["shield", "shield"] }),
    false,
  );
  assert.throws(
    () => rollKeywords({ count: 1, pool: ["flash"] }, 1),
    /valid random keyword pool/,
  );
  const seen = new Set<string>();
  for (let n = 0; n < 1500; n++) {
    const seed = keywordSeed(`sample-${n}`),
      spec = { count: 5, strength: 2 };
    const rolls = rollKeywords(spec, seed);
    assert.ok(validateKeywords(rolls), JSON.stringify(rolls));
    assert.deepEqual(rollKeywords(spec, seed), rolls);
    const inspect = (value: unknown): void => {
      if (!value || typeof value !== "object") return;
      if ("type" in value) assert.notEqual(value.type, "flash");
      for (const child of Object.values(value))
        if (Array.isArray(child)) child.forEach(inspect);
        else if (child && typeof child === "object") inspect(child);
    };
    rolls.forEach((k) => {
      seen.add(k.type);
      inspect(k);
    });
  }
  assert.deepEqual([...seen].sort(), randomKeywordTypes().sort());
});
test("random keyword grants respect unique assignments and the 24-keyword limit", () => {
  const old = [{ type: "shield", side: 0 }] as StoneKeyword[],
    snapshot = structuredClone(old);
  const rolled = rollKeywords({ count: 5, pool: ["shield"] }, 981, old);
  assert.equal(rolled.length, 3);
  assert.ok(rolled.every((k) => k.type === "shield" && k.side !== 0));
  assert.deepEqual(old, snapshot);
  assert.equal(
    rollKeywords(
      { count: 5 },
      123,
      Array.from({ length: 24 }, () => ({ type: "sunder", side: "any" })),
    ).length,
    0,
  );
});
test("a random-only spell Enchant rolls per recipient, replays the same choices, and leaves templates unchanged", () => {
  const source = asSpell([
    {
      type: "enchant",
      target: "hand",
      mode: "chosen",
      count: 1,
      randomKeywords: { count: 3, pool: ["shield", "comeback"] },
    },
  ]);
  assert.ok(validateKeywords(source.keywords));
  const move = castSpell(EMPTY_BOARD(), source, 0),
    hands = hand(),
    before = structuredClone(hands);
  const pending = resolveDiscards(
    move.board,
    move.sourceIndex!,
    hands,
    81,
    [],
    false,
  );
  assert.ok(pending.pending?.gift);
  const choice = {
    giftId: pending.pending!.gift!.id,
    keywordIndex: 0,
    owner: 0 as const,
    cardIds: [pending.pending!.gift!.options[0].id],
  };
  const result = resolveDiscards(
    move.board,
    move.sourceIndex!,
    hands,
    81,
    [choice],
    false,
  );
  assert.equal(result.hands[0][0].keywords?.length, 3);
  assert.deepEqual(
    resolveDiscards(move.board, move.sourceIndex!, hands, 81, [choice], false),
    result,
  );
  assert.deepEqual(hands, before);
  assert.equal(source.keywords?.length, 1);
});
test("card and side conditions support zero sides, totals, elements, tribes and card types", () => {
  const card = make("zero", [], [0, 1, 0, 4]);
  assert.ok(
    validCardFilter({
      type: "stone",
      pips: { side: "any", compare: "eq", value: 0 },
    }),
  );
  assert.ok(
    cardMatches(card, { pips: { side: "any", compare: "eq", value: 0 } }),
  );
  assert.equal(
    cardMatches(card, { pips: { side: "all", compare: "eq", value: 0 } }),
    false,
  );
  assert.ok(
    cardMatches(card, { pips: { side: "total", compare: "gte", value: 5 } }),
  );
  assert.equal(cardMatches(asSpell([]), { type: "stone" }), false);
  assert.equal(cardMatches(asSpell([]), { type: "token" }), false);
  assert.equal(
    validCardFilter({ pips: { side: 5, compare: "eq", value: 0 } }),
    false,
  );
});
test("the zero-side Trap grants +2 only to ordinary zero-pip sides, without feeding its own condition", () => {
  const crystal = trap([
    {
      kind: "pips",
      side: "all",
      amount: 2,
      condition: {
        type: "stone",
        pips: { side: "any", compare: "eq", value: 0 },
      },
      sideCondition: { compare: "eq", value: 0 },
    },
  ]);
  assert.ok(validTrap(crystal));
  const card = make("zero", [], [0, 1, 0, 4]);
  assert.deepEqual(trapEdges(card.edges, card, crystal), [2, 1, 2, 4]);
  assert.deepEqual(trapEdges(card.edges, card, crystal), [2, 1, 2, 4]);
  assert.deepEqual(trapEdges([1, 1, 1, 4], card, crystal), [1, 1, 1, 4]);
  assert.deepEqual(trapEdges([0, 0, 0, 0], asSpell([]), crystal), [0, 0, 0, 0]);
  const board = placeStone(
    EMPTY_BOARD(),
    0,
    make("placed", [{ type: "trap", trap: crystal }], [0, 1, 0, 4]),
    0,
  ).board;
  assert.deepEqual(cardEdges(board[0]!), [2, 1, 2, 4]);
  assert.deepEqual(board[0]!.edges, [0, 1, 0, 4]);
});
test("Traps grant fixed and random keywords to both players, with element conditions and no Flash", () => {
  const crystal = trap([
    {
      kind: "grant",
      target: "both",
      timing: "placed",
      keywords: [{ type: "shield", side: 0 }],
      randomKeywords: { count: 2, pool: ["comeback", "head-start"] },
      condition: { element: "magic" },
    },
  ]);
  assert.ok(validTrap(crystal));
  const before = EMPTY_BOARD(),
    hands = hand(),
    board = placeStone(
      before,
      0,
      make("caster", [{ type: "trap", trap: crystal }]),
      0,
    ).board;
  const result = postPlayTrapGrants(board, hands, before, hands, 0, 83);
  for (const card of result.hands.flat()) {
    assert.equal(card.keywords?.length, 3);
    assert.ok(card.keywords?.some((k) => k.type === "shield"));
    assert.ok(card.keywords?.every((k) => k.type !== "flash"));
  }
  assert.equal(result.board[0]?.shields?.[0], 1);
  assert.deepEqual(
    postPlayTrapGrants(board, hands, before, hands, 0, 83),
    result,
  );
  assert.deepEqual(hands, hand());
});
test("entry grants affect only a newly played board card and new hand copies", () => {
  const crystal = trap([
    {
      kind: "grant",
      target: "both",
      timing: "enter",
      keywords: [{ type: "shield", side: 1 }],
    },
  ]);
  const base = placeStone(
    EMPTY_BOARD(),
    8,
    make("old", [{ type: "trap", trap: crystal }]),
    1,
  ).board;
  const hands = hand(),
    current = placeStone(base, 0, make("new"), 0).board;
  const updated: [Stone[], Stone[]] = [
    [...hands[0], make("generated")],
    hands[1],
  ];
  const result = postPlayTrapGrants(current, updated, base, hands, 0, 9);
  assert.equal(result.board[0]?.shields?.[1], 1);
  assert.equal(result.board[8]?.shields?.[1], 0);
  assert.equal(result.hands[0].at(-1)?.keywords?.[0].type, "shield");
  assert.deepEqual(result.hands[0][0].keywords, []);
});
test("turn-start effects fire once per matching real turn and Flash does not repeat them", () => {
  const source = make("clock", [
    {
      type: "turn-start",
      when: "self",
      keywords: [
        { type: "conjure", mode: "random", count: 1, recipient: "self" },
      ],
    },
  ]);
  const board = placeStone(EMPTY_BOARD(), 0, source, 0).board,
    hands = hand();
  const opponent = beginTurn(board, hands, 1, 1, 81);
  assert.equal(opponent.hands[0].length, 5);
  const own = beginTurn(
    opponent.board,
    opponent.hands,
    0,
    2,
    81,
    opponent.state,
  );
  assert.equal(own.hands[0].length, 6);
  const again = beginTurn(own.board, own.hands, 0, 2, 81, own.state);
  assert.equal(again.hands[0].length, 6);
  assert.equal(
    again.board.spellHistory?.length,
    own.board.spellHistory?.length,
  );
  const flash = advanceTurn(own.board, own.hands, 0, 2, true, 81, own.state);
  assert.equal(flash.turnNumber, 2);
  assert.equal(flash.hands[0].length, 6);
});
test("captured turn-start cards follow their new controller and Silence stops them", () => {
  const card = make("clock", [
    {
      type: "turn-start",
      when: "self",
      keywords: [
        { type: "conjure", mode: "random", count: 1, recipient: "self" },
      ],
    },
  ]);
  const board = placeStone(EMPTY_BOARD(), 0, card, 0).board;
  board[0] = { ...board[0]!, owner: 1 };
  const enemy = beginTurn(board, hand(), 1, 1, 71);
  assert.equal(enemy.hands[1].length, 6);
  const silent = [...board] as Board;
  silent[0] = { ...silent[0]!, silenced: true };
  const stopped = beginTurn(silent, hand(), 1, 1, 71);
  assert.equal(stopped.hands[1].length, 5);
});
test("turn-start Trap grants can affect only the player whose turn starts", () => {
  const crystal = trap([
    {
      kind: "grant",
      target: "hand",
      timing: "turn-start",
      recipients: "active",
      randomKeywords: { count: 1, pool: ["shield"] },
    },
  ]);
  const board = placeStone(
    EMPTY_BOARD(),
    0,
    make("trap", [{ type: "trap", trap: crystal }]),
    0,
  ).board;
  const result = beginTurn(board, hand(), 1, 1, 19);
  assert.ok(result.hands[1].every((card) => card.keywords?.length === 1));
  assert.ok(result.hands[0].every((card) => card.keywords?.length === 0));
  assert.ok(validTurnState(result.state));
});
test("turn-start definitions reject recursive schedules, Flash, unsupported on-play-only effects and malformed triggers", () => {
  for (const keyword of [
    { type: "flash" },
    { type: "relocate", affects: "allies" },
    {
      type: "turn-start",
      when: "self",
      keywords: [{ type: "command", turns: 1 }],
    },
  ])
    assert.equal(
      validateKeywords([
        { type: "turn-start", when: "self", keywords: [keyword] },
      ]),
      false,
    );
  assert.equal(
    validateKeywords([
      {
        type: "turn-start",
        when: "never",
        keywords: [{ type: "command", turns: 1 }],
      },
    ]),
    false,
  );
  assert.equal(validTurnState({ control: [-1, 0] }), false);
});
for (const size of [3, 4] as const)
  test(`${size}×${size} spell schedules and random Trap grants persist through Adventure reloads without rerolling`, () => {
    let run = enterAdventureNode(newAdventure(size, 81), "moss");
    const source = asSpell([
      {
        type: "turn-start",
        when: "self",
        keywords: [
          {
            type: "enchant",
            target: "hand",
            randomKeywords: { count: 1, pool: ["shield"] },
          },
        ],
      },
    ]);
    run = {
      ...run,
      battle: {
        ...run.battle!,
        hands: [[source, ...run.battle!.hands[0]], run.battle!.hands[1]],
      },
    };
    run = playAdventureCard(run, -1, 0);
    assert.equal(run.battle!.current, 0);
    run = playAdventureCard(run, 0, 0);
    run = playAdventureCard(run, 1, 0);
    assert.equal(run.battle!.current, 0);
    assert.ok(
      run.battle!.hands[0].every((card) =>
        card.keywords?.some((k) => k.type === "shield"),
      ),
    );
    assert.ok(validateAdventure(run));
    const restored = restoreAdventure(JSON.parse(JSON.stringify(run)))!;
    assert.ok(restored);
    assert.deepEqual(restored.battle!.turnState, run.battle!.turnState);
    assert.deepEqual(
      restored.battle!.hands[0],
      JSON.parse(JSON.stringify(run.battle!.hands[0])),
    );
    const same = beginTurn(
      restored.battle!.board,
      restored.battle!.hands,
      restored.battle!.current,
      restored.battle!.turnNumber!,
      81,
      restored.battle!.turnState,
    );
    assert.deepEqual(same.hands, restored.battle!.hands);
  });
