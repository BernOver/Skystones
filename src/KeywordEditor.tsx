import { useState } from "react";
import { Flag, Plus, Trash2 } from "lucide-react";
import { ELEMENTS, KEYWORD_RULES, MAX_KEYWORDS, SIDE_NAMES } from "./game";
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
          i !== index &&
          keyword.type === value.type &&
          keyword.side === value.side,
      )
    ) {
      setError(
        `${KEYWORD_RULES[value.type].name} is already assigned to ${SIDE_NAMES[value.side]}. Choose another edge.`,
      );
      return;
    }
    setError("");
    onChange(keywords.map((keyword, i) => (i === index ? value : keyword)));
  }
  function add() {
    for (const type of Object.keys(KEYWORD_RULES) as KeywordType[]) {
      for (let side = 0; side < 4; side++) {
        if (
          !keywords.some(
            (keyword) => keyword.type === type && keyword.side === side,
          )
        ) {
          onChange([
            ...keywords,
            type === "resonance"
              ? { type, side: side as Side, element: stone.element }
              : { type, side: side as Side },
          ]);
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
          <p>Boost an edge with a condition or an element count.</p>
        </div>
        <Flag size={19} />
      </div>
      <div className="keyword-editor-list">
        {keywords.map((keyword, index) => (
          <div
            className={`keyword-editor-row ${keyword.type === "resonance" ? "has-element" : ""}`}
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
                    e.target.value === "resonance"
                      ? {
                          type: "resonance",
                          side: keyword.side,
                          element:
                            keyword.type === "resonance"
                              ? keyword.element
                              : stone.element,
                        }
                      : {
                          type: e.target.value as "head-start" | "comeback",
                          side: keyword.side,
                        },
                  )
                }
              >
                {Object.entries(KEYWORD_RULES).map(([type, rule]) => (
                  <option key={type} value={type}>
                    {type === "resonance"
                      ? "Resonance · count an element"
                      : `${rule.name} · while ${rule.condition}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`keyword-side-${index}`}>
                Affected edge {index + 1}
              </label>
              <select
                id={`keyword-side-${index}`}
                value={keyword.side}
                onChange={(e) =>
                  update(index, {
                    ...keyword,
                    side: Number(e.target.value) as Side,
                  })
                }
              >
                {SIDE_NAMES.map((side, i) => (
                  <option key={side} value={i}>
                    {side}
                    {keyword.type === "resonance" ? "" : " +1"}
                  </option>
                ))}
              </select>
            </div>
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
          <small>
            Head Start and Comeback do not activate on a tie. All bonuses are
            locked in before placement and stay after score changes and
            captures. Bonuses can raise an edge above 5; your printed stats
            still use the 12-point budget.
          </small>
        </div>
      )}
      <p className="field-note">
        Keyword bonuses do not spend printed-stat points and can raise edges
        above 5. Different keywords on the same edge add together.
      </p>
    </section>
  );
}
