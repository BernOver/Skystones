import {
  readRecipes,
  mergeRecipes,
  saveRecipes,
  RECIPES_STORAGE,
  validRecipes,
} from "./recipes";
import type { SuperchargerRecipe } from "./recipes";
import { PartsWorkshop } from "./PartsWorkshop";
import { DEFAULT_PARTS } from "./assemble";
import { TrapPanel, TrapCollection } from "./Traps";
import { trapStateFromBoard, trapEdges } from "./traps";
import type { TrapState } from "./traps";
import { assembleParts } from "./assemble";
import { uniqueCatalogue, uniqueDefinition } from "./unique";
import { cardDependencies, mergeUniqueDefinitions } from "./cardDependencies";
import { isSwapForce, swapHand } from "./swapForce";
import { collectionExport } from "./collectionExport";
import { CARD_THEMES } from "./cardThemes";
import { SwapPicker } from "./SwapPicker";
import { SwapArtSettings, useSwapArt } from "./SwapArtSettings";
import { customTribeLabels, rememberCustomTribes } from "./tribes";
import { TribeEditor, TribeSelect, TribeBadges } from "./TribeEditor";
import { hasTribe, portraitTribes } from "./tribes";
import type { Tribe } from "./tribes";
import {
  characterDefault,
  readCharacterDefaults,
  saveCharacterDefaults,
  editedCharacterDefault,
  originalCharacter,
} from "./cardDefaults";
import type { CharacterDefaults } from "./cardDefaults";
import { BoardSkins } from "./BoardSkins";
import { CharacterAvatar } from "./CharacterAvatar";
import { boardSkin, opponent, OPPONENTS } from "./presentation";
import type { BoardSkinId, OpponentId } from "./presentation";
import { CaptureFlip } from "./CaptureFlip";
import { EnvironmentLegend, NextPlayStatus, TileMark } from "./BoardEffects";
import { boardEnvironments, shiftEffectText } from "./effects";
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
  Info,
  Layers,
  Palette,
  RotateCcw,
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
import { ELEMENT_ICONS, StoneCard } from "./Artwork";
import {
  boardFinished,
  canPlace,
  playableHand,
  coordinate,
  boardSize,
  cardEdges,
  handSize,
  ELEMENTS,
  EMPTY_BOARD,
  STARTER_STONES,
  chooseMove,
  placeStone,
  score,
  evaluateKeywords,
  withNextKeywords,
  validateStone,
  prepareTargeting,
  KEYWORD_RULES,
  SIDE_NAMES,
} from "./game";
import type {
  Board,
  Element,
  Owner,
  Stone,
  KeywordTarget,
  Side,
  BoardSize,
} from "./game";
import { createId } from "./id";
import {
  CardInspector,
  InspectionDetails,
  KeywordDetails,
} from "./CardInspection";
import type { Inspection } from "./CardInspection";
import { KeywordEditor } from "./KeywordEditor";
import {
  tokenCatalogue,
  tokenDefinition,
  deckEligible,
  TOKEN_ID_PREFIX,
  DEFAULT_TOKENS,
  mergeTokenDefinitions,
} from "./tokens";
import { applyConjure, CONJURE_CARDS, conjurationSummary } from "./conjure";
import { TargetPicker } from "./TargetPicker";
import { Draft } from "./Draft";
import { Expedition } from "./Expedition";
import { GIANTS_STONES, GIANTS_REFERENCE } from "./giants";
import { CHARACTER_STONES, ENEMY_STONES } from "./characters";
import { PortraitPicker } from "./PortraitPicker";
import {
  resolveDiscards,
  DiscardSelectionRequired,
  discardSummary,
} from "./discard";
import type { DiscardChoice, DiscardPending } from "./discard";
import { DiscardPicker } from "./DiscardPicker";
import { DeckManager, DeckSelect, DeckForm } from "./DeckManager";
import type { DeckAction } from "./DeckManager";
import {
  restoreDecks,
  synchronizeDecks,
  selectSavedDeck,
  createSavedDeck,
  renameSavedDeck,
  deleteSavedDeck,
  deckForBoardSize,
} from "./decks";
import type { DeckState } from "./decks";

type Page = "table" | "collection" | "studio" | "run" | "draft";
type Mode = "computer" | "local";
type DialogState =
  | { kind: "rules" | "new" | "skins" }
  | { kind: "swap"; owner: Owner }
  | { kind: "deck"; action: DeckAction }
  | {
      kind: "discard";
      index: number;
      cardIndex: number;
      targets: KeywordTarget[];
      choices: DiscardChoice[];
      pending: DiscardPending;
    }
  | { kind: "card" | "delete"; stone: Stone }
  | { kind: "inspect"; inspection: Inspection }
  | {
      kind: "target";
      index: number;
      cardIndex: number;
      targets: KeywordTarget[];
    }
  | null;
interface Library extends DeckState {
  custom: Stone[];
  sound: boolean;
  boardSkin: BoardSkinId;
  opponent: OpponentId;
}
interface JournalEntry {
  id: number;
  owner: Owner;
  text: string;
  captured: number;
  effects: string;
}
interface Match {
  traps?: TrapState;
  recipes?: SuperchargerRecipe[];
  turnNumber?: number;
  id: string;
  board: Board;
  hands: [Stone[], Stone[]];
  current: Owner;
  mode: Mode;
  opponent: OpponentId;
  draft?: boolean;
  entries: JournalEntry[];
  moves: number;
  lastCaptured: number[];
  lastPlaced: number;
}
const STORAGE_KEY = "skystones-library-v1";
const freshDraft = (): Stone => ({
  id: "custom-draft",
  name: "",
  description: "",
  element: "magic",
  creature: "dragon",
  edges: [2, 2, 2, 2],
  custom: true,
  keywords: [],
  portrait: "spyro",
});

function readLibrary(): Library {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (
      value &&
      Array.isArray(value.custom) &&
      (Array.isArray(value.deck) || Array.isArray(value.decks))
    ) {
      const custom: Stone[] = value.custom
        .filter(validateStone)
        .filter(
          (card: Stone) =>
            !card.swapParts && !card.supercharger && !card.runtimeEffects,
        )
        .filter((card: Stone) => !card.token || tokenDefinition(card))
        .map((s: Stone) => ({ ...s, custom: true }));
      const ids = new Set(
        [...CHARACTER_STONES, ...GIANTS_STONES, ...custom]
          .filter(deckEligible)
          .map((s) => s.id),
      );
      return {
        custom,
        ...restoreDecks(value, ids),
        sound: value.sound === true,
        boardSkin: boardSkin(value.boardSkin),
        opponent: opponent(value.opponent).id,
      };
    }
  } catch {
    /* A malformed local save should never prevent the app from opening. */
  }
  return {
    custom: [],
    ...restoreDecks(
      null,
      new Set([...CHARACTER_STONES, ...GIANTS_STONES].map((card) => card.id)),
    ),
    sound: false,
    boardSkin: "giants",
    opponent: OPPONENTS[0].id,
  };
}

function createMatch(
  library: Library,
  mode: Mode = "computer",
  first: Owner = 0,
): Match {
  const collection = [...CHARACTER_STONES, ...GIANTS_STONES]
    .map((card) => characterDefault(card))
    .concat(library.custom.filter(deckEligible));
  // A half-edited saved deck must not strand the initial practice match.
  const count = handSize(library.boardSize);
  const deck =
    library.deck.length === count &&
    library.deck.every((id) => collection.some((card) => card.id === id))
      ? library.deck
      : STARTER_STONES.slice(0, count).map((s) => s.id);
  const human = deck
    .map((id) => collection.find((s) => s.id === id))
    .filter((s): s is Stone => !!s);
  const pool =
    library.boardSize === 4
      ? [...STARTER_STONES.slice(5), ...STARTER_STONES.slice(0, 5)]
      : [...STARTER_STONES.slice(5)];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const opponent = pool.slice(0, count).map((card) => characterDefault(card));
  return {
    id: createId(),
    board: EMPTY_BOARD(library.boardSize),
    recipes: readRecipes(),
    hands: [human, opponent],
    current: first,
    mode,
    opponent: library.opponent,
    entries: [],
    moves: 0,
    lastCaptured: [],
    lastPlaced: -1,
  };
}

