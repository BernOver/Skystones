import type { Element } from "./game";

export const CARD_THEMES: Record<
  Element,
  { title: string; description: string }
> = {
  fire: {
    title: "Fuel the flames",
    description:
      "Create expendable sparks, discard cards, and turn each sacrifice into Scavenge or Parting Gift bonuses.",
  },
  life: {
    title: "Grow together",
    description:
      "Resonance rewards a thriving Life board. Springs, protective growth, and follow-up buffs keep the grove growing.",
  },
  undead: {
    title: "Wear them down",
    description:
      "Sunder, Silence, Blight, and negative Next Play effects weaken opposing cards before the decisive capture.",
  },
  magic: {
    title: "Make the impossible",
    description:
      "Conjure tokens and new cards, build clever Combo chains, and turn unpredictable magic into new opportunities.",
  },
  water: {
    title: "Weather the storm",
    description:
      "Shield, Bastion, Mirror Pool, and Comeback absorb pressure and turn a defended position into a counterattack.",
  },
  earth: {
    title: "Hold and break",
    description:
      "Build sturdy defenses, shape the ground, and use heavy Sunder blows to crack an opponent's strongest edge.",
  },
  air: {
    title: "Change the angle",
    description:
      "Shift neighbors around the board, ride Crosswind, and line up the next strike with speed and positioning.",
  },
  tech: {
    title: "Build the engine",
    description:
      "Combo chains, prepared Next Play bonuses, and mechanical helpers reward careful sequencing.",
  },
  light: {
    title: "Pass on the light",
    description:
      "Give the next card stronger pips and protective keywords, spreading bright support across the hand.",
  },
  dark: {
    title: "Strike from the shadows",
    description:
      "Silence key abilities, move enemies out of position, and exploit an opening before they recover.",
  },
  neutral: {
    title: "Chaos has a plan",
    description:
      "Kaos mixes unpredictable Dizzy rolls, summoned minions, and disruptive attacks from across the elements.",
  },
};
