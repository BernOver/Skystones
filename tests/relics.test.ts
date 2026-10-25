import { test } from "node:test";
import assert from "node:assert/strict";
import { STARTER_STONES, validateStone } from "../src/game.ts";
import type { BoardSize, Edges, Stone } from "../src/game.ts";
import {
  RELICS,
  RELIC_IDS,
  cardRewardPicks,
  earnedGold,
  offerRelics,
  maxLives,
  potionCapacity,
  potionPotency,
  shopPrice,
} from "../src/relics.ts";
import type { RelicId } from "../src/relics.ts";
import {
  ROUTE,
  adventureEnemyMove,
  adventureStoneForPlay,
  adventureWorkshopOffer,
  buyAdventureCard,
  buyAdventurePotion,
  buyAdventureRelic,
  buyAdventureService,
  cardPrice,
  claimAdventureRelic,
  claimAdventureReward,
  enterAdventureNode,
  newAdventure,
  leaveAdventureShop,
  playAdventureCard,
  potionDescription,
  POTIONS,
  resolveAdventureEvent,
  rewardCards,
  useAdventurePotion,
  validateAdventure,
  restoreAdventure,
} from "../src/adventure.ts";
import type { Adventure } from "../src/adventure.ts";

const plain = (edges: Edges = [0, 0, 0, 0]): Stone => ({
  ...STARTER_STONES[0],
  id: "custom-relic-test",
  edges,
  keywords: [],
});
function gift(run: Adventure, id: RelicId): Adventure {
  return claimAdventureRelic(
    {
      ...run,
      phase: "reward",
      node: ROUTE[run.floor][0],
      rewards: rewardCards(run),
      rewardPicksRemaining: 1,
      relicOffers: [id],
    },
    id,
  );
}
function finish(run: Adventure, won = true): Adventure {
  const battle = run.battle!;
  const board = battle.board.map((cell, index) =>
    index === run.size ** 2 - 1
      ? null
      : {
          stone: cell?.stone || plain(),
          owner: (won ? 0 : 1) as 0 | 1,
          playedBy: 0 as const,
          edges: [0, 0, 0, 0] as Edges,
          activeKeywords: [],
        },
  );
  return playAdventureCard(
    {
      ...run,
      battle: {
        ...battle,
        board,
        hands: [[plain()], [plain()]],
        current: 0,
        turns: run.size ** 2 - 1 - (battle.objectiveKind ? 1 : 0),
      },
    },
    run.size ** 2 - 1,
    0,
  );
}

