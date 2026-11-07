import { TRIBES, TRIBE_IDS, stoneTribes, tribeName } from "./tribes";
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
  return (
    <label>
      {label}
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value as Tribe | "")}
      >
        {empty !== false && <option value="">{empty}</option>}
        {["Character groups", "Game families"].map((group) => (
          <optgroup key={group} label={group}>
            {TRIBE_IDS.filter((id) => TRIBES[id].group === group).map((id) => (
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
  return (
    <fieldset className="tribe-editor">
      <legend>Tribes</legend>
      <p>
        Character groups and game families can overlap. These tags power tribe
        effects. Portraits select their usual tribes; you can change them here.
      </p>
      {["Character groups", "Game families"].map((group) => (
        <div key={group}>
          <small>{group}</small>
          <div className="tribe-options">
            {TRIBE_IDS.filter((id) => TRIBES[id].group === group).map((id) => (
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
