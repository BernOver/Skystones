import { useMemo, useState } from "react";
import { Plus, Save, Play, ArrowLeft, Trash2 } from "lucide-react";
import { CharacterAvatar } from "./CharacterAvatar";
import { StoneCard } from "./Artwork";
import { PORTRAIT_OPTIONS } from "./portraits";
import { CONJURE_CARDS } from "./conjure";
import { readTokens } from "./tokens";
import { characterDefault, readCharacterDefaults } from "./cardDefaults";
import { createId } from "./id";
import {
  encounterLibrary,
  saveEncounterLibrary,
  validEncounter,
  BUILTIN_ENCOUNTERS,
  ENCOUNTER_POOLS,
  ENCOUNTER_MECHANICS,
} from "./encounters";
import type {
  EncounterDefinition,
  EncounterLibrary,
  EncounterPool,
  EnemyCharacter,
} from "./encounters";
import type { Stone, BoardSize } from "./game";
import "./encounters.css";

export function EncounterEditor({
  customCards,
  onClose,
  onTest,
}: {
  customCards: Stone[];
  onClose: () => void;
  onTest: (
    encounter: EncounterDefinition,
    size: BoardSize,
    act: 1 | 2,
    pool: EncounterPool,
  ) => void;
}) {
  const [library, setLibrary] = useState(encounterLibrary);
  const [draft, setDraft] = useState<EncounterDefinition>(() =>
    structuredClone(library.encounters[0]),
  );
  const [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [query, setQuery] = useState(""),
    [cardPage, setCardPage] = useState(0);
  const [testSize, setTestSize] = useState<BoardSize>(3),
    [testAct, setTestAct] = useState<1 | 2>(1),
    [testPool, setTestPool] = useState<EncounterPool>("easy");
  const cards = useMemo(() => {
    const defaults = readCharacterDefaults();
    return [
      ...new Map(
        [
          ...CONJURE_CARDS.map((card) => characterDefault(card, defaults)),
          ...customCards.filter((card) => !card.token),
          ...readTokens(),
        ].map((card) => [card.id, card]),
      ).values(),
    ];
  }, [customCards]);
  const found = cards.filter((card) =>
    `${card.name} ${card.token ? "token" : ""}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const activePool = draft.pools.includes(testPool)
    ? testPool
    : draft.pools[0] || "easy";
  const update = (values: Partial<EncounterDefinition>) => {
    setDraft({ ...draft, ...values });
    setMessage("");
  };
  const updateCharacter = (values: Partial<EnemyCharacter>) =>
    update({ character: { ...draft.character, ...values } });
  const persist = (next: EncounterLibrary, notice: string) => {
    try {
      saveEncounterLibrary(next);
      setLibrary(next);
      setError("");
      setMessage(notice);
      return true;
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Could not save the encounter library.",
      );
      return false;
    }
  };
  function save() {
    if (!validEncounter(draft)) {
      setError(
        "Add a name, story, at least one pool and act, and a valid enemy character.",
      );
      return;
    }
    const saved = structuredClone(draft);
    const characters = library.characters
      .filter((character) => character.id !== saved.character.id)
      .concat(saved.character);
    const encounters = library.encounters
      .filter((encounter) => encounter.id !== saved.id)
      .map((encounter) =>
        encounter.character.id === saved.character.id
          ? { ...encounter, character: saved.character }
          : encounter,
      )
      .concat(saved);
    persist(
      { ...library, characters, encounters },
      "Encounter saved. Pool changes apply to future fights; a fight already in progress keeps its setup.",
    );
  }
  function create() {
    setDraft({
      id: `custom-${createId()}`,
      name: "New encounter",
      description: "A new challenger awaits at the stone table.",
      character: structuredClone(library.characters[0]),
      pools: ["easy"],
      acts: [1, 2],
      enabled: true,
      mechanic: "standard",
      deck: [],
    });
    setError("");
    setMessage("New encounter · save it to include it in Adventure pools.");
  }
  async function upload(file?: File) {
    if (!file) return;
    if (
      !/^image\/(png|jpeg|webp)$/.test(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      setError("Choose a PNG, JPG or WebP image up to 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => updateCharacter({ image: String(reader.result) });
    reader.onerror = () => setError("That image could not be read.");
    reader.readAsDataURL(file);
  }
  return (
    <section className="encounter-editor">
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR CORNER OF SKYLANDS</div>
          <h1>
            Adventure workshop<span className="orange-period">.</span>
          </h1>
          <p>
            Create enemy characters and encounters, change the original fights,
            and try a practice duel.
          </p>
        </div>
        <button className="button button-outline" onClick={onClose}>
          <ArrowLeft size={16} />
          Back to Adventure
        </button>
      </div>
      <div className="encounter-editor-layout">
        <aside className="run-panel encounter-list">
          <button className="button button-dark" onClick={create}>
            <Plus size={16} />
            New encounter
          </button>
          <label>
            Edit encounter
            <select
              aria-label="Edit encounter"
              value={
                library.encounters.some(
                  (encounter) => encounter.id === draft.id,
                )
                  ? draft.id
                  : ""
              }
              onChange={(event) => {
                const next = library.encounters.find(
                  (encounter) => encounter.id === event.target.value,
                );
                if (next) {
                  setDraft(structuredClone(next));
                  setError("");
                  setMessage("");
                }
              }}
            >
              {!library.encounters.some(
                (encounter) => encounter.id === draft.id,
              ) && <option value="">Unsaved encounter</option>}
              {library.encounters.map((encounter) => (
                <option key={encounter.id} value={encounter.id}>
                  {encounter.enabled ? "" : "Disabled · "}
                  {encounter.name}
                </option>
              ))}
            </select>
          </label>
          <p>
            Easy and Hard fights appear at matching map stops. Event fights
            offer Fight or Leave at event stops. Bosses appear at the end of
            their chosen act. Select multiple pools and acts to reuse a fight.
          </p>
          <p>
            Save your edits before switching encounters. Tests can use unsaved
            edits and never replace your Adventure save.
          </p>
        </aside>
        <div className="encounter-edit-body">
          <section className="run-panel">
            <h2>Encounter</h2>
            <label>
              Encounter name
              <input
                aria-label="Encounter name"
                maxLength={80}
                value={draft.name}
                onChange={(event) => update({ name: event.target.value })}
              />
            </label>
            <label>
              Encounter story
              <textarea
                aria-label="Encounter story"
                maxLength={600}
                rows={3}
                value={draft.description}
                onChange={(event) =>
                  update({ description: event.target.value })
                }
              />
            </label>
            <label className="encounter-check">
              <input
                type="checkbox"
                checked={draft.enabled}
                onChange={(event) => update({ enabled: event.target.checked })}
              />
              Enabled in Adventure
            </label>
            <div className="encounter-options-grid">
              <fieldset>
                <legend>Encounter pools</legend>
                {Object.entries(ENCOUNTER_POOLS).map(([id, name]) => (
                  <label className="encounter-check" key={id}>
                    <input
                      type="checkbox"
                      aria-label={`Pool ${name}`}
                      checked={draft.pools.includes(id as EncounterPool)}
                      onChange={(event) =>
                        update({
                          pools: event.target.checked
                            ? [...draft.pools, id as EncounterPool]
                            : draft.pools.filter((pool) => pool !== id),
                        })
                      }
                    />
                    {name}
                  </label>
                ))}
              </fieldset>
              <fieldset>
                <legend>Acts</legend>
                {([1, 2] as const).map((act) => (
                  <label className="encounter-check" key={act}>
                    <input
                      type="checkbox"
                      aria-label={`Encounter Act ${act}`}
                      checked={draft.acts.includes(act)}
                      onChange={(event) =>
                        update({
                          acts: event.target.checked
                            ? [...draft.acts, act]
                            : draft.acts.filter((value) => value !== act),
                        })
                      }
                    />
                    Act {act}
                  </label>
                ))}
              </fieldset>
            </div>
            <label>
              Starting condition
              <select
                aria-label="Encounter starting condition"
                value={draft.mechanic}
                onChange={(event) =>
                  update({
                    mechanic: event.target
                      .value as EncounterDefinition["mechanic"],
                  })
                }
              >
                {Object.entries(ENCOUNTER_MECHANICS).map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          </section>
          <section className="run-panel">
            <div className="section-heading">
              <h2>Enemy character</h2>
              <button
                className="text-button"
                onClick={() =>
                  update({
                    character: {
                      id: `enemy-${createId()}`,
                      name: "New enemy",
                      portrait: "chompy-mage",
                      color: "#678a3e",
                    },
                  })
                }
              >
                <Plus size={15} />
                New enemy character
              </button>
            </div>
            <div className="encounter-character-preview">
              <CharacterAvatar {...draft.character} />
              <strong>{draft.character.name}</strong>
            </div>
            <label>
              Enemy character
              <select
                aria-label="Enemy character"
                value={draft.character.id}
                onChange={(event) => {
                  const character = library.characters.find(
                    (character) => character.id === event.target.value,
                  );
                  if (character)
                    update({ character: structuredClone(character) });
                }}
              >
                {!library.characters.some(
                  (character) => character.id === draft.character.id,
                ) && (
                  <option value={draft.character.id}>
                    {draft.character.name} · new
                  </option>
                )}
                {library.characters.map((character) => (
                  <option key={character.id} value={character.id}>
                    {character.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="encounter-options-grid">
              <label>
                Enemy name
                <input
                  aria-label="Enemy name"
                  maxLength={50}
                  value={draft.character.name}
                  onChange={(event) =>
                    updateCharacter({ name: event.target.value })
                  }
                />
              </label>
              <label>
                Enemy portrait
                <select
                  aria-label="Enemy portrait"
                  value={draft.character.portrait}
                  onChange={(event) =>
                    updateCharacter({
                      portrait: event.target.value,
                      image: undefined,
                    })
                  }
                >
                  {PORTRAIT_OPTIONS.map((portrait) => (
                    <option key={portrait.id} value={portrait.id}>
                      {portrait.name} · {portrait.game}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Portrait color
                <input
                  type="color"
                  aria-label="Enemy portrait color"
                  value={draft.character.color}
                  onChange={(event) =>
                    updateCharacter({ color: event.target.value })
                  }
                />
              </label>
              <label>
                Upload enemy portrait
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  aria-label="Upload enemy portrait"
                  onChange={(event) => void upload(event.target.files?.[0])}
                />
              </label>
            </div>
            <p>
              Saving updates this character in other saved encounters that use
              it. Choose New enemy character to create a separate rival.
            </p>
          </section>
          <section className="run-panel">
            <h2>Enemy starting hand</h2>
            <label className="encounter-check">
              <input
                type="checkbox"
                aria-label="Use generated enemy hand"
                checked={draft.deck === undefined}
                onChange={(event) =>
                  update({ deck: event.target.checked ? undefined : [] })
                }
              />
              Use the usual generated hand for the board size and difficulty
            </label>
            {draft.deck !== undefined && (
              <>
                <p>
                  Choose any 0–20 cards. Repeated cards and tokens are allowed,
                  including tokens without Conjure. Each copy keeps these exact
                  stats. Empty hands pass; the duel ends when the board is full
                  or both hands are empty.
                </p>
                <p role="status" className="encounter-hand-count">
                  {draft.deck.length} starting cards ·{" "}
                  {draft.deck.filter((card) => card.token).length} tokens
                </p>
                <div
                  className="encounter-hand"
                  aria-label="Enemy starting cards"
                >
                  {draft.deck.map((card, index) => (
                    <div className="encounter-hand-entry" key={index}>
                      <StoneCard stone={card} />
                      <button
                        className="text-button"
                        aria-label={`Remove enemy card ${index + 1} ${card.name}`}
                        onClick={() =>
                          update({
                            deck: draft.deck!.filter((_, i) => i !== index),
                          })
                        }
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <label>
                  Find enemy cards
                  <input
                    type="search"
                    aria-label="Find enemy cards"
                    placeholder="Character name or token"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setCardPage(0);
                    }}
                  />
                </label>
                <div className="encounter-card-catalog">
                  {found
                    .slice(cardPage * 12, (cardPage + 1) * 12)
                    .map((card) => (
                      <button
                        type="button"
                        key={card.id}
                        className="encounter-add-card"
                        disabled={draft.deck!.length >= 20}
                        aria-label={`Add ${card.name} to enemy hand`}
                        onClick={() =>
                          update({
                            deck: [...draft.deck!, structuredClone(card)],
                          })
                        }
                      >
                        <StoneCard stone={card} />
                        <span>+ Add {card.token ? "token" : "card"}</span>
                      </button>
                    ))}
                </div>
                <div className="encounter-pagination">
                  <button
                    className="text-button"
                    disabled={!cardPage}
                    onClick={() => setCardPage(cardPage - 1)}
                  >
                    Previous cards
                  </button>
                  <span>
                    {found.length} cards · page {cardPage + 1} /{" "}
                    {Math.max(1, Math.ceil(found.length / 12))}
                  </span>
                  <button
                    className="text-button"
                    disabled={(cardPage + 1) * 12 >= found.length}
                    onClick={() => setCardPage(cardPage + 1)}
                  >
                    Next cards
                  </button>
                </div>
              </>
            )}
          </section>
          <section className="run-panel encounter-test-panel">
            <h2>Try the encounter</h2>
            <p>
              Practice with a fresh Adventure deck. Tests use the current edits,
              without spending gold, lives, rewards, or progress from your saved
              run.
            </p>
            <div className="encounter-options-grid">
              <label>
                Test board size
                <select
                  aria-label="Test board size"
                  value={testSize}
                  onChange={(event) =>
                    setTestSize(Number(event.target.value) as BoardSize)
                  }
                >
                  <option value="3">3×3</option>
                  <option value="4">4×4</option>
                </select>
              </label>
              <label>
                Test act
                <select
                  aria-label="Test act"
                  value={testAct}
                  onChange={(event) =>
                    setTestAct(Number(event.target.value) as 1 | 2)
                  }
                >
                  <option value="1">Act 1</option>
                  <option value="2">Act 2</option>
                </select>
              </label>
              <label>
                Test as
                <select
                  aria-label="Test pool"
                  value={activePool}
                  onChange={(event) =>
                    setTestPool(event.target.value as EncounterPool)
                  }
                >
                  {draft.pools.map((pool) => (
                    <option key={pool} value={pool}>
                      {ENCOUNTER_POOLS[pool]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="encounter-editor-actions">
              <button
                className="button button-dark"
                disabled={!validEncounter(draft)}
                onClick={() => {
                  setError("");
                  onTest(structuredClone(draft), testSize, testAct, activePool);
                }}
              >
                <Play size={16} />
                Test encounter
              </button>
              <button className="button button-outline" onClick={save}>
                <Save size={16} />
                Save encounter
              </button>
              {BUILTIN_ENCOUNTERS.some(
                (encounter) => encounter.id === draft.id,
              ) ? (
                <button
                  className="text-button"
                  onClick={() => {
                    setDraft(
                      structuredClone(
                        BUILTIN_ENCOUNTERS.find(
                          (encounter) => encounter.id === draft.id,
                        )!,
                      ),
                    );
                    setMessage(
                      "Original setup restored in the editor. Save to apply it.",
                    );
                  }}
                >
                  Restore original encounter
                </button>
              ) : (
                library.encounters.some(
                  (encounter) => encounter.id === draft.id,
                ) && (
                  <button
                    className="text-button"
                    onClick={() => {
                      const next = {
                        ...library,
                        encounters: library.encounters.filter(
                          (encounter) => encounter.id !== draft.id,
                        ),
                      };
                      if (
                        persist(
                          next,
                          "Encounter deleted. Existing fights keep their setup.",
                        )
                      )
                        setDraft(structuredClone(next.encounters[0]));
                    }}
                  >
                    Delete encounter
                  </button>
                )
              )}
            </div>
            {error && (
              <p role="alert" className="adventure-error">
                {error}
              </p>
            )}
            {message && (
              <p role="status" className="encounter-save-message">
                {message}
              </p>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
