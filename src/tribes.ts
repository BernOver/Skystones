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
export type BuiltinTribe = keyof typeof TRIBES;
export type Tribe = BuiltinTribe | `custom:${string}`;
export type ComboCondition = "element" | "tribe" | "either" | "both";
export const TRIBE_IDS = Object.keys(TRIBES) as BuiltinTribe[];
export const CUSTOM_TRIBES_STORAGE = "skystones-custom-tribes-v1";
export const TRIBES_CHANGED = "skystones-tribes-changed";
export function customTribe(name: string): Tribe {
  const clean = name.trim().replace(/\s+/g, " ");
  if (!clean || clean.length > 32 || /[\u0000-\u001f\u007f]/.test(clean))
    throw new Error("Use a tribe name of 1–32 characters.");
  const builtin = TRIBE_IDS.find(
    (id) => TRIBES[id].name.toLowerCase() === clean.toLowerCase(),
  );
  return builtin || `custom:${encodeURIComponent(clean.toLowerCase())}`;
}
function customName(value: string): string | null {
  if (!value.startsWith("custom:") || value.length > 400) return null;
  try {
    const name = decodeURIComponent(value.slice(7));
    return name &&
      name.length <= 32 &&
      !/[\u0000-\u001f\u007f]/.test(name) &&
      customTribe(name) === value
      ? name
      : null;
  } catch {
    return null;
  }
}
export function readCustomTribes(): { id: Tribe; name: string }[] {
  try {
    const saved = JSON.parse(
      localStorage.getItem(CUSTOM_TRIBES_STORAGE) || "[]",
    );
    return Array.isArray(saved)
      ? saved
          .filter(
            (entry) =>
              entry &&
              validTribe(entry.id) &&
              entry.id.startsWith("custom:") &&
              typeof entry.name === "string" &&
              customTribe(entry.name) === entry.id,
          )
          .slice(0, 200)
      : [];
  } catch {
    return [];
  }
}
export function saveCustomTribe(name: string): Tribe {
  const id = customTribe(name);
  if (!id.startsWith("custom:")) return id;
  const tribes = readCustomTribes();
  if (!tribes.some((entry) => entry.id === id)) {
    if (tribes.length >= 200)
      throw new Error("You can save up to 200 custom tribes.");
    localStorage.setItem(
      CUSTOM_TRIBES_STORAGE,
      JSON.stringify([
        ...tribes,
        { id, name: name.trim().replace(/\s+/g, " ") },
      ]),
    );
    window.dispatchEvent(new Event(TRIBES_CHANGED));
  }
  return id;
}
export function availableTribes(extra: readonly Tribe[] = []): Tribe[] {
  return [
    ...new Set<Tribe>([
      ...TRIBE_IDS,
      ...readCustomTribes().map((entry) => entry.id),
      ...extra,
    ]),
  ];
}
export function customTribeLabels(
  value: unknown,
): { id: Tribe; name: string }[] {
  const ids = new Set<Tribe>(),
    seen = new Set<object>();
  const visit = (item: unknown) => {
    if (
      typeof item === "string" &&
      item.startsWith("custom:") &&
      validTribe(item)
    )
      ids.add(item);
    else if (item && typeof item === "object" && !seen.has(item)) {
      seen.add(item);
      Object.values(item).forEach(visit);
    }
  };
  visit(value);
  return [...ids].map((id) => ({ id, name: tribeName(id) }));
}
export function rememberCustomTribes(value: unknown, labels?: unknown) {
  const names = Array.isArray(labels)
    ? labels.filter(
        (entry) =>
          entry &&
          typeof entry.name === "string" &&
          validTribe(entry.id) &&
          customTribe(entry.name) === entry.id,
      )
    : [];
  for (const tribe of customTribeLabels(value))
    saveCustomTribe(
      names.find((entry) => entry.id === tribe.id)?.name || tribe.name,
    );
}
export function validTribe(value: unknown): value is Tribe {
  return (
    typeof value === "string" &&
    (Object.hasOwn(TRIBES, value) || customName(value) !== null)
  );
}
export function validateTribes(value: unknown): value is Tribe[] {
  return (
    Array.isArray(value) &&
    value.length <= 128 &&
    new Set(value).size === value.length &&
    value.every(validTribe)
  );
}
export function tribeName(tribe: Tribe): string {
  return Object.hasOwn(TRIBES, tribe)
    ? TRIBES[tribe as BuiltinTribe].name
    : readCustomTribes().find((entry) => entry.id === tribe)?.name ||
        customName(tribe) ||
        "Unknown tribe";
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
