import { CHARACTER_STONES, CHARACTER_PORTRAITS } from "./characters.ts";
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
  | "combo";
export type TargetKeyword =
  { type: "sunder"; side: Side | "any"; amount?: number } | { type: "silence" };
export type BasicKeyword =
  | { type: "head-start" | "comeback"; side: Side }
  | { type: "resonance"; side: Side; element: Element }
  | { type: "dizzy" }
  | { type: "shield"; side: Side; amount?: number }
  | TargetKeyword;
export type ComboKeyword = {
  type: "combo";
  pips?: { side: Side; amount: number }[];
  keywords?: BasicKeyword[];
};
export type StoneKeyword = BasicKeyword | ComboKeyword;
export type ActiveKeyword =
  | { type: "head-start" | "comeback"; side: Side }
  | { type: "resonance"; side: Side; element: Element; bonus: number };
export interface KeywordTarget {
  keywordIndex: number;
  boardIndex: number;
  side?: Side;
}
export type TargetEffect =
  | {
      type: "sunder";
      side: Side;
      target: number;
      flexible?: true;
      amount?: number;
    }
  | { type: "silence"; target: number };
export const SIDE_NAMES = ["North", "East", "South", "West"] as const;
export const SIDE_LETTERS = ["N", "E", "S", "W"] as const;
export const KEYWORD_RULES = {
  "head-start": { name: "Head Start", condition: "winning" },
  comeback: { name: "Comeback", condition: "losing" },
  resonance: { name: "Resonance", condition: "element count" },
  sunder: { name: "Sunder", condition: "on play" },
  silence: { name: "Silence", condition: "on play" },
  dizzy: { name: "Dizzy", condition: "after captures" },
  shield: { name: "Shield", condition: "defense only" },
  combo: { name: "Combo", condition: "matching previous element" },
} as const;
export const MAX_KEYWORDS = 24;
export function keywordKey(keyword: StoneKeyword): string {
  return keyword.type === "silence" ||
    keyword.type === "dizzy" ||
    keyword.type === "combo"
    ? keyword.type
    : `${keyword.type}:${keyword.side}`;
}
// Keep each on-play effect in printed order; only the passive edge bonuses group together.
export function keywordGroups(keywords: StoneKeyword[]) {
  return keywords.flatMap((keyword, index) => {
    if (keyword.type === "sunder" || keyword.type === "silence")
      return [
        {
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
  keywords?: StoneKeyword[];
  baseEdges?: Edges;
  baseKeywords?: StoneKeyword[];
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
  dizzy?: { before: Edges; after: Edges };
  shields?: Edges;
  grantedKeywords?: BasicKeyword[];
  comboActive?: boolean;
  comboPrevious?: Element;
  playedOrder?: number;
  arenaElement?: Element;
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
  return board
    .filter(
      (cell) => cell?.playedBy === player && cell.playedOrder !== undefined,
    )
    .sort((a, b) => b!.playedOrder! - a!.playedOrder!)[0]?.stone.element;
}
export function comboKeywords(stone: Stone, board: Board, player: Owner) {
  const combo = stone.keywords?.find((keyword) => keyword.type === "combo");
  const previous = previousElement(board, player);
  const active = !!combo && previous === stone.element;
  return {
    combo,
    previous,
    active,
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
      ? player !== undefined && previousElement(board, player) === stone.element
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
    cell.edges || cell.stone.edges,
    cell.stone.element,
    cell.arenaElement,
  );
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
  return cardEdges(cell).map((edge, side) => edge + shields[side]) as Edges;
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
        (cell) => cell?.stone.element === keyword.element,
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
  return {
    edges,
    activeKeywords,
    shields: shieldEdges(stone, false, combo.granted),
    ...(combo.combo
      ? {
          comboActive: combo.active,
          comboPrevious: combo.previous,
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
  for (const [keywordIndex, keyword] of effectiveKeywords(
    stone,
    board,
    owner,
  ).entries()) {
    if (keyword.type !== "sunder" && keyword.type !== "silence") continue;
    const options: KeywordTarget[] = next.flatMap((cell, boardIndex) => {
      if (!cell) return [];
      if (keyword.type === "sunder") {
        const edges = cell.edges || cell.stone.edges;
        return keyword.side === "any"
          ? edges.flatMap((edge, side) =>
              edge > 0
                ? [{ keywordIndex, boardIndex, side: side as Side }]
                : [],
            )
          : edges[keyword.side] > 0
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
    if (keyword.type === "sunder") {
      const side = keyword.side === "any" ? choice.side! : keyword.side;
      const reductions = [...(cell.reductions || [0, 0, 0, 0])] as Edges;
      const edges = [...(cell.edges || cell.stone.edges)] as Edges;
      const removed = Math.min(keyword.amount ?? 1, edges[side]);
      reductions[side] += removed;
      edges[side] -= removed;
      next = next.map((target, index) =>
        index === choice.boardIndex ? { ...cell, edges, reductions } : target,
      );
      effects.push({
        type: "sunder",
        side,
        target: choice.boardIndex,
        ...(keyword.side === "any" ? { flexible: true as const } : {}),
        ...(keyword.amount !== undefined ? { amount: removed } : {}),
      });
    } else {
      const edges = cell.stone.edges.map((base, side) =>
        Math.max(0, base - (cell.reductions?.[side] || 0)),
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
      effects.push({ type: "silence", target: choice.boardIndex });
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

// Greedy target selection avoids an exponential search on custom cards with many effects.
export function chooseKeywordTargets(
  board: Board,
  index: number,
  stone: Stone,
  owner: Owner,
  arenaElement?: Element,
): KeywordTarget[] {
  const targets: KeywordTarget[] = [];
  const edges = arenaEdges(
    evaluateKeywords(stone, board, owner).edges,
    stone.element,
    arenaElement,
  );
  let state = prepareTargeting(board, stone, targets, owner);
  while (state.pending) {
    const { options } = state.pending;
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
        const lost = (before.edges || before.stone.edges).reduce(
          (total, edge, side) =>
            total + edge - (cell.edges || cell.stone.edges)[side],
          0,
        );
        const disabled = !before.silenced && cell.silenced ? 0.2 : 0;
        return sum + (cell.owner === owner ? -1 : 1) * (lost + disabled);
      }, 0);
      const value =
        capturesAt(preview.board, index, owner, edges).length * 10 + weakening;
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

// Redistribute once, retaining the total up to the four-per-edge ceiling.
// A seed keeps previews, AI searches, and saved expedition turns reproducible.
export function rollDizzy(edges: Edges, seed: number, minimum = 0): Edges {
  const total = Math.min(
    16,
    edges.reduce((sum, edge) => sum + edge, 0),
  );
  const floor = Math.min(minimum, Math.floor(total / 4), 4);
  const result: Edges = [floor, floor, floor, floor];
  let state = seed >>> 0 || 0x9e3779b9;
  for (let pip = floor * 4; pip < total; pip++) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    const available = result.flatMap((edge, side) => (edge < 4 ? [side] : []));
    result[available[(state >>> 0) % available.length]]++;
  }
  return result;
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
  const next = targeted.board.map((cell) => (cell ? { ...cell } : null));
  next[index] = {
    stone,
    owner,
    playedBy: owner,
    playedOrder:
      1 + Math.max(0, ...board.map((cell) => cell?.playedOrder || 0)),
    ...resolved,
    ...(options.arenaElement ? { arenaElement: options.arenaElement } : {}),
    ...(targeted.effects.length ? { effects: targeted.effects } : {}),
  };
  const captured = capturesAt(next, index, owner, cardEdges(next[index]!));
  for (const neighbor of captured)
    next[neighbor] = { ...next[neighbor]!, owner };
  if (
    effectiveKeywords(stone, board, owner).some(
      (keyword) => keyword.type === "dizzy",
    )
  ) {
    const seed =
      options.seed ??
      board.reduce(
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
    const after = rollDizzy(resolved.edges, seed, options.minimumDizzyPips);
    next[index] = {
      ...next[index]!,
      edges: after,
      dizzy: { before: resolved.edges, after },
    };
  }
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
    typeof s.description === "string" &&
    s.description.length <= 120 &&
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
      keyword.type === "combo"
        ? keyword.side !== undefined
        : !(keyword.type === "sunder" && keyword.side === "any") &&
          (!Number.isInteger(keyword.side) ||
            keyword.side < 0 ||
            keyword.side > 3)
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
    const key = keywordKey(keyword);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
