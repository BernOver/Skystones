import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applyConjure,
  CONJURE_CARDS,
  MAX_HAND_CARDS,
  validateConjurations,
} from "../src/conjure.ts";
import type { ConjureKeyword } from "../src/conjure.ts";
import {
  EMPTY_BOARD,
  STARTER_STONES,
  placeStone,
  chooseKeywordTargets,
  validateKeywords,
  validateStone,
  evaluateKeywords,
} from "../src/game.ts";
import type { Stone, StoneKeyword, BoardSize, Owner } from "../src/game.ts";
import { hasTribe } from "../src/tribes.ts";
import { pendingPipEffects } from "../src/effects.ts";
import {
  characterDefault,
  editedCharacterDefault,
} from "../src/cardDefaults.ts";
import { newDraft, restoreDraft } from "../src/draft.ts";
import { ADVENTURE_CHARACTERS, uniqueCharacters } from "../src/characters.ts";
import {
  newAdventure,
  enterAdventureNode,
  playAdventureCard,
  adventureEnemyMove,
  restoreAdventure,
  validateAdventure,
} from "../src/adventure.ts";

const specific = (
  card = "tree-rex",
  count = 1,
  recipient: ConjureKeyword["recipient"] = "self",
): ConjureKeyword => ({
  type: "conjure",
  mode: "specific",
  card,
  count,
  recipient,
});
const random: ConjureKeyword = {
  type: "conjure",
  mode: "random",
  count: 5,
  recipient: "self",
};
const source = (keywords: StoneKeyword[] = [specific()]): Stone => ({
  ...STARTER_STONES[0],
  id: "custom-conjurer",
  name: "Conjurer",
  element: "fire",
  edges: [0, 0, 0, 0],
  keywords,
});
const cast = (
  keywords: StoneKeyword[],
  owner: Owner = 0,
  seed = 81,
  hands: [Stone[], Stone[]] = [[], []],
) =>
  applyConjure(
    placeStone(EMPTY_BOARD(), 0, source(keywords), owner).board,
    0,
    hands,
    CONJURE_CARDS,
    seed,
  );

