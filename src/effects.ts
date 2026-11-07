import { hasTribe, tribeName, validTribe } from "./tribes.ts";
import type { Tribe } from "./tribes.ts";
import type { Stone, StoneKeyword, TargetEffect } from "./game.ts";
import type {
  Board,
  Edges,
  Element,
  Owner,
  PlacedStone,
  Side,
} from "./game.ts";

export type EffectSide = Side | "all";
export type TileEnvironment = (
  | { kind: "elemental"; element: Element; side: EffectSide; amount: number }
  | { kind: "blight"; side: EffectSide; amount: number }
  | { kind: "bastion" | "war-banner"; amount: number }
  | { kind: "crosswind" | "mirror-pool" | "equalizer" }
) & { tribe?: Tribe };
export type EnvironmentKind = TileEnvironment["kind"];
export interface QueuedPips {
  recipient: Owner;
  side: EffectSide;
  amount: number;
  tribe?: Tribe;
  keywords?: StoneKeyword[];
}
export const ENVIRONMENTS: Record<
  EnvironmentKind,
  { name: string; mark: string; color: string }
> = {
  elemental: { name: "Elemental Spring", mark: "✦", color: "#527e55" },
  blight: { name: "Blight", mark: "−", color: "#9b5364" },
  bastion: { name: "Bastion", mark: "◆", color: "#4d7f96" },
  "war-banner": { name: "War Banner", mark: "⚑", color: "#b56c3d" },
  crosswind: { name: "Crosswind", mark: "↻", color: "#6b7eae" },
  "mirror-pool": { name: "Mirror Pool", mark: "↔", color: "#4e9490" },
  equalizer: { name: "Equalizer", mark: "=", color: "#8b6ba2" },
};
const SIDES = ["North", "East", "South", "West"];
export function effectSideName(side: EffectSide): string {
  return side === "all" ? "every side" : SIDES[side];
}
export function pipEffectText(
  effect: Pick<QueuedPips, "side" | "amount">,
): string {
  return `${effect.amount > 0 ? "+" : "−"}${Math.abs(effect.amount)} ${effect.side === "all" ? "per side" : `on ${SIDES[effect.side]}`}`;
}
export function keywordNames(keywords: StoneKeyword[]): string {
  return keywords
    .map((keyword) =>
      keyword.type
        .split("-")
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join(" "),
    )
    .join(", ");
}
export function nextEffectText(
  effect: Pick<QueuedPips, "side" | "amount" | "keywords">,
): string {
  return [
    effect.amount ? pipEffectText(effect) : "",
    effect.keywords?.length ? `Gain ${keywordNames(effect.keywords)}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}
export function defaultEnvironment(
  kind: EnvironmentKind,
  element: Element = "magic",
): TileEnvironment {
  if (kind === "elemental") return { kind, element, side: "all", amount: 1 };
  if (kind === "blight") return { kind, side: "all", amount: 1 };
  if (kind === "bastion" || kind === "war-banner") return { kind, amount: 1 };
  return { kind };
}
function environmentDescription(environment: TileEnvironment): string {
  switch (environment.kind) {
    case "elemental":
      return `${environment.element[0].toUpperCase()}${environment.element.slice(1)} cards here gain ${pipEffectText(environment)}.`;
    case "blight":
      return `Cards here lose ${pipEffectText({ ...environment, amount: -environment.amount }).slice(1)} (minimum zero).`;
    case "bastion":
      return `Cards here gain ${environment.amount} defense-only pip${environment.amount === 1 ? "" : "s"} on every side.`;
    case "war-banner":
      return `Cards here gain ${environment.amount} attack-only pip${environment.amount === 1 ? "" : "s"} on every side.`;
    case "crosswind":
      return "Ordinary pips rotate one side clockwise while a card is here; keyword and shield directions stay fixed.";
    case "mirror-pool":
      return "Opposite sides share their stronger ordinary pip value: North/South and East/West.";
    case "equalizer":
      return "Each side uses the average of the card’s four ordinary pip values, rounded down.";
  }
}
export function environmentText(environment: TileEnvironment): string {
  if (environment.kind === "elemental" && environment.tribe)
    return `${tribeName(environment.tribe)} cards here gain ${pipEffectText(environment)}.`;
  const text = environmentDescription(environment);
  return environment.tribe
    ? `${tribeName(environment.tribe)} only: ${text}`
    : text;
}
export function environmentAffects(
  environment?: TileEnvironment,
  stone?: Stone,
): boolean {
  return (
    !!environment &&
    (!environment.tribe || (!!stone && hasTribe(stone, environment.tribe)))
  );
}
export function validEffectSide(value: unknown): value is EffectSide {
  return (
    value === "all" ||
    (Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 3)
  );
}
export function validPipAmount(value: unknown, signed = false): boolean {
  return (
    Number.isInteger(value) &&
    Number(value) !== 0 &&
    Number(value) >= (signed ? -5 : 1) &&
    Number(value) <= 5
  );
}
export function validateEnvironment(value: unknown): value is TileEnvironment {
  if (!value || typeof value !== "object") return false;
  const env = value as TileEnvironment;
  if (
    !Object.hasOwn(ENVIRONMENTS, env.kind) ||
    (env.tribe !== undefined && !validTribe(env.tribe))
  )
    return false;
  if (env.kind === "elemental" || env.kind === "blight") {
    if (!validEffectSide(env.side) || !validPipAmount(env.amount)) return false;
    if (
      env.kind === "elemental" &&
      ![
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
      ].includes(env.element)
    )
      return false;
  }
  if (
    (env.kind === "bastion" || env.kind === "war-banner") &&
    !validPipAmount(env.amount)
  )
    return false;
  return true;
}

// Play history stays attached to each card through captures and swaps. Resolved
// casts and queued effects survive Silence, just like resolved Sunder effects.
export function pendingPipEffects(
  board: Board,
  recipient: Owner,
): (QueuedPips & { source: string })[] {
  if (!board.some((cell) => cell?.queuedPips?.length)) return [];
  const history = board.filter((cell) => cell?.playedBy === recipient);
  const lastPlay = Math.max(
    0,
    ...history.map((cell) => cell?.playedOrder || 0),
  );
  const matchingPlays = new Map<Tribe, number>();
  const lastMatchingPlay = (tribe?: Tribe) => {
    if (!tribe) return lastPlay;
    if (!matchingPlays.has(tribe))
      matchingPlays.set(
        tribe,
        Math.max(
          0,
          ...history
            .filter((cell) => !!cell && hasTribe(cell.stone, tribe))
            .map((cell) => cell?.playedOrder || 0),
        ),
      );
    return matchingPlays.get(tribe)!;
  };
  return [...board]
    .sort((a, b) => (a?.playedOrder || 0) - (b?.playedOrder || 0))
    .flatMap((cell) =>
      cell
        ? (cell.queuedPips || [])
            .filter(
              (effect) =>
                effect.recipient === recipient &&
                (cell.playedOrder || 0) >= lastMatchingPlay(effect.tribe),
            )
            .map((effect) => ({ ...effect, source: cell.stone.name }))
        : [],
    );
}
export function nextPipModifiers(
  board: Board,
  recipient: Owner,
  stone?: Stone,
): Edges {
  const result: Edges = [0, 0, 0, 0];
  for (const effect of pendingPipEffects(board, recipient))
    if (!effect.tribe || (!!stone && hasTribe(stone, effect.tribe)))
      for (let side = 0; side < 4; side++)
        if (effect.side === "all" || effect.side === side)
          result[side] += effect.amount;
  return result.map((value) => Math.max(-99, Math.min(99, value))) as Edges;
}
export function nextKeywordGrants(
  board: Board,
  recipient: Owner,
  stone: Stone,
): StoneKeyword[] {
  return pendingPipEffects(board, recipient).flatMap((effect) =>
    !effect.tribe || hasTribe(stone, effect.tribe) ? effect.keywords || [] : [],
  );
}
export function adjacentTile(index: number, side: Side, size: number): number {
  const row = Math.floor(index / size),
    col = index % size;
  return [
    row > 0 ? index - size : -1,
    col < size - 1 ? index + 1 : -1,
    row < size - 1 ? index + size : -1,
    col > 0 ? index - 1 : -1,
  ][side];
}
export function wrappedTile(
  index: number,
  direction: Side,
  size: number,
): number {
  const row = Math.floor(index / size),
    col = index % size;
  return [
    ((row + size - 1) % size) * size + col,
    row * size + ((col + 1) % size),
    ((row + 1) % size) * size + col,
    row * size + ((col + size - 1) % size),
  ][direction];
}
export function shiftEffectText(
  effect: Extract<TargetEffect, { type: "shift" }>,
  size: number,
): string {
  const coordinate = (index: number) =>
    `${String.fromCharCode(65 + Math.floor(index / size))}${(index % size) + 1}`;
  return effect.moved
    ? `Shift ${coordinate(effect.target)} → ${coordinate(effect.to)}`
    : effect.reason === "no-target"
      ? "Shift: no eligible adjacent card"
      : `Shift ${coordinate(effect.target)}: destination blocked`;
}
export function boardEnvironments(
  board: Board,
  additional: { target: number; environment: TileEnvironment }[] = [],
): (TileEnvironment | undefined)[] {
  const result: (TileEnvironment | undefined)[] = Array(board.length).fill(
    undefined,
  );
  for (const cell of board
    .filter(
      (cell): cell is PlacedStone =>
        !!cell?.effects?.some((effect) => effect.type === "environment"),
    )
    .sort((a, b) => (a.playedOrder || 0) - (b.playedOrder || 0)))
    for (const effect of cell.effects || [])
      if (effect.type === "environment")
        result[effect.target] = effect.environment;
  for (const effect of additional) result[effect.target] = effect.environment;
  return result;
}
export function withTileEnvironments(
  board: Board,
  additional: { target: number; environment: TileEnvironment }[] = [],
): Board {
  if (
    !additional.length &&
    !board.some(
      (cell) =>
        cell?.environment ||
        cell?.effects?.some((effect) => effect.type === "environment"),
    )
  )
    return board;
  const tiles = boardEnvironments(board, additional);
  return board.map((cell, index) => {
    if (!cell || cell.environment === tiles[index]) return cell;
    if (tiles[index]) return { ...cell, environment: tiles[index] };
    const { environment: _environment, ...rest } = cell;
    return rest;
  });
}
export function environmentEdges(
  edges: Edges,
  element: Element,
  environment?: TileEnvironment,
  stone?: Stone,
): Edges {
  if (!environment || !environmentAffects(environment, stone)) return edges;
  switch (environment.kind) {
    case "elemental":
    case "blight": {
      const amount =
        environment.kind === "blight"
          ? -environment.amount
          : environment.tribe || environment.element === element
            ? environment.amount
            : 0;
      return edges.map((value, side) =>
        Math.max(
          0,
          value +
            (environment.side === "all" || environment.side === side
              ? amount
              : 0),
        ),
      ) as Edges;
    }
    case "crosswind":
      return [edges[3], edges[0], edges[1], edges[2]];
    case "mirror-pool":
      return [
        Math.max(edges[0], edges[2]),
        Math.max(edges[1], edges[3]),
        Math.max(edges[0], edges[2]),
        Math.max(edges[1], edges[3]),
      ];
    case "equalizer": {
      const average = Math.floor(edges.reduce((a, b) => a + b, 0) / 4);
      return [average, average, average, average];
    }
    default:
      return edges;
  }
}
export function environmentAttack(
  environment?: TileEnvironment,
  stone?: Stone,
): number {
  return environment?.kind === "war-banner" &&
    environmentAffects(environment, stone)
    ? environment.amount
    : 0;
}
export function environmentDefense(
  environment?: TileEnvironment,
  stone?: Stone,
): number {
  return environment?.kind === "bastion" &&
    environmentAffects(environment, stone)
    ? environment.amount
    : 0;
}
export function underlyingSide(
  environment: TileEnvironment | undefined,
  displayedSide: Side,
  stone?: Stone,
): Side {
  return environment?.kind === "crosswind" &&
    environmentAffects(environment, stone)
    ? (((displayedSide + 3) % 4) as Side)
    : displayedSide;
}
