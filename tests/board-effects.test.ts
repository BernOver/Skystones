import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_BOARD,
  STARTER_STONES,
  placeStone,
  cardEdges,
  attackEdges,
  defenseEdges,
  withArenaElement,
  evaluateKeywords,
  prepareTargeting,
  chooseMove,
  validateKeywords,
} from "../src/game.ts";
import type { Board, Edges, Stone, StoneKeyword } from "../src/game.ts";
import {
  ENVIRONMENTS,
  boardEnvironments,
  defaultEnvironment,
  pendingPipEffects,
  nextPipModifiers,
} from "../src/effects.ts";
import type {
  EffectSide,
  EnvironmentKind,
  TileEnvironment,
} from "../src/effects.ts";
import {
  newAdventure,
  enterAdventureNode,
  playAdventureCard,
  restoreAdventure,
  validateAdventure,
  adventureFusionPreview,
} from "../src/adventure.ts";
import { rotatedPotionStone, useAdventurePotion } from "../src/potions.ts";
import { newDraft, restoreDraft } from "../src/draft.ts";
const stone = (
  edges: Edges = [1, 1, 1, 1],
  keywords: StoneKeyword[] = [],
  suffix = "test",
): Stone => ({
  ...STARTER_STONES[0],
  id: `custom-effects-${suffix}`,
  name: `Effects ${suffix}`,
  edges,
  keywords,
  custom: true,
});
const next = (
  side: EffectSide,
  amount = 1,
  recipient: "self" | "opponent" = "self",
): StoneKeyword => ({ type: "next-play", side, amount, recipient });
const terrain = (environment: TileEnvironment): StoneKeyword => ({
  type: "environment",
  environment,
});
const cast = (
  board: Board,
  target: number,
  environment: TileEnvironment,
  index = 0,
) =>
  placeStone(
    board,
    index,
    stone([0, 0, 0, 0], [terrain(environment)], `caster-${index}`),
    0,
    [{ keywordIndex: 0, boardIndex: target }],
  ).board;

