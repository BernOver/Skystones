import type { Element, Stone } from "./game.ts";
import { SUPERCHARGER_VEHICLES } from "./superchargers.ts";
export interface SuperchargerRecipe {
  id: string;
  parts: [string, string];
  name: string;
  portrait: string;
  element: Element;
}
export const RECIPES_STORAGE = "skystones-supercharger-recipes-v1";
const elements = [
  "fire",
  "life",
  "water",
  "air",
  "magic",
  "earth",
  "tech",
  "undead",
  "light",
  "dark",
  "neutral",
];
const partKeyPattern = /^custom-token-[a-zA-Z0-9_-]{1,100}$/;
export function partIdentity(part: Stone): string {
  return part.partKey || part.id;
}
export function recipePair(parts: readonly string[]): string {
  return [...parts].sort().join("|");
}
export function validRecipe(value: unknown): value is SuperchargerRecipe {
  if (!value || typeof value !== "object") return false;
  const r = value as SuperchargerRecipe;
  return (
    typeof r.id === "string" &&
    /^recipe-[\w-]{1,100}$/.test(r.id) &&
    Array.isArray(r.parts) &&
    r.parts.length === 2 &&
    r.parts.every((p) => typeof p === "string" && partKeyPattern.test(p)) &&
    typeof r.name === "string" &&
    r.name.trim().length > 0 &&
    r.name.length <= 40 &&
    SUPERCHARGER_VEHICLES.some((p) => p.id === r.portrait) &&
    elements.includes(r.element)
  );
}
export function validRecipes(value: unknown): value is SuperchargerRecipe[] {
  return (
    Array.isArray(value) &&
    value.length <= 250 &&
    value.every(validRecipe) &&
    new Set(value.map((r) => r.id)).size === value.length &&
    new Set(value.map((r) => recipePair(r.parts))).size === value.length
  );
}
export function readRecipes(): SuperchargerRecipe[] {
  try {
    const input = JSON.parse(localStorage.getItem(RECIPES_STORAGE) || "[]");
    return validRecipes(input) ? input : [];
  } catch {
    return [];
  }
}
export function saveRecipes(recipes: SuperchargerRecipe[]) {
  if (!validRecipes(recipes))
    throw new Error(
      "Each pair of Parts can have only one recipe. Check the selected Parts, vehicle, and name.",
    );
  localStorage.setItem(RECIPES_STORAGE, JSON.stringify(recipes));
  window.dispatchEvent(new Event(RECIPES_STORAGE));
}
export function mergeRecipes(
  existing: SuperchargerRecipe[],
  incoming: unknown,
): SuperchargerRecipe[] {
  if (!validRecipes(incoming))
    throw new Error("Invalid Supercharger recipe bundle.");
  const ids = new Set(incoming.map((r) => r.id)),
    pairs = new Set(incoming.map((r) => recipePair(r.parts)));
  const merged = [
    ...existing.filter(
      (r) => !ids.has(r.id) && !pairs.has(recipePair(r.parts)),
    ),
    ...structuredClone(incoming),
  ];
  if (!validRecipes(merged)) throw new Error("Too many Supercharger recipes.");
  return merged;
}
export function matchingRecipe(
  first: Stone,
  second: Stone,
  recipes: readonly SuperchargerRecipe[],
): SuperchargerRecipe | undefined {
  const key = recipePair([partIdentity(first), partIdentity(second)]);
  return recipes.find((r) => recipePair(r.parts) === key);
}
