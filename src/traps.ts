import type { Board, Edges, Element, Owner, Side, Stone } from "./game.ts";
import { hasTribe, tribeName, validTribe } from "./tribes.ts";
import type { Tribe } from "./tribes.ts";
export interface Trap {
  id: string;
  name: string;
  element: Element;
  description: string;
  affects?: { element?: Element; tribe?: Tribe; exclude?: boolean };
  effects: {
    kind: "pips" | "attack" | "defense";
    side: Side | "all";
    amount: number;
  }[];
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
    t.effects.length <= 4 &&
    t.effects.every(
      (e) =>
        e &&
        ["pips", "attack", "defense"].includes(e.kind) &&
        (e.side === "all" ||
          (Number.isInteger(e.side) && e.side >= 0 && e.side <= 3)) &&
        Number.isInteger(e.amount) &&
        e.amount !== 0 &&
        Math.abs(e.amount) <= (runtime ? 99 : 5),
    )
  );
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
          if (e.side === "all" || e.side === side) out[side] += e.amount;
  return out;
}
export function trapEdges(edges: Edges, stone: Stone, trap?: Trap): Edges {
  const bonus = trapBonus(trap, stone, "pips");
  return edges.map((n, s) => Math.max(0, n + bonus[s])) as Edges;
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
export function trapText(trap: Trap): string {
  const who = [
    trap.affects?.element,
    trap.affects?.tribe ? tribeName(trap.affects.tribe) : "",
  ]
    .filter(Boolean)
    .join(" ");
  return `${trap.affects?.exclude ? "All except " : ""}${who || "All"} cards, both players: ${trap.effects.map((e) => `${e.amount > 0 ? "+" : ""}${e.amount} ${e.kind === "pips" ? "pip" : e.kind + " pip"}${Math.abs(e.amount) === 1 ? "" : "s"} ${e.side === "all" ? "per side" : "on " + ["North", "East", "South", "West"][e.side]}`).join("; ")}. Replaced by the next Trap.`;
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
