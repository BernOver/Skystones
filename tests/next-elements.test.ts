import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_BOARD,
  STARTER_STONES,
  ELEMENTS,
  validateKeywords,
  validateStone,
  withNextKeywords,
  placeStone,
  evaluateKeywords,
  cardEdges,
  prepareTargeting,
  chooseMove,
} from "../src/game.ts";
import type { Stone, StoneKeyword, Element } from "../src/game.ts";
import { pendingPipEffects } from "../src/effects.ts";
import {
  newAdventure,
  enterAdventureNode,
  playAdventureCard,
  restoreAdventure,
  validateAdventure,
  adventureCardStrengths,
} from "../src/adventure.ts";
import { tokenDefinition, DEFAULT_TOKENS } from "../src/tokens.ts";
import {
  editedCharacterDefault,
  originalCharacter,
  parseCharacterDefaults,
} from "../src/cardDefaults.ts";
import { rotatedPotionStone } from "../src/potions.ts";

const stone = (
  keywords: StoneKeyword[] = [],
  element: Element = "magic",
): Stone => ({
  ...STARTER_STONES[0],
  id: "custom-elements-test",
  name: "Element Stone",
  element,
  edges: [1, 1, 1, 1],
  keywords,
});
const next = (
  props: Partial<Extract<StoneKeyword, { type: "next-play" }>> = {},
): Extract<StoneKeyword, { type: "next-play" }> => ({
  type: "next-play",
  side: "all",
  amount: 0,
  recipient: "self",
  changeElement: "fire",
  ...props,
});

test("Next Play validates element requirements and element-only changes, including nested grants and legacy effects", () => {
  for (const element of Object.keys(ELEMENTS) as Element[]) {
    assert.ok(validateKeywords([next({ element, changeElement: element })]));
    assert.ok(
      validateKeywords([{ type: "combo", keywords: [next({ element })] }]),
    );
    assert.ok(
      validateKeywords([
        {
          type: "conjure",
          mode: "specific",
          card: "spyro",
          count: 1,
          recipient: "self",
          keywords: [next({ element })],
        },
      ]),
    );
  }
  for (const field of ["element", "changeElement"])
    for (const value of ["void", ["fire"], null, 2, {}])
      assert.equal(validateKeywords([{ ...next(), [field]: value }]), false);
  assert.equal(validateKeywords([next({ changeElement: undefined })]), false);
  assert.ok(validateKeywords([next({ changeElement: undefined, amount: 1 })]));
  assert.ok(
    validateKeywords([
      next({
        changeElement: undefined,
        keywords: [{ type: "shield", side: 0 }],
      }),
    ]),
  );
  const marker = { before: "water" as const, after: "fire" as const };
  assert.ok(validateStone({ ...stone(), receivedElement: marker }));
  assert.equal(
    validateStone({
      ...stone(),
      receivedElement: { before: "void", after: "fire" },
    }),
    false,
  );
  assert.equal(
    tokenDefinition({ ...DEFAULT_TOKENS[0], receivedElement: marker }),
    false,
  );
});

