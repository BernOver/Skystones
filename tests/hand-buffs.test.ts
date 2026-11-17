import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_BOARD,
  STARTER_STONES,
  castSpell,
  placeStone,
  validateKeywords,
} from "../src/game.ts";
import type { Board, Edges, Owner, Stone, StoneKeyword } from "../src/game.ts";
import { resolveDiscards, enchantText } from "../src/discard.ts";
import type { EnchantKeyword } from "../src/discard.ts";
import { CARD_TYPES } from "../src/cardFilters.ts";
import { DEFAULT_TRAPS } from "../src/traps.ts";
import { validRuntimeEffects, scaleEffect } from "../src/amplify.ts";
import {
  newAdventure,
  enterAdventureNode,
  playAdventureCard,
  restoreAdventure,
  validateAdventure,
} from "../src/adventure.ts";

const make = (id: string, edges: Edges = [0, 1, 2, 3]): Stone => ({
  ...STARTER_STONES[0],
  id: `custom-${id}`,
  name: id,
  element: "magic",
  edges,
  keywords: [],
});
const allSides = ([0, 1, 2, 3] as const).map((side) => ({ side, amount: 1 }));
const buff: EnchantKeyword = {
  type: "enchant",
  target: "hand",
  mode: "all",
  pips: allSides,
};
function apply(
  keyword: EnchantKeyword,
  hands: [Stone[], Stone[]],
  board: Board = EMPTY_BOARD(),
  owner: Owner = 0,
) {
  const spell: Stone = {
    ...make("buffer"),
    spell: "cast",
    token: true,
    conjured: true,
    keywords: [keyword],
  };
  const move = castSpell(board, spell, owner);
  return resolveDiscards(move.board, move.sourceIndex!, hands, 81, [], false);
}

test("Enchant accepts stat-only hand buffs but rejects empty or malformed effects", () => {
  for (const keyword of [
    buff,
    { ...buff, pips: undefined, shields: [{ side: 2, amount: 2 }] },
    { ...buff, filter: { type: "stone", element: "magic", tribe: "giants" } },
  ])
    assert.ok(validateKeywords([keyword]));
  for (const keyword of [
    { type: "enchant", target: "hand", mode: "all" },
    { ...buff, pips: [] },
    { ...buff, pips: [{ side: 0, amount: 0 }] },
    { ...buff, target: "discarder" },
    { ...buff, filter: { type: "unknown" } },
    { ...buff, mode: "all", count: 1 },
  ])
    assert.equal(validateKeywords([keyword]), false);
  assert.ok(validRuntimeEffects(scaleEffect(buff, 2)));
  assert.match(enchantText({ ...buff, filter: { type: "token" } }), /ALL/);
  assert.match(enchantText({ ...buff, filter: { type: "token" } }), /Tokens/);
});

for (const size of [3, 4] as const)
  for (const owner of [0, 1] as const)
    test(`${size}×${size}, player ${owner}: a stone buffs the entire remaining hand, including more than five cards`, () => {
      const hand = Array.from({ length: size === 3 ? 7 : 9 }, (_, i) =>
        make(`h${i}`),
      );
      const hands: [Stone[], Stone[]] = [hand, [make("enemy")]];
      if (owner) hands.reverse();
      const before = structuredClone(hands);
      const move = placeStone(
        EMPTY_BOARD(size),
        0,
        {
          ...make("giver"),
          keywords: [{ ...buff, shields: [{ side: 3, amount: 2 }] }],
        },
        owner,
      );
      const result = resolveDiscards(move.board, 0, hands, 81, [], false);
      assert.equal(result.pending, undefined);
      assert.equal(result.records[0].buffs.length, hand.length);
      assert.deepEqual(result.hands[1 - owner], hands[1 - owner]);
      for (const card of result.hands[owner]) {
        assert.deepEqual(card.discardBuffs?.pips, [1, 1, 1, 1]);
        assert.deepEqual(card.discardBuffs?.shields, [0, 0, 0, 2]);
        assert.deepEqual(card.keywords, []);
      }
      const played = placeStone(
        result.board,
        size * size - 1,
        result.hands[owner][0],
        owner,
      );
      assert.deepEqual(played.board.at(-1)?.edges, [1, 2, 3, 4]);
      assert.equal(played.board.at(-1)?.shields?.[3], 2);
      assert.deepEqual(hands, before);
    });

