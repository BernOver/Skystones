import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_BOARD,
  STARTER_STONES,
  placeStone,
  castSpell,
  finishingCard,
  playableHand,
  chooseMove,
  chooseKeywordTargets,
  previousStone,
  validateStone,
} from "../src/game.ts";
import type { Stone, StoneKeyword, Board } from "../src/game.ts";
import {
  applyConjure,
  CONJURE_CARDS,
  validateConjure,
} from "../src/conjure.ts";
import { DEFAULT_SPELLS } from "../src/spellCards.ts";
import {
  tokenCatalogue,
  deckEligible,
  tokenDefinition,
} from "../src/tokens.ts";
import { resolveDiscards, validateDiscardRecords } from "../src/discard.ts";
import { pendingPipEffects, withTileEnvironments } from "../src/effects.ts";
import { pendingAmplify } from "../src/amplify.ts";
import { boardTrap, DEFAULT_TRAPS, trapStateFromBoard } from "../src/traps.ts";
import {
  newAdventure,
  enterAdventureNode,
  playAdventureCard,
  restoreAdventure,
  validateAdventure,
  adventureArena,
  adventureStoneForPlay,
} from "../src/adventure.ts";
import { useAdventurePotion } from "../src/potions.ts";
import { cardDependencies } from "../src/cardDependencies.ts";

const stone = (id: string, keywords: StoneKeyword[] = []): Stone => ({
  ...STARTER_STONES[0],
  id: `custom-${id}`,
  name: id,
  element: "magic",
  edges: [1, 1, 1, 1],
  keywords,
});
const spell = (
  id: string,
  keywords: StoneKeyword[],
  discard = false,
): Stone => ({
  ...stone(id, keywords),
  id: `custom-token-${id}`,
  spell: discard ? "discard" : "cast",
  token: true,
  conjured: true,
  edges: [0, 0, 0, 0],
});
const cards = (id: string, n = 8) =>
  Array.from({ length: n }, (_, i) => stone(`${id}${i}`));
const cast = (board: Board, card: Stone, owner: 0 | 1 = 0) =>
  placeStone(
    board,
    -1,
    card,
    owner,
    chooseKeywordTargets(board, -1, card, owner),
  );

test("casting a spell does not trigger Parting Gift, and discarding a castable spell does not cast it", () => {
  const card = spell("gift-spell", [
    { type: "conjure", mode: "random", count: 2, recipient: "self" },
    {
      type: "parting-gift",
      target: "hand",
      mode: "all",
      pips: [{ side: 0, amount: 2 }],
    },
  ]);
  const move = cast(EMPTY_BOARD(), card);
  const castResult = applyConjure(
    move.board,
    move.sourceIndex!,
    [cards("a"), cards("b")],
    CONJURE_CARDS,
    12,
  );
  assert.equal(castResult.hands[0].length, 10);
  assert.ok(castResult.hands[0].every((s) => !s.discardBuffs));
  const caster = stone("discarder", [
    { type: "discard", mode: "chosen", count: 1, recipient: "self" },
  ]);
  const board = placeStone(EMPTY_BOARD(), 0, caster, 0).board;
  const hands: [Stone[], Stone[]] = [[card, ...cards("a")], cards("b")];
  const pending = resolveDiscards(board, 0, hands, 1, [], false);
  assert.ok(pending.pending);
  assert.deepEqual(pending.board, board);
  assert.deepEqual(pending.hands, hands);
  const result = resolveDiscards(
    board,
    0,
    hands,
    1,
    [{ keywordIndex: 0, owner: 0, cardIds: [card.id] }],
    false,
  );
  assert.equal(result.hands[0].length, 8);
  assert.ok(
    result.hands[0].every(
      (s) => s.edges[0] === 1 && s.discardBuffs?.pips[0] === 2,
    ),
  );
  assert.equal(result.board.spellHistory, undefined);
});

