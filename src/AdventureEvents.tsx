import { useState } from "react";
import { ArrowRight, Combine, PenTool } from "lucide-react";
import { StoneCard } from "./Artwork";
import { KeywordDetails } from "./CardInspection";
import { ELEMENTS, KEYWORD_RULES, handSize, validateKeywords } from "./game";
import type { Stone } from "./game";
import {
  adventureFusionPreview,
  adventureInscriptionOffers,
} from "./adventure";
import type { Adventure } from "./adventure";

function EventPreview({
  stone,
  label,
  onInspect,
}: {
  stone: Stone;
  label: string;
  onInspect: (stone: Stone) => void;
}) {
  return (
    <div className="event-card-preview">
      <h3>{label}</h3>
      <button
        className="run-card-preview"
        aria-label={`Inspect ${label.toLowerCase()} ${stone.name}`}
        onClick={() => onInspect(stone)}
      >
        <StoneCard stone={stone} />
      </button>
      <p>
        {stone.name} · {stone.edges.reduce((a, b) => a + b, 0)} pips
      </p>
      <small>
        N/E/S/W: {stone.edges.join("/")} · {ELEMENTS[stone.element].name}
      </small>
    </div>
  );
}
export function InscriptionEvent({
  run,
  onClaim,
  onLeave,
  onInspect,
}: {
  run: Adventure;
  onClaim: (id: string, offer: number) => void;
  onLeave: () => void;
  onInspect: (stone: Stone) => void;
}) {
  const [cardId, setCardId] = useState(run.inventory[0].id);
  const [chosen, setChosen] = useState(0);
  const stone =
    run.inventory.find((card) => card.id === cardId) || run.inventory[0];
  const offers = adventureInscriptionOffers(run),
    keyword = offers[chosen];
  const keywords = [...(stone.keywords || []), keyword],
    valid = validateKeywords(keywords);
  const preview = { ...stone, keywords };
  return (
    <div className="inscription-event">
      <label>
        Stone to inscribe
        <select
          aria-label="Event inscription card"
          value={stone.id}
          onChange={(e) => setCardId(e.target.value)}
        >
          {run.inventory.map((card) => (
            <option value={card.id} key={card.id}>
              {card.name} · {card.edges.join("/")}
            </option>
          ))}
        </select>
      </label>
      <div
        className="event-inscription-offers"
        role="group"
        aria-label="Choose a free inscription"
      >
        {offers.map((offer, index) => (
          <article
            className={`event-inscription-offer ${chosen === index ? "chosen" : ""}`}
            key={index}
          >
            <button
              className={`button ${chosen === index ? "button-dark" : "button-outline"}`}
              aria-pressed={chosen === index}
              onClick={() => setChosen(index)}
            >
              Choose {KEYWORD_RULES[offer.type].name} inscription
            </button>
            <KeywordDetails
              stone={{ ...stone, keywords: [offer] }}
              size={run.size}
            />
          </article>
        ))}
      </div>
      <div className="event-card-comparison">
        <EventPreview
          stone={stone}
          label="Current stone"
          onInspect={onInspect}
        />
        <ArrowRight className="event-combine-arrow" />
        <EventPreview
          stone={valid ? preview : stone}
          label="Inscribed stone"
          onInspect={onInspect}
        />
      </div>
      {!valid && (
        <p className="event-unavailable" role="status">
          This stone already has that keyword on this edge. Choose another stone
          or inscription.
        </p>
      )}
      <p className="field-note">
        The shrine permanently adds one inscription for free. Your printed pips
        and selected deck stay the same.
      </p>
      <div className="event-confirm-actions">
        <button
          className="button button-dark"
          disabled={!valid}
          onClick={() => onClaim(stone.id, chosen)}
        >
          <PenTool size={16} />
          Inscribe {stone.name} for free
        </button>
        <button className="button button-outline" onClick={onLeave}>
          Leave the shrine
        </button>
      </div>
    </div>
  );
}
export function FusionEvent({
  run,
  onCombine,
  onLeave,
  onInspect,
}: {
  run: Adventure;
  onCombine: (baseId: string, donorId: string) => void;
  onLeave: () => void;
  onInspect: (stone: Stone) => void;
}) {
  const [baseId, setBaseId] = useState(run.inventory[0].id);
  const [donorId, setDonorId] = useState(run.inventory[1].id);
  const base =
    run.inventory.find((card) => card.id === baseId) || run.inventory[0];
  const donor =
    run.inventory.find((card) => card.id === donorId && card.id !== base.id) ||
    run.inventory.find((card) => card.id !== base.id)!;
  const result = adventureFusionPreview(base, donor);
  const enoughCards = run.inventory.length > handSize(run.size);
  const uncapped = base.edges.reduce(
    (sum, edge, side) => sum + Math.max(edge, donor.edges[side]),
    0,
  );
  return (
    <div className="fusion-event">
      <div className="fusion-selectors">
        <label>
          Base stone · keeps element and artwork
          <select
            aria-label="Fusion base card"
            value={base.id}
            onChange={(e) => setBaseId(e.target.value)}
          >
            {run.inventory.map((card) => (
              <option value={card.id} key={card.id}>
                {card.name} · {card.edges.join("/")}
              </option>
            ))}
          </select>
        </label>
        <label>
          Stone to combine · consumed
          <select
            aria-label="Fusion donor card"
            value={donor.id}
            onChange={(e) => setDonorId(e.target.value)}
          >
            {run.inventory
              .filter((card) => card.id !== base.id)
              .map((card) => (
                <option value={card.id} key={card.id}>
                  {card.name} · {card.edges.join("/")}
                </option>
              ))}
          </select>
        </label>
      </div>
      <p>
        Take the stronger value on each edge and merge both stones’ keywords.
        Printed edges stay at five or less, with a total of twelve or less.
      </p>
      <div className="fusion-card-comparison">
        <EventPreview stone={base} label="Base stone" onInspect={onInspect} />
        <EventPreview
          stone={donor}
          label="Consumed stone"
          onInspect={onInspect}
        />
        <EventPreview
          stone={result}
          label="Combined stone"
          onInspect={onInspect}
        />
      </div>
      {uncapped > 12 && (
        <p className="fusion-cap-notice">
          The stronger edges would total {uncapped} pips. The highest edges are
          reduced in turn to fit the 12-pip limit shown above.
        </p>
      )}
      <div className="fusion-keywords" aria-label="Combined stone keywords">
        <KeywordDetails stone={result} size={run.size} />
      </div>
      <p className="field-note">
        Matching keyword directions merge once. Conflicting Resonance
        inscriptions keep the base card’s counted element; matching Sunder
        inscriptions keep the stronger amount.
      </p>
      <p className="field-note">
        The two inputs become one stone. If both were in your deck, a reserve
        stone fills the open slot. This event is free.
      </p>
      {!enoughCards && (
        <p className="event-unavailable" role="status">
          You need at least one reserve stone to combine cards and still keep a
          full {handSize(run.size)}-card battle hand.
        </p>
      )}
      <div className="event-confirm-actions">
        <button
          className="button button-dark"
          disabled={!enoughCards}
          onClick={() => onCombine(base.id, donor.id)}
        >
          <Combine size={16} />
          Combine these stones
        </button>
        <button className="button button-outline" onClick={onLeave}>
          Leave the forge
        </button>
      </div>
    </div>
  );
}
