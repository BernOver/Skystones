import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import {
  EMPTY_BOARD,
  STARTER_STONES,
  chooseMove,
  coordinate,
  handSize,
  placeStone,
  score,
  validateStone,
} from "../src/game.ts";
import type { BoardSize, Stone } from "../src/game.ts";
import {
  ROUTE,
  adventureEnemyMove,
  buyAdventureCard,
  buyAdventurePotion,
  buyAdventureService,
  cardPrice,
  claimAdventureReward,
  enterAdventureNode,
  leaveAdventureShop,
  newAdventure,
  playAdventureCard,
  resolveAdventureEvent,
  rewardCards,
  setAdventureDeck,
  useAdventurePotion,
  validateAdventure,
} from "../src/adventure.ts";
import type { Adventure } from "../src/adventure.ts";
const plain = (edges: Stone["edges"] = [0, 0, 0, 0]): Stone => ({
  ...STARTER_STONES[0],
  id: "custom-test-plain",
  edges,
  keywords: [],
});
function almostFinished(run: Adventure, owners: (0 | 1)[]): Adventure {
  const battle = run.battle!,
    board = battle.board.map((cell, index) =>
      index === battle.board.length - 1
        ? null
        : {
            stone: cell?.stone || plain(),
            owner: owners[index] || 0,
            playedBy: cell?.playedBy || 0,
            edges: [0, 0, 0, 0] as Stone["edges"],
            activeKeywords: [],
          },
    );
  return {
    ...run,
    battle: {
      ...battle,
      board,
      hands: [[plain()], [plain()]],
      current: 0,
      turns:
        battle.board.length -
        1 -
        (battle.objectiveKind === "throne"
          ? 2
          : battle.objectiveKind === "chest"
            ? 1
            : 0),
    },
  };
}

