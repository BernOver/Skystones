import { useState } from "react";
import { Flag, Plus, Trash2 } from "lucide-react";
import {
  ELEMENTS,
  KEYWORD_RULES,
  MAX_KEYWORDS,
  SIDE_NAMES,
  keywordKey,
} from "./game";
import type { Element, KeywordType, Side, StoneKeyword } from "./game";
import { KeywordDetails } from "./CardInspection";
import type { Stone } from "./game";

export function KeywordEditor({
  stone,
  onChange,
}: {
  stone: Stone;
  onChange: (keywords: StoneKeyword[]) => void;
}) {
  const [error, setError] = useState("");
  const keywords = stone.keywords || [];
  function update(index: number, value: StoneKeyword) {
    if (
      keywords.some(
        (keyword, i) =>
          i !== index && keywordKey(keyword) === keywordKey(value),
      )
    ) {
      setError(
        value.type === "silence" || value.type === "dizzy"
          ? `${KEYWORD_RULES[value.type].name} is already on this card.`
          : value.side === "any"
            ? "Sunder with an edge chosen when played is already on this card."
            : `${KEYWORD_RULES[value.type].name} is already assigned to ${SIDE_NAMES[value.side]}. Choose another edge.`,
      );
      return;
    }
    setError("");
    onChange(keywords.map((keyword, i) => (i === index ? value : keyword)));
  }
  function add() {
    for (const type of Object.keys(KEYWORD_RULES) as KeywordType[]) {
      for (const side of (type === "sunder"
        ? [0, 1, 2, 3, "any"]
        : [0, 1, 2, 3]) as (Side | "any")[]) {
        const value: StoneKeyword =
          type === "silence" || type === "dizzy"
            ? { type }
            : type === "sunder"
              ? { type, side }
              : type === "resonance"
                ? { type, side: side as Side, element: stone.element }
                : { type, side: side as Side };
        if (
          !keywords.some((keyword) => keywordKey(keyword) === keywordKey(value))
        ) {
          onChange([...keywords, value]);
          setError("");
          return;
        }
      }
    }
  }
  return (
    <section className="studio-section keyword-editor">
      <div className="studio-section-heading">
        <span className="step-number">04</span>
        <div>
          <h2>A few clever words</h2>
          <p>Boost your edges or disrupt a card already on the board.</p>
        </div>
        <Flag size={19} />
      </div>
      <div className="keyword-editor-list">
        {keywords.map((keyword, index) => (
          <div
            className={`keyword-editor-row ${keyword.type === "resonance" ? "has-element" : ""} ${keyword.type === "sunder" ? "has-strength" : ""} ${keyword.type === "silence" || keyword.type === "dizzy" ? "no-edge" : ""}`}
            key={index}
          >
            <div>
              <label htmlFor={`keyword-type-${index}`}>
                Keyword {index + 1}
              </label>
              <select
                id={`keyword-type-${index}`}
                value={keyword.type}
                onChange={(e) =>
                  update(
                    index,
                    e.target.value === "silence" || e.target.value === "dizzy"
                      ? { type: e.target.value }
                      : e.target.value === "resonance"
                        ? {
                            type: "resonance",
                            side:
                              keyword.type === "silence" ||
                              keyword.type === "dizzy" ||
                              keyword.side === "any"
                                ? 0
                                : keyword.side,
                            element:
                              keyword.type === "resonance"
                                ? keyword.element
                                : stone.element,
                          }
                        : {
                            type: e.target.value as
                              "head-start" | "comeback" | "sunder",
                            side:
                              keyword.type === "silence" ||
                              keyword.type === "dizzy" ||
                              keyword.side === "any"
                                ? 0
                                : keyword.side,
                          },
                  )
                }
              >
                {Object.entries(KEYWORD_RULES).map(([type, rule]) => (
                  <option key={type} value={type}>
                    {type === "resonance"
                      ? "Resonance · count an element"
                      : type === "sunder"
                        ? "Sunder · remove pips"
                        : type === "silence"
                          ? "Silence · disable keywords"
                          : type === "dizzy"
                            ? "Dizzy · shuffle pips after captures"
                            : `${rule.name} · while ${rule.condition}`}
                  </option>
                ))}
              </select>
            </div>
            {keyword.type !== "silence" && keyword.type !== "dizzy" && (
              <div>
                <label htmlFor={`keyword-side-${index}`}>
                  {keyword.type === "sunder" ? "Target edge" : "Affected edge"}{" "}
                  {index + 1}
                </label>
                <select
                  id={`keyword-side-${index}`}
                  value={keyword.side}
                  onChange={(e) =>
                    update(
                      index,
                      keyword.type === "sunder"
                        ? {
                            ...keyword,
                            side:
                              e.target.value === "any"
                                ? "any"
                                : (Number(e.target.value) as Side),
                          }
                        : {
                            ...keyword,
                            side: Number(e.target.value) as Side,
                          },
                    )
                  }
                >
                  {SIDE_NAMES.map((side, i) => (
                    <option key={side} value={i}>
                      {side}
                      {keyword.type === "resonance"
                        ? ""
                        : keyword.type === "sunder"
                          ? ` −${keyword.amount ?? 1}`
                          : " +1"}
                    </option>
                  ))}
                  {keyword.type === "sunder" && (
                    <option value="any">Any · choose when played</option>
                  )}
                </select>
              </div>
            )}
            {keyword.type === "resonance" && (
              <div className="resonance-element-field">
                <label htmlFor={`keyword-element-${index}`}>
                  Counted element {index + 1}
                </label>
                <select
                  id={`keyword-element-${index}`}
                  value={keyword.element}
                  onChange={(event) =>
                    update(index, {
                      ...keyword,
                      element: event.target.value as Element,
                    })
                  }
                >
                  {Object.entries(ELEMENTS).map(([element, details]) => (
                    <option value={element} key={element}>
                      {details.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {keyword.type === "sunder" && (
              <div className="sunder-strength-field">
                <label htmlFor={`keyword-amount-${index}`}>
                  Pips removed {index + 1}
                </label>
                <input
                  id={`keyword-amount-${index}`}
                  type="number"
                  min={1}
                  max={99}
                  step={1}
                  value={keyword.amount ?? 1}
                  onChange={(event) => {
                    const amount = event.target.valueAsNumber;
                    if (!Number.isInteger(amount) || amount < 1 || amount > 99)
                      return;
                    const { amount: _, ...base } = keyword;
                    update(index, amount === 1 ? base : { ...base, amount });
                  }}
                />
              </div>
            )}
            <button
              type="button"
              className="icon-button"
              aria-label={`Remove keyword ${index + 1}`}
              onClick={() => {
                onChange(keywords.filter((_, i) => i !== index));
                setError("");
              }}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
      {error && (
        <p className="keyword-editor-error" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        className="button button-outline add-keyword"
        disabled={keywords.length >= MAX_KEYWORDS}
        onClick={add}
      >
        <Plus size={15} />
        Add keyword
        <span>
          {keywords.length} / {MAX_KEYWORDS}
        </span>
      </button>
      {!!keywords.length ? (
        <KeywordDetails stone={stone} />
      ) : (
        <div className="keyword-editor-intro">
          <p>
            <strong>Head Start</strong> activates if you’re winning before
            placement.
          </p>
          <p>
            <strong>Comeback</strong> activates if you’re losing before
            placement.
          </p>
          <p>
            <strong>Resonance</strong> adds one pip per card of your chosen
            element already on the board, from either player.
          </p>
          <p>
            <strong>Sunder</strong> removes your chosen number of pips from a
            board card’s edge, down to zero. Set a fixed edge or choose it when
            played; the target can be anywhere on the board.
          </p>
          <p>
            <strong>Silence</strong> disables a chosen board card’s keywords and
            removes their bonuses.
          </p>
          <p>
            <strong>Dizzy</strong> redistributes this card’s pips once after
            placement and captures. Each edge has at most four pips; totals
            above 16 are capped at 16.
          </p>
          <small>
            Head Start and Comeback do not activate on a tie. All bonuses are
            locked in before placement and stay after score changes and
            captures, unless removed by Silence. Choose Sunder and Silence
            targets when playing, before captures. Bonuses can raise an edge
            above 5; your printed stats still use the 12-point budget.
          </small>
        </div>
      )}
      <p className="field-note">
        Set Sunder’s pip amount from 1–99. Its “Any · choose when played” option
        lets the player pick any board card, then choose which edge loses pips.
        Edges stop at zero.
      </p>
      <p className="field-note">
        Keyword bonuses do not spend printed-stat points and can raise edges
        above 5. Different keywords on the same edge add together.
      </p>
    </section>
  );
}
