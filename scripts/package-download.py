from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

root = Path(__file__).resolve().parent.parent
html = root / "standalone" / "Skystones.html"
if not html.is_file():
    raise SystemExit("Build the standalone game with npm run build:standalone first.")

instructions = """SKYSTONES — START HERE

1. Extract this ZIP into a folder on your computer.
2. Double-click Skystones.html. Choose Chrome or Microsoft Edge if asked.
3. Play! No installation, account, or server is required.

Export everything at once: Collection > Export all cards downloads
Skystones-all-cards.json. It includes every current built-in, edited character
default, custom card, token template, uploaded image, custom tribe name, and
original factory definitions for comparison, even when filters hide cards.
Share this one JSON file for a review. It is a collection report; Import card
continues to use individual .skystone.json exports. Exporting changes no saves.
When updating this game, replace Skystones.html in its EXISTING folder and use
the SAME browser to keep access to your existing card edits and saved games.

Character balance: ordinary Skylander bases center on 5-8 pips, with some weaker
and a few stronger cards (about 6.37 pips on average across Skylanders).
Giants Skystones, Giant Skylanders, and Minis keep their exact existing pips
and keywords, including their Adventure profiles. New character descriptions
replace generic flavor. Authored descriptions and saved card edits stay yours.
Old boilerplate flavor refreshes without changing saved stats or keywords.
All 16 keywords appear across the roster. Fire uses discard fuel and Scavenge;
Life grows with Resonance; Undead weakens enemies; Magic focuses on Conjure.
Water defends and counters; Earth fortifies and breaks defenses; Air shifts
positions; Tech chains Combo and prepared buffs; Light supports the next card;
Dark disrupts and ambushes; Kaos brings unpredictable chaos. Select an element
in Collection for its theme. Weak Adventure starts and gradual enemies remain.
Rewards choose the nearest fixed pip budget before preferring keyword density.

Choose Board skins (the palette button at the top) for six themed tables:
Giants Table, Arkeyan Ruins, Sky Citadel, Lava Forge, Frozen Vault, Golden Court.
Skins work on both board sizes in normal, Draft, and Adventure play, and your
choice is saved. Choose a villain in New match > Opponent. Adventure map
combat choices show the enemy portrait, character name, and matching flavor
text before you enter. The same title and story follow you into the battle.

The collection contains 182 Skylanders/forms and 39 unique Giants opponents.
Card studio has 377 searchable portraits, including 156 without a default card.
Shield adds defense-only pips. Combo grants pips and/or keywords when your
previous played card matches its element/tribe requirement. Hover for full rules.
Captured cards flip to show their new owner, then stay fully visible.
Arkeyan Bomber has 3 pips on its right edge and 0 on its left.
Sunder can repeat on the same edge. Choose a target for each entry; all
entries resolve in order, before captures. Repeated Any-edge Sunder is allowed.
Head Start and Comeback support Bonus pips from 1-99 in Card studio. Head Start
activates while winning before placement, Comeback while losing. A tie triggers
neither. Older cards default to +1. Configured amounts also work through Combo,
Next Play, and Conjure. Check once on play; bonuses stay after score changes or
captures unless Silence removes them. Ordinary pip strengths cap at 99.
Adventure characters have fixed starting pips and keywords across runs.
Random packs and offers avoid duplicate characters; old saves repair them.
Original Skystones bases match their pictures and start without keywords.
Adventure shops can add keywords to them, which persist through reloads.
Their embedded pip markings are hidden when an upgrade changes the pips.

In Collection, open a built-in character > Edit character default. Save its
name, portrait, element, pips, and keywords as the base for that character in
new games, new Draft pools, and newly generated Adventure cards. Existing
games and copies in an Adventure keep their saved cards. Restore original
default in the character details to reset it. Defaults save in this browser.

Use Card studio to make a stone. Selecting a portrait updates its name to
that character; you can edit the name afterward. Save it, then add it to your
deck in Collection.
Multiple saved decks: in Collection, use New deck, Duplicate deck, Rename deck,
and Delete deck. Give each deck a name and choose 3x3 (5 cards) or 4x4 (8 cards).
Edits save automatically in this browser, even before the deck is complete.
Your existing selection becomes My deck. Switch with Saved deck in Collection
or Match deck when starting a new match. A complete selected deck supplies your
exact hand. Board sizes remember their last selected deck; the first switch to
a new size creates a separate resized copy and keeps the original.
Deleting a deck keeps the cards. Deleting a custom card or turning it into a
token removes it from every saved deck. Incomplete decks need replacements
before starting a new match. The current match keeps its hand and board.

SWAP Force: keep at least two unplayed SWAP Force characters in your hand.
On your turn choose Swap Force > exchange halves, choose two cards, preview the
results, then Swap halves. Both cards remain in hand and no turn is spent.
Each keeps its top (North/West) and receives the other's bottom (South/East).
Wash Buckler and Blast Zone become Wash Zone and Blast Buckler. The top sets
the element; both parts supply tribes. Cards in play cannot swap. The SWAP Force
character tribe enables it; the SWAP Force Era game-family tag alone does not.
In Card studio > Keywords, use Keyword half to assign every keyword to Top or
Bottom. The whole effect travels with that half, independently of its target
direction. Older directional keywords follow their edges; global ones use Top.
Assignments work in character defaults and shared card files. Swap again with
the same pair or a third card before placement. No keywords, Conjure, Dizzy,
discards or Next Play effects trigger or get spent just by exchanging halves.
Hand pip and Shield gifts follow their sides. Mixed cards can exceed the usual
pip budget using the points already on those halves. Each half has its own unique-keyword slots; matching keywords can be on both.
The 24-keyword card limit and tribe limits remain; oversized pairs are blocked and
show an explanation. All 16 original SWAP Force characters can pair together.
Portraits show diagonal halves by default. Toggle Show SWAP Force artwork as
top and bottom in the swap dialog, SWAP Force card maker, or Board skins for a
horizontal cut. It changes artwork only and saves across modes and reloads.
Swaps work on both boards in normal, Draft and Adventure matches. They last for
this battle only; original decks, cards, defaults, token templates, Adventure
packs and Draft picks stay unchanged. Adventure reloads retain both parts,
held and played stats, pictures and half keywords. Cancel swaps to keep the hand.

Custom tribes: in Card studio > Tribes, enter a name and choose Add tribe.
New tribes are selected immediately and available on other cards and in Combo,
Resonance, Next Play, Conjure, environments and Collection filters. Card files
include custom tribe names, including nested keywords and token dependencies.

Adventure workshop: open it from Adventure setup or the run screen. Edit an
original encounter or choose New encounter. Create or reuse an enemy character;
choose a bundled portrait or upload a PNG/JPG/WebP up to 2 MB. Set its name,
encounter title and story. Saved character edits update encounter definitions
that share that character. Existing battles keep their saved setup.
Choose one or more pools: Easy encounters, Hard encounters, Events, Bosses.
Choose Act 1, Act 2, or both. Pool and act selections can be combined freely.
Event fights offer Fight or Leave. Stops with no matching fights can be skipped.
Use a generated enemy hand or choose any 0-20 cards, independently of board size.
Duplicates, custom cards and starting tokens are allowed without Conjure. Every
copy keeps its chosen stats and gets a unique battle identity. Empty hands pass;
custom duels end when the board fills or both hands are empty. Extra cards may
remain unused. Templates, player decks and packs stay unchanged. Reloads retain
starting tokens, repeated cards, portraits and the exact active encounter.
Choose Standard, Treasure chest, Throne, Elemental Vortex, or Golden throne
starting conditions. Boss pool membership controls act progression.
Test encounter uses current edits, including unsaved changes. Choose a board
size, act and pool to practice with a fresh Adventure player deck. Tests do not
write the saved run or spend its gold, lives or rewards. Restart test retries;
Back to encounter editor keeps the edits. Save encounter before changing fights.
Saved edits apply to new fights, including the remaining map of a saved run.

Discard abilities: add them in Card studio > Add keyword.
- Discard: remove 1-5 chosen or random cards from your hand, the opponent's,
  or both. Repeat for separate groups. Resolve captures, then all Conjure gains,
  then discards. Chosen discards can include freshly generated cards. The card's
  player chooses the victims. Canceling leaves the whole play unchanged.
- Scavenge: board cards gain configured pips and/or Shield for each actual
  discard from your hand, the opponent's, or either hand. Buffs do not repeat
  captures. Skipped discards grant nothing.
- Parting Gift: when discarded, add or remove pips, add Shield, and/or give up
  to five keywords. Target either player's hand or board, both hands or boards,
  or the card causing the discard. Affect all cards, 1-5 chosen cards, or 1-5
  random cards. Its owner chooses chosen targets, even during an enemy turn;
  Choose automatically resolves a reaction without making a manual choice.
  Pips stay between zero and 99. Hand gifts work on later plays or discards.
  Board gifts activate passive abilities without replaying on-play effects or
  captures. Add multiple Parting Gift entries for different targets or effects.
  Changes last for this battle and survive reloads. Permanent card templates
  and the Adventure pack stay unchanged. Silence disables board discard gifts.
- Discard Priority: random discards select the highest priority first (1-99).
  Unmarked cards rank zero; equal priorities are random. Chosen discards ignore
  priority. These hand-only abilities can be printed or granted by Conjure.
Each player ALWAYS keeps enough cards for every remaining turn on the board.
Unsafe discards are skipped. Conjure counts only cards actually gained after
its hand cap, filters and token availability. Priority never overrides safety.
On a fresh 4x4 board there are no spare cards without Conjure. Battle logs and
inspection show discarded cards, protected counts and buffs. Adventure saves
temporary hand buffs and completed discard histories. New Draft pools, shops,
shrines and transformations include the new abilities; older pools stay intact.
Use Adventure for the roguelike expedition. Both normal matches and adventures
offer 3x3 (5-card hands) and 4x4 (8-card hands) boards.
Use Draft for a two-player shared-pool draft, then play with your drafted hands.
Adventure has two nine-stop acts: defeat Kaos, then Golden Queen.
Act I offers Throne of Chaos or the new Elemental Vortex boss. The vortex
changes element and arena color after every card. Matching cards on both
sides gain +1 on all edges for that turn; the Next element icon previews it.
Start with 2-3-pip cards and no potions; enemies and rewards grow gradually.
Adventure includes 31 relics, 15 potions, 54 adapted Spire encounters, and a
12-pip Dizzy card event. Dizzy independently rolls 0-5 on its selected sides
before captures. A ? marks each affected side until played; other sides stay
unchanged. Results stay fixed. Loaded Dice changes the range to 2-5.
Older whole-card Dizzy cards roll all four sides. Hover or tap cards
to read their keywords. Draft picks and adventure progress save automatically.
Shops reroll for 20 gold; Merchant’s Die gives one free reroll per shop.
The Runesmith’s Shrine adds keywords; the Twinflame Forge combines two cards.
Spire Crossroads offer adapted encounters in each act. Card transformation
can grant up to 5 keywords. The potion and event guides explain all choices.

New card effects: in Card studio > Add keyword, choose Next Play, Shift,
or Environment.
Next Play queues + or - 1-5 pips on one side or every side, for your next card
or the opponent's next card. It can also grant up to five configured keywords,
with or without a pip change. Add keywords, then choose None in Pip change for
a keywords-only effect. Queued gifts appear in hand previews and activate on
the recipient's next matching play, before Dizzy and captures. Targeted gifts
use the normal target picker. Combo can grant Next Play, and Next Play can
grant Combo or another Next Play, up to three nested levels. Conjure token
templates inside gifts are bundled when sharing a card. Existing unique
keywords take priority, and a card holds at most 24 keywords. Queued changes
stack in cast order and are spent once. Canceled plays spend none.

Next Play elements: choose Recipient element to wait for a card of that element,
Change next card's element to recolor the receiving card, or both. A chosen tribe
must match too. For example: the next Water Giants card becomes Fire and gains
+2 North pips. Requirements check the submitted card before any element changes;
unrelated cards do not spend the queue. Choose None in Pip change for an
element-only effect. Matching changes resolve in cast order; the last element
change wins. The new element applies before Combo, terrain, boss auras and
captures, and stays through captures, Silence and Adventure reloads. Original
cards and templates keep their element. Previews and inspection show the result.
These settings work through Combo and Conjure grants and in shared card files.

Shift automatically affects only the card adjacent to its printed side.
Choose its fixed movement direction (Up/Right/Down/Left) and whether it affects
enemies, allies, or both in the studio. There is no target choice during play.
It moves that neighbor one tile before captures, wrapping at the movement edge.
Target adjacency does not wrap. Missing/ineligible neighbors do nothing;
occupied destinations and the incoming card's tile block movement. Cards do
not swap or push. Moved cards keep their owner and resolved effects without
replaying keywords. Terrain stays on its tile; a chest follows its card.
Later effects and captures use the new positions. One Shift per printed side
is allowed, including through Combo and Next Play, on both board sizes.

Environment chooses any empty or occupied tile before captures. Seven terrains:
- Elemental Spring: a chosen element gains pips on one side or every side.
- Blight: lose pips on one side or every side, stopping at zero.
- Bastion: gain defense-only pips on all sides.
- War Banner: gain attack-only pips on all sides (orange sword badges).
- Crosswind: rotate ordinary pips one side clockwise; keyword directions stay.
- Mirror Pool: opposite sides share their stronger ordinary value.
- Equalizer: all sides use the average ordinary pip value, rounded down.
Only the newest environment on a tile applies. It affects either player and
stays on that tile through captures, Silence, and position swaps. Terrain and
unused Next Play queues expire with the battle. Board markers, the terrain
list, pending-effect summaries, and card inspection explain current effects.
New Draft pools and Adventure shops, shrines, and transformations offer them.

Tribes: cards can belong to Giants, SWAP Force, Trap Masters, SuperChargers,
Imaginators, Minis, Core, Villains, or Enemies, plus overlapping game families.
There is no Sensei tribe. Portraits choose their usual tags automatically;
edit or clear them in Card studio > Tribes. Collection can filter by tribe.
Editing a character default applies tags to new games and newly generated
cards; existing Adventure runs and drafted cards keep their saved copies.
Fusion combines both cards' tribes. Card-file exports include edited tags.
- Combo can match element, tribe, either, or both, using any shared tribe or
  a specific tribe. Both cards must have the chosen tribe for that check.
  Its card label shows the requirement: Combo Magic, Combo Giants,
  Combo Magic / Giants (either), or Combo Magic + Giants (both).
- Resonance can count a chosen tribe across both owners instead of an element.
- Next Play can wait for an element, tribe, or both; other cards do not spend it.
- All seven environments can affect a chosen tribe. Other cards are unaffected.
  Elemental Spring can match a tribe instead of an element.
New Draft pools, shops, shrines, and transformations can offer tribe effects.

Conjure: add it in Card studio > Add keyword. Choose a specified card from
the 221 built-in characters/forms and Giants opponents, or choose random cards.
Set 1-5 copies and give them to your hand, the opponent's hand, or both.
Optional buffs: set Extra pips on each generated card and/or Keywords for each
generated card. Add +1 to +5 on any chosen sides; None leaves that side alone.
Set all four sides to the same amount for a per-side bonus. Grant up to five
configured keywords. Buffs work on specified characters, tokens, and random
cards, including gifts through Combo and Next Play. Each copy gets them once
when generated, and keywords activate only when that copy is played.
Pips can exceed five on a temporary copy and remain through Silence; Dizzy
still rerolls marked sides and Sunder can damage them. Silence disables added
keywords. Existing unique keywords take priority and extra grants stop at 24
keywords per card. Original cards and token templates keep their stats.
Switching Conjure's source keeps its buffs. Card files include buffs and token
dependencies inside nested gifts. Adventure reloads keep the exact copies.
Random cards can require an element and/or tribe; all filters must match.
No matching cards means no additions. Repeat Conjure for different specified
cards. Combo can grant it too. Copies use saved character defaults or the fixed
base for that mode. They arrive after captures and can be played on later turns.
Creating cards does not activate their keywords or spend Next Play bonuses.
NEW: TRAPS, UNIQUE CARDS, PARTS AND AMPLIFY
Deck builder cards are larger, with room for art and keywords. New match shows
your selected deck before play and updates when you switch saved decks.
Collection > Traps: choose from 18 shared crystals or make your own. Only one
is active, affecting both players. The slot starts empty. A stone with the
Trap keyword places its crystal before captures. A later stone replaces it.
Traps can select multiple sides for pip, attack, defense, doubling, and ceiling
rules. Double a chosen keyword or all eligible keywords (excluding Amplify,
Flash, and Trap itself). Try mirrored opposite sides, equalized pips, or a
minimum Dizzy roll. Mix up to eight effects and reorder pip transformations.
Pip additions apply first; transformations run in order; attack/defense bonuses
apply afterward. Keyword doubling stacks with Amplify when effects trigger.
Shield doubling follows the active Trap, excluding potion/discard counters.
Upload a PNG, JPG, or WebP picture (up to 2 MB) for a circular portrait in the
crystal’s center. Pictures are saved and included when a card shares its Trap.
Card studio and Trap editors include Picture size (25-300%), Left / right,
Up / down, Picture fit, and Reset picture controls. Previews update immediately.
Choose Fit whole picture or Fill frame. Built-in stone portraits can resize too.
Trap uploads keep the full picture for reframing inside the circle. Saved cards,
card files, Adventure copies, and SWAP Force halves retain these adjustments.
Double or nullify named keywords, attack/defense modifiers, tile effects, or
an elemental arena bonus. Nullify overrides doubling. On-play keywords are
checked when played; Shield, discard reactions, and battlefield effects follow
the active crystal. Blocked effects do not spend queued Amplify charges.
Trap placement remains available so a different crystal can replace it.
There is no free Trap activation button.
Card studio: Unique cards can enter decks but normal Conjure cannot create them.
Use the explicit Unique Conjure source. Card exports bundle their dependencies.
Assemble generates either random Parts or specified Part templates. Add multiple
entries to generate a chosen pair. Two Parts automatically combine into a
Supercharger with both sets of pips and effects plus Flash. Play it without
ending your turn. Either player can cover it to inherit pips and effects except
Flash; inherited effects trigger again. Vehicles must be covered to finish.
Collection > Parts & recipes: create Parts, edit the six starter Parts, and
define fixed Superchargers for specific pairs (either order). Choose a vehicle
portrait, name and element; both Parts still supply their pips and effects.
Recipe changes apply to new battles; Adventure saves the battle recipe book.
SWAP Force cards have Add top-half keyword and Add bottom-half keyword buttons.
Matching keywords can be on both halves and travel with those halves.
All 20 base vehicles and 16 vehicle variants have bundled offline pictures;
four additional character variants also appear in the portrait picker.
Amplify doubles one effect type or all effects, either always on its card or
for the next 1-5 matching effects you play. Each match spends one queued use;
unrelated plays do not. Base pips and turn length never double.

Hands hold up to 20 cards; excess copies are skipped and reported. Larger hands
wrap onto additional rows. Canceled plays add nothing. Capture and Silence do
not remove cards already added. Copies are marked Conjured and last for this
battle only. Adventure saves them without repairing intentional duplicates;
they never join your pack or change saved Draft picks. New Draft pools, shops,
shrines, and transformations can offer Conjure.

Token cards are available through Conjure or custom enemy starting hands. Collection > Tokens includes
Chompy Seedling, Arkeyan Drone, Fire Spark, Water Wisp, Shadow Decoy, and Magic
Echo. Choose Create a token, or check Token only in Card studio. Set its pips,
element, tribes, portrait, and keywords, then Save token template.
On another card choose Conjure > Card source > Specified token. Random Conjure
can use Normal cards, Tokens only, or Cards and tokens; filters still apply.
The normal random pool stays unchanged unless you select a token pool.
Tokens never enter starting decks, Draft pools, Adventure packs, rewards, or
shops as ordinary cards. They keep their own template stats rather than using
character defaults. Token keywords activate when played, never on creation.
Generated copies last for the battle and save with Adventure progress. Template
edits affect future copies only. Starter templates have Restore token default.
Exporting a token or Conjure card includes its needed token templates; importing
installs them too. Matching token IDs update the template. File limit: 16 MB.

Cards are saved in your browser. Keep this file in the same folder and use the
same browser to retain your collection. Export card files from Collection to
back them up or move them to another computer.
"""
directory = root / "downloads"
directory.mkdir(exist_ok=True)
archive = directory / "Skystones.zip"
with ZipFile(archive, "w", ZIP_DEFLATED) as package:
    package.write(html, "Skystones.html")
    package.writestr("START HERE.txt", instructions)
    package.write(root / "THIRD_PARTY_NOTICES.md", "THIRD PARTY NOTICES.txt")
print(f"Download package: {archive} ({archive.stat().st_size:,} bytes)")
