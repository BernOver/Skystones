import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_BOARD,
  STARTER_STONES,
  placeStone,
  prepareTargeting,
  chooseKeywordTargets,
  chooseMove,
  evaluateKeywords,
  withNextKeywords,
  cardEdges,
  defenseEdges,
  validateKeywords,
} from "../src/game.ts";
import type {
  Stone,
  StoneKeyword,
  BoardSize,
  Side,
  Board,
  ShiftKeyword,
} from "../src/game.ts";
import {
  pendingPipEffects,
  boardEnvironments,
  wrappedTile,
} from "../src/effects.ts";
import {
  newAdventure,
  enterAdventureNode,
  playAdventureCard,
  restoreAdventure,
  validateAdventure,
  resolveAdventureEvent,
} from "../src/adventure.ts";
import { rotatedPotionStone } from "../src/potions.ts";
import { newDraft, restoreDraft } from "../src/draft.ts";
import { applyConjure, CONJURE_CARDS } from "../src/conjure.ts";
import { DEFAULT_TOKENS, tokenDependencies } from "../src/tokens.ts";
const stone = (
  keywords: StoneKeyword[] = [],
  edges: Stone["edges"] = [1, 1, 1, 1],
  name = "Receiver",
): Stone => ({
  ...STARTER_STONES[0],
  id: `custom-next-${name.toLowerCase()}`,
  name,
  keywords,
  edges,
});
const gift = (
  keywords: StoneKeyword[],
  amount = 0,
  recipient: "self" | "opponent" = "self",
  tribe?: "giants",
): StoneKeyword => ({
  type: "next-play",
  side: 0,
  amount,
  recipient,
  keywords,
  ...(tribe ? { tribe } : {}),
});
const shift = (
  side: Side = 0,
  direction: Side = 1,
  affects: ShiftKeyword["affects"] = "enemies",
): ShiftKeyword => ({ type: "shift", side, direction, affects });
const castGift = (keywords: StoneKeyword[], amount = 0): Board =>
  placeStone(
    EMPTY_BOARD(),
    0,
    stone([gift(keywords, amount)], [0, 0, 0, 0], "Giver"),
    0,
  ).board;

