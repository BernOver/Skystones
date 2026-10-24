# Skystones

A browser game inspired by classic Skylanders Skystones, with original illustrated creatures and a custom card studio. Built with React, TypeScript, and Vite. Everything runs in the browser; no account, API keys, or backend is needed.

## Download and play

1. [Download Skystones.zip](https://github.com/BernOver/Skystones/raw/refs/heads/main/downloads/Skystones.zip).
2. Extract the ZIP into a folder on your computer.
3. Double-click **Skystones.html** and open it in Chrome or Microsoft Edge.

The download contains the whole game. No installation, terminal, or server is required. Use **Card studio** to make cards, then add them to your deck in **Collection**.

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

Select a stone from your hand, then an empty square on the 3×3 board. A higher facing edge captures an adjacent opposing stone. Ties leave ownership unchanged. There are no diagonal or chain captures. After nine moves, the player controlling more stones wins; unplayed cards do not count.

- Play against Willow, a computer rival that weighs captures and possible counterattacks.
- Choose **New match → Bring a friend** for local two-player play. Player one uses your selected deck; player two receives five shuffled original stones.
- In **Collection**, choose exactly five distinct stones for your next game. Deck changes do not modify a match in progress.
- In **Card studio**, name your stone, select a creature and element, or upload a PNG, JPEG, or WebP image up to 2 MB. Set each edge from 0–5, with a total budget of 12 points.
- Save your creation, then add it to your deck in Collection. Elements determine Resonance counts; captures still compare facing pips.
- Hover over a card in your hand or on the board for an enlarged card, edge strengths, keyword explanations, and backstory. Keyboard focus also opens the larger view. On touch screens, tap a board card, or select a hand card and choose **Inspect selected**.
- Download card images as PNG files. Export and import `.skystone.json` card files to back up or share playable cards.

## Keywords

Add keywords in the card studio. For Resonance, choose the element to count. For Sunder, choose which edge of the target loses a pip. Silence affects all keywords and needs no edge. Some original cards demonstrate the bonus keywords.

- **Head Start:** the specified edge gains **+1 pip** if the player is winning immediately before playing that card.
- **Comeback:** the specified edge gains **+1 pip** if the player is losing immediately before playing that card.
- **Resonance:** the specified edge gains **+1 pip for every card of the chosen element already on the board**, counting both players' cards. For example, **Resonance · Fire · East** adds **+3 East pips** if there are three Fire cards on the board. The card being played does not count, even if it is also Fire.
- **Sunder:** choose a card already on the board. Remove **1 pip from its specified edge**, to a minimum of zero. The reduction remains through captures and Silence.
- **Silence:** choose a card already on the board. **Disable all its keywords and remove their pip bonuses** for the rest of the match. Its printed stats and element remain. Earlier captures and resolved Sunder/Silence effects stay; Silence does not reverse past actions.
- When playing Sunder or Silence, pick an empty placement square, then select a highlighted board card in the target picker. Either player's cards can be targeted, including nonadjacent cards. The new card cannot target itself. Canceling the picker leaves the entire turn untouched. Targeted effects resolve in the card's listed order before captures, so weakening a defender can enable the new card's capture. Effects with no valid target are skipped, including on an empty board. Sunder cannot target a zero edge; Silence cannot target a card without keywords or an already silenced card.
- Head Start and Comeback compare the number of controlled stones on the board **before placement**. A tie activates neither of those; Resonance works independently of the score.
- Check each keyword **once** when the card is played. Activated bonuses stay on that card for the rest of the match, including after captures or score changes, unless Silence removes them. Inactive keywords never activate later.
- Activated pips count for both capturing and defending. Green edge numbers show the resolved strength; the enlarged view shows the base value, total bonus, and each Resonance count. Different keywords on the same edge add together. Bonuses can raise an edge above 5 and do not spend printed-stat budget points.
- The same keyword cannot appear twice on the same edge; Silence appears at most once per card. Cards without keywords, including older card-file exports, still work. Hover inspection shows reduced edges, Silence status, and the targets of resolved effects. The computer also selects targets when simulating moves.

Custom cards, deck selection, and sound preference are saved in this browser's local storage. Matches start fresh on reload. An incomplete saved deck uses the starter deck for the initial practice match; select five cards before starting another match. Clearing site data removes the collection, so export any creations you want to keep. Storage failures display a message rather than claiming a save succeeded.

## Project

- `src/game.ts`: pure rules, scoring, computer strategy, and imported-card validation.
- `src/Artwork.tsx`: original SVG creature illustrations and card rendering.
- `src/App.tsx`: game table, collection, card studio, persistence, and dialogs.
- `src/CardInspection.tsx` and `src/KeywordEditor.tsx`: enlarged card rules and directional keyword editing.
- `tests/game.test.ts`: isolated rules and validation checks.
- `tests/keywords.test.ts`: keyword timing, capture and defense bonuses, permanent activation, and import validation.
- `tests/browser/app.spec.ts`: Playwright browser workflows.
- `tests/browser/keywords.spec.ts`: mouse, keyboard and touch inspection, keyword editing, saved cards, and card-file sharing.

To refresh the downloadable ZIP after changing the app, run `npm run package:download`. This rebuilds the standalone HTML and packages it in `downloads/Skystones.zip`; Python 3 is needed only for the packaging step. Commit the updated ZIP with the source changes.

Fonts and artwork are bundled locally. This is an independent fan-made tribute, not affiliated with Skylanders or Activision; no official game assets are included.
