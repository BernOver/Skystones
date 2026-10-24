export type Element = "fire" | "life" | "water" | "air" | "magic" | "earth";
export type Creature =
  "dragon" | "turtle" | "whale" | "owl" | "fox" | "golem" | "mushroom" | "cat";
export type Owner = 0 | 1;
export type Edges = [number, number, number, number]; // North, east, south, west.
export type Side = 0 | 1 | 2 | 3;
export type KeywordType =
  "head-start" | "comeback" | "resonance" | "sunder" | "silence";
export type TargetKeyword =
  { type: "sunder"; side: Side | "any"; amount?: number } | { type: "silence" };
export type StoneKeyword =
  | { type: "head-start" | "comeback"; side: Side }
  | { type: "resonance"; side: Side; element: Element }
  | TargetKeyword;
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
} as const;
export const MAX_KEYWORDS = (Object.keys(KEYWORD_RULES).length - 1) * 4 + 2;
export function keywordKey(keyword: StoneKeyword): string {
  return keyword.type === "silence"
    ? "silence"
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
  keywords?: StoneKeyword[];
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
};

export const STARTER_STONES: Stone[] = [
  {
    id: "emberwing",
    name: "Emberwing",
    element: "fire",
    creature: "dragon",
    edges: [3, 2, 1, 2],
    description: "Small wings. Unreasonably big ambitions.",
    keywords: [{ type: "head-start", side: 1 }],
  },
  {
    id: "mossback",
    name: "Mossback",
    element: "life",
    creature: "turtle",
    edges: [1, 3, 3, 1],
    description: "A wandering garden with nowhere to be.",
    keywords: [{ type: "comeback", side: 0 }],
  },
  {
    id: "tidecaller",
    name: "Tidecaller",
    element: "water",
    creature: "whale",
    edges: [2, 1, 2, 3],
    description: "Carries a little ocean wherever it goes.",
    keywords: [{ type: "resonance", side: 3, element: "water" }],
  },
  {
    id: "nocturne",
    name: "Nocturne",
    element: "magic",
    creature: "owl",
    edges: [3, 1, 3, 1],
    description: "Knows your next move. Usually keeps it secret.",
    keywords: [{ type: "comeback", side: 3 }],
  },
  {
    id: "sunfox",
    name: "Sunfox",
    element: "earth",
    creature: "fox",
    edges: [2, 3, 1, 2],
    description: "Always finds the warmest corner of the board.",
    keywords: [{ type: "head-start", side: 2 }],
  },
  {
    id: "pebble",
    name: "Pebble",
    element: "earth",
    creature: "golem",
    edges: [2, 2, 3, 1],
    description: "A mountain of courage in a pocket-sized stone.",
  },
  {
    id: "cloudpaws",
    name: "Cloudpaws",
    element: "air",
    creature: "cat",
    edges: [3, 2, 2, 1],
    description: "Made of clouds, curiosity, and a little trouble.",
    keywords: [{ type: "comeback", side: 2 }],
  },
  {
    id: "glowcap",
    name: "Glowcap",
    element: "life",
    creature: "mushroom",
    edges: [1, 2, 2, 3],
    description: "A tiny light for the paths less traveled.",
    keywords: [{ type: "resonance", side: 0, element: "life" }],
  },
  {
    id: "cinder",
    name: "Cinder",
    element: "fire",
    creature: "fox",
    edges: [1, 1, 3, 3],
    description: "A spark with a very impressive tail.",
    keywords: [{ type: "head-start", side: 0 }],
  },
  {
    id: "moonwatch",
    name: "Moonwatch",
    element: "air",
    creature: "owl",
    edges: [2, 3, 2, 1],
    description: "Collects stories from the midnight sky.",
  },
  {
    id: "seasprout",
    name: "Seasprout",
    element: "water",
    creature: "turtle",
    edges: [3, 1, 1, 3],
    description: "A patient traveler with a sea-glass shell.",
    keywords: [{ type: "comeback", side: 1 }],
  },
  {
    id: "stardust",
    name: "Stardust",
    element: "magic",
    creature: "cat",
    edges: [2, 2, 1, 3],
    description: "Lands on its feet. Sometimes in another dimension.",
  },
];
export const DEFAULT_DECK = STARTER_STONES.slice(0, 5).map((s) => s.id);
export const EMPTY_BOARD = (): Board => Array.from({ length: 9 }, () => null);
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
export function evaluateKeywords(
  stone: Stone,
  board: Board,
  player: Owner,
): {
  edges: Edges;
  activeKeywords: ActiveKeyword[];
} {
  const scores = score(board);
  const rival = player === 0 ? 1 : 0;
  const activeKeywords: ActiveKeyword[] = [];
  const edges = [...stone.edges] as Edges;
  for (const keyword of stone.keywords || []) {
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
  return { edges, activeKeywords };
}

// Targeted effects resolve in printed order against cards already on the board.
// This same helper drives the picker, actual play, and computer simulations.
export function prepareTargeting(
  board: Board,
  stone: Stone,
  targets: KeywordTarget[] = [],
) {
  if (
    new Set(targets.map((choice) => choice.keywordIndex)).size !==
    targets.length
  )
    throw new Error("Choose only one target for each keyword.");
  let next = board;
  const effects: TargetEffect[] = [];
  const used = new Set<number>();
  for (const [keywordIndex, keyword] of (stone.keywords || []).entries()) {
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
          ? { ...cell, edges, silenced: true, activeKeywords: [] }
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
  const row = Math.floor(index / 3),
    col = index % 3;
  const neighbors = [
    row > 0 ? index - 3 : -1,
    col < 2 ? index + 1 : -1,
    row < 2 ? index + 3 : -1,
    col > 0 ? index - 1 : -1,
  ];
  return neighbors.filter((neighbor, direction) => {
    const target = board[neighbor];
    return (
      target &&
      target.owner !== owner &&
      edges[direction] >
        (target.edges || target.stone.edges)[(direction + 2) % 4]
    );
  });
}

// Greedy target selection avoids an exponential search on custom cards with many effects.
export function chooseKeywordTargets(
  board: Board,
  index: number,
  stone: Stone,
  owner: Owner,
): KeywordTarget[] {
  const targets: KeywordTarget[] = [];
  const edges = evaluateKeywords(stone, board, owner).edges;
  let state = prepareTargeting(board, stone, targets);
  while (state.pending) {
    const { options } = state.pending;
    let best = options[0],
      bestValue = -Infinity;
    for (const option of options) {
      const preview = prepareTargeting(board, stone, [...targets, option]);
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
    state = prepareTargeting(board, stone, targets);
  }
  return targets;
}

export function placeStone(
  board: Board,
  index: number,
  stone: Stone,
  owner: Owner,
  targets: KeywordTarget[] = [],
): Move {
  if (
    board.length !== 9 ||
    !Number.isInteger(index) ||
    index < 0 ||
    index > 8 ||
    board[index]
  ) {
    throw new Error("Choose an empty square on the board.");
  }
  const resolved = evaluateKeywords(stone, board, owner);
  const targeted = prepareTargeting(board, stone, targets);
  if (targeted.pending)
    throw new Error("Choose a target before placing this card.");
  const next = targeted.board.map((cell) => (cell ? { ...cell } : null));
  next[index] = {
    stone,
    owner,
    playedBy: owner,
    ...resolved,
    ...(targeted.effects.length ? { effects: targeted.effects } : {}),
  };
  const captured = capturesAt(next, index, owner, resolved.edges);
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
      const targets = chooseKeywordTargets(board, index, stone, owner);
      const move = placeStone(board, index, stone, owner, targets);
      let worstReply = 0;
      rivalHand.forEach((rival) =>
        move.board.forEach((target, spot) => {
          if (!target)
            worstReply = Math.max(
              worstReply,
              placeStone(
                move.board,
                spot,
                rival,
                owner === 0 ? 1 : 0,
                chooseKeywordTargets(
                  move.board,
                  spot,
                  rival,
                  owner === 0 ? 1 : 0,
                ),
              ).captured.length,
            );
        }),
      );
      const exposed = move.board[index]!.edges!.reduce(
        (sum, edge, direction) => {
          const row = Math.floor(index / 3),
            col = index % 3;
          const spots = [
            row > 0 ? index - 3 : -1,
            col < 2 ? index + 1 : -1,
            row < 2 ? index + 3 : -1,
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

export function validateStone(value: unknown): value is Stone {
  if (!value || typeof value !== "object") return false;
  const s = value as Record<string, unknown>;
  return (
    typeof s.id === "string" &&
    s.id.startsWith("custom-") &&
    typeof s.name === "string" &&
    s.name.trim().length > 0 &&
    s.name.length <= 24 &&
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
    ].includes(String(s.creature)) &&
    Array.isArray(s.edges) &&
    s.edges.length === 4 &&
    s.edges.every((n) => Number.isInteger(n) && n >= 0 && n <= 5) &&
    s.edges.reduce((a, b) => a + b, 0) <= 12 &&
    typeof s.description === "string" &&
    s.description.length <= 120 &&
    (s.keywords === undefined || validateKeywords(s.keywords)) &&
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
      keyword.type === "silence"
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
    const key = keywordKey(keyword);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
