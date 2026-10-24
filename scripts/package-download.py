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

Use Card studio to make a stone. Save it, then add it to your deck in Collection.
Use Adventure for the roguelike expedition. Both normal matches and adventures
offer 3x3 (5-card hands) and 4x4 (8-card hands) boards.
Use Draft for a two-player shared-pool draft, then play with your drafted hands.
Adventure includes 30 relics and a 12-pip Dizzy card event. Hover or tap cards
to read their keywords. Draft picks and adventure progress save automatically.

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
