import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  DELETED_CONTENT_STORAGE,
  readDeletedContent,
  deleteDefault,
  restoreDefault,
  restoreDeletedDefaults,
  availableCards,
} from "../src/deletedContent.ts";
import { DEFAULT_TOKENS, readTokens, LIBRARY_STORAGE } from "../src/tokens.ts";
import { DEFAULT_PARTS, assembleParts, combineParts } from "../src/assemble.ts";
import { DEFAULT_SPELLS } from "../src/spellCards.ts";
import { DEFAULT_TRAPS, readTraps, saveTrap } from "../src/traps.ts";
import {
  CHARACTER_STONES,
  ENEMY_STONES,
  ADVENTURE_CHARACTERS,
} from "../src/characters.ts";
import { EMPTY_BOARD, STARTER_STONES, placeStone } from "../src/game.ts";
import type { Stone, StoneKeyword } from "../src/game.ts";
import { applyConjure, CONJURE_CARDS } from "../src/conjure.ts";
import {
  newAdventure,
  makeRunCard,
  restoreAdventure,
} from "../src/adventure.ts";
import { newDraft } from "../src/draft.ts";
import { rollKeywords } from "../src/randomKeywords.ts";
import { collectionExport } from "../src/collectionExport.ts";
import {
  keywordTypes,
  keywordMatches,
  keywordSearchText,
} from "../src/keywordSearch.ts";

const originalStorage = Object.getOwnPropertyDescriptor(
  globalThis,
  "localStorage",
);
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
let data: Map<string, string>;
let fail = false;
beforeEach(() => {
  data = new Map();
  fail = false;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => {
        if (fail) throw new Error("quota");
        data.set(key, value);
      },
      removeItem: (key: string) => data.delete(key),
    },
  });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { dispatchEvent: () => true },
  });
});
afterEach(() => {
  if (originalStorage)
    Object.defineProperty(globalThis, "localStorage", originalStorage);
  else Reflect.deleteProperty(globalThis, "localStorage");
  if (originalWindow)
    Object.defineProperty(globalThis, "window", originalWindow);
  else Reflect.deleteProperty(globalThis, "window");
});
const make = (keywords: StoneKeyword[]): Stone => ({
  ...STARTER_STONES[0],
  id: "custom-giver",
  name: "Giver",
  custom: true,
  edges: [0, 0, 0, 0],
  keywords,
});

