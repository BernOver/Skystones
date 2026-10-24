import { useEffect, useState } from "react";
import { Check, Info, Shuffle, Users } from "lucide-react";
import { RunDialog } from "./Expedition";
import { StoneCard } from "./Artwork";
import { CardInspector, KeywordDetails } from "./CardInspection";
import type { Inspection } from "./CardInspection";
import { handSize } from "./game";
import type { BoardSize, Stone } from "./game";
import {
  DRAFT_STORAGE,
  newDraft,
  nominateDraftCards,
  nominationCount,
  pickDraftCard,
  randomPoolCount,
  restoreDraft,
} from "./draft";
import type { DraftState } from "./draft";
import "./draft.css";

function load(): DraftState | null {
  try {
    return restoreDraft(
      JSON.parse(localStorage.getItem(DRAFT_STORAGE) || "null"),
    );
  } catch {
    return null;
  }
}
export function Draft({
  onPlay,
}: {
  onPlay: (size: BoardSize, hands: [Stone[], Stone[]]) => void;
}) {
  const [draft, setDraft] = useState<DraftState | null>(load);
  const [size, setSize] = useState<BoardSize>(draft?.size || 3);
  const [selected, setSelected] = useState<string[]>([]);
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [detail, setDetail] = useState<Stone | null>(null);
  const [restart, setRestart] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (draft) {
      try {
        localStorage.setItem(DRAFT_STORAGE, JSON.stringify(draft));
      } catch {
        setError(
          "Browser storage is full. Keep this tab open to finish your draft.",
        );
      }
    }
  }, [draft]);
  useEffect(() => {
    setInspection(null);
  }, [draft]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDetail(null);
        setInspection(null);
        setRestart(false);
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  function start() {
    setDraft(newDraft(size));
    setSelected([]);
    setRestart(false);
    setError("");
  }
  function look(stone: Stone, anchor: HTMLElement) {
    const rect = anchor.getBoundingClientRect();
    setInspection({
      stone,
      sourceId: stone.id,
      anchor: { left: rect.left, right: rect.right, top: rect.top },
      anchorElement: anchor,
      edges: stone.edges,
      activeKeywords: [],
      played: false,
      playerName: "Draft",
      preview: true,
      size,
    });
  }
  function nominate() {
    if (!draft) return;
    try {
      setDraft(nominateDraftCards(draft, selected));
      setSelected([]);
      setError("");
    } catch (err) {
      setError((err as Error).message);
    }
  }
  function pick(id: string) {
    if (draft) {
      try {
        setDraft(pickDraftCard(draft, id));
        setError("");
      } catch (err) {
        setError((err as Error).message);
      }
    }
  }
  function tile(
    stone: Stone,
    action: () => void,
    label: string,
    disabled = false,
    chosen = false,
  ) {
    return (
      <article
        className={`draft-card ${chosen ? "draft-selected" : ""} ${disabled ? "draft-unavailable" : ""}`}
        key={stone.id}
      >
        <button
          className="draft-preview"
          aria-label={`Inspect ${stone.name}`}
          onClick={() => {
            setDetail(stone);
            setInspection(null);
          }}
          onPointerEnter={(e) =>
            e.pointerType !== "touch" && look(stone, e.currentTarget)
          }
          onPointerLeave={() => setInspection(null)}
          onFocus={(e) =>
            e.currentTarget.matches(":focus-visible") &&
            look(stone, e.currentTarget)
          }
          onBlur={() => setInspection(null)}
        >
          <StoneCard stone={stone} selected={chosen} />
        </button>
        <span className="draft-pip-total">
          {stone.edges.reduce((a, b) => a + b, 0)} pips ·{" "}
          {stone.keywords?.length ? "Keyword" : "Plain stone"}
        </span>
        <button
          className={`button ${chosen ? "button-dark" : "button-outline"}`}
          disabled={disabled}
          onClick={action}
        >
          {chosen && <Check size={14} />} {label}
        </button>
      </article>
    );
  }
  if (!draft)
    return (
      <section className="draft-setup run-setup">
        <div className="eyebrow">
          <Shuffle size={16} /> TWO PLAYERS · ONE SHARED POOL
        </div>
        <h1>Build a rivalry.</h1>
        <p>
          Nominate your favorites, draft three cards at a time, then face off at
          the table.
        </p>
        <label>
          Board size
          <select
            aria-label="Draft board size"
            value={size}
            onChange={(e) => setSize(Number(e.target.value) as BoardSize)}
          >
            <option value={3}>3 × 3 · five-card hands</option>
            <option value={4}>4 × 4 · eight-card hands</option>
          </select>
        </label>
        <p>
          Each player nominates {nominationCount(size)} different cards from 25.
          Add {randomPoolCount(size)} random unselected cards. Each round, both
          players pick one and the last card is discarded. First pick
          alternates.
        </p>
        <button className="button button-dark" onClick={start}>
          Start draft <Shuffle size={16} />
        </button>
        <small>Selections save automatically in this browser.</small>
      </section>
    );
  const quota = nominationCount(draft.size),
    rounds = handSize(draft.size),
    taken = draft.nominations.flat();
  const get = (id: string) => draft.cards.find((card) => card.id === id)!;
  return (
    <div className="draft-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <Shuffle size={15} /> SHARED DRAFT · {draft.size} × {draft.size}
          </div>
          <h1>
            {draft.phase === "nominate"
              ? "Set the pool."
              : draft.phase === "draft"
                ? "Pick your stones."
                : "Your hands are ready."}
          </h1>
        </div>
        <button
          className="button button-outline"
          onClick={() => setRestart(true)}
        >
          New draft
        </button>
      </div>
      <div className="draft-status" role="status">
        <Users size={20} />
        <div>
          <strong>
            {draft.phase === "ready"
              ? "Draft complete"
              : `Player ${draft.current + 1}’s ${draft.phase === "nominate" ? "nominations" : "pick"}`}
          </strong>
          <p>
            {draft.phase === "nominate"
              ? `Choose ${quota} available cards. ${draft.current === 0 ? "Player two will choose from the remaining cards." : "Player one’s nominations are already reserved."} ${randomPoolCount(draft.size)} more will be added at random.`
              : draft.phase === "draft"
                ? `Round ${draft.round + 1} of ${rounds} · ${draft.offered.length === 3 ? "First pick" : "Second pick; the last card will be discarded"}.`
                : `Both players have ${rounds} cards. Player one opens the match.`}
          </p>
        </div>
        <span className="draft-hand-counts">
          {draft.phase === "nominate" ? "Locked nominations" : "Drafted hands"}{" "}
          · P1:{" "}
          {draft.phase === "nominate"
            ? draft.nominations[0].length
            : draft.hands[0].length}
          /{draft.phase === "nominate" ? quota : rounds} · P2:{" "}
          {draft.phase === "nominate"
            ? draft.nominations[1].length
            : draft.hands[1].length}
          /{draft.phase === "nominate" ? quota : rounds}
        </span>
      </div>
      {error && <p role="alert">{error}</p>}
      {draft.phase === "nominate" && (
        <>
          <div className="draft-sticky-actions">
            <strong>
              {selected.length}/{quota} selected
            </strong>
            <button
              className="button button-dark"
              disabled={selected.length !== quota}
              onClick={nominate}
            >
              Lock Player {draft.current + 1}’s nominations
            </button>
          </div>
          <div className="draft-grid">
            {draft.cards.map((stone) => {
              const chosen = selected.includes(stone.id),
                reserved = taken.includes(stone.id);
              return tile(
                stone,
                () =>
                  setSelected((previous) =>
                    chosen
                      ? previous.filter((id) => id !== stone.id)
                      : [...previous, stone.id],
                  ),
                reserved
                  ? "Reserved by Player 1"
                  : chosen
                    ? "Selected · undo"
                    : "Nominate",
                reserved || (!chosen && selected.length >= quota),
                chosen,
              );
            })}
          </div>
        </>
      )}
      {draft.phase === "draft" && (
        <>
          <div className="draft-offers">
            {draft.offered.map((id) =>
              tile(get(id), () => pick(id), `Pick ${get(id).name}`),
            )}
          </div>
          <p className="field-note">
            {draft.pool.length} cards remain in the pool.{" "}
            {draft.discarded.length} discarded. Hover, focus, or tap a card to
            read its keywords.
          </p>
        </>
      )}
      {draft.phase === "ready" && (
        <button
          className="button button-dark draft-play"
          onClick={() =>
            onPlay(draft.size, [
              draft.hands[0].map(get),
              draft.hands[1].map(get),
            ])
          }
        >
          Play drafted match <Users size={17} />
        </button>
      )}
      {draft.phase !== "nominate" && (
        <div className="draft-hands">
          {draft.hands.map((hand, owner) => (
            <details key={owner} open={draft.phase === "ready"}>
              <summary>
                Player {owner + 1}’s drafted hand · {hand.length}/{rounds}
              </summary>
              <div>
                {hand.map((id) => (
                  <button
                    key={id}
                    aria-label={`Inspect drafted ${get(id).name}`}
                    onClick={() => setDetail(get(id))}
                  >
                    <StoneCard stone={get(id)} owner={owner as 0 | 1} />
                  </button>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
      {inspection && !detail && <CardInspector inspection={inspection} />}
      {(detail || restart) && (
        <RunDialog
          title={detail ? `Draft card ${detail.name}` : "Start a new draft"}
          onClose={() => {
            setDetail(null);
            setRestart(false);
          }}
        >
          {detail ? (
            <>
              <div className="run-detail-card">
                <StoneCard stone={detail} />
              </div>
              <h2>{detail.name}</h2>
              <p>
                {detail.edges.reduce((a, b) => a + b, 0)} printed pips ·
                N/E/S/W: {detail.edges.join("/")}
              </p>
              <KeywordDetails stone={detail} size={draft.size} />
            </>
          ) : (
            <>
              <h2>Start a new draft</h2>
              <p>
                This replaces the saved draft. Your collection and adventure are
                separate.
              </p>
              <label>
                Board size
                <select
                  aria-label="Draft board size"
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value) as BoardSize)}
                >
                  <option value={3}>3 × 3 · five-card hands</option>
                  <option value={4}>4 × 4 · eight-card hands</option>
                </select>
              </label>
              <button className="button button-dark" onClick={start}>
                Start new draft
              </button>
            </>
          )}
        </RunDialog>
      )}
      <p className="field-note draft-note">
        <Info size={13} /> Draft cards belong to this mode. Most trade strength
        between edges; a slightly superior stone can occasionally appear.
      </p>
    </div>
  );
}
