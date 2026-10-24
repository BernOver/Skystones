import {
  ELEMENTS,
  KEYWORD_RULES,
  EMPTY_BOARD,
  STARTER_STONES,
  chooseMove,
  coordinate,
  handSize,
  keywordKey,
  placeStone,
  score,
  validateKeywords,
  validateStone,
} from "./game.ts";
import type {
  Board,
  BoardSize,
  Creature,
  Edges,
  Element,
  KeywordTarget,
  KeywordType,
  Owner,
  Side,
  Stone,
  StoneKeyword,
} from "./game.ts";
import {
  RELICS,
  RELIC_IDS,
  cardRewardPicks,
  earnedGold,
  hasRelic,
  offerRelics,
  maxLives,
  potionCapacity,
  potionPotency,
  shopPrice,
} from "./relics.ts";
import type { RelicId } from "./relics.ts";

export type NodeKind =
  "battle" | "elite" | "event" | "chest" | "shop" | "camp" | "boss";
export interface AdventureNode {
  id: string;
  name: string;
  kind: NodeKind;
  description: string;
}
export const ROUTE: AdventureNode[][] = [
  [
    {
      id: "moss",
      name: "Mossy Footpath",
      kind: "battle",
      description: "A timid slime keeper. Mostly zero and one-pip edges.",
    },
    {
      id: "scrap",
      name: "Scrap Hollow",
      kind: "battle",
      description: "A little robot has found its first stones.",
    },
  ],
  [
    {
      id: "chest-one",
      name: "The Brass Chest",
      kind: "chest",
      description:
        "A guarded chest near the center. Hold it at the finish for +45 gold.",
    },
    {
      id: "well",
      name: "Whispering Well",
      kind: "event",
      description: "Recover a life, or trade one for a purse of coins.",
    },
    {
      id: "whirling-idol",
      name: "The Whirling Idol",
      kind: "event",
      description:
        "Claim a 12-pip Magic stone with Dizzy. Powerful attacks, unpredictable defenses.",
    },
    {
      id: "rune-shrine",
      name: "The Runesmith’s Shrine",
      kind: "event",
      description:
        "Choose one of three inscriptions to add to a stone for free.",
    },
  ],
  [
    {
      id: "shop-one",
      name: "The Wandering Merchant",
      kind: "shop",
      description: "Cards, potions, and a workshop that improves your stones.",
    },
  ],
  [
    {
      id: "reef",
      name: "Tideglass Crossing",
      kind: "battle",
      description: "A crab collector with a few stronger edges.",
    },
    {
      id: "belfry",
      name: "Old Belfry",
      kind: "battle",
      description: "A bat keeper is learning keyword tricks.",
    },
  ],
  [
    {
      id: "alchemy",
      name: "The Alchemist",
      kind: "event",
      description: "Choose a free potion for the road ahead.",
    },
    {
      id: "chest-two",
      name: "The Gilded Cache",
      kind: "chest",
      description: "Another chest, another chance to win extra gold.",
    },
    {
      id: "reliquary",
      name: "The Forgotten Reliquary",
      kind: "event",
      description:
        "Choose one of three ancient relics to carry for the rest of your run.",
    },
    {
      id: "fusion-forge",
      name: "The Twinflame Forge",
      kind: "event",
      description:
        "Combine two stones into one. Preview their merged pips and keywords before choosing.",
    },
  ],
  [
    {
      id: "shop-two",
      name: "The Lantern Market",
      kind: "shop",
      description: "Stronger stones and another chance to improve your deck.",
    },
  ],
  [
    {
      id: "sentinel",
      name: "The Stone Sentinel",
      kind: "elite",
      description: "An elite keeper. Greater danger, richer rewards.",
    },
    {
      id: "storm",
      name: "Stormwatch",
      kind: "elite",
      description: "A griffin guards the last mountain pass.",
    },
  ],
  [
    {
      id: "camp",
      name: "The Last Campfire",
      kind: "camp",
      description: "Recover a life or permanently add a pip to one stone.",
    },
  ],
  [
    {
      id: "warden",
      name: "The Crown Warden",
      kind: "boss",
      description:
        "Only the throne starts on the board. Take it AND win the score to finish the run.",
    },
  ],
];
export type Potion = "power" | "heal" | "hex";
export const POTIONS: Record<
  Potion,
  { name: string; description: string; price: number }
> = {
  power: {
    name: "Power Tonic",
    description:
      "Choose a card in your hand. All four edges gain +1 for this battle. Does not use your turn.",
    price: 25,
  },
  heal: {
    name: "Healing Draught",
    description:
      "Recover one life, up to ${maxLives(run)}. Can be used between battles too.",
    price: 25,
  },
  hex: {
    name: "Hex Vial",
    description:
      "Choose an enemy board card. All four edges lose 1 pip, stopping at zero. Does not use your turn.",
    price: 30,
  },
};
export interface AdventureBattle {
  board: Board;
  hands: [Stone[], Stone[]];
  current: Owner;
  turns: number;
  name: string;
  objective?: number;
  objectiveKind?: "chest" | "throne";
  lastCaptured: number[];
  log: string[];
  vanguardUsed?: boolean;
  captures?: number;
  potionSaved?: boolean;
  bracerUsed?: boolean;
}
export interface Adventure {
  version: 1;
  seed: number;
  size: BoardSize;
  floor: number;
  phase: "map" | "battle" | "event" | "shop" | "reward" | "ended";
  gold: number;
  lives: number;
  inventory: Stone[];
  deck: string[];
  potions: Potion[];
  node?: AdventureNode;
  battle?: AdventureBattle;
  rewards: Stone[];
  shopCards: Stone[];
  shopPotions: { id: string; type: Potion }[];
  message: string;
  victory: boolean;
  relics?: RelicId[];
  spentRelics?: RelicId[];
  relicOffers?: RelicId[];
  shopRelic?: RelicId | null;
  shopRerolls?: number;
  shopFreeRerollUsed?: boolean;
  shopOffer?: WorkshopOffer;
  lastShopKeyword?: KeywordType;
  rewardPicksRemaining?: number;
}
export const ADVENTURE_STORAGE = "skystones-adventure-v1";
const ART: Creature[] = [
  "slime",
  "robot",
  "crab",
  "bat",
  "griffin",
  "serpent",
  "spider",
  "dragon",
  "turtle",
  "fox",
];
const ADJECTIVES = [
  "Little",
  "Mossy",
  "Brass",
  "Glimmer",
  "Dusk",
  "Tide",
  "Cloud",
  "Crown",
];
const CREATURE_NAMES: Record<string, string> = {
  slime: "Slime",
  robot: "Automaton",
  crab: "Crab",
  bat: "Bat",
  griffin: "Griffin",
  serpent: "Serpent",
  spider: "Weaver",
  dragon: "Drake",
  turtle: "Turtle",
  fox: "Fox",
};
function random(seed: number) {
  let state = seed >>> 0 || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}
