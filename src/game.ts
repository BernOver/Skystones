import { trapEdges, trapBonus, withTrap, boardTrap } from "./traps.ts";
import type { Trap } from "./traps.ts";
import { amplifyPlan, validRuntimeEffects } from "./amplify.ts";
import type { AmplifyKeyword, AmplifyQueue, AmplifySpent } from "./amplify.ts";
import { CHARACTER_STONES, CHARACTER_PORTRAITS } from "./characters.ts";
import {
  boardEnvironments,
  environmentEdges,
  environmentAttack,
  environmentDefense,
  nextPipModifiers,
  pendingPipEffects,
  nextEffectMatches,
  adjacentTile,
  wrappedTile,
  validateEnvironment,
  validEffectSide,
  validPipAmount,
  withTileEnvironments,
  underlyingSide,
} from "./effects.ts";
import type { EffectSide, QueuedPips, TileEnvironment } from "./effects.ts";
import {
  hasTribe,
  stoneTribes,
  sharedTribes,
  validTribe,
  validateTribes,
} from "./tribes.ts";
import type { Tribe, ComboCondition } from "./tribes.ts";
import { validateConjure, MAX_HAND_CARDS } from "./conjure.ts";
import type { ConjureKeyword, Conjuration } from "./conjure.ts";
import { validDiscardKeyword, validDiscardBuffs } from "./discard.ts";
import type { DiscardKeyword, DiscardBuffs, DiscardRecord } from "./discard.ts";
import { validSwapParts } from "./swapForce.ts";
import type { SwapHalf, SwapParts } from "./swapForce.ts";
export type Element =
  | "fire"
  | "life"
  | "water"
  | "air"
  | "magic"
  | "earth"
  | "tech"
  | "undead"
  | "light"
  | "dark"
  | "neutral";
export type Creature =
  | "dragon"
  | "turtle"
  | "whale"
  | "owl"
  | "fox"
  | "golem"
  | "mushroom"
  | "cat"
  | "slime"
  | "bat"
  | "spider"
  | "robot"
  | "griffin"
  | "crab"
  | "serpent"
  | "chest";
export type BoardSize = 3 | 4;
export type Owner = 0 | 1;
export type Edges = [number, number, number, number]; // North, east, south, west.
export type Side = 0 | 1 | 2 | 3;
export type KeywordType =
  | "head-start"
  | "comeback"
  | "resonance"
  | "sunder"
  | "silence"
  | "dizzy"
  | "shield"
  | "combo"
  | "next-play"
  | "environment"
  | "conjure"
  | "shift"
  | "discard"
  | "scavenge"
  | "parting-gift"
  | "discard-priority"
  | "assemble"
  | "flash"
  | "amplify";
export type ShiftKeyword = {
  type: "shift";
  side: Side;
  direction: Side;
  affects: "enemies" | "allies" | "both";
};
export type TargetKeyword =
  | { type: "sunder"; side: Side | "any"; amount?: number }
  | { type: "silence" };
export type BasicKeyword =
  | { type: "assemble"; count: number }
  | { type: "flash" }
  | AmplifyKeyword
  | { type: "head-start" | "comeback"; side: Side; amount?: number }
  | { type: "resonance"; side: Side; element: Element; tribe?: Tribe }
  | { type: "dizzy"; sides?: Side[] }
  | { type: "shield"; side: Side; amount?: number }
  | {
      type: "next-play";
      side: EffectSide;
      amount: number;
      recipient: "self" | "opponent";
      tribe?: Tribe;
      element?: Element;
      changeElement?: Element;
      keywords?: StoneKeyword[];
    }
  | ShiftKeyword
  | { type: "environment"; environment: TileEnvironment }
  | ConjureKeyword
  | DiscardKeyword
  | TargetKeyword;
export type ComboKeyword = {
  type: "combo";
  pips?: { side: Side; amount: number }[];
  keywords?: BasicKeyword[];
  condition?: ComboCondition;
  tribe?: Tribe;
};
export type StoneKeyword = (BasicKeyword | ComboKeyword) & { half?: SwapHalf };
export type ActiveKeyword =
  | { type: "head-start" | "comeback"; side: Side; amount?: number }
  | {
      type: "resonance";
      side: Side;
      element: Element;
      bonus: number;
      tribe?: Tribe;
    };
export interface KeywordTarget {
  keywordIndex: number;
  boardIndex: number;
  side?: Side;
}
export type TargetEffect =
  | {
      type: "shift";
      target: number;
      to: number;
      side: Side;
      direction: Side;
      affects: "enemies" | "allies" | "both";
      keywordIndex: number;
      moved: boolean;
      reason?: "no-target" | "blocked";
    }
  | {
      type: "sunder";
      keywordIndex?: number;
      side: Side;
      target: number;
      flexible?: true;
      amount?: number;
    }
  | { type: "silence"; target: number; keywordIndex?: number }
  | {
      type: "environment";
      target: number;
      keywordIndex: number;
      environment: TileEnvironment;
    };
