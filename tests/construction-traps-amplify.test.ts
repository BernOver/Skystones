import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import {
  EMPTY_BOARD,
  STARTER_STONES,
  placeStone,
  chooseKeywordTargets,
  canPlace,
  boardFinished,
  cardEdges,
  attackEdges,
  defenseEdges,
  evaluateKeywords,
  effectiveKeywords,
  previousElement,
  validateStone,
  validateKeywords,
  placedKeywords,
  finishingCard,
} from "../src/game.ts";
import type { Stone, StoneKeyword, Board, Owner } from "../src/game.ts";
import {
  DEFAULT_TRAPS,
  withTrap,
  trapEdges,
  validTrapState,
  trapStateFromBoard,
} from "../src/traps.ts";
import type { Trap } from "../src/traps.ts";
import { DEFAULT_PARTS, combineParts, assembleParts } from "../src/assemble.ts";
import {
  SUPERCHARGER_PORTRAITS,
  SUPERCHARGER_VEHICLES,
} from "../src/superchargers.ts";
import {
  tokenCatalogue,
  tokenDefinition,
  deckEligible,
} from "../src/tokens.ts";
import {
  applyConjure,
  CONJURE_CARDS,
  validateConjurations,
} from "../src/conjure.ts";
import { uniqueDefinition, uniqueCatalogue } from "../src/unique.ts";
import {
  cardDependencies,
  mergeUniqueDefinitions,
} from "../src/cardDependencies.ts";
import { pendingAmplify, validRuntimeEffects } from "../src/amplify.ts";
import { pendingPipEffects, boardEnvironments } from "../src/effects.ts";
import { resolveDiscards, finishCardsRequired } from "../src/discard.ts";
import {
  newAdventure,
  enterAdventureNode,
  playAdventureCard,
  adventureEnemyMove,
  validateAdventure,
  restoreAdventure,
} from "../src/adventure.ts";
import { newDraft, restoreDraft } from "../src/draft.ts";
const card = (
  id: string,
  keywords: StoneKeyword[] = [],
  edges: Stone["edges"] = [1, 1, 1, 1],
): Stone => ({
  ...STARTER_STONES[0],
  id: `custom-${id}`,
  name: id,
  element: "fire",
  edges,
  keywords,
});
const cast = (board: Board, index: number, stone: Stone, owner: Owner = 0) =>
  placeStone(
    board,
    index,
    stone,
    owner,
    chooseKeywordTargets(board, index, stone, owner),
  );
const amp = (
  effect: "all" | "sunder" | "shield" | "conjure" | "combo" = "all",
  duration: "always" | "next" = "next",
  count = 1,
): StoneKeyword =>
  duration === "next"
    ? { type: "amplify", effect, duration, count }
    : { type: "amplify", effect, duration };
const summon: StoneKeyword = {
  type: "conjure",
  mode: "specific",
  card: "spyro",
  count: 2,
  recipient: "self",
};

