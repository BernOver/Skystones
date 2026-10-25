import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import {
  CHARACTER_PORTRAITS,
  CHARACTER_STONES,
  ENEMY_STONES,
  migrateDeckId,
} from "../src/characters.ts";
import {
  EMPTY_BOARD,
  STARTER_STONES,
  chooseKeywordTargets,
  chooseMove,
  defenseEdges,
  evaluateKeywords,
  placeStone,
  prepareTargeting,
  previousElement,
  validateKeywords,
  validateStone,
} from "../src/game.ts";
import type { Board, Edges, Stone, StoneKeyword } from "../src/game.ts";
import {
  ADVENTURE_STORAGE,
  enterAdventureNode,
  newAdventure,
  playAdventureCard,
  restoreAdventure,
} from "../src/adventure.ts";
import { draftCards } from "../src/draft.ts";
import { rotatedPotionStone, useAdventurePotion } from "../src/potions.ts";
const card = (
  keywords: StoneKeyword[] = [],
  edges: Edges = [2, 2, 2, 2],
  element: Stone["element"] = "fire",
): Stone => ({
  ...STARTER_STONES[0],
  id: "custom-keyword-check",
  element,
  edges,
  keywords,
});

test("character roster has unique identities, bundled portraits for every card and unused variants for the maker", () => {
  assert.equal(CHARACTER_STONES.length, 182);
  const all = [...CHARACTER_STONES, ...ENEMY_STONES];
  assert.equal(new Set(all.map((s) => s.id)).size, all.length);
  assert.equal(new Set(all.map((s) => s.name)).size, all.length);
  assert.ok(CHARACTER_PORTRAITS.filter((p) => !p.playable).length >= 100);
  for (const p of CHARACTER_PORTRAITS)
    assert.ok(
      existsSync(
        new URL(`../src/assets/characters/${p.id}.webp`, import.meta.url),
      ),
      p.id,
    );
  for (const s of all) {
    assert.ok(validateStone({ ...s, id: `custom-${s.id}` }));
    assert.ok(CHARACTER_PORTRAITS.some((p) => p.id === s.portrait));
  }
  assert.ok(CHARACTER_STONES.some((s) => s.name === "Gill Grunt"));
  assert.ok(CHARACTER_STONES.some((s) => s.name === "Deep Dive Gill Grunt"));
  assert.equal(
    ENEMY_STONES.filter((s) => s.name.startsWith("Chompy Bot 9000")).length,
    1,
  );
  assert.equal(
    migrateDeckId("giants-chompy-bot-9000"),
    "giants-chompy-bot-9000",
  );
  assert.equal(
    migrateDeckId("giants-chompy-bot-9000-5"),
    "giants-chompy-bot-9000",
  );
  assert.equal(
    migrateDeckId("giants-drow-lance-master-3"),
    "giants-drow-lance-master",
  );
  for (const size of [3, 4] as const)
    assert.ok(newAdventure(size, 42).inventory.every((s) => !!s.portrait));
  const draft = draftCards(42);
  assert.ok(draft.every((s) => !!s.portrait));
  assert.equal(new Set(draft.map((s) => s.portrait)).size, 25);
  const mini = CHARACTER_STONES.filter((s) =>
    /sidekick|mini/i.test(
      CHARACTER_PORTRAITS.find((p) => p.id === s.portrait)!.role,
    ),
  );
  const giants = CHARACTER_STONES.filter(
    (s) =>
      CHARACTER_PORTRAITS.find((p) => p.id === s.portrait)!.role === "Giant",
  );
  assert.ok(mini.every((s) => s.edges.reduce((a, b) => a + b) <= 5));
  assert.ok(giants.every((s) => s.edges.reduce((a, b) => a + b) >= 10));
});
for (const size of [3, 4] as const)
  test(`Shield defends, never attacks, and persists through ownership changes on ${size}×${size}`, () => {
    const board = EMPTY_BOARD(size),
      shield = card([{ type: "shield", side: 1, amount: 2 }]);
    board[0] = { stone: card([], [0, 0, 0, 2]), owner: 1 };
    const played = placeStone(board, size, shield, 0);
    assert.deepEqual(played.board[size]!.edges, shield.edges);
    const defense = placeStone(
      played.board,
      size + 1,
      card([], [0, 0, 0, 4]),
      1,
    );
    assert.equal(
      defense.board[size]!.owner,
      0,
      "4 attack ties 2 regular + 2 Shield",
    );
    const captured = placeStone(
      played.board,
      size + 1,
      card([], [0, 0, 0, 5]),
      1,
    );
    assert.equal(captured.board[size]!.owner, 1);
    assert.equal(captured.board[size]!.playedBy, 0);
    assert.equal(defenseEdges(captured.board[size]!)[1], 4);
    const target = EMPTY_BOARD(size);
    target[1] = { stone: card([], [0, 0, 0, 2]), owner: 1 };
    assert.deepEqual(
      placeStone(target, 0, shield, 0).captured,
      [],
      "shield +2 must not capture with a 2-pip attack",
    );
  });