export const SIDE_NAMES = ["North", "East", "South", "West"] as const;
export const SIDE_LETTERS = ["N", "E", "S", "W"] as const;
export const KEYWORD_RULES = {
  assemble: {
    name: "Assemble",
    condition: "generate Parts; pairs build a Supercharger",
  },
  flash: { name: "Flash", condition: "play without ending your turn" },
  amplify: {
    name: "Amplify",
    condition: "double an effect: always or next uses",
  },
  "head-start": { name: "Head Start", condition: "winning" },
  comeback: { name: "Comeback", condition: "losing" },
  resonance: { name: "Resonance", condition: "element or tribe count" },
  sunder: { name: "Sunder", condition: "on play" },
  silence: { name: "Silence", condition: "on play" },
  dizzy: { name: "Dizzy", condition: "before captures" },
  shield: { name: "Shield", condition: "defense only" },
  combo: { name: "Combo", condition: "previous card match" },
  "next-play": {
    name: "Next Play",
    condition: "queue pips, keywords, or an element",
  },
  environment: { name: "Environment", condition: "choose any tile" },
  conjure: { name: "Conjure", condition: "add cards to a hand" },
  shift: { name: "Shift", condition: "move the printed-side neighbor" },
  discard: { name: "Discard", condition: "after captures and Conjure" },
  scavenge: { name: "Scavenge", condition: "gain buffs from discards" },
  "parting-gift": {
    name: "Parting Gift",
    condition: "buff allies when discarded",
  },
  "discard-priority": {
    name: "Discard Priority",
    condition: "random discards select first",
  },
} as const;
export const MAX_KEYWORDS = 24;
export const MAX_RUNTIME_KEYWORDS = 128;
export const MAX_KEYWORD_DEPTH = 3;
export const DIZZY_EDGE_CAP = 5;
export function keywordKey(keyword: StoneKeyword): string {
  return keyword.type === "assemble" ||
    keyword.type === "flash" ||
    keyword.type === "amplify" ||
    keyword.type === "silence" ||
    keyword.type === "dizzy" ||
    keyword.type === "combo" ||
    keyword.type === "environment" ||
    keyword.type === "conjure" ||
    keyword.type === "discard" ||
    keyword.type === "scavenge" ||
    keyword.type === "parting-gift" ||
    keyword.type === "discard-priority"
    ? keyword.type
    : `${keyword.type}:${keyword.side}`;
}
export function repeatableKeyword(type: KeywordType): boolean {
  return (
    type === "assemble" ||
    type === "amplify" ||
    type === "sunder" ||
    type === "next-play" ||
    type === "environment" ||
    type === "conjure" ||
    type === "discard"
  );
}
// Keep each on-play effect in printed order; only the passive edge bonuses group together.
export function keywordGroups(keywords: StoneKeyword[]) {
  return keywords.flatMap((keyword, index) => {
    if (
      keyword.type === "combo" ||
      keyword.type === "sunder" ||
      keyword.type === "silence" ||
      keyword.type === "next-play" ||
      keyword.type === "environment" ||
      keyword.type === "conjure" ||
      keyword.type === "shift" ||
      keyword.type === "discard" ||
      keyword.type === "scavenge" ||
      keyword.type === "parting-gift" ||
      keyword.type === "discard-priority"
    )
      return [
        {
          keywordIndex: index,
          type: keyword.type as KeywordType,
          keywords: [keyword] as StoneKeyword[],
        },
      ];
    if (
      keywords.findIndex((candidate) => candidate.type === keyword.type) !==
      index
    )
      return [];
    return [
      {
        keywordIndex: index,
        type: keyword.type as KeywordType,
        keywords: keywords.filter(
          (candidate) => candidate.type === keyword.type,
        ),
      },
    ];
  });
}
export interface Stone {
  id: string;
  name: string;
  element: Element;
  creature: Creature;
  edges: Edges;
  description: string;
  custom?: boolean;
  image?: string;
  origin?: "giants" | "skylanders";
  portrait?: string;
  characterKey?: string;
  defaultRevision?: number;
  keywords?: StoneKeyword[];
  baseEdges?: Edges;
  baseKeywords?: StoneKeyword[];
  tribes?: Tribe[];
  conjured?: true;
  token?: true;
  unique?: true;
  part?: true;
  supercharger?: { parts: [string, string] };
  runtimeEffects?: true;
  encounterStart?: true;
  receivedKeywords?: StoneKeyword[];
  receivedElement?: { before: Element; after: Element };
  discardBuffs?: DiscardBuffs;
  swapParts?: SwapParts;
}
export interface PlacedStone {
  trap?: Trap;
  history?: PlacedStone[];
  resolvedEffects?: BasicKeyword[];
  queuedAmplify?: AmplifyQueue[];
  amplifySpent?: AmplifySpent[];
  stone: Stone;
  owner: Owner;
  playedBy?: Owner;
  edges?: Edges;
  activeKeywords?: ActiveKeyword[];
  silenced?: boolean;
  reductions?: Edges;
  effects?: TargetEffect[];
  dizzy?: {
    before: Edges;
    after: Edges;
    sides?: Side[];
    timing?: "before-captures";
  };
  shields?: Edges;
  grantedKeywords?: BasicKeyword[];
  comboActive?: boolean;
  comboStates?: boolean[];
  comboPrevious?: Element;
  comboPreviousTribes?: Tribe[];
  playedOrder?: number;
  // Element submitted from the hand, before Next Play changes it.
  playedElement?: Element;
  arenaElement?: Element;
  queuedPips?: QueuedPips[];
  inheritedPips?: Edges;
  environment?: TileEnvironment;
  conjurations?: Conjuration[];
  discards?: DiscardRecord[];
  discardBuffs?: DiscardBuffs;
}
export type Board = (PlacedStone | null)[];
export interface Move {
  keepsTurn?: boolean;
  board: Board;
  captured: number[];
  effects: TargetEffect[];
}

export const ELEMENTS: Record<
  Element,
  { name: string; color: string; pale: string; ink: string }
> = {
  fire: { name: "Fire", color: "#de7549", pale: "#f7dfc6", ink: "#92442f" },
  life: { name: "Life", color: "#6c9877", pale: "#e0e8c9", ink: "#3e6550" },
  water: { name: "Water", color: "#68a4b1", pale: "#d5e8e5", ink: "#366b7b" },
  air: { name: "Air", color: "#a2a7be", pale: "#e4e5ed", ink: "#696783" },
  magic: { name: "Magic", color: "#a08aaa", pale: "#e9dfea", ink: "#795780" },
  earth: { name: "Earth", color: "#b69a6a", pale: "#e9dfc7", ink: "#7b633c" },
  tech: { name: "Tech", color: "#c69d49", pale: "#f2e5bb", ink: "#896520" },
  undead: { name: "Undead", color: "#9a8fa5", pale: "#e8e0ee", ink: "#65536f" },
  light: { name: "Light", color: "#d5b65d", pale: "#fff3cf", ink: "#816522" },
  dark: { name: "Dark", color: "#74728f", pale: "#e5e2f2", ink: "#4e466c" },
  neutral: {
    name: "Neutral",
    color: "#a5a38c",
    pale: "#eeead9",
    ink: "#78735c",
  },
};

export const STARTER_STONES: Stone[] = CHARACTER_STONES.slice(0, 12);
export const DEFAULT_DECK = STARTER_STONES.slice(0, 5).map((s) => s.id);
export const EMPTY_BOARD = (size: BoardSize = 3): Board =>
  Array.from({ length: size * size }, () => null);
export const boardSize = (board: Board): BoardSize =>
  board.length === 16 ? 4 : 3;
export const handSize = (size: BoardSize): number => (size === 4 ? 8 : 5);
export const coordinate = (index: number, size: BoardSize = 3): string =>
  `${String.fromCharCode(65 + Math.floor(index / size))}${(index % size) + 1}`;
export const COORDINATES = [
  "A1",
  "A2",
  "A3",
  "B1",
  "B2",
  "B3",
  "C1",
  "C2",
  "C3",
];

export function withNextKeywords(
  stone: Stone,
  board: Board,
  owner: Owner,
): Stone {
  if (
    stone.receivedKeywords?.length ||
    stone.receivedElement ||
    !playHistory(board).some((cell) =>
      cell?.queuedPips?.some(
        (effect) => effect.keywords?.length || effect.changeElement,
      ),
    )
  )
    return stone;
  const matching = pendingPipEffects(board, owner).filter((effect) =>
    nextEffectMatches(effect, stone),
  );
  const granted = matching.flatMap((effect) => effect.keywords || []);
  const element = matching.reduce<Element | undefined>(
    (value, effect) => effect.changeElement || value,
    undefined,
  );
  if (!granted.length && !element) return stone;
  const runtime =
    !!stone.runtimeEffects || granted.some((k) => !validateKeywords([k]));
  const { keywords, added: received } = mergeKeywordGrants(
    stone.keywords || [],
    granted,
    runtime,
  );
  return received.length || element
    ? {
        ...stone,
        keywords,
        ...(runtime ? { runtimeEffects: true as const } : {}),
        ...(received.length ? { receivedKeywords: received } : {}),
        ...(element
          ? {
              element,
              receivedElement: { before: stone.element, after: element },
            }
          : {}),
      }
    : stone;
}

