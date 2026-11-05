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
previous played card matches the new card's element. Hover a card for full rules.
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
