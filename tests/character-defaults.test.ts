import { test } from "node:test";
import assert from "node:assert/strict";
import { CHARACTER_STONES, ENEMY_STONES } from "../src/characters.ts";
import {
  CHARACTER_DEFAULTS_STORAGE,
  characterDefault,
  editedCharacterDefault,
  originalCharacter,
  parseCharacterDefaults,
  readCharacterDefaults,
  saveCharacterDefaults,
} from "../src/cardDefaults.ts";
import { draftCards, newDraft, restoreDraft } from "../src/draft.ts";
import {
  makeRunCard,
  newAdventure,
  enterAdventureNode,
  restoreAdventure,
  buyAdventureService,
  adventureWorkshopOffer,
  playAdventureCard,
} from "../src/adventure.ts";
import type { CharacterDefaults } from "../src/cardDefaults.ts";
import type { Stone } from "../src/game.ts";
function storage(t: { after: (fn: () => void) => void }) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage"),
    data = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
    },
  });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else Reflect.deleteProperty(globalThis, "localStorage");
  });
  return data;
}
test("edited defaults keep the character's identity and deck ID while allowing a new name, portrait, pips, element and keywords", (t) => {
  storage(t);
  const original = CHARACTER_STONES[0];
  const edited: Stone = {
    ...original,
    name: "Rainbow Spyro",
    portrait: "dark-spyro",
    element: "water",
    edges: [1, 2, 3, 1],
    keywords: [
      { type: "dizzy", sides: [1] },
      { type: "sunder", side: 0, amount: 2 },
    ],
    description: "A reimagined dragon.",
  };
  const defaults = editedCharacterDefault(original.portrait!, edited, {});
  saveCharacterDefaults(defaults);
  const resolved = characterDefault(original);
  assert.equal(resolved.id, original.id);
  assert.equal(resolved.characterKey, original.portrait);
  assert.equal(resolved.name, edited.name);
  assert.equal(resolved.portrait, edited.portrait);
  assert.deepEqual(resolved.edges, edited.edges);
  assert.deepEqual(resolved.keywords, edited.keywords);
  assert.equal(resolved.element, "water");
  assert.equal(resolved.description, edited.description);
  assert.equal(CHARACTER_STONES[0].name, original.name);
  const form = CHARACTER_STONES.find(
    (card) => card.portrait !== original.portrait,
  )!;
  assert.equal(characterDefault(form), form);
});
test("new Draft cards and Adventure factories use the exact saved base, with no random pip or keyword replacement", (t) => {
  storage(t);
  const candidate = draftCards(47, {})[0],
    original = originalCharacter(candidate.portrait)!;
  const edited: Stone = {
    ...original,
    name: "Shared Default",
    edges: [1, 1, 2, 1],
    keywords: [{ type: "dizzy", sides: [0, 3] }],
    description: "Same starting card in every mode.",
  };
  saveCharacterDefaults(editedCharacterDefault(original.portrait!, edited, {}));
  const draft = newDraft(3, 47),
    card = draft.cards.find((card) => card.characterKey === original.portrait)!;
  assert.ok(card);
  assert.deepEqual(card.edges, edited.edges);
  assert.deepEqual(card.keywords, edited.keywords);
  assert.equal(card.description, edited.description);
  let found: Stone | undefined;
  for (let seed = 0; seed < 2000 && !found; seed++) {
    const card = makeRunCard(seed, 5, "defaults-check", 9);
    if (card.characterKey === original.portrait) found = card;
  }
  assert.ok(found);
  assert.deepEqual(found.edges, edited.edges);
  assert.deepEqual(found.keywords, edited.keywords);
  assert.deepEqual(found.baseEdges, edited.edges);
  assert.deepEqual(found.baseKeywords, edited.keywords);
  assert.equal(found.description, edited.description);
});
test("existing draft nominations and card snapshots stay unchanged when defaults change or are reset", (t) => {
  storage(t);
  const original = originalCharacter(draftCards(47, {})[0].portrait)!;
  const first = editedCharacterDefault(
    original.portrait!,
    { ...original, name: "First Version", edges: [1, 1, 1, 1] },
    {},
  );
  saveCharacterDefaults(first);
  const saved = JSON.parse(JSON.stringify(newDraft(4, 47)));
  saveCharacterDefaults(
    editedCharacterDefault(
      original.portrait!,
      { ...original, name: "Second Version", edges: [2, 2, 2, 2] },
      first,
    ),
  );
  assert.deepEqual(restoreDraft(saved)!.cards, saved.cards);
  assert.equal(
    newDraft(4, 47).cards.find(
      (card) => card.characterKey === original.portrait,
    )!.name,
    "Second Version",
  );
  saveCharacterDefaults({});
  assert.deepEqual(restoreDraft(saved)!.cards, saved.cards);
  assert.equal(characterDefault(original), original);
});
test("pre-feature drafts and existing Adventure inventories keep their saved cards after a default edit", (t) => {
  storage(t);
  const oldDraft = JSON.parse(JSON.stringify(newDraft(3, 47, {}))),
    oldRun = JSON.parse(
      JSON.stringify(enterAdventureNode(newAdventure(3, 81), "moss")),
    );
  const original = originalCharacter(oldRun.inventory[0].portrait)!;
  saveCharacterDefaults(
    editedCharacterDefault(
      original.portrait!,
      { ...original, name: "Future Version", edges: [2, 2, 2, 2] },
      {},
    ),
  );
  assert.deepEqual(restoreDraft(oldDraft)!.cards, oldDraft.cards);
  const restored = restoreAdventure(oldRun)!;
  assert.deepEqual(restored.inventory, oldRun.inventory);
  assert.deepEqual(restored.battle, oldRun.battle);
});
test("Skystones shop inscriptions are saved and actually activate when the upgraded card is played", (t) => {
  storage(t);
  const original = ENEMY_STONES.find((card) => card.name === "Enfuego Chompy")!;
  let run = enterAdventureNode(
    { ...newAdventure(3, 81), floor: 2, gold: 100 },
    "shop-one",
  );
  const card = { ...original, id: run.inventory[0].id, keywords: [] };
  run.inventory[0] = card;
  run.shopOffer = {
    pipSide: 0,
    keyword: { type: "shield", side: 0, amount: 2 },
  };
  run = buyAdventureService(run, { type: "keyword", cardId: card.id });
  assert.equal(run.gold, 65);
  assert.deepEqual(run.inventory[0].keywords, [run.shopOffer!.keyword]);
  run = restoreAdventure(JSON.parse(JSON.stringify(run)))!;
  const battle = enterAdventureNode(
    { ...run, phase: "map", floor: 3, node: undefined },
    "reef",
  );
  const played = playAdventureCard(battle, 0, 0);
  assert.deepEqual(played.battle!.board[0]!.shields, [2, 0, 0, 0]);
  assert.deepEqual(
    restoreAdventure(JSON.parse(JSON.stringify(played)))!.battle!.board[0]!
      .shields,
    [2, 0, 0, 0],
  );
});
test("new Adventure runs start with an empty potion belt on both board sizes", () => {
  for (const size of [3, 4] as const)
    assert.deepEqual(newAdventure(size, 42).potions, []);
});
test("malformed or unknown default entries are ignored and malformed JSON cannot revive cached defaults", (t) => {
  const data = storage(t),
    original = CHARACTER_STONES[0];
  const defaults = editedCharacterDefault(original.portrait!, original, {});
  saveCharacterDefaults(defaults);
  data.set(CHARACTER_DEFAULTS_STORAGE, "not json");
  assert.deepEqual(readCharacterDefaults(), {});
  assert.deepEqual(readCharacterDefaults(), {});
  assert.deepEqual(
    parseCharacterDefaults({ unknown: defaults[original.portrait!] }),
    {},
  );
  const invalid = structuredClone(defaults);
  invalid[original.portrait!].card.edges = [99, 0, 0, 0];
  assert.deepEqual(parseCharacterDefaults(invalid), {});
});