export function mergeKeywordGrants(
  existing: readonly StoneKeyword[],
  grants: readonly StoneKeyword[],
  runtime = false,
) {
  const keywords = [...existing],
    added: StoneKeyword[] = [];
  for (const keyword of grants) {
    if (keywords.length >= (runtime ? MAX_RUNTIME_KEYWORDS : MAX_KEYWORDS))
      break;
    if (
      !runtime &&
      !repeatableKeyword(keyword.type) &&
      keywords.some((old) => keywordKey(old) === keywordKey(keyword))
    )
      continue;
    if (
      !(runtime
        ? validRuntimeEffects([...keywords, keyword])
        : validateKeywords([...keywords, keyword]))
    )
      continue;
    const copy = structuredClone(keyword);
    keywords.push(copy);
    added.push(copy);
  }
  return { keywords, added };
}

// This result is computed before placement and retained on the placed stone.
export function previousElement(
  board: Board,
  player: Owner,
): Element | undefined {
  return previousStone(board, player)?.element;
}
export function playHistory(board: Board): PlacedStone[] {
  return board
    .flatMap((cell) => (cell ? [...(cell.history || []), cell] : []))
    .sort((a, b) => (a.playedOrder || 0) - (b.playedOrder || 0));
}
export function previousStone(board: Board, player: Owner): Stone | undefined {
  return playHistory(board)
    .filter(
      (cell) => cell.playedBy === player && cell.playedOrder !== undefined,
    )
    .at(-1)?.stone;
}
export function comboKeywords(stone: Stone, board: Board, player: Owner) {
  stone = withNextKeywords(stone, board, player);
  const previousCard = previousStone(board, player),
    previous = previousCard?.element;
  const results = (stone.keywords || [])
    .filter((k) => k.type === "combo")
    .map((combo) => {
      const elementMatch = !!previousCard && previous === stone.element,
        condition = combo.condition || "element";
      const tribeMatch =
        !!previousCard &&
        (combo.tribe
          ? hasTribe(stone, combo.tribe) && hasTribe(previousCard, combo.tribe)
          : sharedTribes(stone, previousCard).length > 0);
      const active =
        condition === "element"
          ? elementMatch
          : condition === "tribe"
            ? tribeMatch
            : condition === "either"
              ? elementMatch || tribeMatch
              : elementMatch && tribeMatch;
      return { combo, active };
    });
  return {
    combo: results[0]?.combo,
    previous,
    active: results.some((r) => r.active),
    results,
    ...(results.some(
      (r) => r.combo.condition && r.combo.condition !== "element",
    )
      ? { previousTribes: previousCard ? [...stoneTribes(previousCard)] : [] }
      : {}),
    granted: results.flatMap((r) => (r.active ? r.combo.keywords || [] : [])),
  };
}
export function effectPlan(stone: Stone, board: Board, player?: Owner) {
  if (player !== undefined) stone = withNextKeywords(stone, board, player);
  const combo =
    player !== undefined ? comboKeywords(stone, board, player) : undefined;
  const groups = (stone.keywords || []).map((keyword) =>
    keyword.type === "combo"
      ? {
          keyword,
          active: !!combo?.results.find(
            (r) => JSON.stringify(r.combo) === JSON.stringify(keyword),
          )?.active,
        }
      : { keyword, active: true },
  );
  const plan = amplifyPlan(stone, groups, board, player);
  return { ...plan, combo };
}
export function effectiveKeywords(
  stone: Stone,
  board: Board,
  player?: Owner,
): BasicKeyword[] {
  const shifts = new Set<Side>();
  const plan = effectPlan(stone, board, player);
  return plan.effects.filter((keyword) => {
    if (keyword.type !== "shift" || stone.runtimeEffects || plan.amplified)
      return true;
    if (shifts.has(keyword.side)) return false;
    shifts.add(keyword.side);
    return true;
  });
}
export function placedKeywords(cell: PlacedStone): BasicKeyword[] {
  if (cell.silenced) return [];
  return (
    cell.resolvedEffects ||
    (cell.stone.keywords || []).flatMap((k) =>
      k.type === "combo" ? cell.grantedKeywords || [] : [k],
    )
  );
}
export function canPlace(board: Board, index: number): boolean {
  return (
    index >= 0 &&
    index < board.length &&
    (!board[index] || !!board[index]?.stone.supercharger)
  );
}
export function boardFinished(board: Board): boolean {
  return board.every((c) => !!c && !c.stone.supercharger);
}
export function finishingCard(stone: Stone): boolean {
  return !stone.part && !stone.supercharger;
}
export function playableHand(hand: Stone[]): boolean {
  return hand.some((c) => !c.part);
}
export function coverStone(board: Board, index: number, stone: Stone): Stone {
  const cell = board[index];
  if (!cell?.stone.supercharger) return stone;
  const keywords = [
    ...(stone.keywords || []),
    ...(cell.silenced ? [] : cell.stone.keywords || []).filter(
      (k) => k.type !== "flash",
    ),
  ];
  if (keywords.length > MAX_RUNTIME_KEYWORDS)
    throw new Error("This combination has too many effects.");
  return {
    ...stone,
    runtimeEffects: true,
    edges: stone.edges.map((n, s) =>
      Math.min(99, n + (cell.edges || cell.stone.edges)[s]),
    ) as Edges,
    keywords,
  };
}
export function shieldEdges(
  stone: Stone,
  silenced = false,
  granted: BasicKeyword[] = [],
): Edges {
  const shields: Edges = [0, 0, 0, 0];
  if (!silenced) {
    for (const side of [0, 1, 2, 3] as Side[])
      shields[side] += stone.discardBuffs?.shields[side] || 0;
    for (const keyword of [...(stone.keywords || []), ...granted])
      if (keyword.type === "shield")
        shields[keyword.side] += keyword.amount ?? 1;
  }
  return shields.map((n) => Math.min(198, n)) as Edges;
}
export function arenaEdges(
  edges: Edges,
  element: Element,
  active?: Element,
): Edges {
  return edges.map((edge) => edge + (active === element ? 1 : 0)) as Edges;
}
export function cardEdges(cell: PlacedStone): Edges {
  return arenaEdges(
    trapEdges(
      environmentEdges(
        cell.edges || cell.stone.edges,
        cell.stone.element,
        cell.environment,
        cell.stone,
      ),
      cell.stone,
      cell.trap,
    ),
    cell.stone.element,
    cell.arenaElement,
  );
}
export function attackEdges(cell: PlacedStone): Edges {
  const bonus = environmentAttack(cell.environment, cell.stone);
  const trap = trapBonus(cell.trap, cell.stone, "attack");
  return cardEdges(cell).map((value, s) =>
    Math.max(0, value + bonus + trap[s]),
  ) as Edges;
}
export function withArenaElement(board: Board, element: Element): Board {
  return board.map((cell) =>
    cell ? { ...cell, arenaElement: element } : null,
  );
}
export function defenseEdges(cell: PlacedStone): Edges {
  const shields = cell.silenced
    ? [0, 0, 0, 0]
    : cell.shields || shieldEdges(cell.stone, false, cell.grantedKeywords);
  const trap = trapBonus(cell.trap, cell.stone, "defense");
  return cardEdges(cell).map((edge, side) =>
    Math.max(
      0,
      edge +
        shields[side] +
        environmentDefense(cell.environment, cell.stone) +
        trap[side],
    ),
  ) as Edges;
}
export function evaluateKeywords(stone: Stone, board: Board, player: Owner) {
  stone = withNextKeywords(stone, board, player);
  const scores = score(board);
  const rival = player === 0 ? 1 : 0;
  const activeKeywords: ActiveKeyword[] = [];
  const edges = stone.edges.map(
    (edge, side) => edge + (stone.discardBuffs?.pips[side] || 0),
  ) as Edges;
  const combo = comboKeywords(stone, board, player);
  const plan = effectPlan(stone, board, player);
  for (const side of [0, 1, 2, 3] as Side[])
    edges[side] += plan.comboPips[side];
  for (const keyword of plan.effects) {
    if (keyword.type === "resonance") {
      const bonus =
        (keyword as typeof keyword & { multiplier?: number }).multiplier || 1;
      const count = board.filter(
        (cell) =>
          !!cell &&
          (keyword.tribe
            ? hasTribe(cell.stone, keyword.tribe)
            : cell.stone.element === keyword.element),
      ).length;
      if (count > 0) {
        activeKeywords.push({ ...keyword, bonus: Math.min(99, count * bonus) });
        edges[keyword.side] += count * bonus;
      }
    } else if (
      (keyword.type === "head-start" || keyword.type === "comeback") &&
      (keyword.type === "head-start"
        ? scores[player] > scores[rival]
        : scores[player] < scores[rival])
    ) {
      activeKeywords.push(keyword);
      edges[keyword.side] += keyword.amount ?? 1;
    }
  }
  const inheritedPips = nextPipModifiers(board, player, stone);
  const hasInherited = inheritedPips.some(Boolean);
  return {
    edges: edges.map((edge, side) =>
      Math.max(0, Math.min(99, edge + inheritedPips[side])),
    ) as Edges,
    ...(hasInherited ? { inheritedPips } : {}),
    activeKeywords,
    shields: shieldEdges({ ...stone, keywords: plan.effects }),
    ...(combo.combo
      ? {
          comboActive: combo.active,
          ...(combo.results.length > 1
            ? { comboStates: combo.results.map((r) => r.active) }
            : {}),
          comboPrevious: combo.previous,
          ...(combo.previousTribes
            ? { comboPreviousTribes: combo.previousTribes }
            : {}),
          grantedKeywords: combo.granted,
        }
      : {}),
  };
}

