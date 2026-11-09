import { SUPERCHARGER_PORTRAITS } from "./superchargers.ts";
import type { Stone, Element } from "./game.ts";
export interface CharacterPortrait {
  id: string;
  name: string;
  element: Element;
  role: string;
  game: string;
  source: string;
  playable: boolean;
}
export const CHARACTER_PORTRAITS: CharacterPortrait[] = [
  {
    id: "bouncer",
    name: "Bouncer",
    element: "tech",
    role: "Giant",
    game: "Giants",
    source: "Giants/Giant Skylanders/Bouncer.png",
    playable: true,
  },
  {
    id: "crusher",
    name: "Crusher",
    element: "earth",
    role: "Giant",
    game: "Giants",
    source: "Giants/Giant Skylanders/Crusher.png",
    playable: true,
  },
  {
    id: "eye-brawl",
    name: "Eye-Brawl",
    element: "undead",
    role: "Giant",
    game: "Giants",
    source: "Giants/Giant Skylanders/EyeBrawl.png",
    playable: true,
  },
  {
    id: "hot-head",
    name: "Hot Head",
    element: "fire",
    role: "Giant",
    game: "Giants",
    source: "Giants/Giant Skylanders/HotHead.png",
    playable: true,
  },
  {
    id: "ninjini",
    name: "Ninjini",
    element: "magic",
    role: "Giant",
    game: "Giants",
    source: "Giants/Giant Skylanders/Ninjini.png",
    playable: true,
  },
  {
    id: "swarm",
    name: "Swarm",
    element: "air",
    role: "Giant",
    game: "Giants",
    source: "Giants/Giant Skylanders/Swarm.png",
    playable: true,
  },
  {
    id: "thumpback",
    name: "Thumpback",
    element: "water",
    role: "Giant",
    game: "Giants",
    source: "Giants/Giant Skylanders/Thumpback.png",
    playable: true,
  },
  {
    id: "tree-rex",
    name: "Tree Rex",
    element: "life",
    role: "Giant",
    game: "Giants",
    source: "Giants/Giant Skylanders/TreeRex.png",
    playable: true,
  },
  {
    id: "chill",
    name: "Chill",
    element: "water",
    role: "Core Skylander",
    game: "Giants",
    source: "Giants/New (Series 1) Skylanders/Chill.png",
    playable: true,
  },
  {
    id: "flashwing",
    name: "Flashwing",
    element: "earth",
    role: "Core Skylander",
    game: "Giants",
    source: "Giants/New (Series 1) Skylanders/Flashwing.png",
    playable: true,
  },
  {
    id: "fright-rider",
    name: "Fright Rider",
    element: "undead",
    role: "Core Skylanders",
    game: "Giants",
    source: "Giants/New (Series 1) Skylanders/FrightRider.png",
    playable: true,
  },
  {
    id: "hot-dog",
    name: "Hot Dog",
    element: "fire",
    role: "Core Skylander",
    game: "Giants",
    source: "Giants/New (Series 1) Skylanders/HotDog.png",
    playable: true,
  },
  {
    id: "jet-vac",
    name: "Jet-Vac",
    element: "air",
    role: "Core Skylander",
    game: "Giants",
    source: "Giants/New (Series 1) Skylanders/JetVac.png",
    playable: true,
  },
  {
    id: "pop-fizz",
    name: "Pop Fizz",
    element: "magic",
    role: "Core Skylander",
    game: "Giants",
    source: "Giants/New (Series 1) Skylanders/PopFizz.png",
    playable: true,
  },
  {
    id: "shroomboom",
    name: "Shroomboom",
    element: "life",
    role: "Core Skylander",
    game: "Giants",
    source: "Giants/New (Series 1) Skylanders/Shroomboom.png",
    playable: true,
  },
  {
    id: "sprocket",
    name: "Sprocket",
    element: "tech",
    role: "Core Skylander",
    game: "Giants",
    source: "Giants/New (Series 1) Skylanders/Sprocket.png",
    playable: true,
  },
  {
    id: "air-strike",
    name: "Air Strike",
    element: "air",
    role: "Sensei",
    game: "Imaginators",
    source: "Imaginators/Imaginator Skylanders Sensei/AirStrike.png",
    playable: true,
  },
  {
    id: "ambush",
    name: "Ambush",
    element: "life",
    role: "Sensei",
    game: "Imaginators",
    source: "Imaginators/Imaginator Skylanders Sensei/Ambush.png",
    playable: true,
  },
  {
    id: "aurora",
    name: "Aurora",
    element: "light",
    role: "Sensei",
    game: "Imaginators",
    source: "Imaginators/Imaginator Skylanders Sensei/Aurora.png",
    playable: true,
  },
  {
    id: "barbella",
    name: "Barbella",
    element: "earth",
    role: "Sensei",
    game: "Imaginators",
    source: "Imaginators/Imaginator Skylanders Sensei/Barbella.png",
    playable: true,
  },
  {
    id: "boom-bloom",
    name: "Boom Bloom",
    element: "life",
    role: "Sensei",
    game: "Imaginators",
    source: "Imaginators/Imaginator Skylanders Sensei/BoomBloom.png",
    playable: true,
  },
  {
    id: "buckshot",
    name: "Buckshot",
    element: "magic",
    role: "Sensei",
    game: "Imaginators",
    source: "Imaginators/Imaginator Skylanders Sensei/Buckshot.png",
    playable: true,
  },
  {
    id: "chain-reaction",
    name: "Chain Reaction",
    element: "tech",
    role: "Sensei",
    game: "Imaginators",
    source: "Imaginators/Imaginator Skylanders Sensei/ChainReaction.png",
    playable: true,
  },
  {
    id: "chopscotch",
    name: "Chopscotch",
    element: "undead",
    role: "Sensei",
    game: "Imaginators",
    source: "Imaginators/Imaginator Skylanders Sensei/Chopscotch.png",
    playable: true,
  },
  {
    id: "crash-bandicoot",
    name: "Crash Bandicoot",
    element: "life",
    role: "Sensei",
    game: "Imaginators",
    source: "Imaginators/Imaginator Skylanders Sensei/CrashBandicoot.png",
    playable: true,
  },
  {
    id: "dr-neo-cortex",
    name: "Dr. Neo Cortex",
    element: "tech",
    role: "Sensei",
    game: "Imaginators",
    source: "Imaginators/Imaginator Skylanders Sensei/DrNeoCortex.png",
    playable: true,
  },
  {
    id: "ember",
    name: "Ember",
    element: "fire",
    role: "Sensei",
    game: "Imaginators",
    source: "Imaginators/Imaginator Skylanders Sensei/Ember.png",
    playable: true,
  },
  {
    id: "flare-wolf",
    name: "Flare Wolf",
    element: "fire",
    role: "Sensei",
    game: "Imaginators",
    source: "Imaginators/Imaginator Skylanders Sensei/FlareWolf.png",
    playable: true,
  },
  {
    id: "king-pen",
    name: "King Pen",
    element: "water",
    role: "Sensei",
    game: "Imaginators",
    source: "Imaginators/Imaginator Skylanders Sensei/KingPen.png",
    playable: true,
  },
  {
    id: "mysticat",
    name: "Mysticat",
    element: "magic",
    role: "Sensei",
    game: "Imaginators",
    source: "Imaginators/Imaginator Skylanders Sensei/Mysticat.png",
    playable: true,
  },
  {
    id: "pit-boss",
    name: "Pit Boss",
    element: "undead",
    role: "Sensei",
    game: "Imaginators",
    source: "Imaginators/Imaginator Skylanders Sensei/PitBoss.png",
    playable: true,
  },
  {
    id: "ro-bow",
    name: "Ro-Bow",
    element: "tech",
    role: "Sensei",
    game: "Imaginators",
    source: "Imaginators/Imaginator Skylanders Sensei/RoBow.png",
    playable: true,
  },
  {
    id: "starcast",
    name: "Starcast",
    element: "dark",
    role: "Sensei",
    game: "Imaginators",
    source: "Imaginators/Imaginator Skylanders Sensei/Starcast.png",
    playable: true,
  },
  {
    id: "tidepool",
    name: "Tidepool",
    element: "water",
    role: "Sensei",
    game: "Imaginators",
    source: "Imaginators/Imaginator Skylanders Sensei/Tidepool.png",
    playable: true,
  },
  {
    id: "tri-tip",
    name: "Tri-Tip",
    element: "earth",
    role: "Sensei",
    game: "Imaginators",
    source: "Imaginators/Imaginator Skylanders Sensei/TriTip.png",
    playable: true,
  },
  {
    id: "wild-storm",
    name: "Wild Storm",
    element: "air",
    role: "Sensei",
    game: "Imaginators",
    source: "Imaginators/Imaginator Skylanders Sensei/WildStorm.png",
    playable: true,
  },
  {
    id: "bad-juju",
    name: "Bad Juju",
    element: "air",
    role: "Villain, Ally, Sensei",
    game: "Imaginators",
    source: "Imaginators/Imaginator Villain Sensei/BadJuju.png",
    playable: true,
  },
  {
    id: "blaster-tron",
    name: "Blaster-Tron",
    element: "light",
    role: "Sensei",
    game: "Imaginators",
    source: "Imaginators/Imaginator Villain Sensei/BlasterTron.png",
    playable: true,
  },
  {
    id: "chompy-mage",
    name: "Chompy Mage",
    element: "life",
    role: "Doom Raider, Ally, Sensei",
    game: "Imaginators",
    source: "Imaginators/Imaginator Villain Sensei/ChompyMage.png",
    playable: true,
  },
  {
    id: "dr-krankcase",
    name: "Dr. Krankcase",
    element: "tech",
    role: "Doom Raider / Ally / Sensei",
    game: "Imaginators",
    source: "Imaginators/Imaginator Villain Sensei/DrKrankCase.png",
    playable: true,
  },
  {
    id: "golden-queen",
    name: "Golden Queen",
    element: "earth",
    role: "Sensei",
    game: "Imaginators",
    source: "Imaginators/Imaginator Villain Sensei/GoldenQueen.png",
    playable: true,
  },
  {
    id: "grave-clobber",
    name: "Grave Clobber",
    element: "water",
    role: "Sensei",
    game: "Imaginators",
    source: "Imaginators/Imaginator Villain Sensei/GraveClobber.png",
    playable: true,
  },
  {
    id: "hood-sickle",
    name: "Hood Sickle",
    element: "dark",
    role: "Sensei",
    game: "Imaginators",
    source: "Imaginators/Imaginator Villain Sensei/HoodSickle.png",
    playable: true,
  },
  {
    id: "kaos",
    name: "Kaos",
    element: "neutral",
    role: "Sensei",
    game: "Imaginators",
    source: "Imaginators/Imaginator Villain Sensei/Kaos.png",
    playable: true,
  },
  {
    id: "pain-yatta",
    name: "Pain-Yatta",
    element: "magic",
    role: "Sensei",
    game: "Imaginators",
    source: "Imaginators/Imaginator Villain Sensei/PainYatta.png",
    playable: true,
  },
  {
    id: "tae-kwon-crow",
    name: "Tae Kwon Crow",
    element: "fire",
    role: "Sensei",
    game: "Imaginators",
    source: "Imaginators/Imaginator Villain Sensei/TaeKwonCrow.png",
    playable: true,
  },
  {
    id: "wolfgang",
    name: "Wolfgang",
    element: "undead",
    role: "Sensei",
    game: "Imaginators",
    source: "Imaginators/Imaginator Villain Sensei/Wolfgang.png",
    playable: true,
  },
  {
    id: "bash",
    name: "Bash",
    element: "earth",
    role: "Core Skylander",
    game: "Spyro's Adventure",
    source:
      "Spyro's Adventure/Skylanders Spyro's Adventure Characters/Bash.png",
    playable: true,
  },
  {
    id: "boomer",
    name: "Boomer",
    element: "tech",
    role: "Core Skylander",
    game: "Spyro's Adventure",
    source:
      "Spyro's Adventure/Skylanders Spyro's Adventure Characters/Boomer.png",
    playable: true,
  },
  {
    id: "camo",
    name: "Camo",
    element: "life",
    role: "Core Skylander",
    game: "Spyro's Adventure",
    source:
      "Spyro's Adventure/Skylanders Spyro's Adventure Characters/Camo.png",
    playable: true,
  },
  {
    id: "chop-chop",
    name: "Chop Chop",
    element: "undead",
    role: "Core Skylander",
    game: "Spyro's Adventure",
    source:
      "Spyro's Adventure/Skylanders Spyro's Adventure Characters/ChopChop.png",
    playable: true,
  },
  {
    id: "cynder",
    name: "Cynder",
    element: "undead",
    role: "Core Skylander",
    game: "Spyro's Adventure",
    source:
      "Spyro's Adventure/Skylanders Spyro's Adventure Characters/Cynder.png",
    playable: true,
  },
  {
    id: "dino-rang",
    name: "Dino-Rang",
    element: "earth",
    role: "Core Skylander",
    game: "Spyro's Adventure",
    source:
      "Spyro's Adventure/Skylanders Spyro's Adventure Characters/DinoRang.png",
    playable: true,
  },
  {
    id: "double-trouble",
    name: "Double Trouble",
    element: "magic",
    role: "Core Skylander",
    game: "Spyro's Adventure",
    source:
      "Spyro's Adventure/Skylanders Spyro's Adventure Characters/DoubleTrouble.png",
    playable: true,
  },
  {
    id: "drill-sergeant",
    name: "Drill Sergeant",
    element: "tech",
    role: "Core Skylander",
    game: "Spyro's Adventure",
    source:
      "Spyro's Adventure/Skylanders Spyro's Adventure Characters/DrillSergeant.png",
    playable: true,
  },
  {
    id: "drobot",
    name: "Drobot",
    element: "tech",
    role: "Core Skylander",
    game: "Spyro's Adventure",
    source:
      "Spyro's Adventure/Skylanders Spyro's Adventure Characters/Drobot.png",
    playable: true,
  },
  {
    id: "eruptor",
    name: "Eruptor",
    element: "fire",
    role: "Core Skylander",
    game: "Spyro's Adventure",
    source:
      "Spyro's Adventure/Skylanders Spyro's Adventure Characters/Eruptor.png",
    playable: true,
  },
  {
    id: "flameslinger",
    name: "Flameslinger",
    element: "fire",
    role: "Core Skylander",
    game: "Spyro's Adventure",
    source:
      "Spyro's Adventure/Skylanders Spyro's Adventure Characters/Flameslinger.png",
    playable: true,
  },
  {
    id: "ghost-roaster",
    name: "Ghost Roaster",
    element: "undead",
    role: "Core Skylander",
    game: "Spyro's Adventure",
    source:
      "Spyro's Adventure/Skylanders Spyro's Adventure Characters/GhostRoaster.png",
    playable: true,
  },
  {
    id: "gill-grunt",
    name: "Gill Grunt",
    element: "water",
    role: "Core Skylander",
    game: "Spyro's Adventure",
    source:
      "Spyro's Adventure/Skylanders Spyro's Adventure Characters/GillGrunt.png",
    playable: true,
  },
  {
    id: "hex",
    name: "Hex",
    element: "undead",
    role: "Core Skylander",
    game: "Spyro's Adventure",
    source: "Spyro's Adventure/Skylanders Spyro's Adventure Characters/Hex.png",
    playable: true,
  },
  {
    id: "ignitor",
    name: "Ignitor",
    element: "fire",
    role: "Core Skylander",
    game: "Spyro's Adventure",
    source:
      "Spyro's Adventure/Skylanders Spyro's Adventure Characters/Ignitor.png",
    playable: true,
  },
  {
    id: "lightning-rod",
    name: "Lightning Rod",
    element: "air",
    role: "Core Skylander",
    game: "Spyro's Adventure",
    source:
      "Spyro's Adventure/Skylanders Spyro's Adventure Characters/LightningRod.png",
    playable: true,
  },
  {
    id: "prism-break",
    name: "Prism Break",
    element: "earth",
    role: "Core Skylander",
    game: "Spyro's Adventure",
    source:
      "Spyro's Adventure/Skylanders Spyro's Adventure Characters/PrismBreak.png",
    playable: true,
  },
  {
    id: "slam-bam",
    name: "Slam Bam",
    element: "water",
    role: "Core Skylander",
    game: "Spyro's Adventure",
    source:
      "Spyro's Adventure/Skylanders Spyro's Adventure Characters/SlamBam.png",
    playable: true,
  },
  {
    id: "sonic-boom",
    name: "Sonic Boom",
    element: "air",
    role: "Core Skylander",
    game: "Spyro's Adventure",
    source:
      "Spyro's Adventure/Skylanders Spyro's Adventure Characters/SonicBoom.png",
    playable: true,
  },
  {
    id: "spyro",
    name: "Spyro",
    element: "magic",
    role: "Core Skylander",
    game: "Spyro's Adventure",
    source:
      "skylandersNFC/Skylanders-Image-Generator: assets/01_Spyro/coins/Mirakel_Clean/1) Figures/Mirakel's spyro.png",
    playable: true,
  },
  {
    id: "stealth-elf",
    name: "Stealth Elf",
    element: "life",
    role: "Core Skylander",
    game: "Spyro's Adventure",
    source:
      "Spyro's Adventure/Skylanders Spyro's Adventure Characters/StealthElf.png",
    playable: true,
  },
  {
    id: "stump-smash",
    name: "Stump Smash",
    element: "life",
    role: "Core Skylander",
    game: "Spyro's Adventure",
    source:
      "Spyro's Adventure/Skylanders Spyro's Adventure Characters/StumpSmash.png",
    playable: true,
  },
  {
    id: "sunburn",
    name: "Sunburn",
    element: "fire",
    role: "Core Skylander",
    game: "Spyro's Adventure",
    source:
      "Spyro's Adventure/Skylanders Spyro's Adventure Characters/Sunburn.png",
    playable: true,
  },
  {
    id: "terrafin",
    name: "Terrafin",
    element: "earth",
    role: "Core Skylander",
    game: "Spyro's Adventure",
    source:
      "Spyro's Adventure/Skylanders Spyro's Adventure Characters/Terrafin.png",
    playable: true,
  },
  {
    id: "trigger-happy",
    name: "Trigger Happy",
    element: "tech",
    role: "Core Skylander",
    game: "Spyro's Adventure",
    source:
      "Spyro's Adventure/Skylanders Spyro's Adventure Characters/TriggerHappy.png",
    playable: true,
  },
  {
    id: "voodood",
    name: "Voodood",
    element: "magic",
    role: "Core Skylander",
    game: "Spyro's Adventure",
    source:
      "Spyro's Adventure/Skylanders Spyro's Adventure Characters/Voodood.png",
    playable: true,
  },
  {
    id: "warnado",
    name: "Warnado",
    element: "air",
    role: "Core Skylander",
    game: "Spyro's Adventure",
    source:
      "Spyro's Adventure/Skylanders Spyro's Adventure Characters/Warnado.png",
    playable: true,
  },
  {
    id: "wham-shell",
    name: "Wham-Shell",
    element: "water",
    role: "Core Skylander",
    game: "Spyro's Adventure",
    source:
      "Spyro's Adventure/Skylanders Spyro's Adventure Characters/WhamShell.png",
    playable: true,
  },
  {
    id: "whirlwind",
    name: "Whirlwind",
    element: "air",
    role: "Core Skylander",
    game: "Spyro's Adventure",
    source:
      "Spyro's Adventure/Skylanders Spyro's Adventure Characters/Whirlwind2.png",
    playable: true,
  },
  {
    id: "wrecking-ball",
    name: "Wrecking Ball",
    element: "magic",
    role: "Core Skylander",
    game: "Spyro's Adventure",
    source:
      "Spyro's Adventure/Skylanders Spyro's Adventure Characters/WreckingBall.png",
    playable: true,
  },
  {
    id: "zap",
    name: "Zap",
    element: "water",
    role: "Core Skylander",
    game: "Spyro's Adventure",
    source: "Spyro's Adventure/Skylanders Spyro's Adventure Characters/Zap.png",
    playable: true,
  },
  {
    id: "zook",
    name: "Zook",
    element: "life",
    role: "Core Skylander",
    game: "Spyro's Adventure",
    source:
      "Spyro's Adventure/Skylanders Spyro's Adventure Characters/Zook.png",
    playable: true,
  },
  {
    id: "astroblast",
    name: "Astroblast",
    element: "light",
    role: "SuperCharger",
    game: "SuperChargers",
    source: "SuperChargers/SuperCharger Skylanders/Astroblast.png",
    playable: true,
  },
  {
    id: "big-bubble-pop-fizz",
    name: "Big Bubble Pop Fizz",
    element: "magic",
    role: "SuperCharger",
    game: "SuperChargers",
    source: "SuperChargers/SuperCharger Skylanders/BigBubblePopFizz.png",
    playable: true,
  },
  {
    id: "bone-bash-roller-brawl",
    name: "Bone Bash Roller Brawl",
    element: "undead",
    role: "SuperCharger",
    game: "SuperChargers",
    source: "SuperChargers/SuperCharger Skylanders/BoneBashRollerBrawl.png",
    playable: true,
  },
  {
    id: "deep-dive-gill-grunt",
    name: "Deep Dive Gill Grunt",
    element: "water",
    role: "SuperCharger",
    game: "SuperChargers",
    source: "SuperChargers/SuperCharger Skylanders/DeepDiveGillGrunt.png",
    playable: true,
  },
  {
    id: "dive-clops",
    name: "Dive-Clops",
    element: "water",
    role: "SuperCharger",
    game: "SuperChargers",
    source: "SuperChargers/SuperCharger Skylanders/DiveClops.png",
    playable: true,
  },
  {
    id: "double-dare-trigger-happy",
    name: "Double Dare Trigger Happy",
    element: "tech",
    role: "SuperCharger",
    game: "SuperChargers",
    source: "SuperChargers/SuperCharger Skylanders/DoubleDareTriggerHappy.png",
    playable: true,
  },
  {
    id: "fiesta",
    name: "Fiesta",
    element: "undead",
    role: "SuperCharger",
    game: "SuperChargers",
    source: "SuperChargers/SuperCharger Skylanders/Fiesta.png",
    playable: true,
  },
  {
    id: "hammer-slam-bowser",
    name: "Hammer Slam Bowser",
    element: "fire",
    role: "SuperCharger",
    game: "SuperChargers",
    source: "SuperChargers/SuperCharger Skylanders/HammerSlamBowser.png",
    playable: true,
  },
  {
    id: "high-volt",
    name: "High Volt",
    element: "tech",
    role: "SuperCharger",
    game: "SuperChargers",
    source: "SuperChargers/SuperCharger Skylanders/HighVolt.png",
    playable: true,
  },
  {
    id: "hurricane-jet-vac",
    name: "Hurricane Jet-Vac",
    element: "air",
    role: "SuperCharger",
    game: "SuperChargers",
    source: "SuperChargers/SuperCharger Skylanders/HurricaneJetVac.png",
    playable: true,
  },
  {
    id: "lava-lance-eruptor",
    name: "Lava Lance Eruptor",
    element: "fire",
    role: "SuperCharger",
    game: "SuperChargers",
    source: "SuperChargers/SuperCharger Skylanders/LavaLanceEruptor.png",
    playable: true,
  },
  {
    id: "nightfall",
    name: "Nightfall",
    element: "dark",
    role: "SuperCharger",
    game: "SuperChargers",
    source: "SuperChargers/SuperCharger Skylanders/Nightfall.png",
    playable: true,
  },
  {
    id: "shark-shooter-terrafin",
    name: "Shark Shooter Terrafin",
    element: "earth",
    role: "SuperCharger",
    game: "SuperChargers",
    source: "SuperChargers/SuperCharger Skylanders/SharkShooterTerrafin.png",
    playable: true,
  },
  {
    id: "smash-hit",
    name: "Smash Hit",
    element: "earth",
    role: "SuperCharger",
    game: "SuperChargers",
    source: "SuperChargers/SuperCharger Skylanders/SmashHit.png",
    playable: true,
  },
  {
    id: "spitfire",
    name: "Spitfire",
    element: "fire",
    role: "SuperCharger",
    game: "SuperChargers",
    source: "SuperChargers/SuperCharger Skylanders/SpitFire.png",
    playable: true,
  },
  {
    id: "splat",
    name: "Splat",
    element: "magic",
    role: "SuperCharger",
    game: "SuperChargers",
    source: "SuperChargers/SuperCharger Skylanders/Splat.png",
    playable: true,
  },
  {
    id: "stormblade",
    name: "Stormblade",
    element: "air",
    role: "SuperCharger",
    game: "SuperChargers",
    source: "SuperChargers/SuperCharger Skylanders/StormBlade.png",
    playable: true,
  },
  {
    id: "super-shot-stealth-elf",
    name: "Super Shot Stealth Elf",
    element: "life",
    role: "SuperCharger",
    game: "SuperChargers",
    source: "SuperChargers/SuperCharger Skylanders/SuperShotStealthElf.png",
    playable: true,
  },
  {
    id: "thrillipede",
    name: "Thrillipede",
    element: "life",
    role: "SuperCharger",
    game: "SuperChargers",
    source: "SuperChargers/SuperCharger Skylanders/Thrillipede.png",
    playable: true,
  },
  {
    id: "turbo-charge-donkey-kong",
    name: "Turbo Charge Donkey Kong",
    element: "life",
    role: "SuperCharger",
    game: "SuperChargers",
    source: "SuperChargers/SuperCharger Skylanders/TurboChargeDonkeyKong.png",
    playable: true,
  },
  {
    id: "bumble-blast",
    name: "Bumble Blast",
    element: "life",
    role: "Core Skylander",
    game: "Swap Force",
    source: "Swap Force/New (Series 1) Skylanders/BumbleBlast.png",
    playable: true,
  },
  {
    id: "countdown",
    name: "Countdown",
    element: "tech",
    role: "Core Skylander",
    game: "Swap Force",
    source: "Swap Force/New (Series 1) Skylanders/Countdown.png",
    playable: true,
  },
  {
    id: "dune-bug",
    name: "Dune Bug",
    element: "magic",
    role: "Core Skylander",
    game: "Swap Force",
    source: "Swap Force/New (Series 1) Skylanders/DuneBug.png",
    playable: true,
  },
  {
    id: "fryno",
    name: "Fryno",
    element: "fire",
    role: "Core Skylander",
    game: "Swap Force",
    source: "Swap Force/New (Series 1) Skylanders/Fryno.png",
    playable: true,
  },
  {
    id: "grim-creeper",
    name: "Grim Creeper",
    element: "undead",
    role: "Core Skylander",
    game: "Swap Force",
    source: "Swap Force/New (Series 1) Skylanders/GrimCreeper.png",
    playable: true,
  },
  {
    id: "pop-thorn",
    name: "Pop Thorn",
    element: "air",
    role: "Core Skylander",
    game: "Swap Force",
    source: "Swap Force/New (Series 1) Skylanders/Popthorn.png",
    playable: true,
  },
  {
    id: "punk-shock",
    name: "Punk Shock",
    element: "water",
    role: "Core Skylander",
    game: "Swap Force",
    source: "Swap Force/New (Series 1) Skylanders/PunkShock.png",
    playable: true,
  },
  {
    id: "rip-tide",
    name: "Rip Tide",
    element: "water",
    role: "Core Skylander",
    game: "Swap Force",
    source: "Swap Force/New (Series 1) Skylanders/Riptide.png",
    playable: true,
  },
  {
    id: "roller-brawl",
    name: "Roller Brawl",
    element: "undead",
    role: "Core Skylander",
    game: "Swap Force",
    source: "Swap Force/New (Series 1) Skylanders/RollerBrawl.png",
    playable: true,
  },
  {
    id: "scorp",
    name: "Scorp",
    element: "earth",
    role: "Core Skylander",
    game: "Swap Force",
    source: "Swap Force/New (Series 1) Skylanders/Scorp.png",
    playable: true,
  },
  {
    id: "scratch",
    name: "Scratch",
    element: "air",
    role: "Core Skylander",
    game: "Swap Force",
    source: "Swap Force/New (Series 1) Skylanders/Scratch.png",
    playable: true,
  },
  {
    id: "slobber-tooth",
    name: "Slobber Tooth",
    element: "earth",
    role: "Core Skylander",
    game: "Swap Force",
    source: "Swap Force/New (Series 1) Skylanders/SlobberTooth.png",
    playable: true,
  },
  {
    id: "smolderdash",
    name: "Smolderdash",
    element: "fire",
    role: "Core Skylander",
    game: "Swap Force",
    source: "Swap Force/New (Series 1) Skylanders/Smolderdash.png",
    playable: true,
  },
  {
    id: "star-strike",
    name: "Star Strike",
    element: "magic",
    role: "Core Skylander",
    game: "Swap Force",
    source: "Swap Force/New (Series 1) Skylanders/StarStrike.png",
    playable: true,
  },
  {
    id: "wind-up",
    name: "Wind-Up",
    element: "tech",
    role: "Core Skylander",
    game: "Swap Force",
    source: "Swap Force/New (Series 1) Skylanders/WindUp.png",
    playable: true,
  },
  {
    id: "zoo-lou",
    name: "Zoo Lou",
    element: "life",
    role: "Core Skylander",
    game: "Swap Force",
    source: "Swap Force/New (Series 1) Skylanders/ZooLou.png",
    playable: true,
  },
  {
    id: "blast-zone",
    name: "Blast Zone",
    element: "fire",
    role: "SWAP Force",
    game: "Swap Force",
    source: "Swap Force/SWAP Force Skylanders (Swappers)/BlastZone.png",
    playable: true,
  },
  {
    id: "boom-jet",
    name: "Boom Jet",
    element: "air",
    role: "SWAP Force",
    game: "Swap Force",
    source: "Swap Force/SWAP Force Skylanders (Swappers)/BoomJet.png",
    playable: true,
  },
  {
    id: "doom-stone",
    name: "Doom Stone",
    element: "earth",
    role: "SWAP Force",
    game: "Swap Force",
    source: "Swap Force/SWAP Force Skylanders (Swappers)/DoomStone.png",
    playable: true,
  },
  {
    id: "fire-kraken",
    name: "Fire Kraken",
    element: "fire",
    role: "SWAP Force",
    game: "Swap Force",
    source: "Swap Force/SWAP Force Skylanders (Swappers)/FireKraken.png",
    playable: true,
  },
  {
    id: "free-ranger",
    name: "Free Ranger",
    element: "air",
    role: "SWAP Force",
    game: "Swap Force",
    source: "Swap Force/SWAP Force Skylanders (Swappers)/FreeRanger.png",
    playable: true,
  },
  {
    id: "freeze-blade",
    name: "Freeze Blade",
    element: "water",
    role: "SWAP Force",
    game: "Swap Force",
    source: "Swap Force/SWAP Force Skylanders (Swappers)/FreezeBlade.png",
    playable: true,
  },
  {
    id: "grilla-drilla",
    name: "Grilla Drilla",
    element: "life",
    role: "SWAP Force",
    game: "Swap Force",
    source: "Swap Force/SWAP Force Skylanders (Swappers)/GrillaDrilla.png",
    playable: true,
  },
  {
    id: "hoot-loop",
    name: "Hoot Loop",
    element: "magic",
    role: "SWAP Force",
    game: "Swap Force",
    source: "Swap Force/SWAP Force Skylanders (Swappers)/HootLoop.png",
    playable: true,
  },
  {
    id: "magna-charge",
    name: "Magna Charge",
    element: "tech",
    role: "SWAP Force",
    game: "Swap Force",
    source: "Swap Force/SWAP Force Skylanders (Swappers)/MagnaCharge.png",
    playable: true,
  },
  {
    id: "night-shift",
    name: "Night Shift",
    element: "undead",
    role: "SWAP Force",
    game: "Swap Force",
    source: "Swap Force/SWAP Force Skylanders (Swappers)/NightShift.png",
    playable: true,
  },
  {
    id: "rattle-shake",
    name: "Rattle Shake",
    element: "undead",
    role: "SWAP Force",
    game: "Swap Force",
    source: "Swap Force/SWAP Force Skylanders (Swappers)/RattleShake.png",
    playable: true,
  },
  {
    id: "rubble-rouser",
    name: "Rubble Rouser",
    element: "earth",
    role: "SWAP Force",
    game: "Swap Force",
    source: "Swap Force/SWAP Force Skylanders (Swappers)/RubbleRouser.png",
    playable: true,
  },
  {
    id: "spy-rise",
    name: "Spy Rise",
    element: "tech",
    role: "SWAP Force",
    game: "Swap Force",
    source: "Swap Force/SWAP Force Skylanders (Swappers)/SpyRise.png",
    playable: true,
  },
  {
    id: "stink-bomb",
    name: "Stink Bomb",
    element: "life",
    role: "SWAP Force",
    game: "Swap Force",
    source: "Swap Force/SWAP Force Skylanders (Swappers)/StinkBomb.png",
    playable: true,
  },
  {
    id: "trap-shadow",
    name: "Trap Shadow",
    element: "magic",
    role: "SWAP Force",
    game: "Swap Force",
    source: "Swap Force/SWAP Force Skylanders (Swappers)/TrapShadow.png",
    playable: true,
  },
  {
    id: "wash-buckler",
    name: "Wash Buckler",
    element: "water",
    role: "SWAP Force",
    game: "Swap Force",
    source: "Swap Force/SWAP Force Skylanders (Swappers)/WashBuckler.png",
    playable: true,
  },
  {
    id: "barkley",
    name: "Barkley",
    element: "life",
    role: "Sidekick / Mini",
    game: "Trap Team",
    source: "Trap Team/Mini Skylanders/Barkley.png",
    playable: true,
  },
  {
    id: "bop",
    name: "Bop",
    element: "earth",
    role: "Mini",
    game: "Trap Team",
    source: "Trap Team/Mini Skylanders/Bop.png",
    playable: true,
  },
  {
    id: "breeze",
    name: "Breeze",
    element: "air",
    role: "Mini",
    game: "Trap Team",
    source: "Trap Team/Mini Skylanders/Breeze.png",
    playable: true,
  },
  {
    id: "drobit",
    name: "Drobit",
    element: "tech",
    role: "Mini",
    game: "Trap Team",
    source: "Trap Team/Mini Skylanders/Drobit.png",
    playable: true,
  },
  {
    id: "eye-small",
    name: "Eye-Small",
    element: "undead",
    role: "Mini",
    game: "Trap Team",
    source: "Trap Team/Mini Skylanders/EyeSmall.png",
    playable: true,
  },
  {
    id: "gill-runt",
    name: "Gill Runt",
    element: "water",
    role: "Sidekick / Mini",
    game: "Trap Team",
    source: "Trap Team/Mini Skylanders/GillRunt.png",
    playable: true,
  },
  {
    id: "hijinx",
    name: "Hijinx",
    element: "undead",
    role: "Mini",
    game: "Trap Team",
    source: "Trap Team/Mini Skylanders/Hijinx.png",
    playable: true,
  },
  {
    id: "mini-jini",
    name: "Mini-Jini",
    element: "magic",
    role: "Sidekick, Mini",
    game: "Trap Team",
    source: "Trap Team/Mini Skylanders/MiniJini.png",
    playable: true,
  },
  {
    id: "pet-vac",
    name: "Pet-Vac",
    element: "air",
    role: "Mini",
    game: "Trap Team",
    source: "Trap Team/Mini Skylanders/PetVac.png",
    playable: true,
  },
  {
    id: "small-fry",
    name: "Small Fry",
    element: "fire",
    role: "Mini",
    game: "Trap Team",
    source: "Trap Team/Mini Skylanders/SmallFry.png",
    playable: true,
  },
  {
    id: "spry",
    name: "Spry",
    element: "magic",
    role: "Mini",
    game: "Trap Team",
    source: "Trap Team/Mini Skylanders/Spry.png",
    playable: true,
  },
  {
    id: "terrabite",
    name: "Terrabite",
    element: "earth",
    role: "Sidekick / Mini",
    game: "Trap Team",
    source: "Trap Team/Mini Skylanders/Terrabite.png",
    playable: true,
  },
  {
    id: "thumpling",
    name: "Thumpling",
    element: "water",
    role: "Mini",
    game: "Trap Team",
    source: "Trap Team/Mini Skylanders/Thumping.png",
    playable: true,
  },
  {
    id: "trigger-snappy",
    name: "Trigger Snappy",
    element: "tech",
    role: "Mini",
    game: "Trap Team",
    source: "Trap Team/Mini Skylanders/TriggerSnappy.png",
    playable: true,
  },
  {
    id: "weeruptor",
    name: "Weeruptor",
    element: "fire",
    role: "Mini",
    game: "Trap Team",
    source: "Trap Team/Mini Skylanders/Weeruptor.png",
    playable: true,
  },
  {
    id: "whisper-elf",
    name: "Whisper Elf",
    element: "life",
    role: "Sidekick / Mini",
    game: "Trap Team",
    source: "Trap Team/Mini Skylanders/WhisperElf.png",
    playable: true,
  },
  {
    id: "bat-spin",
    name: "Bat Spin",
    element: "undead",
    role: "Core Skylander",
    game: "Trap Team",
    source: "Trap Team/New (Series 1) Skylanders/BatSpin.png",
    playable: true,
  },
  {
    id: "blackout",
    name: "Blackout",
    element: "dark",
    role: "Core Skylander",
    game: "Trap Team",
    source: "Trap Team/New (Series 1) Skylanders/Blackout.png",
    playable: true,
  },
  {
    id: "blades",
    name: "Blades",
    element: "air",
    role: "Core Skylander",
    game: "Trap Team",
    source: "Trap Team/New (Series 1) Skylanders/Blades.png",
    playable: true,
  },
  {
    id: "chopper",
    name: "Chopper",
    element: "tech",
    role: "Core Skylander",
    game: "Trap Team",
    source: "Trap Team/New (Series 1) Skylanders/Chopper.png",
    playable: true,
  },
  {
    id: "cobra-cadabra",
    name: "Cobra Cadabra",
    element: "magic",
    role: "Core Skylander",
    game: "Trap Team",
    source: "Trap Team/New (Series 1) Skylanders/CobraCadabra.png",
    playable: true,
  },
  {
    id: "deja-vu",
    name: "Déjà Vu",
    element: "magic",
    role: "Core Slylander",
    game: "Trap Team",
    source: "Trap Team/New (Series 1) Skylanders/DejaVu.png",
    playable: true,
  },
  {
    id: "echo",
    name: "Echo",
    element: "water",
    role: "Core Skylander",
    game: "Trap Team",
    source: "Trap Team/New (Series 1) Skylanders/Echo.png",
    playable: true,
  },
  {
    id: "fist-bump",
    name: "Fist Bump",
    element: "earth",
    role: "Core Skylander",
    game: "Trap Team",
    source: "Trap Team/New (Series 1) Skylanders/FistBump.png",
    playable: true,
  },
  {
    id: "fling-kong",
    name: "Fling Kong",
    element: "air",
    role: "Core Skylander",
    game: "Trap Team",
    source: "Trap Team/New (Series 1) Skylanders/FlingKong.png",
    playable: true,
  },
  {
    id: "flip-wreck",
    name: "Flip Wreck",
    element: "water",
    role: "Core Skylander",
    game: "Trap Team",
    source: "Trap Team/New (Series 1) Skylanders/FlipWreck.png",
    playable: true,
  },
  {
    id: "food-fight",
    name: "Food Fight",
    element: "life",
    role: "Core Skylander",
    game: "Trap Team",
    source: "Trap Team/New (Series 1) Skylanders/FoodFight.png",
    playable: true,
  },
  {
    id: "funny-bone",
    name: "Funny Bone",
    element: "undead",
    role: "Core Skylander",
    game: "Trap Team",
    source: "Trap Team/New (Series 1) Skylanders/FunnyBone.png",
    playable: true,
  },
  {
    id: "high-five",
    name: "High Five",
    element: "life",
    role: "Core Skylander",
    game: "Trap Team",
    source: "Trap Team/New (Series 1) Skylanders/HighFive.png",
    playable: true,
  },
  {
    id: "rocky-roll",
    name: "Rocky Roll",
    element: "earth",
    role: "Core Skylanders",
    game: "Trap Team",
    source: "Trap Team/New (Series 1) Skylanders/RockyRoll.png",
    playable: true,
  },
  {
    id: "spotlight",
    name: "Spotlight",
    element: "light",
    role: "Core Skylander",
    game: "Trap Team",
    source: "Trap Team/New (Series 1) Skylanders/Spotlight.png",
    playable: true,
  },
  {
    id: "trail-blazer",
    name: "Trail Blazer",
    element: "fire",
    role: "Core Skylander",
    game: "Trap Team",
    source: "Trap Team/New (Series 1) Skylanders/TrailBlazer.png",
    playable: true,
  },
  {
    id: "tread-head",
    name: "Tread Head",
    element: "tech",
    role: "Core Skylander",
    game: "Trap Team",
    source: "Trap Team/New (Series 1) Skylanders/TreadHead.png",
    playable: true,
  },
  {
    id: "blastermind",
    name: "Blastermind",
    element: "magic",
    role: "Trap Master",
    game: "Trap Team",
    source: "Trap Team/Trap Master Skylanders/Blastermind.png",
    playable: true,
  },
  {
    id: "bushwhack",
    name: "Bushwhack",
    element: "life",
    role: "Trap Master",
    game: "Trap Team",
    source: "Trap Team/Trap Master Skylanders/BushWhack.png",
    playable: true,
  },
  {
    id: "enigma",
    name: "Enigma",
    element: "magic",
    role: "Trap Master",
    game: "Trap Team",
    source: "Trap Team/Trap Master Skylanders/Enigma.png",
    playable: true,
  },
  {
    id: "gearshift",
    name: "Gearshift",
    element: "tech",
    role: "Trap Master",
    game: "Trap Team",
    source: "Trap Team/Trap Master Skylanders/Gearshift.png",
    playable: true,
  },
  {
    id: "gusto",
    name: "Gusto",
    element: "air",
    role: "Trap Master",
    game: "Trap Team",
    source: "Trap Team/Trap Master Skylanders/Gusto.png",
    playable: true,
  },
  {
    id: "head-rush",
    name: "Head Rush",
    element: "earth",
    role: "Trap Master",
    game: "Trap Team",
    source: "Trap Team/Trap Master Skylanders/HeadRush.png",
    playable: true,
  },
  {
    id: "jawbreaker",
    name: "Jawbreaker",
    element: "tech",
    role: "Trap Master",
    game: "Trap Team",
    source: "Trap Team/Trap Master Skylanders/JawBreaker.png",
    playable: true,
  },
  {
    id: "ka-boom",
    name: "Ka-Boom",
    element: "fire",
    role: "Trap Master",
    game: "Trap Team",
    source: "Trap Team/Trap Master Skylanders/Kaboom.png",
    playable: true,
  },
  {
    id: "knight-light",
    name: "Knight Light",
    element: "light",
    role: "Trap Master",
    game: "Trap Team",
    source: "Trap Team/Trap Master Skylanders/KnightLight.png",
    playable: true,
  },
  {
    id: "knight-mare",
    name: "Knight Mare",
    element: "dark",
    role: "Trap Master",
    game: "Trap Team",
    source: "Trap Team/Trap Master Skylanders/KnightMare.png",
    playable: true,
  },
  {
    id: "krypt-king",
    name: "Krypt King",
    element: "undead",
    role: "Trap Master",
    game: "Trap Team",
    source: "Trap Team/Trap Master Skylanders/KryptKing.png",
    playable: true,
  },
  {
    id: "lob-star",
    name: "Lob-Star",
    element: "water",
    role: "Trap Master",
    game: "Trap Team",
    source: "Trap Team/Trap Master Skylanders/LobStar.png",
    playable: true,
  },
  {
    id: "short-cut",
    name: "Short Cut",
    element: "undead",
    role: "Trap Master",
    game: "Trap Team",
    source: "Trap Team/Trap Master Skylanders/ShortCut.png",
    playable: true,
  },
  {
    id: "snap-shot",
    name: "Snap Shot",
    element: "water",
    role: "Trap Master",
    game: "Trap Team",
    source: "Trap Team/Trap Master Skylanders/SnapShot.png",
    playable: true,
  },
  {
    id: "thunderbolt",
    name: "Thunderbolt",
    element: "air",
    role: "Trap Master",
    game: "Trap Team",
    source: "Trap Team/Trap Master Skylanders/Thunderbolt.png",
    playable: true,
  },
  {
    id: "tuff-luck",
    name: "Tuff Luck",
    element: "life",
    role: "Trap Master",
    game: "Trap Team",
    source: "Trap Team/Trap Master Skylanders/TuffLuck.png",
    playable: true,
  },
  {
    id: "wallop",
    name: "Wallop",
    element: "earth",
    role: "Trap Master",
    game: "Trap Team",
    source: "Trap Team/Trap Master Skylanders/Wallop.png",
    playable: true,
  },
  {
    id: "wildfire",
    name: "Wildfire",
    element: "fire",
    role: "Trap Master",
    game: "Trap Team",
    source: "Trap Team/Trap Master Skylanders/WildFire.png",
    playable: true,
  },
  {
    id: "chill-lightcore",
    name: "Chill LightCore",
    element: "water",
    role: "Core Skylander",
    game: "Giants",
    source: "Giants/LightCore Skylanders/ChillLightCore.png",
    playable: false,
  },
  {
    id: "drobot-lightcore",
    name: "Drobot LightCore",
    element: "tech",
    role: "Core Skylander",
    game: "Giants",
    source: "Giants/LightCore Skylanders/DrobotLightCore.png",
    playable: false,
  },
  {
    id: "eruptor-lightcore",
    name: "Eruptor LightCore",
    element: "fire",
    role: "Core Skylander",
    game: "Giants",
    source: "Giants/LightCore Skylanders/EruptorLightCore.png",
    playable: false,
  },
  {
    id: "hex-lightcore",
    name: "Hex LightCore",
    element: "undead",
    role: "Core Skylander",
    game: "Giants",
    source: "Giants/LightCore Skylanders/HexLightCore.png",
    playable: false,
  },
  {
    id: "jet-vac-lightcore",
    name: "Jet Vac LightCore",
    element: "air",
    role: "Core Skylander",
    game: "Giants",
    source: "Giants/LightCore Skylanders/JetVacLightCore.png",
    playable: false,
  },
  {
    id: "lightcore-pop-fizz",
    name: "LightCore Pop Fizz",
    element: "magic",
    role: "Core Skylander",
    game: "Giants",
    source: "Giants/LightCore Skylanders/LightCorePopFizz.png",
    playable: false,
  },
  {
    id: "prism-break-lightcore",
    name: "Prism Break LightCore",
    element: "earth",
    role: "Core Skylander",
    game: "Giants",
    source: "Giants/LightCore Skylanders/PrismBreakLightCore.png",
    playable: false,
  },
  {
    id: "shroomboom-lightcore",
    name: "Shroomboom LightCore",
    element: "life",
    role: "Core Skylander",
    game: "Giants",
    source: "Giants/LightCore Skylanders/ShroomboomLightCore.png",
    playable: false,
  },
  {
    id: "gnarly-tree-rex",
    name: "Gnarly Tree Rex",
    element: "life",
    role: "Skylander",
    game: "Giants",
    source: "Giants/Skylanders Giants In-Game Variants/GnarlyTreeRex.png",
    playable: false,
  },
  {
    id: "granite-crusher",
    name: "Granite Crusher",
    element: "earth",
    role: "Giant",
    game: "Giants",
    source: "Giants/Skylanders Giants In-Game Variants/GraniteCrusher.png",
    playable: false,
  },
  {
    id: "jade-flashwing",
    name: "Jade Flashwing",
    element: "earth",
    role: "Skylander",
    game: "Giants",
    source: "Giants/Skylanders Giants In-Game Variants/JadeFlashwing.png",
    playable: false,
  },
  {
    id: "legendary-bouncer",
    name: "Legendary Bouncer",
    element: "tech",
    role: "Legendary Giant",
    game: "Giants",
    source: "Giants/Skylanders Giants In-Game Variants/LegendaryBouncer.png",
    playable: false,
  },
  {
    id: "legendary-ignitor",
    name: "Legendary Ignitor",
    element: "fire",
    role: "Legendary Skylander",
    game: "Giants",
    source: "Giants/Skylanders Giants In-Game Variants/LegendaryIgnitor.png",
    playable: false,
  },
  {
    id: "legendary-jet-vac",
    name: "Legendary Jet Vac",
    element: "air",
    role: "Legendary Skylander",
    game: "Giants",
    source: "Giants/Skylanders Giants In-Game Variants/LegendaryJetVac.png",
    playable: false,
  },
  {
    id: "legendary-lightcore-chill",
    name: "Legendary LightCore Chill",
    element: "water",
    role: "Legendary Skylander",
    game: "Giants",
    source:
      "Giants/Skylanders Giants In-Game Variants/LegendaryLightCoreChill.png",
    playable: false,
  },
  {
    id: "legendary-slam-bam",
    name: "Legendary Slam Bam",
    element: "water",
    role: "Legendary Skylander",
    game: "Giants",
    source: "Giants/Skylanders Giants In-Game Variants/LegendarySlamBam.png",
    playable: false,
  },
  {
    id: "legendary-stealth-elf",
    name: "Legendary Stealth Elf",
    element: "life",
    role: "Legendary Skylander",
    game: "Giants",
    source: "Giants/Skylanders Giants In-Game Variants/LegendaryStealthElf.png",
    playable: false,
  },
  {
    id: "molten-hot-dog",
    name: "Molten Hot Dog",
    element: "fire",
    role: "Core Skylander",
    game: "Giants",
    source: "Giants/Skylanders Giants In-Game Variants/MoltenHotDog.png",
    playable: false,
  },
  {
    id: "polar-whirlwind",
    name: "Polar Whirlwind",
    element: "air",
    role: "Skylander",
    game: "Giants",
    source: "Giants/Skylanders Giants In-Game Variants/PolarWhirlwind.png",
    playable: false,
  },
  {
    id: "punch-pop-fizz",
    name: "Punch Pop Fizz",
    element: "magic",
    role: "Skylander",
    game: "Giants",
    source: "Giants/Skylanders Giants In-Game Variants/PunchPopFizz.png",
    playable: false,
  },
  {
    id: "royal-double-trouble",
    name: "Royal Double Trouble",
    element: "magic",
    role: "Skylander",
    game: "Giants",
    source: "Giants/Skylanders Giants In-Game Variants/RoyalDoubleTrouble.png",
    playable: false,
  },
  {
    id: "scarlet-ninjini",
    name: "Scarlet Ninjini",
    element: "magic",
    role: "Giant",
    game: "Giants",
    source: "Giants/Skylanders Giants In-Game Variants/ScarletNinjini.png",
    playable: false,
  },
  {
    id: "candy-coated-chopscotch",
    name: "Candy Coated Chopscotch",
    element: "undead",
    role: "Sensei",
    game: "Imaginators",
    source:
      "Imaginators/In-Game Variant Imaginator Skylanders Sensei/CandyCoatedChopscotch.png",
    playable: false,
  },
  {
    id: "dark-king-pen",
    name: "Dark King Pen",
    element: "water",
    role: "Dark Edition Sensei",
    game: "Imaginators",
    source:
      "Imaginators/In-Game Variant Imaginator Skylanders Sensei/DarkKingPen.png",
    playable: false,
  },
  {
    id: "egg-bomber-air-strike",
    name: "Egg Bomber Air Strike",
    element: "air",
    role: "Senseis",
    game: "Imaginators",
    source:
      "Imaginators/In-Game Variant Imaginator Skylanders Sensei/EggBomberAirStrike.png",
    playable: false,
  },
  {
    id: "hard-boiled-flare-wolf",
    name: "Hard Boiled Flare Wolf",
    element: "fire",
    role: "Sensei",
    game: "Imaginators",
    source:
      "Imaginators/In-Game Variant Imaginator Skylanders Sensei/HardBoiledFlareWolf.png",
    playable: false,
  },
  {
    id: "legendary-pit-boss",
    name: "Legendary Pit Boss",
    element: "undead",
    role: "Legendary Sensei",
    game: "Imaginators",
    source:
      "Imaginators/In-Game Variant Imaginator Skylanders Sensei/LegendaryPitBoss.png",
    playable: false,
  },
  {
    id: "legendary-tri-tip",
    name: "Legendary Tri Tip",
    element: "earth",
    role: "Legendary Sensei",
    game: "Imaginators",
    source:
      "Imaginators/In-Game Variant Imaginator Skylanders Sensei/LegendaryTriTip.png",
    playable: false,
  },
  {
    id: "dark-golden-queen",
    name: "Dark Golden Queen",
    element: "earth",
    role: "Dark Edition Sensei",
    game: "Imaginators",
    source:
      "Imaginators/In-Game Variant Imaginator Villain Sensei/DarkGoldenQueen.png",
    playable: false,
  },
  {
    id: "dark-wolfgang",
    name: "Dark Wolfgang",
    element: "undead",
    role: "Dark Edition Sensei",
    game: "Imaginators",
    source:
      "Imaginators/In-Game Variant Imaginator Villain Sensei/DarkWolfgang.png",
    playable: false,
  },
  {
    id: "jingle-bell-chompy-mage",
    name: "Jingle Bell Chompy Mage",
    element: "life",
    role: "Sensei",
    game: "Imaginators",
    source:
      "Imaginators/In-Game Variant Imaginator Villain Sensei/JingleBellChompyMage.png",
    playable: false,
  },
  {
    id: "mystical-bad-juju",
    name: "Mystical Bad Juju",
    element: "air",
    role: "Sensei",
    game: "Imaginators",
    source:
      "Imaginators/In-Game Variant Imaginator Villain Sensei/MysticalBadJuju.png",
    playable: false,
  },
  {
    id: "mystical-tae-kwon-crow",
    name: "Mystical Tae Kwon Crow",
    element: "fire",
    role: "Sensei",
    game: "Imaginators",
    source:
      "Imaginators/In-Game Variant Imaginator Villain Sensei/MysticalTaeKwonCrow.png",
    playable: false,
  },
  {
    id: "rock-candy-painyatta",
    name: "Rock Candy Painyatta",
    element: "magic",
    role: "Sensei",
    game: "Imaginators",
    source:
      "Imaginators/In-Game Variant Imaginator Villain Sensei/RockCandyPainyatta.png",
    playable: false,
  },
  {
    id: "steel-plated-hood-sickle",
    name: "Steel Plated Hood Sickle",
    element: "dark",
    role: "Sensei",
    game: "Imaginators",
    source:
      "Imaginators/In-Game Variant Imaginator Villain Sensei/SteelPlatedHoodSickle.png",
    playable: false,
  },
  {
    id: "dark-spyro",
    name: "Dark Spyro",
    element: "magic",
    role: "Dark Edition Skylander",
    game: "Spyro's Adventure",
    source:
      "Spyro's Adventure/Spyro's Adventure In-Game Variants/DarkSpyro.png",
    playable: false,
  },
  {
    id: "legendary-bash",
    name: "Legendary Bash",
    element: "earth",
    role: "Legendary Skylander",
    game: "Spyro's Adventure",
    source:
      "Spyro's Adventure/Spyro's Adventure In-Game Variants/LegendaryBash.png",
    playable: false,
  },
  {
    id: "legendary-chop-chop",
    name: "Legendary Chop Chop",
    element: "undead",
    role: "Legendary Skylander",
    game: "Spyro's Adventure",
    source:
      "Spyro's Adventure/Spyro's Adventure In-Game Variants/LegendaryChopChop.png",
    playable: false,
  },
  {
    id: "legendary-spyro",
    name: "Legendary Spyro",
    element: "magic",
    role: "Legendary Skylander",
    game: "Spyro's Adventure",
    source:
      "Spyro's Adventure/Spyro's Adventure In-Game Variants/LegendarySpyro.png",
    playable: false,
  },
  {
    id: "legendary-trigger-happy",
    name: "Legendary Trigger Happy",
    element: "tech",
    role: "Legendary Skylander",
    game: "Spyro's Adventure",
    source:
      "Spyro's Adventure/Spyro's Adventure In-Game Variants/LegendaryTriggerHappy.png",
    playable: false,
  },
  {
    id: "birthday-bash-big-bubble-pop-fizz",
    name: "Birthday Bash Big Bubble Pop Fizz",
    element: "magic",
    role: "SuperCharger",
    game: "SuperChargers",
    source:
      "SuperChargers/In-Game Variant SuperCharger Skylanders/BirthdayBashBigBubblePopFizz.png",
    playable: false,
  },
  {
    id: "dark-hammer-slam-bowser",
    name: "Dark Hammer Slam Bowser",
    element: "fire",
    role: "Dark Edition SuperCharger",
    game: "SuperChargers",
    source:
      "SuperChargers/In-Game Variant SuperCharger Skylanders/DarkHammerSlamBowser.png",
    playable: false,
  },
  {
    id: "dark-spitfire",
    name: "Dark Spitfire",
    element: "fire",
    role: "Dark Edition SuperCharger",
    game: "SuperChargers",
    source:
      "SuperChargers/In-Game Variant SuperCharger Skylanders/DarkSpitfire.png",
    playable: false,
  },
  {
    id: "dark-super-shot-stealth-elf",
    name: "Dark Super Shot Stealth Elf",
    element: "life",
    role: "Dark Edition SuperCharger",
    game: "SuperChargers",
    source:
      "SuperChargers/In-Game Variant SuperCharger Skylanders/DarkSuperShotStealthElf.png",
    playable: false,
  },
  {
    id: "dark-turbo-charge-donkey-kong",
    name: "Dark Turbo Charge Donkey Kong",
    element: "life",
    role: "Dark Edition SuperCharger",
    game: "SuperChargers",
    source:
      "SuperChargers/In-Game Variant SuperCharger Skylanders/DarkTurboChargeDonkeyKong.png",
    playable: false,
  },
  {
    id: "eggcited-thrillipede",
    name: "Eggcited Thrillipede",
    element: "life",
    role: "SuperCharger",
    game: "SuperChargers",
    source:
      "SuperChargers/In-Game Variant SuperCharger Skylanders/EggcitedThrillipede.png",
    playable: false,
  },
  {
    id: "frightful-fiesta",
    name: "Frightful Fiesta",
    element: "undead",
    role: "SuperCharger",
    game: "SuperChargers",
    source:
      "SuperChargers/In-Game Variant SuperCharger Skylanders/FrightfulFiesta.png",
    playable: false,
  },
  {
    id: "legendary-astroblast",
    name: "Legendary Astroblast",
    element: "light",
    role: "Legendary SuperCharger",
    game: "SuperChargers",
    source:
      "SuperChargers/In-Game Variant SuperCharger Skylanders/LegendaryAstroblast.png",
    playable: false,
  },
  {
    id: "legendary-bone-bash-roller-brawl",
    name: "Legendary Bone Bash Roller Brawl",
    element: "undead",
    role: "Legendary SuperCharger",
    game: "SuperChargers",
    source:
      "SuperChargers/In-Game Variant SuperCharger Skylanders/LegendaryBoneBashRollerBrawl.png",
    playable: false,
  },
  {
    id: "legendary-hurricane-jet-vac",
    name: "Legendary Hurricane Jet Vac",
    element: "air",
    role: "Legendary SuperCharger",
    game: "SuperChargers",
    source:
      "SuperChargers/In-Game Variant SuperCharger Skylanders/LegendaryHurricaneJetVac.png",
    playable: false,
  },
  {
    id: "missile-tow-dive-clops",
    name: "Missile Tow Dive Clops",
    element: "water",
    role: "SuperCharger",
    game: "SuperChargers",
    source:
      "SuperChargers/In-Game Variant SuperCharger Skylanders/MissileTowDiveClops.png",
    playable: false,
  },
  {
    id: "power-blue-splat",
    name: "Power Blue Splat",
    element: "magic",
    role: "Power Blue SuperCharger",
    game: "SuperChargers",
    source:
      "SuperChargers/In-Game Variant SuperCharger Skylanders/PowerBlueSplat.png",
    playable: false,
  },
  {
    id: "power-blue-trigger-happy",
    name: "Power Blue Trigger Happy",
    element: "tech",
    role: "Power Blue SuperCharger",
    game: "SuperChargers",
    source:
      "SuperChargers/In-Game Variant SuperCharger Skylanders/PowerBlueTriggerHappy.png",
    playable: false,
  },
  {
    id: "steel-plated-smash-hit",
    name: "Steel Plated Smash Hit",
    element: "earth",
    role: "SuperCharger",
    game: "SuperChargers",
    source:
      "SuperChargers/In-Game Variant SuperCharger Skylanders/SteelPlatedSmashHit.png",
    playable: false,
  },
  {
    id: "lightcore-bumble-blast",
    name: "LightCore Bumble Blast",
    element: "life",
    role: "Core Skylander",
    game: "Swap Force",
    source: "Swap Force/LightCore Skylanders/LightCoreBumbleBlast.png",
    playable: false,
  },
  {
    id: "lightcore-countdown",
    name: "LightCore Countdown",
    element: "tech",
    role: "Core Skylander",
    game: "Swap Force",
    source: "Swap Force/LightCore Skylanders/LightCoreCountdown.png",
    playable: false,
  },
  {
    id: "lightcore-flashwing",
    name: "LightCore Flashwing",
    element: "earth",
    role: "Core Skylander",
    game: "Swap Force",
    source: "Swap Force/LightCore Skylanders/LightCoreFlashwing.png",
    playable: false,
  },
  {
    id: "lightcore-grim-creeper",
    name: "LightCore Grim Creeper",
    element: "undead",
    role: "Core Skylander",
    game: "Swap Force",
    source: "Swap Force/LightCore Skylanders/LightCoreGrimCreeper.png",
    playable: false,
  },
  {
    id: "lightcore-smoulderdash",
    name: "LightCore Smoulderdash",
    element: "fire",
    role: "Core Skylander",
    game: "Swap Force",
    source: "Swap Force/LightCore Skylanders/LightCoreSmoulderdash.png",
    playable: false,
  },
  {
    id: "lightcore-star-strike",
    name: "LightCore Star Strike",
    element: "magic",
    role: "Core Skylander",
    game: "Swap Force",
    source: "Swap Force/LightCore Skylanders/LightCoreStarStrike.png",
    playable: false,
  },
  {
    id: "lightcore-warnado",
    name: "LightCore Warnado",
    element: "air",
    role: "Core Skylander",
    game: "Swap Force",
    source: "Swap Force/LightCore Skylanders/LightCoreWarnado.png",
    playable: false,
  },
  {
    id: "lightcore-wham-shell",
    name: "LightCore Wham Shell",
    element: "water",
    role: "Core Skylander",
    game: "Swap Force",
    source: "Swap Force/LightCore Skylanders/LightCoreWhamShell.png",
    playable: false,
  },
  {
    id: "anchors-away-gill-grunt",
    name: "Anchors Away Gill Grunt",
    element: "water",
    role: "Core Skylander",
    game: "Swap Force",
    source:
      "Swap Force/Returning (Series 2 and Series 3) Skylanders/AnchorsAwayGillGrunt.png",
    playable: false,
  },
  {
    id: "big-bang-trigger-happy",
    name: "Big Bang Trigger Happy",
    element: "tech",
    role: "Core Skylander",
    game: "Swap Force",
    source:
      "Swap Force/Returning (Series 2 and Series 3) Skylanders/BigBangTriggerHappy.png",
    playable: false,
  },
  {
    id: "blizzard-chill",
    name: "Blizzard Chill",
    element: "water",
    role: "Core Skylander",
    game: "Swap Force",
    source:
      "Swap Force/Returning (Series 2 and Series 3) Skylanders/BlizzardChill.png",
    playable: false,
  },
  {
    id: "fire-bone-hot-dog",
    name: "Fire Bone Hot Dog",
    element: "fire",
    role: "Core Skylander",
    game: "Swap Force",
    source:
      "Swap Force/Returning (Series 2 and Series 3) Skylanders/FireBoneHotDog.png",
    playable: false,
  },
  {
    id: "heavy-duty-sprocket",
    name: "Heavy Duty Sprocket",
    element: "tech",
    role: "Core Skylander",
    game: "Swap Force",
    source:
      "Swap Force/Returning (Series 2 and Series 3) Skylanders/HeavyDutySprocket.png",
    playable: false,
  },
  {
    id: "horn-blast-whirlwind",
    name: "Horn Blast Whirlwind",
    element: "air",
    role: "Core Skylander",
    game: "Swap Force",
    source:
      "Swap Force/Returning (Series 2 and Series 3) Skylanders/HornBlastWhirlwind.png",
    playable: false,
  },
  {
    id: "hyper-beam-prism-break",
    name: "Hyper Beam Prism Break",
    element: "earth",
    role: "Core Skylander",
    game: "Swap Force",
    source:
      "Swap Force/Returning (Series 2 and Series 3) Skylanders/HyperBeamPrismBreak.png",
    playable: false,
  },
  {
    id: "knockout-terrafin",
    name: "Knockout Terrafin",
    element: "earth",
    role: "Core Skylander",
    game: "Swap Force",
    source:
      "Swap Force/Returning (Series 2 and Series 3) Skylanders/KnockoutTerrafin.png",
    playable: false,
  },
  {
    id: "lava-barf-eruptor",
    name: "Lava Barf Eruptor",
    element: "fire",
    role: "Core Skylander",
    game: "Swap Force",
    source:
      "Swap Force/Returning (Series 2 and Series 3) Skylanders/LavaBarfEruptor.png",
    playable: false,
  },
  {
    id: "mega-ram-spyro",
    name: "Mega Ram Spyro",
    element: "magic",
    role: "Core Skylander",
    game: "Swap Force",
    source:
      "Swap Force/Returning (Series 2 and Series 3) Skylanders/MegaRamSpyro.png",
    playable: false,
  },
  {
    id: "ninja-stealth-elf",
    name: "Ninja Stealth Elf",
    element: "life",
    role: "Core Skylander",
    game: "Swap Force",
    source:
      "Swap Force/Returning (Series 2 and Series 3) Skylanders/NinjaStealthElf.png",
    playable: false,
  },
  {
    id: "phantom-cynder",
    name: "Phantom Cynder",
    element: "undead",
    role: "Core Skylander",
    game: "Swap Force",
    source:
      "Swap Force/Returning (Series 2 and Series 3) Skylanders/PhantomCynder.png",
    playable: false,
  },
  {
    id: "super-gulp-pop-fizz",
    name: "Super Gulp Pop Fizz",
    element: "magic",
    role: "Core Skylander",
    game: "Swap Force",
    source:
      "Swap Force/Returning (Series 2 and Series 3) Skylanders/SuperGulpPopFizz.png",
    playable: false,
  },
  {
    id: "thorn-horn-camo",
    name: "Thorn Horn Camo",
    element: "life",
    role: "Core Skylander",
    game: "Swap Force",
    source:
      "Swap Force/Returning (Series 2 and Series 3) Skylanders/ThornHornCamo.png",
    playable: false,
  },
  {
    id: "turbo-jet-vac",
    name: "Turbo Jet Vac",
    element: "air",
    role: "Core Skylander",
    game: "Swap Force",
    source:
      "Swap Force/Returning (Series 2 and Series 3) Skylanders/TurboJetVac.png",
    playable: false,
  },
  {
    id: "twin-blade-chop-chop",
    name: "Twin Blade Chop Chop",
    element: "undead",
    role: "Core Skylander",
    game: "Swap Force",
    source:
      "Swap Force/Returning (Series 2 and Series 3) Skylanders/TwinBladeChopChop.png",
    playable: false,
  },
  {
    id: "dark-blast-zone",
    name: "Dark Blast Zone",
    element: "fire",
    role: "Dark Edition SWAP Force",
    game: "Swap Force",
    source:
      "Swap Force/Skylanders SWAP Force In-Game Variants/DarkBlastZone.png",
    playable: false,
  },
  {
    id: "dark-slobber-tooth",
    name: "Dark Slobber Tooth",
    element: "earth",
    role: "Dark Edition Skylander",
    game: "Swap Force",
    source:
      "Swap Force/Skylanders SWAP Force In-Game Variants/DarkSlobberTooth.png",
    playable: false,
  },
  {
    id: "dark-stealth-elf",
    name: "Dark Stealth Elf",
    element: "life",
    role: "Dark Edition Skylander",
    game: "Swap Force",
    source:
      "Swap Force/Skylanders SWAP Force In-Game Variants/DarkStealthElf.png",
    playable: false,
  },
  {
    id: "dark-wash-buckler",
    name: "Dark Wash Buckler",
    element: "water",
    role: "Dark Edition SWAP Force",
    game: "Swap Force",
    source:
      "Swap Force/Skylanders SWAP Force In-Game Variants/DarkWashBuckler.png",
    playable: false,
  },
  {
    id: "enchanted-hoot-loop",
    name: "Enchanted Hoot Loop",
    element: "magic",
    role: "SWAP Force",
    game: "Swap Force",
    source:
      "Swap Force/Skylanders SWAP Force In-Game Variants/EnchantedHootLoop.png",
    playable: false,
  },
  {
    id: "enchanted-star-strike",
    name: "Enchanted Star Strike",
    element: "magic",
    role: "Skylander",
    game: "Swap Force",
    source:
      "Swap Force/Skylanders SWAP Force In-Game Variants/EnchantedStarStrike.png",
    playable: false,
  },
  {
    id: "jade-fire-kraken",
    name: "Jade Fire Kraken",
    element: "fire",
    role: "SWAP Force",
    game: "Swap Force",
    source:
      "Swap Force/Skylanders SWAP Force In-Game Variants/JadeFireKraken.png",
    playable: false,
  },
  {
    id: "jolly-bumble-blast",
    name: "Jolly-Bumble Blast",
    element: "life",
    role: "Core Skylander",
    game: "Swap Force",
    source:
      "Swap Force/Skylanders SWAP Force In-Game Variants/Jolly-BumbleBlast.png",
    playable: false,
  },
  {
    id: "kickoff-countdown",
    name: "Kickoff Countdown",
    element: "tech",
    role: "Skylander",
    game: "Swap Force",
    source:
      "Swap Force/Skylanders SWAP Force In-Game Variants/KickoffCountdown.png",
    playable: false,
  },
  {
    id: "legendary-free-ranger",
    name: "Legendary Free Ranger",
    element: "air",
    role: "Legendary SWAP Force",
    game: "Swap Force",
    source:
      "Swap Force/Skylanders SWAP Force In-Game Variants/LegendaryFreeRanger.png",
    playable: false,
  },
  {
    id: "legendary-lightcore-grim-creeper",
    name: "Legendary LightCore Grim Creeper",
    element: "undead",
    role: "Legendary Skylander",
    game: "Swap Force",
    source:
      "Swap Force/Skylanders SWAP Force In-Game Variants/LegendaryLightCoreGrimCreeper.png",
    playable: false,
  },
  {
    id: "legendary-night-shift",
    name: "Legendary Night Shift",
    element: "undead",
    role: "Legendary SWAP Force",
    game: "Swap Force",
    source:
      "Swap Force/Skylanders SWAP Force In-Game Variants/LegendaryNightShift.png",
    playable: false,
  },
  {
    id: "legendary-zoo-lou",
    name: "Legendary Zoo Lou",
    element: "life",
    role: "Legendary Skylander",
    game: "Swap Force",
    source:
      "Swap Force/Skylanders SWAP Force In-Game Variants/LegendaryZooLou.png",
    playable: false,
  },
  {
    id: "nitro-freeze-blade",
    name: "Nitro Freeze Blade",
    element: "water",
    role: "Nitro SWAP Force",
    game: "Swap Force",
    source:
      "Swap Force/Skylanders SWAP Force In-Game Variants/NitroFreezeBlade.png",
    playable: false,
  },
  {
    id: "nitro-magna-charge",
    name: "Nitro Magna Charge",
    element: "tech",
    role: "SWAP Force",
    game: "Swap Force",
    source:
      "Swap Force/Skylanders SWAP Force In-Game Variants/NitroMagnaCharge.png",
    playable: false,
  },
  {
    id: "quickdraw-rattle-shake",
    name: "Quickdraw Rattle Shake",
    element: "undead",
    role: "SWAP Force",
    game: "Swap Force",
    source:
      "Swap Force/Skylanders SWAP Force In-Game Variants/QuickdrawRattleShake.png",
    playable: false,
  },
  {
    id: "springtime-trigger-happy",
    name: "Springtime Trigger Happy",
    element: "tech",
    role: "Skylander",
    game: "Swap Force",
    source:
      "Swap Force/Skylanders SWAP Force In-Game Variants/SpringtimeTriggerHappy.png",
    playable: false,
  },
  {
    id: "volcanic-eruptor",
    name: "Volcanic Eruptor",
    element: "fire",
    role: "Core Skylander",
    game: "Swap Force",
    source:
      "Swap Force/Skylanders SWAP Force In-Game Variants/VolcanicEruptor.png",
    playable: false,
  },
  {
    id: "fizzy-frenzy-pop-fizz",
    name: "Fizzy Frenzy Pop Fizz",
    element: "magic",
    role: "Core Skylander",
    game: "Trap Team",
    source:
      "Trap Team/Returning (Series 2, 3, and 4) Skylanders/FizzyFrenzyPopFizz.png",
    playable: false,
  },
  {
    id: "full-blast-jet-vac",
    name: "Full Blast Jet Vac",
    element: "air",
    role: "Core Skylander",
    game: "Trap Team",
    source:
      "Trap Team/Returning (Series 2, 3, and 4) Skylanders/FullBlastJetVac.png",
    playable: false,
  },
  {
    id: "hog-wild-fryno",
    name: "Hog Wild Fryno",
    element: "fire",
    role: "Core Skylander",
    game: "Trap Team",
    source:
      "Trap Team/Returning (Series 2, 3, and 4) Skylanders/HogWildFryno.png",
    playable: false,
  },
  {
    id: "sure-shot-shroomboom",
    name: "Sure Shot Shroomboom",
    element: "life",
    role: "Core Skylander",
    game: "Trap Team",
    source:
      "Trap Team/Returning (Series 2, 3, and 4) Skylanders/SureShotShroomboom.png",
    playable: false,
  },
  {
    id: "tidal-wave-gill-grunt",
    name: "Tidal Wave Gill Grunt",
    element: "water",
    role: "Core Skylander",
    game: "Trap Team",
    source:
      "Trap Team/Returning (Series 2, 3, and 4) Skylanders/TidalWaveGillGrunt.png",
    playable: false,
  },
  {
    id: "dark-food-fight",
    name: "Dark Food Fight",
    element: "life",
    role: "Dark Edition Skylander",
    game: "Trap Team",
    source: "Trap Team/Skylanders Trap Team In-Game Variants/DarkFoodFight.png",
    playable: false,
  },
  {
    id: "dark-snap-shot",
    name: "Dark Snap Shot",
    element: "water",
    role: "Dark Edition Trap Master",
    game: "Trap Team",
    source: "Trap Team/Skylanders Trap Team In-Game Variants/DarkSnapShot.png",
    playable: false,
  },
  {
    id: "dark-wild-fire",
    name: "Dark Wild Fire",
    element: "fire",
    role: "Dark Edition Trap Master",
    game: "Trap Team",
    source: "Trap Team/Skylanders Trap Team In-Game Variants/DarkWildFire.png",
    playable: false,
  },
  {
    id: "eggscellent-weeruptor",
    name: "Eggscellent Weeruptor",
    element: "fire",
    role: "Mini",
    game: "Trap Team",
    source:
      "Trap Team/Skylanders Trap Team In-Game Variants/EggscellentWeeruptor.png",
    playable: false,
  },
  {
    id: "gnarly-barkley",
    name: "Gnarly Barkley",
    element: "life",
    role: "Sidekick / Mini",
    game: "Trap Team",
    source: "Trap Team/Skylanders Trap Team In-Game Variants/GnarlyBarkley.png",
    playable: false,
  },
  {
    id: "king-cobra-cadabra",
    name: "King Cobra Cadabra",
    element: "magic",
    role: "Core Skylander",
    game: "Trap Team",
    source:
      "Trap Team/Skylanders Trap Team In-Game Variants/KingCobraCadabra.png",
    playable: false,
  },
  {
    id: "legendary-blades",
    name: "Legendary Blades",
    element: "air",
    role: "Legendary Skylander",
    game: "Trap Team",
    source:
      "Trap Team/Skylanders Trap Team In-Game Variants/LegendaryBlades.png",
    playable: false,
  },
  {
    id: "legendary-bushwhack",
    name: "Legendary Bushwhack",
    element: "life",
    role: "Legendary Trap Master",
    game: "Trap Team",
    source:
      "Trap Team/Skylanders Trap Team In-Game Variants/LegendaryBushwhack.png",
    playable: false,
  },
  {
    id: "legendary-deja-vu",
    name: "Legendary Deja Vu",
    element: "magic",
    role: "Legendary Skylander",
    game: "Trap Team",
    source:
      "Trap Team/Skylanders Trap Team In-Game Variants/LegendaryDejaVu.png",
    playable: false,
  },
  {
    id: "legendary-jawbreaker",
    name: "Legendary Jawbreaker",
    element: "tech",
    role: "Legendary Trap Master",
    game: "Trap Team",
    source:
      "Trap Team/Skylanders Trap Team In-Game Variants/LegendaryJawbreaker.png",
    playable: false,
  },
  {
    id: "love-potion-pop-fizz",
    name: "Love Potion Pop Fizz",
    element: "magic",
    role: "Skylander",
    game: "Trap Team",
    source:
      "Trap Team/Skylanders Trap Team In-Game Variants/LovePotionPopFizz.png",
    playable: false,
  },
  {
    id: "nitro-head-rush",
    name: "Nitro Head Rush",
    element: "earth",
    role: "Nitro Trap Master",
    game: "Trap Team",
    source: "Trap Team/Skylanders Trap Team In-Game Variants/NitroHeadRush.png",
    playable: false,
  },
  {
    id: "nitro-krypt-king",
    name: "Nitro Krypt King",
    element: "undead",
    role: "Nitro Trap Master",
    game: "Trap Team",
    source:
      "Trap Team/Skylanders Trap Team In-Game Variants/NitroKryptKing.png",
    playable: false,
  },
  {
    id: "power-punch-pet-vac",
    name: "Power Punch Pet Vac",
    element: "air",
    role: "Mini",
    game: "Trap Team",
    source:
      "Trap Team/Skylanders Trap Team In-Game Variants/PowerPunchPetVac.png",
    playable: false,
  },
  {
    id: "winterfest-lob-star",
    name: "Winterfest Lob Star",
    element: "water",
    role: "Trap Master",
    game: "Trap Team",
    source:
      "Trap Team/Skylanders Trap Team In-Game Variants/WinterfestLobStar.png",
    playable: false,
  },
  {
    id: "enemy-drow-lance-master",
    name: "Drow Lance Master",
    element: "neutral",
    role: "Enemy",
    game: "Giants",
    source: "legacy:drow-lance-master-2",
    playable: true,
  },
  {
    id: "enemy-mohawk-cyclops",
    name: "Mohawk Cyclops",
    element: "neutral",
    role: "Enemy",
    game: "Giants",
    source: "legacy:mohawk-cyclops-2",
    playable: true,
  },
  {
    id: "enemy-mace-major",
    name: "Mace Major",
    element: "neutral",
    role: "Enemy",
    game: "Giants",
    source: "legacy:mace-major-2",
    playable: true,
  },
  {
    id: "enemy-drow-archer",
    name: "Drow Archer",
    element: "neutral",
    role: "Enemy",
    game: "Giants",
    source: "legacy:drow-archer-2",
    playable: true,
  },
  {
    id: "enemy-blaster-troll",
    name: "Blaster Troll",
    element: "neutral",
    role: "Enemy",
    game: "Giants",
    source: "legacy:blaster-troll-2",
    playable: true,
  },
  {
    id: "enemy-chompy-bot",
    name: "Chompy Bot",
    element: "neutral",
    role: "Enemy",
    game: "Giants",
    source: "legacy:chompy-bot-9000",
    playable: true,
  },
  {
    id: "enemy-chompy-bot-9000",
    name: "Chompy Bot 9000",
    element: "neutral",
    role: "Enemy",
    game: "Giants",
    source: "legacy:chompy-bot-9000-4",
    playable: true,
  },
  {
    id: "enemy-arkeyan-jouster",
    name: "Arkeyan Jouster",
    element: "neutral",
    role: "Enemy",
    game: "Giants",
    source: "legacy:arkeyan-jouster-3",
    playable: true,
  },
  {
    id: "enemy-inhuman-shield",
    name: "Inhuman Shield",
    element: "neutral",
    role: "Enemy",
    game: "Giants",
    source: "legacy:inhuman-shield-3",
    playable: true,
  },
  {
    id: "enemy-d-riveter",
    name: "D. Riveter",
    element: "neutral",
    role: "Enemy",
    game: "Giants",
    source: "legacy:d-riveter-3",
    playable: true,
  },
  {
    id: "enemy-jawbreaker",
    name: "Jawbreaker (Troll)",
    element: "neutral",
    role: "Enemy",
    game: "Giants",
    source: "legacy:jawbreaker-3",
    playable: true,
  },
  {
    id: "enemy-enfuego-chompy",
    name: "Enfuego Chompy",
    element: "fire",
    role: "Enemy",
    game: "Giants",
    source: "legacy:enfuego-chompy-2",
    playable: true,
  },
  {
    id: "enemy-frigid-chompy",
    name: "Frigid Chompy",
    element: "water",
    role: "Enemy",
    game: "Giants",
    source: "legacy:frigid-chompy-2",
    playable: true,
  },
  {
    id: "enemy-spiderlings",
    name: "Spiderlings",
    element: "neutral",
    role: "Enemy",
    game: "Giants",
    source: "legacy:spiderlings-2",
    playable: true,
  },
  {
    id: "enemy-chompy",
    name: "Chompy",
    element: "earth",
    role: "Enemy",
    game: "Giants",
    source: "legacy:chompy-2",
    playable: true,
  },
  {
    id: "enemy-axecutioner",
    name: "Axecutioner",
    element: "neutral",
    role: "Enemy",
    game: "Giants",
    source: "legacy:axecutioner",
    playable: true,
  },
  {
    id: "enemy-arkeyan-duelist",
    name: "Arkeyan Duelist",
    element: "neutral",
    role: "Enemy",
    game: "Giants",
    source: "legacy:arkeyan-duelist",
    playable: true,
  },
  {
    id: "enemy-bag-o-boom",
    name: "Bag O' Boom",
    element: "neutral",
    role: "Enemy",
    game: "Giants",
    source: "legacy:bag-o-boom",
    playable: true,
  },
  {
    id: "enemy-shadow-duke",
    name: "Shadow Duke",
    element: "neutral",
    role: "Enemy",
    game: "Giants",
    source: "legacy:shadow-duke",
    playable: true,
  },
  {
    id: "enemy-arkeyan-sniper",
    name: "Arkeyan Sniper",
    element: "neutral",
    role: "Enemy",
    game: "Giants",
    source: "legacy:arkeyan-sniper",
    playable: true,
  },
  {
    id: "enemy-conquertron",
    name: "CONQUERTRON",
    element: "neutral",
    role: "Enemy",
    game: "Giants",
    source: "legacy:conquertron",
    playable: true,
  },
  {
    id: "enemy-arkeyan-bomber",
    name: "Arkeyan Bomber",
    element: "air",
    role: "Enemy",
    game: "Giants",
    source: "legacy:arkeyan-bomber",
    playable: true,
  },
  {
    id: "enemy-boulder-bowler",
    name: "Boulder Bowler",
    element: "earth",
    role: "Enemy",
    game: "Giants",
    source: "legacy:boulder-bowler",
    playable: true,
  },
  {
    id: "enemy-boom-fiend",
    name: "Boom Fiend",
    element: "fire",
    role: "Enemy",
    game: "Giants",
    source: "legacy:boom-fiend",
    playable: true,
  },
  {
    id: "enemy-armored-chompy",
    name: "Armored Chompy",
    element: "water",
    role: "Enemy",
    game: "Giants",
    source: "legacy:armored-chompy",
    playable: true,
  },
  {
    id: "enemy-life-spell-punk",
    name: "Life Spell Punk",
    element: "magic",
    role: "Enemy",
    game: "Giants",
    source: "legacy:life-spell-punk",
    playable: true,
  },
  {
    id: "enemy-grenade-general",
    name: "Grenade General",
    element: "tech",
    role: "Enemy",
    game: "Giants",
    source: "legacy:grenade-general",
    playable: true,
  },
  {
    id: "enemy-root-runner",
    name: "Root Runner",
    element: "life",
    role: "Enemy",
    game: "Giants",
    source: "legacy:root-runner",
    playable: true,
  },
  {
    id: "enemy-trog-wanderer",
    name: "Trog Wanderer",
    element: "undead",
    role: "Enemy",
    game: "Giants",
    source: "legacy:trog-wanderer",
    playable: true,
  },
  {
    id: "enemy-dragonet",
    name: "Dragonet",
    element: "air",
    role: "Enemy",
    game: "Giants",
    source: "legacy:dragonet",
    playable: true,
  },
  {
    id: "enemy-crystal-golem",
    name: "Crystal Golem",
    element: "earth",
    role: "Enemy",
    game: "Giants",
    source: "legacy:crystal-golem",
    playable: true,
  },
  {
    id: "enemy-blazer-brewer",
    name: "Blazer Brewer",
    element: "fire",
    role: "Enemy",
    game: "Giants",
    source: "legacy:blazer-brewer",
    playable: true,
  },
  {
    id: "enemy-slobbering-mutticus",
    name: "Slobbering Mutticus",
    element: "water",
    role: "Enemy",
    game: "Giants",
    source: "legacy:slobbering-mutticus",
    playable: true,
  },
  {
    id: "enemy-arkeyan-crackler",
    name: "Arkeyan Crackler",
    element: "magic",
    role: "Enemy",
    game: "Giants",
    source: "legacy:arkeyan-crackler",
    playable: true,
  },
  {
    id: "enemy-arkeyan-shield-juggernaut",
    name: "Arkeyan Shield Juggernaut",
    element: "tech",
    role: "Enemy",
    game: "Giants",
    source: "legacy:arkeyan-shield-juggernaut",
    playable: true,
  },
  {
    id: "enemy-goliath-drow",
    name: "Goliath Drow",
    element: "life",
    role: "Enemy",
    game: "Giants",
    source: "legacy:goliath-drow",
    playable: true,
  },
  {
    id: "enemy-gargantula",
    name: "Gargantula",
    element: "undead",
    role: "Enemy",
    game: "Giants",
    source: "legacy:gargantula",
    playable: true,
  },
  {
    id: "enemy-trogmander",
    name: "Trogmander",
    element: "magic",
    role: "Enemy",
    game: "Giants",
    source: "legacy:trogmander",
    playable: true,
  },
  {
    id: "enemy-arkeyan-ultron",
    name: "Arkeyan Ultron",
    element: "tech",
    role: "Enemy",
    game: "Giants",
    source: "legacy:arkeyan-ultron",
    playable: true,
  },
  ...SUPERCHARGER_PORTRAITS,
];
export const CHARACTER_STONES: Stone[] = [
  {
    id: "emberwing",
    name: "Spyro",
    element: "magic",
    creature: "dragon",
    edges: [3, 1, 1, 2],
    description:
      "A purple dragon with fiery breath, charging horns, and a talent for turning trouble into an adventure.",
    origin: "skylanders",
    portrait: "spyro",
    keywords: [
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-fire-spark",
        count: 1,
        recipient: "self",
      },
      {
        type: "head-start",
        side: 0,
        amount: 1,
      },
    ],
  },
  {
    id: "mossback",
    name: "Stump Smash",
    element: "life",
    creature: "dragon",
    edges: [1, 2, 2, 1],
    description:
      "An awakened tree stump with wooden hammer fists and a very personal objection to forest destruction.",
    origin: "skylanders",
    portrait: "stump-smash",
    keywords: [
      {
        type: "resonance",
        side: 1,
        element: "life",
      },
      {
        type: "shield",
        side: 3,
        amount: 1,
      },
    ],
  },
  {
    id: "tidecaller",
    name: "Gill Grunt",
    element: "water",
    creature: "dragon",
    edges: [2, 0, 2, 3],
    description:
      "A harpoon-wielding fish soldier whose water jetpack keeps him moving wherever the battle flows.",
    origin: "skylanders",
    portrait: "gill-grunt",
    keywords: [
      {
        type: "shield",
        side: 3,
        amount: 1,
      },
      {
        type: "comeback",
        side: 1,
        amount: 1,
      },
    ],
  },
  {
    id: "nocturne",
    name: "Double Trouble",
    element: "magic",
    creature: "dragon",
    edges: [3, 0, 3, 1],
    description:
      "A floating tiki spellcaster whose enchanted staff and tiny doubles make one opponent feel outnumbered.",
    origin: "skylanders",
    portrait: "double-trouble",
    keywords: [
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-magic-echo",
        count: 2,
        recipient: "self",
      },
      {
        type: "combo",
        pips: [
          {
            side: 2,
            amount: 1,
          },
        ],
        keywords: [
          {
            type: "shield",
            side: 0,
            amount: 1,
          },
        ],
      },
    ],
  },
  {
    id: "sunfox",
    name: "Bash",
    element: "earth",
    creature: "dragon",
    edges: [2, 3, 1, 2],
    description:
      "A rock-armored dragon who rolls through obstacles and delivers the finishing argument with his tail.",
    origin: "skylanders",
    portrait: "bash",
    keywords: [
      {
        type: "shield",
        side: 1,
        amount: 2,
      },
      {
        type: "sunder",
        side: "any",
        amount: 2,
      },
    ],
  },
  {
    id: "pebble",
    name: "Prism Break",
    element: "earth",
    creature: "dragon",
    edges: [2, 1, 2, 0],
    description:
      "A crystal golem who splits powerful light beams through the glittering prisms growing from his arms.",
    origin: "skylanders",
    portrait: "prism-break",
    keywords: [
      {
        type: "shield",
        side: 0,
        amount: 1,
      },
      {
        type: "environment",
        environment: {
          kind: "bastion",
          amount: 1,
        },
      },
    ],
  },
  {
    id: "cloudpaws",
    name: "Whirlwind",
    element: "air",
    creature: "dragon",
    edges: [3, 1, 1, 1],
    description:
      "A dragon-unicorn whose rainbows and storm clouds bring a surprisingly colorful kind of weather.",
    origin: "skylanders",
    portrait: "whirlwind",
    keywords: [
      {
        type: "shift",
        side: 0,
        direction: 1,
        affects: "enemies",
      },
      {
        type: "head-start",
        side: 2,
        amount: 1,
      },
    ],
  },
  {
    id: "glowcap",
    name: "Shroomboom",
    element: "life",
    creature: "dragon",
    edges: [1, 1, 2, 3],
    description:
      "A one-eyed mushroom who launches fellow fungi from a slingshot and refuses to stay in the shade.",
    origin: "skylanders",
    portrait: "shroomboom",
    keywords: [
      {
        type: "resonance",
        side: 3,
        element: "life",
      },
      {
        type: "environment",
        environment: {
          kind: "elemental",
          element: "life",
          side: "all",
          amount: 1,
        },
      },
    ],
  },
  {
    id: "cinder",
    name: "Flameslinger",
    element: "fire",
    creature: "dragon",
    edges: [1, 0, 3, 3],
    description:
      "A blindfolded elf archer whose blazing arrows and incredible speed make every shot feel like a trick shot.",
    origin: "skylanders",
    portrait: "flameslinger",
    keywords: [
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-fire-spark",
        count: 1,
        recipient: "self",
      },
      {
        type: "discard",
        mode: "random",
        recipient: "opponent",
        count: 1,
      },
      {
        type: "head-start",
        side: 2,
        amount: 1,
      },
    ],
  },
  {
    id: "moonwatch",
    name: "Jet-Vac",
    element: "air",
    creature: "dragon",
    edges: [2, 3, 2, 1],
    description:
      "A brave bird pilot who trades his natural flight for a vacuum blaster and a very dependable jetpack.",
    origin: "skylanders",
    portrait: "jet-vac",
    keywords: [
      {
        type: "shift",
        side: 1,
        direction: 2,
        affects: "allies",
      },
      {
        type: "environment",
        environment: {
          kind: "crosswind",
        },
      },
    ],
  },
  {
    id: "seasprout",
    name: "Zap",
    element: "water",
    creature: "dragon",
    edges: [2, 0, 0, 2],
    description:
      "An electric sea dragon who lays down water trails and gives pursuers a shocking reason to stay back.",
    origin: "skylanders",
    portrait: "zap",
    keywords: [
      {
        type: "shield",
        side: 0,
        amount: 1,
      },
      {
        type: "next-play",
        side: 2,
        amount: -1,
        recipient: "opponent",
      },
    ],
  },
  {
    id: "stardust",
    name: "Stealth Elf",
    element: "life",
    creature: "dragon",
    edges: [2, 1, 0, 2],
    description:
      "An elusive elven ninja who leaves a decoy behind and lets her blades arrive from somewhere else.",
    origin: "skylanders",
    portrait: "stealth-elf",
    keywords: [
      {
        type: "resonance",
        side: 0,
        element: "life",
      },
      {
        type: "shift",
        side: 2,
        direction: 3,
        affects: "enemies",
      },
    ],
  },
  {
    id: "skylander-air-strike",
    name: "Air Strike",
    element: "air",
    creature: "dragon",
    edges: [2, 2, 1, 0],
    description:
      "A swift martial artist who fights beside Birdie, turning teamwork into a perfectly timed aerial strike.",
    origin: "skylanders",
    portrait: "air-strike",
    keywords: [
      {
        type: "shift",
        side: 0,
        direction: 1,
        affects: "enemies",
      },
      {
        type: "next-play",
        side: 2,
        amount: 1,
        recipient: "self",
        element: "air",
      },
    ],
  },
  {
    id: "skylander-ambush",
    name: "Ambush",
    element: "life",
    creature: "dragon",
    edges: [3, 1, 1, 1],
    description:
      "A bamboo swordsman who guards the forest with the patience of a tree and the speed of a falling leaf.",
    origin: "skylanders",
    portrait: "ambush",
    keywords: [
      {
        type: "resonance",
        side: 0,
        element: "life",
      },
      {
        type: "combo",
        pips: [
          {
            side: 2,
            amount: 1,
          },
        ],
      },
    ],
  },
  {
    id: "skylander-astroblast",
    name: "Astroblast",
    element: "light",
    creature: "dragon",
    edges: [1, 1, 3, 2],
    description:
      "A crystal-armored space ranger whose laser rifle and low-gravity leaps bring a cosmic edge to combat.",
    origin: "skylanders",
    portrait: "astroblast",
    keywords: [
      {
        type: "next-play",
        side: 2,
        amount: 1,
        recipient: "self",
        keywords: [
          {
            type: "shield",
            side: 0,
            amount: 1,
          },
        ],
      },
      {
        type: "shield",
        side: 2,
        amount: 1,
      },
    ],
  },
  {
    id: "skylander-aurora",
    name: "Aurora",
    element: "light",
    creature: "dragon",
    edges: [1, 3, 1, 1],
    description:
      "A lightning-fast light warrior whose twin blades turn a brilliant flash into a perfectly timed strike.",
    origin: "skylanders",
    portrait: "aurora",
    keywords: [
      {
        type: "next-play",
        side: 1,
        amount: 1,
        recipient: "self",
        keywords: [
          {
            type: "shield",
            side: 3,
            amount: 1,
          },
        ],
      },
      {
        type: "shield",
        side: 1,
        amount: 1,
      },
    ],
  },
  {
    id: "skylander-bad-juju",
    name: "Bad Juju",
    element: "air",
    creature: "dragon",
    edges: [2, 4, 1, 1],
    description:
      "A storm spirit who brings a sharp blade, wild winds, and her devoted little partner Juju Junior.",
    origin: "skylanders",
    portrait: "bad-juju",
    keywords: [
      {
        type: "shift",
        side: 1,
        direction: 2,
        affects: "allies",
      },
      {
        type: "combo",
        pips: [
          {
            side: 3,
            amount: 1,
          },
        ],
      },
    ],
  },
  {
    id: "skylander-barbella",
    name: "Barbella",
    element: "earth",
    creature: "dragon",
    edges: [2, 0, 3, 2],
    description:
      "A stone-powered weightlifter whose enormous barbell makes heavy lifting everyone else's problem.",
    origin: "skylanders",
    portrait: "barbella",
    keywords: [
      {
        type: "shield",
        side: 2,
        amount: 1,
      },
      {
        type: "environment",
        environment: {
          kind: "equalizer",
        },
      },
    ],
  },
  {
    id: "skylander-barkley",
    name: "Barkley",
    element: "life",
    creature: "dragon",
    edges: [1, 1, 1, 1],
    description:
      "A little sapling following in Tree Rex's enormous footsteps, one determined stomp at a time.",
    origin: "skylanders",
    portrait: "barkley",
    keywords: [],
  },
  {
    id: "skylander-bat-spin",
    name: "Bat Spin",
    element: "undead",
    creature: "dragon",
    edges: [2, 2, 2, 2],
    description:
      "A bat-summoning vampire who whirls her staff and takes wing when the fight needs a different perspective.",
    origin: "skylanders",
    portrait: "bat-spin",
    keywords: [
      {
        type: "sunder",
        side: "any",
        amount: 1,
      },
      {
        type: "silence",
      },
    ],
  },
  {
    id: "skylander-big-bubble-pop-fizz",
    name: "Big Bubble Pop Fizz",
    element: "magic",
    creature: "dragon",
    edges: [2, 1, 2, 2],
    description:
      "An alchemist with an oversized bubble horn, a volatile potion supply, and very little concern for the mess.",
    origin: "skylanders",
    portrait: "big-bubble-pop-fizz",
    keywords: [
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-magic-echo",
        count: 1,
        recipient: "self",
      },
      {
        type: "dizzy",
        sides: [0, 1],
      },
    ],
  },
  {
    id: "skylander-blackout",
    name: "Blackout",
    element: "dark",
    creature: "dragon",
    edges: [0, 2, 2, 1],
    description:
      "A dark dragon who folds the battlefield into shadowy vortices and strikes from the edge of the darkness.",
    origin: "skylanders",
    portrait: "blackout",
    keywords: [
      {
        type: "silence",
      },
      {
        type: "head-start",
        side: 1,
        amount: 1,
      },
    ],
  },
  {
    id: "skylander-blades",
    name: "Blades",
    element: "air",
    creature: "dragon",
    edges: [2, 1, 1, 3],
    description:
      "An armored dragon whose sweeping wings and sharp sword make even the air around him dangerous.",
    origin: "skylanders",
    portrait: "blades",
    keywords: [
      {
        type: "shift",
        side: 3,
        direction: 0,
        affects: "enemies",
      },
      {
        type: "head-start",
        side: 1,
        amount: 1,
      },
    ],
  },
  {
    id: "skylander-blast-zone",
    name: "Blast Zone",
    element: "fire",
    creature: "dragon",
    edges: [2, 2, 2, 1],
    description:
      "A bomb-throwing knight whose rocket legs keep the explosions moving in exactly the right direction.",
    origin: "skylanders",
    portrait: "blast-zone",
    keywords: [
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-fire-spark",
        count: 2,
        recipient: "self",
        half: "top",
      },
      {
        type: "discard",
        mode: "random",
        recipient: "self",
        count: 1,
        half: "bottom",
      },
      {
        type: "scavenge",
        from: "self",
        pips: [
          {
            side: 0,
            amount: 1,
          },
        ],
        half: "top",
      },
    ],
  },
  {
    id: "skylander-blaster-tron",
    name: "Blaster-Tron",
    element: "light",
    creature: "dragon",
    edges: [2, 1, 3, 1],
    description:
      "A polished battle robot whose energy sword and jet-assisted strikes make precision look effortless.",
    origin: "skylanders",
    portrait: "blaster-tron",
    keywords: [
      {
        type: "next-play",
        side: 2,
        amount: 1,
        recipient: "self",
        keywords: [
          {
            type: "shield",
            side: 0,
            amount: 1,
          },
        ],
      },
      {
        type: "shield",
        side: 2,
        amount: 1,
      },
    ],
  },
  {
    id: "skylander-blastermind",
    name: "Blastermind",
    element: "magic",
    creature: "dragon",
    edges: [1, 2, 2, 2],
    description:
      "Crystal-powered mind tricks let this small magician take control of a much bigger situation.",
    origin: "skylanders",
    portrait: "blastermind",
    keywords: [
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-magic-echo",
        count: 1,
        recipient: "self",
      },
      {
        type: "dizzy",
        sides: [3],
      },
    ],
  },
  {
    id: "skylander-bone-bash-roller-brawl",
    name: "Bone Bash Roller Brawl",
    element: "undead",
    creature: "dragon",
    edges: [2, 1, 3, 1],
    description:
      "Roller Brawl straps on bone-covered wheels and brings even sharper moves to the derby.",
    origin: "skylanders",
    portrait: "bone-bash-roller-brawl",
    keywords: [
      {
        type: "next-play",
        side: "all",
        amount: -1,
        recipient: "opponent",
      },
    ],
  },
  {
    id: "skylander-boom-bloom",
    name: "Boom Bloom",
    element: "life",
    creature: "dragon",
    edges: [0, 1, 3, 1],
    description:
      "A plant-powered fighter whose thorny whip and blooming traps make the ground itself an accomplice.",
    origin: "skylanders",
    portrait: "boom-bloom",
    keywords: [
      {
        type: "resonance",
        side: 2,
        element: "life",
      },
      {
        type: "environment",
        environment: {
          kind: "elemental",
          element: "life",
          side: "all",
          amount: 1,
        },
      },
    ],
  },
  {
    id: "skylander-boom-jet",
    name: "Boom Jet",
    element: "air",
    creature: "dragon",
    edges: [0, 2, 1, 2],
    description:
      "A daredevil bomber who rides an airborne board and delivers surprises from directly overhead.",
    origin: "skylanders",
    portrait: "boom-jet",
    keywords: [
      {
        type: "next-play",
        side: 0,
        amount: 1,
        recipient: "self",
        half: "top",
      },
      {
        type: "shift",
        side: 2,
        direction: 3,
        affects: "both",
        half: "bottom",
      },
    ],
  },
  {
    id: "skylander-boomer",
    name: "Boomer",
    element: "tech",
    creature: "dragon",
    edges: [1, 1, 1, 3],
    description:
      "A demolition-loving troll who prefers to solve problems with dynamite and a pair of heavy fists.",
    origin: "skylanders",
    portrait: "boomer",
    keywords: [
      {
        type: "combo",
        pips: [
          {
            side: 3,
            amount: 1,
          },
        ],
      },
      {
        type: "next-play",
        side: 1,
        amount: 1,
        recipient: "self",
      },
    ],
  },
  {
    id: "skylander-bop",
    name: "Bop",
    element: "earth",
    creature: "dragon",
    edges: [1, 1, 1, 1],
    description:
      "A tiny armored dragon who follows Bash's example: curl up, roll forward, and let the rocks do the talking.",
    origin: "skylanders",
    portrait: "bop",
    keywords: [],
  },
  {
    id: "skylander-bouncer",
    name: "Bouncer",
    element: "tech",
    creature: "dragon",
    edges: [3, 3, 2, 3],
    description:
      "A towering robot who fires from his fingers, watches with laser eyes, and never lets a good target escape.",
    origin: "skylanders",
    portrait: "bouncer",
    keywords: [
      {
        type: "shield",
        side: 2,
        amount: 2,
      },
    ],
  },
  {
    id: "skylander-breeze",
    name: "Breeze",
    element: "air",
    creature: "dragon",
    edges: [1, 1, 1, 1],
    description:
      "A little dragon-unicorn who packs a full rainbow and a stubborn gust into a very small storm.",
    origin: "skylanders",
    portrait: "breeze",
    keywords: [],
  },
  {
    id: "skylander-buckshot",
    name: "Buckshot",
    element: "magic",
    creature: "dragon",
    edges: [3, 3, 0, 1],
    description:
      "A faun archer whose magical arrows and portals make a straight shot the least predictable option.",
    origin: "skylanders",
    portrait: "buckshot",
    keywords: [
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-magic-echo",
        count: 1,
        recipient: "self",
      },
      {
        type: "shift",
        side: 2,
        direction: 3,
        affects: "both",
      },
    ],
  },
  {
    id: "skylander-bumble-blast",
    name: "Bumble Blast",
    element: "life",
    creature: "dragon",
    edges: [2, 1, 2, 3],
    description:
      "A walking beehive who coats foes in honey and lets his buzzing friends finish the introductions.",
    origin: "skylanders",
    portrait: "bumble-blast",
    keywords: [
      {
        type: "resonance",
        side: 3,
        element: "life",
      },
      {
        type: "next-play",
        side: "all",
        amount: 1,
        recipient: "self",
        element: "life",
      },
    ],
  },
  {
    id: "skylander-bushwhack",
    name: "Bushwhack",
    element: "life",
    creature: "dragon",
    edges: [3, 3, 0, 0],
    description:
      "A forest guardian with a huge Traptanium axe and an excellent understanding of where to make the cut.",
    origin: "skylanders",
    portrait: "bushwhack",
    keywords: [
      {
        type: "resonance",
        side: 0,
        element: "life",
      },
      {
        type: "combo",
        pips: [
          {
            side: 2,
            amount: 1,
          },
        ],
      },
    ],
  },
  {
    id: "skylander-camo",
    name: "Camo",
    element: "life",
    creature: "dragon",
    edges: [2, 1, 1, 2],
    description:
      "A leafy dragon whose vines and explosive fruit turn an innocent-looking garden into an ambush.",
    origin: "skylanders",
    portrait: "camo",
    keywords: [
      {
        type: "resonance",
        side: 0,
        element: "life",
      },
      {
        type: "shield",
        side: 2,
        amount: 1,
      },
    ],
  },
  {
    id: "skylander-chain-reaction",
    name: "Chain Reaction",
    element: "tech",
    creature: "dragon",
    edges: [3, 0, 3, 1],
    description:
      "A roaring biker who brings twin chainsaw swords and an engine that sounds like trouble arriving.",
    origin: "skylanders",
    portrait: "chain-reaction",
    keywords: [
      {
        type: "combo",
        pips: [
          {
            side: 0,
            amount: 1,
          },
        ],
      },
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-arkeyan-drone",
        count: 1,
        recipient: "self",
      },
    ],
  },
  {
    id: "skylander-chill",
    name: "Chill",
    element: "water",
    creature: "dragon",
    edges: [2, 1, 1, 2],
    description:
      "A resolute ice guard whose javelin and frozen walls keep danger at a very chilly distance.",
    origin: "skylanders",
    portrait: "chill",
    keywords: [
      {
        type: "shield",
        side: 0,
        amount: 1,
      },
      {
        type: "environment",
        environment: {
          kind: "mirror-pool",
        },
      },
    ],
  },
  {
    id: "skylander-chompy-mage",
    name: "Chompy Mage",
    element: "life",
    creature: "dragon",
    edges: [2, 2, 2, 1],
    description:
      "A very enthusiastic friend of Chompies who can summon a crowd or become its biggest member.",
    origin: "skylanders",
    portrait: "chompy-mage",
    keywords: [
      {
        type: "resonance",
        side: 0,
        element: "life",
      },
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-chompy-seedling",
        count: 2,
        recipient: "self",
      },
    ],
  },
  {
    id: "skylander-chop-chop",
    name: "Chop Chop",
    element: "undead",
    creature: "dragon",
    edges: [2, 0, 1, 2],
    description:
      "An ancient armored skeleton who pairs a trusty sword with the stubborn defense of his shield.",
    origin: "skylanders",
    portrait: "chop-chop",
    keywords: [
      {
        type: "shield",
        side: 0,
        amount: 1,
      },
      {
        type: "sunder",
        side: 1,
        amount: 1,
      },
    ],
  },
  {
    id: "skylander-chopper",
    name: "Chopper",
    element: "tech",
    creature: "dragon",
    edges: [0, 2, 1, 1],
    description:
      "A little dinosaur who straps on a helicopter pack and answers bigger enemies with rockets from above.",
    origin: "skylanders",
    portrait: "chopper",
    keywords: [
      {
        type: "combo",
        pips: [
          {
            side: 1,
            amount: 1,
          },
        ],
      },
    ],
  },
  {
    id: "skylander-chopscotch",
    name: "Chopscotch",
    element: "undead",
    creature: "dragon",
    edges: [3, 4, 1, 0],
    description:
      "An undead girl whose enormous axe turns a game of hopscotch into a battlefield nobody wants to cross.",
    origin: "skylanders",
    portrait: "chopscotch",
    keywords: [
      {
        type: "silence",
      },
      {
        type: "next-play",
        side: 1,
        amount: -1,
        recipient: "opponent",
      },
    ],
  },
  {
    id: "skylander-cobra-cadabra",
    name: "Cobra Cadabra",
    element: "magic",
    creature: "dragon",
    edges: [2, 1, 1, 2],
    description:
      "A flute-playing cobra who charms serpents from his basket and turns every duel into a magical performance.",
    origin: "skylanders",
    portrait: "cobra-cadabra",
    keywords: [
      {
        type: "conjure",
        mode: "random",
        count: 1,
        recipient: "self",
        element: "magic",
      },
    ],
  },
  {
    id: "skylander-countdown",
    name: "Countdown",
    element: "tech",
    creature: "dragon",
    edges: [2, 1, 2, 0],
    description:
      "A walking bomb who sends out explosive little friends and refuses to let a missing head slow him down.",
    origin: "skylanders",
    portrait: "countdown",
    keywords: [
      {
        type: "combo",
        pips: [
          {
            side: 0,
            amount: 1,
          },
        ],
      },
      {
        type: "next-play",
        side: 2,
        amount: 1,
        recipient: "self",
      },
    ],
  },
  {
    id: "skylander-crash-bandicoot",
    name: "Crash Bandicoot",
    element: "life",
    creature: "dragon",
    edges: [1, 3, 3, 0],
    description:
      "An orange whirlwind of spinning kicks, bouncing crates, and cheerful disregard for anyone else's plans.",
    origin: "skylanders",
    portrait: "crash-bandicoot",
    keywords: [
      {
        type: "resonance",
        side: 1,
        element: "life",
      },
      {
        type: "next-play",
        side: "all",
        amount: 1,
        recipient: "self",
        element: "life",
      },
    ],
  },
  {
    id: "skylander-crusher",
    name: "Crusher",
    element: "earth",
    creature: "dragon",
    edges: [3, 2, 3, 3],
    description:
      "A towering stone giant whose enormous hammer can shatter rock or turn an enemy to stone.",
    origin: "skylanders",
    portrait: "crusher",
    keywords: [
      {
        type: "shield",
        side: 2,
        amount: 2,
      },
    ],
  },
  {
    id: "skylander-cynder",
    name: "Cynder",
    element: "undead",
    creature: "dragon",
    edges: [3, 0, 1, 1],
    description:
      "A spectral dragon who slips through danger as a shadow and answers with a crackling breath of lightning.",
    origin: "skylanders",
    portrait: "cynder",
    keywords: [
      {
        type: "sunder",
        side: "any",
        amount: 1,
      },
      {
        type: "silence",
      },
    ],
  },
  {
    id: "skylander-deep-dive-gill-grunt",
    name: "Deep Dive Gill Grunt",
    element: "water",
    creature: "dragon",
    edges: [0, 2, 2, 1],
    description:
      "Gill Grunt dives deeper with a powerful trident and enough water pressure to move the fight his way.",
    origin: "skylanders",
    portrait: "deep-dive-gill-grunt",
    keywords: [
      {
        type: "shield",
        side: 1,
        amount: 1,
      },
      {
        type: "next-play",
        side: 3,
        amount: 1,
        recipient: "self",
        element: "water",
      },
    ],
  },
  {
    id: "skylander-dino-rang",
    name: "Dino-Rang",
    element: "earth",
    creature: "dragon",
    edges: [2, 1, 2, 2],
    description:
      "A stone-scaled dinosaur whose returning boomerangs make cover feel temporary.",
    origin: "skylanders",
    portrait: "dino-rang",
    keywords: [
      {
        type: "shield",
        side: 0,
        amount: 1,
      },
      {
        type: "environment",
        environment: {
          kind: "equalizer",
        },
      },
    ],
  },
  {
    id: "skylander-dive-clops",
    name: "Dive-Clops",
    element: "water",
    creature: "dragon",
    edges: [2, 2, 2, 2],
    description:
      "An armored underwater cyclops who answers approaching trouble with torpedoes and depth charges.",
    origin: "skylanders",
    portrait: "dive-clops",
    keywords: [
      {
        type: "shield",
        side: 0,
        amount: 2,
      },
      {
        type: "comeback",
        side: 2,
        amount: 1,
      },
    ],
  },
  {
    id: "skylander-doom-stone",
    name: "Doom Stone",
    element: "earth",
    creature: "dragon",
    edges: [0, 3, 1, 1],
    description:
      "A stone-armored SWAP Force guardian who turns a swirling shield into a crushing counterattack.",
    origin: "skylanders",
    portrait: "doom-stone",
    keywords: [
      {
        type: "shield",
        side: 0,
        amount: 2,
        half: "top",
      },
      {
        type: "sunder",
        side: 1,
        amount: 1,
        half: "bottom",
      },
    ],
  },
  {
    id: "skylander-double-dare-trigger-happy",
    name: "Double Dare Trigger Happy",
    element: "tech",
    creature: "dragon",
    edges: [1, 2, 2, 3],
    description:
      "Trigger Happy turns his golden firepower into a daredevil act with a cannon and a spectacular finish.",
    origin: "skylanders",
    portrait: "double-dare-trigger-happy",
    keywords: [
      {
        type: "combo",
        pips: [
          {
            side: 3,
            amount: 1,
          },
        ],
      },
      {
        type: "shield",
        side: 1,
        amount: 1,
      },
    ],
  },
  {
    id: "skylander-dr-krankcase",
    name: "Dr. Krankcase",
    element: "tech",
    creature: "dragon",
    edges: [2, 1, 1, 2],
    description:
      "A mad inventor whose mechanical legs and goo-powered weapons make every duel another experiment.",
    origin: "skylanders",
    portrait: "dr-krankcase",
    keywords: [
      {
        type: "combo",
        pips: [
          {
            side: 0,
            amount: 1,
          },
        ],
      },
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-arkeyan-drone",
        count: 1,
        recipient: "self",
      },
    ],
  },
  {
    id: "skylander-dr-neo-cortex",
    name: "Dr. Neo Cortex",
    element: "tech",
    creature: "dragon",
    edges: [2, 2, 1, 2],
    description:
      "A scheming scientist who brings a ray gun, a hoverboard, and very little patience for his opponents.",
    origin: "skylanders",
    portrait: "dr-neo-cortex",
    keywords: [
      {
        type: "combo",
        pips: [
          {
            side: 0,
            amount: 1,
          },
        ],
      },
      {
        type: "sunder",
        side: "any",
        amount: 1,
      },
    ],
  },
  {
    id: "skylander-drill-sergeant",
    name: "Drill Sergeant",
    element: "tech",
    creature: "dragon",
    edges: [3, 1, 2, 1],
    description:
      "An ancient Arkeyan machine who bores through obstacles with powered drills and rocket-assisted determination.",
    origin: "skylanders",
    portrait: "drill-sergeant",
    keywords: [
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-arkeyan-drone",
        count: 1,
        recipient: "self",
      },
      {
        type: "combo",
        pips: [
          {
            side: 2,
            amount: 1,
          },
        ],
      },
    ],
  },
  {
    id: "skylander-drobit",
    name: "Drobit",
    element: "tech",
    creature: "dragon",
    edges: [1, 1, 1, 1],
    description:
      "A tiny armored dragon who takes to the air with Drobot's mechanical wings and a bright burst of laser fire.",
    origin: "skylanders",
    portrait: "drobit",
    keywords: [],
  },
  {
    id: "skylander-drobot",
    name: "Drobot",
    element: "tech",
    creature: "dragon",
    edges: [1, 2, 2, 1],
    description:
      "A dragon in a mechanical suit whose laser eyes, spinning gears, and powered wings keep every angle covered.",
    origin: "skylanders",
    portrait: "drobot",
    keywords: [
      {
        type: "combo",
        pips: [
          {
            side: 1,
            amount: 1,
          },
        ],
      },
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-arkeyan-drone",
        count: 1,
        recipient: "self",
      },
    ],
  },
  {
    id: "skylander-dune-bug",
    name: "Dune Bug",
    element: "magic",
    creature: "dragon",
    edges: [0, 2, 2, 1],
    description:
      "A scarab sorcerer who rolls trouble into a magic ball and carries it away on shimmering wings.",
    origin: "skylanders",
    portrait: "dune-bug",
    keywords: [
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-magic-echo",
        count: 1,
        recipient: "self",
      },
      {
        type: "environment",
        environment: {
          kind: "mirror-pool",
        },
      },
    ],
  },
  {
    id: "skylander-deja-vu",
    name: "Déjà Vu",
    element: "magic",
    creature: "dragon",
    edges: [2, 3, 2, 1],
    description:
      "A time-traveling sorceress who sends echoes of herself into danger and lets history repeat in her favor.",
    origin: "skylanders",
    portrait: "deja-vu",
    keywords: [
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-magic-echo",
        count: 1,
        recipient: "self",
      },
      {
        type: "dizzy",
        sides: [3],
      },
    ],
  },
  {
    id: "skylander-echo",
    name: "Echo",
    element: "water",
    creature: "dragon",
    edges: [3, 1, 1, 0],
    description:
      "A musical sea dragon whose powerful voice sends sound waves rolling through anyone in her way.",
    origin: "skylanders",
    portrait: "echo",
    keywords: [
      {
        type: "shield",
        side: 0,
        amount: 1,
      },
      {
        type: "environment",
        environment: {
          kind: "bastion",
          amount: 1,
        },
      },
    ],
  },
  {
    id: "skylander-ember",
    name: "Ember",
    element: "fire",
    creature: "dragon",
    edges: [3, 1, 0, 1],
    description:
      "A fiery swordswoman whose twin blades and blazing discipline make every strike burn bright.",
    origin: "skylanders",
    portrait: "ember",
    keywords: [
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-fire-spark",
        count: 2,
        recipient: "self",
      },
      {
        type: "discard",
        mode: "random",
        recipient: "self",
        count: 1,
      },
      {
        type: "parting-gift",
        target: "hand",
        pips: [
          {
            side: 2,
            amount: 1,
          },
        ],
      },
    ],
  },
  {
    id: "skylander-enigma",
    name: "Enigma",
    element: "magic",
    creature: "dragon",
    edges: [2, 0, 1, 2],
    description:
      "A mysterious cloaked guardian whose staff and vanishing tricks keep his next move hidden.",
    origin: "skylanders",
    portrait: "enigma",
    keywords: [
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-shadow-decoy",
        count: 1,
        recipient: "self",
      },
      {
        type: "silence",
      },
    ],
  },
  {
    id: "skylander-eruptor",
    name: "Eruptor",
    element: "fire",
    creature: "dragon",
    edges: [3, 0, 2, 0],
    description:
      "A walking volcano with a molten temper and a habit of letting the lava do the talking.",
    origin: "skylanders",
    portrait: "eruptor",
    keywords: [
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-fire-spark",
        count: 1,
        recipient: "self",
      },
      {
        type: "discard",
        mode: "random",
        recipient: "self",
        count: 1,
      },
      {
        type: "discard-priority",
        priority: 3,
      },
      {
        type: "parting-gift",
        target: "allies",
        pips: [
          {
            side: 0,
            amount: 1,
          },
        ],
      },
    ],
  },
  {
    id: "skylander-eye-brawl",
    name: "Eye-Brawl",
    element: "undead",
    creature: "dragon",
    edges: [3, 4, 2, 2],
    description:
      "A headless giant and a flying eyeball who divide the work between heavy punches and a very intense stare.",
    origin: "skylanders",
    portrait: "eye-brawl",
    keywords: [
      {
        type: "resonance",
        side: 1,
        element: "undead",
      },
    ],
  },
  {
    id: "skylander-eye-small",
    name: "Eye-Small",
    element: "undead",
    creature: "dragon",
    edges: [1, 1, 1, 1],
    description:
      "A little floating eye and its tiny armored partner, keeping a very close watch on the next opening.",
    origin: "skylanders",
    portrait: "eye-small",
    keywords: [],
  },
  {
    id: "skylander-fiesta",
    name: "Fiesta",
    element: "undead",
    creature: "dragon",
    edges: [2, 2, 2, 2],
    description:
      "A skeletal mariachi who brings a trumpet, a loyal band, and a celebration loud enough to wake the dead.",
    origin: "skylanders",
    portrait: "fiesta",
    keywords: [
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-shadow-decoy",
        count: 1,
        recipient: "self",
      },
      {
        type: "sunder",
        side: 0,
        amount: 1,
      },
    ],
  },
  {
    id: "skylander-fire-kraken",
    name: "Fire Kraken",
    element: "fire",
    creature: "dragon",
    edges: [1, 2, 2, 2],
    description:
      "A fireworks-loving dragon who brings a spinning staff and a spectacularly explosive celebration.",
    origin: "skylanders",
    portrait: "fire-kraken",
    keywords: [
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-fire-spark",
        count: 1,
        recipient: "self",
        half: "top",
      },
      {
        type: "discard",
        mode: "random",
        recipient: "self",
        count: 1,
        half: "bottom",
      },
      {
        type: "head-start",
        side: 1,
        amount: 1,
        half: "bottom",
      },
    ],
  },
  {
    id: "skylander-fist-bump",
    name: "Fist Bump",
    element: "earth",
    creature: "dragon",
    edges: [2, 1, 3, 1],
    description:
      "A rocky panda whose punches send earthquakes rumbling beneath an opponent's feet.",
    origin: "skylanders",
    portrait: "fist-bump",
    keywords: [
      {
        type: "shield",
        side: 2,
        amount: 1,
      },
      {
        type: "environment",
        environment: {
          kind: "bastion",
          amount: 1,
        },
      },
    ],
  },
  {
    id: "skylander-flare-wolf",
    name: "Flare Wolf",
    element: "fire",
    creature: "dragon",
    edges: [1, 3, 1, 2],
    description:
      "A rocket-wielding wolf who lights the fuse, takes aim, and lets the fireworks finish the conversation.",
    origin: "skylanders",
    portrait: "flare-wolf",
    keywords: [
      {
        type: "discard",
        mode: "random",
        recipient: "opponent",
        count: 1,
      },
      {
        type: "head-start",
        side: 1,
        amount: 1,
      },
    ],
  },
  {
    id: "skylander-flashwing",
    name: "Flashwing",
    element: "earth",
    creature: "dragon",
    edges: [2, 1, 2, 2],
    description:
      "A dazzling crystal dragon who sheds razor-sharp gems and leaves a glittering trail through battle.",
    origin: "skylanders",
    portrait: "flashwing",
    keywords: [
      {
        type: "shield",
        side: 0,
        amount: 1,
      },
      {
        type: "environment",
        environment: {
          kind: "equalizer",
        },
      },
    ],
  },
  {
    id: "skylander-fling-kong",
    name: "Fling Kong",
    element: "air",
    creature: "dragon",
    edges: [1, 3, 0, 2],
    description:
      "A flying-carpet rider who fans out spinning discs and turns monkeying around into an aerial art.",
    origin: "skylanders",
    portrait: "fling-kong",
    keywords: [
      {
        type: "shift",
        side: 1,
        direction: 2,
        affects: "allies",
      },
      {
        type: "combo",
        pips: [
          {
            side: 3,
            amount: 1,
          },
        ],
      },
    ],
  },
  {
    id: "skylander-flip-wreck",
    name: "Flip Wreck",
    element: "water",
    creature: "dragon",
    edges: [2, 1, 1, 2],
    description:
      "A dolphin swordsman who fights with shipwreck salvage and keeps a trusty wheel close at hand.",
    origin: "skylanders",
    portrait: "flip-wreck",
    keywords: [
      {
        type: "shield",
        side: 0,
        amount: 1,
      },
      {
        type: "environment",
        environment: {
          kind: "mirror-pool",
        },
      },
    ],
  },
  {
    id: "skylander-food-fight",
    name: "Food Fight",
    element: "life",
    creature: "dragon",
    edges: [1, 2, 1, 0],
    description:
      "An artichoke marksman who brings a tomato launcher to battle and never wastes a good food fight.",
    origin: "skylanders",
    portrait: "food-fight",
    keywords: [
      {
        type: "resonance",
        side: 1,
        element: "life",
      },
    ],
  },
  {
    id: "skylander-free-ranger",
    name: "Free Ranger",
    element: "air",
    creature: "dragon",
    edges: [1, 3, 2, 2],
    description:
      "A storm-chasing bird who spins his bladed fans into a lightning-filled whirlwind.",
    origin: "skylanders",
    portrait: "free-ranger",
    keywords: [
      {
        type: "combo",
        pips: [
          {
            side: 0,
            amount: 1,
          },
        ],
        half: "top",
      },
      {
        type: "shift",
        side: 1,
        direction: 2,
        affects: "both",
        half: "bottom",
      },
    ],
  },
  {
    id: "skylander-freeze-blade",
    name: "Freeze Blade",
    element: "water",
    creature: "dragon",
    edges: [2, 1, 1, 2],
    description:
      "A catlike ice skater whose sharp disc and sharper turns leave opponents slipping behind.",
    origin: "skylanders",
    portrait: "freeze-blade",
    keywords: [
      {
        type: "shield",
        side: 0,
        amount: 1,
        half: "top",
      },
      {
        type: "shift",
        side: 1,
        direction: 2,
        affects: "enemies",
        half: "bottom",
      },
    ],
  },
  {
    id: "skylander-fright-rider",
    name: "Fright Rider",
    element: "undead",
    creature: "dragon",
    edges: [0, 2, 1, 2],
    description:
      "An elven lancer and his skeletal ostrich who charge together and never leave their partner behind.",
    origin: "skylanders",
    portrait: "fright-rider",
    keywords: [
      {
        type: "sunder",
        side: "any",
        amount: 1,
      },
      {
        type: "silence",
      },
    ],
  },
  {
    id: "skylander-fryno",
    name: "Fryno",
    element: "fire",
    creature: "dragon",
    edges: [2, 2, 3, 1],
    description:
      "A hot-tempered rhino whose punches get bigger and whose motorcycle gets faster as the heat builds.",
    origin: "skylanders",
    portrait: "fryno",
    keywords: [
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-fire-spark",
        count: 2,
        recipient: "self",
      },
      {
        type: "discard",
        mode: "random",
        recipient: "self",
        count: 1,
      },
      {
        type: "parting-gift",
        target: "hand",
        pips: [
          {
            side: 0,
            amount: 1,
          },
        ],
      },
    ],
  },
  {
    id: "skylander-funny-bone",
    name: "Funny Bone",
    element: "undead",
    creature: "dragon",
    edges: [1, 3, 1, 0],
    description:
      "A cheerful skeleton dog who digs up bones, chases trouble, and always has room for one more game.",
    origin: "skylanders",
    portrait: "funny-bone",
    keywords: [
      {
        type: "next-play",
        side: "all",
        amount: -1,
        recipient: "opponent",
      },
    ],
  },
  {
    id: "skylander-gearshift",
    name: "Gearshift",
    element: "tech",
    creature: "dragon",
    edges: [1, 4, 1, 1],
    description:
      "A robot warrior who turns a giant gear into a spinning blade and makes every part of the machine count.",
    origin: "skylanders",
    portrait: "gearshift",
    keywords: [
      {
        type: "combo",
        pips: [
          {
            side: 1,
            amount: 1,
          },
        ],
      },
      {
        type: "sunder",
        side: "any",
        amount: 1,
      },
    ],
  },
  {
    id: "skylander-ghost-roaster",
    name: "Ghost Roaster",
    element: "undead",
    creature: "dragon",
    edges: [2, 2, 2, 2],
    description:
      "A hungry spectral menace whose rattling chain and enormous jaws make ghosts wish they could hide.",
    origin: "skylanders",
    portrait: "ghost-roaster",
    keywords: [
      {
        type: "sunder",
        side: 0,
        amount: 2,
      },
      {
        type: "environment",
        environment: {
          kind: "blight",
          side: 2,
          amount: 1,
        },
      },
    ],
  },
  {
    id: "skylander-gill-runt",
    name: "Gill Runt",
    element: "water",
    creature: "dragon",
    edges: [2, 0, 1, 1],
    description:
      "A little harpoon soldier who brings Gill Grunt's courage in a much smaller, splashier package.",
    origin: "skylanders",
    portrait: "gill-runt",
    keywords: [],
  },
  {
    id: "skylander-golden-queen",
    name: "Golden Queen",
    element: "earth",
    creature: "dragon",
    edges: [0, 3, 2, 4],
    description:
      "A gilded sorceress who turns foes and furnishings into gold, then commands her treasures to fight.",
    origin: "skylanders",
    portrait: "golden-queen",
    keywords: [
      {
        type: "shield",
        side: 3,
        amount: 2,
      },
      {
        type: "environment",
        environment: {
          kind: "bastion",
          amount: 1,
        },
      },
      {
        type: "next-play",
        side: 1,
        amount: 1,
        recipient: "self",
        changeElement: "earth",
      },
    ],
  },
  {
    id: "skylander-grave-clobber",
    name: "Grave Clobber",
    element: "water",
    creature: "dragon",
    edges: [2, 0, 2, 1],
    description:
      "An ancient mummy with enormous fists who rises from the earth to make a crushing comeback.",
    origin: "skylanders",
    portrait: "grave-clobber",
    keywords: [
      {
        type: "shield",
        side: 0,
        amount: 1,
      },
      {
        type: "environment",
        environment: {
          kind: "bastion",
          amount: 1,
        },
      },
    ],
  },
  {
    id: "skylander-grilla-drilla",
    name: "Grilla Drilla",
    element: "life",
    creature: "dragon",
    edges: [1, 1, 1, 3],
    description:
      "A drilling gorilla who digs into the action with mechanical arms and a troop of helpful monkeys.",
    origin: "skylanders",
    portrait: "grilla-drilla",
    keywords: [
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-chompy-seedling",
        count: 1,
        recipient: "self",
        half: "top",
      },
      {
        type: "resonance",
        side: 1,
        element: "life",
        half: "bottom",
      },
    ],
  },
  {
    id: "skylander-grim-creeper",
    name: "Grim Creeper",
    element: "undead",
    creature: "dragon",
    edges: [2, 2, 1, 1],
    description:
      "A spectral reaper who leaves his armor behind and lets his scythe sweep through the unsuspecting.",
    origin: "skylanders",
    portrait: "grim-creeper",
    keywords: [
      {
        type: "silence",
      },
      {
        type: "next-play",
        side: 0,
        amount: -1,
        recipient: "opponent",
      },
    ],
  },
  {
    id: "skylander-gusto",
    name: "Gusto",
    element: "air",
    creature: "dragon",
    edges: [2, 1, 2, 3],
    description:
      "A big-hearted wind warrior whose mighty boomerang and powerful breath send trouble flying.",
    origin: "skylanders",
    portrait: "gusto",
    keywords: [
      {
        type: "shift",
        side: 3,
        direction: 0,
        affects: "allies",
      },
      {
        type: "environment",
        environment: {
          kind: "crosswind",
        },
      },
    ],
  },
  {
    id: "skylander-hammer-slam-bowser",
    name: "Hammer Slam Bowser",
    element: "fire",
    creature: "dragon",
    edges: [3, 0, 1, 1],
    description:
      "The Koopa king brings a huge hammer, fire breath, and the threat of an even bigger transformation.",
    origin: "skylanders",
    portrait: "hammer-slam-bowser",
    keywords: [
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-fire-spark",
        count: 1,
        recipient: "self",
      },
      {
        type: "discard",
        mode: "random",
        recipient: "self",
        count: 1,
      },
      {
        type: "discard-priority",
        priority: 3,
      },
      {
        type: "parting-gift",
        target: "allies",
        pips: [
          {
            side: 0,
            amount: 1,
          },
        ],
      },
    ],
  },
  {
    id: "skylander-head-rush",
    name: "Head Rush",
    element: "earth",
    creature: "dragon",
    edges: [0, 2, 1, 2],
    description:
      "A powerful horned warrior whose charge and booming yodel leave very little room for resistance.",
    origin: "skylanders",
    portrait: "head-rush",
    keywords: [
      {
        type: "shield",
        side: 1,
        amount: 1,
      },
      {
        type: "environment",
        environment: {
          kind: "bastion",
          amount: 1,
        },
      },
    ],
  },
  {
    id: "skylander-hex",
    name: "Hex",
    element: "undead",
    creature: "dragon",
    edges: [2, 1, 2, 2],
    description:
      "A dark elven sorceress who raises walls of bone and sends ghostly orbs floating after her enemies.",
    origin: "skylanders",
    portrait: "hex",
    keywords: [
      {
        type: "sunder",
        side: "any",
        amount: 1,
      },
      {
        type: "silence",
      },
    ],
  },
  {
    id: "skylander-high-five",
    name: "High Five",
    element: "life",
    creature: "dragon",
    edges: [3, 0, 1, 1],
    description:
      "A young dragonfly who darts through danger, leaving poisonous clouds for anyone trying to follow.",
    origin: "skylanders",
    portrait: "high-five",
    keywords: [
      {
        type: "resonance",
        side: 0,
        element: "life",
      },
      {
        type: "environment",
        environment: {
          kind: "elemental",
          element: "life",
          side: "all",
          amount: 1,
        },
      },
    ],
  },
  {
    id: "skylander-high-volt",
    name: "High Volt",
    element: "tech",
    creature: "dragon",
    edges: [1, 3, 2, 2],
    description:
      "An electrical defender whose shock lance and sturdy shield make crossing his line a dangerous idea.",
    origin: "skylanders",
    portrait: "high-volt",
    keywords: [
      { type: "assemble", count: 1 },
      {
        type: "combo",
        pips: [
          {
            side: 1,
            amount: 1,
          },
        ],
      },
      {
        type: "next-play",
        side: 3,
        amount: 1,
        recipient: "self",
      },
    ],
  },
  {
    id: "skylander-hijinx",
    name: "Hijinx",
    element: "undead",
    creature: "dragon",
    edges: [1, 1, 1, 1],
    description:
      "A miniature sorceress who follows Hex's example, proving that a small spell can still raise big trouble.",
    origin: "skylanders",
    portrait: "hijinx",
    keywords: [],
  },
  {
    id: "skylander-hood-sickle",
    name: "Hood Sickle",
    element: "dark",
    creature: "dragon",
    edges: [4, 1, 3, 0],
    description:
      "A silent reaper who steps through shadow portals and lets his great scythe speak for him.",
    origin: "skylanders",
    portrait: "hood-sickle",
    keywords: [
      {
        type: "silence",
      },
      {
        type: "shift",
        side: 0,
        direction: 1,
        affects: "enemies",
      },
    ],
  },
  {
    id: "skylander-hoot-loop",
    name: "Hoot Loop",
    element: "magic",
    creature: "dragon",
    edges: [0, 2, 1, 2],
    description:
      "A hypnotic owl whose top half casts spells while his bottom half hops through magical portals.",
    origin: "skylanders",
    portrait: "hoot-loop",
    keywords: [
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-magic-echo",
        count: 1,
        recipient: "self",
        half: "top",
      },
      {
        type: "shift",
        side: 2,
        direction: 3,
        affects: "allies",
        half: "bottom",
      },
    ],
  },
  {
    id: "skylander-hot-dog",
    name: "Hot Dog",
    element: "fire",
    creature: "dragon",
    edges: [2, 2, 2, 2],
    description:
      "A flame-tailed dog who bounds into battle with burning bones and a bark that comes with extra heat.",
    origin: "skylanders",
    portrait: "hot-dog",
    keywords: [
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-fire-spark",
        count: 2,
        recipient: "self",
      },
      {
        type: "discard",
        mode: "random",
        recipient: "self",
        count: 1,
      },
      {
        type: "scavenge",
        from: "self",
        pips: [
          {
            side: 0,
            amount: 1,
          },
        ],
      },
    ],
  },
  {
    id: "skylander-hot-head",
    name: "Hot Head",
    element: "fire",
    creature: "dragon",
    edges: [3, 2, 3, 3],
    description:
      "A giant of molten rock who breathes burning oil and can turn himself into a roaring fire motorcycle.",
    origin: "skylanders",
    portrait: "hot-head",
    keywords: [
      {
        type: "resonance",
        side: 0,
        element: "fire",
      },
    ],
  },
  {
    id: "skylander-hurricane-jet-vac",
    name: "Hurricane Jet-Vac",
    element: "air",
    creature: "dragon",
    edges: [1, 1, 2, 2],
    description:
      "Jet-Vac turns up the pressure, drawing enemies close before blasting them into a very different forecast.",
    origin: "skylanders",
    portrait: "hurricane-jet-vac",
    keywords: [
      {
        type: "shift",
        side: 2,
        direction: 3,
        affects: "enemies",
      },
      {
        type: "next-play",
        side: 0,
        amount: 1,
        recipient: "self",
        element: "air",
      },
    ],
  },
  {
    id: "skylander-ignitor",
    name: "Ignitor",
    element: "fire",
    creature: "dragon",
    edges: [1, 2, 1, 2],
    description:
      "A knight bound to living flame who sends his fiery spirit out of its armor to scorch the battlefield.",
    origin: "skylanders",
    portrait: "ignitor",
    keywords: [
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-fire-spark",
        count: 2,
        recipient: "self",
      },
      {
        type: "discard",
        mode: "random",
        recipient: "self",
        count: 1,
      },
      {
        type: "scavenge",
        from: "self",
        pips: [
          {
            side: 0,
            amount: 1,
          },
        ],
      },
    ],
  },
  {
    id: "skylander-jawbreaker",
    name: "Jawbreaker",
    element: "tech",
    creature: "dragon",
    edges: [2, 3, 1, 2],
    description:
      "A boxing robot whose Traptanium fists turn a steady rhythm of punches into an electrifying finish.",
    origin: "skylanders",
    portrait: "jawbreaker",
    keywords: [
      {
        type: "combo",
        pips: [
          {
            side: 1,
            amount: 1,
          },
        ],
      },
      {
        type: "shield",
        side: 3,
        amount: 1,
      },
    ],
  },
  {
    id: "skylander-ka-boom",
    name: "Ka-Boom",
    element: "fire",
    creature: "dragon",
    edges: [3, 2, 2, 1],
    description:
      "A cannon-carrying demolitions expert who launches explosive power straight through stubborn defenses.",
    origin: "skylanders",
    portrait: "ka-boom",
    keywords: [
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-fire-spark",
        count: 1,
        recipient: "self",
      },
      {
        type: "discard",
        mode: "random",
        recipient: "self",
        count: 1,
      },
      {
        type: "discard-priority",
        priority: 3,
      },
      {
        type: "parting-gift",
        target: "allies",
        pips: [
          {
            side: 0,
            amount: 1,
          },
        ],
      },
    ],
  },
  {
    id: "skylander-kaos",
    name: "Kaos",
    element: "neutral",
    creature: "dragon",
    edges: [4, 3, 3, 0],
    description:
      "A would-be ruler of Skylands whose grand plans, summoned minions, and magnificent tantrums rarely stay small.",
    origin: "skylanders",
    portrait: "kaos",
    keywords: [
      {
        type: "dizzy",
        sides: [0, 1, 2, 3],
      },
      {
        type: "conjure",
        mode: "random",
        count: 2,
        recipient: "self",
      },
      {
        type: "sunder",
        side: "any",
        amount: 1,
      },
    ],
  },
  {
    id: "skylander-king-pen",
    name: "King Pen",
    element: "water",
    creature: "dragon",
    edges: [2, 1, 2, 0],
    description:
      "A penguin master whose icy gauntlets turn disciplined martial arts into a freezing counterattack.",
    origin: "skylanders",
    portrait: "king-pen",
    keywords: [
      {
        type: "shield",
        side: 0,
        amount: 1,
      },
      {
        type: "environment",
        environment: {
          kind: "mirror-pool",
        },
      },
    ],
  },
  {
    id: "skylander-knight-light",
    name: "Knight Light",
    element: "light",
    creature: "dragon",
    edges: [1, 2, 1, 2],
    description:
      "A winged knight who carries a radiant Traptanium blade into the darkest corners of Skylands.",
    origin: "skylanders",
    portrait: "knight-light",
    keywords: [
      {
        type: "next-play",
        side: "all",
        amount: 1,
        recipient: "self",
      },
      {
        type: "silence",
      },
    ],
  },
  {
    id: "skylander-knight-mare",
    name: "Knight Mare",
    element: "dark",
    creature: "dragon",
    edges: [2, 2, 0, 1],
    description:
      "A centaur knight whose enormous Traptanium blade cuts a clear path through the darkness.",
    origin: "skylanders",
    portrait: "knight-mare",
    keywords: [
      {
        type: "silence",
      },
      {
        type: "head-start",
        side: 0,
        amount: 1,
      },
    ],
  },
  {
    id: "skylander-krypt-king",
    name: "Krypt King",
    element: "undead",
    creature: "dragon",
    edges: [3, 1, 2, 0],
    description:
      "An armored undead knight whose great Traptanium sword and ghostly swarm make ancient power feel very present.",
    origin: "skylanders",
    portrait: "krypt-king",
    keywords: [
      {
        type: "sunder",
        side: 0,
        amount: 2,
      },
      {
        type: "environment",
        environment: {
          kind: "blight",
          side: 2,
          amount: 1,
        },
      },
    ],
  },
  {
    id: "skylander-lava-lance-eruptor",
    name: "Lava Lance Eruptor",
    element: "fire",
    creature: "dragon",
    edges: [2, 2, 3, 1],
    description:
      "Eruptor arms his volcanic temper with a blazing lance and charges into a whole new kind of eruption.",
    origin: "skylanders",
    portrait: "lava-lance-eruptor",
    keywords: [
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-fire-spark",
        count: 2,
        recipient: "self",
      },
      {
        type: "discard",
        mode: "random",
        recipient: "self",
        count: 1,
      },
      {
        type: "scavenge",
        from: "self",
        pips: [
          {
            side: 2,
            amount: 1,
          },
        ],
      },
    ],
  },
  {
    id: "skylander-lightning-rod",
    name: "Lightning Rod",
    element: "air",
    creature: "dragon",
    edges: [2, 2, 0, 2],
    description:
      "A swaggering storm giant who rides a cloud and throws lightning as if the sky belongs to him.",
    origin: "skylanders",
    portrait: "lightning-rod",
    keywords: [
      {
        type: "shift",
        side: 0,
        direction: 1,
        affects: "allies",
      },
      {
        type: "combo",
        pips: [
          {
            side: 2,
            amount: 1,
          },
        ],
      },
    ],
  },
  {
    id: "skylander-lob-star",
    name: "Lob-Star",
    element: "water",
    creature: "dragon",
    edges: [2, 1, 1, 2],
    description:
      "A lobster ninja who hurls throwing stars and builds up enough steam to really lose his cool.",
    origin: "skylanders",
    portrait: "lob-star",
    keywords: [
      {
        type: "shield",
        side: 0,
        amount: 1,
      },
      {
        type: "next-play",
        side: 2,
        amount: 1,
        recipient: "self",
        element: "water",
      },
    ],
  },
  {
    id: "skylander-magna-charge",
    name: "Magna Charge",
    element: "tech",
    creature: "dragon",
    edges: [0, 2, 2, 1],
    description:
      "A magnetic robot who rides a powered wheel, lifts his targets, and lets his cannon handle the follow-through.",
    origin: "skylanders",
    portrait: "magna-charge",
    keywords: [
      {
        type: "combo",
        pips: [
          {
            side: 0,
            amount: 1,
          },
        ],
        half: "top",
      },
      {
        type: "shift",
        side: 1,
        direction: 2,
        affects: "enemies",
        half: "bottom",
      },
    ],
  },
  {
    id: "skylander-mini-jini",
    name: "Mini-Jini",
    element: "magic",
    creature: "dragon",
    edges: [1, 1, 1, 1],
    description:
      "A tiny genie with twin blades and a bottle big enough to hide a surprising amount of magic.",
    origin: "skylanders",
    portrait: "mini-jini",
    keywords: [],
  },
  {
    id: "skylander-mysticat",
    name: "Mysticat",
    element: "magic",
    creature: "dragon",
    edges: [1, 2, 1, 2],
    description:
      "A feline illusionist who distracts foes with magical doubles before pouncing on the real opening.",
    origin: "skylanders",
    portrait: "mysticat",
    keywords: [
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-magic-echo",
        count: 1,
        recipient: "self",
      },
      {
        type: "dizzy",
        sides: [3],
      },
    ],
  },
  {
    id: "skylander-night-shift",
    name: "Night Shift",
    element: "undead",
    creature: "dragon",
    edges: [0, 2, 1, 2],
    description:
      "A vampire boxer who teleports between punches and always seems ready for one more round.",
    origin: "skylanders",
    portrait: "night-shift",
    keywords: [
      {
        type: "comeback",
        side: 0,
        amount: 1,
        half: "top",
      },
      {
        type: "sunder",
        side: 1,
        amount: 1,
        half: "bottom",
      },
    ],
  },
  {
    id: "skylander-nightfall",
    name: "Nightfall",
    element: "dark",
    creature: "dragon",
    edges: [0, 3, 1, 1],
    description:
      "A deep-sea raider whose hooks and clouds of black mist keep her enemies guessing where she will strike.",
    origin: "skylanders",
    portrait: "nightfall",
    keywords: [
      {
        type: "silence",
      },
      {
        type: "shift",
        side: 1,
        direction: 2,
        affects: "enemies",
      },
    ],
  },
  {
    id: "skylander-ninjini",
    name: "Ninjini",
    element: "magic",
    creature: "dragon",
    edges: [3, 2, 2, 4],
    description:
      "An ancient genie warrior who pairs enormous twin blades with the clever escape of a magic bottle.",
    origin: "skylanders",
    portrait: "ninjini",
    keywords: [
      {
        type: "resonance",
        side: 3,
        element: "magic",
      },
    ],
  },
  {
    id: "skylander-pain-yatta",
    name: "Pain-Yatta",
    element: "magic",
    creature: "dragon",
    edges: [1, 1, 1, 3],
    description:
      "A living piñata with a giant candy club and a spectacularly poor tolerance for being hit.",
    origin: "skylanders",
    portrait: "pain-yatta",
    keywords: [
      {
        type: "conjure",
        mode: "random",
        count: 1,
        recipient: "self",
        element: "magic",
      },
    ],
  },
  {
    id: "skylander-pet-vac",
    name: "Pet-Vac",
    element: "air",
    creature: "dragon",
    edges: [1, 1, 1, 1],
    description:
      "A miniature bird hero with a little vacuum blaster and a surprisingly powerful set of lungs.",
    origin: "skylanders",
    portrait: "pet-vac",
    keywords: [],
  },
  {
    id: "skylander-pit-boss",
    name: "Pit Boss",
    element: "undead",
    creature: "dragon",
    edges: [0, 2, 2, 1],
    description:
      "A serpent sorcerer whose staff commands ghostly snakes and opens dangerous pits beneath his enemies.",
    origin: "skylanders",
    portrait: "pit-boss",
    keywords: [
      {
        type: "sunder",
        side: "any",
        amount: 1,
      },
      {
        type: "silence",
      },
    ],
  },
  {
    id: "skylander-pop-fizz",
    name: "Pop Fizz",
    element: "magic",
    creature: "dragon",
    edges: [2, 0, 2, 3],
    description:
      "One potion makes him fizz. Another brings out the beast. He rarely waits to read the label.",
    origin: "skylanders",
    portrait: "pop-fizz",
    keywords: [
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-magic-echo",
        count: 1,
        recipient: "self",
      },
      {
        type: "dizzy",
        sides: [0, 1],
      },
    ],
  },
  {
    id: "skylander-pop-thorn",
    name: "Pop Thorn",
    element: "air",
    creature: "dragon",
    edges: [0, 2, 1, 1],
    description:
      "A little flying creature who puffs into a bristling ball when being adorable stops working.",
    origin: "skylanders",
    portrait: "pop-thorn",
    keywords: [
      {
        type: "shield",
        side: 1,
        amount: 1,
      },
      {
        type: "shift",
        side: 3,
        direction: 0,
        affects: "allies",
      },
    ],
  },
  {
    id: "skylander-punk-shock",
    name: "Punk Shock",
    element: "water",
    creature: "dragon",
    edges: [2, 1, 2, 2],
    description:
      "An electric eel archer who drenches her targets before sending a charge straight through the water.",
    origin: "skylanders",
    portrait: "punk-shock",
    keywords: [
      {
        type: "shield",
        side: 0,
        amount: 2,
      },
      {
        type: "comeback",
        side: 2,
        amount: 1,
      },
    ],
  },
  {
    id: "skylander-rattle-shake",
    name: "Rattle Shake",
    element: "undead",
    creature: "dragon",
    edges: [0, 3, 1, 1],
    description:
      "An undead snake gunslinger who calls ghostly helpers and keeps his pistols pointed toward the next ambush.",
    origin: "skylanders",
    portrait: "rattle-shake",
    keywords: [
      {
        type: "silence",
        half: "top",
      },
      {
        type: "sunder",
        side: 2,
        amount: 1,
        half: "bottom",
      },
    ],
  },
  {
    id: "skylander-rip-tide",
    name: "Rip Tide",
    element: "water",
    creature: "dragon",
    edges: [3, 2, 2, 1],
    description:
      "A fish fighter who uses the catch of the day as a sword and a hammerhead as a very convincing hammer.",
    origin: "skylanders",
    portrait: "rip-tide",
    keywords: [
      {
        type: "shield",
        side: 0,
        amount: 1,
      },
      {
        type: "environment",
        environment: {
          kind: "bastion",
          amount: 1,
        },
      },
    ],
  },
  {
    id: "skylander-ro-bow",
    name: "Ro-Bow",
    element: "tech",
    creature: "dragon",
    edges: [3, 2, 1, 3],
    description:
      "A robotic archer whose precise shots and rolling laser attacks make nowhere feel safely out of range.",
    origin: "skylanders",
    portrait: "ro-bow",
    keywords: [
      {
        type: "combo",
        pips: [
          {
            side: 0,
            amount: 1,
          },
        ],
        keywords: [
          {
            type: "shield",
            side: 2,
            amount: 1,
          },
        ],
      },
      {
        type: "sunder",
        side: "any",
        amount: 2,
      },
    ],
  },
  {
    id: "skylander-rocky-roll",
    name: "Rocky Roll",
    element: "earth",
    creature: "dragon",
    edges: [2, 1, 1, 2],
    description:
      "Rocky rides his round companion Roll into battle, proving that a good friendship can move mountains.",
    origin: "skylanders",
    portrait: "rocky-roll",
    keywords: [
      {
        type: "shield",
        side: 0,
        amount: 1,
      },
      {
        type: "environment",
        environment: {
          kind: "equalizer",
        },
      },
    ],
  },
  {
    id: "skylander-roller-brawl",
    name: "Roller Brawl",
    element: "undead",
    creature: "dragon",
    edges: [3, 1, 0, 1],
    description:
      "A vampire derby champion whose claws and skating speed turn a close pass into a vicious strike.",
    origin: "skylanders",
    portrait: "roller-brawl",
    keywords: [
      {
        type: "sunder",
        side: 0,
        amount: 2,
      },
      {
        type: "environment",
        environment: {
          kind: "blight",
          side: 2,
          amount: 1,
        },
      },
    ],
  },
  {
    id: "skylander-rubble-rouser",
    name: "Rubble Rouser",
    element: "earth",
    creature: "dragon",
    edges: [1, 1, 2, 3],
    description:
      "A burrowing miner who breaks the surface with a drill hammer and a crew of underground helpers.",
    origin: "skylanders",
    portrait: "rubble-rouser",
    keywords: [
      {
        type: "shield",
        side: 0,
        amount: 1,
        half: "top",
      },
      {
        type: "shift",
        side: 2,
        direction: 3,
        affects: "allies",
        half: "bottom",
      },
    ],
  },
  {
    id: "skylander-scorp",
    name: "Scorp",
    element: "earth",
    creature: "dragon",
    edges: [2, 1, 1, 0],
    description:
      "A crystal-tailed scorpion who marks his quarry with venom and keeps the dangerous end pointed forward.",
    origin: "skylanders",
    portrait: "scorp",
    keywords: [
      {
        type: "sunder",
        side: 0,
        amount: 1,
      },
    ],
  },
  {
    id: "skylander-scratch",
    name: "Scratch",
    element: "air",
    creature: "dragon",
    edges: [3, 0, 1, 2],
    description:
      "A winged feline whose sharp claws and love of shiny gems make every treasure hunt a flying pounce.",
    origin: "skylanders",
    portrait: "scratch",
    keywords: [
      {
        type: "shift",
        side: 0,
        direction: 1,
        affects: "enemies",
      },
      {
        type: "next-play",
        side: 2,
        amount: 1,
        recipient: "self",
        element: "air",
      },
    ],
  },
  {
    id: "skylander-shark-shooter-terrafin",
    name: "Shark Shooter Terrafin",
    element: "earth",
    creature: "dragon",
    edges: [2, 0, 1, 3],
    description:
      "Terrafin brings a missile launcher to the surface while keeping his underground escape route open.",
    origin: "skylanders",
    portrait: "shark-shooter-terrafin",
    keywords: [
      {
        type: "shield",
        side: 3,
        amount: 1,
      },
      {
        type: "environment",
        environment: {
          kind: "equalizer",
        },
      },
    ],
  },
  {
    id: "skylander-short-cut",
    name: "Short Cut",
    element: "undead",
    creature: "dragon",
    edges: [2, 2, 1, 0],
    description:
      "An undead tailor whose giant scissors and animated helpers make short work of anything in their path.",
    origin: "skylanders",
    portrait: "short-cut",
    keywords: [
      {
        type: "silence",
      },
      {
        type: "next-play",
        side: 0,
        amount: -1,
        recipient: "opponent",
      },
    ],
  },
  {
    id: "skylander-slam-bam",
    name: "Slam Bam",
    element: "water",
    creature: "dragon",
    edges: [3, 1, 1, 1],
    description:
      "A four-armed yeti who builds icy defenses and settles disagreements with an avalanche of punches.",
    origin: "skylanders",
    portrait: "slam-bam",
    keywords: [
      {
        type: "shield",
        side: 0,
        amount: 1,
      },
      {
        type: "environment",
        environment: {
          kind: "mirror-pool",
        },
      },
    ],
  },
  {
    id: "skylander-slobber-tooth",
    name: "Slobber Tooth",
    element: "earth",
    creature: "dragon",
    edges: [2, 2, 2, 2],
    description:
      "A hungry, armored beast who solves smaller problems by swallowing them and larger ones by charging.",
    origin: "skylanders",
    portrait: "slobber-tooth",
    keywords: [
      {
        type: "shield",
        side: 0,
        amount: 2,
      },
      {
        type: "sunder",
        side: "any",
        amount: 2,
      },
    ],
  },
  {
    id: "skylander-small-fry",
    name: "Small Fry",
    element: "fire",
    creature: "dragon",
    edges: [1, 1, 1, 1],
    description:
      "A pint-sized rhino with Fryno's fiery temper and a determination to keep the heat turned up.",
    origin: "skylanders",
    portrait: "small-fry",
    keywords: [],
  },
  {
    id: "skylander-smash-hit",
    name: "Smash Hit",
    element: "earth",
    creature: "dragon",
    edges: [2, 3, 1, 2],
    description:
      "A fearless wrecking-ball fighter who swings a boulder hard enough to make the scenery reconsider its position.",
    origin: "skylanders",
    portrait: "smash-hit",
    keywords: [
      {
        type: "shield",
        side: 1,
        amount: 1,
      },
      {
        type: "environment",
        environment: {
          kind: "bastion",
          amount: 1,
        },
      },
    ],
  },
  {
    id: "skylander-smolderdash",
    name: "Smolderdash",
    element: "fire",
    creature: "dragon",
    edges: [3, 1, 0, 2],
    description:
      "A graceful fire acrobat who whirls a blazing staff and draws power from a brilliant eclipse.",
    origin: "skylanders",
    portrait: "smolderdash",
    keywords: [
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-fire-spark",
        count: 2,
        recipient: "self",
      },
      {
        type: "discard",
        mode: "random",
        recipient: "self",
        count: 1,
      },
      {
        type: "parting-gift",
        target: "hand",
        pips: [
          {
            side: 2,
            amount: 1,
          },
        ],
      },
    ],
  },
  {
    id: "skylander-snap-shot",
    name: "Snap Shot",
    element: "water",
    creature: "dragon",
    edges: [0, 2, 2, 1],
    description:
      "A crocodilian ranger whose Traptanium bow brings large targets to a very abrupt stop.",
    origin: "skylanders",
    portrait: "snap-shot",
    keywords: [
      {
        type: "shield",
        side: 1,
        amount: 1,
      },
      {
        type: "next-play",
        side: 3,
        amount: 1,
        recipient: "self",
        element: "water",
      },
    ],
  },
  {
    id: "skylander-sonic-boom",
    name: "Sonic Boom",
    element: "air",
    creature: "dragon",
    edges: [1, 2, 1, 2],
    description:
      "A protective griffin mother whose sonic cries and determined hatchlings keep the whole flock fighting.",
    origin: "skylanders",
    portrait: "sonic-boom",
    keywords: [
      {
        type: "shift",
        side: 1,
        direction: 2,
        affects: "allies",
      },
      {
        type: "combo",
        pips: [
          {
            side: 3,
            amount: 1,
          },
        ],
      },
    ],
  },
  {
    id: "skylander-spitfire",
    name: "Spitfire",
    element: "fire",
    creature: "dragon",
    edges: [2, 4, 2, 0],
    description:
      "A living streak of flame whose speed and twisting firestorms leave a blazing trail through the race.",
    origin: "skylanders",
    portrait: "spitfire",
    keywords: [
      { type: "assemble", count: 2 },
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-fire-spark",
        count: 1,
        recipient: "self",
      },
      {
        type: "discard",
        mode: "random",
        recipient: "self",
        count: 1,
      },
      {
        type: "discard-priority",
        priority: 3,
      },
      {
        type: "parting-gift",
        target: "allies",
        pips: [
          {
            side: 0,
            amount: 1,
          },
        ],
      },
    ],
  },
  {
    id: "skylander-splat",
    name: "Splat",
    element: "magic",
    creature: "dragon",
    edges: [1, 2, 2, 3],
    description:
      "A magical artist who paints creatures into battle and treats the whole arena as her next canvas.",
    origin: "skylanders",
    portrait: "splat",
    keywords: [
      { type: "amplify", effect: "conjure", duration: "next", count: 1 },
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-magic-echo",
        count: 1,
        recipient: "self",
      },
      {
        type: "dizzy",
        sides: [1],
      },
    ],
  },
  {
    id: "skylander-spotlight",
    name: "Spotlight",
    element: "light",
    creature: "dragon",
    edges: [2, 2, 2, 2],
    description:
      "A luminous dragon whose brilliant beams and floating halos leave the shadows nowhere to hide.",
    origin: "skylanders",
    portrait: "spotlight",
    keywords: [
      {
        type: "next-play",
        side: "all",
        amount: 1,
        recipient: "self",
        changeElement: "light",
      },
      {
        type: "shield",
        side: 2,
        amount: 1,
      },
    ],
  },
  {
    id: "skylander-sprocket",
    name: "Sprocket",
    element: "tech",
    creature: "dragon",
    edges: [3, 1, 2, 1],
    description:
      "A resourceful engineer who builds turrets, plants mines, and turns a wrench into a convincing last resort.",
    origin: "skylanders",
    portrait: "sprocket",
    keywords: [
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-arkeyan-drone",
        count: 1,
        recipient: "self",
      },
      {
        type: "combo",
        pips: [
          {
            side: 2,
            amount: 1,
          },
        ],
      },
    ],
  },
  {
    id: "skylander-spry",
    name: "Spry",
    element: "magic",
    creature: "dragon",
    edges: [1, 1, 1, 1],
    description:
      "A pocket-sized purple dragon with a full-sized appetite for charging headfirst into adventure.",
    origin: "skylanders",
    portrait: "spry",
    keywords: [],
  },
  {
    id: "skylander-spy-rise",
    name: "Spy Rise",
    element: "tech",
    creature: "dragon",
    edges: [2, 1, 1, 2],
    description:
      "A spider-legged secret agent who climbs out of reach and collects information before choosing where to strike.",
    origin: "skylanders",
    portrait: "spy-rise",
    keywords: [
      {
        type: "combo",
        pips: [
          {
            side: 0,
            amount: 1,
          },
        ],
        half: "top",
      },
      {
        type: "sunder",
        side: 2,
        amount: 1,
        half: "bottom",
      },
    ],
  },
  {
    id: "skylander-star-strike",
    name: "Star Strike",
    element: "magic",
    creature: "dragon",
    edges: [2, 0, 3, 2],
    description:
      "A celestial spellcaster who keeps a powerful star in motion and sends enemy shots back where they came from.",
    origin: "skylanders",
    portrait: "star-strike",
    keywords: [
      {
        type: "conjure",
        mode: "random",
        count: 1,
        recipient: "self",
        element: "magic",
      },
    ],
  },
  {
    id: "skylander-starcast",
    name: "Starcast",
    element: "dark",
    creature: "dragon",
    edges: [3, 3, 0, 1],
    description:
      "A four-armed celestial ninja who sends spinning stars through the shadows with uncanny precision.",
    origin: "skylanders",
    portrait: "starcast",
    keywords: [
      {
        type: "sunder",
        side: "any",
        amount: 1,
      },
      {
        type: "environment",
        environment: {
          kind: "war-banner",
          amount: 1,
        },
      },
    ],
  },
  {
    id: "skylander-stink-bomb",
    name: "Stink Bomb",
    element: "life",
    creature: "dragon",
    edges: [1, 1, 1, 3],
    description:
      "A skunk ninja who uses smoke, stealth, and an unforgettable smell to make every escape an ambush.",
    origin: "skylanders",
    portrait: "stink-bomb",
    keywords: [
      {
        type: "silence",
        half: "top",
      },
      {
        type: "resonance",
        side: 2,
        element: "life",
        half: "bottom",
      },
    ],
  },
  {
    id: "skylander-stormblade",
    name: "Stormblade",
    element: "air",
    creature: "dragon",
    edges: [0, 2, 1, 2],
    description:
      "A quick-winged warrior who sends feather-shaped blades slicing through the air around her.",
    origin: "skylanders",
    portrait: "stormblade",
    keywords: [
      { type: "flash" },
      {
        type: "shift",
        side: 1,
        direction: 2,
        affects: "enemies",
      },
      {
        type: "head-start",
        side: 3,
        amount: 1,
      },
    ],
  },
  {
    id: "skylander-sunburn",
    name: "Sunburn",
    element: "fire",
    creature: "dragon",
    edges: [2, 0, 1, 2],
    description:
      "A dragon-phoenix who vanishes in flame and reappears wherever his next burst of fire is needed.",
    origin: "skylanders",
    portrait: "sunburn",
    keywords: [
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-fire-spark",
        count: 1,
        recipient: "self",
      },
      {
        type: "discard",
        mode: "random",
        recipient: "self",
        count: 1,
      },
      {
        type: "next-play",
        side: 0,
        amount: 1,
        recipient: "self",
        element: "fire",
      },
    ],
  },
  {
    id: "skylander-super-shot-stealth-elf",
    name: "Super Shot Stealth Elf",
    element: "life",
    creature: "dragon",
    edges: [3, 2, 1, 0],
    description:
      "Stealth Elf trades quiet blades for a spinning weapon, then uses camouflage to keep the surprise.",
    origin: "skylanders",
    portrait: "super-shot-stealth-elf",
    keywords: [
      {
        type: "resonance",
        side: 0,
        element: "life",
      },
      {
        type: "shift",
        side: 2,
        direction: 3,
        affects: "enemies",
      },
    ],
  },
  {
    id: "skylander-swarm",
    name: "Swarm",
    element: "air",
    creature: "dragon",
    edges: [2, 3, 3, 3],
    description:
      "An enormous insect warrior who can become a cloud of smaller stinging attackers in the blink of an eye.",
    origin: "skylanders",
    portrait: "swarm",
    keywords: [
      {
        type: "resonance",
        side: 2,
        element: "air",
      },
    ],
  },
  {
    id: "skylander-tae-kwon-crow",
    name: "Tae Kwon Crow",
    element: "fire",
    creature: "dragon",
    edges: [2, 3, 1, 0],
    description:
      "A fiery raven martial artist whose kicks and throwing stars make his dojo a very hot place to train.",
    origin: "skylanders",
    portrait: "tae-kwon-crow",
    keywords: [
      {
        type: "discard",
        mode: "random",
        recipient: "opponent",
        count: 1,
      },
      {
        type: "head-start",
        side: 1,
        amount: 1,
      },
    ],
  },
  {
    id: "skylander-terrabite",
    name: "Terrabite",
    element: "earth",
    creature: "dragon",
    edges: [0, 1, 1, 2],
    description:
      "A little land shark who dives beneath the dirt and pops up wherever the next punch is needed.",
    origin: "skylanders",
    portrait: "terrabite",
    keywords: [],
  },
  {
    id: "skylander-terrafin",
    name: "Terrafin",
    element: "earth",
    creature: "dragon",
    edges: [2, 0, 3, 2],
    description:
      "A bare-knuckled land shark who tunnels beneath his rivals and surfaces with a knockout punch.",
    origin: "skylanders",
    portrait: "terrafin",
    keywords: [
      {
        type: "shield",
        side: 2,
        amount: 2,
      },
      {
        type: "sunder",
        side: "any",
        amount: 2,
      },
    ],
  },
  {
    id: "skylander-thrillipede",
    name: "Thrillipede",
    element: "life",
    creature: "dragon",
    edges: [1, 1, 3, 3],
    description:
      "A four-armed insect ace whose acrobatics and grenades make landing the least interesting part of a flight.",
    origin: "skylanders",
    portrait: "thrillipede",
    keywords: [
      {
        type: "resonance",
        side: 2,
        element: "life",
      },
      {
        type: "shield",
        side: 0,
        amount: 1,
      },
    ],
  },
  {
    id: "skylander-thumpback",
    name: "Thumpback",
    element: "water",
    creature: "dragon",
    edges: [2, 3, 3, 3],
    description:
      "A gigantic whale warrior who swings an anchor and makes every belly flop feel like a tidal wave.",
    origin: "skylanders",
    portrait: "thumpback",
    keywords: [
      {
        type: "resonance",
        side: 2,
        element: "water",
      },
    ],
  },
  {
    id: "skylander-thumpling",
    name: "Thumpling",
    element: "water",
    creature: "dragon",
    edges: [1, 1, 1, 1],
    description:
      "A miniature whale with a trusty anchor and absolutely no intention of making a small splash.",
    origin: "skylanders",
    portrait: "thumpling",
    keywords: [],
  },
  {
    id: "skylander-thunderbolt",
    name: "Thunderbolt",
    element: "air",
    creature: "dragon",
    edges: [3, 1, 2, 1],
    description:
      "A storm warrior whose great sword gathers lightning and sends thunder rolling across the battlefield.",
    origin: "skylanders",
    portrait: "thunderbolt",
    keywords: [
      {
        type: "shift",
        side: 0,
        direction: 1,
        affects: "enemies",
      },
      {
        type: "next-play",
        side: 2,
        amount: 1,
        recipient: "self",
        element: "air",
      },
    ],
  },
  {
    id: "skylander-tidepool",
    name: "Tidepool",
    element: "water",
    creature: "dragon",
    edges: [1, 4, 1, 2],
    description:
      "A many-armed gunslinger whose squid pistols make graceful footwork and rapid fire look effortless.",
    origin: "skylanders",
    portrait: "tidepool",
    keywords: [
      {
        type: "shield",
        side: 1,
        amount: 1,
      },
      {
        type: "environment",
        environment: {
          kind: "mirror-pool",
        },
      },
    ],
  },
  {
    id: "skylander-trail-blazer",
    name: "Trail Blazer",
    element: "fire",
    creature: "dragon",
    edges: [2, 2, 1, 0],
    description:
      "A blazing unicorn who charges through obstacles and leaves a trail of fire beneath his hooves.",
    origin: "skylanders",
    portrait: "trail-blazer",
    keywords: [
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-fire-spark",
        count: 2,
        recipient: "self",
      },
      {
        type: "discard",
        mode: "random",
        recipient: "self",
        count: 1,
      },
      {
        type: "parting-gift",
        target: "hand",
        pips: [
          {
            side: 2,
            amount: 1,
          },
        ],
      },
    ],
  },
  {
    id: "skylander-trap-shadow",
    name: "Trap Shadow",
    element: "magic",
    creature: "dragon",
    edges: [1, 2, 2, 1],
    description:
      "A shadowy feline hunter who sets the trap, disappears, and lets the quarry discover the rest.",
    origin: "skylanders",
    portrait: "trap-shadow",
    keywords: [
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-shadow-decoy",
        count: 1,
        recipient: "self",
        half: "top",
      },
      {
        type: "shift",
        side: 1,
        direction: 2,
        affects: "enemies",
        half: "bottom",
      },
    ],
  },
  {
    id: "skylander-tread-head",
    name: "Tread Head",
    element: "tech",
    creature: "dragon",
    edges: [2, 0, 1, 2],
    description:
      "A daredevil driver who rolls into danger on a powerful tracked machine and accelerates through the hard part.",
    origin: "skylanders",
    portrait: "tread-head",
    keywords: [
      {
        type: "combo",
        pips: [
          {
            side: 0,
            amount: 1,
          },
        ],
      },
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-arkeyan-drone",
        count: 1,
        recipient: "self",
      },
    ],
  },
  {
    id: "skylander-tree-rex",
    name: "Tree Rex",
    element: "life",
    creature: "dragon",
    edges: [3, 4, 2, 2],
    description:
      "An ancient tree giant with a thunderous stomp and a powerful cannon hidden in his mighty arm.",
    origin: "skylanders",
    portrait: "tree-rex",
    keywords: [
      {
        type: "resonance",
        side: 1,
        element: "life",
      },
    ],
  },
  {
    id: "skylander-tri-tip",
    name: "Tri-Tip",
    element: "earth",
    creature: "dragon",
    edges: [3, 0, 3, 1],
    description:
      "A triceratops warrior whose massive mace sends waves of ancient bone surging from the ground.",
    origin: "skylanders",
    portrait: "tri-tip",
    keywords: [
      {
        type: "shield",
        side: 0,
        amount: 1,
      },
      {
        type: "environment",
        environment: {
          kind: "bastion",
          amount: 1,
        },
      },
    ],
  },
  {
    id: "skylander-trigger-happy",
    name: "Trigger Happy",
    element: "tech",
    creature: "dragon",
    edges: [2, 1, 0, 2],
    description:
      "A gleeful gunslinger who spends golden firepower as freely as he laughs at the chaos it causes.",
    origin: "skylanders",
    portrait: "trigger-happy",
    keywords: [
      {
        type: "combo",
        pips: [
          {
            side: 0,
            amount: 1,
          },
        ],
      },
      {
        type: "sunder",
        side: "any",
        amount: 1,
      },
    ],
  },
  {
    id: "skylander-trigger-snappy",
    name: "Trigger Snappy",
    element: "tech",
    creature: "dragon",
    edges: [1, 1, 1, 1],
    description:
      "A tiny golden gunslinger with Trigger Happy's enormous grin and an equally enthusiastic trigger finger.",
    origin: "skylanders",
    portrait: "trigger-snappy",
    keywords: [],
  },
  {
    id: "skylander-tuff-luck",
    name: "Tuff Luck",
    element: "life",
    creature: "dragon",
    edges: [2, 2, 0, 1],
    description:
      "A lucky feline warrior whose twin blades make sure fortune favors more than just the bold.",
    origin: "skylanders",
    portrait: "tuff-luck",
    keywords: [
      {
        type: "resonance",
        side: 0,
        element: "life",
      },
      {
        type: "comeback",
        side: 2,
        amount: 1,
      },
    ],
  },
  {
    id: "skylander-turbo-charge-donkey-kong",
    name: "Turbo Charge Donkey Kong",
    element: "life",
    creature: "dragon",
    edges: [2, 2, 2, 0],
    description:
      "A barrel-launching powerhouse who brings jungle strength and thunderous bongo beats to the race.",
    origin: "skylanders",
    portrait: "turbo-charge-donkey-kong",
    keywords: [
      {
        type: "resonance",
        side: 0,
        element: "life",
      },
      {
        type: "combo",
        pips: [
          {
            side: 2,
            amount: 1,
          },
        ],
      },
    ],
  },
  {
    id: "skylander-voodood",
    name: "Voodood",
    element: "magic",
    creature: "dragon",
    edges: [3, 2, 0, 1],
    description:
      "An orc shaman whose axe and enchanted zipline pull him straight into the heart of the fight.",
    origin: "skylanders",
    portrait: "voodood",
    keywords: [
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-magic-echo",
        count: 1,
        recipient: "self",
      },
      {
        type: "sunder",
        side: "any",
        amount: 1,
      },
    ],
  },
  {
    id: "skylander-wallop",
    name: "Wallop",
    element: "earth",
    creature: "dragon",
    edges: [2, 2, 2, 1],
    description:
      "A heavily armored fighter who carries two Traptanium hammers because one good wallop deserves another.",
    origin: "skylanders",
    portrait: "wallop",
    keywords: [
      {
        type: "shield",
        side: 0,
        amount: 1,
      },
      {
        type: "environment",
        environment: {
          kind: "equalizer",
        },
      },
    ],
  },
  {
    id: "skylander-warnado",
    name: "Warnado",
    element: "air",
    creature: "dragon",
    edges: [2, 1, 0, 3],
    description:
      "A spiked turtle who spins himself into a tornado and lets the wind handle the introductions.",
    origin: "skylanders",
    portrait: "warnado",
    keywords: [
      {
        type: "shift",
        side: 3,
        direction: 0,
        affects: "allies",
      },
      {
        type: "combo",
        pips: [
          {
            side: 1,
            amount: 1,
          },
        ],
      },
    ],
  },
  {
    id: "skylander-wash-buckler",
    name: "Wash Buckler",
    element: "water",
    creature: "dragon",
    edges: [2, 1, 1, 2],
    description:
      "An octopus pirate who pairs a cutlass and bubble blaster with eight very useful sea legs.",
    origin: "skylanders",
    portrait: "wash-buckler",
    keywords: [
      {
        type: "combo",
        pips: [
          {
            side: 0,
            amount: 1,
          },
        ],
        half: "top",
      },
      {
        type: "shield",
        side: 1,
        amount: 2,
        half: "bottom",
      },
    ],
  },
  {
    id: "skylander-weeruptor",
    name: "Weeruptor",
    element: "fire",
    creature: "dragon",
    edges: [1, 1, 1, 1],
    description:
      "A tiny lava creature with Eruptor's molten heart and more than enough heat to make a mess.",
    origin: "skylanders",
    portrait: "weeruptor",
    keywords: [],
  },
  {
    id: "skylander-wham-shell",
    name: "Wham-Shell",
    element: "water",
    creature: "dragon",
    edges: [2, 0, 4, 2],
    description:
      "An armored crab who swings a mighty mace and sends electric pulses through the ground beneath his foes.",
    origin: "skylanders",
    portrait: "wham-shell",
    keywords: [
      {
        type: "shield",
        side: 2,
        amount: 2,
      },
      {
        type: "comeback",
        side: 0,
        amount: 1,
      },
    ],
  },
  {
    id: "skylander-whisper-elf",
    name: "Whisper Elf",
    element: "life",
    creature: "dragon",
    edges: [0, 3, 0, 1],
    description:
      "A small, silent ninja whose quick blades prove that being overlooked can be a useful advantage.",
    origin: "skylanders",
    portrait: "whisper-elf",
    keywords: [],
  },
  {
    id: "skylander-wild-storm",
    name: "Wild Storm",
    element: "air",
    creature: "dragon",
    edges: [2, 3, 3, 1],
    description:
      "A fierce swordsman whose control of lightning gives way to an even more ferocious storm-beast form.",
    origin: "skylanders",
    portrait: "wild-storm",
    keywords: [
      {
        type: "shift",
        side: 1,
        direction: 2,
        affects: "enemies",
      },
      {
        type: "head-start",
        side: 3,
        amount: 1,
      },
    ],
  },
  {
    id: "skylander-wildfire",
    name: "Wildfire",
    element: "fire",
    creature: "dragon",
    edges: [1, 1, 3, 1],
    description:
      "A golden lion warrior who catches attacks on his blazing Traptanium shield and answers with a fiery roar.",
    origin: "skylanders",
    portrait: "wildfire",
    keywords: [
      {
        type: "discard",
        mode: "random",
        recipient: "opponent",
        count: 1,
      },
      {
        type: "shield",
        side: 2,
        amount: 2,
      },
    ],
  },
  {
    id: "skylander-wind-up",
    name: "Wind-Up",
    element: "tech",
    creature: "dragon",
    edges: [2, 3, 1, 2],
    description:
      "A clockwork fighter who winds himself tight, then lets loose with spinning gears and spring-loaded punches.",
    origin: "skylanders",
    portrait: "wind-up",
    keywords: [
      {
        type: "combo",
        pips: [
          {
            side: 1,
            amount: 1,
          },
        ],
      },
      {
        type: "shield",
        side: 3,
        amount: 1,
      },
    ],
  },
  {
    id: "skylander-wolfgang",
    name: "Wolfgang",
    element: "undead",
    creature: "dragon",
    edges: [2, 3, 2, 0],
    description:
      "A werewolf musician who turns his bone harp and thunderous howls into a very unfriendly concert.",
    origin: "skylanders",
    portrait: "wolfgang",
    keywords: [
      {
        type: "sunder",
        side: "any",
        amount: 1,
      },
      {
        type: "silence",
      },
    ],
  },
  {
    id: "skylander-wrecking-ball",
    name: "Wrecking Ball",
    element: "magic",
    creature: "dragon",
    edges: [0, 1, 2, 1],
    description:
      "A hungry little creature whose tongue and rolling body make a remarkably effective wrecking crew.",
    origin: "skylanders",
    portrait: "wrecking-ball",
    keywords: [
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-magic-echo",
        count: 1,
        recipient: "self",
      },
      {
        type: "dizzy",
        sides: [2],
      },
    ],
  },
  {
    id: "skylander-zoo-lou",
    name: "Zoo Lou",
    element: "life",
    creature: "dragon",
    edges: [3, 1, 1, 2],
    description:
      "A spirit-calling shaman who sends a hawk, a wolf, and a charging boar to speak on his behalf.",
    origin: "skylanders",
    portrait: "zoo-lou",
    keywords: [
      {
        type: "resonance",
        side: 0,
        element: "life",
      },
      {
        type: "conjure",
        mode: "token",
        token: "custom-token-chompy-seedling",
        count: 1,
        recipient: "self",
      },
    ],
  },
  {
    id: "skylander-zook",
    name: "Zook",
    element: "life",
    creature: "dragon",
    edges: [2, 2, 1, 0],
    description:
      "A bamboo bazooka expert who can raise a protective grove almost as quickly as he fires a rocket.",
    origin: "skylanders",
    portrait: "zook",
    keywords: [
      {
        type: "resonance",
        side: 0,
        element: "life",
      },
      {
        type: "next-play",
        side: "all",
        amount: 1,
        recipient: "self",
        element: "life",
      },
    ],
  },
];
export const ENEMY_STONES: Stone[] = [
  {
    id: "giants-drow-lance-master",
    name: "Drow Lance Master",
    element: "neutral",
    creature: "fox",
    edges: [2, 0, 0, 2],
    description:
      "A disciplined Drow spearman who keeps his lance ready for anyone who steps too close.",
    origin: "giants",
    keywords: [],
    portrait: "enemy-drow-lance-master",
  },
  {
    id: "giants-mohawk-cyclops",
    name: "Mohawk Cyclops",
    element: "neutral",
    creature: "fox",
    edges: [2, 2, 0, 0],
    description:
      "A scrappy cyclops whose bright mohawk and heavy swings make subtlety somebody else's job.",
    origin: "giants",
    keywords: [],
    portrait: "enemy-mohawk-cyclops",
  },
  {
    id: "giants-mace-major",
    name: "Mace Major",
    element: "neutral",
    creature: "fox",
    edges: [0, 0, 2, 2],
    description:
      "A heavily armed Drow who believes a large mace is the best argument in any disagreement.",
    origin: "giants",
    keywords: [],
    portrait: "enemy-mace-major",
  },
  {
    id: "giants-drow-archer",
    name: "Drow Archer",
    element: "neutral",
    creature: "fox",
    edges: [2, 0, 2, 0],
    description:
      "A watchful Drow bowman who prefers to keep his enemies on the far side of a flying arrow.",
    origin: "giants",
    keywords: [],
    portrait: "enemy-drow-archer",
  },
  {
    id: "giants-blaster-troll",
    name: "Blaster Troll",
    element: "neutral",
    creature: "robot",
    edges: [0, 2, 0, 2],
    description:
      "A trigger-happy troll who trusts a noisy blaster to settle the fight before anyone gets close.",
    origin: "giants",
    keywords: [],
    portrait: "enemy-blaster-troll",
  },
  {
    id: "giants-chompy-bot",
    name: "Chompy Bot",
    element: "neutral",
    creature: "robot",
    edges: [1, 0, 1, 0],
    description:
      "A mechanical Chompy whose metal teeth make up for a noticeable lack of plant-like charm.",
    origin: "giants",
    keywords: [],
    portrait: "enemy-chompy-bot",
  },
  {
    id: "giants-chompy-bot-9000",
    name: "Chompy Bot 9000",
    element: "neutral",
    creature: "robot",
    edges: [2, 2, 2, 2],
    description:
      "An oversized Chompy machine built to deliver far more metal mayhem than its little cousins.",
    origin: "giants",
    keywords: [],
    portrait: "enemy-chompy-bot-9000",
  },
  {
    id: "giants-arkeyan-jouster",
    name: "Arkeyan Jouster",
    element: "neutral",
    creature: "robot",
    edges: [3, 2, 0, 2],
    description:
      "An ancient Arkeyan lancer who meets approaching foes with a spear and a relentless mechanical charge.",
    origin: "giants",
    keywords: [],
    portrait: "enemy-arkeyan-jouster",
  },
  {
    id: "giants-inhuman-shield",
    name: "Inhuman Shield",
    element: "neutral",
    creature: "fox",
    edges: [0, 2, 3, 2],
    description:
      "A stubborn defender who hides behind an enormous shield and waits for his enemy to make a mistake.",
    origin: "giants",
    keywords: [
      {
        type: "shield",
        side: 0,
      },
      {
        type: "shield",
        side: 2,
      },
    ],
    portrait: "enemy-inhuman-shield",
  },
  {
    id: "giants-d-riveter",
    name: "D. Riveter",
    element: "neutral",
    creature: "robot",
    edges: [2, 0, 2, 3],
    description:
      "A mechanical bruiser whose industrial tools are every bit as effective at breaking things as building them.",
    origin: "giants",
    keywords: [],
    portrait: "enemy-d-riveter",
  },
  {
    id: "giants-jawbreaker",
    name: "Jawbreaker (Troll)",
    element: "neutral",
    creature: "fox",
    edges: [2, 3, 2, 0],
    description:
      "A brawling troll who lets his enormous fists do all the explaining.",
    origin: "giants",
    keywords: [],
    portrait: "enemy-jawbreaker",
  },
  {
    id: "giants-enfuego-chompy",
    name: "Enfuego Chompy",
    element: "fire",
    creature: "slime",
    edges: [2, 0, 0, 0],
    description:
      "A fiery little biter who proves that a Chompy can be both small and uncomfortably hot-headed.",
    origin: "giants",
    keywords: [],
    portrait: "enemy-enfuego-chompy",
  },
  {
    id: "giants-frigid-chompy",
    name: "Frigid Chompy",
    element: "water",
    creature: "slime",
    edges: [0, 0, 2, 0],
    description:
      "An icy Chompy whose chilly bite makes even the smallest ambush worth watching.",
    origin: "giants",
    keywords: [],
    portrait: "enemy-frigid-chompy",
  },
  {
    id: "giants-spiderlings",
    name: "Spiderlings",
    element: "neutral",
    creature: "spider",
    edges: [0, 2, 0, 0],
    description:
      "A skittering brood of small spiders who make up for their size by arriving together.",
    origin: "giants",
    keywords: [],
    portrait: "enemy-spiderlings",
  },
  {
    id: "giants-chompy",
    name: "Chompy",
    element: "earth",
    creature: "slime",
    edges: [0, 0, 0, 1],
    description:
      "A tiny plant monster with an oversized mouth and a fearless devotion to biting the nearest hero.",
    origin: "giants",
    keywords: [],
    portrait: "enemy-chompy",
  },
  {
    id: "giants-axecutioner",
    name: "Axecutioner",
    element: "neutral",
    creature: "fox",
    edges: [3, 3, 3, 3],
    description:
      "An ancient axe-bearing machine whose heavy chopping blows make short work of an unwary challenger.",
    origin: "giants",
    keywords: [],
    portrait: "enemy-axecutioner",
  },
  {
    id: "giants-arkeyan-duelist",
    name: "Arkeyan Duelist",
    element: "neutral",
    creature: "robot",
    edges: [4, 0, 0, 0],
    description:
      "An Arkeyan sword fighter built to keep an opponent busy with one blade while the other finds an opening.",
    origin: "giants",
    keywords: [],
    portrait: "enemy-arkeyan-duelist",
  },
  {
    id: "giants-bag-o-boom",
    name: "Bag O' Boom",
    element: "neutral",
    creature: "fox",
    edges: [0, 4, 0, 0],
    description:
      "A demolition-happy troublemaker whose bag always seems to contain one more explosive surprise.",
    origin: "giants",
    keywords: [],
    portrait: "enemy-bag-o-boom",
  },
  {
    id: "giants-shadow-duke",
    name: "Shadow Duke",
    element: "neutral",
    creature: "fox",
    edges: [0, 0, 4, 0],
    description:
      "A sinister commander who favors dark corners and the moment an opponent stops watching them.",
    origin: "giants",
    keywords: [],
    portrait: "enemy-shadow-duke",
  },
  {
    id: "giants-arkeyan-sniper",
    name: "Arkeyan Sniper",
    element: "neutral",
    creature: "robot",
    edges: [0, 0, 0, 4],
    description:
      "A patient Arkeyan marksman whose precise fire makes an exposed position a very bad place to stand.",
    origin: "giants",
    keywords: [],
    portrait: "enemy-arkeyan-sniper",
  },
  {
    id: "giants-conquertron",
    name: "CONQUERTRON",
    element: "neutral",
    creature: "robot",
    edges: [4, 4, 4, 4],
    description:
      "A colossal Arkeyan war machine built to make its arrival feel less like a duel and more like a siege.",
    origin: "giants",
    keywords: [],
    portrait: "enemy-conquertron",
  },
  {
    id: "giants-arkeyan-bomber",
    name: "Arkeyan Bomber",
    element: "air",
    creature: "robot",
    edges: [2, 3, 1, 0],
    description:
      "An ancient mechanical bombardier who lobs explosive trouble into anything standing in its way.",
    origin: "giants",
    keywords: [],
    portrait: "enemy-arkeyan-bomber",
  },
  {
    id: "giants-boulder-bowler",
    name: "Boulder Bowler",
    element: "earth",
    creature: "fox",
    edges: [2, 2, 0, 2],
    description:
      "A hulking bowler who sends great rolling rocks down the lane and expects every opponent to be a pin.",
    origin: "giants",
    keywords: [],
    portrait: "enemy-boulder-bowler",
  },
  {
    id: "giants-boom-fiend",
    name: "Boom Fiend",
    element: "fire",
    creature: "fox",
    edges: [2, 1, 2, 1],
    description:
      "An explosive little menace who considers the blast radius an important part of his personal space.",
    origin: "giants",
    keywords: [],
    portrait: "enemy-boom-fiend",
  },
  {
    id: "giants-armored-chompy",
    name: "Armored Chompy",
    element: "water",
    creature: "slime",
    edges: [1, 1, 3, 1],
    description:
      "A hungry Chompy in protective armor, determined to get one more bite before the fight is over.",
    origin: "giants",
    keywords: [],
    portrait: "enemy-armored-chompy",
  },
  {
    id: "giants-life-spell-punk",
    name: "Life Spell Punk",
    element: "magic",
    creature: "fox",
    edges: [2, 1, 0, 3],
    description:
      "A Life spellcaster whose green magic makes nearby allies much harder to overlook.",
    origin: "giants",
    keywords: [],
    portrait: "enemy-life-spell-punk",
  },
  {
    id: "giants-grenade-general",
    name: "Grenade General",
    element: "tech",
    creature: "fox",
    edges: [0, 3, 2, 1],
    description:
      "A battlefield commander who issues his strongest orders one flying grenade at a time.",
    origin: "giants",
    keywords: [],
    portrait: "enemy-grenade-general",
  },
  {
    id: "giants-root-runner",
    name: "Root Runner",
    element: "life",
    creature: "serpent",
    edges: [2, 1, 2, 1],
    description:
      "A quick-moving plant creature whose reaching roots turn a forest path into a sudden obstacle.",
    origin: "giants",
    keywords: [],
    portrait: "enemy-root-runner",
  },
  {
    id: "giants-trog-wanderer",
    name: "Trog Wanderer",
    element: "undead",
    creature: "fox",
    edges: [1, 2, 1, 2],
    description:
      "A roaming Trog who brings a rough weapon and a very direct approach to unwanted visitors.",
    origin: "giants",
    keywords: [],
    portrait: "enemy-trog-wanderer",
  },
  {
    id: "giants-dragonet",
    name: "Dragonet",
    element: "air",
    creature: "dragon",
    edges: [1, 3, 2, 2],
    description:
      "A small dragon whose wings and fiery breath make size a poor measure of the trouble it can cause.",
    origin: "giants",
    keywords: [],
    portrait: "enemy-dragonet",
  },
  {
    id: "giants-crystal-golem",
    name: "Crystal Golem",
    element: "earth",
    creature: "golem",
    edges: [2, 2, 2, 2],
    description:
      "A hulking crystal creature whose glittering shell hides a thoroughly unyielding attitude.",
    origin: "giants",
    keywords: [],
    portrait: "enemy-crystal-golem",
  },
  {
    id: "giants-blazer-brewer",
    name: "Blazer Brewer",
    element: "fire",
    creature: "fox",
    edges: [3, 1, 2, 2],
    description:
      "A dangerous brewer whose fiery mixtures tend to make a dramatic impression on the first sip.",
    origin: "giants",
    keywords: [],
    portrait: "enemy-blazer-brewer",
  },
  {
    id: "giants-slobbering-mutticus",
    name: "Slobbering Mutticus",
    element: "water",
    creature: "fox",
    edges: [1, 3, 3, 1],
    description:
      "A drooling, sharp-toothed brute whose enthusiasm for a fight is matched only by his appetite.",
    origin: "giants",
    keywords: [],
    portrait: "enemy-slobbering-mutticus",
  },
  {
    id: "giants-arkeyan-crackler",
    name: "Arkeyan Crackler",
    element: "magic",
    creature: "robot",
    edges: [2, 3, 2, 1],
    description:
      "An ancient machine that crackles with power before sending a dangerous charge toward its target.",
    origin: "giants",
    keywords: [],
    portrait: "enemy-arkeyan-crackler",
  },
  {
    id: "giants-arkeyan-shield-juggernaut",
    name: "Arkeyan Shield Juggernaut",
    element: "tech",
    creature: "robot",
    edges: [0, 1, 3, 3],
    description:
      "A heavy Arkeyan guardian whose massive shield turns a direct assault into a very long afternoon.",
    origin: "giants",
    keywords: [
      {
        type: "shield",
        side: 1,
        amount: 2,
      },
      {
        type: "shield",
        side: 3,
      },
    ],
    portrait: "enemy-arkeyan-shield-juggernaut",
  },
  {
    id: "giants-goliath-drow",
    name: "Goliath Drow",
    element: "life",
    creature: "fox",
    edges: [4, 1, 0, 1],
    description:
      "An enormous Drow fighter who makes the rest of the war band look almost reasonable.",
    origin: "giants",
    keywords: [],
    portrait: "enemy-goliath-drow",
  },
  {
    id: "giants-gargantula",
    name: "Gargantula",
    element: "undead",
    creature: "spider",
    edges: [0, 1, 4, 1],
    description:
      "A huge spider whose long legs and reaching webs make the whole battlefield feel like its hunting ground.",
    origin: "giants",
    keywords: [],
    portrait: "enemy-gargantula",
  },
  {
    id: "giants-trogmander",
    name: "Trogmander",
    element: "magic",
    creature: "dragon",
    edges: [1, 2, 2, 2],
    description:
      "A commanding Trog who leads from the front and expects the rest of the band to follow his example.",
    origin: "giants",
    keywords: [],
    portrait: "enemy-trogmander",
  },
  {
    id: "giants-arkeyan-ultron",
    name: "Arkeyan Ultron",
    element: "tech",
    creature: "robot",
    edges: [2, 2, 2, 2],
    description:
      "A formidable Arkeyan construct whose ancient weapons still have plenty of power left in them.",
    origin: "giants",
    keywords: [],
    portrait: "enemy-arkeyan-ultron",
  },
];
export const CHARACTER_REFERENCE =
  "https://github.com/velasquezd/SkylanderImages/tree/9b43be566894d8e94292c012468d86553487adcb";
