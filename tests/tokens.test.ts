import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_TOKENS,
  tokenDefinition,
  tokenCatalogue,
  readTokens,
  LIBRARY_STORAGE,
  deckEligible,
  tokenDependencies,
  mergeTokenDefinitions,
} from "../src/tokens.ts";
import { CONJURE_CARDS, applyConjure } from "../src/conjure.ts";
import type { ConjureKeyword } from "../src/conjure.ts";
import {
  EMPTY_BOARD,
  STARTER_STONES,
  placeStone,
  validateKeywords,
  validateStone,
  chooseKeywordTargets,
} from "../src/game.ts";
import type { Stone, BoardSize, StoneKeyword } from "../src/game.ts";
import { hasTribe } from "../src/tribes.ts";
import { newDraft } from "../src/draft.ts";
import {
  newAdventure,
  enterAdventureNode,
  playAdventureCard,
  restoreAdventure,
  validateAdventure,
  rewardCards,
} from "../src/adventure.ts";
import {
  editedCharacterDefault,
  parseCharacterDefaults,
} from "../src/cardDefaults.ts";

const token = DEFAULT_TOKENS[0];
const conjure = (
  id = token.id,
  count = 1,
  recipient: ConjureKeyword["recipient"] = "self",
): ConjureKeyword => ({
  type: "conjure",
  mode: "token",
  token: id,
  count,
  recipient,
});
const caster = (keywords: StoneKeyword[] = [conjure()]): Stone => ({
  ...STARTER_STONES[0],
  id: "custom-token-caster",
  name: "Token Caster",
  edges: [0, 0, 0, 0],
  keywords,
});
const generate = (
  keyword: ConjureKeyword,
  seed = 81,
  tokens: Stone[] = DEFAULT_TOKENS,
) =>
  applyConjure(
    placeStone(EMPTY_BOARD(), 0, caster([keyword]), 0).board,
    0,
    [[], []],
    CONJURE_CARDS,
    seed,
    tokens,
  );

