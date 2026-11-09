import { SUPERCHARGER_VEHICLES } from "./superchargers.ts";
import type { Board, Edges, Stone } from "./game.ts";
import { placedKeywords } from "./game.ts";
import { readTokens } from "./tokens.ts";
import { MAX_HAND_CARDS } from "./conjure.ts";
export const DEFAULT_PARTS: Stone[] = [
  {
    id: "custom-token-part-engine",
    name: "Blaze Engine",
    element: "fire",
    edges: [1, 1, 0, 0],
    keywords: [{ type: "head-start", side: 1 }],
    portrait: "spitfire",
  },
  {
    id: "custom-token-part-armor",
    name: "Iron Chassis",
    element: "tech",
    edges: [1, 0, 1, 0],
    keywords: [{ type: "shield", side: 0 }],
    portrait: "high-volt",
  },
  {
    id: "custom-token-part-treads",
    name: "Terra Treads",
    element: "earth",
    edges: [0, 0, 1, 1],
    keywords: [{ type: "sunder", side: 2 }],
    portrait: "smash-hit",
  },
  {
    id: "custom-token-part-wings",
    name: "Storm Wings",
    element: "air",
    edges: [0, 1, 0, 1],
    keywords: [{ type: "next-play", side: 0, amount: 1, recipient: "self" }],
    portrait: "stormblade",
  },
  {
    id: "custom-token-part-hull",
    name: "Reef Hull",
    element: "water",
    edges: [0, 1, 1, 0],
    keywords: [{ type: "comeback", side: 2 }],
    portrait: "dive-clops",
  },
  {
    id: "custom-token-part-reactor",
    name: "Arcane Reactor",
    element: "magic",
    edges: [1, 0, 0, 1],
    keywords: [
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-magic-echo",
        count: 1,
        recipient: "self",
      },
    ],
    portrait: "splat",
  },
].map(
  (p) =>
    ({
      ...p,
      creature: "robot",
      description:
        "A Supercharger Part. Two Parts in hand automatically combine, retaining both sets of effects.",
      custom: true,
      token: true,
      part: true,
      origin: "skylanders",
      tribes: ["superchargers"],
    }) as Stone,
);
export function combineParts(hand: Stone[]): Stone[] {
  const out = [...hand];
  while (out.filter((c) => c.part).length >= 2) {
    const a = out.findIndex((c) => c.part),
      first = out[a];
    out.splice(a, 1);
    const b = out.findIndex((c) => c.part),
      second = out[b];
    out.splice(b, 1);
    const keywords = [
      ...(first.keywords || []),
      ...(second.keywords || []),
      { type: "flash" as const },
    ];
    if (keywords.length > 128)
      throw new Error("Too many effects to combine these Parts.");
    const vehicles = SUPERCHARGER_VEHICLES.filter(
        (p) => p.element === first.element,
      ),
      pool = vehicles.length ? vehicles : SUPERCHARGER_VEHICLES;
    const vehicle =
      pool[
        Array.from(first.id + second.id).reduce(
          (n, c) => (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0,
          0,
        ) % pool.length
      ];
    const charger: Stone = {
      id: `custom-supercharger-${first.id.slice(-35)}-${second.id.slice(-35)}`,
      name: vehicle.name,
      element: first.element,
      creature: "robot",
      edges: first.edges.map((n, s) =>
        Math.min(99, n + second.edges[s]),
      ) as Edges,
      description:
        "Built from two Parts. Flash keeps your turn. Cover with a stone to inherit pips and effects, except Flash.",
      custom: true,
      conjured: true,
      runtimeEffects: true,
      supercharger: { parts: [first.name, second.name] },
      keywords,
      tribes: ["superchargers"],
      portrait: vehicle.id,
    };
    // Preserve buffs on both component cards, including gifts received while in hand.
    if (first.discardBuffs || second.discardBuffs)
      charger.discardBuffs = {
        pips: first.edges.map((_, s) =>
          Math.min(
            99,
            (first.discardBuffs?.pips[s] || 0) +
              (second.discardBuffs?.pips[s] || 0),
          ),
        ) as Edges,
        shields: first.edges.map((_, s) =>
          Math.min(
            99,
            (first.discardBuffs?.shields[s] || 0) +
              (second.discardBuffs?.shields[s] || 0),
          ),
        ) as Edges,
      };
    out.splice(Math.min(a, b), 0, charger);
  }
  return out;
}
export function assembleParts(
  board: Board,
  index: number,
  hands: [Stone[], Stone[]],
  seed: number,
  tokens = readTokens(),
): { board: Board; hands: [Stone[], Stone[]]; messages: string[] } {
  const cell = board[index];
  if (!cell) return { board, hands, messages: [] };
  const owner = cell.playedBy ?? cell.owner,
    pool = tokens.filter((c) => c.part),
    next: [Stone[], Stone[]] = [[...hands[0]], [...hands[1]]],
    messages: string[] = [];
  let state = seed >>> 0 || 0x9e3779b9,
    serial = 0;
  const count = placedKeywords(cell).reduce(
    (n, k) => n + (k.type === "assemble" ? k.count : 0),
    0,
  );
  for (let n = 0; n < count; n++) {
    if (!pool.length) break;
    // Combine each arrival before testing capacity for the next Part.
    if (
      next[owner].length >= MAX_HAND_CARDS &&
      !next[owner].some((c) => c.part)
    )
      break;
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    const template = pool[(state >>> 0) % pool.length];
    const part: Stone = {
      ...structuredClone(template),
      id: `custom-conjured-part-${(seed >>> 0).toString(36)}-${cell.playedOrder || index}-${serial++}`,
      conjured: true,
    };
    next[owner].push(part);
    messages.push(`Assemble: ${part.name}`);
    next[owner] = combineParts(next[owner]);
  }
  next[0] = combineParts(next[0]);
  next[1] = combineParts(next[1]);
  return { board, hands: next, messages };
}
