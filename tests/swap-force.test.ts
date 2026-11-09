import { test } from "node:test";
import assert from "node:assert/strict";
import { CHARACTER_STONES } from "../src/characters.ts";
import {
  isSwapForce,
  keywordHalf,
  swapCards,
  swapHand,
  validSwapParts,
} from "../src/swapForce.ts";
import {
  validateStone,
  validateKeywords,
  EMPTY_BOARD,
  placeStone,
  evaluateKeywords,
  defenseEdges,
} from "../src/game.ts";
import type { Stone, StoneKeyword } from "../src/game.ts";
import {
  newAdventure,
  enterAdventureNode,
  swapAdventureCards,
  playAdventureCard,
  restoreAdventure,
  validateAdventure,
} from "../src/adventure.ts";
import { pendingPipEffects } from "../src/effects.ts";
import { tokenDefinition } from "../src/tokens.ts";
import {
  editedCharacterDefault,
  parseCharacterDefaults,
} from "../src/cardDefaults.ts";
const copy = (name: string, id = name): Stone => ({
  ...structuredClone(CHARACTER_STONES.find((card) => card.name === name)!),
  id: `custom-swap-${id}`,
  custom: true,
});
const clean = (name: string, id = name): Stone => ({
  ...copy(name, id),
  keywords: [],
});
test("all original SWAP Force pairs can exchange complementary halves without losing cards, pips or keywords", () => {
  const cards = CHARACTER_STONES.filter(isSwapForce);
  assert.equal(cards.length, 16);
  for (let a = 0; a < cards.length; a++)
    for (let b = a + 1; b < cards.length; b++) {
      const first = { ...cards[a], id: `custom-${a}` },
        second = { ...cards[b], id: `custom-${b}` };
      const before = structuredClone([first, second]),
        [one, two] = swapCards(first, second);
      assert.deepEqual([first, second], before);
      assert.deepEqual(one.edges, [
        first.edges[0],
        second.edges[1],
        second.edges[2],
        first.edges[3],
      ]);
      assert.deepEqual(two.edges, [
        second.edges[0],
        first.edges[1],
        first.edges[2],
        second.edges[3],
      ]);
      assert.equal(one.element, first.element);
      assert.equal(two.element, second.element);
      assert.ok(validateStone(one));
      assert.ok(validateStone(two));
      assert.equal(
        (one.keywords?.length || 0) + (two.keywords?.length || 0),
        (first.keywords?.length || 0) + (second.keywords?.length || 0),
      );
    }
});
test("explicit half assignments carry whole effects independently of their target directions", () => {
  const first = clean("Wash Buckler"),
    second = clean("Blast Zone");
  first.keywords = [
    { type: "shield", side: 1, amount: 2, half: "top" },
    { type: "sunder", side: 0, amount: 3, half: "bottom" },
  ];
  second.keywords = [
    { type: "comeback", side: 3, amount: 2, half: "top" },
    { type: "shield", side: 2, amount: 4, half: "bottom" },
  ];
  const [washZone, blastBuckler] = swapCards(first, second);
  assert.equal(washZone.name, "Wash Zone");
  assert.equal(blastBuckler.name, "Blast Buckler");
  assert.deepEqual(washZone.keywords, [first.keywords[0], second.keywords[1]]);
  assert.deepEqual(blastBuckler.keywords, [
    second.keywords[0],
    first.keywords[1],
  ]);
  const played = placeStone(EMPTY_BOARD(3), 4, washZone, 0);
  assert.equal(defenseEdges(played.board[4]!)[1], washZone.edges[1] + 2);
  assert.equal(defenseEdges(played.board[4]!)[2], washZone.edges[2] + 4);
  assert.equal(keywordHalf({ type: "silence" }), "top");
  assert.equal(keywordHalf({ type: "head-start", side: 2 }), "bottom");
});
test("repeated exchanges move original parts without nested composites and can restore the pair", () => {
  const cards = [
    clean("Wash Buckler"),
    clean("Blast Zone"),
    clean("Hoot Loop"),
  ];
  const first = swapHand(cards, cards[0].id, cards[1].id);
  const second = swapHand(first, cards[0].id, cards[2].id);
  assert.deepEqual(
    second.map((card) => card.id),
    cards.map((card) => card.id),
  );
  assert.equal(second[0].swapParts!.bottom.id, cards[2].id);
  assert.equal(second[2].swapParts!.bottom.id, cards[1].id);
  assert.equal(second[1].swapParts!.bottom.id, cards[0].id);
  assert.ok(second.every((card) => validSwapParts(card.swapParts)));
  assert.ok(!("swapParts" in second[0].swapParts!.bottom));
  const restored = swapHand(first, cards[0].id, cards[1].id);
  assert.deepEqual(
    restored.map((card) => card.edges),
    cards.map((card) => card.edges),
  );
  assert.deepEqual(
    restored.map((card) => card.name),
    cards.map((card) => card.name),
  );
  assert.ok(restored.every(validateStone));
});
test("matching keywords on different halves combine independently while oversized halves are rejected atomically", () => {
  const a = clean("Wash Buckler"),
    b = clean("Blast Zone");
  a.keywords = [{ type: "combo", half: "top", pips: [{ side: 0, amount: 1 }] }];
  b.keywords = [
    { type: "combo", half: "bottom", pips: [{ side: 1, amount: 1 }] },
  ];
  const before = structuredClone([a, b]);
  const [mixed] = swapCards(a, b);
  assert.equal(mixed.keywords!.filter((k) => k.type === "combo").length, 2);
  assert.ok(validateStone(mixed));
  assert.deepEqual([a, b], before);
  const many = (half: "top" | "bottom"): StoneKeyword[] =>
    Array.from({ length: 24 }, () => ({ type: "sunder", side: 0, half }));
  assert.throws(
    () =>
      swapCards(
        { ...a, keywords: many("top") },
        { ...b, keywords: many("bottom") },
      ),
    /24-keyword/,
  );
  assert.throws(() => swapCards(a, { ...b, tribes: ["core"] }), /SWAP Force/);
  assert.throws(() => swapCards(a, a), /different/);
  assert.throws(
    () => swapHand([a, b], a.id, "missing"),
    /still be in your hand/,
  );
  assert.ok(!validateKeywords([{ type: "shield", side: 0, half: "left" }]));
});
test("battle combinations can exceed the ordinary card budget and carry generated pips without changing templates", () => {
  const a = { ...clean("Wash Buckler"), edges: [5, 0, 0, 5] as Stone["edges"] },
    b = { ...clean("Blast Zone"), edges: [0, 5, 5, 0] as Stone["edges"] };
  const [big] = swapCards(a, b);
  assert.deepEqual(big.edges, [5, 5, 5, 5]);
  assert.ok(validateStone(big));
  assert.ok(!validateStone({ ...big, swapParts: undefined }));
  const [generated] = swapCards(a, {
    ...b,
    conjured: true,
    edges: [0, 64, 64, 0],
  });
  assert.deepEqual(generated.edges, [5, 64, 64, 5]);
  assert.ok(validateStone(generated));
  assert.ok(
    !tokenDefinition({ ...big, token: true, id: "custom-token-mixed" }),
  );
  const original = CHARACTER_STONES.find(
    (card) => card.name === "Wash Buckler",
  )!;
  const key = original.portrait!;
  const defaults = editedCharacterDefault(
    key,
    { ...original, keywords: [{ type: "shield", side: 0, half: "bottom" }] },
    {},
  );
  assert.equal(defaults[key].card.keywords![0].half, "bottom");
  assert.deepEqual(
    parseCharacterDefaults({
      [key]: {
        ...defaults[key],
        card: { ...defaults[key].card, swapParts: big.swapParts },
      },
    }),
    {},
  );
});
test("malformed part snapshots and permanent hybrids are rejected on load", () => {
  const [mixed] = swapCards(clean("Wash Buckler"), clean("Blast Zone"));
  for (const change of [
    { name: "" },
    { portrait: "unknown" },
    { element: "unknown" },
    { tribes: ["core"] },
    { image: "https://example.com/image.png" },
  ]) {
    const bad = {
      ...mixed,
      swapParts: {
        ...mixed.swapParts!,
        bottom: { ...mixed.swapParts!.bottom, ...change },
      },
    };
    assert.ok(!validateStone(bad));
    assert.ok(!validSwapParts(bad.swapParts));
  }
  const run = newAdventure(3, 89);
  run.inventory[0] = { ...mixed, id: run.inventory[0].id };
  assert.ok(!validateAdventure(run));
});
test("discard gifts follow their pip halves and swapping leaves queued Next Play effects unspent", () => {
  const a = clean("Wash Buckler"),
    b = clean("Blast Zone");
  a.discardBuffs = { pips: [1, 2, 3, 4], shields: [4, 3, 2, 1] };
  b.discardBuffs = { pips: [4, 3, 2, 1], shields: [1, 2, 3, 4] };
  const [one, two] = swapCards(a, b);
  assert.deepEqual(one.discardBuffs, {
    pips: [1, 3, 2, 4],
    shields: [4, 2, 3, 1],
  });
  assert.deepEqual(two.discardBuffs, {
    pips: [4, 2, 3, 1],
    shields: [1, 3, 2, 4],
  });
  const queue = {
    ...clean("Hoot Loop"),
    keywords: [
      {
        type: "next-play",
        side: 0,
        amount: 2,
        recipient: "self",
      } as StoneKeyword,
    ],
  };
  const board = placeStone(EMPTY_BOARD(3), 0, queue, 0).board;
  const saved = structuredClone(board);
  assert.equal(pendingPipEffects(board, 0).length, 1);
  assert.equal(evaluateKeywords(one, board, 0).edges[0], one.edges[0] + 1 + 2);
  assert.deepEqual(board, saved);
  assert.equal(pendingPipEffects(board, 0).length, 1);
});
for (const size of [3, 4] as const)
  test(`${size}×${size} Adventure swaps are free, battle-only, and survive reloads in hand and after placement`, () => {
    let run = enterAdventureNode(newAdventure(size, 89), "moss");
    for (const [index, name] of ["Wash Buckler", "Blast Zone"].entries()) {
      const source = clean(name);
      const card = {
        ...source,
        id: run.inventory[index].id,
        baseEdges: [...source.edges] as Stone["edges"],
        baseKeywords: [],
      };
      run.inventory[index] = card;
      run.battle!.hands[0][index] = card;
    }
    const before = structuredClone(run),
      [a, b] = run.battle!.hands[0];
    run = swapAdventureCards(run, a.id, b.id);
    assert.deepEqual(run.inventory, before.inventory);
    assert.deepEqual(run.deck, before.deck);
    assert.deepEqual(run.battle!.board, before.battle!.board);
    assert.equal(run.battle!.turns, 0);
    assert.equal(run.battle!.current, 0);
    assert.equal(run.gold, before.gold);
    assert.equal(run.battle!.hands[0].length, size === 3 ? 5 : 8);
    assert.ok(validateAdventure(run));
    let restored = restoreAdventure(JSON.parse(JSON.stringify(run)))!;
    assert.equal(restored.battle!.hands[0][0].name, "Wash Zone");
    assert.deepEqual(
      restored.battle!.hands[0][0].swapParts,
      run.battle!.hands[0][0].swapParts,
    );
    restored = playAdventureCard(restored, 0, 0);
    assert.ok(validateAdventure(restored));
    const again = restoreAdventure(JSON.parse(JSON.stringify(restored)))!;
    assert.equal(again.battle!.board[0]!.stone.name, "Wash Zone");
    assert.equal(again.battle!.hands[0][0].name, "Blast Buckler");
    assert.deepEqual(again.inventory, before.inventory);
    assert.throws(() => swapAdventureCards(again, a.id, b.id), /your turn/);
  });
