import { useState } from "react";
import { Flag, Plus, Trash2 } from "lucide-react";
import {
  ELEMENTS,
  KEYWORD_RULES,
  MAX_KEYWORDS,
  MAX_KEYWORD_DEPTH,
  DIZZY_EDGE_CAP,
  dizzySides,
  SIDE_NAMES,
  keywordKey,
  validateKeywords,
  repeatableKeyword,
} from "./game";
import { ENVIRONMENTS, defaultEnvironment } from "./effects";
import type { EffectSide, EnvironmentKind } from "./effects";
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
import { TribeSelect } from "./TribeEditor";
import type { ComboCondition } from "./tribes";
import { CONJURE_CARDS, MAX_HAND_CARDS } from "./conjure";
import { readTokens } from "./tokens";

export function defaultKeyword(
  type: KeywordType,
  side: Side = 0,
  element: Element = "magic",
): StoneKeyword {
  if (type === "silence") return { type };
  if (type === "dizzy") return { type, sides: [side] };
  if (type === "combo") return { type, pips: [{ side, amount: 1 }] };
  if (type === "next-play") return { type, side, amount: 1, recipient: "self" };
  if (type === "shift")
    return {
      type,
      side,
      direction: ((side + 1) % 4) as Side,
      affects: "enemies",
    };
  if (type === "environment")
    return { type, environment: defaultEnvironment("elemental", element) };
  if (type === "conjure")
    return {
      type,
      mode: "specific",
      card: "spyro",
      count: 1,
      recipient: "self",
    };
  if (type === "resonance") return { type, side, element };
  return { type, side };
}
function Fields({
  keyword,
  label,
  element,
  allowCombo = true,
  depth = 0,
  onChange,
}: {
  keyword: StoneKeyword;
  label: string;
  element: Element;
  allowCombo?: boolean;
  depth?: number;
  onChange: (value: StoneKeyword) => void;
}) {
  const suffix = /^Keyword \d+$/.test(label)
    ? label.replace("Keyword ", "")
    : label;
  const side =
    "side" in keyword && typeof keyword.side === "number" ? keyword.side : 0;
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
      {keyword.type === "conjure" && (
        <div className="effect-editor-options conjure-editor-options">
          <label>
            Receiving player
            <select
              aria-label={`Receiving player · ${label}`}
              value={keyword.recipient}
              onChange={(event) =>
                onChange({
                  ...keyword,
                  recipient: event.target.value as "self" | "opponent" | "both",
                })
              }
            >
              <option value="self">Your hand</option>
              <option value="opponent">Opponent’s hand</option>
              <option value="both">Both players’ hands</option>
            </select>
          </label>
          <label>
            Cards added
            <select
              aria-label={`Cards added · ${label}`}
              value={keyword.count}
              onChange={(event) =>
                onChange({ ...keyword, count: Number(event.target.value) })
              }
            >
              {[1, 2, 3, 4, 5].map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </label>
          <label>
            Card source
            <select
              aria-label={`Card source · ${label}`}
              value={keyword.mode}
              onChange={(event) => {
                const buffs = {
                  ...(keyword.pips ? { pips: keyword.pips } : {}),
                  ...(keyword.keywords ? { keywords: keyword.keywords } : {}),
                };
                onChange(
                  event.target.value === "specific"
                    ? {
                        type: "conjure",
                        ...buffs,
                        mode: "specific",
                        card: "spyro",
                        count: keyword.count,
                        recipient: keyword.recipient,
                      }
                    : event.target.value === "token"
                      ? {
                          type: "conjure",
                          ...buffs,
                          mode: "token",
                          token: readTokens()[0].id,
                          count: keyword.count,
                          recipient: keyword.recipient,
                        }
                      : {
                          type: "conjure",
                          ...buffs,
                          mode: "random",
                          count: keyword.count,
                          recipient: keyword.recipient,
                        },
                );
              }}
            >
              <option value="specific">Specified card</option>
              <option value="token">Specified token</option>
              <option value="random">Random cards</option>
            </select>
          </label>
          {keyword.mode === "specific" ? (
            <label>
              Specified card
              <select
                aria-label={`Specified card · ${label}`}
                value={keyword.card}
                onChange={(event) =>
                  onChange({ ...keyword, card: event.target.value })
                }
              >
                {[...CONJURE_CARDS]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((card) => (
                    <option key={card.portrait} value={card.portrait}>
                      {card.name}
                    </option>
                  ))}
              </select>
            </label>
          ) : keyword.mode === "token" ? (
            <label>
              Specified token
              <select
                aria-label={`Specified token · ${label}`}
                value={keyword.token}
                onChange={(event) =>
                  onChange({ ...keyword, token: event.target.value })
                }
              >
                {!readTokens().some((token) => token.id === keyword.token) && (
                  <option value={keyword.token}>
                    Missing token · choose another
                  </option>
                )}
                {readTokens().map((token) => (
                  <option key={token.id} value={token.id}>
                    {token.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <>
              <label>
                Random pool
                <select
                  aria-label={`Random pool · ${label}`}
                  value={keyword.pool || "cards"}
                  onChange={(event) =>
                    onChange({
                      ...keyword,
                      pool: event.target.value as "cards" | "tokens" | "all",
                    })
                  }
                >
                  <option value="cards">Normal cards</option>
                  <option value="tokens">Tokens only</option>
                  <option value="all">Cards and tokens</option>
                </select>
              </label>
              <label>
                Random element
                <select
                  aria-label={`Random element · ${label}`}
                  value={keyword.element || ""}
                  onChange={(event) =>
                    onChange({
                      ...keyword,
                      element: (event.target.value || undefined) as
                        Element | undefined,
                    })
                  }
                >
                  <option value="">Any element</option>
                  {Object.entries(ELEMENTS).map(([id, info]) => (
                    <option key={id} value={id}>
                      {info.name}
                    </option>
                  ))}
                </select>
              </label>
              <TribeSelect
                label={`Random tribe · ${label}`}
                value={keyword.tribe || ""}
                onChange={(tribe) =>
                  onChange({ ...keyword, tribe: tribe || undefined })
                }
              />
            </>
          )}
          <small>
            Cards arrive after this play and last for this battle. Saved
            character defaults apply. Hand limit: {MAX_HAND_CARDS}. Add another
            Conjure entry for a different specified card. Token templates are in
            Collection → Tokens. They can only enter a hand through Conjure.
          </small>
          <fieldset
            className="conjure-pip-buffs"
            aria-label={`Conjure pip buffs · ${label}`}
          >
            <legend>Extra pips on each generated card</legend>
            <div className="combo-pip-grid">
              {SIDE_NAMES.map((name, side) => (
                <label key={side}>
                  {name} pips
                  <select
                    aria-label={`Conjure ${name} pips · ${label}`}
                    value={
                      keyword.pips?.find((pip) => pip.side === side)?.amount ||
                      0
                    }
                    onChange={(event) => {
                      const amount = Number(event.target.value);
                      const pips = (keyword.pips || []).filter(
                        (pip) => pip.side !== side,
                      );
                      if (amount) pips.push({ side: side as Side, amount });
                      pips.sort((a, b) => a.side - b.side);
                      onChange({
                        ...keyword,
                        pips: pips.length ? pips : undefined,
                      });
                    }}
                  >
                    <option value="0">None</option>
                    {[1, 2, 3, 4, 5].map((amount) => (
                      <option key={amount} value={amount}>
                        +{amount}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <small>
              Added once to each copy when generated. These extra pips last for
              this battle, can exceed five per side, and remain through Silence.
            </small>
          </fieldset>
          <GrantKeywordFields
            keyword={keyword}
            element={element}
            label={label}
            depth={depth}
            onChange={onChange}
          />
        </div>
      )}
      {keyword.type === "next-play" && (
        <div className="effect-editor-options">
          <label>
            Next player
            <select
              aria-label={`Next player · ${label}`}
              value={keyword.recipient}
              onChange={(e) =>
                onChange({
                  ...keyword,
                  recipient: e.target.value as "self" | "opponent",
                })
              }
            >
              <option value="self">Your next card</option>
              <option value="opponent">Opponent’s next card</option>
            </select>
          </label>
          <label>
            Pip change
            <select
              aria-label={`Pip change · ${label}`}
              value={keyword.amount}
              onChange={(e) =>
                onChange({ ...keyword, amount: Number(e.target.value) })
              }
            >
              {[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((value) => (
                <option
                  key={value}
                  value={value}
                  disabled={
                    value === 0 &&
                    !keyword.keywords?.length &&
                    !keyword.changeElement
                  }
                >
                  {value === 0 ? "None" : `${value > 0 ? "+" : ""}${value}`}
                </option>
              ))}
            </select>
          </label>
          <TribeSelect
            label={`Recipient tribe · ${label}`}
            value={keyword.tribe || ""}
            empty="Any tribe"
            onChange={(tribe) =>
              onChange({ ...keyword, tribe: tribe || undefined })
            }
          />
          <label>
            Recipient element
            <select
              aria-label={`Recipient element · ${label}`}
              value={keyword.element || ""}
              onChange={(event) =>
                onChange({
                  ...keyword,
                  element: (event.target.value || undefined) as
                    Element | undefined,
                })
              }
            >
              <option value="">Any element</option>
              {Object.entries(ELEMENTS).map(([id, info]) => (
                <option key={id} value={id}>
                  {info.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Change next card’s element
            <select
              aria-label={`Change element · ${label}`}
              value={keyword.changeElement || ""}
              onChange={(event) =>
                onChange({
                  ...keyword,
                  changeElement: (event.target.value || undefined) as
                    Element | undefined,
                  amount:
                    !event.target.value &&
                    !keyword.keywords?.length &&
                    keyword.amount === 0
                      ? 1
                      : keyword.amount,
                })
              }
            >
              <option value="">Keep its element</option>
              {Object.entries(ELEMENTS).map(([id, info]) => (
                <option key={id} value={id}>
                  {info.name}
                </option>
              ))}
            </select>
          </label>
          {!!(keyword.tribe || keyword.element || keyword.changeElement) && (
            <small>
              All chosen element and tribe requirements must match before any
              element change. Other cards do not spend it. Element changes apply
              before Combo, terrain, and captures; the last matching change
              wins.
            </small>
          )}
          <GrantKeywordFields
            keyword={keyword}
            element={element}
            label={label}
            depth={depth}
            onChange={onChange}
          />
        </div>
      )}
      {keyword.type === "shift" && (
        <div className="effect-editor-options">
          <label>
            Movement direction
            <select
              aria-label={`Shift direction · ${label}`}
              value={keyword.direction}
              onChange={(event) =>
                onChange({
                  ...keyword,
                  direction: Number(event.target.value) as Side,
                })
              }
            >
              {["Up", "Right", "Down", "Left"].map((name, i) => (
                <option key={i} value={i}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Affects
            <select
              aria-label={`Shift affects · ${label}`}
              value={keyword.affects}
              onChange={(event) =>
                onChange({
                  ...keyword,
                  affects: event.target.value as "enemies" | "allies" | "both",
                })
              }
            >
              <option value="enemies">Enemies only</option>
              <option value="allies">Allies only</option>
              <option value="both">Allies and enemies</option>
            </select>
          </label>
          <small>
            Only the neighbor on the printed side is affected, before captures.
            It moves one tile in this fixed direction, wrapping at the board
            edge. Occupied destinations and the tile you are playing on block
            movement. No target or direction choice during play.
          </small>
        </div>
      )}
      {keyword.type === "environment" && (
        <div className="effect-editor-options">
          <label>
            Tile environment
            <select
              aria-label={`Tile environment · ${label}`}
              value={keyword.environment.kind}
              onChange={(e) =>
                onChange({
                  ...keyword,
                  environment: {
                    ...defaultEnvironment(
                      e.target.value as EnvironmentKind,
                      element,
                    ),
                    ...(keyword.environment.tribe
                      ? { tribe: keyword.environment.tribe }
                      : {}),
                  },
                })
              }
            >
              {Object.entries(ENVIRONMENTS).map(([value, info]) => (
                <option key={value} value={value}>
                  {info.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            {keyword.environment.kind === "elemental"
              ? "Match by"
              : "Affected cards"}
            <select
              aria-label={`${keyword.environment.kind === "elemental" ? "Match by" : "Affected cards"} · ${label}`}
              value={keyword.environment.tribe ? "tribe" : "all"}
              onChange={(event) =>
                onChange({
                  ...keyword,
                  environment: {
                    ...keyword.environment,
                    tribe:
                      event.target.value === "tribe" ? "giants" : undefined,
                  },
                })
              }
            >
              <option value="all">
                {keyword.environment.kind === "elemental"
                  ? "Element"
                  : "Every card"}
              </option>
              <option value="tribe">Tribe</option>
            </select>
          </label>
          {!!keyword.environment.tribe && (
            <TribeSelect
              label={`Affected tribe · ${label}`}
              value={keyword.environment.tribe}
              empty={false}
              onChange={(tribe) =>
                tribe &&
                onChange({
                  ...keyword,
                  environment: { ...keyword.environment, tribe },
                })
              }
            />
          )}
          {"side" in keyword.environment && (
            <label>
              Terrain sides
              <select
                aria-label={`Terrain sides · ${label}`}
                value={keyword.environment.side}
                onChange={(e) =>
                  onChange({
                    ...keyword,
                    environment: {
                      ...keyword.environment,
                      side:
                        e.target.value === "all"
                          ? "all"
                          : (Number(e.target.value) as EffectSide),
                    } as typeof keyword.environment,
                  })
                }
              >
                <option value="all">Every side</option>
                {SIDE_NAMES.map((name, index) => (
                  <option key={name} value={index}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {"amount" in keyword.environment && (
            <label>
              Terrain pips
              <select
                aria-label={`Terrain pips · ${label}`}
                value={keyword.environment.amount}
                onChange={(e) =>
                  onChange({
                    ...keyword,
                    environment: {
                      ...keyword.environment,
                      amount: Number(e.target.value),
                    } as typeof keyword.environment,
                  })
                }
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          )}
          {keyword.environment.kind === "elemental" &&
            !keyword.environment.tribe && (
              <label>
                Boosted element
                <select
                  aria-label={`Boosted element · ${label}`}
                  value={keyword.environment.element}
                  onChange={(e) =>
                    onChange({
                      ...keyword,
                      environment: {
                        ...keyword.environment,
                        element: e.target.value as Element,
                      } as typeof keyword.environment,
                    })
                  }
                >
                  {Object.entries(ELEMENTS).map(([value, info]) => (
                    <option key={value} value={value}>
                      {info.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
        </div>
      )}
      {keyword.type === "dizzy" && (
        <fieldset className="dizzy-side-options">
          <legend>Dizzy sides</legend>
          {SIDE_NAMES.map((name, side) => (
            <label key={name}>
              <input
                type="checkbox"
                aria-label={`Dizzy ${name} · ${label}`}
                checked={dizzySides(keyword).includes(side as Side)}
                onChange={(event) =>
                  onChange({
                    ...keyword,
                    sides: event.target.checked
                      ? [...dizzySides(keyword), side as Side].sort()
                      : dizzySides(keyword).filter((value) => value !== side),
                  })
                }
              />
              {name}
            </label>
          ))}
        </fieldset>
      )}
      {"side" in keyword && (
        <div>
          <label>
            {keyword.type === "sunder"
              ? "Target edge"
              : keyword.type === "shift"
                ? "Adjacent side"
                : "Affected edge"}{" "}
            {suffix}
            <select
              aria-label={`${keyword.type === "sunder" ? "Target edge" : keyword.type === "shift" ? "Adjacent side" : "Affected edge"} ${label.replace("Keyword ", "")}`}
              value={keyword.side}
              onChange={(e) =>
                onChange({
                  ...keyword,
                  side:
                    e.target.value === "any" || e.target.value === "all"
                      ? e.target.value
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
              {keyword.type === "next-play" && (
                <option value="all">Every side</option>
              )}
            </select>
          </label>
        </div>
      )}
      {keyword.type === "resonance" && (
        <div className="resonance-element-field">
          <label>
            Count by
            <select
              aria-label={`Count by · ${label}`}
              value={keyword.tribe ? "tribe" : "element"}
              onChange={(event) =>
                onChange({
                  ...keyword,
                  tribe: event.target.value === "tribe" ? "giants" : undefined,
                })
              }
            >
              <option value="element">Element</option>
              <option value="tribe">Tribe</option>
            </select>
          </label>
          {keyword.tribe ? (
            <TribeSelect
              label={`Counted tribe ${suffix}`}
              value={keyword.tribe}
              empty={false}
              onChange={(tribe) => tribe && onChange({ ...keyword, tribe })}
            />
          ) : (
            <>
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
            </>
          )}
        </div>
      )}
      {(keyword.type === "sunder" ||
        keyword.type === "shield" ||
        keyword.type === "head-start" ||
        keyword.type === "comeback") && (
        <div className="sunder-strength-field">
          <label>
            {keyword.type === "sunder"
              ? "Pips removed"
              : keyword.type === "shield"
                ? "Shield pips"
                : "Bonus pips"}{" "}
            {suffix}
            <input
              aria-label={`${keyword.type === "sunder" ? "Pips removed" : keyword.type === "shield" ? "Shield pips" : "Bonus pips"} ${label.replace("Keyword ", "")}`}
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
function GrantKeywordFields({
  keyword,
  element,
  label,
  depth,
  onChange,
}: {
  keyword: Extract<StoneKeyword, { type: "next-play" | "conjure" }>;
  element: Element;
  label: string;
  depth: number;
  onChange: (value: StoneKeyword) => void;
}) {
  const grants = keyword.keywords || [];
  const conjure = keyword.type === "conjure";
  const kind = conjure ? "Conjure" : "Next Play";
  const update = (keywords: StoneKeyword[]) =>
    onChange({
      ...keyword,
      ...(keyword.type === "next-play"
        ? {
            amount:
              keywords.length || keyword.changeElement || keyword.amount
                ? keyword.amount
                : 1,
          }
        : {}),
      keywords: keywords.length ? keywords : undefined,
    });
  return (
    <fieldset
      className="next-keyword-grants"
      aria-label={`${kind} keywords · ${label}`}
    >
      <legend>
        {conjure
          ? "Keywords for each generated card"
          : "Keywords for the next card"}
      </legend>
      <p>
        {conjure
          ? "Every copy gains these keywords when generated. They activate only when that copy is played. Use keywords alone or combine them with extra pips. "
          : "They are added before its on-play checks and captures. Choose None to omit a pip change. "}
        Unique keywords already on the same edge are kept; extra grants stop at
        the card’s 24-keyword limit.
      </p>
      {grants.map((grant, index) => {
        const grantLabel = `${label} grant ${index + 1}`;
        const change = (value: StoneKeyword) =>
          update(grants.map((old, i) => (i === index ? value : old)));
        return (
          <div className="next-grant-entry" key={index}>
            <div
              className={`keyword-editor-row ${grant.type === "resonance" ? "has-element" : ""} ${grant.type === "sunder" || grant.type === "shield" || grant.type === "head-start" || grant.type === "comeback" ? "has-strength" : ""} ${!("side" in grant) ? "no-edge" : ""}`}
            >
              <Fields
                keyword={grant}
                label={grantLabel}
                element={element}
                depth={depth + 1}
                onChange={change}
              />
              <button
                className="icon-button"
                type="button"
                aria-label={`Remove ${grantLabel}`}
                onClick={() => update(grants.filter((_, i) => i !== index))}
              >
                <Trash2 size={15} />
              </button>
            </div>
            {grant.type === "combo" && (
              <ComboFields
                keyword={grant}
                element={element}
                depth={depth + 1}
                labelPrefix={grantLabel}
                onChange={change}
              />
            )}
          </div>
        );
      })}
      <button
        type="button"
        className="button button-outline"
        aria-label={`Add ${kind} keyword · ${label}`}
        disabled={grants.length >= 5 || depth >= MAX_KEYWORD_DEPTH}
        onClick={() => {
          for (const type of [
            "shield",
            "shift",
            "sunder",
            "dizzy",
            "resonance",
            "conjure",
            "head-start",
            "comeback",
            "silence",
            "environment",
            "next-play",
            "combo",
          ] as KeywordType[])
            for (const side of [0, 1, 2, 3] as Side[]) {
              const value = defaultKeyword(type, side, element);
              if (validateKeywords([...grants, value])) {
                update([...grants, value]);
                return;
              }
            }
        }}
      >
        <Plus size={14} />
        Add {kind} keyword <span>{grants.length}/5</span>
      </button>
      {depth >= MAX_KEYWORD_DEPTH && (
        <small>Maximum effect nesting reached.</small>
      )}
    </fieldset>
  );
}
function ComboFields({
  keyword,
  element,
  onChange,
  depth = 0,
  labelPrefix,
}: {
  keyword: ComboKeyword;
  element: Element;
  onChange: (value: ComboKeyword) => void;
  depth?: number;
  labelPrefix?: string;
}) {
  const grants = keyword.keywords || [];
  const aria = (name: string) =>
    labelPrefix ? `${labelPrefix} · ${name}` : name;
  return (
    <div className="combo-editor">
      <div className="effect-editor-options combo-trigger-options">
        <label>
          Combo trigger
          <select
            aria-label={aria("Combo trigger")}
            value={keyword.condition || "element"}
            onChange={(event) =>
              onChange({
                ...keyword,
                condition: event.target.value as ComboCondition,
                ...(event.target.value === "element"
                  ? { tribe: undefined }
                  : {}),
              })
            }
          >
            <option value="element">Same element</option>
            <option value="tribe">Shared tribe</option>
            <option value="either">Same element or tribe</option>
            <option value="both">Same element and tribe</option>
          </select>
        </label>
        {!!keyword.condition && keyword.condition !== "element" && (
          <TribeSelect
            label={aria("Combo tribe")}
            value={keyword.tribe || ""}
            empty="Any shared tribe"
            onChange={(tribe) =>
              onChange({ ...keyword, tribe: tribe || undefined })
            }
          />
        )}
      </div>
      <p>
        If your previous played card matches the chosen trigger, gain these pips
        and keywords once before captures. Your first card cannot Combo.
      </p>
      <div className="combo-pip-grid">
        {SIDE_NAMES.map((name, side) => (
          <label key={name}>
            Combo {name} pips
            <select
              aria-label={aria(`Combo ${name} pips`)}
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
            label={
              labelPrefix
                ? `${labelPrefix} Combo keyword ${index + 1}`
                : `Combo keyword ${index + 1}`
            }
            element={element}
            allowCombo={false}
            depth={depth + 1}
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
        disabled={grants.length >= 5 || depth >= MAX_KEYWORD_DEPTH}
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
      !repeatableKeyword(value.type) &&
      keywords.some(
        (old, i) => i !== index && keywordKey(old) === keywordKey(value),
      )
    ) {
      setError(`${KEYWORD_RULES[value.type].name} is already on this card.`);
      return;
    }
    if (!validateKeywords(next)) {
      setError(
        "Choose valid effect settings and at least one Dizzy side. Sunder, Next Play, Environment, and Conjure can repeat. Combo needs a pip bonus or granted keyword.",
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
              className={`keyword-editor-row ${keyword.type === "resonance" ? "has-element" : ""} ${keyword.type === "sunder" || keyword.type === "shield" || keyword.type === "head-start" || keyword.type === "comeback" ? "has-strength" : ""} ${!("side" in keyword) ? "no-edge" : ""}`}
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
            <strong>Head Start</strong> gives its stated pips while winning
            before placement. <strong>Comeback</strong> does so while losing.
            Set Bonus pips from 1–99; older cards default to 1.
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
            <strong>Dizzy</strong> rolls each selected edge from 0 to{" "}
            {DIZZY_EDGE_CAP} before captures. A ? marks each affected edge.
          </p>
          <p>
            <strong>Next Play</strong> queues + or − pips on one side or every
            side of your next card or the opponent’s next card, and/or grants
            configured keywords. Choose None for a keywords-only effect.{" "}
            <strong>Environment</strong> places one of seven lasting tile
            effects anywhere on the board.
          </p>
          <p>
            <strong>Shift</strong> moves only the neighbor on its printed side
            in a fixed direction, for enemies, allies, or both. Movement wraps
            at board edges; occupied destinations block it.
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
