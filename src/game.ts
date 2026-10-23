export type Element = "fire" | "life" | "water" | "air" | "magic" | "earth";
export type Creature =
  "dragon" | "turtle" | "whale" | "owl" | "fox" | "golem" | "mushroom" | "cat";
export type Owner = 0 | 1;
export type Edges = [number, number, number, number]; // North, east, south, west.
export type Side = 0 | 1 | 2 | 3;
export type KeywordType = "head-start" | "comeback";
export interface StoneKeyword {
  type: KeywordType;
  side: Side;
}
export const SIDE_NAMES = ["North", "East", "South", "West"] as const;
export const SIDE_LETTERS = ["N", "E", "S", "W"] as const;
export const KEYWORD_RULES = {
  "head-start": { name: "Head Start", condition: "winning" },
  comeback: { name: "Comeback", condition: "losing" },
} as const;
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
  activeKeywords?: StoneKeyword[];
}
export type Board = (PlacedStone | null)[];
export interface Move {
  board: Board;
  captured: number[];
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
  activeKeywords: StoneKeyword[];
} {
  const scores = score(board);
  const rival = player === 0 ? 1 : 0;
  const activeKeywords = (stone.keywords || []).filter((keyword) =>
    keyword.type === "head-start"
      ? scores[player] > scores[rival]
      : scores[player] < scores[rival],
  );
  const edges = [...stone.edges] as Edges;
  for (const keyword of activeKeywords) edges[keyword.side] += 1;
  return { edges, activeKeywords };
}

export function placeStone(
  board: Board,
  index: number,
  stone: Stone,
  owner: Owner,
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
  const next = board.map((cell) => (cell ? { ...cell } : null));
  next[index] = { stone, owner, playedBy: owner, ...resolved };
  const captured: number[] = [];
  const row = Math.floor(index / 3);
  const col = index % 3;
  const neighbors = [
    row > 0 ? index - 3 : -1,
    col < 2 ? index + 1 : -1,
    row < 2 ? index + 3 : -1,
    col > 0 ? index - 1 : -1,
  ];
  neighbors.forEach((neighbor, direction) => {
    const target = next[neighbor];
    if (
      target &&
      target.owner !== owner &&
      resolved.edges[direction] >
        (target.edges || target.stone.edges)[(direction + 2) % 4]
    ) {
      next[neighbor] = { ...target, owner };
      captured.push(neighbor);
    }
  });
  return { board: next, captured };
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
): { index: number; cardIndex: number } {
  let best = { index: -1, cardIndex: -1, value: -Infinity };
  hand.forEach((stone, cardIndex) =>
    board.forEach((cell, index) => {
      if (cell) return;
      const move = placeStone(board, index, stone, owner);
      let worstReply = 0;
      rivalHand.forEach((rival) =>
        move.board.forEach((target, spot) => {
          if (!target)
            worstReply = Math.max(
              worstReply,
              placeStone(move.board, spot, rival, owner === 0 ? 1 : 0).captured
                .length,
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
      if (value > best.value) best = { index, cardIndex, value };
    }),
  );
  if (best.index < 0) throw new Error("There are no available moves.");
  return { index: best.index, cardIndex: best.cardIndex };
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
  if (!Array.isArray(value) || value.length > 8) return false;
  const seen = new Set<string>();
  return value.every((keyword) => {
    if (
      !keyword ||
      typeof keyword !== "object" ||
      typeof keyword.type !== "string" ||
      !Object.hasOwn(KEYWORD_RULES, keyword.type) ||
      !Number.isInteger(keyword.side) ||
      keyword.side < 0 ||
      keyword.side > 3
    )
      return false;
    const key = `${keyword.type}:${keyword.side}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
