import { KEYWORD_RULES, mergeKeywordGrants } from "./game.ts";
import type { Element, KeywordType, Side, StoneKeyword } from "./game.ts";
import { DEFAULT_TRAPS } from "./traps.ts";

export interface RandomKeywordSpec {
  count: number;
  pool?: KeywordType[];
  strength?: number;
}
export function randomKeywordTypes(): KeywordType[] {
  return (Object.keys(KEYWORD_RULES) as KeywordType[]).filter(
    (type) => type !== "flash",
  );
}
export function validRandomKeywords(
  value: unknown,
): value is RandomKeywordSpec {
  const v = value as RandomKeywordSpec;
  return (
    !!v &&
    Number.isInteger(v.count) &&
    v.count >= 1 &&
    v.count <= 5 &&
    (v.strength === undefined ||
      (Number.isInteger(v.strength) && v.strength >= 1 && v.strength <= 5)) &&
    (v.pool === undefined ||
      (Array.isArray(v.pool) &&
        v.pool.length > 0 &&
        new Set(v.pool).size === v.pool.length &&
        v.pool.every(
          (type) => type !== "flash" && Object.hasOwn(KEYWORD_RULES, type),
        )))
  );
}
export function keywordTemplate(
  type: KeywordType,
  side: Side = 0,
  element: Element = "magic",
  strength = 1,
): StoneKeyword {
  switch (type) {
    case "environment-immunity":
      return { type };
    case "flash":
      throw new Error("Flash cannot be randomly generated.");
    case "trap":
      return { type, trap: structuredClone(DEFAULT_TRAPS[0]) };
    case "assemble":
      return { type, count: Math.min(5, strength + 1) };
    case "amplify":
      return { type, effect: "all", duration: "next", count: 1 };
    case "silence":
      return { type };
    case "dizzy":
      return { type, sides: [side] };
    case "shuffle":
      return { type, sides: [side, ((side + 1) % 4) as Side] };
    case "combo":
      return { type, pips: [{ side, amount: strength }] };
    case "next-play":
      return { type, side, amount: strength, recipient: "self" };
    case "shift":
      return {
        type,
        side,
        direction: ((side + 1) % 4) as Side,
        affects: "enemies",
      };
    case "relocate":
      return { type, affects: "allies" };
    case "command":
      return { type, turns: strength };
    case "turn-start":
      return {
        type,
        when: "self",
        keywords: [
          { type: "next-play", recipient: "self", side, amount: strength },
        ],
      };
    case "environment":
      return {
        type,
        environment: { kind: "blight", side: "all", amount: strength },
      };
    case "conjure":
      return { type, mode: "random", count: strength, recipient: "self" };
    case "resonance":
      return { type, side, element };
    case "discard":
      return { type, mode: "random", recipient: "opponent", count: strength };
    case "scavenge":
      return { type, from: "self", pips: [{ side, amount: strength }] };
    case "enchant":
      return {
        type,
        target: "hand",
        mode: "random",
        count: 1,
        keywords: [{ type: "shield", side, amount: strength }],
      };
    case "parting-gift":
      return {
        type,
        target: "allies",
        keywords: [{ type: "shield", side, amount: strength }],
      };
    case "discard-priority":
      return { type, priority: strength };
    default:
      return { type, side, amount: strength };
  }
}
export function keywordSeed(value: string, seed = 2166136261): number {
  return (
    Array.from(value).reduce(
      (n, char) => Math.imul(n ^ char.charCodeAt(0), 16777619),
      seed,
    ) >>> 0
  );
}
export function rollKeywords(
  spec: RandomKeywordSpec,
  seed: number,
  existing: StoneKeyword[] = [],
  element: Element = "magic",
): StoneKeyword[] {
  if (!validRandomKeywords(spec))
    throw new Error("Choose a valid random keyword pool without Flash.");
  let state = seed >>> 0 || 0x9e3779b9;
  const random = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  };
  const pool = spec.pool || randomKeywordTypes(),
    result: StoneKeyword[] = [];
  for (
    let attempt = 0;
    result.length < spec.count && attempt < spec.count * 96;
    attempt++
  ) {
    const next = keywordTemplate(
      pool[Math.floor(random() * pool.length)],
      Math.floor(random() * 4) as Side,
      element,
      spec.strength || 1,
    );
    const added = mergeKeywordGrants([...existing, ...result], [next]).added;
    if (added.length) result.push(next);
  }
  return result;
}
