import { useState } from "react";
import type { Board, Element, Owner, Side } from "./game";
import { ELEMENTS, KEYWORD_RULES } from "./game";
import { pendingAmplify } from "./amplify";
import {
  DEFAULT_TRAPS,
  readTraps,
  saveTrap,
  trapText,
  TRAP_EFFECTS,
  TRAP_AMPLIFY_TARGETS,
  defaultTrapEffect,
  isTrapPipEffect,
  trapEffectSides,
} from "./traps";
import type { Trap, TrapState, TrapEffect, TrapAmplifyTarget } from "./traps";
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
  board,
  owner,
}: {
  state?: TrapState;
  board: Board;
  owner: Owner;
}) {
  return (
    <>
      <section className="trap-panel" aria-label="Shared Trap slot">
        {state?.active && <TrapCrystal trap={state.active.trap} />}
        <div>
          <strong>{state?.active?.trap.name || "No active Trap"}</strong>
          <p>
            {state?.active
              ? trapText(state.active.trap)
              : "Play a stone with a Trap keyword to place a crystal. Only one shared Trap can be active."}
          </p>
          {state?.active?.source && (
            <small>
              Placed by {state.active.source}. A new stone’s Trap replaces it.
            </small>
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
          <p>
            Choose up to eight effects. Pip additions apply first, then pip
            transformations in the listed order. Attack and defense bonuses
            apply afterward. All effects follow the element and tribe filters
            above.
          </p>
          {draft.effects.map((effect, i) => (
            <fieldset key={i}>
              <legend>Effect {i + 1}</legend>
              <TrapEffectFields
                effect={effect}
                index={i}
                onChange={(updated) =>
                  setDraft({
                    ...draft,
                    effects: draft.effects.map((old, j) =>
                      j === i ? updated : old,
                    ),
                  })
                }
              />
              <div className="trap-effect-actions">
                <button
                  type="button"
                  disabled={i === 0}
                  aria-label={`Move Trap effect ${i + 1} up`}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      effects: draft.effects.map((e, j) =>
                        j === i
                          ? draft.effects[i - 1]
                          : j === i - 1
                            ? effect
                            : e,
                      ),
                    })
                  }
                >
                  Move up
                </button>
                <button
                  type="button"
                  disabled={i === draft.effects.length - 1}
                  aria-label={`Move Trap effect ${i + 1} down`}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      effects: draft.effects.map((e, j) =>
                        j === i
                          ? draft.effects[i + 1]
                          : j === i + 1
                            ? effect
                            : e,
                      ),
                    })
                  }
                >
                  Move down
                </button>
                {draft.effects.length > 1 && (
                  <button
                    type="button"
                    aria-label={`Remove Trap effect ${i + 1}`}
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
              </div>
            </fieldset>
          ))}
          <button
            type="button"
            disabled={draft.effects.length >= 8}
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

function TrapEffectFields({
  effect,
  index,
  onChange,
}: {
  effect: TrapEffect;
  index: number;
  onChange: (effect: TrapEffect) => void;
}) {
  const number = index + 1;
  return (
    <>
      <label>
        Kind
        <select
          aria-label={`Trap effect ${number}`}
          value={effect.kind}
          onChange={(e) => {
            const next = defaultTrapEffect(
              e.target.value as TrapEffect["kind"],
            );
            if ("side" in next && "side" in effect) {
              next.side = effect.side;
              next.sides = effect.sides;
            }
            if (isTrapPipEffect(next) && isTrapPipEffect(effect))
              next.amount = effect.amount;
            onChange(next);
          }}
        >
          {Object.entries(TRAP_EFFECTS).map(([id, meta]) => (
            <option key={id} value={id}>
              {meta.name}
            </option>
          ))}
        </select>
      </label>
      {"side" in effect && (
        <>
          <label>
            Direction
            <select
              aria-label={`Trap direction ${number}`}
              value={effect.sides ? "selected" : effect.side}
              onChange={(e) =>
                onChange({
                  ...effect,
                  side:
                    e.target.value === "all" || e.target.value === "selected"
                      ? "all"
                      : (Number(e.target.value) as Side),
                  sides: e.target.value === "selected" ? [0] : undefined,
                })
              }
            >
              <option value="all">Every side</option>
              {["North", "East", "South", "West"].map((s, n) => (
                <option key={s} value={n}>
                  {s}
                </option>
              ))}
              <option value="selected">Selected sides</option>
            </select>
          </label>
          {effect.sides && (
            <div
              className="trap-side-options"
              role="group"
              aria-label={`Affected sides ${number}`}
            >
              {["North", "East", "South", "West"].map((s, n) => (
                <label key={s}>
                  <input
                    type="checkbox"
                    aria-label={`Trap ${s} ${number}`}
                    checked={trapEffectSides(effect).includes(n as Side)}
                    disabled={
                      effect.sides?.length === 1 &&
                      effect.sides.includes(n as Side)
                    }
                    onChange={(e) =>
                      onChange({
                        ...effect,
                        sides: e.target.checked
                          ? ([...effect.sides!, n as Side].sort() as Side[])
                          : effect.sides!.filter((side) => side !== n),
                      })
                    }
                  />
                  {s}
                </label>
              ))}
            </div>
          )}
        </>
      )}
      {isTrapPipEffect(effect) && (
        <label>
          Pips
          <input
            aria-label={`Trap pips ${number}`}
            type="number"
            min={-5}
            max={5}
            value={effect.amount}
            onChange={(e) =>
              onChange({ ...effect, amount: Number(e.target.value) })
            }
          />
        </label>
      )}
      {effect.kind === "amplify" && (
        <label>
          Keyword to double
          <select
            aria-label={`Trap doubled keyword ${number}`}
            value={effect.effect}
            onChange={(e) =>
              onChange({
                ...effect,
                effect: e.target.value as TrapAmplifyTarget,
              })
            }
          >
            {TRAP_AMPLIFY_TARGETS.map((type) => (
              <option key={type} value={type}>
                {type === "all"
                  ? "All eligible keywords"
                  : KEYWORD_RULES[type].name}
              </option>
            ))}
          </select>
        </label>
      )}
      {effect.kind === "ceiling" && (
        <label>
          Maximum ordinary pips
          <input
            aria-label={`Trap pip ceiling ${number}`}
            type="number"
            min={0}
            max={5}
            value={effect.maximum}
            onChange={(e) =>
              onChange({ ...effect, maximum: Number(e.target.value) })
            }
          />
        </label>
      )}
      {effect.kind === "steady" && (
        <label>
          Minimum Dizzy roll
          <input
            aria-label={`Trap minimum Dizzy roll ${number}`}
            type="number"
            min={1}
            max={5}
            value={effect.minimum}
            onChange={(e) =>
              onChange({ ...effect, minimum: Number(e.target.value) })
            }
          />
        </label>
      )}
      <p className="trap-effect-help">
        {TRAP_EFFECTS[effect.kind].description}
      </p>
    </>
  );
}
