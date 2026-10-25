import { useState } from "react";
import { Flag, Plus, Trash2 } from "lucide-react";
import {
  ELEMENTS,
  KEYWORD_RULES,
  MAX_KEYWORDS,
  DIZZY_EDGE_CAP,
  SIDE_NAMES,
  keywordKey,
  validateKeywords,
} from "./game";
import type {
  BasicKeyword,
  ComboKeyword,
  Element,
  KeywordType,
  Side,
  Stone,
  StoneKeyword,
} from "./game";
import { KeywordDetails } from "./CardInspection";

export function defaultKeyword(
  type: KeywordType,
  side: Side = 0,
  element: Element = "magic",
): StoneKeyword {
  if (type === "silence" || type === "dizzy") return { type };
  if (type === "combo") return { type, pips: [{ side, amount: 1 }] };
  if (type === "resonance") return { type, side, element };
  return { type, side };
}
function Fields({
  keyword,
  label,
  element,
  allowCombo = true,
  onChange,
}: {
  keyword: StoneKeyword;
  label: string;
  element: Element;
  allowCombo?: boolean;
  onChange: (value: StoneKeyword) => void;
}) {
  const suffix = label.replace(/\D/g, "");
  const side = "side" in keyword && keyword.side !== "any" ? keyword.side : 0;
  return (
    <>
      <div>
        <label>
          {label}
          <select
            aria-label={label}
            value={keyword.type}
            onChange={(e) =>
              onChange(
                defaultKeyword(e.target.value as KeywordType, side, element),
              )
            }
          >
            {Object.entries(KEYWORD_RULES)
              .filter(([type]) => allowCombo || type !== "combo")
              .map(([type, rule]) => (
                <option key={type} value={type}>
                  {rule.name} · {rule.condition}
                </option>
              ))}
          </select>
        </label>
      </div>
      {"side" in keyword && (
        <div>
          <label>
            {keyword.type === "sunder" ? "Target edge" : "Affected edge"}{" "}
            {suffix}
            <select
              aria-label={`${keyword.type === "sunder" ? "Target edge" : "Affected edge"} ${label.replace("Keyword ", "")}`}
              value={keyword.side}
              onChange={(e) =>
                onChange({
                  ...keyword,
                  side:
                    e.target.value === "any"
                      ? "any"
                      : (Number(e.target.value) as Side),
                } as StoneKeyword)
              }
            >
              {SIDE_NAMES.map((name, i) => (
                <option key={i} value={i}>
                  {name}
                </option>
              ))}
              {keyword.type === "sunder" && (
                <option value="any">Any · choose when played</option>
              )}
            </select>
          </label>
        </div>
      )}
      {keyword.type === "resonance" && (
        <div className="resonance-element-field">
          <label>
            Counted element {suffix}
            <select
              aria-label={`Counted element ${label.replace("Keyword ", "")}`}
              value={keyword.element}
              onChange={(e) =>
                onChange({ ...keyword, element: e.target.value as Element })
              }
            >
              {Object.entries(ELEMENTS).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      {(keyword.type === "sunder" || keyword.type === "shield") && (
        <div className="sunder-strength-field">
          <label>
            {keyword.type === "sunder" ? "Pips removed" : "Shield pips"}{" "}
            {suffix}
            <input
              aria-label={`${keyword.type === "sunder" ? "Pips removed" : "Shield pips"} ${label.replace("Keyword ", "")}`}
              type="number"
              min={1}
              max={99}
              value={keyword.amount ?? 1}
              onChange={(e) => {
                const amount = e.target.valueAsNumber;
                if (Number.isInteger(amount) && amount >= 1 && amount <= 99)
                  onChange({ ...keyword, amount });
              }}
            />
          </label>
        </div>
      )}
    </>
  );
}
function ComboFields({
  keyword,
  element,
  onChange,
}: {
  keyword: ComboKeyword;
  element: Element;
  onChange: (value: ComboKeyword) => void;
}) {
  const grants = keyword.keywords || [];
  return (
    <div className="combo-editor">
      <p>
        If your previous played card has the same element, gain these pips and
        keywords once before captures. Your first card cannot Combo.
      </p>
      <div className="combo-pip-grid">
        {SIDE_NAMES.map((name, side) => (
          <label key={name}>
            Combo {name} pips
            <select
              aria-label={`Combo ${name} pips`}
              value={
                keyword.pips?.find((pip) => pip.side === side)?.amount || 0
              }
              onChange={(e) =>
                onChange({
                  ...keyword,
                  pips: [
                    ...(keyword.pips || []).filter((pip) => pip.side !== side),
                    ...(Number(e.target.value)
                      ? [{ side: side as Side, amount: Number(e.target.value) }]
                      : []),
                  ],
                })
              }
            >
              {[0, 1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value ? `+${value}` : "None"}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      {grants.map((grant, index) => (
        <div className="keyword-editor-row combo-grant" key={index}>
          <Fields
            keyword={grant}
            label={`Combo keyword ${index + 1}`}
            element={element}
            allowCombo={false}
            onChange={(value) =>
              onChange({
                ...keyword,
                keywords: grants.map((old, i) =>
                  i === index ? (value as BasicKeyword) : old,
                ),
              })
            }
          />
          <button
            type="button"
            className="icon-button"
            aria-label={`Remove Combo keyword ${index + 1}`}
            onClick={() =>
              onChange({
                ...keyword,
                keywords: grants.filter((_, i) => i !== index),
              })
            }
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}
      <button
        type="button"
        className="button button-outline"
        disabled={grants.length >= 5}
        onClick={() => {
          for (const type of [
            "shield",
            "sunder",
            "silence",
            "dizzy",
            "head-start",
            "comeback",
            "resonance",
          ] as const)
            for (const side of [0, 1, 2, 3] as Side[]) {
              const value = defaultKeyword(type, side, element) as BasicKeyword;
              if (
                !grants.some((old) => keywordKey(old) === keywordKey(value))
              ) {
                onChange({ ...keyword, keywords: [...grants, value] });
                return;
              }
            }
        }}
      >
        <Plus size={14} />
        Add Combo keyword
      </button>
      <small>
        Use pips, up to five granted keywords, or both. Granted Sunder and
        Silence choose targets when played. Granted keywords stay on this card;
        Silence removes all Combo bonuses.
      </small>
    </div>
  );
}
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
    const next = keywords.map((old, i) => (i === index ? value : old));
    if (
      value.type !== "sunder" &&
      keywords.some(
        (old, i) => i !== index && keywordKey(old) === keywordKey(value),
      )
    ) {
      setError(`${KEYWORD_RULES[value.type].name} is already on this card.`);
      return;
    }
    if (!validateKeywords(next)) {
      setError(
        "Sunder can repeat on the same edge. Other keywords need a unique edge; Combo needs at least one pip bonus or granted keyword.",
      );
      return;
    }
    setError("");
    onChange(next);
  }
  return (
    <section className="studio-section keyword-editor">
      <div className="studio-section-heading">
        <span className="step-number">04</span>
        <div>
          <h2>A few clever words</h2>
          <p>Attack, defend, and chain matching elements.</p>
        </div>
        <Flag size={19} />
      </div>
      <div className="keyword-editor-list">
        {keywords.map((keyword, index) => (
          <div className="keyword-editor-entry" key={index}>
            <div
              className={`keyword-editor-row ${keyword.type === "resonance" ? "has-element" : ""} ${keyword.type === "sunder" || keyword.type === "shield" ? "has-strength" : ""} ${!("side" in keyword) ? "no-edge" : ""}`}
            >
              <Fields
                keyword={keyword}
                label={`Keyword ${index + 1}`}
                element={stone.element}
                onChange={(value) => update(index, value)}
              />
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
            {keyword.type === "combo" && (
              <ComboFields
                keyword={keyword}
                element={stone.element}
                onChange={(value) => update(index, value)}
              />
            )}
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
        onClick={() => {
          for (const type of Object.keys(KEYWORD_RULES) as KeywordType[])
            for (const side of [0, 1, 2, 3] as Side[]) {
              const value = defaultKeyword(type, side, stone.element);
              if (
                !keywords.some((old) => keywordKey(old) === keywordKey(value))
              ) {
                onChange([...keywords, value]);
                setError("");
                return;
              }
            }
          if (!keywords.some((old) => keywordKey(old) === "sunder:any"))
            onChange([...keywords, { type: "sunder", side: "any" }]);
        }}
      >
        <Plus size={15} />
        Add keyword
        <span>
          {keywords.length} / {MAX_KEYWORDS}
        </span>
      </button>
      {keywords.length ? (
        <KeywordDetails stone={stone} />
      ) : (
        <div className="keyword-editor-intro">
          <p>
            <strong>Head Start</strong> gives +1 while winning before placement.{" "}
            <strong>Comeback</strong> gives +1 while losing.
          </p>
          <p>
            <strong>Resonance</strong> counts matching elements on both sides
            before placement.
          </p>
          <p>
            <strong>Sunder</strong> removes 1–99 pips from a chosen board card’s
            edge. Choose a fixed edge or “Any · choose when played.” Add Sunder
            more than once on the same edge to choose a separate target for each
            entry.
          </p>
          <p>
            <strong>Silence</strong> disables a board card’s keywords and
            removes their bonuses.
          </p>
          <p>
            <strong>Dizzy</strong> shuffles pips after captures, at most{" "}
            {DIZZY_EDGE_CAP}
            per edge.
          </p>
          <p>
            <strong>Shield</strong> adds directional defense pips, never attack
            pips.
          </p>
          <p>
            <strong>Combo</strong> grants pips and/or keywords when your
            previous played card has the same element.
          </p>
        </div>
      )}
      <p className="field-note">
        Bonuses do not spend the printed 12-point budget. All on-play checks
        happen once. Captures never retrigger keywords.
      </p>
    </section>
  );
}