test("all six token templates are valid distinct cards, use bundled portraits, and are ineligible for starting decks", () => {
  assert.equal(DEFAULT_TOKENS.length, 6);
  assert.equal(new Set(DEFAULT_TOKENS.map((card) => card.id)).size, 6);
  for (const card of DEFAULT_TOKENS) {
    assert.ok(validateStone(card));
    assert.ok(tokenDefinition(card));
    assert.equal(deckEligible(card), false);
    assert.ok(card.portrait);
    assert.throws(() => placeStone(EMPTY_BOARD(), 0, card, 0), /Conjure/);
  }
  assert.equal(deckEligible(STARTER_STONES[0]), true);
});
test("specified tokens generate independent playable copies for both players and keep their template stats and keywords", () => {
  const result = generate(conjure(DEFAULT_TOKENS[1].id, 3, "both"));
  assert.deepEqual(
    result.hands.map((hand) => hand.length),
    [3, 3],
  );
  assert.equal(new Set(result.hands.flat().map((card) => card.id)).size, 6);
  for (const card of result.hands.flat()) {
    assert.equal(card.token, true);
    assert.equal(card.conjured, true);
    assert.deepEqual(card.edges, DEFAULT_TOKENS[1].edges);
    assert.deepEqual(card.keywords, DEFAULT_TOKENS[1].keywords);
    assert.ok(validateStone(card));
    assert.equal(deckEligible(card), false);
    assert.ok(placeStone(result.board, 4, card, 0).board[4]);
  }
  result.hands[0][0].edges[0]++;
  assert.deepEqual(result.hands[0][1].edges, DEFAULT_TOKENS[1].edges);
});
test("random Conjure defaults to normal cards, while token-only and mixed pools are explicit and seeded", () => {
  const seen = new Set<string>();
  for (let seed = 1; seed <= 20; seed++) {
    const normal = generate(
      { type: "conjure", mode: "random", count: 5, recipient: "self" },
      seed,
    );
    assert.ok(normal.hands[0].every((card) => !card.token));
    const keyword: ConjureKeyword = {
      type: "conjure",
      mode: "random",
      pool: "tokens",
      count: 5,
      recipient: "self",
    };
    const result = generate(keyword, seed);
    assert.ok(result.hands[0].every((card) => card.token && card.conjured));
    assert.equal(new Set(result.hands[0].map((card) => card.name)).size, 5);
    assert.deepEqual(result, generate(keyword, seed));
    const mixed = applyConjure(
      placeStone(EMPTY_BOARD(), 0, caster([{ ...keyword, pool: "all" }]), 0)
        .board,
      0,
      [[], []],
      [STARTER_STONES[0], token],
      seed,
      [token],
    );
    assert.ok(mixed.hands[0].some((card) => card.token));
    assert.ok(mixed.hands[0].some((card) => !card.token));
    result.hands[0].forEach((card) => seen.add(card.name));
  }
  assert.equal(seen.size, 6);
});
test("random token filters require both element and tribe, and a missing or unmatched token yields no cards", () => {
  const keyword: ConjureKeyword = {
    type: "conjure",
    mode: "random",
    pool: "tokens",
    element: "fire",
    tribe: "giants",
    count: 3,
    recipient: "self",
  };
  const result = generate(keyword);
  assert.equal(result.hands[0].length, 3);
  assert.ok(
    result.hands[0].every(
      (card) => card.element === "fire" && hasTribe(card, "giants"),
    ),
  );
  for (const missing of [
    conjure("custom-token-not-installed"),
    { ...keyword, element: "neutral" as const },
  ]) {
    const result = generate(missing);
    assert.equal(result.hands[0].length, 0);
    assert.equal(result.conjurations[0].reason, "no-match");
  }
});
test("token choices and random pools validate in ordinary and Combo keywords and reject ambiguous or malformed imports", () => {
  assert.ok(
    validateKeywords([conjure(), { type: "combo", keywords: [conjure()] }]),
  );
  for (const keyword of [
    { ...conjure(), token: "spyro" },
    { ...conjure(), token: null },
    { ...conjure(), card: "spyro" },
    { ...conjure(), side: 0 },
    { ...conjure(), element: "fire" },
    { ...conjure(), pool: "tokens" },
    {
      type: "conjure",
      mode: "random",
      count: 1,
      recipient: "self",
      pool: "unknown",
    },
  ])
    assert.equal(validateKeywords([keyword]), false);
});
test("token files collect transitive dependencies, Combo grants, filtered random pools, and cycles without nesting definitions", () => {
  const a = {
    ...token,
    id: "custom-token-alpha",
    keywords: [conjure("custom-token-beta")],
  };
  const b = {
    ...token,
    id: "custom-token-beta",
    keywords: [{ type: "combo" as const, keywords: [conjure(a.id)] }],
  };
  const cards = [a, b, ...DEFAULT_TOKENS];
  assert.deepEqual(
    tokenDependencies(caster([conjure(a.id)]), cards).map((card) => card.id),
    [a.id, b.id],
  );
  assert.deepEqual(
    tokenDependencies(a, cards).map((card) => card.id),
    [b.id],
  );
  assert.deepEqual(
    tokenDependencies(
      caster([
        {
          type: "conjure",
          mode: "random",
          pool: "tokens",
          element: "fire",
          count: 1,
          recipient: "self",
        },
      ]),
      cards,
    ).map((card) => card.id),
    [DEFAULT_TOKENS[2].id],
  );
  assert.throws(
    () => tokenDependencies(caster([conjure("custom-token-missing")]), cards),
    /missing/,
  );
  const source = caster([conjure(a.id)]);
  const imported = mergeTokenDefinitions(
    [],
    JSON.parse(JSON.stringify(tokenDependencies(source, cards))),
  );
  const generated = generate(conjure(a.id), 81, tokenCatalogue(imported));
  assert.equal(generated.hands[0].length, 1);
  assert.deepEqual(generated.hands[0][0].keywords, a.keywords);
  assert.equal(generated.hands[0][0].name, a.name);
});
test("token imports merge only valid definitions, replace edited templates, and preserve ordinary custom cards", () => {
  const normal = caster([]),
    changed = {
      ...token,
      name: "Edited Seedling",
      edges: [2, 0, 0, 0] as Stone["edges"],
    };
  const imported = mergeTokenDefinitions([normal, token], [changed]);
  assert.deepEqual(imported, [normal, changed]);
  assert.equal(
    tokenCatalogue(imported).find((card) => card.id === token.id)!.name,
    changed.name,
  );
  for (const invalid of [
    [normal],
    [token, token],
    [{ ...token, token: false }],
    [{ ...token, edges: [99, 0, 0, 0] }],
  ])
    assert.throws(() => mergeTokenDefinitions([], invalid as Stone[]));
});
test("saved token edits affect newly generated copies and never rewrite copies already in a hand", (t) => {
  const descriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage",
  );
  let raw: string | null = null;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: (key: string) => (key === LIBRARY_STORAGE ? raw : null) },
  });
  t.after(() => {
    if (descriptor)
      Object.defineProperty(globalThis, "localStorage", descriptor);
    else Reflect.deleteProperty(globalThis, "localStorage");
  });
  assert.equal(readTokens().length, 12);
  const old = generate(conjure());
  raw = JSON.stringify({
    custom: [{ ...token, name: "Edited Seedling", edges: [2, 0, 0, 0] }],
  });
  const board = placeStone(EMPTY_BOARD(), 0, caster(), 0).board;
  const fresh = applyConjure(board, 0, [[], []], CONJURE_CARDS, 81);
  assert.equal(fresh.hands[0][0].name, "Edited Seedling");
  assert.equal(old.hands[0][0].name, token.name);
  raw = "invalid";
  assert.equal(readTokens().length, 12);
});
for (const size of [3, 4] as BoardSize[])
  test(`${size}×${size} Adventure tokens save and play like cards, keep their stats through reload, and never enter the pack`, () => {
    let run = enterAdventureNode(newAdventure(size, 81), "moss");
    const source = {
      ...run.inventory[0],
      keywords: [conjure(token.id, 3, "both")],
    };
    run.inventory[0] = source;
    run.battle!.hands[0][0] = source;
    const inventory = structuredClone(run.inventory);
    run = playAdventureCard(run, 0, 0);
    const snapshot = JSON.parse(JSON.stringify(run));
    assert.ok(validateAdventure(snapshot));
    assert.deepEqual(restoreAdventure(snapshot)!.battle, snapshot.battle);
    assert.equal(run.battle!.hands[0].filter((card) => card.token).length, 3);
    const at = run.battle!.hands[1].findIndex((card) => card.token),
      index = size * size - 1;
    run = playAdventureCard(run, index, at);
    assert.equal(run.battle!.board[index]!.stone.token, true);
    assert.deepEqual(run.battle!.board[index]!.stone.edges, token.edges);
    while (run.phase === "battle") {
      const battle = run.battle!,
        index = battle.board.findIndex((cell) => !cell),
        card = battle.hands[battle.current][0];
      run = playAdventureCard(
        run,
        index,
        0,
        chooseKeywordTargets(battle.board, index, card, battle.current),
      );
    }
    assert.deepEqual(run.inventory, inventory);
  });
