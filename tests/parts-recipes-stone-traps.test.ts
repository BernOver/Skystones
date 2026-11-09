import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_BOARD,
  STARTER_STONES,
  placeStone,
  chooseKeywordTargets,
  evaluateKeywords,
  cardEdges,
  attackEdges,
  defenseEdges,
  validateKeywords,
  validateStone,
  effectiveKeywords,
  chooseMove,
} from "../src/game.ts";
import type { Stone, StoneKeyword, Board, Owner } from "../src/game.ts";
import { DEFAULT_TRAPS, trapStateFromBoard } from "../src/traps.ts";
import { DEFAULT_PARTS, combineParts, assembleParts } from "../src/assemble.ts";
import {
  matchingRecipe,
  mergeRecipes,
  validRecipes,
  validRecipe,
  recipePair,
} from "../src/recipes.ts";
import type { SuperchargerRecipe } from "../src/recipes.ts";
import { applyConjure, CONJURE_CARDS } from "../src/conjure.ts";
import { cardDependencies } from "../src/cardDependencies.ts";
import { tokenCatalogue, tokenDefinition } from "../src/tokens.ts";
import {
  newAdventure,
  enterAdventureNode,
  playAdventureCard,
  restoreAdventure,
  validateAdventure,
} from "../src/adventure.ts";
import { swapCards, halfKeywords } from "../src/swapForce.ts";
import { CHARACTER_STONES } from "../src/characters.ts";
import { newDraft, restoreDraft } from "../src/draft.ts";
const make = (
  id: string,
  keywords: StoneKeyword[] = [],
  edges: Stone["edges"] = [1, 1, 1, 1],
): Stone => ({
  ...STARTER_STONES[0],
  id: `custom-${id}`,
  name: id,
  element: "fire",
  keywords,
  edges,
});
const play = (board: Board, index: number, stone: Stone, owner: Owner = 0) =>
  placeStone(
    board,
    index,
    stone,
    owner,
    chooseKeywordTargets(board, index, stone, owner),
  );
const recipe: SuperchargerRecipe = {
  id: "recipe-hot-streak",
  parts: [DEFAULT_PARTS[0].id, DEFAULT_PARTS[1].id],
  name: "Turbo Hot Streak",
  portrait: "vehicle-hot-streak",
  element: "tech",
};

