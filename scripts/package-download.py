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

Choose Board skins (the palette button at the top) for six themed tables:
Giants Table, Arkeyan Ruins, Sky Citadel, Lava Forge, Frozen Vault, Golden Court.
Skins work on both board sizes in normal, Draft, and Adventure play, and your
choice is saved. Choose a villain in New match > Opponent. Adventure map
combat choices show the enemy portrait, character name, and matching flavor
text before you enter. The same title and story follow you into the battle.

The collection contains 182 Skylanders/forms and 39 unique Giants opponents.
Card studio has 337 searchable portraits, including 116 without a default card.
Shield adds defense-only pips. Combo grants pips and/or keywords when your
previous played card matches its element/tribe requirement. Hover for full rules.
Captured cards flip to show their new owner, then stay fully visible.
Arkeyan Bomber has 3 pips on its right edge and 0 on its left.
Sunder can repeat on the same edge. Choose a target for each entry; all
entries resolve in order, before captures. Repeated Any-edge Sunder is allowed.
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

New card effects: in Card studio > Add keyword, choose Next Play or Environment.
Next Play queues + or - 1-5 pips on one side or every side, for your next card
or the opponent's next card. Queued changes stack and are spent once when that
player places a card, before Dizzy and captures. Canceled plays spend none.

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
- Next Play can wait for the next matching tribe; other cards do not spend it.
- All seven environments can affect a chosen tribe. Other cards are unaffected.
  Elemental Spring can match a tribe instead of an element.
New Draft pools, shops, shrines, and transformations can offer tribe effects.

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
