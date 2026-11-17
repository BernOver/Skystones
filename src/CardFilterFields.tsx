import { ELEMENTS, KEYWORD_RULES } from "./game";
import type { Element, KeywordType, Side } from "./game";
import { CARD_TYPES } from "./cardFilters";
import type { CardFilter, CardType, PipTest } from "./cardFilters";
import { TribeSelect } from "./TribeEditor";
export function CardFilterFields({
  value = {},
  onChange,
  label = "Matching cards",
}: {
  value?: CardFilter;
  onChange: (value: CardFilter) => void;
  label?: string;
}) {
  return (
    <fieldset className="effect-editor-options">
      <legend>{label}</legend>
      <label>
        Card type
        <select
          aria-label={`${label} card type`}
          value={value.type || ""}
          onChange={(e) =>
            onChange({
              ...value,
              type: (e.target.value || undefined) as CardType | undefined,
            })
          }
        >
          <option value="">Any type</option>
          {Object.entries(CARD_TYPES).map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Element
        <select
          aria-label={`${label} element`}
          value={value.element || ""}
          onChange={(e) =>
            onChange({
              ...value,
              element: (e.target.value || undefined) as Element | undefined,
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
        label={`${label} tribe`}
        value={value.tribe || ""}
        onChange={(tribe) => onChange({ ...value, tribe: tribe || undefined })}
      />
      <label>
        Has keyword
        <select
          aria-label={`${label} keyword`}
          value={value.keyword || ""}
          onChange={(e) =>
            onChange({
              ...value,
              keyword: (e.target.value || undefined) as KeywordType | undefined,
            })
          }
        >
          <option value="">Any keyword</option>
          {Object.entries(KEYWORD_RULES).map(([id, info]) => (
            <option key={id} value={id}>
              {info.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <input
          type="checkbox"
          aria-label={`${label} pip condition`}
          checked={!!value.pips}
          onChange={(e) =>
            onChange({
              ...value,
              pips: e.target.checked
                ? { side: "any", compare: "eq", value: 0 }
                : undefined,
            })
          }
        />
        Require a pip condition
      </label>
      {value.pips && (
        <>
          <label>
            Check sides
            <select
              aria-label={`${label} pip sides`}
              value={value.pips.side}
              onChange={(e) =>
                onChange({
                  ...value,
                  pips: {
                    ...value.pips!,
                    side: (/^[0-3]$/.test(e.target.value)
                      ? Number(e.target.value)
                      : e.target.value) as Side | "any" | "all" | "total",
                  },
                })
              }
            >
              {[
                ["any", "At least one side"],
                ["all", "Every side"],
                ["total", "Total pips"],
                [0, "North"],
                [1, "East"],
                [2, "South"],
                [3, "West"],
              ].map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <PipTestFields
            value={value.pips}
            onChange={(test) =>
              onChange({ ...value, pips: { ...value.pips!, ...test } })
            }
            label={label}
          />
        </>
      )}
      <small>
        All chosen requirements must match. Pip checks use ordinary pips before
        this Trap’s modifiers.
      </small>
    </fieldset>
  );
}
export function PipTestFields({
  value,
  onChange,
  label,
}: {
  value: PipTest;
  onChange: (value: PipTest) => void;
  label: string;
}) {
  return (
    <>
      <label>
        Comparison
        <select
          aria-label={`${label} comparison`}
          value={value.compare}
          onChange={(e) =>
            onChange({
              ...value,
              compare: e.target.value as PipTest["compare"],
            })
          }
        >
          <option value="eq">Equal to</option>
          <option value="lte">At most</option>
          <option value="gte">At least</option>
        </select>
      </label>
      <label>
        Pips
        <input
          type="number"
          aria-label={`${label} pips`}
          min={0}
          max={396}
          value={value.value}
          onChange={(e) =>
            onChange({
              ...value,
              value: Math.max(0, Math.min(396, Number(e.target.value))),
            })
          }
        />
      </label>
    </>
  );
}
