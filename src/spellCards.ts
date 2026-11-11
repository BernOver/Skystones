import type { Stone } from "./game.ts";

export const DEFAULT_SPELLS: Stone[] = [
  {
    id: "custom-token-spell-fracture",
    name: "Fracture",
    element: "earth",
    portrait: "terrafin",
    keywords: [{ type: "sunder", side: "any", amount: 2 }],
  },
  {
    id: "custom-token-spell-hush",
    name: "Hush",
    element: "undead",
    portrait: "hex",
    keywords: [{ type: "silence" }],
  },
  {
    id: "custom-token-spell-spark",
    name: "Stored Spark",
    element: "fire",
    portrait: "ignitor",
    keywords: [
      { type: "next-play", recipient: "self", side: "all", amount: 1 },
    ],
  },
  {
    id: "custom-token-spell-summon",
    name: "Portal Spark",
    element: "magic",
    portrait: "spyro",
    keywords: [
      { type: "conjure", mode: "random", count: 1, recipient: "self" },
    ],
  },
  {
    id: "custom-token-spell-discard-summon",
    name: "Broken Portal",
    element: "magic",
    portrait: "spyro",
    spell: "discard",
    keywords: [
      { type: "conjure", mode: "random", count: 2, recipient: "self" },
    ],
  },
  {
    id: "custom-token-spell-discard-hex",
    name: "Shattered Hex",
    element: "undead",
    portrait: "hex",
    spell: "discard",
    keywords: [{ type: "sunder", side: "any", amount: 3 }],
  },
].map(
  (card) =>
    ({
      creature: "golem",
      edges: [0, 0, 0, 0],
      description:
        card.spell === "discard"
          ? "Power released only when this spell is discarded."
          : "A spark of Skylands magic. Cast without ending your turn.",
      token: true,
      custom: true,
      spell: "cast",
      ...card,
    }) as Stone,
);