test("Traps share one live slot, update both owners and all card types, and replace without accumulating", () => {
  let board = cast(EMPTY_BOARD(), 0, card("red")).board;
  board = cast(board, 8, { ...card("unique-red"), unique: true }, 1).board;
  board = cast(
    board,
    4,
    { ...card("token-red"), token: true, conjured: true },
    1,
  ).board;
  const trap: Trap = {
    ...DEFAULT_TRAPS[0],
    effects: [
      { kind: "pips", side: "all", amount: 2 },
      { kind: "attack", side: 1, amount: 1 },
      { kind: "defense", side: 3, amount: 3 },
    ],
  };
  const first = cast(
    board,
    2,
    card("trap-caster", [{ type: "trap", trap }]),
    0,
  );
  assert.ok(validTrapState(trapStateFromBoard(first.board)));
  for (const cell of first.board.filter((c) => !!c)) {
    assert.deepEqual(cardEdges(cell), [3, 3, 3, 3]);
    assert.deepEqual(attackEdges(cell), [3, 4, 3, 3]);
    assert.deepEqual(defenseEdges(cell), [3, 3, 3, 6]);
    assert.deepEqual(cell.edges, [1, 1, 1, 1]);
  }
  const replaced = cast(
    first.board,
    3,
    card("water-trapper", [{ type: "trap", trap: DEFAULT_TRAPS[1] }]),
    1,
  );
  assert.deepEqual(cardEdges(replaced.board[0]!), [1, 1, 1, 1]);
  assert.equal(
    new Set(replaced.board.filter((c) => !!c).map((c) => c.trap!.id)).size,
    1,
  );
  assert.deepEqual(cardEdges(withTrap(first.board)[0]!), [1, 1, 1, 1]);
});
test("Trap element/tribe filters affect both players and stay active through Silence and first placement", () => {
  const trap: Trap = {
    ...DEFAULT_TRAPS[0],
    affects: { tribe: "giants" },
    effects: [{ kind: "defense", side: "all", amount: 2 }],
  };
  const giant = { ...card("giant"), tribes: ["giants"] as Stone["tribes"] };
  const placed = placeStone(EMPTY_BOARD(), 0, giant, 0, [], { trap }).board;
  assert.deepEqual(
    defenseEdges({ ...placed[0]!, silenced: true }),
    [3, 3, 3, 3],
  );
  const normal = placeStone(placed, 8, card("ordinary"), 1).board;
  assert.deepEqual(defenseEdges(normal[8]!), [1, 1, 1, 1]);
  assert.deepEqual(
    trapEdges([1, 1, 1, 1], giant, {
      ...trap,
      effects: [{ kind: "pips", side: 0, amount: 2 }],
    }),
    [3, 1, 1, 1],
  );
  assert.equal(trapStateFromBoard(EMPTY_BOARD()), undefined);
});
test("Unique is deck playable, mutually exclusive with tokens, and absent from every normal Conjure source", () => {
  const unique = {
    ...card("unique"),
    unique: true as const,
    portrait: "spyro",
    characterKey: "spyro",
  };
  assert.ok(uniqueDefinition(unique));
  assert.ok(deckEligible(unique));
  assert.equal(validateStone({ ...unique, token: true }), false);
  assert.equal(tokenDefinition(unique), false);
  for (const keyword of [
    { ...summon },
    { type: "conjure", mode: "random", count: 5, recipient: "self" },
    {
      type: "conjure",
      mode: "random",
      pool: "all",
      count: 5,
      recipient: "self",
    },
  ] as StoneKeyword[]) {
    const board = cast(EMPTY_BOARD(), 0, card("caster", [keyword])).board;
    const result = applyConjure(board, 0, [[], []], [unique], 1, []);
    assert.equal(result.hands[0].length, 0);
  }
  for (const keyword of [
    {
      type: "conjure",
      mode: "unique",
      unique: unique.id,
      count: 2,
      recipient: "self",
    },
    {
      type: "conjure",
      mode: "random",
      pool: "unique",
      count: 2,
      recipient: "self",
    },
  ] as StoneKeyword[]) {
    assert.ok(validateKeywords([keyword]));
    const board = cast(EMPTY_BOARD(), 0, card("caster", [keyword])).board;
    const result = applyConjure(board, 0, [[], []], [], 1, [], [unique]);
    assert.equal(result.hands[0].length, 2);
    assert.ok(result.hands[0].every((c) => c.unique && !c.token && c.conjured));
  }
});
test("Unique and Part dependency bundles follow nested grants, cycles, and exact stable references", () => {
  const unique = {
    ...card("unique"),
    unique: true as const,
    keywords: [
      {
        type: "conjure",
        mode: "token",
        token: DEFAULT_PARTS[0].id,
        count: 1,
        recipient: "self",
      },
    ] as StoneKeyword[],
  };
  const token = {
    ...DEFAULT_PARTS[0],
    keywords: [
      {
        type: "conjure",
        mode: "unique",
        unique: unique.id,
        count: 1,
        recipient: "self",
      },
    ] as StoneKeyword[],
  };
  const caster = card("caster", [
    {
      type: "combo",
      keywords: [
        {
          type: "conjure",
          mode: "unique",
          unique: unique.id,
          count: 1,
          recipient: "self",
        },
      ],
    },
    { type: "assemble", count: 2 },
  ]);
  const dependencies = cardDependencies(caster, [token], [unique]);
  assert.deepEqual(
    dependencies.tokens.map((c) => c.id),
    [token.id],
  );
  assert.deepEqual(
    dependencies.uniques.map((c) => c.id),
    [unique.id],
  );
  assert.deepEqual(mergeUniqueDefinitions([], dependencies.uniques), [unique]);
  assert.throws(() => mergeUniqueDefinitions([], [{ ...unique, token: true }]));
  assert.throws(() => cardDependencies(caster, [], []));
  assert.equal(
    uniqueCatalogue(
      [],
      [{ ...unique, id: "skylander-spyro", portrait: "spyro" }],
    )[0].id,
    "custom-unique-default-spyro",
  );
});
test("all SuperCharger pictures include 20 base vehicles, 16 variants, and 4 additional character variants with bundled files", () => {
  assert.equal(SUPERCHARGER_VEHICLES.length, 36);
  assert.equal(SUPERCHARGER_PORTRAITS.length, 40);
  assert.equal(
    SUPERCHARGER_VEHICLES.filter((v) => v.source.includes("/Vehicles/")).length,
    20,
  );
  for (const portrait of SUPERCHARGER_PORTRAITS)
    assert.ok(
      existsSync(
        new URL(
          `../src/assets/characters/${portrait.id}.webp`,
          import.meta.url,
        ),
      ),
      portrait.name,
    );
});
test("Assemble draws only Parts, automatically pairs them, preserves duplicates and both Combo packages, and does not alter templates", () => {
  for (const part of DEFAULT_PARTS) assert.ok(tokenDefinition(part));
  const a = {
    ...DEFAULT_PARTS[0],
    keywords: [
      {
        type: "combo",
        pips: [{ side: 0, amount: 1 }],
        keywords: [{ type: "shield", side: 0 }],
      },
    ] as StoneKeyword[],
  };
  const b = {
    ...DEFAULT_PARTS[1],
    keywords: [
      {
        type: "combo",
        pips: [{ side: 1, amount: 2 }],
        keywords: [{ type: "shield", side: 0 }],
      },
    ] as StoneKeyword[],
  };
  const hand = combineParts([a, card("regular"), b]);
  assert.equal(hand.length, 2);
  const vehicle = hand.find((c) => c.supercharger)!;
  assert.ok(validateStone(vehicle));
  assert.ok(vehicle.keywords?.some((k) => k.type === "flash"));
  assert.equal(vehicle.keywords?.filter((k) => k.type === "combo").length, 2);
  assert.deepEqual(vehicle.edges, [2, 1, 1, 0]);
  assert.equal(deckEligible(vehicle), false);
  assert.equal(vehicle.token, undefined);
  const board = cast(EMPTY_BOARD(), 8, {
    ...card("previous"),
    element: vehicle.element,
  }).board;
  assert.equal(evaluateKeywords(vehicle, board, 0).edges[0], 3);
  assert.equal(evaluateKeywords(vehicle, board, 0).edges[1], 3);
  assert.equal(evaluateKeywords(vehicle, board, 0).shields[0], 2);
  const source = cast(
    EMPTY_BOARD(),
    0,
    card("builder", [{ type: "assemble", count: 5 }]),
  ).board;
  const assembled = assembleParts(source, 0, [[], []], 91, tokenCatalogue());
  assert.equal(assembled.hands[0].filter((c) => c.supercharger).length, 2);
  assert.equal(assembled.hands[0].filter((c) => c.part).length, 1);
  assert.deepEqual(DEFAULT_PARTS[0].edges, [1, 1, 0, 0]);
});
test("Flash Superchargers remain coverable even on a full board and either player inherits pips and on-play effects, excluding Flash", () => {
  const vehicle = combineParts([
    { ...DEFAULT_PARTS[0], keywords: [summon] },
    { ...DEFAULT_PARTS[1], keywords: [{ type: "sunder", side: 1 }] },
  ])[0];
  let board = EMPTY_BOARD();
  for (let i = 0; i < 8; i++)
    board = cast(board, i, card(`plain${i}`), 1).board;
  const flashed = cast(board, 8, vehicle);
  assert.equal(flashed.keepsTurn, true);
  assert.equal(boardFinished(flashed.board), false);
  assert.equal(canPlace(flashed.board, 8), true);
  const covered = cast(flashed.board, 8, card("cover"), 1);
  assert.equal(covered.keepsTurn, undefined);
  assert.ok(!covered.board[8]!.stone.supercharger);
  assert.equal(boardFinished(covered.board), true);
  assert.ok(
    covered.board[8]!.stone.keywords?.some((k) => k.type === "conjure"),
  );
  const result = applyConjure(covered.board, 8, [[], []], CONJURE_CARDS, 1);
  assert.equal(result.hands[1].length, 2);
  assert.ok(covered.board[8]!.history?.length);
  assert.ok(covered.board[8]!.edges![0] >= 2);
  assert.ok(covered.captured.includes(8));
});
test("covering retains Next Play, tile environments, Amplify queues, and previous-player Combo history", () => {
  const vehicle = combineParts([
    {
      ...DEFAULT_PARTS[0],
      keywords: [
        { type: "next-play", side: 0, amount: 1, recipient: "self" },
        { type: "environment", environment: { kind: "bastion", amount: 1 } },
        amp("sunder"),
      ],
    },
    { ...DEFAULT_PARTS[1], keywords: [] },
  ])[0];
  const board = cast(EMPTY_BOARD(), 4, vehicle).board;
  const covered = cast(
    board,
    4,
    { ...card("opponent"), element: "water" },
    1,
  ).board;
  assert.equal(previousElement(covered, 0), "fire");
  assert.equal(pendingPipEffects(covered, 0).length, 1);
  assert.equal(pendingAmplify(covered, 0).length, 1);
  assert.ok(boardEnvironments(covered).some((e) => e?.kind === "bastion"));
  assert.equal(evaluateKeywords(card("receiver"), covered, 0).edges[0], 2);
});
test("Amplify doubles a selected magnitude or all own effects without changing base pips, and resolutions survive validation", () => {
  const stone = card("amp", [
    amp("all", "always"),
    { type: "shield", side: 0, amount: 2 },
    summon,
    { type: "next-play", side: "all", amount: -1, recipient: "opponent" },
  ]);
  const board = cast(EMPTY_BOARD(), 0, stone).board;
  assert.deepEqual(board[0]!.edges, [1, 1, 1, 1]);
  assert.equal(defenseEdges(board[0]!)[0], 5);
  assert.equal(board[0]!.queuedPips![0].amount, -2);
  assert.ok(validRuntimeEffects(board[0]!.resolvedEffects));
  const result = applyConjure(board, 0, [[], []], CONJURE_CARDS, 1);
  assert.equal(result.hands[0].length, 4);
  assert.ok(validateConjurations(result.conjurations, true));
  const only = card("amp-specific", [
    amp("shield", "always"),
    { type: "shield", side: 0 },
    summon,
  ]);
  const placed = cast(EMPTY_BOARD(), 0, only).board;
  assert.equal(placed[0]!.shields![0], 2);
  assert.equal(
    applyConjure(placed, 0, [[], []], CONJURE_CARDS, 1).hands[0].length,
    2,
  );
});
test("one-use Amplify waits for the matching effect, belongs to its caster, consumes once, and never doubles later copies", () => {
  let board = cast(EMPTY_BOARD(), 0, card("queue", [amp("sunder")])).board;
  board = cast(
    board,
    8,
    card("unrelated", [{ type: "shield", side: 0 }]),
    0,
  ).board;
  assert.equal(pendingAmplify(board, 0)[0].count, 1);
  const rival = cast(board, 7, card("rival", [{ type: "sunder", side: 0 }]), 1);
  assert.equal(pendingAmplify(rival.board, 0)[0].count, 1);
  const stone = card("double", [
    { type: "sunder", side: 0, amount: 2 },
    { type: "sunder", side: 1, amount: 2 },
  ]);
  const effective = effectiveKeywords(stone, board, 0).filter(
    (k) => k.type === "sunder",
  );
  assert.equal(effective[0].amount, 4);
  assert.equal(effective[1].amount, 2);
  board = cast(board, 1, stone).board;
  assert.equal(pendingAmplify(board, 0).length, 0);
  assert.equal(
    effectiveKeywords(stone, board, 0).filter((k) => k.type === "sunder")[0]
      .amount,
    2,
  );
  assert.equal(board[0]!.stone.keywords![0].type, "amplify");
});
test("next all with two uses matches printed effect order, skips inactive score conditions, and active pip-only Combo consumes one use", () => {
  let board = cast(
    EMPTY_BOARD(),
    0,
    card("queue", [amp("all", "next", 2)]),
  ).board;
  const stone = card("receiver", [
    { type: "comeback", side: 0 },
    { type: "shield", side: 0 },
    { type: "shield", side: 1 },
  ]);
  const plan = effectiveKeywords(stone, board, 0).filter(
    (k) => k.type === "shield",
  );
  assert.deepEqual(
    plan.map((k) => k.amount),
    [2, 2],
  );
  board = cast(board, 1, stone).board;
  assert.equal(pendingAmplify(board, 0).length, 0);
  const queued = cast(EMPTY_BOARD(), 0, card("queue", [amp("combo")])).board;
  const combo = card("combo", [
    { type: "combo", pips: [{ side: 0, amount: 2 }] },
  ]);
  assert.equal(evaluateKeywords(combo, queued, 0).edges[0], 5);
  const result = cast(queued, 1, combo);
  assert.equal(pendingAmplify(result.board, 0).length, 0);
});
test("amplified Next Play keyword gifts are retained at their stronger value on the next card", () => {
  const board = cast(
    EMPTY_BOARD(),
    0,
    card("giver", [
      amp("all", "always"),
      {
        type: "next-play",
        side: "all",
        amount: 0,
        recipient: "self",
        keywords: [
          {
            type: "conjure",
            mode: "specific",
            card: "spyro",
            count: 5,
            recipient: "self",
          },
        ],
      },
    ]),
  ).board;
  const receiving = cast(board, 1, card("receiver")).board;
  assert.ok(receiving[1]!.stone.runtimeEffects);
  assert.equal(
    placedKeywords(receiving[1]!).find((k) => k.type === "conjure")!.count,
    10,
  );
  assert.ok(validateStone(receiving[1]!.stone));
  assert.equal(
    applyConjure(receiving, 1, [[], []], CONJURE_CARDS, 1).hands[0].length,
    10,
  );
});
test("discard protection reserves finishing stones rather than loose Parts or temporary vehicles, including Flash extra turns", () => {
  const vehicle = combineParts(DEFAULT_PARTS.slice(0, 2))[0],
    board = cast(
      EMPTY_BOARD(),
      0,
      card("discard", [
        { type: "discard", mode: "random", recipient: "self", count: 5 },
      ]),
    ).board;
  const hand = [
    ...Array.from({ length: 4 }, (_, i) => card(`finish${i}`)),
    { ...DEFAULT_PARTS[0], conjured: true as const },
    vehicle,
  ];
  const result = resolveDiscards(
    board,
    0,
    [hand, Array.from({ length: 5 }, (_, i) => card(`enemy${i}`))],
    1,
  );
  assert.equal(result.hands[0].filter(finishingCard).length, 4);
  assert.equal(result.records[0].cards.length, 2);
  assert.equal(result.records[0].skipped, 3);
  assert.deepEqual(finishCardsRequired(board, 1), [4, 4]);
});
for (const size of [3, 4] as const)
  test(`${size}×${size} Adventure saves Traps, Amplify, assembled vehicles and Flash actions, restores safely, and the AI can cover vehicles`, () => {
    let run = enterAdventureNode(newAdventure(size, 51), "moss");
    const builder = {
      ...run.battle!.hands[0][0],
      keywords: [
        { type: "assemble", count: 2 },
        { type: "trap", trap: DEFAULT_TRAPS[0] },
        amp("shield", "next", 2),
      ] as StoneKeyword[],
    };
    run = {
      ...run,
      battle: {
        ...run.battle!,
        hands: [
          [builder, ...run.battle!.hands[0].slice(1)],
          run.battle!.hands[1],
        ],
      },
    };
    run = playAdventureCard(run, 0, 0);
    assert.ok(run.battle!.hands[0].some((c) => c.supercharger));
    assert.ok(validateAdventure(run));
    assert.ok(restoreAdventure(JSON.parse(JSON.stringify(run))));
    run = adventureEnemyMove(run);
    const index = run.battle!.hands[0].findIndex((c) => c.supercharger),
      vehicle = run.battle!.hands[0][index];
    const target = run.battle!.board.findIndex((c) => !c),
      targets = chooseKeywordTargets(run.battle!.board, target, vehicle, 0);
    const oldTurns = run.battle!.turns,
      oldTurnNumber = run.battle!.turnNumber;
    run = playAdventureCard(run, target, index, targets);
    assert.equal(run.battle!.current, 0);
    assert.equal(run.battle!.turns, oldTurns + 1);
    assert.equal(run.battle!.turnNumber, oldTurnNumber);
    assert.ok(validateAdventure(run));
    const restored = restoreAdventure(JSON.parse(JSON.stringify(run)));
    assert.ok(restored);
    assert.equal(
      restored.battle!.board[target]!.stone.supercharger?.parts.length,
      2,
    );
    const covered = playAdventureCard(
      restored,
      target,
      0,
      chooseKeywordTargets(
        restored.battle!.board,
        target,
        restored.battle!.hands[0][0],
        0,
      ),
    );
    assert.equal(covered.battle!.current, 1);
    assert.ok(validateAdventure(covered));
  });
