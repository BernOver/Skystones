import { validateStone } from "./game.ts";
import type { Stone } from "./game.ts";
import { CHARACTER_PORTRAITS } from "./characters.ts";

export const ENCOUNTERS_STORAGE = "skystones-encounters-v1";
export const ENCOUNTER_POOLS = {
  easy: "Easy encounters",
  hard: "Hard encounters",
  event: "Events",
  boss: "Bosses",
} as const;
export type EncounterPool = keyof typeof ENCOUNTER_POOLS;
export const ENCOUNTER_MECHANICS = {
  standard: "Standard duel · win the score",
  chest: "Treasure chest · control it for bonus gold",
  throne: "Throne · win the score and control the throne",
  vortex: "Elemental Vortex · rotating element bonuses",
  golden: "Golden throne · also control two corners",
} as const;
export interface EnemyCharacter {
  id: string;
  name: string;
  portrait: string;
  color: string;
  image?: string;
}
export interface EncounterDefinition {
  id: string;
  name: string;
  description: string;
  character: EnemyCharacter;
  pools: EncounterPool[];
  acts: (1 | 2)[];
  enabled: boolean;
  mechanic: keyof typeof ENCOUNTER_MECHANICS;
  // Undefined uses the Adventure generator. An explicit empty hand is valid.
  deck?: Stone[];
}
export interface EncounterLibrary {
  version: 1;
  characters: EnemyCharacter[];
  encounters: EncounterDefinition[];
}
const villainData = [
  [
    "chompy-mage",
    "Chompy Mage",
    "#678a3e",
    "Chompy Challenge",
    "A noisy mob of Chompies has gathered to cheer their champion.",
  ],
  [
    "dr-krankcase",
    "Dr. Krankcase",
    "#488e79",
    "Goo Works",
    "The doctor tests his latest stone-playing contraption.",
  ],
  [
    "wolfgang",
    "Wolfgang",
    "#79608b",
    "Bone Rattle Showdown",
    "Wolfgang tunes his bone harp for a stone-table showdown.",
  ],
  [
    "hood-sickle",
    "Hood Sickle",
    "#554a7c",
    "Shadow Crossing",
    "A silent guardian beckons you to a table in the shadows.",
  ],
  [
    "grave-clobber",
    "Grave Clobber",
    "#397eaa",
    "Tombside Tussle",
    "The ancient pharaoh dusts off his finest Skystones.",
  ],
  [
    "pain-yatta",
    "Pain-Yatta",
    "#ae6195",
    "Candy Clash",
    "Pain-Yatta sets his club down and scatters sweets beside the board.",
  ],
  [
    "tae-kwon-crow",
    "Tae Kwon Crow",
    "#bc613d",
    "Blazing Dojo",
    "The fiery master invites you to test your stone-playing discipline.",
  ],
  [
    "blaster-tron",
    "Blaster-Tron",
    "#9d8c4f",
    "Target Acquired",
    "Blaster-Tron's challenge protocol has selected you as its next rival.",
  ],
  [
    "kaos",
    "Kaos",
    "#655478",
    "Throne of Chaos",
    "Kaos dares you to seize his central throne and win the score.",
  ],
  [
    "golden-queen",
    "Golden Queen",
    "#af812f",
    "The Golden Court",
    "Seize the Queen's shielded throne, hold two corners, and win the score.",
  ],
];
export const BUILTIN_ENEMY_CHARACTERS: EnemyCharacter[] = villainData.map(
  ([id, name, color]) => ({ id, name, color, portrait: id }),
);
export const BUILTIN_ENCOUNTERS: EncounterDefinition[] = villainData.map(
  ([id, name, , title, description], index) => ({
    id: `builtin-${id}`,
    name: `${name} · ${title}`,
    description,
    character: BUILTIN_ENEMY_CHARACTERS[index],
    enabled: true,
    pools: index < 8 ? ["easy", "hard"] : ["boss"],
    acts: index < 8 ? [1, 2] : index === 8 ? [1] : [2],
    mechanic: index < 8 ? "standard" : index === 8 ? "throne" : "golden",
  }),
);
BUILTIN_ENCOUNTERS.push(
  {
    id: "builtin-vortex",
    name: "Kaos · Elemental Vortex",
    description:
      "Kaos changes the arena element after every play. Matching cards gain +1 on every side. Watch the next-element icon.",
    character: BUILTIN_ENEMY_CHARACTERS[8],
    enabled: true,
    pools: ["boss"],
    acts: [1],
    mechanic: "vortex",
  },
  {
    id: "builtin-chest",
    name: "Chompy Mage · The Chompy Hoard",
    description:
      "Claim the Chompy Mage's central treasure chest for extra gold.",
    character: BUILTIN_ENEMY_CHARACTERS[0],
    enabled: true,
    pools: ["event"],
    acts: [1, 2],
    mechanic: "chest",
  },
);
const text = (value: unknown, max: number) =>
  typeof value === "string" && value.trim().length > 0 && value.length <= max;
