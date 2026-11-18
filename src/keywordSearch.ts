import { KEYWORD_RULES } from "./game.ts";
import type { KeywordType, StoneKeyword } from "./game.ts";
export function keywordTypes(
  keywords: readonly StoneKeyword[] = [],
  depth = 0,
): KeywordType[] {
  if (depth > 6) return [];
  return [
    ...new Set(
      keywords.flatMap((keyword) => [
        keyword.type,
        ...("keywords" in keyword
          ? keywordTypes(keyword.keywords || [], depth + 1)
          : []),
        ...(keyword.type === "trap"
          ? keyword.trap.effects.flatMap((effect) =>
              effect.kind === "grant"
                ? keywordTypes(effect.keywords || [], depth + 1)
                : [],
            )
          : []),
      ]),
    ),
  ];
}
export function keywordSearchText(
  keywords: readonly StoneKeyword[] = [],
): string {
  return keywordTypes(keywords)
    .map(
      (type) => `${KEYWORD_RULES[type].name} ${KEYWORD_RULES[type].condition}`,
    )
    .join(" ");
}
export function keywordMatches(type: KeywordType, query: string): boolean {
  const text =
    `${type.replaceAll("-", " ")} ${KEYWORD_RULES[type].name} ${KEYWORD_RULES[type].condition}`.toLowerCase();
  return query
    .trim()
    .toLowerCase()
    .replaceAll("-", " ")
    .split(/\s+/)
    .every((word) => text.includes(word));
}
