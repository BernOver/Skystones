import {
  ELEMENTS,
  EMPTY_BOARD,
  STARTER_STONES,
  chooseMove,
  coordinate,
  handSize,
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
  Owner,
  Side,
  Stone,
  StoneKeyword,
} from "./game.ts";

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
        "Two guards start on the board. Take the central throne AND win the score to finish the run.",
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
      "Recover one life, up to three. Can be used between battles too.",
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
    keywordTier > 0 && rng() < 0.55
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
export function rewardCards(run: Adventure): Stone[] {
  return Array.from({ length: 3 }, (_, i) =>
    makeRunCard(
      run.seed + run.floor * 101 + i * 17,
      Math.min(12, 4 + run.floor),
      `${run.seed}-reward-${run.floor}-${i}`,
      run.floor,
    ),
  );
}
export function newAdventure(
  size: BoardSize,
  seed = Math.floor(Math.random() * 2 ** 30),
): Adventure {
  const inventory = Array.from({ length: handSize(size) + 2 }, (_, i) =>
    makeRunCard(seed + i * 53, i % 3 === 0 ? 3 : 2, `${seed}-start-${i}`),
  );
  // Starting cards spread their tiny budgets, keeping almost every edge at zero or one.
  inventory.forEach((stone, i) => {
    const edges: Edges = [0, 0, 0, 0];
    for (let n = 0; n < (i % 3 === 0 ? 3 : 2); n++) edges[(i + n) % 4] = 1;
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
    message: "A small deck. A long road. Choose your first encounter.",
    victory: false,
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
    if (node.kind === "boss") {
      const guard: Stone = {
        ...stone,
        id: "custom-run-crown-guard",
        name: "Crown Sentinel",
        creature: "golem",
        edges: [1, 0, 2, 0],
        description: "A sentinel placed before the first turn.",
      };
      const at = run.size === 3 ? 0 : 10;
      board[at] = {
        stone: guard,
        owner: 1,
        playedBy: 1,
        edges: [...guard.edges],
        activeKeywords: [],
      };
    }
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
        ? "The Warden starts with two guards. Win the score AND hold the throne."
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
  if (node.kind === "shop")
    return {
      ...run,
      node,
      phase: "shop",
      shopCards: rewardCards(run).map((stone, i) => ({
        ...stone,
        id: `custom-run-${run.seed}-shop-${run.floor}-${i}`,
      })),
      shopPotions: [
        { id: `${run.floor}-power`, type: "power" },
        { id: `${run.floor}-hex`, type: "hex" },
        { id: `${run.floor}-heal`, type: "heal" },
      ],
      message: "Improve your stones, stock up, or save your gold for later.",
    };
  return { ...run, node, phase: "event", message: node.description };
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
  const chest = battle.objectiveKind === "chest" && held ? 45 : 0;
  const earned =
    (won
      ? 25 + run.floor * 5 + (run.node?.kind === "elite" ? 20 : 0)
      : draw
        ? 10
        : 0) + chest;
  const lives = run.lives - (won || draw ? 0 : 1),
    victory = throne && won;
  const message = `${won ? "Victory" : draw ? "A draw" : "Battle lost"} · ${you}–${enemy}. +${earned} gold.${chest ? " Chest secured: +45 bonus gold included." : battle.objectiveKind === "chest" ? " The chest stayed with the keeper." : ""}${throne && !held ? " You did not secure the throne." : ""}${!won && !draw ? " One life lost." : ""}`;
  const potions = [...run.potions];
  if (won && run.floor % 3 === 0 && potions.length < 3)
    potions.push(run.floor % 2 === 0 ? "hex" : "power");
  const updated = {
    ...run,
    gold: run.gold + earned,
    lives,
    message,
    victory,
    potions,
  };
  return {
    ...updated,
    phase: victory || lives === 0 ? "ended" : "reward",
    rewards: won && !throne ? rewardCards(run) : [],
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
    stone = battle.hands[battle.current][cardIndex];
  if (!stone) throw new Error("Choose a card in the current hand.");
  const move = placeStone(battle.board, index, stone, battle.current, targets),
    hands: [Stone[], Stone[]] = [[...battle.hands[0]], [...battle.hands[1]]];
  hands[battle.current].splice(cardIndex, 1);
  const next = {
    ...run,
    battle: {
      ...battle,
      board: move.board,
      hands,
      current: (battle.current === 0 ? 1 : 0) as Owner,
      turns: battle.turns + 1,
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
  const stone = id ? run.rewards.find((stone) => stone.id === id) : null;
  if (id && !stone) throw new Error("Choose one of the offered stones.");
  const next = {
    ...run,
    inventory: stone ? [...run.inventory, stone] : run.inventory,
    message: stone
      ? `${stone.name} joins your pack. Swap it into your expedition deck before the next battle.`
      : run.message,
  };
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
export function resolveAdventureEvent(
  run: Adventure,
  choice: string,
  cardId?: string,
): Adventure {
  if (run.phase !== "event" || !run.node)
    throw new Error("There is no event to resolve.");
  if (run.node.kind === "chest") {
    if (choice === "fight") return beginBattle(run, run.node);
    if (choice === "leave")
      return advance({ ...run, message: "You leave the chest undisturbed." });
  }
  if (run.node.id === "well") {
    if (choice === "heal")
      return advance({
        ...run,
        lives: Math.min(3, run.lives + 1),
        message: "The well restores one life.",
      });
    if (choice === "gold" && run.lives > 1)
      return advance({
        ...run,
        lives: run.lives - 1,
        gold: run.gold + 40,
        message: "One life traded for 40 gold.",
      });
  }
  if (run.node.id === "alchemy" && Object.hasOwn(POTIONS, choice)) {
    if (run.potions.length >= 3)
      throw new Error(
        "Your potion belt is full. Use a potion first, or leave.",
      );
    return advance({
      ...run,
      potions: [...run.potions, choice as Potion],
      message: `You receive a ${POTIONS[choice as Potion].name}.`,
    });
  }
  if (run.node.kind === "camp") {
    if (choice === "heal")
      return advance({
        ...run,
        lives: Math.min(3, run.lives + 1),
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
export function adventureWorkshopOffer(
  run: Pick<Adventure, "seed" | "floor">,
): { pipSide: Side; keyword: StoneKeyword } {
  // Deriving offers from the run seed and stop keeps existing saves compatible
  // and prevents purchases, card selection, or reloads from rerolling a shop.
  const rng = random(
    Math.imul(run.seed ^ 0xa511e9b3, 0x9e3779b1) ^
      Math.imul(run.floor + 1, 0x85ebca6b),
  );
  const pipSide = Math.floor(rng() * 4) as Side;
  const types = [
    "head-start",
    "comeback",
    "resonance",
    "sunder",
    "silence",
  ] as const;
  const type = types[Math.floor(rng() * types.length)];
  const side = Math.floor(rng() * 4) as Side;
  const elements = Object.keys(ELEMENTS) as Element[];
  const keyword: StoneKeyword =
    type === "silence"
      ? { type }
      : type === "resonance"
        ? { type, side, element: elements[Math.floor(rng() * elements.length)] }
        : type === "sunder"
          ? { type, side, amount: 1 + Math.floor(run.floor / 4) }
          : { type, side };
  return { pipSide, keyword };
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
  const price = SERVICE_PRICES[order.type];
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
    edges[offer.pipSide]++;
    upgraded = { ...stone, edges };
  } else if (order.type === "element") {
    if (
      !Object.hasOwn(ELEMENTS, order.element) ||
      order.element === stone.element
    )
      throw new Error("Choose a different element.");
    upgraded = { ...stone, element: order.element };
  } else {
    const keywords = [...(stone.keywords || []), offer.keyword];
    if (!validateKeywords(keywords))
      throw new Error(
        "That keyword is already assigned here, or its settings are invalid.",
      );
    upgraded = { ...stone, keywords };
  }
  return {
    ...run,
    gold: run.gold - price,
    inventory: run.inventory.map((s) => (s.id === stone.id ? upgraded : s)),
    message: `${stone.name} upgraded for ${price} gold.`,
  };
}
export function cardPrice(stone: Stone): number {
  return 20 + stone.edges.reduce((a, b) => a + b, 0) * 3;
}
export function buyAdventureCard(run: Adventure, id: string): Adventure {
  if (run.phase !== "shop") throw new Error("Visit a shop first.");
  const stone = run.shopCards.find((s) => s.id === id);
  if (!stone) throw new Error("That card has already sold.");
  const price = cardPrice(stone);
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
  if (run.potions.length >= 3) throw new Error("Your potion belt is full.");
  const price = POTIONS[item.type].price;
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
  return advance(run);
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
  if (potion === "heal") {
    if (run.lives >= 3) throw new Error("You are already at full life.");
    next = { ...run, lives: Math.min(3, run.lives + 1) };
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
            ? { ...s, edges: s.edges.map((edge) => edge + 1) as Edges }
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
        Math.max(0, edge - 1),
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
  return {
    ...next,
    potions: run.potions.filter((_, i) => i !== index),
    message: `Used ${POTIONS[potion].name}.`,
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
    run.lives > 3 ||
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
    run.potions.length > 3 ||
    !run.potions.every((p) => Object.hasOwn(POTIONS, p)) ||
    !Array.isArray(run.rewards) ||
    run.rewards.length > 3 ||
    !run.rewards.every(validateStone) ||
    !Array.isArray(run.shopCards) ||
    run.shopCards.length > 3 ||
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
    (run.battle!.board.every(Boolean) ||
      !run.battle!.hands[run.battle!.current].length)
  )
    return false;
  return run.phase !== "battle" || !!run.battle;
}
