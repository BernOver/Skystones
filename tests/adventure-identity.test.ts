import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ADVENTURE_CHARACTERS,
  CHARACTER_PORTRAITS,
  ENEMY_STONES,
  characterIdentity,
  hasSkystonesArtwork,
  pictureMatchesStats,
} from "../src/characters.ts";
import {
  makeRunCard,
  newAdventure,
  enterAdventureNode,
  rewardCards,
  restoreAdventure,
  adventureFusionPreview,
  adventureInscriptionOffers,
  resolveAdventureEvent,
  buyAdventureService,
  rerollAdventureShop,
  transformAdventureCards,
  adventureSpireMemoryCards,
} from "../src/adventure.ts";
import { adventurePotionTargets, useAdventurePotion } from "../src/potions.ts";
import { validateStone } from "../src/game.ts";
import type { Stone } from "../src/game.ts";
const enfuego = ENEMY_STONES.find((card) => card.name === "Enfuego Chompy")!;
function unique(cards: Stone[]) {
  assert.equal(
    new Set(cards.map(characterIdentity)).size,
    cards.length,
    cards.map((card) => card.name).join(", "),
  );
}

test("every Adventure character has one fixed pip and keyword profile across seeds, tiers, and runs", () => {
  const seen = new Map<string, string>();
  for (let seed = 1; seed <= 500; seed++)
    for (const budget of Array.from({ length: 16 }, (_, i) => i + 1))
      for (const tier of [0, 9]) {
        const card = makeRunCard(
            seed,
            budget,
            `check-${seed}-${budget}`,
            tier,
            seed % 2 ? 0.3 : 0,
          ),
          key = characterIdentity(card);
        const profile = ADVENTURE_CHARACTERS.find(
          (base) => characterIdentity(base) === key,
        )!;
        assert.deepEqual(card.edges, profile.edges);
        assert.deepEqual(card.keywords, profile.keywords || []);
        assert.deepEqual(card.baseEdges, profile.edges);
        assert.deepEqual(card.baseKeywords, profile.keywords || []);
        assert.ok(validateStone(card));
        const printed = JSON.stringify([card.edges, card.keywords]);
        if (seen.has(key)) assert.equal(printed, seen.get(key));
        seen.set(key, printed);
      }
  assert.ok(seen.size >= 210);
  const card = makeRunCard(17, 6, "mutable", 9);
  const original = JSON.stringify(
    ADVENTURE_CHARACTERS.find((base) => base.portrait === card.portrait),
  );
  card.edges[0] = 0;
  card.keywords = [];
  assert.equal(
    JSON.stringify(
      ADVENTURE_CHARACTERS.find((base) => base.portrait === card.portrait),
    ),
    original,
  );
});

test("Skystones pictures use their source pip vectors and have no Adventure keywords", () => {
  const reference = JSON.parse(
    readFileSync(new URL("../src/giants-data.json", import.meta.url), "utf8"),
  );
  for (const card of ENEMY_STONES) {
    const art = CHARACTER_PORTRAITS.find(
      (p) => p.id === card.portrait,
    )!.source.replace("legacy:", "");
    assert.deepEqual(
      card.edges,
      reference.find((row: { art: string }) => row.art === art).edges,
    );
    const profile = ADVENTURE_CHARACTERS.find(
      (base) => base.portrait === card.portrait,
    )!;
    assert.deepEqual(profile.edges, card.edges);
    assert.deepEqual(profile.keywords, []);
    assert.equal(pictureMatchesStats(profile), true);
    const changed = {
      ...profile,
      edges: profile.edges.map((edge, side) =>
        side === 0 ? edge + 1 : edge,
      ) as Stone["edges"],
    };
    assert.equal(pictureMatchesStats(changed), false);
  }
  assert.deepEqual(enfuego.edges, [2, 0, 0, 0]);
  assert.ok(
    ENEMY_STONES.some((card) => card.keywords?.length),
    "normal-mode keywords remain available",
  );
});
for (const size of [3, 4] as const)
  test(`${size}×${size} starts, rewards, enemies, shops and rerolls sample characters without replacement`, () => {
    for (let seed = 0; seed < 100; seed++) {
      const run = newAdventure(size, seed);
      unique(run.inventory);
      for (const floor of [0, 3, 6, 9, 12, 15]) {
        const rewards = rewardCards({ ...run, floor });
        unique([...run.inventory, ...rewards]);
        for (const card of rewards)
          if (hasSkystonesArtwork(card)) assert.deepEqual(card.keywords, []);
      }
      const fight = enterAdventureNode(run, "moss");
      unique(fight.battle!.hands[0]);
      unique(fight.battle!.hands[1]);
      let shop = enterAdventureNode(
        { ...run, floor: 2, gold: 500 },
        "shop-one",
      );
      unique([...shop.inventory, ...shop.shopCards]);
      shop = rerollAdventureShop(shop);
      unique([...shop.inventory, ...shop.shopCards]);
    }
  });

