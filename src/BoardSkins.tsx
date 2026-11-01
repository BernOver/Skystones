import { Check } from "lucide-react";
import { BOARD_SKINS } from "./presentation";
import type { BoardSkinId } from "./presentation";
export function BoardSkins({
  selected,
  onSelect,
}: {
  selected: BoardSkinId;
  onSelect: (id: BoardSkinId) => void;
}) {
  return (
    <>
      <div className="eyebrow">MAKE THE TABLE YOURS</div>
      <h2>Choose your board</h2>
      <p className="dialog-intro">
        Six Skystones-inspired tables. Your choice applies to normal, drafted,
        and Adventure games, on both board sizes.
      </p>
      <div className="board-skin-options" role="group" aria-label="Board skins">
        {BOARD_SKINS.map((skin) => (
          <button
            key={skin.id}
            className="board-skin-option"
            onClick={() => onSelect(skin.id)}
            aria-label={`Use ${skin.name} skin`}
            aria-pressed={selected === skin.id}
          >
            <span
              className="board-skin-preview"
              data-board-skin={skin.id}
              aria-hidden="true"
            >
              {Array.from({ length: 9 }, (_, i) => (
                <i key={i} />
              ))}
            </span>
            <span className="board-skin-name">
              {skin.name}
              {selected === skin.id && <Check size={16} />}
            </span>
            <span className="board-skin-description">{skin.description}</span>
          </button>
        ))}
      </div>
      <p className="field-note">
        Change the look at any time with Board skins. Your cards and progress
        stay in place.
      </p>
    </>
  );
}
