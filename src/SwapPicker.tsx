import { useState } from "react";
import { StoneCard } from "./Artwork";
import { KeywordDetails } from "./CardInspection";
import type { Stone, Edges } from "./game";
import { isSwapForce, swapCards } from "./swapForce";
import { SwapArtSettings } from "./SwapArtSettings";
import { SwapDetails } from "./SwapDetails";
import "./swap-force.css";
function strength(card: Stone): Edges {
  return card.edges.map((pip, side) =>
    Math.min(99, pip + (card.discardBuffs?.pips[side] || 0)),
  ) as Edges;
}
export function SwapPicker({
  hand,
  onConfirm,
  onCancel,
}: {
  hand: Stone[];
  onConfirm: (first: string, second: string) => void;
  onCancel: () => void;
}) {
  const [ids, setIds] = useState<string[]>([]);
  const cards = hand.filter(isSwapForce),
    selected = ids
      .map((id) => cards.find((card) => card.id === id)!)
      .filter(Boolean);
  let result: [Stone, Stone] | undefined,
    error = "";
  if (selected.length === 2)
    try {
      result = swapCards(selected[0], selected[1]);
    } catch (value) {
      error =
        value instanceof Error
          ? value.message
          : "These halves cannot be combined.";
    }
  return (
    <div className="swap-picker">
      <span className="eyebrow">BEFORE YOU PLAY · NO TURN COST</span>
      <h2>Mix a little magic.</h2>
      <p>
        Choose two SWAP Force cards. Each keeps its top (North / West) and
        receives the other card’s bottom (South / East), including its assigned
        keywords. Both cards stay in your hand. Swaps last for this battle.
      </p>
      <SwapArtSettings />
      <div
        className="swap-card-grid"
        role="group"
        aria-label="SWAP Force cards in hand"
      >
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            className={`swap-card-choice ${ids.includes(card.id) ? "is-selected" : ""}`}
            aria-label={`Swap ${card.name}`}
            aria-pressed={ids.includes(card.id)}
            disabled={!ids.includes(card.id) && ids.length === 2}
            onClick={() =>
              setIds(
                ids.includes(card.id)
                  ? ids.filter((id) => id !== card.id)
                  : [...ids, card.id],
              )
            }
          >
            <StoneCard stone={card} edges={strength(card)} />
            <span>{ids.includes(card.id) ? "Selected" : "Choose card"}</span>
          </button>
        ))}
      </div>
      {error && (
        <p className="adventure-error" role="alert">
          {error}
        </p>
      )}
      {result && (
        <section className="swap-result" aria-label="Swapped card preview">
          <h3>Your new pair</h3>
          <div className="swap-result-grid">
            {result.map((card) => (
              <div className="swap-result-card" key={card.id}>
                <StoneCard stone={card} edges={strength(card)} />
                <SwapDetails stone={card} edges={strength(card)} />
                <details>
                  <summary>{card.name} · keyword rules</summary>
                  <KeywordDetails stone={card} />
                </details>
              </div>
            ))}
          </div>
        </section>
      )}
      <div className="detail-actions">
        <button className="button button-outline" onClick={onCancel}>
          Cancel swap
        </button>
        <button
          className="button button-dark"
          disabled={!result}
          onClick={() => result && onConfirm(ids[0], ids[1])}
        >
          Swap halves
        </button>
      </div>
    </div>
  );
}
