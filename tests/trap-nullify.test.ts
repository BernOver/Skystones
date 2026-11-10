import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_BOARD,
  STARTER_STONES,
  placeStone,
  chooseKeywordTargets,
  evaluateKeywords,
  placedKeywords,
  cardEdges,
  attackEdges,
  defenseEdges,
  validateKeywords,
} from "../src/game.ts";
import type { Board, Stone, StoneKeyword, Owner, Edges } from "../src/game.ts";
import {
  validTrap,
  withTrap,
  trapBoardMultiplier,
  trapCombatBonuses,
  trapUnderlyingSide,
  trapText,
  TRAP_BOARD_TARGETS,
} from "../src/traps.ts";
import type { Trap, TrapEffect } from "../src/traps.ts";
import { pendingAmplify, validRuntimeEffects } from "../src/amplify.ts";
import { applyConjure, CONJURE_CARDS } from "../src/conjure.ts";
import { assembleParts } from "../src/assemble.ts";
import { resolveDiscards } from "../src/discard.ts";
import {
  newAdventure,
  enterAdventureNode,
  playAdventureCard,
  restoreAdventure,
  validateAdventure,
} from "../src/adventure.ts";
const image =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aDrsAAAAASUVORK5CYII=";
const trap = (...effects: TrapEffect[]): Trap => ({
  id: "trap-nullify",
  name: "Null crystal",
  element: "magic",
  description: "Test",
  effects,
});
const card = (
  id: string,
  keywords: StoneKeyword[] = [],
  edges: Edges = [1, 1, 1, 1],
): Stone => ({
  ...STARTER_STONES[0],
  id: `custom-${id}`,
  name: id,
  element: "fire",
  edges,
  keywords,
});
const cast = (board: Board, index: number, stone: Stone, owner: Owner = 0) =>
  placeStone(
    board,
    index,
    stone,
    owner,
    chooseKeywordTargets(board, index, stone, owner),
  );
const hand = (n = 6) => Array.from({ length: n }, (_, i) => card(`hand${i}`));
const conjure: StoneKeyword = {
  type: "conjure",
  mode: "specific",
  card: "spyro",
  count: 1,
  recipient: "self",
};
const discard: StoneKeyword = {
  type: "discard",
  mode: "random",
  recipient: "self",
  count: 1,
};
const field = (crystal: Trap) =>
  withTrap(cast(EMPTY_BOARD(), 0, card("anchor")).board, crystal);

