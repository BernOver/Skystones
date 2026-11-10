import type {
  Board,
  Edges,
  Element,
  KeywordType,
  Owner,
  Side,
  Stone,
} from "./game.ts";
import { hasTribe, tribeName, validTribe } from "./tribes.ts";
import type { Tribe } from "./tribes.ts";
export type TrapPipEffect = {
  kind: "pips" | "attack" | "defense";
  side: Side | "all";
  sides?: Side[];
  amount: number;
};
export type TrapEffect =
  | TrapPipEffect
  | { kind: "amplify"; effect: TrapAmplifyTarget }
  | { kind: "multiply"; side: Side | "all"; sides?: Side[] }
  | { kind: "mirror" }
  | { kind: "equalizer" }
  | { kind: "ceiling"; side: Side | "all"; sides?: Side[]; maximum: number }
  | { kind: "steady"; minimum: number };
export type TrapAmplifyTarget =
  | Exclude<KeywordType, "amplify" | "flash" | "trap">
  | "all";
export const TRAP_AMPLIFY_TARGETS: TrapAmplifyTarget[] = [
  "all",
  "head-start",
  "comeback",
  "resonance",
  "sunder",
  "silence",
  "dizzy",
  "shield",
  "combo",
  "next-play",
  "environment",
  "conjure",
  "shift",
  "discard",
  "scavenge",
  "parting-gift",
  "discard-priority",
  "assemble",
];
export const TRAP_EFFECTS: Record<
  TrapEffect["kind"],
  { name: string; description: string }
