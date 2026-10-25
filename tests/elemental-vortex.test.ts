import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ELEMENTS,
  EMPTY_BOARD,
  STARTER_STONES,
  cardEdges,
  defenseEdges,
  placeStone,
  withArenaElement,
} from "../src/game.ts";
import type { Element, Stone, BoardSize } from "../src/game.ts";
import {
  adventureArena,
  adventureCardStrengths,
  adventureEnemyMove,
  claimAdventureRelic,
  claimAdventureReward,
  enterAdventureNode,
  newAdventure,
  playAdventureCard,
  restoreAdventure,
  useAdventurePotion,
  validateAdventure,
} from "../src/adventure.ts";
import type { Adventure } from "../src/adventure.ts";

const cycle: Element[] = [
  "fire",
  "water",
  "life",
  "undead",
  "air",
  "earth",
  "tech",
  "magic",
  "light",
  "dark",
];
const plain = (
  element: Element = "fire",
  edges: Stone["edges"] = [0, 0, 0, 0],
  keywords: Stone["keywords"] = [],
): Stone => ({
  ...STARTER_STONES[0],
  id: "custom-vortex-test",
  name: "Vortex test",
  portrait: "spyro",
  origin: "skylanders",
  element,
  edges,
  keywords,
});
function boss(size: BoardSize): Adventure {
  const run = enterAdventureNode(
    { ...newAdventure(size, 63), floor: 8 },
    "elemental-vortex",
  );
  run.battle!.elementCycle = [...cycle];
  return run;
}
test("elemental aura applies to attacks and defense for either owner, expires, and never changes printed or resolved pips", () => {
  const fire = plain("fire", [0, 1, 0, 0]),
    water = plain("water", [0, 0, 0, 1]);
  let board = EMPTY_BOARD(3);
  board[1] = { stone: water, owner: 1, edges: [...water.edges] };
  board = withArenaElement(board, "fire");
  const move = placeStone(board, 0, fire, 0, [], { arenaElement: "fire" });
  assert.deepEqual(move.captured, [1], "+1 breaks the original 1–1 tie");
  assert.deepEqual(move.board[0]!.edges, [0, 1, 0, 0]);
  assert.deepEqual(cardEdges(move.board[0]!), [1, 2, 1, 1]);
  const waterTurn = withArenaElement(move.board, "water");
  assert.deepEqual(cardEdges(waterTurn[0]!), fire.edges);
  assert.deepEqual(
    cardEdges(waterTurn[1]!),
    [1, 1, 1, 2],
    "captured cards retain their element",
  );
  const again = withArenaElement(withArenaElement(waterTurn, "fire"), "fire");
  assert.deepEqual(cardEdges(again[0]!), [1, 2, 1, 1], "bonus cannot stack");
  assert.deepEqual(fire.edges, [0, 1, 0, 0]);
  for (const owner of [0, 1] as const) {
    const defender = plain("fire", [0, 0, 0, 1]);
    const defense = EMPTY_BOARD(3);
    defense[1] = { stone: defender, owner, arenaElement: "fire" };
    assert.deepEqual(
      placeStone(
        defense,
        0,
        plain("water", [0, 2, 0, 0]),
        owner === 0 ? 1 : 0,
        [],
        { arenaElement: "fire" },
      ).captured,
      [],
    );
    assert.deepEqual(defenseEdges(defense[1]!), [1, 1, 1, 2]);
  }
});
test("Sunder, Silence, Shield and Dizzy act on normal pips while the environmental bonus stays separate", () => {
  const board = EMPTY_BOARD(3);
  board[1] = {
    stone: plain(
      "fire",
      [1, 1, 1, 1],
      [{ type: "shield", side: 3, amount: 2 }],
    ),
    owner: 1,
    edges: [3, 1, 1, 1],
    activeKeywords: [],
    arenaElement: "fire",
  };
  const sundering = plain(
    "water",
    [0, 0, 0, 0],
    [{ type: "sunder", side: 0, amount: 9 }],
  );
  const damaged = placeStone(
    board,
    4,
    sundering,
    0,
    [{ keywordIndex: 0, boardIndex: 1 }],
    { arenaElement: "fire" },
  );
  assert.equal(damaged.board[1]!.edges![0], 0);
  assert.equal(cardEdges(damaged.board[1]!)[0], 1);
  assert.equal(
    defenseEdges(damaged.board[1]!)[3],
    4,
    "printed + aura + Shield",
  );
  const silencer = plain("water", [0, 0, 0, 0], [{ type: "silence" }]);
  const silent = placeStone(
    damaged.board,
    8,
    silencer,
    0,
    [{ keywordIndex: 0, boardIndex: 1 }],
    { arenaElement: "fire" },
  );
  assert.equal(silent.board[1]!.silenced, true);
  assert.deepEqual(cardEdges(silent.board[1]!), [1, 2, 2, 2]);
  assert.deepEqual(defenseEdges(silent.board[1]!), [1, 2, 2, 2]);
  const dizzy = plain("fire", [3, 3, 3, 3], [{ type: "dizzy" }]);
  const rolled = placeStone(EMPTY_BOARD(3), 0, dizzy, 0, [], {
    seed: 7,
    arenaElement: "fire",
  }).board[0]!;
  assert.equal(
    rolled.edges!.reduce((a, b) => a + b),
    12,
  );
  assert.ok(rolled.edges!.every((edge) => edge <= 5));
  assert.equal(
    cardEdges(rolled).reduce((a, b) => a + b),
    16,
  );
});
for (const size of [3, 4] as const) {
  test(`${size}×${size} vortex starts empty, forecasts all elements, advances on each player's placement, saves and wraps`, () => {
    let run = boss(size);
    assert.equal(run.battle!.boss, "kaos-vortex");
    assert.equal(run.battle!.board.filter(Boolean).length, 0);
    assert.equal(run.battle!.objective, undefined);
    assert.deepEqual(adventureArena(run), { current: "fire", next: "water" });
    assert.ok(validateAdventure(run));
    const original = JSON.stringify(run.inventory);
    run.battle!.hands[0][0] = plain("fire", [1, 1, 1, 1]);
    assert.deepEqual(
      adventureCardStrengths(run, run.battle!.hands[0][0]).edges,
      [2, 2, 2, 2],
    );
    assert.deepEqual(
      adventureCardStrengths(run, plain("water"), 1).edges,
      [0, 0, 0, 0],
    );
    run = playAdventureCard(run, 0, 0);
    assert.deepEqual(adventureArena(run), { current: "water", next: "life" });
    assert.deepEqual(cardEdges(run.battle!.board[0]!), [1, 1, 1, 1]);
    run = adventureEnemyMove(run);
    assert.equal(run.battle!.turns, 2);
    assert.deepEqual(adventureArena(run), { current: "life", next: "undead" });
    const restored = restoreAdventure(JSON.parse(JSON.stringify(run)))!;
    assert.ok(restored);
    assert.deepEqual(adventureArena(restored), adventureArena(run));
    assert.deepEqual(restored.battle!.elementCycle, cycle);
    assert.ok(
      restored
        .battle!.board.filter(Boolean)
        .every((cell) => cell!.arenaElement === "life"),
    );
    assert.equal(JSON.stringify(run.inventory), original);
    const wrap = { ...run, battle: { ...run.battle!, turns: 9 } };
    assert.deepEqual(adventureArena(wrap), { current: "dark", next: "fire" });
  });
  test(`${size}×${size} victory gives boss rewards and opens Act II, losing the score permits retry`, () => {
    const initial = boss(size),
      n = size ** 2;
    for (const won of [false, true]) {
      const run: Adventure = {
        ...initial,
        battle: {
          ...initial.battle!,
          turns: n - 1,
          current: 0,
          board: Array.from({ length: n }, (_, index) =>
            index === n - 1
              ? null
              : { stone: plain("neutral"), owner: won ? 0 : 1 },
          ),
          hands: [[plain("neutral")], [plain("neutral")]],
        },
      };
      let result = playAdventureCard(run, n - 1, 0);
      assert.equal(result.phase, "reward");
      assert.equal(result.battle!.bossWon, won);
      assert.equal(result.lives, won ? 3 : 2);
      if (won) {
        assert.ok(result.relicOffers!.length);
        assert.ok(result.rewards.length);
        result = claimAdventureRelic(result, null);
      }
      result = claimAdventureReward(result, null);
      assert.equal(result.phase, "map");
      assert.equal(result.floor, won ? 9 : 8);
      assert.ok(restoreAdventure(result));
    }
  });
}
test("potions cannot advance the arena; recoloring changes which hand cards receive its bonus", () => {
  let run = boss(3);
  const stone = plain("water", [1, 1, 1, 1]);
  run.battle!.hands[0][0] = stone;
  run.potions = ["prism"];
  run = useAdventurePotion(run, 0, stone.id, { element: "fire" });
  assert.equal(run.battle!.turns, 0);
  assert.equal(adventureArena(run)!.current, "fire");
  assert.deepEqual(
    adventureCardStrengths(run, run.battle!.hands[0][0]).edges,
    [2, 2, 2, 2],
  );
});
test("seeded boss schedules persist and malformed schedules are rejected", () => {
  const first = enterAdventureNode(
    { ...newAdventure(3, 10), floor: 8 },
    "elemental-vortex",
  );
  const same = enterAdventureNode(
    { ...newAdventure(3, 10), floor: 8 },
    "elemental-vortex",
  );
  assert.deepEqual(first.battle!.elementCycle, same.battle!.elementCycle);
  assert.equal(new Set(first.battle!.elementCycle).size, 10);
  assert.deepEqual(
    new Set(first.battle!.elementCycle),
    new Set(Object.keys(ELEMENTS).filter((e) => e !== "neutral")),
  );
  for (const broken of [
    undefined,
    [],
    Array(10).fill("fire"),
    [...cycle.slice(0, 9), "neutral"],
  ]) {
    assert.equal(
      validateAdventure({
        ...first,
        battle: { ...first.battle!, elementCycle: broken },
      }),
      false,
    );
  }
});