function applyMove(
  match: Match,
  index: number,
  cardIndex: number,
  targets: KeywordTarget[] = [],
  discardChoices: DiscardChoice[] = [],
  manualDiscard = false,
): Match {
  const stone = match.hands[match.current][cardIndex];
  const seed =
    Array.from(`${match.id}:${match.moves}:${index}:${stone.id}`).reduce(
      (n, char) => Math.imul(n ^ char.charCodeAt(0), 16777619),
      2166136261,
    ) >>> 0;
  const move = placeStone(match.board, index, stone, match.current, targets, {
    seed,
    trap: match.traps?.active?.trap,
  });
  const recipes = match.recipes || readRecipes();
  const hands: [Stone[], Stone[]] = [[...match.hands[0]], [...match.hands[1]]];
  hands[match.current].splice(cardIndex, 1);
  const conjured = applyConjure(
    move.board,
    index,
    hands,
    () => CONJURE_CARDS.map((card) => characterDefault(card)),
    seed ^ 0x27d4eb2d,
    undefined,
    undefined,
    recipes,
  );
  const assembled = assembleParts(
    conjured.board,
    index,
    conjured.hands,
    seed ^ 0x71ab,
    undefined,
    recipes,
  );
  const discarded = resolveDiscards(
    assembled.board,
    index,
    assembled.hands,
    seed ^ 0x6d2b79f5,
    discardChoices,
    !manualDiscard,
  );
  if (discarded.pending) throw new DiscardSelectionRequired(discarded.pending);
  let nextOwner: Owner = move.keepsTurn
    ? match.current
    : ((1 - match.current) as Owner);
  if (
    !playableHand(discarded.hands[nextOwner]) &&
    playableHand(discarded.hands[(1 - nextOwner) as Owner])
  )
    nextOwner = (1 - nextOwner) as Owner;
  return {
    ...match,
    board: discarded.board,
    ...(trapStateFromBoard(discarded.board)
      ? { traps: trapStateFromBoard(discarded.board) }
      : {}),
    recipes,
    hands: discarded.hands,
    current: nextOwner,
    moves: match.moves + 1,
    turnNumber:
      (match.turnNumber ?? match.moves) + (nextOwner === match.current ? 0 : 1),
    lastCaptured: move.captured,
    lastPlaced: index,
    entries: [
      {
        id: match.moves,
        owner: match.current,
        text: `${stone.name} → ${coordinate(index, boardSize(match.board))}`,
        captured: move.captured.length,
        effects: [
          ...assembled.messages,
          ...(move.keepsTurn ? ["Flash: play again"] : []),
          discardSummary(
            discarded.records,
            match.mode === "local"
              ? ["Player one", "Player two"]
              : ["You", "Rival"],
          ),
          move.effects
            .map((effect) =>
              effect.type === "shift"
                ? shiftEffectText(effect, boardSize(match.board))
                : `${KEYWORD_RULES[effect.type].name} → ${coordinate(effect.target, boardSize(match.board))}${effect.type === "sunder" ? ` ${SIDE_NAMES[effect.side]} −${effect.amount ?? 1}` : ""}`,
            )
            .join(" · "),
          conjurationSummary(
            conjured.conjurations,
            match.mode === "local"
              ? ["Player one", "Player two"]
              : ["You", "Rival"],
          ),
        ]
          .filter(Boolean)
          .join(" · "),
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
  useSwapArt();
  const [page, setPage] = useState<Page>("table");
  const [library, setLibrary] = useState<Library>(readLibrary);
  const [characterDefaults, setCharacterDefaults] = useState<CharacterDefaults>(
    readCharacterDefaults,
  );
  const [editingDefaultKey, setEditingDefaultKey] = useState<string | null>(
    null,
  );
  const [match, setMatch] = useState<Match>(() => createMatch(readLibrary()));
  const [selected, setSelected] = useState<number | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [toast, setToast] = useState("");
  const [newMode, setNewMode] = useState<Mode>("computer");
  const [newFirst, setNewFirst] = useState<Owner>(0);
  const [resultDismissed, setResultDismissed] = useState(false);
  const [query, setQuery] = useState("");
  const [elementFilter, setElementFilter] = useState("all");
  const [tribeFilter, setTribeFilter] = useState<Tribe | "">("");
  const [onlyCustom, setOnlyCustom] = useState(false);
  const [onlyGiants, setOnlyGiants] = useState(false);
  const [onlyTokens, setOnlyTokens] = useState(false);
  const [extraTab, setExtraTab] = useState<"" | "traps" | "unique" | "parts">(
    "",
  );
  const [draft, setDraft] = useState<Stone>(freshDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const inspectionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingInspection = useRef<Inspection | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const lastSound = useRef("");
  const tokens = tokenCatalogue(library.custom);
  const collection = [...CHARACTER_STONES, ...GIANTS_STONES]
    .map((card) => characterDefault(card, characterDefaults))
    .concat(library.custom.filter(deckEligible), tokens);
  const uniques = uniqueCatalogue(
    library.custom,
    CONJURE_CARDS.map((c) => characterDefault(c, characterDefaults)),
  );
  const filled = match.board.filter((c) => !!c && !c.stone.supercharger).length;
  const activeTrap = match.traps?.active?.trap;
  const scores = score(match.board);
  const tileEnvironments = boardEnvironments(match.board);
  const size = boardSize(match.board);
  const capacity = handSize(library.boardSize);
  const done = boardFinished(match.board) || !match.hands.some(playableHand);
  const tied = scores[0] === scores[1];
  const aiTurn = match.mode === "computer" && match.current === 1 && !done;
  const rival = opponent(match.opponent);
  const names =
    match.mode === "computer"
      ? ["You", rival.name]
      : ["Player one", "Player two"];
  const currentHand = match.hands[match.current];
  const handOwner: Owner = match.mode === "computer" ? 0 : match.current;
  const shownHand = match.hands[handOwner];
  const visible = collection.filter(
    (s) =>
      (extraTab !== "unique" || !!s.unique) &&
      (extraTab === "parts" ? !!s.part : onlyTokens ? !!s.token : !s.token) &&
      (!onlyCustom || s.custom) &&
      (!onlyGiants || onlyCustom || s.origin === "giants") &&
      (elementFilter === "all" || s.element === elementFilter) &&
      (!tribeFilter || hasTribe(s, tribeFilter)) &&
      s.name.toLowerCase().includes(query.toLowerCase()),
  );
  const totalPoints = draft.edges.reduce((a, b) => a + b, 0);
  const draftBudget = draft.origin === "giants" ? 16 : 12;
  const winner = scores[0] > scores[1] ? 0 : 1;

  useEffect(() => {
    hideInspection();
  }, [page, dialog, match.id]);
  useEffect(() => {
    if (pendingInspection.current)
      pendingInspection.current = refreshInspection(pendingInspection.current);
    setInspection((previous) =>
      previous ? refreshInspection(previous) : null,
    );
  }, [match.moves, match.traps]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") hideInspection();
    };
    window.addEventListener("keydown", escape);
    return () => {
      if (inspectionTimer.current) clearTimeout(inspectionTimer.current);
      window.removeEventListener("keydown", escape);
    };
  }, []);

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
        if (
          current.id !== id ||
          current.current !== 1 ||
          boardFinished(current.board)
        )
          return current;
        const move = chooseMove(
          current.board,
          current.hands[1],
          current.hands[0],
          1,
          { trap: current.traps?.active?.trap },
        );
        return applyMove(current, move.index, move.cardIndex, move.targets);
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
      const allowed = new Set(
        [...CHARACTER_STONES, ...GIANTS_STONES, ...next.custom]
          .filter(deckEligible)
          .map((card) => card.id),
      );
      next = { ...next, ...synchronizeDecks(next, allowed) };
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
  function hideInspection() {
    if (inspectionTimer.current) clearTimeout(inspectionTimer.current);
    inspectionTimer.current = null;
    pendingInspection.current = null;
    setInspection(null);
  }
  function cardInspection(
    stone: Stone,
    anchor: HTMLElement,
    sourceId: string,
    boardIndex?: number,
  ): Inspection {
    const cell = boardIndex !== undefined ? match.board[boardIndex] : null;
    const player = cell ? (cell.playedBy ?? cell.owner) : handOwner;
    if (!cell) stone = withNextKeywords(stone, match.board, player);
    const resolved = cell
      ? {
          edges: cardEdges(cell),
          inheritedPips: cell.inheritedPips,
          activeKeywords: cell.activeKeywords || [],
          shields: cell.shields,
          comboActive: cell.comboActive,
          comboStates: cell.comboStates,
          comboPrevious: cell.comboPrevious,
          comboPreviousTribes: cell.comboPreviousTribes,
          grantedKeywords: cell.grantedKeywords,
        }
      : {
          ...evaluateKeywords(stone, match.board, player),
          edges: trapEdges(
            evaluateKeywords(stone, match.board, player).edges,
            stone,
            activeTrap,
          ),
        };
    const rect = anchor.getBoundingClientRect();
    return {
      stone,
      sourceId,
      anchor: { left: rect.left, right: rect.right, top: rect.top },
      anchorElement: anchor,
      ...resolved,
      played: !!cell,
      playerName: names[player],
      controllerName: cell ? names[cell.owner] : undefined,
      silenced: cell?.silenced,
      reductions: cell?.reductions,
      effects: cell?.effects,
      conjurations: cell?.conjurations,
      discards: cell?.discards,
      discardBuffs: cell?.discardBuffs,
      playerNames: names,
      dizzy: cell?.dizzy,
      trap: activeTrap,
      environment: cell?.environment,
      size,
    };
  }
  function showInspection(
    stone: Stone,
    anchor: HTMLElement,
    sourceId: string,
    boardIndex?: number,
    immediate = false,
  ) {
    if (inspectionTimer.current) clearTimeout(inspectionTimer.current);
    const value = cardInspection(stone, anchor, sourceId, boardIndex);
    pendingInspection.current = value;
    if (immediate) setInspection(value);
    else
      inspectionTimer.current = setTimeout(() => {
        const pending = pendingInspection.current;
        if (pending?.anchorElement.isConnected) setInspection(pending);
        inspectionTimer.current = null;
      }, 180);
  }
  function refreshInspection(previous: Inspection): Inspection | null {
    const anchor = document.getElementById(previous.sourceId);
    if (!anchor) return null;
    if (previous.sourceId.startsWith("board-")) {
      const index = Number(previous.sourceId.slice(6));
      const cell = match.board[index];
      return cell
        ? cardInspection(cell.stone, anchor, previous.sourceId, index)
        : null;
    }
    const stone = shownHand.find(
      (candidate) => candidate.id === previous.stone.id,
    );
    return stone ? cardInspection(stone, anchor, previous.sourceId) : null;
  }
  function navigate(next: Page) {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function openStudio(stone?: Stone) {
    setEditingDefaultKey(null);
    setDraft(stone ? { ...stone, edges: [...stone.edges] } : freshDraft());
    setEditingId(stone?.id || null);
    setDialog(null);
    navigate("studio");
  }
  function openPartStudio() {
    openStudio();
    setDraft({
      ...freshDraft(),
      name: "New Supercharger Part",
      token: true,
      part: true,
      tribes: ["superchargers"],
    });
  }
  function openTokenStudio() {
    openStudio();
    setDraft({ ...freshDraft(), token: true });
  }
  function openCharacterDefault(stone: Stone) {
    const key = stone.characterKey || stone.portrait;
    if (!key || !originalCharacter(key)) return;
    setDraft({
      ...stone,
      edges: [...stone.edges],
      keywords: structuredClone(stone.keywords || []),
    });
    setEditingId(null);
    setEditingDefaultKey(key);
    setDialog(null);
    navigate("studio");
  }
  function persistCharacterDefaults(next: CharacterDefaults): boolean {
    try {
      saveCharacterDefaults(next);
      setCharacterDefaults(next);
      return true;
    } catch {
      setToast(
        "The character defaults could not be saved. Your browser storage may be full.",
      );
      return false;
    }
  }
  function resetCharacterDefault(stone: Stone) {
    const key = stone.characterKey || stone.portrait;
    const original = originalCharacter(key);
    if (!key || !original) return;
    const next = { ...characterDefaults };
    delete next[key];
    if (persistCharacterDefaults(next)) {
      setDialog({ kind: "card", stone: original });
      setToast(
        `${original.name}'s original default restored for new games and cards.`,
      );
    }
  }
  function startMatch() {
    if (library.deck.length !== capacity) {
      setToast(
        `Choose exactly ${capacity} stones in your collection to start a match.`,
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
    if (aiTurn || done || !canPlace(match.board, index) || selected === null)
      return;
    const stone = match.hands[match.current][selected];
    if (
      prepareTargeting(match.board, stone, [], match.current, index).pending
    ) {
      setDialog({ kind: "target", index, cardIndex: selected, targets: [] });
      return;
    }
    commitMove(index, selected);
  }
  function commitMove(
    index: number,
    cardIndex: number,
    targets: KeywordTarget[] = [],
    choices: DiscardChoice[] = [],
  ) {
    try {
      setMatch(applyMove(match, index, cardIndex, targets, choices, true));
      setSelected(null);
      setDialog(null);
    } catch (error) {
      if (error instanceof DiscardSelectionRequired)
        setDialog({
          kind: "discard",
          index,
          cardIndex,
          targets,
          choices,
          pending: error.pending,
        });
      else
        setToast(
          error instanceof Error
            ? error.message
            : "That card could not be played.",
        );
    }
  }
  function chooseTarget(boardIndex: number, side?: Side) {
    if (dialog?.kind !== "target") return;
    const stone = match.hands[match.current][dialog.cardIndex];
    const state = prepareTargeting(
      match.board,
      stone,
      dialog.targets,
      match.current,
      dialog.index,
    );
    if (
      !state.pending ||
      !state.pending.options.some(
        (option) => option.boardIndex === boardIndex && option.side === side,
      )
    )
      return;
    const targets = [
      ...dialog.targets,
      {
        keywordIndex: state.pending.keywordIndex,
        boardIndex,
        ...(side !== undefined ? { side } : {}),
      },
    ];
    if (
      prepareTargeting(match.board, stone, targets, match.current, dialog.index)
        .pending
    ) {
      setDialog({ ...dialog, targets });
    } else {
      commitMove(dialog.index, dialog.cardIndex, targets);
    }
  }
  function toggleDeck(stone: Stone) {
    if (!deckEligible(stone)) {
      setToast(
        "Tokens are available through Conjure or custom enemy starting hands.",
      );
      return;
    }
    const included = library.deck.includes(stone.id);
    if (!included && library.deck.length >= capacity) {
      setToast(
        `${capacity} stones make a deck. Remove one first to make room for a new friend.`,
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
  function changeBoardSize(next: BoardSize) {
    saveLibrary({
      ...library,
      ...deckForBoardSize(
        library,
        next,
        collection.filter(deckEligible).map((stone) => stone.id),
        `deck-${createId()}`,
      ),
    });
  }
  function switchDeck(id: string) {
    saveLibrary({ ...library, ...selectSavedDeck(library, id) });
  }
  function manageDeck(
    action: DeckAction,
    name: string,
    size: BoardSize,
  ): boolean {
    const next =
      action === "delete"
        ? deleteSavedDeck(library)
        : action === "rename"
          ? renameSavedDeck(library, name)
          : createSavedDeck(
              library,
              `deck-${createId()}`,
              name,
              action === "duplicate",
              size,
            );
    if (!saveLibrary({ ...library, ...next })) return false;
    setDialog(null);
    setToast(
      action === "delete"
        ? "Deck deleted. Your cards are still in the collection."
        : `“${name.trim()}” saved.`,
    );
    return true;
  }
  function saveDraft(event: React.FormEvent) {
    event.preventDefault();
    if (editingDefaultKey) {
      try {
        const next = editedCharacterDefault(
          editingDefaultKey,
          { ...draft, name: draft.name.trim() },
          characterDefaults,
        );
        if (persistCharacterDefaults(next)) {
          setDraft(
            characterDefault(originalCharacter(editingDefaultKey)!, next),
          );
          setToast(
            `${originalCharacter(editingDefaultKey)!.name}'s default saved for new games and newly generated cards in every mode.`,
          );
        }
      } catch (error) {
        setToast(
          error instanceof Error
            ? error.message
            : "Choose valid card settings.",
        );
      }
      return;
    }
    const stone: Stone = {
      ...draft,
      name: draft.name.trim(),
      id: draft.token
        ? editingId?.startsWith(TOKEN_ID_PREFIX)
          ? editingId
          : `${TOKEN_ID_PREFIX}${createId()}`
        : editingId || `custom-${createId()}`,
      custom: true,
    };
    if (!validateStone(stone)) {
      setToast(
        `Give your stone a name and use no more than ${draftBudget} edge points.`,
      );
      return;
    }
    const custom = [
      ...library.custom.filter(
        (card) => card.id !== editingId && card.id !== stone.id,
      ),
      stone,
    ];
    if (saveLibrary({ ...library, custom })) {
      setEditingId(stone.id);
      setDraft(stone);
      setToast(
        stone.token
          ? `${stone.name} is saved as a token template. Use it in Conjure or the Adventure workshop.`
          : `${stone.name} is saved to your collection. A little legend is born!`,
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
  function exportAllCards() {
    try {
      const report = collectionExport(library.custom, characterDefaults);
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(report, null, 2)], {
          type: "application/json",
        }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "Skystones-all-cards.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setToast(
        `Exported ${report.cards.length} cards and ${report.tokens.length} token templates, including ${report.summary.editedCharacters} edited character defaults. Share the JSON file for review.`,
      );
    } catch {
      setToast("Your collection could not be exported. Try downloading again.");
    }
  }
  function exportCard(stone: Stone) {
    const card = {
      ...stone,
      id: stone.custom ? stone.id : `custom-${stone.id}`,
      custom: true,
    };
    let dependencies: Stone[],
      uniqueDependencies: Stone[],
      recipeDependencies: SuperchargerRecipe[];
    try {
      const bundle = cardDependencies(card, tokens, uniques);
      dependencies = bundle.tokens;
      uniqueDependencies = bundle.uniques;
      recipeDependencies = bundle.recipes;
    } catch (error) {
      setToast((error as Error).message);
      return;
    }
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            {
              format: "skystones-card",
              version: 1,
              card,
              customTribes: customTribeLabels([
                card,
                ...dependencies,
                ...uniqueDependencies,
              ]),
              ...(uniqueDependencies.length
                ? { uniques: uniqueDependencies }
                : {}),
              ...(dependencies.length ? { tokens: dependencies } : {}),
              ...(recipeDependencies.length
                ? { recipes: recipeDependencies }
                : {}),
            },
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
    if (file.size > 16_000_000) {
      setToast(
        "That card file is too large. The limit is 16 MB, including token templates.",
      );
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
        id: payload.card.token
          ? tokenDefinition(payload.card)
            ? payload.card.id
            : `${TOKEN_ID_PREFIX}${createId()}`
          : payload.card.unique && uniqueDefinition(payload.card)
            ? payload.card.id
            : `custom-${createId()}`,
        custom: true,
        conjured: undefined,
        encounterStart: undefined,
        receivedKeywords: undefined,
        receivedElement: undefined,
        discardBuffs: undefined,
        swapParts: undefined,
        supercharger: undefined,
        runtimeEffects: undefined,
      };
      if (!validateStone(stone))
        throw new Error(
          "This battle copy exceeds the card maker’s base pip budget.",
        );
      const importedTokens = payload.tokens === undefined ? [] : payload.tokens;
      if (!Array.isArray(importedTokens))
        throw new Error("Invalid token bundle");
      let custom = mergeTokenDefinitions(library.custom, [
        ...importedTokens,
        ...(stone.token ? [stone] : []),
      ]);
      const importedUniques = payload.uniques || [];
      custom = mergeUniqueDefinitions(custom, [
        ...importedUniques,
        ...(stone.unique ? [stone] : []),
      ]);
      if (stone.unique && !uniqueDefinition(stone))
        throw new Error("Invalid Unique card");
      const importedRecipes = payload.recipes || [];
      if (!validRecipes(importedRecipes)) throw new Error("Invalid recipes");
      const recipes = mergeRecipes(readRecipes(), importedRecipes);
      if (
        importedRecipes.some((r) =>
          r.parts.some(
            (key) =>
              !tokenCatalogue(custom).some((c) => c.part && c.id === key),
          ),
        )
      )
        throw new Error("A recipe Part is missing.");
      cardDependencies(
        stone,
        tokenCatalogue(custom),
        uniqueCatalogue(
          custom,
          CONJURE_CARDS.map((c) => characterDefault(c)),
        ),
        recipes,
      );
      rememberCustomTribes(
        [stone, ...importedTokens, ...importedUniques],
        payload.customTribes,
      );
      const previousRecipes = localStorage.getItem(RECIPES_STORAGE);
      if (importedRecipes.length) saveRecipes(recipes);
      if (
        saveLibrary({
          ...library,
          custom: stone.token || stone.unique ? custom : [...custom, stone],
        })
      ) {
        setToast(`${stone.name} has joined your collection.`);
        setExtraTab(stone.unique ? "unique" : "");
        setOnlyCustom(!stone.token);
        setOnlyTokens(!!stone.token);
        setOnlyGiants(false);
        setQuery("");
        setElementFilter("all");
        setTribeFilter("");
        navigate("collection");
      } else if (importedRecipes.length) {
        if (previousRecipes === null) localStorage.removeItem(RECIPES_STORAGE);
        else localStorage.setItem(RECIPES_STORAGE, previousRecipes);
      }
    } catch {
      setToast(
        "This is not a valid Skystones card file. Import a .skystone.json export with valid edge stats and keywords.",
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
              <span className="nav-count">
                {collection.filter(deckEligible).length}
              </span>
            </button>
            <button
              className={page === "studio" ? "active" : ""}
              onClick={() => navigate("studio")}
            >
              <WandSparkles size={18} />
              <span>Card studio</span>
            </button>
            <button
              className={page === "run" ? "active" : ""}
              onClick={() => navigate("run")}
            >
              <Swords size={17} />
              <span>Adventure</span>
            </button>
            <button
              className={page === "draft" ? "active" : ""}
              onClick={() => navigate("draft")}
            >
              <Users size={17} />
              <span>Draft</span>
            </button>
          </nav>
          <div className="header-actions">
            <button
              className="board-skins-button"
              aria-label="Board skins"
              title="Board skins"
              onClick={() => setDialog({ kind: "skins" })}
            >
              <Palette size={18} />
              <span>Board skins</span>
            </button>
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
        {page === "run" && (
          <Expedition skin={library.boardSkin} customCards={library.custom} />
        )}
        {page === "draft" && (
          <Draft
            onPlay={(draftSize, hands) => {
              setMatch({
                id: createId(),
                board: EMPTY_BOARD(draftSize),
                hands,
                current: 0,
                mode: "local",
                opponent: library.opponent,
                draft: true,
                entries: [],
                moves: 0,
                lastCaptured: [],
                lastPlaced: -1,
              });
              setSelected(null);
              setDialog(null);
              navigate("table");
            }}
          />
        )}
        {page === "table" && (
          <>
            <div className="page-heading">
              <div>
                <div className="eyebrow">
                  <span className="tiny-star">✦</span> A LITTLE STRATEGY. A
                  LITTLE MAGIC.
                </div>
                <h1>
                  {match.draft ? "Draft showdown" : "Make your move"}
                  <span className="orange-period">.</span>
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
                    <span>·</span>
                    {size} × {size}
                  </span>
                </div>
                <div className="arena" data-board-skin={library.boardSkin}>
                  <div className="player-strip">
                    <div
                      className={`player player-one ${!done && match.current === 0 ? "player-active" : ""}`}
                    >
                      <CharacterAvatar
                        id="spyro"
                        name={
                          match.mode === "computer"
                            ? "Spyro"
                            : "Player one · Spyro"
                        }
                      />
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
                        <span className="player-name">{names[1]}</span>
                        <span className="player-subtitle">
                          {match.hands[1].length} stones in hand
                        </span>
                      </div>
                      <CharacterAvatar
                        id={rival.id}
                        name={rival.name}
                        color={rival.color}
                      />
                    </div>
                  </div>

                  <TrapPanel
                    state={match.traps}
                    board={match.board}
                    owner={match.current}
                  />
                  <div className="board-wrap">
                    <span className="board-decoration decoration-one">✧</span>
                    <span className="board-decoration decoration-two">✦</span>
                    <div
                      className={`game-board board-size-${size} ${selected !== null && !aiTurn && !done ? "ready-to-place" : ""}`}
                      data-board-skin={library.boardSkin}
                      role="group"
                      aria-label={`Game board, ${size === 3 ? "three rows and three columns" : "four rows and four columns"}`}
                    >
                      {match.board.map((cell, index) => (
                        <button
                          key={`${index}-${cell?.owner ?? "empty"}`}
                          id={`board-${index}`}
                          className={`board-cell ${tileEnvironments[index] ? "has-environment" : ""} ${cell ? "filled" : "empty"} ${match.lastCaptured.includes(index) ? "just-captured" : ""} ${match.lastPlaced === index ? "just-placed" : ""}`}
                          aria-label={
                            cell
                              ? `${coordinate(index, size)}: ${cell.stone.name}, controlled by ${names[cell.owner]}, edges north ${cardEdges(cell)[0]}, east ${cardEdges(cell)[1]}, south ${cardEdges(cell)[2]}, west ${cardEdges(cell)[3]}.${cell.silenced ? " Silenced." : ""} Inspect card.`
                              : `${coordinate(index, size)}, empty square`
                          }
                          disabled={
                            canPlace(match.board, index) &&
                            (aiTurn || done || selected === null)
                          }
                          aria-describedby={
                            inspection?.sourceId === `board-${index}`
                              ? "card-inspector"
                              : undefined
                          }
                          onPointerEnter={(event) => {
                            if (cell && event.pointerType !== "touch")
                              showInspection(
                                cell.stone,
                                event.currentTarget,
                                `board-${index}`,
                                index,
                              );
                          }}
                          onPointerLeave={hideInspection}
                          onFocus={(event) => {
                            if (
                              cell &&
                              event.currentTarget.matches(":focus-visible")
                            )
                              showInspection(
                                cell.stone,
                                event.currentTarget,
                                `board-${index}`,
                                index,
                                true,
                              );
                          }}
                          onBlur={hideInspection}
                          onClick={(event) =>
                            cell &&
                            !(
                              cell.stone.supercharger &&
                              selected !== null &&
                              !aiTurn &&
                              !done
                            )
                              ? setDialog({
                                  kind: "inspect",
                                  inspection: cardInspection(
                                    cell.stone,
                                    event.currentTarget,
                                    `board-${index}`,
                                    index,
                                  ),
                                })
                              : playAt(index)
                          }
                        >
                          {cell ? (
                            <CaptureFlip
                              key={`${index}-${cell.owner}`}
                              captured={match.lastCaptured.includes(index)}
                              owner={cell.owner}
                            >
                              <StoneCard
                                stone={cell.stone}
                                played
                                owner={cell.owner}
                                edges={cardEdges(cell)}
                                environment={cell.environment}
                                trap={activeTrap}
                                shields={cell.shields}
                                silenced={cell.silenced}
                                compact
                              />
                            </CaptureFlip>
                          ) : (
                            <>
                              <span className="cell-coordinate">
                                {coordinate(index, size)}
                              </span>
                              <Plus
                                className="cell-plus"
                                size={22}
                                strokeWidth={1}
                              />
                              <span className="place-label">Place stone</span>
                            </>
                          )}
                          {cell?.stone.supercharger && (
                            <span className="supercharger-cover">
                              {selected !== null
                                ? "Cover & inherit"
                                : "Supercharger · coverable"}
                            </span>
                          )}
                          <TileMark environment={tileEnvironments[index]} />
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
                            {tied
                              ? "An even match."
                              : winner === 0
                                ? match.mode === "computer"
                                  ? "Your little victory."
                                  : "Player one wins!"
                                : match.mode === "computer"
                                  ? `${rival.name} takes this one.`
                                  : "Player two wins!"}
                          </h2>
                          <p>
                            {tied ? "Each player" : names[winner]} controlled{" "}
                            {scores[winner]} of {match.board.length}
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

                  <EnvironmentLegend board={match.board} />
                  <NextPlayStatus board={match.board} names={names} />
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
                          <strong>{rival.name} is thinking</strong>
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
                    {selected !== null && !aiTurn && shownHand[selected] && (
                      <button
                        className="text-button inspect-selected"
                        onClick={(event) =>
                          setDialog({
                            kind: "inspect",
                            inspection: cardInspection(
                              shownHand[selected],
                              event.currentTarget,
                              `hand-${shownHand[selected].id}`,
                            ),
                          })
                        }
                      >
                        <Info size={13} />
                        Inspect selected
                      </button>
                    )}
                    <button
                      className="text-button"
                      onClick={() => navigate("collection")}
                    >
                      Edit your deck
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                  <div
                    className={`hand-cards hand-size-${handSize(size)} ${shownHand.length > handSize(size) ? "expanded-hand" : ""}`}
                  >
                    {shownHand.map((stone, index) => (
                      <button
                        id={`hand-${stone.id}`}
                        className={`hand-card-button ${selected === index && !aiTurn ? "is-selected" : ""}`}
                        aria-label={`Select ${stone.name}, current strengths north, east, south, west: ${trapEdges(evaluateKeywords(stone, match.board, handOwner).edges, withNextKeywords(stone, match.board, handOwner), activeTrap).join(", ")}`}
                        aria-pressed={selected === index && !aiTurn}
                        aria-disabled={aiTurn || done || !!stone.part}
                        disabled={!!stone.part}
                        aria-describedby={
                          inspection?.sourceId === `hand-${stone.id}`
                            ? "card-inspector"
                            : undefined
                        }
                        onPointerEnter={(event) => {
                          if (event.pointerType !== "touch")
                            showInspection(
                              stone,
                              event.currentTarget,
                              `hand-${stone.id}`,
                            );
                        }}
                        onPointerLeave={hideInspection}
                        onFocus={(event) => {
                          if (event.currentTarget.matches(":focus-visible"))
                            showInspection(
                              stone,
                              event.currentTarget,
                              `hand-${stone.id}`,
                              undefined,
                              true,
                            );
                        }}
                        onBlur={hideInspection}
                        key={stone.id}
                        onClick={() =>
                          !aiTurn &&
                          !done &&
                          !stone.part &&
                          setSelected(selected === index ? null : index)
                        }
                      >
                        <StoneCard
                          trap={activeTrap}
                          stone={withNextKeywords(
                            stone,
                            match.board,
                            handOwner,
                          )}
                          grantedKeywords={
                            evaluateKeywords(stone, match.board, handOwner)
                              .grantedKeywords
                          }
                          selected={selected === index && !aiTurn}
                          edges={trapEdges(
                            evaluateKeywords(stone, match.board, handOwner)
                              .edges,
                            withNextKeywords(stone, match.board, handOwner),
                            activeTrap,
                          )}
                          shields={
                            evaluateKeywords(stone, match.board, handOwner)
                              .shields
                          }
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
                  {shownHand.some(isSwapForce) && (
                    <button
                      className="button button-outline swap-action-button"
                      disabled={
                        aiTurn ||
                        done ||
                        shownHand.filter(isSwapForce).length < 2
                      }
                      onClick={() => {
                        hideInspection();
                        setDialog({ kind: "swap", owner: match.current });
                      }}
                    >
                      Swap Force · exchange halves
                    </button>
                  )}
                  <p className="hand-hint">
                    {selected !== null && !aiTurn
                      ? "A little courage. Choose your square."
                      : "Hover or focus a stone for a closer look. Tap a board stone to inspect."}
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
                    aria-label={`${scores[0]} blue stones, ${scores[1]} orange stones, ${match.board.length - filled} empty squares`}
                  >
                    {Array.from({ length: match.board.length }, (_, i) => (
                      <span
                        key={i}
                        className={
                          i < scores[0]
                            ? "blue"
                            : i >= match.board.length - scores[1]
                              ? "orange"
                              : ""
                        }
                      />
                    ))}
                  </div>
                  <div className="board-progress">
                    <span>
                      {filled} of {match.board.length} squares filled
                    </span>
                    <span>
                      {done
                        ? "Complete"
                        : `${match.board.length - filled} to go`}
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
                              {entry.effects && ` · ${entry.effects}`}
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
                <p>Old friends, new legends, and your next deck.</p>
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
                  className="button button-outline"
                  title="Download every card, edited character default, and token template in one collection report. Includes cards hidden by filters."
                  onClick={exportAllCards}
                >
                  <Download size={16} />
                  Export all cards
                </button>
                <button
                  className="button button-dark"
                  onClick={() =>
                    extraTab === "parts"
                      ? openPartStudio()
                      : onlyTokens
                        ? openTokenStudio()
                        : openStudio()
                  }
                >
                  <Plus size={17} />
                  {extraTab === "parts"
                    ? "Create a Part"
                    : onlyTokens
                      ? "Create a token"
                      : "Create a stone"}
                </button>
              </div>
            </div>

            <DeckManager
              state={library}
              onSelect={switchDeck}
              onAction={(action) => setDialog({ kind: "deck", action })}
            />
            <section className="deck-shelf">
              <div className="deck-intro">
                <span className="eyebrow">YOUR NEXT ADVENTURE</span>
                <h2>{capacity === 5 ? "Five" : "Eight"} good friends.</h2>
                <label className="board-size-label">
                  Deck board size
                  <select
                    aria-label="Deck board size"
                    value={library.boardSize}
                    onChange={(event) =>
                      changeBoardSize(Number(event.target.value) as BoardSize)
                    }
                  >
                    <option value="3">3×3 · 5 cards</option>
                    <option value="4">4×4 · 8 cards</option>
                  </select>
                </label>
                <p>
                  Build your deck for the next match.
                  <br />
                  Your current game stays as it is.
                </p>
                <span
                  className={`deck-count ${library.deck.length < capacity ? "incomplete" : ""}`}
                >
                  <Layers size={15} />
                  {library.deck.length} / {capacity} stones selected
                </span>
              </div>
              <div className="deck-slots">
                {Array.from({ length: capacity }, (_, index) => {
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
                disabled={library.deck.length !== capacity}
                onClick={() => setDialog({ kind: "new" })}
              >
                Let’s play
                <ArrowRight size={17} />
              </button>
            </section>

            <div className="collection-toolbar">
              <div className="collection-tabs">
                <button
                  className={
                    !onlyCustom && !onlyGiants && !onlyTokens && !extraTab
                      ? "active"
                      : ""
                  }
                  onClick={() => {
                    setExtraTab("");
                    setOnlyCustom(false);
                    setOnlyGiants(false);
                    setOnlyTokens(false);
                  }}
                >
                  All stones
                  <span>{collection.filter(deckEligible).length}</span>
                </button>
                <button
                  className={
                    onlyGiants && !onlyCustom && !onlyTokens ? "active" : ""
                  }
                  onClick={() => {
                    setExtraTab("");
                    setOnlyGiants(true);
                    setOnlyCustom(false);
                    setOnlyTokens(false);
                  }}
                >
                  Giants<span>{GIANTS_STONES.length}</span>
                </button>
                <button
                  className={onlyCustom ? "active" : ""}
                  onClick={() => {
                    setExtraTab("");
                    setOnlyCustom(true);
                    setOnlyTokens(false);
                  }}
                >
                  My creations
                  <span>{library.custom.filter(deckEligible).length}</span>
                </button>
                <button
                  className={onlyTokens ? "active" : ""}
                  onClick={() => {
                    setExtraTab("");
                    setOnlyTokens(true);
                    setOnlyCustom(false);
                    setOnlyGiants(false);
                  }}
                >
                  Tokens<span>{tokens.length}</span>
                </button>
                <button
                  className={extraTab === "unique" ? "active" : ""}
                  onClick={() => {
                    setExtraTab("unique");
                    setOnlyTokens(false);
                    setOnlyCustom(false);
                    setOnlyGiants(false);
                  }}
                >
                  Unique<span>{collection.filter((c) => c.unique).length}</span>
                </button>
                <button
                  className={extraTab === "parts" ? "active" : ""}
                  onClick={() => {
                    setExtraTab("parts");
                    setOnlyTokens(false);
                    setOnlyGiants(false);
                    setOnlyCustom(false);
                  }}
                >
                  Parts & recipes
                  <span>{tokens.filter((c) => c.part).length}</span>
                </button>
                <button
                  className={extraTab === "traps" ? "active" : ""}
                  onClick={() => {
                    setExtraTab("traps");
                    setOnlyTokens(false);
                    setOnlyCustom(false);
                    setOnlyGiants(false);
                  }}
                >
                  Traps
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
                <div className="tribe-filter">
                  <TribeSelect
                    label="Filter by tribe"
                    value={tribeFilter}
                    onChange={setTribeFilter}
                    empty="All tribes"
                  />
                </div>
              </div>
            </div>

            {elementFilter !== "all" && (
              <aside
                className="element-card-theme"
                data-element={elementFilter}
              >
                <strong>
                  {ELEMENTS[elementFilter as Element].name} ·{" "}
                  {CARD_THEMES[elementFilter as Element].title}
                </strong>
                <p>{CARD_THEMES[elementFilter as Element].description}</p>
              </aside>
            )}
            {onlyTokens && (
              <p className="tokens-note">
                Tokens are available through Conjure or custom enemy starting
                hands. Create or edit templates here; they cannot enter normal
                decks, Draft pools, or Adventure packs, rewards, and shops.
              </p>
            )}
            {onlyGiants && !onlyCustom && !onlyTokens && (
              <p className="giants-reference-note">
                {GIANTS_STONES.length} unique Giants opponents. Numbered ranks
                have been consolidated into one card per character.{" "}
                <a href={GIANTS_REFERENCE} target="_blank" rel="noreferrer">
                  Community card reference
                </a>
              </p>
            )}
            {extraTab === "parts" && (
              <PartsWorkshop
                parts={tokens.filter((c) => c.part)}
                onCreate={openPartStudio}
                onEdit={openStudio}
              />
            )}
            {extraTab === "traps" ? (
              <TrapCollection />
            ) : visible.length ? (
              <div className="collection-grid">
                {visible.map((stone) => {
                  const Icon = ELEMENT_ICONS[stone.element];
                  const included = library.deck.includes(stone.id);
                  return (
                    <article className="collection-item" key={stone.id}>
                      <div className="collection-card-stage">
                        <span className="collection-badge">
                          {stone.unique ? (
                            "UNIQUE"
                          ) : stone.part ? (
                            "PART"
                          ) : stone.token ? (
                            "TOKEN"
                          ) : stone.custom ? (
                            <>
                              <Sparkles size={11} />
                              MADE BY YOU
                            </>
                          ) : stone.origin === "giants" ? (
                            "GIANTS OPPONENT"
                          ) : (
                            "SKYLANDERS"
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
                        {deckEligible(stone) && (
                          <button
                            className={`deck-toggle ${included ? "in-deck" : ""}`}
                            aria-label={`${included ? "Remove" : "Add"} ${stone.name} ${included ? "from" : "to"} deck`}
                            onClick={() => toggleDeck(stone)}
                          >
                            {included ? (
                              <Check size={17} />
                            ) : (
                              <Plus size={17} />
                            )}
                          </button>
                        )}
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
                      : (setQuery(""),
                        setElementFilter("all"),
                        setTribeFilter(""))
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
                  {editingDefaultKey
                    ? "Edit character default"
                    : editingId
                      ? "A legend in the making"
                      : "Make a little legend"}
                  <span className="orange-period">.</span>
                </h1>
                <p>
                  {editingDefaultKey
                    ? `Default for ${originalCharacter(editingDefaultKey)?.name}. Used in new normal games, Draft pools, and newly generated Adventure cards. Existing games and run upgrades keep their saved cards.`
                    : "A name. A face. A little personality. The rest is up to you."}
                </p>
              </div>
              <div className="heading-actions">
                {(editingId || editingDefaultKey) && (
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
                  {!editingDefaultKey && (
                    <div className="field-group token-type-field">
                      <label>
                        <input
                          type="checkbox"
                          aria-label="Token only · available through Conjure"
                          checked={!!draft.token}
                          disabled={!!editingId?.startsWith(TOKEN_ID_PREFIX)}
                          onChange={(event) =>
                            setDraft({
                              ...draft,
                              token: event.target.checked ? true : undefined,
                              unique: undefined,
                              part: undefined,
                            })
                          }
                        />{" "}
                        Token only · available through Conjure
                      </label>
                      <p>
                        A token is a reusable template for Conjure. Its pips,
                        element, tribes, portrait, and keywords work normally
                        once generated. It cannot be put in a starting deck.
                        Saved token templates keep this card type.
                      </p>
                    </div>
                  )}
                  <div className="field-group token-type-field">
                    <label>
                      <input
                        type="checkbox"
                        aria-label="Unique card · excluded from normal Conjure"
                        checked={!!draft.unique}
                        disabled={!!editingId?.startsWith(TOKEN_ID_PREFIX)}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            unique: e.target.checked ? true : undefined,
                            token: undefined,
                            part: undefined,
                          })
                        }
                      />{" "}
                      Unique card · excluded from normal Conjure
                    </label>
                    <p>
                      Playable in normal decks. Generate it only through an
                      explicit Unique Conjure source.
                    </p>
                  </div>
                  {draft.token && (
                    <div className="field-group token-type-field">
                      <label>
                        <input
                          type="checkbox"
                          aria-label="Part token · Assemble pool"
                          checked={!!draft.part}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              part: e.target.checked ? true : undefined,
                            })
                          }
                        />{" "}
                        Part token · Assemble pool
                      </label>
                      <p>
                        Two Parts combine automatically. Parts cannot be played
                        individually.
                      </p>
                    </div>
                  )}
                  <div className="field-group">
                    <label htmlFor="stone-name">
                      Stone name
                      <span>
                        {draft.name.length}/{draft.origin ? 40 : 24}
                      </span>
                    </label>
                    <input
                      id="stone-name"
                      placeholder="What shall we call you?"
                      maxLength={draft.origin ? 40 : 24}
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
                      Elements power Resonance. Captures still compare facing
                      pips.
                    </span>
                  </div>
                </section>

                <section className="studio-section">
                  <div className="studio-section-heading">
                    <span className="step-number">02</span>
                    <div>
                      <h2>A face to remember</h2>
                      <p>Search Skylanders portraits, or upload your own.</p>
                    </div>
                  </div>
                  <PortraitPicker
                    selected={draft.portrait}
                    onChoose={(portrait) => {
                      const original = ENEMY_STONES.find(
                        (stone) => stone.portrait === portrait.id,
                      );
                      setDraft({
                        ...draft,
                        portrait: portrait.id,
                        tribes: [...portraitTribes(portrait.id)],
                        image: undefined,
                        element: portrait.element,
                        name: portrait.name,
                        origin: original ? "giants" : "skylanders",
                        edges: original ? [...original.edges] : draft.edges,
                      });
                    }}
                  />
                  <TribeEditor
                    stone={draft}
                    onChange={(tribes) => setDraft({ ...draft, tribes })}
                  />
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
                      onClick={() =>
                        setDraft({
                          ...draft,
                          image: undefined,
                          portrait: undefined,
                        })
                      }
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
                                draft.edges[index] === 5 ||
                                totalPoints >= draftBudget
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
                        <span> / {draftBudget}</span>
                      </strong>
                    </div>
                    <div className="budget-track">
                      {Array.from({ length: draftBudget }, (_, i) => (
                        <span
                          className={i < totalPoints ? "used" : ""}
                          key={i}
                        />
                      ))}
                    </div>
                    <p>
                      Up to 5 per edge, {draftBudget} in total. A clever stone
                      has a weakness, too.
                    </p>
                  </div>
                </section>
                <KeywordEditor
                  stone={draft}
                  onChange={(keywords) => setDraft({ ...draft, keywords })}
                />
                <div className="studio-form-footer">
                  <span>
                    <Shield size={15} />
                    Saved in this browser, just for you.
                  </span>
                  <button type="submit" className="button button-dark">
                    <Check size={17} />
                    {editingDefaultKey
                      ? "Save character default"
                      : editingId
                        ? "Save changes"
                        : draft.token
                          ? "Save token template"
                          : "Save to collection"}
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
                    {draft.token
                      ? "Save your token, then choose Conjure → Specified token on another card to generate it during a battle."
                      : "Save your stone, then add it to your battle deck in the collection to bring it into play."}
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

      {inspection && !dialog && page === "table" && (
        <CardInspector inspection={inspection} />
      )}

      {dialog?.kind === "discard" && (
        <Dialog
          title="Choose cards to discard"
          onClose={() => setDialog(null)}
          className="discard-dialog"
        >
          <DiscardPicker
            key={`${dialog.pending.keywordIndex}-${dialog.pending.owner}`}
            pending={dialog.pending}
            names={names}
            onCancel={() => setDialog(null)}
            onConfirm={(cardIds) =>
              commitMove(dialog.index, dialog.cardIndex, dialog.targets, [
                ...dialog.choices,
                {
                  keywordIndex: dialog.pending.keywordIndex,
                  owner: dialog.pending.owner,
                  cardIds,
                },
              ])
            }
          />
        </Dialog>
      )}
      {dialog?.kind === "inspect" && (
        <Dialog
          title={`Inspect ${dialog.inspection.stone.name}`}
          onClose={() => setDialog(null)}
          className="card-dialog inspection-dialog"
        >
          <div className="detail-card-stage">
            <div className="detail-card">
              <StoneCard
                stone={dialog.inspection.stone}
                played={dialog.inspection.played}
                grantedKeywords={dialog.inspection.grantedKeywords}
                edges={dialog.inspection.edges}
                shields={dialog.inspection.shields}
                environment={dialog.inspection.environment}
                silenced={dialog.inspection.silenced}
              />
            </div>
          </div>
          <div className="eyebrow">A CLOSER LOOK</div>
          <h2>{dialog.inspection.stone.name}</h2>
          <InspectionDetails inspection={dialog.inspection} />
          <button
            className="button button-dark full-width"
            onClick={() => setDialog(null)}
          >
            Back to the table
            <ArrowRight size={16} />
          </button>
        </Dialog>
      )}

      {dialog?.kind === "target" && (
        <Dialog
          title="Choose keyword target"
          onClose={() => setDialog(null)}
          className="target-dialog"
        >
          <TargetPicker
            owner={match.current}
            key={dialog.targets.length}
            board={match.board}
            stone={match.hands[match.current][dialog.cardIndex]}
            placement={dialog.index}
            targets={dialog.targets}
            names={names}
            onChoose={chooseTarget}
            onCancel={() => setDialog(null)}
          />
        </Dialog>
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
          <p>
            <strong>Traps:</strong> one shared crystal affects both players’
            matching cards. The slot starts empty. Playing a stone with a Trap
            keyword places its chosen crystal before captures; a later stone’s
            Trap replaces it. Collection → Traps lets you customize crystals.
          </p>
          <p>
            <strong>Unique:</strong> a deck card type excluded from normal
            Conjure. Only an explicit Unique source can generate these cards.
          </p>
          <p>
            <strong>Assemble:</strong> generate random Parts or specified Part
            templates. Collection → Parts & recipes lets you create and edit
            Parts and choose a fixed Supercharger for a pair in either order.
            Two Parts automatically build a pictured Supercharger with both sets
            of pips and keywords. Its Flash play keeps your turn. Either player
            can cover it to inherit its pips and other keywords, which trigger
            again. Flash is not inherited; temporary vehicles must be covered to
            finish the board.
          </p>
          <p>
            <strong>Amplify:</strong> double one effect type or all effects.
            Choose “Always on this card” or queue 1–5 future matching effects.
            Queued uses wait through unrelated plays, then consume one use per
            matching keyword. Printed base pips and turn length never double.
          </p>

          <h2>
            A small board.
            <br />A clever little game.
          </h2>
          <p className="dialog-intro">
            Choose 3×3 with five cards each, or 4×4 with eight. Make the board
            yours.
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
                  When all squares are filled, whoever controls the most stones
                  wins. Unused cards do not count. Equal final scores on 4×4 are
                  a draw.
                </p>
              </div>
            </li>
          </ol>
          <div className="rules-note">
            <WandSparkles size={19} />
            <p>
              Make your own stones in the Card studio. Resonance counts card
              elements; illustrations and backstories add personality. Edge
              numbers do the capturing.
            </p>
          </div>
          <div className="rules-note keyword-rules-note">
            <Info size={19} />
            <p>
              <strong>Head Start</strong> adds its stated pips to its specified
              edge if its player is winning before placement.{" "}
              <strong>Comeback</strong> does the same while losing. Set Bonus
              pips from 1–99 in the card studio; older cards default to +1.
              Neither activates on a tie. <strong>Resonance</strong> adds one
              pip per card of a chosen element already on the board, from either
              player, regardless of score. Check once before placement,
              excluding the card being played: activated pips stay even if the
              score changes or the stone is captured, unless removed by Silence.
            </p>
          </div>
          <div className="rules-note keyword-rules-note">
            <Swords size={19} />
            <p>
              <strong>Sunder</strong> removes its stated number of pips from a
              chosen board card’s edge, down to zero. In Card studio, choose a
              fixed edge or “Any · choose when played” to select the edge during
              play. Set its pip amount from 1–99. It can target anywhere on the
              board. <strong>Silence</strong> disables a chosen board card’s
              keywords and removes their bonuses for the rest of the match.
              Choose either player’s card after picking your placement. These
              effects resolve in listed order before captures; no valid target
              means the effect is skipped. Earlier captures and resolved effects
              stay.
            </p>
          </div>
          <div className="rule-line">
            <Shield size={19} />
            <p>
              <strong>Shield</strong> adds pips only to defense on its listed
              edge. It does not help the card capture, and it stays through
              attacks and captures until Silence removes it.
            </p>
          </div>
          <div className="rule-line">
            <Layers size={19} />
            <p>
              <strong>Combo</strong> checks the last card you played. Matching
              its chosen element or tribe condition grants the listed pips
              and/or keywords once, before captures. Choose element, shared
              tribe, either, or both in the studio. Your first card cannot
              Combo. Capturing or silencing your previous card does not change
              its history.
            </p>
          </div>
          <div className="rule-line">
            <Sparkles size={19} />
            <p>
              <strong>Dizzy</strong> rolls only its marked sides from 0–5 before
              captures; a ? marks each pending side. The rolled pips stay on the
              card.
            </p>
          </div>
          <div className="rule-line">
            <ArrowRight size={19} />
            <p>
              <strong>Next Play</strong> queues + or − pips on one side or every
              side of your next card or the opponent’s next card. It can also
              grant up to five configured keywords, with or without pips.
              Keywords activate on that card’s play. Pending changes stack and
              apply once before Dizzy and captures. They do not affect the
              caster, and canceled plays spend none. Choose a recipient element
              and/or tribe to wait for a matching card. Next Play can also
              change that card’s element before Combo, terrain, and captures.
              All chosen requirements are checked first; the last matching
              element change wins.
            </p>
          </div>
          <div className="rule-line">
            <ArrowRight size={19} />
            <p>
              <strong>Shift</strong> moves only the neighbor on its printed
              side, one tile in its fixed direction, before captures. It can
              affect enemies, allies, or both. Movement wraps at board edges;
              target adjacency does not. Occupied destinations and the incoming
              card’s tile block movement. No target choice is needed, and moved
              cards keep their owner without replaying keywords.
            </p>
          </div>
          <div className="rule-line">
            <Sparkles size={19} />
            <p>
              <strong>Conjure</strong> adds 1–5 specified or random cards to
              your hand, the opponent’s hand, or both after this play. Random
              cards can match an element and/or tribe. Each copy can also gain
              extra pips on chosen sides, configured keywords, or both. Keywords
              activate when that copy is played. Copies last for this battle and
              do not join your Adventure pack. Each hand holds up to 20 cards;
              extra copies are skipped. Canceled plays add nothing.
            </p>
          </div>
          <div className="rule-line">
            <Grid2X2 size={19} />
            <p>
              <strong>Environment</strong> places a lasting effect on any empty
              or occupied tile before captures. Choose Elemental Spring, Blight,
              Bastion, War Banner, Crosswind, Mirror Pool, or Equalizer in the
              studio. Only the newest environment on a tile applies. It affects
              either player and stays on the tile through captures, Silence, and
              position swaps. Tile markers and the list below the board explain
              its current effects. All seven terrains can affect a chosen tribe.
            </p>
          </div>
          <div className="rule-line">
            <Layers size={19} />
            <p>
              <strong>SWAP Force</strong> cards can exchange halves before
              playing if two are in your hand. Use Swap Force · exchange halves:
              keep North/West, exchange South/East and its assigned keywords.
              Both cards stay in hand and no turn is spent. The top sets the
              element. Board skins can change the portraits from diagonal to
              top/bottom without changing the rules.
            </p>
          </div>
          <div className="rule-line">
            <Layers size={19} />
            <p>
              <strong>Discard</strong> removes chosen or random hand cards after
              captures and Conjure. Each player keeps enough cards for all
              remaining turns; unsafe discards are skipped.{" "}
              <strong>Scavenge</strong> gains pips or Shield per actual discard.{" "}
              <strong>Parting Gift</strong> grants buffs when discarded.{" "}
              <strong>Discard Priority</strong> makes a card get selected first
              by random discards, with higher ranks first. Discard buffs last
              for this battle and are disabled by Silence on board cards.
            </p>
          </div>
          <div className="rule-line">
            <Layers size={19} />
            <p>
              <strong>Tribes</strong> are character groups and game families,
              such as Giants, SWAP Force, and Imaginators. Cards can have more
              than one. Edit tags in the studio and filter the collection by
              tribe. Combo, Resonance, Next Play, and environments can match
              these tags.
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

      {dialog?.kind === "swap" && (
        <Dialog
          title="Swap Force halves"
          onClose={() => setDialog(null)}
          className="swap-dialog"
        >
          <SwapPicker
            hand={match.hands[dialog.owner]}
            onCancel={() => setDialog(null)}
            onConfirm={(firstId, secondId) => {
              if (aiTurn || done || match.current !== dialog.owner) return;
              try {
                const hand = swapHand(
                    match.hands[dialog.owner],
                    firstId,
                    secondId,
                  ),
                  hands: [Stone[], Stone[]] = [...match.hands];
                hands[dialog.owner] = hand;
                setMatch({ ...match, hands });
                setSelected(null);
                setDialog(null);
                hideInspection();
                setToast("SWAP Force halves exchanged. Choose a card to play.");
              } catch (error) {
                setToast(
                  error instanceof Error
                    ? error.message
                    : "Those halves could not be swapped.",
                );
              }
            }}
          />
        </Dialog>
      )}
      {dialog?.kind === "skins" && (
        <Dialog
          title="Board skins"
          onClose={() => setDialog(null)}
          className="board-skins-dialog"
        >
          <SwapArtSettings />
          <BoardSkins
            selected={library.boardSkin}
            onSelect={(skin) => saveLibrary({ ...library, boardSkin: skin })}
          />
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
            Your {capacity} stones. A {library.boardSize}×{library.boardSize}{" "}
            board of possibilities.
          </p>
          <div className="saved-deck-match">
            <DeckSelect
              state={library}
              onSelect={switchDeck}
              label="Match deck"
            />
          </div>
          <div className="mode-options">
            <button
              className={newMode === "computer" ? "active" : ""}
              onClick={() => setNewMode("computer")}
            >
              <Swords size={23} strokeWidth={1.4} />
              <strong>Face a villain</strong>
              <span>Choose a Skylanders computer rival</span>
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
          {newMode === "computer" && (
            <div className="opponent-select">
              <CharacterAvatar
                id={opponent(library.opponent).id}
                name={opponent(library.opponent).name}
                color={opponent(library.opponent).color}
              />
              <label htmlFor="normal-opponent">
                Opponent
                <select
                  id="normal-opponent"
                  aria-label="Opponent"
                  value={library.opponent}
                  onChange={(event) =>
                    saveLibrary({
                      ...library,
                      opponent: opponent(event.target.value).id,
                    })
                  }
                >
                  {OPPONENTS.map((enemy) => (
                    <option key={enemy.id} value={enemy.id}>
                      {enemy.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
          <div className="first-player-field">
            <label htmlFor="normal-board-size">Board size</label>
            <select
              id="normal-board-size"
              value={library.boardSize}
              onChange={(event) =>
                changeBoardSize(Number(event.target.value) as BoardSize)
              }
            >
              <option value="3">3×3 · 5 cards per player</option>
              <option value="4">4×4 · 8 cards per player</option>
            </select>
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
                  ? `${opponent(library.opponent).name} — let’s see their stones`
                  : "Player two — a shuffled starter deck"}
              </option>
            </select>
          </div>
          {newMode === "local" && (
            <p className="dialog-small-note">
              Player one uses your selected deck. Player two gets {capacity}{" "}
              Skylanders stones. Pass the screen after each move.
            </p>
          )}
          {library.deck.length !== capacity && (
            <p className="inline-warning">
              Your deck needs {capacity} stones. Visit your collection to finish
              it.
            </p>
          )}
          <button
            className="button button-dark full-width"
            disabled={library.deck.length !== capacity}
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
            {dialog.stone.defaultRevision && !dialog.stone.custom
              ? "YOUR CHARACTER DEFAULT"
              : dialog.stone.custom
                ? "ONE OF YOUR OWN"
                : dialog.stone.origin === "giants"
                  ? "GIANTS OPPONENT"
                  : "THE ORIGINAL COLLECTION"}
          </div>
          <h2>{dialog.stone.name}</h2>
          <TribeBadges stone={dialog.stone} />
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
          <KeywordDetails stone={dialog.stone} />
          <div className="detail-actions">
            {deckEligible(dialog.stone) && (
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
            )}
            {dialog.stone.token && (
              <p className="tokens-note">
                Token template · use with Conjure or custom enemy starting
                hands.
              </p>
            )}
            {!dialog.stone.custom && (
              <button
                className="button button-outline"
                onClick={() => openCharacterDefault(dialog.stone)}
              >
                <Pencil size={15} />
                Edit character default
              </button>
            )}
            {dialog.stone.defaultRevision && !dialog.stone.custom && (
              <button
                className="text-button"
                onClick={() => resetCharacterDefault(dialog.stone)}
              >
                <RotateCcw size={15} />
                Restore original default
              </button>
            )}
            {dialog.stone.custom && (
              <button
                className="button button-outline"
                onClick={() => openStudio(dialog.stone)}
              >
                <Pencil size={15} />
                Edit stone
              </button>
            )}
            {dialog.stone.token &&
              [...DEFAULT_TOKENS, ...DEFAULT_PARTS].some(
                (token) => token.id === dialog.stone.id,
              ) &&
              library.custom.some((card) => card.id === dialog.stone.id) && (
                <button
                  className="text-button"
                  onClick={() => {
                    const original = [...DEFAULT_TOKENS, ...DEFAULT_PARTS].find(
                      (token) => token.id === dialog.stone.id,
                    )!;
                    if (
                      saveLibrary({
                        ...library,
                        custom: library.custom.filter(
                          (card) => card.id !== original.id,
                        ),
                      })
                    )
                      setDialog({ kind: "card", stone: original });
                  }}
                >
                  Restore token default
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
            {dialog.stone.custom &&
              ![...DEFAULT_TOKENS, ...DEFAULT_PARTS].some(
                (token) => token.id === dialog.stone.id,
              ) && (
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

      {dialog?.kind === "deck" && (
        <Dialog
          title={
            {
              new: "Create a deck",
              duplicate: "Duplicate deck",
              rename: "Rename deck",
              delete: "Delete deck",
            }[dialog.action]
          }
          onClose={() => setDialog(null)}
          className="deck-edit-dialog"
        >
          <DeckForm
            key={`${dialog.action}-${library.activeDeckId}`}
            state={library}
            action={dialog.action}
            onConfirm={(name, size) => manageDeck(dialog.action, name, size)}
            onCancel={() => setDialog(null)}
          />
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
            {dialog.stone.name} will be removed from your collection and all
            saved decks. Your current match will keep its stones. Export a card
            file first if you’d like a backup.
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