test("nested discard-only spells resolve once in order, retain each source record, and replay deterministically", () => {
  const first = spell(
    "first",
    [{ type: "discard", mode: "random", recipient: "self", count: 1 }],
    true,
  );
  const second = spell(
    "second",
    [
      { type: "conjure", mode: "random", recipient: "self", count: 1 },
      { type: "discard-priority", priority: 99 },
    ],
    true,
  );
  const caster = stone("chain", [
    { type: "discard", mode: "chosen", recipient: "self", count: 1 },
  ]);
  const board = placeStone(EMPTY_BOARD(), 0, caster, 0).board;
  const hands: [Stone[], Stone[]] = [
    [first, second, ...cards("a")],
    cards("b"),
  ];
  const choices = [{ keywordIndex: 0, owner: 0 as const, cardIds: [first.id] }];
  const result = resolveDiscards(board, 0, hands, 18, choices, false);
  assert.equal(result.board.spellHistory?.length, 2);
  assert.deepEqual(
    result.board.spellHistory?.map((cell) => cell.stone.name),
    ["first", "second"],
  );
  assert.equal(result.board[0]?.discards?.[0].cards[0].id, first.id);
  assert.equal(
    result.board.spellHistory?.[0].discards?.[0].cards[0].id,
    second.id,
  );
  assert.equal(result.hands[0].length, 9);
  assert.deepEqual(
    resolveDiscards(board, 0, hands, 18, choices, false),
    result,
  );
});

test("a discarded spell reserves finishing stones using the original play’s next player", () => {
  const donor = spell(
    "disrupt",
    [{ type: "discard", mode: "random", recipient: "opponent", count: 1 }],
    true,
  );
  const caster = stone("discarder", [
    { type: "discard", mode: "chosen", recipient: "self", count: 1 },
  ]);
  const board = placeStone(
    placeStone(EMPTY_BOARD(), 8, stone("enemy"), 1).board,
    0,
    caster,
    0,
  ).board;
  const hands: [Stone[], Stone[]] = [[donor, ...cards("a", 3)], cards("b", 4)];
  const result = resolveDiscards(
    board,
    0,
    hands,
    17,
    [{ keywordIndex: 0, owner: 0, cardIds: [donor.id] }],
    false,
  );
  assert.equal(result.hands[1].length, 4);
  assert.equal(result.board.spellHistory?.[0].discards?.[0].skipped, 1);
});

test("spell templates validate, stay out of decks and normal Conjure, and are available through specified or random spell Conjure", () => {
  for (const template of DEFAULT_SPELLS) {
    assert.ok(validateStone(template), template.name);
    assert.ok(tokenDefinition(template));
    assert.equal(deckEligible(template), false);
    assert.equal(finishingCard(template), false);
  }
  for (const pool of ["cards", "tokens", "all", "spells"] as const) {
    const keyword: StoneKeyword = {
      type: "conjure",
      mode: "random",
      pool,
      count: 5,
      recipient: "both",
    };
    assert.ok(validateConjure(keyword));
    const board = placeStone(
      EMPTY_BOARD(),
      0,
      stone("maker", [keyword]),
      0,
    ).board;
    const result = applyConjure(board, 0, [[], []], CONJURE_CARDS, 1);
    assert.equal(result.hands.flat().length, 10);
    assert.ok(
      result.hands
        .flat()
        .every((card) => (pool === "spells" ? !!card.spell : !card.spell)),
    );
  }
  const key = DEFAULT_SPELLS[0].id;
  const maker = stone("specific", [
    { type: "conjure", mode: "token", token: key, count: 1, recipient: "self" },
  ]);
  const result = applyConjure(
    placeStone(EMPTY_BOARD(), 0, maker, 0).board,
    0,
    [[], []],
    CONJURE_CARDS,
    2,
  );
  assert.equal(result.hands[0][0].spell, "cast");
  assert.ok(result.hands[0][0].conjured);
  assert.equal(cardDependencies(maker).tokens[0].id, key);
});

for (const size of [3, 4] as const)
  test(`${size}×${size} spells resolve Sunder without occupancy, captures or turn cost; queues survive a later placement`, () => {
    const initial = placeStone(EMPTY_BOARD(size), 1, stone("enemy"), 1).board;
    const before = structuredClone(initial);
    const card = spell("hex", [
      { type: "sunder", side: "any", amount: 2 },
      { type: "next-play", side: "all", recipient: "self", amount: 1 },
    ]);
    const move = cast(initial, card);
    assert.equal(move.board.filter(Boolean).length, 1);
    assert.deepEqual(move.captured, []);
    assert.equal(move.keepsTurn, true);
    assert.ok(move.sourceIndex! < 0);
    assert.equal(move.board[1]!.owner, 1);
    assert.equal(
      move.board[1]!.edges!.reduce((a, b) => a + b),
      3,
    );
    assert.deepEqual(initial, before);
    assert.equal(previousStone(move.board, 0)?.name, "hex");
    assert.equal(pendingPipEffects(move.board, 0).length, 1);
    const placed = placeStone(
      move.board,
      size ** 2 - 1,
      stone("next"),
      0,
    ).board;
    assert.deepEqual(placed.at(-1)!.edges, [2, 2, 2, 2]);
    assert.equal(placed.spellHistory?.length, 1);
    assert.equal(pendingPipEffects(placed, 0).length, 0);
  });

