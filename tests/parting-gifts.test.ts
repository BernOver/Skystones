import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_BOARD,
  STARTER_STONES,
  placeStone,
  chooseKeywordTargets,
  evaluateKeywords,
  defenseEdges,
  placedKeywords,
  validateStone,
  validateKeywords,
} from "../src/game.ts";
import type { Stone, StoneKeyword, Board, Owner, Edges } from "../src/game.ts";
import {
  resolveDiscards,
  validateDiscardRecords,
  DiscardSelectionRequired,
} from "../src/discard.ts";
import type { PartingGiftKeyword, DiscardChoice } from "../src/discard.ts";
import { scaleEffect, validRuntimeEffects } from "../src/amplify.ts";
import { DEFAULT_TRAPS, withTrap } from "../src/traps.ts";
import {
  newAdventure,
  enterAdventureNode,
  playAdventureCard,
  adventureEnemyMove,
  validateAdventure,
  restoreAdventure,
} from "../src/adventure.ts";
const make = (
  id: string,
  keywords: StoneKeyword[] = [],
  edges: Edges = [1, 1, 1, 1],
): Stone => ({
  ...STARTER_STONES[0],
  id: `custom-gift-${id}`,
  name: id,
  element: "fire",
  edges,
  keywords,
});
const cast = (b: Board, i: number, s: Stone, o: Owner = 0) =>
  placeStone(b, i, s, o, chooseKeywordTargets(b, i, s, o)).board;
const discard: StoneKeyword = {
  type: "discard",
  mode: "random",
  recipient: "self",
  count: 1,
};
const gift = (spec: Partial<PartingGiftKeyword> = {}): PartingGiftKeyword => ({
  type: "parting-gift",
  target: "hand",
  pips: [{ side: 0, amount: 1 }],
  ...spec,
});
const hand = (prefix: string, n = 6) =>
  Array.from({ length: n }, (_, i) => make(`${prefix}${i}`));