test("default deletion persists without mutating factories, is idempotent, and can be restored individually or together", () => {
  const card = CHARACTER_STONES[0],
    before = structuredClone(CHARACTER_STONES);
  deleteDefault("card", card.id, card.name);
  deleteDefault("card", card.id, card.name);
  deleteDefault("trap", DEFAULT_TRAPS[0].id, DEFAULT_TRAPS[0].name);
  assert.equal(readDeletedContent().length, 2);
  assert.ok(!availableCards(CHARACTER_STONES).some((c) => c.id === card.id));
  assert.deepEqual(CHARACTER_STONES, before);
  restoreDefault("card", card.id);
  assert.equal(
    availableCards(CHARACTER_STONES).length,
    CHARACTER_STONES.length,
  );
  assert.equal(readDeletedContent().length, 1);
  restoreDeletedDefaults();
  assert.deepEqual(readDeletedContent(), []);
});
test("malformed saves and failed writes never claim a successful deletion", () => {
  data.set(DELETED_CONTENT_STORAGE, "not json");
  assert.deepEqual(readDeletedContent(), []);
  data.set(
    DELETED_CONTENT_STORAGE,
    JSON.stringify([{ kind: "bad", id: "x", name: "Bad" }, null]),
  );
  assert.deepEqual(readDeletedContent(), []);
  fail = true;
  assert.throws(
    () => deleteDefault("card", CHARACTER_STONES[0].id, "Spyro"),
    /quota/,
  );
  assert.equal(
    availableCards(CHARACTER_STONES).length,
    CHARACTER_STONES.length,
  );
});
test("tokens, spells and Parts stay deleted through catalogue caching, and restore preserves edited templates", () => {
  const edited = {
    ...DEFAULT_TOKENS[0],
    name: "Edited Seedling",
    edges: [2, 2, 2, 2] as Stone["edges"],
  };
  data.set(LIBRARY_STORAGE, JSON.stringify({ custom: [edited] }));
  assert.equal(readTokens().find((c) => c.id === edited.id)!.name, edited.name);
  for (const card of [edited, DEFAULT_PARTS[0], DEFAULT_SPELLS[0]])
    deleteDefault("card", card.id, card.name);
  for (const card of [edited, DEFAULT_PARTS[0], DEFAULT_SPELLS[0]])
    assert.ok(!readTokens().some((c) => c.id === card.id));
  restoreDefault("card", edited.id);
  assert.deepEqual(
    readTokens().find((c) => c.id === edited.id),
    edited,
  );
  assert.ok(!readTokens().some((c) => c.id === DEFAULT_PARTS[0].id));
});
test("Traps can be deleted and restored, and editing another Trap does not erase deleted custom definitions", () => {
  const custom = {
    ...DEFAULT_TRAPS[0],
    id: "trap-custom-saved",
    name: "Saved crystal",
  };
  saveTrap(custom);
  deleteDefault("trap", custom.id, custom.name);
  deleteDefault("trap", DEFAULT_TRAPS[0].id, DEFAULT_TRAPS[0].name);
  assert.ok(
    !readTraps().some(
      (t) => t.id === custom.id || t.id === DEFAULT_TRAPS[0].id,
    ),
  );
  saveTrap({ ...custom, id: "trap-custom-other", name: "Other crystal" });
  restoreDefault("trap", custom.id);
  assert.deepEqual(
    readTraps().find((t) => t.id === custom.id),
    custom,
  );
  for (const trap of readTraps()) deleteDefault("trap", trap.id, trap.name);
  assert.deepEqual(readTraps(), []);
  assert.deepEqual(rollKeywords({ count: 2, pool: ["trap"] }, 81), []);
  assert.ok(
    newDraft(3, 81).cards.every((c) =>
      c.keywords?.every((k) => k.type !== "trap"),
    ),
  );
});
test("deleted cards cannot be Conjured or Assembled, while existing hand copies and Parts still work", () => {
  const card = CHARACTER_STONES[0],
    token = DEFAULT_TOKENS[0],
    part = DEFAULT_PARTS[0];
  for (const c of [card, token, part]) deleteDefault("card", c.id, c.name);
  for (const keyword of [
    {
      type: "conjure",
      mode: "specific",
      card: card.portrait!,
      count: 1,
      recipient: "self",
    },
    {
      type: "conjure",
      mode: "token",
      token: token.id,
      count: 1,
      recipient: "self",
    },
  ] as StoneKeyword[]) {
    const board = placeStone(EMPTY_BOARD(), 0, make([keyword]), 0).board;
    const result = applyConjure(board, 0, [[card], []], CONJURE_CARDS, 81);
    assert.deepEqual(result.hands, [[card], []]);
    assert.equal(result.conjurations[0].cards.length, 0);
  }
  const board = placeStone(
    EMPTY_BOARD(),
    0,
    make([{ type: "assemble", mode: "specific", part: part.id, count: 1 }]),
    0,
  ).board;
  assert.deepEqual(assembleParts(board, 0, [[], []], 81).hands, [[], []]);
  assert.equal(combineParts([part, DEFAULT_PARTS[1]]).length, 1);
  assert.deepEqual(placeStone(EMPTY_BOARD(), 0, card, 0).board[0]!.stone, card);
});
test("new Adventure and Draft generation exclude deleted characters and give clear errors when their pools are depleted", () => {
  const card = CHARACTER_STONES[0];
  deleteDefault("card", card.id, card.name);
  for (let seed = 0; seed < 30; seed++) {
    assert.notEqual(
      makeRunCard(seed, 6, `test-${seed}`, 3).portrait,
      card.portrait,
    );
    assert.ok(
      newDraft(3, seed).cards.every((c) => c.portrait !== card.portrait),
    );
  }
  data.set(
    DELETED_CONTENT_STORAGE,
    JSON.stringify(
      [...CHARACTER_STONES, ...ENEMY_STONES].map((c) => ({
        kind: "card",
        id: c.id,
        name: c.name,
      })),
    ),
  );
  assert.throws(() => newAdventure(3, 81), /Restore deleted cards/);
  assert.throws(() => newDraft(3, 81), /25 available characters/);
});
test("deleting defaults preserves saved Adventure cards and appears in the all-card export", () => {
  const run = newAdventure(3, 81),
    saved = JSON.parse(JSON.stringify(run));
  const first = run.inventory[0];
  const base = ADVENTURE_CHARACTERS.find((c) => c.portrait === first.portrait)!;
  deleteDefault("card", base.id, base.name);
  const restored = restoreAdventure(saved)!;
  assert.deepEqual(restored.inventory, saved.inventory);
  const report = collectionExport([], {});
  assert.deepEqual(report.deletedContent, [
    { kind: "card", id: base.id, name: base.name },
  ]);
});
test("keyword searches match names, conditions and nested grants without changing the card", () => {
  const keywords: StoneKeyword[] = [
    {
      type: "combo",
      keywords: [{ type: "amplify", effect: "all", duration: "always" }],
    },
  ];
  const before = structuredClone(keywords);
  assert.deepEqual(keywordTypes(keywords), ["combo", "amplify"]);
  assert.ok(keywordSearchText(keywords).includes("Amplify"));
  assert.ok(keywordMatches("head-start", "head start"));
  assert.ok(keywordMatches("environment-immunity", "ignore tile"));
  assert.equal(keywordMatches("sunder", "conjure"), false);
  assert.deepEqual(keywords, before);
});
