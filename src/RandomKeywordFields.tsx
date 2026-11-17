import { KEYWORD_RULES } from "./game";
import type { KeywordType } from "./game";
import { randomKeywordTypes } from "./randomKeywords";
import type { RandomKeywordSpec } from "./randomKeywords";
export function RandomKeywordFields({
  value,
  onChange,
  label,
}: {
  value?: RandomKeywordSpec;
  onChange: (value?: RandomKeywordSpec) => void;
  label: string;
}) {
  return (
    <fieldset className="next-keyword-grants">
      <legend>{label} · Random keywords</legend>
      <label>
        <input
          type="checkbox"
          aria-label={`${label} generate random keywords`}
          checked={!!value}
          onChange={(e) =>
            onChange(e.target.checked ? { count: 1 } : undefined)
          }
        />
        Generate random keywords
      </label>
      {value && (
        <>
          <label>
            Keywords per recipient
            <select
              aria-label={`${label} random keyword count`}
              value={value.count}
              onChange={(e) =>
                onChange({ ...value, count: Number(e.target.value) })
              }
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label>
            Random effect strength
            <select
              aria-label={`${label} random keyword strength`}
              value={value.strength || 1}
              onChange={(e) =>
                onChange({ ...value, strength: Number(e.target.value) })
              }
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              aria-label={`${label} custom random keyword pool`}
              checked={!!value.pool}
              onChange={(e) =>
                onChange({
                  ...value,
                  pool: e.target.checked ? ["shield", "comeback"] : undefined,
                })
              }
            />
            Choose allowed keyword types
          </label>
          {value.pool && (
            <div className="dizzy-side-options">
              {randomKeywordTypes().map((type) => (
                <label key={type}>
                  <input
                    type="checkbox"
                    aria-label={`${label} random ${KEYWORD_RULES[type].name}`}
                    checked={value.pool!.includes(type)}
                    disabled={
                      value.pool!.length === 1 && value.pool!.includes(type)
                    }
                    onChange={(e) =>
                      onChange({
                        ...value,
                        pool: e.target.checked
                          ? [...value.pool!, type as KeywordType]
                          : value.pool!.filter((old) => old !== type),
                      })
                    }
                  />
                  {KEYWORD_RULES[type].name}
                </label>
              ))}
            </div>
          )}
          <small>
            Flash is never in a random pool. Each recipient rolls independently,
            duplicate unique assignments are avoided, and the card’s keyword
            limit still applies. Rolls are fixed when granted and survive saves.
          </small>
        </>
      )}
    </fieldset>
  );
}
