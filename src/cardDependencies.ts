import { readRecipes } from "./recipes.ts";
import type { SuperchargerRecipe } from "./recipes.ts";
import type { Stone, StoneKeyword } from "./game.ts";
import { hasTribe } from "./tribes.ts";
import { readTokens } from "./tokens.ts";
import { readUniques, uniqueDefinition } from "./unique.ts";
export function cardDependencies(
  card: Stone,
  tokens = readTokens(),
  uniques = readUniques(),
  recipes: readonly SuperchargerRecipe[] = readRecipes(),
): { tokens: Stone[]; uniques: Stone[]; recipes: SuperchargerRecipe[] } {
  const found = new Map<string, Stone>(),
    seen = new Set<string>(),
    foundRecipes = new Map<string, SuperchargerRecipe>();
  const add = (c: Stone) => {
    if (found.has(c.id)) return;
    found.set(c.id, c);
    visit(c);
    if (c.part)
      for (const recipe of recipes.filter((r) => r.parts.includes(c.id))) {
        if (foundRecipes.has(recipe.id)) continue;
        foundRecipes.set(recipe.id, recipe);
        for (const key of recipe.parts) {
          const part = tokens.find((t) => t.part && t.id === key);
          if (!part)
            throw new Error(
              "A recipe Part is missing. Edit its recipe before exporting.",
            );
          add(part);
        }
      }
  };
  const keywords = (list: StoneKeyword[]): StoneKeyword[] =>
    list.flatMap((k) => [
      k,
      ...("keywords" in k ? keywords(k.keywords || []) : []),
    ]);
  const visit = (c: Stone) => {
    if (seen.has(c.id)) return;
    seen.add(c.id);
    for (const k of keywords(c.keywords || [])) {
      if (k.type === "assemble") {
        const parts = tokens.filter(
          (t) => t.part && (k.mode !== "specific" || t.id === k.part),
        );
        if (k.mode === "specific" && !parts.length)
          throw new Error(
            "A referenced Part is missing. Choose another before exporting.",
          );
        parts.forEach(add);
        continue;
      }
      if (k.type !== "conjure") continue;
      if (k.mode === "token" || k.mode === "unique") {
        const key = k.mode === "token" ? k.token : k.unique,
          pool = k.mode === "token" ? tokens : uniques,
          dep = pool.find((t) => t.id === key);
        if (!dep)
          throw new Error(
            `A referenced ${k.mode === "unique" ? "Unique card" : "token"} is missing. Choose another before exporting.`,
          );
        add(dep);
      } else if (k.mode === "random" && k.pool && k.pool !== "cards") {
        const pool =
          k.pool === "unique"
            ? uniques
            : tokens.filter((t) =>
                k.pool === "spells"
                  ? !!t.spell
                  : k.pool === "parts"
                    ? !!t.part
                    : !t.part && !t.spell,
              );
        pool
          .filter(
            (t) =>
              (!k.element || t.element === k.element) &&
              (!k.tribe || hasTribe(t, k.tribe)),
          )
          .forEach(add);
      }
    }
  };
  if (card.part) add(card);
  else visit(card);
  found.delete(card.id);
  return {
    tokens: [...found.values()].filter((c) => c.token),
    uniques: [...found.values()].filter((c) => c.unique),
    recipes: [...foundRecipes.values()],
  };
}
export function mergeUniqueDefinitions(
  custom: Stone[],
  definitions: unknown,
): Stone[] {
  if (
    !Array.isArray(definitions) ||
    definitions.length > 250 ||
    !definitions.every(uniqueDefinition) ||
    new Set(definitions.map((c) => c.id)).size !== definitions.length
  )
    throw new Error("Invalid Unique card definitions.");
  const ids = new Set(definitions.map((c) => c.id));
  return [
    ...custom.filter((c) => !ids.has(c.id)),
    ...structuredClone(definitions),
  ];
}
