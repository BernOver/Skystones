import { useState } from "react";
import { StoneCard } from "./Artwork";
import { ELEMENTS } from "./game";
import type { Element, Stone } from "./game";
import { combineParts } from "./assemble";
import { SUPERCHARGER_VEHICLES } from "./superchargers";
import { readRecipes, saveRecipes, mergeRecipes } from "./recipes";
import type { SuperchargerRecipe } from "./recipes";
export function PartsWorkshop({
  parts,
  onCreate,
  onEdit,
}: {
  parts: Stone[];
  onCreate: () => void;
  onEdit: (card: Stone) => void;
}) {
  const [recipes, setRecipes] = useState(readRecipes),
    [draft, setDraft] = useState<SuperchargerRecipe | null>(null),
    [error, setError] = useState("");
  const first = parts.find((p) => p.id === draft?.parts[0]),
    second = parts.find((p) => p.id === draft?.parts[1]);
  const preview =
    draft && first && second ? combineParts([first, second], [draft])[0] : null;
  function commit(next: SuperchargerRecipe[]) {
    try {
      saveRecipes(next);
      setRecipes(next);
      setError("");
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  }
  return (
    <section className="parts-workshop">
      <h2>Parts & Supercharger recipes</h2>
      <p>
        Create a Part or edit any Part below to change its pips, portrait,
        element, and keywords. Parts are tokens: generate them through Assemble
        or an explicit Conjure source. Pairs combine immediately in hand.
      </p>
      <div className="heading-actions">
        <button className="button button-outline" onClick={onCreate}>
          New Part template
        </button>
        <button
          className="button button-dark"
          disabled={!parts.length}
          onClick={() => {
            const vehicle =
              SUPERCHARGER_VEHICLES.find(
                (v) => v.id === "vehicle-hot-streak",
              ) || SUPERCHARGER_VEHICLES[0];
            setDraft({
              id: `recipe-${crypto.randomUUID()}`,
              parts: [parts[0].id, parts[Math.min(1, parts.length - 1)].id],
              name: vehicle.name,
              element: vehicle.element,
              portrait: vehicle.id,
            });
            setError("");
          }}
        >
          Create a recipe
        </button>
      </div>
      <p className="field-note">
        Recipes match the same two Part templates in either order, including two
        copies of the same Part. The vehicle always keeps both Parts’ pips and
        keywords plus Flash. Without a recipe it uses a vehicle portrait
        matching the first Part’s element. Recipe changes apply to new battles.
      </p>
      {draft && (
        <form
          className="recipe-editor studio-section"
          onSubmit={(e) => {
            e.preventDefault();
            if (!first || !second) {
              setError("Choose two available Parts.");
              return;
            }
            try {
              if (commit(mergeRecipes(recipes, [draft]))) setDraft(null);
            } catch (err) {
              setError((err as Error).message);
            }
          }}
        >
          <div className="recipe-fields">
            <h3>Build a fixed Supercharger</h3>
            {([0, 1] as const).map((i) => (
              <label key={i}>
                Part {i + 1}
                <select
                  aria-label={`Recipe Part ${i + 1}`}
                  value={draft.parts[i]}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      parts: draft.parts.map((p, n) =>
                        n === i ? e.target.value : p,
                      ) as [string, string],
                    })
                  }
                >
                  {!parts.some((p) => p.id === draft.parts[i]) && (
                    <option value={draft.parts[i]}>
                      Missing Part · choose another
                    </option>
                  )}
                  {parts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            ))}
            <label>
              Supercharger portrait
              <select
                aria-label="Recipe vehicle portrait"
                value={draft.portrait}
                onChange={(e) => {
                  const vehicle = SUPERCHARGER_VEHICLES.find(
                    (v) => v.id === e.target.value,
                  )!;
                  setDraft({
                    ...draft,
                    portrait: vehicle.id,
                    name: vehicle.name,
                    element: vehicle.element,
                  });
                }}
              >
                {SUPERCHARGER_VEHICLES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Supercharger name
              <input
                aria-label="Recipe Supercharger name"
                maxLength={40}
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </label>
            <label>
              Supercharger element
              <select
                aria-label="Recipe Supercharger element"
                value={draft.element}
                onChange={(e) =>
                  setDraft({ ...draft, element: e.target.value as Element })
                }
              >
                {Object.entries(ELEMENTS).map(([id, info]) => (
                  <option key={id} value={id}>
                    {info.name}
                  </option>
                ))}
              </select>
            </label>
            <p>
              Each pair has one recipe. Saving this pair replaces its previous
              recipe.
            </p>
            <button className="button button-dark">Save recipe</button>
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setDraft(null);
                setError("");
              }}
            >
              Cancel recipe
            </button>
          </div>
          {preview && (
            <div className="recipe-preview">
              <StoneCard stone={preview} />
              <p>Preview · sum of both Parts, with both sets of effects</p>
            </div>
          )}
        </form>
      )}
      {error && <p role="alert">{error}</p>}
      <div className="recipe-list" aria-label="Saved Supercharger recipes">
        {recipes.length ? (
          recipes.map((recipe) => (
            <article key={recipe.id}>
              <strong>
                {recipe.parts
                  .map(
                    (key) =>
                      parts.find((p) => p.id === key)?.name || "Missing Part",
                  )
                  .join(" + ")}{" "}
                → {recipe.name}
              </strong>
              <div>
                <button
                  className="text-button"
                  onClick={() => {
                    setDraft(structuredClone(recipe));
                    setError("");
                  }}
                >
                  Edit {recipe.name} recipe
                </button>
                <button
                  className="text-button"
                  onClick={() => {
                    if (commit(recipes.filter((r) => r.id !== recipe.id)))
                      setDraft((old) => (old?.id === recipe.id ? null : old));
                  }}
                >
                  Delete {recipe.name} recipe
                </button>
              </div>
            </article>
          ))
        ) : (
          <p>
            No fixed recipes yet. Create one to guarantee the same Supercharger
            from a chosen pair.
          </p>
        )}
      </div>
      <div className="part-shortcuts" aria-label="Edit Parts">
        {parts.map((part) => (
          <button
            className="button button-outline"
            key={part.id}
            onClick={() => onEdit(part)}
          >
            Edit Part: {part.name}
          </button>
        ))}
      </div>
    </section>
  );
}
