# Skystones

The latest build adds **Traps**, **Unique cards**, **Assemble / Parts / Flash Superchargers**, and **Amplify** with either a lasting bonus or a limited number of future matching effects. It includes all **20 base SuperCharger vehicle portraits**, **16 vehicle variants**, and **four additional character variants**, bundled for offline play.

- **Traps:** Collection → Traps contains 18 crystal presets and an editor for element/tribe filters and up to eight effects. Select any combination of North, East, South, and West for pip, attack, defense, doubling, or ceiling effects. Double a specific keyword or all eligible keywords; other options mirror opposite sides, equalize pips, or raise the minimum Dizzy roll. One shared Trap affects both players and every matching card type. The slot starts empty. Add a **Trap** keyword to a stone and choose its crystal; playing that stone places the Trap before captures. A later stone’s Trap replaces it. Pip additions apply first, followed by pip transformations in the listed order, then attack/defense bonuses. Keyword doubling applies when an effect triggers, stacks with Amplify, and excludes Amplify, Flash, and Trap itself. Shield doubling follows the active crystal; potion/discard shield counters stay separate. There is no free activation button.
- **Unique:** check “Unique card” in Card studio. Unique cards work in decks, remain separate from tokens, and never appear in normal random, mixed, or specified-character Conjure. Use “Specified Unique card” or the explicit “Unique cards only” pool. Card files include their Unique and token dependencies.
- **Assemble:** generate 1–5 random tokens from the **Parts** pool or copies of a specified Part. Add separate Assemble entries to make an exact pair. Two Parts in hand automatically combine, summing pips and retaining both sets of effects, even repeated ones. **Collection → Parts & recipes** lets you create Parts, edit all six starter Parts, and define fixed recipes. Token templates can also be marked as Parts in Card studio. A loose Part cannot be played alone.
- **Recipes:** choose two Part templates (either order, including two of the same Part) and a Supercharger vehicle portrait, name, and element. That pair always builds the selected vehicle while retaining both Parts’ pips and effects. Recipes prioritize matching pairs if several Parts arrive together; otherwise pairs combine immediately using the usual fallback vehicle. Changes apply to new battles, and Adventure saves its recipe book. Card exports include matching recipes and their Part definitions; Export all cards includes the whole recipe book.
- **Superchargers:** assembled vehicles use actual vehicle portraits and have **Flash**, which keeps the current player’s turn. Either player may place a stone over one and inherit its current ordinary pips and printed keywords except Flash; inherited effects trigger again. Live Trap, terrain, and boss bonuses are applied once. Vehicles must be covered before the board is full. These battle-only cards never enter saved decks or the Adventure pack.
- **Amplify:** choose an effect type or “All effects,” then choose “Always on this card” or “Next matching effects you play” with 1–5 uses. The latter waits for a matching keyword after the source’s play and spends one use per matching effect, in printed order. Unrelated plays leave it ready. A new matching play is not doubled after its uses are spent. Numeric effects double their magnitude; positional effects resolve twice. Dizzy retains its 0–5 cap, and Flash does not create another turn. Base pips never double.

These rules work on both board sizes in normal, Draft, and Adventure games. Existing Adventure copies retain their saved stats. Giants and Minis keep their protected base profiles.


A browser game inspired by classic Skylanders Skystones, with a Giants card catalogue, sixteen illustrated creature presets, a custom card studio, a roguelike Adventure mode, and a two-player Draft mode. Built with React, TypeScript, and Vite. Everything runs in the browser; no account, API keys, or backend is needed.

Hand cards use larger, wrapping rows in normal games, Adventure, and drafted hands. Keyword-heavy cards grow taller while keeping room for their artwork, including on phones and 4×4 boards.

## Download and play

