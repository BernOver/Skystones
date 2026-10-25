import { test } from "node:test";
import assert from "node:assert/strict";
import {
  adventureFusionPreview,
  adventureInscriptionOffers,
  adventureShopRerollPrice,
  adventureWorkshopOffer,
  buyAdventureCard,
  buyAdventurePotion,
  buyAdventureRelic,
  buyAdventureService,
  enterAdventureNode,
  leaveAdventureShop,
  newAdventure,
  rerollAdventureShop,
  resolveAdventureEvent,
  restoreAdventure,
  validateAdventure,
} from "../src/adventure.ts";
import type { Adventure } from "../src/adventure.ts";
import { handSize, validateKeywords, validateStone } from "../src/game.ts";
import type { BoardSize, Stone } from "../src/game.ts";
const roundtrip = (run: Adventure) => {
  const saved = JSON.parse(JSON.stringify(run));
  assert.ok(validateAdventure(saved));
  assert.deepEqual(restoreAdventure(saved), saved);
};
const shop = (size: BoardSize = 3, seed = 52) =>
  enterAdventureNode(
    { ...newAdventure(size, seed), floor: 2, gold: 500 },
    "shop-one",
  );
const event = (id: "rune-shrine" | "fusion-forge", size: BoardSize = 3) =>
  enterAdventureNode(
    { ...newAdventure(size, 41), floor: id === "rune-shrine" ? 1 : 4 },
    id,
  );

