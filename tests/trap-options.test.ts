import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_BOARD,
  STARTER_STONES,
  placeStone,
  chooseKeywordTargets,
  cardEdges,
  attackEdges,
  defenseEdges,
  evaluateKeywords,
  placedKeywords,
  validateKeywords,
  keywordShieldEdges,
} from "../src/game.ts";
import type { Stone, StoneKeyword, Board, Owner, Edges } from "../src/game.ts";
import {
  DEFAULT_TRAPS,
  TRAP_EFFECTS,
  defaultTrapEffect,
  validTrap,
  trapEdges,
  trapBonus,
  trapText,
  trapKeywordMultiplier,
  withTrap,
  trapStateFromBoard,
} from "../src/traps.ts";
import type { Trap, TrapEffect } from "../src/traps.ts";
import {
  pendingAmplify,
  scaleEffect,
  validRuntimeEffects,
} from "../src/amplify.ts";
import { applyConjure, CONJURE_CARDS } from "../src/conjure.ts";
import { resolveDiscards, discardPriority } from "../src/discard.ts";
import {
  newAdventure,
  enterAdventureNode,
  playAdventureCard,
  validateAdventure,
  restoreAdventure,
} from "../src/adventure.ts";
import { newDraft, restoreDraft } from "../src/draft.ts";

const card = (
  id: string,
  keywords: StoneKeyword[] = [],
  edges: Edges = [1, 1, 1, 1],
): Stone => ({
  ...STARTER_STONES[0],
  id: `custom-${id}`,
  name: id,
  element: "fire",
  edges,
  keywords,
});
const trap = (...effects: TrapEffect[]): Trap => ({
  id: "trap-test",
  name: "Test crystal",
  element: "magic",
  description: "Test",
  effects,
});
const amp = (effect: "all" | "conjure" | "shield" | "combo" = "all") =>
  trap({ kind: "amplify", effect });
const cast = (board: Board, index: number, stone: Stone, owner: Owner = 0) =>
  placeStone(
    board,
    index,
    stone,
    owner,
    chooseKeywordTargets(board, index, stone, owner),
  );
const summon: StoneKeyword = {
  type: "conjure",
  mode: "specific",
  card: "spyro",
  count: 5,
  recipient: "self",
};
const hand = (prefix: string, n = 6) =>
  Array.from({ length: n }, (_, i) => card(`${prefix}${i}`));

