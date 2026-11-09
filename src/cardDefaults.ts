import {
  CHARACTER_STONES,
  ENEMY_STONES,
  refreshCharacterFlavor,
} from "./characters.ts";
import {
  validateStone,
  validateKeywords,
  keywordAssignmentKey,
  MAX_KEYWORDS,
  repeatableKeyword,
} from "./game.ts";
import type { Stone, StoneKeyword } from "./game.ts";

export const CHARACTER_DEFAULTS_STORAGE = "skystones-character-defaults-v1";
export interface CharacterDefault {
  card: Stone;
  revision: number;
}
export type CharacterDefaults = Record<string, CharacterDefault>;
export function originalCharacter(key?: string): Stone | undefined {
  return [...CHARACTER_STONES, ...ENEMY_STONES].find(
    (card) => card.portrait === key,
  );
}
export function parseCharacterDefaults(value: unknown): CharacterDefaults {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: CharacterDefaults = {};
  for (const [key, input] of Object.entries(value)) {
    const original = originalCharacter(key),
      entry = input as CharacterDefault;
    if (
      original &&
      entry &&
      Number.isSafeInteger(entry.revision) &&
      entry.revision > 0 &&
      entry.card?.id === original.id &&
      entry.card.characterKey === key &&
      entry.card.defaultRevision === undefined &&
      !entry.card.token &&
      !entry.card.conjured &&
      !entry.card.encounterStart &&
      !entry.card.receivedKeywords &&
      !entry.card.receivedElement &&
      !entry.card.discardBuffs &&
      !entry.card.swapParts &&
      !entry.card.runtimeEffects &&
      !entry.card.supercharger &&
      validateStone({ ...entry.card, id: "custom-default-validation" })
    )
      result[key] = structuredClone(entry);
  }
  return result;
}
let cachedText: string | null | undefined;
let cachedDefaults: CharacterDefaults = {};
export function readCharacterDefaults(): CharacterDefaults {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(CHARACTER_DEFAULTS_STORAGE);
    if (raw !== cachedText) {
      const parsed = parseCharacterDefaults(JSON.parse(raw || "null"));
      cachedText = raw;
      cachedDefaults = parsed;
    }
    return cachedDefaults;
  } catch {
    return {};
  }
}
export function saveCharacterDefaults(defaults: CharacterDefaults): void {
  const valid = parseCharacterDefaults(defaults);
  if (Object.keys(valid).length !== Object.keys(defaults).length)
    throw new Error("One of the character defaults is invalid.");
  const raw = JSON.stringify(valid);
  localStorage.setItem(CHARACTER_DEFAULTS_STORAGE, raw);
  cachedText = raw;
  cachedDefaults = valid;
}
export function editedCharacterDefault(
  key: string,
  edited: Stone,
  defaults: CharacterDefaults,
): CharacterDefaults {
  const original = originalCharacter(key);
  if (!original)
    throw new Error("Choose a character from the original collection.");
  const {
    baseEdges: _edges,
    baseKeywords: _keywords,
    defaultRevision: _revision,
    receivedKeywords: _received,
    receivedElement: _element,
    discardBuffs: _discard,
    encounterStart: _encounter,
    swapParts: _swap,
    ...definition
  } = edited;
  const card: Stone = {
    ...definition,
    id: original.id,
    characterKey: key,
    custom: false,
  };
  const next = {
    ...defaults,
    [key]: {
      card,
      revision: Math.max(Date.now(), (defaults[key]?.revision || 0) + 1),
    },
  };
  if (!parseCharacterDefaults(next)[key])
    throw new Error("Give the character a name and valid pips and keywords.");
  return next;
}
export function characterDefault(
  stone: Stone,
  defaults = readCharacterDefaults(),
): Stone {
  const key = stone.characterKey || stone.portrait;
  const entry = key ? defaults[key] : undefined;
  if (!entry) return stone;
  return refreshCharacterFlavor({
    ...stone,
    ...structuredClone(entry.card),
    id: stone.id,
    custom: stone.custom,
    characterKey: key,
    defaultRevision: entry.revision,
  });
}

export function withAdditionalKeywords(
  base: StoneKeyword[],
  additions: StoneKeyword[],
): StoneKeyword[] {
  const result = structuredClone(base);
  for (const keyword of additions) {
    const duplicate = result.findIndex(
      (old) => keywordAssignmentKey(old) === keywordAssignmentKey(keyword),
    );
    if (!repeatableKeyword(keyword.type) && duplicate !== -1) continue;
    if (result.length < MAX_KEYWORDS && validateKeywords([...result, keyword]))
      result.push(structuredClone(keyword));
  }
  return result;
}
