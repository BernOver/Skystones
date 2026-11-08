import { useEffect, useState } from "react";
import {
  TRIBES,
  availableTribes,
  stoneTribes,
  tribeName,
  saveCustomTribe,
  TRIBES_CHANGED,
} from "./tribes";
import type { BuiltinTribe } from "./tribes";
function useTribes(extra: readonly Tribe[] = []) {
  const [, refresh] = useState(0);
  useEffect(() => {
    const update = () => refresh((n) => n + 1);
    window.addEventListener(TRIBES_CHANGED, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(TRIBES_CHANGED, update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return availableTribes(extra);
}
const groupOf = (id: Tribe) =>
  id.startsWith("custom:") ? "Custom tribes" : TRIBES[id as BuiltinTribe].group;
import type { Tribe } from "./tribes";
import type { Stone } from "./game";

export function TribeSelect({
  label,
  value,
  onChange,
  empty = "Any tribe",
}: {
  label: string;
  value: Tribe | "";
  onChange: (value: Tribe | "") => void;
  empty?: string | false;
}) {
  const tribes = useTribes(value ? [value] : []);
  return (
    <label>
      {label}
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value as Tribe | "")}
      >
        {empty !== false && <option value="">{empty}</option>}
        {["Character groups", "Game families", "Custom tribes"].map((group) => (
          <optgroup key={group} label={group}>
            {tribes
              .filter((id) => groupOf(id) === group)
              .map((id) => (
                <option key={id} value={id}>
                  {tribeName(id)}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
export function TribeEditor({
  stone,
  onChange,
}: {
  stone: Stone;
  onChange: (tribes: Tribe[]) => void;
}) {
  const selected = stoneTribes(stone);
  const tribes = useTribes(selected);
  const [name, setName] = useState(""),
    [error, setError] = useState("");
  const addTribe = () => {
    try {
      const id = saveCustomTribe(name);
      onChange([...new Set([...selected, id])]);
      setName("");
      setError("");
    } catch (value) {
      setError(
        value instanceof Error ? value.message : "Could not save this tribe.",
      );
    }
  };
  return (
    <fieldset className="tribe-editor">
      <legend>Tribes</legend>
      <p>
        Character groups and game families can overlap. These tags power tribe
        effects. Portraits select their usual tribes; you can change them here.
      </p>
      {["Character groups", "Game families", "Custom tribes"].map((group) => (
        <div key={group}>
          <small>{group}</small>
          <div className="tribe-options">
            {tribes
              .filter((id) => groupOf(id) === group)
              .map((id) => (
                <label
                  key={id}
                  className={selected.includes(id) ? "is-active" : ""}
                >
                  <input
                    type="checkbox"
                    aria-label={`Tribe ${tribeName(id)}`}
                    checked={selected.includes(id)}
                    onChange={(event) =>
                      onChange(
                        event.target.checked
                          ? [...selected, id]
                          : selected.filter((value) => value !== id),
                      )
                    }
                  />
                  {tribeName(id)}
                </label>
              ))}
          </div>
        </div>
      ))}
      <div className="custom-tribe-create">
        <label>
          New tribe name
          <input
            aria-label="New tribe name"
            maxLength={32}
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                if (name.trim()) addTribe();
              }
            }}
            placeholder="For example, Spellcasters"
          />
        </label>
        <button
          type="button"
          className="button button-outline"
          disabled={!name.trim()}
          onClick={addTribe}
        >
          Add tribe
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      <p>
        Custom tribes are saved for other cards and all tribe requirements.
        Their names travel with exported cards.
      </p>
      <button
        type="button"
        className="text-button"
        onClick={() => onChange([])}
      >
        Clear tribes
      </button>
    </fieldset>
  );
}
export function TribeBadges({ stone }: { stone: Stone }) {
  const tribes = stoneTribes(stone);
  return (
    <div className="tribe-badges" aria-label="Card tribes">
      {tribes.length ? (
        tribes.map((id) => <span key={id}>{tribeName(id)}</span>)
      ) : (
        <span>No tribes</span>
      )}
    </div>
  );
}
