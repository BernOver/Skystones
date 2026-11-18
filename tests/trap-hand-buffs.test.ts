import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_TRAPS, validTrap, withTrap } from "../src/traps.ts";
import type { TrapGrantEffect } from "../src/traps.ts";
import {
  EMPTY_BOARD,
  STARTER_STONES,
  placeStone,
  defenseEdges,
} from "../src/game.ts";
import type { Stone } from "../src/game.ts";
import {
  postPlayTrapGrants,
  beginTurn,
  resolveTrapGrants,
} from "../src/turns.ts";
import {
  newAdventure,
  enterAdventureNode,
  playAdventureCard,
  restoreAdventure,
  validateAdventure,
} from "../src/adventure.ts";
const make = (id: string): Stone => ({
  ...STARTER_STONES[0],
  id: `custom-${id}`,
  name: id,
  custom: true,
  element: "magic",
  edges: [1, 1, 1, 1],
  keywords: [],
});
const crystal = (effect: TrapGrantEffect) => ({
  ...DEFAULT_TRAPS[0],
  id: "trap-custom-hand",
  affects: {},
  effects: [effect],
});
const hand = (): [Stone[], Stone[]] => [
  [make("a"), { ...make("b"), element: "fire" }],
  [make("c"), { ...make("d"), element: "fire" }],
];
const effect: TrapGrantEffect = {
  kind: "grant",
  target: "hand",
  timing: "placed",
  pips: [{ side: 0, amount: 2 }],
  shields: [{ side: 1, amount: 1 }],
};
test("Trap hand buffs accept stats alone or with fixed/random keywords and reject empty or malformed changes", () => {
  assert.ok(validTrap(crystal(effect)));
  assert.ok(
    validTrap(
      crystal({
        ...effect,
        keywords: [{ type: "environment-immunity" }],
        randomKeywords: { count: 1 },
      }),
    ),
  );
  assert.ok(validTrap(crystal({ ...effect, pips: [{ side: 0, amount: -2 }] })));
  for (const e of [
    { ...effect, pips: undefined, shields: undefined },
    { ...effect, pips: [{ side: 0, amount: 0 }] },
    { ...effect, shields: [{ side: 1, amount: -1 }] },
    { ...effect, pips: [{ side: 4, amount: 1 }] },
  ])
    assert.equal(validTrap(crystal(e as TrapGrantEffect)), false);
});
test("placed Traps buff both matching hands and grant abilities; the buffs stay after replacement and on play", () => {
  const trap = crystal({
    ...effect,
    condition: { element: "magic" },
    keywords: [{ type: "environment-immunity" }],
    randomKeywords: { count: 1, pool: ["shield"] },
  });
  const hands = hand(),
    original = structuredClone(hands),
    before = EMPTY_BOARD();
  const board = placeStone(
    before,
    0,
    { ...make("caster"), keywords: [{ type: "trap", trap }] },
    0,
  ).board;
  const result = postPlayTrapGrants(board, hands, before, hands, 0, 81);
  for (const owner of [0, 1] as const) {
    assert.deepEqual(result.hands[owner][0].discardBuffs, {
      pips: [2, 0, 0, 0],
      shields: [0, 1, 0, 0],
    });
    assert.ok(
      result.hands[owner][0].keywords?.some(
        (k) => k.type === "environment-immunity",
      ),
    );
    assert.ok(
      result.hands[owner][0].keywords?.some((k) => k.type === "shield"),
    );
    assert.deepEqual(result.hands[owner][1], hands[owner][1]);
  }
  const played = placeStone(
    withTrap(result.board, undefined),
    8,
    result.hands[0][0],
    0,
  ).board[8]!;
  assert.deepEqual(played.edges, [3, 1, 1, 1]);
  assert.ok(defenseEdges(played)[1] >= 2);
  assert.deepEqual(hands, original);
});
test("entry buffs apply only to newly entered hand cards", () => {
  const trap = crystal({ ...effect, timing: "enter" }),
    before = hand();
  const board = placeStone(
    EMPTY_BOARD(),
    0,
    { ...make("caster"), keywords: [{ type: "trap", trap }] },
    0,
  ).board;
  const entered: [Stone[], Stone[]] = [
    [...before[0], make("new-a")],
    [...before[1], make("new-b")],
  ];
  const result = resolveTrapGrants(board, entered, 81, {
    timing: "enter",
    previousHands: before,
  });
  assert.equal(result.hands[0][0].discardBuffs, undefined);
  assert.equal(result.hands[1][0].discardBuffs, undefined);
  assert.deepEqual(result.hands[0].at(-1)!.discardBuffs?.pips, [2, 0, 0, 0]);
  assert.deepEqual(result.hands[1].at(-1)!.discardBuffs?.pips, [2, 0, 0, 0]);
});
test("turn-start hand buffs target the active player's cards once per actual turn and retain the saved turn marker", () => {
  const trap = crystal({
    ...effect,
    timing: "turn-start",
    recipients: "active",
  });
  const board = placeStone(
    EMPTY_BOARD(),
    0,
    { ...make("caster"), keywords: [{ type: "trap", trap }] },
    0,
  ).board;
  const first = beginTurn(board, hand(), 0, 1, 81);
  assert.deepEqual(first.hands[0][0].discardBuffs?.pips, [2, 0, 0, 0]);
  assert.equal(first.hands[1][0].discardBuffs, undefined);
  const same = beginTurn(
    first.board,
    first.hands,
    0,
    1,
    81,
    JSON.parse(JSON.stringify(first.state)),
  );
  assert.deepEqual(same.hands, first.hands);
  const enemy = beginTurn(first.board, first.hands, 1, 2, 81, first.state);
  assert.deepEqual(enemy.hands[1][0].discardBuffs?.pips, [2, 0, 0, 0]);
});
for (const size of [3, 4] as const)
  test(`${size}×${size} Adventure saves Trap hand stats and keywords, and retains both when played`, () => {
    const trap = crystal({
      ...effect,
      keywords: [{ type: "environment-immunity" }],
    });
    let run = enterAdventureNode(newAdventure(size, 81), "moss");
    run = {
      ...run,
      battle: {
        ...run.battle!,
        hands: [
          [
            { ...make("caster"), keywords: [{ type: "trap", trap }] },
            make("recipient"),
            ...run.battle!.hands[0],
          ],
          run.battle!.hands[1],
        ],
      },
    };
    run = playAdventureCard(run, 0, 0);
    assert.ok(
      run
        .battle!.hands.flat()
        .every((card) => card.discardBuffs?.pips[0] === 2),
    );
    assert.ok(validateAdventure(run));
    const restored = restoreAdventure(JSON.parse(JSON.stringify(run)))!;
    assert.ok(restored);
    assert.deepEqual(
      restored.battle!.hands,
      JSON.parse(JSON.stringify(run.battle!.hands)),
    );
    const played = placeStone(
      restored.battle!.board,
      size * size - 1,
      restored.battle!.hands[0][0],
      0,
    ).board.at(-1)!;
    assert.deepEqual(played.edges, [3, 1, 1, 1]);
    assert.equal(played.shields?.[1], 1);
    assert.ok(
      played.stone.keywords?.some((k) => k.type === "environment-immunity"),
    );
  });