test("all thirty-one unique relics have complete descriptions, reachable stable offers, and no duplicate drops", () => {
  assert.equal(RELIC_IDS.length, 31);
  assert.equal(new Set(RELIC_IDS.map((id) => RELICS[id].name)).size, 31);
  const seen = new Set<RelicId>();
  for (let seed = 0; seed < 120; seed++) {
    const run = newAdventure(3, seed),
      offers = offerRelics(run);
    assert.deepEqual(offers, offerRelics(JSON.parse(JSON.stringify(run))));
    assert.equal(new Set(offers).size, 3);
    offers.forEach((id) => seen.add(id));
    assert.ok(offers.every((id) => RELICS[id].description.length > 30));
    const owned = { ...run, relics: offers };
    assert.ok(offerRelics(owned).every((id) => !offers.includes(id)));
  }
  assert.equal(seen.size, 31);
  assert.deepEqual(
    offerRelics({ ...newAdventure(3, 1), relics: RELIC_IDS }),
    [],
  );
});
test("gold relics grant a flat one-time purse and multiply earned battle, event, and chest money", () => {
  const base = newAdventure(3, 8),
    compass = { ...base, relics: ["gilded-compass"] as RelicId[] };
  assert.equal(gift(base, "merchants-purse").gold, 160);
  const combined = gift(compass, "merchants-purse");
  assert.equal(combined.gold, 160);
  assert.equal(validateAdventure(JSON.parse(JSON.stringify(combined))), true);
  assert.throws(() => gift(combined, "merchants-purse"));
  assert.equal(combined.gold, 160);
  assert.equal(earnedGold(compass, 25), 31);
  assert.equal(finish(enterAdventureNode(compass, "moss")).gold, 91);
  const well = resolveAdventureEvent(
    enterAdventureNode({ ...compass, floor: 1 }, "well"),
    "gold",
  );
  assert.equal(well.gold, 110);
  const chest = resolveAdventureEvent(
    enterAdventureNode(
      { ...compass, floor: 1, relics: ["gilded-compass", "treasure-magnet"] },
      "chest-one",
    ),
    "fight",
  );
  const claimed = finish(chest);
  assert.equal(claimed.gold, 60 + 131);
  assert.match(claimed.message, /\+75 bonus gold/);
});
test("Runesmith's Quill improves keyword odds including early rewards without changing shop stock", () => {
  let base = 0,
    enhanced = 0,
    early = 0;
  for (let seed = 0; seed < 80; seed++) {
    const run = { ...newAdventure(3, seed), floor: 3 };
    base += rewardCards(run).filter((card) => card.keywords?.length).length;
    const boosted = { ...run, relics: ["runesmiths-quill"] as RelicId[] };
    enhanced += rewardCards(boosted).filter(
      (card) => card.keywords?.length,
    ).length;
    early += rewardCards({ ...boosted, floor: 0 }).filter(
      (card) => card.keywords?.length,
    ).length;
    assert.deepEqual(rewardCards(boosted, false), rewardCards(run, false));
    assert.ok(rewardCards(boosted).every(validateStone));
  }
  assert.ok(enhanced > base);
  assert.ok(early > 0);
  assert.ok(early < 240);
});
test("Twin Sigil and Fated Lens offer five cards and allow two distinct picks without duplicate claims", () => {
  const run = {
    ...newAdventure(4, 9),
    relics: ["twin-sigil", "fated-lens"] as RelicId[],
  };
  let won = finish(enterAdventureNode(run, "moss"));
  assert.equal(won.rewards.length, 5);
  assert.equal(won.rewardPicksRemaining, 2);
  assert.equal(cardRewardPicks(run), 2);
  assert.throws(
    () => claimAdventureReward(won, won.rewards[0].id),
    /relic reward first/,
  );
  won = claimAdventureRelic(won, null);
  const first = won.rewards[0],
    before = won.inventory.length,
    deck = won.deck;
  const picked = claimAdventureReward(won, first.id);
  assert.equal(picked.phase, "reward");
  assert.equal(picked.floor, 0);
  assert.equal(picked.rewardPicksRemaining, 1);
  assert.equal(picked.rewards.length, 4);
  assert.equal(picked.inventory.length, before + 1);
  assert.throws(() => claimAdventureReward(picked, first.id));
  const second = claimAdventureReward(picked, picked.rewards[0].id);
  assert.equal(second.phase, "map");
  assert.equal(second.floor, 1);
  assert.equal(second.inventory.length, before + 2);
  assert.deepEqual(second.deck, deck);
  assert.equal(validateAdventure(second), true);
});
test("reward-affecting relics take effect immediately when chosen before card rewards", () => {
  for (const id of [
    "twin-sigil",
    "fated-lens",
    "stonewrights-hammer",
    "runesmiths-quill",
  ] as RelicId[]) {
    const base = newAdventure(3, 99),
      won = finish(enterAdventureNode(base, "moss"));
    const acquired = claimAdventureRelic({ ...won, relicOffers: [id] }, id);
    assert.ok(acquired.relics?.includes(id));
    assert.equal(acquired.relicOffers?.length, 0);
    assert.deepEqual(acquired.rewards, rewardCards(acquired));
    assert.equal(acquired.rewardPicksRemaining, id === "twin-sigil" ? 2 : 1);
    assert.equal(acquired.rewards.length, id === "fated-lens" ? 5 : 3);
  }
});
test("Stonewright's Hammer adds one printed reward pip within caps and leaves merchant cards unchanged", () => {
  for (const floor of [0, 4, 8]) {
    const run = { ...newAdventure(3, 15), floor },
      hammer = { ...run, relics: ["stonewrights-hammer"] as RelicId[] };
    for (const card of rewardCards(hammer)) {
      assert.equal(
        card.edges.reduce((a, b) => a + b),
        Math.min(12, 5 + Math.floor(floor * 0.5)),
      );
      assert.ok(validateStone(card));
    }
    assert.deepEqual(rewardCards(hammer, false), rewardCards(run, false));
  }
});
test("Traveler's Satchel raises capacity and Bubbling Flask doubles free potions up to that capacity", () => {
  const base = {
    ...newAdventure(3, 17),
    potions: [],
    relics: ["travelers-satchel", "bubbling-flask"] as RelicId[],
  };
  assert.equal(potionCapacity(base), 5);
  const won = finish(enterAdventureNode(base, "moss"));
  assert.equal(won.potions.length, 2);
  assert.equal(won.potions[0], won.potions[1]);
  assert.ok(Object.hasOwn(POTIONS, won.potions[0]));
  const event = enterAdventureNode(
    { ...base, floor: 4, potions: ["power", "heal", "hex", "power"] },
    "alchemy",
  );
  const gift = resolveAdventureEvent(event, "hex");
  assert.equal(gift.potions.length, 5);
  assert.equal(validateAdventure(gift), true);
  const shop = enterAdventureNode(
    {
      ...base,
      floor: 2,
      gold: 200,
      potions: ["power", "heal", "hex", "power"],
    },
    "shop-one",
  );
  const bought = buyAdventurePotion(shop, shop.shopPotions[0].id);
  assert.equal(bought.potions.length, 5);
  assert.equal(
    bought.gold,
    shop.gold - POTIONS[shop.shopPotions[0].type].price,
  );
  assert.throws(() => buyAdventurePotion(bought, bought.shopPotions[0].id));
  assert.equal(validateAdventure({ ...bought, relics: [] }), false);
});
test("Pilgrim's Flask fills the belt once and saved games do not replay instant potion grants", () => {
  const base = {
    ...newAdventure(4, 1),
    potions: [],
    relics: ["travelers-satchel"] as RelicId[],
  };
  const filled = gift(base, "pilgrims-flask");
  assert.equal(filled.potions.length, 5);
  assert.equal(new Set(filled.potions).size, 5);
  assert.ok(filled.potions.every((type) => Object.hasOwn(POTIONS, type)));
  assert.equal(validateAdventure(JSON.parse(JSON.stringify(filled))), true);
  assert.throws(() => gift(filled, "pilgrims-flask"));
  assert.equal(filled.potions.length, 5);
});
test("Alchemist's Mortar improves all three potions, clamps results, and consumes no turn", () => {
  const base = {
    ...newAdventure(3, 3),
    relics: ["alchemists-mortar"] as RelicId[],
  };
  assert.equal(potionPotency(base), 2);
  assert.match(potionDescription(base, "heal"), /2 lives/);
  const battle = enterAdventureNode(base, "moss"),
    stone = battle.battle!.hands[0][0];
  const powered = useAdventurePotion(battle, 0, stone.id);
  assert.deepEqual(
    powered.battle!.hands[0][0].edges,
    stone.edges.map((edge) => edge + 2),
  );
  assert.deepEqual(powered.inventory[0].edges, stone.edges);
  assert.equal(powered.battle!.turns, 0);
  assert.equal(useAdventurePotion({ ...base, lives: 1 }, 1).lives, 3);
  const board = [...battle.battle!.board];
  board[4] = { stone: plain([0, 1, 3, 5]), owner: 1, edges: [0, 1, 3, 5] };
  const hex = useAdventurePotion(
    { ...battle, potions: ["hex"], battle: { ...battle.battle!, board } },
    0,
    4,
  );
  assert.deepEqual(hex.battle!.board[4]?.edges, [0, 0, 1, 3]);
  assert.deepEqual(hex.battle!.board[4]?.reductions, [0, 1, 2, 2]);
  assert.equal(hex.potions.length, 0);
  assert.equal(hex.battle!.turns, 0);
});
test("Phoenix Feather saves one fatal loss and stays spent across save and retry", () => {
  const base = {
    ...newAdventure(3, 6),
    lives: 1,
    relics: ["phoenix-feather"] as RelicId[],
  };
  const saved = finish(enterAdventureNode(base, "moss"), false);
  assert.equal(saved.lives, 1);
  assert.equal(saved.phase, "reward");
  assert.deepEqual(saved.spentRelics, ["phoenix-feather"]);
  assert.equal(validateAdventure(JSON.parse(JSON.stringify(saved))), true);
  const retry = enterAdventureNode(
    { ...saved, phase: "map", floor: 0, battle: undefined, node: undefined },
    "moss",
  );
  const spent = finish(retry, false);
  assert.equal(spent.lives, 0);
  assert.equal(spent.phase, "ended");
  assert.deepEqual(spent.spentRelics, ["phoenix-feather"]);
});
test("Campfire Charm heals victories only and never raises life above three", () => {
  const base = {
    ...newAdventure(3, 7),
    lives: 1,
    relics: ["campfire-charm"] as RelicId[],
  };
  assert.equal(finish(enterAdventureNode(base, "moss")).lives, 2);
  assert.equal(
    finish(enterAdventureNode({ ...base, lives: 3 }, "moss")).lives,
    3,
  );
  assert.equal(
    finish(enterAdventureNode({ ...base, lives: 3 }, "moss"), false).lives,
    2,
  );
});
test("Haggler's Coin discounts every shop category consistently without double purchases", () => {
  const shop = enterAdventureNode(
      { ...newAdventure(3, 9), floor: 2, gold: 500, relics: ["hagglers-coin"] },
      "shop-one",
    ),
    id = shop.inventory[0].id;
  assert.equal(shopPrice(shop, 35), 28);
  assert.equal(cardPrice(shop.shopCards[0], shop), 28);
  assert.equal(buyAdventureCard(shop, shop.shopCards[0].id).gold, 472);
  assert.equal(
    buyAdventurePotion(shop, shop.shopPotions[0].id).gold,
    500 - Math.ceil(POTIONS[shop.shopPotions[0].type].price * 0.8),
  );
  assert.equal(
    buyAdventureService(shop, { type: "pip", cardId: id }).gold,
    480,
  );
  const element = shop.inventory[0].element === "fire" ? "water" : "fire";
  assert.equal(
    buyAdventureService(shop, { type: "element", cardId: id, element }).gold,
    484,
  );
  assert.equal(
    buyAdventureService(shop, { type: "keyword", cardId: id }).gold,
    472,
  );
  const purchase = buyAdventureRelic(
    { ...shop, shopRelic: "treasure-magnet" },
    "treasure-magnet",
  );
  assert.equal(purchase.gold, 440);
  assert.ok(purchase.relics?.includes("treasure-magnet"));
  assert.equal(purchase.shopRelic, null);
  assert.throws(() => buyAdventureRelic(purchase, "treasure-magnet"));
  assert.throws(() =>
    buyAdventureRelic(
      { ...shop, gold: 0, shopRelic: "treasure-magnet" },
      "treasure-magnet",
    ),
  );
});
test("Vanguard Banner buffs only the first played card, previews correctly, and resets next battle", () => {
  for (const size of [3, 4] as BoardSize[]) {
    const base = {
      ...newAdventure(size, 2),
      relics: ["vanguard-banner"] as RelicId[],
    };
    assert.equal(
      adventureStoneForPlay(base, base.inventory[0]),
      base.inventory[0],
    );
    let run = enterAdventureNode(base, "moss");
    const first = run.battle!.hands[0][0];
    assert.deepEqual(
      adventureStoneForPlay(run, first).edges,
      first.edges.map((edge) => edge + 1),
    );
    assert.equal(
      adventureStoneForPlay(run, run.battle!.hands[1][0], 1),
      run.battle!.hands[1][0],
    );
    run = playAdventureCard(run, 0, 0);
    assert.deepEqual(
      run.battle!.board[0]?.stone.edges,
      first.edges.map((edge) => edge + 1),
    );
    assert.equal(run.battle!.vanguardUsed, true);
    run = adventureEnemyMove(run);
    const next = run.battle!.hands[0][0];
    assert.equal(adventureStoneForPlay(run, next), next);
    const at = run.battle!.board.findIndex((cell) => !cell);
    run = playAdventureCard(run, at, 0);
    assert.deepEqual(run.battle!.board[at]?.stone.edges, next.edges);
    assert.deepEqual(run.inventory[0].edges, first.edges);
    assert.equal(validateAdventure(JSON.parse(JSON.stringify(run))), true);
    const battle = enterAdventureNode(
      { ...run, phase: "map", floor: 0, battle: undefined, node: undefined },
      "moss",
    );
    assert.deepEqual(
      adventureStoneForPlay(battle, battle.battle!.hands[0][0]).edges,
      first.edges.map((edge) => edge + 1),
    );
  }
});
test("relic acquisition paths work on first wins, secured chests, elite victories, shrines and merchants", () => {
  const base = newAdventure(3, 3);
  const first = finish(enterAdventureNode(base, "moss"));
  assert.equal(first.relicOffers?.length, 3);
  const elite = finish(enterAdventureNode({ ...base, floor: 6 }, "sentinel"));
  assert.equal(elite.relicOffers?.length, 3);
  const shrine = enterAdventureNode({ ...base, floor: 4 }, "reliquary");
  assert.equal(shrine.relicOffers?.length, 3);
  const claimed = claimAdventureRelic(shrine, shrine.relicOffers![0]);
  assert.equal(claimed.phase, "map");
  assert.equal(claimed.floor, 5);
  assert.equal(claimed.relics?.length, 1);
  assert.equal(validateAdventure(claimed), true);
  assert.throws(() => claimAdventureRelic(claimed, shrine.relicOffers![1]));
  const shop = enterAdventureNode({ ...base, floor: 2, gold: 200 }, "shop-one");
  assert.ok(shop.shopRelic);
  assert.ok(
    buyAdventureRelic(shop, shop.shopRelic!).relics?.includes(shop.shopRelic!),
  );
});
test("old saves without relic fields remain valid, while malformed relics and charges are rejected", () => {
  const run = newAdventure(3, 33);
  delete run.relics;
  delete run.spentRelics;
  delete run.relicOffers;
  delete run.rewardPicksRemaining;
  assert.equal(validateAdventure(JSON.parse(JSON.stringify(run))), true);
  for (const patch of [
    { relics: ["fake"] },
    { relics: ["twin-sigil", "twin-sigil"] },
    { spentRelics: ["phoenix-feather"] },
    { relicOffers: ["fake"] },
    { relics: ["twin-sigil"], relicOffers: ["twin-sigil"] },
    { shopRelic: "fake" },
    { rewardPicksRemaining: 3 },
    { phase: "battle", battle: undefined },
  ])
    assert.equal(validateAdventure({ ...run, ...patch }), false);
});
test("restoring an old shop supplies one stable relic without restocking sold relics", () => {
  const shop = enterAdventureNode(
    { ...newAdventure(3, 14), floor: 2, gold: 200 },
    "shop-one",
  );
  delete shop.shopRelic;
  const restored = restoreAdventure(JSON.parse(JSON.stringify(shop)))!;
  assert.ok(restored.shopRelic);
  assert.deepEqual(restored.shopRelic, restoreAdventure(shop)!.shopRelic);
  const bought = buyAdventureRelic(restored, restored.shopRelic!);
  assert.equal(
    restoreAdventure(JSON.parse(JSON.stringify(bought)))!.shopRelic,
    null,
  );
  assert.equal(shop.shopRelic, undefined);
});
test("old untouched throne rooms lose their extra guard while battles in progress keep their state", () => {
  for (const size of [3, 4] as BoardSize[]) {
    const boss = enterAdventureNode(
        { ...newAdventure(size, 44), floor: 8 },
        "warden",
      ),
      at = size === 3 ? 0 : 10;
    boss.battle!.board[at] = {
      stone: {
        ...plain([1, 0, 2, 0]),
        id: "custom-run-crown-guard",
        name: "Crown Sentinel",
      },
      owner: 1,
    };
    assert.equal(validateAdventure(boss), true);
    const restored = restoreAdventure(JSON.parse(JSON.stringify(boss)))!;
    assert.equal(restored.battle!.board.filter(Boolean).length, 1);
    assert.equal(restored.battle!.board[at], null);
    assert.equal(boss.battle!.board.filter(Boolean).length, 2);
    const started = { ...boss, battle: { ...boss.battle!, turns: 1 } };
    assert.deepEqual(restoreAdventure(started), started);
  }
});