function setup(spec: PartingGiftKeyword, owner: Owner = 0, count = 1) {
  let board = cast(
    EMPTY_BOARD(),
    8,
    make("enemy", [], [3, 3, 3, 3]),
    (1 - owner) as Owner,
  );
  board = cast(board, 0, make("caster", [{ ...discard, count }]), owner);
  const donor = make("donor", [
    { type: "discard-priority", priority: 99 },
    spec,
  ]);
  const hands: [Stone[], Stone[]] = [hand("ours"), hand("theirs")];
  hands[owner] = [donor, ...hand("recipient")];
  return { board, hands, donor };
}
test("Parting Gift validates signed pips, targets, recipient counts and nested keyword-only gifts without weakening Scavenge validation", () => {
  for (const target of [
    "hand",
    "enemy-hand",
    "hands",
    "allies",
    "enemies",
    "board",
    "discarder",
  ] as const)
    assert.ok(
      validateKeywords([
        gift({
          target,
          pips: [{ side: 1, amount: -5 }],
          keywords: [{ type: "shield", side: 0 }],
        }),
      ]),
    );
  assert.ok(
    validateKeywords([
      gift({
        pips: undefined,
        keywords: [
          {
            type: "parting-gift",
            target: "enemy-hand",
            pips: [{ side: 0, amount: -1 }],
          },
        ],
      }),
    ]),
  );
  for (const bad of [
    gift({ mode: "chosen", count: 0 }),
    gift({ mode: "random", count: 6 }),
    gift({ pips: undefined }),
    gift({ pips: [{ side: 0, amount: -6 }] }),
    gift({ mode: "all", count: 1 }),
    gift({ target: "discarder", mode: "chosen", count: 1 }),
  ])
    assert.equal(validateKeywords([bad]), false);
  assert.equal(
    validateKeywords([
      { type: "scavenge", from: "self", pips: [{ side: 0, amount: -1 }] },
    ]),
    false,
  );
});
test("negative board gifts hit opponents, clamp to zero and preserve all templates", () => {
  const fixture = setup(
    gift({ target: "enemies", pips: [{ side: 0, amount: -5 }] }),
  );
  const before = structuredClone(fixture);
  const result = resolveDiscards(fixture.board, 0, fixture.hands, 1);
  assert.deepEqual(result.board[8]!.edges, [0, 3, 3, 3]);
  assert.deepEqual(result.board[8]!.discardBuffs!.pips, [-3, 0, 0, 0]);
  assert.deepEqual(result.board[0]!.edges, [1, 1, 1, 1]);
  assert.deepEqual(fixture, before);
  assert.ok(validateDiscardRecords(result.records));
});
test("hand pip loss stores actual reductions rather than negative debt, including older over-capped saves", () => {
  const fixture = setup(
    gift({ target: "enemy-hand", pips: [{ side: 0, amount: -5 }] }),
  );
  const result = resolveDiscards(fixture.board, 0, fixture.hands, 1);
  const card = result.hands[1][0];
  assert.deepEqual(evaluateKeywords(card, result.board, 1).edges, [0, 1, 1, 1]);
  assert.equal(card.discardBuffs!.pips[0], -1);
  assert.ok(validateStone(card));
  const second = setup(
    gift({ target: "enemy-hand", pips: [{ side: 0, amount: 3 }] }),
  );
  second.hands[1] = result.hands[1];
  const restored = resolveDiscards(second.board, 0, second.hands, 1);
  assert.equal(
    evaluateKeywords(restored.hands[1][0], restored.board, 1).edges[0],
    3,
  );
  const old = setup(
    gift({ target: "enemy-hand", pips: [{ side: 0, amount: -1 }] }),
  );
  old.hands[1][0] = {
    ...old.hands[1][0],
    discardBuffs: { pips: [99, 0, 0, 0], shields: [0, 0, 0, 0] },
  };
  const reduced = resolveDiscards(old.board, 0, old.hands, 1);
  assert.equal(
    evaluateKeywords(reduced.hands[1][0], reduced.board, 1).edges[0],
    98,
  );
});
test("chosen hand gifts pause transactionally, exclude every card being discarded, and replay only once", () => {
  const f = setup(
    gift({ mode: "chosen", count: 1, pips: [{ side: 1, amount: 2 }] }),
    0,
    2,
  );
  const before = structuredClone(f);
  const pending = resolveDiscards(f.board, 0, f.hands, 1, [], false).pending!;
  assert.ok(pending.gift);
  assert.deepEqual(f, before);
  assert.ok(!pending.gift.options.some((o) => o.stone.id === f.donor.id));
  assert.equal(pending.gift.options.length, 5);
  const target = pending.gift.options[2];
  const choice: DiscardChoice = {
    keywordIndex: pending.keywordIndex,
    owner: pending.owner,
    giftId: pending.gift.id,
    cardIds: [target.id],
  };
  const result = resolveDiscards(f.board, 0, f.hands, 1, [choice], false);
  assert.equal(result.pending, undefined);
  assert.equal(
    result.hands[0].find((c) => c.id === target.stone.id)!.discardBuffs!
      .pips[1],
    2,
  );
  assert.equal(result.hands[0].filter((c) => c.discardBuffs).length, 1);
  assert.deepEqual(
    resolveDiscards(result.board, 0, result.hands, 1).records,
    [],
  );
  assert.throws(() =>
    resolveDiscards(
      f.board,
      0,
      f.hands,
      1,
      [{ ...choice, cardIds: ["not-a-target"] }],
      false,
    ),
  );
});
test("random gifts select distinct recipients deterministically and cap at the available pool", () => {
  const f = setup(gift({ target: "enemy-hand", mode: "random", count: 2 }));
  const first = resolveDiscards(f.board, 0, f.hands, 23);
  assert.deepEqual(resolveDiscards(f.board, 0, f.hands, 23), first);
  assert.equal(first.hands[1].filter((c) => c.discardBuffs).length, 2);
  const small = setup(gift({ target: "enemies", mode: "random", count: 5 }));
  assert.equal(
    resolveDiscards(small.board, 0, small.hands, 1).records[0].buffs.length,
    1,
  );
});
test("keyword-only gifts enter opponents' hands and activate on their later plays", () => {
  const f = setup(
    gift({
      target: "enemy-hand",
      mode: "random",
      count: 1,
      pips: undefined,
      keywords: [
        { type: "shield", side: 3, amount: 2 },
        {
          type: "parting-gift",
          target: "hand",
          pips: [{ side: 1, amount: 1 }],
        },
      ],
    }),
  );
  const result = resolveDiscards(f.board, 0, f.hands, 1);
  const received = result.hands[1].find((c) => c.keywords?.length)!;
  assert.ok(validateStone(received));
  assert.equal(received.discardBuffs, undefined);
  assert.equal(received.keywords!.length, 2);
  const board = cast(result.board, 7, received, 1);
  assert.equal(defenseEdges(board[7]!)[3], 3);
  assert.ok(validateDiscardRecords(result.records));
});
test("board keyword gifts activate Shield immediately, respond to Traps and Silence, and preserve queued counters", () => {
  const f = setup(
    gift({
      target: "enemies",
      pips: undefined,
      keywords: [{ type: "shield", side: 0, amount: 2 }],
    }),
  );
  const result = resolveDiscards(f.board, 0, f.hands, 1);
  assert.equal(defenseEdges(result.board[8]!)[0], 5);
  assert.ok(placedKeywords(result.board[8]!).some((k) => k.type === "shield"));
  assert.ok(validRuntimeEffects(result.board[8]!.resolvedEffects));
  const trap = {
    ...DEFAULT_TRAPS[0],
    affects: undefined,
    effects: [{ kind: "amplify" as const, effect: "shield" as const }],
  };
  assert.equal(defenseEdges(withTrap(result.board, trap)[8]!)[0], 7);
  const silenced = cast(
    result.board,
    4,
    make("silencer", [{ type: "silence" }]),
  );
  assert.ok(silenced[8]!.silenced);
  assert.equal(defenseEdges(silenced[8]!)[0], 3);
});
test("new Amplify gifts update passive Shield and Scavenge without replaying on-play abilities", () => {
  const f = setup(
    gift({
      target: "enemies",
      pips: undefined,
      keywords: [
        { type: "amplify", effect: "shield", duration: "always" },
        { type: "shield", side: 0, amount: 1 },
      ],
    }),
  );
  f.board[8] = {
    ...f.board[8]!,
    stone: make(
      "enemy",
      [{ type: "shield", side: 2, amount: 2 }],
      [3, 3, 3, 3],
    ),
    shields: [0, 0, 2, 0],
  };
  const result = resolveDiscards(f.board, 0, f.hands, 1);
  assert.deepEqual(result.board[8]!.shields, [2, 0, 4, 0]);
});
test("Scavenge gifted by the first discarded card observes the next discard, but not the earlier one", () => {
  const f = setup(
    gift({
      target: "discarder",
      pips: undefined,
      keywords: [
        { type: "scavenge", from: "self", pips: [{ side: 0, amount: 2 }] },
      ],
    }),
    0,
    2,
  );
  const result = resolveDiscards(f.board, 0, f.hands, 1);
  assert.equal(result.board[0]!.edges![0], 3);
});
test("Parting Gift doubling scales negative pips and keyword gifts, and nullification blocks both", () => {
  const spec = gift({
    target: "enemy-hand",
    pips: [{ side: 0, amount: -2 }],
    keywords: [
      {
        type: "conjure",
        mode: "specific",
        card: "spyro",
        recipient: "self",
        count: 5,
      },
    ],
  });
  const scaled = scaleEffect(spec, 4)[0];
  assert.equal(scaled.pips![0].amount, -8);
  assert.equal(scaled.keywords![0].count, 20);
  assert.ok(validRuntimeEffects([scaled]));
  const f = setup(spec);
  f.donor.keywords!.push({
    type: "amplify",
    effect: "parting-gift",
    duration: "always",
  });
  const result = resolveDiscards(f.board, 0, f.hands, 1);
  assert.equal(result.hands[1][0].keywords![0].count, 10);
  assert.ok(result.hands[1][0].runtimeEffects);
  assert.ok(validateStone(result.hands[1][0]));
  const nullify = {
    ...DEFAULT_TRAPS[0],
    affects: undefined,
    effects: [{ kind: "nullify" as const, effect: "parting-gift" as const }],
  };
  const blocked = resolveDiscards(withTrap(f.board, nullify), 0, f.hands, 1);
  assert.deepEqual(blocked.records[0].buffs, []);
});
test("human-owned chosen gifts can interrupt an automatic enemy discard, while AI gifts stay automatic", () => {
  const f = setup(gift({ mode: "chosen", count: 1 }));
  f.board[0] = {
    ...f.board[0]!,
    owner: 1,
    playedBy: 1,
    stone: make("enemy-discard", [{ ...discard, recipient: "opponent" }]),
  };
  const result = resolveDiscards(f.board, 0, f.hands, 1, [], true, false, [0]);
  assert.equal(result.pending!.owner, 0);
  assert.ok(result.pending!.gift);
  assert.equal(
    resolveDiscards(f.board, 0, f.hands, 1, [], true, false, []).pending,
    undefined,
  );
});
for (const size of [3, 4] as const)
  test(`${size}×${size} Adventure preserves enemy hand penalties and keyword gifts on reload`, () => {
    let run = enterAdventureNode(newAdventure(size, 81), "moss");
    const source = {
      ...run.battle!.hands[0][0],
      keywords: [
        {
          type: "conjure",
          mode: "specific",
          card: "spyro",
          count: 2,
          recipient: "self",
        },
        discard,
      ] as StoneKeyword[],
    };
    const donor = {
      ...run.battle!.hands[0][1],
      keywords: [
        { type: "discard-priority", priority: 99 },
        gift({
          target: "enemy-hand",
          pips: [{ side: 0, amount: -2 }],
          keywords: [{ type: "shield", side: 1, amount: 2 }],
        }),
      ] as StoneKeyword[],
    };
    run = {
      ...run,
      battle: {
        ...run.battle!,
        hands: [
          [source, donor, ...run.battle!.hands[0].slice(2)],
          run.battle!.hands[1],
        ],
      },
    };
    run = playAdventureCard(run, 0, 0);
    assert.ok(validateAdventure(run));
    const restored = restoreAdventure(JSON.parse(JSON.stringify(run)))!;
    assert.ok(restored);
    assert.deepEqual(
      restored.battle!.hands[1].map((c) => c.discardBuffs),
      run.battle!.hands[1].map((c) => c.discardBuffs),
    );
    assert.ok(
      restored.battle!.hands[1].every((c) =>
        c.keywords!.some((k) => k.type === "shield" && k.side === 1),
      ),
    );
  });
