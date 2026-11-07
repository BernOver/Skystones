import { CHARACTER_STONES, CHARACTER_PORTRAITS } from "./characters.ts";
import {
  boardEnvironments,
  environmentEdges,
  environmentAttack,
  environmentDefense,
  nextPipModifiers,
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
  | "environment";
export type TargetKeyword =
  { type: "sunder"; side: Side | "any"; amount?: number } | { type: "silence" };
export type BasicKeyword =
  | { type: "head-start" | "comeback"; side: Side }
  | { type: "resonance"; side: Side; element: Element; tribe?: Tribe }
  | { type: "dizzy"; sides?: Side[] }
  | { type: "shield"; side: Side; amount?: number }
  | {
      type: "next-play";
      side: EffectSide;
      amount: number;
      recipient: "self" | "opponent";
      tribe?: Tribe;
    }
  | { type: "environment"; environment: TileEnvironment }
  | TargetKeyword;
export type ComboKeyword = {
  type: "combo";
  pips?: { side: Side; amount: number }[];
  keywords?: BasicKeyword[];
  condition?: ComboCondition;
  tribe?: Tribe;
};
export type StoneKeyword = BasicKeyword | ComboKeyword;
export type ActiveKeyword =
  | { type: "head-start" | "comeback"; side: Side }
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
  "head-start": { name: "Head Start", condition: "winning" },
  comeback: { name: "Comeback", condition: "losing" },
  resonance: { name: "Resonance", condition: "element or tribe count" },
  sunder: { name: "Sunder", condition: "on play" },
  silence: { name: "Silence", condition: "on play" },
  dizzy: { name: "Dizzy", condition: "before captures" },
  shield: { name: "Shield", condition: "defense only" },
  combo: { name: "Combo", condition: "previous card match" },
  "next-play": { name: "Next Play", condition: "queue a pip effect" },
  environment: { name: "Environment", condition: "choose any tile" },
} as const;
export const MAX_KEYWORDS = 24;
export const DIZZY_EDGE_CAP = 5;
export function keywordKey(keyword: StoneKeyword): string {
  return keyword.type === "silence" ||
    keyword.type === "dizzy" ||
    keyword.type === "combo" ||
    keyword.type === "environment"
    ? keyword.type
    : `${keyword.type}:${keyword.side}`;
}
export function repeatableKeyword(type: KeywordType): boolean {
  return type === "sunder" || type === "next-play" || type === "environment";
}
// Keep each on-play effect in printed order; only the passive edge bonuses group together.
export function keywordGroups(keywords: StoneKeyword[]) {
  return keywords.flatMap((keyword, index) => {
    if (
      keyword.type === "sunder" ||
      keyword.type === "silence" ||
      keyword.type === "next-play" ||
      keyword.type === "environment"
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
}
export interface PlacedStone {
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
  comboPrevious?: Element;
  comboPreviousTribes?: Tribe[];
  playedOrder?: number;
  arenaElement?: Element;
  queuedPips?: QueuedPips[];
  inheritedPips?: Edges;
  environment?: TileEnvironment;
}
export type Board = (PlacedStone | null)[];
export interface Move {
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

// This result is computed before placement and retained on the placed stone.
export function previousElement(
  board: Board,
  player: Owner,
): Element | undefined {
  return previousStone(board, player)?.element;
}
export function previousStone(board: Board, player: Owner): Stone | undefined {
  return board
    .filter(
      (cell) => cell?.playedBy === player && cell.playedOrder !== undefined,
    )
    .sort((a, b) => b!.playedOrder! - a!.playedOrder!)[0]?.stone;
}
export function comboKeywords(stone: Stone, board: Board, player: Owner) {
  const combo = stone.keywords?.find((keyword) => keyword.type === "combo");
  const previousCard = previousStone(board, player);
  const previous = previousCard?.element;
  const elementMatch = !!previousCard && previous === stone.element;
  const condition = combo?.condition || "element";
  const tribeMatch =
    !!combo &&
    condition !== "element" &&
    !!previousCard &&
    (combo?.tribe
      ? hasTribe(stone, combo.tribe) && hasTribe(previousCard, combo.tribe)
      : sharedTribes(stone, previousCard).length > 0);
  const active =
    !!combo &&
    (condition === "element"
      ? elementMatch
      : condition === "tribe"
        ? tribeMatch
        : condition === "either"
          ? elementMatch || tribeMatch
          : elementMatch && tribeMatch);
  return {
    combo,
    previous,
    active,
    ...(combo && condition !== "element"
      ? { previousTribes: previousCard ? [...stoneTribes(previousCard)] : [] }
      : {}),
    granted: active ? combo!.keywords || [] : [],
  };
}
export function effectiveKeywords(
  stone: Stone,
  board: Board,
  player?: Owner,
): BasicKeyword[] {
  return (stone.keywords || []).flatMap((keyword) =>
    keyword.type === "combo"
      ? player !== undefined && comboKeywords(stone, board, player).active
        ? keyword.keywords || []
        : []
      : [keyword],
  );
}
export function shieldEdges(
  stone: Stone,
  silenced = false,
  granted: BasicKeyword[] = [],
): Edges {
  const shields: Edges = [0, 0, 0, 0];
  if (!silenced)
    for (const keyword of [...(stone.keywords || []), ...granted])
      if (keyword.type === "shield")
        shields[keyword.side] += keyword.amount ?? 1;
  return shields;
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
    environmentEdges(
      cell.edges || cell.stone.edges,
      cell.stone.element,
      cell.environment,
      cell.stone,
    ),
    cell.stone.element,
    cell.arenaElement,
  );
}
export function attackEdges(cell: PlacedStone): Edges {
  const bonus = environmentAttack(cell.environment, cell.stone);
  return cardEdges(cell).map((value) => value + bonus) as Edges;
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
  return cardEdges(cell).map(
    (edge, side) =>
      edge + shields[side] + environmentDefense(cell.environment, cell.stone),
  ) as Edges;
}
export function evaluateKeywords(stone: Stone, board: Board, player: Owner) {
  const scores = score(board);
  const rival = player === 0 ? 1 : 0;
  const activeKeywords: ActiveKeyword[] = [];
  const edges = [...stone.edges] as Edges;
  const combo = comboKeywords(stone, board, player);
  if (combo.active)
    for (const pip of combo.combo!.pips || []) edges[pip.side] += pip.amount;
  for (const keyword of effectiveKeywords(stone, board, player)) {
    if (keyword.type === "resonance") {
      const bonus = board.filter(
        (cell) =>
          !!cell &&
          (keyword.tribe
            ? hasTribe(cell.stone, keyword.tribe)
            : cell.stone.element === keyword.element),
      ).length;
      if (bonus > 0) {
        activeKeywords.push({ ...keyword, bonus });
        edges[keyword.side] += bonus;
      }
    } else if (
      (keyword.type === "head-start" || keyword.type === "comeback") &&
      (keyword.type === "head-start"
        ? scores[player] > scores[rival]
        : scores[player] < scores[rival])
    ) {
      activeKeywords.push(keyword);
      edges[keyword.side] += 1;
    }
  }
  const inheritedPips = nextPipModifiers(board, player, stone);
  const hasInherited = inheritedPips.some(Boolean);
  return {
    edges: hasInherited
      ? (edges.map((edge, side) =>
          Math.max(0, Math.min(99, edge + inheritedPips[side])),
        ) as Edges)
      : edges,
    ...(hasInherited ? { inheritedPips } : {}),
    activeKeywords,
    shields: shieldEdges(stone, false, combo.granted),
    ...(combo.combo
      ? {
          comboActive: combo.active,
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
) {
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
      return !cell.silenced && cell.stone.keywords?.length
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
  let state = prepareTargeting(board, stone, targets, owner);
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
        stone,
        [...targets, option],
        owner,
      );
      const weakening = preview.board.reduce((sum, cell, spot) => {
        if (!cell) return sum;
        const before = state.board[spot]!;
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
    state = prepareTargeting(board, stone, targets, owner);
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
  } = {},
): Move {
  if (
    (board.length !== 9 && board.length !== 16) ||
    !Number.isInteger(index) ||
    index < 0 ||
    index >= board.length ||
    board[index]
  ) {
    throw new Error("Choose an empty square on the board.");
  }
  const resolved = evaluateKeywords(stone, board, owner);
  const targeted = prepareTargeting(board, stone, targets, owner);
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
          },
        ]
      : [],
  );
  next[index] = {
    stone,
    owner,
    playedBy: owner,
    playedOrder:
      1 + Math.max(0, ...board.map((cell) => cell?.playedOrder || 0)),
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
    const after = rollDizzy(
      resolved.edges,
      seed,
      options.minimumDizzyPips,
      sides,
    );
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
  next = withTileEnvironments(next);
  const captured = capturesAt(next, index, owner, attackEdges(next[index]!));
  for (const neighbor of captured)
    next[neighbor] = { ...next[neighbor]!, owner };
  return { board: next, captured, effects: targeted.effects };
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
  arena: { current?: Element; next?: Element } = {},
): { index: number; cardIndex: number; targets: KeywordTarget[] } {
  let best = {
    index: -1,
    cardIndex: -1,
    targets: [] as KeywordTarget[],
    value: -Infinity,
  };
  hand.forEach((stone, cardIndex) =>
    board.forEach((cell, index) => {
      if (cell) return;
      const targets = chooseKeywordTargets(
        board,
        index,
        stone,
        owner,
        arena.current,
      );
      const move = placeStone(board, index, stone, owner, targets, {
        arenaElement: arena.current,
      });
      const replyBoard = arena.next
        ? withArenaElement(move.board, arena.next)
        : move.board;
      let worstReply = 0;
      rivalHand.forEach((rival) =>
        replyBoard.forEach((target, spot) => {
          if (!target)
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
                { arenaElement: arena.next },
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
        (index === 4 ? 0.2 : 0);
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
    s.edges.every((n) => Number.isInteger(n) && n >= 0 && n <= 5) &&
    s.edges.reduce((a, b) => a + b, 0) <= (s.origin === "giants" ? 16 : 12) &&
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
    (s.keywords === undefined || validateKeywords(s.keywords)) &&
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

export function validateKeywords(value: unknown): value is StoneKeyword[] {
  if (!Array.isArray(value) || value.length > MAX_KEYWORDS) return false;
  const seen = new Set<string>();
  return value.every((keyword) => {
    if (
      !keyword ||
      typeof keyword !== "object" ||
      typeof keyword.type !== "string" ||
      !Object.hasOwn(KEYWORD_RULES, keyword.type)
    )
      return false;
    if (
      keyword.type === "silence" ||
      keyword.type === "dizzy" ||
      keyword.type === "combo" ||
      keyword.type === "environment"
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
      keyword.type === "next-play" &&
      (!validEffectSide(keyword.side) ||
        !validPipAmount(keyword.amount, true) ||
        !["self", "opponent"].includes(keyword.recipient))
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
      keyword.type === "shield" &&
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
            (grant: { type: string }) => !grant || grant.type === "combo",
          ) ||
          !validateKeywords(keyword.keywords))
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
    if (!repeatableKeyword(keyword.type) && seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