test("every merchant and reroll has a different keyword type from the previous offer, with stable valid directions", () => {
  const types = new Set();
  for (let seed = 0; seed < 120; seed++) {
    let run = shop(3, seed),
      previous = adventureWorkshopOffer(run);
    for (let roll = 0; roll < 5; roll++) {
      run = rerollAdventureShop(run);
      const next = adventureWorkshopOffer(run);
      assert.notEqual(next.keyword.type, previous.keyword.type);
      assert.ok(validateKeywords([next.keyword]));
      assert.deepEqual(
        adventureWorkshopOffer(JSON.parse(JSON.stringify(run))),
        next,
      );
      types.add(next.keyword.type);
      previous = next;
    }
    const nextShop = enterAdventureNode(
      { ...leaveAdventureShop(run), floor: 5 },
      "shop-two",
    );
    assert.notEqual(
      adventureWorkshopOffer(nextShop).keyword.type,
      previous.keyword.type,
    );
    assert.equal(nextShop.shopRerolls, 0);
    roundtrip(nextShop);
  }
  assert.equal(types.size, 8);
});
test("paid rerolls refresh all stock and workshop offers, retain purchases, and never replay entry gold", () => {
  const initial = {
    ...shop(4),
    relics: [
      "quiet-coin",
      "rainy-day-bank",
      "market-map",
    ] as Adventure["relics"],
  };
  let run = buyAdventureCard(initial, initial.shopCards[0].id);
  run = buyAdventurePotion(run, run.shopPotions[0].id);
  run = buyAdventureService(run, { type: "pip", cardId: run.inventory[0].id });
  const before = JSON.parse(JSON.stringify(run));
  const after = rerollAdventureShop(run);
  assert.equal(after.gold, run.gold - 20);
  assert.deepEqual(after.inventory, run.inventory);
  assert.deepEqual(after.deck, run.deck);
  assert.deepEqual(after.potions, run.potions);
  assert.equal(after.shopCards.length, 4);
  assert.equal(after.shopPotions.length, 3);
  assert.ok(
    after.shopCards.every(
      (card) => !initial.shopCards.some((old) => old.id === card.id),
    ),
  );
  assert.notDeepEqual(
    after.shopCards.map((card) => [card.edges, card.element, card.creature]),
    initial.shopCards.map((card) => [card.edges, card.element, card.creature]),
  );
  assert.notEqual(after.shopRelic, run.shopRelic);
  assert.equal(after.shopRerolls, 1);
  assert.deepEqual(run, before);
  roundtrip(after);
  assert.throws(() => buyAdventureCard(after, initial.shopCards[1].id));
  assert.throws(() => buyAdventurePotion(after, initial.shopPotions[0].id));
});
test("repeated stock rerolls give purchased cards unique IDs and exclude owned relics", () => {
  let run = { ...shop(), gold: 2000 };
  const ids = new Set(run.inventory.map((card) => card.id));
  for (let i = 0; i < 12; i++) {
    const card = run.shopCards[0];
    assert.ok(!ids.has(card.id));
    ids.add(card.id);
    run = buyAdventureCard(run, card.id);
    if (run.shopRelic) run = buyAdventureRelic(run, run.shopRelic);
    run = rerollAdventureShop(run);
    assert.ok(!run.shopRelic || !run.relics?.includes(run.shopRelic));
    roundtrip(run);
  }
});
test("Merchant's Die grants one free reroll per shop, persists its use, and paid rerolls honor discounts", () => {
  const initial = {
    ...shop(),
    gold: 0,
    relics: ["merchants-die"] as Adventure["relics"],
  };
  assert.equal(adventureShopRerollPrice(initial), 0);
  const free = rerollAdventureShop(initial);
  assert.equal(free.gold, 0);
  assert.equal(free.shopFreeRerollUsed, true);
  assert.equal(adventureShopRerollPrice(free), 20);
  roundtrip(free);
  assert.equal(
    adventureShopRerollPrice(
      restoreAdventure(JSON.parse(JSON.stringify(free)))!,
    ),
    20,
  );
  assert.throws(() => rerollAdventureShop(free));
  const later = enterAdventureNode(
    { ...leaveAdventureShop(free), floor: 5 },
    "shop-two",
  );
  assert.equal(adventureShopRerollPrice(later), 0);
  assert.equal(rerollAdventureShop(later).gold, 0);
  const discounted = rerollAdventureShop({
    ...free,
    gold: 16,
    relics: ["merchants-die", "hagglers-coin"],
  });
  assert.equal(discounted.gold, 0);
  assert.equal(adventureShopRerollPrice(discounted), 16);
  const sold = { ...shop(), shopRelic: "merchants-die" as const };
  const acquired = buyAdventureRelic(sold, "merchants-die");
  assert.equal(adventureShopRerollPrice(acquired), 0);
  assert.equal(rerollAdventureShop(acquired).gold, acquired.gold);
});
test("invalid rerolls spend nothing, legacy shops keep their displayed offers, and malformed saved counters are rejected", () => {
  const initial = shop(),
    legacy = { ...initial };
  delete legacy.shopRerolls;
  delete legacy.shopFreeRerollUsed;
  delete legacy.shopOffer;
  delete legacy.lastShopKeyword;
  const offer = adventureWorkshopOffer(legacy),
    restored = restoreAdventure(JSON.parse(JSON.stringify(legacy)))!;
  assert.deepEqual(adventureWorkshopOffer(restored), offer);
  assert.equal(adventureShopRerollPrice(restored), 20);
  const poor = { ...initial, gold: 19 },
    snapshot = JSON.stringify(poor);
  assert.throws(() => rerollAdventureShop(poor));
  assert.equal(JSON.stringify(poor), snapshot);
  assert.throws(() => rerollAdventureShop(newAdventure(3, 5)));
  for (const bad of [-1, 1.5, "1", Number.MAX_SAFE_INTEGER + 1])
    assert.equal(validateAdventure({ ...initial, shopRerolls: bad }), false);
  assert.equal(validateAdventure({ ...initial, shopFreeRerollUsed: 1 }), false);
  assert.equal(
    validateAdventure({ ...initial, lastShopKeyword: "unknown" }),
    false,
  );
  assert.equal(
    validateAdventure({
      ...initial,
      shopOffer: { pipSide: 4, keyword: { type: "dizzy" } },
    }),
    false,
  );
  assert.equal(
    validateAdventure({
      ...initial,
      shopOffer: { pipSide: 0, keyword: { type: "dizzy", side: 0 } },
    }),
    false,
  );
});
test("the shrine offers three distinct stable keyword types and all eight can appear", () => {
  const seen = new Set();
  for (let seed = 0; seed < 60; seed++) {
    const run = { ...newAdventure(3, seed), floor: 1 },
      offers = adventureInscriptionOffers(run);
    assert.equal(offers.length, 3);
    assert.equal(new Set(offers.map((offer) => offer.type)).size, 3);
    assert.deepEqual(
      adventureInscriptionOffers(JSON.parse(JSON.stringify(run))),
      offers,
    );
    for (const offer of offers) {
      assert.ok(validateKeywords([offer]));
      seen.add(offer.type);
    }
  }
  assert.equal(seen.size, 8);
});
for (const size of [3, 4] as const)
  test(`${size}×${size} shrine inscribes exactly one chosen stone for free and cannot be claimed twice`, () => {
    const run = event("rune-shrine", size),
      id = run.inventory[2].id,
      offer = adventureInscriptionOffers(run)[1];
    const result = resolveAdventureEvent(
      { ...run, relics: ["rune-echo"] },
      "inscribe:1",
      id,
    );
    assert.equal(result.gold, run.gold);
    assert.deepEqual(result.deck, run.deck);
    assert.equal(result.inventory.length, run.inventory.length);
    for (const card of result.inventory)
      assert.deepEqual(
        card,
        card.id === id
          ? { ...run.inventory[2], keywords: [offer] }
          : run.inventory.find((source) => source.id === card.id),
      );
    assert.equal(result.floor, 2);
    assert.equal(result.phase, "map");
    assert.throws(() => resolveAdventureEvent(result, "inscribe:1", id));
    roundtrip(result);
    const duplicate = {
      ...run,
      inventory: run.inventory.map((card) =>
        card.id === id ? { ...card, keywords: [offer] } : card,
      ),
    };
    assert.throws(() => resolveAdventureEvent(duplicate, "inscribe:1", id));
    assert.throws(() => resolveAdventureEvent(run, "inscribe:3", id));
    assert.throws(() => resolveAdventureEvent(run, "inscribe:1", "missing"));
  });
