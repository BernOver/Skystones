import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SPIRE_CATALOG,
  spireCandidates,
  spireChoiceReason,
  getSpireEvent,
  validSpireState,
} from "../src/spireEvents.ts";
import {
  adventureSpireMemoryCards,
  enterAdventureNode,
  newAdventure,
  resolveAdventureEvent,
  transformAdventureCards,
  validateAdventure,
  restoreAdventure,
  playAdventureCard,
  claimAdventureRelic,
} from "../src/adventure.ts";
import type { Adventure } from "../src/adventure.ts";
import { handSize, validateKeywords, validateStone } from "../src/game.ts";
import type { Edges, Stone } from "../src/game.ts";
import { useAdventurePotion } from "../src/potions.ts";
import { maxLives } from "../src/relics.ts";
function encounter(id: string, size: 3 | 4 = 3, stage = 0): Adventure {
  const event = getSpireEvent(id)!,
    floor = event.act === 1 ? 1 : event.act === 3 ? 7 : 4;
  const run = enterAdventureNode(
    {
      ...newAdventure(size, 52),
      floor,
      gold: 1500,
      lives: 5,
      maxLifeBonus: 2,
      relics: ["gilded-compass", "travelers-satchel", "hagglers-coin"],
      potions: ["heal"],
      curses: ["Regret"],
    },
    `spire-crossroads-${floor === 1 ? 1 : floor === 4 ? 2 : 3}`,
  );
  run.inventory[0] = { ...run.inventory[0], edges: [4, 3, 2, 1] };
  return {
    ...run,
    spireEvent: { id, stage, visits: 0 },
    seenSpireEvents: [id],
  };
}
function roundtrip(run: Adventure) {
  const saved = JSON.parse(JSON.stringify(run));
  assert.ok(validateAdventure(saved), `${run.spireEvent?.id} ${run.phase}`);
  assert.deepEqual(restoreAdventure(saved), saved);
}
function win(run: Adventure): Adventure {
  const last = run.size ** 2 - 1,
    stone: Stone = { ...run.inventory[0], edges: [0, 0, 0, 0], keywords: [] };
  const board = Array.from({ length: last + 1 }, (_, i) =>
    i === last
      ? null
      : { stone, owner: 0 as const, edges: [0, 0, 0, 0] as Edges },
  );
  return playAdventureCard(
    {
      ...run,
      battle: {
        ...run.battle!,
        board,
        hands: [[stone], []],
        current: 0,
        turns: last - (run.battle!.objectiveKind ? 1 : 0),
      },
    },
    last,
    0,
  );
}
test("all 54 event adaptations have unique source mappings, choices, stages and reachable encounter pools", () => {
  assert.equal(SPIRE_CATALOG.length, 54);
  assert.equal(new Set(SPIRE_CATALOG.map((e) => e.id)).size, 54);
  assert.equal(new Set(SPIRE_CATALOG.map((e) => e.sourceId)).size, 54);
  const seen = new Set();
  for (let seed = 0; seed < 500; seed++)
    for (const [floor, act] of [
      [1, 1],
      [4, 2],
      [7, 3],
    ]) {
      const run = enterAdventureNode(
        { ...newAdventure(3, seed), floor },
        `spire-crossroads-${act}`,
      );
      seen.add(run.spireEvent!.id);
      assert.ok([0, act].includes(getSpireEvent(run.spireEvent!.id)!.act));
      roundtrip(run);
    }
  assert.equal(seen.size, 54);
  for (const event of SPIRE_CATALOG)
    assert.ok(
      event.choices.length && event.text.length > 20 && event.sourceName,
    );
});
for (const size of [3, 4] as const)
  test(`every available event branch resolves without mutating its input and saves on ${size}×${size}`, () => {
    for (const event of SPIRE_CATALOG)
      for (const [index, choice] of event.choices.entries()) {
        const run = encounter(event.id, size, choice.at || 0);
        const candidates = spireCandidates(run, choice),
          snapshot = JSON.stringify(run);
        const reason = spireChoiceReason(run, choice);
        assert.equal(reason, "", `${event.id} ${choice.label}: ${reason}`);
        const next = resolveAdventureEvent(
          run,
          `choice:${index}`,
          choice.select ? candidates[0].id : undefined,
          choice.select === "two-cards" ? candidates[1].id : undefined,
        );
        assert.equal(
          JSON.stringify(run),
          snapshot,
          `${event.id} input mutated`,
        );
        roundtrip(next);
        if (next.phase === "battle") {
          const won = win(next);
          roundtrip(won);
          assert.ok(won.lives > 0);
        }
      }
  });
