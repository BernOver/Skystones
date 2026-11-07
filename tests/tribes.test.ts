import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CHARACTER_PORTRAITS,
  CHARACTER_STONES,
  ENEMY_STONES,
} from "../src/characters.ts";
import {
  TRIBE_IDS,
  TRIBES,
  stoneTribes,
  portraitTribes,
  hasTribe,
  validateTribes,
} from "../src/tribes.ts";
import type { Tribe } from "../src/tribes.ts";
import {
  EMPTY_BOARD,
  STARTER_STONES,
  placeStone,
  evaluateKeywords,
  prepareTargeting,
  cardEdges,
  attackEdges,
  defenseEdges,
  validateStone,
  validateKeywords,
} from "../src/game.ts";
import type { Stone, StoneKeyword, Edges, ComboKeyword } from "../src/game.ts";
import {
  ENVIRONMENTS,
  defaultEnvironment,
  pendingPipEffects,
  nextPipModifiers,
} from "../src/effects.ts";
import type { EnvironmentKind } from "../src/effects.ts";
import {
  newAdventure,
  enterAdventureNode,
  playAdventureCard,
  restoreAdventure,
  validateAdventure,
  adventureFusionPreview,
  adventureWorkshopOffer,
} from "../src/adventure.ts";
import { newDraft, restoreDraft } from "../src/draft.ts";
import {
  editedCharacterDefault,
  saveCharacterDefaults,
} from "../src/cardDefaults.ts";
const stone = (
  tribes: Tribe[] = [],
  element: Stone["element"] = "fire",
  keywords: StoneKeyword[] = [],
  edges: Edges = [1, 1, 1, 1],
): Stone => ({
  ...STARTER_STONES[0],
  id: "custom-tribe-test",
  name: "Tribe test",
  tribes,
  element,
  keywords,
  edges,
  custom: true,
});
const combo = (
  condition: ComboKeyword["condition"],
  tribe?: Tribe,
): ComboKeyword => ({
  type: "combo",
  condition,
  ...(tribe ? { tribe } : {}),
  pips: [{ side: 0, amount: 1 }],
});