test("element and tribe requirements are conjunctive, skip unrelated plays and opponents, and consume only once", () => {
  let board = placeStone(
    EMPTY_BOARD(),
    0,
    {
      ...stone([
        next({ amount: 2, element: "fire", changeElement: undefined }),
        next({
          side: 0,
          amount: -1,
          element: "water",
          tribe: "giants",
          changeElement: "air",
          keywords: [{ type: "shield", side: 1, amount: 2 }],
        }),
      ]),
      edges: [0, 0, 0, 0],
    },
    0,
  ).board;
  board = placeStone(board, 8, stone([], "fire"), 1).board;
  board = placeStone(
    board,
    1,
    { ...stone([], "water"), tribes: ["minis"] },
    0,
  ).board;
  assert.equal(pendingPipEffects(board, 0).length, 2);
  const giant = { ...stone([], "water"), tribes: ["giants" as const] },
    before = structuredClone(giant);
  const preview = withNextKeywords(giant, board, 0);
  assert.equal(preview.element, "air");
  assert.deepEqual(evaluateKeywords(preview, board, 0).edges, [0, 1, 1, 1]);
  board = placeStone(board, 3, giant, 0).board;
  assert.equal(board[3]!.stone.element, "air");
  assert.equal(board[3]!.playedElement, "water");
  assert.deepEqual(board[3]!.shields, [0, 2, 0, 0]);
  assert.deepEqual(giant, before);
  assert.equal(pendingPipEffects(board, 0).length, 1);
  board = placeStone(board, 4, stone([], "fire"), 0).board;
  assert.deepEqual(board[4]!.edges, [3, 3, 3, 3]);
  assert.equal(pendingPipEffects(board, 0).length, 0);
});

test("all requirements use the submitted element; the last matching change wins in cast order and previews are idempotent", () => {
  let board = placeStone(
    EMPTY_BOARD(),
    8,
    stone([next({ element: "water", amount: 1 })]),
    0,
  ).board;
  board = placeStone(
    board,
    0,
    stone([
      next({
        element: "water",
        changeElement: "air",
        amount: -1,
        keywords: [{ type: "shield", side: 0 }],
      }),
      next({ element: "fire", changeElement: "earth" }),
    ]),
    0,
  ).board;
  const original = stone([], "water"),
    preview = withNextKeywords(original, board, 0);
  assert.equal(preview.element, "air");
  assert.deepEqual(preview.receivedElement, { before: "water", after: "air" });
  assert.equal(withNextKeywords(preview, board, 0), preview);
  assert.deepEqual(evaluateKeywords(preview, board, 0).edges, [1, 1, 1, 1]);
  board = placeStone(board, 4, preview, 0).board;
  assert.equal(board[4]!.stone.keywords!.length, 1);
  assert.deepEqual(
    pendingPipEffects(board, 0).map((effect) => effect.element),
    ["fire"],
  );
  assert.equal(withNextKeywords(stone([], "fire"), board, 0).element, "earth");
  assert.equal(original.element, "water");
});

test("element changes precede Combo, elemental terrain, arena auras and captures, including AI previews", () => {
  let board = placeStone(
    EMPTY_BOARD(),
    0,
    {
      ...stone(
        [
          next({ element: "water" }),
          {
            type: "environment",
            environment: {
              kind: "elemental",
              element: "fire",
              side: "all",
              amount: 1,
            },
          },
        ],
        "fire",
      ),
      edges: [0, 0, 0, 0],
    },
    0,
    [{ keywordIndex: 1, boardIndex: 4 }],
  ).board;
  board = placeStone(
    board,
    5,
    { ...stone([], "earth"), edges: [3, 3, 3, 3] },
    1,
  ).board;
  const receiver = stone(
    [{ type: "combo", pips: [{ side: 1, amount: 2 }] }],
    "water",
  );
  assert.equal(evaluateKeywords(receiver, board, 0).comboActive, true);
  assert.equal(prepareTargeting(board, receiver, [], 0, 4).pending, null);
  const placed = placeStone(board, 4, receiver, 0, [], {
    arenaElement: "fire",
  });
  assert.deepEqual(placed.captured, [5]);
  assert.equal(cardEdges(placed.board[4]!)[1], 5);
  const run = enterAdventureNode(newAdventure(3, 81), "moss");
  run.battle!.board = board;
  run.battle!.elementCycle = ["fire", "water"];
  assert.equal(adventureCardStrengths(run, receiver).edges[1], 4);
  assert.equal(chooseMove(board, [receiver], [], 0).index, 4);
});