test("enemy Adventure actions carry their move context when a player's Parting Gift needs a choice", () => {
  let run = enterAdventureNode(newAdventure(3, 81), "moss");
  const b = run.battle!;
  const donor = {
    ...b.hands[0][0],
    keywords: [
      { type: "discard-priority", priority: 99 },
      gift({ mode: "chosen", count: 1 }),
    ] as StoneKeyword[],
  };
  run = {
    ...run,
    battle: {
      ...b,
      current: 1,
      hands: [
        [donor, ...b.hands[0].slice(1)],
        b.hands[1].map((c) => ({
          ...c,
          keywords: [{ ...discard, recipient: "opponent" }] as StoneKeyword[],
        })),
      ],
    },
  };
  assert.throws(
    () => adventureEnemyMove(run, [0]),
    (error) =>
      error instanceof DiscardSelectionRequired &&
      !!error.pending.gift &&
      !!error.move,
  );
});

test("one discarded card can resolve several different Parting Gift targets in order", () => {
  const f = setup(gift({ target: "hand", pips: [{ side: 0, amount: 2 }] }));
  f.donor.keywords!.push(
    gift({ target: "enemy-hand", pips: [{ side: 1, amount: -2 }] }),
  );
  assert.ok(validateStone(f.donor));
  const result = resolveDiscards(f.board, 0, f.hands, 1);
  assert.ok(result.hands[0].every((s) => s.discardBuffs?.pips[0] === 2));
  assert.ok(result.hands[1].every((s) => s.discardBuffs?.pips[1] === -1));
});