test("all catalogue portraits have valid groups, and Imaginators never receives a Sensei tribe", () => {
  assert.ok(
    !TRIBE_IDS.some(
      (id) => /sensei/i.test(id) || /sensei/i.test(TRIBES[id].name),
    ),
  );
  for (const portrait of CHARACTER_PORTRAITS) {
    assert.ok(portraitTribes(portrait.id).length);
    assert.ok(validateTribes([...portraitTribes(portrait.id)]));
    if (portrait.game === "Imaginators")
      assert.ok(portraitTribes(portrait.id).includes("imaginators"));
  }
  for (const card of [...CHARACTER_STONES, ...ENEMY_STONES])
    assert.ok(stoneTribes(card).length);
  assert.ok(portraitTribes("tree-rex").includes("giants"));
  assert.ok(!portraitTribes("pop-fizz").includes("giants"));
  assert.ok(portraitTribes("pop-fizz").includes("giants-era"));
  assert.ok(portraitTribes("wash-buckler").includes("swap-force"));
  assert.ok(portraitTribes("king-pen").includes("imaginators"));
  assert.ok(portraitTribes("golden-queen").includes("villains"));
});
test("explicit tribes, including an empty list, override portrait defaults and invalid imports are rejected", () => {
  const original = CHARACTER_STONES[0];
  assert.ok(hasTribe(original, "core"));
  assert.deepEqual(stoneTribes({ ...original, tribes: [] }), []);
  assert.deepEqual(
    stoneTribes({ ...original, tribes: ["giants", "swap-force"] }),
    ["giants", "swap-force"],
  );
  assert.ok(validateStone(stone(["giants", "imaginators"])));
  for (const tribes of [
    ["sensei"],
    ["unknown"],
    ["giants", "giants"],
    "giants",
    [null],
  ])
    assert.equal(validateStone({ ...stone(), tribes }), false);
});
test("Combo supports element, shared tribe, either, and both without changing the default rule", () => {
  const board = placeStone(
    EMPTY_BOARD(),
    0,
    stone(["giants"], "fire"),
    0,
  ).board;
  assert.equal(
    evaluateKeywords(stone(["giants"], "water", [combo("element")]), board, 0)
      .comboActive,
    false,
  );
  assert.equal(
    evaluateKeywords(stone(["minis"], "fire", [combo(undefined)]), board, 0)
      .comboActive,
    true,
  );
  for (const [condition, element, tribes, expected] of [
    ["tribe", "water", ["giants"], true],
    ["tribe", "fire", ["minis"], false],
    ["either", "water", ["giants"], true],
    ["either", "fire", ["minis"], true],
    ["both", "fire", ["giants"], true],
    ["both", "water", ["giants"], false],
    ["both", "fire", ["minis"], false],
  ] as [ComboKeyword["condition"], Stone["element"], Tribe[], boolean][]) {
    const card = stone(tribes, element, [combo(condition)]);
    assert.equal(evaluateKeywords(card, board, 0).comboActive, expected);
    assert.equal(evaluateKeywords(card, EMPTY_BOARD(), 0).comboActive, false);
  }
  assert.equal(
    evaluateKeywords(
      stone(["giants"], "water", [combo("tribe", "swap-force")]),
      board,
      0,
    ).comboActive,
    false,
  );
});
test("tribe Combo uses the original player’s last play after capture and Silence and locks its snapshot", () => {
  let board = placeStone(
    EMPTY_BOARD(),
    0,
    stone(["giants"], "fire", [{ type: "shield", side: 0 }], [0, 0, 0, 0]),
    0,
  ).board;
  board = placeStone(
    board,
    1,
    stone(["minis"], "fire", [{ type: "silence" }], [0, 0, 0, 5]),
    1,
    [{ keywordIndex: 0, boardIndex: 0 }],
  ).board;
  assert.equal(board[0]!.owner, 1);
  assert.equal(board[0]!.silenced, true);
  const placed = placeStone(
    board,
    4,
    stone(["giants"], "water", [combo("tribe", "giants")]),
    0,
  ).board[4]!;
  assert.equal(placed.comboActive, true);
  assert.deepEqual(placed.comboPreviousTribes, ["giants"]);
  assert.deepEqual(placed.edges, [2, 1, 1, 1]);
});
test("tribal Resonance counts each matching board card once across both owners and excludes the incoming card", () => {
  let board = placeStone(
    EMPTY_BOARD(),
    0,
    stone(["giants", "giants-era"], "fire"),
    0,
  ).board;
  board = placeStone(board, 8, stone(["giants", "core"], "water"), 1).board;
  board = placeStone(board, 2, stone(["minis"], "magic"), 1).board;
  const card = stone(["giants"], "magic", [
    { type: "resonance", side: 0, element: "magic", tribe: "giants" },
  ]);
  const resolved = evaluateKeywords(card, board, 0);
  assert.equal(resolved.edges[0], 3);
  assert.deepEqual(resolved.activeKeywords, [
    { type: "resonance", side: 0, element: "magic", tribe: "giants", bonus: 2 },
  ]);
  const played = placeStone(board, 4, card, 0).board[4]!;
  assert.equal(played.edges![0], 3);
});
test("all seven environments can filter by tribe, including attack and defense, while unrelated tribes stay unchanged", () => {
  const expected: Record<EnvironmentKind, Edges> = {
    elemental: [1, 2, 5, 4],
    blight: [0, 0, 3, 2],
    bastion: [0, 1, 4, 3],
    "war-banner": [0, 1, 4, 3],
    crosswind: [3, 0, 1, 4],
    "mirror-pool": [4, 3, 4, 3],
    equalizer: [2, 2, 2, 2],
  };
  for (const kind of Object.keys(ENVIRONMENTS) as EnvironmentKind[]) {
    for (const match of [true, false]) {
      const environment = {
        ...defaultEnvironment(kind, "fire"),
        tribe: "giants" as const,
      };
      const card = stone(
        [match ? "giants" : "minis"],
        "water",
        [{ type: "environment", environment }],
        [0, 1, 4, 3],
      );
      const cell = placeStone(EMPTY_BOARD(), 4, card, 0, [
        { keywordIndex: 0, boardIndex: 4 },
      ]).board[4]!;
      const ordinary = match ? expected[kind] : card.edges;
      assert.deepEqual(cardEdges(cell), ordinary);
      assert.deepEqual(
        attackEdges(cell),
        ordinary.map(
          (value) => value + (match && kind === "war-banner" ? 1 : 0),
        ),
      );
      assert.deepEqual(
        defenseEdges(cell),
        ordinary.map((value) => value + (match && kind === "bastion" ? 1 : 0)),
      );
    }
  }
});
test("tribal Crosswind rotates directional damage only for matching occupants", () => {
  for (const match of [true, false]) {
    let board = placeStone(
      EMPTY_BOARD(),
      0,
      stone(
        [],
        "fire",
        [
          {
            type: "environment",
            environment: { kind: "crosswind", tribe: "giants" },
          },
        ],
        [0, 0, 0, 0],
      ),
      0,
      [{ keywordIndex: 0, boardIndex: 4 }],
    ).board;
    board = placeStone(
      board,
      4,
      stone([match ? "giants" : "minis"], "water", [], [2, 1, 4, 3]),
      1,
    ).board;
    board = placeStone(
      board,
      1,
      stone([], "fire", [{ type: "sunder", side: 0 }], [0, 0, 0, 0]),
      0,
      [{ keywordIndex: 0, boardIndex: 4 }],
    ).board;
    assert.deepEqual(board[4]!.reductions, match ? [0, 0, 0, 1] : [1, 0, 0, 0]);
    assert.deepEqual(cardEdges(board[4]!), match ? [2, 2, 1, 4] : [1, 1, 4, 3]);
  }
});
test("tribal Next Play waits through nonmatching plays and captures, then consumes once for the recipient", () => {
  let board = placeStone(
    EMPTY_BOARD(),
    0,
    stone(
      ["core"],
      "fire",
      [
        {
          type: "next-play",
          side: "all",
          amount: 1,
          recipient: "self",
          tribe: "giants",
        },
      ],
      [0, 0, 0, 0],
    ),
    0,
  ).board;
  board = placeStone(
    board,
    1,
    stone(["giants"], "water", [], [0, 0, 0, 5]),
    1,
  ).board;
  assert.equal(board[0]!.owner, 1);
  const scout = stone(["minis"]);
  assert.deepEqual(nextPipModifiers(board, 0, scout), [0, 0, 0, 0]);
  board = placeStone(board, 3, scout, 0).board;
  assert.equal(pendingPipEffects(board, 0).length, 1);
  assert.deepEqual(board[3]!.edges, [1, 1, 1, 1]);
  const giant = stone(["giants"]);
  assert.deepEqual(evaluateKeywords(giant, board, 0).edges, [2, 2, 2, 2]);
  board = placeStone(board, 4, giant, 0).board;
  assert.equal(pendingPipEffects(board, 0).length, 0);
  assert.deepEqual(board[4]!.edges, [2, 2, 2, 2]);
  assert.deepEqual(evaluateKeywords(giant, board, 0).edges, [1, 1, 1, 1]);
});
test("a hybrid receives every matching queued tribe bonus while unrelated queues remain pending", () => {
  let board = placeStone(
    EMPTY_BOARD(),
    0,
    stone(
      [],
      "fire",
      [
        {
          type: "next-play",
          side: 0,
          amount: 1,
          recipient: "self",
          tribe: "giants",
        },
        {
          type: "next-play",
          side: 1,
          amount: 2,
          recipient: "self",
          tribe: "swap-force",
        },
        {
          type: "next-play",
          side: 2,
          amount: -1,
          recipient: "self",
          tribe: "minis",
        },
      ],
      [0, 0, 0, 0],
    ),
    0,
  ).board;
  board = placeStone(board, 4, stone(["giants", "swap-force"]), 0).board;
  assert.deepEqual(board[4]!.edges, [2, 3, 1, 1]);
  assert.deepEqual(
    pendingPipEffects(board, 0).map((effect) => effect.tribe),
    ["minis"],
  );
});
test("Adventure restores tribe histories, pending filters and terrain without losing their conditions", () => {
  let run = enterAdventureNode(newAdventure(3, 81), "moss");
  const caster = {
    ...run.inventory[0],
    tribes: ["giants"] as Tribe[],
    keywords: [
      {
        type: "next-play" as const,
        side: "all" as const,
        amount: 1,
        recipient: "self" as const,
        tribe: "giants" as const,
      },
      {
        type: "environment" as const,
        environment: {
          kind: "bastion" as const,
          amount: 1,
          tribe: "giants" as const,
        },
      },
    ],
  };
  run.inventory[0] = caster;
  run.battle!.hands[0][0] = caster;
  run = playAdventureCard(run, 0, 0, [{ keywordIndex: 1, boardIndex: 4 }]);
  const restored = restoreAdventure(JSON.parse(JSON.stringify(run)))!;
  assert.ok(restored);
  assert.deepEqual(restored.battle, JSON.parse(JSON.stringify(run.battle)));
  assert.equal(pendingPipEffects(restored.battle!.board, 0)[0].tribe, "giants");
  for (const mutate of [
    (r: typeof run) => {
      r.battle!.board[0]!.queuedPips![0].tribe = "sensei" as Tribe;
    },
    (r: typeof run) => {
      r.battle!.board[0]!.stone.tribes = ["sensei" as Tribe];
    },
  ]) {
    const invalid = structuredClone(run);
    mutate(invalid);
    assert.equal(validateAdventure(invalid), false);
  }
  const old = JSON.parse(JSON.stringify(newDraft(3, 47, {}, true, false)));
  assert.equal(old.tribesVersion, undefined);
  assert.deepEqual(restoreDraft(old)!.cards, old.cards);
  const current = newDraft(3, 47, {});
  assert.equal(current.tribesVersion, 1);
  assert.deepEqual(
    restoreDraft(JSON.parse(JSON.stringify(current)))!.cards,
    current.cards,
  );
  assert.ok(
    current.cards.some((card) =>
      card.keywords?.some(
        (keyword) => keyword.type === "combo" && keyword.condition === "tribe",
      ),
    ),
  );
});
test("tribe edits to character defaults apply to new cards and saved Draft snapshots, without changing an existing run", (t) => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage"),
    values = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) || null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
  });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else Reflect.deleteProperty(globalThis, "localStorage");
  });
  const old = newAdventure(3, 81),
    original = old.inventory[0],
    before = [...stoneTribes(original)];
  saveCharacterDefaults(
    editedCharacterDefault(
      original.portrait!,
      { ...original, tribes: ["villains"] },
      {},
    ),
  );
  const fresh = newAdventure(3, 81);
  assert.equal(fresh.inventory[0].portrait, original.portrait);
  assert.deepEqual(stoneTribes(fresh.inventory[0]), ["villains"]);
  assert.deepEqual(
    stoneTribes(
      restoreAdventure(JSON.parse(JSON.stringify(old)))!.inventory[0],
    ),
    before,
  );
});
test("fusion unions tribes and all tribe-aware keyword imports reject unknown conditions", () => {
  const base = stone(["giants"]),
    donor = { ...stone(["swap-force"]), id: "custom-donor" };
  assert.deepEqual(adventureFusionPreview(base, donor).tribes, [
    "giants",
    "swap-force",
  ]);
  for (const keyword of [
    combo("tribe", "giants"),
    combo("either", "imaginators"),
    { type: "resonance", side: 0, element: "magic", tribe: "giants" },
    {
      type: "next-play",
      side: "all",
      amount: -1,
      recipient: "opponent",
      tribe: "swap-force",
    },
  ])
    assert.ok(validateKeywords([keyword]));
  for (const keyword of [
    { ...combo("tribe"), tribe: "sensei" },
    { ...combo("element"), tribe: "giants" },
    { ...combo("tribe"), condition: "unknown" },
    {
      type: "environment",
      environment: { kind: "bastion", amount: 1, tribe: "sensei" },
    },
  ])
    assert.equal(validateKeywords([keyword]), false);
});
test("new merchants can offer tribe-qualified conditions without changing saved offers", () => {
  const kinds = new Set<string>();
  for (let seed = 0; seed < 400; seed++) {
    const offer = adventureWorkshopOffer({ seed, floor: 2 });
    assert.ok(validateKeywords([offer.keyword]));
    if (
      ("tribe" in offer.keyword && offer.keyword.tribe) ||
      (offer.keyword.type === "environment" && offer.keyword.environment.tribe)
    )
      kinds.add(offer.keyword.type);
    assert.deepEqual(
      adventureWorkshopOffer({
        seed,
        floor: 2,
        shopOffer: JSON.parse(JSON.stringify(offer)),
      }),
      offer,
    );
  }
  assert.deepEqual([...kinds].sort(), [
    "combo",
    "environment",
    "next-play",
    "resonance",
  ]);
});
