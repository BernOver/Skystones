import { DEFAULT_PARTS } from "./assemble.ts";
import { validateStone } from "./game.ts";
import { cardDependencies } from "./cardDependencies.ts";
import type { Stone } from "./game.ts";

export const TOKEN_ID_PREFIX = "custom-token-";
export const LIBRARY_STORAGE = "skystones-library-v1";
export const DEFAULT_TOKENS: Stone[] = [
  {
    id: "custom-token-chompy-seedling",
    name: "Chompy Seedling",
    element: "life",
    creature: "mushroom",
    portrait: "enemy-enfuego-chompy",
    edges: [0, 1, 1, 0],
    tribes: ["enemies", "giants-era"],
    keywords: [],
  },
  {
    id: "custom-token-arkeyan-drone",
    name: "Arkeyan Drone",
    element: "tech",
    creature: "robot",
    portrait: "enemy-arkeyan-bomber",
    edges: [1, 0, 1, 0],
    tribes: ["enemies", "giants-era"],
    keywords: [{ type: "shield", side: 0 }],
  },
  {
    id: "custom-token-fire-spark",
    name: "Fire Spark",
    element: "fire",
    creature: "golem",
    portrait: "hot-head",
    edges: [1, 1, 0, 1],
    tribes: ["giants", "giants-era"],
    keywords: [],
  },
  {
    id: "custom-token-water-wisp",
    name: "Water Wisp",
    element: "water",
    creature: "whale",
    portrait: "gill-runt",
    edges: [0, 1, 1, 0],
    tribes: ["minis", "trap-team"],
    keywords: [],
  },
  {
    id: "custom-token-shadow-decoy",
    name: "Shadow Decoy",
    element: "dark",
    creature: "bat",
    portrait: "hood-sickle",
    edges: [0, 0, 1, 0],
    tribes: ["villains", "imaginators"],
    keywords: [{ type: "shield", side: 3 }],
  },
  {
    id: "custom-token-magic-echo",
    name: "Magic Echo",
    element: "magic",
    creature: "dragon",
    portrait: "pop-fizz",
    edges: [1, 0, 0, 1],
    tribes: ["core", "giants-era"],
    keywords: [{ type: "combo", pips: [{ side: 0, amount: 1 }] }],
  },
].map(
  (stone) =>
    ({
      ...stone,
      token: true,
      custom: true,
      origin: "skylanders",
      description: (
        {
          "custom-token-chompy-seedling":
            "A little Chompy sprout with eager teeth, ready to grow into somebody else's problem.",
          "custom-token-arkeyan-drone":
            "A small Arkeyan automaton built to stand guard and keep its maker's machinery moving.",
          "custom-token-fire-spark":
            "A flicker of Hot Head's volcanic heat, small enough to spend and bright enough to matter.",
          "custom-token-water-wisp":
            "A little splash of Gill Runt's courage, drifting into the fight on a friendly current.",
          "custom-token-shadow-decoy":
            "A borrowed silhouette left in Hood Sickle's wake, ready to take the blow meant for someone else.",
          "custom-token-magic-echo":
            "A shimmering afterimage from Pop Fizz's bubbling magic, eager to repeat the last clever trick.",
        } as Record<string, string>
      )[stone.id],
    }) as Stone,
);

export function validTokenKey(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^custom-token-[a-zA-Z0-9_-]{1,100}$/.test(value)
  );
}
export function tokenDefinition(value: unknown): value is Stone {
  return (
    validateStone(value) &&
    value.token === true &&
    !value.unique &&
    !value.runtimeEffects &&
    !value.supercharger &&
    !value.conjured &&
    !value.encounterStart &&
    !value.swapParts &&
    !value.receivedKeywords &&
    !value.receivedElement &&
    !value.discardBuffs &&
    validTokenKey(value.id)
  );
}
export function tokenCatalogue(custom: readonly Stone[] = []): Stone[] {
  const byId = new Map(
    [...DEFAULT_TOKENS, ...DEFAULT_PARTS].map((card) => [card.id, card]),
  );
  for (const card of custom) if (tokenDefinition(card)) byId.set(card.id, card);
  return [...byId.values()];
}
let cachedLibrary: string | null | undefined;
let cachedTokens: Stone[] | undefined;
export function readTokens(): Stone[] {
  if (typeof localStorage === "undefined") return tokenCatalogue();
  try {
    const raw = localStorage.getItem(LIBRARY_STORAGE);
    if (raw !== cachedLibrary) {
      const library = JSON.parse(raw || "null");
      cachedTokens = tokenCatalogue(
        Array.isArray(library?.custom) ? library.custom : [],
      );
      cachedLibrary = raw;
    }
    return cachedTokens || tokenCatalogue();
  } catch {
    return tokenCatalogue();
  }
}
export function tokenName(key: string): string {
  return readTokens().find((card) => card.id === key)?.name || "Missing token";
}
export function deckEligible(card: Stone): boolean {
  return (
    !card.token &&
    !card.conjured &&
    !card.part &&
    !card.supercharger &&
    !card.runtimeEffects
  );
}
export function tokenDependencies(card: Stone, tokens = readTokens()): Stone[] {
  return cardDependencies(card, tokens).tokens;
}
export function mergeTokenDefinitions(
  custom: Stone[],
  definitions: Stone[],
): Stone[] {
  if (
    definitions.length > 100 ||
    !definitions.every(tokenDefinition) ||
    new Set(definitions.map((card) => card.id)).size !== definitions.length
  )
    throw new Error("Invalid token definitions.");
  const replaced = new Set(definitions.map((card) => card.id));
  return [
    ...custom.filter((card) => !replaced.has(card.id)),
    ...structuredClone(definitions),
  ];
}
