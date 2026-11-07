import { CHARACTER_PORTRAITS } from "./characters.ts";
import type { Stone, StoneKeyword } from "./game.ts";

export const TRIBES = {
  giants: { name: "Giants", group: "Character groups" },
  "swap-force": { name: "SWAP Force", group: "Character groups" },
  "trap-masters": { name: "Trap Masters", group: "Character groups" },
  superchargers: { name: "SuperChargers", group: "Character groups" },
  imaginators: { name: "Imaginators", group: "Character groups" },
  minis: { name: "Minis", group: "Character groups" },
  core: { name: "Core", group: "Character groups" },
  villains: { name: "Villains", group: "Character groups" },
  enemies: { name: "Enemies", group: "Character groups" },
  "spyros-adventure": { name: "Spyro’s Adventure", group: "Game families" },
  "giants-era": { name: "Giants Era", group: "Game families" },
  "swap-force-era": { name: "SWAP Force Era", group: "Game families" },
  "trap-team": { name: "Trap Team", group: "Game families" },
  "superchargers-era": { name: "SuperChargers Era", group: "Game families" },
} as const;
export type Tribe = keyof typeof TRIBES;
export type ComboCondition = "element" | "tribe" | "either" | "both";
export const TRIBE_IDS = Object.keys(TRIBES) as Tribe[];
export function validTribe(value: unknown): value is Tribe {
  return typeof value === "string" && Object.hasOwn(TRIBES, value);
}
export function validateTribes(value: unknown): value is Tribe[] {
  return (
    Array.isArray(value) &&
    value.length <= TRIBE_IDS.length &&
    new Set(value).size === value.length &&
    value.every(validTribe)
  );
}
export function tribeName(tribe: Tribe): string {
  return TRIBES[tribe].name;
}
function inferTribes(role: string, game: string, id: string): Tribe[] {
  const tags: Tribe[] = [],
    lower = role.toLowerCase();
  if (game === "Imaginators") tags.push("imaginators");
  if (lower.includes("giant")) tags.push("giants");
  else if (lower.includes("swap force")) tags.push("swap-force");
  else if (lower.includes("trap master")) tags.push("trap-masters");
  else if (lower.includes("supercharger")) tags.push("superchargers");
  else if (/mini|sidekick/.test(lower)) tags.push("minis");
  else if (lower.includes("enemy")) tags.push("enemies");
  else if (game !== "Imaginators") tags.push("core");
  if (
    /villain|doom raider/.test(lower) ||
    [
      "chompy-mage",
      "dr-krankcase",
      "golden-queen",
      "wolfgang",
      "grave-clobber",
      "hood-sickle",
      "tae-kwon-crow",
      "bad-juju",
      "blaster-tron",
      "pain-yatta",
      "kaos",
      "neo-cortex",
    ].some((name) => id.includes(name))
  )
    tags.push("villains");
  const family: Record<string, Tribe> = {
    "Spyro's Adventure": "spyros-adventure",
    Giants: "giants-era",
    "Swap Force": "swap-force-era",
    "Trap Team": "trap-team",
    SuperChargers: "superchargers-era",
  };
  if (family[game]) tags.push(family[game]);
  return [...new Set(tags)];
}
const PORTRAIT_TRIBES = new Map(
  CHARACTER_PORTRAITS.map((portrait) => [
    portrait.id,
    inferTribes(portrait.role, portrait.game, portrait.id),
  ]),
);
const EMPTY: readonly Tribe[] = [];
export function portraitTribes(portrait?: string): readonly Tribe[] {
  return portrait ? PORTRAIT_TRIBES.get(portrait) || EMPTY : EMPTY;
}
export function stoneTribes(
  stone: Pick<Stone, "tribes" | "portrait">,
): readonly Tribe[] {
  return stone.tribes ?? portraitTribes(stone.portrait);
}
export function hasTribe(
  stone: Pick<Stone, "tribes" | "portrait">,
  tribe: Tribe,
): boolean {
  return stoneTribes(stone).includes(tribe);
}
export function sharedTribes(first: Stone, second: Stone): Tribe[] {
  const other = stoneTribes(second);
  return stoneTribes(first).filter((tribe) => other.includes(tribe));
}
export function tribalKeyword(
  keyword: StoneKeyword,
  tribe: Tribe,
): StoneKeyword {
  if (
    keyword.type === "resonance" ||
    keyword.type === "next-play" ||
    (keyword.type === "conjure" && keyword.mode === "random")
  )
    return { ...keyword, tribe };
  if (keyword.type === "combo")
    return { ...keyword, condition: "tribe", tribe };
  if (keyword.type === "environment")
    return { ...keyword, environment: { ...keyword.environment, tribe } };
  return keyword;
}
