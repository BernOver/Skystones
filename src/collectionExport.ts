import { CHARACTER_STONES, ENEMY_STONES } from "./characters.ts";
import { characterDefault, parseCharacterDefaults } from "./cardDefaults.ts";
import type { CharacterDefaults } from "./cardDefaults.ts";
import { validateStone } from "./game.ts";
import type { Stone } from "./game.ts";
import { DEFAULT_TOKENS, tokenCatalogue } from "./tokens.ts";
import { customTribeLabels, readCustomTribes } from "./tribes.ts";

export function collectionExport(
  custom: Stone[],
  characterDefaults: CharacterDefaults,
) {
  const defaults = parseCharacterDefaults(characterDefaults);
  const originals = [...CHARACTER_STONES, ...ENEMY_STONES];
  const permanent = custom.filter(
    (card) =>
      validateStone(card) &&
      !card.conjured &&
      !card.encounterStart &&
      !card.swapParts &&
      !card.discardBuffs &&
      !card.receivedKeywords &&
      !card.receivedElement,
  );
  const customCards = permanent.filter((card) => !card.token);
  const cards = originals
    .map((card) => characterDefault(card, defaults))
    .concat(customCards);
  const tokens = tokenCatalogue(permanent);
  const customTribes = [
    ...new Map(
      [...customTribeLabels([cards, tokens]), ...readCustomTribes()].map(
        (tribe) => [tribe.id, tribe],
      ),
    ).values(),
  ];
  return structuredClone({
    format: "skystones-collection" as const,
    version: 1 as const,
    exportedAt: new Date().toISOString(),
    summary: {
      builtInCards: originals.length,
      editedCharacters: Object.keys(defaults).length,
      customCards: customCards.length,
      tokenTemplates: tokens.length,
    },
    cards,
    tokens,
    characterDefaults: defaults,
    originalCards: originals.filter(
      (card) => card.portrait && Object.hasOwn(defaults, card.portrait),
    ),
    originalTokens: DEFAULT_TOKENS,
    customTribes,
  });
}