test("a stone places a shared Trap before its own captures, and playing no Trap leaves the slot inactive", () => {
  let board = play(EMPTY_BOARD(), 1, make("enemy"), 1).board;
  assert.equal(trapStateFromBoard(board), undefined);
  assert.equal(board[1]!.trap, undefined);
  const attacker = make("trapper", [{ type: "trap", trap: DEFAULT_TRAPS[0] }]);
  const move = play(board, 0, attacker);
  assert.ok(move.captured.includes(1));
  assert.equal(trapStateFromBoard(move.board)!.active!.source, "trapper");
  assert.deepEqual(move.board[0]!.edges, [1, 1, 1, 1]);
  assert.deepEqual(attackEdges(move.board[0]!), [2, 2, 2, 2]);
  const next = play(move.board, 8, make("plain"), 1);
  assert.equal(trapStateFromBoard(next.board)!.active!.trap.id, "trap-fire");
});
test("a newer stone Trap replaces the previous one for both owners, including a Combo-granted Trap", () => {
  const first = play(
    EMPTY_BOARD(),
    0,
    make("fire", [{ type: "trap", trap: DEFAULT_TRAPS[0] }]),
  ).board;
  const incoming = make("water-trapper", [
    { type: "combo", keywords: [{ type: "trap", trap: DEFAULT_TRAPS[1] }] },
  ]);
  const next = play(first, 8, incoming).board;
  assert.equal(trapStateFromBoard(next)!.active!.trap.id, "trap-water");
  assert.deepEqual(attackEdges(next[0]!), [1, 1, 1, 1]);
  assert.equal(new Set(next.filter((c) => !!c).map((c) => c.trap!.id)).size, 1);
  const silenced = play(
    next,
    4,
    make("silencer", [{ type: "silence" }]),
    1,
  ).board;
  assert.equal(trapStateFromBoard(silenced)!.active!.trap.id, "trap-water");
});
test("Amplify scales stone Trap strength and the shared snapshot survives an Adventure reload", () => {
  let run = enterAdventureNode(newAdventure(3, 83), "moss");
  const trapper = {
    ...run.battle!.hands[0][0],
    element: "fire" as const,
    keywords: [
      { type: "amplify", effect: "trap", duration: "always" },
      { type: "trap", trap: DEFAULT_TRAPS[0] },
    ] as StoneKeyword[],
  };
  run = {
    ...run,
    battle: {
      ...run.battle!,
      hands: [
        [trapper, ...run.battle!.hands[0].slice(1)],
        run.battle!.hands[1],
      ],
    },
  };
  run = playAdventureCard(run, 0, 0);
  assert.equal(run.battle!.traps!.active!.trap.effects[0].amount, 2);
  assert.ok(validateAdventure(run));
  const restored = restoreAdventure(JSON.parse(JSON.stringify(run)))!;
  assert.equal(restored.battle!.traps!.active!.trap.effects[0].amount, 2);
  assert.deepEqual(
    attackEdges(restored.battle!.board[0]!),
    attackEdges(run.battle!.board[0]!),
  );
});
test("legacy Adventure manual Trap activations disappear on restore without changing stored pip values", () => {
  let run = enterAdventureNode(newAdventure(3, 83), "moss");
  run = playAdventureCard(run, 0, 0);
  const before = [...run.battle!.board[0]!.edges!];
  run = {
    ...run,
    battle: {
      ...run.battle!,
      traps: {
        active: { trap: DEFAULT_TRAPS[0], owner: 0 },
        lastPlayed: [0, -1],
      },
      board: run.battle!.board.map((c) =>
        c ? { ...c, trap: DEFAULT_TRAPS[0] } : null,
      ),
    },
  };
  const restored = restoreAdventure(JSON.parse(JSON.stringify(run)))!;
  assert.equal(restored.battle!.traps, undefined);
  assert.equal(restored.battle!.board[0]!.trap, undefined);
  assert.deepEqual(restored.battle!.board[0]!.edges, before);
});
test("specific and random Assemble validate and generate from the requested Parts source", () => {
  const keywords: StoneKeyword[] = [
    { type: "assemble", mode: "specific", part: DEFAULT_PARTS[0].id, count: 1 },
    { type: "assemble", mode: "specific", part: DEFAULT_PARTS[1].id, count: 1 },
  ];
  assert.ok(validateKeywords(keywords));
  assert.equal(
    validateKeywords([
      { type: "assemble", mode: "specific", part: "spyro", count: 1 },
    ]),
    false,
  );
  assert.equal(
    validateKeywords([
      { type: "assemble", mode: "random", part: DEFAULT_PARTS[0].id, count: 1 },
    ]),
    false,
  );
  const board = play(EMPTY_BOARD(), 0, make("builder", keywords)).board;
  const result = assembleParts(board, 0, [[], []], 25, tokenCatalogue(), [
    recipe,
  ]);
  assert.equal(result.hands[0].length, 1);
  assert.equal(result.hands[0][0].name, recipe.name);
  assert.deepEqual(result.hands[0][0].edges, [2, 1, 1, 0]);
  assert.equal(result.hands[0][0].element, "tech");
  assert.equal(result.hands[0][0].portrait, recipe.portrait);
  assert.ok(result.hands[0][0].keywords!.some((k) => k.type === "shield"));
  assert.ok(result.hands[0][0].keywords!.some((k) => k.type === "head-start"));
  const randomBoard = play(
    EMPTY_BOARD(),
    0,
    make("random", [{ type: "assemble", mode: "random", count: 5 }]),
  ).board;
  const random = assembleParts(randomBoard, 0, [[], []], 1, DEFAULT_PARTS, []);
  assert.equal(random.messages.length, 5);
  assert.equal(random.hands[0].filter((c) => c.supercharger).length, 2);
  assert.equal(random.hands[0].filter((c) => c.part).length, 1);
});
test("generated Part copies keep stable identities, so fixed recipes match both orders and either generation keyword", () => {
  for (const [first, second] of [
    [DEFAULT_PARTS[0], DEFAULT_PARTS[1]],
    [DEFAULT_PARTS[1], DEFAULT_PARTS[0]],
  ]) {
    const conjurer = make("parts-conjurer", [
      {
        type: "conjure",
        mode: "token",
        token: first.id,
        count: 1,
        recipient: "self",
      },
      {
        type: "conjure",
        mode: "token",
        token: second.id,
        count: 1,
        recipient: "self",
      },
    ]);
    const board = play(EMPTY_BOARD(), 0, conjurer).board;
    for (const seed of [1, 7, 42]) {
      const result = applyConjure(
        board,
        0,
        [[], []],
        CONJURE_CARDS,
        seed,
        tokenCatalogue(),
        [],
        [recipe],
      );
      const vehicle = result.hands[0][0];
      assert.equal(vehicle.name, recipe.name);
      assert.ok(validateStone(vehicle));
      assert.deepEqual(vehicle.supercharger!.recipe, recipe);
    }
  }
  const board = play(
    EMPTY_BOARD(),
    0,
    make("single", [
      {
        type: "assemble",
        mode: "specific",
        part: DEFAULT_PARTS[0].id,
        count: 1,
      },
    ]),
  ).board;
  const loose = assembleParts(board, 0, [[], []], 1, DEFAULT_PARTS, [])
    .hands[0][0];
  assert.equal(loose.partKey, DEFAULT_PARTS[0].id);
  assert.equal(tokenDefinition(loose), false);
  assert.ok(validateStone(loose));
  assert.equal(
    matchingRecipe(
      loose,
      {
        ...DEFAULT_PARTS[1],
        partKey: DEFAULT_PARTS[1].id,
        id: "custom-conjured-copy",
      },
      [recipe],
    )!.id,
    recipe.id,
  );
});
test("recipe priority pairs matching Parts before fallback, supports two copies of the same Part, and preserves boosts", () => {
  const self = {
    ...recipe,
    id: "recipe-self",
    parts: [DEFAULT_PARTS[0].id, DEFAULT_PARTS[0].id] as [string, string],
  };
  assert.equal(
    combineParts([DEFAULT_PARTS[0], DEFAULT_PARTS[0]], [self])[0].name,
    self.name,
  );
  const result = combineParts(
    [DEFAULT_PARTS[0], DEFAULT_PARTS[2], DEFAULT_PARTS[1]],
    [recipe],
  );
  assert.equal(result.find((c) => c.supercharger)!.name, recipe.name);
  assert.ok(result.some((c) => c.id === DEFAULT_PARTS[2].id));
  const buffed = {
    ...DEFAULT_PARTS[0],
    discardBuffs: {
      pips: [1, 0, 0, 0] as Stone["edges"],
      shields: [0, 1, 0, 0] as Stone["edges"],
    },
  };
  const vehicle = combineParts([buffed, DEFAULT_PARTS[1]], [recipe])[0];
  assert.deepEqual(vehicle.discardBuffs, buffed.discardBuffs);
  assert.equal(evaluateKeywords(vehicle, EMPTY_BOARD(), 0).edges[0], 3);
});
test("editing a Part changes newly built stats without rewriting an already assembled vehicle", () => {
  const original = combineParts(DEFAULT_PARTS.slice(0, 2), [recipe])[0],
    changed = {
      ...DEFAULT_PARTS[0],
      name: "Tuned Blaze Engine",
      edges: [3, 2, 0, 0] as Stone["edges"],
      keywords: [{ type: "shield", side: 2, amount: 3 }] as StoneKeyword[],
    };
  const templates = tokenCatalogue([changed]);
  assert.ok(tokenDefinition(changed));
  const fresh = combineParts(
    [templates.find((c) => c.id === changed.id)!, DEFAULT_PARTS[1]],
    [recipe],
  )[0];
  assert.deepEqual(original.edges, [2, 1, 1, 0]);
  assert.deepEqual(fresh.edges, [4, 2, 1, 0]);
  assert.equal(fresh.name, recipe.name);
  assert.ok(fresh.keywords!.some((k) => k.type === "shield" && k.side === 2));
});
test("recipe validation prevents ambiguous pair results and invalid snapshots while merges explicitly replace a pair", () => {
  assert.ok(validRecipe(recipe));
  assert.equal(
    recipePair(recipe.parts),
    recipePair([...recipe.parts].reverse()),
  );
  assert.equal(
    validRecipes([recipe, { ...recipe, id: "recipe-other" }]),
    false,
  );
  for (const bad of [
    { ...recipe, name: "" },
    { ...recipe, portrait: "spyro" },
    { ...recipe, parts: ["custom-token-a"] },
    { ...recipe, element: "unknown" },
  ])
    assert.equal(validRecipe(bad), false);
  assert.deepEqual(
    mergeRecipes(
      [recipe],
      [{ ...recipe, id: "recipe-new", name: "Replacement" }],
    ).map((r) => r.name),
    ["Replacement"],
  );
});
test("specific Assemble sharing includes only its dependency and matching recipe Parts, and random Assemble includes the complete Part pool", () => {
  const specific = make("caller", [
    { type: "assemble", count: 1, mode: "specific", part: DEFAULT_PARTS[0].id },
  ]);
  const bundle = cardDependencies(specific, tokenCatalogue(), [], [recipe]);
  assert.deepEqual(
    new Set(bundle.tokens.map((c) => c.id)),
    new Set(recipe.parts),
  );
  assert.deepEqual(bundle.recipes, [recipe]);
  assert.throws(() => cardDependencies(specific, [], [], [recipe]));
  const random = cardDependencies(
    make("random", [{ type: "assemble", count: 1 }]),
    tokenCatalogue(),
    [],
    [recipe],
  );
  assert.ok(
    DEFAULT_PARTS.every((p) => random.tokens.some((c) => c.id === p.id)),
  );
  const partBundle = cardDependencies(
    DEFAULT_PARTS[0],
    tokenCatalogue(),
    [],
    [recipe],
  );
  assert.deepEqual(
    partBundle.tokens.map((c) => c.id),
    [DEFAULT_PARTS[1].id],
  );
  assert.deepEqual(partBundle.recipes, [recipe]);
});
test("SWAP Force permits independent matching keywords and Combos on opposite halves and swaps them correctly", () => {
  const a = {
    ...CHARACTER_STONES.find((c) => c.name === "Wash Buckler")!,
    id: "custom-swap-a",
    keywords: [
      { type: "shield", side: 0, amount: 1, half: "top" },
      { type: "shield", side: 0, amount: 2, half: "bottom" },
      { type: "combo", half: "top", pips: [{ side: 0, amount: 1 }] },
      { type: "combo", half: "bottom", pips: [{ side: 1, amount: 2 }] },
    ] as StoneKeyword[],
  };
  const b = {
    ...CHARACTER_STONES.find((c) => c.name === "Blast Zone")!,
    id: "custom-swap-b",
    keywords: [
      { type: "shield", side: 0, amount: 4, half: "bottom" },
    ] as StoneKeyword[],
  };
  assert.ok(validateStone(a));
  assert.equal(evaluateKeywords(a, EMPTY_BOARD(), 0).shields[0], 3);
  assert.equal(validateKeywords([...a.keywords, a.keywords[0]]), false);
  const [mixed] = swapCards(a, b);
  assert.equal(
    halfKeywords(mixed, "top").filter((k) => k.type === "shield")[0].amount,
    1,
  );
  assert.equal(
    halfKeywords(mixed, "bottom").filter((k) => k.type === "shield")[0].amount,
    4,
  );
  assert.equal(evaluateKeywords(mixed, EMPTY_BOARD(), 0).shields[0], 5);
  const before = play(EMPTY_BOARD(), 8, {
    ...make("prior"),
    element: a.element,
  }).board;
  const evaluated = evaluateKeywords(a, before, 0);
  assert.deepEqual(evaluated.comboStates, [true, true]);
  assert.equal(evaluated.edges[0], a.edges[0] + 1);
  assert.equal(evaluated.edges[1], a.edges[1] + 2);
});
test("same-direction Shift on two SWAP halves remains two effects while same-half duplicates stay invalid", () => {
  const shifts: StoneKeyword[] = [
    { type: "shift", side: 1, direction: 2, affects: "both", half: "top" },
    { type: "shift", side: 1, direction: 2, affects: "both", half: "bottom" },
  ];
  assert.ok(validateKeywords(shifts));
  assert.equal(
    effectiveKeywords(make("shifts", shifts), EMPTY_BOARD(), 0).filter(
      (k) => k.type === "shift",
    ).length,
    2,
  );
  assert.equal(validateKeywords([shifts[0], shifts[0]]), false);
});
test("new Draft pools include stone Trap effects and old construction pools restore unchanged", () => {
  const fresh = newDraft(3, 43);
  assert.equal(fresh.trapVersion, 1);
  assert.ok(
    fresh.cards.some((c) => c.keywords!.some((k) => k.type === "trap")),
  );
  assert.ok(restoreDraft(fresh));
  const old = newDraft(3, 43, {}, true, true, true, true, true, true, false);
  assert.equal(old.trapVersion, undefined);
  assert.ok(restoreDraft(old));
  assert.equal(
    old.cards.some((c) => c.keywords!.some((k) => k.type === "trap")),
    false,
  );
});