test("fusion previews combine best edges within caps and preserve separate Sunder entries", () => {
  const initial = newAdventure(3, 41);
  const base: Stone = {
    ...initial.inventory[0],
    name: "Extraordinary Familiar",
    edges: [5, 5, 2, 0],
    keywords: [
      { type: "resonance", side: 0, element: "fire" },
      { type: "sunder", side: 1, amount: 1 },
      { type: "dizzy" },
    ],
  };
  const donor: Stone = {
    ...initial.inventory[1],
    edges: [0, 0, 2, 5],
    keywords: [
      { type: "resonance", side: 0, element: "water" },
      { type: "sunder", side: 1, amount: 3 },
      { type: "silence" },
      { type: "dizzy" },
    ],
  };
  const snapshot = JSON.stringify([base, donor]),
    result = adventureFusionPreview(base, donor);
  assert.equal(
    result.edges.reduce((a, b) => a + b, 0),
    12,
  );
  assert.ok(result.edges.every((edge) => edge >= 0 && edge <= 5));
  assert.equal(result.edges[3], 4);
  assert.equal(result.id, base.id);
  assert.equal(result.element, base.element);
  assert.equal(result.creature, base.creature);
  assert.deepEqual(result.keywords, [
    { type: "resonance", side: 0, element: "fire" },
    { type: "sunder", side: 1, amount: 1 },
    { type: "dizzy" },
    { type: "sunder", side: 1, amount: 3 },
    { type: "silence" },
  ]);
  assert.ok(validateStone(result));
  assert.equal(JSON.stringify([base, donor]), snapshot);
  assert.deepEqual(
    adventureFusionPreview(
      { ...base, edges: [2, 1, 0, 1] },
      { ...donor, edges: [1, 0, 3, 2] },
    ).edges,
    [2, 1, 3, 2],
  );
  assert.throws(() => adventureFusionPreview(base, base));
});
for (const size of [3, 4] as const)
  test(`${size}×${size} fusion repairs full and incomplete decks for any pair of selected or reserve inputs`, () => {
    const run = event("fusion-forge", size),
      count = handSize(size);
    for (const [baseIndex, donorIndex] of [
      [0, 1],
      [0, count],
      [count, 0],
      [count, count + 1],
    ]) {
      const base = run.inventory[baseIndex],
        donor = run.inventory[donorIndex];
      const result = resolveAdventureEvent(run, "combine", base.id, donor.id);
      assert.equal(result.inventory.length, run.inventory.length - 1);
      assert.equal(result.gold, run.gold);
      assert.ok(!result.inventory.some((card) => card.id === donor.id));
      assert.deepEqual(
        result.inventory.find((card) => card.id === base.id),
        adventureFusionPreview(base, donor),
      );
      assert.equal(result.deck.length, count);
      assert.equal(new Set(result.deck).size, count);
      assert.ok(
        result.deck.every((id) =>
          result.inventory.some((card) => card.id === id),
        ),
      );
      if (baseIndex >= count && donorIndex >= count)
        assert.deepEqual(result.deck, run.deck);
      assert.equal(result.floor, 5);
      assert.throws(() =>
        resolveAdventureEvent(result, "combine", base.id, donor.id),
      );
      roundtrip(result);
    }
    const partial = { ...run, deck: run.deck.slice(0, 2) };
    assert.equal(
      resolveAdventureEvent(
        partial,
        "combine",
        run.inventory[0].id,
        run.inventory[1].id,
      ).deck.length,
      2,
    );
    assert.deepEqual(
      resolveAdventureEvent(
        { ...run, deck: [] },
        "combine",
        run.inventory[0].id,
        run.inventory[1].id,
      ).deck,
      [],
    );
  });