test("Silence removes Shield; Sunder changes regular pips without spending the shield", () => {
  let board = placeStone(
    EMPTY_BOARD(),
    4,
    card([{ type: "shield", side: 3, amount: 2 }]),
    1,
  ).board;
  board = placeStone(board, 0, card([{ type: "sunder", side: 3 }]), 0, [
    { keywordIndex: 0, boardIndex: 4 },
  ]).board;
  assert.equal(defenseEdges(board[4]!)[3], 3);
  const next = placeStone(
    board,
    3,
    card([{ type: "silence" }], [0, 2, 0, 0]),
    0,
    [{ keywordIndex: 0, boardIndex: 4 }],
  );
  assert.deepEqual(next.captured, [4]);
  assert.equal(defenseEdges(next.board[4]!)[3], 1);
  assert.deepEqual(next.board[4]!.shields, [0, 0, 0, 0]);
});

test("Combo uses the player's last played element, ignoring captures, silencing, enemy plays and position order", () => {
  const combo = card([
    {
      type: "combo",
      pips: [{ side: 1, amount: 2 }],
      keywords: [{ type: "shield", side: 3 }],
    },
  ]);
  let board = EMPTY_BOARD();
  assert.equal(evaluateKeywords(combo, board, 0).comboActive, false);
  board = placeStone(board, 8, card(), 0).board;
  board = placeStone(board, 5, card([], [0, 0, 3, 0], "water"), 1).board;
  assert.equal(board[8]!.owner, 1);
  assert.equal(previousElement(board, 0), "fire");
  board = placeStone(board, 0, combo, 0).board;
  assert.equal(board[0]!.comboActive, true);
  assert.deepEqual(board[0]!.edges, [2, 4, 2, 2]);
  assert.deepEqual(board[0]!.shields, [0, 0, 0, 1]);
  assert.equal(previousElement(board, 1), "water");
  board = placeStone(board, 6, card([], [0, 0, 0, 0], "water"), 0).board;
  assert.equal(evaluateKeywords(combo, board, 0).comboActive, false);
  assert.deepEqual(
    board[0]!.edges,
    [2, 4, 2, 2],
    "previously activated pips remain",
  );
  const reordered = [...board];
  [reordered[0], reordered[8]] = [reordered[8], reordered[0]];
  assert.equal(previousElement(reordered, 0), "water");
  const silent = prepareTargeting(board, card([{ type: "silence" }]), [
    { keywordIndex: 0, boardIndex: 0 },
  ]).board;
  assert.deepEqual(silent[0]!.edges, [2, 2, 2, 2]);
  assert.deepEqual(silent[0]!.grantedKeywords, []);
  assert.equal(defenseEdges(silent[0]!)[3], 2);
});

test("Combo grants targeted effects in order before captures, and skips all grants when inactive", () => {
  const combo = card(
    [
      {
        type: "combo",
        pips: [{ side: 1, amount: 1 }],
        keywords: [{ type: "silence" }, { type: "sunder", side: 3, amount: 2 }],
      },
    ],
    [0, 2, 0, 0],
  );
  let board = placeStone(EMPTY_BOARD(), 8, card(), 0).board;
  board = placeStone(
    board,
    4,
    card([{ type: "shield", side: 3, amount: 3 }], [0, 0, 0, 4]),
    1,
  ).board;
  assert.equal(
    prepareTargeting(board, combo, [], 0).pending!.keyword.type,
    "silence",
  );
  assert.throws(() => placeStone(board, 3, combo, 0));
  const targets = chooseKeywordTargets(board, 3, combo, 0),
    move = placeStone(board, 3, combo, 0, targets);
  assert.deepEqual(
    move.effects.map((e) => e.type),
    ["silence", "sunder"],
  );
  assert.deepEqual(move.captured, [4]);
  assert.deepEqual(combo.edges, [0, 2, 0, 0]);
  const inactive = { ...combo, element: "water" as const };
  assert.equal(prepareTargeting(board, inactive, [], 0).pending, null);
  assert.deepEqual(placeStone(board, 3, inactive, 0).effects, []);
});