test("Next Play accepts keyword-only, mixed pip/keyword, nested queues, and granted Combo, while invalid or excessively nested effects are rejected", () => {
  assert.ok(validateKeywords([gift([{ type: "shield", side: 0 }])]));
  assert.ok(
    validateKeywords([
      gift([{ type: "combo", pips: [{ side: 0, amount: 1 }] }], -1),
    ]),
  );
  assert.ok(validateKeywords([gift([gift([shift()])])]));
  assert.equal(
    validateKeywords([
      { type: "next-play", side: 0, amount: 0, recipient: "self" },
    ]),
    false,
  );
  assert.equal(validateKeywords([gift([])]), false);
  assert.equal(
    validateKeywords([gift(Array(6).fill({ type: "silence" }))]),
    false,
  );
  let nested = gift([{ type: "shield", side: 0 }]);
  for (let i = 0; i < 5; i++) nested = gift([nested]);
  assert.equal(validateKeywords([nested]), false);
  for (const invalid of [
    { ...shift(), direction: 4 },
    { ...shift(), affects: "opponents" },
    { ...shift(), side: 4 },
  ])
    assert.equal(validateKeywords([invalid]), false);
});
test("queued keywords appear in previews and activate once on the next real play, without mutating the hand or printed pips", () => {
  let board = castGift(
    [
      { type: "shield", side: 0, amount: 2 },
      { type: "head-start", side: 1 },
    ],
    1,
  );
  const hand = stone(),
    before = structuredClone(hand);
  const preview = withNextKeywords(hand, board, 0);
  assert.deepEqual(preview.keywords, [
    { type: "shield", side: 0, amount: 2 },
    { type: "head-start", side: 1 },
  ]);
  assert.equal(withNextKeywords(preview, board, 0), preview);
  assert.deepEqual(evaluateKeywords(hand, board, 0).edges, [2, 2, 1, 1]);
  assert.deepEqual(evaluateKeywords(hand, board, 0).shields, [2, 0, 0, 0]);
  assert.deepEqual(hand, before);
  board = placeStone(board, 4, hand, 0).board;
  assert.deepEqual(board[4]!.edges, [2, 2, 1, 1]);
  assert.deepEqual(board[4]!.stone.edges, [1, 1, 1, 1]);
  assert.equal(board[4]!.stone.receivedKeywords!.length, 2);
  assert.equal(pendingPipEffects(board, 0).length, 0);
  assert.equal(withNextKeywords(hand, board, 0), hand);
});
test("tribe-qualified keyword gifts wait through unrelated plays and card creation, use original player credit after capture, and survive caster Silence", () => {
  let board = placeStone(
    EMPTY_BOARD(),
    0,
    stone(
      [gift([{ type: "shield", side: 1 }], 0, "self", "giants")],
      [0, 0, 0, 0],
    ),
    0,
  ).board;
  board = placeStone(board, 1, stone([{ type: "silence" }], [1, 1, 1, 5]), 1, [
    { keywordIndex: 0, boardIndex: 0 },
  ]).board;
  assert.equal(board[0]!.silenced, true);
  assert.equal(board[0]!.owner, 1);
  board = placeStone(board, 3, { ...stone(), tribes: ["minis"] }, 0).board;
  assert.equal(pendingPipEffects(board, 0).length, 1);
  const giant = { ...stone(), tribes: ["giants"] as const } as Stone;
  board = placeStone(board, 4, giant, 0).board;
  assert.deepEqual(board[4]!.shields, [0, 1, 0, 0]);
  assert.equal(pendingPipEffects(board, 0).length, 0);
});
test("gifts keep cast order through position changes and preserve unique keywords while retaining repeated Sunder entries", () => {
  let board = placeStone(
    EMPTY_BOARD(),
    8,
    stone(
      [
        gift([
          { type: "sunder", side: 0 },
          { type: "shield", side: 1 },
        ]),
      ],
      [0, 0, 0, 0],
      "First",
    ),
    0,
  ).board;
  board = placeStone(
    board,
    0,
    stone(
      [
        gift([
          { type: "sunder", side: 0, amount: 2 },
          { type: "shield", side: 1, amount: 3 },
        ]),
      ],
      [0, 0, 0, 0],
      "Second",
    ),
    1,
  ).board;
  // The second caster grants its own player, so redirect it to test ordered stacking.
  board[0] = {
    ...board[0]!,
    queuedPips: board[0]!.queuedPips!.map((effect) => ({
      ...effect,
      recipient: 0,
    })),
  };
  const receiver = withNextKeywords(stone(), board, 0);
  assert.deepEqual(receiver.keywords, [
    { type: "sunder", side: 0 },
    { type: "shield", side: 1 },
    { type: "sunder", side: 0, amount: 2 },
  ]);
  assert.deepEqual(
    withNextKeywords(
      stone([{ type: "shield", side: 1, amount: 4 }]),
      board,
      0,
    ).keywords?.filter((keyword) => keyword.type === "shield"),
    [{ type: "shield", side: 1, amount: 4 }],
  );
});
test("granted Sunder uses normal targeting, canceled choices spend nothing, and received keywords disappear under Silence without undoing completed effects", () => {
  let board = castGift([
    { type: "sunder", side: 0, amount: 2 },
    { type: "shield", side: 0 },
  ]);
  board = placeStone(board, 8, stone([], [4, 1, 1, 1]), 1).board;
  const before = structuredClone(board),
    receiver = stone();
  const pending = prepareTargeting(board, receiver, [], 0, 4);
  assert.equal(pending.pending!.keyword.type, "sunder");
  assert.deepEqual(board, before);
  assert.equal(pendingPipEffects(board, 0).length, 1);
  board = placeStone(board, 4, receiver, 0, [
    { keywordIndex: 0, boardIndex: 8 },
  ]).board;
  assert.equal(board[8]!.edges![0], 2);
  board = placeStone(board, 2, stone([{ type: "silence" }]), 1, [
    { keywordIndex: 0, boardIndex: 4 },
  ]).board;
  assert.equal(board[4]!.silenced, true);
  assert.deepEqual(board[4]!.shields, [0, 0, 0, 0]);
  assert.equal(board[8]!.edges![0], 2);
});
test("received Dizzy rolls before captures, received Combo uses previous play history, and nested Next Play waits for a later card", () => {
  let board = castGift([
    { type: "dizzy", sides: [1] },
    { type: "combo", pips: [{ side: 0, amount: 2 }] },
    gift([{ type: "shield", side: 2 }]),
  ]);
  const receiver = stone();
  const placed = placeStone(board, 4, receiver, 0, [], { seed: 123 });
  board = placed.board;
  assert.equal(board[4]!.comboActive, true);
  assert.deepEqual(board[4]!.dizzy!.sides, [1]);
  assert.equal(board[4]!.edges![0], 3);
  assert.deepEqual(board[4]!.shields, [0, 0, 0, 0]);
  assert.equal(pendingPipEffects(board, 0).length, 1);
  board = placeStone(board, 3, stone(), 0).board;
  assert.deepEqual(board[3]!.shields, [0, 0, 1, 0]);
});
test("Combo can queue gifts, and a received Conjure generates tokens with portable template dependencies", () => {
  let board = placeStone(EMPTY_BOARD(), 0, stone(), 0).board;
  const token = DEFAULT_TOKENS[0];
  const grant: StoneKeyword = {
    type: "conjure",
    mode: "token",
    token: token.id,
    count: 1,
    recipient: "self",
  };
  board = placeStone(
    board,
    1,
    stone([{ type: "combo", keywords: [gift([grant])] }]),
    0,
  ).board;
  assert.equal(pendingPipEffects(board, 0).length, 1);
  board = placeStone(board, 4, stone(), 0).board;
  const result = applyConjure(board, 4, [[], []], CONJURE_CARDS, 81);
  assert.equal(result.hands[0][0].token, true);
  assert.equal(result.hands[0][0].name, token.name);
  assert.deepEqual(
    tokenDependencies(stone([gift([grant])])).map((card) => card.id),
    [token.id],
  );
});
for (const size of [3, 4] as BoardSize[])
  test(`${size}×${size} Shift follows each fixed direction, wraps at the board edge, and automatically affects only its printed-side neighbor`, () => {
    for (const [placement, side, target, direction] of [
      [size, 0, 0, 0],
      [size - 2, 1, size - 1, 1],
      [size * (size - 2), 2, size * (size - 1), 2],
      [1, 3, 0, 3],
    ] as [number, Side, number, Side][]) {
      let board = EMPTY_BOARD(size);
      board = placeStone(
        board,
        target,
        stone([], [0, 0, 0, 0], "Neighbor"),
        1,
      ).board;
      const bystander = size * size - 2;
      if (
        ![placement, target, wrappedTile(target, direction, size)].includes(
          bystander,
        )
      )
        board = placeStone(
          board,
          bystander,
          stone([], [0, 0, 0, 0], "Bystander"),
          1,
        ).board;
      const before = board[bystander];
      const move = placeStone(
        board,
        placement,
        stone([shift(side, direction)], [0, 0, 0, 0], "Shifter"),
        0,
      );
      const destination = wrappedTile(target, direction, size);
      assert.equal(move.board[target], null);
      assert.equal(move.board[destination]!.stone.name, "Neighbor");
      assert.equal(move.board[destination]!.owner, 1);
      assert.equal(move.board[destination]!.playedBy, 1);
      if (before && bystander !== destination && bystander !== placement)
        assert.deepEqual(move.board[bystander], before);
      assert.equal(
        move.board.filter(Boolean).length,
        board.filter(Boolean).length + 1,
      );
      assert.ok(
        !prepareTargeting(
          board,
          stone([shift(side, direction)]),
          [],
          0,
          placement,
        ).pending,
      );
    }
  });