test("hand-wide buffs can restrict recipients to each supported card type", () => {
  const mixed: Stone[] = [
    make("stone"),
    { ...make("token"), token: true },
    { ...make("unique"), unique: true },
    { ...make("part"), token: true, part: true },
    { ...make("charger"), supercharger: { parts: ["Engine", "Hull"] } },
    { ...make("spell"), token: true, spell: "cast" },
  ];
  const expected = {
    stone: ["stone", "token", "unique"],
    token: ["token", "part"],
    unique: ["unique"],
    part: ["part"],
    supercharger: ["charger"],
    spell: ["spell"],
  };
  for (const type of Object.keys(CARD_TYPES) as (keyof typeof CARD_TYPES)[]) {
    const result = apply({ ...buff, filter: { type } }, [mixed, []]);
    assert.deepEqual(
      result.hands[0].filter((c) => c.discardBuffs).map((c) => c.name),
      expected[type],
    );
  }
  const narrow = apply(
    {
      ...buff,
      filter: { type: "stone", element: "magic", tribe: "giants" },
      keywords: [{ type: "shield", side: 0 }],
    },
    [
      [
        { ...make("match"), tribes: ["giants"] },
        { ...make("wrong-element"), element: "fire", tribes: ["giants"] },
        make("wrong-tribe"),
      ],
      [],
    ],
  );
  assert.deepEqual(
    narrow.hands[0].filter((c) => c.discardBuffs).map((c) => c.name),
    ["match"],
  );
  assert.deepEqual(narrow.hands[0][0].keywords, [{ type: "shield", side: 0 }]);
  assert.deepEqual(narrow.hands[0][1].keywords, []);
});

test("stat-only hand buffs stack, honor Amplify and nullification, and safely do nothing with no matches", () => {
  const hands: [Stone[], Stone[]] = [
    [make("cap", [98, 99, 0, 1])],
    [make("opponent")],
  ];
  const first = apply(buff, hands);
  const second = apply(buff, first.hands, first.board);
  assert.deepEqual(second.hands[0][0].discardBuffs?.pips, [1, 0, 2, 2]);
  const doubled = apply(scaleEffect(buff, 2)[0] as EnchantKeyword, hands);
  assert.deepEqual(doubled.hands[0][0].discardBuffs?.pips, [1, 0, 2, 2]);
  const board = placeStone(
    EMPTY_BOARD(),
    0,
    {
      ...make("nullifier"),
      keywords: [
        {
          type: "trap",
          trap: {
            ...DEFAULT_TRAPS[0],
            affects: {},
            effects: [{ kind: "nullify", effect: "enchant" }],
          },
        },
      ],
    },
    1,
  ).board;
  assert.deepEqual(apply(buff, hands, board).hands, hands);
  const unmatched = apply({ ...buff, filter: { element: "fire" } }, hands);
  assert.equal(unmatched.pending, undefined);
  assert.deepEqual(unmatched.hands, hands);
});

for (const size of [3, 4] as const)
  test(`${size}×${size} Adventure buffs newly Conjured cards, saves the filtered hand buffs, and keeps them on play`, () => {
    let run = enterAdventureNode(newAdventure(size, 81), "moss");
    const source: Stone = {
      ...make("conjure-and-buff"),
      spell: "cast",
      conjured: true,
      token: true,
      edges: [0, 0, 0, 0],
      keywords: [
        {
          type: "conjure",
          mode: "specific",
          card: "spyro",
          count: 1,
          recipient: "self",
        },
        {
          ...buff,
          filter: { element: "magic" },
          shields: [{ side: 0, amount: 2 }],
        },
      ],
    };
    run = {
      ...run,
      battle: {
        ...run.battle!,
        hands: [
          [source, make("magic"), { ...make("fire"), element: "fire" }],
          run.battle!.hands[1],
        ],
      },
    };
    const before = JSON.stringify(run.inventory);
    run = playAdventureCard(run, -1, 0);
    assert.equal(run.battle!.current, 0);
    assert.equal(run.battle!.hands[0].length, 3);
    assert.ok(run.battle!.hands[0].at(-1)?.conjured);
    assert.deepEqual(
      run.battle!.hands[0].at(-1)?.discardBuffs?.pips,
      [1, 1, 1, 1],
    );
    assert.equal(run.battle!.hands[0][1].discardBuffs, undefined);
    assert.ok(validateAdventure(run));
    const restored = restoreAdventure(JSON.parse(JSON.stringify(run)))!;
    assert.ok(restored);
    assert.deepEqual(
      restored.battle!.hands,
      JSON.parse(JSON.stringify(run.battle!.hands)),
    );
    const placed = playAdventureCard(restored, 0, 0);
    assert.deepEqual(placed.battle!.board[0]?.edges, [1, 2, 3, 4]);
    assert.equal(placed.battle!.board[0]?.shields?.[0], 2);
    assert.equal(JSON.stringify(placed.inventory), before);
  });
