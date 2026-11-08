import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_BOARD,
  STARTER_STONES,
  placeStone,
  evaluateKeywords,
  chooseKeywordTargets,
  validateKeywords,
  validateStone,
  cardEdges,
} from "../src/game.ts";
import type {
  Stone,
  StoneKeyword,
  Owner,
  BoardSize,
  Board,
} from "../src/game.ts";
import { applyConjure, CONJURE_CARDS } from "../src/conjure.ts";
import {
  resolveDiscards,
  finishCardsRequired,
  DiscardSelectionRequired,
  validateDiscardRecords,
} from "../src/discard.ts";
import type { DiscardKeyword } from "../src/discard.ts";
import { DEFAULT_TOKENS, tokenDefinition } from "../src/tokens.ts";
import { pendingPipEffects } from "../src/effects.ts";
import {
  newAdventure,
  enterAdventureNode,
  playAdventureCard,
  restoreAdventure,
  adventureEnemyMove,
  validateAdventure,
} from "../src/adventure.ts";
import { rotatedPotionStone } from "../src/potions.ts";
import { newDraft, restoreDraft } from "../src/draft.ts";
const card = (
  id: string,
  keywords: StoneKeyword[] = [],
  edges: Stone["edges"] = [0, 0, 0, 0],
): Stone => ({
  ...STARTER_STONES[0],
  id: `custom-${id}`,
  name: id,
  edges,
  keywords,
});
const discard = (
  mode: "chosen" | "random" = "random",
  recipient: "self" | "opponent" | "both" = "self",
  count = 5,
): DiscardKeyword => ({ type: "discard", mode, recipient, count });
const summon: StoneKeyword = {
  type: "conjure",
  mode: "specific",
  card: "spyro",
  count: 2,
  recipient: "both",
};
const scavenge: StoneKeyword = {
  type: "scavenge",
  from: "both",
  pips: [{ side: 0, amount: 2 }],
  shields: [{ side: 1, amount: 1 }],
};
const baseHands = (size: BoardSize, actor: Owner): [Stone[], Stone[]] =>
  [0, 1].map((owner) =>
    Array.from(
      { length: (size === 3 ? 5 : 8) - (owner === actor ? 1 : 0) },
      (_, i) => card(`hand-${owner}-${i}`),
    ),
  ) as [Stone[], Stone[]];
function prepare(size: BoardSize, keywords: StoneKeyword[], actor: Owner = 0) {
  const board = placeStone(
    EMPTY_BOARD(size),
    0,
    card("caster", keywords),
    actor,
  ).board;
  return applyConjure(board, 0, baseHands(size, actor), CONJURE_CARDS, 81);
}
test("discard keywords validate counts, rewards and priority, and unusable hand-only grants are rejected", () => {
  const gift: StoneKeyword = {
    type: "parting-gift",
    target: "hand",
    shields: [{ side: 2, amount: 3 }],
  };
  assert.ok(
    validateKeywords([
      discard(),
      scavenge,
      gift,
      { type: "discard-priority", priority: 99 },
    ]),
  );
  assert.ok(
    validateKeywords([{ type: "combo", keywords: [discard(), scavenge] }]),
  );
  assert.ok(
    validateKeywords([
      {
        type: "conjure",
        mode: "specific",
        card: "spyro",
        count: 1,
        recipient: "self",
        keywords: [gift, { type: "discard-priority" }],
      },
    ]),
  );
  assert.equal(validateKeywords([{ type: "combo", keywords: [gift] }]), false);
  assert.equal(
    validateKeywords([
      {
        type: "next-play",
        side: 0,
        amount: 0,
        recipient: "self",
        keywords: [{ type: "discard-priority" }],
      },
    ]),
    false,
  );
  for (const invalid of [
    { ...discard(), count: 0 },
    { ...discard(), count: 6 },
    { ...discard(), mode: "all" },
    { ...discard(), recipient: "enemy" },
    { ...scavenge, pips: [{ side: 4, amount: 1 }] },
    { ...scavenge, pips: [{ side: 0, amount: -1 }] },
    { type: "scavenge", from: "self" },
    { type: "parting-gift", target: "unknown", pips: [{ side: 0, amount: 1 }] },
    { type: "discard-priority", priority: 0 },
  ])
    assert.equal(validateKeywords([invalid]), false);
});
for (const size of [3, 4] as const)
  for (const actor of [0, 1] as const) {
    test(`${size}×${size}, player ${actor}: unsafe cards are protected and every remaining turn can be filled`, () => {
      const prepared = prepare(
        size,
        [discard("random", "both"), scavenge],
        actor,
      );
      const result = resolveDiscards(prepared.board, 0, prepared.hands, 81);
      const required = finishCardsRequired(result.board, (1 - actor) as Owner);
      assert.deepEqual(
        result.hands.map((hand) => hand.length),
        required,
      );
      assert.equal(
        result.records.reduce((n, record) => n + record.cards.length, 0),
        size === 3 ? 1 : 0,
      );
      assert.ok(validateDiscardRecords(result.records));
      const copies = result.hands.map((hand) => [...hand]);
      let next = (1 - actor) as Owner;
      for (const index of result.board.flatMap((cell, index) =>
        !cell ? [index] : [],
      )) {
        const stone = copies[next].shift();
        assert.ok(stone, `player ${next} needs a card for ${index}`);
        next = (1 - next) as Owner;
      }
    });
    test(`${size}×${size}, player ${actor}: actual Conjure cards count before discarding and only actual discards grant buffs`, () => {
      const prepared = prepare(
        size,
        [discard("random", "both", 3), scavenge, summon],
        actor,
      );
      const before = structuredClone(prepared);
      const result = resolveDiscards(prepared.board, 0, prepared.hands, 81);
      const total = result.records.reduce(
        (n, record) => n + record.cards.length,
        0,
      );
      assert.equal(total, size === 3 ? 5 : 4);
      assert.equal(result.board[0]!.edges![0], total * 2);
      assert.equal(result.board[0]!.shields![1], total);
      assert.deepEqual(prepared, before);
      const required = finishCardsRequired(result.board, (1 - actor) as Owner);
      assert.deepEqual(
        result.hands.map((hand) => hand.length),
        required,
      );
    });
  }
