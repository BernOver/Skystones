import { ELEMENTS, handSize, validateStone } from "./game.ts";
import type {
  BoardSize,
  Creature,
  Edges,
  Element,
  Owner,
  Side,
  Stone,
  StoneKeyword,
} from "./game.ts";

export const DRAFT_STORAGE = "skystones-draft-v1";
export const nominationCount = (size: BoardSize) => (size === 4 ? 9 : 6);
export const randomPoolCount = (size: BoardSize) => (size === 4 ? 6 : 3);
export interface DraftState {
  version: 1;
  seed: number;
  size: BoardSize;
  cards: Stone[];
  nominations: [string[], string[]];
  phase: "nominate" | "draft" | "ready";
  current: Owner;
  round: number;
  offered: string[];
  pool: string[];
  hands: [string[], string[]];
  discarded: string[];
  history: string[];
}
function random(seed: number) {
  let state = seed >>> 0 || 0x9e3779b9;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  };
}
function shuffle<T>(items: T[], rng: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function pipDominates(a: Stone, b: Stone): boolean {
  return (
    a.edges.every((pip, side) => pip >= b.edges[side]) &&
    a.edges.some((pip, side) => pip > b.edges[side])
  );
}
export function draftCards(seed: number): Stone[] {
  const rng = random(seed),
    candidates: Edges[] = [];
  // Positive weights make the main pool an antichain: more on one edge costs
  // strength elsewhere, while total pip counts can still vary from 6 to 12.
  for (let n = 0; n <= 4; n++)
    for (let e = 0; e <= 4; e++)
      for (let s = 0; s <= 4; s++)
        for (let w = 0; w <= 4; w++) {
          if (n + 2 * e + 3 * s + 2 * w === 18 && n + e + s + w <= 12)
            candidates.push([n, e, s, w]);
        }
  const rotation = Math.floor(rng() * 4);
  const creatures: Creature[] = [
    "slime",
    "bat",
    "fox",
    "golem",
    "turtle",
    "owl",
    "robot",
    "griffin",
    "crab",
    "serpent",
    "dragon",
    "whale",
    "mushroom",
    "cat",
    "spider",
    "chest",
  ];
  const elements = Object.keys(ELEMENTS) as Element[];
  const names = [
    "Cinder",
    "Moss",
    "Tidal",
    "Zephyr",
    "Astral",
    "Copper",
    "Moon",
    "Quartz",
    "Ember",
    "Dawn",
    "Dusk",
    "River",
    "Storm",
    "Velvet",
    "Wild",
    "Frost",
    "Amber",
    "Cloud",
    "Grove",
    "Iron",
    "Mist",
    "Solar",
    "Coral",
    "Jade",
    "Rune",
  ];
  const cards = shuffle(candidates, rng)
    .slice(0, 25)
    .map((base, index): Stone => {
      const side = Math.floor(rng() * 4) as Side,
        element = elements[Math.floor(rng() * elements.length)];
      const type = index < 6 ? index : Math.floor(rng() * 9);
      const keywords: StoneKeyword[] =
        type === 0
          ? [{ type: "head-start", side }]
          : type === 1
            ? [{ type: "comeback", side }]
            : type === 2
              ? [{ type: "resonance", side, element }]
              : type === 3
                ? [
                    {
                      type: "sunder",
                      side: rng() < 0.3 ? "any" : side,
                      amount: rng() < 0.2 ? 2 : 1,
                    },
                  ]
                : type === 4
                  ? [{ type: "silence" }]
                  : type === 5
                    ? [{ type: "dizzy" }]
                    : [];
      return {
        id: `custom-draft-${seed}-${index}`,
        name: `${names[index]} Familiar`,
        creature: creatures[Math.floor(rng() * creatures.length)],
        element,
        edges: base.map((_, side) => base[(side + rotation) % 4]) as Edges,
        keywords,
        description: "A contender from the shared draft table.",
        custom: true,
      };
    });
  // Occasional superior stones remain possible, but never overwhelm the pool.
  if (rng() < 0.3) {
    const index = Math.floor(rng() * 25),
      card = cards[index],
      edges = [...card.edges] as Edges;
    const side = edges.indexOf(Math.min(...edges));
    if (edges.reduce((a, b) => a + b, 0) < 12) {
      edges[side]++;
      const improved = { ...card, edges };
      if (
        !cards.some((other) =>
          other.edges.every((edge, i) => edge === edges[i]),
        ) &&
        cards.filter((other) => pipDominates(improved, other)).length <= 2
      )
        cards[index] = improved;
    }
  }
  return cards;
}
export function newDraft(
  size: BoardSize = 3,
  seed = Date.now() >>> 0,
): DraftState {
  return {
    version: 1,
    seed,
    size,
    cards: draftCards(seed),
    nominations: [[], []],
    phase: "nominate",
    current: 0,
    round: 0,
    offered: [],
    pool: [],
    hands: [[], []],
    discarded: [],
    history: [],
  };
}
export function nominateDraftCards(
  draft: DraftState,
  ids: string[],
): DraftState {
  if (draft.phase !== "nominate")
    throw new Error("The draft pool is already locked.");
  const taken = draft.nominations.flat();
  if (
    ids.length !== nominationCount(draft.size) ||
    new Set(ids).size !== ids.length ||
    ids.some(
      (id) => taken.includes(id) || !draft.cards.some((card) => card.id === id),
    )
  )
    throw new Error(`Choose ${nominationCount(draft.size)} available cards.`);
  const nominations: [string[], string[]] = [
    [...draft.nominations[0]],
    [...draft.nominations[1]],
  ];
  nominations[draft.current] = [...ids];
  if (draft.current === 0) return { ...draft, nominations, current: 1 };
  const rng = random(draft.seed ^ 0x85ebca6b),
    selected = nominations.flat();
  const extras = shuffle(
    draft.cards.map((card) => card.id).filter((id) => !selected.includes(id)),
    rng,
  ).slice(0, randomPoolCount(draft.size));
  const pool = shuffle([...selected, ...extras], rng);
  return {
    ...draft,
    nominations,
    phase: "draft",
    current: 0,
    offered: pool.slice(0, 3),
    pool: pool.slice(3),
  };
}
export function pickDraftCard(draft: DraftState, id: string): DraftState {
  if (draft.phase !== "draft" || !draft.offered.includes(id))
    throw new Error("Choose one of the three offered cards.");
  const hands: [string[], string[]] = [
    [...draft.hands[0]],
    [...draft.hands[1]],
  ];
  hands[draft.current].push(id);
  const offered = draft.offered.filter((candidate) => candidate !== id),
    history = [...draft.history, id];
  if (offered.length === 2)
    return {
      ...draft,
      hands,
      history,
      offered,
      current: draft.current === 0 ? 1 : 0,
    };
  const discarded = [...draft.discarded, ...offered],
    round = draft.round + 1;
  return {
    ...draft,
    hands,
    history,
    discarded,
    round,
    current: (round % 2) as Owner,
    phase: round === handSize(draft.size) ? "ready" : "draft",
    offered: draft.pool.slice(0, 3),
    pool: draft.pool.slice(3),
  };
}
// Replay only validated choices. Saved derived cards and turn counters are never trusted.
export function restoreDraft(value: unknown): DraftState | null {
  try {
    const saved = value as DraftState;
    if (
      !saved ||
      saved.version !== 1 ||
      ![3, 4].includes(saved.size) ||
      !Number.isInteger(saved.seed) ||
      saved.seed < 0 ||
      saved.seed > 0xffffffff ||
      !Array.isArray(saved.nominations) ||
      saved.nominations.length !== 2 ||
      !saved.nominations.every(Array.isArray) ||
      !Array.isArray(saved.history) ||
      saved.history.length > handSize(saved.size) * 2
    )
      return null;
    let draft = newDraft(saved.size, saved.seed);
    for (const ids of saved.nominations) {
      if (!ids.length) break;
      draft = nominateDraftCards(draft, ids);
    }
    if (!saved.nominations[0].length && saved.nominations[1].length)
      return null;
    for (const id of saved.history) draft = pickDraftCard(draft, id);
    return draft.cards.every(validateStone) ? draft : null;
  } catch {
    return null;
  }
}