test("spell Conjure records use an off-board source and resolve only once", () => {
  const card = spell("summon", [
    { type: "conjure", mode: "random", count: 2, recipient: "self" },
  ]);
  const move = cast(EMPTY_BOARD(), card);
  const result = applyConjure(
    move.board,
    move.sourceIndex!,
    [[], []],
    CONJURE_CARDS,
    8,
  );
  assert.equal(result.hands[0].length, 2);
  assert.equal(result.board.length, 9);
  assert.equal(result.board.filter(Boolean).length, 0);
  assert.equal(result.board.spellHistory?.[0].conjurations?.length, 1);
  assert.equal(
    applyConjure(
      result.board,
      move.sourceIndex!,
      result.hands,
      CONJURE_CARDS,
      8,
    ).hands[0].length,
    2,
  );
});

test("off-board Environment, Trap and next-use Amplify persist on an empty board", () => {
  const environment: StoneKeyword = {
    type: "environment",
    environment: { kind: "blight", amount: 1 },
  };
  const card = spell("field", [
    environment,
    { type: "trap", trap: DEFAULT_TRAPS[0] },
    { type: "amplify", effect: "sunder", duration: "next", count: 1 },
  ]);
  const move = placeStone(EMPTY_BOARD(), -1, card, 0, [
    { keywordIndex: 0, boardIndex: 4 },
  ]);
  assert.equal(boardTrap(move.board)?.id, DEFAULT_TRAPS[0].id);
  assert.equal(trapStateFromBoard(move.board)?.active?.source, "field");
  assert.equal(pendingAmplify(move.board, 0).length, 1);
  const placed = placeStone(
    withTileEnvironments(move.board),
    4,
    stone("resident"),
    0,
  ).board;
  assert.equal(placed[4]?.environment?.kind, "blight");
  assert.equal(boardTrap(placed)?.id, DEFAULT_TRAPS[0].id);
  assert.equal(placed.spellHistory?.length, 1);
});

test("discard-only spells cannot cast and automatically resolve their effects when discarded by either player", () => {
  for (const owner of [0, 1] as const) {
    const donor = spell(
      "broken",
      [
        { type: "conjure", mode: "random", count: 2, recipient: "self" },
        { type: "discard-priority", priority: 99 },
      ],
      true,
    );
    assert.throws(() => cast(EMPTY_BOARD(), donor, owner), /cannot be played/);
    assert.equal(playableHand([donor]), false);
    const caster = stone("discarder", [
      { type: "discard", mode: "random", count: 1, recipient: "opponent" },
    ]);
    const actor = (1 - owner) as 0 | 1;
    const board = placeStone(EMPTY_BOARD(), 0, caster, actor).board;
    const hands: [Stone[], Stone[]] = [cards("ours"), cards("theirs")];
    hands[owner].push(donor);
    const result = resolveDiscards(board, 0, hands, 4);
    assert.ok(!result.hands[owner].some((s) => s.id === donor.id));
    assert.equal(result.hands[owner].filter((s) => s.conjured).length, 2);
    assert.deepEqual(result.records[0].spells, [donor.name]);
    assert.ok(validateDiscardRecords(result.records));
    assert.equal(result.board.filter(Boolean).length, 1);
    assert.equal(previousStone(result.board, owner), undefined);
    assert.deepEqual(
      resolveDiscards(result.board, 0, result.hands, 4).hands,
      result.hands,
    );
  }
});

test("discard-only targeting favors the discarded spell’s owner and preserves Next Play waiting for a played card", () => {
  const waiting = cast(
    EMPTY_BOARD(),
    spell("waiting", [
      { type: "next-play", side: 0, amount: 2, recipient: "self" },
    ]),
  ).board;
  const enemy = placeStone(waiting, 8, stone("enemy"), 1).board;
  const discarder = stone("discarder", [
    { type: "discard", mode: "random", count: 1, recipient: "opponent" },
  ]);
  const board = placeStone(enemy, 0, discarder, 1).board;
  const donor = spell(
    "retaliate",
    [
      { type: "sunder", side: 1, amount: 2 },
      { type: "discard-priority", priority: 99 },
    ],
    true,
  );
  const result = resolveDiscards(
    board,
    0,
    [[...cards("a"), donor], cards("b")],
    2,
  );
  assert.ok(
    result.board.some((cell) => cell?.owner === 1 && cell.edges?.[1] === 0),
  );
  assert.equal(pendingPipEffects(result.board, 0).length, 1);
});

