import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_BOARD,
  STARTER_STONES,
  validateKeywords,
  validateStone,
  placeStone,
  prepareTargeting,
  chooseKeywordTargets,
  evaluateKeywords,
} from "../src/game.ts";
import type { Stone, StoneKeyword, Side } from "../src/game.ts";
import {
  applyConjure,
  CONJURE_CARDS,
  conjureBuffText,
  validateConjure,
} from "../src/conjure.ts";
import type { ConjureKeyword } from "../src/conjure.ts";
import {
  DEFAULT_TOKENS,
  tokenDependencies,
  deckEligible,
} from "../src/tokens.ts";
import { pendingPipEffects } from "../src/effects.ts";
import { hasTribe } from "../src/tribes.ts";
import { rotatedPotionStone } from "../src/potions.ts";
import {
  newAdventure,
  enterAdventureNode,
  playAdventureCard,
  restoreAdventure,
  validateAdventure,
} from "../src/adventure.ts";

const summon = (buffs: Partial<ConjureKeyword> = {}): ConjureKeyword =>
  ({
    type: "conjure",
    mode: "specific",
    card: "spyro",
    count: 2,
    recipient: "self",
    ...buffs,
  }) as ConjureKeyword;
const caster = (keywords: StoneKeyword[]): Stone => ({
  ...STARTER_STONES[0],
  id: "custom-buff-caster",
  name: "Buff Caster",
  edges: [0, 0, 0, 0],
  keywords,
});
const allPips = (amount = 1) =>
  ([0, 1, 2, 3] as Side[]).map((side) => ({ side, amount }));
const cast = (
  keyword: ConjureKeyword,
  catalogue: readonly Stone[] = CONJURE_CARDS,
  tokens = DEFAULT_TOKENS,
) =>
  applyConjure(
    placeStone(EMPTY_BOARD(), 0, caster([keyword]), 0).board,
    0,
    [[], []],
    catalogue,
    81,
    tokens,
  );

test("Conjure accepts pip buffs, keyword buffs, and both in every source mode, rejecting malformed or excessively nested grants", () => {
  for (const base of [
    summon(),
    { ...summon(), mode: "random", card: undefined },
    {
      ...summon(),
      mode: "token",
      card: undefined,
      token: DEFAULT_TOKENS[0].id,
    },
  ]) {
    for (const buffs of [
      { pips: allPips(5) },
      { keywords: [{ type: "shield", side: 0 }] },
      {
        pips: allPips(),
        keywords: [{ type: "combo", pips: [{ side: 0, amount: 2 }] }],
      },
    ])
      assert.ok(validateKeywords([{ ...base, ...buffs }]));
  }
  for (const buffs of [
    { pips: [] },
    { pips: [{ side: 0, amount: 0 }] },
    { pips: [{ side: 0, amount: -1 }] },
    { pips: [{ side: 4, amount: 1 }] },
    { pips: [{ side: 0, amount: 6 }] },
    {
      pips: [
        { side: 0, amount: 1 },
        { side: 0, amount: 2 },
      ],
    },
    { pips: [null] },
    { keywords: [] },
    { keywords: Array(6).fill({ type: "silence" }) },
    { keywords: [{ type: "unknown" }] },
  ])
    assert.equal(
      validateKeywords([{ ...summon(), ...buffs }]),
      false,
      JSON.stringify(buffs),
    );
  let nested = summon({ keywords: [{ type: "shield", side: 0 }] });
  for (let i = 0; i < 4; i++) nested = summon({ keywords: [nested] });
  assert.equal(validateConjure(nested), false);
  assert.equal(validateKeywords([nested]), false);
  assert.equal(conjureBuffText(summon()), "");
  assert.match(
    conjureBuffText(
      summon({ pips: allPips(), keywords: [{ type: "shield", side: 0 }] }),
    ),
    /\+1 per side.*Gain Shield/,
  );
});

test("seeded random cards keep the same identities and filters while every recipient receives independent buffed copies", () => {
  const catalogue = structuredClone(CONJURE_CARDS),
    before = structuredClone(catalogue);
  const plain: ConjureKeyword = {
    type: "conjure",
    mode: "random",
    count: 5,
    recipient: "both",
    element: "fire",
    tribe: "giants",
  };
  const original = cast(plain, catalogue),
    buffed = cast(
      { ...plain, pips: allPips(2), keywords: [{ type: "sunder", side: 0 }] },
      catalogue,
    );
  for (const owner of [0, 1] as const) {
    assert.deepEqual(
      buffed.hands[owner].map((card) => card.id),
      original.hands[owner].map((card) => card.id),
    );
    buffed.hands[owner].forEach((card, i) => {
      assert.equal(card.element, "fire");
      assert.ok(hasTribe(card, "giants"));
      assert.deepEqual(
        card.edges,
        original.hands[owner][i].edges.map((n) => n + 2),
      );
      assert.equal(card.keywords!.at(-1)!.type, "sunder");
      assert.ok(validateStone(card));
      assert.equal(deckEligible(card), false);
    });
  }
  buffed.hands[0][0].edges[0] = 60;
  assert.notEqual(buffed.hands[1][0].edges[0], 60);
  assert.deepEqual(catalogue, before);
});

