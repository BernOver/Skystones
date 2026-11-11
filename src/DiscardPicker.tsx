import { trapEdges } from "./traps";
import { useState } from "react";
import { StoneCard } from "./Artwork";
import { KeywordDetails } from "./CardInspection";
import { discardPriority } from "./discard";
import type { DiscardPending } from "./discard";
import type { Edges } from "./game";
import "./discard.css";
export function DiscardPicker(props: Parameters<typeof DiscardCardsPicker>[0]) {
  return props.pending.gift ? (
    <PartingGiftPicker {...props} />
  ) : (
    <DiscardCardsPicker {...props} />
  );
}
function DiscardCardsPicker({
  pending,
  names,
  onConfirm,
  onCancel,
  cancelLabel = "Cancel play",
}: {
  pending: DiscardPending;
  cancelLabel?: string;
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
              trap={pending.trap}
              edges={trapEdges(
                card.edges.map((n, side) =>
                  Math.max(
                    0,
                    Math.min(99, n + (card.discardBuffs?.pips[side] || 0)),
                  ),
                ) as Edges,
                card,
                pending.trap,
              )}
            />
            {discardPriority(card, pending.trap) > 0 && (
              <span className="discard-priority-note">
                Random priority {discardPriority(card, pending.trap)}
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
          {cancelLabel}
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

function PartingGiftPicker({
  pending,
  names,
  onConfirm,
  onCancel,
  cancelLabel = "Cancel play",
}: Parameters<typeof DiscardCardsPicker>[0]) {
  const [ids, setIds] = useState<string[]>([]);
  const gift = pending.gift!;
  return (
    <div className="discard-picker parting-gift-picker">
      <span className="eyebrow">PARTING GIFT · {names[pending.owner]}</span>
      <h2>
        Choose {pending.count} gift target{pending.count === 1 ? "" : "s"}.
      </h2>
      <p>
        <strong>{gift.source}</strong> · {gift.text}
      </p>
      <p className="discard-choice-count" role="status">
        {ids.length} / {pending.count} selected
      </p>
      <div
        className="discard-card-grid"
        role="group"
        aria-label="Eligible Parting Gift targets"
      >
        {gift.options.map((option) => (
          <button
            type="button"
            key={option.id}
            className={`discard-card-button ${ids.includes(option.id) ? "selected" : ""}`}
            aria-label={`Gift to ${option.stone.name}, ${names[option.owner]}, ${option.location}${option.boardIndex === undefined ? "" : ", square " + (option.boardIndex + 1)}`}
            aria-pressed={ids.includes(option.id)}
            disabled={!ids.includes(option.id) && ids.length >= pending.count}
            onClick={() =>
              setIds(
                ids.includes(option.id)
                  ? ids.filter((id) => id !== option.id)
                  : [...ids, option.id],
              )
            }
          >
            <small>
              {names[option.owner]} ·{" "}
              {option.location === "hand"
                ? "Hand"
                : "Board · square " + (option.boardIndex! + 1)}
            </small>
            <StoneCard
              stone={option.stone}
              edges={
                option.location === "hand"
                  ? trapEdges(option.edges, option.stone, pending.trap)
                  : option.edges
              }
              shields={option.shields}
              keywordShields={option.keywordShields}
              environment={option.environment}
              trap={pending.trap}
              played={option.location === "board"}
            />
          </button>
        ))}
      </div>
      <div className="detail-actions">
        <button className="button button-outline" onClick={onCancel}>
          {cancelLabel}
        </button>
        <button
          className="button button-dark"
          disabled={ids.length !== pending.count}
          onClick={() => onConfirm(ids)}
        >
          Apply Parting Gift
        </button>
      </div>
      <p className="dialog-small-note">
        Nothing is committed until every discard and gift choice is complete.
      </p>
    </div>
  );
}
