import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ROUTE,
  adventureAct,
  adventureStop,
  claimAdventureRelic,
  claimAdventureReward,
  enterAdventureNode,
  leaveAdventureShop,
  newAdventure,
  playAdventureCard,
  resolveAdventureEvent,
  restoreAdventure,
} from "../src/adventure.ts";
import type { Adventure } from "../src/adventure.ts";
import type { Edges } from "../src/game.ts";
function finalTurn(run: Adventure, ownedCorners = 4, held = true): Adventure {
  const b = run.battle!,
    n = run.size,
    corners = [0, n - 1, n * (n - 1), n * n - 1];
  return {
    ...run,
    battle: {
      ...b,
      current: 0,
      turns: n * n - 2,
      board: b.board.map((cell, index) =>
        index === n * n - 2
          ? null
          : {
              stone: {
                ...(cell?.stone || run.inventory[0]),
                keywords: [],
                edges: [0, 0, 0, 0] as Edges,
              },
              edges: [0, 0, 0, 0] as Edges,
              owner: (
                index === b.objective
                  ? !held
                  : corners.includes(index) &&
                    corners.indexOf(index) >= ownedCorners
              )
                ? 1
                : 0,
            },
      ),
      hands: [
        [{ ...run.inventory[0], edges: [0, 0, 0, 0], keywords: [] }],
        [run.inventory[0]],
      ],
    },
  };
}
function finish(run: Adventure, corners = 4, held = true) {
  return playAdventureCard(finalTurn(run, corners, held), run.size ** 2 - 2, 0);
}
for (const size of [3, 4] as const) {
  test(`${size}×${size} two-act route reaches Kaos, continues with saved rewards, and finishes at Golden Queen`, () => {
    let run = newAdventure(size, 93);
    for (let floor = 0; floor < ROUTE.length; floor++) {
      assert.equal(run.floor, floor);
      assert.equal(adventureAct(floor), floor < 9 ? 1 : 2);
      assert.equal(adventureStop(floor), (floor % 9) + 1);
      assert.ok(restoreAdventure(JSON.parse(JSON.stringify(run))));
      const node = ROUTE[floor][0];
      run = enterAdventureNode(run, node.id);
      if (run.phase === "shop") run = leaveAdventureShop(run);
      else if (run.phase === "event") run = resolveAdventureEvent(run, "leave");
      else {
        if (node.kind === "boss") {
          assert.equal(run.battle!.board.filter(Boolean).length, 1);
          assert.equal(run.battle!.boss, floor < 9 ? "kaos" : "golden-queen");
          assert.equal(
            run.battle!.board[run.battle!.objective!]!.stone.portrait,
            floor < 9 ? "kaos" : "golden-queen",
          );
        }
        run = finish(run);
        if (floor === 17) {
          assert.equal(run.phase, "ended");
          assert.equal(run.victory, true);
          break;
        }
        if (run.relicOffers?.length) run = claimAdventureRelic(run, null);
        const reward = run.rewards[0];
        run = claimAdventureReward(run, reward?.id || null);
        if (floor === 8) {
          assert.equal(run.floor, 9);
          assert.equal(run.phase, "map");
          assert.equal(run.victory, false);
          assert.ok(run.inventory.some((s) => s.id === reward.id));
        }
      }
    }
    assert.equal(run.victory, true);
    assert.ok(restoreAdventure(JSON.parse(JSON.stringify(run))));
  });
  test(`${size}×${size} Golden Queen demands two corners and throne control, and failed bosses remain retryable`, () => {
    const boss = enterAdventureNode(
      { ...newAdventure(size, 17), floor: 17 },
      "golden-queen",
    );
    for (const [corners, held] of [
      [1, true],
      [4, false],
    ] as const) {
      const lost = finish(boss, corners, held);
      assert.equal(lost.victory, false);
      assert.equal(lost.lives, 2);
      assert.equal(lost.phase, "reward");
      const retry = claimAdventureReward(lost, null);
      assert.equal(retry.floor, 17);
      assert.equal(retry.phase, "map");
      assert.ok(restoreAdventure(retry));
    }
    assert.equal(finish(boss, 2, true).victory, true);
  });
  test(`${size}×${size} enemy pip budgets rise slowly across both acts and starters stay modest`, () => {
    const initial = newAdventure(size, 43);
    assert.ok(
      initial.inventory.every((s) =>
        [2, 3].includes(s.edges.reduce((a, b) => a + b, 0)),
      ),
    );
    let previous = 0;
    for (const floor of [0, 3, 6, 9, 12, 15]) {
      const battleNode = ROUTE[floor].find((node) =>
        ["battle", "elite"].includes(node.kind),
      )!;
      const run = enterAdventureNode({ ...initial, floor }, battleNode.id),
        budget = run.battle!.hands[1][0].edges.reduce((a, b) => a + b, 0);
      assert.ok(budget >= previous);
      assert.ok(budget <= previous + 2);
      assert.ok(budget <= 7);
      previous = budget;
    }
  });
}
test("all new Act II event choices resolve and persist using their existing mechanics", () => {
  for (const [floor, id, choice] of [
    [10, "golden-rune-shrine", "inscribe:0"],
    [12, "golden-idol", "dizzy-card"],
    [13, "golden-fusion-forge", "combine"],
    [13, "golden-alchemy", "power"],
    [15, "golden-reliquary", "relic"],
  ] as const) {
    let run = enterAdventureNode({ ...newAdventure(3, 42), floor }, id);
    if (choice === "relic") run = claimAdventureRelic(run, run.relicOffers![0]);
    else
      run = resolveAdventureEvent(
        run,
        choice,
        run.inventory[0].id,
        run.inventory[1].id,
      );
    assert.equal(run.phase, "map", id);
    assert.equal(run.floor, floor + 1, id);
    assert.ok(restoreAdventure(run), id);
  }
});

test("completed one-act saves unlock Act II without losing their pack, gold, or relics", () => {
  const old = {
    ...newAdventure(3, 56),
    floor: 8,
    phase: "ended" as const,
    victory: true,
    gold: 173,
    relics: ["merchants-die" as const],
  };
  const restored = restoreAdventure(JSON.parse(JSON.stringify(old)))!;
  assert.equal(restored.floor, 9);
  assert.equal(restored.phase, "map");
  assert.equal(restored.victory, false);
  assert.deepEqual(restored.inventory, old.inventory);
  assert.deepEqual(restored.deck, old.deck);
  assert.deepEqual(restored.relics, old.relics);
  assert.equal(restored.gold, 173);
});

test("legacy boss saves use Kaos's identity while preserving a started board", () => {
  const old = enterAdventureNode(
    { ...newAdventure(4, 12), floor: 8 },
    "warden",
  );
  old.battle!.boss = undefined;
  old.battle!.name = "The Crown Warden";
  old.node = { ...old.node!, name: "The Crown Warden" };
  old.battle!.board[0] = {
    stone: old.inventory[0],
    owner: 0,
    playedBy: 0,
    playedOrder: 1,
  };
  old.battle!.hands[0] = old.battle!.hands[0].slice(1);
  old.battle!.turns = 1;
  const restored = restoreAdventure(JSON.parse(JSON.stringify(old)))!;
  assert.equal(restored.battle!.boss, "kaos");
  assert.equal(restored.battle!.name, "Kaos · Throne of Chaos");
  assert.deepEqual(restored.battle!.board[0], old.battle!.board[0]);
  assert.equal(restored.battle!.turns, 1);
});
