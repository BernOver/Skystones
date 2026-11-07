import { useState } from "react";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { DECK_NAME_LIMIT, availableDeckName, savedDeckLabel } from "./decks";
import type { DeckState } from "./decks";
import type { BoardSize } from "./game";
import "./decks.css";

export type DeckAction = "new" | "duplicate" | "rename" | "delete";
export function DeckSelect({
  state,
  onSelect,
  label = "Saved deck",
}: {
  state: DeckState;
  onSelect: (id: string) => void;
  label?: string;
}) {
  return (
    <label className="saved-deck-select">
      {label}
      <select
        aria-label={label}
        value={state.activeDeckId}
        onChange={(event) => onSelect(event.target.value)}
      >
        {state.decks.map((deck) => (
          <option key={deck.id} value={deck.id}>
            {savedDeckLabel(deck)}
          </option>
        ))}
      </select>
    </label>
  );
}
export function DeckManager({
  state,
  onSelect,
  onAction,
}: {
  state: DeckState;
  onSelect: (id: string) => void;
  onAction: (action: DeckAction) => void;
}) {
  return (
    <section className="saved-deck-manager" aria-label="Saved decks">
      <div className="saved-deck-choice">
        <DeckSelect state={state} onSelect={onSelect} />
        <p>Changes save automatically in this browser.</p>
      </div>
      <div className="saved-deck-actions">
        <button className="button button-dark" onClick={() => onAction("new")}>
          <Plus size={15} />
          New deck
        </button>
        <button
          className="button button-outline"
          onClick={() => onAction("duplicate")}
        >
          <Copy size={15} />
          Duplicate deck
        </button>
        <button
          className="button button-outline"
          onClick={() => onAction("rename")}
        >
          <Pencil size={15} />
          Rename deck
        </button>
        <button
          className="button button-outline"
          disabled={state.decks.length <= 1}
          title={state.decks.length <= 1 ? "Keep at least one deck" : undefined}
          onClick={() => onAction("delete")}
        >
          <Trash2 size={15} />
          Delete deck
        </button>
      </div>
    </section>
  );
}
export function DeckForm({
  state,
  action,
  onConfirm,
  onCancel,
}: {
  state: DeckState;
  action: DeckAction;
  onConfirm: (name: string, size: BoardSize) => boolean;
  onCancel: () => void;
}) {
  const active = state.decks.find((deck) => deck.id === state.activeDeckId)!;
  const [name, setName] = useState(
    action === "rename"
      ? active.name
      : availableDeckName(
          state,
          action === "duplicate" ? `${active.name} copy` : "New deck",
        ),
  );
  const [size, setSize] = useState(state.boardSize);
  const [error, setError] = useState("");
  const title = {
    new: "Create a deck",
    duplicate: "Duplicate deck",
    rename: "Rename deck",
    delete: "Delete deck",
  }[action];
  return (
    <form
      className="saved-deck-form"
      onSubmit={(event) => {
        event.preventDefault();
        try {
          setError("");
          onConfirm(name, size);
        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to save this deck.",
          );
        }
      }}
    >
      <h2>{title}</h2>
      {action === "delete" ? (
        <p>Delete “{active.name}”? Your cards stay in the collection.</p>
      ) : (
        <>
          <label>
            Deck name
            <input
              aria-label="Deck name"
              value={name}
              maxLength={DECK_NAME_LIMIT}
              required
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          {action === "new" ? (
            <label>
              Board size
              <select
                aria-label="New deck board size"
                value={size}
                onChange={(event) =>
                  setSize(Number(event.target.value) as BoardSize)
                }
              >
                <option value="3">3×3 · 5 cards</option>
                <option value="4">4×4 · 8 cards</option>
              </select>
            </label>
          ) : (
            <p>
              {active.boardSize}×{active.boardSize} · {active.cards.length}{" "}
              cards
              {action === "duplicate" ? " copied to a separate deck." : "."}
            </p>
          )}
        </>
      )}
      {error && (
        <p role="alert" className="inline-warning">
          {error}
        </p>
      )}
      <div className="detail-actions">
        <button
          type="button"
          className="button button-outline"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={`button ${action === "delete" ? "button-danger" : "button-dark"}`}
          disabled={action !== "delete" && !name.trim()}
        >
          {title}
        </button>
      </div>
    </form>
  );
}
