import { SPIRE_EVENTS } from "./spireEventData.ts";
import { handSize } from "./game.ts";
import type { Stone } from "./game.ts";
import type { Adventure } from "./adventure.ts";
import type { Potion } from "./potions.ts";
import { adventurePotionOffers, POTIONS } from "./potions.ts";
import {
  earnedGold,
  hasRelic,
  maxLives,
  offerRelics,
  potionCapacity,
  RELICS,
} from "./relics.ts";
import type { RelicId } from "./relics.ts";
import type { RunCardFactory } from "./transformation.ts";
export interface SpireChoice {
  label: string;
  at?: number;
  select?:
    "card" | "two-cards" | "card-or-curse" | "curse" | "relic" | "potion";
  cost?: number;
  life?: number;
  heal?: number;
  maxLife?: number;
  gold?: number;
  allGold?: boolean;
  relic?: RelicId;
  relics?: number;
  relicList?: readonly RelicId[];
  loseRelic?: RelicId;
  needRelic?: RelicId;
  needPotion?: Potion;
  needCurse?: boolean;
  needStrong?: boolean;
  curse?: string;
  curseCount?: number;
  curseChance?: number;
  cleanse?: boolean;
  potions?: number | readonly Potion[];
  sacrificeRelic?: boolean;
  sacrificePotion?: boolean;
  remove?: boolean;
  transform?: number;
  upgrade?: number;
  upgradePlain?: number;
  upgradeAll?: number;
  duplicate?: boolean;
  gainTransform?: number;
  specialCard?: string;
  repeat?: boolean;
  stage?: number;
  special?: string;
  noHealing?: boolean;
  battle?: "battle" | "elite" | "boss";
  winRelic?: RelicId;
  winRelics?: number;
  winGold?: number;
  winHeal?: number;
  continueStage?: number;
  betChance?: number;
  betGold?: number;
  cardReward?: boolean;
}
export interface SpireDefinition {
  id: string;
  sourceId: string;
  sourceName: string;
  act: number;
  text: string;
  choices: readonly SpireChoice[];
}
export const SPIRE_CATALOG: readonly SpireDefinition[] = SPIRE_EVENTS;
export const CURSE_NAMES = [
  "Regret",
  "Doubt",
  "Injury",
  "Decay",
  "Pain",
  "Shame",
  "Writhe",
  "Normality",
  "Necronomicurse",
];
export interface SpireState {
  id: string;
  stage: number;
  visits: number;
  revealed?: number[];
  matched?: number[];
  attempts?: number;
}
export interface EventSelection {
  first?: string;
  second?: string;
}
export interface SpireServices {
  card: RunCardFactory;
  transform: (run: Adventure, ids: string[], salt: number) => Adventure;
  relic: (run: Adventure, id: RelicId) => Adventure;
  potions: (run: Adventure, types: Potion[]) => Potion[];
  advance: (run: Adventure) => Adventure;
  battle: (run: Adventure, choice: SpireChoice) => Adventure;
}
export const getSpireEvent = (id: string) =>
  SPIRE_CATALOG.find((event) => event.id === id);
