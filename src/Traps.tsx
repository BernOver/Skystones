import { useState } from "react";
import type { Board, Element, Owner } from "./game";
import { ELEMENTS } from "./game";
import { pendingAmplify } from "./amplify";
import { DEFAULT_TRAPS, readTraps, saveTrap, trapText } from "./traps";
import type { Trap, TrapState } from "./traps";
import { TribeSelect } from "./TribeEditor";
import "./traps.css";
export function TrapCrystal({ trap }: { trap: Trap }) {
  return (
    <svg
      className="trap-crystal"
      viewBox="0 0 100 120"
      aria-hidden="true"
      style={{ color: ELEMENTS[trap.element].color }}
    >
      <ellipse cx="50" cy="107" rx="34" ry="8" fill="#29273c" />
      <path
        d="M29 88 18 32 35 9 65 9 82 32 71 88 50 105Z"
        fill="currentColor"
        stroke="#fff8"
        strokeWidth="3"
      />
      <path
        d="m35 9 6 66 9 30 10-30 5-66M18 32l23 43h19l22-43M18 32h64"
        fill="none"
        stroke="#ffffff80"
        strokeWidth="2"
      />
      <path d="m50 31 12 19-12 19-12-19Z" fill="#fff9" />
    </svg>
  );
}
export function TrapPanel({
  state,
  turn,
  owner,
  disabled,
  onPlay,
  board,
}: {
  state?: TrapState;
  turn: number;
  owner: Owner;
  disabled?: boolean;
  onPlay: (trap: Trap) => void;
  board: Board;
}) {
  const catalogue = readTraps(),
    [selected, setSelected] = useState(catalogue[0].id),
    chosen = catalogue.find((t) => t.id === selected) || catalogue[0],
    ready = state?.lastPlayed[owner] !== turn;
  return (
    <>
      <section className="trap-panel" aria-label="Shared Trap slot">
        <TrapCrystal trap={state?.active?.trap || chosen} />
        <div>
          <strong>
            {state?.active ? state.active.trap.name : "No active Trap"}
          </strong>
          <p>
            {state?.active
              ? trapText(state.active.trap)
              : "One shared crystal affects both players. Play a new Trap to replace it."}
          </p>
          <div className="trap-controls">
            <label>
              Trap
              <select
                aria-label="Choose Trap"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                {catalogue.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="button button-outline"
              disabled={
                disabled || !ready || state?.active?.trap.id === chosen.id
              }
              onClick={() => onPlay(chosen)}
            >
              Activate Trap
            </button>
          </div>
          <small>
            {ready
              ? "One Trap activation per turn; does not spend a stone or end your turn."
              : "Trap used this turn."}
          </small>
          {chosen.id !== state?.active?.trap.id && (
            <p className="trap-preview">{trapText(chosen)}</p>
          )}
        </div>
      </section>
      <AmplifyStatus board={board} owner={owner} />
    </>
  );
}
export function AmplifyStatus({
  board,
  owner,
}: {
  board: Board;
  owner: Owner;
}) {
  const effects = pendingAmplify(board, owner);
  return effects.length ? (
    <aside className="amplify-status" aria-label="Ready Amplify effects">
      {effects.map((q) => (
        <span key={q.id}>
          Amplify · {q.effect.replaceAll("-", " ")} · {q.count} use
          {q.count === 1 ? "" : "s"} ready
        </span>
      ))}
    </aside>
  ) : null;
}
export function TrapCollection() {
  const [cards, setCards] = useState(readTraps),
    [draft, setDraft] = useState<Trap | null>(null),
    [error, setError] = useState("");
  return (
    <section className="trap-collection">
      <p>
        Traptanium crystals act as a shared stadium. Only one is active;
        replacing it immediately updates all matching cards, including Unique
        cards, tokens, and Superchargers. Silence does not disable the crystal.
      </p>
      <button
        className="button button-dark"
        onClick={() =>
          setDraft({
            id: `trap-custom-${crypto.randomUUID()}`,
            name: "New Traptanium Crystal",
            element: "magic",
            description: "A crystal with a shared battlefield effect.",
            effects: [{ kind: "pips", side: "all", amount: 1 }],
          })
        }
      >
        Create a Trap
      </button>
      {draft && (
        <form
          className="trap-editor studio-section"
          onSubmit={(e) => {
            e.preventDefault();
            try {
              saveTrap(draft);
              setCards(readTraps());
              setDraft(null);
              setError("");
            } catch (err) {
              setError((err as Error).message);
            }
          }}
        >
          <h2>Create or edit a Trap</h2>
          <label>
            Name
            <input
              aria-label="Trap name"
              maxLength={40}
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </label>
          <label>
            Crystal element
            <select
              aria-label="Trap crystal element"
              value={draft.element}
              onChange={(e) =>
                setDraft({ ...draft, element: e.target.value as Element })
              }
            >
              {Object.entries(ELEMENTS).map(([id, v]) => (
                <option key={id} value={id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Matching element
            <select
              aria-label="Trap matching element"
              value={draft.affects?.element || ""}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  affects: {
                    ...draft.affects,
                    element: (e.target.value || undefined) as
                      | Element
                      | undefined,
                  },
                })
              }
            >
              <option value="">All elements</option>
              {Object.entries(ELEMENTS).map(([id, v]) => (
                <option key={id} value={id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
          <TribeSelect
            label="Trap matching tribe"
            value={draft.affects?.tribe || ""}
            onChange={(tribe) =>
              setDraft({
                ...draft,
                affects: { ...draft.affects, tribe: tribe || undefined },
              })
            }
          />
          <label>
            <input
              type="checkbox"
              checked={!!draft.affects?.exclude}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  affects: { ...draft.affects, exclude: e.target.checked },
                })
              }
            />
            Affect cards outside the matching group
          </label>
          {draft.effects.map((effect, i) => (
            <fieldset key={i}>
              <legend>Effect {i + 1}</legend>
              <label>
                Kind
                <select
                  aria-label={`Trap effect ${i + 1}`}
                  value={effect.kind}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      effects: draft.effects.map((old, j) =>
                        j === i
                          ? {
                              ...old,
                              kind: e.target.value as typeof effect.kind,
                            }
                          : old,
                      ),
                    })
                  }
                >
                  <option value="pips">Ordinary pips</option>
                  <option value="attack">Attack only</option>
                  <option value="defense">Defense only</option>
                </select>
              </label>
              <label>
                Direction
                <select
                  aria-label={`Trap direction ${i + 1}`}
                  value={effect.side}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      effects: draft.effects.map((old, j) =>
                        j === i
                          ? {
                              ...old,
                              side:
                                e.target.value === "all"
                                  ? "all"
                                  : (Number(e.target.value) as 0 | 1 | 2 | 3),
                            }
                          : old,
                      ),
                    })
                  }
                >
                  <option value="all">Every side</option>
                  {["North", "East", "South", "West"].map((s, n) => (
                    <option key={s} value={n}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Pips
                <input
                  aria-label={`Trap pips ${i + 1}`}
                  type="number"
                  min={-5}
                  max={5}
                  value={effect.amount}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      effects: draft.effects.map((old, j) =>
                        j === i
                          ? { ...old, amount: Number(e.target.value) }
                          : old,
                      ),
                    })
                  }
                />
              </label>
              {draft.effects.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      effects: draft.effects.filter((_, j) => i !== j),
                    })
                  }
                >
                  Remove effect
                </button>
              )}
            </fieldset>
          ))}
          <button
            type="button"
            disabled={draft.effects.length >= 4}
            onClick={() =>
              setDraft({
                ...draft,
                effects: [
                  ...draft.effects,
                  { kind: "defense", side: "all", amount: 1 },
                ],
              })
            }
          >
            Add effect
          </button>
          <p>{trapText(draft)}</p>
          {error && <p role="alert">{error}</p>}
          <button className="button button-dark">Save Trap</button>
          <button
            type="button"
            className="text-button"
            onClick={() => setDraft(null)}
          >
            Cancel
          </button>
        </form>
      )}
      <div className="trap-grid">
        {cards.map((trap) => (
          <article key={trap.id}>
            <TrapCrystal trap={trap} />
            <h2>{trap.name}</h2>
            <p>{trapText(trap)}</p>
            <button
              className="text-button"
              onClick={() =>
                setDraft({
                  ...structuredClone(trap),
                  id: DEFAULT_TRAPS.some((t) => t.id === trap.id)
                    ? `trap-custom-${crypto.randomUUID()}`
                    : trap.id,
                })
              }
            >
              {DEFAULT_TRAPS.some((t) => t.id === trap.id)
                ? "Customize a copy"
                : "Edit Trap"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