test("every Trap preset and editor default has a valid, readable, shareable definition", () => {
  assert.equal(DEFAULT_TRAPS.length, 18);
  for (const t of DEFAULT_TRAPS) {
    assert.ok(validTrap(t), t.name);
    assert.ok(
      validateKeywords([{ type: "trap", trap: JSON.parse(JSON.stringify(t)) }]),
    );
    assert.match(trapText(t), /both players/);
  }
  for (const kind of Object.keys(TRAP_EFFECTS) as TrapEffect["kind"][])
    assert.ok(validTrap(trap(defaultTrapEffect(kind))));
});
test("Trap validation accepts legacy directions and eight mixed effects, and rejects broken selections or recursive amplification", () => {
  assert.ok(validTrap(trap({ kind: "pips", side: 0, amount: 1 })));
  assert.ok(
    validTrap(
      trap(
        ...Object.keys(TRAP_EFFECTS)
          .slice(0, 8)
          .map((kind) => defaultTrapEffect(kind as TrapEffect["kind"])),
      ),
    ),
  );
  const malformed: unknown[] = [
    { kind: "pips", side: "all", sides: [], amount: 1 },
    { kind: "pips", side: "all", sides: [0, 0], amount: 1 },
    { kind: "pips", side: "all", sides: [4], amount: 1 },
    { kind: "pips", side: "all", sides: "north", amount: 1 },
    { kind: "pips", side: "all", amount: 0 },
    { kind: "pips", side: "all", amount: 6 },
    { kind: "multiply" },
    { kind: "ceiling", side: "all", maximum: 6 },
    { kind: "steady", minimum: 0 },
    { kind: "steady", minimum: 6 },
    { kind: "amplify", effect: "trap" },
    { kind: "amplify", effect: "amplify" },
    { kind: "amplify", effect: "flash" },
    { kind: "wat" },
  ];
  for (const effect of malformed)
    assert.equal(
      validTrap({ ...trap(), effects: [effect] }),
      false,
      JSON.stringify(effect),
    );
  assert.equal(validTrap(trap(...Array(9).fill({ kind: "mirror" }))), false);
});
test("selected sides override the legacy direction for ordinary, offensive, and defensive bonuses", () => {
  const t = trap(
    { kind: "pips", side: "all", sides: [0, 2], amount: 2 },
    { kind: "attack", side: 0, sides: [1, 3], amount: 1 },
    { kind: "defense", side: "all", sides: [2, 3], amount: 3 },
  );
  assert.deepEqual(trapEdges([1, 1, 1, 1], card("a"), t), [3, 1, 3, 1]);
  assert.deepEqual(trapBonus(t, card("a"), "attack"), [0, 1, 0, 1]);
  assert.deepEqual(trapBonus(t, card("a"), "defense"), [0, 0, 3, 3]);
  assert.match(trapText(t), /North & South/);
});
test("pip transformations run after additive pips, in listed order, without changing stored strengths", () => {
  const c = card("a", [], [1, 2, 3, 4]);
  const t = trap(
    { kind: "multiply", side: 0, sides: [0, 2] },
    { kind: "pips", side: 0, amount: 1 },
    { kind: "ceiling", side: 2, maximum: 5 },
  );
  const board = withTrap(cast(EMPTY_BOARD(), 0, c).board, t);
  assert.deepEqual(cardEdges(board[0]!), [4, 2, 5, 4]);
  assert.deepEqual(cardEdges(withTrap(board)[0]!), [1, 2, 3, 4]);
  assert.deepEqual(
    trapEdges([1, 2, 3, 4], c, trap({ kind: "mirror" })),
    [3, 4, 3, 4],
  );
  assert.deepEqual(
    trapEdges([1, 2, 3, 4], c, trap({ kind: "equalizer" })),
    [2, 2, 2, 2],
  );
  assert.deepEqual(
    trapEdges([1, 2, 3, 4], c, trap({ kind: "mirror" }, { kind: "equalizer" })),
    [3, 3, 3, 3],
  );
  assert.deepEqual(
    trapEdges([1, 2, 3, 4], c, trap({ kind: "equalizer" }, { kind: "mirror" })),
    [2, 2, 2, 2],
  );
  assert.deepEqual(
    trapEdges([99, 99, 99, 99], c, trap({ kind: "multiply", side: "all" })),
    [99, 99, 99, 99],
  );
  assert.deepEqual(
    trapEdges([0, 1, 0, 1], c, trap({ kind: "pips", side: "all", amount: -5 })),
    [0, 0, 0, 0],
  );
});
test("all new Trap rules follow combined element/tribe filters and inverted filters for both players", () => {
  const t = {
    ...amp(),
    affects: { element: "fire" as const, tribe: "giants" },
    effects: [
      { kind: "multiply", side: "all" },
      { kind: "amplify", effect: "conjure" },
    ] as TrapEffect[],
  };
  for (const owner of [0, 1] as const) {
    const giant = { ...card(`giant${owner}`), tribes: ["giants"] };
    const ordinary = card(`plain${owner}`);
    assert.deepEqual(trapEdges(giant.edges, giant, t), [2, 2, 2, 2]);
    assert.deepEqual(trapEdges(ordinary.edges, ordinary, t), [1, 1, 1, 1]);
    assert.equal(trapKeywordMultiplier(t, giant, "conjure"), 2);
    assert.equal(trapKeywordMultiplier(t, ordinary, "conjure"), 1);
    assert.equal(
      trapKeywordMultiplier(
        { ...t, affects: { ...t.affects, exclude: true } },
        ordinary,
        "conjure",
      ),
      2,
    );
  }
});
test("a stone’s new Trap changes its own capture before the previous crystal can apply", () => {
  let board = cast(EMPTY_BOARD(), 1, card("enemy", [], [1, 1, 1, 2]), 1).board;
  board = withTrap(board, trap({ kind: "ceiling", side: "all", maximum: 0 }));
  const result = cast(
    board,
    0,
    card(
      "attacker",
      [{ type: "trap", trap: trap({ kind: "multiply", side: 1 }) }],
      [0, 2, 0, 0],
    ),
  );
  assert.ok(result.captured.includes(1));
  assert.deepEqual(attackEdges(result.board[0]!), [0, 4, 0, 0]);
  assert.equal(trapStateFromBoard(result.board)!.active!.source, "attacker");
});
test("field doubling applies to Conjure for either player, combines with native Amplify, and does not mutate templates", () => {
  for (const owner of [0, 1] as const) {
    const source = card("summoner", [
      { type: "amplify", effect: "conjure", duration: "always" },
      summon,
    ]);
    const before = structuredClone(source);
    const board = withTrap(
      cast(EMPTY_BOARD(), 0, card("anchor")).board,
      amp("conjure"),
    );
    const result = cast(board, 8, source, owner);
    assert.equal(
      placedKeywords(result.board[8]!).find((k) => k.type === "conjure")!.count,
      20,
    );
    assert.equal(
      applyConjure(result.board, 8, [[], []], CONJURE_CARDS, 1).hands[owner]
        .length,
      20,
    );
    assert.ok(validRuntimeEffects(result.board[8]!.resolvedEffects));
    assert.deepEqual(source, before);
  }
});
test("the incoming Trap amplifies the caster and replacement stops future doubling", () => {
  const crystal = amp("conjure");
  let board = cast(
    EMPTY_BOARD(),
    0,
    card("caster", [{ type: "trap", trap: crystal }, summon]),
  ).board;
  assert.equal(
    placedKeywords(board[0]!).find((k) => k.type === "conjure")!.count,
    10,
  );
  board = cast(
    board,
    4,
    card("replacement", [
      { type: "trap", trap: trap({ kind: "pips", side: 0, amount: 1 }) },
    ]),
    1,
  ).board;
  board = cast(board, 8, card("later", [summon])).board;
  assert.equal(
    placedKeywords(board[8]!).find((k) => k.type === "conjure")!.count,
    5,
  );
  assert.equal(
    placedKeywords(board[0]!).find((k) => k.type === "conjure")!.count,
    10,
  );
});
test("field doubling stacks with a queued effect and consumes the queue once", () => {
  let board = cast(
    EMPTY_BOARD(),
    0,
    card("queue", [
      { type: "amplify", duration: "next", effect: "conjure", count: 1 },
    ]),
  ).board;
  board = withTrap(board, amp("conjure"));
  board = cast(board, 4, card("summon", [summon])).board;
  assert.equal(
    placedKeywords(board[4]!).find((k) => k.type === "conjure")!.count,
    20,
  );
  assert.equal(pendingAmplify(board, 0).length, 0);
});
test("field doubling never doubles Flash, Amplify queues, or Trap rules themselves", () => {
  const source = card("all", [
    { type: "flash" },
    { type: "amplify", duration: "next", effect: "all", count: 1 },
    { type: "trap", trap: amp() },
    summon,
  ]);
  const board = cast(EMPTY_BOARD(), 0, source).board;
  assert.equal(
    placedKeywords(board[0]!).filter((k) => k.type === "flash").length,
    1,
  );
  assert.equal(pendingAmplify(board, 0)[0].count, 1);
  assert.deepEqual(board[0]!.placedTrap!.effects, amp().effects);
  for (const type of ["trap", "amplify", "flash"] as const)
    assert.equal(trapKeywordMultiplier(amp(), source, type), 1);
});
test("native Amplify can scale numeric Trap bonuses while preserving new structural rules", () => {
  const crystal = trap(
    { kind: "pips", side: 0, sides: [0, 3], amount: 5 },
    { kind: "multiply", side: 2 },
    { kind: "amplify", effect: "conjure" },
    { kind: "steady", minimum: 2 },
  );
  const [scaled] = scaleEffect({ type: "trap", trap: crystal }, 4);
  assert.equal(scaled.trap.effects[0].amount, 20);
  assert.deepEqual(scaled.trap.effects.slice(1), crystal.effects.slice(1));
  assert.ok(validRuntimeEffects([scaled]));
  assert.equal(validTrap(scaled.trap), false);
  assert.ok(validTrap(scaled.trap, true));
});
test("Combo doubling applies once to both pip gifts and granted effects", () => {
  for (const target of ["combo", "all"] as const) {
    const board = withTrap(
      cast(EMPTY_BOARD(), 0, card("previous")).board,
      amp(target),
    );
    const c = card("combo", [
      {
        type: "combo",
        pips: [{ side: 0, amount: 1 }],
        keywords: [{ ...summon, count: 1 }],
      },
    ]);
    const result = cast(board, 8, c).board;
    assert.equal(result[8]!.edges![0], 3);
    assert.equal(
      placedKeywords(result[8]!).find((k) => k.type === "conjure")!.count,
      2,
    );
  }
});
test("conditional pip bonuses and Sunder are doubled once on play", () => {
  const board = withTrap(
    cast(EMPTY_BOARD(), 0, card("leader", [], [5, 1, 1, 1])).board,
    amp(),
  );
  const c = card("conditional", [
    { type: "head-start", side: 0, amount: 2 },
    { type: "comeback", side: 1, amount: 3 },
  ]);
  assert.deepEqual(evaluateKeywords(c, board, 0).edges, [5, 1, 1, 1]);
  assert.deepEqual(evaluateKeywords(c, board, 1).edges, [1, 7, 1, 1]);
  const result = cast(board, 8, c).board;
  assert.equal(cardEdges(withTrap(result)[8]!)[0], 5);
  const sunder = cast(
    board,
    4,
    card("sunder", [{ type: "sunder", side: 0, amount: 2 }]),
  );
  assert.equal(sunder.board[0]!.reductions![0], 4);
});
test("Shield doubling is a live aura on already played cards, excluding potion and discard counters", () => {
  let board = cast(
    EMPTY_BOARD(),
    0,
    card("guard", [{ type: "shield", side: 0, amount: 2 }]),
  ).board;
  board[0] = { ...board[0]!, shields: [5, 0, 0, 0] }; // two keyword pips plus three potion/counter pips
  const plain = structuredClone(board);
  board = withTrap(board, amp("shield"));
  assert.deepEqual(keywordShieldEdges(board[0]!), [2, 0, 0, 0]);
  assert.deepEqual(defenseEdges(board[0]!), [8, 1, 1, 1]);
  assert.deepEqual(attackEdges(board[0]!), [1, 1, 1, 1]);
  assert.deepEqual(defenseEdges(withTrap(board)[0]!), [6, 1, 1, 1]);
  assert.deepEqual(
    defenseEdges({ ...board[0]!, silenced: true }),
    [1, 1, 1, 1],
  );
  assert.deepEqual(plain[0]!.shields, [5, 0, 0, 0]);
});
test("Scavenge and Parting Gift use the Trap active at discard time", () => {
  const source = card("scrapper", [
    { type: "scavenge", from: "self", pips: [{ side: 0, amount: 1 }] },
    { type: "discard", mode: "random", recipient: "self", count: 1 },
  ]);
  const gift = card("gift", [
    { type: "discard-priority", priority: 5 },
    {
      type: "parting-gift",
      target: "discarder",
      shields: [{ side: 1, amount: 1 }],
    },
  ]);
  const before = cast(EMPTY_BOARD(), 0, source).board;
  const hands: [Stone[], Stone[]] = [[gift, ...hand("ours")], hand("theirs")];
  const boosted = resolveDiscards(withTrap(before, amp()), 0, hands, 1);
  assert.equal(boosted.board[0]!.edges![0], 3);
  assert.equal(boosted.board[0]!.shields![1], 2);
  const normal = resolveDiscards(withTrap(before), 0, hands, 1);
  assert.equal(normal.board[0]!.edges![0], 2);
  assert.equal(normal.board[0]!.shields![1], 1);
});
test("random discard priority can be doubled by a filtered Trap without weakening finishing protection", () => {
  const t = {
    ...trap({ kind: "amplify", effect: "discard-priority" }),
    affects: { element: "water" as const },
  };
  const a = card("low", [{ type: "discard-priority", priority: 2 }]);
  const b = {
    ...card("boosted", [{ type: "discard-priority", priority: 2 }]),
    element: "water" as const,
  };
  assert.equal(discardPriority(a, t), 2);
  assert.equal(discardPriority(b, t), 4);
  let board = cast(
    EMPTY_BOARD(),
    0,
    card("discard", [
      { type: "discard", mode: "random", recipient: "self", count: 5 },
    ]),
  ).board;
  board = withTrap(board, t);
  const result = resolveDiscards(
    board,
    0,
    [[a, b, ...hand("ours", 3)], hand("theirs", 5)],
    1,
  );
  assert.equal(result.records[0].cards.length, 1);
  assert.equal(result.records[0].cards[0].id, b.id);
  assert.equal(result.hands[0].length, 4);
});
test("a new steady Trap raises selected Dizzy sides before captures and respects stronger relic floors", () => {
  const crystal = trap({ kind: "steady", minimum: 3 });
  const dizzy = card(
    "dizzy",
    [
      { type: "trap", trap: crystal },
      { type: "dizzy", sides: [1, 3] },
    ],
    [0, 0, 0, 0],
  );
  const board = cast(
    EMPTY_BOARD(),
    1,
    card("target", [], [0, 0, 0, 2]),
    1,
  ).board;
  for (let seed = 1; seed < 30; seed++) {
    const result = placeStone(board, 0, dizzy, 0, [], { seed });
    assert.ok(result.captured.includes(1));
    assert.equal(result.board[0]!.edges![0], 0);
    assert.equal(result.board[0]!.edges![2], 0);
    assert.ok(
      result.board[0]!.edges![1] >= 3 && result.board[0]!.edges![1] <= 5,
    );
    assert.ok(
      result.board[0]!.edges![3] >= 3 && result.board[0]!.edges![3] <= 5,
    );
  }
  const relic = placeStone(board, 0, dizzy, 0, [], {
    seed: 1,
    minimumDizzyPips: 5,
  });
  assert.deepEqual(relic.board[0]!.edges, [0, 5, 0, 5]);
});
for (const size of [3, 4] as const)
  test(`${size}×${size} Adventure saves and restores mixed Trap rules and doubled runtime effects`, () => {
    let run = enterAdventureNode(newAdventure(size, 81), "moss");
    const crystal = trap(
      { kind: "pips", side: "all", sides: [0, 2], amount: 1 },
      { kind: "amplify", effect: "conjure" },
      { kind: "mirror" },
      { kind: "steady", minimum: 2 },
    );
    const c = {
      ...run.battle!.hands[0][0],
      keywords: [{ type: "trap", trap: crystal }, summon] as StoneKeyword[],
    };
    run = {
      ...run,
      battle: {
        ...run.battle!,
        hands: [[c, ...run.battle!.hands[0].slice(1)], run.battle!.hands[1]],
      },
    };
    run = playAdventureCard(run, 0, 0);
    assert.ok(validateAdventure(run));
    const restored = restoreAdventure(JSON.parse(JSON.stringify(run)));
    assert.ok(restored);
    assert.deepEqual(restored.battle!.traps!.active!.trap, crystal);
    assert.equal(
      placedKeywords(restored.battle!.board[0]!).find(
        (k) => k.type === "conjure",
      )!.count,
      10,
    );
    assert.deepEqual(
      cardEdges(restored.battle!.board[0]!),
      cardEdges(run.battle!.board[0]!),
    );
  });
test("Draft snapshots containing every new preset remain restorable", () => {
  for (let seed = 11; seed < 18; seed++)
    assert.ok(restoreDraft(JSON.parse(JSON.stringify(newDraft(4, seed)))));
});
