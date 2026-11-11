import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CHARACTER_STONES,
  ENEMY_STONES,
  ADVENTURE_CHARACTERS,
  CHARACTER_PORTRAITS,
} from "../src/characters.ts";
import {
  KEYWORD_RULES,
  validateStone,
  validateKeywords,
  EMPTY_BOARD,
  chooseKeywordTargets,
  placeStone,
} from "../src/game.ts";
import type { Stone } from "../src/game.ts";
import { DEFAULT_TOKENS, tokenDependencies } from "../src/tokens.ts";
import { applyConjure, CONJURE_CARDS } from "../src/conjure.ts";
import { resolveDiscards, finishCardsRequired } from "../src/discard.ts";
import {
  makeRunCard,
  newAdventure,
  restoreAdventure,
} from "../src/adventure.ts";
import { draftCards } from "../src/draft.ts";
import {
  characterDefault,
  editedCharacterDefault,
} from "../src/cardDefaults.ts";
const protectedProfiles = JSON.parse(
  readFileSync(
    new URL("./fixtures/protected-card-stats.json", import.meta.url),
    "utf8",
  ),
);
const roles = new Map(CHARACTER_PORTRAITS.map((p) => [p.id, p.role]));
const ordinary = CHARACTER_STONES.filter(
  (c) => !/giant|mini|sidekick/i.test(roles.get(c.portrait!) || ""),
);
const total = (c: Stone) => c.edges.reduce((a, b) => a + b, 0);
test("Skylander bases center on 5–8 pips with weaker cards and a small stronger minority", () => {
  const totals = CHARACTER_STONES.map(total),
    average = totals.reduce((a, b) => a + b, 0) / totals.length;
  assert.ok(average >= 5 && average <= 8);
  assert.ok(
    totals.filter((n) => n >= 5 && n <= 8).length >= totals.length * 0.75,
  );
  assert.ok(totals.some((n) => n < 5));
  assert.ok(totals.some((n) => n > 8));
  assert.ok(totals.filter((n) => n > 8).length <= totals.length * 0.1);
  assert.ok(
    ordinary.every(
      (c) => c.edges.every((n) => n >= 0 && n <= 5) && total(c) <= 12,
    ),
  );
});
test("Giants Skystones, Giant Skylanders and Minis retain their exact normal and Adventure pips and keywords", () => {
  for (const [mode, cards] of [
    ["base", [...CHARACTER_STONES, ...ENEMY_STONES]],
    ["adventure", ADVENTURE_CHARACTERS],
  ] as const)
    for (const expected of protectedProfiles[mode]) {
      const card = cards.find((c) => c.id === expected.id)!;
      assert.deepEqual(
        { id: card.id, edges: card.edges, keywords: card.keywords || [] },
        expected,
        `${mode}: ${card.name}`,
      );
    }
  assert.equal(protectedProfiles.base.length, 63);
});
test("every built-in card has a distinct character-specific flavor and generated copies keep it", () => {
  const all = [...CHARACTER_STONES, ...ENEMY_STONES];
  assert.equal(new Set(all.map((c) => c.description)).size, 221);
  for (const c of all) {
    assert.ok(
      c.description.length >= 30 && c.description.length <= 120,
      c.name,
    );
    assert.doesNotMatch(
      c.description,
      /Pips adapt|A single balanced edition|A Skylanders stone found|A contender from/,
    );
    assert.ok(validateStone({ ...c, id: `custom-${c.id}` }));
  }
  const signature: Record<string, RegExp> = {
    spyro: /dragon.*fiery/i,
    "wash-buckler": /octopus.*cutlass/i,
    "magna-charge": /magnetic.*wheel/i,
    "gill-grunt": /harpoon/i,
    "tree-rex": /ancient tree.*cannon/i,
    boomer: /dynamite/i,
  };
  for (const [id, words] of Object.entries(signature))
    assert.match(
      CHARACTER_STONES.find((c) => c.portrait === id)!.description,
      words,
    );
  for (const c of draftCards(47))
    assert.equal(
      c.description,
      CHARACTER_STONES.find((base) => base.portrait === c.portrait)!
        .description,
    );
  for (let seed = 1; seed <= 80; seed++) {
    const c = makeRunCard(seed, 4 + (seed % 6), `flavor-${seed}`, 8);
    assert.equal(
      c.description,
      ADVENTURE_CHARACTERS.find((base) => base.portrait === c.portrait)!
        .description,
    );
  }
});
test("element themes preserve the original roster keywords and every Conjure template dependency is present", () => {
  const allTypes = new Set(
    CHARACTER_STONES.flatMap((c) => (c.keywords || []).map((k) => k.type)),
  );
  assert.deepEqual(
    [...allTypes].sort(),
    Object.keys(KEYWORD_RULES)
      .filter((type) => type !== "shuffle" && type !== "enchant")
      .sort(),
  );
  const has = (c: Stone, types: string[]) =>
    (c.keywords || []).some((k) => types.includes(k.type));
  assert.ok(
    ordinary
      .filter((c) => c.element === "fire")
      .every((c) => has(c, ["discard"])),
  );
  assert.ok(
    ordinary
      .filter((c) => c.element === "life")
      .every((c) => has(c, ["resonance"])),
  );
  assert.ok(
    ordinary
      .filter((c) => c.element === "magic")
      .every((c) => has(c, ["conjure"])),
  );
  assert.ok(
    ordinary
      .filter((c) => c.element === "undead")
      .every((c) => has(c, ["sunder", "silence", "next-play", "environment"])),
  );
  assert.ok(
    ordinary.filter((c) => c.element === "air").every((c) => has(c, ["shift"])),
  );
  assert.ok(
    ordinary
      .filter((c) => c.element === "tech")
      .every((c) => has(c, ["combo"])),
  );
  for (const c of CHARACTER_STONES) {
    assert.ok(validateKeywords(c.keywords || []));
    assert.doesNotThrow(() => tokenDependencies(c), c.name);
    if (c.keywords?.some((keyword) => keyword.type === "discard-priority"))
      assert.ok(
        c.keywords.some((keyword) => keyword.type === "parting-gift"),
        `${c.name} rewards being used as discard fuel`,
      );
  }
});
test("the revised abilities resolve legally on a contested board without discarding finishing cards", () => {
  const plain: Stone = {
    ...CHARACTER_STONES[0],
    id: "custom-test-filler",
    edges: [1, 1, 1, 1],
    keywords: [],
  };
  for (const card of ordinary) {
    const board = EMPTY_BOARD(3);
    board[1] = {
      stone: { ...plain, id: "enemy" },
      owner: 1,
      edges: [1, 1, 1, 1],
    };
    board[3] = {
      stone: { ...plain, id: "ally" },
      owner: 0,
      edges: [1, 1, 1, 1],
    };
    const targets = chooseKeywordTargets(board, 4, card, 0);
    const placed = placeStone(board, 4, card, 0, targets, { seed: 89 });
    const hands: [Stone[], Stone[]] = [
      Array.from({ length: 4 }, (_, i) => ({
        ...plain,
        id: `custom-self-${i}`,
      })),
      Array.from({ length: 5 }, (_, i) => ({
        ...plain,
        id: `custom-enemy-${i}`,
      })),
    ];
    const conjured = applyConjure(placed.board, 4, hands, CONJURE_CARDS, 89),
      finished = resolveDiscards(conjured.board, 4, conjured.hands, 89);
    const required = finishCardsRequired(finished.board, 1);
    assert.ok(
      finished.hands.every((hand, owner) => hand.length >= required[owner]),
      card.name,
    );
    assert.equal(finished.board[4]!.stone.name, card.name);
  }
});
test("old generic Adventure flavor refreshes without changing stats, abilities or authored descriptions", () => {
  const run = newAdventure(3, 89),
    card = run.inventory[0],
    profile = ADVENTURE_CHARACTERS.find((c) => c.portrait === card.portrait)!;
  card.description = "A Skylanders stone found during the adventure.";
  run.inventory[1].description = "A story written by the player.";
  const restored = restoreAdventure(JSON.parse(JSON.stringify(run)))!;
  assert.equal(restored.inventory[0].description, profile.description);
  assert.deepEqual(restored.inventory[0].edges, card.edges);
  assert.deepEqual(restored.inventory[0].keywords, card.keywords);
  assert.equal(
    restored.inventory[1].description,
    "A story written by the player.",
  );
});
test("saved character edits receive refreshed boilerplate flavor while their stats and abilities stay authored", () => {
  const spyro = CHARACTER_STONES.find((card) => card.portrait === "spyro")!;
  const defaults = editedCharacterDefault(
    "spyro",
    {
      ...spyro,
      name: "My Dragon",
      description:
        "Spyro's Adventure · Core Skylander. Pips adapt the character's strength and fighting style.",
      edges: [1, 1, 1, 1],
      keywords: [{ type: "shield", side: 3, amount: 4 }],
    },
    {},
  );
  const before = structuredClone(defaults),
    card = characterDefault(spyro, defaults);
  assert.equal(card.description, spyro.description);
  assert.equal(card.name, "My Dragon");
  assert.deepEqual(card.edges, [1, 1, 1, 1]);
  assert.deepEqual(card.keywords, [{ type: "shield", side: 3, amount: 4 }]);
  assert.deepEqual(defaults, before);
});