// Targeted effects resolve in printed order against cards already on the board.
// This same helper drives the picker, actual play, and computer simulations.
export function prepareTargeting(
  board: Board,
  stone: Stone,
  targets: KeywordTarget[] = [],
  owner?: Owner,
  placementIndex?: number,
) {
  if (placementIndex !== undefined)
    stone = coverStone(board, placementIndex, stone);
  if (owner !== undefined) stone = withNextKeywords(stone, board, owner);
  if (
    new Set(targets.map((choice) => choice.keywordIndex)).size !==
    targets.length
  )
    throw new Error("Choose only one target for each keyword.");
  let next = board;
  const effects: TargetEffect[] = [];
  const used = new Set<number>();
  const keywords = effectiveKeywords(stone, board, owner);
  // Repeated Sunder needs an occurrence index so inspection can distinguish
  // separate targets, including entries that had no valid target.
  const repeatedSunder = keywords.some(
    (keyword, index) =>
      keyword.type === "sunder" &&
      keywords
        .slice(0, index)
        .some((previous) => keywordKey(previous) === keywordKey(keyword)),
  );
  for (const [keywordIndex, keyword] of keywords.entries()) {
    if (keyword.type === "shift") {
      if (placementIndex === undefined || owner === undefined) continue;
      const size = boardSize(board),
        target = adjacentTile(placementIndex, keyword.side, size);
      const cell = next[target],
        to = target >= 0 ? wrappedTile(target, keyword.direction, size) : -1;
      const eligible =
        !!cell &&
        (keyword.affects === "both" ||
          (keyword.affects === "allies"
            ? cell.owner === owner
            : cell.owner !== owner));
      const moved = eligible && to !== placementIndex && !next[to];
      if (moved) {
        next = [...next];
        next[target] = null;
        next[to] = cell;
        next = withTileEnvironments(next);
      }
      effects.push({
        type: "shift",
        keywordIndex,
        target,
        to,
        side: keyword.side,
        direction: keyword.direction,
        affects: keyword.affects,
        moved,
        ...(!moved
          ? { reason: eligible ? ("blocked" as const) : ("no-target" as const) }
          : {}),
      });
      continue;
    }
    if (
      keyword.type !== "sunder" &&
      keyword.type !== "silence" &&
      keyword.type !== "environment"
    )
      continue;
    const options: KeywordTarget[] = next.flatMap((cell, boardIndex) => {
      if (keyword.type === "environment") return [{ keywordIndex, boardIndex }];
      if (!cell) return [];
      if (keyword.type === "sunder") {
        const edges = cell.edges || cell.stone.edges;
        return keyword.side === "any"
          ? ([0, 1, 2, 3] as Side[]).flatMap((side) =>
              edges[underlyingSide(cell.environment, side, cell.stone)] > 0
                ? [{ keywordIndex, boardIndex, side: side as Side }]
                : [],
            )
          : edges[underlyingSide(cell.environment, keyword.side, cell.stone)] >
              0
            ? [{ keywordIndex, boardIndex }]
            : [];
      }
      return !cell.silenced &&
        (cell.stone.keywords?.length ||
          cell.stone.discardBuffs ||
          cell.discardBuffs)
        ? [{ keywordIndex, boardIndex }]
        : [];
    });
    const candidates = [...new Set(options.map((option) => option.boardIndex))];
    const choice = targets.find(
      (target) => target.keywordIndex === keywordIndex,
    );
    if (!candidates.length) {
      if (choice) throw new Error("That keyword has no valid targets.");
      continue;
    }
    if (!choice) {
      if (targets.some((target) => !used.has(target.keywordIndex)))
        throw new Error("Choose targets in keyword order.");
      return {
        board: next,
        effects,
        pending: { keyword, keywordIndex, candidates, options },
      };
    }
    if (
      !options.some(
        (option) =>
          option.boardIndex === choice.boardIndex &&
          option.side === choice.side,
      )
    )
      throw new Error("Choose a valid card and edge already on the board.");
    used.add(keywordIndex);
    const cell = next[choice.boardIndex]!;
    if (keyword.type === "environment") {
      effects.push({
        type: "environment",
        keywordIndex,
        target: choice.boardIndex,
        environment: structuredClone(keyword.environment),
      });
      next = withTileEnvironments(
        next,
        effects.filter((effect) => effect.type === "environment"),
      );
    } else if (keyword.type === "sunder") {
      const side = keyword.side === "any" ? choice.side! : keyword.side;
      const rawSide = underlyingSide(cell.environment, side, cell.stone);
      const reductions = [...(cell.reductions || [0, 0, 0, 0])] as Edges;
      const edges = [...(cell.edges || cell.stone.edges)] as Edges;
      const removed = Math.min(keyword.amount ?? 1, edges[rawSide]);
      reductions[rawSide] += removed;
      edges[rawSide] -= removed;
      next = next.map((target, index) =>
        index === choice.boardIndex ? { ...cell, edges, reductions } : target,
      );
      effects.push({
        type: "sunder",
        ...(repeatedSunder ? { keywordIndex } : {}),
        side,
        target: choice.boardIndex,
        ...(keyword.side === "any" ? { flexible: true as const } : {}),
        ...(keyword.amount !== undefined ? { amount: removed } : {}),
      });
    } else {
      const edges = cell.stone.edges.map((base, side) =>
        Math.max(
          0,
          Math.min(99, base + (cell.inheritedPips?.[side] || 0)) -
            (cell.reductions?.[side] || 0),
        ),
      ) as Edges;
      next = next.map((target, index) =>
        index === choice.boardIndex
          ? {
              ...cell,
              edges,
              silenced: true,
              activeKeywords: [],
              shields: [0, 0, 0, 0],
              grantedKeywords: [],
            }
          : target,
      );
      effects.push({
        type: "silence",
        target: choice.boardIndex,
        ...(repeatedSunder ? { keywordIndex } : {}),
      });
    }
  }
  if (targets.some((target) => !used.has(target.keywordIndex)))
    throw new Error("Unexpected keyword target.");
  return { board: next, effects, pending: null };
}