test("the four Next Play variants apply once, after any opponent turn, without changing the caster or printed card", () => {
  for (const [side, amount, expected] of [
    [0, 1, [2, 1, 1, 1]],
    ["all", 1, [2, 2, 2, 2]],
    [0, -1, [0, 1, 1, 1]],
    ["all", -1, [0, 0, 0, 0]],
  ] as [EffectSide, number, Edges][]) {
    const caster = stone([0, 0, 0, 0], [next(side, amount)]);
    let board = placeStone(EMPTY_BOARD(), 0, caster, 0).board;
    assert.deepEqual(board[0]!.edges, caster.edges);
    board = placeStone(board, 8, stone(), 1).board;
    assert.equal(pendingPipEffects(board, 0).length, 1);
    const card = stone();
    assert.deepEqual(evaluateKeywords(card, board, 0).edges, expected);
    board = placeStone(board, 1, card, 0).board;
    assert.deepEqual(board[1]!.edges, expected);
    assert.deepEqual(card.edges, [1, 1, 1, 1]);
    assert.equal(pendingPipEffects(board, 0).length, 0);
    assert.deepEqual(
      placeStone(board, 2, stone(), 0).board[2]!.edges,
      [1, 1, 1, 1],
    );
  }
});
test("Next Play stacks, targets the original player after capture, and survives Silence of its caster", () => {
  let board = placeStone(
    EMPTY_BOARD(),
    0,
    stone([0, 0, 0, 0], [next(0), next("all"), next(1, -1), next("all", -1)]),
    0,
  ).board;
  board = placeStone(board, 1, stone([0, 0, 0, 5]), 1).board;
  assert.equal(board[0]!.owner, 1);
  assert.deepEqual(nextPipModifiers(board, 0), [1, -1, 0, 0]);
  board = placeStone(board, 3, stone([1, 1, 1, 1], [{ type: "silence" }]), 0, [
    { keywordIndex: 0, boardIndex: 0 },
  ]).board;
  assert.deepEqual(board[3]!.edges, [2, 0, 1, 1]);
  assert.equal(board[0]!.silenced, true);
  assert.equal(pendingPipEffects(board, 0).length, 0);
});
test("opponent effects and canceled target choices spend no other player’s pending effects", () => {
  const board = placeStone(
    EMPTY_BOARD(),
    0,
    stone([0, 0, 0, 0], [next("all", -1, "opponent"), next(0, 2)]),
    0,
  ).board;
  const original = structuredClone(board);
  const targeted = stone(
    [1, 1, 1, 1],
    [terrain(defaultEnvironment("bastion"))],
  );
  const preview = prepareTargeting(board, targeted, [], 1);
  assert.ok(preview.pending);
  assert.deepEqual(board, original);
  assert.equal(pendingPipEffects(board, 1).length, 1);
  const played = placeStone(board, 4, targeted, 1, [
    { keywordIndex: 0, boardIndex: 8 },
  ]).board;
  assert.deepEqual(played[4]!.edges, [0, 0, 0, 0]);
  assert.equal(pendingPipEffects(played, 1).length, 0);
  assert.equal(pendingPipEffects(played, 0).length, 1);
});
test("inherited pips survive Silence and recorded damage, while Dizzy still rolls selected sides last", () => {
  let board = placeStone(
    EMPTY_BOARD(),
    0,
    stone([0, 0, 0, 0], [next(0, 2)]),
    0,
  ).board;
  board = placeStone(
    board,
    1,
    stone([1, 1, 1, 1], [{ type: "head-start", side: 0 }]),
    0,
  ).board;
  assert.equal(board[1]!.edges![0], 4);
  board = placeStone(
    board,
    2,
    stone([0, 0, 0, 0], [{ type: "sunder", side: 0 }, { type: "silence" }]),
    1,
    [
      { keywordIndex: 0, boardIndex: 1 },
      { keywordIndex: 1, boardIndex: 1 },
    ],
  ).board;
  assert.equal(board[1]!.edges![0], 2);
  const damaged = enterAdventureNode(
    { ...newAdventure(3, 81), potions: ["mend"] },
    "moss",
  );
  damaged.battle!.board = board;
  const repaired = useAdventurePotion(damaged, 0, 1);
  assert.equal(repaired.battle!.board[1]!.edges![0], 3);
  assert.deepEqual(repaired.battle!.board[1]!.inheritedPips, [2, 0, 0, 0]);
  const queued = placeStone(
    EMPTY_BOARD(),
    0,
    stone([0, 0, 0, 0], [next("all")]),
    0,
  ).board;
  const dizzy = placeStone(
    queued,
    4,
    stone([4, 4, 0, 0], [{ type: "dizzy", sides: [0] }]),
    0,
    [],
    { seed: 42 },
  ).board[4]!;
  assert.deepEqual(dizzy.dizzy!.before, [5, 5, 1, 1]);
  assert.ok(dizzy.edges![0] >= 0 && dizzy.edges![0] <= 5);
  assert.deepEqual(dizzy.edges!.slice(1), [5, 1, 1]);
});
test("all seven environments change the appropriate ordinary, attack, or defense values without rewriting printed pips", () => {
  const expected: Record<EnvironmentKind, Edges> = {
    elemental: [1, 2, 5, 4],
    blight: [0, 0, 3, 2],
    bastion: [0, 1, 4, 3],
    "war-banner": [0, 1, 4, 3],
    crosswind: [3, 0, 1, 4],
    "mirror-pool": [4, 3, 4, 3],
    equalizer: [2, 2, 2, 2],
  };
  for (const kind of Object.keys(ENVIRONMENTS) as EnvironmentKind[]) {
    const environment = defaultEnvironment(kind, "fire");
    const card = {
      ...stone([0, 1, 4, 3], [terrain(environment)]),
      element: "fire" as const,
    };
    const placed = placeStone(EMPTY_BOARD(), 4, card, 0, [
      { keywordIndex: 0, boardIndex: 4 },
    ]).board[4]!;
    assert.deepEqual(cardEdges(placed), expected[kind]);
    assert.deepEqual(placed.stone.edges, [0, 1, 4, 3]);
    assert.deepEqual(
      attackEdges(placed),
      expected[kind].map((edge) => edge + (kind === "war-banner" ? 1 : 0)),
    );
    assert.deepEqual(
      defenseEdges(placed),
      expected[kind].map((edge) => edge + (kind === "bastion" ? 1 : 0)),
    );
  }
});
test("Elemental Spring checks the occupant’s element and supports a single side; Blight stops at zero", () => {
  const environment: TileEnvironment = {
    kind: "elemental",
    element: "water",
    side: 1,
    amount: 2,
  };
  const board = cast(EMPTY_BOARD(), 4, environment);
  const water = placeStone(board, 4, { ...stone(), element: "water" }, 1)
    .board[4]!;
  assert.deepEqual(cardEdges(water), [1, 3, 1, 1]);
  const fire = placeStone(board, 4, { ...stone(), element: "fire" }, 1)
    .board[4]!;
  assert.deepEqual(cardEdges(fire), [1, 1, 1, 1]);
  const blighted = placeStone(
    cast(EMPTY_BOARD(), 4, { kind: "blight", side: 0, amount: 5 }),
    4,
    stone(),
    1,
  ).board[4]!;
  assert.deepEqual(cardEdges(blighted), [0, 1, 1, 1]);
});
test("terrain can target every empty or occupied tile on either board size and affects captures immediately", () => {
  for (const size of [3, 4] as const) {
    let board = placeStone(EMPTY_BOARD(size), 5, stone([0, 0, 0, 2]), 1).board;
    const card = stone(
      [0, 2, 0, 0],
      [terrain({ kind: "blight", side: 3, amount: 1 })],
    );
    assert.equal(
      prepareTargeting(board, card, [], 0).pending!.candidates.length,
      size * size,
    );
    const result = placeStone(board, 4, card, 0, [
      { keywordIndex: 0, boardIndex: 5 },
    ]);
    assert.deepEqual(result.captured, [5]);
    assert.equal(cardEdges(result.board[5]!)[3], 1);
    assert.equal(result.board[5]!.stone.edges[3], 2);
  }
});
test("War Banner captures with its attack bonus; Bastion never grants attack and keeps defending after Silence", () => {
  const rival = placeStone(EMPTY_BOARD(), 5, stone([0, 0, 0, 1]), 1).board;
  const attack = placeStone(
    rival,
    4,
    stone([0, 1, 0, 0], [terrain(defaultEnvironment("war-banner"))]),
    0,
    [{ keywordIndex: 0, boardIndex: 4 }],
  );
  assert.deepEqual(attack.captured, [5]);
  const defense = placeStone(
    rival,
    4,
    stone([0, 1, 0, 0], [terrain(defaultEnvironment("bastion"))]),
    0,
    [{ keywordIndex: 0, boardIndex: 4 }],
  );
  assert.deepEqual(defense.captured, []);
  const silenced = placeStone(
    defense.board,
    0,
    stone([0, 0, 0, 0], [{ type: "silence" }]),
    1,
    [{ keywordIndex: 0, boardIndex: 4 }],
  ).board[4]!;
  assert.equal(silenced.silenced, true);
  assert.deepEqual(defenseEdges(silenced), [1, 2, 1, 1]);
});
test("new terrain replaces old terrain on the tile and completed casts survive capture and Silence", () => {
  let board = cast(EMPTY_BOARD(), 4, defaultEnvironment("bastion"));
  board = placeStone(board, 1, stone([0, 0, 0, 5], [{ type: "silence" }]), 1, [
    { keywordIndex: 0, boardIndex: 0 },
  ]).board;
  assert.equal(board[0]!.silenced, true);
  assert.equal(boardEnvironments(board)[4]!.kind, "bastion");
  board = placeStone(
    board,
    2,
    stone(
      [0, 0, 0, 0],
      [
        terrain(defaultEnvironment("mirror-pool")),
        terrain(defaultEnvironment("equalizer")),
      ],
    ),
    0,
    [
      { keywordIndex: 0, boardIndex: 4 },
      { keywordIndex: 1, boardIndex: 4 },
    ],
  ).board;
  assert.equal(boardEnvironments(board)[4]!.kind, "equalizer");
  const placed = placeStone(board, 4, stone([4, 0, 2, 0]), 1).board[4]!;
  assert.deepEqual(cardEdges(placed), [1, 1, 1, 1]);
});
test("Adventure saves pending effects and empty terrain; swaps keep terrain on its tile and do not requeue Next Play", () => {
  let run = enterAdventureNode(
    { ...newAdventure(3, 81), potions: ["transposition"] },
    "moss",
  );
  const card = {
    ...run.inventory[0],
    keywords: [next(0, 2), terrain(defaultEnvironment("blight"))],
  };
  run.inventory[0] = card;
  run.battle!.hands[0][0] = card;
  run = playAdventureCard(run, 0, 0, [{ keywordIndex: 1, boardIndex: 4 }]);
  const saved = JSON.parse(JSON.stringify(run));
  assert.ok(validateAdventure(saved));
  run = restoreAdventure(saved)!;
  assert.equal(pendingPipEffects(run.battle!.board, 0).length, 1);
  assert.equal(boardEnvironments(run.battle!.board)[4]!.kind, "blight");
  run = { ...run, battle: { ...run.battle!, current: 0 } };
  run = playAdventureCard(run, 4, 0);
  assert.equal(pendingPipEffects(run.battle!.board, 0).length, 0);
  run = { ...run, battle: { ...run.battle!, current: 0 } };
  const swapped = useAdventurePotion(run, 0, 0, { second: 4 });
  assert.equal(swapped.battle!.board[0]!.environment, undefined);
  assert.equal(swapped.battle!.board[4]!.environment!.kind, "blight");
  assert.equal(pendingPipEffects(swapped.battle!.board, 0).length, 0);
  assert.deepEqual(
    restoreAdventure(JSON.parse(JSON.stringify(swapped)))!.battle,
    swapped.battle,
  );
});
test("Combo grants queue and cast only when active; computer choices can target empty terrain safely", () => {
  const combo = stone(
    [1, 1, 1, 1],
    [
      {
        type: "combo",
        keywords: [next("all"), terrain(defaultEnvironment("bastion"))],
      },
    ],
  );
  assert.equal(prepareTargeting(EMPTY_BOARD(), combo, [], 0).pending, null);
  let board = placeStone(EMPTY_BOARD(), 0, stone(), 0).board;
  const move = chooseMove(board, [combo], [stone()], 0);
  assert.equal(move.targets.length, 1);
  board = placeStone(board, move.index, combo, 0, move.targets).board;
  assert.equal(pendingPipEffects(board, 0).length, 1);
  assert.equal(boardEnvironments(board).filter(Boolean).length, 1);
});
test("new Draft pools offer both new keywords; existing pools keep their original definitions", () => {
  const old = newDraft(4, 47, {}, false);
  assert.equal(old.effectsVersion, undefined);
  assert.deepEqual(
    restoreDraft(JSON.parse(JSON.stringify(old)))!.cards,
    old.cards,
  );
  const current = newDraft(4, 47, {});
  assert.equal(current.effectsVersion, 1);
  assert.ok(
    current.cards.some((card) =>
      card.keywords?.some((keyword) => keyword.type === "next-play"),
    ),
  );
  assert.ok(
    current.cards.some((card) =>
      card.keywords?.some((keyword) => keyword.type === "environment"),
    ),
  );
  assert.deepEqual(
    restoreDraft(JSON.parse(JSON.stringify(current)))!.cards,
    current.cards,
  );
});
test("new keyword settings validate for card imports and Combo, and malformed Adventure histories are rejected", () => {
  for (const kind of Object.keys(ENVIRONMENTS) as EnvironmentKind[])
    assert.ok(validateKeywords([terrain(defaultEnvironment(kind))]));
  assert.ok(
    validateKeywords([
      next("all"),
      next(0, -1, "opponent"),
      terrain(defaultEnvironment("blight")),
      terrain(defaultEnvironment("blight")),
    ]),
  );
  for (const invalid of [
    { type: "next-play", side: "any", amount: 1, recipient: "self" },
    { type: "next-play", side: 0, amount: 0, recipient: "self" },
    { type: "next-play", side: 0, amount: -6, recipient: "self" },
    { type: "next-play", side: 0, amount: 1, recipient: "both" },
    { type: "environment", environment: { kind: "lava" } },
    {
      type: "environment",
      environment: { kind: "elemental", side: 0, amount: 1, element: "bogus" },
    },
  ])
    assert.equal(validateKeywords([invalid]), false);
  let run = enterAdventureNode(newAdventure(3, 81), "moss");
  run.battle!.hands[0][0] = {
    ...run.battle!.hands[0][0],
    keywords: [next("all"), terrain(defaultEnvironment("bastion"))],
  };
  run = playAdventureCard(run, 0, 0, [{ keywordIndex: 1, boardIndex: 4 }]);
  for (const mutate of [
    (r: typeof run) => {
      r.battle!.board[0]!.queuedPips![0].amount = 0;
    },
    (r: typeof run) => {
      r.battle!.board[0]!.effects![0].target = 99;
    },
    (r: typeof run) => {
      r.battle!.board[0]!.inheritedPips = [NaN, 0, 0, 0];
    },
  ]) {
    const bad = structuredClone(run);
    mutate(bad);
    assert.equal(validateAdventure(bad), false);
  }
});
test("Compass rotates fixed effect sides while all-side effects stay all-sided; fusion retains stacked effects", () => {
  const card = stone(
    [1, 1, 1, 1],
    [next(0), next("all", -1), terrain({ kind: "blight", side: 1, amount: 1 })],
  );
  const rotated = rotatedPotionStone(card);
  assert.deepEqual(rotated.keywords, [
    next(1),
    next("all", -1),
    terrain({ kind: "blight", side: 2, amount: 1 }),
  ]);
  const fused = adventureFusionPreview(card, { ...card, id: "custom-donor" });
  assert.equal(fused.keywords!.length, 6);
});
test("terrain and a changing boss aura adjust a stored Dizzy roll without rerolling it", () => {
  const card = {
    ...stone(
      [4, 2, 0, 4],
      [{ type: "dizzy", sides: [0] }, terrain(defaultEnvironment("blight"))],
    ),
    element: "fire" as const,
  };
  const board = placeStone(
    EMPTY_BOARD(),
    4,
    card,
    0,
    [{ keywordIndex: 1, boardIndex: 4 }],
    { seed: 42, arenaElement: "fire" },
  ).board;
  const snapshot = structuredClone(board[4]!.dizzy);
  assert.deepEqual(
    cardEdges(board[4]!),
    board[4]!.edges!.map((pips) => Math.max(0, pips - 1) + 1),
  );
  const changed = withArenaElement(board, "water");
  assert.deepEqual(
    cardEdges(changed[4]!),
    changed[4]!.edges!.map((pips) => Math.max(0, pips - 1)),
  );
  assert.deepEqual(changed[4]!.dizzy, snapshot);
});
test("Sunder and Shatter target the displayed side of Crosswind’s rotated pips", () => {
  let board = cast(EMPTY_BOARD(), 4, defaultEnvironment("crosswind"));
  board = placeStone(board, 4, stone([0, 1, 4, 3]), 1).board;
  const flexible = prepareTargeting(
    board,
    stone([0, 0, 0, 0], [{ type: "sunder", side: "any" }]),
    [],
    0,
  ).pending!;
  assert.deepEqual(
    flexible.options
      .filter((option) => option.boardIndex === 4)
      .map((option) => option.side),
    [0, 2, 3],
  );
  board = placeStone(
    board,
    1,
    stone([0, 0, 0, 0], [{ type: "sunder", side: 0 }]),
    0,
    [{ keywordIndex: 0, boardIndex: 4 }],
  ).board;
  assert.deepEqual(cardEdges(board[4]!), [2, 0, 1, 4]);
  assert.deepEqual(board[4]!.reductions, [0, 0, 0, 1]);
  const run = enterAdventureNode(
    { ...newAdventure(3, 81), potions: ["shatter"] },
    "moss",
  );
  run.battle!.board = board;
  const shattered = useAdventurePotion(run, 0, 4, { side: 0 });
  assert.deepEqual(cardEdges(shattered.battle!.board[4]!), [0, 0, 1, 4]);
  assert.deepEqual(shattered.battle!.board[4]!.reductions, [0, 0, 0, 3]);
});