test("fusion failures and skipped events preserve cards, currency, and selected decks", () => {
  const run = event("fusion-forge"),
    snapshot = JSON.stringify(run),
    a = run.inventory[0].id,
    b = run.inventory[1].id;
  assert.throws(() => resolveAdventureEvent(run, "combine", a, a));
  assert.throws(() => resolveAdventureEvent(run, "combine", a, "missing"));
  assert.throws(() =>
    resolveAdventureEvent(
      { ...run, inventory: run.inventory.slice(0, 5) },
      "combine",
      a,
      b,
    ),
  );
  assert.throws(() =>
    resolveAdventureEvent(event("rune-shrine"), "combine", a, b),
  );
  assert.equal(JSON.stringify(run), snapshot);
  for (const id of ["fusion-forge", "rune-shrine"] as const) {
    const before = event(id),
      after = resolveAdventureEvent(before, "leave");
    assert.deepEqual(after.inventory, before.inventory);
    assert.deepEqual(after.deck, before.deck);
    assert.equal(after.gold, before.gold);
  }
});
test("older runs already past the first merchant get a different keyword at the second merchant", () => {
  for (let seed = 0; seed < 80; seed++) {
    const legacy = { ...newAdventure(3, seed), floor: 5 };
    const previous = adventureWorkshopOffer({ seed, floor: 2 }).keyword.type;
    const next = enterAdventureNode(legacy, "shop-two");
    assert.notEqual(adventureWorkshopOffer(next).keyword.type, previous);
    roundtrip(next);
  }
  assert.throws(() =>
    rerollAdventureShop({ ...shop(), shopRerolls: Number.MAX_SAFE_INTEGER }),
  );
});
