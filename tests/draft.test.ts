import { test } from "node:test";
import assert from "node:assert/strict";
import {
  draftCards,
  newDraft,
  nominateDraftCards,
  nominationCount,
  pickDraftCard,
  pipDominates,
  randomPoolCount,
  restoreDraft,
} from "../src/draft.ts";
import {
  EMPTY_BOARD,
  chooseKeywordTargets,
  handSize,
  placeStone,
  validateStone,
} from "../src/game.ts";
import type { Owner } from "../src/game.ts";
test("draft tables contain 25 valid diverse cards, all keywords, and uncommon pip dominance", () => {
  let dominantPools = 0;
  const types = new Set<string>();
  for (let seed = 1; seed <= 100; seed++) {
    const cards = draftCards(seed);
    assert.equal(cards.length, 25);
    assert.equal(new Set(cards.map((card) => card.id)).size, 25);
    assert.equal(new Set(cards.map((card) => card.edges.join())).size, 25);
    assert.ok(cards.every(validateStone));
    assert.deepEqual(draftCards(seed), cards);
    assert.ok(
      new Set(cards.map((card) => card.edges.reduce((a, b) => a + b, 0)))
        .size >= 3,
    );
    cards.forEach((card) =>
      card.keywords?.forEach((keyword) => types.add(keyword.type)),
    );
    const pairs = cards.flatMap((a) =>
      cards.filter((b) => a.id !== b.id && pipDominates(a, b)),
    );
    assert.ok(pairs.length <= 2);
    if (pairs.length) dominantPools++;
  }
  assert.equal(types.size, 6);
  assert.ok(dominantPools > 0 && dominantPools < 40);
});
for (const size of [3, 4] as const)
  test(`${size}×${size} nominations and alternating draft use every card once and make playable full hands`, () => {
    const quota = nominationCount(size),
      count = handSize(size);
    let draft = newDraft(size, 42);
    assert.throws(() =>
      nominateDraftCards(
        draft,
        draft.cards.slice(0, quota - 1).map((card) => card.id),
      ),
    );
    draft = nominateDraftCards(
      draft,
      draft.cards.slice(0, quota).map((card) => card.id),
    );
    assert.equal(draft.current, 1);
    assert.throws(() =>
      nominateDraftCards(
        draft,
        draft.cards.slice(0, quota).map((card) => card.id),
      ),
    );
    draft = nominateDraftCards(
      draft,
      draft.cards.slice(quota, quota * 2).map((card) => card.id),
    );
    assert.equal(
      draft.offered.length + draft.pool.length,
      quota * 2 + randomPoolCount(size),
    );
    const pool = [...draft.offered, ...draft.pool];
    assert.ok(draft.nominations.flat().every((id) => pool.includes(id)));
    for (let round = 0; round < count; round++) {
      assert.equal(draft.current, round % 2);
      assert.equal(draft.offered.length, 3);
      const discarded = draft.offered[2];
      draft = pickDraftCard(draft, draft.offered[0]);
      assert.equal(draft.current, 1 - (round % 2));
      assert.equal(draft.offered.length, 2);
      assert.deepEqual(restoreDraft(JSON.parse(JSON.stringify(draft))), draft);
      draft = pickDraftCard(draft, draft.offered[0]);
      assert.equal(draft.discarded.at(-1), discarded);
      assert.throws(() => pickDraftCard(draft, discarded));
    }
    assert.equal(draft.phase, "ready");
    assert.deepEqual(
      draft.hands.map((hand) => hand.length),
      [count, count],
    );
    assert.equal(draft.discarded.length, count);
    assert.equal(draft.pool.length, 0);
    assert.equal(
      new Set([...draft.hands.flat(), ...draft.discarded]).size,
      count * 3,
    );
    let board = EMPTY_BOARD(size);
    const hands = draft.hands.map((hand) =>
      hand.map((id) => draft.cards.find((card) => card.id === id)!),
    );
    for (let turn = 0; turn < size * size; turn++) {
      const owner = (turn % 2) as Owner,
        card = hands[owner].shift()!,
        index = board.findIndex((cell) => !cell);
      board = placeStone(
        board,
        index,
        card,
        owner,
        chooseKeywordTargets(board, index, card, owner),
      ).board;
    }
    assert.ok(board.every(Boolean));
  });
test("draft saves replay validated choices and reject tampering or illegal picks", () => {
  let draft = newDraft(3, 7);
  assert.deepEqual(restoreDraft(draft), draft);
  assert.throws(() => pickDraftCard(draft, draft.cards[0].id));
  assert.equal(
    restoreDraft({ ...draft, nominations: [[], [draft.cards[0].id]] }),
    null,
  );
  assert.equal(restoreDraft({ ...draft, seed: -1 }), null);
  draft = nominateDraftCards(
    draft,
    draft.cards.slice(0, 6).map((card) => card.id),
  );
  assert.deepEqual(restoreDraft(draft), draft);
  draft = nominateDraftCards(
    draft,
    draft.cards.slice(6, 12).map((card) => card.id),
  );
  const pick = draft.offered[0];
  draft = pickDraftCard(draft, pick);
  assert.equal(restoreDraft({ ...draft, history: [pick, pick] }), null);
  const forged = { ...draft, cards: [], current: 0, hands: [[], []] };
  assert.deepEqual(restoreDraft(forged), draft);
});