test("normal character defaults, Draft pools, Adventure packs, rewards, shops, and carried notes cannot become tokens", () => {
  const original = STARTER_STONES[0];
  assert.throws(() =>
    editedCharacterDefault(
      original.portrait!,
      { ...original, token: true },
      {},
    ),
  );
  assert.deepEqual(
    parseCharacterDefaults({
      [original.portrait!]: {
        revision: 1,
        card: { ...original, token: true, characterKey: original.portrait },
      },
    }),
    {},
  );
  for (const size of [3, 4] as BoardSize[])
    for (let seed = 0; seed < 5; seed++) {
      assert.ok(newDraft(size, seed, {}).cards.every(deckEligible));
      const run = newAdventure(size, seed);
      assert.ok(run.inventory.every(deckEligible));
      assert.ok(rewardCards(run).every(deckEligible));
    }
  const run = enterAdventureNode(newAdventure(3, 81), "moss");
  for (const mutate of [
    (r: typeof run) => {
      r.note = token;
    },
    (r: typeof run) => {
      r.inventory[0] = { ...r.inventory[0], token: true };
    },
    (r: typeof run) => {
      r.shopCards = [token];
    },
    (r: typeof run) => {
      r.rewards = [token];
    },
    (r: typeof run) => {
      r.battle!.hands[0][0] = token;
    },
  ]) {
    const invalid = structuredClone(run);
    mutate(invalid);
    assert.equal(validateAdventure(invalid), false);
  }
});