function capturesAt(
  board: Board,
  index: number,
  owner: Owner,
  edges: Edges,
): number[] {
  const size = boardSize(board);
  const row = Math.floor(index / size),
    col = index % size;
  const neighbors = [
    row > 0 ? index - size : -1,
    col < size - 1 ? index + 1 : -1,
    row < size - 1 ? index + size : -1,
    col > 0 ? index - 1 : -1,
  ];
  return neighbors.filter((neighbor, direction) => {
    const target = board[neighbor];
    return (
      target &&
      target.owner !== owner &&
      edges[direction] > defenseEdges(target)[(direction + 2) % 4]
    );
  });
}

function placementSeed(board: Board, index: number, owner: Owner): number {
  return board.reduce(
    (value, cell, spot) =>
      Math.imul(
        value ^
          (cell
            ? (cell.edges || cell.stone.edges).reduce(
                (a, b) => a * 7 + b,
                cell.owner + 1,
              )
            : spot),
        16777619,
      ),
    Math.imul(index + 1, 2654435761) ^ (owner + 1),
  );
}

// Greedy target selection avoids an exponential search on custom cards with many effects.
export function chooseKeywordTargets(
  board: Board,
  index: number,
  stone: Stone,
  owner: Owner,
  arenaElement?: Element,
): KeywordTarget[] {
  const original = stone;
  stone = withNextKeywords(coverStone(board, index, stone), board, owner);
  const targets: KeywordTarget[] = [];
  const resolved = evaluateKeywords(stone, board, owner).edges;
  const sides = [
    ...new Set(
      effectiveKeywords(stone, board, owner).flatMap((keyword) =>
        keyword.type === "dizzy" ? dizzySides(keyword) : [],
      ),
    ),
  ];
  const edges = sides.length
    ? rollDizzy(resolved, placementSeed(board, index, owner), 0, sides)
    : resolved;
  let state = prepareTargeting(board, original, targets, owner, index);
  while (state.pending) {
    let { options } = state.pending;
    if (state.pending.keyword.type === "environment") {
      // Other empty tiles have the same immediate score. Keep one neutral
      // option, the placement tile, and every occupied tile for the reply search.
      const neutral = options.find(
        (option) => option.boardIndex !== index && !board[option.boardIndex],
      );
      options = options.filter(
        (option) =>
          option.boardIndex === index ||
          !!board[option.boardIndex] ||
          option === neutral,
      );
    }
    let best = options[0],
      bestValue = -Infinity;
    for (const option of options) {
      const preview = prepareTargeting(
        board,
        original,
        [...targets, option],
        owner,
        index,
      );
      const weakening = preview.board.reduce((sum, cell, spot) => {
        if (!cell) return sum;
        const before =
          state.board.find(
            (before) =>
              before &&
              before.stone === cell.stone &&
              before.playedOrder === cell.playedOrder,
          ) || state.board[spot];
        if (!before) return sum;
        const lost = defenseEdges(before).reduce(
          (total, edge, side) => total + edge - defenseEdges(cell)[side],
          0,
        );
        const disabled = !before.silenced && cell.silenced ? 0.2 : 0;
        return sum + (cell.owner === owner ? -1 : 1) * (lost + disabled);
      }, 0);
      const environment = boardEnvironments(
        board,
        preview.effects.filter((effect) => effect.type === "environment"),
      )[index];
      const incoming: PlacedStone = {
        stone,
        owner,
        edges,
        environment,
        trap: boardTrap(board),
        arenaElement,
      };
      const value =
        capturesAt(preview.board, index, owner, attackEdges(incoming)).length *
          10 +
        weakening +
        (option.boardIndex === index ? 0.1 : 0);
      if (value > bestValue) {
        best = option;
        bestValue = value;
      }
    }
    targets.push(best);
    state = prepareTargeting(board, original, targets, owner, index);
  }
  return targets;
}

// Redistribute once, retaining the total up to the edge ceiling.
// A seed keeps previews, AI searches, and saved expedition turns reproducible.
export function redistributePips(
  edges: Edges,
  seed: number,
  minimum = 0,
  edgeCap = DIZZY_EDGE_CAP,
): Edges {
  const total = Math.min(
    edgeCap * 4,
    edges.reduce((sum, edge) => sum + edge, 0),
  );
  const floor = Math.min(minimum, Math.floor(total / 4), edgeCap);
  const result: Edges = [floor, floor, floor, floor];
  let state = seed >>> 0 || 0x9e3779b9;
  for (let pip = floor * 4; pip < total; pip++) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    const available = result.flatMap((edge, side) =>
      edge < edgeCap ? [side] : [],
    );
    result[available[(state >>> 0) % available.length]]++;
  }
  return result;
}