test("transformation keeps deck identity, increases keyword odds, reaches every count from zero through five, and never duplicates assignments", () => {
  const counts = new Set<number>();
  let withKeywords = 0;
  for (let seed = 0; seed < 600; seed++) {
    const run = newAdventure(3, seed),
      old = run.inventory[0],
      next = transformAdventureCards(run, [old.id], 3),
      card = next.inventory[0];
    assert.equal(card.id, old.id);
    assert.deepEqual(next.deck, run.deck);
    assert.ok(validateStone(card));
    assert.ok(validateKeywords(card.keywords));
    assert.ok(card.keywords!.length <= 5);
    assert.equal(
      new Set(card.keywords!.map((keyword) => keyword.type)).size,
      card.keywords!.length,
    );
    counts.add(card.keywords!.length);
    if (card.keywords!.length) withKeywords++;
    assert.deepEqual(transformAdventureCards(run, [old.id], 3), next);
    const quill = transformAdventureCards(
      { ...run, relics: ["runesmiths-quill"] },
      [old.id],
      3,
    );
    assert.ok(quill.inventory[0].keywords!.length >= 1);
  }
  assert.deepEqual([...counts].sort(), [0, 1, 2, 3, 4, 5]);
  assert.ok(withKeywords > 500 && withKeywords < 590);
  assert.throws(() => transformAdventureCards(newAdventure(3, 1), ["missing"]));
});
test("Spire Crossroads do not repeat an event within the run; multi-stage and repeat trades preserve state through reload", () => {
  const skull = encounter("knowing-skull"),
    first = resolveAdventureEvent(skull, "choice:0"),
    second = resolveAdventureEvent(first, "choice:0");
  assert.equal(second.spireEvent!.visits, 2);
  assert.equal(second.lives, 3);
  assert.equal(second.floor, 4);
  roundtrip(second);
  const idol = resolveAdventureEvent(encounter("golden-idol"), "choice:0");
  assert.equal(idol.spireEvent!.stage, 1);
  roundtrip(idol);
  assert.throws(() => resolveAdventureEvent(idol, "choice:0"));
  assert.equal(resolveAdventureEvent(idol, "choice:1").floor, 2);
  const run = {
    ...newAdventure(3, 9),
    floor: 7,
    seenSpireEvents: SPIRE_CATALOG.filter((e) => e.act === 0 || e.act === 3)
      .slice(0, -1)
      .map((e) => e.id),
  };
  const next = enterAdventureNode(run, "spire-crossroads-3");
  assert.ok(!run.seenSpireEvents.includes(next.spireEvent!.id));
});
test("curses replace normal hand slots with zero-pip stones and purification restores those slots", () => {
  const run = { ...newAdventure(4, 21), curses: ["Doubt", "Pain"] };
  const battle = enterAdventureNode(run, "moss");
  assert.equal(
    battle.battle!.hands[0].filter((card) =>
      card.id.startsWith("custom-curse-"),
    ).length,
    2,
  );
  assert.deepEqual(battle.deck, run.deck);
  assert.equal(battle.battle!.hands[0].length, 8);
  roundtrip(battle);
  const clean = resolveAdventureEvent(
    { ...encounter("fountain", 4), curses: run.curses },
    "choice:0",
  );
  assert.deepEqual(clean.curses, []);
  const next = enterAdventureNode({ ...clean, floor: 6 }, "sentinel");
  assert.ok(
    next.battle!.hands[0].every((card) => !card.id.startsWith("custom-curse-")),
  );
  roundtrip(next);
});
test("the matching event saves revealed pairs, awards each matched card only once and limits attempts", () => {
  let run = resolveAdventureEvent(encounter("match-keep"), "choice:0");
  const cards = adventureSpireMemoryCards(run),
    a = 0,
    b = cards.findIndex(
      (card, index) => index !== a && card.id === cards[a].id,
    ),
    before = JSON.stringify(run);
  const first = resolveAdventureEvent(run, `match:${a}`);
  assert.equal(JSON.stringify(run), before);
  roundtrip(first);
  run = resolveAdventureEvent(first, `match:${b}`);
  assert.equal(run.spireEvent!.matched!.length, 2);
  assert.equal(run.spireEvent!.attempts, 1);
  roundtrip(run);
  assert.throws(() => resolveAdventureEvent(run, `match:${a}`));
  const curseIndexes = cards.flatMap((card, index) =>
    card.id.startsWith("custom-curse") &&
    !run.spireEvent!.matched!.includes(index)
      ? [index]
      : [],
  );
  if (curseIndexes.length === 2) {
    run = resolveAdventureEvent(run, `match:${curseIndexes[0]}`);
    run = resolveAdventureEvent(run, `match:${curseIndexes[1]}`);
    assert.ok(run.curses!.includes("Doubt"));
  }
});
test("Mind Bloom blocks life restoration and revival while pip repair remains usable; event life caps stay valid", () => {
  const bloom = resolveAdventureEvent(encounter("mind-bloom"), "choice:1");
  assert.equal(bloom.healingLocked, true);
  assert.throws(() =>
    useAdventurePotion({ ...bloom, lives: 1, potions: ["heal"] }, 0),
  );
  const fish = resolveAdventureEvent(encounter("big-fish"), "choice:1");
  assert.equal(maxLives(fish), 6);
  roundtrip(fish);
  const vampires = resolveAdventureEvent(encounter("vampires"), "choice:0");
  assert.equal(maxLives(vampires), 4);
  roundtrip(vampires);
});
test("Colosseum resumes after the warm-up and awards the main-event relics only on victory", () => {
  let run = resolveAdventureEvent(encounter("colosseum"), "choice:0");
  assert.equal(run.phase, "battle");
  run = win(run);
  assert.equal(run.phase, "event");
  assert.equal(run.spireEvent!.stage, 1);
  roundtrip(run);
  const before = run.relics!.length;
  run = resolveAdventureEvent(run, "choice:1");
  run = win(run);
  assert.equal(run.relics!.length, before + 2);
  roundtrip(run);
});
test("the note exchanges a stone, keeps deck slots and can be carried into a new run", () => {
  const run = encounter("note"),
    given = run.inventory[0],
    next = resolveAdventureEvent(run, "choice:0", given.id);
  assert.deepEqual(next.note, given);
  assert.equal(next.inventory[0].id, given.id);
  assert.deepEqual(next.deck, run.deck);
  roundtrip(next);
  const fresh = newAdventure(3, 99, next.note);
  assert.deepEqual(fresh.note, given);
  roundtrip(fresh);
});
test("malformed encounter saves, unknown curses and invalid transformation selections are rejected", () => {
  const run = encounter("living-wall");
  assert.equal(
    validateAdventure({
      ...run,
      spireEvent: { id: "unknown", stage: 0, visits: 0 },
    }),
    false,
  );
  assert.equal(
    validSpireState({
      id: "match-keep",
      stage: 10,
      visits: 0,
      matched: [0, 0],
    }),
    false,
  );
  assert.equal(validateAdventure({ ...run, curses: ["unknown"] }), false);
  assert.equal(validateAdventure({ ...run, maxLifeBonus: 1.1 }), false);
  assert.throws(() => resolveAdventureEvent(run, "choice:1", "missing"));
  assert.throws(() => resolveAdventureEvent(run, "choice:100"));
});
test("event source IDs cover every reference entry except navigation, plus the opening blessing", async () => {
  const { readFile } = await import("node:fs/promises");
  const reference = JSON.parse(
    await readFile(
      new URL("./fixtures/spire-event-reference.json", import.meta.url),
      "utf8",
    ),
  );
  const expected = [
    ...reference.reference_ids.filter(
      (id: string) => !reference.excluded.includes(id),
    ),
    ...reference.additional,
  ].sort();
  assert.deepEqual(
    SPIRE_CATALOG.map((event) => event.sourceId).sort(),
    expected,
  );
});