1. [Download Skystones.zip](https://github.com/BernOver/Skystones/raw/refs/heads/main/downloads/Skystones.zip).
2. Extract the ZIP into a folder on your computer.
3. Double-click **Skystones.html** and open it in Chrome or Microsoft Edge.

The download contains the whole game. No installation, terminal, or server is required. Use **Card studio** to make cards, then add them to your deck in **Collection**. Choose **Adventure** to start or resume a roguelike run, or **Draft** to draft a shared pool with another player.

## Export every card for review

Choose **Collection → Export all cards** to download **Skystones-all-cards.json**. One file contains every current built-in card, your edited character defaults, custom cards, all token templates, uploaded artwork, custom tribe names, and original factory definitions for comparison. It includes cards hidden by the current tab, search, and element filters. Exporting keeps the collection and saved games unchanged. Attach this JSON file when asking for a review of your card changes.

This is a collection report; the existing **Import card** button still accepts individual `.skystone.json` card exports. When updating the downloaded game, replace **Skystones.html in its existing folder** and use the **same browser** so the new version reads your existing cards and edits.

## Character balance and element identities

Ordinary Skylander base cards now center on **5–8 pips**, with a few weaker and stronger cards. Across the 182 Skylander cards, the average is about **6.37 pips**. The **39 original Giants Skystones, eight Giant Skylanders, and 16 Minis keep their exact existing pips and keywords**, including their existing Adventure profiles. All built-in descriptions now describe the character's weapons, abilities, personality, or companions.

The revised character cards use all **16 available keywords**, with these main themes:

| Element | Main identity |
| --- | --- |
| Fire | Create expendable sparks, Discard, Scavenge, and Parting Gift. |
| Life | Resonance, growing Life terrain, and follow-up growth. |
| Undead | Sunder, Silence, Blight, and negative Next Play effects. |
| Magic | Conjure, magical copies, Combo, and occasional Dizzy effects. |
| Water | Shield, Bastion, Mirror Pool, and Comeback. |
| Earth | Durable defenses, terrain, and heavy Sunder. |
| Air | Shift, Crosswind, speed, and positioning. |
| Tech | Combo chains, prepared Next Play buffs, and mechanical helpers. |
| Light | Positive Next Play effects and protective keyword gifts. |
| Dark | Ambushes, Silence, disruptive movement, and opening strikes. |
| Neutral | Kaos mixes Dizzy, summoned minions, and disruption. |

Choose an element in Collection to see its deck-building theme. Character flavor follows cards into Draft and Adventure. Adventure starters stay weak and enemies still grow gradually; reward selection prioritizes the closest authored pip budget before keyword preference. Base stats stay fixed across runs. Existing saved character edits take priority over the new bases; authored flavor is kept, while old generic boilerplate descriptions refresh without changing saved stats or keywords.

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

After `npm run package:download`, run `SKYSTONES_STANDALONE=1 npm run test:e2e -- tests/browser/tribes.spec.ts` to check the packaged HTML's tribe controls, card-file sharing, Combo labels, and saved battles on both board sizes with all external requests blocked.
Use `SKYSTONES_STANDALONE=1 npm run test:e2e -- tests/browser/conjure.spec.ts` to check Conjure in the packaged game, including larger hands, canceled placements, card files, saved copies, and normal, Draft, and Adventure play.
Use `SKYSTONES_STANDALONE=1 npm run test:e2e -- tests/browser/tokens.spec.ts` for token creation, bundled exports/imports, deck exclusion, template edits, and generated token play on both board sizes.

## Play

Select a stone from your hand, then an empty square. A higher facing edge captures an adjacent opposing stone. Equal facing edges leave ownership unchanged. There are no diagonal or chain captures. When the board fills, the player controlling more stones wins; unplayed cards do not count. Equal final scores on 4×4 are a draw.

- Choose one of **ten Skylanders villains** in **New match → Opponent**, including Chompy Mage, Wolfgang, Kaos, and Golden Queen. Their character portraits and names appear beside the board. The computer weighs captures and possible counterattacks. Your opponent preference is saved in this browser.
- Choose **New match → Bring a friend** for local two-player play. Player one uses your selected deck; player two receives a shuffled original deck.
- Choose **3×3** for five-card hands and nine squares, or **4×4** for eight-card hands and sixteen squares. Both computer and local play support either board. Changing board size recalls your last selected deck for that size. The first switch to a size makes a separate resized copy of your current deck; a complete deck expands or trims, while an incomplete deck stays incomplete.
- In **Collection**, choose exactly five or eight distinct stones for your next game, depending on the board size. Deck changes do not modify a match in progress.
- In **Card studio**, name your stone, select a creature and element, or upload a PNG, JPEG, or WebP image up to 2 MB. Set each edge from 0–5, with a total budget of 12 points.
- Save your creation, then add it to your deck in Collection. Elements determine Resonance counts; captures still compare facing pips.
- Cards show their artwork and pips without hovering, including after a capture flip. Hover over a card in your hand or on the board for an enlarged card, edge strengths, keyword explanations, and backstory. Keyboard focus also opens the larger view. On touch screens, tap a board card, or select a hand card and choose **Inspect selected**.
- Download card images as PNG files. Export and import `.skystone.json` card files to back up or share playable cards.

## Saved decks

Open **Collection → Saved deck** to keep multiple named decks. **New deck** starts an empty deck for either board size. **Duplicate deck** copies your current cards into a separate slot; **Rename deck** changes its name. Edits save automatically in this browser, including incomplete decks, and survive reloads. Your old selection carries over as **My deck**. Each slot holds five distinct cards for 3×3 or eight for 4×4.

Switch decks in Collection or **New match → Match deck**. Selecting a deck also selects its board size, and each size remembers the last deck you used. A new match uses exactly the selected deck once it is complete. Saved decks reference your cards, so character-default edits apply to new games normally. Deleting a custom card or turning it into a token removes it from every deck; affected slots remain incomplete until you choose replacements. Deleting a deck keeps its cards in your collection. A match already in progress keeps its hand and board.

## Board skins and enemy portraits

Open **Board skins** (the palette button in the header) to choose **Giants Table, Arkeyan Ruins, Sky Citadel, Lava Forge, Frozen Vault, or Golden Court**. Each table has a raised carved frame, metal corner pieces, beveled stone spaces, and engraved centers inspired by the original Skystones boards. Previews show all six finishes. The choice applies to normal, drafted, and Adventure matches on both 3×3 and 4×4 boards, and stays selected after reload. Changing a skin leaves the current cards, deck, and progress in place.

**Adventure map combat choices display enemy portraits before you enter.** Different branches at the same stop show different villains. Each villain has matching encounter titles and flavor text for battles, elites, and treasure guards, drawing on their personality and equipment. The title, story, and portrait stay together on the map, in treasure introductions, and in the battle, including when you resume an older save. Reward and boss-condition descriptions remain visible. Both Act I boss choices show Kaos; the Act II boss shows Golden Queen. All portraits and skins work offline in the download.

## Giants collection and artwork

The collection now has **182 Skylanders and distinct forms** across all six main games, plus **39 unique Giants opponents**. Repeated numbered enemy ranks are consolidated. Genuine character forms, such as Gill Grunt and Deep Dive Gill Grunt, remain separate cards. The tutorial hand now uses actual Skylanders too. **Light and Dark** are supported elements.

Pips are a fan-game adaptation of character classes, published stat profiles where available, and fighting styles. Minis sit at the low end; Giants, Trap Masters, and Senseis generally have larger budgets. Defensive characters receive Shield; rapid attackers often receive Combo. These values are approximate game balance, not official Skystones stats. Draft cards preserve their directional tradeoffs, and Adventure selects stronger fixed character profiles as the run progresses.

**SWAP Force keyword editing:** use **Add top-half keyword** and **Add bottom-half keyword**, or change any entry’s half selector. The preview labels each effect TOP or BOTTOM; each effect travels with its assigned half when swapped.

**Card studio** includes **377 bundled portraits**, searchable by character, game, role, and element. Check **Portraits without a default card** to find 156 additional portrait choices. Selecting a portrait updates the card’s name and element to match that character. You can edit the name afterward. Selecting original Skystones artwork also loads that picture’s original directional pips; later manual edits remain available. You can still upload an image. Portrait selections survive saves and card-file exports, and all artwork works offline. Old starter deck IDs and numbered Giants deck choices migrate to the consolidated roster. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for artwork and metadata sources.

## Character defaults

In **Collection**, open a built-in character and choose **Edit character default**. Change its name, portrait, element, pips, or keywords in the studio, then **Save character default**. That definition is used in new normal matches, new Draft pools, and newly generated Adventure cards for that character. Existing matches, Draft pools, and copies already in an Adventure keep their saved cards and upgrades. Each alternate character form has its own default. Use **Restore original default** in the character’s collection details to undo your edit. Defaults are saved in this browser; separate custom cards remain independent. Adventure upgrades, transformations, and special events can still modify individual copies.

## Adventure

Choose **Adventure** and select a 3×3 or 4×4 board before starting. The run uses a separate deck and purse, starts with **3 lives, 60 gold, and an empty potion belt**, and saves after every move and choice. New runs start with modest **2–3-pip cards**, mostly zeroes and ones with occasional stronger edges. Early enemies use the weakest fixed character profiles. Take exactly five or eight cards from your traveling pack into each battle. Rewards join the pack; use **Expedition deck** to swap them into the active deck.

- **Fixed character bases:** every Adventure character has a fixed starting pip layout and keyword set, across runs, fights, shops, and rewards. Difficulty selects stronger characters as the route advances. Saved character defaults replace that base for newly generated copies. The card inspector lists **Fixed Adventure base** or **Saved character default** separately from changes earned during the run. Upgrades, potions, relic bonuses, fusions, and transformations remain explicit changes to a copy; they do not reroll a character’s base definition.
- **Unique random draws:** starting packs, each enemy hand, shops, rewards, archive choices, and transformation results sample characters without replacement. Rewards and shops avoid characters already in your pack. Distinct named forms are different cards. The Duplicator encounter can still deliberately copy a chosen card. Older saves repair unintended duplicate identities while keeping card IDs, deck slots, current pip improvements, and battle ownership.
- **Original Skystones artwork:** unedited Adventure bases match the pips printed in their pictures and begin without keywords. Shops, shrines, Echo Essence, and fusion can add keywords, which stay with the upgraded copy across battles and reloads. When current pips differ from the picture, the display hides its embedded markings and shows the current strengths around the character.
- Follow **two nine-stop acts** with branching battles, events, four merchants, elites, camps, and a Skylanders boss at the end of each act. A lost battle costs one life; a normal draw does not. Losing the last life ends the run. Regular victories award 25 + 5 per floor in gold; elites add 20. Choose one of three card rewards, with offers selecting fixed profiles near 4–12 pips, advancing roughly one tier every two stops. Enemies select stronger profile tiers roughly once every three stops; elites and bosses receive one extra pip, and 4×4 keepers receive one less (minimum one). Some wins also award a potion if the three-slot belt has room.
- **The Brass Chest / Gilded Cache:** challenge a keeper with a guarded chest already on a central square (B2 on either board). Control it when the board fills for **45 extra gold**, even if you lose the overall score. If the keeper recaptures it before the finish, there is no bonus. You may also leave the chest alone.
- **Events:** the Whispering Well heals one life or exchanges a life for 40 gold; the Alchemist offers a free potion; the campfire heals a life or permanently adds a pip to one chosen stone. The Whirling Idol event gives a **12-pip Magic card (4/4/4/0) with Dizzy** for free; add it to your expedition deck from the pack.
- **Shops:** buy any of three displayed stones, stock up on potions, or visit the workshop. **Sharpen (25 gold)** adds a pip on the shop's randomly rolled edge. **Reforge (20)** changes a chosen card's element. **Inscribe (35)** adds the shop's randomly rolled keyword and direction; Resonance includes a rolled element, Sunder states its strength, Silence affects the whole card, and Dizzy rolls its offered edge. The keyword type changes at each merchant and on every reroll. Offers are visible before buying and remain fixed through purchases, card selection, and reloads until you reroll. You choose which card receives the offered upgrade. Upgrades last for the adventure and use the normal 5-per-edge / 12-total printed-stat limits. Invalid purchases and disallowed duplicate keywords spend no gold; Sunder can be bought repeatedly. Bought cards must be swapped into the battle deck.
- **Shop rerolls:** refresh the displayed cards, relic, and both workshop offers, and restock the three potions for **20 gold** (16 with Haggler’s Coin). Purchased cards, potions, and permanent upgrades remain yours. **Merchant’s Die** gives one free reroll per shop, including the shop where you buy it. Its used charge persists through reloads and resets on entering the next merchant. Rerolls do not trigger Quiet Coin or Rainy Day Bank payouts.
- **The Runesmith’s Shrine:** an event choice at the second stop. Choose one of three distinct, fixed keyword offers and any stone in your pack to inscribe for free. Existing keywords and printed pips stay. Sunder can repeat on the same edge. Other duplicate inscriptions cannot be added; choose a different card or offer, or leave. Rune Echo applies to shop inscriptions only.
- **The Twinflame Forge:** an event choice at the fifth stop. Choose two different cards and inspect the combined result before confirming. The base keeps its element and artwork. Each edge starts at the stronger input value, capped at five; if the total exceeds twelve, the highest edges are reduced in turn until it fits. Each Sunder entry stays separate, including repeated directions. Other matching keywords merge once per type and direction; Shield keeps the larger amount, Dizzy combines the selected sides, and conflicting Resonance counts keep the base card’s element setting. The result keeps at most 24 keywords, taking base entries first. The inputs become one card, with no gold cost. You need at least one reserve card so the remaining pack can still form a full battle hand. Selected inputs are replaced by the combined stone and, when needed, a reserve; an incomplete deck keeps its previous card count. Both new events can be skipped, resolve once, and save their results.
- **Potions:** there are now **15 potions**, including twelve new effects. Shops and rerolls offer three distinct random bottles from the whole set; free battle drops and Pilgrim’s Flask also use the whole set. The Alchemist lets you choose any potion. The belt holds three, or five with Traveler’s Satchel. Combat potions require your turn and never spend it. Healing Draught and Liquid Gold also work between encounters. The **Potion guide · 15** explains every effect and shows relic-adjusted values and prices. Directional effects ask you to choose an edge, Prismatic Phial asks for an element, and Transposition asks for two friendly cards. Canceling any picker keeps the potion.
- **Act I — Kaos, Throne of Chaos:** only Kaos’s central throne starts on the board, with no extra guard. Control it and win the score to defeat him. Claim a card and relic reward, then continue into Act II with your deck, gold, potions, and relics.
- **Act I alternate — Kaos, Elemental Vortex:** choose this boss instead of the Throne of Chaos. The board starts empty. Each placement advances through a seeded cycle of all ten elements. The arena changes color to match the current element, and matching cards on **both sides gain +1 on every edge**, in hand and on the board, for attacking and defending. A **Next element** icon shows the following turn. This temporary bonus never stacks or changes base stats; Sunder and Silence cannot remove it. Potions do not advance the cycle. Win the score to earn boss rewards and enter Act II; a tied boss fight costs a life. Both board sizes support the encounter and save its cycle.
- **Act II — Golden Queen, The Golden Court:** only her shielded central throne starts in play. Win the score, hold the throne, and control **at least two corners** to finish the adventure. Failed boss attempts cost a life and can be retried with an adjusted deck. Boss battles reached through a Portal use the boss for your current act.
- Captured cards perform a half-turn: the old owner’s face turns away and the new owner’s face appears. This works in normal, drafted, and Adventure battles. Reduced-motion preferences show ownership changes immediately.

## Potions

| Potion              | Effect before Alchemist’s Mortar                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Power Tonic         | A hand card gains +1 on all edges for this battle.                                                                     |
| Healing Draught     | Recover 1 life, up to your current maximum.                                                                            |
| Hex Vial            | An enemy board card loses 1 on every edge, down to zero.                                                               |
| Sharpening Oil      | A chosen hand-card edge gains +3.                                                                                      |
| Fortress Brew       | A friendly board card gains +1 on every edge. The buff survives Silence.                                               |
| Shatter Flask       | Remove up to 3 pips from one chosen enemy edge.                                                                        |
| Hush Elixir         | Silence either player’s board card; restore printed pips minus recorded damage.                                        |
| Compass Cordial     | Rotate a hand card and its directional keywords 90 degrees clockwise. Flexible Sunder stays flexible.                  |
| Prismatic Phial     | Change a hand card’s element for this battle. Its Resonance count settings stay the same.                              |
| Restoration Salve   | Repair up to 2 recorded pip damage per edge of a friendly board card. Removed keyword bonuses stay removed.            |
| Frostfire Flask     | Every enemy card in one chosen row loses 1 per edge. Friendly cards are safe.                                          |
| Echo Essence        | Add Resonance to a chosen hand-card edge, counting that card’s current element.                                        |
| Gambler’s Brew      | Add 2 pips, then redistribute once with a 16-total / 4-per-edge ceiling. The new hand strengths are fixed immediately. |
| Liquid Gold         | Gain 30 earned gold immediately; Gilded Compass applies. Base shop cost is 40.                                         |
| Transposition Tonic | Swap two friendly board cards without captures or keyword retriggers. The chest and throne cannot move.                |

Alchemist’s Mortar adds one to numeric pip, damage, repair, reshape-gain, and healing values; Liquid Gold grants 40 before Compass. Rotation, element changes, Silence, Resonance, and swaps keep their normal effect. Bubbling Flask doubles free bottles within capacity; Bottomless Bottle retains only the first successful combat use. Failed targets, duplicate inscriptions, or canceled pickers consume nothing. Pip damage and repairs use the same stored reductions as Sunder. Battle-only changes never rewrite the traveling pack.

## Spire encounters and transformation

The **Spire Crossroads** at stops 2, 5, and 8 choose a saved encounter from that act or the shared pool. Encounters do not repeat within one run. Existing Skystones events remain selectable alongside them. **Event guide · 54** lists and searches every adaptation and its choices.

The catalogue covers **51 playable event names** from the pinned original-game reference, with three bonus adaptations: Neow’s opening blessing, the Spire Heart scene, and the unused Thinking with Puddles scene. The coverage manifest and source revision are in [tests/fixtures/spire-event-reference.json](tests/fixtures/spire-event-reference.json); [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) identifies the reference and license. Story text and illustrations are original. Costs and rewards are adapted to Skystones lives, pips, cards, potions, relics, and battles.

- **Transformation** replaces selected stones with seeded random new forms while preserving their deck slots. Printed budgets keep pace with the route and remain within twelve. Transformed cards have a **90% chance of one or more keywords**, capped at **five distinct keyword types**; Runesmith’s Quill raises the nonempty chance to 100%. Among nonempty rolls, one keyword is most common and five is rare. Normal card rewards select fixed keyword-bearing characters, with Runesmith’s Quill increasing their chance. Reloading does not reroll outcomes.
- **Curses** persist until purified. Each puts a zero-pip cursed stone into your battle hand in place of a normal selected stone, leaving at least one normal stone. The traveling deck stays intact. Cleric, Purifier, Living Wall, Fountain of Cleansing, and other cleansing choices can remove curses. Curse cards can still benefit from combat potions.
- **Match and Keep!** is a playable twelve-tile memory game with six pairs and five attempts. Reveals, attempts, matches, earned cards, and the curse pair save across reloads.
- **Staged and repeated events** include the Golden Idol escape, Cursed Tome, Scrap Ooze, Dead Adventurer, Knowing Skull, and the Colosseum’s warm-up and optional elite fight. Battle rewards are paid only on victory; the Secret Portal can start the throne fight early.
- **Persistent choices** include life-cap changes (maximum six), Mind Bloom’s permanent healing/revival lock, relic and potion sacrifices, card removal with deck repair, duplication, gambling, and A Note for Yourself. The note exchanges one stone and saves the offered stone for the next new adventure in this browser.

All choices display costs, prerequisites, or disabled reasons. Card-target choices ask for distinct selections. Event state, charges, curses, transforms, and delayed battle rewards are validated when restoring a save. Older runs without expansion fields still load.

## Relics

There are **31 unique relics**, and each can be owned once per adventure. Choose one of three unowned relics after your first victory, a secured chest, or an elite victory. The Forgotten Reliquary is another event option, and merchants sell one relic for 75 base gold. Offers stay fixed through reloads; shop relic stock refreshes on a shop reroll. Choose or skip a relic before taking card rewards; reward-related relics affect the waiting card rewards immediately.

The **Relics** shelf lists everything you own, and **Relic guide · 31** explains the complete set. Relics and spent charges save with the run. Older saves without relic fields still load; new relics can be earned at subsequent encounters. Normal matches and custom cards are separate from relic effects.

| Relic                | Effect                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Gilded Compass       | +25% gold earned from battles, chests, and events; rounds down per payout.                                                      |
| Merchant’s Purse     | +100 gold immediately, once. This flat grant is not multiplied.                                                                 |
| Runesmith’s Quill    | +30 percentage points to reward-card keyword chance, including early rewards.                                                   |
| Twin Sigil           | Pick two different cards from each victory's card rewards.                                                                      |
| Traveler’s Satchel   | Potion belt capacity increases from 3 to 5.                                                                                     |
| Bubbling Flask       | Double free potions from battles, events, and relics, up to belt capacity. Shop purchases still give one.                       |
| Alchemist’s Mortar   | Numeric potion effects are stronger; see the potion guide for exact values.                                                     |
| Phoenix Feather      | Survive the first fatal battle loss at 1 life, then remain spent for the rest of the run.                                       |
| Campfire Charm       | Recover 1 life after each battle victory, up to your maximum lives.                                                             |
| Haggler’s Coin       | 20% discount on all shop cards, potions, upgrades, and relics; prices round up.                                                 |
| Stonewright’s Hammer | Reward cards have +1 printed pip, respecting the 5-per-edge / 12-total caps.                                                    |
| Fated Lens           | Choose from 5 reward cards instead of 3.                                                                                        |
| Pilgrim’s Flask      | Immediately fill empty potion slots with a varied selection from all fifteen potions, once.                                     |
| Treasure Magnet      | Secured chests pay 30 additional gold, which also benefits from Gilded Compass.                                                 |
| Vanguard Banner      | The first card you play in every battle gains +1 on all four edges for that battle.                                             |
| Victory Medallion    | +10 gold per battle victory; combines with Gilded Compass.                                                                      |
| Copper Claw          | +2 gold per enemy card captured, including recaptures, paid after the battle.                                                   |
| Quiet Coin           | +15 earned gold on entering each shop, once per visit.                                                                          |
| Rainy Day Bank       | Leaving a shop earns 10% of remaining gold, rounded down and capped at 30.                                                      |
| Restful Ember        | Heal 1 on arriving at a camp, before its normal choice.                                                                         |
| Whetstone Ring       | Shop sharpening adds up to 2 pips within printed-stat limits.                                                                   |
| Elemental Prism      | Shop reforging also adds a pip to the weakest edge, if there is room.                                                           |
| Rune Echo            | Directional shop inscriptions also add their keyword to the opposite edge when available. Whole-card effects remain singletons. |
| Market Map           | Merchants you enter stock four cards instead of three.                                                                          |
| Herbalist’s Lens     | Every won battle drops a free potion, subject to belt capacity.                                                                 |
| Bottomless Bottle    | The first successful potion use in each battle keeps the potion; later uses consume it.                                         |
| Duelist’s Bracer     | Heal 1 on your first capture each battle.                                                                                       |
| Stout Heart          | Raise maximum lives to 4 and heal 1 immediately.                                                                                |
| Loaded Dice          | Your selected Dizzy edges roll from 2 to 5 instead of 0 to 5.              |
| Oracle’s Eye         | Reveal and inspect the keeper’s remaining hand.                                                                                 |
| Merchant’s Die       | One free shop reroll per merchant. Buying the relic makes the current visit’s unused free reroll available immediately.         |

Relics combine: Twin Sigil can take two of Fated Lens's five offers; Traveler’s Satchel can hold Bubbling Flask's extra potions; Alchemist’s Mortar strengthens each potion actually used. Potion reductions stop at zero and healing stops at your maximum lives (three, or four with Stout Heart). Printed-stat reward bonuses do not affect shop stock. One-time acquisition effects and Phoenix Feather's charge do not replay on reload.

Changing pages pauses the adventure; returning resumes it. Normal games and the custom card collection remain separate from the run. Progress is browser-local; clearing browser storage removes it.

## Draft

Choose **Draft** for a separate two-player mode on one screen. A fresh table shows **25 generated stones**, with varied pip totals, elements, artwork, and all eight keyword types. Most cards trade stronger edges for weaker ones; a slightly superior card can occasionally appear, but the pool limits obvious pip dominance.

| Board | Nominations per player | Random unselected cards | Pool size | Draft rounds | Hand size |
| ----- | ---------------------- | ----------------------- | --------- | ------------ | --------- |
| 3×3   | 6                      | 3                       | 15        | 5            | 5         |
| 4×4   | 9                      | 6                       | 24        | 8            | 8         |

Player one nominates first, then player two selects from the remaining cards. After both lock their nominations, random additions complete the pool, which is shuffled once. Each round shows three cards. The first player picks one, the other picks one, and the last is discarded. First pick alternates between rounds. Cards are used once, so there are no duplicate picks or repeats from the discard pile.

**Play drafted match** brings both exact hands to the normal table with local two-player rules; player one opens. Hover, keyboard focus, or tap cards to inspect keyword rules. Draft setup and committed picks save automatically and resume after reload; the battle itself starts fresh on reload, as other normal matches do. Draft cards do not alter your collection or adventure.

## Keywords

Add keywords in the card studio. For Resonance, choose the element to count. For Sunder, choose a fixed edge or choose the edge when played, and set the number of pips to remove. Silence needs no edge; Dizzy lets you select one or more edges. Built-in Skylanders demonstrate the keyword effects.

- **Head Start:** the specified edge gains its **stated number of pips** if the player is winning immediately before playing that card. Set **Bonus pips** from **1–99** in the studio; older cards default to +1. For example, Head Start 3 adds +3 on its printed edge. Ordinary strengths cap at 99.
- **Comeback:** the specified edge gains its **stated number of pips** if the player is losing immediately before playing that card. It uses the same **Bonus pips** setting and +1 legacy default as Head Start. Amounts also work when granted through Combo, Next Play, or Conjure. Eligibility is checked once before placement; a tie activates neither. Activated bonuses stay until Silence removes them.
- **Resonance:** the specified edge gains **+1 pip for every card of the chosen element already on the board**, counting both players' cards. For example, **Resonance · Fire · East** adds **+3 East pips** if there are three Fire cards on the board. The card being played does not count, even if it is also Fire.
- **Sunder:** choose a card already on the board. Remove **up to its stated number of pips from the target edge**, to a minimum of zero. Set **Pips removed** from 1–99 in Card studio; older cards default to 1. For example, Sunder 3 reduces a five-pip edge to two, or a two-pip edge to zero. Set **Target edge → Any · choose when played** for a flexible version: when played, select any card anywhere on the board, then choose North, East, South, or West. Only edges with at least one pip can be chosen. Fixed-edge Sunder remains available, and both versions can appear on the same card. The actual reduction is recorded in the hover preview and move log, and remains through captures and Silence.
- **Silence:** choose a card already on the board. **Disable all its keywords and remove their pip bonuses** for the rest of the match. It restores printed stats minus recorded damage, including undoing a Dizzy roll. Its element remains. Earlier captures and resolved Sunder/Silence effects stay; Silence does not reverse past actions.
- **Shield:** add the stated number of **defense-only pips** to a chosen edge (default one). Blue shield badges keep them separate from normal attack pips. A card with 2 ordinary pips and Shield 2 defends as 4 but attacks as 2. Shields persist through attacks and ownership changes and are removed by Silence. Sunder damages ordinary pips; it does not spend shield pips. Dizzy does not change shields.
- **Combo:** before play, check the chosen element/tribe requirement against the **last card that player played**. On a match, gain its configured pip bonuses and/or up to five ordinary keywords before captures. Cards show the requirement after Combo, such as **Magic** or **Giants**. The studio supports any combination of the four pip bonuses and granted keywords, including targeted Sunder and Silence, Shield, and Dizzy. The first card cannot Combo. Opponent turns, captures, Silence, and position swaps do not rewrite your play history. Bonuses remain on the played card; Silence removes them and granted keywords while completed effects stay. Combo cannot grant another Combo. Compass Cordial rotates Combo pip and keyword directions too.
- **Dizzy:** select one or more affected sides in the studio. When played, each selected side independently rolls **0–5 before captures**; the other sides keep their pips. A **? beside an affected side** marks its pending roll. Captures use the rolled strengths, and the total can increase or decrease. The roll stays through later turns, captures, and reloads. Silence restores printed pips minus damage. Older whole-card Dizzy cards still roll all four sides; already played legacy cards keep their saved results.
- **Next Play:** queue a signed change of 1–5 pips on a chosen side or every side, **up to five configured keywords**, or both, for your next card or the opponent’s next card. In the studio, add the granted keywords and choose **Pip change → None** to omit a pip change. Gifts can include Combo, targeted effects, Conjure tokens, or another Next Play effect, with at most three nested grant levels. Granted keywords appear in hand previews and activate on the receiving card’s actual play, before Dizzy and captures. Targeted gifts use the normal target picker. Canceling spends nothing. This card does not consume its own newly queued effect. Pending queues apply in cast order; pip changes stack with a minimum of zero. Existing unique keywords on the same edge take priority, and further grants stop at the 24-keyword card limit. Repeated Sunder, Next Play, Environment, and Conjure remain allowed. The recipient keeps the result; Silence disables its received keywords, while capturing or silencing the caster cannot cancel a completed queue. Opponent turns and potions consume none of your queues. Unused queues expire with the battle.
- **Shift:** automatically move **only the neighbor on the printed side** of the incoming card by one tile in its fixed Up, Right, Down, or Left direction, before captures. Choose **enemies, allies, or both** in the studio. No target or movement direction is chosen during play. Movement wraps across the board edge; finding the adjacent target does not wrap. A missing or ineligible neighbor does nothing. An occupied destination or the incoming card’s placement tile blocks movement. Cards never swap or push each other. A moved card keeps its owner, resolved strengths, and play history, and its keywords do not trigger again. Terrain stays on its original tile; a chest objective follows its chest card. Subsequent effects and captures use the new positions. A card may have one Shift entry per printed side, including grants through Combo and Next Play. All board sizes and modes use these rules.
- **Environment:** choose any tile, empty or occupied, including the tile where you are placing the card. Put one of the seven environments below there before captures. The newest environment on a tile replaces its previous environment. Tile effects apply to either player and survive captures, Silence, and the caster moving. Their effects stay on their tile when occupants swap. Environments last for the current battle.
- **Conjure:** after a successful play, add **1–5 copies of a specified card** or **1–5 random cards** to your hand, the opponent’s hand, or both. Choose from the 221 built-in characters/forms and Giants opponents. Random cards can require an element, a tribe, or both; all selected filters must match. Random draws avoid repeats within an entry where possible, and can repeat if the matching pool is smaller than the count. No matching cards means no additions. Repeat Conjure to add different specified cards; Combo can grant Conjure too. Generated cards use the saved character default or the fixed base for that mode, get unique IDs, and are marked **Conjured**. They arrive after captures and can be played on later turns. Creating them does not activate their keywords or spend queued Next Play bonuses. Each hand holds up to **20 cards**, with excess copies skipped and reported. Canceled plays add nothing. Capturing or silencing the caster never removes cards already added. Adventure saves the copies and their stats without treating intentional duplicates as mistakes; they last for that battle and never join your pack or alter Draft picks. New Draft pools, shop inscriptions, shrines, and transformations can offer Conjure; existing saved pools and offers keep their definitions.
- When playing Sunder or Silence, pick an empty placement square, then select a highlighted board card in the target picker. Either player's cards can be targeted, including nonadjacent cards. The new card cannot target itself. Canceling the picker leaves the entire turn untouched. Targeted effects resolve in the card's listed order before captures, so weakening a defender can enable the new card's capture. Effects with no valid target are skipped, including on an empty board. Sunder cannot target a zero edge; Silence cannot target a card without keywords or an already silenced card.
- Head Start and Comeback compare the number of controlled stones on the board **before placement**. A tie activates neither of those; Resonance works independently of the score.
- Check each keyword **once** when the card is played. Activated bonuses stay on that card for the rest of the match, including after captures or score changes, unless Silence removes them. Inactive keywords never activate later.
- Ordinary activated pips count for both capturing and defending; Shield pips count only for defending. Green edge numbers show the resolved strength; the enlarged view shows the base value, total bonus, and each Resonance count. Different keywords on the same edge add together. Bonuses can raise an edge above 5 and do not spend printed-stat budget points.
- **Sunder can appear multiple times on the same edge**, including multiple “Any” entries. Each occurrence chooses its own target and resolves in listed order; it can hit the same card again while that edge still has pips. Combo can grant repeated Sunder too. Next Play, Environment, and Conjure can also appear multiple times, resolving their entries in printed order; pending pip changes stack, only the latest environment on a tile applies, and generated cards arrive after captures. Other keywords cannot repeat on the same edge; Silence, Dizzy, and Combo each appear at most once per card. The card limit remains 24 keywords, with at most five grants inside each Combo or Next Play entry. Cards without keywords, including older card-file exports, still work. Hover inspection shows reduced edges, Silence status, and the targets of resolved effects. The computer also selects targets when simulating moves. New Draft pools and Adventure offers can include Shift and keyword gifts; saved pools and offers keep their existing definitions.

Custom cards, board size, deck selection, and sound preference are saved in this browser's local storage. Normal matches start fresh on reload; Adventures and draft selections resume their saved state. An incomplete saved normal deck uses a starter deck for the initial practice match; complete your five- or eight-card deck before starting another match. Clearing site data removes the collection and adventure, so export any custom creations you want to keep. Storage failures display a message rather than claiming a save succeeded.

## SWAP Force halves

Cards with the **SWAP Force character tribe** can exchange halves while in your hand. The **SWAP Force Era** game-family tag alone does not enable it. On your turn, choose **Swap Force · exchange halves**, select two cards, review both results, then **Swap halves**. This works in normal matches, drafted matches, and Adventure on both board sizes. Both cards stay in hand and the action spends no turn, placement, card, or gold. Canceling changes no cards.

- **Top** supplies **North and West**; **Bottom** supplies **South and East**. Each card keeps its top and receives the other card’s bottom. Names combine too: Wash Buckler + Blast Zone becomes **Wash Zone** and **Blast Buckler**. The top sets the gameplay element; the resulting card carries both parts’ tribes.
- In **Card studio → Keywords**, SWAP Force cards have a **Keyword half** selector for every printed keyword. Assign any keyword to Top or Bottom, independently of its effect’s target direction. The whole configured effect travels with that half, including nested grants. Existing directional keywords default to their North/West or South/East half; global keywords default to Top. Saved character defaults and shared card files preserve explicit assignments.
- Portraits are cut diagonally, with the top character in the North/West triangle and bottom character in the South/East triangle. Toggle **Show SWAP Force artwork as top and bottom** in the swap dialog, the SWAP Force card maker, or **Board skins** for a horizontal cut. This preference saves across modes and reloads; it changes artwork only.
- You can swap again before playing, use a third eligible card, or exchange the same pair again to restore its parts. Pictures always retain their original source parts. Hand pip and Shield gifts follow their sides. Swapping does not activate keywords, Conjure, Dizzy, or discard triggers, and does not spend queued Next Play effects. Those resolve normally when the resulting card is played.
- Combined battle cards may exceed the normal card-maker pip budget, using the pips already present on those halves. Each half has its own unique-keyword slots, so matching keywords (including Combo) can exist on both halves and resolve independently. The **24-keyword card limit and tribe limits** still apply. Oversized custom combinations show an explanation and cannot be confirmed; no effects are silently dropped. All 16 original SWAP Force characters can pair with one another.

Swaps last for the current battle. Collections, character defaults, saved decks, Adventure packs, token templates, and Draft picks keep their original cards. Adventure saves both the held parts and played portraits exactly, including their stats and half keywords. Cards already on the board cannot swap.

## Custom tribes and Adventure encounters

In **Card studio → Tribes**, enter a name and choose **Add tribe** (or press Enter). The new tribe is selected on the card and saved for other cards. Custom tribes work with Combo, Resonance, Next Play, Conjure filters, environments, and the Collection filter. Card exports include their names; importing restores them, including tribes used by nested keyword grants and token templates. Built-in tribes keep their existing behavior.

Open **Adventure → Adventure workshop** from setup or an existing run. Choose an original encounter to edit it, or **New encounter** to create one. Create or reuse an enemy character, choose any bundled portrait or upload a PNG/JPG/WebP image up to 2 MB, and write its name and encounter story. Saving a character updates other encounter definitions using that character; an active battle keeps its saved setup.

- Select one or more pools: **Easy encounters**, **Hard encounters**, **Events**, and **Bosses**. Select **Act 1**, **Act 2**, or both. All selected acts are eligible, and pool membership works independently: one fight can be an Act II hard encounter, event fight, and boss. Maps choose eligible encounters deterministically for that run. Event fights offer **Fight** or **Leave** before combat. A stop with no enabled matching fights can be skipped.
- Use the usual generated enemy hand, or choose a fixed hand of **0–20 cards**, independently of the 3×3/4×4 player hand size. Repeated cards, custom cards, and starting tokens are allowed. Each entry is copied with a unique battle ID and its configured stats; no Conjure is required for starting tokens. Templates, normal decks, rewards, and the player’s pack stay unchanged.
- Choose a standard duel, central treasure chest, throne objective, Elemental Vortex, or golden throne with the two-corner requirement. Boss pool membership controls act progression; choosing a mechanic for another pool does not turn it into an act boss.
- An empty hand automatically passes its turns. Discard protection accounts for these passes and actual Conjure gains, reserving all remaining cards if the hands cannot fill the board. Custom fights end when the board fills or both hands are empty, then use the usual scoring and rewards. Extra starting cards may remain unused when the board fills. Saves preserve repeated enemy cards, starting tokens, portraits, story, and mechanics.
- **Test encounter** uses the current edits, including unsaved changes. Choose its board size, act, and pool. Tests use a fresh Adventure player deck and never write to the saved run or spend its resources. **Restart test** tries it again; **Back to encounter editor** returns to the same edits. Reloading leaves the original Adventure intact.

Save encounter edits before switching fights. Changes apply to newly entered fights, including the remaining map of an existing run; battles already underway retain their saved definition. Custom content is saved in this browser, including the downloadable offline game.

## Discard abilities

In **Card studio → Add keyword**, choose:

- **Discard:** remove **1–5 chosen or random cards** from your hand, the opponent’s hand, or both. Repeat it for separate groups. The player of the card chooses victims for chosen discards. Resolve placement and captures first, then **all Conjure entries**, then discards in printed order. The picker includes cards just created by Conjure. Canceling at any step leaves the entire play unchanged.
- **Scavenge:** while on the board, gain configured **pip and/or Shield bonuses per actual discarded card**. Watch your hand, the opponent’s hand, or either hand, relative to the card’s current controller. A Scavenge card can reward its own Discard effect. Skipped discards grant nothing. Buffs happen after captures and do not cause another capture.
- **Parting Gift:** when discarded from a hand, grant configured pip and/or Shield buffs to **all cards its owner controls on the board**, **its owner’s remaining hand**, or **the card causing the discard**. These are temporary battle bonuses; permanent cards, character defaults, tokens, saved decks, and the Adventure pack keep their base stats. Hand gifts are included when those cards are later played. Silence disables discard bonuses on a board card and prevents it receiving further board discard buffs.
- **Discard Priority:** random discards choose cards with the **highest priority first**, using ranks **1–99** (default 1); unmarked cards have priority zero. Ties are randomly selected. Chosen discards ignore priority. Parting Gift and Priority work from the actual hand card, so they can be printed directly or granted when Conjure creates a card. Combo and Next Play do not offer these hand-only grants. Discard and Scavenge can be granted normally.

**Every player must retain enough cards to finish the board.** The safeguard counts remaining empty tiles and whose turn comes next, reserving every future placement for each player. If only two of five requested discards are safe, discard two and skip three. Priority never bypasses this rule. On a fresh 4×4 board neither player has spare cards; Conjure or later surplus is needed for a discard. On 3×3 the player with four remaining turns may have one spare starting card.

Only **actual Conjure gains** count, after its hand cap, filters, and token availability. Missing templates and empty pools cannot promise extra discards. Card creation never activates Parting Gift, Priority, or Scavenge by itself. The battle journal and inspection list discarded cards, protected counts, and buffs. Adventures preserve these histories and temporary hand buffs through reloads. The computer uses the same safeguards and makes its own chosen-card selections.

New Draft pools include discard synergies; existing saved pools keep their definitions. New Adventure shops, shrines, and transformations can offer the four abilities. Draft’s unused offer cards remain separate from hand discards during a match.

## Next Play elements

In **Card studio → Next Play**, choose **Recipient element** to wait for the next card of that element, **Change next card’s element** to recolor the receiving card, or both. These options work alongside pip changes, keyword grants, and recipient tribes. For example, your next **Water Giants** card can become **Fire** and gain +2 on North. Choose **Pip change → None** for an element-only effect. Removing the last keyword grant keeps None valid if an element change is configured.

All chosen element and tribe requirements must match the card submitted from the hand, **before any queued element changes**. Unrelated cards and opponent turns leave your effect waiting. Creating cards with Conjure does not spend it. Matching pip changes and keyword gifts stack in cast order; if multiple matching effects change the element, **the last change wins**. Preview colors, enlarged inspection, and queued-effect summaries explain the result.

The new element applies before Combo, terrain, boss auras, and captures. It stays on the played card through captures, score changes, Silence, and Adventure reloads. Original cards, saved decks, character defaults, and token templates keep their base element. Canceling a targeted play changes nothing. Element settings also work inside Combo, Next Play, and Conjure keyword grants, and travel in exported card files. Older effects without these options keep their existing behavior.

## Conjure buffs

In **Card studio → Conjure**, set **Extra pips on each generated card** and/or **Keywords for each generated card**. Buffs work with specified characters, specified tokens, and all random pools, for any receiving player. For example, conjure two random Fire Giants with **+2 per side** and **Shield 2 · North**, or add only a keyword without changing pips. Switching the card source keeps the configured buffs.

Each chosen side can gain **1–5 pips** once when the copy enters the hand; choose None on unused sides. Buffed pips can exceed five and the normal base-card budget. They belong to that temporary copy and remain through captures and Silence, subject to ordinary damage and pip-changing effects. Dizzy still rerolls its marked sides; Silence restores the copy’s buffed pips minus damage. Original cards, character defaults, and token templates keep their stats.

Grant up to **five configured keywords**, including Combo, Next Play, or Conjure, with the same three-level nesting limit as other grants. Keywords appear on the new card immediately and activate only when it is played. Existing unique keywords on the same edge take priority; repeated Sunder and other repeatable entries can stack, up to the 24-keyword card limit. Creating cards never triggers their keywords or spends Next Play. The card preview and inspection explain configured buffs and granted rules. Card files include buffs and any token templates referenced by nested grants. Adventures save the generated copies exactly, and those cards never join your pack or alter saved Draft picks. Existing Conjure cards without buffs keep their behavior.

## Token cards

Open **Collection → Tokens** for six starter templates: **Chompy Seedling, Arkeyan Drone, Fire Spark, Water Wisp, Shadow Decoy, and Magic Echo**. Tokens have their own fixed pips, element, portrait, tribes, and keywords. They are available through Conjure or custom enemy starting hands and never appear in normal starting decks, Draft pools, Adventure packs, rewards, shops, or transformations as ordinary cards. A shop or transformation can offer a **Conjure** keyword that generates tokens.

1. Choose **Create a token**, or check **Token only · available through Conjure** in the card studio. Set its stats and keywords, then **Save token template**. Saved tokens stay token-only. Editing an existing ordinary custom card into a token removes it from your next deck; a match already in progress keeps its saved copy.
2. On another card, add **Conjure → Card source → Specified token**, then select the template, count, and receiving player. Combo can grant token Conjure, and tokens can themselves have Conjure; their keywords activate only when played.
3. For random generation, choose **Random cards → Random pool → Tokens only** or **Cards and tokens**. Element and tribe filters apply together. The default random pool remains **Normal cards**, so existing Conjure effects keep their behavior.

Generated tokens are marked **Token · Conjured**, have unique IDs, and use the saved template rather than a character default. They follow normal capture, keyword, potion, and terrain rules and last for that battle. Editing or deleting a template never rewrites copies already generated, including copies in a saved Adventure. Future generation uses the edited template; a deleted custom template produces no cards until restored or replaced. Starter templates can be reset with **Restore token default**.

Exporting a token or a card that uses tokens includes its required token templates, including references inside Combo and other tokens. Importing the file installs those definitions too; a matching token ID updates its template. Card files may be up to 16 MB including bundled templates. Custom tokens save with your browser collection and can be backed up through card files.

## Tile environments

Add **Environment** in the card studio and choose a terrain type. Elemental Spring and Blight support a chosen edge or every edge; their amount can be 1–5. Bastion and War Banner also support amounts of 1–5.

| Environment | Effect on the occupant |
| --- | --- |
| Elemental Spring | Cards of a chosen element gain the specified pips. Other elements are unchanged. |
| Blight | Remove the specified pips, stopping at zero. |
| Bastion | Add defense-only pips to every side, alongside any Shield keywords. |
| War Banner | Add attack-only pips to every side. Orange sword badges show these separately. |
| Crosswind | Rotate ordinary pip values one side clockwise while the card is here. Keyword and Shield directions stay fixed. |
| Mirror Pool | North/South both use their stronger ordinary value; East/West do the same. |
| Equalizer | Every ordinary side uses the average of the four values, rounded down. |

Ordinary terrain effects apply after the card’s own keywords, received Next Play changes, and Dizzy. Boss element auras apply afterward. Sunder and directional potions target the displayed side when Crosswind rotates pip values. Terrain does not change printed card stats or remove keywords. Its attack-only and defense-only pips stay separate from ordinary pips. Changing terrain on an occupied tile changes its current strengths immediately; only the incoming card makes captures during a placement.

Colored tile markers and the board’s **Tile environments** list explain active terrain. **Pending next-card effects** shows who receives each queued change and its source. Inspect a card to see its terrain, received changes, and attack/defense values. Both mechanics work on 3×3 and 4×4 boards in normal matches, Draft, and Adventure. New Draft pools, shop inscriptions, shrines, and transformations can offer the new keywords; existing Draft pools keep their saved definitions.

## Tribes

Cards have tribe tags alongside their element. Character groups are **Giants, SWAP Force, Trap Masters, SuperChargers, Imaginators, Minis, Core, Villains, and Enemies**. Game families are **Spyro’s Adventure, Giants Era, SWAP Force Era, Trap Team, and SuperChargers Era**. Imaginators is the tag for characters from that game; there is no Sensei tribe.

Tags can overlap: Tree Rex is Giants and Giants Era, while Pop Fizz is Core and Giants Era. Portraits select their usual tags automatically. Change or clear them under **Card studio → Tribes**, filter the collection by tribe, or inspect a card to read its tags. Card files include edited tags. **Edit character default** applies tribe edits to new games and newly generated cards; existing Adventure runs and drafted cards keep their saved copies. Fusion combines both cards’ tribes.

- **Combo:** choose Same element, Shared tribe, Same element or tribe, or Same element and tribe. Cards show the requirement after the keyword, such as **Combo Magic**, **Combo Giants**, **Combo Magic / Giants** (either), or **Combo Magic + Giants** (both). A tribe check can use any shared tag or a specific tribe that both cards must have. It checks your previous played card, even if captured or silenced. Your first card never activates Combo. Pip and granted-keyword bonuses are still decided once before captures.
- **Resonance:** count a chosen element or tribe. Tribe Resonance counts matching cards already on the board across both owners, once per card, excluding the incoming card. The resulting bonus stays fixed.
- **Next Play:** optionally choose a recipient tribe, element, or both. All chosen requirements must match before any queued element change. The effect waits for that player’s next matching card; unrelated cards and opponent turns do not spend it. Multiple matching queues stack on that card.
- **Environments:** all seven terrain types can affect a selected tribe. Other occupants are unaffected. Elemental Spring can match an element or a tribe. Terrain remains on its tile through captures and swaps, so the current occupant’s tags determine whether it applies.

New Draft pools, merchant inscriptions, shrines, and transformations can offer tribe-qualified effects. Saved offers and existing Draft pools keep their original definitions.

## Project

- `src/game.ts`: pure rules, scoring, computer strategy, and imported-card validation.
- `src/Artwork.tsx`: bundled character portraits, card rendering, and legacy illustrations.
- `src/characters.ts`: character roster, portrait metadata, and legacy deck migration.
- `src/CaptureFlip.tsx`: ownership flip animation.
- `src/presentation.ts`, `src/CharacterAvatar.tsx`, `src/BoardSkins.tsx`, and `src/board-skins.css`: villain portraits, stable Adventure map identities, and six saved board skins.
- `src/App.tsx`: game table, collection, card studio, persistence, and dialogs.
- `src/CardInspection.tsx` and `src/KeywordEditor.tsx`: enlarged card rules and directional keyword editing.
- `src/effects.ts` and `src/BoardEffects.tsx`: queued next-card changes, seven tile environments, visible markers, and pending-effect summaries.
- `src/conjure.ts`: specified/random card generation, recipients, hand limits, unique temporary copies, and resolved histories.
- `src/tokens.ts`: six starter token templates, custom token storage, deck eligibility, and card-file dependencies.
- `src/tribes.ts` and `src/TribeEditor.tsx`: portrait tribe tags, card-maker editing, collection filters, and shared effect conditions.
- `src/cardDefaults.ts`: validated browser storage and shared character definitions for new normal, Draft, and Adventure cards.
- `src/adventure.ts` and `src/Expedition.tsx`: saved adventure state, rewards, encounters, potions, merchants, boss conditions, and adventure interface.
- `src/relics.ts` and `src/RelicCard.tsx`: all fifteen relics, deterministic unowned offers, shared modifiers, and relic artwork panels.
- `src/giants-data.json`, `src/giants.ts`, and `src/assets/giants`: the sourced Giants card catalogue and bundled artwork.
- `tests/game.test.ts`: isolated rules and validation checks.
- `tests/keywords.test.ts`: keyword timing, capture and defense bonuses, permanent activation, and import validation.
- `tests/browser/app.spec.ts`: Playwright browser workflows.
- `tests/browser/board-skins-portraits.spec.ts`: all skins across modes and board sizes, unchanged games during skin changes, opponent selection, Adventure map and boss portraits, preference migration, reloads, and phone layouts.
- `tests/browser/keywords.spec.ts`: mouse, keyboard and touch inspection, keyword editing, saved cards, and card-file sharing.
- `tests/adventure-identity.test.ts` and `tests/browser/card-visibility-identity.spec.ts`: fixed profiles across seeds, original Skystones pips, keyword restrictions, duplicate repair, and always-visible artwork.
- `tests/elemental-vortex.test.ts` and `tests/browser/elemental-vortex.spec.ts`: temporary attack and defense bonuses, keyword interactions, saved element cycles, both boss outcomes, next-element icons, and phone layouts.
- `tests/adventure.test.ts` and `tests/browser/adventure.spec.ts`: both board sizes, card catalogue, run progression, purchases, potion use, chest money, boss objectives, persistence, and phone layouts.
- `tests/potions.test.ts`, `tests/spire-events.test.ts`, and `tests/browser/expansion.spec.ts`: all potion effects, complete event-source coverage, event choices on both board sizes, five-keyword transforms, curses, matching, staged battles, notes, and saved progress.
- `tests/shop-rerolls-events.test.ts` and `tests/browser/shop-events.spec.ts`: paid and free rerolls, fresh shop keywords, retained purchases, shrine inscriptions, fusion previews and deck repair, save compatibility, and phone layouts.
- `tests/relics.test.ts` and `tests/browser/relics.spec.ts`: individual relic effects, stacking, one-time grants, larger belts, multiple card picks, discounts, relic guide, save compatibility, and the throne-only boss start.

To refresh the downloadable ZIP after changing the app, run `npm run package:download`. This rebuilds the standalone HTML and packages it in `downloads/Skystones.zip`; Python 3 is needed only for the packaging step. Commit the updated ZIP with the source changes.

Fonts and artwork are bundled locally. This is an independent fan-made tribute, not affiliated with Skylanders or Activision; no official game assets are included.