export function makeRunCard(
  seed: number,
  budget: number,
  id: string,
  keywordTier = 0,
  keywordBonus = 0,
): Stone {
  const rng = random(seed),
    edges: Edges = [0, 0, 0, 0];
  for (let i = 0; i < Math.min(12, budget); i++) {
    const available = edges.flatMap((edge, side) => (edge < 5 ? [side] : []));
    edges[available[Math.floor(rng() * available.length)]]++;
  }
  const creature = ART[Math.floor(rng() * ART.length)],
    elements = Object.keys(ELEMENTS) as Element[];
  const element = elements[Math.floor(rng() * elements.length)];
  const keywords: StoneKeyword[] =
    (keywordTier > 0 || keywordBonus > 0) &&
    rng() < Math.min(1, (keywordTier > 0 ? 0.55 : 0) + keywordBonus)
      ? [
          keywordTier > 4
            ? {
                type: "resonance",
                side: Math.floor(rng() * 4) as Side,
                element,
              }
            : { type: "comeback", side: Math.floor(rng() * 4) as Side },
        ]
      : [];
  return {
    id: `custom-run-${id}`,
    name: `${ADJECTIVES[Math.floor(rng() * ADJECTIVES.length)]} ${CREATURE_NAMES[creature]}`,
    element,
    creature,
    edges,
    keywords,
    description: "A stone found on the road to the Crown Warden.",
    custom: true,
  };
}
export function rewardCards(
  run: Adventure,
  applyRelics = true,
  count?: number,
): Stone[] {
  const relicRun = applyRelics ? run : { relics: [] };
  return Array.from(
    { length: count ?? (hasRelic(relicRun, "fated-lens") ? 5 : 3) },
    (_, i) =>
      makeRunCard(
        run.seed + run.floor * 101 + i * 17,
        Math.min(
          12,
          4 + run.floor + (hasRelic(relicRun, "stonewrights-hammer") ? 1 : 0),
        ),
        `${run.seed}-reward-${run.floor}-${i}`,
        run.floor,
        hasRelic(relicRun, "runesmiths-quill") ? 0.3 : 0,
      ),
  );
}
export function newAdventure(
  size: BoardSize,
  seed = Math.floor(Math.random() * 2 ** 30),
): Adventure {
  const inventory = Array.from({ length: handSize(size) + 2 }, (_, i) =>
    makeRunCard(seed + i * 53, i % 3 === 0 ? 5 : 4, `${seed}-start-${i}`),
  );
  // Every starter has a reliable two-pip attack and a weak edge. Rotate the
  // stronger sides so either hand size covers all four directions.
  inventory.forEach((stone, i) => {
    const edges: Edges = [0, 0, 0, 0];
    edges[i % 4] = 2;
    edges[(i + 1) % 4] = i % 3 === 0 ? 2 : 1;
    edges[(i + 2) % 4] = 1;
    stone.edges = edges;
  });
  return {
    version: 1,
    seed,
    size,
    floor: 0,
    phase: "map",
    gold: 60,
    lives: 3,
    inventory,
    deck: inventory.slice(0, handSize(size)).map((s) => s.id),
    potions: ["power", "heal"],
    rewards: [],
    shopCards: [],
    shopPotions: [],
    message:
      "Your starter stones have 4–5 pips, including stronger two-pip edges. Choose your first encounter.",
    victory: false,
    relics: [],
    spentRelics: [],
    relicOffers: [],
    rewardPicksRemaining: 0,
  };
}
function advance(run: Adventure): Adventure {
  return {
    ...run,
    floor: Math.min(8, run.floor + 1),
    phase: "map",
    node: undefined,
    battle: undefined,
    rewards: [],
    shopCards: [],
    shopPotions: [],
    shopRelic: undefined,
    shopRerolls: undefined,
    shopFreeRerollUsed: undefined,
    shopOffer: undefined,
    relicOffers: [],
    rewardPicksRemaining: 0,
  };
}
export function setAdventureDeck(run: Adventure, id: string): Adventure {
  if (run.phase === "battle" || run.phase === "ended")
    throw new Error("Your deck is locked during a battle.");
  if (!run.inventory.some((stone) => stone.id === id))
    throw new Error("That stone is not in your pack.");
  if (run.deck.includes(id))
    return { ...run, deck: run.deck.filter((value) => value !== id) };
  if (run.deck.length >= handSize(run.size))
    throw new Error(
      `Remove a stone first. Take exactly ${handSize(run.size)} cards.`,
    );
  return { ...run, deck: [...run.deck, id] };
}
function beginBattle(run: Adventure, node: AdventureNode): Adventure {
  if (run.deck.length !== handSize(run.size))
    throw new Error(
      `Choose ${handSize(run.size)} cards in your expedition deck first.`,
    );
  const board = EMPTY_BOARD(run.size),
    middle = run.size === 3 ? 4 : 5;
  let objective: number | undefined,
    objectiveKind: "chest" | "throne" | undefined;
  if (node.kind === "chest" || node.kind === "boss") {
    objective = middle;
    objectiveKind = node.kind === "chest" ? "chest" : "throne";
    const stone: Stone = {
      ...STARTER_STONES[5],
      id: `custom-run-objective-${node.id}`,
      name: node.kind === "chest" ? "Guarded Treasure" : "The Crown Throne",
      creature: node.kind === "chest" ? "chest" : "robot",
      element: "tech",
      edges: node.kind === "chest" ? [1, 1, 1, 1] : [0, 3, 0, 3],
      keywords: [],
      description:
        node.kind === "chest"
          ? "Control this chest at the finish for 45 extra gold."
          : "You must control the throne and win the score.",
    };
    board[middle] = {
      stone,
      owner: 1,
      playedBy: 1,
      edges: [...stone.edges],
      activeKeywords: [],
    };
  }
  // Eight-card runs spread their rewards across a larger deck, and the keeper
  // has the final move on an even board. Ease its pip curve by one point.
  const budget = Math.max(
    1,
    Math.min(
      7,
      2 + Math.floor(run.floor * 0.5) + (node.kind === "elite" ? 1 : 0),
    ) - (run.size === 4 ? 1 : 0),
  );
  const enemies = Array.from({ length: handSize(run.size) }, (_, i) =>
    makeRunCard(
      run.seed + run.floor * 131 + i * 19,
      budget,
      `${run.seed}-enemy-${run.floor}-${i}`,
      run.floor > 2 ? run.floor : 0,
    ),
  );
  if (run.floor === 0)
    enemies.forEach((stone, i) => {
      const edges: Edges = [0, 0, 0, 0];
      edges[i % 4] = 1;
      if (run.size === 3) edges[(i + 1) % 4] = 1;
      stone.edges = edges;
    });
  return {
    ...run,
    node,
    phase: "battle",
    battle: {
      board,
      hands: [
        run.deck.map((id) => run.inventory.find((stone) => stone.id === id)!),
        enemies,
      ],
      current: 0,
      turns: 0,
      name: node.name,
      objective,
      objectiveKind,
      lastCaptured: [],
      log: [],
    },
    message:
      node.kind === "boss"
        ? "Only the throne starts on the board. Win the score AND hold it."
        : node.kind === "chest"
          ? "Hold the chest at the finish for 45 extra gold, even if you lose the score."
          : "Higher facing pips capture adjacent enemy stones.",
  };
}
export function enterAdventureNode(run: Adventure, id: string): Adventure {
  if (run.phase !== "map")
    throw new Error("Finish your current encounter first.");
  const node = ROUTE[run.floor].find((node) => node.id === id);
  if (!node) throw new Error("Choose a node on your current path.");
  if (["battle", "elite", "boss"].includes(node.kind))
    return beginBattle(run, node);
  if (node.kind === "shop") {
    // Older saves already beyond the first merchant have no offer history.
    // Recover that shop's original roll so the next merchant still differs.
    const previousKeyword =
      run.lastShopKeyword ??
      (run.floor > 2
        ? rollWorkshopOffer({ seed: run.seed, floor: 2 }).keyword.type
        : undefined);
    const shopOffer = rollWorkshopOffer(
      run,
      0,
      previousKeyword ? [previousKeyword] : [],
    );
    return {
      ...run,
      node,
      phase: "shop",
      gold: run.gold + (hasRelic(run, "quiet-coin") ? earnedGold(run, 15) : 0),
      ...shopStock(run, 0),
      shopOffer,
      lastShopKeyword: shopOffer.keyword.type,
      shopRerolls: 0,
      shopFreeRerollUsed: false,
      message: "Improve your stones, stock up, or save your gold for later.",
    };
  }
  return {
    ...run,
    node,
    phase: "event",
    lives:
      node.kind === "camp" && hasRelic(run, "restful-ember")
        ? Math.min(maxLives(run), run.lives + 1)
        : run.lives,
    message:
      node.kind === "camp" && hasRelic(run, "restful-ember")
        ? "Restful Ember restores 1 life on arrival. Choose your camp reward."
        : node.description,
    relicOffers: node.id === "reliquary" ? offerRelics(run, 3, 0x73687269) : [],
  };
}
function receiveFreePotions(run: Adventure, types: Potion[]): Potion[] {
  const drops = hasRelic(run, "bubbling-flask")
    ? types.flatMap((type) => [type, type])
    : types;
  return [...run.potions, ...drops].slice(0, potionCapacity(run));
}
export function potionDescription(run: Adventure, type: Potion): string {
  const strength = potionPotency(run);
  return type === "power"
    ? `Choose a card in your hand. All four edges gain +${strength} for this battle. Does not use your turn.`
    : type === "hex"
      ? `Choose an enemy board card. All four edges lose ${strength} pip${strength === 1 ? "" : "s"}, stopping at zero. Does not use your turn.`
      : `Recover ${strength} ${strength === 1 ? "life" : "lives"}, up to ${maxLives(run)}. Can be used between battles too.`;
}
function addRelic(run: Adventure, id: RelicId): Adventure {
  if (!Object.hasOwn(RELICS, id) || hasRelic(run, id))
    throw new Error("Choose an unowned relic.");
  let next: Adventure = { ...run, relics: [...(run.relics || []), id] };
  if (id === "stout-heart")
    next = { ...next, lives: Math.min(maxLives(next), next.lives + 1) };
  if (id === "merchants-purse") next = { ...next, gold: next.gold + 100 };
  if (id === "pilgrims-flask") {
    const types: Potion[] = ["power", "hex", "heal"];
    next = {
      ...next,
      potions: receiveFreePotions(
        next,
        Array.from(
          { length: potionCapacity(next) - next.potions.length },
          (_, i) => types[i % types.length],
        ),
      ),
    };
  }
  return {
    ...next,
    message: `Acquired ${RELICS[id].name}. ${RELICS[id].description}`,
  };
}
export function claimAdventureRelic(
  run: Adventure,
  id: RelicId | null,
): Adventure {
  const shrine = run.phase === "event" && run.node?.id === "reliquary";
  if (run.phase !== "reward" && !shrine)
    throw new Error("No relic reward is waiting.");
  if (id && !(run.relicOffers || []).includes(id))
    throw new Error("Choose one of the offered relics.");
  if (!shrine && !(run.relicOffers || []).length)
    throw new Error("No relic reward is waiting.");
  let next = id ? addRelic(run, id) : run;
  next = { ...next, relicOffers: [] };
  if (shrine) return advance(next);
  if (
    id &&
    next.rewards.length &&
    [
      "runesmiths-quill",
      "twin-sigil",
      "stonewrights-hammer",
      "fated-lens",
    ].includes(id)
  )
    next = {
      ...next,
      rewards: rewardCards(next),
      rewardPicksRemaining: cardRewardPicks(next),
    };
  return next;
}
export const RELIC_PRICE = 75;
export function buyAdventureRelic(run: Adventure, id: RelicId): Adventure {
  if (run.phase !== "shop" || run.shopRelic !== id || hasRelic(run, id))
    throw new Error("That relic is not for sale here.");
  const price = shopPrice(run, RELIC_PRICE);
  if (run.gold < price) throw new Error("You need more gold.");
  return addRelic({ ...run, gold: run.gold - price, shopRelic: null }, id);
}
export function adventureStoneForPlay(
  run: Adventure,
  stone: Stone,
  owner: Owner = 0,
): Stone {
  return run.phase === "battle" &&
    !!run.battle &&
    owner === 0 &&
    hasRelic(run, "vanguard-banner") &&
    !run.battle?.vanguardUsed
    ? { ...stone, edges: stone.edges.map((edge) => edge + 1) as Edges }
    : stone;
}
function finishBattle(run: Adventure): Adventure {
  const battle = run.battle!,
    [you, enemy] = score(battle.board),
    throne = battle.objectiveKind === "throne";
  const held =
    battle.objective !== undefined &&
    battle.board[battle.objective]?.owner === 0;
  const won = you > enemy && (!throne || held),
    draw = you === enemy && !throne;
  const chest =
    battle.objectiveKind === "chest" && held
      ? 45 + (hasRelic(run, "treasure-magnet") ? 30 : 0)
      : 0;
  const earned = earnedGold(
    run,
    (won
      ? 25 +
        run.floor * 5 +
        (run.node?.kind === "elite" ? 20 : 0) +
        (hasRelic(run, "victory-medallion") ? 10 : 0)
      : draw
        ? 10
        : 0) +
      chest +
      (hasRelic(run, "copper-claw") ? (battle.captures || 0) * 2 : 0),
  );
  let lives = run.lives - (won || draw ? 0 : 1);
  let spentRelics = run.spentRelics || [],
    revived = false;
  if (
    lives === 0 &&
    hasRelic(run, "phoenix-feather") &&
    !spentRelics.includes("phoenix-feather")
  ) {
    lives = 1;
    revived = true;
    spentRelics = [...spentRelics, "phoenix-feather"];
  }
  if (won && hasRelic(run, "campfire-charm"))
    lives = Math.min(maxLives(run), lives + 1);
  const victory = throne && won;
  const message = `${won ? "Victory" : draw ? "A draw" : "Battle lost"} · ${you}–${enemy}. +${earned} gold.${chest ? ` Chest secured: +${chest} bonus gold included.` : battle.objectiveKind === "chest" ? " The chest stayed with the keeper." : ""}${throne && !held ? " You did not secure the throne." : ""}${!won && !draw ? " One life lost." : ""}${revived ? " Phoenix Feather restores you to 1 life. The feather is now spent." : ""}${won && hasRelic(run, "campfire-charm") ? " Campfire Charm restores 1 life, up to your maximum lives." : ""}`;
  const potions =
    won && (run.floor % 3 === 0 || hasRelic(run, "herbalists-lens"))
      ? receiveFreePotions(run, [run.floor % 2 === 0 ? "hex" : "power"])
      : [...run.potions];
  const updated = {
    ...run,
    gold: run.gold + earned,
    lives,
    message,
    victory,
    potions,
    spentRelics,
  };
  return {
    ...updated,
    phase: victory || lives === 0 ? "ended" : "reward",
    rewards: won && !throne ? rewardCards(run) : [],
    rewardPicksRemaining: won && !throne ? cardRewardPicks(run) : 0,
    relicOffers:
      !victory &&
      lives > 0 &&
      ((won && (run.floor === 0 || run.node?.kind === "elite")) || chest > 0)
        ? offerRelics(run, 3, 0x62617474)
        : [],
  };
}
export function playAdventureCard(
  run: Adventure,
  index: number,
  cardIndex: number,
  targets: KeywordTarget[] = [],
): Adventure {
  if (run.phase !== "battle" || !run.battle)
    throw new Error("There is no active battle.");
  const battle = run.battle,
    original = battle.hands[battle.current][cardIndex];
  if (!original) throw new Error("Choose a card in the current hand.");
  const stone = adventureStoneForPlay(run, original, battle.current);
  const move = placeStone(battle.board, index, stone, battle.current, targets, {
      seed:
        run.seed ^
        Math.imul(run.floor + 1, 0x9e3779b1) ^
        Math.imul(battle.turns + 1, 0x85ebca6b) ^
        index,
      minimumDizzyPips:
        battle.current === 0 && hasRelic(run, "loaded-dice") ? 2 : 0,
    }),
    hands: [Stone[], Stone[]] = [[...battle.hands[0]], [...battle.hands[1]]];
  hands[battle.current].splice(cardIndex, 1);
  const bracer =
    battle.current === 0 &&
    move.captured.length > 0 &&
    hasRelic(run, "duelists-bracer") &&
    !battle.bracerUsed;
  const next = {
    ...run,
    lives: bracer ? Math.min(maxLives(run), run.lives + 1) : run.lives,
    battle: {
      ...battle,
      board: move.board,
      hands,
      current: (battle.current === 0 ? 1 : 0) as Owner,
      turns: battle.turns + 1,
      captures:
        (battle.captures || 0) +
        (battle.current === 0 ? move.captured.length : 0),
      bracerUsed: battle.bracerUsed || bracer,
      vanguardUsed:
        battle.vanguardUsed ||
        (battle.current === 0 && hasRelic(run, "vanguard-banner")),
      lastCaptured: move.captured,
      log: [
        `${battle.current === 0 ? "You" : "Keeper"}: ${stone.name} → ${coordinate(index, run.size)} · ${move.captured.length} captured`,
        ...battle.log,
      ].slice(0, 20),
    },
  };
  return move.board.every(Boolean) ? finishBattle(next) : next;
}
export function adventureEnemyMove(run: Adventure): Adventure {
  if (run.phase !== "battle" || run.battle?.current !== 1) return run;
  const battle = run.battle;
  const move = chooseMove(battle.board, battle.hands[1], battle.hands[0], 1);
  return playAdventureCard(run, move.index, move.cardIndex, move.targets);
}
export function claimAdventureReward(
  run: Adventure,
  id: string | null,
): Adventure {
  if (run.phase !== "reward") throw new Error("No reward is waiting.");
  if (run.relicOffers?.length)
    throw new Error("Choose or skip your relic reward first.");
  const stone = id ? run.rewards.find((stone) => stone.id === id) : null;
  if (id && !stone) throw new Error("Choose one of the offered stones.");
  const next = {
    ...run,
    inventory: stone ? [...run.inventory, stone] : run.inventory,
    message: stone
      ? `${stone.name} joins your pack. Swap it into your expedition deck before the next battle.`
      : run.message,
  };
  if (stone && (run.rewardPicksRemaining ?? 1) > 1) {
    return {
      ...next,
      rewards: run.rewards.filter((card) => card.id !== id),
      rewardPicksRemaining: (run.rewardPicksRemaining ?? 1) - 1,
    };
  }
  if (run.node?.kind === "boss")
    return {
      ...next,
      phase: "map",
      battle: undefined,
      node: undefined,
      message: "Prepare your deck and try the Warden again.",
    };
  return advance(next);
}
export function dizzyEventCard(run: Adventure): Stone {
  return {
    id: `custom-run-${run.seed}-dizzy-prize-${run.floor}`,
    name: "Whirling Idol",
    element: "magic",
    creature: "golem",
    edges: [4, 4, 4, 0],
    keywords: [{ type: "dizzy" }],
    description: "Twelve pips, never quite where you left them.",
    custom: true,
  };
}
export function adventureInscriptionOffers(
  run: Pick<Adventure, "seed" | "floor">,
): StoneKeyword[] {
  const offers: StoneKeyword[] = [];
  for (let i = 0; i < 3; i++) {
    offers.push(
      rollWorkshopOffer(
        { ...run, seed: run.seed ^ 0x72756e65 },
        i,
        offers.map((keyword) => keyword.type),
      ).keyword,
    );
  }
  return offers;
}
export function adventureFusionPreview(base: Stone, donor: Stone): Stone {
  if (base.id === donor.id)
    throw new Error("Choose two different stones to combine.");
  const edges = base.edges.map((edge, side) =>
    Math.min(5, Math.max(edge, donor.edges[side])),
  ) as Edges;
  // Combine the stronger edges, sharing any reductions across the highest
  // edges until the printed total fits. The UI previews this exact result.
  let total = edges.reduce((a, b) => a + b, 0);
  while (total > 12) {
    edges[edges.indexOf(Math.max(...edges))]--;
    total--;
  }
  const keywords: StoneKeyword[] = (base.keywords || []).map((keyword) => ({
    ...keyword,
  }));
  for (const keyword of donor.keywords || []) {
    const existing = keywords.findIndex(
      (candidate) => keywordKey(candidate) === keywordKey(keyword),
    );
    if (existing === -1) keywords.push({ ...keyword });
    else if (keyword.type === "sunder") {
      const current = keywords[existing];
      if (
        current.type === "sunder" &&
        (keyword.amount ?? 1) > (current.amount ?? 1)
      )
        keywords[existing] = { ...keyword };
    }
  }
  return {
    ...base,
    name: `Fused ${base.name.replace(/^Fused /, "")}`.slice(0, 24),
    edges,
    keywords,
    description: `Forged from ${base.name} and ${donor.name}.`.slice(0, 120),
  };
}
export function resolveAdventureEvent(
  run: Adventure,
  choice: string,
  cardId?: string,
  secondCardId?: string,
): Adventure {
  if (run.phase !== "event" || !run.node)
    throw new Error("There is no event to resolve.");
  if (run.node.id === "rune-shrine" && /^inscribe:[0-2]$/.test(choice)) {
    const stone = run.inventory.find((card) => card.id === cardId);
    if (!stone) throw new Error("Choose a stone in your pack.");
    const keyword = adventureInscriptionOffers(run)[Number(choice.slice(-1))];
    const keywords = [...(stone.keywords || []), keyword];
    if (!validateKeywords(keywords))
      throw new Error(
        "That stone already has this inscription. Choose a different stone or keyword.",
      );
    return advance({
      ...run,
      inventory: run.inventory.map((card) =>
        card.id === stone.id ? { ...stone, keywords } : card,
      ),
      message: `${stone.name} gains ${KEYWORD_RULES[keyword.type].name} for free.`,
    });
  }
  if (run.node.id === "fusion-forge" && choice === "combine") {
    if (run.inventory.length <= handSize(run.size))
      throw new Error(
        "Keep enough stones for a full battle hand. You need a reserve stone to combine cards.",
      );
    const base = run.inventory.find((card) => card.id === cardId);
    const donor = run.inventory.find((card) => card.id === secondCardId);
    if (!base || !donor) throw new Error("Choose two stones in your pack.");
    const combined = adventureFusionPreview(base, donor);
    const inventory = run.inventory
      .filter((card) => card.id !== donor.id)
      .map((card) => (card.id === base.id ? combined : card));
    // Preserve deck order and replace a consumed selected card with the fused
    // stone. If both inputs were selected, fill the remaining slot from reserves.
    const deck = [
      ...new Set(run.deck.map((id) => (id === donor.id ? base.id : id))),
    ];
    for (const card of inventory) {
      if (deck.length >= run.deck.length) break;
      if (!deck.includes(card.id)) deck.push(card.id);
    }
    return advance({
      ...run,
      inventory,
      deck,
      message: `${base.name} and ${donor.name} combine into ${combined.name}. Your selected deck has been updated.`,
    });
  }
  if (run.node.id === "whirling-idol" && choice === "dizzy-card") {
    const stone = dizzyEventCard(run);
    return advance({
      ...run,
      inventory: [...run.inventory, stone],
      message:
        "Whirling Idol joins your pack: 12 pips and Dizzy. Edit your expedition deck to take it into battle.",
    });
  }
  if (run.node.kind === "chest") {
    if (choice === "fight") return beginBattle(run, run.node);
    if (choice === "leave")
      return advance({ ...run, message: "You leave the chest undisturbed." });
  }
  if (run.node.id === "well") {
    if (choice === "heal")
      return advance({
        ...run,
        lives: Math.min(maxLives(run), run.lives + 1),
        message: "The well restores one life.",
      });
    if (choice === "gold" && run.lives > 1)
      return advance({
        ...run,
        lives: run.lives - 1,
        gold: run.gold + earnedGold(run, 40),
        message: `One life traded for ${earnedGold(run, 40)} gold.`,
      });
  }
  if (run.node.id === "alchemy" && Object.hasOwn(POTIONS, choice)) {
    if (run.potions.length >= potionCapacity(run))
      throw new Error(
        "Your potion belt is full. Use a potion first, or leave.",
      );
    return advance({
      ...run,
      potions: receiveFreePotions(run, [choice as Potion]),
      message: `You receive ${hasRelic(run, "bubbling-flask") ? "up to two copies" : "a bottle"} of ${POTIONS[choice as Potion].name}.`,
    });
  }
  if (run.node.kind === "camp") {
    if (choice === "heal")
      return advance({
        ...run,
        lives: Math.min(maxLives(run), run.lives + 1),
        message: "A warm fire restores one life.",
      });
    if (choice === "train") {
      const stone = run.inventory.find((stone) => stone.id === cardId);
      if (!stone || stone.edges.reduce((a, b) => a + b, 0) >= 12)
        throw new Error("Choose a stone with room for another pip.");
      const side = stone.edges.indexOf(Math.min(...stone.edges)) as Side;
      const edges = [...stone.edges] as Edges;
      edges[side]++;
      return advance({
        ...run,
        inventory: run.inventory.map((s) =>
          s.id === cardId ? { ...s, edges } : s,
        ),
        message: `${stone.name} gains a permanent pip.`,
      });
    }
  }
  if (choice === "leave") return advance(run);
  throw new Error("Choose an available event option.");
}
export const SERVICE_PRICES = { pip: 25, element: 20, keyword: 35 };
export interface WorkshopOffer {
  pipSide: Side;
  keyword: StoneKeyword;
}
function rollWorkshopOffer(
  run: Pick<Adventure, "seed" | "floor">,
  reroll = 0,
  excluded: KeywordType[] = [],
): WorkshopOffer {
  const rng = random(
    Math.imul(run.seed ^ 0xa511e9b3, 0x9e3779b1) ^
      Math.imul(run.floor + 1, 0x85ebca6b) ^
      Math.imul(reroll, 0x27d4eb2d),
  );
  const pipSide = Math.floor(rng() * 4) as Side;
  const types = (Object.keys(KEYWORD_RULES) as KeywordType[]).filter(
    (type) => !excluded.includes(type),
  );
  const type = types[Math.floor(rng() * types.length)];
  const side = Math.floor(rng() * 4) as Side;
  const elements = Object.keys(ELEMENTS) as Element[];
  const keyword: StoneKeyword =
    type === "silence" || type === "dizzy"
      ? { type }
      : type === "resonance"
        ? { type, side, element: elements[Math.floor(rng() * elements.length)] }
        : type === "sunder"
          ? { type, side, amount: 1 + Math.floor(run.floor / 4) }
          : { type, side };
  return { pipSide, keyword };
}
export function adventureWorkshopOffer(
  run: Pick<Adventure, "seed" | "floor"> &
    Partial<Pick<Adventure, "shopOffer" | "shopRerolls">>,
): WorkshopOffer {
  // Keep a purchased shop roll stable through purchases and reloads. Older
  // saves retain the same initial offer they saw before rerolls existed.
  return run.shopOffer || rollWorkshopOffer(run, run.shopRerolls || 0);
}
function shopStock(run: Adventure, reroll: number) {
  const stockRun = {
    ...run,
    seed: (run.seed ^ Math.imul(reroll, 0x27d4eb2d)) >>> 0,
  };
  const relicOptions = offerRelics(
    run,
    2,
    0x73686f70 ^ Math.imul(reroll, 0x85ebca6b),
  );
  return {
    shopCards: rewardCards(
      stockRun,
      false,
      hasRelic(run, "market-map") ? 4 : 3,
    ).map((stone, i) => ({
      ...stone,
      id:
        reroll === 0
          ? `custom-run-${run.seed}-shop-${run.floor}-${i}`
          : `custom-run-${run.seed}-shop-${run.floor}-roll-${reroll}-${i}`,
    })),
    shopPotions: (["power", "hex", "heal"] as Potion[]).map((type) => ({
      id:
        reroll === 0
          ? `${run.floor}-${type}`
          : `${run.floor}-roll-${reroll}-${type}`,
      type,
    })),
    shopRelic:
      (reroll > 0
        ? relicOptions.find((id) => id !== run.shopRelic)
        : relicOptions[0]) ||
      relicOptions[0] ||
      null,
  };
}
export const SHOP_REROLL_PRICE = 20;
export function adventureShopRerollPrice(run: Adventure): number {
  return hasRelic(run, "merchants-die") && !run.shopFreeRerollUsed
    ? 0
    : shopPrice(run, SHOP_REROLL_PRICE);
}
export function rerollAdventureShop(run: Adventure): Adventure {
  if (run.phase !== "shop")
    throw new Error("Visit a shop before rerolling its stock.");
  const price = adventureShopRerollPrice(run);
  if (run.gold < price)
    throw new Error("You need more gold to reroll this shop.");
  const rerolls = (run.shopRerolls || 0) + 1;
  if (!Number.isSafeInteger(rerolls))
    throw new Error("This shop cannot be rerolled again.");
  const offer = rollWorkshopOffer(run, rerolls, [
    adventureWorkshopOffer(run).keyword.type,
  ]);
  return {
    ...run,
    ...shopStock(run, rerolls),
    gold: run.gold - price,
    shopRerolls: rerolls,
    shopFreeRerollUsed: run.shopFreeRerollUsed || price === 0,
    shopOffer: offer,
    lastShopKeyword: offer.keyword.type,
    message: `Shop refreshed${price === 0 ? " for free with Merchant’s Die" : ` for ${price} gold`}. New cards, relic, and workshop offers; potions restocked.`,
  };
}
export type WorkshopOrder =
  | { type: "pip"; cardId: string }
  | { type: "element"; cardId: string; element: Element }
  | { type: "keyword"; cardId: string };