test("Trap validation accepts battlefield targets, nullification, and portable images, and rejects invalid images", () => {
  for (const effect of TRAP_BOARD_TARGETS)
    for (const kind of ["amplify", "nullify"] as const)
      assert.ok(validTrap(trap({ kind, effect })));
  for (const effect of ["all", "flash", "amplify", "conjure"] as const)
    assert.ok(validTrap(trap({ kind: "nullify", effect })));
  assert.ok(
    validTrap({ ...trap({ kind: "nullify", effect: "conjure" }), image }),
  );
  assert.ok(
    validateKeywords([
      {
        type: "trap",
        trap: { ...trap({ kind: "nullify", effect: "terrain" }), image },
      },
    ]),
  );
  for (const wrong of [
    "https://example.com/picture.png",
    "data:image/svg+xml;base64,AAAA",
    "data:image/png;base64,not a png",
    5,
  ])
    assert.equal(
      validTrap({ ...trap({ kind: "mirror" }), image: wrong }),
      false,
    );
  assert.equal(
    validTrap({ ...trap(), effects: [{ kind: "nullify", effect: "trap" }] }),
    false,
  );
});
test("nullification overrides any number of doubling entries in either order and respects combined filters", () => {
  for (const effects of [
    [
      { kind: "amplify", effect: "conjure" },
      { kind: "nullify", effect: "conjure" },
    ],
    [
      { kind: "nullify", effect: "conjure" },
      { kind: "amplify", effect: "conjure" },
    ],
  ] as TrapEffect[][]) {
    const crystal = {
      ...trap(...effects),
      affects: { element: "fire" as const, tribe: "giants" },
    };
    for (const owner of [0, 1] as const) {
      const source = { ...card("caster", [conjure]), tribes: ["giants"] };
      const board = cast(field(crystal), 8, source, owner).board;
      assert.equal(
        applyConjure(board, 8, [[], []], CONJURE_CARDS, 1).hands[owner].length,
        0,
      );
      const plain = cast(
        field(crystal),
        8,
        card("plain", [conjure]),
        owner,
      ).board;
      assert.equal(
        applyConjure(plain, 8, [[], []], CONJURE_CARDS, 1).hands[owner].length,
        1,
      );
    }
  }
});
test("nullified on-play effects are locked as resolved; replacing the field permits new plays", () => {
  let board = field(trap({ kind: "nullify", effect: "conjure" }));
  board = cast(board, 8, card("blocked", [conjure])).board;
  assert.deepEqual(board[8]!.resolvedEffects, []);
  board = withTrap(board);
  assert.equal(
    applyConjure(board, 8, [[], []], CONJURE_CARDS, 1).hands[0].length,
    0,
  );
  board = cast(board, 4, card("new", [conjure])).board;
  assert.equal(
    applyConjure(board, 4, [[], []], CONJURE_CARDS, 1).hands[0].length,
    1,
  );
});
test("nullified effects leave next-use Amplify charges ready for a later eligible play", () => {
  let board = cast(
    EMPTY_BOARD(),
    0,
    card("queue", [
      { type: "amplify", effect: "conjure", duration: "next", count: 1 },
    ]),
  ).board;
  board = withTrap(board, trap({ kind: "nullify", effect: "conjure" }));
  board = cast(board, 8, card("blocked", [conjure])).board;
  assert.equal(pendingAmplify(board, 0)[0].count, 1);
  board = withTrap(board);
  board = cast(board, 4, card("later", [conjure])).board;
  assert.equal(
    placedKeywords(board[4]!).find((k) => k.type === "conjure")!.count,
    2,
  );
  assert.deepEqual(pendingAmplify(board, 0), []);
});
test("nullifying Amplify prevents printed and queued doubling without spending waiting charges", () => {
  let board = cast(
    EMPTY_BOARD(),
    0,
    card("queue", [
      { type: "amplify", effect: "conjure", duration: "next", count: 1 },
    ]),
  ).board;
  board = withTrap(board, trap({ kind: "nullify", effect: "amplify" }));
  board = cast(
    board,
    8,
    card("caster", [
      conjure,
      { type: "amplify", effect: "conjure", duration: "always" },
      { type: "amplify", effect: "shield", duration: "next", count: 2 },
    ]),
  ).board;
  assert.equal(
    placedKeywords(board[8]!).find((k) => k.type === "conjure")!.count,
    1,
  );
  assert.equal(pendingAmplify(board, 0).length, 1);
  assert.equal(pendingAmplify(board, 0)[0].count, 1);
});
test("nullify All prevents Flash, Assemble, discard, Combo gifts and conditional pips while keeping Trap replacement available", () => {
  const source = card("all", [
    { type: "trap", trap: trap({ kind: "nullify", effect: "all" }) },
    { type: "flash" },
    { type: "assemble", count: 2 },
    discard,
    { type: "head-start", side: 0, amount: 2 },
    { type: "combo", pips: [{ side: 1, amount: 3 }], keywords: [conjure] },
    { type: "amplify", effect: "shield", duration: "next", count: 1 },
  ]);
  const result = cast(
    field(trap({ kind: "pips", side: 0, amount: 1 })),
    8,
    source,
  );
  assert.equal(result.keepsTurn, undefined);
  assert.deepEqual(result.board[8]!.edges, [1, 1, 1, 1]);
  assert.equal(result.board[8]!.placedTrap!.effects[0].kind, "nullify");
  assert.deepEqual(pendingAmplify(result.board, 0), []);
  assert.equal(assembleParts(result.board, 8, [[], []], 1).hands[0].length, 0);
  const hands: [Stone[], Stone[]] = [hand(), hand()];
  assert.deepEqual(resolveDiscards(result.board, 8, hands, 1).hands, hands);
  const replacement = cast(
    result.board,
    4,
    card("replace", [
      {
        type: "combo",
        keywords: [{ type: "trap", trap: trap({ kind: "mirror" }) }, conjure],
      },
    ]),
  );
  assert.ok(replacement.board[4]!.placedTrap);
});
test("Shield nullification is live and reversible; unrelated potion and discard counters remain", () => {
  let board = cast(
    EMPTY_BOARD(),
    0,
    card("guard", [{ type: "shield", side: 0, amount: 2 }]),
  ).board;
  board[0] = { ...board[0]!, shields: [5, 0, 0, 0] };
  board = withTrap(board, trap({ kind: "nullify", effect: "shield" }));
  assert.deepEqual(defenseEdges(board[0]!), [4, 1, 1, 1]);
  assert.deepEqual(defenseEdges(withTrap(board)[0]!), [6, 1, 1, 1]);
  const newlyPlayed = cast(
    board,
    8,
    card("newguard", [{ type: "shield", side: 0, amount: 2 }]),
  ).board;
  assert.equal(defenseEdges(newlyPlayed[8]!)[0], 1);
  assert.equal(defenseEdges(withTrap(newlyPlayed)[8]!)[0], 3);
});
test("nullifying Scavenge and Parting Gift prevents discard rewards without canceling the discard", () => {
  const source = card("caster", [
    discard,
    { type: "scavenge", from: "self", pips: [{ side: 0, amount: 2 }] },
  ]);
  const gift = card("gift", [
    { type: "discard-priority", priority: 5 },
    {
      type: "parting-gift",
      target: "discarder",
      shields: [{ side: 1, amount: 2 }],
    },
  ]);
  const board = withTrap(
    cast(EMPTY_BOARD(), 0, source).board,
    trap(
      { kind: "nullify", effect: "scavenge" },
      { kind: "nullify", effect: "parting-gift" },
    ),
  );
  const result = resolveDiscards(board, 0, [[gift, ...hand()], hand()], 1);
  assert.equal(result.records[0].cards[0].id, gift.id);
  assert.deepEqual(result.records[0].buffs, []);
  assert.deepEqual(result.board[0]!.edges, [1, 1, 1, 1]);
  assert.deepEqual(result.board[0]!.shields, [0, 0, 0, 0]);
});
test("an incoming Trap nullifies Sunder and Dizzy before their target prompts and random rolls", () => {
  const crystal = trap(
    { kind: "nullify", effect: "sunder" },
    { kind: "nullify", effect: "dizzy" },
  );
  const board = cast(
    EMPTY_BOARD(),
    0,
    card("target", [], [5, 5, 5, 5]),
    1,
  ).board;
  const source = card(
    "caster",
    [
      { type: "trap", trap: crystal },
      { type: "sunder", side: "any", amount: 5 },
      { type: "dizzy", sides: [0] },
    ],
    [1, 2, 3, 4],
  );
  assert.deepEqual(chooseKeywordTargets(board, 8, source, 0), []);
  const result = cast(board, 8, source).board;
  assert.deepEqual(result[8]!.edges, [1, 2, 3, 4]);
  assert.equal(result[8]!.dizzy, undefined);
  assert.deepEqual(result[0]!.edges, [5, 5, 5, 5]);
});
test("live attack and defense modifiers double or nullify while ordinary pips stay separate", () => {
  const stone = card("guard");
  const shield: Edges = [1, 2, 0, 0];
  const base = trap(
    { kind: "attack", side: 0, amount: 2 },
    { kind: "defense", side: 1, amount: 1 },
  );
  const doubled = {
    ...base,
    effects: [
      ...base.effects,
      { kind: "amplify", effect: "attack-bonus" },
      { kind: "amplify", effect: "defense-bonus" },
    ] as TrapEffect[],
  };
  assert.deepEqual(
    trapCombatBonuses(stone, shield, doubled, {
      kind: "war-banner",
      amount: 1,
    }),
    { attack: [6, 2, 2, 2], defense: [2, 6, 0, 0] },
  );
  const nullified = {
    ...doubled,
    effects: [
      ...doubled.effects,
      { kind: "nullify", effect: "attack-bonus" },
      { kind: "nullify", effect: "defense-bonus" },
    ] as TrapEffect[],
  };
  assert.deepEqual(
    trapCombatBonuses(stone, shield, nullified, {
      kind: "war-banner",
      amount: 1,
    }),
    { attack: [0, 0, 0, 0], defense: [0, 0, 0, 0] },
  );
  const board = withTrap(cast(EMPTY_BOARD(), 0, stone).board, nullified);
  assert.deepEqual(attackEdges(board[0]!), [1, 1, 1, 1]);
});
test("tile effects can double or vanish live, including directional rotation and damage mapping", () => {
  const stone = card("target", [], [1, 2, 3, 4]);
  const base = {
    stone,
    owner: 0 as const,
    edges: stone.edges,
    environment: { kind: "crosswind" as const },
  };
  const doubled = trap({ kind: "amplify", effect: "terrain" });
  assert.deepEqual(cardEdges({ ...base, trap: doubled }), [3, 4, 1, 2]);
  assert.equal(trapUnderlyingSide(base.environment, 0, stone, doubled), 2);
  const nullified = trap({ kind: "nullify", effect: "terrain" });
  assert.deepEqual(cardEdges({ ...base, trap: nullified }), stone.edges);
  assert.equal(trapUnderlyingSide(base.environment, 0, stone, nullified), 0);
  const board: Board = EMPTY_BOARD();
  board[0] = { ...base, trap: doubled };
  const result = cast(
    board,
    8,
    card("sunder", [
      { type: "trap", trap: nullified },
      { type: "sunder", side: 0, amount: 1 },
    ]),
  );
  assert.deepEqual(result.board[0]!.edges, [0, 2, 3, 4]);
  assert.deepEqual(
    cardEdges({
      ...base,
      environment: { kind: "elemental", element: "fire", side: 1, amount: 2 },
      trap: doubled,
    }),
    [1, 6, 3, 4],
  );
  assert.deepEqual(
    cardEdges({
      ...base,
      environment: { kind: "blight", side: 3, amount: 1 },
      trap: doubled,
    }),
    [1, 2, 3, 2],
  );
  assert.deepEqual(
    cardEdges({
      ...base,
      environment: { kind: "blight", side: 3, amount: 1 },
      trap: nullified,
    }),
    stone.edges,
  );
});
test("arena modifiers double or nullify for matching cards and are reflected in the final capture strengths", () => {
  const stone = card("fire");
  const cell = {
    stone,
    owner: 0 as const,
    edges: stone.edges,
    arenaElement: "fire" as const,
  };
  assert.deepEqual(
    cardEdges({ ...cell, trap: trap({ kind: "amplify", effect: "arena" }) }),
    [3, 3, 3, 3],
  );
  assert.deepEqual(
    cardEdges({ ...cell, trap: trap({ kind: "nullify", effect: "arena" }) }),
    [1, 1, 1, 1],
  );
  assert.equal(
    trapBoardMultiplier(
      trap({ kind: "nullify", effect: "arena" }),
      stone,
      "arena",
    ),
    0,
  );
});
for (const size of [3, 4] as const)
  test(`${size}×${size} Adventure preserves Trap images, nullified casts and live effect rules on reload`, () => {
    let run = enterAdventureNode(newAdventure(size, 81), "moss");
    const crystal = {
      ...trap(
        { kind: "nullify", effect: "conjure" },
        { kind: "amplify", effect: "terrain" },
        { kind: "nullify", effect: "arena" },
      ),
      image,
    };
    const source = {
      ...run.battle!.hands[0][0],
      keywords: [{ type: "trap", trap: crystal }, conjure] as StoneKeyword[],
    };
    run = {
      ...run,
      battle: {
        ...run.battle!,
        hands: [
          [source, ...run.battle!.hands[0].slice(1)],
          run.battle!.hands[1],
        ],
      },
    };
    run = playAdventureCard(run, 0, 0);
    assert.ok(validateAdventure(run));
    const restored = restoreAdventure(JSON.parse(JSON.stringify(run)))!;
    assert.ok(restored);
    assert.equal(restored.battle!.traps!.active!.trap.image, image);
    assert.ok(validRuntimeEffects(restored.battle!.board[0]!.resolvedEffects));
    assert.ok(
      !placedKeywords(restored.battle!.board[0]!).some(
        (k) => k.type === "conjure",
      ),
    );
    assert.match(trapText(crystal), /nullify conjure/);
  });

test("nullified Combo does not leak its always-on or next-use Amplify gifts into other keywords", () => {
  const board = field(trap({ kind: "nullify", effect: "combo" }));
  const source = card("combo-amp", [
    conjure,
    {
      type: "combo",
      keywords: [
        { type: "amplify", effect: "conjure", duration: "always" },
        { type: "amplify", effect: "conjure", duration: "next", count: 2 },
        conjure,
      ],
    },
  ]);
  const result = cast(board, 8, source).board;
  assert.deepEqual(
    placedKeywords(result[8]!)
      .filter((k) => k.type === "conjure")
      .map((k) => k.count),
    [1],
  );
  assert.deepEqual(pendingAmplify(result, 0), []);
});