test("Victory Medallion and Copper Claw pay win and capture gold, including losses and Compass scaling", () => {
  const run = enterAdventureNode(
    {
      ...newAdventure(3, 7),
      relics: ["victory-medallion", "copper-claw", "gilded-compass"],
    },
    "moss",
  );
  run.battle!.captures = 3;
  assert.equal(finish(run).gold, 60 + Math.floor((25 + 10 + 6) * 1.25));
  assert.equal(finish(run, false).gold, 60 + Math.floor(6 * 1.25));
});
test("Quiet Coin pays once on entering shops; Rainy Day Bank pays capped interest once on leaving", () => {
  const base: Adventure = {
    ...newAdventure(3, 8),
    floor: 2,
    gold: 200,
    relics: ["quiet-coin", "rainy-day-bank", "gilded-compass"],
  };
  const shop = enterAdventureNode(base, "shop-one");
  assert.equal(shop.gold, 218);
  assert.equal(restoreAdventure(JSON.parse(JSON.stringify(shop)))!.gold, 218);
  assert.throws(() => enterAdventureNode(shop, "shop-one"));
  const left = leaveAdventureShop(shop);
  assert.equal(left.gold, 239);
  assert.throws(() => leaveAdventureShop(left));
  assert.equal(leaveAdventureShop({ ...shop, gold: 1000 }).gold, 1030);
});
test("Restful Ember heals on camp arrival once, then normal training remains available", () => {
  const camp = enterAdventureNode(
    { ...newAdventure(3, 7), floor: 7, lives: 1, relics: ["restful-ember"] },
    "camp",
  );
  assert.equal(camp.lives, 2);
  assert.equal(restoreAdventure(camp)!.lives, 2);
  const trained = resolveAdventureEvent(camp, "train", camp.inventory[0].id);
  assert.equal(trained.lives, 2);
  assert.equal(
    trained.inventory[0].edges.reduce((a, b) => a + b, 0),
    camp.inventory[0].edges.reduce((a, b) => a + b, 0) + 1,
  );
});
test("Whetstone Ring respects edge and total caps; Elemental Prism adds a weakest-edge pip only when possible", () => {
  const shop = enterAdventureNode(
    {
      ...newAdventure(3, 12),
      floor: 2,
      gold: 400,
      relics: ["whetstone-ring", "elemental-prism"],
    },
    "shop-one",
  );
  const side = adventureWorkshopOffer(shop).pipSide,
    id = shop.inventory[0].id;
  const sharpened = buyAdventureService(shop, { type: "pip", cardId: id });
  assert.equal(
    sharpened.inventory[0].edges[side],
    shop.inventory[0].edges[side] + 2,
  );
  shop.inventory[0] = { ...shop.inventory[0], edges: [3, 3, 3, 3] };
  shop.inventory[0].edges[side] = 2;
  const capped = buyAdventureService(shop, { type: "pip", cardId: id });
  assert.equal(
    capped.inventory[0].edges.reduce((a, b) => a + b, 0),
    12,
  );
  assert.throws(() => buyAdventureService(capped, { type: "pip", cardId: id }));
  const element = shop.inventory[0].element === "fire" ? "water" : "fire";
  const reforged = buyAdventureService(shop, {
    type: "element",
    element,
    cardId: id,
  });
  assert.equal(
    reforged.inventory[0].edges.reduce((a, b) => a + b, 0),
    12,
  );
  const full = buyAdventureService(capped, {
    type: "element",
    element,
    cardId: id,
  });
  assert.deepEqual(full.inventory[0].edges, capped.inventory[0].edges);
  assert.equal(full.inventory[0].element, element);
});
test("Rune Echo inscribes opposite edges, permits repeated Sunder purchases, and preserves singleton rules", () => {
  const seen = new Set<string>();
  for (let seed = 0; seed < 70; seed++) {
    const shop = enterAdventureNode(
      { ...newAdventure(3, seed), floor: 2, gold: 200, relics: ["rune-echo"] },
      "shop-one",
    );
    const keyword = adventureWorkshopOffer(shop).keyword;
    const bought = buyAdventureService(shop, {
      type: "keyword",
      cardId: shop.inventory[0].id,
    });
    const keywords = bought.inventory[0].keywords!;
    assert.equal(bought.gold, 165);
    assert.deepEqual(keywords[0], keyword);
    if ("side" in keyword && keyword.side !== "any") {
      assert.equal(keywords.length, 2);
      assert.deepEqual(keywords[1], {
        ...keyword,
        side: (keyword.side + 2) % 4,
      });
    } else assert.equal(keywords.length, 1);
    const buyAgain = () =>
      buyAdventureService(bought, {
        type: "keyword",
        cardId: shop.inventory[0].id,
      });
    if (keyword.type === "sunder") {
      const second = buyAgain();
      assert.equal(second.gold, 130);
      assert.deepEqual(second.inventory[0].keywords, [
        ...keywords,
        ...keywords,
      ]);
    } else assert.throws(buyAgain);
    seen.add(keyword.type);
  }
  assert.equal(seen.size, 8);
});
test("Market Map stocks four distinct merchant cards without applying card reward relics", () => {
  const base: Adventure = {
    ...newAdventure(4, 16),
    floor: 2,
    gold: 200,
    relics: ["market-map"],
  };
  const shop = enterAdventureNode(base, "shop-one");
  assert.equal(shop.shopCards.length, 4);
  assert.equal(new Set(shop.shopCards.map((card) => card.id)).size, 4);
  assert.ok(validateAdventure(shop));
  const boosted = enterAdventureNode(
    {
      ...base,
      relics: [
        "market-map",
        "fated-lens",
        "stonewrights-hammer",
        "runesmiths-quill",
      ],
    },
    "shop-one",
  );
  assert.deepEqual(boosted.shopCards, shop.shopCards);
});
test("Herbalist's Lens grants a potion on off-cycle victories, doubles with Bubbling Flask, and respects capacity", () => {
  const run = enterAdventureNode(
    {
      ...newAdventure(3, 19),
      floor: 3,
      potions: [],
      relics: ["herbalists-lens", "bubbling-flask"],
    },
    "reef",
  );
  // Floor three normally drops a potion too; no duplicate trigger on those floors.
  assert.equal(finish(run).potions.length, 2);
  const offCycle = { ...run, floor: 1 };
  assert.equal(finish(offCycle).potions.length, 2);
  assert.equal(
    finish({ ...offCycle, potions: ["heal", "heal"] }).potions.length,
    3,
  );
  assert.equal(finish(offCycle, false).potions.length, 0);
});
test("Bottomless Bottle saves only the first valid potion per battle and never grants a free out-of-battle heal", () => {
  const battle = enterAdventureNode(
    {
      ...newAdventure(3, 23),
      lives: 1,
      potions: ["power", "heal"],
      relics: ["bottomless-bottle"],
    },
    "moss",
  );
  assert.throws(() => useAdventurePotion(battle, 0, "missing"));
  assert.equal(battle.battle!.potionSaved, undefined);
  const first = useAdventurePotion(battle, 0, battle.battle!.hands[0][0].id);
  assert.equal(first.potions.length, 2);
  assert.equal(first.battle!.potionSaved, true);
  const second = useAdventurePotion(first, 0, battle.battle!.hands[0][0].id);
  assert.equal(second.potions.length, 1);
  assert.equal(second.battle!.turns, 0);
  const healing = useAdventurePotion({ ...battle, phase: "map" }, 1);
  assert.equal(healing.potions.length, 1);
  assert.equal(healing.lives, 2);
  assert.ok(validateAdventure(second));
});
test("Duelist's Bracer heals exactly once on the player's first capture, and tracks the charge through reload", () => {
  const run = enterAdventureNode(
    { ...newAdventure(3, 9), lives: 1, relics: ["duelists-bracer"] },
    "moss",
  );
  run.battle!.board[3] = { stone: plain(), owner: 1 };
  run.battle!.hands[0] = [plain([1, 1, 1, 1]), plain([1, 1, 1, 1])];
  const captured = playAdventureCard(run, 4, 0);
  assert.equal(captured.lives, 2);
  assert.equal(captured.battle!.captures, 1);
  assert.equal(captured.battle!.bracerUsed, true);
  assert.deepEqual(
    restoreAdventure(JSON.parse(JSON.stringify(captured))),
    JSON.parse(JSON.stringify(captured)),
  );
  captured.battle!.current = 0;
  captured.battle!.board[2] = { stone: plain(), owner: 1 };
  assert.equal(playAdventureCard(captured, 5, 0).lives, 2);
});
test("Stout Heart raises the life cap, heals on acquisition, and every healing source respects the new maximum", () => {
  const heart = gift(newAdventure(3, 9), "stout-heart");
  assert.equal(heart.lives, 4);
  assert.equal(maxLives(heart), 4);
  assert.ok(validateAdventure(heart));
  assert.equal(validateAdventure({ ...newAdventure(3, 9), lives: 4 }), false);
  const healing = useAdventurePotion({ ...heart, lives: 3 }, 1);
  assert.equal(healing.lives, 4);
  assert.throws(() => useAdventurePotion(heart, 1));
  const well = resolveAdventureEvent(
    enterAdventureNode({ ...heart, phase: "map", floor: 1, lives: 3 }, "well"),
    "heal",
  );
  assert.equal(well.lives, 4);
  const won = finish(
    enterAdventureNode(
      {
        ...heart,
        phase: "map",
        lives: 3,
        relics: ["stout-heart", "campfire-charm"],
      },
      "moss",
    ),
  );
  assert.equal(won.lives, 4);
});
