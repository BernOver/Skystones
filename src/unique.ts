import { validateStone } from "./game.ts";
import type { Stone } from "./game.ts";
import { CONJURE_CARDS } from "./conjure.ts";
import { characterDefault } from "./cardDefaults.ts";
export function validUniqueKey(key: unknown): key is string {
  return typeof key === "string" && /^custom-[a-zA-Z0-9_-]{1,150}$/.test(key);
}
export function uniqueDefinition(value: unknown): value is Stone {
  return (
    validateStone(value) &&
    value.unique === true &&
    !value.token &&
    !value.conjured &&
    !value.encounterStart &&
    !value.swapParts &&
    !value.supercharger &&
    !value.runtimeEffects &&
    !value.receivedKeywords &&
    !value.receivedElement &&
    !value.discardBuffs
  );
}
export function uniqueCatalogue(
  custom: readonly Stone[] = [],
  characters: readonly Stone[] = [],
) {
  return [
    ...characters
      .filter((c) => c.unique && !c.token)
      .map((c) => ({
        ...c,
        id: `custom-unique-default-${c.characterKey || c.portrait}`,
      })),
    ...custom.filter(uniqueDefinition),
  ];
}
export function readUniques(): Stone[] {
  try {
    const data = JSON.parse(
      localStorage.getItem("skystones-library-v1") || "null",
    );
    return uniqueCatalogue(
      data?.custom || [],
      CONJURE_CARDS.map((c) => characterDefault(c)),
    );
  } catch {
    return [];
  }
}
export function uniqueName(key: string) {
  return readUniques().find((c) => c.id === key)?.name || "Missing Unique card";
}