test("Shift affinity is fixed on the card, and occupied destinations, the incoming tile, missing neighbors and board edges safely block it", () => {
  for (const owner of [0, 1] as const)
    for (const affects of ["allies", "enemies", "both"] as const) {
      let board = placeStone(
        EMPTY_BOARD(),
        1,
        stone([], [0, 0, 0, 0]),
        owner,
      ).board;
      const moved =
        affects === "both" ||
        (affects === "allies" ? owner === 0 : owner === 1);
      const result = placeStone(
        board,
        4,
        stone([shift(0, 1, affects)], [0, 0, 0, 0]),
        0,
      );
      assert.equal(result.board[2]?.owner === owner, moved);
      assert.equal(
        result.effects[0].type === "shift" && result.effects[0].moved,
        moved,
      );
    }
  let board = placeStone(EMPTY_BOARD(), 1, stone([], [0, 0, 0, 0]), 1).board;
  board = placeStone(board, 2, stone([], [0, 0, 0, 0]), 0).board;
  assert.equal(
    placeStone(board, 4, stone([shift()], [0, 0, 0, 0]), 0).board[1]!.owner,
    1,
  );
  assert.equal(
    placeStone(board, 4, stone([shift(0, 2)], [0, 0, 0, 0]), 0).board[1]!.owner,
    1,
  );
  assert.equal(
    placeStone(EMPTY_BOARD(), 0, stone([shift()], [0, 0, 0, 0]), 0).effects[0]
      .type,
    "shift",
  );
  assert.throws(
    () =>
      placeStone(board, 4, stone([shift()]), 0, [
        { keywordIndex: 0, boardIndex: 1 },
      ]),
    /target/i,
  );
});
test("Shift resolves before captures, preserves resolved history and terrain positions, and lets later targeted keywords use the moved card's new tile", () => {
  let board = placeStone(
    EMPTY_BOARD(),
    1,
    stone(
      [
        {
          type: "environment",
          environment: { kind: "blight", side: "all", amount: 1 },
        },
        gift([{ type: "shield", side: 0 }], 0, "opponent"),
      ],
      [1, 1, 1, 1],
      "Mover",
    ),
    1,
    [{ keywordIndex: 0, boardIndex: 1 }],
  ).board;
  const history = structuredClone(board[1]!);
  const player = stone([shift(), { type: "sunder", side: 0 }], [5, 5, 5, 5]);
  const preview = prepareTargeting(board, player, [], 0, 4);
  assert.equal(preview.board[1], null);
  assert.ok(preview.pending!.options.some((option) => option.boardIndex === 2));
  const moved = placeStone(board, 4, player, 0, [
    { keywordIndex: 1, boardIndex: 2 },
  ]);
  assert.deepEqual(moved.captured, []);
  assert.equal(moved.board[2]!.stone.name, "Mover");
  assert.deepEqual(moved.board[2]!.queuedPips, history.queuedPips);
  assert.equal(moved.board[2]!.environment, undefined);
  assert.equal(boardEnvironments(moved.board)[1]!.kind, "blight");
  assert.equal(moved.board[2]!.edges![0], 0);
  assert.equal(pendingPipEffects(moved.board, 0).length, 0);
  assert.doesNotThrow(() => chooseMove(board, [player], [stone()], 0));
});
test("Compass rotates both Shift axes and nested gift directions; malformed Shift and gift histories are rejected on restore", () => {
  const rotated = rotatedPotionStone(
    stone([shift(0, 1), gift([shift(3, 0), { type: "shield", side: 1 }])]),
  ).keywords!;
  assert.deepEqual(rotated[0], shift(1, 2));
  assert.equal(
    rotated[1].type === "next-play" &&
      rotated[1].keywords![0].type === "shift" &&
      rotated[1].keywords![0].direction,
    1,
  );
  let run = enterAdventureNode(newAdventure(3, 81), "moss");
  run.inventory[0] = { ...run.inventory[0], keywords: [gift([shift()])] };
  run.battle!.hands[0][0] = run.inventory[0];
  run = playAdventureCard(run, 0, 0);
  assert.ok(restoreAdventure(JSON.parse(JSON.stringify(run))));
  const invalid = structuredClone(run);
  invalid.battle!.board[0]!.queuedPips![0].keywords = [gift([])];
  assert.equal(validateAdventure(invalid), false);
});
test("new Draft pools contain Shift and keyword gifts while pools saved before this release keep their exact definitions", () => {
  const current = newDraft(3, 47, {}),
    old = newDraft(3, 47, {}, true, true, true, false);
  assert.equal(current.rulesVersion, 2);
  assert.equal(old.rulesVersion, undefined);
  assert.ok(
    current.cards.some((card) =>
      card.keywords?.some((keyword) => keyword.type === "shift"),
    ),
  );
  assert.ok(
    current.cards.some((card) =>
      card.keywords?.some(
        (keyword) => keyword.type === "next-play" && keyword.keywords?.length,
      ),
    ),
  );
  for (const draft of [current, old])
    assert.deepEqual(
      restoreDraft(JSON.parse(JSON.stringify(draft)))!.cards,
      draft.cards,
    );
});

test("a shifted Adventure chest keeps its treasure objective while fixed throne objectives stay on their tile", () => {
  for (const size of [3, 4] as BoardSize[]) {
    let run = resolveAdventureEvent(
      enterAdventureNode({ ...newAdventure(size, 77), floor: 1 }, "chest-one"),
      "fight",
    );
    const origin = run.battle!.objective!,
      destination = origin + 1;
    run.battle!.hands[0][0] = {
      ...run.battle!.hands[0][0],
      edges: [0, 0, 0, 0],
      keywords: [shift(0, 1)],
    };
    const fixed = playAdventureCard(
      { ...run, battle: { ...run.battle!, objectiveKind: "throne" } },
      origin + size,
      0,
    );
    assert.equal(fixed.battle!.objective, origin);
    assert.equal(fixed.battle!.board[origin], null);
    run = playAdventureCard(run, origin + size, 0);
    assert.equal(run.battle!.objective, destination);
    assert.equal(run.battle!.board[origin], null);
    assert.ok(run.battle!.board[destination]);
    assert.ok(restoreAdventure(JSON.parse(JSON.stringify(run))));
  }
});