export function validEnemyCharacter(value: unknown): value is EnemyCharacter {
  if (!value || typeof value !== "object") return false;
  const character = value as EnemyCharacter;
  return (
    text(character.id, 100) &&
    text(character.name, 50) &&
    /^#[0-9a-f]{6}$/i.test(character.color) &&
    CHARACTER_PORTRAITS.some(
      (portrait) => portrait.id === character.portrait,
    ) &&
    (character.image === undefined ||
      (typeof character.image === "string" &&
        character.image.length <= 3_000_000 &&
        /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(
          character.image,
        )))
  );
}
export function validEncounter(value: unknown): value is EncounterDefinition {
  if (!value || typeof value !== "object") return false;
  const encounter = value as EncounterDefinition;
  return (
    text(encounter.id, 100) &&
    text(encounter.name, 80) &&
    text(encounter.description, 600) &&
    validEnemyCharacter(encounter.character) &&
    typeof encounter.enabled === "boolean" &&
    Object.hasOwn(ENCOUNTER_MECHANICS, encounter.mechanic) &&
    Array.isArray(encounter.pools) &&
    encounter.pools.length > 0 &&
    encounter.pools.length <= 4 &&
    new Set(encounter.pools).size === encounter.pools.length &&
    encounter.pools.every((pool) => Object.hasOwn(ENCOUNTER_POOLS, pool)) &&
    Array.isArray(encounter.acts) &&
    encounter.acts.length > 0 &&
    encounter.acts.length <= 2 &&
    new Set(encounter.acts).size === encounter.acts.length &&
    encounter.acts.every((act) => act === 1 || act === 2) &&
    (encounter.deck === undefined ||
      (Array.isArray(encounter.deck) &&
        encounter.deck.length <= 20 &&
        encounter.deck.every(
          (card) =>
            card &&
            typeof card.id === "string" &&
            card.id.length <= 200 &&
            validateStone({ ...card, id: "custom-encounter-validation" }) &&
            !card.conjured &&
            !card.encounterStart &&
            !card.receivedKeywords &&
            !card.receivedElement &&
            !card.discardBuffs,
        )))
  );
}
export function validEncounterLibrary(
  value: unknown,
): value is EncounterLibrary {
  if (!value || typeof value !== "object") return false;
  const library = value as EncounterLibrary;
  return (
    library.version === 1 &&
    Array.isArray(library.characters) &&
    library.characters.length <= 100 &&
    library.characters.every(validEnemyCharacter) &&
    new Set(library.characters.map((character) => character.id)).size ===
      library.characters.length &&
    Array.isArray(library.encounters) &&
    library.encounters.length <= 100 &&
    library.encounters.every(validEncounter) &&
    new Set(library.encounters.map((encounter) => encounter.id)).size ===
      library.encounters.length
  );
}
export function readEncounterLibrary(): EncounterLibrary | undefined {
  try {
    const value = JSON.parse(
      localStorage.getItem(ENCOUNTERS_STORAGE) || "null",
    );
    return validEncounterLibrary(value) ? value : undefined;
  } catch {
    return undefined;
  }
}
export function encounterLibrary(): EncounterLibrary {
  const saved = readEncounterLibrary();
  return {
    version: 1,
    characters: BUILTIN_ENEMY_CHARACTERS.map(
      (character) =>
        saved?.characters.find((item) => item.id === character.id) ||
        structuredClone(character),
    ).concat(
      saved?.characters.filter(
        (character) =>
          !BUILTIN_ENEMY_CHARACTERS.some((item) => item.id === character.id),
      ) || [],
    ),
    encounters: BUILTIN_ENCOUNTERS.map(
      (encounter) =>
        saved?.encounters.find((item) => item.id === encounter.id) ||
        structuredClone(encounter),
    ).concat(
      saved?.encounters.filter(
        (encounter) =>
          !BUILTIN_ENCOUNTERS.some((item) => item.id === encounter.id),
      ) || [],
    ),
  };
}
export function saveEncounterLibrary(library: EncounterLibrary) {
  if (!validEncounterLibrary(library))
    throw new Error(
      "Check the encounter names, pools, acts, portraits and starting cards.",
    );
  localStorage.setItem(ENCOUNTERS_STORAGE, JSON.stringify(library));
}
export function encountersForPool(
  library: EncounterLibrary,
  pool: EncounterPool,
  act: 1 | 2,
): EncounterDefinition[] {
  return library.encounters.filter(
    (encounter) =>
      encounter.enabled &&
      encounter.pools.includes(pool) &&
      encounter.acts.includes(act),
  );
}
