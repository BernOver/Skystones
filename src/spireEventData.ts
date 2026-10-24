export const SPIRE_EVENTS = [
  {
    id: "big-fish",
    sourceId: "Big Fish",
    sourceName: "Big Fish",
    act: 1,
    text: "A river spirit offers three peculiar gifts.",
    choices: [
      {
        label: "Eat the fruit · heal 1 life",
        heal: 1,
      },
      {
        label: "Keep the seed · maximum lives +1",
        maxLife: 1,
        heal: 1,
      },
      {
        label: "Open the box · relic and Regret",
        relics: 1,
        curse: "Regret",
      },
    ],
  },
  {
    id: "cleric",
    sourceId: "The Cleric",
    sourceName: "The Cleric",
    act: 1,
    text: "A traveling healer accepts coins or unwanted stones.",
    choices: [
      {
        label: "Heal · pay 25 gold",
        cost: 25,
        heal: 2,
      },
      {
        label: "Purify · pay 40 gold",
        cost: 40,
        remove: true,
        select: "card-or-curse",
      },
    ],
  },
  {
    id: "dead-adventurer",
    sourceId: "Dead Adventurer",
    sourceName: "Dead Adventurer",
    act: 1,
    text: "A fallen keeper left treasure beside a restless guardian.",
    choices: [
      {
        label: "Search · find gold, risk an ambush",
        special: "search",
      },
    ],
  },
  {
    id: "golden-idol",
    sourceId: "Golden Idol",
    sourceName: "Golden Idol",
    act: 1,
    text: "Taking the golden idol will wake the room’s defenses.",
    choices: [
      {
        label: "Take the idol · choose an escape",
        stage: 1,
      },
      {
        label: "Escape through the spikes · lose 1 life",
        at: 1,
        life: 1,
        relic: "gilded-compass",
      },
      {
        label: "Carry the curse · gain Injury",
        at: 1,
        curse: "Injury",
        relic: "gilded-compass",
      },
      {
        label: "Squeeze through · maximum lives −1",
        at: 1,
        maxLife: -1,
        relic: "gilded-compass",
      },
    ],
  },
  {
    id: "golden-wing",
    sourceId: "Golden Wing",
    sourceName: "Golden Wing",
    act: 1,
    text: "A winged statue guards a gilded cage and a cleansing pool.",
    choices: [
      {
        label: "Break the cage · gain 70 gold",
        gold: 70,
        needStrong: true,
      },
      {
        label: "Pray · lose 1 life and remove a card or curse",
        life: 1,
        remove: true,
        select: "card-or-curse",
      },
    ],
  },
  {
    id: "living-wall",
    sourceId: "Living Wall",
    sourceName: "Living Wall",
    act: 1,
    text: "Three faces offer three ways to reshape your deck.",
    choices: [
      {
        label: "Forget · remove a card or curse",
        remove: true,
        select: "card-or-curse",
      },
      {
        label: "Change · transform a stone",
        transform: 1,
        select: "card",
      },
      {
        label: "Grow · add 2 pips",
        upgrade: 2,
        select: "card",
      },
    ],
  },
  {
    id: "mushrooms",
    sourceId: "Mushrooms",
    sourceName: "Mushrooms",
    act: 1,
    text: "A mushroom ring offers healing or a keeper’s challenge.",
    choices: [
      {
        label: "Eat · heal fully and gain Doubt",
        heal: 9,
        curse: "Doubt",
      },
      {
        label: "Challenge the spores · win a healing relic",
        battle: "battle",
        winRelic: "campfire-charm",
      },
    ],
  },
  {
    id: "scrap-ooze",
    sourceId: "Scrap Ooze",
    sourceName: "Scrap Ooze",
    act: 1,
    text: "A relic glints beneath a hungry pool of scrap.",
    choices: [
      {
        label: "Reach inside · lose 1 life; chance improves each attempt",
        special: "ooze",
      },
    ],
  },
  {
    id: "shining-light",
    sourceId: "Shining Light",
    sourceName: "Shining Light",
    act: 1,
    text: "A bright arch can temper two stones at a price.",
    choices: [
      {
        label: "Enter · lose 1 life, add 2 pips to two stones",
        life: 1,
        upgrade: 2,
        select: "two-cards",
      },
    ],
  },
  {
    id: "serpent",
    sourceId: "Liars Game",
    sourceName: "The Ssssserpent",
    act: 1,
    text: "A serpent offers a generous purse with a familiar catch.",
    choices: [
      {
        label: "Accept · gain 100 gold and Doubt",
        gold: 100,
        curse: "Doubt",
      },
    ],
  },
  {
    id: "goop",
    sourceId: "World of Goop",
    sourceName: "World of Goop",
    act: 1,
    text: "Coins sparkle beneath a sticky crossing.",
    choices: [
      {
        label: "Gather coins · lose 1 life, gain 65 gold",
        life: 1,
        gold: 65,
      },
      {
        label: "Leave some coins behind · pay 10 gold",
        cost: 10,
      },
    ],
  },
  {
    id: "ancient-writing",
    sourceId: "Back to Basics",
    sourceName: "Ancient Writing",
    act: 2,
    text: "Old runes promise simplicity or stronger foundations.",
    choices: [
      {
        label: "Elegance · remove a card or curse",
        remove: true,
        select: "card-or-curse",
      },
      {
        label: "Simplicity · all plain stones gain 1 pip",
        upgradePlain: 1,
      },
    ],
  },
  {
    id: "augmenter",
    sourceId: "Drug Dealer",
    sourceName: "Augmenter",
    act: 2,
    text: "A stone scientist offers three experimental treatments.",
    choices: [
      {
        label: "Try J.A.X. · gain three Sharpening Oils",
        potions: ["sharpen", "sharpen", "sharpen"],
      },
      {
        label: "Test subject · transform two stones",
        transform: 2,
        select: "two-cards",
      },
      {
        label: "Ingest mutagens · gain Vanguard Banner",
        relic: "vanguard-banner",
      },
    ],
  },
  {
    id: "beggar",
    sourceId: "Beggar",
    sourceName: "Beggar",
    act: 2,
    text: "An old wanderer will carry away a burden for a donation.",
    choices: [
      {
        label: "Donate 35 gold · remove a card or curse",
        cost: 35,
        remove: true,
        select: "card-or-curse",
      },
    ],
  },
  {
    id: "colosseum",
    sourceId: "Colosseum",
    sourceName: "Colosseum",
    act: 2,
    text: "Win a warm-up duel, then choose whether to risk the main event.",
    choices: [
      {
        label: "Fight the warm-up keeper",
        battle: "battle",
        continueStage: 1,
      },
      {
        label: "Enter the main event · elite, 80 bonus gold and two relics",
        at: 1,
        battle: "elite",
        winGold: 80,
        winRelics: 2,
      },
    ],
  },
  {
    id: "ghosts",
    sourceId: "Ghosts",
    sourceName: "Council of Ghosts",
    act: 2,
    text: "Pale keepers offer protection in exchange for vitality.",
    choices: [
      {
        label:
          "Accept · maximum lives −1, three Fortress Brews and Phoenix Feather",
        maxLife: -1,
        potions: ["fortify", "fortify", "fortify"],
        relic: "phoenix-feather",
      },
    ],
  },
  {
    id: "cursed-tome",
    sourceId: "Cursed Tome",
    sourceName: "Cursed Tome",
    act: 2,
    text: "The book reveals more power with every painful page.",
    choices: [
      {
        label: "Read the first page · lose 1 life",
        life: 1,
        stage: 1,
      },
      {
        label: "Take the tome · relic and Necronomicurse",
        at: 1,
        relics: 1,
        curse: "Necronomicurse",
      },
    ],
  },
  {
    id: "forgotten-altar",
    sourceId: "Forgotten Altar",
    sourceName: "Forgotten Altar",
    act: 2,
    text: "An altar accepts an idol, vitality, or defiance.",
    choices: [
      {
        label: "Offer Gilded Compass · gain Stout Heart",
        loseRelic: "gilded-compass",
        relic: "stout-heart",
      },
      {
        label: "Sacrifice · lose 1 life, maximum lives +1",
        life: 1,
        maxLife: 1,
      },
      {
        label: "Desecrate · heal 1 and gain Decay",
        heal: 1,
        curse: "Decay",
      },
    ],
  },
  {
    id: "knowing-skull",
    sourceId: "Knowing Skull",
    sourceName: "Knowing Skull",
    act: 2,
    text: "A skull trades knowledge for life. You may trade repeatedly.",
    choices: [
      {
        label: "Buy a rumor · lose 1 life, gain 45 gold",
        life: 1,
        gold: 45,
        repeat: true,
      },
      {
        label: "Buy an elixir · lose 1 life, gain a potion",
        life: 1,
        potions: 1,
        repeat: true,
      },
      {
        label: "Buy a stone · lose 1 life, gain a transformed card",
        life: 1,
        gainTransform: 1,
        repeat: true,
      },
    ],
  },
  {
    id: "masked-bandits",
    sourceId: "Masked Bandits",
    sourceName: "Masked Bandits",
    act: 2,
    text: "Masked keepers demand your entire purse.",
    choices: [
      {
        label: "Pay everything and pass",
        allGold: true,
      },
      {
        label: "Fight · win Haggler’s Coin",
        battle: "elite",
        winRelic: "hagglers-coin",
      },
    ],
  },
  {
    id: "nest",
    sourceId: "Nest",
    sourceName: "The Nest",
    act: 2,
    text: "A cult of stone collectors welcomes you to its treasury.",
    choices: [
      {
        label: "Take a purse · gain 55 gold",
        gold: 55,
      },
      {
        label: "Join the ritual · lose 1 life, gain an 8-pip cult stone",
        life: 1,
        specialCard: "cult",
      },
    ],
  },
  {
    id: "nloth",
    sourceId: "N'loth",
    sourceName: "N’loth",
    act: 2,
    text: "A hungry creature will trade a relic for greater rewards.",
    choices: [
      {
        label: "Offer a relic · gain Fated Lens and Twin Sigil",
        select: "relic",
        sacrificeRelic: true,
        relicList: ["fated-lens", "twin-sigil"],
      },
    ],
  },
  {
    id: "pleading-vagrant",
    sourceId: "Addict",
    sourceName: "Pleading Vagrant",
    act: 2,
    text: "A desperate traveler offers a keepsake for a small kindness.",
    choices: [
      {
        label: "Give 50 gold · gain a relic",
        cost: 50,
        relics: 1,
      },
      {
        label: "Steal it · gain a relic and Shame",
        relics: 1,
        curse: "Shame",
      },
    ],
  },
  {
    id: "joust",
    sourceId: "The Joust",
    sourceName: "The Joust",
    act: 2,
    text: "Two keepers duel while the crowd takes bets.",
    choices: [
      {
        label: "Bet 25 on the favorite · 70% chance of 65 gold",
        cost: 25,
        betChance: 70,
        betGold: 65,
      },
      {
        label: "Bet 25 on the outsider · 30% chance of 150 gold",
        cost: 25,
        betChance: 30,
        betGold: 150,
      },
    ],
  },
  {
    id: "library",
    sourceId: "The Library",
    sourceName: "The Library",
    act: 2,
    text: "A quiet archive offers a new stone or a restorative rest.",
    choices: [
      {
        label: "Read · choose a card from three",
        cardReward: true,
      },
      {
        label: "Sleep · recover 2 lives",
        heal: 2,
      },
    ],
  },
  {
    id: "mausoleum",
    sourceId: "The Mausoleum",
    sourceName: "The Mausoleum",
    act: 2,
    text: "A sealed coffin promises a relic, but something may follow you.",
    choices: [
      {
        label: "Open · relic, 50% chance of Writhe",
        relics: 1,
        curseChance: 50,
        curse: "Writhe",
      },
    ],
  },
  {
    id: "vampires",
    sourceId: "Vampires",
    sourceName: "Vampires(?)",
    act: 2,
    text: "Night keepers offer a stone that restores your strength after battle.",
    choices: [
      {
        label:
          "Accept the bite · maximum lives −1, gain Campfire Charm and a vampire stone",
        maxLife: -1,
        relic: "campfire-charm",
        specialCard: "vampire",
      },
      {
        label: "Offer a Healing Draught instead",
        needPotion: "heal",
        relic: "campfire-charm",
        specialCard: "vampire",
      },
    ],
  },
  {
    id: "falling",
    sourceId: "Falling",
    sourceName: "Falling",
    act: 3,
    text: "A collapsing bridge can only hold a lighter traveling pack.",
    choices: [
      {
        label: "Release a stone or curse",
        remove: true,
        select: "card-or-curse",
      },
      {
        label: "Hold everything · lose 1 life",
        life: 1,
      },
    ],
  },
  {
    id: "mind-bloom",
    sourceId: "MindBloom",
    sourceName: "Mind Bloom",
    act: 3,
    text: "A thought becomes a path: victory, growth, riches, or renewal.",
    choices: [
      {
        label: "I am war · fight an elite for two relics",
        battle: "elite",
        winRelics: 2,
      },
      {
        label:
          "I am awake · add 1 pip to every stone; future healing is blocked",
        upgradeAll: 1,
        noHealing: true,
      },
      {
        label: "I am rich · gain 250 gold and two Normality curses",
        gold: 250,
        curse: "Normality",
        curseCount: 2,
      },
      {
        label: "I am healthy · heal fully and remove all curses",
        heal: 9,
        cleanse: true,
      },
    ],
  },
  {
    id: "moai",
    sourceId: "The Moai Head",
    sourceName: "The Moai Head",
    act: 3,
    text: "A huge stone head offers to carry a burden or close your wounds.",
    choices: [
      {
        label: "Offer a curse · remove it and gain 50 gold",
        select: "curse",
        remove: true,
        gold: 50,
      },
      {
        label: "Climb inside · maximum lives −1, heal fully",
        maxLife: -1,
        heal: 9,
      },
    ],
  },
  {
    id: "sphere",
    sourceId: "Mysterious Sphere",
    sourceName: "Mysterious Sphere",
    act: 3,
    text: "Two powerful keepers guard a sphere full of relics.",
    choices: [
      {
        label: "Open the sphere · elite battle, two relics and 40 bonus gold",
        battle: "elite",
        winRelics: 2,
        winGold: 40,
      },
    ],
  },
  {
    id: "portal",
    sourceId: "SecretPortal",
    sourceName: "Secret Portal",
    act: 3,
    text: "A doorway leads straight to the Crown Warden.",
    choices: [
      {
        label: "Enter · face the final throne now",
        battle: "boss",
      },
    ],
  },
  {
    id: "sensory-stone",
    sourceId: "SensoryStone",
    sourceName: "Sensory Stone",
    act: 3,
    text: "Memories can become unusual stones, if you can bear their weight.",
    choices: [
      {
        label: "Remember one · gain a transformed stone",
        gainTransform: 1,
      },
      {
        label: "Remember two · lose 1 life, gain two transformed stones",
        life: 1,
        gainTransform: 2,
      },
      {
        label: "Remember three · lose 2 lives, gain three transformed stones",
        life: 2,
        gainTransform: 3,
      },
    ],
  },
  {
    id: "red-mask",
    sourceId: "Tomb of Lord Red Mask",
    sourceName: "Tomb of Lord Red Mask",
    act: 3,
    text: "A red-masked statue offers a costly bargain or rewards an old friend.",
    choices: [
      {
        label: "Offer all gold · gain Haggler’s Coin",
        allGold: true,
        relic: "hagglers-coin",
      },
      {
        label: "Wear Haggler’s Coin · gain 120 gold",
        needRelic: "hagglers-coin",
        gold: 120,
      },
    ],
  },
  {
    id: "winding-halls",
    sourceId: "Winding Halls",
    sourceName: "Winding Halls",
    act: 3,
    text: "The corridors demand that you change, weaken, or surrender something.",
    choices: [
      {
        label: "Embrace madness · lose 1 life, transform two stones",
        life: 1,
        transform: 2,
        select: "two-cards",
      },
      {
        label: "Focus · maximum lives −1",
        maxLife: -1,
      },
      {
        label: "Follow the voices · heal 2 and gain Writhe",
        heal: 2,
        curse: "Writhe",
      },
    ],
  },
  {
    id: "blacksmith",
    sourceId: "Accursed Blacksmith",
    sourceName: "Accursed Blacksmith",
    act: 0,
    text: "A soot-covered smith offers careful work or a risky keepsake.",
    choices: [
      {
        label: "Temper a stone · add 2 pips",
        upgrade: 2,
        select: "card",
      },
      {
        label: "Search the forge · gain Whetstone Ring and Pain",
        relic: "whetstone-ring",
        curse: "Pain",
      },
    ],
  },
  {
    id: "bonfire",
    sourceId: "Bonfire Elementals",
    sourceName: "Bonfire Spirits",
    act: 0,
    text: "Fire spirits reward the quality of a stone you surrender.",
    choices: [
      {
        label: "Offer a stone or curse · quality changes the reward",
        special: "bonfire",
        select: "card-or-curse",
      },
    ],
  },
  {
    id: "duplicator",
    sourceId: "Duplicator",
    sourceName: "Duplicator",
    act: 0,
    text: "An echoing plinth can make a permanent second copy of one stone.",
    choices: [
      {
        label: "Duplicate a stone",
        duplicate: true,
        select: "card",
      },
    ],
  },
  {
    id: "face-trader",
    sourceId: "FaceTrader",
    sourceName: "Face Trader",
    act: 0,
    text: "A collector offers gold for discomfort or a mysterious mask.",
    choices: [
      {
        label: "Trade a memory · lose 1 life, gain 60 gold",
        life: 1,
        gold: 60,
      },
      {
        label: "Trade faces · random relic, 35% chance of Shame",
        relics: 1,
        curseChance: 35,
        curse: "Shame",
      },
    ],
  },
  {
    id: "fountain",
    sourceId: "Fountain of Cleansing",
    sourceName: "Fountain of Cleansing",
    act: 0,
    text: "Clear water dissolves every curse you carry.",
    choices: [
      {
        label: "Drink · remove all curses",
        cleanse: true,
        needCurse: true,
      },
    ],
  },
  {
    id: "golden-shrine",
    sourceId: "Golden Shrine",
    sourceName: "Golden Shrine",
    act: 0,
    text: "Coins surround a quiet shrine.",
    choices: [
      {
        label: "Pray · gain 40 gold",
        gold: 40,
      },
      {
        label: "Desecrate · gain 130 gold and Regret",
        gold: 130,
        curse: "Regret",
      },
    ],
  },
  {
    id: "lab",
    sourceId: "Lab",
    sourceName: "Lab",
    act: 0,
    text: "Three sealed bottles wait on a clean laboratory bench.",
    choices: [
      {
        label: "Take three varied potions",
        potions: 3,
      },
    ],
  },
  {
    id: "match-keep",
    sourceId: "Match and Keep!",
    sourceName: "Match and Keep!",
    act: 0,
    text: "Flip pairs of stones. Keep matches, but beware the curse pair.",
    choices: [
      {
        label: "Play · five attempts to match six pairs",
        special: "match",
      },
    ],
  },
  {
    id: "note",
    sourceId: "NoteForYourself",
    sourceName: "A Note for Yourself",
    act: 0,
    text: "A stone left on an old shelf can be exchanged with one of your own.",
    choices: [
      {
        label: "Give and receive · the offered stone waits for a future run",
        special: "note",
        select: "card",
      },
    ],
  },
  {
    id: "purifier",
    sourceId: "Purifier",
    sourceName: "Purifier",
    act: 0,
    text: "A patient machine will remove one unwanted stone or curse.",
    choices: [
      {
        label: "Purify a stone or curse",
        remove: true,
        select: "card-or-curse",
      },
    ],
  },
  {
    id: "transmogrifier",
    sourceId: "Transmorgrifier",
    sourceName: "Transmogrifier",
    act: 0,
    text: "The machine replaces a stone with an unpredictable new form.",
    choices: [
      {
        label: "Transform one stone · enhanced keyword odds, up to five",
        transform: 1,
        select: "card",
      },
    ],
  },
  {
    id: "upgrade-shrine",
    sourceId: "Upgrade Shrine",
    sourceName: "Upgrade Shrine",
    act: 0,
    text: "A geometric altar can reinforce a chosen stone.",
    choices: [
      {
        label: "Upgrade a stone · add 2 pips",
        upgrade: 2,
        select: "card",
      },
    ],
  },
  {
    id: "meet-again",
    sourceId: "WeMeetAgain",
    sourceName: "We Meet Again!",
    act: 0,
    text: "A familiar collector offers a relic for a useful gift.",
    choices: [
      {
        label: "Give a potion · gain a relic",
        select: "potion",
        sacrificePotion: true,
        relics: 1,
      },
      {
        label: "Give 50 gold · gain a relic",
        cost: 50,
        relics: 1,
      },
      {
        label: "Give a stone · gain a relic",
        select: "card",
        remove: true,
        relics: 1,
      },
    ],
  },
  {
    id: "wheel",
    sourceId: "Wheel of Change",
    sourceName: "Wheel of Change",
    act: 0,
    text: "The wheel may offer riches, healing, a relic, purification, a curse, or a lost life.",
    choices: [
      {
        label: "Spin the wheel",
        special: "wheel",
      },
    ],
  },
  {
    id: "woman-blue",
    sourceId: "The Woman in Blue",
    sourceName: "The Woman in Blue",
    act: 0,
    text: "A blue-robed alchemist sells bundles of varied potions.",
    choices: [
      {
        label: "Buy one potion · 15 gold",
        cost: 15,
        potions: 1,
      },
      {
        label: "Buy two potions · 25 gold",
        cost: 25,
        potions: 2,
      },
      {
        label: "Buy three potions · 35 gold",
        cost: 35,
        potions: 3,
      },
    ],
  },
  {
    id: "designer",
    sourceId: "Designer",
    sourceName: "Designer In-Spire",
    act: 0,
    text: "A designer can adjust, reshape, or simplify your collection.",
    choices: [
      {
        label: "Adjustments · pay 25 gold, add 2 pips",
        cost: 25,
        upgrade: 2,
        select: "card",
      },
      {
        label: "Clean up · pay 40 gold, transform two stones",
        cost: 40,
        transform: 2,
        select: "two-cards",
      },
      {
        label: "Full service · pay 65 gold, remove a stone and upgrade another",
        cost: 65,
        special: "designer",
        select: "two-cards",
      },
    ],
  },
  {
    id: "puddles",
    sourceId: "Thinking with Puddles",
    sourceName: "Thinking with Puddles",
    act: 3,
    text: "An old unfinished crossing asks for a stone or an awkward landing.",
    choices: [
      {
        label: "Leave a stone behind",
        remove: true,
        select: "card",
      },
      {
        label: "Land badly · lose 1 life and gain Injury",
        life: 1,
        curse: "Injury",
      },
    ],
  },
  {
    id: "neow",
    sourceId: "Neow",
    sourceName: "Neow’s Blessing",
    act: 1,
    text: "A distant guardian offers a small blessing for the climb.",
    choices: [
      {
        label: "A fresh beginning · transform a stone",
        transform: 1,
        select: "card",
      },
      {
        label: "A richer beginning · gain 50 gold",
        gold: 50,
      },
      {
        label: "A powerful beginning · relic and Regret",
        relics: 1,
        curse: "Regret",
      },
    ],
  },
  {
    id: "heart",
    sourceId: "Spire Heart",
    sourceName: "The Spire Heart",
    act: 3,
    text: "The heart of the mountain offers a final trial before the throne.",
    choices: [
      {
        label:
          "Challenge the heartkeeper · elite, two relics and heal 1 on victory",
        battle: "elite",
        winRelics: 2,
        winHeal: 1,
      },
      {
        label: "Listen · gain a transformed stone and leave",
        gainTransform: 1,
      },
    ],
  },
] as const;
