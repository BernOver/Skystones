import { DEFAULT_DECK, handSize } from "./game.ts";
import type { BoardSize } from "./game.ts";
import { migrateDeckId } from "./characters.ts";

export interface SavedDeck {
  id: string;
  name: string;
  boardSize: BoardSize;
  cards: string[];
}
export interface DeckState {
  deck: string[];
  boardSize: BoardSize;
  decks: SavedDeck[];
  activeDeckId: string;
  lastDeckBySize: Partial<Record<BoardSize, string>>;
}
export const DECK_NAME_LIMIT = 40;
function cleanCards(
  input: unknown,
  size: BoardSize,
  allowed: ReadonlySet<string>,
): string[] {
  return [
    ...new Set(
      (Array.isArray(input) ? input : [])
        .filter((id): id is string => typeof id === "string")
        .map(migrateDeckId)
        .filter((id) => allowed.has(id)),
    ),
  ].slice(0, handSize(size));
}
function activate(state: DeckState, selected: SavedDeck): DeckState {
  const lastDeckBySize: DeckState["lastDeckBySize"] = {};
  for (const size of [3, 4] as const)
    if (
      state.decks.some(
        (deck) =>
          deck.id === state.lastDeckBySize[size] && deck.boardSize === size,
      )
    )
      lastDeckBySize[size] = state.lastDeckBySize[size];
  return {
    ...state,
    deck: [...selected.cards],
    boardSize: selected.boardSize,
    activeDeckId: selected.id,
    lastDeckBySize: { ...lastDeckBySize, [selected.boardSize]: selected.id },
  };
}
export function restoreDecks(
  input: unknown,
  allowed: ReadonlySet<string>,
): DeckState {
  const saved = (input && typeof input === "object" ? input : {}) as Record<
    string,
    unknown
  >;
  const decks: SavedDeck[] = [];
  for (const entry of Array.isArray(saved.decks) ? saved.decks : []) {
    if (
      !entry ||
      typeof entry !== "object" ||
      typeof entry.id !== "string" ||
      !/^[a-zA-Z0-9_-]{1,100}$/.test(entry.id) ||
      decks.some((deck) => deck.id === entry.id) ||
      typeof entry.name !== "string" ||
      !entry.name.trim() ||
      entry.name.trim().length > DECK_NAME_LIMIT ||
      ![3, 4].includes(entry.boardSize) ||
      !Array.isArray(entry.cards)
    )
      continue;
    decks.push({
      id: entry.id,
      name: entry.name.trim(),
      boardSize: entry.boardSize,
      cards: cleanCards(entry.cards, entry.boardSize, allowed),
    });
  }
  const size = saved.boardSize === 4 ? 4 : 3;
  if (!decks.length)
    decks.push({
      id: "deck-original",
      name: "My deck",
      boardSize: size,
      cards: cleanCards(
        Array.isArray(saved.deck) ? saved.deck : DEFAULT_DECK,
        size,
        allowed,
      ),
    });
  const last = (
    saved.lastDeckBySize && typeof saved.lastDeckBySize === "object"
      ? saved.lastDeckBySize
      : {}
  ) as DeckState["lastDeckBySize"];
  const selected =
    decks.find((deck) => deck.id === saved.activeDeckId) ||
    decks.find((deck) => deck.id === last[size] && deck.boardSize === size) ||
    decks.find((deck) => deck.boardSize === size) ||
    decks[0];
  return activate(
    {
      deck: [],
      boardSize: size,
      decks,
      activeDeckId: selected.id,
      lastDeckBySize: last,
    },
    selected,
  );
}
// Keep the legacy active-deck fields synchronized, and remove unavailable cards
// from every slot when a custom card is deleted or becomes a Conjure-only token.
export function synchronizeDecks(
  state: DeckState,
  allowed: ReadonlySet<string>,
): DeckState {
  const decks = state.decks.map((deck) => ({
    ...deck,
    cards: cleanCards(
      deck.id === state.activeDeckId ? state.deck : deck.cards,
      deck.boardSize,
      allowed,
    ),
  }));
  const selected = decks.find((deck) => deck.id === state.activeDeckId);
  if (!selected) return restoreDecks({ ...state, decks }, allowed);
  return activate({ ...state, decks }, selected);
}
export function selectSavedDeck(state: DeckState, id: string): DeckState {
  const selected = state.decks.find((deck) => deck.id === id);
  if (!selected) throw new Error("Choose a saved deck.");
  return activate(state, selected);
}
function checkedName(state: DeckState, name: string, except?: string): string {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > DECK_NAME_LIMIT)
    throw new Error(`Use a deck name from 1 to ${DECK_NAME_LIMIT} characters.`);
  if (
    state.decks.some(
      (deck) =>
        deck.id !== except &&
        deck.name.toLocaleLowerCase() === trimmed.toLocaleLowerCase(),
    )
  )
    throw new Error("That deck name is already used. Choose another name.");
  return trimmed;
}
export function availableDeckName(
  state: DeckState,
  suggestion = "New deck",
): string {
  let name = suggestion.slice(0, DECK_NAME_LIMIT),
    n = 2;
  while (
    state.decks.some(
      (deck) => deck.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
    )
  ) {
    const suffix = ` ${n++}`;
    name = suggestion.slice(0, DECK_NAME_LIMIT - suffix.length) + suffix;
  }
  return name;
}
export function createSavedDeck(
  state: DeckState,
  id: string,
  name: string,
  copy = false,
  size = state.boardSize,
): DeckState {
  if (
    !/^[a-zA-Z0-9_-]{1,100}$/.test(id) ||
    state.decks.some((deck) => deck.id === id)
  )
    throw new Error("This deck slot already exists.");
  const selected: SavedDeck = {
    id,
    name: checkedName(state, name),
    boardSize: size,
    cards: copy ? state.deck.slice(0, handSize(size)) : [],
  };
  return activate({ ...state, decks: [...state.decks, selected] }, selected);
}
export function renameSavedDeck(state: DeckState, name: string): DeckState {
  const nextName = checkedName(state, name, state.activeDeckId);
  return {
    ...state,
    decks: state.decks.map((deck) =>
      deck.id === state.activeDeckId ? { ...deck, name: nextName } : deck,
    ),
  };
}
export function deleteSavedDeck(state: DeckState): DeckState {
  if (state.decks.length <= 1) throw new Error("Keep at least one deck.");
  const decks = state.decks.filter((deck) => deck.id !== state.activeDeckId);
  return activate(
    { ...state, decks },
    decks.find((deck) => deck.boardSize === state.boardSize) || decks[0],
  );
}
export function deckForBoardSize(
  state: DeckState,
  size: BoardSize,
  availableCards: readonly string[],
  id: string,
): DeckState {
  if (size === state.boardSize) return state;
  const previous =
    state.decks.find(
      (deck) =>
        deck.id === state.lastDeckBySize[size] && deck.boardSize === size,
    ) || state.decks.find((deck) => deck.boardSize === size);
  if (previous) return activate(state, previous);
  const active = state.decks.find((deck) => deck.id === state.activeDeckId)!;
  const cards =
    state.deck.length === handSize(state.boardSize)
      ? [...new Set([...state.deck, ...availableCards])].slice(
          0,
          handSize(size),
        )
      : state.deck.slice(0, handSize(size));
  const next = createSavedDeck(
    state,
    id,
    availableDeckName(
      state,
      `${active.name.slice(0, DECK_NAME_LIMIT - 5)} ${size}×${size}`,
    ),
    false,
    size,
  );
  return {
    ...next,
    deck: [...cards],
    decks: next.decks.map((deck) =>
      deck.id === id ? { ...deck, cards: [...cards] } : deck,
    ),
  };
}
export function savedDeckLabel(deck: SavedDeck): string {
  return `${deck.name} · ${deck.boardSize}×${deck.boardSize} · ${deck.cards.length}/${handSize(deck.boardSize)} cards`;
}
