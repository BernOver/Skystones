import { test } from "node:test";
import assert from "node:assert/strict";
import {
  adventureWorkshopOffer,
  buyAdventureCard,
  buyAdventureService,
  enterAdventureNode,
  newAdventure,
  validateAdventure,
} from "../src/adventure.ts";
import { validateKeywords } from "../src/game.ts";

test("shops roll all keyword types and four directions, with complete valid offers", () => {
  const types = new Set(),
    directions = new Set(),
    pipDirections = new Set();
  for (let seed = 0; seed < 100; seed++)
    for (const floor of [2, 5]) {
      const offer = adventureWorkshopOffer({ seed, floor });
      assert.deepEqual(offer, adventureWorkshopOffer({ seed, floor }));
      assert.ok(validateKeywords([offer.keyword]));
      types.add(offer.keyword.type);
      pipDirections.add(offer.pipSide);
      if ("side" in offer.keyword) {
        assert.notEqual(offer.keyword.side, "any");
        directions.add(offer.keyword.side);
      }
      if (offer.keyword.type === "sunder")
        assert.equal(offer.keyword.amount, floor === 2 ? 1 : 2);
      if (!("side" in offer.keyword))
        assert.equal("side" in offer.keyword, false);
    }
  assert.equal(types.size, 8);
  assert.equal(directions.size, 4);
  assert.equal(pipDirections.size, 4);
  assert.ok(
    Array.from({ length: 20 }, (_, seed) => seed).some(
      (seed) =>
        JSON.stringify(adventureWorkshopOffer({ seed, floor: 2 })) !==
        JSON.stringify(adventureWorkshopOffer({ seed, floor: 5 })),
    ),
  );
});

test("offers survive old-format saves, card selection, and purchases without rerolling", () => {
  const shop = enterAdventureNode(
      { ...newAdventure(4, 54), floor: 2, gold: 300 },
      "shop-one",
    ),
    offer = adventureWorkshopOffer(shop);
  assert.equal(validateAdventure(JSON.parse(JSON.stringify(shop))), true);
  assert.deepEqual(
    adventureWorkshopOffer(JSON.parse(JSON.stringify(shop))),
    offer,
  );
  const bought = buyAdventureCard(shop, shop.shopCards[0].id);
  assert.deepEqual(adventureWorkshopOffer(bought), offer);
  const first = buyAdventureService(bought, {
    type: "keyword",
    cardId: shop.inventory[0].id,
  });
  const second = buyAdventureService(first, {
    type: "keyword",
    cardId: shop.inventory[1].id,
  });
  assert.deepEqual(second.inventory[0].keywords, [offer.keyword]);
  assert.deepEqual(second.inventory[1].keywords, [offer.keyword]);
  assert.deepEqual(adventureWorkshopOffer(second), offer);
  assert.equal(second.gold, bought.gold - 70);
  assert.deepEqual(shop.inventory[0].keywords, []);
  assert.throws(() =>
    buyAdventureService(second, {
      type: "keyword",
      cardId: shop.inventory[0].id,
    }),
  );
  assert.equal(second.gold, bought.gold - 70);
});

test("purchases use the displayed random offers and reject incompatible stones without spending gold", () => {
  const shop = enterAdventureNode(
      { ...newAdventure(3, 9), floor: 2, gold: 200 },
      "shop-one",
    ),
    offer = adventureWorkshopOffer(shop),
    stone = shop.inventory[0];
  const pip = buyAdventureService(shop, { type: "pip", cardId: stone.id });
  const expected = [...stone.edges];
  expected[offer.pipSide]++;
  assert.deepEqual(pip.inventory[0].edges, expected);
  assert.equal(pip.gold, 175);
  const high = {
    ...shop,
    inventory: [
      {
        ...stone,
        edges: stone.edges.map((value, index) =>
          index === offer.pipSide ? 5 : value,
        ) as typeof stone.edges,
      },
      ...shop.inventory.slice(1),
    ],
  };
  assert.throws(() =>
    buyAdventureService(high, { type: "pip", cardId: stone.id }),
  );
  assert.equal(high.gold, 200);
  assert.deepEqual(adventureWorkshopOffer(high), offer);
  const duplicated = {
    ...shop,
    inventory: [
      { ...stone, keywords: [offer.keyword] },
      ...shop.inventory.slice(1),
    ],
  };
  assert.throws(() =>
    buyAdventureService(duplicated, { type: "keyword", cardId: stone.id }),
  );
  assert.equal(duplicated.gold, 200);
  assert.deepEqual(adventureWorkshopOffer(duplicated), offer);
  assert.throws(() =>
    buyAdventureService(shop, { type: "keyword", cardId: "missing" }),
  );
});
