# Skystones

A browser game inspired by classic Skylanders Skystones, with a Giants card catalogue, sixteen illustrated creature presets, a custom card studio, and a roguelike Adventure mode. Built with React, TypeScript, and Vite. Everything runs in the browser; no account, API keys, or backend is needed.

## Download and play

1. [Download Skystones.zip](https://github.com/BernOver/Skystones/raw/refs/heads/main/downloads/Skystones.zip).
2. Extract the ZIP into a folder on your computer.
3. Double-click **Skystones.html** and open it in Chrome or Microsoft Edge.

The download contains the whole game. No installation, terminal, or server is required. Use **Card studio** to make cards, then add them to your deck in **Collection**. Choose **Adventure** to start or resume a roguelike run.

## Run

For a version that runs without Node or a server, build it once with `npm run build:standalone`, then open `standalone/Skystones.html` in a modern browser. The single HTML file includes the game, artwork, fonts, card studio, and image exporter. You can copy it to another computer and open it there directly. Keep the file in the same location to retain browser-local card saves, and export card files to back them up.

Use Node.js 24 (the version in `.nvmrc`) and npm.

```sh
npm ci
npm run dev
```

The development server listens on port 5173 by default. In the cloud workspace, the checkout is `/workspace/Skystones`. If the default npm cache is unavailable, run `npm ci --cache /workspace/.cache/npm`.

```sh
npm run build   # Type check and create the production site in dist/
npm run preview # Serve the production build
npm test        # Rule-engine and card-validation tests
npm run test:e2e # Complete games, card creation, storage, exports, uploads, responsive layout
```

Browser tests use system Chromium when available. Otherwise install the browser with `npx playwright install chromium`. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to use another Chromium binary. The test runner starts the development server automatically, or reuses an existing server on port 5173.

## Play

Select a stone from your hand, then an empty square. A higher facing edge captures an adjacent opposing stone. Equal facing edges leave ownership unchanged. There are no diagonal or chain captures. When the board fills, the player controlling more stones wins; unplayed cards do not count. Equal final scores on 4×4 are a draw.

- Play against Willow, a computer rival that weighs captures and possible counterattacks.
- Choose **New match → Bring a friend** for local two-player play. Player one uses your selected deck; player two receives a shuffled original deck.
- Choose **3×3** for five-card hands and nine squares, or **4×4** for eight-card hands and sixteen squares. Both computer and local play support either board. Choose the board size in New match or Collection; a complete deck automatically expands or trims when switching size.
- In **Collection**, choose exactly five or eight distinct stones for your next game, depending on the board size. Deck changes do not modify a match in progress.
- In **Card studio**, name your stone, select a creature and element, or upload a PNG, JPEG, or WebP image up to 2 MB. Set each edge from 0–5, with a total budget of 12 points.
- Save your creation, then add it to your deck in Collection. Elements determine Resonance counts; captures still compare facing pips.
- Hover over a card in your hand or on the board for an enlarged card, edge strengths, keyword explanations, and backstory. Keyboard focus also opens the larger view. On touch screens, tap a board card, or select a hand card and choose **Inspect selected**.
- Download card images as PNG files. Export and import `.skystone.json` card files to back up or share playable cards.

## Giants collection and artwork

The **Giants** collection tab contains all 81 entries in the linked community reference, including rank variants. It preserves their names, elements, and directional pips. Neutral represents the reference's `None` element; Tech and Undead are available too. 80 cards use bundled original game images. Bark Demon uses an illustrated golem because its image is absent from the reference. The catalogue is a community transcription, not an independently verified official database. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for the exact source revision and artwork attribution.

Original Conquertron keeps its 4/4/4/4 stats. Giants-origin card-file exports can retain a 16-pip budget and 40-character names; ordinary custom cards retain their 12-pip budget and 24-character names.

The studio now offers sixteen presets. The eight additions are **Slime, Bat, Spider, Robot, Griffin, Crab, Serpent, and Treasure chest**, all original SVG illustrations that work offline and in card image exports.

## Adventure

Choose **Adventure** and select a 3×3 or 4×4 board before starting. The run uses a separate deck and purse, starts with **3 lives, 60 gold, a Power Tonic, and a Healing Draught**, and saves after every move and choice. New runs start with stronger **4–5-pip cards**, each with at least one two-pip edge and some weaker sides; the first enemies still have mostly 0/1 edges. Take exactly five or eight cards from your traveling pack into each battle. Rewards join the pack; use **Expedition deck** to swap them into the active deck.

- Follow a nine-stop route with branching battles, events, two merchants, an elite keeper, a campfire, and the final boss. A lost battle costs one life; a normal draw does not. Losing the last life ends the run. Regular victories award 25 + 5 per floor in gold; elites add 20. Choose one of three card rewards, with printed budgets growing gradually from 4 to 12 as the route advances. Some wins also award a potion if the three-slot belt has room.
- **The Brass Chest / Gilded Cache:** challenge a keeper with a guarded chest already on a central square (B2 on either board). Control it when the board fills for **45 extra gold**, even if you lose the overall score. If the keeper recaptures it before the finish, there is no bonus. You may also leave the chest alone.
- **Events:** the Whispering Well heals one life or exchanges a life for 40 gold; the Alchemist offers a free potion; the campfire heals a life or permanently adds a pip to one chosen stone.
- **Shops:** buy any of three displayed stones, stock up on potions, or visit the workshop. **Sharpen (25 gold)** adds a pip on the shop's randomly rolled edge. **Reforge (20)** changes a chosen card's element. **Inscribe (35)** adds the shop's randomly rolled keyword and direction; Resonance includes a rolled element, Sunder states its strength, and Silence affects the whole card. Offers are visible before buying and stay fixed for that merchant visit, including after purchases, selecting a different stone, or reloading. You choose which card receives the offered upgrade. Upgrades last for the adventure and use the normal 5-per-edge / 12-total printed-stat limits. Invalid purchases and duplicate keywords spend no gold. Bought cards must be swapped into the battle deck.
- **Potions:** Power Tonic gives a chosen hand card +1 on all edges for that battle; Hex Vial removes one pip from every edge of a chosen enemy board card, stopping at zero; Healing Draught restores one life, up to three. Combat potions require your turn and do not consume it. Healing works between encounters too. Potions are consumed once and the belt holds three.
- **Crown Warden:** the boss begins with two enemy guards already on the board. Its central throne has weak north/south edges. To win the run you must **control the throne and have the higher score** when the board fills. A higher score alone is not enough. If you survive a failed attempt, you may revise your deck and try the boss again.

Changing pages pauses the adventure; returning resumes it. Normal games and the custom card collection remain separate from the run. Progress is browser-local; clearing browser storage removes it.

## Keywords

Add keywords in the card studio. For Resonance, choose the element to count. For Sunder, choose a fixed edge or choose the edge when played, and set the number of pips to remove. Silence affects all keywords and needs no edge. Some original cards demonstrate the bonus keywords.

- **Head Start:** the specified edge gains **+1 pip** if the player is winning immediately before playing that card.
- **Comeback:** the specified edge gains **+1 pip** if the player is losing immediately before playing that card.
- **Resonance:** the specified edge gains **+1 pip for every card of the chosen element already on the board**, counting both players' cards. For example, **Resonance · Fire · East** adds **+3 East pips** if there are three Fire cards on the board. The card being played does not count, even if it is also Fire.
- **Sunder:** choose a card already on the board. Remove **up to its stated number of pips from the target edge**, to a minimum of zero. Set **Pips removed** from 1–99 in Card studio; older cards default to 1. For example, Sunder 3 reduces a five-pip edge to two, or a two-pip edge to zero. Set **Target edge → Any · choose when played** for a flexible version: when played, select any card anywhere on the board, then choose North, East, South, or West. Only edges with at least one pip can be chosen. Fixed-edge Sunder remains available, and both versions can appear on the same card. The actual reduction is recorded in the hover preview and move log, and remains through captures and Silence.
- **Silence:** choose a card already on the board. **Disable all its keywords and remove their pip bonuses** for the rest of the match. Its printed stats and element remain. Earlier captures and resolved Sunder/Silence effects stay; Silence does not reverse past actions.
- When playing Sunder or Silence, pick an empty placement square, then select a highlighted board card in the target picker. Either player's cards can be targeted, including nonadjacent cards. The new card cannot target itself. Canceling the picker leaves the entire turn untouched. Targeted effects resolve in the card's listed order before captures, so weakening a defender can enable the new card's capture. Effects with no valid target are skipped, including on an empty board. Sunder cannot target a zero edge; Silence cannot target a card without keywords or an already silenced card.
- Head Start and Comeback compare the number of controlled stones on the board **before placement**. A tie activates neither of those; Resonance works independently of the score.
- Check each keyword **once** when the card is played. Activated bonuses stay on that card for the rest of the match, including after captures or score changes, unless Silence removes them. Inactive keywords never activate later.
- Activated pips count for both capturing and defending. Green edge numbers show the resolved strength; the enlarged view shows the base value, total bonus, and each Resonance count. Different keywords on the same edge add together. Bonuses can raise an edge above 5 and do not spend printed-stat budget points.
- The same keyword cannot appear twice on the same edge; Silence appears at most once per card. Cards without keywords, including older card-file exports, still work. Hover inspection shows reduced edges, Silence status, and the targets of resolved effects. The computer also selects targets when simulating moves.

Custom cards, board size, deck selection, and sound preference are saved in this browser's local storage. Normal matches start fresh on reload; Adventures resume their saved state. An incomplete saved normal deck uses a starter deck for the initial practice match; complete your five- or eight-card deck before starting another match. Clearing site data removes the collection and adventure, so export any custom creations you want to keep. Storage failures display a message rather than claiming a save succeeded.

## Project

- `src/game.ts`: pure rules, scoring, computer strategy, and imported-card validation.
- `src/Artwork.tsx`: original SVG creature illustrations and card rendering.
- `src/App.tsx`: game table, collection, card studio, persistence, and dialogs.
- `src/CardInspection.tsx` and `src/KeywordEditor.tsx`: enlarged card rules and directional keyword editing.
- `src/adventure.ts` and `src/Expedition.tsx`: saved adventure state, rewards, encounters, potions, merchants, boss conditions, and adventure interface.
- `src/giants-data.json`, `src/giants.ts`, and `src/assets/giants`: the sourced Giants card catalogue and bundled artwork.
- `tests/game.test.ts`: isolated rules and validation checks.
- `tests/keywords.test.ts`: keyword timing, capture and defense bonuses, permanent activation, and import validation.
- `tests/browser/app.spec.ts`: Playwright browser workflows.
- `tests/browser/keywords.spec.ts`: mouse, keyboard and touch inspection, keyword editing, saved cards, and card-file sharing.
- `tests/adventure.test.ts` and `tests/browser/adventure.spec.ts`: both board sizes, card catalogue, run progression, purchases, potion use, chest money, boss objectives, persistence, and phone layouts.

To refresh the downloadable ZIP after changing the app, run `npm run package:download`. This rebuilds the standalone HTML and packages it in `downloads/Skystones.zip`; Python 3 is needed only for the packaging step. Commit the updated ZIP with the source changes.

Fonts and artwork are bundled locally. This is an independent fan-made tribute, not affiliated with Skylanders or Activision; no official game assets are included.
