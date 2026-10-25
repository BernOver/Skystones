import { useState } from "react";
import { ELEMENTS } from "./game";
import { PORTRAIT_OPTIONS, portraitImage } from "./portraits";
import type { CharacterPortrait } from "./characters";
export function PortraitPicker({
  selected,
  onChoose,
}: {
  selected?: string;
  onChoose: (portrait: CharacterPortrait) => void;
}) {
  const [query, setQuery] = useState(""),
    [element, setElement] = useState("all"),
    [unused, setUnused] = useState(false);
  const choices = PORTRAIT_OPTIONS.filter(
    (p) =>
      (!unused || !p.playable) &&
      (element === "all" || p.element === element) &&
      `${p.name} ${p.game} ${p.role}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <div className="portrait-picker">
      <div className="portrait-filters">
        <label>
          Find a character
          <input
            type="search"
            aria-label="Find a character portrait"
            placeholder="Spyro, Tree Rex, Dark, SuperChargers…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          Element
          <select
            aria-label="Portrait element"
            value={element}
            onChange={(e) => setElement(e.target.value)}
          >
            <option value="all">All elements</option>
            {Object.entries(ELEMENTS).map(([id, e]) => (
              <option key={id} value={id}>
                {e.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="portrait-unused">
        <input
          type="checkbox"
          checked={unused}
          onChange={(e) => setUnused(e.target.checked)}
        />
        Portraits without a default card
      </label>
      <p className="field-note">
        {choices.length} portraits · selecting one fills an empty name and sets
        its element. Your pips and keywords stay as chosen.
      </p>
      <div
        className="portrait-grid"
        role="group"
        aria-label="Skylanders character portraits"
      >
        {choices.map((p) => (
          <button
            type="button"
            key={p.id}
            aria-label={`Use ${p.name} portrait`}
            aria-pressed={selected === p.id}
            className={selected === p.id ? "active" : ""}
            onClick={() => onChoose(p)}
          >
            <img src={portraitImage(p.id)} alt="" loading="lazy" />
            <strong>{p.name}</strong>
            <small>{p.game}</small>
          </button>
        ))}
      </div>
      {!choices.length && (
        <p>No portraits match. Try another name or element.</p>
      )}
    </div>
  );
}
