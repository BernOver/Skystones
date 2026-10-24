import { Scissors, VolumeX } from "lucide-react";
import { StoneCard } from "./Artwork";
import {
  COORDINATES,
  KEYWORD_RULES,
  SIDE_NAMES,
  prepareTargeting,
} from "./game";
import type { Board, KeywordTarget, Stone } from "./game";

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
  onChoose: (index: number) => void;
  onCancel: () => void;
}) {
  const state = prepareTargeting(board, stone, targets);
  if (!state.pending) return null;
  const { keyword, candidates } = state.pending;
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
        {stone.name} → {COORDINATES[placement]}
      </div>
      <h2>{KEYWORD_RULES[keyword.type].name}: choose a card</h2>
      <p className="dialog-intro">
        {keyword.type === "sunder" ? (
          <>
            Remove <strong>1 {SIDE_NAMES[keyword.side]} pip</strong> from a card
            already on the board.
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
                `${KEYWORD_RULES[effect.type].name} → ${COORDINATES[effect.target]}`,
            )
            .join(" · ")}
          . You can still cancel this play.
        </p>
      )}
      <div
        className="target-board"
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
                  ? `Target ${COORDINATES[index]}: ${cell.stone.name}, ${names[cell.owner]}`
                  : `${COORDINATES[index]}, ${index === placement ? "placing here" : "empty"}`
              }
              onClick={() => onChoose(index)}
            >
              <span className="target-coordinate">
                {COORDINATES[index]}
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
                        ? `${SIDE_NAMES[keyword.side]} ${(cell.edges || cell.stone.edges)[keyword.side]} → ${(cell.edges || cell.stone.edges)[keyword.side] - 1}`
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
