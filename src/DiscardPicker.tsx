import { useState } from "react";
import { StoneCard } from "./Artwork";
import { KeywordDetails } from "./CardInspection";
import { discardPriority } from "./discard";
import type { DiscardPending } from "./discard";
import type { Edges } from "./game";
import "./discard.css";
export function DiscardPicker({
  pending,
  names,
  onConfirm,
  onCancel,
}: {
  pending: DiscardPending;
  names: string[];
  onConfirm: (ids: string[]) => void;
  onCancel: () => void;
}) {
  const [ids, setIds] = useState<string[]>([]);
  const selected = pending.cards.find((card) => card.id === ids.at(-1));
  return (
    <div className="discard-picker">
      <span className="eyebrow">AFTER CAPTURES AND CONJURE</span>
      <h2>Choose {pending.count} to discard.</h2>
      <p>
        {names[pending.owner]} · {pending.cards.length} cards in hand. Keep{" "}
        {pending.required} for the remaining turns.
        {pending.count < pending.requested
          ? ` Only ${pending.count} of ${pending.requested} requested discards can safely happen.`
          : ""}
      </p>
      <p className="discard-choice-count" role="status">
        {ids.length} / {pending.count} selected
      </p>
      <div
        className="discard-card-grid"
        role="group"
        aria-label="Cards eligible for discard"
      >
        {pending.cards.map((card, index) => (
          <button
            type="button"
            className={`discard-card-button ${ids.includes(card.id) ? "selected" : ""}`}
            key={card.id}
            aria-label={`Discard ${card.name}, card ${index + 1}`}
            aria-pressed={ids.includes(card.id)}
            disabled={!ids.includes(card.id) && ids.length >= pending.count}
            onClick={() =>
              setIds(
                ids.includes(card.id)
                  ? ids.filter((id) => id !== card.id)
                  : [...ids, card.id],
              )
            }
          >
            <StoneCard
              stone={card}
              edges={
                card.edges.map((n, side) =>
                  Math.min(99, n + (card.discardBuffs?.pips[side] || 0)),
                ) as Edges
              }
            />
            {discardPriority(card) > 0 && (
              <span className="discard-priority-note">
                Random priority {discardPriority(card)}
              </span>
            )}
          </button>
        ))}
      </div>
      {selected && (
        <div className="discard-selected-rules">
          <strong>{selected.name}</strong>
          <KeywordDetails stone={selected} />
        </div>
      )}
      <div className="detail-actions">
        <button className="button button-outline" onClick={onCancel}>
          Cancel play
        </button>
        <button
          className="button button-dark"
          disabled={ids.length !== pending.count}
          onClick={() => onConfirm(ids)}
        >
          Discard selected cards
        </button>
      </div>
      <p className="dialog-small-note">
        Nothing is committed until every discard choice is complete. Canceling
        leaves the turn unchanged.
      </p>
    </div>
  );
}