test("Conjure validates specified cards, filtered random cards, both recipients, repeated entries, and Combo grants", () => {
  assert.ok(
    validateStone(
      source([
        specific(),
        specific("spyro", 3, "both"),
        { ...random, element: "fire", tribe: "giants" },
      ]),
    ),
  );
  assert.ok(
    validateKeywords([
      { type: "combo", keywords: [specific(), specific("spyro")] },
    ]),
  );
  for (const keyword of [
    { ...specific(), card: "unknown" },
    { ...specific(), count: 0 },
    { ...specific(), count: 6 },
    { ...specific(), count: "1" },
    { ...specific(), recipient: "enemy" },
    { ...specific(), side: 0 },
    { ...specific(), element: "fire" },
    { ...specific(), mode: "choice" },
    { ...random, card: "spyro" },
    { ...random, element: "void" },
    { ...random, tribe: "sensei" },
  ])
    assert.equal(validateKeywords([keyword]), false, JSON.stringify(keyword));
});
test("specified cards create independent fresh copies with unique IDs and no automatic keyword triggers", () => {
  const tree = CONJURE_CARDS.find((card) => card.portrait === "tree-rex")!;
  const result = cast([specific("tree-rex", 3)]);
  assert.equal(result.hands[0].length, 3);
  assert.equal(result.hands[1].length, 0);
  assert.equal(new Set(result.hands[0].map((card) => card.id)).size, 3);
  for (const card of result.hands[0]) {
    assert.equal(card.name, tree.name);
    assert.deepEqual(card.edges, tree.edges);
    assert.deepEqual(card.keywords, tree.keywords);
    assert.equal(card.conjured, true);
    assert.ok(validateStone(card));
  }
  result.hands[0][0].edges[0]++;
  assert.deepEqual(result.hands[0][1].edges, tree.edges);
  assert.ok(validateConjurations(result.conjurations));
  const chain = { ...tree, keywords: [specific("spyro", 5)] };
  const generated = applyConjure(
    placeStone(EMPTY_BOARD(), 0, source(), 0).board,
    0,
    [[], []],
    [chain],
    81,
  );
  assert.equal(generated.hands[0].length, 1);
  assert.deepEqual(generated.hands[0][0].keywords, chain.keywords);
});
test("random results are seeded, varied, drawn without replacement where possible, and respect both filters", () => {
  const draws = new Set<string>();
  for (let seed = 1; seed <= 30; seed++) {
    const keyword: ConjureKeyword = {
      ...random,
      element: "fire",
      tribe: "giants",
    };
    const result = cast([keyword], 0, seed);
    assert.equal(result.hands[0].length, 5);
    assert.ok(
      result.hands[0].every(
        (card) => card.element === "fire" && hasTribe(card, "giants"),
      ),
    );
    assert.deepEqual(result, cast([keyword], 0, seed));
    const unrestricted = cast([random], 0, seed).hands[0];
    assert.equal(new Set(unrestricted.map((card) => card.portrait)).size, 5);
    draws.add(unrestricted.map((card) => card.portrait).join());
  }
  assert.ok(draws.size > 20);
  const none = cast([{ ...random, element: "neutral", tribe: "giants" }]);
  assert.equal(none.hands[0].length, 0);
  assert.equal(none.conjurations[0].reason, "no-match");
});
test("Conjure targets the original player, opponent, or both and resolves each printed entry in order", () => {
  for (const owner of [0, 1] as const) {
    const result = cast(
      [
        specific("spyro", 2, "self"),
        specific("tree-rex", 1, "opponent"),
        specific("bouncer", 1, "both"),
      ],
      owner,
    );
    assert.deepEqual(
      result.hands[owner].map((card) => card.portrait),
      ["spyro", "spyro", "bouncer"],
    );
    assert.deepEqual(
      result.hands[1 - owner].map((card) => card.portrait),
      ["tree-rex", "bouncer"],
    );
    assert.equal(result.conjurations.length, 4);
  }
});
test("capturing or silencing a source preserves gained cards and never repeats Conjure", () => {
  const result = cast([specific("spyro", 2)]);
  const captured = placeStone(
    result.board,
    1,
    { ...source([{ type: "silence" }]), edges: [0, 0, 0, 5] },
    1,
    [{ keywordIndex: 0, boardIndex: 0 }],
  ).board;
  assert.equal(captured[0]!.owner, 1);
  assert.equal(captured[0]!.silenced, true);
  assert.deepEqual(captured[0]!.conjurations, result.conjurations);
  assert.equal(
    applyConjure(captured, 0, result.hands, CONJURE_CARDS, 82).hands,
    result.hands,
  );
  assert.equal(
    applyConjure(result.board, 0, result.hands, CONJURE_CARDS, 82).hands,
    result.hands,
  );
});
test("hand limits retain existing cards, spend no extra cards, and report every skipped copy", () => {
  const hands: [Stone[], Stone[]] = [
    Array.from({ length: MAX_HAND_CARDS - 1 }, (_, i) => ({
      ...source([]),
      id: `custom-existing-${i}`,
    })),
    Array(MAX_HAND_CARDS).fill(source([])),
  ];
  const before = structuredClone(hands);
  const result = cast(
    [specific("spyro", 3, "both"), specific("tree-rex", 1)],
    0,
    81,
    hands,
  );
  assert.deepEqual(hands, before);
  assert.equal(result.hands[0].length, MAX_HAND_CARDS);
  assert.equal(result.hands[1].length, MAX_HAND_CARDS);
  assert.deepEqual(
    result.conjurations.map((record) => record.skipped),
    [2, 3, 1],
  );
  assert.ok(validateConjurations(result.conjurations));
});
test("Combo only grants Conjure on a matching previous play, while creating cards does not consume Next Play", () => {
  const combo = source([
    {
      type: "combo",
      condition: "tribe",
      tribe: "giants",
      keywords: [specific("spyro")],
    },
  ]);
  combo.tribes = ["giants"];
  const inactive = applyConjure(
    placeStone(EMPTY_BOARD(), 0, combo, 0).board,
    0,
    [[], []],
    CONJURE_CARDS,
    1,
  );
  assert.equal(inactive.hands[0].length, 0);
  let board = placeStone(
    EMPTY_BOARD(),
    0,
    {
      ...source([
        { type: "next-play", side: 0, amount: 1, recipient: "opponent" },
      ]),
      tribes: ["giants"],
    },
    0,
  ).board;
  board = placeStone(board, 4, combo, 0).board;
  const active = applyConjure(board, 4, [[], []], CONJURE_CARDS, 1);
  assert.equal(active.hands[0].length, 1);
  assert.equal(pendingPipEffects(active.board, 1).length, 1);
  assert.equal(active.board[4]!.comboActive, true);
  assert.deepEqual(
    active.conjurations.map((record) => record.keywordIndex),
    [0],
  );
});
for (const size of [3, 4] as BoardSize[])
  test(`${size}×${size} Adventure saves larger hands and intentional copies unchanged, lets keepers play them, and never adds them to the pack`, () => {
    let run = enterAdventureNode(newAdventure(size, 81), "moss");
    const card = {
      ...run.inventory[0],
      edges: [0, 0, 0, 0] as Stone["edges"],
      keywords: [specific("tree-rex", 3, "both")],
    };
    run.inventory[0] = card;
    run.battle!.hands[0][0] = card;
    const inventory = structuredClone(run.inventory);
    run = playAdventureCard(run, 0, 0);
    assert.equal(run.battle!.hands[0].length, (size === 4 ? 8 : 5) + 2);
    assert.equal(run.battle!.hands[1].length, (size === 4 ? 8 : 5) + 3);
    const snapshot = JSON.parse(JSON.stringify(run));
    assert.ok(validateAdventure(snapshot));
    assert.deepEqual(restoreAdventure(snapshot)!.battle, snapshot.battle);
    assert.deepEqual(run.inventory, inventory);
    const keeperIndex = run.battle!.hands[1].findIndex(
      (stone) => stone.conjured,
    );
    const copy = run.battle!.hands[1][keeperIndex];
    run = playAdventureCard(
      run,
      size * size - 1,
      keeperIndex,
      chooseKeywordTargets(run.battle!.board, size * size - 1, copy, 1),
    );
    assert.equal(run.battle!.board[size * size - 1]!.stone.conjured, true);
    while (run.phase === "battle") {
      const battle = run.battle!,
        index = battle.board.findIndex((cell) => !cell),
        stone = battle.hands[battle.current][0];
      run = playAdventureCard(
        run,
        index,
        0,
        chooseKeywordTargets(battle.board, index, stone, battle.current),
      );
    }
    assert.deepEqual(run.inventory, inventory);
    assert.ok(!run.inventory.some((stone) => stone.conjured));
  });