test("capture, Silence and later recoloring do not undo the change or spend an unrelated element queue", () => {
  let board = placeStone(
    EMPTY_BOARD(),
    0,
    {
      ...stone([
        next({ element: "water" }),
        next({ element: "fire", changeElement: "earth" }),
      ]),
      edges: [0, 0, 0, 0],
    },
    0,
  ).board;
  board = placeStone(
    board,
    4,
    stone([{ type: "shield", side: 0 }], "water"),
    0,
  ).board;
  board = placeStone(
    board,
    3,
    { ...stone([{ type: "silence" }]), edges: [1, 5, 1, 1] },
    1,
    [{ keywordIndex: 0, boardIndex: 4 }],
  ).board;
  assert.equal(board[4]!.stone.element, "fire");
  assert.equal(board[4]!.owner, 1);
  assert.equal(pendingPipEffects(board, 0).length, 1);
  board[4] = { ...board[4]!, stone: { ...board[4]!.stone, element: "earth" } };
  assert.equal(pendingPipEffects(board, 0).length, 1);
  board = placeStone(board, 7, stone([], "water"), 0).board;
  board[7] = { ...board[7]!, stone: { ...board[7]!.stone, element: "fire" } };
  assert.equal(pendingPipEffects(board, 0).length, 1);
});

test("Combo can queue an element-only effect and Compass preserves its element settings", () => {
  let board = placeStone(EMPTY_BOARD(), 0, stone([], "magic"), 0).board;
  const caster = stone([
    {
      type: "combo",
      keywords: [next({ side: 0, element: "water", changeElement: "dark" })],
    },
  ]);
  board = placeStone(board, 1, caster, 0).board;
  assert.equal(pendingPipEffects(board, 0).length, 1);
  board = placeStone(board, 4, stone([], "water"), 0).board;
  assert.equal(board[4]!.stone.element, "dark");
  assert.equal(pendingPipEffects(board, 0).length, 0);
  const rotated = rotatedPotionStone(caster).keywords![0];
  assert.ok(rotated.type === "combo");
  assert.deepEqual(
    rotated.keywords![0],
    next({ side: 1, element: "water", changeElement: "dark" }),
  );
  const original = originalCharacter("spyro")!;
  const defaults = editedCharacterDefault(
    "spyro",
    { ...original, keywords: [next({ element: "water" })] },
    {},
  );
  assert.deepEqual(parseCharacterDefaults(defaults), defaults);
});

for (const size of [3, 4] as const)
  test(`${size}×${size} Adventure restores queued and received element changes without altering the pack`, () => {
    let run = enterAdventureNode(newAdventure(size, 81), "moss");
    const caster = {
      ...run.inventory[0],
      keywords: [
        next({ element: "water", tribe: "giants", changeElement: "light" }),
      ],
    };
    const receiver = {
      ...run.inventory[1],
      element: "water" as const,
      tribes: ["giants" as const],
      keywords: [],
    };
    run.inventory[0] = caster;
    run.inventory[1] = receiver;
    run.battle!.hands[0][0] = caster;
    run.battle!.hands[0][1] = receiver;
    const inventory = structuredClone(run.inventory);
    run = playAdventureCard(run, 0, 0);
    assert.ok(restoreAdventure(JSON.parse(JSON.stringify(run))));
    const invalid = structuredClone(run);
    invalid.battle!.board[0]!.queuedPips![0].changeElement = "void" as Element;
    assert.equal(validateAdventure(invalid), false);
    run.battle!.current = 0;
    run = playAdventureCard(run, size * size - 1, 0);
    assert.equal(run.battle!.board[size * size - 1]!.stone.element, "light");
    const snapshot = JSON.parse(JSON.stringify(run));
    assert.deepEqual(restoreAdventure(snapshot)!.battle, snapshot.battle);
    assert.deepEqual(run.inventory, inventory);
    const bad = structuredClone(run);
    bad.battle!.board[size * size - 1]!.playedElement = "void" as Element;
    assert.equal(validateAdventure(bad), false);
  });