export function buyAdventureService(
  run: Adventure,
  order: WorkshopOrder,
): Adventure {
  if (run.phase !== "shop") throw new Error("Visit a shop first.");
  const price = shopPrice(run, SERVICE_PRICES[order.type]);
  if (run.gold < price) throw new Error("You need more gold.");
  const stone = run.inventory.find((s) => s.id === order.cardId);
  if (!stone) throw new Error("Choose a stone in your pack.");
  const offer = adventureWorkshopOffer(run);
  let upgraded: Stone;
  if (order.type === "pip") {
    if (
      stone.edges[offer.pipSide] >= 5 ||
      stone.edges.reduce((a, b) => a + b, 0) >= 12
    )
      throw new Error(
        "That upgrade would exceed five pips on an edge or the 12-pip budget.",
      );
    const edges = [...stone.edges] as Edges;
    edges[offer.pipSide] += Math.min(
      hasRelic(run, "whetstone-ring") ? 2 : 1,
      5 - edges[offer.pipSide],
      12 - edges.reduce((a, b) => a + b, 0),
    );
    upgraded = { ...stone, edges };
  } else if (order.type === "element") {
    if (
      !Object.hasOwn(ELEMENTS, order.element) ||
      order.element === stone.element
    )
      throw new Error("Choose a different element.");
    const edges = [...stone.edges] as Edges;
    if (
      hasRelic(run, "elemental-prism") &&
      edges.reduce((a, b) => a + b, 0) < 12
    )
      edges[edges.indexOf(Math.min(...edges))]++;
    upgraded = { ...stone, edges, element: order.element };
  } else {
    const keywords = [...(stone.keywords || []), offer.keyword];
    if (!validateKeywords(keywords))
      throw new Error(
        "That keyword is already assigned here, or its settings are invalid.",
      );
    if (
      hasRelic(run, "rune-echo") &&
      "side" in offer.keyword &&
      offer.keyword.side !== "any"
    ) {
      const echo = {
        ...offer.keyword,
        side: ((offer.keyword.side + 2) % 4) as Side,
      };
      if (validateKeywords([...keywords, echo])) keywords.push(echo);
    }
    upgraded = { ...stone, keywords };
  }
  return {
    ...run,
    gold: run.gold - price,
    inventory: run.inventory.map((s) => (s.id === stone.id ? upgraded : s)),
    message: `${stone.name} upgraded for ${price} gold.`,
  };
}
export function cardPrice(stone: Stone, run?: Adventure): number {
  return shopPrice(run || {}, 20 + stone.edges.reduce((a, b) => a + b, 0) * 3);
}
export function buyAdventureCard(run: Adventure, id: string): Adventure {
  if (run.phase !== "shop") throw new Error("Visit a shop first.");
  const stone = run.shopCards.find((s) => s.id === id);
  if (!stone) throw new Error("That card has already sold.");
  const price = cardPrice(stone, run);
  if (run.gold < price) throw new Error("You need more gold.");
  return {
    ...run,
    gold: run.gold - price,
    inventory: [...run.inventory, stone],
    shopCards: run.shopCards.filter((s) => s.id !== id),
    message: `${stone.name} joins your pack. Edit your expedition deck to bring it into battle.`,
  };
}
export function buyAdventurePotion(run: Adventure, id: string): Adventure {
  if (run.phase !== "shop") throw new Error("Visit a shop first.");
  const item = run.shopPotions.find((p) => p.id === id);
  if (!item) throw new Error("That potion has already sold.");
  if (run.potions.length >= potionCapacity(run))
    throw new Error("Your potion belt is full.");
  const price = shopPrice(run, POTIONS[item.type].price);
  if (run.gold < price) throw new Error("You need more gold.");
  return {
    ...run,
    gold: run.gold - price,
    potions: [...run.potions, item.type],
    shopPotions: run.shopPotions.filter((p) => p.id !== id),
    message: `Bought ${POTIONS[item.type].name}.`,
  };
}
export function leaveAdventureShop(run: Adventure): Adventure {
  if (run.phase !== "shop") throw new Error("You are not at a shop.");
  const interest = hasRelic(run, "rainy-day-bank")
    ? Math.min(30, Math.floor(run.gold / 10))
    : 0;
  return advance({
    ...run,
    lastShopKeyword: adventureWorkshopOffer(run).keyword.type,
    gold: run.gold + interest,
    message: interest ? `Rainy Day Bank pays ${interest} gold.` : run.message,
  });
}
export function useAdventurePotion(
  run: Adventure,
  index: number,
  target?: string | number,
): Adventure {
  const potion = run.potions[index];
  if (!potion) throw new Error("Choose a potion in your belt.");
  if (
    run.phase === "ended" ||
    (run.phase === "battle" && run.battle?.current !== 0)
  )
    throw new Error("Wait until your turn.");
  let next: Adventure = run;
  const strength = potionPotency(run);
  if (potion === "heal") {
    if (run.lives >= maxLives(run))
      throw new Error("You are already at full life.");
    next = { ...run, lives: Math.min(maxLives(run), run.lives + strength) };
  } else {
    if (run.phase !== "battle" || !run.battle)
      throw new Error("Use that potion during a battle.");
    const battle = run.battle;
    if (potion === "power") {
      const stone = battle.hands[0].find((s) => s.id === target);
      if (!stone) throw new Error("Choose a card in your hand.");
      const hands: [Stone[], Stone[]] = [
        battle.hands[0].map((s) =>
          s.id === target
            ? { ...s, edges: s.edges.map((edge) => edge + strength) as Edges }
            : s,
        ),
        battle.hands[1],
      ];
      next = { ...run, battle: { ...battle, hands } };
    } else {
      const at = Number(target),
        cell = battle.board[at];
      if (
        typeof target !== "number" ||
        !cell ||
        cell.owner !== 1 ||
        (cell.edges || cell.stone.edges).every((edge) => edge === 0)
      )
        throw new Error("Choose an enemy card with at least one pip.");
      const edges = (cell.edges || cell.stone.edges).map((edge) =>
        Math.max(0, edge - strength),
      ) as Edges;
      const reductions = (cell.reductions || [0, 0, 0, 0]).map(
        (amount, side) =>
          amount + (cell.edges || cell.stone.edges)[side] - edges[side],
      ) as Edges;
      next = {
        ...run,
        battle: {
          ...battle,
          board: battle.board.map((value, spot) =>
            spot === at ? { ...cell, edges, reductions } : value,
          ),
        },
      };
    }
  }
  const saved =
    run.phase === "battle" &&
    !!run.battle &&
    hasRelic(run, "bottomless-bottle") &&
    !run.battle.potionSaved;
  return {
    ...next,
    ...(saved && next.battle
      ? { battle: { ...next.battle, potionSaved: true } }
      : {}),
    potions: saved ? run.potions : run.potions.filter((_, i) => i !== index),
    message: `Used ${POTIONS[potion].name}.${saved ? " Bottomless Bottle keeps this potion." : ""}`,
  };
}
function validBattleCard(value: unknown): value is Stone {
  if (!value || typeof value !== "object") return false;
  const stone = value as Stone;
  return (
    typeof stone.name === "string" &&
    typeof stone.id === "string" &&
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
    ].includes(stone.creature) &&
    Object.hasOwn(ELEMENTS, stone.element) &&
    Array.isArray(stone.edges) &&
    stone.edges.length === 4 &&
    stone.edges.every((n) => Number.isInteger(n) && n >= 0 && n <= 20) &&
    validateKeywords(stone.keywords || [])
  );
}
function validPlaced(value: unknown, length: number): boolean {
  if (value === null) return true;
  if (!value || typeof value !== "object") return false;
  const cell = value as NonNullable<Board[number]>;
  const edges = (input: unknown) =>
    Array.isArray(input) &&
    input.length === 4 &&
    input.every((n) => Number.isInteger(n) && n >= 0 && n <= 99);
  return (
    [0, 1].includes(cell.owner) &&
    validBattleCard(cell.stone) &&
    (cell.edges === undefined || edges(cell.edges)) &&
    (cell.dizzy === undefined ||
      (!!cell.dizzy &&
        edges(cell.dizzy.before) &&
        edges(cell.dizzy.after) &&
        cell.dizzy.after.every((n) => n <= 4) &&
        cell.dizzy.after.reduce((a, b) => a + b, 0) ===
          Math.min(
            16,
            cell.dizzy.before.reduce((a, b) => a + b, 0),
          ))) &&
    (cell.reductions === undefined || edges(cell.reductions)) &&
    (cell.silenced === undefined || typeof cell.silenced === "boolean") &&
    (cell.playedBy === undefined || [0, 1].includes(cell.playedBy)) &&
    (cell.activeKeywords === undefined ||
      (Array.isArray(cell.activeKeywords) &&
        cell.activeKeywords.every(
          (keyword) =>
            keyword &&
            ["head-start", "comeback", "resonance"].includes(keyword.type) &&
            (keyword.type !== "resonance" ||
              (Number.isInteger(keyword.bonus) &&
                keyword.bonus > 0 &&
                keyword.bonus <= 99)),
        ) &&
        validateKeywords(cell.activeKeywords))) &&
    (cell.effects === undefined ||
      (Array.isArray(cell.effects) &&
        cell.effects.every(
          (effect) =>
            effect &&
            ["sunder", "silence"].includes(effect.type) &&
            Number.isInteger(effect.target) &&
            effect.target >= 0 &&
            effect.target < length &&
            (effect.type !== "sunder" ||
              (Number.isInteger(effect.side) &&
                effect.side >= 0 &&
                effect.side < 4 &&
                (effect.amount === undefined ||
                  (Number.isInteger(effect.amount) &&
                    effect.amount > 0 &&
                    effect.amount <= 99)))),
        )))
  );
}
export function validateAdventure(value: unknown): value is Adventure {
  if (!value || typeof value !== "object") return false;
  const run = value as Adventure;
  if (
    run.shopRerolls !== undefined &&
    (!Number.isSafeInteger(run.shopRerolls) || run.shopRerolls < 0)
  )
    return false;
  if (
    run.shopFreeRerollUsed !== undefined &&
    typeof run.shopFreeRerollUsed !== "boolean"
  )
    return false;
  if (
    run.lastShopKeyword !== undefined &&
    !Object.hasOwn(KEYWORD_RULES, run.lastShopKeyword)
  )
    return false;
  if (
    run.shopOffer !== undefined &&
    (!run.shopOffer ||
      typeof run.shopOffer !== "object" ||
      !Number.isInteger(run.shopOffer.pipSide) ||
      run.shopOffer.pipSide < 0 ||
      run.shopOffer.pipSide > 3 ||
      !validateKeywords([run.shopOffer.keyword]))
  )
    return false;
  if (
    run.relics !== undefined &&
    (!Array.isArray(run.relics) ||
      run.relics.length > RELIC_IDS.length ||
      new Set(run.relics).size !== run.relics.length ||
      !run.relics.every((id) => Object.hasOwn(RELICS, id)))
  )
    return false;
  if (
    run.spentRelics !== undefined &&
    (!Array.isArray(run.spentRelics) ||
      new Set(run.spentRelics).size !== run.spentRelics.length ||
      !run.spentRelics.every(
        (id) => id === "phoenix-feather" && hasRelic(run, id),
      ))
  )
    return false;
  if (
    run.relicOffers !== undefined &&
    (!Array.isArray(run.relicOffers) ||
      run.relicOffers.length > 3 ||
      new Set(run.relicOffers).size !== run.relicOffers.length ||
      !run.relicOffers.every(
        (id) => Object.hasOwn(RELICS, id) && !hasRelic(run, id),
      ))
  )
    return false;
  if (
    run.shopRelic !== undefined &&
    run.shopRelic !== null &&
    (!Object.hasOwn(RELICS, run.shopRelic) || hasRelic(run, run.shopRelic))
  )
    return false;
  if (
    run.rewardPicksRemaining !== undefined &&
    (!Number.isInteger(run.rewardPicksRemaining) ||
      run.rewardPicksRemaining < 0 ||
      run.rewardPicksRemaining > 2)
  )
    return false;
  if (
    run.version !== 1 ||
    !Number.isInteger(run.seed) ||
    ![3, 4].includes(run.size) ||
    !Number.isInteger(run.floor) ||
    run.floor < 0 ||
    run.floor >= ROUTE.length ||
    !["map", "battle", "event", "shop", "reward", "ended"].includes(
      run.phase,
    ) ||
    !Number.isInteger(run.gold) ||
    run.gold < 0 ||
    !Number.isInteger(run.lives) ||
    run.lives < 0 ||
    run.lives > maxLives(run) ||
    typeof run.victory !== "boolean" ||
    typeof run.message !== "string"
  )
    return false;
  if (
    !Array.isArray(run.inventory) ||
    run.inventory.length < handSize(run.size) ||
    run.inventory.length > 100 ||
    !run.inventory.every(validateStone) ||
    new Set(run.inventory.map((s) => s.id)).size !== run.inventory.length ||
    !Array.isArray(run.deck) ||
    run.deck.length > handSize(run.size) ||
    new Set(run.deck).size !== run.deck.length ||
    !run.deck.every((id) => run.inventory.some((s) => s.id === id))
  )
    return false;
  if (
    !Array.isArray(run.potions) ||
    run.potions.length > potionCapacity(run) ||
    !run.potions.every((p) => Object.hasOwn(POTIONS, p)) ||
    !Array.isArray(run.rewards) ||
    run.rewards.length > 5 ||
    !run.rewards.every(validateStone) ||
    !Array.isArray(run.shopCards) ||
    run.shopCards.length > 4 ||
    !run.shopCards.every(validateStone) ||
    !Array.isArray(run.shopPotions) ||
    run.shopPotions.length > 3 ||
    !run.shopPotions.every(
      (p) => p && typeof p.id === "string" && Object.hasOwn(POTIONS, p.type),
    )
  )
    return false;
  if (
    ["battle", "event", "shop", "reward"].includes(run.phase) &&
    (!run.node ||
      !ROUTE[run.floor].some(
        (node) => node.id === run.node!.id && node.kind === run.node!.kind,
      ))
  )
    return false;
  if (run.battle) {
    const battle = run.battle;
    if (
      !Array.isArray(battle.board) ||
      battle.board.length !== run.size ** 2 ||
      !battle.board.every((cell) => validPlaced(cell, run.size ** 2)) ||
      !Array.isArray(battle.hands) ||
      battle.hands.length !== 2 ||
      !battle.hands.every(
        (hand) =>
          Array.isArray(hand) &&
          hand.length <= handSize(run.size) &&
          hand.every(validBattleCard),
      ) ||
      ![0, 1].includes(battle.current) ||
      !Number.isInteger(battle.turns) ||
      battle.turns < 0 ||
      battle.turns > run.size ** 2 ||
      (battle.vanguardUsed !== undefined &&
        typeof battle.vanguardUsed !== "boolean") ||
      (battle.captures !== undefined &&
        (!Number.isInteger(battle.captures) ||
          battle.captures < 0 ||
          battle.captures > 64)) ||
      (battle.potionSaved !== undefined &&
        typeof battle.potionSaved !== "boolean") ||
      (battle.bracerUsed !== undefined &&
        typeof battle.bracerUsed !== "boolean") ||
      typeof battle.name !== "string" ||
      !Array.isArray(battle.log) ||
      !battle.log.every((line) => typeof line === "string") ||
      !Array.isArray(battle.lastCaptured) ||
      !battle.lastCaptured.every(
        (at) => Number.isInteger(at) && at >= 0 && at < run.size ** 2,
      ) ||
      (battle.objective !== undefined &&
        (!Number.isInteger(battle.objective) ||
          battle.objective < 0 ||
          battle.objective >= run.size ** 2))
    )
      return false;
  }
  if (
    run.phase === "battle" &&
    (!run.battle ||
      run.battle.board.every(Boolean) ||
      !run.battle!.hands[run.battle!.current].length)
  )
    return false;
  return run.phase !== "battle" || !!run.battle;
}
export function restoreAdventure(value: unknown): Adventure | null {
  if (!validateAdventure(value)) return null;
  let run = value;
  if (run.phase === "shop" && run.shopRelic === undefined)
    run = { ...run, shopRelic: offerRelics(run, 1, 0x73686f70)[0] || null };
  // Update an untouched boss setup from older downloads, preserving any fight
  // in which the player has already made a move.
  if (
    run.phase === "battle" &&
    run.node?.kind === "boss" &&
    run.battle?.turns === 0 &&
    run.battle.board.some((cell) => cell?.stone.id === "custom-run-crown-guard")
  )
    run = {
      ...run,
      battle: {
        ...run.battle,
        board: run.battle.board.map((cell) =>
          cell?.stone.id === "custom-run-crown-guard" ? null : cell,
        ),
      },
    };
  return run;
}
