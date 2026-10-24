import { useEffect, useRef, useState } from "react";
import { Scissors, VolumeX } from "lucide-react";
import { StoneCard } from "./Artwork";
import {
  coordinate,
  boardSize,
  KEYWORD_RULES,
  SIDE_NAMES,
  prepareTargeting,
} from "./game";
import type { Board, KeywordTarget, Side, Stone } from "./game";

export function TargetPicker({
  board,
  stone,
  placement,
  targets,
  names,
  onChoose,
  onCancel,
}: {
  board: Board;
  stone: Stone;
  placement: number;
  targets: KeywordTarget[];
  names: string[];
  onChoose: (index: number, side?: Side) => void;
  onCancel: () => void;
}) {
  const state = prepareTargeting(board, stone, targets);
  const size = boardSize(board);
  const [chosen, setChosen] = useState<{
    keywordIndex: number;
    boardIndex: number;
  } | null>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const selectedTarget =
    chosen?.keywordIndex === state.pending?.keywordIndex
      ? (chosen?.boardIndex ?? null)
      : null;
  useEffect(() => {
    optionsRef.current
      ?.querySelector<HTMLButtonElement>("button:not(:disabled)")
      ?.focus();
  }, [selectedTarget, state.pending?.keywordIndex]);
  if (!state.pending) return null;
  const { keyword, candidates } = state.pending;
  const flexible = keyword.type === "sunder" && keyword.side === "any";
  const amount = keyword.type === "sunder" ? (keyword.amount ?? 1) : 1;
  const selectedCard =
    selectedTarget !== null ? state.board[selectedTarget] : null;
  return (
    <>
      <span className="modal-illustration">
        {keyword.type === "sunder" ? (
          <Scissors size={28} />
        ) : (
          <VolumeX size={28} />
        )}
      </span>
      <div className="eyebrow">
        {stone.name} → {coordinate(placement, size)}
      </div>
      <h2 aria-live="polite">
        {KEYWORD_RULES[keyword.type].name}: choose{" "}
        {selectedCard ? "an edge" : "a card"}
      </h2>
      <p className="dialog-intro">
        {keyword.type === "sunder" ? (
          <>
            {flexible ? (
              <>
                Choose <strong>any card anywhere on the board</strong>, then
                choose which edge loses{" "}
                <strong>
                  up to {amount} pip{amount > 1 ? "s" : ""}
                </strong>
                .
              </>
            ) : (
              <>
                Remove{" "}
                <strong>
                  up to {amount}{" "}
                  {keyword.side === "any" ? "chosen" : SIDE_NAMES[keyword.side]}{" "}
                  pip{amount > 1 ? "s" : ""}
                </strong>{" "}
                from a card already on the board.
              </>
            )}
          </>
        ) : (
          <>
            Disable a board card’s{" "}
            <strong>keywords and their pip bonuses</strong>.
          </>
        )}{" "}
        Choose either player’s card. This resolves before captures.
      </p>
      {!!state.effects.length && (
        <p className="target-progress">
          Chosen so far:{" "}
          {state.effects
            .map(
              (effect) =>
                `${KEYWORD_RULES[effect.type].name} → ${coordinate(effect.target, size)}`,
            )
            .join(" · ")}
          . You can still cancel this play.
        </p>
      )}
      {selectedCard && selectedTarget !== null ? (
        <div className="target-edge-selection" ref={optionsRef}>
          <p>
            <strong>{selectedCard.stone.name}</strong> ·{" "}
            {coordinate(selectedTarget, size)} · {names[selectedCard.owner]}
          </p>
          <div className="target-selected-card">
            <StoneCard
              stone={selectedCard.stone}
              edges={selectedCard.edges || selectedCard.stone.edges}
              silenced={selectedCard.silenced}
              owner={selectedCard.owner}
            />
          </div>
          <div
            className="target-edge-options"
            role="group"
            aria-label="Choose the edge that loses pips"
          >
            {SIDE_NAMES.map((name, side) => {
              const pips = (selectedCard.edges || selectedCard.stone.edges)[
                side
              ];
              return (
                <button
                  key={side}
                  className="button button-outline"
                  disabled={pips <= 0}
                  onClick={() => onChoose(selectedTarget, side as Side)}
                  aria-label={`${name}: ${pips} → ${Math.max(0, pips - amount)}`}
                >
                  <span>{name}</span>
                  <strong>
                    {pips} → {Math.max(0, pips - amount)}
                  </strong>
                </button>
              );
            })}
          </div>
          <button
            className="text-button target-back"
            onClick={() => setChosen(null)}
          >
            Choose another card
          </button>
        </div>
      ) : (
        <div
          ref={optionsRef}
          className={`target-board target-board-${size}`}
          role="group"
          aria-label="Choose a keyword target on the board"
        >
          {state.board.map((cell, index) => {
            const available = candidates.includes(index);
            return (
              <button
                key={index}
                disabled={!available}
                className={`target-cell ${available ? "available" : "unavailable"}`}
                aria-label={
                  cell
                    ? `Target ${coordinate(index, size)}: ${cell.stone.name}, ${names[cell.owner]}`
                    : `${coordinate(index, size)}, ${index === placement ? "placing here" : "empty"}`
                }
                onClick={() =>
                  flexible
                    ? setChosen({
                        keywordIndex: state.pending!.keywordIndex,
                        boardIndex: index,
                      })
                    : onChoose(index)
                }
              >
                <span className="target-coordinate">
                  {coordinate(index, size)}
                  {cell ? ` · ${names[cell.owner]}` : ""}
                </span>
                {cell ? (
                  <>
                    <StoneCard
                      stone={cell.stone}
                      owner={cell.owner}
                      edges={cell.edges || cell.stone.edges}
                      silenced={cell.silenced}
                      compact
                    />
                    <span className="target-change">
                      {available
                        ? keyword.type === "sunder"
                          ? keyword.side === "any"
                            ? "Choose an edge"
                            : `${SIDE_NAMES[keyword.side]} ${(cell.edges || cell.stone.edges)[keyword.side]} → ${Math.max(0, (cell.edges || cell.stone.edges)[keyword.side] - amount)}`
                          : "Disable keywords"
                        : "No valid effect"}
                    </span>
                  </>
                ) : (
                  <span className="target-empty">
                    {index === placement ? "Your new card" : "Empty"}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
      <p className="field-note">
        {keyword.type === "sunder"
          ? "Pips cannot fall below zero. The reduction stays after captures or Silence."
          : "Silence lasts for the rest of the match. Earlier captures and resolved effects stay."}{" "}
        If no valid targets remain, the next effect is skipped.
      </p>
      <button className="button button-outline full-width" onClick={onCancel}>
        Cancel play
      </button>
    </>
  );
}
