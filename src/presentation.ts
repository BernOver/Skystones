import { ROUTE } from "./adventure.ts";
import type { Adventure } from "./adventure.ts";

export const BOARD_SKINS = [
  {
    id: "giants",
    name: "Giants Table",
    description: "Carved timber, bronze corners, and worn stone spaces.",
  },
  {
    id: "arkeyan",
    name: "Arkeyan Ruins",
    description: "Ancient iron, turquoise runes, and dark stone.",
  },
  {
    id: "sky",
    name: "Sky Citadel",
    description: "Cloud-blue stone with silver and sapphire trim.",
  },
  {
    id: "lava",
    name: "Lava Forge",
    description: "Obsidian slabs, ember seams, and scorched metal.",
  },
  {
    id: "frost",
    name: "Frozen Vault",
    description: "Icy tiles held in a frost-covered silver frame.",
  },
  {
    id: "golden",
    name: "Golden Court",
    description: "Polished gold, violet stone, and royal ornament.",
  },
] as const;
export type BoardSkinId = (typeof BOARD_SKINS)[number]["id"];
export function boardSkin(value: unknown): BoardSkinId {
  return BOARD_SKINS.find((skin) => skin.id === value)?.id || "giants";
}

export const OPPONENTS = [
  { id: "chompy-mage", name: "Chompy Mage", color: "#678a3e" },
  { id: "dr-krankcase", name: "Dr. Krankcase", color: "#488e79" },
  { id: "wolfgang", name: "Wolfgang", color: "#79608b" },
  { id: "hood-sickle", name: "Hood Sickle", color: "#554a7c" },
  { id: "grave-clobber", name: "Grave Clobber", color: "#397eaa" },
  { id: "pain-yatta", name: "Pain-Yatta", color: "#ae6195" },
  { id: "tae-kwon-crow", name: "Tae Kwon Crow", color: "#bc613d" },
  { id: "blaster-tron", name: "Blaster-Tron", color: "#9d8c4f" },
  { id: "kaos", name: "Kaos", color: "#655478" },
  { id: "golden-queen", name: "Golden Queen", color: "#af812f" },
] as const;
export type OpponentId = (typeof OPPONENTS)[number]["id"];
export type Opponent = {
  id: string;
  name: string;
  color: string;
  portrait?: string;
  image?: string;
};
export function opponent(value: unknown): (typeof OPPONENTS)[number] {
  return OPPONENTS.find((enemy) => enemy.id === value) || OPPONENTS[0];
}
export function adventureOpponent(
  run: Pick<Adventure, "seed" | "floor" | "node" | "battle">,
): Opponent {
  if (run.node?.encounter) return run.node.encounter.character;
  if (
    run.battle?.boss === "golden-queen" ||
    (run.node?.kind === "boss" && run.floor >= 9)
  )
    return opponent("golden-queen");
  if (run.battle?.boss || run.node?.kind === "boss") return opponent("kaos");
  const choices =
    ROUTE[run.floor]?.filter((node) =>
      ["battle", "elite", "chest"].includes(node.kind),
    ) || [];
  const branch = Math.max(
    0,
    choices.findIndex((node) => node.id === run.node?.id),
  );
  // Different branches on one stop face different villains. The same saved
  // route always shows the same portrait on its map and in the encounter.
  return OPPONENTS[(((run.seed >>> 0) % 8) + run.floor + branch) % 8];
}

