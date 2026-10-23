import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import type { ChangeEvent, ReactNode } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCheck,
  ChevronDown,
  Download,
  Grid2X2,
  HelpCircle,
  ImagePlus,
  Layers,
  Leaf,
  LoaderCircle,
  Minus,
  Pencil,
  Plus,
  Search,
  Shield,
  Sparkles,
  Swords,
  Trash2,
  Trophy,
  Upload,
  Users,
  Volume2,
  VolumeX,
  WandSparkles,
  X,
} from "lucide-react";
import { CreatureArt, ELEMENT_ICONS, StoneCard } from "./Artwork";
import {
  COORDINATES,
  DEFAULT_DECK,
  ELEMENTS,
  EMPTY_BOARD,
  STARTER_STONES,
  chooseMove,
  placeStone,
  score,
  validateStone,
} from "./game";
import type { Board, Creature, Element, Owner, Stone } from "./game";
import { createId } from "./id";

type Page = "table" | "collection" | "studio";
type Mode = "computer" | "local";
type DialogState =
  { kind: "rules" | "new" } | { kind: "card" | "delete"; stone: Stone } | null;
interface Library {
  custom: Stone[];
  deck: string[];
  sound: boolean;
}
interface JournalEntry {
  id: number;
  owner: Owner;
  text: string;
  captured: number;
}
interface Match {
  id: string;
  board: Board;
  hands: [Stone[], Stone[]];
  current: Owner;
  mode: Mode;
  entries: JournalEntry[];
  moves: number;
  lastCaptured: number[];
  lastPlaced: number;
}
const STORAGE_KEY = "skystones-library-v1";
const CREATURE_NAMES: Record<Creature, string> = {
  dragon: "Dragon",
  turtle: "Turtle",
  whale: "Whale",
  owl: "Owl",
  fox: "Fox",
  golem: "Golem",
  mushroom: "Mushroom",
  cat: "Cloud cat",
};
const freshDraft = (): Stone => ({
  id: "custom-draft",
  name: "",
  description: "",
  element: "magic",
  creature: "dragon",
  edges: [2, 2, 2, 2],
  custom: true,
});

function readLibrary(): Library {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (value && Array.isArray(value.custom) && Array.isArray(value.deck)) {
      const custom: Stone[] = value.custom
        .filter(validateStone)
        .map((s: Stone) => ({ ...s, custom: true }));
      const ids = new Set([...STARTER_STONES, ...custom].map((s) => s.id));
      const deck = [
        ...new Set<string>(
          value.deck.filter(
            (id: unknown) => typeof id === "string" && ids.has(id),
          ),
        ),
      ].slice(0, 5);
      return { custom, deck, sound: value.sound === true };
    }
  } catch {
    /* A malformed local save should never prevent the app from opening. */
  }
  return { custom: [], deck: DEFAULT_DECK, sound: false };
}

function createMatch(
  library: Library,
  mode: Mode = "computer",
  first: Owner = 0,
): Match {
  const collection = [...STARTER_STONES, ...library.custom];
  // A half-edited saved deck must not strand the initial practice match.
  const deck = library.deck.length === 5 ? library.deck : DEFAULT_DECK;
  const human = deck
    .map((id) => collection.find((s) => s.id === id))
    .filter((s): s is Stone => !!s);
  const pool = [...STARTER_STONES.slice(5)];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const opponent = pool.slice(0, 5);
  return {
    id: createId(),
    board: EMPTY_BOARD(),
    hands: [human, opponent],
    current: first,
    mode,
    entries: [],
    moves: 0,
    lastCaptured: [],
    lastPlaced: -1,
  };
}

function applyMove(match: Match, index: number, cardIndex: number): Match {
  const stone = match.hands[match.current][cardIndex];
  const move = placeStone(match.board, index, stone, match.current);
  const hands: [Stone[], Stone[]] = [[...match.hands[0]], [...match.hands[1]]];
  hands[match.current].splice(cardIndex, 1);
  return {
    ...match,
    board: move.board,
    hands,
    current: match.current === 0 ? 1 : 0,
    moves: match.moves + 1,
    lastCaptured: move.captured,
    lastPlaced: index,
    entries: [
      {
        id: match.moves,
        owner: match.current,
        text: `${stone.name} → ${COORDINATES[index]}`,
        captured: move.captured.length,
      },
      ...match.entries,
    ],
  };
}

function Dialog({
  title,
  children,
  onClose,
  className = "",
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current
      ?.querySelector<HTMLElement>("button, input, select, textarea")
      ?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close.current();
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        ref.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), select, textarea, [tabindex="0"]',
        ) || [],
      ).filter((el) => el.offsetParent !== null);
      const first = focusable[0],
        last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", handleKey);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        className={`dialog ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <button
          className="icon-button modal-close"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  );
}

