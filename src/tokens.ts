import { validateStone } from "./game.ts";
import { hasTribe } from "./tribes.ts";
import type { Stone, StoneKeyword } from "./game.ts";

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
      description:
        "A token available only through Conjure. Lasts for the current battle.",
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
    !value.conjured &&
    !value.receivedKeywords &&
    validTokenKey(value.id)
  );
}
export function tokenCatalogue(custom: readonly Stone[] = []): Stone[] {
  const byId = new Map(DEFAULT_TOKENS.map((card) => [card.id, card]));
  for (const card of custom) if (tokenDefinition(card)) byId.set(card.id, card);
  return [...byId.values()];
}
let cachedLibrary: string | null | undefined;
let cachedTokens = DEFAULT_TOKENS;
export function readTokens(): Stone[] {
  if (typeof localStorage === "undefined") return DEFAULT_TOKENS;
  try {
    const raw = localStorage.getItem(LIBRARY_STORAGE);
    if (raw !== cachedLibrary) {
      const library = JSON.parse(raw || "null");
      cachedTokens = tokenCatalogue(
        Array.isArray(library?.custom) ? library.custom : [],
      );
      cachedLibrary = raw;
    }
    return cachedTokens;
  } catch {
    return DEFAULT_TOKENS;
  }
}
export function tokenName(key: string): string {
  return readTokens().find((card) => card.id === key)?.name || "Missing token";
}
export function deckEligible(card: Stone): boolean {
  return !card.token && !card.conjured;
}
export function tokenDependencies(card: Stone, tokens = readTokens()): Stone[] {
  const found = new Map<string, Stone>();
  const visit = (stone: Stone) => {
    const flatten = (keywords: StoneKeyword[]): StoneKeyword[] =>
      keywords.flatMap((keyword) =>
        keyword.type === "combo" || keyword.type === "next-play"
          ? flatten(keyword.keywords || [])
          : keyword.type === "conjure"
            ? [keyword, ...flatten(keyword.keywords || [])]
            : [keyword],
      );
    const keywords = flatten(stone.keywords || []);
    const add = (token: Stone) => {
      if (found.has(token.id)) return;
      found.set(token.id, token);
      visit(token);
    };
    for (const keyword of keywords) {
      if (keyword.type !== "conjure") continue;
      if (keyword.mode === "token") {
        const token = tokens.find((token) => token.id === keyword.token);
        if (!token)
          throw new Error(
            "A referenced token is missing. Choose another token before exporting.",
          );
        add(token);
      } else if (
        keyword.mode === "random" &&
        keyword.pool &&
        keyword.pool !== "cards"
      ) {
        tokens
          .filter(
            (token) =>
              (!keyword.element || token.element === keyword.element) &&
              (!keyword.tribe || hasTribe(token, keyword.tribe)),
          )
          .forEach(add);
      }
    }
  };
  if (card.token) found.set(card.id, card);
  visit(card);
  found.delete(card.id);
  return [...found.values()];
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