test("keyword-only buffs preserve existing unique keywords, allow repeated Sunder, and respect the card limit", () => {
  const spyro = CONJURE_CARDS.find((card) => card.portrait === "spyro")!;
  const base: Stone = {
    ...spyro,
    keywords: [
      { type: "shield", side: 0 },
      { type: "sunder", side: 1 },
    ],
  };
  const card = cast(
    summon({
      keywords: [
        { type: "shield", side: 0, amount: 5 },
        { type: "sunder", side: 1, amount: 2 },
        { type: "combo", pips: [{ side: 2, amount: 1 }] },
      ],
    }),
    [base],
  ).hands[0][0];
  assert.deepEqual(card.edges, base.edges);
  assert.deepEqual(card.keywords, [
    ...base.keywords!,
    { type: "sunder", side: 1, amount: 2 },
    { type: "combo", pips: [{ side: 2, amount: 1 }] },
  ]);
  const full = {
    ...spyro,
    keywords: Array.from({ length: 24 }, (): StoneKeyword => ({
      type: "sunder",
      side: 0,
    })),
  };
  assert.equal(
    cast(summon({ keywords: [{ type: "silence" }] }), [full]).hands[0][0]
      .keywords!.length,
    24,
  );
  const boosted = cast(summon({ pips: allPips(5) })).hands[0][0];
  assert.ok(boosted.edges.some((pip) => pip > 5));
  assert.ok(validateStone(boosted));
  assert.equal(validateStone({ ...boosted, conjured: undefined }), false);
});

test("buffed tokens keep template stats unchanged and wait until played to trigger granted Conjure", () => {
  const token = { ...DEFAULT_TOKENS[0], keywords: [] },
    before = structuredClone(token);
  const child = summon({
    mode: "token",
    card: undefined,
    token: DEFAULT_TOKENS[4].id,
    count: 1,
    pips: [{ side: 1, amount: 2 }],
  } as Partial<ConjureKeyword>);
  const keyword = summon({
    mode: "token",
    card: undefined,
    token: token.id,
    pips: [{ side: 0, amount: 3 }],
    keywords: [child],
  } as Partial<ConjureKeyword>);
  const result = cast(keyword, CONJURE_CARDS, [token, DEFAULT_TOKENS[4]]),
    copy = result.hands[0][0];
  assert.equal(copy.token, true);
  assert.equal(copy.edges[0], token.edges[0] + 3);
  assert.equal(result.hands[0].length, 2);
  assert.deepEqual(token, before);
  assert.deepEqual(
    tokenDependencies(caster([keyword]), [token, DEFAULT_TOKENS[4]]).map(
      (card) => card.id,
    ),
    [token.id, DEFAULT_TOKENS[4].id],
  );
  const board = placeStone(result.board, 4, copy, 0).board;
  const next = applyConjure(
    board,
    4,
    [result.hands[0].slice(1), []],
    CONJURE_CARDS,
    82,
  );
  assert.equal(next.hands[0].length, 2);
  assert.equal(next.hands[0][1].edges[1], DEFAULT_TOKENS[4].edges[1] + 2);
});

test("added Sunder and Shield resolve on the copy's play; numeric buffs survive Dizzy, damage and Silence correctly", () => {
  const spyro = CONJURE_CARDS.find((card) => card.portrait === "spyro")!;
  const base: Stone = { ...spyro, edges: [4, 1, 0, 2], keywords: [] };
  const result = cast(
      summon({
        count: 1,
        pips: [
          { side: 0, amount: 2 },
          { side: 2, amount: 3 },
        ],
        keywords: [
          { type: "dizzy", sides: [0] },
          { type: "shield", side: 1, amount: 2 },
          { type: "sunder", side: 0 },
        ],
      }),
      [base],
    ),
    copy = result.hands[0][0];
  let board = placeStone(
    result.board,
    7,
    { ...caster([]), edges: [3, 0, 0, 0] },
    1,
  ).board;
  const before = structuredClone(board);
  assert.ok(prepareTargeting(board, copy, [], 0, 4).pending);
  assert.deepEqual(board, before);
  const placed = placeStone(
    board,
    4,
    copy,
    0,
    [{ keywordIndex: 2, boardIndex: 7 }],
    { seed: 25 },
  );
  board = placed.board;
  assert.deepEqual(placed.captured, [7]);
  assert.equal(board[4]!.edges![2], 3);
  assert.deepEqual(board[4]!.shields, [0, 2, 0, 0]);
  assert.ok(board[4]!.edges![0] <= 5);
  board = placeStone(
    board,
    2,
    caster([{ type: "sunder", side: 2 }, { type: "silence" }]),
    1,
    [
      { keywordIndex: 0, boardIndex: 4 },
      { keywordIndex: 1, boardIndex: 4 },
    ],
  ).board;
  assert.deepEqual(board[4]!.edges, [6, 1, 2, 2]);
  assert.deepEqual(board[4]!.shields, [0, 0, 0, 0]);
  assert.equal(board[7]!.owner, 0);
  assert.deepEqual(base.edges, [4, 1, 0, 2]);
});