test("Adventure canceled placements grant nothing; computer keepers can use Conjure", () => {
  const run = enterAdventureNode(newAdventure(3, 81), "moss");
  run.battle!.board = placeStone(EMPTY_BOARD(), 8, source([]), 1).board;
  const card = {
    ...run.inventory[0],
    keywords: [specific(), { type: "silence" as const }],
  };
  run.battle!.board[8]!.stone = source([{ type: "shield", side: 0 }]);
  run.inventory[0] = card;
  run.battle!.hands[0][0] = card;
  const before = structuredClone(run);
  assert.throws(() => playAdventureCard(run, 0, 0));
  assert.deepEqual(run, before);
  run.battle!.current = 1;
  run.battle!.hands[1] = [source([specific("spyro", 2)])];
  const moved = adventureEnemyMove(run);
  assert.equal(moved.battle!.hands[1].length, 2);
  assert.ok(moved.battle!.hands[1].every((stone) => stone.conjured));
});
test("conjured copies use saved character definitions, retain tribe and keyword edits, and ignore duplicate repair", () => {
  const tree = CONJURE_CARDS.find((card) => card.portrait === "tree-rex")!;
  const defaults = editedCharacterDefault(
    "tree-rex",
    {
      ...tree,
      name: "My Tree",
      portrait: "spyro",
      edges: [0, 3, 1, 1],
      tribes: ["swap-force"],
      keywords: [specific("tree-rex")],
    },
    {},
  );
  const board = placeStone(
    EMPTY_BOARD(),
    0,
    source([specific("tree-rex", 2)]),
    0,
  ).board;
  const result = applyConjure(
    board,
    0,
    [[], []],
    CONJURE_CARDS.map((card) => characterDefault(card, defaults)),
    81,
  );
  assert.equal(result.hands[0].length, 2);
  assert.ok(
    result.hands[0].every(
      (card) =>
        card.name === "My Tree" &&
        card.characterKey === "tree-rex" &&
        hasTribe(card, "swap-force"),
    ),
  );
  assert.deepEqual(result.hands[0][0].edges, [0, 3, 1, 1]);
  assert.deepEqual(
    uniqueCharacters(result.hands[0], 7, ["spyro"]),
    result.hands[0],
  );
});
test("new Draft pools include both Conjure sources, while old pools and their saved choices keep their definitions", () => {
  const current = newDraft(4, 47, {});
  assert.equal(current.conjureVersion, 1);
  assert.deepEqual(
    current.cards
      .flatMap((card) => card.keywords || [])
      .filter((keyword) => keyword.type === "conjure")
      .map((keyword) => keyword.mode)
      .sort(),
    ["random", "specific"],
  );
  const old = newDraft(4, 47, {}, true, true, false);
  assert.equal(old.conjureVersion, undefined);
  for (const draft of [current, old])
    assert.deepEqual(
      restoreDraft(JSON.parse(JSON.stringify(draft)))!.cards,
      draft.cards,
    );
  assert.equal(restoreDraft({ ...current, conjureVersion: 2 }), null);
});
test("malformed generation histories and overfull Adventure hands are rejected", () => {
  let run = enterAdventureNode(newAdventure(3, 81), "moss");
  run.inventory[0] = { ...run.inventory[0], keywords: [specific()] };
  run.battle!.hands[0][0] = run.inventory[0];
  run = playAdventureCard(run, 0, 0);
  assert.ok(validateAdventure(run));
  for (const change of [
    (r: typeof run) => {
      r.battle!.board[0]!.conjurations![0].recipient = 2 as Owner;
    },
    (r: typeof run) => {
      r.battle!.board[0]!.conjurations![0].skipped = -1;
    },
    (r: typeof run) => {
      r.battle!.hands[0] = Array(MAX_HAND_CARDS + 1).fill(
        r.battle!.hands[0][0],
      );
    },
  ]) {
    const invalid = structuredClone(run);
    change(invalid);
    assert.equal(validateAdventure(invalid), false);
  }
  assert.ok(ADVENTURE_CHARACTERS.every((card) => card.portrait));
});