for (const size of [3, 4] as const)
  test(`${size}×${size} Adventure snapshots recipe rules and preserves fixed Superchargers and loose Part identities after reload`, () => {
    let run = enterAdventureNode(newAdventure(size, 21), "moss");
    const first = {
      ...run.battle!.hands[0][0],
      keywords: [
        {
          type: "assemble",
          mode: "specific",
          part: DEFAULT_PARTS[0].id,
          count: 1,
        },
        {
          type: "assemble",
          mode: "specific",
          part: DEFAULT_PARTS[1].id,
          count: 1,
        },
        {
          type: "assemble",
          mode: "specific",
          part: DEFAULT_PARTS[2].id,
          count: 1,
        },
      ] as StoneKeyword[],
    };
    run = {
      ...run,
      battle: {
        ...run.battle!,
        recipes: [recipe],
        hands: [
          [first, ...run.battle!.hands[0].slice(1)],
          run.battle!.hands[1],
        ],
      },
    };
    run = playAdventureCard(run, 0, 0);
    assert.ok(validateAdventure(run));
    const restored = restoreAdventure(JSON.parse(JSON.stringify(run)))!;
    assert.equal(
      restored.battle!.hands[0].find((c) => c.supercharger)!.name,
      recipe.name,
    );
    assert.equal(
      restored.battle!.hands[0].find((c) => c.part)!.partKey,
      DEFAULT_PARTS[2].id,
    );
    assert.deepEqual(restored.battle!.recipes, [recipe]);
  });

