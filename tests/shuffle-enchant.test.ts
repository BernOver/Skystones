import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_BOARD,
  STARTER_STONES,
  shufflePips,
  applyShuffles,
  placeStone,
  castSpell,
  validateKeywords,
  KEYWORD_RULES,
  validateStone,
  defenseEdges,
  score,
} from "../src/game.ts";
import type {
  Stone,
  StoneKeyword,
  Edges,
  Side,
  Board,
  Owner,
} from "../src/game.ts";
import { resolveDiscards, validateDiscardRecords } from "../src/discard.ts";
import { DEFAULT_TRAPS } from "../src/traps.ts";
import { scaleEffect, validRuntimeEffects } from "../src/amplify.ts";
import {
  newAdventure,
  enterAdventureNode,
  playAdventureCard,
  restoreAdventure,
  validateAdventure,
  adventureFusionPreview,
  adventureWorkshopOffer,
} from "../src/adventure.ts";
import { rotatedPotionStone } from "../src/potions.ts";
const make = (
  id: string,
  keywords: StoneKeyword[] = [],
  edges: Edges = [1, 1, 1, 1],
): Stone => ({
  ...STARTER_STONES[0],
  id: `custom-${id}`,
  name: id,
  element: "magic",
  edges,
  keywords,
});
const spell = (keywords: StoneKeyword[]): Stone => ({
  ...make("enchanter", keywords, [0, 0, 0, 0]),
  spell: "cast",
  token: true,
  conjured: true,
});
const hands = (): [Stone[], Stone[]] => [
  [make("a"), make("b")],
  [make("c"), make("d")],
];
function castEnchant(
  board: Board,
  card: Stone,
  hand = hands(),
  choices: Parameters<typeof resolveDiscards>[4] = [],
  automatic = true,
) {
  const move = castSpell(board, card, 0);
  return resolveDiscards(
    move.board,
    move.sourceIndex!,
    hand,
    19,
    choices,
    automatic,
  );
}

test("Shuffle conserves every selected value, unselected sides and total across every side subset, seeds, and large buffs", () => {
  for (const edges of [
    [0, 1, 4, 5],
    [99, 7, 0, 42],
    [0, 0, 0, 0],
  ] as Edges[])
    for (let mask = 0; mask < 16; mask++) {
      const sides = ([0, 1, 2, 3] as Side[]).filter(
        (side) => mask & (1 << side),
      );
      if (sides.length < 2) continue;
      for (let seed = 0; seed < 100; seed++) {
        const before = [...edges];
        const after = shufflePips(edges, seed, sides);
        assert.deepEqual(
          [...after].sort((a, b) => a - b),
          [...before].sort((a, b) => a - b),
        );
        assert.equal(
          after.reduce((a, b) => a + b),
          edges.reduce((a, b) => a + b),
        );
        for (const side of [0, 1, 2, 3])
          if (!sides.includes(side as Side))
            assert.equal(after[side], edges[side]);
        assert.deepEqual(edges, before);
        assert.deepEqual(after, shufflePips(edges, seed, [...sides].reverse()));
      }
    }
  assert.ok(
    new Set(
      Array.from({ length: 100 }, (_, seed) =>
        shufflePips([0, 1, 2, 3], seed, [0, 1, 2, 3]).join(),
      ),
    ).size > 12,
  );
});
test("Shuffle validates two to four distinct printed sides and works inside all grant types and runtime effects", () => {
  for (const sides of [
    undefined,
    [],
    [0],
    [0, 0],
    [-1, 0],
    [0, 4],
    [0, 1.5],
    ["0", 1],
  ])
    assert.equal(validateKeywords([{ type: "shuffle", sides }]), false);
  const grant: StoneKeyword = { type: "shuffle", sides: [0, 2] };
  assert.ok(validateStone(make("shuffle", [grant])));
  for (const keyword of [
    grant,
    { type: "combo", keywords: [grant] },
    {
      type: "next-play",
      side: 0,
      amount: 0,
      recipient: "self",
      keywords: [grant],
    },
    {
      type: "conjure",
      mode: "random",
      count: 1,
      recipient: "self",
      keywords: [grant],
    },
    { type: "enchant", target: "hand", keywords: [grant] },
  ] as StoneKeyword[])
    assert.ok(validateKeywords([keyword]));
  assert.ok(validRuntimeEffects(scaleEffect(grant, 2)));
  assert.equal(validateKeywords([grant, grant]), false);
  assert.ok(
    validateKeywords([
      { ...grant, half: "top" },
      { ...grant, half: "bottom" },
    ]),
  );
});
for (const size of [3, 4] as const)
  for (const owner of [0, 1] as const)
    test(`${size}×${size}, player ${owner}: Shuffle happens before captures and locks its result`, () => {
      const keyword: StoneKeyword = { type: "shuffle", sides: [0, 1] },
        edges: Edges = [4, 0, 1, 0];
      const seed = Array.from({ length: 100 }, (_, n) => n).find(
        (n) => applyShuffles(edges, [keyword], n).edges[1] === 4,
      )!;
      const board = placeStone(
        EMPTY_BOARD(size),
        1,
        make("enemy", [], [0, 0, 0, 2]),
        (1 - owner) as Owner,
      ).board;
      const move = placeStone(
        board,
        0,
        make("shuffle", [keyword], edges),
        owner,
        [],
        { seed },
      );
      assert.deepEqual(move.captured, [1]);
      assert.equal(move.board[1]?.owner, owner);
      assert.deepEqual(move.board[0]?.edges, [0, 4, 1, 0]);
      assert.equal(move.board[0]?.shuffles?.length, 1);
      assert.deepEqual(
        placeStone(board, 0, make("shuffle", [keyword], edges), owner, [], {
          seed,
        }),
        move,
      );
    });