export function dizzySides(keyword: { sides?: Side[] }): Side[] {
  return keyword.sides || [0, 1, 2, 3];
}
export function rollDizzy(
  edges: Edges,
  seed: number,
  minimum = 0,
  sides: readonly Side[] = [0, 1, 2, 3],
): Edges {
  let state = seed >>> 0 || 0x9e3779b9;
  const result = [...edges] as Edges;
  for (const side of sides) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    const low = Math.max(0, Math.min(DIZZY_EDGE_CAP, minimum));
    result[side] = low + ((state >>> 0) % (DIZZY_EDGE_CAP - low + 1));
  }
  return result;
}
export function stoneDizzySides(
  stone: Stone,
  granted: BasicKeyword[] = [],
): Side[] {
  return [
    ...new Set(
      [...(stone.keywords || []), ...granted].flatMap((keyword) =>
        keyword.type === "dizzy" ? dizzySides(keyword) : [],
      ),
    ),
  ];
}

export function placeStone(
  board: Board,
  index: number,
  stone: Stone,
  owner: Owner,
  targets: KeywordTarget[] = [],
  options: {
    seed?: number;
    minimumDizzyPips?: number;
    arenaElement?: Element;
    trap?: Trap;
  } = {},
): Move {
  if (stone.part)
    throw new Error(
      "Parts automatically combine in pairs; they cannot be played alone.",
    );
  if (stone.token && !stone.conjured && !stone.encounterStart)
    throw new Error("Generate this token through Conjure before playing it.");
  const original = stone;
  stone = withNextKeywords(coverStone(board, index, stone), board, owner);
  if (
    (board.length !== 9 && board.length !== 16) ||
    !Number.isInteger(index) ||
    index < 0 ||
    index >= board.length ||
    !canPlace(board, index)
  ) {
    throw new Error("Choose an empty square on the board.");
  }
  const resolved = evaluateKeywords(stone, board, owner);
  const plan = effectPlan(stone, board, owner);
  const targeted = prepareTargeting(board, original, targets, owner, index);
  if (targeted.pending)
    throw new Error("Choose a target before placing this card.");
  let next = targeted.board.map((cell) => (cell ? { ...cell } : null));
  const queuedPips: QueuedPips[] = effectiveKeywords(
    stone,
    board,
    owner,
  ).flatMap((keyword) =>
    keyword.type === "next-play"
      ? [
          {
            recipient:
              keyword.recipient === "self" ? owner : ((1 - owner) as Owner),
            side: keyword.side,
            amount: keyword.amount,
            ...(keyword.tribe ? { tribe: keyword.tribe } : {}),
            ...(keyword.element ? { element: keyword.element } : {}),
            ...(keyword.changeElement
              ? { changeElement: keyword.changeElement }
              : {}),
            ...(keyword.keywords?.length
              ? { keywords: structuredClone(keyword.keywords) }
              : {}),
          },
        ]
      : [],
  );
  const old = board[index];
  const history = old
    ? [...(old.history || []), { ...old, history: undefined }]
    : [];
  const order =
    1 + Math.max(0, ...playHistory(board).map((c) => c.playedOrder || 0));
  next[index] = {
    stone,
    ...(history.length ? { history } : {}),
    ...(plan.amplified ? { resolvedEffects: plan.effects } : {}),
    ...(plan.spent.length ? { amplifySpent: plan.spent } : {}),
    ...(plan.queues.length
      ? {
          queuedAmplify: plan.queues.map((q, i) => ({
            ...q,
            id: `${order}-${i}`,
            owner,
          })),
        }
      : {}),
    owner,
    playedBy: owner,
    playedElement: stone.receivedElement?.before || stone.element,
    playedOrder: order,
    ...resolved,
    ...(queuedPips.length ? { queuedPips } : {}),
    ...(options.arenaElement ? { arenaElement: options.arenaElement } : {}),
    ...(targeted.effects.length ? { effects: targeted.effects } : {}),
  };
  if (
    effectiveKeywords(stone, board, owner).some(
      (keyword) => keyword.type === "dizzy",
    )
  ) {
    const seed = options.seed ?? placementSeed(board, index, owner);
    const sides = [
      ...new Set(
        effectiveKeywords(stone, board, owner).flatMap((keyword) =>
          keyword.type === "dizzy" ? dizzySides(keyword) : [],
        ),
      ),
    ];
    let after = resolved.edges;
    effectiveKeywords(stone, board, owner)
      .filter((k) => k.type === "dizzy")
      .forEach((keyword, n) => {
        if (keyword.type === "dizzy")
          after = rollDizzy(
            after,
            n === 0 ? seed : seed ^ Math.imul(n, 0x9e3779b1),
            options.minimumDizzyPips,
            dizzySides(keyword),
          );
      });
    next[index] = {
      ...next[index]!,
      edges: after,
      dizzy: {
        before: resolved.edges,
        after,
        sides,
        timing: "before-captures",
      },
    };
  }
  next = withTrap(withTileEnvironments(next), options.trap || boardTrap(board));
  const captured = capturesAt(next, index, owner, attackEdges(next[index]!));
  for (const neighbor of captured)
    next[neighbor] = { ...next[neighbor]!, owner };
  if (old && old.owner !== owner) captured.push(index);
  return {
    board: next,
    captured,
    effects: targeted.effects,
    ...(plan.effects.some((k) => k.type === "flash")
      ? { keepsTurn: true }
      : {}),
  };
}

export function score(board: Board): [number, number] {
  return board.reduce<[number, number]>(
    (scores, cell) => {
      if (cell) scores[cell.owner]++;
      return scores;
    },
    [0, 0],
  );
}