export const LEGACY_STARTER_IDS = [
  "emberwing",
  "mossback",
  "tidecaller",
  "nocturne",
  "sunfox",
  "pebble",
  "cloudpaws",
  "glowcap",
  "cinder",
  "moonwatch",
  "seasprout",
  "stardust",
];
export function characterForBudget(
  seed: number,
  budget: number,
  element?: Element,
  excluded: readonly string[] = [],
): Stone {
  // A Skystones picture includes its own pip markings. Only use that identity
  // at its original printed budget; character portraits can take any budget.
  const all = [
    ...CHARACTER_STONES,
    ...ENEMY_STONES.filter(
      (stone) => stone.edges.reduce((a, b) => a + b, 0) === budget,
    ),
  ].filter((stone) => !excluded.includes(characterIdentity(stone)));
  if (!all.length) throw new Error("No unused character is available.");
  const filtered = element
    ? all.filter((stone) => stone.element === element)
    : all;
  const pool = filtered.length ? filtered : all;
  const distance = Math.min(
    ...pool.map((stone) =>
      Math.abs(stone.edges.reduce((a, b) => a + b, 0) - budget),
    ),
  );
  const candidates = pool.filter(
    (stone) =>
      Math.abs(stone.edges.reduce((a, b) => a + b, 0) - budget) <= distance + 1,
  );
  return candidates[(seed >>> 0) % candidates.length];
}
export function characterIdentity(stone: Stone): string {
  return (
    stone.characterKey ||
    stone.portrait ||
    stone.name.trim().toLowerCase().replace(/\s+/g, " ")
  );
}
export function refreshCharacterFlavor(stone: Stone): Stone {
  if (
    !/Pips adapt the character|A single balanced edition replaces|^A Skylanders stone found during the adventure\.$|^A contender from the shared draft table\.$/.test(
      stone.description,
    )
  )
    return stone;
  const cards = [...CHARACTER_STONES, ...ENEMY_STONES];
  const source =
    cards.find((card) => card.portrait === stone.portrait) ||
    cards.find((card) => card.portrait === stone.characterKey);
  return source ? { ...stone, description: source.description } : stone;
}
// Adventure difficulty selects stronger characters, rather than rerolling the
// stats or abilities of a character that the player already knows.
export const ADVENTURE_CHARACTERS: Stone[] = [
  ...CHARACTER_STONES,
  ...ENEMY_STONES,
].map((stone) => {
  const source = skystonesPicture(stone);
  if (source) return { ...stone, edges: [...stone.edges], keywords: [] };
  const hash = characterHash(characterIdentity(stone));
  const role =
    CHARACTER_PORTRAITS.find(
      (portrait) => portrait.id === stone.portrait,
    )?.role.toLowerCase() || "";
  // Protected Giants and Minis retain their existing Adventure profiles.
  // Other characters use the same authored base as the normal collection.
  if (!/mini|sidekick|giant/.test(role))
    return {
      ...stone,
      edges: [...stone.edges],
      keywords: structuredClone(stone.keywords || []),
    };
  const budget = /mini|sidekick/.test(role) ? 1 + (hash % 3) : 8 + (hash % 3);
  const edges: [number, number, number, number] = [0, 0, 0, 0];
  for (let pip = 0; pip < budget; pip++) {
    const side = [0, 1, 2, 3]
      .filter((side) => edges[side] < 5)
      .sort(
        (a, b) =>
          stone.edges[b] / (edges[b] + 1) - stone.edges[a] / (edges[a] + 1),
      )[0];
    edges[side]++;
  }
  return { ...stone, edges, keywords: structuredClone(stone.keywords || []) };
});
export function adventureCharacter(
  seed: number,
  budget: number,
  excluded: readonly string[] = [],
  keywords?: boolean,
  definitions: Stone[] = ADVENTURE_CHARACTERS,
): Stone {
  const available = definitions.filter(
    (stone) => !excluded.includes(characterIdentity(stone)),
  );
  if (!available.length)
    throw new Error("No unused Adventure character is available.");
  // Prefer the requested strength before considering keyword density, so a
  // keyword preference cannot turn a later reward into a weaker character.
  const distance = Math.min(
    ...available.map((stone) =>
      Math.abs(stone.edges.reduce((a, b) => a + b, 0) - budget),
    ),
  );
  const closest = available.filter(
    (stone) =>
      Math.abs(stone.edges.reduce((a, b) => a + b, 0) - budget) === distance,
  );
  const preferred = closest.filter(
    (stone) => !!stone.keywords?.length === keywords,
  );
  const candidates = preferred.length ? preferred : closest;
  return candidates[(seed >>> 0) % candidates.length];
}
export function skystonesPicture(stone: Stone): Stone | undefined {
  return ENEMY_STONES.find((original) => original.portrait === stone.portrait);
}
export function hasSkystonesArtwork(stone: Stone): boolean {
  return (
    (!stone.image && !!skystonesPicture(stone)) ||
    (stone.origin === "giants" && !!stone.image && !stone.portrait)
  );
}
// Preserve earned pips, keywords, and card IDs while repairing old random copies.
// Deliberate Duplicator-event copies retain their chosen character.
export function uniqueCharacters(
  cards: Stone[],
  seed: number,
  excluded: readonly string[] = [],
): Stone[] {
  const used = [...excluded];
  return cards.map((stone) => {
    if (stone.conjured) return stone;
    if (
      !used.includes(characterIdentity(stone)) ||
      stone.id.startsWith("custom-duplicate-")
    ) {
      used.push(characterIdentity(stone));
      return stone;
    }
    const identity = characterForBudget(
      seed ^ characterHash(stone.id),
      stone.edges.reduce((a, b) => a + b, 0),
      stone.element,
      used,
    );
    used.push(characterIdentity(identity));
    return {
      ...stone,
      name: identity.name,
      description: identity.description,
      portrait: identity.portrait,
      ...(stone.tribes !== undefined ? { tribes: undefined } : {}),
      characterKey: undefined,
      defaultRevision: undefined,
      image: undefined,
      baseEdges: undefined,
      baseKeywords: undefined,
      origin:
        stone.edges.reduce((a, b) => a + b, 0) > 12
          ? "giants"
          : identity.origin,
    };
  });
}
export function pictureMatchesStats(
  stone: Stone,
  edges = stone.edges,
): boolean {
  const original = skystonesPicture(stone);
  return (
    !!original &&
    stone.element === original.element &&
    edges.every((edge, side) => edge === original.edges[side])
  );
}
export function characterHash(text: string): number {
  return (
    Array.from(text).reduce(
      (value, char) => Math.imul(value ^ char.charCodeAt(0), 16777619),
      2166136261,
    ) >>> 0
  );
}
export function withCharacterPortrait(stone: Stone): Stone {
  if (stone.portrait || stone.image) return stone;
  const character = characterForBudget(
    characterHash(stone.id),
    stone.edges.reduce((a, b) => a + b, 0),
    stone.element,
  );
  return { ...stone, portrait: character.portrait };
}
export function migrateDeckId(id: string): string {
  if (id === "giants-bark-demon") return "skylander-tree-rex";
  if (ENEMY_STONES.some((stone) => stone.id === id)) return id;
  return id.startsWith("giants-") ? id.replace(/-[2-6]$/, "") : id;
}