test("Dizzy granted by Combo shuffles after captures without shuffling defense-only pips", () => {
  let board = placeStone(EMPTY_BOARD(), 8, card(), 0).board;
  const combo = card([
    { type: "shield", side: 0, amount: 2 },
    {
      type: "combo",
      pips: [{ side: 1, amount: 2 }],
      keywords: [{ type: "dizzy" }],
    },
  ]);
  const move = placeStone(board, 0, combo, 0, [], { seed: 42 });
  assert.deepEqual(move.board[0]!.dizzy!.before, [2, 4, 2, 2]);
  assert.equal(
    move.board[0]!.edges!.reduce((a, b) => a + b),
    10,
  );
  assert.equal(move.board[0]!.shields![0], 2);
});

test("new keyword imports validate bounded effects and reject recursion, duplicate grants and empty Combo", () => {
  assert.ok(
    validateKeywords([
      { type: "shield", side: 2, amount: 3 },
      { type: "combo", keywords: [{ type: "shield", side: 2 }] },
    ]),
  );
  for (const keywords of [
    [{ type: "shield", side: 4 }],
    [{ type: "shield", side: 0, amount: 0 }],
    [{ type: "shield", side: 0, amount: 100 }],
    [{ type: "combo" }],
    [{ type: "combo", pips: [{ side: 0, amount: 6 }] }],
    [
      {
        type: "combo",
        pips: [
          { side: 0, amount: 1 },
          { side: 0, amount: 2 },
        ],
      },
    ],
    [
      {
        type: "combo",
        keywords: [{ type: "combo", pips: [{ side: 0, amount: 1 }] }],
      },
    ],
    [{ type: "combo", keywords: [{ type: "dizzy" }, { type: "dizzy" }] }],
    [{ type: "combo", keywords: [null] }],
    [{ type: "combo", pips: [null] }],
  ])
    assert.equal(validateKeywords(keywords), false, JSON.stringify(keywords));
});

test("the computer chooses an activated Combo capture and respects Shield while searching", () => {
  let board = placeStone(EMPTY_BOARD(), 8, card(), 1).board;
  board = placeStone(board, 4, card([], [2, 2, 2, 2]), 0).board;
  const combo = card([{ type: "combo", pips: [{ side: 1, amount: 1 }] }]);
  const move = chooseMove(board, [combo], [], 1);
  assert.equal(move.index, 3);
  assert.deepEqual(
    placeStone(board, move.index, combo, 1, move.targets).captured,
    [4],
  );
});

test("Adventure saves retain Combo chronology, grants and shields, including duplicate passive grants", () => {
  let run = enterAdventureNode(newAdventure(3, 42), "moss");
  run.battle!.hands[0][0] = card();
  run = playAdventureCard(run, 8, 0);
  run.battle!.hands[1][0] = card([], [0, 0, 0, 0]);
  run = playAdventureCard(run, 7, 0);
  run.battle!.hands[0][0] = card([
    { type: "head-start", side: 0 },
    {
      type: "combo",
      keywords: [
        { type: "head-start", side: 0 },
        { type: "shield", side: 3 },
      ],
    },
  ]);
  run = playAdventureCard(run, 0, 0);
  const restored = restoreAdventure(JSON.parse(JSON.stringify(run)));
  assert.ok(restored, ADVENTURE_STORAGE);
  assert.equal(restored.battle!.board[0]!.comboActive, true);
  assert.deepEqual(restored.battle!.board[0]!.shields, [0, 0, 0, 1]);
  const invalid = JSON.parse(JSON.stringify(run));
  invalid.battle.board[0].playedOrder = -1;
  assert.equal(restoreAdventure(invalid), null);
});

test("Compass Cordial rotates Combo pip and keyword grants; Hush removes Combo Shield immediately", () => {
  const stone = card([
    { type: "shield", side: 0 },
    {
      type: "combo",
      pips: [{ side: 3, amount: 2 }],
      keywords: [
        { type: "sunder", side: "any" },
        { type: "shield", side: 2 },
      ],
    },
  ]);
  assert.deepEqual(rotatedPotionStone(stone).keywords, [
    { type: "shield", side: 1 },
    {
      type: "combo",
      pips: [{ side: 0, amount: 2 }],
      keywords: [
        { type: "sunder", side: "any" },
        { type: "shield", side: 3 },
      ],
    },
  ]);
  let run = enterAdventureNode(newAdventure(3, 7), "moss");
  run.potions = ["hush"];
  run.battle!.board = placeStone(EMPTY_BOARD(), 8, card(), 0).board;
  run.battle!.board = placeStone(
    run.battle!.board,
    4,
    stone,
    0,
    chooseKeywordTargets(run.battle!.board, 4, stone, 0),
  ).board;
  run = useAdventurePotion(run, 0, 4);
  assert.equal(run.battle!.board[4]!.silenced, true);
  assert.deepEqual(run.battle!.board[4]!.shields, [0, 0, 0, 0]);
});
