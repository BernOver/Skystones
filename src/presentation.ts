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
export type Opponent = (typeof OPPONENTS)[number];
export function opponent(value: unknown): Opponent {
  return OPPONENTS.find((enemy) => enemy.id === value) || OPPONENTS[0];
}
export function adventureOpponent(
  run: Pick<Adventure, "seed" | "floor" | "node" | "battle">,
): Opponent {
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
