# Skylanders character portraits and roster

Skylanders, its character names, character depictions, figures, and original game artwork belong to Activision, Toys for Bob, and their respective creators. This is an independent fan recreation, not an official product.

The application bundles 337 portrait images. Most hero/form photographs and renders are adapted from **velasquezd/SkylanderImages**, revision `9b43be566894d8e94292c012468d86553487adcb`:

https://github.com/velasquezd/SkylanderImages/tree/9b43be566894d8e94292c012468d86553487adcb

Spyro’s portrait uses **Mirakel’s clean Spyro coin portrait**, from **skylandersNFC/Skylanders-Image-Generator**, revision `a8c0bde4d3bd89918f30daa5cb04afb28147b115`, file `assets/01_Spyro/coins/Mirakel_Clean/1) Figures/Mirakel's spyro.png`. Credit: Mirakel and the skylandersNFC community. This replaces a miscolored photograph in the first reference. Character pictures were resized and encoded as WebP for offline use. Individual source paths are recorded in `src/characters.ts`.

Names, elements, character classes, and published character-stat hints were checked against **Anthony Kalampogias’s SkyRipper**, revision `90cd4f9f2dd2bb378726090a4c7962a83fbddf2a`, which credits the **Skylanders Wiki contributors**. No biographies, dialogue, or gameplay code were copied. The adapted character metadata and roster data are shared under **Creative Commons Attribution-ShareAlike 4.0 International**; this applies to the data adaptation, not ownership of underlying character artwork or to the application's independently written code.

https://github.com/AnthonyKalampogias/SkyRipper/tree/90cd4f9f2dd2bb378726090a4c7962a83fbddf2a
https://skylanders.fandom.com/
https://creativecommons.org/licenses/by-sa/4.0/

Pip strengths and keywords are an original, approximate balance adaptation. Minis, core characters, Giants, Trap Masters, and Senseis have different budgets; source stat profiles guide directional strengths where available. Draft retains its directional tradeoff rules. Adventure uses fixed per-character profiles, chosen in gradually stronger tiers; original Skystones pictures retain their transcribed original pips and have no Adventure keywords. Modified copies display a cropped character view to avoid obsolete embedded pip markings. These are not official Skystones cards or a claim of exact official combat rankings.

# Legacy Giants reference and artwork

The original 81-row Giants community transcription is retained in `src/giants-data.json` for provenance. The active roster consolidates numbered ranks into 39 pictured opponents. The unpictured Bark Demon illustrated stand-in has been replaced in legacy deck selection by Tree Rex. Actual playable character forms remain distinct; the troll enemy Jawbreaker is labeled separately from the Trap Master Jawbreaker.

Enemy names, elements, pip profiles, and the 39 chosen enemy pictures come from **NicMineDude/Skystones-JAVA-Edition**, revision `7c9282237973099d8fa3975b4572c2d810a6e2f4`, `src/main/resources/cardBase.csv` and `assets/baseStones`:

https://github.com/NicMineDude/Skystones-JAVA-Edition/tree/7c9282237973099d8fa3975b4572c2d810a6e2f4

CSV columns north/south/east/west are mapped to north/east/south/west. `None` becomes Neutral. The legacy source is a community transcription, not an independently verified official database. Enemy pictures were resized and encoded as WebP. No game code from the reference projects was included.

Earlier community projects consulted to check the rules and sample edge orientations:

- https://github.com/DanielStein15/skystones
- https://github.com/4ubiks/skystones

The application also uses React, Vite, Lucide, html-to-image, DM Sans, and Fraunces under their respective package licenses.

# Slay the Spire event reference

The event coverage list was checked against event identifiers in TranslateTheSpire/spanish_translation at revision `fb04988fb30f48c117422cd91d313a3cf54ebd6d`:

https://github.com/TranslateTheSpire/spanish_translation/blob/fb04988fb30f48c117422cd91d313a3cf54ebd6d/events.json

The catalogue covers 51 playable event names from that reference, plus adaptations of the unused Thinking with Puddles scene, Neow’s opening blessing, and the Spire Heart scene. Proceed Screen is a navigation interface and is excluded. All encounter prose, adapted game rules, and implementation in this project were written for Skystones; no Slay the Spire code, event dialogue, or artwork was copied. Slay the Spire and its event names belong to Mega Crit. This is an independent fan adaptation.

The reference metadata is provided under the following license:

MIT License

Copyright (c) 2018 PerikiyoXD

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
