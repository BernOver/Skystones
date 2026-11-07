import { test } from "node:test";
import assert from "node:assert/strict";
import {
  restoreDecks,
  synchronizeDecks,
  selectSavedDeck,
  createSavedDeck,
  renameSavedDeck,
  deleteSavedDeck,
  deckForBoardSize,
  availableDeckName,
} from "../src/decks.ts";
import { DEFAULT_DECK, STARTER_STONES, handSize } from "../src/game.ts";
import { CHARACTER_STONES, ENEMY_STONES } from "../src/characters.ts";
const allowed = new Set(
  [...CHARACTER_STONES, ...ENEMY_STONES].map((card) => card.id),
);
const ids = STARTER_STONES.map((card) => card.id);
const initial = () => restoreDecks(null, allowed);

test("legacy selections migrate to a named deck without losing order or incomplete edits", () => {
  const state = restoreDecks(
    { deck: [ids[4], ids[0], ids[4], "missing", 7, ids[2]], boardSize: 3 },
    allowed,
  );
  assert.equal(state.decks[0].name, "My deck");
  assert.deepEqual(state.deck, [ids[4], ids[0], ids[2]]);
  assert.deepEqual(state.decks[0].cards, state.deck);
  assert.equal(state.activeDeckId, state.decks[0].id);
  assert.deepEqual(
    restoreDecks(JSON.parse(JSON.stringify(state)), allowed),
    state,
  );
  assert.deepEqual(initial().deck, DEFAULT_DECK);
  assert.deepEqual(restoreDecks({ deck: [], boardSize: 4 }, allowed).deck, []);
});
test("named slots retain independent edits and the legacy fields follow the selected deck", () => {
  const original = initial(),
    copied = createSavedDeck(original, "deck-copy", "Fire team", true);
  assert.deepEqual(original.deck, DEFAULT_DECK);
  const edited = synchronizeDecks(
    { ...copied, deck: [...copied.deck.slice(1), ids[8]] },
    allowed,
  );
  assert.deepEqual(edited.decks[0].cards, original.deck);
  assert.equal(edited.deck.at(-1), ids[8]);
  const switched = selectSavedDeck(edited, original.activeDeckId);
  assert.deepEqual(switched.deck, original.deck);
  const restored = restoreDecks(JSON.parse(JSON.stringify(edited)), allowed);
  assert.deepEqual(restored, edited);
  assert.deepEqual(selectSavedDeck(switched, "deck-copy").deck, edited.deck);
  assert.throws(() => selectSavedDeck(edited, "missing"), /saved deck/);
});
test("board switching preserves all eight cards and recalls the last selected deck for each size", () => {
  const small = initial(),
    large = deckForBoardSize(small, 4, ids, "deck-large");
  assert.equal(large.deck.length, 8);
  assert.deepEqual(large.decks[0].cards, small.deck);
  const originalLarge = [...large.deck];
  let second = createSavedDeck(large, "deck-second-large", "Giants", true);
  second = synchronizeDecks({ ...second, deck: ids.slice(3, 11) }, allowed);
  const returned = deckForBoardSize(second, 3, ids, "unused-id");
  assert.equal(returned.activeDeckId, small.activeDeckId);
  assert.deepEqual(returned.deck, small.deck);
  const recalled = deckForBoardSize(returned, 4, ids, "also-unused");
  assert.equal(recalled.activeDeckId, second.activeDeckId);
  assert.deepEqual(recalled.deck, second.deck);
  assert.deepEqual(
    recalled.decks.find((deck) => deck.id === "deck-large")!.cards,
    originalLarge,
  );
  assert.equal(recalled.decks.length, 3);
  const fromLarge = deckForBoardSize(
    restoreDecks({ deck: ids.slice(0, 8), boardSize: 4 }, allowed),
    3,
    ids,
    "deck-small",
  );
  assert.deepEqual(fromLarge.decks[0].cards, ids.slice(0, 8));
  assert.deepEqual(fromLarge.deck, ids.slice(0, 5));
});
test("new empty decks and incomplete conversions stay incomplete instead of filling unwanted cards", () => {
  const empty = createSavedDeck(initial(), "deck-empty", "New idea", false, 4);
  assert.equal(empty.boardSize, 4);
  assert.deepEqual(empty.deck, []);
  assert.deepEqual(empty.decks[0].cards, DEFAULT_DECK);
  const partial = synchronizeDecks(
    { ...initial(), deck: ids.slice(0, 3) },
    allowed,
  );
  assert.deepEqual(
    deckForBoardSize(partial, 4, ids, "deck-four").deck,
    ids.slice(0, 3),
  );
});
test("renaming keeps the slot and cards, enforces usable distinct names, and generates short unique suggestions", () => {
  const state = createSavedDeck(initial(), "deck-copy", "Second deck", true);
  const renamed = renameSavedDeck(state, "  Fire team  ");
  assert.equal(renamed.decks[1].name, "Fire team");
  assert.equal(renamed.activeDeckId, state.activeDeckId);
  assert.deepEqual(renamed.deck, state.deck);
  assert.throws(() => renameSavedDeck(renamed, "my DECK"), /already used/);
  assert.throws(() => renameSavedDeck(renamed, "  "), /name/);
  assert.throws(() => renameSavedDeck(renamed, "a".repeat(41)), /name/);
  assert.throws(
    () => createSavedDeck(state, state.activeDeckId, "Other"),
    /slot/,
  );
  const long = renameSavedDeck(state, "a".repeat(40));
  const suggestion = availableDeckName(long, "a".repeat(40));
  assert.equal(suggestion.length, 40);
  assert.ok(suggestion.endsWith(" 2"));
});
test("removing cards and token conversion prune all saved decks and never refill incomplete slots", () => {
  const state = createSavedDeck(initial(), "deck-copy", "Other", true);
  const remaining = new Set(allowed);
  remaining.delete(ids[0]);
  const pruned = synchronizeDecks(state, remaining);
  for (const deck of pruned.decks) {
    assert.equal(deck.cards.length, 4);
    assert.ok(!deck.cards.includes(ids[0]));
  }
  assert.deepEqual(state.deck, DEFAULT_DECK);
  assert.deepEqual(
    restoreDecks(JSON.parse(JSON.stringify(pruned)), remaining),
    pruned,
  );
});
test("deletion chooses another same-size deck, cleans remembered pointers, and protects the final slot", () => {
  assert.throws(() => deleteSavedDeck(initial()), /at least one/);
  const small = initial(),
    large = deckForBoardSize(small, 4, ids, "deck-large");
  const other = createSavedDeck(large, "deck-other", "Another large", true);
  const after = deleteSavedDeck(other);
  assert.equal(after.activeDeckId, large.activeDeckId);
  assert.equal(after.lastDeckBySize[4], large.activeDeckId);
  assert.equal(after.decks.length, 2);
  const final = deleteSavedDeck(after);
  assert.equal(final.activeDeckId, small.activeDeckId);
  assert.equal(final.boardSize, 3);
  assert.equal(final.lastDeckBySize[4], undefined);
  assert.deepEqual(final.deck, DEFAULT_DECK);
});
test("malformed saves drop invalid slots, migrate cards, and recover a valid selection without trusting stale mirrors", () => {
  const state = restoreDecks(
    {
      boardSize: 4,
      activeDeckId: "gone",
      deck: ["missing"],
      lastDeckBySize: { 3: "gone", 4: "large" },
      decks: [
        null,
        { id: "invalid", name: "", boardSize: 3, cards: ids },
        {
          id: "small",
          name: "Small",
          boardSize: 3,
          cards: [...ids, ids[0], "bad"],
        },
        { id: "small", name: "Duplicate ID", boardSize: 3, cards: [] },
        { id: "large", name: "Large", boardSize: 4, cards: ids },
        { id: "size", name: "Bad size", boardSize: 5, cards: ids },
      ],
    },
    allowed,
  );
  assert.equal(state.decks.length, 2);
  assert.equal(state.activeDeckId, "large");
  assert.equal(state.deck.length, handSize(4));
  assert.equal(state.decks[0].cards.length, handSize(3));
  assert.equal(state.lastDeckBySize[3], undefined);
  assert.deepEqual(
    restoreDecks(JSON.parse(JSON.stringify(state)), allowed),
    state,
  );
});
