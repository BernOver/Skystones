import { readRecipes, matchingRecipe, partIdentity } from "./recipes.ts";
import type { SuperchargerRecipe } from "./recipes.ts";
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
export function combineParts(
  hand: Stone[],
  recipes: readonly SuperchargerRecipe[] = readRecipes(),
): Stone[] {
  const out = [...hand];
  while (out.filter((c) => c.part).length >= 2) {
    const indices = out.flatMap((c, i) => (c.part ? [i] : []));
    let pair: [number, number] = [indices[0], indices[1]];
    search: for (let i = 0; i < indices.length; i++)
      for (let j = i + 1; j < indices.length; j++)
        if (matchingRecipe(out[indices[i]], out[indices[j]], recipes)) {
          pair = [indices[i], indices[j]];
          break search;
        }
    const [a, b] = pair,
      first = out[a],
      second = out[b],
      recipe = matchingRecipe(first, second, recipes);
    out.splice(b, 1);
    out.splice(a, 1);
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
        Array.from(
          [partIdentity(first), partIdentity(second)].sort().join("|"),
        ).reduce((n, c) => (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0, 0) %
          pool.length
      ];
    const charger: Stone = {
      id: `custom-supercharger-${first.id.slice(-35)}-${second.id.slice(-35)}`,
      name: recipe?.name || vehicle.name,
      element: recipe?.element || first.element,
      creature: "robot",
      edges: first.edges.map((n, s) =>
        Math.min(99, n + second.edges[s]),
      ) as Edges,
      description:
        "Built from two Parts. Flash keeps your turn. Cover with a stone to inherit pips and effects, except Flash.",
      custom: true,
      conjured: true,
      runtimeEffects: true,
      supercharger: {
        parts: [first.name, second.name],
        ...(recipe ? { recipe: structuredClone(recipe) } : {}),
      },
      keywords,
      tribes: ["superchargers"],
      portrait: recipe?.portrait || vehicle.id,
    };
    // Preserve buffs on both component cards, including gifts received while in hand.
    if (first.discardBuffs || second.discardBuffs)
      charger.discardBuffs = {
        pips: first.edges.map((_, s) =>
          Math.max(
            -99,
            Math.min(
              99,
              (first.discardBuffs?.pips[s] || 0) +
                (second.discardBuffs?.pips[s] || 0),
            ),
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
    if (
      charger.discardBuffs &&
      ![...charger.discardBuffs.pips, ...charger.discardBuffs.shields].some(
        Boolean,
      )
    )
      delete charger.discardBuffs;
    out.splice(a, 0, charger);
  }
  return out;
}
export function assembleParts(
  board: Board,
  index: number,
  hands: [Stone[], Stone[]],
  seed: number,
  tokens = readTokens(),
  recipes: readonly SuperchargerRecipe[] = readRecipes(),
): { board: Board; hands: [Stone[], Stone[]]; messages: string[] } {
  const cell = board[index];
  if (!cell) return { board, hands, messages: [] };
  const owner = cell.playedBy ?? cell.owner,
    pool = tokens.filter((c) => c.part),
    next: [Stone[], Stone[]] = [[...hands[0]], [...hands[1]]],
    messages: string[] = [];
  let state = seed >>> 0 || 0x9e3779b9,
    serial = 0;
  for (const keyword of placedKeywords(cell)) {
    if (keyword.type !== "assemble") continue;
    const choices =
      keyword.mode === "specific"
        ? pool.filter((p) => p.id === keyword.part)
        : pool;
    for (let n = 0; n < keyword.count; n++) {
      if (!choices.length) {
        messages.push("Assemble: no matching Parts");
        break;
      }
      if (
        next[owner].length >= MAX_HAND_CARDS &&
        !next[owner].some((c) => c.part)
      ) {
        messages.push("Assemble: hand full");
        break;
      }
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      const template = choices[(state >>> 0) % choices.length];
      const part: Stone = {
        ...structuredClone(template),
        partKey: template.id,
        id: `custom-conjured-part-${(seed >>> 0).toString(36)}-${cell.playedOrder || index}-${serial++}`,
        conjured: true,
      };
      next[owner].push(part);
      messages.push(`Assemble: ${part.name}`);
      next[owner] = combineParts(next[owner], recipes);
    }
  }
  next[0] = combineParts(next[0], recipes);
  next[1] = combineParts(next[1], recipes);
  return { board, hands: next, messages };
}
