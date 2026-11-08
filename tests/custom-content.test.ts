import { test } from "node:test";
import assert from "node:assert/strict";
import {
  customTribe,
  validTribe,
  validateTribes,
  tribeName,
  hasTribe,
} from "../src/tribes.ts";
import {
  STARTER_STONES,
  EMPTY_BOARD,
  validateKeywords,
  evaluateKeywords,
  placeStone,
  chooseMove,
} from "../src/game.ts";
import type { Stone, BoardSize } from "../src/game.ts";
import { environmentEdges } from "../src/effects.ts";
import { DEFAULT_TOKENS } from "../src/tokens.ts";
import { CONJURE_CARDS } from "../src/conjure.ts";
import {
  BUILTIN_ENCOUNTERS,
  BUILTIN_ENEMY_CHARACTERS,
  validEncounter,
  validEncounterLibrary,
  encountersForPool,
} from "../src/encounters.ts";
import type {
  EncounterDefinition,
  EncounterLibrary,
} from "../src/encounters.ts";
import {
  newAdventure,
  adventureNodes,
  enterAdventureNode,
  testAdventureEncounter,
  playAdventureCard,
  adventureEnemyMove,
  validateAdventure,
  restoreAdventure,
  resolveAdventureEvent,
  continueEmptyAdventurePath,
} from "../src/adventure.ts";
import { adventureEncounter, adventureOpponent } from "../src/presentation.ts";
const card: Stone = {
  ...STARTER_STONES[0],
  id: "custom-workshop-card",
  name: "Workshop card",
  edges: [0, 0, 0, 0],
  keywords: [],
};
const fight = (
  changes: Partial<EncounterDefinition> = {},
): EncounterDefinition => ({
  id: "custom-workshop",
  name: "Workshop battle",
  description: "A hand-made opponent challenges you.",
  character: {
    ...BUILTIN_ENEMY_CHARACTERS[0],
    id: "enemy-workshop",
    name: "Workshop keeper",
  },
  pools: ["easy"],
  acts: [1, 2],
  enabled: true,
  mechanic: "standard",
  deck: [card],
  ...changes,
});
const library = (...encounters: EncounterDefinition[]): EncounterLibrary => ({
  version: 1,
  characters: encounters
    .map((encounter) => encounter.character)
    .filter(
      (character, index, all) =>
        all.findIndex((item) => item.id === character.id) === index,
    ),
  encounters,
});
test("custom tribe identities survive sharing without registry entries and power existing tribe effects", () => {
  const tribe = customTribe("  Clockwork   Crew ");
  assert.equal(tribe, customTribe("clockwork crew"));
  assert.equal(customTribe("Giants"), "giants");
  assert.ok(validTribe(tribe));
  assert.equal(tribeName(tribe), "clockwork crew");
  assert.ok(validateTribes(["giants", tribe]));
  for (const invalid of [
    "custom:",
    "custom:%ZZ",
    "custom:%00",
    "custom:" + "a".repeat(33),
    "custom:Giants",
    "unknown",
  ])
    assert.ok(!validTribe(invalid));
  assert.throws(() => customTribe(" "));
  const first = { ...card, tribes: [tribe] };
  assert.ok(hasTribe(JSON.parse(JSON.stringify(first)), tribe));
  const board = placeStone(EMPTY_BOARD(3), 0, first, 0).board;
  const next: Stone = {
    ...first,
    keywords: [
      {
        type: "combo",
        condition: "tribe",
        tribe,
        pips: [{ side: 0, amount: 2 }],
      },
    ],
  };
  assert.ok(validateKeywords(next.keywords));
  assert.equal(evaluateKeywords(next, board, 0).edges[0], 2);
  assert.deepEqual(
    environmentEdges(
      [0, 0, 0, 0],
      "fire",
      { kind: "elemental", element: "fire", side: "all", amount: 1, tribe },
      first,
    ),
    [1, 1, 1, 1],
  );
  assert.ok(
    validateKeywords([
      { type: "next-play", side: 0, amount: 1, recipient: "self", tribe },
      { type: "conjure", mode: "random", count: 1, recipient: "self", tribe },
    ]),
  );
});
test("encounters validate flexible starting hands, tokens, combined pools and acts", () => {
  assert.ok(BUILTIN_ENCOUNTERS.every(validEncounter));
  assert.ok(
    CONJURE_CARDS.every((card) => validEncounter(fight({ deck: [card] }))),
  );
  assert.ok(validEncounterLibrary(library(fight())));
  for (const count of [0, 1, 3, 8, 20])
    assert.ok(
      validEncounter(
        fight({ deck: Array.from({ length: count }, () => DEFAULT_TOKENS[0]) }),
      ),
    );
  assert.ok(
    validEncounter(
      fight({
        deck: undefined,
        pools: ["easy", "hard", "event", "boss"],
        acts: [2],
      }),
    ),
  );
  for (const changes of [
    { pools: [] },
    { acts: [] },
    { acts: [3] },
    { pools: ["easy", "easy"] },
    { deck: Array(21).fill(card) },
    { mechanic: "unknown" },
    { character: { ...fight().character, portrait: "missing" } },
    {
      deck: [
        {
          ...card,
          discardBuffs: { pips: [1, 0, 0, 0], shields: [0, 0, 0, 0] },
        },
      ],
    },
  ])
    assert.ok(!validEncounter(fight(changes as Partial<EncounterDefinition>)));
});
test("pool and act selection is deterministic, editable and respected by map previews and actual fights", () => {
  const easy = fight({ id: "custom-easy", acts: [1] }),
    hard = fight({ id: "custom-hard", pools: ["hard", "boss"], acts: [2] });
  const roster = library(easy, hard);
  assert.deepEqual(encountersForPool(roster, "easy", 2), []);
  assert.deepEqual(encountersForPool(roster, "boss", 2), [hard]);
  const run = { ...newAdventure(3, 34), encounterLibrary: roster };
  const nodes = adventureNodes(run);
  assert.equal(nodes.length, 1);
  assert.equal(nodes[0].encounter?.id, easy.id);
  assert.deepEqual(adventureNodes(run), nodes);
  assert.equal(adventureEncounter({ ...run, node: nodes[0] }).name, easy.name);
  assert.equal(
    adventureOpponent({ ...run, node: nodes[0] }).name,
    easy.character.name,
  );
  const entered = enterAdventureNode(run, nodes[0].id);
  assert.equal(entered.battle!.hands[1].length, 1);
  assert.ok(validateAdventure(entered));
  roster.encounters[0].name = "Edited later";
  assert.equal(entered.node!.encounter!.name, "Workshop battle");
  assert.equal(
    restoreAdventure(JSON.parse(JSON.stringify(entered)))?.battle?.name,
    "Workshop battle",
  );
  assert.ok(
    adventureNodes({ ...run, floor: 17 }).every(
      (node) => node.encounter?.id === hard.id,
    ),
  );
});
test("event pool fights offer entry or departure, and empty encounter pools can be skipped", () => {
  const event = fight({ pools: ["event"] }),
    run = {
      ...newAdventure(3, 34),
      floor: 1,
      encounterLibrary: library(event),
    };
  const node = adventureNodes(run).find((node) => node.encounter)!;
  const arrived = enterAdventureNode(run, node.id);
  assert.equal(arrived.phase, "event");
  assert.ok(validateAdventure(arrived));
  const started = resolveAdventureEvent(arrived, "fight");
  assert.equal(started.phase, "battle");
  assert.equal(started.battle!.hands[1].length, 1);
  assert.equal(resolveAdventureEvent(arrived, "leave").floor, 2);
  const empty = {
    ...run,
    floor: 0,
    encounterLibrary: library(fight({ enabled: false })),
  };
  assert.deepEqual(adventureNodes(empty), []);
  assert.equal(continueEmptyAdventurePath(empty).floor, 1);
  assert.throws(() => continueEmptyAdventurePath(run));
});
for (const size of [3, 4] as BoardSize[]) {
  test(`${size}×${size} custom hands of 0, 1, 3, 10 and 20 cards finish without forcing a hand size`, () => {
    for (const count of [0, 1, 3, 10, 20]) {
      let run = testAdventureEncounter(
        fight({
          deck: Array.from(
            { length: count },
            () =>
              ({
                ...DEFAULT_TOKENS[0],
                edges: [0, 0, 0, 0],
                keywords: [],
              }) as Stone,
          ),
        }),
        size,
        1,
        "easy",
        89,
      );
      assert.equal(run.battle!.hands[1].length, count);
      assert.equal(
        new Set(run.battle!.hands[1].map((card) => card.id)).size,
        count,
      );
      let moves = 0;
      while (run.phase === "battle" && moves++ < 20) {
        assert.ok(
          validateAdventure(run),
          `valid at move ${moves}, count ${count}`,
        );
        const restored = restoreAdventure(JSON.parse(JSON.stringify(run)));
        assert.ok(restored);
        assert.deepEqual(
          restored.battle,
          JSON.parse(JSON.stringify(run.battle)),
        );
        run = restored;
        if (run.battle!.current === 1) run = adventureEnemyMove(run);
        else {
          const move = chooseMove(
            run.battle!.board,
            run.battle!.hands[0],
            run.battle!.hands[1],
            0,
          );
          run = playAdventureCard(
            run,
            move.index,
            move.cardIndex,
            move.targets,
          );
        }
      }
      assert.notEqual(run.phase, "battle");
      assert.ok(validateAdventure(run));
      assert.equal(
        run.battle!.turns,
        Math.min(size ** 2, (size === 3 ? 5 : 8) + count),
      );
    }
  });
  test(`${size}×${size} tests and reloads preserve every custom starting mechanic`, () => {
    for (const mechanic of [
      "standard",
      "chest",
      "throne",
      "vortex",
      "golden",
    ] as const) {
      const run = testAdventureEncounter(
        fight({ mechanic, pools: ["boss"] }),
        size,
        2,
        "boss",
        89,
      );
      assert.ok(validateAdventure(run), mechanic);
      assert.deepEqual(
        restoreAdventure(JSON.parse(JSON.stringify(run)))!.battle,
        JSON.parse(JSON.stringify(run.battle)),
        mechanic,
      );
      assert.equal(run.battle!.name, "Workshop battle");
      assert.equal(
        run.battle!.boss,
        mechanic === "vortex"
          ? "kaos-vortex"
          : mechanic === "golden"
            ? "golden-queen"
            : mechanic === "throne"
              ? "kaos"
              : undefined,
      );
    }
  });
}
test("standard custom bosses use score rules and advance Act I without a Kaos throne", () => {
  let run = testAdventureEncounter(
    fight({ deck: [], pools: ["boss"] }),
    3,
    1,
    "boss",
    89,
  );
  assert.equal(run.battle!.board.filter(Boolean).length, 0);
  while (run.phase === "battle")
    run = playAdventureCard(
      run,
      run.battle!.board.findIndex((cell) => !cell),
      0,
    );
  assert.ok(run.battle!.bossWon);
  assert.equal(run.phase, "reward");
  assert.match(run.message, /Workshop battle is defeated/);
});
test("mechanics on ordinary encounters retain their pool rewards and custom character objectives", () => {
  let run = testAdventureEncounter(
    fight({ deck: [], mechanic: "throne" }),
    3,
    1,
    "easy",
    89,
  );
  assert.equal(run.battle!.board[4]!.stone.name, "Workshop keeper’s Throne");
  assert.equal(
    run.battle!.board[4]!.stone.portrait,
    BUILTIN_ENEMY_CHARACTERS[0].portrait,
  );
  // The custom mechanic is a win condition, independently of act-boss membership.
  run.battle!.board[4]!.owner = 0;
  while (run.phase === "battle")
    run = playAdventureCard(
      run,
      run.battle!.board.findIndex((cell) => !cell),
      0,
    );
  assert.ok(!run.battle!.bossWon);
  assert.ok(!run.victory);
  assert.doesNotMatch(run.message, /defeated/);
  const empty = {
    ...newAdventure(3, 89),
    floor: 17,
    encounterLibrary: library(fight({ enabled: false })),
  };
  assert.equal(continueEmptyAdventurePath(empty).phase, "ended");
  const legacyChest = resolveAdventureEvent(
    enterAdventureNode({ ...newAdventure(3, 89), floor: 10 }, "golden-cache"),
    "fight",
  );
  assert.deepEqual(
    legacyChest.battle!.board.find((cell) => cell?.stone.creature === "chest")!
      .stone.keywords,
    [],
  );
});
test("discard protection counts passed turns and actual Conjure gains in short-handed custom fights", () => {
  for (const [size, enemyCards, expected] of [
    [3, 0, 0],
    [3, 3, 2],
    [4, 3, 0],
    [4, 8, 3],
  ] as const) {
    const run = testAdventureEncounter(
      fight({ deck: Array.from({ length: enemyCards }, () => card) }),
      size,
      1,
      "easy",
      89,
    );
    run.battle!.hands[0][0] = {
      ...run.battle!.hands[0][0],
      keywords: [
        {
          type: "conjure",
          mode: "token",
          token: DEFAULT_TOKENS[0].id,
          count: 3,
          recipient: "self",
        },
        { type: "discard", mode: "random", count: 5, recipient: "self" },
      ],
    };
    const next = playAdventureCard(run, 0, 0);
    const record = next.battle!.board[0]!.discards![0];
    assert.equal(
      record.cards.length,
      expected,
      `${size}×${size}, enemy hand ${enemyCards}`,
    );
    assert.equal(record.skipped, 5 - expected);
    assert.ok(validateAdventure(next));
  }
});
