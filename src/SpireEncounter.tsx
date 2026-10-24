import { useState } from "react";
import { BookOpen, ArrowLeft } from "lucide-react";
import { StoneCard } from "./Artwork";
import {
  SPIRE_CATALOG,
  getSpireEvent,
  spireCandidates,
  spireChoiceReason,
} from "./spireEvents";
import { adventureSpireMemoryCards } from "./adventure";
import type { Adventure } from "./adventure";
import type { Stone } from "./game";
export function SpireEncounter({
  run,
  onResolve,
  onInspect,
}: {
  run: Adventure;
  onResolve: (action: string, first?: string, second?: string) => void;
  onInspect: (stone: Stone) => void;
}) {
  const [chosen, setChosen] = useState<number | null>(null),
    [firstId, setFirstId] = useState(""),
    [secondId, setSecondId] = useState("");
  const state = run.spireEvent!,
    event = getSpireEvent(state.id)!;
  const choice = chosen === null ? undefined : event.choices[chosen],
    candidates = choice ? spireCandidates(run, choice) : [];
  const first = candidates.some((item) => item.id === firstId)
    ? firstId
    : candidates[0]?.id;
  const second = candidates.some(
    (item) => item.id === secondId && item.id !== first,
  )
    ? secondId
    : candidates.find((item) => item.id !== first)?.id;
  const selected = [first, choice?.select === "two-cards" ? second : undefined]
    .filter((id): id is string => !!id)
    .flatMap((id) => run.inventory.find((card) => card.id === id) || []);
  if (state.stage === 10) {
    const cards = adventureSpireMemoryCards(run),
      matched = state.matched || [],
      revealed = state.revealed || [],
      attempts = state.attempts || 0;
    return (
      <div className="spire-memory">
        <p role="status">
          {5 - attempts} attempts remaining · {matched.length / 2} pairs matched
        </p>
        <div className="spire-memory-grid">
          {cards.map((card, index) => (
            <button
              key={index}
              className={`memory-tile ${matched.includes(index) ? "matched" : ""}`}
              disabled={
                matched.includes(index) ||
                attempts >= 5 ||
                (revealed.length === 1 && revealed.includes(index))
              }
              aria-label={`${matched.includes(index) ? "Matched" : revealed.includes(index) ? "Revealed" : "Reveal"} stone ${index + 1}`}
              onClick={() => onResolve(`match:${index}`)}
            >
              {matched.includes(index) || revealed.includes(index) ? (
                <StoneCard stone={card} />
              ) : (
                <span>?</span>
              )}
            </button>
          ))}
        </div>
        <button
          className="button button-dark"
          onClick={() => onResolve("leave")}
        >
          Keep matches and continue
        </button>
      </div>
    );
  }
  return (
    <div className="spire-encounter">
      <div className="eyebrow">
        <BookOpen size={15} /> ADAPTED SPIRE ENCOUNTER ·{" "}
        {event.act ? `ACT ${event.act}` : "SHARED"}
      </div>
      {chosen === null ? (
        <div className="spire-choice-list">
          {event.choices.map((option, index) =>
            (option.at || 0) === state.stage ? (
              <div key={index}>
                <button
                  className="button button-outline"
                  disabled={!!spireChoiceReason(run, option)}
                  onClick={() =>
                    option.select
                      ? setChosen(index)
                      : onResolve(`choice:${index}`)
                  }
                >
                  {option.label}
                </button>
                {spireChoiceReason(run, option) && (
                  <small>{spireChoiceReason(run, option)}</small>
                )}
              </div>
            ) : null,
          )}
        </div>
      ) : (
        <section className="spire-selection">
          <h3>{choice!.label}</h3>
          <label>
            Choose a card, curse, or item
            <select
              aria-label="Spire event first selection"
              value={first || ""}
              onChange={(e) => setFirstId(e.target.value)}
            >
              {candidates.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          {choice!.select === "two-cards" && (
            <label>
              Choose a different second card
              <select
                aria-label="Spire event second selection"
                value={second || ""}
                onChange={(e) => setSecondId(e.target.value)}
              >
                {candidates
                  .filter((item) => item.id !== first)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
              </select>
            </label>
          )}
          <div className="spire-selected-cards">
            {selected.map((card) => (
              <button
                className="run-card-preview"
                aria-label={`Inspect event card ${card.name}`}
                key={card.id}
                onClick={() => onInspect(card)}
              >
                <StoneCard stone={card} />
              </button>
            ))}
          </div>
          {choice!.transform && (
            <p className="event-unavailable">
              Each selected stone becomes a random new stone. Transformed stones
              have a 90% chance of at least one keyword, or 100% with
              Runesmith’s Quill, and can have up to five distinct keyword
              assignments. Their selected deck slots stay the same.
            </p>
          )}
          {choice!.remove && (
            <p className="field-note">
              Removing a selected stone fills its deck slot with a reserve.
              Removing a curse restores its normal hand slot for future battles.
            </p>
          )}
          {choice!.upgrade && (
            <p className="field-note">
              Pips go to the weakest edges, within five per edge and twelve
              total.
            </p>
          )}
          {choice!.sacrificeRelic && (
            <p className="event-unavailable">
              The chosen relic is consumed. Losing a life-cap or potion-belt
              relic also removes its extra capacity.
            </p>
          )}
          <button
            className="button button-dark"
            disabled={!first || (choice!.select === "two-cards" && !second)}
            onClick={() =>
              onResolve(
                `choice:${chosen}`,
                first,
                choice!.select === "two-cards" ? second : undefined,
              )
            }
          >
            Confirm event choice
          </button>
          <button className="text-button" onClick={() => setChosen(null)}>
            <ArrowLeft size={13} />
            Back to choices
          </button>
        </section>
      )}
      <p className="field-note">
        Costs and outcomes use Skystones rules. Relic rewards roll an unowned
        replacement if you already own the named relic. Event curses put
        zero-pip stones into your battle hand until purified.
      </p>
      <button className="text-button" onClick={() => onResolve("leave")}>
        Leave encounter
      </button>
    </div>
  );
}
export function SpireEventGuide() {
  const [search, setSearch] = useState("");
  const events = SPIRE_CATALOG.filter((event) =>
    `${event.sourceName} ${event.text}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="eyebrow">{SPIRE_CATALOG.length} ADAPTED ENCOUNTERS</div>
      <h2>Spire event guide</h2>
      <p>
        Spire Crossroads appear once in each act. Their event is chosen from
        that act and shared encounters, without repeating an encounter in the
        same run. Costs use lives and printed pips rather than hit points and
        card damage.
      </p>
      <label>
        Find an event
        <input
          aria-label="Search event guide"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Transform, skull, library…"
        />
      </label>
      <p className="field-note">
        The catalogue includes the original playable events, an adaptation of
        the unused Thinking with Puddles scene, an opening blessing, and a Heart
        trial. Event text and artwork are original to this game.
      </p>
      <div className="spire-guide-grid">
        {events.map((event) => (
          <article key={event.id}>
            <span>{event.act ? `Act ${event.act}` : "Shared"}</span>
            <h3>{event.sourceName}</h3>
            <p>{event.text}</p>
            <details>
              <summary>Adapted choices</summary>
              <ul>
                {event.choices.map((choice, index) => (
                  <li key={index}>
                    {choice.at ? `Later stage: ` : ""}
                    {choice.label}
                  </li>
                ))}
              </ul>
            </details>
          </article>
        ))}
      </div>
    </>
  );
}