test("Combo and Next Play can grant buffed Conjure without triggering future keywords or spending a queue during generation", () => {
  const keyword = summon({
    pips: [{ side: 2, amount: 2 }],
    keywords: [{ type: "next-play", side: 0, amount: 1, recipient: "self" }],
  });
  for (const source of [
    caster([{ type: "combo", keywords: [keyword] }]),
    caster([
      {
        type: "next-play",
        side: 0,
        amount: 0,
        recipient: "self",
        keywords: [keyword],
      },
    ]),
  ]) {
    let board = placeStone(EMPTY_BOARD(), 0, caster([]), 0).board;
    board = placeStone(board, 1, source, 0).board;
    let index = 1;
    if (source.keywords![0].type === "next-play") {
      board = placeStone(board, 4, caster([]), 0).board;
      index = 4;
    }
    const result = applyConjure(board, index, [[], []], CONJURE_CARDS, 81);
    assert.equal(result.hands[0].length, 2);
    assert.equal(pendingPipEffects(result.board, 0).length, 0);
    const played = placeStone(result.board, 8, result.hands[0][0], 0).board;
    assert.equal(pendingPipEffects(played, 0).length, 1);
  }
});

test("Compass rotates Conjure pip buffs and recursive keyword gifts with the source card", () => {
  const rotated = rotatedPotionStone(
    caster([
      summon({
        pips: [{ side: 3, amount: 2 }],
        keywords: [
          { type: "shift", side: 0, direction: 1, affects: "both" },
          summon({
            pips: [{ side: 2, amount: 1 }],
            keywords: [{ type: "shield", side: 3 }],
          }),
        ],
      }),
    ]),
  );
  const keyword = rotated.keywords![0] as ConjureKeyword;
  assert.deepEqual(keyword.pips, [{ side: 0, amount: 2 }]);
  assert.deepEqual(keyword.keywords![0], {
    type: "shift",
    side: 1,
    direction: 2,
    affects: "both",
  });
  assert.deepEqual((keyword.keywords![1] as ConjureKeyword).pips, [
    { side: 3, amount: 1 },
  ]);
});

for (const size of [3, 4] as const)
  test(`${size}×${size} Adventure preserves buffed hand and board copies across reloads without changing the pack`, () => {
    let run = enterAdventureNode(newAdventure(size, 81), "moss");
    const source = {
      ...run.inventory[0],
      keywords: [
        summon({
          recipient: "both",
          pips: allPips(5),
          keywords: [{ type: "shield", side: 2, amount: 2 }],
        }),
      ],
    };
    run.inventory[0] = source;
    run.battle!.hands[0][0] = source;
    const inventory = structuredClone(run.inventory);
    run = playAdventureCard(run, 0, 0);
    assert.equal(
      run.battle!.hands[0].filter((card) => card.conjured).length,
      2,
    );
    assert.ok(validateAdventure(JSON.parse(JSON.stringify(run))));
    assert.deepEqual(
      restoreAdventure(JSON.parse(JSON.stringify(run)))!.battle,
      JSON.parse(JSON.stringify(run.battle)),
    );
    const keeperIndex = run.battle!.hands[1].findIndex((card) => card.conjured);
    run = playAdventureCard(
      run,
      size * size - 1,
      keeperIndex,
      chooseKeywordTargets(
        run.battle!.board,
        size * size - 1,
        run.battle!.hands[1][keeperIndex],
        1,
      ),
    );
    const copyIndex = run.battle!.hands[0].findIndex((card) => card.conjured),
      card = run.battle!.hands[0][copyIndex];
    assert.deepEqual(
      evaluateKeywords(card, run.battle!.board, 0).edges,
      card.edges,
    );
    run = playAdventureCard(
      run,
      size,
      copyIndex,
      chooseKeywordTargets(run.battle!.board, size, card, 0),
    );
    assert.deepEqual(
      restoreAdventure(JSON.parse(JSON.stringify(run)))!.battle,
      JSON.parse(JSON.stringify(run.battle)),
    );
    assert.deepEqual(run.inventory, inventory);
    const invalid = structuredClone(run);
    invalid.battle!.hands[0][0].keywords = [
      summon({ pips: [{ side: 0, amount: 6 }] }),
    ];
    assert.equal(validateAdventure(invalid), false);
  });
