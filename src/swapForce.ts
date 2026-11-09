import { hasTribe, stoneTribes, validateTribes } from "./tribes.ts";
import { CHARACTER_PORTRAITS } from "./characters.ts";
import { ELEMENTS, validateKeywords, MAX_KEYWORDS } from "./game.ts";
import type { Creature, Edges, Element, Stone, StoneKeyword } from "./game.ts";

export type SwapHalf = "top" | "bottom";
export interface SwapIdentity {
  id: string;
  name: string;
  description: string;
  element: Element;
  creature: Creature;
  portrait?: string;
  image?: string;
  tribes: NonNullable<Stone["tribes"]>;
}
export interface SwapParts {
  top: SwapIdentity;
  bottom: SwapIdentity;
}
export function isSwapForce(stone: Stone): boolean {
  return hasTribe(stone, "swap-force");
}
export function keywordHalf(keyword: StoneKeyword): SwapHalf {
  if (keyword.half) return keyword.half;
  return "side" in keyword && (keyword.side === 1 || keyword.side === 2)
    ? "bottom"
    : "top";
}
export function halfKeywords(stone: Stone, half: SwapHalf): StoneKeyword[] {
  return (stone.keywords || []).filter(
    (keyword) => keywordHalf(keyword) === half,
  );
}
export function swapIdentity(stone: Stone, half: SwapHalf): SwapIdentity {
  const stored = stone.swapParts?.[half];
  if (stored)
    return { ...stored, ...(half === "top" ? { element: stone.element } : {}) };
  return {
    id: stone.id,
    name: stone.name,
    description: stone.description,
    element: stone.element,
    creature: stone.creature,
    ...(stone.portrait ? { portrait: stone.portrait } : {}),
    ...(stone.image ? { image: stone.image } : {}),
    tribes: [...stoneTribes(stone)],
  };
}
export function joinedEdges(top: Edges, bottom: Edges): Edges {
  return [top[0], bottom[1], bottom[2], top[3]];
}
function mixedCard(topCard: Stone, bottomCard: Stone): Stone {
  const top = structuredClone(swapIdentity(topCard, "top")),
    bottom = structuredClone(swapIdentity(bottomCard, "bottom"));
  const keywords = [
    ...halfKeywords(topCard, "top").map((keyword) => ({
      ...structuredClone(keyword),
      half: "top" as const,
    })),
    ...halfKeywords(bottomCard, "bottom").map((keyword) => ({
      ...structuredClone(keyword),
      half: "bottom" as const,
    })),
  ];
  if (keywords.length > MAX_KEYWORDS)
    throw new Error(
      `These halves exceed the ${MAX_KEYWORDS}-keyword card limit. Choose another pair.`,
    );
  if (!validateKeywords(keywords))
    throw new Error(
      "A half repeats one of its own unique keywords. Edit that half in Card studio before swapping.",
    );
  const topWords = top.name.split(/\s+/),
    bottomWords = bottom.name.split(/\s+/);
  const tribes = [...new Set([...top.tribes, ...bottom.tribes])];
  if (!validateTribes(tribes))
    throw new Error(
      "These halves exceed the card tribe limit. Choose another pair.",
    );
  const name =
    top.id === bottom.id
      ? top.name
      : `${topWords.length > 1 ? topWords.slice(0, -1).join(" ") : top.name} ${bottomWords.at(-1)}`.slice(
          0,
          40,
        );
  const zero: Edges = [0, 0, 0, 0];
  const pips = joinedEdges(
      topCard.discardBuffs?.pips || zero,
      bottomCard.discardBuffs?.pips || zero,
    ),
    shields = joinedEdges(
      topCard.discardBuffs?.shields || zero,
      bottomCard.discardBuffs?.shields || zero,
    );
  return {
    ...topCard,
    name,
    description:
      top.id === bottom.id
        ? top.description
        : `Top: ${top.name}. Bottom: ${bottom.name}. Top gives North/West; bottom gives South/East.`.slice(
            0,
            120,
          ),
    origin: "skylanders",
    edges: joinedEdges(topCard.edges, bottomCard.edges),
    element: top.element,
    creature: top.creature,
    portrait: top.portrait,
    image: undefined,
    tribes,
    keywords,
    swapParts: { top, bottom },
    baseEdges: undefined,
    baseKeywords: undefined,
    discardBuffs: [...pips, ...shields].some(Boolean)
      ? { pips, shields }
      : undefined,
  };
}
export function swapCards(first: Stone, second: Stone): [Stone, Stone] {
  if (first.id === second.id)
    throw new Error("Choose two different cards from your hand.");
  if (!isSwapForce(first) || !isSwapForce(second))
    throw new Error("Both cards must have the SWAP Force character tribe.");
  return [mixedCard(first, second), mixedCard(second, first)];
}
export function swapHand(
  hand: Stone[],
  firstId: string,
  secondId: string,
): Stone[] {
  const first = hand.find((card) => card.id === firstId),
    second = hand.find((card) => card.id === secondId);
  if (!first || !second)
    throw new Error("Both SWAP Force cards must still be in your hand.");
  const [a, b] = swapCards(first, second);
  return hand.map((card) =>
    card.id === firstId ? a : card.id === secondId ? b : card,
  );
}
export function validSwapParts(value: unknown): value is SwapParts {
  if (!value || typeof value !== "object") return false;
  const parts = value as SwapParts;
  return [parts.top, parts.bottom].every(
    (part) =>
      part &&
      typeof part.id === "string" &&
      part.id.length > 0 &&
      part.id.length <= 200 &&
      typeof part.name === "string" &&
      part.name.trim().length > 0 &&
      part.name.length <= 40 &&
      typeof part.description === "string" &&
      part.description.length <= 120 &&
      Object.hasOwn(ELEMENTS, part.element) &&
      [
        "dragon",
        "turtle",
        "whale",
        "owl",
        "fox",
        "golem",
        "mushroom",
        "cat",
        "slime",
        "bat",
        "spider",
        "robot",
        "griffin",
        "crab",
        "serpent",
        "chest",
      ].includes(part.creature) &&
      validateTribes(part.tribes) &&
      part.tribes.includes("swap-force") &&
      (part.portrait === undefined ||
        CHARACTER_PORTRAITS.some(
          (portrait) => portrait.id === part.portrait,
        )) &&
      (part.image === undefined ||
        (typeof part.image === "string" &&
          part.image.length < 3_000_000 &&
          /^data:image\/(png|jpeg|webp);base64,/.test(part.image))),
  );
}