test("board keyword gifts never replay Conjure, Sunder, Next Play, Flash, or Trap placement", () => {
  let run = enterAdventureNode(newAdventure(3, 81), "moss");
  const source = {
    ...run.battle!.hands[0][0],
    keywords: [
      {
        type: "conjure",
        mode: "specific",
        card: "spyro",
        count: 2,
        recipient: "self",
      },
      discard,
    ] as StoneKeyword[],
  };
  const donor = {
    ...run.battle!.hands[0][1],
    keywords: [
      { type: "discard-priority", priority: 99 },
      gift({
        target: "discarder",
        pips: undefined,
        keywords: [
          {
            type: "conjure",
            mode: "specific",
            card: "spyro",
            count: 1,
            recipient: "self",
          },
          { type: "sunder", side: "any", amount: 2 },
          { type: "next-play", side: "all", amount: 1, recipient: "self" },
          { type: "flash" },
          { type: "trap", trap: DEFAULT_TRAPS[0] },
        ],
      }),
    ] as StoneKeyword[],
  };
  run = {
    ...run,
    battle: {
      ...run.battle!,
      hands: [
        [source, donor, ...run.battle!.hands[0].slice(2)],
        run.battle!.hands[1],
      ],
    },
  };
  run = playAdventureCard(run, 0, 0);
  assert.equal(run.battle!.hands[0].length, 5);
  assert.equal(run.battle!.current, 1);
  assert.equal(run.battle!.board[0]!.queuedPips, undefined);
  assert.equal(run.battle!.traps, undefined);
  assert.equal(run.battle!.board[0]!.effects?.length || 0, 0);
  assert.ok(
    placedKeywords(run.battle!.board[0]!).some((k) => k.type === "flash"),
  );
  assert.ok(validateAdventure(run));
});