function Brand({ small = false }: { small?: boolean }) {
  return (
    <span className={`brand ${small ? "small" : ""}`}>
      <span className="brand-mark">
        <svg viewBox="0 0 32 38" fill="none">
          <path d="M16 1 30 15 16 37 2 15Z" fill="currentColor" />
          <path d="m16 9 6 7-6 11-6-11Z" fill="#f8f4e9" />
        </svg>
      </span>
      <span>
        skystones<span className="brand-period">.</span>
      </span>
    </span>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>("table");
  const [library, setLibrary] = useState<Library>(readLibrary);
  const [match, setMatch] = useState<Match>(() => createMatch(readLibrary()));
  const [selected, setSelected] = useState<number | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [toast, setToast] = useState("");
  const [newMode, setNewMode] = useState<Mode>("computer");
  const [newFirst, setNewFirst] = useState<Owner>(0);
  const [resultDismissed, setResultDismissed] = useState(false);
  const [query, setQuery] = useState("");
  const [elementFilter, setElementFilter] = useState("all");
  const [onlyCustom, setOnlyCustom] = useState(false);
  const [draft, setDraft] = useState<Stone>(freshDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const lastSound = useRef("");
  const collection = [...STARTER_STONES, ...library.custom];
  const scores = score(match.board);
  const done = match.moves === 9;
  const aiTurn = match.mode === "computer" && match.current === 1 && !done;
  const names =
    match.mode === "computer"
      ? ["You", "Willow"]
      : ["Player one", "Player two"];
  const currentHand = match.hands[match.current];
  const shownHand = aiTurn ? match.hands[0] : currentHand;
  const visible = collection.filter(
    (s) =>
      (!onlyCustom || s.custom) &&
      (elementFilter === "all" || s.element === elementFilter) &&
      s.name.toLowerCase().includes(query.toLowerCase()),
  );
  const totalPoints = draft.edges.reduce((a, b) => a + b, 0);
  const winner = scores[0] > scores[1] ? 0 : 1;

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!aiTurn) return;
    const id = match.id;
    const timer = setTimeout(() => {
      setMatch((current) => {
        if (current.id !== id || current.current !== 1 || current.moves === 9)
          return current;
        const move = chooseMove(
          current.board,
          current.hands[1],
          current.hands[0],
          1,
        );
        return applyMove(current, move.index, move.cardIndex);
      });
    }, 850);
    return () => clearTimeout(timer);
  }, [aiTurn, match.id, match.moves]);

  useEffect(() => {
    const key = `${match.id}-${match.moves}`;
    if (lastSound.current === key) return;
    lastSound.current = key;
    if (!library.sound || !match.moves) return;
    try {
      const ctx = (audioRef.current ||= new AudioContext());
      void ctx.resume();
      const notes = match.lastCaptured.length ? [440, 554, 659] : [330, 440];
      notes.forEach((frequency, index) => {
        const oscillator = ctx.createOscillator(),
          gain = ctx.createGain();
        const start = ctx.currentTime + index * 0.075;
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.065, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.31);
      });
    } catch {
      /* Audio support is optional; the board stays playable. */
    }
  }, [match.id, match.moves, match.lastCaptured.length, library.sound]);

  function saveLibrary(next: Library): boolean {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setLibrary(next);
      return true;
    } catch {
      setToast(
        "Your browser storage is full or unavailable. Export a card, or remove an old creation before saving.",
      );
      return false;
    }
  }
  function navigate(next: Page) {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function openStudio(stone?: Stone) {
    setDraft(stone ? { ...stone, edges: [...stone.edges] } : freshDraft());
    setEditingId(stone?.id || null);
    setDialog(null);
    navigate("studio");
  }
  function startMatch() {
    if (library.deck.length !== 5) {
      setToast(
        "Choose exactly five stones in your collection to start a match.",
      );
      return;
    }
    setMatch(createMatch(library, newMode, newFirst));
    setSelected(null);
    setResultDismissed(false);
    setDialog(null);
    navigate("table");
  }
  function playAt(index: number) {
    if (aiTurn || done || match.board[index] || selected === null) return;
    setMatch(applyMove(match, index, selected));
    setSelected(null);
  }
  function toggleDeck(stone: Stone) {
    const included = library.deck.includes(stone.id);
    if (!included && library.deck.length >= 5) {
      setToast(
        "Five stones make a deck. Remove one first to make room for a new friend.",
      );
      return;
    }
    saveLibrary({
      ...library,
      deck: included
        ? library.deck.filter((id) => id !== stone.id)
        : [...library.deck, stone.id],
    });
  }
  function saveDraft(event: React.FormEvent) {
    event.preventDefault();
    const stone: Stone = {
      ...draft,
      name: draft.name.trim(),
      id: editingId || `custom-${createId()}`,
      custom: true,
    };
    if (!validateStone(stone)) {
      setToast("Give your stone a name and use no more than 12 edge points.");
      return;
    }
    const custom = editingId
      ? library.custom.map((s) => (s.id === editingId ? stone : s))
      : [...library.custom, stone];
    if (saveLibrary({ ...library, custom })) {
      setEditingId(stone.id);
      setDraft(stone);
      setToast(
        `${stone.name} is saved to your collection. A little legend is born!`,
      );
    }
  }
  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 2_000_000
    ) {
      setToast("Choose a PNG, JPG, or WebP image smaller than 2 MB.");
      return;
    }
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const image = new Image();
      image.src = data;
      await image.decode();
      setDraft((current) => ({ ...current, image: data }));
    } catch {
      setToast(
        "That image could not be opened. Try another PNG, JPG, or WebP file.",
      );
    }
  }
  function exportCard(stone: Stone) {
    const card = {
      ...stone,
      id: stone.custom ? stone.id : `custom-${stone.id}`,
      custom: true,
    };
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            { format: "skystones-card", version: 1, card },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${stone.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.skystone.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToast(
      "Card exported. Import this file to bring it into another collection.",
    );
  }
  async function importCard(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 3_000_000) {
      setToast("That card file is too large. The limit is 3 MB.");
      return;
    }
    try {
      const payload = JSON.parse(await file.text());
      if (
        payload.format !== "skystones-card" ||
        payload.version !== 1 ||
        !validateStone(payload.card)
      )
        throw new Error("Invalid card");
      const stone: Stone = {
        ...payload.card,
        id: `custom-${createId()}`,
        custom: true,
      };
      if (saveLibrary({ ...library, custom: [...library.custom, stone] })) {
        setToast(`${stone.name} has joined your collection.`);
        setOnlyCustom(true);
        setQuery("");
        setElementFilter("all");
        navigate("collection");
      }
    } catch {
      setToast(
        "This is not a valid Skystones card file. Import a .skystone.json export with at most 12 edge points.",
      );
    }
  }
  async function downloadImage(target: HTMLDivElement | null, name: string) {
    if (!target) return;
    setDownloadBusy(true);
    try {
      const url = await toPng(target, {
        pixelRatio: 3,
        style: { transform: "none", margin: "0", boxShadow: "none" },
      });
      const a = document.createElement("a");
      a.download = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "my-stone"}.png`;
      a.href = url;
      a.click();
      setToast("Your card image is ready. Share a little magic.");
    } catch {
      setToast(
        "The image could not be downloaded. You can still export the card file from your collection.",
      );
    } finally {
      setDownloadBusy(false);
    }
  }

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <button
            className="brand-link"
            aria-label="Skystones home"
            onClick={() => navigate("table")}
          >
            <Brand />
          </button>
          <nav className="main-nav" aria-label="Main navigation">
            <button
              className={page === "table" ? "active" : ""}
              onClick={() => navigate("table")}
            >
              <Grid2X2 size={17} />
              <span>The table</span>
            </button>
            <button
              className={page === "collection" ? "active" : ""}
              onClick={() => navigate("collection")}
            >
              <Layers size={18} />
              <span>Collection</span>
              <span className="nav-count">{collection.length}</span>
            </button>
            <button
              className={page === "studio" ? "active" : ""}
              onClick={() => navigate("studio")}
            >
              <WandSparkles size={18} />
              <span>Card studio</span>
            </button>
          </nav>
          <div className="header-actions">
            <button
              className="icon-button sound-button"
              aria-label={
                library.sound ? "Mute game sounds" : "Enable game sounds"
              }
              title={library.sound ? "Mute sounds" : "Enable sounds"}
              onClick={() => saveLibrary({ ...library, sound: !library.sound })}
            >
              {library.sound ? <Volume2 size={19} /> : <VolumeX size={19} />}
            </button>
            <span className="header-divider" />
            <button
              className="rules-button"
              onClick={() => setDialog({ kind: "rules" })}
            >
              <HelpCircle size={18} />
              <span>How to play</span>
            </button>
          </div>
        </div>
      </header>

      <main className={`main-content page-${page}`}>
        {page === "table" && (
          <>
            <div className="page-heading">
              <div>
                <div className="eyebrow">
                  <span className="tiny-star">✦</span> A LITTLE STRATEGY. A
                  LITTLE MAGIC.
                </div>
                <h1>
                  Make your move<span className="orange-period">.</span>
                </h1>
                <p>Good stones. Clever moves. One square at a time.</p>
              </div>
              <div className="heading-actions">
                <span className="local-label">
                  <span />
                  No downloads. Just play.
                </span>
                <button
                  className="button button-dark"
                  onClick={() => {
                    setNewMode(match.mode);
                    setDialog({ kind: "new" });
                  }}
                >
                  <Plus size={18} />
                  New match
                </button>
              </div>
            </div>

            <div className="play-layout">
              <section className="table-panel" aria-label="Skystones game">
                <div className="table-topline">
                  <span>
                    <span className="status-dot" />
                    {match.mode === "computer"
                      ? "A friendly little rivalry"
                      : "Pass the screen. Share the magic."}
                  </span>
                  <span className="match-label">
                    {match.mode === "computer"
                      ? "SOLO PLAY"
                      : "LOCAL TWO-PLAYER"}
                    <span>·</span>3 × 3
                  </span>
                </div>
                <div className="arena">
                  <div className="player-strip">
                    <div
                      className={`player player-one ${!done && match.current === 0 ? "player-active" : ""}`}
                    >
                      <div className="avatar avatar-you">
                        <span>Y</span>
                        <span className="avatar-star">✦</span>
                      </div>
                      <div>
                        <span className="player-name">
                          {names[0]}
                          <span className="you-tag">
                            {match.mode === "computer" ? "THAT’S YOU" : "BLUE"}
                          </span>
                        </span>
                        <span className="player-subtitle">
                          {match.hands[0].length} stones in hand
                        </span>
                      </div>
                    </div>
                    <span className="versus">vs.</span>
                    <div
                      className={`player player-two ${!done && match.current === 1 ? "player-active" : ""}`}
                    >
                      <div className="player-copy">
                        <span className="player-name">
                          {names[1]}
                          <Leaf size={13} />
                        </span>
                        <span className="player-subtitle">
                          {match.hands[1].length} stones in hand
                        </span>
                      </div>
                      <div className="avatar avatar-rival">
                        <CreatureArt creature="fox" element="earth" />
                      </div>
                    </div>
                  </div>

                  <div className="board-wrap">
                    <span className="board-decoration decoration-one">✧</span>
                    <span className="board-decoration decoration-two">✦</span>
                    <div
                      className={`game-board ${selected !== null && !aiTurn && !done ? "ready-to-place" : ""}`}
                      role="group"
                      aria-label="Game board, three rows and three columns"
                    >
                      {match.board.map((cell, index) => (
                        <button
                          key={`${index}-${cell?.owner ?? "empty"}`}
                          className={`board-cell ${cell ? "filled" : "empty"} ${match.lastCaptured.includes(index) ? "just-captured" : ""} ${match.lastPlaced === index ? "just-placed" : ""}`}
                          aria-label={
                            cell
                              ? `${COORDINATES[index]}: ${cell.stone.name}, controlled by ${names[cell.owner]}, edges north ${cell.stone.edges[0]}, east ${cell.stone.edges[1]}, south ${cell.stone.edges[2]}, west ${cell.stone.edges[3]}`
                              : `${COORDINATES[index]}, empty square`
                          }
                          disabled={
                            !!cell || aiTurn || done || selected === null
                          }
                          onClick={() => playAt(index)}
                        >
                          {cell ? (
                            <StoneCard
                              stone={cell.stone}
                              owner={cell.owner}
                              compact
                            />
                          ) : (
                            <>
                              <span className="cell-coordinate">
                                {COORDINATES[index]}
                              </span>
                              <Plus
                                className="cell-plus"
                                size={22}
                                strokeWidth={1}
                              />
                              <span className="place-label">Place stone</span>
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                    {done && !resultDismissed && (
                      <div className="result-overlay">
                        <div className="result-card">
                          <span className="result-trophy">
                            <Trophy size={33} strokeWidth={1.5} />
                          </span>
                          <span className="eyebrow">
                            A GOOD GAME, WELL PLAYED
                          </span>
                          <h2>
                            {winner === 0
                              ? match.mode === "computer"
                                ? "Your little victory."
                                : "Player one wins!"
                              : match.mode === "computer"
                                ? "Willow takes this one."
                                : "Player two wins!"}
                          </h2>
                          <p>
                            {names[winner]} controlled {scores[winner]} of 9
                            stones.
                            <br />
                            There’s always another story to tell.
                          </p>
                          <button
                            className="button button-dark"
                            onClick={() => setDialog({ kind: "new" })}
                          >
                            Another round
                            <ArrowRight size={17} />
                          </button>
                          <button
                            className="text-button"
                            onClick={() => setResultDismissed(true)}
                          >
                            Take a look at the board
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div
                    className={`turn-indicator ${aiTurn ? "thinking" : ""}`}
                    role="status"
                    aria-live="polite"
                  >
                    <span
                      className={`turn-icon ${match.current === 1 ? "rival-turn" : ""}`}
                    >
                      {done ? (
                        <CheckCheck size={16} />
                      ) : aiTurn ? (
                        <LoaderCircle size={16} className="spin" />
                      ) : (
                        <Sparkles size={16} />
                      )}
                    </span>
                    <span>
                      {done ? (
                        <>
                          <strong>That’s a wrap.</strong> A little wiser, a
                          little more magical.
                        </>
                      ) : aiTurn ? (
                        <>
                          <strong>Willow is thinking</strong>
                          <span className="thinking-dots">...</span> Good things
                          take a moment.
                        </>
                      ) : (
                        <>
                          <strong>
                            {match.mode === "local"
                              ? `${names[match.current]}, your move.`
                              : "Your move."}
                          </strong>{" "}
                          {selected === null
                            ? "Pick a stone from your hand."
                            : `Place ${currentHand[selected]?.name} on an empty square.`}
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className={`hand-area ${aiTurn ? "hand-waiting" : ""}`}>
                  <div className="hand-heading">
                    <span>
                      <Layers size={15} />
                      {match.mode === "local"
                        ? `${names[match.current].toUpperCase()}’S HAND`
                        : "YOUR HAND"}
                      <span className="subtle-count">{shownHand.length}</span>
                    </span>
                    <button
                      className="text-button"
                      onClick={() => navigate("collection")}
                    >
                      Edit your deck
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                  <div className="hand-cards">
                    {shownHand.map((stone, index) => (
                      <button
                        className={`hand-card-button ${selected === index && !aiTurn ? "is-selected" : ""}`}
                        aria-label={`Select ${stone.name}, north ${stone.edges[0]}, east ${stone.edges[1]}, south ${stone.edges[2]}, west ${stone.edges[3]}`}
                        aria-pressed={selected === index && !aiTurn}
                        disabled={aiTurn || done}
                        key={stone.id}
                        onClick={() =>
                          setSelected(selected === index ? null : index)
                        }
                      >
                        <StoneCard
                          stone={stone}
                          selected={selected === index && !aiTurn}
                        />
                        {selected === index && !aiTurn && (
                          <span className="selection-check">
                            <Check size={11} />
                          </span>
                        )}
                      </button>
                    ))}
                    {shownHand.length === 0 && (
                      <div className="empty-hand">
                        <Sparkles size={20} />
                        <span>Every stone has found its place.</span>
                      </div>
                    )}
                  </div>
                  <p className="hand-hint">
                    {selected !== null && !aiTurn
                      ? "A little courage. Choose your square."
                      : "The numbers on each edge are your stone’s strength."}
                  </p>
                </div>
              </section>

              <aside className="game-sidebar">
                <section className="score-panel sidebar-panel">
                  <div className="section-heading">
                    <h2>The lay of the land</h2>
                    <Shield size={17} />
                  </div>
                  <p className="panel-description">
                    Every stone on the board counts.
                  </p>
                  <div className="score-display">
                    <div>
                      <span className="score-player">
                        <i className="blue-dot" />
                        {names[0]}
                      </span>
                      <strong>{String(scores[0]).padStart(2, "0")}</strong>
                    </div>
                    <span className="score-separator">:</span>
                    <div>
                      <span className="score-player">
                        <i className="orange-dot" />
                        {names[1]}
                      </span>
                      <strong>{String(scores[1]).padStart(2, "0")}</strong>
                    </div>
                  </div>
                  <div
                    className="score-track"
                    aria-label={`${scores[0]} blue stones, ${scores[1]} orange stones, ${9 - match.moves} empty squares`}
                  >
                    {Array.from({ length: 9 }, (_, i) => (
                      <span
                        key={i}
                        className={
                          i < scores[0]
                            ? "blue"
                            : i >= 9 - scores[1]
                              ? "orange"
                              : ""
                        }
                      />
                    ))}
                  </div>
                  <div className="board-progress">
                    <span>{match.moves} of 9 squares filled</span>
                    <span>
                      {done ? "Complete" : `${9 - match.moves} to go`}
                    </span>
                  </div>
                </section>

                <section className="quick-guide sidebar-panel">
                  <span className="eyebrow">SMALL BOARD. BIG IDEAS.</span>
                  <div className="capture-diagram" aria-hidden="true">
                    <div className="diagram-stone diagram-blue">
                      <span>3</span>
                      <i>✦</i>
                    </div>
                    <span className="diagram-arrow">
                      <ArrowRight size={22} />
                      <span>3 &gt; 1</span>
                    </span>
                    <div className="diagram-stone diagram-orange">
                      <span>1</span>
                      <i>✧</i>
                    </div>
                  </div>
                  <h2>A stronger edge wins.</h2>
                  <p>
                    Place your stone beside a rival. If your facing number is
                    higher, their stone becomes yours.
                  </p>
                  <button
                    className="text-button"
                    onClick={() => setDialog({ kind: "rules" })}
                  >
                    Learn the little details
                    <ArrowUpRight size={15} />
                  </button>
                </section>

                <section className="journal-panel sidebar-panel">
                  <div className="section-heading">
                    <h2>The story so far</h2>
                    <span className="journal-count">
                      {match.moves.toString().padStart(2, "0")}
                    </span>
                  </div>
                  {match.entries.length ? (
                    <ol className="journal-list">
                      {match.entries.slice(0, 3).map((entry, index) => (
                        <li key={entry.id}>
                          <span
                            className={`journal-dot ${entry.owner === 1 ? "rival" : ""}`}
                          />
                          <div>
                            <span>{entry.text}</span>
                            <small>
                              {entry.captured
                                ? `${entry.captured} stone${entry.captured > 1 ? "s" : ""} captured`
                                : "A new stone joins the board"}
                            </small>
                          </div>
                          {index === 0 && (
                            <span className="latest-mark">NOW</span>
                          )}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <div className="journal-empty">
                      <BookOpen size={22} strokeWidth={1.3} />
                      <p>
                        Every great story starts
                        <br />
                        with a single stone.
                      </p>
                    </div>
                  )}
                </section>

                <button className="studio-promo" onClick={() => openStudio()}>
                  <span className="promo-sparkle">
                    <WandSparkles size={24} strokeWidth={1.4} />
                  </span>
                  <span>
                    <strong>A stone of your own.</strong>
                    <small>Meet your imagination in the studio.</small>
                  </span>
                  <ArrowUpRight size={18} />
                </button>
              </aside>
            </div>
            <div className="table-footnote">
              <span>✦</span> A moment to slow down. A move to make your own.
              <span>✦</span>
            </div>
          </>
        )}

        {page === "collection" && (
          <>
            <div className="page-heading">
              <div>
                <div className="eyebrow">
                  <span className="tiny-star">✦</span> EVERY STONE HAS A STORY
                </div>
                <h1>
                  A curious collection<span className="orange-period">.</span>
                </h1>
                <p>
                  Old friends, new legends, and the five you take to the table.
                </p>
              </div>
              <div className="heading-actions">
                <button
                  className="button button-outline"
                  onClick={() => importRef.current?.click()}
                >
                  <Upload size={16} />
                  Import card
                </button>
                <button
                  className="button button-dark"
                  onClick={() => openStudio()}
                >
                  <Plus size={17} />
                  Create a stone
                </button>
              </div>
            </div>

            <section className="deck-shelf">
              <div className="deck-intro">
                <span className="eyebrow">YOUR NEXT ADVENTURE</span>
                <h2>Five good friends.</h2>
                <p>
                  Build your deck for the next match.
                  <br />
                  Your current game stays as it is.
                </p>
                <span
                  className={`deck-count ${library.deck.length < 5 ? "incomplete" : ""}`}
                >
                  <Layers size={15} />
                  {library.deck.length} / 5 stones selected
                </span>
              </div>
              <div className="deck-slots">
                {Array.from({ length: 5 }, (_, index) => {
                  const stone = collection.find(
                    (s) => s.id === library.deck[index],
                  );
                  return stone ? (
                    <button
                      className="deck-slot filled-deck-slot"
                      key={index}
                      aria-label={`Remove ${stone.name} from deck`}
                      onClick={() => toggleDeck(stone)}
                    >
                      <StoneCard stone={stone} compact />
                      <span className="remove-deck">
                        <X size={13} />
                      </span>
                    </button>
                  ) : (
                    <div className="deck-slot empty-deck-slot" key={index}>
                      <Plus size={21} strokeWidth={1} />
                      <span>Pick a stone</span>
                    </div>
                  );
                })}
              </div>
              <button
                className="button button-dark deck-play"
                disabled={library.deck.length !== 5}
                onClick={() => setDialog({ kind: "new" })}
              >
                Let’s play
                <ArrowRight size={17} />
              </button>
            </section>

            <div className="collection-toolbar">
              <div className="collection-tabs">
                <button
                  className={!onlyCustom ? "active" : ""}
                  onClick={() => setOnlyCustom(false)}
                >
                  All stones<span>{collection.length}</span>
                </button>
                <button
                  className={onlyCustom ? "active" : ""}
                  onClick={() => setOnlyCustom(true)}
                >
                  My creations<span>{library.custom.length}</span>
                </button>
              </div>
              <div className="collection-filters">
                <div className="search-field">
                  <Search size={16} />
                  <input
                    aria-label="Search stones"
                    placeholder="Find a little friend…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <div className="filter-select">
                  <select
                    aria-label="Filter by element"
                    value={elementFilter}
                    onChange={(e) => setElementFilter(e.target.value)}
                  >
                    <option value="all">All elements</option>
                    {Object.entries(ELEMENTS).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>
            {visible.length ? (
              <div className="collection-grid">
                {visible.map((stone) => {
                  const Icon = ELEMENT_ICONS[stone.element];
                  const included = library.deck.includes(stone.id);
                  return (
                    <article className="collection-item" key={stone.id}>
                      <div className="collection-card-stage">
                        <span className="collection-badge">
                          {stone.custom ? (
                            <>
                              <Sparkles size={11} />
                              MADE BY YOU
                            </>
                          ) : (
                            "THE ORIGINALS"
                          )}
                        </span>
                        <button
                          className="collection-card-button"
                          aria-label={`View ${stone.name}`}
                          onClick={() => setDialog({ kind: "card", stone })}
                        >
                          <StoneCard stone={stone} />
                        </button>
                        <span className="stage-shadow" />
                      </div>
                      <div className="collection-item-info">
                        <div>
                          <h2>{stone.name}</h2>
                          <span
                            className="element-label"
                            style={{ color: ELEMENTS[stone.element].ink }}
                          >
                            <Icon size={12} />
                            {ELEMENTS[stone.element].name} stone
                          </span>
                        </div>
                        <button
                          className={`deck-toggle ${included ? "in-deck" : ""}`}
                          aria-label={`${included ? "Remove" : "Add"} ${stone.name} ${included ? "from" : "to"} deck`}
                          onClick={() => toggleDeck(stone)}
                        >
                          {included ? <Check size={17} /> : <Plus size={17} />}
                        </button>
                      </div>
                      <p>
                        {stone.description ||
                          "An original little legend, made by you."}
                      </p>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="collection-empty">
                <Sparkles size={35} strokeWidth={1} />
                <h2>
                  {onlyCustom && !library.custom.length
                    ? "Your next legend starts here."
                    : "No little friends found."}
                </h2>
                <p>
                  {onlyCustom && !library.custom.length
                    ? "Give your imagination a name, a face, and a place at the table."
                    : "Try another name or element."}
                </p>
                <button
                  className="button button-dark"
                  onClick={() =>
                    onlyCustom && !library.custom.length
                      ? openStudio()
                      : (setQuery(""), setElementFilter("all"))
                  }
                >
                  {onlyCustom && !library.custom.length
                    ? "Create your first stone"
                    : "Clear filters"}
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </>
        )}

        {page === "studio" && (
          <>
            <div className="page-heading">
              <div>
                <div className="eyebrow">
                  <span className="tiny-star">✦</span> A LITTLE ROOM FOR YOUR
                  IMAGINATION
                </div>
                <h1>
                  {editingId
                    ? "A legend in the making"
                    : "Make a little legend"}
                  <span className="orange-period">.</span>
                </h1>
                <p>
                  A name. A face. A little personality. The rest is up to you.
                </p>
              </div>
              <div className="heading-actions">
                {editingId && (
                  <button
                    className="button button-outline"
                    onClick={() => openStudio()}
                  >
                    <Plus size={16} />
                    New stone
                  </button>
                )}
                <button
                  className="text-button back-collection"
                  onClick={() => navigate("collection")}
                >
                  <ArrowLeft size={15} />
                  Back to collection
                </button>
              </div>
            </div>

            <div className="studio-layout">
              <form className="studio-form" onSubmit={saveDraft}>
                <section className="studio-section">
                  <div className="studio-section-heading">
                    <span className="step-number">01</span>
                    <div>
                      <h2>A little identity</h2>
                      <p>Every great character starts with a name.</p>
                    </div>
                  </div>
                  <div className="field-group">
                    <label htmlFor="stone-name">
                      Stone name<span>{draft.name.length}/24</span>
                    </label>
                    <input
                      id="stone-name"
                      placeholder="What shall we call you?"
                      maxLength={24}
                      value={draft.name}
                      required
                      onChange={(e) =>
                        setDraft({ ...draft, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="field-group">
                    <label htmlFor="stone-story">
                      A tiny backstory<span>optional</span>
                    </label>
                    <textarea
                      id="stone-story"
                      rows={2}
                      placeholder="A wandering soul with a very peculiar talent…"
                      maxLength={120}
                      value={draft.description}
                      onChange={(e) =>
                        setDraft({ ...draft, description: e.target.value })
                      }
                    />
                  </div>
                  <div className="field-group">
                    <label>Choose an element</label>
                    <div className="element-picker">
                      {Object.entries(ELEMENTS).map(([key, element]) => {
                        const Icon = ELEMENT_ICONS[key as Element];
                        return (
                          <button
                            type="button"
                            key={key}
                            className={draft.element === key ? "active" : ""}
                            aria-pressed={draft.element === key}
                            onClick={() =>
                              setDraft({ ...draft, element: key as Element })
                            }
                            style={
                              {
                                "--pick-color": element.color,
                                "--pick-pale": element.pale,
                                "--pick-ink": element.ink,
                              } as React.CSSProperties
                            }
                          >
                            <Icon size={18} strokeWidth={1.5} />
                            <span>{element.name}</span>
                          </button>
                        );
                      })}
                    </div>
                    <span className="field-note">
                      A little personality. Elements don’t change the capture
                      rules.
                    </span>
                  </div>
                </section>

                <section className="studio-section">
                  <div className="studio-section-heading">
                    <span className="step-number">02</span>
                    <div>
                      <h2>A face to remember</h2>
                      <p>Pick an illustrated friend, or bring your own.</p>
                    </div>
                  </div>
                  <div className="creature-picker">
                    {Object.entries(CREATURE_NAMES).map(([key, name]) => (
                      <button
                        type="button"
                        key={key}
                        className={
                          !draft.image && draft.creature === key ? "active" : ""
                        }
                        aria-label={`Choose ${name} artwork`}
                        aria-pressed={!draft.image && draft.creature === key}
                        onClick={() =>
                          setDraft({
                            ...draft,
                            creature: key as Creature,
                            image: undefined,
                          })
                        }
                      >
                        <CreatureArt
                          creature={key as Creature}
                          element={draft.element}
                        />
                        <span>{name}</span>
                        {!draft.image && draft.creature === key && (
                          <span className="creature-check">
                            <Check size={11} />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="upload-box">
                    <div>
                      <ImagePlus size={23} strokeWidth={1.3} />
                      <span>
                        <strong>
                          {draft.image
                            ? "Your own little masterpiece"
                            : "Have something in mind?"}
                        </strong>
                        <small>PNG, JPG, or WebP · up to 2 MB</small>
                      </span>
                    </div>
                    <button
                      className="button button-outline"
                      type="button"
                      onClick={() => imageRef.current?.click()}
                    >
                      {draft.image ? "Replace image" : "Upload artwork"}
                      <Upload size={14} />
                    </button>
                  </div>
                  {draft.image && (
                    <button
                      type="button"
                      className="text-button remove-art"
                      onClick={() => setDraft({ ...draft, image: undefined })}
                    >
                      <X size={13} />
                      Remove uploaded artwork
                    </button>
                  )}
                </section>

                <section className="studio-section">
                  <div className="studio-section-heading">
                    <span className="step-number">03</span>
                    <div>
                      <h2>A bit of an edge</h2>
                      <p>Balance your strengths. Make every point count.</p>
                    </div>
                  </div>
                  <div className="strength-controls">
                    {[ArrowUp, ArrowRight, ArrowDown, ArrowLeft].map(
                      (Icon, index) => (
                        <div className="strength-control" key={index}>
                          <label>
                            <Icon size={15} />
                            {["North", "East", "South", "West"][index]}
                          </label>
                          <div>
                            <button
                              type="button"
                              aria-label={`Decrease ${["north", "east", "south", "west"][index]} strength`}
                              disabled={draft.edges[index] === 0}
                              onClick={() =>
                                setDraft({
                                  ...draft,
                                  edges: draft.edges.map((value, i) =>
                                    i === index ? value - 1 : value,
                                  ) as Stone["edges"],
                                })
                              }
                            >
                              <Minus size={14} />
                            </button>
                            <output>{draft.edges[index]}</output>
                            <button
                              type="button"
                              aria-label={`Increase ${["north", "east", "south", "west"][index]} strength`}
                              disabled={
                                draft.edges[index] === 5 || totalPoints >= 12
                              }
                              onClick={() =>
                                setDraft({
                                  ...draft,
                                  edges: draft.edges.map((value, i) =>
                                    i === index ? value + 1 : value,
                                  ) as Stone["edges"],
                                })
                              }
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                  <div className="point-budget">
                    <div>
                      <span>YOUR POINT BUDGET</span>
                      <strong>
                        {totalPoints}
                        <span> / 12</span>
                      </strong>
                    </div>
                    <div className="budget-track">
                      {Array.from({ length: 12 }, (_, i) => (
                        <span
                          className={i < totalPoints ? "used" : ""}
                          key={i}
                        />
                      ))}
                    </div>
                    <p>
                      Up to 5 per edge, 12 in total. A clever stone has a
                      weakness, too.
                    </p>
                  </div>
                </section>
                <div className="studio-form-footer">
                  <span>
                    <Shield size={15} />
                    Saved in this browser, just for you.
                  </span>
                  <button type="submit" className="button button-dark">
                    <Check size={17} />
                    {editingId ? "Save changes" : "Save to collection"}
                  </button>
                </div>
              </form>

              <aside className="studio-preview">
                <div className="preview-sticky">
                  <div className="preview-stage">
                    <span className="eyebrow">
                      YOUR LITTLE LEGEND, IN THE MAKING
                    </span>
                    <span className="preview-star star-a">✧</span>
                    <span className="preview-star star-b">✦</span>
                    <span className="preview-star star-c">✧</span>
                    <div ref={previewRef} className="preview-card">
                      <StoneCard
                        stone={{
                          ...draft,
                          name: draft.name.trim() || "Your little legend",
                        }}
                      />
                    </div>
                    <div className="preview-stamp">
                      <span>✦</span> ONE OF A KIND<span>MADE BY YOU</span>
                    </div>
                  </div>
                  <div className="preview-caption">
                    <Sparkles size={17} />
                    <p>
                      Go on. The table could use
                      <br />a little more <em>you.</em>
                    </p>
                  </div>
                  <button
                    className="button button-outline download-preview"
                    type="button"
                    disabled={downloadBusy}
                    onClick={() =>
                      downloadImage(previewRef.current, draft.name)
                    }
                  >
                    {downloadBusy ? (
                      <LoaderCircle size={16} className="spin" />
                    ) : (
                      <Download size={16} />
                    )}
                    Download card image
                  </button>
                  <p className="preview-note">
                    Save your stone, then add it to your five-card
                    <br />
                    deck in the collection to bring it into play.
                  </p>
                </div>
              </aside>
            </div>
          </>
        )}
      </main>

      <footer className="site-footer">
        <Brand small />
        <span>Made for the joy of a good little game.</span>
        <span className="footer-note">
          An independent, fan-made tribute.
          <br />
          Not affiliated with Skylanders or Activision.
        </span>
      </footer>

      <input
        type="file"
        ref={importRef}
        accept=".json,application/json"
        aria-label="Import card file"
        className="visually-hidden"
        tabIndex={-1}
        onChange={importCard}
      />
      <input
        type="file"
        ref={imageRef}
        accept="image/png,image/jpeg,image/webp"
        aria-label="Upload card artwork"
        className="visually-hidden"
        tabIndex={-1}
        onChange={uploadImage}
      />
      {toast && (
        <div className="toast" role="status">
          <span className="toast-icon">
            <Sparkles size={17} />
          </span>
          <span>{toast}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {dialog?.kind === "rules" && (
        <Dialog
          title="How to play"
          onClose={() => setDialog(null)}
          className="rules-dialog"
        >
          <span className="modal-illustration">
            <Swords size={30} strokeWidth={1.3} />
          </span>
          <div className="eyebrow">WELCOME TO THE TABLE</div>
          <h2>
            A small board.
            <br />A clever little game.
          </h2>
          <p className="dialog-intro">
            Five stones each. Nine squares. Make them yours.
          </p>
          <ol className="rules-list">
            <li>
              <span>1</span>
              <div>
                <h3>Pick. Place. Make a little magic.</h3>
                <p>
                  Choose a stone from your hand, then an empty square. Players
                  take turns placing one stone.
                </p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <h3>A stronger edge wins.</h3>
                <p>
                  Compare each edge of your new stone to the touching edge of an
                  adjacent rival. A higher number captures their stone. Equal
                  numbers leave it as it is.
                </p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <h3>Keep it neighborly.</h3>
                <p>
                  Only edges that touch count. There are no diagonal captures or
                  chain reactions. Captured stones keep their numbers and
                  orientation.
                </p>
              </div>
            </li>
            <li>
              <span>4</span>
              <div>
                <h3>Own a little more of the board.</h3>
                <p>
                  When all nine squares are filled, whoever controls the most
                  stones wins. The last unused card doesn’t count.
                </p>
              </div>
            </li>
          </ol>
          <div className="rules-note">
            <WandSparkles size={19} />
            <p>
              Make your own stones in the Card studio. Elements and
              illustrations are for personality; edge numbers do the capturing.
            </p>
          </div>
          <button
            className="button button-dark full-width"
            onClick={() => setDialog(null)}
          >
            A little wiser. Let’s play.
            <ArrowRight size={17} />
          </button>
        </Dialog>
      )}

      {dialog?.kind === "new" && (
        <Dialog
          title="Start a new match"
          onClose={() => setDialog(null)}
          className="new-dialog"
        >
          <span className="modal-illustration">
            <Sparkles size={30} strokeWidth={1.3} />
          </span>
          <div className="eyebrow">A FRESH LITTLE START</div>
          <h2>
            Good company.
            <br />A new adventure.
          </h2>
          <p className="dialog-intro">
            Your five stones. A whole board of possibilities.
          </p>
          <div className="mode-options">
            <button
              className={newMode === "computer" ? "active" : ""}
              onClick={() => setNewMode("computer")}
            >
              <Leaf size={23} strokeWidth={1.4} />
              <strong>Meet Willow</strong>
              <span>A thoughtful computer rival</span>
              {newMode === "computer" && <Check size={15} />}
            </button>
            <button
              className={newMode === "local" ? "active" : ""}
              onClick={() => setNewMode("local")}
            >
              <Users size={23} strokeWidth={1.4} />
              <strong>Bring a friend</strong>
              <span>Two players, one screen</span>
              {newMode === "local" && <Check size={15} />}
            </button>
          </div>
          <div className="first-player-field">
            <label htmlFor="first-player">Who makes the first move?</label>
            <select
              id="first-player"
              value={newFirst}
              onChange={(e) => setNewFirst(Number(e.target.value) as Owner)}
            >
              <option value="0">
                {newMode === "computer"
                  ? "You — a little head start"
                  : "Player one — your selected deck"}
              </option>
              <option value="1">
                {newMode === "computer"
                  ? "Willow — let’s see what she has"
                  : "Player two — a shuffled starter deck"}
              </option>
            </select>
          </div>
          {newMode === "local" && (
            <p className="dialog-small-note">
              Player one uses your selected deck. Player two gets five original
              stones. Pass the screen after each move.
            </p>
          )}
          {library.deck.length !== 5 && (
            <p className="inline-warning">
              Your deck needs five stones. Visit your collection to finish it.
            </p>
          )}
          <button
            className="button button-dark full-width"
            disabled={library.deck.length !== 5}
            onClick={startMatch}
          >
            Find a little magic
            <ArrowRight size={17} />
          </button>
          {match.moves > 0 && !done && (
            <p className="dialog-small-note centered">
              Starting again will clear the current board.
            </p>
          )}
        </Dialog>
      )}

      {dialog?.kind === "card" && (
        <Dialog
          title={dialog.stone.name}
          onClose={() => setDialog(null)}
          className="card-dialog"
        >
          <div className="detail-card-stage">
            <div className="detail-card" ref={detailRef}>
              <StoneCard stone={dialog.stone} />
            </div>
          </div>
          <div className="eyebrow">
            {dialog.stone.custom
              ? "ONE OF YOUR OWN"
              : "THE ORIGINAL COLLECTION"}
          </div>
          <h2>{dialog.stone.name}</h2>
          <p className="dialog-intro">
            {dialog.stone.description ||
              "An original little legend, made by you."}
          </p>
          <div className="detail-stats">
            {["NORTH", "EAST", "SOUTH", "WEST"].map((label, i) => (
              <span key={label}>
                <small>{label}</small>
                <strong>{dialog.stone.edges[i]}</strong>
              </span>
            ))}
          </div>
          <div className="detail-actions">
            <button
              className={`button ${library.deck.includes(dialog.stone.id) ? "button-outline" : "button-dark"}`}
              onClick={() => toggleDeck(dialog.stone)}
            >
              {library.deck.includes(dialog.stone.id) ? (
                <Check size={16} />
              ) : (
                <Plus size={16} />
              )}{" "}
              {library.deck.includes(dialog.stone.id)
                ? "Remove from deck"
                : "Add to deck"}
            </button>
            {dialog.stone.custom && (
              <button
                className="button button-outline"
                onClick={() => openStudio(dialog.stone)}
              >
                <Pencil size={15} />
                Edit stone
              </button>
            )}
          </div>
          <div className="detail-utilities">
            <button
              className="text-button"
              onClick={() => exportCard(dialog.stone)}
            >
              <Download size={14} />
              Export card file
            </button>
            <button
              disabled={downloadBusy}
              className="text-button"
              onClick={() =>
                downloadImage(detailRef.current, dialog.stone.name)
              }
            >
              <ImagePlus size={14} />
              {downloadBusy ? "Preparing…" : "Save image"}
            </button>
            {dialog.stone.custom && (
              <button
                className="icon-button delete-card-button"
                aria-label={`Delete ${dialog.stone.name}`}
                onClick={() =>
                  setDialog({ kind: "delete", stone: dialog.stone })
                }
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </Dialog>
      )}

      {dialog?.kind === "delete" && (
        <Dialog
          title="Delete custom stone"
          onClose={() => setDialog(null)}
          className="delete-dialog"
        >
          <span className="modal-illustration">
            <Trash2 size={27} strokeWidth={1.3} />
          </span>
          <h2>Say a little goodbye?</h2>
          <p className="dialog-intro">
            {dialog.stone.name} will be removed from your collection and deck.
            Your current match will keep its stones. Export a card file first if
            you’d like a backup.
          </p>
          <div className="detail-actions">
            <button
              className="button button-outline"
              onClick={() => setDialog({ kind: "card", stone: dialog.stone })}
            >
              Keep this friend
            </button>
            <button
              className="button button-danger"
              onClick={() => {
                const id = dialog.stone.id;
                if (
                  saveLibrary({
                    ...library,
                    custom: library.custom.filter((s) => s.id !== id),
                    deck: library.deck.filter((value) => value !== id),
                  })
                ) {
                  if (editingId === id) {
                    setEditingId(null);
                    setDraft(freshDraft());
                  }
                  setDialog(null);
                  setToast("Your stone has been removed.");
                }
              }}
            >
              <Trash2 size={15} />
              Delete stone
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}