test("spell Discard uses current-player finishing requirements and never counts spells as finishing stones", () => {
  const donor = spell("unused", []);
  const move = cast(
    EMPTY_BOARD(),
    spell("discard", [
      { type: "discard", mode: "random", recipient: "self", count: 5 },
    ]),
  );
  const result = resolveDiscards(
    move.board,
    move.sourceIndex!,
    [[...cards("a", 5), donor], cards("b", 4)],
    10,
  );
  assert.equal(result.records[0].cards.length, 1);
  assert.equal(result.records[0].cards[0].id, donor.id);
  assert.equal(result.hands[0].length, 5);
});

test("AI casts playable spells without a tile and skips discard-only spells", () => {
  const hand = [
    spell("locked", [], true),
    spell("castable", [
      { type: "next-play", side: 0, amount: 1, recipient: "self" },
    ]),
    stone("friend"),
  ];
  const move = chooseMove(EMPTY_BOARD(), hand, cards("enemy"), 0);
  assert.equal(move.index, -1);
  assert.equal(move.cardIndex, 1);
  assert.equal(
    chooseMove(EMPTY_BOARD(), [hand[0], hand[2]], cards("enemy"), 0).cardIndex,
    1,
  );
});

test("casting a spell preserves Vanguard Banner and the boss element until the turn ends", () => {
  let run = enterAdventureNode(
    { ...newAdventure(3, 19), floor: 8, relics: ["vanguard-banner"] },
    "elemental-vortex",
  );
  const card = spell("free", [
    { type: "next-play", side: 0, amount: 1, recipient: "self" },
  ]);
  run = {
    ...run,
    battle: {
      ...run.battle!,
      hands: [[card, ...run.battle!.hands[0]], run.battle!.hands[1]],
    },
  };
  const aura = adventureArena(run);
  assert.deepEqual(adventureStoneForPlay(run, card).edges, [0, 0, 0, 0]);
  const casted = playAdventureCard(run, -1, 0);
  assert.deepEqual(adventureArena(casted), aura);
  assert.equal(casted.battle!.vanguardUsed, false);
  assert.deepEqual(
    adventureStoneForPlay(casted, stone("next")).edges,
    [2, 2, 2, 2],
  );
});

for (const size of [3, 4] as const)
  test(`${size}×${size} Adventure casts a spell without ending the turn, saves its queue, and preserves it across reload`, () => {
    let run = enterAdventureNode(newAdventure(size, 712), "moss");
    const card = spell("stored", [
      { type: "next-play", side: "all", amount: 1, recipient: "self" },
    ]);
    run = {
      ...run,
      battle: {
        ...run.battle!,
        hands: [[card, ...run.battle!.hands[0]], run.battle!.hands[1]],
      },
    };
    const before = run.battle!.board.filter(Boolean).length;
    const next = playAdventureCard(run, -1, 0);
    assert.equal(next.battle!.current, 0);
    assert.equal(next.battle!.board.filter(Boolean).length, before);
    assert.ok(!next.battle!.hands[0].some((s) => s.id === card.id));
    assert.ok(validateAdventure(next));
    const potted = useAdventurePotion(
      { ...next, potions: ["power"] },
      0,
      next.battle!.hands[0][0].id,
    );
    assert.equal(pendingPipEffects(potted.battle!.board, 0).length, 1);
    const restored = restoreAdventure(JSON.parse(JSON.stringify(potted)))!;
    assert.ok(restored);
    assert.equal(pendingPipEffects(restored.battle!.board, 0).length, 1);
    assert.equal(restored.battle!.spellHistory?.[0].stone.name, card.name);
    const spot = restored.battle!.board.findIndex((cell) => !cell);
    const played = playAdventureCard(restored, spot, 0);
    assert.equal(played.battle!.spellHistory?.length, 1);
    assert.equal(pendingPipEffects(played.battle!.board, 0).length, 0);
    assert.ok(validateAdventure(played));
  });