test("missing token templates and empty random pools provide no imaginary discard allowance", () => {
  for (const summon of [
    {
      type: "conjure",
      mode: "token",
      token: "custom-token-missing",
      count: 5,
      recipient: "self",
    },
    {
      type: "conjure",
      mode: "random",
      element: "neutral",
      tribe: "giants",
      count: 5,
      recipient: "self",
    },
  ] as StoneKeyword[]) {
    const prepared = prepare(4, [discard(), summon, scavenge]);
    assert.equal(prepared.conjurations[0].cards.length, 0);
    const result = resolveDiscards(prepared.board, 0, prepared.hands, 81);
    assert.equal(result.records[0].cards.length, 0);
    assert.equal(result.board[0]!.discardBuffs, undefined);
    assert.equal(result.hands[0].length, 7);
  }
  const board = placeStone(
    EMPTY_BOARD(4),
    0,
    card("caster", [discard(), summon]),
    0,
  ).board;
  const fullHands: [Stone[], Stone[]] = [
    Array.from({ length: 18 }, (_, i) => card(`full-${i}`)),
    baseHands(4, 0)[1],
  ];
  const conjured = applyConjure(board, 0, fullHands, CONJURE_CARDS, 81);
  assert.equal(conjured.hands[0].length, 20);
  const result = resolveDiscards(conjured.board, 0, conjured.hands, 81);
  assert.equal(result.hands[0].length, 15);
});
test("chosen discards expose generated cards, remain transactional through both hands, and reject invalid selections", () => {
  const prepared = prepare(4, [summon, discard("chosen", "both", 2), scavenge]);
  const before = structuredClone(prepared);
  const first = resolveDiscards(
    prepared.board,
    0,
    prepared.hands,
    81,
    [],
    false,
  );
  assert.equal(first.pending!.owner, 0);
  assert.ok(first.pending!.cards.some((card) => card.conjured));
  const choice = {
    keywordIndex: 1,
    owner: 0 as const,
    cardIds: first.pending!.cards.slice(-2).map((card) => card.id),
  };
  const second = resolveDiscards(
    prepared.board,
    0,
    prepared.hands,
    81,
    [choice],
    false,
  );
  assert.equal(second.pending!.owner, 1);
  const final = resolveDiscards(
    prepared.board,
    0,
    prepared.hands,
    81,
    [
      choice,
      {
        keywordIndex: 1,
        owner: 1,
        cardIds: second.pending!.cards.slice(-2).map((card) => card.id),
      },
    ],
    false,
  );
  assert.equal(final.pending, undefined);
  assert.deepEqual(
    final.records.map((record) => record.cards.length),
    [2, 2],
  );
  assert.deepEqual(prepared, before);
  assert.throws(
    () =>
      resolveDiscards(
        prepared.board,
        0,
        prepared.hands,
        81,
        [{ ...choice, cardIds: ["missing", "missing"] }],
        false,
      ),
    /exactly/,
  );
  assert.deepEqual(
    resolveDiscards(final.board, 0, final.hands, 81).hands,
    final.hands,
  );
});
test("random discards take higher ranks first with seeded random ties; chosen discards can ignore priority", () => {
  const board = placeStone(
    EMPTY_BOARD(),
    0,
    card("caster", [discard("random", "self", 3)]),
    0,
  ).board;
  const hands: [Stone[], Stone[]] = [
    [
      card("rank-2", [{ type: "discard-priority", priority: 2 }]),
      card("rank-5-a", [{ type: "discard-priority", priority: 5 }]),
      card("rank-5-b", [{ type: "discard-priority", priority: 5 }]),
      card("rank-1", [{ type: "discard-priority" }]),
      card("plain-a"),
      card("plain-b"),
      card("plain-c"),
    ],
    [],
  ];
  const result = resolveDiscards(board, 0, hands, 8123);
  assert.deepEqual(
    new Set(result.records[0].cards.map((card) => card.name)),
    new Set(["rank-5-a", "rank-5-b", "rank-2"]),
  );
  assert.deepEqual(resolveDiscards(board, 0, hands, 8123), result);
  const seen = new Set<string>();
  const one = placeStone(
    EMPTY_BOARD(),
    0,
    card("caster", [discard("random", "self", 1)]),
    0,
  ).board;
  for (let seed = 1; seed <= 20; seed++)
    seen.add(
      resolveDiscards(one, 0, hands, Math.imul(seed, 0x9e3779b1)).records[0]
        .cards[0].name,
    );
  assert.equal(seen.size, 2);
  const chosen = placeStone(
    EMPTY_BOARD(),
    0,
    card("caster", [discard("chosen", "self", 1)]),
    0,
  ).board;
  assert.equal(
    resolveDiscards(
      chosen,
      0,
      hands,
      81,
      [{ keywordIndex: 0, owner: 0, cardIds: ["custom-plain-a"] }],
      false,
    ).records[0].cards[0].name,
    "plain-a",
  );
});
test("Parting Gift can buff its owner's board, remaining hand, or the discarding stone without mutating templates", () => {
  for (const target of ["allies", "hand", "discarder"] as const) {
    let board = placeStone(
      EMPTY_BOARD(),
      0,
      card("caster", [discard("chosen", "opponent", 1)]),
      0,
    ).board;
    board = placeStone(board, 8, card("enemy-board"), 1).board;
    const gift = card("gift", [
      {
        type: "parting-gift",
        target,
        pips: [{ side: 1, amount: 2 }],
        shields: [{ side: 2, amount: 1 }],
      },
    ]);
    const hands: [Stone[], Stone[]] = [
        baseHands(3, 0)[0],
        [gift, ...baseHands(3, 0)[1]],
      ],
      before = structuredClone({ board, hands });
    const result = resolveDiscards(
      board,
      0,
      hands,
      81,
      [{ keywordIndex: 0, owner: 1, cardIds: [gift.id] }],
      false,
    );
    if (target === "allies") {
      assert.equal(result.board[8]!.edges![1], 2);
      assert.equal(result.board[0]!.edges![1], 0);
    } else if (target === "discarder")
      assert.equal(result.board[0]!.edges![1], 2);
    else {
      const recipient = result.hands[1][0];
      assert.deepEqual(
        evaluateKeywords(recipient, result.board, 1).edges,
        [0, 2, 0, 0],
      );
      assert.equal(evaluateKeywords(recipient, result.board, 1).shields[2], 1);
      assert.ok(validateStone(recipient));
    }
    assert.deepEqual({ board, hands }, before);
  }
});
test("Scavenge watches the appropriate hand, never repeats captures, and Silence disables discard bonuses even on plain gifted cards", () => {
  let board = placeStone(
    EMPTY_BOARD(),
    0,
    card("caster", [
      discard("chosen", "self", 1),
      { type: "scavenge", from: "self", pips: [{ side: 1, amount: 3 }] },
    ]),
    0,
  ).board;
  board = placeStone(board, 1, card("defender", [], [0, 0, 0, 0]), 1).board;
  const hands = baseHands(3, 0);
  hands[0].push(
    card("extra", [
      { type: "parting-gift", target: "hand", pips: [{ side: 0, amount: 2 }] },
    ]),
  );
  const result = resolveDiscards(
    board,
    0,
    hands,
    81,
    [{ keywordIndex: 0, owner: 0, cardIds: ["custom-extra"] }],
    false,
  );
  assert.equal(result.board[0]!.edges![1], 3);
  assert.equal(
    result.board[1]!.owner,
    1,
    "post-capture buffs do not cause another capture",
  );
  const gifted = result.hands[0][0];
  board = placeStone(result.board, 8, gifted, 0).board;
  assert.equal(board[8]!.edges![0], 2);
  board = placeStone(board, 6, card("silencer", [{ type: "silence" }]), 1, [
    { keywordIndex: 0, boardIndex: 8 },
  ]).board;
  assert.equal(board[8]!.edges![0], 0);
  board = placeStone(board, 7, card("silencer-two", [{ type: "silence" }]), 1, [
    { keywordIndex: 0, boardIndex: 0 },
  ]).board;
  assert.equal(board[0]!.edges![1], 0);
});
test("hand gifts stay in battle, do not consume Next Play, and rotate correctly with Compass", () => {
  const prepared = prepare(3, [
    { type: "next-play", side: 0, amount: 2, recipient: "self" },
    summon,
    discard("chosen", "self", 1),
  ]);
  prepared.hands[0][0] = card("gift", [
    {
      type: "parting-gift",
      target: "hand",
      pips: [{ side: 0, amount: 2 }],
      shields: [{ side: 1, amount: 1 }],
    },
  ]);
  const result = resolveDiscards(
    prepared.board,
    0,
    prepared.hands,
    81,
    [{ keywordIndex: 2, owner: 0, cardIds: ["custom-gift"] }],
    false,
  );
  assert.equal(pendingPipEffects(result.board, 0).length, 1);
  const recipient = result.hands[0][0],
    rotated = rotatedPotionStone(recipient);
  assert.deepEqual(rotated.discardBuffs, {
    pips: [0, 2, 0, 0],
    shields: [0, 0, 1, 0],
  });
  assert.equal(
    tokenDefinition({
      ...DEFAULT_TOKENS[0],
      discardBuffs: recipient.discardBuffs,
    }),
    false,
  );
  assert.equal(
    pendingPipEffects(placeStone(result.board, 4, recipient, 0).board, 0)
      .length,
    0,
  );
});
for (const size of [3, 4] as const)
  test(`${size}×${size} Adventure cancels chosen discards, restores history, and can finish a heavy-discard battle`, () => {
    let run = enterAdventureNode(newAdventure(size, 81), "moss");
    const keywords: StoneKeyword[] = [
      summon,
      discard("chosen", "self", 2),
      scavenge,
    ];
    const source = { ...run.inventory[0], keywords };
    run.inventory[0] = source;
    run.battle!.hands[0][0] = source;
    const before = structuredClone(run);
    assert.throws(
      () => playAdventureCard(run, 0, 0, [], [], true),
      DiscardSelectionRequired,
    );
    assert.deepEqual(run, before);
    run = playAdventureCard(run, 0, 0);
    assert.ok(restoreAdventure(JSON.parse(JSON.stringify(run))));
    assert.ok(run.battle!.board[0]!.discards?.length);
    const bad = structuredClone(run);
    bad.battle!.board[0]!.discards![0].skipped = 99;
    assert.equal(validateAdventure(bad), false);
    let turns = 1;
    while (run.phase === "battle") {
      const battle = run.battle!,
        owner = battle.current,
        stone = battle.hands[owner][0];
      assert.ok(stone);
      const index = battle.board.findIndex((cell) => !cell);
      run = playAdventureCard(
        run,
        index,
        0,
        chooseKeywordTargets(battle.board, index, stone, owner),
      );
      assert.ok(++turns <= size * size);
    }
    assert.deepEqual(run.inventory, before.inventory);
  });
test("computer keepers choose legal victims and Draft saves retain old pools while new pools contain discard synergies", () => {
  const run = enterAdventureNode(newAdventure(4, 81), "moss");
  run.battle!.current = 1;
  run.battle!.hands[1][0] = {
    ...run.battle!.hands[1][0],
    keywords: [summon, discard("chosen", "self", 2), scavenge],
  };
  const next = adventureEnemyMove(run);
  assert.equal(next.battle!.current, 0);
  assert.ok(next.battle!.hands[1].length >= 7);
  const current = newDraft(3, 47, {}),
    old = newDraft(3, 47, {}, true, true, true, true, false);
  assert.equal(current.discardVersion, 1);
  assert.equal(old.discardVersion, undefined);
  for (const draft of [current, old])
    assert.deepEqual(
      restoreDraft(JSON.parse(JSON.stringify(draft)))!.cards,
      draft.cards,
    );
});
