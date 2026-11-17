import type { Stone, Edges, Element, KeywordType, Side } from "./game.ts";
import { ELEMENTS, KEYWORD_RULES } from "./game.ts";
import { hasTribe, validTribe, tribeName } from "./tribes.ts";
import type { Tribe } from "./tribes.ts";

export const CARD_TYPES = {
  stone: "Stones",
  spell: "Spells",
  token: "Tokens",
  unique: "Unique cards",
  part: "Parts",
  supercharger: "Superchargers",
} as const;
export type CardType = keyof typeof CARD_TYPES;
export type PipTest = { compare: "eq" | "lte" | "gte"; value: number };
export interface CardFilter {
  type?: CardType;
  element?: Element;
  tribe?: Tribe;
  keyword?: KeywordType;
  pips?: PipTest & { side: Side | "any" | "all" | "total" };
  ids?: string[];
}
export function comparePips(n: number, test: PipTest) {
  return test.compare === "eq"
    ? n === test.value
    : test.compare === "lte"
      ? n <= test.value
      : n >= test.value;
}
export function validPipTest(value: unknown): value is PipTest {
  const v = value as PipTest;
  return (
    !!v &&
    typeof v === "object" &&
    ["eq", "lte", "gte"].includes(v.compare) &&
    Number.isInteger(v.value) &&
    v.value >= 0 &&
    v.value <= 396
  );
}
export function validCardFilter(value: unknown): value is CardFilter {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as CardFilter;
  return (
    (v.type === undefined || Object.hasOwn(CARD_TYPES, v.type)) &&
    (v.element === undefined || Object.hasOwn(ELEMENTS, v.element)) &&
    (v.tribe === undefined || validTribe(v.tribe)) &&
    (v.keyword === undefined || Object.hasOwn(KEYWORD_RULES, v.keyword)) &&
    (v.ids === undefined ||
      (Array.isArray(v.ids) &&
        v.ids.length <= 100 &&
        v.ids.every((id) => typeof id === "string" && id.length <= 200))) &&
    (v.pips === undefined ||
      (validPipTest(v.pips) &&
        [0, 1, 2, 3, "any", "all", "total"].includes(v.pips.side)))
  );
}
export function cardMatches(
  card: Stone,
  filter: CardFilter = {},
  edges: Edges = card.edges,
): boolean {
  if (filter.ids && !filter.ids.includes(card.id)) return false;
  if (filter.element && card.element !== filter.element) return false;
  if (filter.tribe && !hasTribe(card, filter.tribe)) return false;
  if (filter.keyword && !card.keywords?.some((k) => k.type === filter.keyword))
    return false;
  if (
    filter.type &&
    !(filter.type === "stone"
      ? !card.spell && !card.part && !card.supercharger
      : filter.type === "spell"
        ? !!card.spell
        : filter.type === "token"
          ? !!card.token && !card.spell
          : !!card[filter.type])
  )
    return false;
  if (!filter.pips) return true;
  const test = filter.pips;
  return test.side === "total"
    ? comparePips(
        edges.reduce((a, b) => a + b),
        test,
      )
    : test.side === "any"
      ? edges.some((n) => comparePips(n, test))
      : test.side === "all"
        ? edges.every((n) => comparePips(n, test))
        : comparePips(edges[test.side], test);
}
export function filterText(filter?: CardFilter): string {
  if (!filter) return "all cards";
  const pip = filter.pips;
  return (
    [
      filter.type && CARD_TYPES[filter.type],
      filter.element && ELEMENTS[filter.element].name,
      filter.tribe && tribeName(filter.tribe),
      filter.keyword && KEYWORD_RULES[filter.keyword].name,
      pip &&
        `${pip.side === "any" ? "at least one side" : pip.side === "all" ? "every side" : pip.side === "total" ? "total pips" : ["North", "East", "South", "West"][pip.side]} ${pip.compare === "eq" ? "=" : pip.compare === "lte" ? "≤" : "≥"} ${pip.value}`,
    ]
      .filter(Boolean)
      .join(" · ") || "all cards"
  );
}