const ENCOUNTER_FLAVOR = {
  "chompy-mage": {
    battle: [
      "Chompy Challenge",
      "Chompy Mage has gathered a noisy audience of Chompies. Beat their champion at his own stone table.",
    ],
    elite: [
      "The Chompy Uprising",
      "Chompy Mage's rowdy mob demands an encore. His prized stones are ready for a tougher contest.",
    ],
    chest: [
      "The Chompy Hoard",
      "Chompy Mage hides his favorite shinies among the Chompies. Claim his guarded chest before the little biters carry it away.",
    ],
  },
  "dr-krankcase": {
    battle: [
      "Goo Works",
      "Dr. Krankcase takes a break from his goo-powered inventions to test a new stone-playing contraption.",
    ],
    elite: [
      "The Doctor's Masterpiece",
      "Dr. Krankcase unveils his newest contraption and a sharper collection of stones. His experiment needs a challenger.",
    ],
    chest: [
      "The Doctor's Lockbox",
      "Dr. Krankcase has sealed his spare parts and profits in a hefty lockbox. He guards it with every gadget he has.",
    ],
  },
  wolfgang: {
    battle: [
      "Bone Rattle Showdown",
      "Wolfgang tunes his bone harp and challenges you to keep up with his rhythm. The next performance is a Skystones duel.",
    ],
    elite: [
      "Undead Encore",
      "Wolfgang turns up the volume for a relentless encore. His strongest stones are taking center stage.",
    ],
    chest: [
      "Backstage Booty",
      "Wolfgang guards a chest of concert takings backstage. Take control of his stash before the last note.",
    ],
  },
  "hood-sickle": {
    battle: [
      "Shadow Crossing",
      "Hood Sickle waits in the shadows, scythe resting beside the board. He silently beckons you to take a seat.",
    ],
    elite: [
      "Midnight Reckoning",
      "Hood Sickle steps into the moonlight with a carefully chosen set of stones. This duel leaves little room for mistakes.",
    ],
    chest: [
      "The Shadow Cache",
      "Hood Sickle keeps a treasure chest beyond the reach of wandering hands. Claim it while its silent guardian watches.",
    ],
  },
  "grave-clobber": {
    battle: [
      "Tombside Tussle",
      "Grave Clobber rises from his sarcophagus, dusts off a stone table, and challenges you to a royal rumble.",
    ],
    elite: [
      "The Pharaoh's Challenge",
      "Grave Clobber brings his finest ancient stones to the table. The pharaoh expects a worthy opponent.",
    ],
    chest: [
      "Buried Riches",
      "Grave Clobber has unearthed a chest from his tomb. He seems less keen on letting anyone else touch it.",
    ],
  },
  "pain-yatta": {
    battle: [
      "Candy Clash",
      "Pain-Yatta scatters candy across the table and plants his club nearby. A sweet prize awaits a sharp challenger.",
    ],
    elite: [
      "Sugar Rush Rumble",
      "Pain-Yatta has worked himself into a sugar-fueled frenzy. His favorite stones are coming out for this clash.",
    ],
    chest: [
      "The Candy Stash",
      "Pain-Yatta guards a chest crammed with treats and shiny coins. He keeps a very close eye on his sweets.",
    ],
  },
  "tae-kwon-crow": {
    battle: [
      "Blazing Dojo",
      "Tae Kwon Crow pauses his fiery training to offer a duel. He studies the board as carefully as a sparring partner.",
    ],
    elite: [
      "The Master's Trial",
      "Tae Kwon Crow calls for a master-level challenge. His disciplined stone play is ready to test your next move.",
    ],
    chest: [
      "The Dojo's Prize",
      "Tae Kwon Crow guards the dojo's prize chest. Claim control of the treasure under the master's watchful eye.",
    ],
  },
  "blaster-tron": {
    battle: [
      "Target Acquired",
      "Blaster-Tron scans the table and locks onto a new challenger. His Skystones challenge protocol is online.",
    ],
    elite: [
      "Maximum Challenge",
      "Blaster-Tron switches to his advanced challenge protocol. Every stone has been selected for this test.",
    ],
    chest: [
      "The Security Vault",
      "Blaster-Tron is running security on a well-stocked vault. Take control of the chest while his scanners track the board.",
    ],
  },
} as const;

export function adventureEncounter(
  run: Pick<Adventure, "seed" | "floor" | "node" | "battle">,
): { name: string; description: string; opponent?: Opponent } {
  const node = run.node;
  if (node?.encounter)
    return {
      name: node.encounter.name,
      description: node.encounter.description,
      opponent: node.encounter.character,
    };
  if (!node)
    return {
      name: run.battle?.name || "Stone Keeper",
      description: "A challenger waits at the stone table.",
    };
  if (!run.battle && !["battle", "elite", "boss", "chest"].includes(node.kind))
    return { name: node.name, description: node.description };
  const enemy = adventureOpponent(run);
  if (enemy.id === "golden-queen")
    return {
      name: "Golden Queen · The Golden Court",
      description:
        "Golden Queen surveys the board from her gilded throne. She expects another tribute, not a defeat. Win the score, hold her shielded throne, and control at least two corners.",
      opponent: enemy,
    };
  if (enemy.id === "kaos") {
    const vortex =
      run.battle?.boss === "kaos-vortex" || node.id === "elemental-vortex";
    return {
      name: vortex ? "Kaos · Elemental Vortex" : "Kaos · Throne of Chaos",
      description: vortex
        ? "Kaos whips the elements into a tantrum and dares you to keep up. Each turn's element gives both players' matching cards +1 on every edge. Watch the next-element icon and win the score."
        : "Kaos declares his throne the most important stone in Skylands. Prove him wrong: win the score and hold his central throne to open the road to the Golden Isles.",
      opponent: enemy,
    };
  }
  const kind =
    run.battle?.objectiveKind === "chest" || node.kind === "chest"
      ? "chest"
      : (run.battle?.kind || node.kind) === "elite"
        ? "elite"
        : "battle";
  const [title, flavor] =
    ENCOUNTER_FLAVOR[enemy.id as keyof typeof ENCOUNTER_FLAVOR][kind];
  const rules =
    kind === "chest"
      ? "Hold the central chest at the finish for bonus gold."
      : kind === "elite"
        ? "Elite challenge: tougher stones and a relic reward on victory."
        : "Win the score to earn gold and choose a card reward.";
  return {
    name: `${enemy.name} · ${title}`,
    description: ["battle", "elite", "chest"].includes(node.kind)
      ? `${flavor} ${rules}`
      : flavor,
    opponent: enemy,
  };
}
