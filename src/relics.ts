export const RELICS = {
  "gilded-compass": {
    name: "Gilded Compass",
    description:
      "Gain 25% more gold from battles, guarded chests, and events. Rounded down after each payout.",
  },
  "merchants-purse": {
    name: "Merchant’s Purse",
    description:
      "Gain 100 gold immediately when you acquire this relic. Activates once.",
  },
  "runesmiths-quill": {
    name: "Runesmith’s Quill",
    description:
      "Card rewards have an extra 30 percentage-point chance to carry a keyword, including early rewards.",
  },
  "twin-sigil": {
    name: "Twin Sigil",
    description:
      "Choose two different card rewards after each victory instead of one.",
  },
  "travelers-satchel": {
    name: "Traveler’s Satchel",
    description: "Your potion belt holds five potions instead of three.",
  },
  "bubbling-flask": {
    name: "Bubbling Flask",
    description:
      "Receive a second copy of each free potion from battles, events, or relics, if your belt has room.",
  },
  "alchemists-mortar": {
    name: "Alchemist’s Mortar",
    description:
      "Potions are one point stronger: Power Tonic adds 2 per edge, Hex Vial removes 2 per edge, and Healing Draught restores 2 lives.",
  },
  "phoenix-feather": {
    name: "Phoenix Feather",
    description:
      "Survive your first fatal battle loss with 1 life. The feather is spent afterward.",
  },
  "campfire-charm": {
    name: "Campfire Charm",
    description:
      "Recover 1 life after every battle you win, up to your maximum lives.",
  },
  "hagglers-coin": {
    name: "Haggler’s Coin",
    description:
      "All shop cards, potions, upgrades, and relics cost 20% less. Prices round up.",
  },
  "stonewrights-hammer": {
    name: "Stonewright’s Hammer",
    description:
      "Card rewards gain one extra printed pip, up to the normal 12-pip total.",
  },
  "fated-lens": {
    name: "Fated Lens",
    description: "Card reward screens offer five cards instead of three.",
  },
  "pilgrims-flask": {
    name: "Pilgrim’s Flask",
    description:
      "Immediately fill every empty potion slot with a mix of Power Tonics, Hex Vials, and Healing Draughts. Activates once.",
  },
  "treasure-magnet": {
    name: "Treasure Magnet",
    description:
      "Holding a guarded chest at the end of a battle grants 30 extra gold on top of its usual bonus.",
  },
  "vanguard-banner": {
    name: "Vanguard Banner",
    description:
      "The first stone you play in each battle gains +1 on all four edges for that battle.",
  },
  "victory-medallion": {
    name: "Victory Medallion",
    description: "Gain 10 extra gold after each battle you win.",
  },
  "copper-claw": {
    name: "Copper Claw",
    description:
      "Earn 2 gold per enemy card you capture during a battle, including recaptures. Paid at battle end.",
  },
  "quiet-coin": {
    name: "Quiet Coin",
    description: "Gain 15 gold when you enter each merchant. Once per visit.",
  },
  "rainy-day-bank": {
    name: "Rainy Day Bank",
    description:
      "When leaving a shop, gain 10% of your remaining gold, rounded down, up to 30 gold.",
  },
  "restful-ember": {
    name: "Restful Ember",
    description:
      "Recover 1 life on arriving at a camp, before choosing its normal reward.",
  },
  "whetstone-ring": {
    name: "Whetstone Ring",
    description:
      "Shop sharpening adds up to 2 pips instead of 1 on the offered edge, within the printed-stat limits.",
  },
  "elemental-prism": {
    name: "Elemental Prism",
    description:
      "Changing a card\u2019s element at a shop also adds 1 pip to its weakest edge, if there is room.",
  },
  "rune-echo": {
    name: "Rune Echo",
    description:
      "Shop inscriptions also add the same keyword to the opposite edge, if available. Whole-card keywords are added once.",
  },
  "market-map": {
    name: "Market Map",
    description: "Merchants you enter stock four cards instead of three.",
  },
  "herbalists-lens": {
    name: "Herbalist\u2019s Lens",
    description:
      "Every battle victory grants a free potion, if your belt has room.",
  },
  "bottomless-bottle": {
    name: "Bottomless Bottle",
    description:
      "The first potion you successfully use in each battle stays in your belt. Later uses consume potions normally.",
  },
  "duelists-bracer": {
    name: "Duelist\u2019s Bracer",
    description:
      "Recover 1 life the first time you capture an enemy card in each battle.",
  },
  "stout-heart": {
    name: "Stout Heart",
    description:
      "Increase your maximum lives from 3 to 4 and immediately recover 1 life.",
  },
  "loaded-dice": {
    name: "Loaded Dice",
    description:
      "Your Dizzy cards keep at least 2 pips on each edge when their total allows. Lower totals use the highest possible equal minimum.",
  },
  "oracles-eye": {
    name: "Oracle\u2019s Eye",
    description: "Reveal the keeper\u2019s remaining hand during every battle.",
  },
} as const;
export type RelicId = keyof typeof RELICS;
export const RELIC_IDS = Object.keys(RELICS) as RelicId[];
type RelicHolder = { relics?: RelicId[] };
export const hasRelic = (run: RelicHolder, id: RelicId): boolean =>
  (run.relics || []).includes(id);
export const maxLives = (run: RelicHolder): number =>
  hasRelic(run, "stout-heart") ? 4 : 3;
export const potionCapacity = (run: RelicHolder): number =>
  hasRelic(run, "travelers-satchel") ? 5 : 3;
export const potionPotency = (run: RelicHolder): number =>
  hasRelic(run, "alchemists-mortar") ? 2 : 1;
export const earnedGold = (run: RelicHolder, amount: number): number =>
  Math.floor(amount * (hasRelic(run, "gilded-compass") ? 1.25 : 1));
export const shopPrice = (run: RelicHolder, amount: number): number =>
  Math.ceil(amount * (hasRelic(run, "hagglers-coin") ? 0.8 : 1));
export const cardRewardPicks = (run: RelicHolder): number =>
  hasRelic(run, "twin-sigil") ? 2 : 1;
export function offerRelics(
  run: RelicHolder & { seed: number; floor: number },
  count = 3,
  salt = 0,
): RelicId[] {
  function hash(index: number) {
    let value =
      Math.imul(run.seed ^ 0x632be59b, 0x9e3779b1) ^
      Math.imul(run.floor + 1, 0x85ebca6b) ^
      Math.imul(index + 1, 0xc2b2ae35) ^
      salt;
    value = Math.imul(value ^ (value >>> 16), 0x7feb352d);
    value = Math.imul(value ^ (value >>> 15), 0x846ca68b);
    return (value ^ (value >>> 16)) >>> 0;
  }
  return RELIC_IDS.map((id, index) => ({ id, roll: hash(index) }))
    .filter(({ id }) => !hasRelic(run, id))
    .sort((a, b) => a.roll - b.roll)
    .slice(0, count)
    .map(({ id }) => id);
}
