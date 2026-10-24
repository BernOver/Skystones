import { useState } from "react";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { StoneCard } from "./Artwork";
import { ELEMENTS, SIDE_NAMES } from "./game";
import type { Element, Side } from "./game";
import type { Adventure } from "./adventure";
import {
  POTIONS,
  POTION_IDS,
  adventurePotionTargets,
  potionDescription,
  potionSideOptions,
} from "./potions";
import type { PotionChoice } from "./potions";
import { shopPrice } from "./relics";
export function PotionPicker({
  run,
  index,
  onUse,
  onCancel,
}: {
  run: Adventure;
  index: number;
  onUse: (target: string | number, choice?: PotionChoice) => void;
  onCancel: () => void;
}) {
  const [chosen, setChosen] = useState<string | number | null>(null);
  const type = run.potions[index],
    definition = POTIONS[type],
    targets = adventurePotionTargets(run, type);
  const selected = targets.find((option) => option.target === chosen);
  const sides = selected ? potionSideOptions(run, type, selected.target) : [];
  return (
    <>
      <h2>{definition.name}</h2>
      <p>{potionDescription(run, type)}</p>
      {!selected ? (
        <div className="potion-targets">
          {targets.map((option) => (
            <button
              className="button button-outline"
              key={option.target}
              onClick={() =>
                definition.choice
                  ? setChosen(option.target)
                  : onUse(option.target)
              }
            >
              {option.label}
            </button>
          ))}
          {!targets.length && <p>No valid targets are available.</p>}
        </div>
      ) : (
        <div className="potion-detail-target">
          <div className="potion-selected-card">
            <StoneCard stone={selected.stone} edges={selected.edges} />
          </div>
          <h3>{selected.label}</h3>
          {definition.choice === "side" && (
            <div
              className="potion-edge-choices"
              role="group"
              aria-label="Choose potion edge"
            >
              {SIDE_NAMES.map((name, side) => (
                <button
                  className="button button-outline"
                  disabled={!sides.includes(side as Side)}
                  key={name}
                  aria-label={`Choose ${name} edge`}
                  onClick={() => onUse(selected.target, { side: side as Side })}
                >
                  {name} · {selected.edges[side]} pips
                </button>
              ))}
            </div>
          )}
          {definition.choice === "element" && (
            <div
              className="potion-element-choices"
              role="group"
              aria-label="Choose potion element"
            >
              {(Object.keys(ELEMENTS) as Element[]).map((element) => (
                <button
                  className="button button-outline"
                  key={element}
                  disabled={element === selected.stone.element}
                  onClick={() => onUse(selected.target, { element })}
                >
                  {ELEMENTS[element].name}
                </button>
              ))}
            </div>
          )}
          {definition.choice === "second-card" && (
            <div
              className="potion-targets"
              role="group"
              aria-label="Choose second friendly card"
            >
              {targets
                .filter((option) => option.target !== selected.target)
                .map((option) => (
                  <button
                    className="button button-outline"
                    key={option.target}
                    onClick={() =>
                      onUse(selected.target, {
                        second: option.target as number,
                      })
                    }
                  >
                    With {option.label.replace(/^Swap /, "")}
                  </button>
                ))}
            </div>
          )}
          <button className="text-button" onClick={() => setChosen(null)}>
            <ArrowLeft size={13} />
            Choose another target
          </button>
        </div>
      )}
      <button className="text-button" onClick={onCancel}>
        Cancel potion
      </button>
      <p className="field-note">
        Choosing a target does not spend the potion. Cancel at any point before
        applying its effect.
      </p>
    </>
  );
}
export function PotionGuide({ run }: { run: Adventure }) {
  return (
    <>
      <div className="eyebrow">{POTION_IDS.length} BOTTLED POSSIBILITIES</div>
      <h2>Potions for the road.</h2>
      <p>
        Combat potions do not use your turn. Numeric effects shown here include
        Alchemist’s Mortar when owned. Rotation, element changes, Silence,
        Resonance, and swaps keep their normal effect.
      </p>
      <div className="potion-guide-grid">
        {POTION_IDS.map((type) => (
          <article className="potion-guide-card" key={type}>
            <FlaskConical size={25} />
            <h3>{POTIONS[type].name}</h3>
            <p>{potionDescription(run, type)}</p>
            <small>
              {POTIONS[type].combat
                ? "Combat only"
                : "Combat or between battles"}{" "}
              · {shopPrice(run, POTIONS[type].price)} shop gold
            </small>
          </article>
        ))}
      </div>
    </>
  );
}