test("four-by-four captures face the right neighbors and never wrap rows", () => {
  const board = EMPTY_BOARD(4);
  board[6] = { stone: plain([0, 0, 0, 0]), owner: 1 };
  board[9] = { stone: plain([0, 0, 0, 0]), owner: 1 };
  board[11] = { stone: plain([0, 0, 0, 0]), owner: 1 };
  board[14] = { stone: plain([0, 0, 0, 0]), owner: 1 };
  board[7] = { stone: plain(), owner: 1 };
  const move = placeStone(board, 10, plain([1, 1, 1, 1]), 0);
  assert.deepEqual(move.captured, [6, 11, 14, 9]);
  assert.equal(move.board[7]?.owner, 1);
  const wrap = EMPTY_BOARD(4);
  wrap[3] = { stone: plain(), owner: 1 };
  assert.deepEqual(placeStone(wrap, 4, plain([5, 5, 5, 5]), 0).captured, []);
  assert.equal(coordinate(15, 4), "D4");
  assert.throws(() => placeStone(board, 16, plain(), 0));
});
test("four-by-four games finish in sixteen moves using eight-card hands", () => {
  let board = EMPTY_BOARD(4);
  const hands = [STARTER_STONES.slice(0, 8), STARTER_STONES.slice(0, 8)];
  for (let turn = 0; turn < 16; turn++) {
    const owner = (turn % 2) as 0 | 1;
    const move = chooseMove(
      board,
      hands[owner],
      hands[owner === 0 ? 1 : 0],
      owner,
    );
    board = placeStone(
      board,
      move.index,
      hands[owner][move.cardIndex],
      owner,
      move.targets,
    ).board;
    hands[owner].splice(move.cardIndex, 1);
    assert.equal(board.filter(Boolean).length, turn + 1);
  }
  assert.deepEqual(
    hands.map((hand) => hand.length),
    [0, 0],
  );
  assert.equal(
    score(board).reduce((a, b) => a + b),
    16,
  );
});
test("adventures start with mostly zero and one pips, correct hand sizes, and deterministic growing rewards", () => {
  for (const size of [3, 4] as BoardSize[]) {
    const run = newAdventure(size, 42);
    assert.equal(run.deck.length, handSize(size));
    assert.equal(run.gold, 60);
    assert.equal(run.lives, 3);
    assert.ok(
      run.inventory.every(
        (stone) =>
          stone.edges.every((edge) => edge === 0 || edge === 1) &&
          stone.edges.includes(0),
      ),
    );
    assert.equal(validateAdventure(run), true);
    const battle = enterAdventureNode(run, "moss");
    assert.equal(battle.battle?.hands[0].length, handSize(size));
    assert.ok(
      battle.battle!.hands[1].every((stone) =>
        stone.edges.every((edge) => edge <= 1),
      ),
    );
    assert.equal(validateAdventure(battle), true);
    let previous = 0;
    for (let floor = 0; floor < 9; floor++) {
      const offers = rewardCards({ ...run, floor });
      const budget = offers[0].edges.reduce((a, b) => a + b, 0);
      assert.ok(budget >= previous);
      assert.equal(budget, Math.min(12, 4 + floor));
      assert.ok(offers.every(validateStone));
      assert.deepEqual(offers, rewardCards({ ...run, floor }));
      previous = budget;
    }
  }
});
test("decks are editable between battles, require a full hand, and lock during battle", () => {
  const run = newAdventure(4, 11),
    id = run.deck[0],
    removed = setAdventureDeck(run, id);
  assert.equal(removed.deck.length, 7);
  assert.throws(() => enterAdventureNode(removed, "moss"));
  assert.throws(() => setAdventureDeck(run, run.inventory[8].id));
  const ready = setAdventureDeck(removed, run.inventory[8].id);
  assert.equal(ready.deck.length, 8);
  const battle = enterAdventureNode(ready, "moss");
  assert.throws(() => setAdventureDeck(battle, id));
  assert.throws(() => enterAdventureNode(battle, "moss"));
  assert.throws(() => enterAdventureNode(run, "warden"));
});
test("chest events start central treasure on both sizes and pay only if it is held at the finish", () => {
  for (const size of [3, 4] as BoardSize[]) {
    const run = { ...newAdventure(size, 77), floor: 1 };
    const event = enterAdventureNode(run, "chest-one");
    assert.equal(event.phase, "event");
    const battle = resolveAdventureEvent(event, "fight");
    assert.equal(battle.battle!.objective, size === 3 ? 4 : 5);
    assert.equal(battle.battle!.board[battle.battle!.objective!]?.owner, 1);
    const owners = Array(size ** 2).fill(0) as (0 | 1)[];
    owners[0] = 1;
    const won = playAdventureCard(
      almostFinished(battle, owners),
      size ** 2 - 1,
      0,
    );
    assert.equal(won.gold, 60 + 30 + 45);
    assert.match(won.message, /Chest secured/);
    assert.equal(won.rewards.length, 3);
    const lostOwners = Array(size ** 2).fill(1) as (0 | 1)[];
    lostOwners[battle.battle!.objective!] = 0;
    const lost = playAdventureCard(
      almostFinished(battle, lostOwners),
      size ** 2 - 1,
      0,
    );
    assert.equal(
      lost.gold,
      105,
      "holding the chest pays 45 even when the battle score is lost",
    );
    assert.equal(lost.lives, 2);
    lostOwners[battle.battle!.objective!] = 1;
    const unclaimed = playAdventureCard(
      almostFinished(battle, lostOwners),
      size ** 2 - 1,
      0,
    );
    assert.equal(unclaimed.gold, 60);
  }
});
test("the boss begins with two guards and requires both throne control and the winning score", () => {
  for (const size of [3, 4] as BoardSize[]) {
    const run = { ...newAdventure(size, 4), floor: 8 };
    const battle = enterAdventureNode(run, "warden");
    assert.equal(battle.battle!.board.filter(Boolean).length, 2);
    const owners = Array(size ** 2).fill(0) as (0 | 1)[];
    owners[0] = 1;
    const won = playAdventureCard(
      almostFinished(battle, owners),
      size ** 2 - 1,
      0,
    );
    assert.equal(won.phase, "ended");
    assert.equal(won.victory, true);
    owners[battle.battle!.objective!] = 1;
    const failed = playAdventureCard(
      almostFinished(battle, owners),
      size ** 2 - 1,
      0,
    );
    assert.equal(failed.victory, false);
    assert.equal(failed.lives, 2);
    assert.equal(failed.phase, "reward");
    const retry = claimAdventureReward(failed, null);
    assert.equal(retry.floor, 8);
    assert.equal(retry.phase, "map");
  }
});
test("battle rewards are chosen once and join the pack without replacing the player's selected deck", () => {
  const run = enterAdventureNode(newAdventure(3, 3), "moss");
  const won = playAdventureCard(almostFinished(run, Array(9).fill(0)), 8, 0);
  assert.equal(won.phase, "reward");
  assert.equal(won.gold, 85);
  const before = won.inventory.length,
    selected = won.deck;
  const claimed = claimAdventureReward(won, won.rewards[1].id);
  assert.equal(claimed.floor, 1);
  assert.equal(claimed.inventory.length, before + 1);
  assert.deepEqual(claimed.deck, selected);
  assert.throws(() => claimAdventureReward(claimed, won.rewards[0].id));
  assert.throws(() => claimAdventureReward(won, "fake"));
  const finalLife = { ...run, lives: 1 };
  const lost = playAdventureCard(
    almostFinished(finalLife, Array(9).fill(1)),
    8,
    0,
  );
  assert.equal(lost.phase, "ended");
  assert.equal(lost.lives, 0);
});
test("shop purchases charge exactly once, upgrades persist, and failed purchases spend nothing", () => {
  const shop = enterAdventureNode(
      { ...newAdventure(3, 9), floor: 2, gold: 200 },
      "shop-one",
    ),
    stone = shop.inventory[0];
  const sharpen = buyAdventureService(shop, {
    type: "pip",
    cardId: stone.id,
    side: 0,
  });
  assert.equal(sharpen.gold, 175);
  assert.equal(sharpen.inventory[0].edges[0], stone.edges[0] + 1);
  assert.deepEqual(shop.inventory[0], stone);
  const element = stone.element === "fire" ? "water" : "fire";
  const reforged = buyAdventureService(sharpen, {
    type: "element",
    cardId: stone.id,
    element,
  });
  assert.equal(reforged.gold, 155);
  assert.equal(reforged.inventory[0].element, element);
  const inscribed = buyAdventureService(reforged, {
    type: "keyword",
    cardId: stone.id,
    keyword: { type: "sunder", side: "any", amount: 3 },
  });
  assert.equal(inscribed.gold, 120);
  assert.deepEqual(inscribed.inventory[0].keywords, [
    { type: "sunder", side: "any", amount: 3 },
  ]);
  assert.throws(() =>
    buyAdventureService(inscribed, {
      type: "keyword",
      cardId: stone.id,
      keyword: { type: "sunder", side: "any" },
    }),
  );
  const bought = buyAdventureCard(inscribed, shop.shopCards[0].id);
  assert.equal(bought.gold, 120 - cardPrice(shop.shopCards[0]));
  assert.equal(bought.inventory.length, shop.inventory.length + 1);
  assert.throws(() => buyAdventureCard(bought, shop.shopCards[0].id));
  assert.throws(() =>
    buyAdventureService(
      { ...shop, gold: 0 },
      { type: "pip", cardId: stone.id, side: 0 },
    ),
  );
  const full = {
    ...shop,
    inventory: [
      { ...stone, edges: [3, 3, 3, 3] as Stone["edges"] },
      ...shop.inventory.slice(1),
    ],
  };
  assert.throws(() =>
    buyAdventureService(full, { type: "pip", cardId: stone.id, side: 0 }),
  );
  assert.equal(full.gold, 200);
  const next = leaveAdventureShop(inscribed);
  assert.equal(next.floor, 3);
  assert.deepEqual(next.inventory[0].keywords, inscribed.inventory[0].keywords);
  assert.equal(validateAdventure(next), true);
});
test("potions are capped, heal correctly, improve only this battle's hand, and never take a turn", () => {
  const base = newAdventure(4, 55),
    battle = enterAdventureNode(base, "moss"),
    id = battle.battle!.hands[0][0].id,
    edges = battle.battle!.hands[0][0].edges;
  const buffed = useAdventurePotion(battle, 0, id);
  assert.equal(buffed.potions.length, 1);
  assert.equal(buffed.battle!.turns, 0);
  assert.equal(buffed.battle!.current, 0);
  assert.deepEqual(
    buffed.battle!.hands[0][0].edges,
    edges.map((edge) => edge + 1),
  );
  assert.deepEqual(buffed.inventory[0].edges, edges);
  assert.equal(validateAdventure(buffed), true);
  assert.throws(() => useAdventurePotion(battle, 0, "missing"));
  assert.throws(() => useAdventurePotion(base, 1));
  const healed = useAdventurePotion({ ...base, lives: 1 }, 1);
  assert.equal(healed.lives, 2);
  assert.equal(healed.potions.length, 1);
  const board = EMPTY_BOARD(4);
  board[5] = { stone: plain([0, 1, 2, 3]), owner: 1, edges: [0, 1, 2, 3] };
  const hexed = useAdventurePotion(
    { ...battle, potions: ["hex"], battle: { ...battle.battle!, board } },
    0,
    5,
  );
  assert.deepEqual(hexed.battle!.board[5]?.edges, [0, 0, 1, 2]);
  assert.deepEqual(hexed.battle!.board[5]?.reductions, [0, 1, 1, 1]);
  assert.equal(hexed.battle!.turns, 0);
  const shop = enterAdventureNode({ ...base, floor: 2, gold: 200 }, "shop-one");
  const bought = buyAdventurePotion(shop, shop.shopPotions[0].id);
  assert.equal(bought.potions.length, 3);
  assert.throws(() => buyAdventurePotion(bought, bought.shopPotions[0].id));
  assert.throws(() => buyAdventurePotion(bought, shop.shopPotions[0].id));
});
test("well, alchemist, and camp choices apply once and respect lives, potion capacity, and pip budgets", () => {
  const base = newAdventure(3, 4),
    well = enterAdventureNode({ ...base, floor: 1 }, "well");
  const trade = resolveAdventureEvent(well, "gold");
  assert.equal(trade.gold, 100);
  assert.equal(trade.lives, 2);
  assert.equal(trade.floor, 2);
  assert.throws(() => resolveAdventureEvent(trade, "gold"));
  assert.throws(() => resolveAdventureEvent({ ...well, lives: 1 }, "gold"));
  const alchemy = enterAdventureNode(
    { ...base, floor: 4, potions: [] },
    "alchemy",
  );
  assert.deepEqual(resolveAdventureEvent(alchemy, "hex").potions, ["hex"]);
  const camp = enterAdventureNode({ ...base, floor: 7, lives: 1 }, "camp");
  assert.equal(resolveAdventureEvent(camp, "heal").lives, 2);
  const trained = resolveAdventureEvent(camp, "train", base.inventory[0].id);
  assert.equal(
    trained.inventory[0].edges.reduce((a, b) => a + b, 0),
    4,
  );
  assert.equal(trained.floor, 8);
});
test("saved runs round-trip throughout play and malformed states are rejected", () => {
  let run = enterAdventureNode(newAdventure(4, 123), "moss");
  for (let i = 0; i < 4; i++) {
    assert.equal(validateAdventure(JSON.parse(JSON.stringify(run))), true);
    if (run.battle!.current === 1) run = adventureEnemyMove(run);
    else {
      const battle = run.battle!,
        move = chooseMove(battle.board, battle.hands[0], battle.hands[1], 0);
      run = playAdventureCard(run, move.index, move.cardIndex, move.targets);
    }
  }
  for (const patch of [
    { floor: 999 },
    { gold: -1 },
    { lives: 4 },
    { deck: ["missing"] },
    { potions: ["fake"] },
    { inventory: [] },
    { battle: { ...run.battle, board: [] } },
    {
      battle: {
        ...run.battle,
        board: run.battle!.board.map((cell, index) =>
          index === 0 ? { stone: plain(), owner: 0, activeKeywords: {} } : cell,
        ),
      },
    },
  ])
    assert.equal(validateAdventure({ ...run, ...patch }), false);
  assert.equal(ROUTE.at(-1)?.[0].kind, "boss");
});
test("the Giants catalogue includes all 81 reference entries, valid directional stats and 80 bundled images", () => {
  const data = JSON.parse(
    readFileSync(new URL("../src/giants-data.json", import.meta.url), "utf8"),
  );
  assert.equal(data.length, 81);
  assert.equal(new Set(data.map((stone: Stone) => stone.id)).size, 81);
  assert.equal(
    data.filter((stone: { art: string | null }) => stone.art).length,
    80,
  );
  for (const stone of data) {
    assert.equal(
      validateStone({ ...stone, id: `custom-${stone.id}` }),
      true,
      stone.name,
    );
    if (stone.art)
      assert.equal(
        existsSync(
          new URL(`../src/assets/giants/${stone.art}.png`, import.meta.url),
        ),
        true,
      );
  }
  assert.deepEqual(
    data.find((stone: Stone) => stone.name === "Drow Lance Master").edges,
    [1, 0, 0, 1],
  );
  assert.deepEqual(
    data.find((stone: Stone) => stone.name === "CONQUERTRON").edges,
    [4, 4, 4, 4],
  );
  assert.equal(
    data.find((stone: Stone) => stone.name === "Spiderlings 3").element,
    "air",
  );
});