test("Shuffle keeps resolved Next Play buffs, runs after Dizzy, honors nullification and doubles as two conserved shuffles", () => {
  const keyword: StoneKeyword = { type: "shuffle", sides: [0, 1, 2, 3] };
  const queued = placeStone(
    EMPTY_BOARD(),
    8,
    make("tutor", [
      { type: "next-play", side: 0, amount: 5, recipient: "self" },
    ]),
    0,
  ).board;
  const buffed = placeStone(
    queued,
    0,
    make("buffed", [keyword], [5, 0, 1, 2]),
    0,
    [],
    { seed: 4 },
  ).board[0]!;
  assert.equal(
    buffed.edges?.reduce((a, b) => a + b),
    13,
  );
  assert.ok(buffed.edges?.includes(10));
  const dizzy = placeStone(
    EMPTY_BOARD(),
    0,
    make("both", [keyword, { type: "dizzy", sides: [0] }]),
    0,
    [],
    { seed: 4 },
  ).board[0]!;
  assert.deepEqual(dizzy.shuffles?.[0].before, dizzy.dizzy?.after);
  const trap = {
    ...DEFAULT_TRAPS[0],
    affects: {},
    effects: [{ kind: "nullify" as const, effect: "shuffle" as const }],
  };
  const nullified = placeStone(
    EMPTY_BOARD(),
    0,
    make("still", [{ type: "trap", trap }, keyword]),
    0,
  ).board[0]!;
  assert.equal(nullified.shuffles, undefined);
  const doubled = placeStone(
    EMPTY_BOARD(),
    0,
    make(
      "double",
      [{ type: "amplify", effect: "shuffle", duration: "always" }, keyword],
      [4, 0, 1, 0],
    ),
    0,
  ).board[0]!;
  assert.equal(doubled.shuffles?.length, 2);
  for (const roll of doubled.shuffles!)
    assert.equal(
      roll.before.reduce((a, b) => a + b),
      roll.after.reduce((a, b) => a + b),
    );
});
test("Shuffle sides rotate and merge through existing card workshop mechanics", () => {
  const card = make("rotating", [{ type: "shuffle", sides: [0, 3] }]);
  assert.deepEqual(rotatedPotionStone(card).keywords, [
    { type: "shuffle", sides: [1, 0] },
  ]);
  const fused = adventureFusionPreview(
    card,
    make("donor", [{ type: "shuffle", sides: [1, 2] }]),
  );
  assert.deepEqual(fused.keywords?.[0], {
    type: "shuffle",
    sides: [0, 1, 2, 3],
  });
});
test("Enchant chooses a hand recipient transactionally, grants any supported keyword, and never discards it", () => {
  const grant: StoneKeyword = {
    type: "enchant",
    target: "hand",
    mode: "chosen",
    count: 1,
    keywords: [
      { type: "shield", side: 0, amount: 2 },
      { type: "comeback", side: 1, amount: 3 },
    ],
  };
  const hand = hands(),
    card = spell([grant]);
  const pending = castEnchant(EMPTY_BOARD(), card, hand, [], false);
  assert.equal(pending.pending?.gift?.kind, "enchant");
  assert.deepEqual(hand, hands());
  const option = pending.pending!.gift!.options[0];
  const result = castEnchant(
    EMPTY_BOARD(),
    card,
    hand,
    [
      {
        giftId: pending.pending!.gift!.id,
        keywordIndex: 0,
        owner: 0,
        cardIds: [option.id],
      },
    ],
    false,
  );
  assert.equal(result.hands[0].length, 2);
  assert.equal(result.records[0].cards.length, 0);
  assert.equal(result.records[0].enchant, true);
  assert.ok(validateDiscardRecords(result.records));
  assert.deepEqual(result.hands[0][0].keywords, grant.keywords);
  assert.deepEqual(result.hands[0][1].keywords, []);
  const losing = placeStone(
    placeStone(result.board, 8, make("enemy"), 1).board,
    7,
    make("enemy2"),
    1,
  ).board;
  const played = placeStone(losing, 0, result.hands[0][0], 0).board[0]!;
  assert.equal(played.edges?.[1], 4);
  assert.equal(played.shields?.[0], 2);
});
test("Enchant activates Shield, Comeback and Resonance on board recipients once without replaying placement or captures", () => {
  let board = placeStone(EMPTY_BOARD(), 0, make("recipient"), 0).board;
  for (const i of [4, 7, 8])
    board = placeStone(board, i, make(`enemy${i}`), 1).board;
  const original = structuredClone(board);
  const card = spell([
    {
      type: "enchant",
      target: "allies",
      keywords: [
        { type: "shield", side: 0, amount: 2 },
        { type: "comeback", side: 1, amount: 3 },
        { type: "resonance", side: 2, element: "magic" },
      ],
    },
  ]);
  const result = castEnchant(board, card);
  assert.deepEqual(result.board[0]?.edges, [1, 4, 5, 1]);
  assert.equal(defenseEdges(result.board[0]!)[0], 3);
  assert.deepEqual(score(result.board), [1, 3]);
  assert.deepEqual(board, original);
  const replay = resolveDiscards(
    result.board,
    -result.board.spellHistory![0].playedOrder!,
    result.hands,
    19,
  );
  assert.deepEqual(replay.board, result.board);
  assert.ok(validateDiscardRecords(result.records));
});
test("Enchant respects random/all recipients, opponents, keyword limits, Amplify and Trap nullification", () => {
  const all = spell([
    {
      type: "enchant",
      target: "hands",
      mode: "all",
      keywords: [{ type: "head-start", side: 2 }],
    },
  ]);
  const result = castEnchant(EMPTY_BOARD(), all);
  assert.ok(
    result.hands.flat().every((s) => s.keywords?.[0].type === "head-start"),
  );
  const random = spell([
    {
      type: "enchant",
      target: "enemy-hand",
      mode: "random",
      count: 1,
      keywords: [{ type: "shield", side: 0 }],
    },
  ]);
  const first = castEnchant(EMPTY_BOARD(), random);
  assert.equal(first.hands[1].filter((s) => s.keywords?.length).length, 1);
  assert.deepEqual(castEnchant(EMPTY_BOARD(), random), first);
  const trap = {
    ...DEFAULT_TRAPS[0],
    affects: {},
    effects: [{ kind: "nullify" as const, effect: "enchant" as const }],
  };
  const blocked = castEnchant(
    placeStone(EMPTY_BOARD(), 0, make("trap", [{ type: "trap", trap }]), 1)
      .board,
    all,
  );
  assert.deepEqual(blocked.hands, hands());
  assert.ok(
    validateKeywords([
      { type: "amplify", effect: "enchant", duration: "next", count: 1 },
    ]),
  );
  const doubled = castEnchant(
    EMPTY_BOARD(),
    spell([
      { type: "amplify", effect: "enchant", duration: "always" },
      {
        type: "enchant",
        target: "hand",
        keywords: [{ type: "shield", side: 0, amount: 3 }],
      },
    ]),
  );
  assert.deepEqual(doubled.hands[0][0].keywords, [
    { type: "shield", side: 0, amount: 6 },
  ]);
  assert.ok(validateStone(doubled.hands[0][0]));
  const full = make(
    "full",
    Array.from({ length: 24 }, () => ({ type: "sunder", side: "any" })),
  );
  const limited = castEnchant(EMPTY_BOARD(), all, [[full], []]);
  assert.equal(limited.hands[0][0].keywords?.length, 24);
});
for (const size of [3, 4] as const)
  test(`${size}×${size} Adventure saves shuffled edges and enchanted board keywords without rerolling`, () => {
    let run = enterAdventureNode(newAdventure(size, 81), "moss");
    const card = make(
      "shuffler",
      [{ type: "shuffle", sides: [0, 1] }],
      [4, 0, 1, 0],
    );
    const enchant = spell([
      {
        type: "enchant",
        target: "allies",
        keywords: [{ type: "shield", side: 3 }],
      },
    ]);
    run = {
      ...run,
      battle: {
        ...run.battle!,
        hands: [[card, enchant, ...run.battle!.hands[0]], run.battle!.hands[1]],
      },
    };
    run = playAdventureCard(run, 0, 0);
    run = { ...run, battle: { ...run.battle!, current: 0 } };
    run = playAdventureCard(run, -1, 0);
    assert.ok(validateAdventure(run));
    const restored = restoreAdventure(JSON.parse(JSON.stringify(run)))!;
    assert.ok(restored);
    assert.deepEqual(
      restored.battle!.board[0]?.shuffles,
      run.battle!.board[0]?.shuffles,
    );
    assert.deepEqual(
      restored.battle!.board[0]?.edges,
      run.battle!.board[0]?.edges,
    );
    assert.equal(restored.battle!.board[0]?.shields?.[3], 1);
    const invalid = JSON.parse(JSON.stringify(run));
    invalid.battle.board[0].shuffles[0].after[0]++;
    assert.equal(validateAdventure(invalid), false);
  });

test("Enchant can grant every available keyword to either a hand or board card without replaying its placement", () => {
  const examples = new Map<string, StoneKeyword>();
  for (let seed = 0; seed < 300; seed++) {
    const keyword = adventureWorkshopOffer({ seed, floor: 2 }).keyword;
    examples.set(keyword.type, keyword);
  }
  assert.equal(examples.size, Object.keys(KEYWORD_RULES).length);
  for (const keyword of examples.values())
    for (const target of ["hand", "allies"] as const) {
      const board = placeStone(EMPTY_BOARD(), 0, make("recipient"), 0).board;
      const card = spell([
        { type: "enchant", target, mode: "all", keywords: [keyword] },
      ]);
      assert.ok(validateKeywords(card.keywords));
      const result = castEnchant(board, card);
      const received =
        target === "hand" ? result.hands[0][0] : result.board[0]!.stone;
      assert.deepEqual(received.keywords, [keyword], keyword.type);
      assert.equal(result.board.filter(Boolean).length, 1);
      assert.equal(result.hands[0].length, 2);
    }
});