test("new Draft construction keyword pools restore, while older pools remain compatible without those effects", () => {
  const fresh = newDraft(4, 15);
  assert.ok(fresh.constructionVersion);
  assert.ok(restoreDraft(JSON.parse(JSON.stringify(fresh))));
  for (const type of ["assemble", "flash", "amplify"])
    assert.ok(
      fresh.cards.some((c) => c.keywords?.some((k) => k.type === type)),
    );
  const old = newDraft(3, 15, {}, true, true, true, true, true, false);
  assert.equal(old.constructionVersion, undefined);
  assert.ok(restoreDraft(old));
  assert.equal(
    old.cards.some((c) =>
      c.keywords?.some((k) =>
        ["assemble", "flash", "amplify"].includes(k.type),
      ),
    ),
    false,
  );
});

test("Amplify repeats positional Shift effects and doubles Combo keyword gifts without discarding duplicates", () => {
  const shift = card("shift", [
    amp("all", "always"),
    { type: "shift", side: 1, direction: 2, affects: "both" },
  ]);
  assert.equal(
    effectiveKeywords(shift, EMPTY_BOARD(), 0).filter((k) => k.type === "shift")
      .length,
    2,
  );
  const giver = card("gift", [
    amp("all", "always"),
    {
      type: "next-play",
      side: 0,
      amount: 0,
      recipient: "self",
      keywords: [
        {
          type: "combo",
          pips: [{ side: 0, amount: 2 }],
          keywords: [{ type: "shield", side: 1 }],
        },
      ],
    },
  ]);
  const source = cast(EMPTY_BOARD(), 0, giver).board,
    next = cast(source, 1, card("receiver")).board;
  assert.equal(next[1]!.edges![0], 5);
  assert.equal(next[1]!.shields![1], 2);
});
test("amplified terrain and high-count Conjure effects survive Adventure saves, and inactive queues remain ready", () => {
  let run = enterAdventureNode(newAdventure(3, 81), "moss");
  const base = run.battle!.hands[0][0],
    first = {
      ...base,
      keywords: [
        amp("all", "always"),
        { type: "environment", environment: { kind: "bastion", amount: 5 } },
        { ...summon, count: 5 },
      ] as StoneKeyword[],
    };
  run = {
    ...run,
    battle: {
      ...run.battle!,
      hands: [[first, ...run.battle!.hands[0].slice(1)], run.battle!.hands[1]],
    },
  };
  run = playAdventureCard(run, 0, 0, [{ keywordIndex: 1, boardIndex: 4 }]);
  assert.ok(validateAdventure(run));
  assert.ok(restoreAdventure(JSON.parse(JSON.stringify(run))));
  assert.equal(run.battle!.board[0]!.conjurations![0].cards.length, 10);
});