// One-ply reply search makes captures and exposed edges matter without slowing a turn.
export function chooseMove(
  board: Board,
  hand: Stone[],
  rivalHand: Stone[],
  owner: Owner,
  arena: { current?: Element; next?: Element; trap?: Trap } = {},
): { index: number; cardIndex: number; targets: KeywordTarget[] } {
  let best = {
    index: -1,
    cardIndex: -1,
    targets: [] as KeywordTarget[],
    value: -Infinity,
  };
  hand.forEach((stone, cardIndex) =>
    board.forEach((_cell, index) => {
      if (!canPlace(board, index) || stone.part) return;
      const targets = chooseKeywordTargets(
        board,
        index,
        stone,
        owner,
        arena.current,
      );
      const move = placeStone(board, index, stone, owner, targets, {
        arenaElement: arena.current,
        trap: arena.trap,
      });
      const replyBoard = arena.next
        ? withArenaElement(move.board, arena.next)
        : move.board;
      let worstReply = 0;
      rivalHand.forEach((rival) =>
        replyBoard.forEach((_target, spot) => {
          if (canPlace(replyBoard, spot) && !rival.part)
            worstReply = Math.max(
              worstReply,
              placeStone(
                replyBoard,
                spot,
                rival,
                owner === 0 ? 1 : 0,
                chooseKeywordTargets(
                  replyBoard,
                  spot,
                  rival,
                  owner === 0 ? 1 : 0,
                  arena.next,
                ),
                { arenaElement: arena.next, trap: arena.trap },
              ).captured.length,
            );
        }),
      );
      const exposed = defenseEdges(replyBoard[index]!).reduce(
        (sum, edge, direction) => {
          const size = boardSize(board);
          const row = Math.floor(index / size),
            col = index % size;
          const spots = [
            row > 0 ? index - size : -1,
            col < size - 1 ? index + 1 : -1,
            row < size - 1 ? index + size : -1,
            col > 0 ? index - 1 : -1,
          ];
          return (
            sum + (spots[direction] >= 0 && !board[spots[direction]] ? edge : 0)
          );
        },
        0,
      );
      const value =
        move.captured.length * 10 -
        worstReply * 7 +
        exposed * 0.15 +
        (index === 4 ? 0.2 : 0) +
        (board.filter((cell) => !cell).length > 2
          ? effectiveKeywords(stone, board, owner).reduce(
              (value, keyword) =>
                keyword.type === "conjure"
                  ? value +
                    (keyword.recipient === "self"
                      ? Math.min(
                          keyword.count,
                          MAX_HAND_CARDS - hand.length + 1,
                        )
                      : keyword.recipient === "opponent"
                        ? -Math.min(
                            keyword.count,
                            MAX_HAND_CARDS - rivalHand.length,
                          )
                        : 0) *
                      0.3
                  : value,
              0,
            )
          : 0);
      const weakening = [
        ...new Set(move.effects.map((effect) => effect.target)),
      ].reduce((sum, target) => {
        const before = board[target]!,
          after = move.board[target]!;
        if (!before || !after) return sum;
        const lost = (before.edges || before.stone.edges).reduce(
          (total, edge, side) =>
            total + edge - (after.edges || after.stone.edges)[side],
          0,
        );
        return sum + (before.owner === owner ? -1 : 1) * (lost + 0.2);
      }, 0);
      if (value + weakening * 0.1 > best.value)
        best = { index, cardIndex, targets, value: value + weakening * 0.1 };
    }),
  );
  if (best.index < 0) throw new Error("There are no available moves.");
  return {
    index: best.index,
    cardIndex: best.cardIndex,
    targets: best.targets,
  };
}

const PORTRAIT_IDS = new Set(
  CHARACTER_PORTRAITS.map((portrait) => portrait.id),
);
export function validateStone(value: unknown): value is Stone {
  if (!value || typeof value !== "object") return false;
  const s = value as Record<string, unknown>;
  return (
    typeof s.id === "string" &&
    s.id.startsWith("custom-") &&
    typeof s.name === "string" &&
    s.name.trim().length > 0 &&
    s.name.length <=
      (s.origin === "giants" || s.origin === "skylanders" ? 40 : 24) &&
    typeof s.element === "string" &&
    Object.hasOwn(ELEMENTS, s.element) &&
    [
      "dragon",
      "turtle",
      "whale",
      "owl",
      "fox",
      "golem",
      "mushroom",
      "cat",
      "slime",
      "bat",
      "spider",
      "robot",
      "griffin",
      "crab",
      "serpent",
      "chest",
    ].includes(String(s.creature)) &&
    Array.isArray(s.edges) &&
    s.edges.length === 4 &&
    s.edges.every(
      (n) =>
        Number.isInteger(n) &&
        n >= 0 &&
        n <=
          (s.runtimeEffects === true
            ? 99
            : s.conjured === true || s.swapParts !== undefined
              ? 64
              : 5),
    ) &&
    (s.runtimeEffects === true ||
      s.conjured === true ||
      s.swapParts !== undefined ||
      s.edges.reduce((a, b) => a + b, 0) <=
        (s.origin === "giants" ? 16 : 12)) &&
    (s.portrait === undefined ||
      (typeof s.portrait === "string" && PORTRAIT_IDS.has(s.portrait))) &&
    (s.characterKey === undefined ||
      (typeof s.characterKey === "string" &&
        PORTRAIT_IDS.has(s.characterKey))) &&
    (s.defaultRevision === undefined ||
      (Number.isSafeInteger(s.defaultRevision) &&
        (s.defaultRevision as number) > 0 &&
        typeof s.characterKey === "string")) &&
    typeof s.description === "string" &&
    s.description.length <= 120 &&
    (s.tribes === undefined || validateTribes(s.tribes)) &&
    (s.conjured === undefined || s.conjured === true) &&
    (s.token === undefined || s.token === true) &&
    (s.unique === undefined || (s.unique === true && !s.token)) &&
    (s.part === undefined ||
      (s.part === true && s.token === true && !s.unique)) &&
    (s.runtimeEffects === undefined || s.runtimeEffects === true) &&
    (s.supercharger === undefined ||
      (!!s.supercharger &&
        s.runtimeEffects === true &&
        !s.part &&
        Array.isArray((s.supercharger as Stone["supercharger"])?.parts) &&
        (s.supercharger as NonNullable<Stone["supercharger"]>).parts.length ===
          2 &&
        (s.supercharger as NonNullable<Stone["supercharger"]>).parts.every(
          (n) => typeof n === "string" && n.length <= 40,
        ))) &&
    (s.encounterStart === undefined ||
      (s.encounterStart === true &&
        String(s.id).startsWith("custom-encounter-"))) &&
    (s.receivedKeywords === undefined ||
      (Array.isArray(s.receivedKeywords) &&
        s.receivedKeywords.length > 0 &&
        (s.runtimeEffects
          ? validRuntimeEffects(s.receivedKeywords)
          : validateKeywords(s.receivedKeywords)))) &&
    (s.receivedElement === undefined ||
      validReceivedElement(s.receivedElement)) &&
    (s.discardBuffs === undefined || validDiscardBuffs(s.discardBuffs)) &&
    (s.swapParts === undefined || validSwapParts(s.swapParts)) &&
    (s.keywords === undefined ||
      (s.runtimeEffects
        ? validRuntimeEffects(s.keywords)
        : validateKeywords(s.keywords))) &&
    (s.baseKeywords === undefined || validateKeywords(s.baseKeywords)) &&
    (s.baseEdges === undefined ||
      (Array.isArray(s.baseEdges) &&
        s.baseEdges.length === 4 &&
        s.baseEdges.every((n) => Number.isInteger(n) && n >= 0 && n <= 5))) &&
    (s.image === undefined ||
      (typeof s.image === "string" &&
        /^data:image\/(png|jpeg|webp);base64,/.test(s.image) &&
        s.image.length < 3_000_000))
  );
}

export function validReceivedElement(
  value: unknown,
): value is NonNullable<Stone["receivedElement"]> {
  if (!value || typeof value !== "object") return false;
  const change = value as Stone["receivedElement"];
  return (
    typeof change?.before === "string" &&
    Object.hasOwn(ELEMENTS, change.before) &&
    typeof change.after === "string" &&
    Object.hasOwn(ELEMENTS, change.after)
  );
}