test("grants from implicit top and explicit bottom SWAP Combos keep their separate half slots", () => {
  const base = {
      ...CHARACTER_STONES.find((c) => c.name === "Wash Buckler")!,
      keywords: [],
    },
    board = play(EMPTY_BOARD(), 0, base).board;
  const stone = {
    ...base,
    id: "custom-two-combo-grants",
    keywords: [
      {
        type: "combo",
        keywords: [{ type: "shift", side: 1, direction: 2, affects: "both" }],
      },
      {
        type: "combo",
        half: "bottom",
        keywords: [{ type: "shift", side: 1, direction: 2, affects: "both" }],
      },
    ] as StoneKeyword[],
  };
  assert.ok(validateStone(stone));
  assert.equal(
    effectiveKeywords(stone, board, 0).filter((k) => k.type === "shift").length,
    2,
  );
});

test("two SWAP Combo grants resolve once each in printed order rather than duplicating their combined grants", () => {
  const base = {
      ...CHARACTER_STONES.find((c) => c.name === "Wash Buckler")!,
      keywords: [],
    },
    prior = play(EMPTY_BOARD(), 0, base).board;
  const summon = (token: string): StoneKeyword => ({
    type: "conjure",
    mode: "token",
    token,
    count: 1,
    recipient: "self",
  });
  const stone = {
    ...base,
    id: "custom-dual-combo-conjure",
    keywords: [
      {
        type: "combo",
        half: "top",
        keywords: [summon("custom-token-fire-spark")],
      },
      summon("custom-token-magic-echo"),
      {
        type: "combo",
        half: "bottom",
        keywords: [summon("custom-token-shadow-decoy")],
      },
    ] as StoneKeyword[],
  };
  const board = play(prior, 1, stone).board,
    result = applyConjure(
      board,
      1,
      [[], []],
      CONJURE_CARDS,
      1,
      tokenCatalogue(),
      [],
      [],
    );
  assert.equal(result.hands[0].length, 3);
  assert.deepEqual(
    result.hands[0].map((c) => c.name),
    ["Fire Spark", "Magic Echo", "Shadow Decoy"],
  );
});
test("opposite-half Silence keywords choose and record independent targets", () => {
  let board = play(
    EMPTY_BOARD(),
    0,
    make("enemy-a", [{ type: "shield", side: 0 }]),
    1,
  ).board;
  board = play(
    board,
    2,
    make("enemy-b", [{ type: "shield", side: 1 }]),
    1,
  ).board;
  const stone = make("double-silence", [
    { type: "silence", half: "top" },
    { type: "silence", half: "bottom" },
  ]);
  const move = play(board, 8, stone);
  assert.deepEqual(
    move.effects.filter((e) => e.type === "silence").map((e) => e.keywordIndex),
    [0, 1],
  );
  assert.equal(move.board[0]!.silenced, true);
  assert.equal(move.board[2]!.silenced, true);
});
