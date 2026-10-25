import {
  ELEMENTS,
  boardSize,
  coordinate,
  cardEdges,
  arenaEdges,
  keywordKey,
  prepareTargeting,
  rollDizzy,
  validateKeywords,
} from "./game.ts";
import type {
  Edges,
  Element,
  PlacedStone,
  Side,
  Stone,
  StoneKeyword,
} from "./game.ts";
import { earnedGold, hasRelic, maxLives, potionPotency } from "./relics.ts";
import { hasSkystonesArtwork } from "./characters.ts";
import type { Adventure } from "./adventure.ts";

export type Potion =
  | "power"
  | "heal"
  | "hex"
  | "sharpen"
  | "fortify"
  | "shatter"
  | "hush"
  | "compass"
  | "prism"
  | "mend"
  | "frost"
  | "resonance"
  | "gambit"
  | "treasure"
  | "transposition";
interface PotionDefinition {
  name: string;
  description: string;
  price: number;
  target: "none" | "hand" | "friendly" | "enemy" | "board";
  choice?: "side" | "element" | "second-card";
  combat: boolean;
}
export const POTIONS: Record<Potion, PotionDefinition> = {
  power: {
    name: "Power Tonic",
    description: "Strengthen all edges of a hand card for this battle.",
    price: 25,
    target: "hand",
    combat: true,
  },
  heal: {
    name: "Healing Draught",
    description: "Recover life, up to your maximum. Usable between battles.",
    price: 25,
    target: "none",
    combat: false,
  },
  hex: {
    name: "Hex Vial",
    description: "Weaken all edges of one enemy board card.",
    price: 30,
    target: "enemy",
    combat: true,
  },
  sharpen: {
    name: "Sharpening Oil",
    description: "Give one chosen edge of a hand card a larger boost.",
    price: 25,
    target: "hand",
    choice: "side",
    combat: true,
  },
  fortify: {
    name: "Fortress Brew",
    description:
      "Strengthen all edges of a friendly card already on the board.",
    price: 30,
    target: "friendly",
    combat: true,
  },
  shatter: {
    name: "Shatter Flask",
    description:
      "Remove several pips from a chosen edge of an enemy board card.",
    price: 30,
    target: "enemy",
    choice: "side",
    combat: true,
  },
  hush: {
    name: "Hush Elixir",
    description:
      "Silence either player's board card, restoring printed strengths minus damage.",
    price: 30,
    target: "board",
    combat: true,
  },
  compass: {
    name: "Compass Cordial",
    description:
      "Rotate a hand card's pips and directional keywords clockwise.",
    price: 25,
    target: "hand",
    combat: true,
  },
  prism: {
    name: "Prismatic Phial",
    description: "Change a hand card's element for this battle.",
    price: 25,
    target: "hand",
    choice: "element",
    combat: true,
  },
  mend: {
    name: "Restoration Salve",
    description: "Repair pip damage on a friendly board card.",
    price: 25,
    target: "friendly",
    combat: true,
  },
  frost: {
    name: "Frostfire Flask",
    description: "Weaken every enemy card in one chosen board row.",
    price: 35,
    target: "enemy",
    combat: true,
  },
  resonance: {
    name: "Echo Essence",
    description:
      "Give a hand card Resonance on a chosen edge, counting its current element.",
    price: 30,
    target: "hand",
    choice: "side",
    combat: true,
  },
  gambit: {
    name: "Gambler’s Brew",
    description:
      "Add pips, then randomly reshape a hand card with at most four per edge.",
    price: 30,
    target: "hand",
    combat: true,
  },
  treasure: {
    name: "Liquid Gold",
    description: "Gain gold immediately, during your turn or between battles.",
    price: 40,
    target: "none",
    combat: false,
  },
  transposition: {
    name: "Transposition Tonic",
    description:
      "Swap two friendly board cards without captures. Chests and thrones stay fixed.",
    price: 30,
    target: "friendly",
    choice: "second-card",
    combat: true,
  },
};
export const POTION_IDS = Object.keys(POTIONS) as Potion[];
export interface PotionChoice {
  side?: Side;
  element?: Element;
  second?: number;
}
export interface PotionTarget {
  target: string | number;
  label: string;
  stone: Stone;
  edges: Edges;
}
const HAND_EDGE_LIMIT = 64;
export function adventurePotionOffers(
  run: Pick<Adventure, "seed" | "floor">,
  count = 3,
  salt = 0,
): Potion[] {
  return POTION_IDS.map((id, index) => {
    let hash =
      run.seed ^
      Math.imul(run.floor + 1, 0x85ebca6b) ^
      Math.imul(index + 1, 0x9e3779b1) ^
      salt;
    hash = Math.imul(hash ^ (hash >>> 16), 0x7feb352d);
    hash = Math.imul(hash ^ (hash >>> 15), 0x846ca68b);
    return { id, roll: (hash ^ (hash >>> 16)) >>> 0 };
  })
    .sort((a, b) => a.roll - b.roll)
    .slice(0, count)
    .map((item) => item.id);
}
export function potionDescription(run: Adventure, type: Potion): string {
  const strength = potionPotency(run),
    extra = strength - 1;
  const turn = " Does not use your turn. Changes last for this battle.";
  switch (type) {
    case "power":
      return `Choose a card in your hand. All four edges gain +${strength} for this battle. Does not use your turn.`;
    case "heal":
      return `Recover ${strength} ${strength === 1 ? "life" : "lives"}, up to ${maxLives(run)}. Can be used between battles too.`;
    case "hex":
      return `Choose an enemy board card. All four edges lose ${strength} pip${strength === 1 ? "" : "s"}, stopping at zero. Does not use your turn.`;
    case "sharpen":
      return `Choose a hand card, then an edge to gain +${3 + extra} pips.${turn}`;
    case "fortify":
      return `Choose a friendly board card. All four edges gain +${strength}. The boost stays through Silence; this causes no captures.${turn}`;
    case "shatter":
      return `Choose an enemy board card and an edge. Remove up to ${3 + extra} pips, stopping at zero. Damage stays through Silence.${turn}`;
    case "hush":
      return `Choose either player's board card with keywords. Silence all its keywords and restore printed pips minus recorded damage. Earlier captures and resolved effects stay.${turn}`;
    case "compass":
      return `Rotate a hand card 90° clockwise: West → North → East → South. Directional keywords rotate too; Sunder with a chosen edge stays flexible.${turn}`;
    case "prism":
      return `Choose a hand card, then its new element. Elements counted by its Resonance keywords keep their original settings.${turn}`;
    case "mend":
      return `Choose a friendly board card. Repair up to ${2 + extra} recorded damage on each edge. Cannot restore bonuses removed by Silence.${turn}`;
    case "frost":
      return `Choose a row containing enemy cards. Each enemy card in that row loses ${strength} pip${strength === 1 ? "" : "s"} on every edge, stopping at zero. Friendly cards are safe.${turn}`;
    case "resonance":
      return `Give a hand card Resonance on a chosen edge, counting that card's current element. It activates once when the card is played.${turn}`;
    case "gambit":
      return `Add ${2 + extra} pips to a hand card, up to a total of 16, then randomly redistribute its pips once with at most 4 per edge. The new strengths are fixed now.${turn}`;
    case "treasure":
      return `Gain ${30 + extra * 10} gold immediately${hasRelic(run, "gilded-compass") ? ` (${earnedGold(run, 30 + extra * 10)} with Gilded Compass)` : ""}. Can be used between battles too. Does not use your turn.`;
    case "transposition":
      return `Choose two different friendly board cards to swap positions. Their pips and keyword snapshots stay. This causes no captures. The chest and throne cannot move.${turn}`;
  }
}
function handStone(run: Adventure, target: unknown) {
  return typeof target === "string"
    ? run.battle?.hands[0].find((stone) => stone.id === target)
    : undefined;
}
function boardCell(run: Adventure, target: unknown) {
  return typeof target === "number" && Number.isInteger(target)
    ? run.battle?.board[target]
    : undefined;
}
export function rotatedPotionStone(stone: Stone): Stone {
  const rotate = (keyword: StoneKeyword): StoneKeyword =>
    keyword.type === "combo"
      ? {
          ...keyword,
          pips: keyword.pips?.map((pip) => ({
            ...pip,
            side: ((pip.side + 1) % 4) as Side,
          })),
          keywords: keyword.keywords?.map(
            (grant) =>
              rotate(grant) as Exclude<StoneKeyword, { type: "combo" }>,
          ),
        }
      : "side" in keyword && keyword.side !== "any"
        ? { ...keyword, side: ((keyword.side + 1) % 4) as Side }
        : { ...keyword };
  return {
    ...stone,
    edges: [stone.edges[3], stone.edges[0], stone.edges[1], stone.edges[2]],
    keywords: (stone.keywords || []).map(rotate),
  };
}
function rotationChanges(stone: Stone) {
  const rotated = rotatedPotionStone(stone);
  const signature = (card: Stone) =>
    JSON.stringify([
      card.edges,
      (card.keywords || [])
        .map(
          (keyword) =>
            `${keywordKey(keyword)}:${keyword.type === "resonance" ? keyword.element : keyword.type === "sunder" ? (keyword.amount ?? 1) : ""}`,
        )
        .sort(),
    ]);
  return signature(stone) !== signature(rotated);
}
function damageCell(
  cell: PlacedStone,
  amount: number,
  onlySide?: Side,
): PlacedStone {
  const before = cell.edges || cell.stone.edges;
  const edges = before.map((edge, side) =>
    onlySide === undefined || side === onlySide
      ? Math.max(0, edge - amount)
      : edge,
  ) as Edges;
  const reductions = before.map(
    (edge, side) => (cell.reductions?.[side] || 0) + edge - edges[side],
  ) as Edges;
  return { ...cell, edges, reductions };
}
function repairedCell(cell: PlacedStone, amount: number): PlacedStone {
  const reductions = (cell.reductions || [0, 0, 0, 0]).map((value) =>
    Math.max(0, value - amount),
  ) as Edges;
  const edges = (cell.edges || cell.stone.edges).map((edge, side) =>
    cell.silenced
      ? Math.max(0, cell.stone.edges[side] - reductions[side])
      : edge + (cell.reductions?.[side] || 0) - reductions[side],
  ) as Edges;
  return { ...cell, edges, reductions };
}
export function potionSideOptions(
  run: Adventure,
  type: Potion,
  target: string | number,
): Side[] {
  const stone = handStone(run, target),
    cell = boardCell(run, target);
  return ([0, 1, 2, 3] as Side[]).filter((side) =>
    type === "sharpen"
      ? !!stone && stone.edges[side] < HAND_EDGE_LIMIT
      : type === "shatter"
        ? !!cell && (cell.edges || cell.stone.edges)[side] > 0
        : type === "resonance"
          ? !!stone &&
            !hasSkystonesArtwork(stone) &&
            validateKeywords([
              ...(stone.keywords || []),
              { type: "resonance", side, element: stone.element },
            ])
          : false,
  );
}
export function adventurePotionTargets(
  run: Adventure,
  type: Potion,
): PotionTarget[] {
  const battle = run.battle;
  if (!battle) return [];
  const definition = POTIONS[type];
  if (definition.target === "none") return [];
  if (definition.target === "hand")
    return battle.hands[0]
      .filter((stone) =>
        type === "power"
          ? stone.edges.some((edge) => edge < HAND_EDGE_LIMIT)
          : type === "compass"
            ? rotationChanges(stone)
            : type === "gambit"
              ? stone.edges.reduce((a, b) => a + b, 0) < 16
              : type === "sharpen" || type === "resonance"
                ? potionSideOptions(run, type, stone.id).length > 0
                : true,
      )
      .map((stone) => ({
        target: stone.id,
        stone,
        edges: arenaEdges(
          stone.edges,
          stone.element,
          battle.elementCycle?.[battle.turns % battle.elementCycle.length],
        ),
        label: `${type === "power" ? "Empower" : type === "sharpen" ? "Sharpen" : type === "compass" ? "Rotate" : type === "prism" ? "Recolor" : type === "resonance" ? "Enchant" : "Reshape"} ${stone.name}`,
      }));
  const swapCandidates = battle.board.flatMap((cell, index) =>
    cell?.owner === 0 && index !== battle.objective ? [index] : [],
  );
  const rows = new Set<number>();
  return battle.board.flatMap((cell, index) => {
    if (!cell) return [];
    const edges = cell.edges || cell.stone.edges;
    if (
      (definition.target === "friendly" && cell.owner !== 0) ||
      (definition.target === "enemy" && cell.owner !== 1)
    )
      return [];
    if (type === "hush" && (!cell.stone.keywords?.length || cell.silenced))
      return [];
    if (
      (type === "hex" || type === "shatter") &&
      !edges.some((edge) => edge > 0)
    )
      return [];
    if (
      type === "fortify" &&
      !edges.some(
        (edge, side) => edge < 99 && cell.stone.edges[side] < HAND_EDGE_LIMIT,
      )
    )
      return [];
    if (
      type === "mend" &&
      !repairedCell(cell, 2 + potionPotency(run) - 1).edges!.some(
        (edge, side) => edge > edges[side],
      )
    )
      return [];
    if (
      type === "transposition" &&
      (swapCandidates.length < 2 || !swapCandidates.includes(index))
    )
      return [];
    if (type === "frost") {
      const row = Math.floor(index / run.size),
        enemies = battle.board.filter(
          (value, at) =>
            value?.owner === 1 && Math.floor(at / run.size) === row,
        );
      if (
        rows.has(row) ||
        !enemies.some((value) =>
          (value!.edges || value!.stone.edges).some((edge) => edge > 0),
        )
      )
        return [];
      rows.add(row);
      return [
        {
          target: index,
          stone: cell.stone,
          edges: cardEdges(cell),
          label: `Freeze row ${String.fromCharCode(65 + row)} · ${enemies.length} enemy card${enemies.length === 1 ? "" : "s"}`,
        },
      ];
    }
    return [
      {
        target: index,
        stone: cell.stone,
        edges: cardEdges(cell),
        label: `${type === "hex" ? "Hex" : type === "shatter" ? "Shatter" : type === "fortify" ? "Fortify" : type === "hush" ? "Silence" : type === "mend" ? "Restore" : "Swap"} ${coordinate(index, run.size)} · ${cell.stone.name}`,
      },
    ];
  });
}
export function adventurePotionAvailability(
  run: Adventure,
  index: number,
): { usable: boolean; reason: string } {
  const type = run.potions[index];
  if (!Number.isInteger(index) || !type || !Object.hasOwn(POTIONS, type))
    return { usable: false, reason: "Choose a potion in your belt." };
  if (run.phase === "ended")
    return { usable: false, reason: "This adventure has ended." };
  if (run.phase === "battle" && run.battle?.current !== 0)
    return { usable: false, reason: "Wait until your turn." };
  if (POTIONS[type].combat && (run.phase !== "battle" || !run.battle))
    return { usable: false, reason: "Use that potion during a battle." };
  if (type === "heal" && run.healingLocked)
    return { usable: false, reason: "Mind Bloom prevents healing." };
  if (type === "heal" && run.lives >= maxLives(run))
    return { usable: false, reason: "You are already at full life." };
  if (
    POTIONS[type].target !== "none" &&
    !adventurePotionTargets(run, type).length
  )
    return {
      usable: false,
      reason: "There are no valid targets for this potion yet.",
    };
  return { usable: true, reason: "" };
}
export function useAdventurePotion(
  run: Adventure,
  index: number,
  target?: string | number,
  choice: PotionChoice = {},
): Adventure {
  const availability = adventurePotionAvailability(run, index);
  if (!availability.usable) throw new Error(availability.reason);
  const type = run.potions[index],
    definition = POTIONS[type],
    strength = potionPotency(run),
    extra = strength - 1;
  if (
    definition.target !== "none" &&
    !adventurePotionTargets(run, type).some(
      (option) => option.target === target,
    )
  )
    throw new Error("Choose a valid card or row for this potion.");
  if (
    definition.choice === "side" &&
    (choice.side === undefined ||
      !potionSideOptions(run, type, target!).includes(choice.side))
  )
    throw new Error("Choose an available edge.");
  if (
    type === "prism" &&
    (!choice.element ||
      !Object.hasOwn(ELEMENTS, choice.element) ||
      choice.element === handStone(run, target)!.element)
  )
    throw new Error("Choose a different element.");
  if (
    type === "transposition" &&
    (choice.second === target ||
      !adventurePotionTargets(run, type).some(
        (option) => option.target === choice.second,
      ))
  )
    throw new Error(
      "Choose two different friendly cards away from the objective.",
    );
  let next = run;
  if (type === "heal")
    next = { ...run, lives: Math.min(maxLives(run), run.lives + strength) };
  else if (type === "treasure")
    next = { ...run, gold: run.gold + earnedGold(run, 30 + extra * 10) };
  else {
    const battle = run.battle!;
    if (definition.target === "hand") {
      const hands: [Stone[], Stone[]] = [
        battle.hands[0].map((stone) => {
          if (stone.id !== target) return stone;
          if (type === "compass") return rotatedPotionStone(stone);
          if (type === "prism") return { ...stone, element: choice.element! };
          if (type === "resonance")
            return {
              ...stone,
              keywords: [
                ...(stone.keywords || []),
                {
                  type: "resonance",
                  side: choice.side!,
                  element: stone.element,
                },
              ],
            };
          if (type === "gambit")
            return {
              ...stone,
              edges: rollDizzy(
                [stone.edges.reduce((a, b) => a + b, 0) + 2 + extra, 0, 0, 0],
                run.seed ^
                  Math.imul(run.floor + 1, 0x85ebca6b) ^
                  Math.imul((battle.potionsUsed || 0) + 1, 0x9e3779b1) ^
                  battle.turns,
                0,
                4, // Gambler’s Brew keeps its own four-pip limit.
              ),
            };
          return {
            ...stone,
            edges: stone.edges.map((edge, side) =>
              Math.min(
                HAND_EDGE_LIMIT,
                edge +
                  (type === "power"
                    ? strength
                    : side === choice.side
                      ? 3 + extra
                      : 0),
              ),
            ) as Edges,
          };
        }),
        battle.hands[1],
      ];
      next = { ...run, battle: { ...battle, hands } };
    } else if (type === "hush") {
      const source: Stone = {
        ...boardCell(run, target)!.stone,
        keywords: [{ type: "silence" }],
      };
      const resolved = prepareTargeting(battle.board, source, [
        { keywordIndex: 0, boardIndex: target as number },
      ]);
      next = { ...run, battle: { ...battle, board: resolved.board } };
    } else if (type === "transposition") {
      const board = [...battle.board];
      [board[target as number], board[choice.second!]] = [
        board[choice.second!],
        board[target as number],
      ];
      next = { ...run, battle: { ...battle, board } };
    } else {
      const row = Math.floor((target as number) / boardSize(battle.board));
      const board = battle.board.map((cell, at) => {
        if (
          !cell ||
          (type === "frost"
            ? cell.owner !== 1 || Math.floor(at / run.size) !== row
            : at !== target)
        )
          return cell;
        if (type === "mend") return repairedCell(cell, 2 + extra);
        if (type === "fortify") {
          const before = cell.edges || cell.stone.edges,
            additions = before.map((edge, side) =>
              Math.max(
                0,
                Math.min(
                  strength,
                  99 - edge,
                  HAND_EDGE_LIMIT - cell.stone.edges[side],
                ),
              ),
            );
          return {
            ...cell,
            stone: {
              ...cell.stone,
              edges: cell.stone.edges.map(
                (edge, side) => edge + additions[side],
              ) as Edges,
            },
            edges: before.map((edge, side) => edge + additions[side]) as Edges,
          };
        }
        return damageCell(
          cell,
          type === "shatter" ? 3 + extra : strength,
          type === "shatter" ? choice.side : undefined,
        );
      });
      next = { ...run, battle: { ...battle, board } };
    }
  }
  const saved =
    run.phase === "battle" &&
    !!run.battle &&
    hasRelic(run, "bottomless-bottle") &&
    !run.battle.potionSaved;
  return {
    ...next,
    ...(run.phase === "battle" && next.battle
      ? {
          battle: {
            ...next.battle,
            potionsUsed: (run.battle?.potionsUsed || 0) + 1,
            ...(saved ? { potionSaved: true } : {}),
          },
        }
      : {}),
    potions: saved ? run.potions : run.potions.filter((_, at) => at !== index),
    message: `Used ${POTIONS[type].name}.${saved ? " Bottomless Bottle keeps this potion." : ""}`,
  };
}