export function validateKeywords(
  value: unknown,
  depth = 0,
  runtime = false,
): value is StoneKeyword[] {
  if (
    depth > MAX_KEYWORD_DEPTH ||
    !Array.isArray(value) ||
    value.length > (runtime ? MAX_RUNTIME_KEYWORDS : MAX_KEYWORDS)
  )
    return false;
  const seen = new Set<string>();
  return value.every((keyword) => {
    if (
      !keyword ||
      typeof keyword !== "object" ||
      typeof keyword.type !== "string" ||
      !Object.hasOwn(KEYWORD_RULES, keyword.type)
    )
      return false;
    if (keyword.half !== undefined && !["top", "bottom"].includes(keyword.half))
      return false;
    if (
      keyword.type === "assemble" ||
      keyword.type === "flash" ||
      keyword.type === "amplify" ||
      keyword.type === "silence" ||
      keyword.type === "dizzy" ||
      keyword.type === "combo" ||
      keyword.type === "environment" ||
      keyword.type === "conjure" ||
      keyword.type === "discard" ||
      keyword.type === "scavenge" ||
      keyword.type === "parting-gift" ||
      keyword.type === "discard-priority"
        ? keyword.side !== undefined
        : !(
            (keyword.type === "sunder" && keyword.side === "any") ||
            (keyword.type === "next-play" && keyword.side === "all")
          ) &&
          (!Number.isInteger(keyword.side) ||
            keyword.side < 0 ||
            keyword.side > 3)
    )
      return false;
    if (
      keyword.type === "assemble" &&
      (!Number.isInteger(keyword.count) ||
        keyword.count < 1 ||
        keyword.count > 5)
    )
      return false;
    if (
      keyword.type === "amplify" &&
      ((keyword.effect !== "all" &&
        (!Object.hasOwn(KEYWORD_RULES, keyword.effect) ||
          keyword.effect === "amplify")) ||
        !["always", "next"].includes(keyword.duration) ||
        (keyword.duration === "next"
          ? !Number.isInteger(keyword.count) ||
            keyword.count < 1 ||
            keyword.count > 5
          : keyword.count !== undefined))
    )
      return false;
    if (keyword.type === "conjure" && !validateConjure(keyword, depth))
      return false;
    if (
      ["discard", "scavenge", "parting-gift", "discard-priority"].includes(
        keyword.type,
      ) &&
      !validDiscardKeyword(keyword)
    )
      return false;
    if (
      keyword.type === "shift" &&
      (!Number.isInteger(keyword.direction) ||
        keyword.direction < 0 ||
        keyword.direction > 3 ||
        !["allies", "enemies", "both"].includes(keyword.affects))
    )
      return false;
    if (
      keyword.type === "next-play" &&
      (!validEffectSide(keyword.side) ||
        !(
          validPipAmount(keyword.amount, true) ||
          (keyword.amount === 0 &&
            (keyword.keywords?.length || keyword.changeElement))
        ) ||
        (keyword.keywords !== undefined &&
          (!Array.isArray(keyword.keywords) ||
            keyword.keywords.length < 1 ||
            keyword.keywords.length > 5 ||
            keyword.keywords.some(
              (grant: StoneKeyword) =>
                !grant ||
                grant.type === "parting-gift" ||
                grant.type === "discard-priority",
            ) ||
            !validateKeywords(keyword.keywords, depth + 1))) ||
        !["self", "opponent"].includes(keyword.recipient) ||
        (keyword.element !== undefined &&
          (typeof keyword.element !== "string" ||
            !Object.hasOwn(ELEMENTS, keyword.element))) ||
        (keyword.changeElement !== undefined &&
          (typeof keyword.changeElement !== "string" ||
            !Object.hasOwn(ELEMENTS, keyword.changeElement))))
    )
      return false;
    if (
      keyword.type === "environment" &&
      !validateEnvironment(keyword.environment)
    )
      return false;
    if (
      keyword.type === "dizzy" &&
      keyword.sides !== undefined &&
      (!Array.isArray(keyword.sides) ||
        keyword.sides.length < 1 ||
        keyword.sides.length > 4 ||
        new Set(keyword.sides).size !== keyword.sides.length ||
        !keyword.sides.every(
          (side: number) => Number.isInteger(side) && side >= 0 && side <= 3,
        ))
    )
      return false;
    if (
      keyword.type === "resonance" &&
      (typeof keyword.element !== "string" ||
        !Object.hasOwn(ELEMENTS, keyword.element))
    )
      return false;
    if (
      keyword.type === "sunder" &&
      keyword.amount !== undefined &&
      (!Number.isInteger(keyword.amount) ||
        keyword.amount < 1 ||
        keyword.amount > 99)
    )
      return false;
    if (
      (keyword.type === "shield" ||
        keyword.type === "head-start" ||
        keyword.type === "comeback") &&
      keyword.amount !== undefined &&
      (!Number.isInteger(keyword.amount) ||
        keyword.amount < 1 ||
        keyword.amount > 99)
    )
      return false;
    if (keyword.type === "combo") {
      if (
        keyword.pips !== undefined &&
        (!Array.isArray(keyword.pips) ||
          keyword.pips.length > 4 ||
          new Set(keyword.pips.map((pip: { side: number }) => pip?.side))
            .size !== keyword.pips.length ||
          !keyword.pips.every(
            (pip: { side: number; amount: number }) =>
              pip &&
              Number.isInteger(pip.side) &&
              pip.side >= 0 &&
              pip.side <= 3 &&
              Number.isInteger(pip.amount) &&
              pip.amount >= 1 &&
              pip.amount <= 5,
          ))
      )
        return false;
      // A Combo can grant ordinary keywords, never another Combo.
      if (
        keyword.keywords !== undefined &&
        (!Array.isArray(keyword.keywords) ||
          keyword.keywords.length > 5 ||
          keyword.keywords.some(
            (grant: { type: string }) =>
              !grant ||
              grant.type === "combo" ||
              grant.type === "parting-gift" ||
              grant.type === "discard-priority",
          ) ||
          !validateKeywords(keyword.keywords, depth + 1))
      )
        return false;
      if (!(keyword.pips?.length || keyword.keywords?.length)) return false;
    }
    if (
      (keyword.type === "resonance" ||
        keyword.type === "next-play" ||
        keyword.type === "combo") &&
      keyword.tribe !== undefined &&
      !validTribe(keyword.tribe)
    )
      return false;
    if (
      keyword.type === "combo" &&
      ((keyword.condition !== undefined &&
        !["element", "tribe", "either", "both"].includes(keyword.condition)) ||
        (keyword.tribe !== undefined &&
          (!keyword.condition || keyword.condition === "element")))
    )
      return false;
    const key = keywordKey(keyword);
    if (!runtime && !repeatableKeyword(keyword.type) && seen.has(key))
      return false;
    seen.add(key);
    return true;
  });
}