> = {
  pips: {
    name: "Ordinary pips",
    description: "Add or remove pips on the selected sides.",
  },
  attack: {
    name: "Attack only",
    description: "Add or remove offensive pips on the selected sides.",
  },
  defense: {
    name: "Defense only",
    description: "Add or remove defensive pips on the selected sides.",
  },
  amplify: {
    name: "Double a keyword",
    description:
      "Double a chosen keyword when it triggers. All effects excludes Amplify, Flash, and Trap itself.",
  },
  multiply: {
    name: "Double pips",
    description:
      "Double ordinary pips on the selected sides while this Trap is active.",
  },
  mirror: {
    name: "Mirror opposite sides",
    description:
      "North and South share their higher pip value; East and West share theirs.",
  },
  equalizer: {
    name: "Equalize pips",
    description:
      "Set all four sides to their average ordinary pips, rounded down.",
  },
  ceiling: {
    name: "Pip ceiling",
    description:
      "Limit ordinary pips on the selected sides. Attack and Shield bonuses are separate.",
  },
  steady: {
    name: "Steady Dizzy rolls",
    description: "Raise the minimum Dizzy roll. The maximum stays 5.",
  },
};
export function isTrapPipEffect(e: TrapEffect): e is TrapPipEffect {
  return e.kind === "pips" || e.kind === "attack" || e.kind === "defense";
}
export function defaultTrapEffect(kind: TrapEffect["kind"]): TrapEffect {
  switch (kind) {
    case "pips":
    case "attack":
    case "defense":
      return { kind, side: "all", amount: 1 };
    case "multiply":
      return { kind, side: "all" };
    case "ceiling":
      return { kind, side: "all", maximum: 3 };
    case "steady":
      return { kind, minimum: 2 };
    case "amplify":
      return { kind, effect: "conjure" };
    default:
      return { kind };
  }
}
export function trapEffectSides(e: {
  side: Side | "all";
  sides?: Side[];
}): Side[] {
  return e.sides || (e.side === "all" ? [0, 1, 2, 3] : [e.side]);
}
export interface Trap {
  id: string;
  name: string;
  element: Element;
  description: string;
  affects?: { element?: Element; tribe?: Tribe; exclude?: boolean };
  effects: TrapEffect[];
}
export interface TrapState {
  active?: { trap: Trap; owner: Owner; source?: string; order?: number };
  lastPlayed: [number, number];
}
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
export const DEFAULT_TRAPS: Trap[] = [
  ["fire", "Fire Tiki", "attack"],
  ["water", "Water Tiki", "defense"],
  ["life", "Life Hammer", "pips"],
  ["earth", "Earth Hammer", "defense"],
  ["air", "Air Hourglass", "pips"],
  ["magic", "Magic Log Holder", "pips"],
  ["tech", "Tech Hand", "attack"],
  ["undead", "Undead Hand", "pips"],
  ["light", "Light Rocket", "defense"],
  ["dark", "Dark Spider", "attack"],
  ["neutral", "Kaos Trap", "attack"],
].map(([element, name, kind]) => ({
  id: `trap-${element}`,
  name,
  element: element as Element,
  description:
    element === "neutral"
      ? "Kaos lends his power to every stone on the battlefield."
      : `A Traptanium crystal sharing ${element} power across the battlefield.`,
  ...(element === "neutral"
    ? {}
    : { affects: { element: element as Element } }),
  effects: [
    {
      kind: kind as "pips" | "attack" | "defense",
      side: element === "life" ? 0 : "all",
      amount: 1,
    },
  ],
}));
// Additional crystals demonstrate the new shared rules without changing existing presets.
DEFAULT_TRAPS.push(
  {
    id: "trap-crossfire",
    name: "Crossfire Crystal",
    element: "fire",
    description: "Flames spread sideways.",
    affects: { element: "fire" },
    effects: [{ kind: "attack", side: 1, sides: [1, 3], amount: 2 }],
  },
  {
    id: "trap-spell-echo",
    name: "Spell Echo Crystal",
    element: "magic",
    description: "Each spell calls twice as many friends.",
    affects: { element: "magic" },
    effects: [{ kind: "amplify", effect: "conjure" }],
  },
  {
    id: "trap-twin-gears",
    name: "Twin Gears Crystal",
    element: "tech",
    description: "A pair of gears powers the vertical edges.",
    affects: { element: "tech" },
    effects: [{ kind: "multiply", side: 0, sides: [0, 2] }],
  },
  {
    id: "trap-reflection",
    name: "Reflection Crystal",
    element: "water",
    description: "Still water reflects a stone’s strongest edges.",
    affects: { element: "water" },
    effects: [{ kind: "mirror" }],
  },
  {
    id: "trap-balance",
    name: "Balance Crystal",
    element: "earth",
    description: "The battlefield settles into balance.",
    effects: [{ kind: "equalizer" }],
  },
  {
    id: "trap-low-ceiling",
    name: "Low Ceiling Crystal",
    element: "undead",
    description: "No stone towers above the crypt.",
    effects: [{ kind: "ceiling", side: "all", maximum: 3 }],
  },
  {
    id: "trap-steady-hand",
    name: "Steady Hand Crystal",
    element: "air",
    description: "A steady breeze guides the dice.",
    effects: [{ kind: "steady", minimum: 2 }],
  },
);
export function validTrap(value: unknown, runtime = false): value is Trap {
  if (!value || typeof value !== "object") return false;
  const t = value as Trap;
  return (
    typeof t.id === "string" &&
    /^trap-[\w-]{1,100}$/.test(t.id) &&
    typeof t.name === "string" &&
    t.name.trim().length > 0 &&
    t.name.length <= 40 &&
    elements.includes(t.element) &&
    typeof t.description === "string" &&
    t.description.length <= 200 &&
    (!t.affects ||
      (typeof t.affects === "object" &&
        (!t.affects.element || elements.includes(t.affects.element)) &&
        (!t.affects.tribe || validTribe(t.affects.tribe)) &&
        (t.affects.exclude === undefined ||
          typeof t.affects.exclude === "boolean"))) &&
    Array.isArray(t.effects) &&
    t.effects.length > 0 &&
    t.effects.length <= 8 &&
    t.effects.every((e) => validTrapEffect(e, runtime))
  );
}
function validTrapEffect(
  value: unknown,
  runtime: boolean,
): value is TrapEffect {
  if (!value || typeof value !== "object") return false;
  const e = value as TrapEffect;
  if (!Object.hasOwn(TRAP_EFFECTS, e.kind)) return false;
  if (
    "side" in e &&
    !(
      e.side === "all" ||
      (Number.isInteger(e.side) && e.side >= 0 && e.side <= 3)
    )
  )
    return false;
  if (["pips", "attack", "defense", "multiply", "ceiling"].includes(e.kind)) {
    if (!("side" in e)) return false;
    if (
      e.sides !== undefined &&
      (!Array.isArray(e.sides) ||
        !e.sides.length ||
        e.sides.length > 4 ||
        new Set(e.sides).size !== e.sides.length ||
        !e.sides.every((s) => Number.isInteger(s) && s >= 0 && s <= 3))
    )
      return false;
  }
  if (isTrapPipEffect(e))
    return (
      Number.isInteger(e.amount) &&
      e.amount !== 0 &&
      Math.abs(e.amount) <= (runtime ? 99 : 5)
    );
  if (e.kind === "amplify") return TRAP_AMPLIFY_TARGETS.includes(e.effect);
  if (e.kind === "ceiling")
    return Number.isInteger(e.maximum) && e.maximum >= 0 && e.maximum <= 5;
  if (e.kind === "steady")
    return Number.isInteger(e.minimum) && e.minimum >= 1 && e.minimum <= 5;
  return true;
}
export function validTrapState(value: unknown): value is TrapState {
  if (!value || typeof value !== "object") return false;
  const s = value as TrapState;
  return (
    Array.isArray(s.lastPlayed) &&
    s.lastPlayed.length === 2 &&
    s.lastPlayed.every((n) => Number.isInteger(n) && n >= -1 && n <= 10000) &&
    (!s.active ||
      ([0, 1].includes(s.active.owner) &&
        validTrap(s.active.trap, true) &&
        (s.active.source === undefined ||
          (typeof s.active.source === "string" &&
            s.active.source.length <= 40)) &&
        (s.active.order === undefined ||
          (Number.isInteger(s.active.order) &&
            s.active.order >= 1 &&
            s.active.order <= 10000))))
  );
}
export function trapMatches(trap: Trap, stone: Stone) {
  const a = trap.affects,
    matches =
      (!a?.element || stone.element === a.element) &&
      (!a?.tribe || hasTribe(stone, a.tribe));
  return a?.exclude ? !matches : matches;
}
export function trapBonus(
  trap: Trap | undefined,
  stone: Stone,
  kind: "pips" | "attack" | "defense",
): Edges {
  const out: Edges = [0, 0, 0, 0];
  if (trap && trapMatches(trap, stone))
    for (const e of trap.effects)
      if (e.kind === kind)
        for (let side = 0; side < 4; side++)
          if (trapEffectSides(e).includes(side as Side)) out[side] += e.amount;
  return out;
}
export function trapEdges(edges: Edges, stone: Stone, trap?: Trap): Edges {
  const bonus = trapBonus(trap, stone, "pips");
  let out = edges.map((n, s) =>
    Math.max(0, Math.min(99, n + bonus[s])),
  ) as Edges;
  if (trap && trapMatches(trap, stone))
    for (const e of trap.effects) {
      if (e.kind === "multiply")
        for (const side of trapEffectSides(e))
          out[side] = Math.min(99, out[side] * 2);
      if (e.kind === "ceiling")
        for (const side of trapEffectSides(e))
          out[side] = Math.min(out[side], e.maximum);
      if (e.kind === "mirror")
        out = [
          Math.max(out[0], out[2]),
          Math.max(out[1], out[3]),
          Math.max(out[0], out[2]),
          Math.max(out[1], out[3]),
        ];
      if (e.kind === "equalizer")
        out = Array(4).fill(
          Math.floor(out.reduce((a, b) => a + b, 0) / 4),
        ) as Edges;
    }
  return out;
}
export function trapKeywordMultiplier(
  trap: Trap | undefined,
  stone: Stone,
  type: KeywordType,
  includeAll = true,
): number {
  if (
    !trap ||
    !trapMatches(trap, stone) ||
    ["amplify", "flash", "trap"].includes(type)
  )
    return 1;
  return Math.min(
    32,
    trap.effects.reduce(
      (n, e) =>
        n *
        (e.kind === "amplify" &&
        (e.effect === type || (includeAll && e.effect === "all"))
          ? 2
          : 1),
      1,
    ),
  );
}
export function trapDizzyMinimum(trap: Trap | undefined, stone: Stone): number {
  return !trap || !trapMatches(trap, stone)
    ? 0
    : Math.max(
        0,
        ...trap.effects.map((e) => (e.kind === "steady" ? e.minimum : 0)),
      );
}
export function withTrap(board: Board, trap?: Trap): Board {
  return board.map((cell) => {
    if (!cell) return null;
    if (trap) return { ...cell, trap };
    if (!cell.trap) return cell;
    const { trap: _trap, ...rest } = cell;
    return rest;
  });
}
export function boardTrap(board: Board): Trap | undefined {
  return board.find((cell) => cell?.trap)?.trap;
}
const sideNames = ["North", "East", "South", "West"];
export function trapEffectText(e: TrapEffect): string {
  const sides = "side" in e ? trapEffectSides(e) : [];
  const where =
    sides.length === 4
      ? "per side"
      : "on " + sides.map((s) => sideNames[s]).join(" & ");
  if (isTrapPipEffect(e))
    return `${e.amount > 0 ? "+" : ""}${e.amount} ${e.kind === "pips" ? "pip" : e.kind + " pip"}${Math.abs(e.amount) === 1 ? "" : "s"} ${where}`;
  switch (e.kind) {
    case "amplify":
      return `double ${e.effect === "all" ? "all eligible keyword effects (excluding Amplify, Flash, and Trap)" : e.effect.replaceAll("-", " ") + " effects"} when they trigger`;
    case "multiply":
      return `double ordinary pips ${where}`;
    case "mirror":
      return "opposite sides share their higher ordinary pip value";
    case "equalizer":
      return "each side becomes the average ordinary pips (rounded down)";
    case "ceiling":
      return `ordinary pips capped at ${e.maximum} ${where}`;
    case "steady":
      return `Dizzy rolls ${e.minimum}–5`;
  }
}
export function trapText(trap: Trap): string {
  const who = [
    trap.affects?.element,
    trap.affects?.tribe ? tribeName(trap.affects.tribe) : "",
  ]
    .filter(Boolean)
    .join(" ");
  return `${trap.affects?.exclude ? "All except " : ""}${who || "All"} cards, both players: ${trap.effects.map(trapEffectText).join("; ")}. Replaced by the next Trap.`;
}
const STORAGE = "skystones-traps-v1";
export function readTraps(): Trap[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE) || "[]");
    return [
      ...DEFAULT_TRAPS,
      ...(Array.isArray(saved)
        ? saved.filter((t): t is Trap => validTrap(t))
        : []),
    ];
  } catch {
    return DEFAULT_TRAPS;
  }
}
export function saveTrap(trap: Trap) {
  if (!validTrap(trap)) throw new Error("Check the Trap’s name and effects.");
  const custom = readTraps().filter(
    (t) => !DEFAULT_TRAPS.some((d) => d.id === t.id) && t.id !== trap.id,
  );
  localStorage.setItem(STORAGE, JSON.stringify([...custom, trap]));
  window.dispatchEvent(new Event(STORAGE));
}
export function trapStateFromBoard(board: Board): TrapState | undefined {
  // Derive the active crystal from resolved stone plays, including covered vehicles.
  const plays = board
    .flatMap((c) => (c ? [...(c.history || []), c] : []))
    .filter((c) => !!c.placedTrap)
    .sort((a, b) => (a.playedOrder || 0) - (b.playedOrder || 0));
  const last = plays.at(-1);
  return last?.placedTrap
    ? {
        active: {
          trap: last.placedTrap,
          owner: last.playedBy ?? last.owner,
          source: last.stone.name,
          order: last.playedOrder,
        },
        lastPlayed: [-1, -1],
      }
    : undefined;
}
export function trapKeywordText(trap: Trap): string {
  return `On play, place ${trap.name} in the shared Trap slot before captures. ${trapText(trap)} The crystal remains after this stone is captured or silenced.`;
}