test("saved duplicate Enfuego cards are replaced without losing deck slots, earned stats or completed captures", () => {
  const run = enterAdventureNode(newAdventure(3, 65), "moss");
  const a = {
    ...run.inventory[0],
    ...enfuego,
    id: run.inventory[0].id,
    keywords: [{ type: "shield" as const, side: 0 as const }],
  };
  const b = {
    ...a,
    id: run.inventory[1].id,
    edges: [3, 1, 0, 0] as Stone["edges"],
  };
  run.inventory[0] = a;
  run.inventory[1] = b;
  run.battle!.hands[0][0] = a;
  run.battle!.hands[0][1] = b;
  run.battle!.board[8] = {
    stone: a,
    owner: 1,
    playedBy: 0,
    playedOrder: 1,
    edges: [2, 0, 0, 0],
    shields: [1, 0, 0, 0],
    activeKeywords: [],
  };
  const fixed = restoreAdventure(JSON.parse(JSON.stringify(run)))!;
  unique(fixed.inventory);
  assert.deepEqual(fixed.deck, run.deck);
  assert.equal(fixed.inventory[0].id, a.id);
  assert.equal(fixed.inventory[1].id, b.id);
  assert.deepEqual(fixed.inventory[1].edges, b.edges);
  assert.equal(
    fixed.inventory.filter((card) => card.portrait === enfuego.portrait).length,
    1,
  );
  assert.deepEqual(fixed.inventory[0].keywords, []);
  assert.equal(fixed.battle!.board[8]!.owner, 1);
  assert.deepEqual(fixed.battle!.board[8]!.shields, [0, 0, 0, 0]);
  assert.deepEqual(
    fixed.battle!.hands[0][1].portrait,
    fixed.inventory[1].portrait,
  );
  assert.deepEqual(
    restoreAdventure(JSON.parse(JSON.stringify(fixed))),
    JSON.parse(JSON.stringify(fixed)),
  );
});

test("Skystones Adventure cards reject shop/shrine/potion keywords and fusion cannot put them back", () => {
  let shop = enterAdventureNode(
    { ...newAdventure(3, 65), floor: 2, gold: 500 },
    "shop-one",
  );
  shop.inventory[0] = { ...enfuego, id: shop.inventory[0].id, keywords: [] };
  const id = shop.inventory[0].id;
  assert.throws(
    () => buyAdventureService(shop, { type: "keyword", cardId: id }),
    /keyword-free/,
  );
  assert.equal(shop.gold, 500);
  const shrine = enterAdventureNode(
    { ...shop, phase: "map", floor: 1, node: undefined },
    "rune-shrine",
  );
  assert.throws(
    () => resolveAdventureEvent(shrine, "inscribe:0", id),
    /keyword-free/,
  );
  const hero = ADVENTURE_CHARACTERS.find(
    (card) => !hasSkystonesArtwork(card) && card.keywords!.length,
  )!;
  assert.deepEqual(
    adventureFusionPreview(shop.inventory[0], { ...hero, id: "custom-donor" })
      .keywords,
    [],
  );
  const run = enterAdventureNode(
    {
      ...shop,
      phase: "map",
      floor: 0,
      potions: ["resonance"],
      node: undefined,
    },
    "moss",
  );
  assert.ok(
    !adventurePotionTargets(run, "resonance").some(
      (target) => target.stone.id === id,
    ),
  );
  assert.throws(() => useAdventurePotion(run, 0, id, { side: 0 }));
  assert.deepEqual(run.potions, ["resonance"]);
  const character = shrine.inventory.find(
    (card) => !hasSkystonesArtwork(card),
  )!;
  const offer = adventureInscriptionOffers(shrine)[0];
  assert.ok(
    resolveAdventureEvent(shrine, "inscribe:0", character.id)
      .inventory.find((card) => card.id === character.id)!
      .keywords!.some((keyword) => keyword.type === offer.type),
  );
});

test("transformations avoid owned identities and keep enhanced keyword transformations on character portraits", () => {
  const run = { ...newAdventure(4, 8), floor: 4 },
    ids = run.inventory.slice(0, 2).map((card) => card.id);
  const result = transformAdventureCards(run, ids);
  unique(result.inventory);
  for (const id of ids) {
    const card = result.inventory.find((card) => card.id === id)!;
    assert.equal(hasSkystonesArtwork(card), false);
    assert.ok(card.keywords!.length <= 5);
  }
});

test("matching event has distinct underlying characters and keeps the same pairs after a win", () => {
  const run = { ...newAdventure(3, 9), floor: 4 };
  const cards = adventureSpireMemoryCards(run);
  const distinct = [
    ...new Map(
      cards
        .filter((card) => !card.id.startsWith("custom-curse-"))
        .map((card) => [card.id, card]),
    ).values(),
  ];
  unique(distinct);
  const won = { ...run, inventory: [...run.inventory, distinct[0]] };
  assert.deepEqual(adventureSpireMemoryCards(won), cards);
});