export function spireRoll(
  run: Pick<Adventure, "seed" | "floor">,
  salt: number,
): number {
  let n =
    run.seed ^
    Math.imul(run.floor + 1, 0x85ebca6b) ^
    Math.imul(salt + 1, 0x9e3779b1);
  n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
  n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
  return ((n ^ (n >>> 16)) >>> 0) / 0x100000000;
}
export function chooseSpireEvent(run: Adventure): SpireDefinition {
  const stop = run.floor % 9;
  const act = stop < 3 ? 1 : stop < 6 ? 2 : 3;
  const pool = SPIRE_CATALOG.filter(
    (event) =>
      (event.act === 0 || event.act === act) &&
      !run.seenSpireEvents?.includes(event.id),
  );
  return (
    pool[Math.floor(spireRoll(run, 0x73706972) * pool.length)] ||
    SPIRE_CATALOG[0]
  );
}
export function curseStone(name: string, index: number, seed: number): Stone {
  return {
    id: `custom-curse-${seed}-${index}`,
    name,
    element: "undead",
    creature: "golem",
    portrait: "hex",
    edges: [0, 0, 0, 0],
    keywords: [],
    custom: true,
    description:
      "A curse takes the place of one normal stone in each battle hand. Purify the curse to restore that slot.",
  };
}
export function spireCandidates(
  run: Adventure,
  choice: SpireChoice,
): { id: string; label: string }[] {
  const cards = run.inventory
    .filter(
      (card) =>
        !(choice.upgrade && card.edges.reduce((a, b) => a + b, 0) >= 12),
    )
    .map((card) => ({
      id: card.id,
      label: `${card.name} · ${card.edges.join("/")}`,
    }));
  const curses = (run.curses || []).map((name, index) => ({
    id: `curse:${index}`,
    label: `Curse: ${name}`,
  }));
  if (choice.select === "curse") return curses;
  if (choice.select === "card-or-curse")
    return [
      ...(choice.remove || choice.special === "bonfire"
        ? run.inventory.length > handSize(run.size)
          ? cards
          : []
        : cards),
      ...curses,
    ];
  if (choice.select === "relic")
    return (run.relics || []).map((id) => ({
      id: `relic:${id}`,
      label: RELICS[id].name,
    }));
  if (choice.select === "potion")
    return run.potions.map((id, index) => ({
      id: `potion:${index}`,
      label: POTIONS[id].name,
    }));
  return choice.remove && run.inventory.length <= handSize(run.size)
    ? []
    : cards;
}
export function spireChoiceReason(run: Adventure, c: SpireChoice): string {
  if (run.gold < (c.cost || 0)) return "Not enough gold.";
  if (run.lives <= (c.life || 0))
    return "You need enough lives to survive this cost.";
  if (c.maxLife && c.maxLife < 0 && maxLives(run) <= 1)
    return "Your maximum life cannot fall below one.";
  if (c.maxLife && c.maxLife > 0 && maxLives(run) >= 6)
    return "Maximum lives are already at six.";
  if (
    (c.needRelic && !hasRelic(run, c.needRelic)) ||
    (c.loseRelic && !hasRelic(run, c.loseRelic))
  )
    return "You do not have the required relic.";
  if (c.needPotion && !run.potions.includes(c.needPotion))
    return "You need a Healing Draught.";
  if (c.needCurse && !run.curses?.length)
    return "You have no curses to cleanse.";
  if (c.special === "ooze" && run.lives <= 1)
    return "You need another life to reach into the ooze.";
  if (
    c.needStrong &&
    !run.inventory.some((card) => Math.max(...card.edges) >= 4)
  )
    return "Requires a stone with a four-pip edge.";
  if (
    c.select &&
    spireCandidates(run, c).length < (c.select === "two-cards" ? 2 : 1)
  )
    return "No eligible cards, curses, or items. Keep enough cards for a full hand.";
  if (c.potions && run.potions.length >= potionCapacity(run))
    return "Your potion belt is full.";
  if (c.battle && run.deck.length !== handSize(run.size))
    return "Complete your expedition deck before this battle.";
  if (c.heal && run.healingLocked && !c.curse && !c.cleanse && !c.maxLife)
    return "Mind Bloom prevents healing.";
  return "";
}
function giveRelics(
  run: Adventure,
  count: number,
  salt: number,
  svc: SpireServices,
  requested?: RelicId,
): Adventure {
  let next = run;
  for (let i = 0; i < count; i++) {
    const id =
      i === 0 && requested && !hasRelic(next, requested)
        ? requested
        : offerRelics(next, 1, salt + i)[0];
    next = id
      ? svc.relic(next, id)
      : { ...next, gold: next.gold + earnedGold(next, 30) };
  }
  return next;
}
export function grantSpireRelics(
  run: Adventure,
  count: number,
  salt: number,
  svc: SpireServices,
  requested?: RelicId,
): Adventure {
  return giveRelics(run, count, salt, svc, requested);
}
function removeSelection(run: Adventure, id: string): Adventure {
  if (id.startsWith("curse:")) {
    const index = Number(id.slice(6));
    if (!run.curses?.[index]) throw new Error("Choose a current curse.");
    return { ...run, curses: run.curses.filter((_, i) => i !== index) };
  }
  if (
    run.inventory.length <= handSize(run.size) ||
    !run.inventory.some((card) => card.id === id)
  )
    throw new Error(
      "Keep a full battle hand; choose a reserve stone or a curse.",
    );
  const inventory = run.inventory.filter((card) => card.id !== id),
    deck = run.deck.filter((value) => value !== id);
  for (const card of inventory) {
    if (deck.length >= run.deck.length) break;
    if (!deck.includes(card.id)) deck.push(card.id);
  }
  return { ...run, inventory, deck };
}
function upgradeStone(stone: Stone, amount: number): Stone {
  const edges = [...stone.edges] as Stone["edges"];
  for (let n = 0; n < amount && edges.reduce((a, b) => a + b, 0) < 12; n++)
    edges[edges.indexOf(Math.min(...edges))]++;
  return { ...stone, edges };
}
export function spireMemoryCards(
  run: Adventure,
  make: RunCardFactory,
): Stone[] {
  const cards = Array.from({ length: 6 }, (_, i) =>
    i === 5
      ? curseStone("Doubt", 5, run.seed)
      : make(
          run.seed + run.floor * 131 + i * 73,
          Math.min(12, 5 + run.floor + i),
          `memory-${run.seed}-${run.floor}-${i}`,
          run.floor + 3,
        ),
  );
  const positions = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5];
  for (let i = 11; i > 0; i--) {
    const j = Math.floor(spireRoll(run, 0x6d6174 + i) * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  return positions.map((index) => cards[index]);
}
export function resolveSpireEvent(
  run: Adventure,
  action: string,
  selection: EventSelection,
  svc: SpireServices,
): Adventure {
  if (
    run.phase !== "event" ||
    !run.spireEvent ||
    !getSpireEvent(run.spireEvent.id)
  )
    throw new Error("No Spire encounter is active.");
  const state = run.spireEvent,
    event = getSpireEvent(state.id)!;
  if (action === "leave")
    return svc.advance({ ...run, message: `You leave ${event.sourceName}.` });
  if (action.startsWith("match:")) {
    if (state.stage !== 10) throw new Error("Start the matching game first.");
    const index = Number(action.slice(6)),
      matched = [...(state.matched || [])],
      attempts = state.attempts || 0;
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= 12 ||
      matched.includes(index) ||
      attempts >= 5
    )
      throw new Error("Choose a hidden card while you have attempts left.");
    const before =
      (state.revealed || []).length === 2 ? [] : state.revealed || [];
    if (before.includes(index))
      throw new Error("Choose a different hidden card.");
    const revealed = [...before, index],
      cards = spireMemoryCards(run, svc.card);
    let next = run;
    if (
      revealed.length === 2 &&
      cards[revealed[0]].id === cards[revealed[1]].id
    ) {
      matched.push(...revealed);
      const card = cards[index];
      next = card.id.startsWith("custom-curse")
        ? { ...next, curses: [...(next.curses || []), "Doubt"] }
        : { ...next, inventory: [...next.inventory, card] };
    }
    return {
      ...next,
      spireEvent: {
        ...state,
        revealed,
        matched: [...matched],
        attempts: attempts + (revealed.length === 2 ? 1 : 0),
      },
      message:
        "Matching progress saved. Keep matched stones; a matched curse joins your curses.",
    };
  }
  if (!/^choice:\d+$/.test(action))
    throw new Error("Choose an available encounter option.");
  const c = event.choices[Number(action.slice(7))];
  if (!c || (c.at || 0) !== state.stage)
    throw new Error("That choice is not available at this stage.");
  const reason = spireChoiceReason(run, c);
  if (reason) throw new Error(reason);
  const ids = [selection.first, selection.second].filter(
    (id): id is string => !!id,
  );
  if (c.select) {
    const eligible = spireCandidates(run, c).map((item) => item.id),
      count = c.select === "two-cards" ? 2 : 1;
    if (
      ids.length !== count ||
      new Set(ids).size !== count ||
      ids.some((id) => !eligible.includes(id))
    )
      throw new Error("Choose the required distinct cards or items.");
  }
  let next: Adventure = {
    ...run,
    gold: run.gold - (c.cost || 0),
    lives: run.lives - (c.life || 0),
    spireEvent: { ...state, visits: state.visits + 1 },
  };
  const salt =
    Number(action.slice(7)) * 101 + state.visits * 17 + state.stage * 53;
  if (c.allGold) next = { ...next, gold: 0 };
  if (c.loseRelic || c.sacrificeRelic) {
    const id = c.loseRelic || (ids[0].slice(6) as RelicId);
    next = {
      ...next,
      relics: (next.relics || []).filter((value) => value !== id),
      spentRelics: (next.spentRelics || []).filter((value) => value !== id),
    };
    next = {
      ...next,
      lives: Math.min(next.lives, maxLives(next)),
      potions: next.potions.slice(0, potionCapacity(next)),
    };
  }
  if (c.needPotion || c.sacrificePotion) {
    const index = c.needPotion
      ? next.potions.indexOf(c.needPotion)
      : Number(ids[0].slice(7));
    next = { ...next, potions: next.potions.filter((_, i) => i !== index) };
  }
  if (c.maxLife)
    next = { ...next, maxLifeBonus: (next.maxLifeBonus || 0) + c.maxLife };
  next = { ...next, lives: Math.min(next.lives, maxLives(next)) };
  if (c.gold) next = { ...next, gold: next.gold + earnedGold(next, c.gold) };
  if (c.heal && !next.healingLocked)
    next = { ...next, lives: Math.min(maxLives(next), next.lives + c.heal) };
  if (c.cleanse) next = { ...next, curses: [] };
  if (
    c.curse &&
    (c.curseChance === undefined || spireRoll(run, salt) * 100 < c.curseChance)
  )
    next = {
      ...next,
      curses: [
        ...(next.curses || []),
        ...Array.from({ length: c.curseCount || 1 }, () => c.curse!),
      ],
    };
  if (c.relic) next = giveRelics(next, 1, salt, svc, c.relic);
  if (c.relics) next = giveRelics(next, c.relics, salt, svc);
  for (const id of c.relicList || [])
    next = giveRelics(next, 1, salt + 3, svc, id);
  if (c.potions) {
    const types =
      typeof c.potions === "number"
        ? adventurePotionOffers(run, c.potions, salt)
        : [...c.potions];
    next = { ...next, potions: svc.potions(next, types) };
  }
  if (c.remove) next = removeSelection(next, ids[0]);
  if (c.transform) next = svc.transform(next, ids, salt);
  if (c.upgrade)
    next = {
      ...next,
      inventory: next.inventory.map((card) =>
        ids.includes(card.id) ? upgradeStone(card, c.upgrade!) : card,
      ),
    };
  if (c.upgradeAll || c.upgradePlain)
    next = {
      ...next,
      inventory: next.inventory.map((card) =>
        c.upgradeAll || !card.keywords?.length
          ? upgradeStone(card, c.upgradeAll || c.upgradePlain!)
          : card,
      ),
    };
  if (c.duplicate) {
    const old = next.inventory.find((card) => card.id === ids[0])!;
    next = {
      ...next,
      inventory: [
        ...next.inventory,
        {
          ...old,
          id: `custom-duplicate-${run.seed}-${run.floor}-${state.visits}`,
          keywords: old.keywords?.map((keyword) => ({ ...keyword })),
        },
      ],
    };
  }
  if (c.gainTransform || c.specialCard) {
    const amount = c.gainTransform || 1;
    for (let i = 0; i < amount; i++) {
      const stone = svc.card(
        run.seed + salt + i * 83,
        Math.min(12, 6 + run.floor),
        `event-${run.seed}-${run.floor}-${state.visits}-${i}`,
        run.floor + 3,
      );
      if (c.specialCard) {
        stone.name =
          c.specialCard === "cult" ? "Ritual Familiar" : "Vampire Familiar";
        stone.keywords = [
          { type: "comeback", side: 0 },
          { type: "head-start", side: 2 },
        ];
      }
      next = { ...next, inventory: [...next.inventory, stone] };
      if (c.gainTransform) next = svc.transform(next, [stone.id], salt + i);
    }
  }
  if (c.noHealing) next = { ...next, healingLocked: true };
  if (c.betChance !== undefined && spireRoll(run, salt) * 100 < c.betChance)
    next = { ...next, gold: next.gold + earnedGold(next, c.betGold || 0) };
  if (c.special === "designer") {
    next = removeSelection(next, ids[0]);
    next = {
      ...next,
      inventory: next.inventory.map((card) =>
        card.id === ids[1] ? upgradeStone(card, 2) : card,
      ),
    };
  }
  if (c.special === "note") {
    const given = next.inventory.find((card) => card.id === ids[0])!,
      received = next.note || svc.card(144, 6, "first-note", 1);
    next = {
      ...next,
      note: { ...given },
      inventory: next.inventory.map((card) =>
        card.id === given.id ? { ...received, id: given.id } : card,
      ),
    };
  }
  if (c.special === "bonfire") {
    const old = run.inventory.find((card) => card.id === ids[0]),
      quality = old?.edges.reduce((a, b) => a + b, 0) || 0;
    next = removeSelection(next, ids[0]);
    if (!next.healingLocked)
      next = {
        ...next,
        lives: Math.min(
          maxLives(next),
          next.lives + (quality >= 8 ? 9 : quality >= 5 ? 2 : 1),
        ),
      };
    if (quality >= 8) next = giveRelics(next, 1, salt, svc);
  }
  if (c.special === "match")
    return {
      ...next,
      spireEvent: {
        ...next.spireEvent!,
        stage: 10,
        revealed: [],
        matched: [],
        attempts: 0,
      },
      message: "Find matching pairs. You have five attempts.",
    };
  if (c.special === "wheel") {
    const outcome = Math.floor(spireRoll(run, salt) * 6);
    if (outcome === 0)
      next = { ...next, gold: next.gold + earnedGold(next, 80) };
    if (outcome === 1 && !next.healingLocked)
      next = { ...next, lives: maxLives(next) };
    if (outcome === 2) next = giveRelics(next, 1, salt, svc);
    if (outcome === 3)
      next = { ...next, curses: [...(next.curses || []), "Decay"] };
    if (outcome === 4) next = { ...next, lives: Math.max(0, next.lives - 1) };
    if (outcome === 5)
      next = next.curses?.length
        ? { ...next, curses: next.curses.slice(1) }
        : next.inventory.length > handSize(next.size)
          ? removeSelection(next, next.inventory[0].id)
          : { ...next, gold: next.gold + earnedGold(next, 30) };
  }
  if (c.special === "ooze") {
    if (next.lives <= 1)
      throw new Error("You need another life to reach into the ooze.");
    next = { ...next, lives: next.lives - 1 };
    if (spireRoll(run, salt) < Math.min(1, 0.25 + state.visits * 0.15))
      return svc.advance(
        giveRelics(
          { ...next, message: "The scrap releases a relic." },
          1,
          salt,
          svc,
        ),
      );
    return {
      ...next,
      message:
        "The relic is still trapped. The next attempt has a better chance.",
    };
  }
  if (c.special === "search") {
    next = { ...next, gold: next.gold + earnedGold(next, 20) };
    if (spireRoll(run, salt) < Math.min(1, 0.25 + state.visits * 0.25))
      return svc.battle(next, {
        label: "Ambush",
        battle: "elite",
        winRelics: 1,
        winGold: 30,
      });
    return {
      ...next,
      message: "You found 20 gold. Searching again increases the ambush risk.",
    };
  }
  if (c.battle) return svc.battle(next, c);
  if (c.cardReward)
    return {
      ...next,
      phase: "reward",
      rewards: Array.from({ length: 3 }, (_, i) =>
        svc.card(
          run.seed + salt + i * 37,
          Math.min(12, 6 + run.floor),
          `library-${run.seed}-${run.floor}-${i}`,
          run.floor + 3,
        ),
      ),
      rewardPicksRemaining: 1,
      relicOffers: [],
      message: "Choose a stone from the archive.",
    };
  const changes: string[] = [];
  if (next.gold !== run.gold)
    changes.push(
      `Gold ${next.gold > run.gold ? "+" : ""}${next.gold - run.gold}`,
    );
  if (next.lives !== run.lives)
    changes.push(
      `Lives ${next.lives > run.lives ? "+" : ""}${next.lives - run.lives}`,
    );
  const newRelics = (next.relics || []).filter(
    (id) => !run.relics?.includes(id),
  );
  if (newRelics.length)
    changes.push(
      `Relics: ${newRelics.map((id) => RELICS[id].name).join(", ")}`,
    );
  if ((next.curses?.length || 0) > (run.curses?.length || 0))
    changes.push(
      `Curse: ${next.curses!.slice(run.curses?.length || 0).join(", ")}`,
    );
  if ((next.curses?.length || 0) < (run.curses?.length || 0))
    changes.push("Curses purified");
  if (next.inventory.length !== run.inventory.length)
    changes.push(
      `Pack ${next.inventory.length > run.inventory.length ? "+" : ""}${next.inventory.length - run.inventory.length} stones`,
    );
  next = {
    ...next,
    message: `${event.sourceName}: ${c.label}. ${changes.join(" · ")}`,
  };
  if (next.lives === 0) return { ...next, phase: "ended", victory: false };
  if (c.stage !== undefined)
    return { ...next, spireEvent: { ...next.spireEvent!, stage: c.stage } };
  return c.repeat ? next : svc.advance(next);
}
export function validSpireState(value: unknown): value is SpireState {
  if (!value || typeof value !== "object") return false;
  const s = value as SpireState;
  return (
    !!getSpireEvent(s.id) &&
    Number.isInteger(s.stage) &&
    [
      ...new Set(getSpireEvent(s.id)!.choices.map((choice) => choice.at || 0)),
      ...(s.id === "match-keep" ? [10] : []),
    ].includes(s.stage) &&
    Number.isInteger(s.visits) &&
    s.visits >= 0 &&
    s.visits <= 100 &&
    (s.attempts === undefined ||
      (Number.isInteger(s.attempts) && s.attempts >= 0 && s.attempts <= 5)) &&
    (s.matched?.length || 0) % 2 === 0 &&
    (s.matched?.length || 0) <= 2 * (s.attempts || 0) &&
    [s.revealed, s.matched].every(
      (list) =>
        list === undefined ||
        (Array.isArray(list) &&
          list.length <= (list === s.revealed ? 2 : 12) &&
          new Set(list).size === list.length &&
          list.every((i) => Number.isInteger(i) && i >= 0 && i < 12)),
    )
  );
}
