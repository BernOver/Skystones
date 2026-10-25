import { CaptureFlip } from "./CaptureFlip";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Coins,
  Heart,
  FlaskConical,
  Swords,
  Map,
  Store,
  Gift,
  Crown,
  Backpack,
  ArrowRight,
  X,
  Sparkles,
  Flame,
  RefreshCw,
} from "lucide-react";
import { SpireEncounter, SpireEventGuide } from "./SpireEncounter";
import { SPIRE_CATALOG, getSpireEvent } from "./spireEvents";
import { validateStone } from "./game";
import { PotionPicker, PotionGuide } from "./PotionPicker";
import { adventurePotionAvailability, POTION_IDS } from "./potions";
import { InscriptionEvent, FusionEvent } from "./AdventureEvents";
import { StoneCard } from "./Artwork";
import {
  CardInspector,
  KeywordDetails,
  InspectionDetails,
} from "./CardInspection";
import type { Inspection } from "./CardInspection";
import { TargetPicker } from "./TargetPicker";
import {
  ELEMENTS,
  KEYWORD_RULES,
  SIDE_NAMES,
  coordinate,
  evaluateKeywords,
  handSize,
  prepareTargeting,
  score,
  validateKeywords,
} from "./game";
import type {
  BoardSize,
  Element,
  KeywordTarget,
  Side,
  Stone,
  Owner,
} from "./game";
import {
  ADVENTURE_STORAGE,
  ADVENTURE_NOTE_STORAGE,
  POTIONS,
  ROUTE,
  adventureAct,
  adventureStop,
  adventureEventId,
  SERVICE_PRICES,
  adventureWorkshopOffer,
  adventureShopRerollPrice,
  rerollAdventureShop,
  adventureEnemyMove,
  buyAdventureCard,
  buyAdventurePotion,
  buyAdventureService,
  cardPrice,
  claimAdventureReward,
  enterAdventureNode,
  leaveAdventureShop,
  newAdventure,
  playAdventureCard,
  resolveAdventureEvent,
  setAdventureDeck,
  useAdventurePotion,
  restoreAdventure,
  claimAdventureRelic,
  buyAdventureRelic,
  RELIC_PRICE,
  potionDescription,
  adventureStoneForPlay,
  dizzyEventCard,
} from "./adventure";
import {
  RELICS,
  RELIC_IDS,
  cardRewardPicks,
  earnedGold,
  hasRelic,
  maxLives,
  potionCapacity,
  shopPrice,
} from "./relics";
import type { RelicId } from "./relics";
import { RelicCard, RELIC_ICONS } from "./RelicCard";
import type { Adventure, NodeKind } from "./adventure";

const NODE_ICONS = {
  battle: Swords,
  elite: Flame,
  event: Sparkles,
  chest: Gift,
  shop: Store,
  camp: Heart,
  boss: Crown,
};
function loadAdventure(): Adventure | null {
  try {
    const value = JSON.parse(localStorage.getItem(ADVENTURE_STORAGE) || "null");
    return restoreAdventure(value);
  } catch {
    return null;
  }
}
export function RunDialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null),
    close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null,
      overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.querySelector<HTMLElement>("button")?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") close.current();
      if (event.key !== "Tab") return;
      const options = Array.from(
          ref.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled),select,input,[tabindex="0"]',
          ) || [],
        ).filter((el) => el.offsetParent !== null),
        first = options[0],
        last = options.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        className="dialog expedition-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={ref}
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
export function Expedition() {
  const [run, setRun] = useState<Adventure | null>(loadAdventure),
    [setup, setSetup] = useState(false),
    [size, setSize] = useState<BoardSize>(3),
    [error, setError] = useState(""),
    [storageError, setStorageError] = useState(""),
    [deckOpen, setDeckOpen] = useState(false),
    [selected, setSelected] = useState<number | null>(null),
    [card, setCard] = useState<Stone | null>(null),
    [inspection, setInspection] = useState<Inspection | null>(null),
    [inspected, setInspected] = useState<Inspection | null>(null),
    [potionTarget, setPotionTarget] = useState<number | null>(null);
  const [eventGuide, setEventGuide] = useState(false);
  const [potionGuide, setPotionGuide] = useState(false);
  const [relicGuide, setRelicGuide] = useState(false),
    [relicDetail, setRelicDetail] = useState<RelicId | null>(null);
  const [target, setTarget] = useState<{
    placement: number;
    cardIndex: number;
    targets: KeywordTarget[];
  } | null>(null);
  const [service, setService] = useState<"pip" | "element" | "keyword">("pip"),
    [serviceCard, setServiceCard] = useState(""),
    [element, setElement] = useState<Element>("fire");
  useEffect(() => {
    if (!run) return;
    try {
      localStorage.setItem(ADVENTURE_STORAGE, JSON.stringify(run));
      if (run.note)
        localStorage.setItem(ADVENTURE_NOTE_STORAGE, JSON.stringify(run.note));
      setStorageError("");
    } catch {
      setStorageError(
        "Your run could not be saved in this browser. Keep this tab open to continue.",
      );
    }
  }, [run]);
  useEffect(() => {
    if (!run || setup || run.phase !== "battle" || run.battle?.current !== 1)
      return;
    const floor = run.floor,
      turn = run.battle.turns;
    const timer = setTimeout(
      () =>
        setRun((current) =>
          current &&
          current.floor === floor &&
          current.phase === "battle" &&
          current.battle?.turns === turn
            ? adventureEnemyMove(current)
            : current,
        ),
      550,
    );
    return () => clearTimeout(timer);
  }, [run, setup]);
  useEffect(() => {
    setInspection(null);
    setSelected(null);
  }, [run?.floor, run?.phase, run?.battle?.turns]);
  function act(action: (run: Adventure) => Adventure) {
    if (!run) return;
    try {
      setRun(action(run));
      setError("");
      setInspection(null);
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "That action could not be completed.",
      );
    }
  }
  function start() {
    let note: Stone | undefined;
    try {
      const saved = JSON.parse(
        localStorage.getItem(ADVENTURE_NOTE_STORAGE) || "null",
      );
      if (validateStone(saved)) note = saved;
    } catch {
      /* An old note never blocks a new run. */
    }
    setRun(newAdventure(size, undefined, note));
    setSetup(false);
    setSelected(null);
    setTarget(null);
    setPotionTarget(null);
    setDeckOpen(false);
    setError("");
  }
  if (!run || setup)
    return (
      <section className="adventure-start">
        <div className="eyebrow">
          <Map size={15} /> A SKYWARD EXPEDITION
        </div>
        <h1>
          A little deck.
          <br />A grand adventure<span className="orange-period">.</span>
        </h1>
        <p>
          Travel through two nine-stop acts of battles, events, treasure, and
          shops. Start with a modest deck, defeat Kaos, then challenge Golden
          Queen in the Golden Isles.
        </p>
        <div className="adventure-promises">
          <span>
            <Heart />3 lives
          </span>
          <span>
            <Coins />
            60 starting gold
          </span>
          <span>
            <Gift />
            Growing card rewards
          </span>
          <span>
            <FlaskConical />
            Potions & upgrades
          </span>
        </div>
        <label className="run-size-label">
          Adventure board size
          <select
            aria-label="Adventure board size"
            value={size}
            onChange={(event) =>
              setSize(Number(event.target.value) as BoardSize)
            }
          >
            <option value="3">3×3 · take 5 cards into battle</option>
            <option value="4">4×4 · take 8 cards into battle</option>
          </select>
        </label>
        <button className="button button-dark" onClick={start}>
          {run ? "Start a new adventure" : "Start adventure"}
          <ArrowRight size={17} />
        </button>
        {run && (
          <>
            <p className="field-note">
              Starting a new adventure replaces your saved run.
            </p>
            <button className="text-button" onClick={() => setSetup(false)}>
              Resume saved adventure
            </button>
          </>
        )}
        <p className="field-note">
          The run saves automatically in this browser. Its gold and cards belong
          to this adventure.
        </p>
      </section>
    );
  const battle = run.battle,
    count = handSize(run.size),
    deckReady = run.deck.length === count,
    ai = run.phase === "battle" && battle?.current === 1,
    scores = battle ? score(battle.board) : [0, 0];
  const selectedService =
    run.inventory.find((stone) => stone.id === serviceCard) || run.inventory[0];
  const beltSize = potionCapacity(run);
  const pendingRelic = !!run.relicOffers?.length;
  const picksLeft =
    run.rewardPicksRemaining ?? (run.rewards.length ? cardRewardPicks(run) : 0);
  const shopOffer = adventureWorkshopOffer(run);
  const offeredKeyword = shopOffer.keyword;
  const keywordDirection = !("side" in offeredKeyword)
    ? "Whole card"
    : offeredKeyword.side === "any"
      ? "Any edge"
      : SIDE_NAMES[offeredKeyword.side];
  const canInscribe = validateKeywords([
    ...(selectedService.keywords || []),
    offeredKeyword,
  ]);
  const canSharpen =
    selectedService.edges[shopOffer.pipSide] < 5 &&
    selectedService.edges.reduce((a, b) => a + b, 0) < 12;
  function look(
    stone: Stone,
    anchor: HTMLElement,
    boardIndex?: number,
    modal = false,
    owner: Owner = 0,
  ) {
    const cell = boardIndex !== undefined ? battle?.board[boardIndex] : null;
    const resolved = cell
      ? {
          edges: cell.edges || stone.edges,
          activeKeywords: cell.activeKeywords || [],
          shields: cell.shields,
          comboActive: cell.comboActive,
          comboPrevious: cell.comboPrevious,
          grantedKeywords: cell.grantedKeywords,
        }
      : evaluateKeywords(
          adventureStoneForPlay(run!, stone, owner),
          battle?.board || [],
          owner,
        );
    const rect = anchor.getBoundingClientRect();
    const value: Inspection = {
      stone,
      sourceId: anchor.id,
      anchor: { left: rect.left, right: rect.right, top: rect.top },
      anchorElement: anchor,
      ...resolved,
      played: !!cell,
      playerName: (cell ? cell.playedBy === 1 : owner === 1) ? "Keeper" : "You",
      controllerName: cell?.owner === 1 ? "Keeper" : "You",
      silenced: cell?.silenced,
      reductions: cell?.reductions,
      effects: cell?.effects,
      dizzy: cell?.dizzy,
      size: run!.size,
    };
    if (modal) {
      setInspected(value);
      setInspection(null);
    } else setInspection(value);
  }
  function play(placement: number) {
    if (selected === null || ai || !battle) return;
    const stone = battle.hands[0][selected];
    if (prepareTargeting(battle.board, stone, [], 0).pending) {
      setTarget({ placement, cardIndex: selected, targets: [] });
      setInspection(null);
    } else act((current) => playAdventureCard(current, placement, selected));
  }
  function chooseTarget(boardIndex: number, chosenSide?: Side) {
    if (!target || !battle) return;
    const stone = battle.hands[0][target.cardIndex],
      state = prepareTargeting(battle.board, stone, target.targets, 0);
    if (
      !state.pending?.options.some(
        (option) =>
          option.boardIndex === boardIndex && option.side === chosenSide,
      )
    )
      return;
    const targets = [
      ...target.targets,
      {
        keywordIndex: state.pending.keywordIndex,
        boardIndex,
        ...(chosenSide !== undefined ? { side: chosenSide } : {}),
      },
    ];
    if (prepareTargeting(battle.board, stone, targets, 0).pending)
      setTarget({ ...target, targets });
    else {
      act((current) =>
        playAdventureCard(current, target.placement, target.cardIndex, targets),
      );
      setTarget(null);
    }
  }
  function workshop() {
    if (service === "pip")
      act((current) =>
        buyAdventureService(current, {
          type: "pip",
          cardId: selectedService.id,
        }),
      );
    else if (service === "element")
      act((current) =>
        buyAdventureService(current, {
          type: "element",
          cardId: selectedService.id,
          element,
        }),
      );
    else {
      act((current) =>
        buyAdventureService(current, {
          type: "keyword",
          cardId: selectedService.id,
        }),
      );
    }
  }
  function potion(index: number) {
    if (POTIONS[run!.potions[index]].target === "none")
      act((current) => useAdventurePotion(current, index));
    else {
      setPotionTarget(index);
      setInspection(null);
    }
  }
  const nodeIcon = (kind: NodeKind) => {
    const Icon = NODE_ICONS[kind];
    return <Icon size={23} />;
  };
  function relicChoices(shrine = false) {
    return (
      <section className="relic-reward" aria-label="Choose a relic">
        <div className="eyebrow">AN ANCIENT GIFT</div>
        <h2>Choose a relic for your journey.</h2>
        <p>
          Relics last for the run. Choose one; its effects begin immediately.
        </p>
        <div className="relic-offer-grid">
          {(run!.relicOffers || []).map((id) => (
            <RelicCard key={id} id={id}>
              <button
                className="button button-dark"
                onClick={() =>
                  act((current) => claimAdventureRelic(current, id))
                }
              >
                Take relic {RELICS[id].name}
              </button>
            </RelicCard>
          ))}
        </div>
        <button
          className="button button-outline"
          onClick={() => act((current) => claimAdventureRelic(current, null))}
        >
          {shrine ? "Leave the Reliquary" : "Skip relic"}
        </button>
      </section>
    );
  }
  return (
    <div className="adventure">
      <div className="page-heading">
        <div>
          <div className="eyebrow">THE ROAD TO THE CROWN</div>
          <h1>
            Your expedition<span className="orange-period">.</span>
          </h1>
          <p>
            {run.size}×{run.size} board · {count}-card battle hand · Act{" "}
            {adventureAct(run.floor)} · stop {adventureStop(run.floor)} of 9
          </p>
        </div>
        <button
          className="button button-outline"
          onClick={() => setSetup(true)}
        >
          New adventure
        </button>
      </div>
      <div className="run-toolbar">
        <span>
          <Heart size={18} />
          <strong>
            {run.lives}/{maxLives(run)}
          </strong>{" "}
          lives
        </span>
        <span>
          <Coins size={18} />
          <strong>{run.gold}</strong> gold
        </span>
        <button
          className="button button-outline"
          disabled={run.phase === "battle" || run.phase === "ended"}
          onClick={() => setDeckOpen(!deckOpen)}
        >
          <Backpack size={16} />
          Expedition deck · {run.deck.length}/{count}
        </button>
        <div className="potion-belt" aria-label="Potion belt">
          {run.potions.map((type, index) => (
            <button
              key={`${index}-${type}`}
              title={`${potionDescription(run, type)} ${adventurePotionAvailability(run, index).reason}`}
              aria-label={`Use ${POTIONS[type].name}`}
              disabled={!adventurePotionAvailability(run, index).usable}
              onClick={() => potion(index)}
            >
              <FlaskConical size={17} />
              {POTIONS[type].name}
            </button>
          ))}
          <small>
            {!run.potions.length ? "Empty potion belt · " : ""}
            {run.potions.length}/{beltSize} slots
          </small>
          <button
            className="potion-guide-button"
            onClick={() => {
              setInspection(null);
              setPotionGuide(true);
            }}
          >
            Potion guide · {POTION_IDS.length}
          </button>
        </div>
      </div>
      {(!!run.curses?.length || run.healingLocked) && (
        <section className="run-curse-status" aria-label="Encounter conditions">
          {!!run.curses?.length && (
            <p>
              <strong>Curses · {run.curses.length}</strong>{" "}
              {run.curses.join(", ")}. Each curse replaces a normal hand stone
              with a zero-pip stone in future battles, leaving at least one
              normal stone. Purification removes curses.
            </p>
          )}
          {run.healingLocked && (
            <p>
              <strong>Mind Bloom:</strong> healing and Phoenix Feather revival
              are blocked for this run.
            </p>
          )}
        </section>
      )}
      <button
        className="text-button event-guide-link"
        onClick={() => {
          setInspection(null);
          setEventGuide(true);
        }}
      >
        Event guide · {SPIRE_CATALOG.length}
      </button>
      <section className="relic-shelf" aria-label="Your relics">
        <div className="section-heading">
          <h2>
            Relics · {(run.relics || []).length}/{RELIC_IDS.length}
          </h2>
          <button className="text-button" onClick={() => setRelicGuide(true)}>
            Relic guide · {RELIC_IDS.length}
          </button>
        </div>
        {run.relics?.length ? (
          <div className="owned-relics">
            {run.relics.map((id) => {
              const Icon = RELIC_ICONS[id],
                spent = run.spentRelics?.includes(id);
              return (
                <button
                  key={id}
                  className={spent ? "spent" : ""}
                  title={RELICS[id].description}
                  onClick={() => setRelicDetail(id)}
                  aria-label={`Inspect relic ${RELICS[id].name}`}
                >
                  <Icon size={21} />
                  <span>
                    {RELICS[id].name}
                    {spent && <small>Spent</small>}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p>
            Win your first battle, secure chests, defeat elites, visit the
            Reliquary, or buy a relic from a merchant.
          </p>
        )}
      </section>
      {(error || storageError) && (
        <p className="adventure-error" role="alert">
          {error || storageError}
        </p>
      )}
      <p className="run-message" role="status">
        {run.message}
      </p>
      {deckOpen && run.phase !== "battle" && run.phase !== "ended" && (
        <section className="run-panel">
          <div className="section-heading">
            <h2>Your traveling pack</h2>
            <button className="text-button" onClick={() => setDeckOpen(false)}>
              Close deck
            </button>
          </div>
          <p>
            Choose exactly {count} stones for the next battle. New rewards join
            your pack; swap them in here.
          </p>
          <div className="run-card-grid">
            {run.inventory.map((stone) => (
              <div className="run-pack-card" key={stone.id}>
                <button
                  className={
                    run.deck.includes(stone.id)
                      ? "run-card-choice is-selected"
                      : "run-card-choice"
                  }
                  aria-label={`${run.deck.includes(stone.id) ? "Remove" : "Add"} ${stone.name} ${stone.id} ${run.deck.includes(stone.id) ? "from" : "to"} expedition deck`}
                  aria-pressed={run.deck.includes(stone.id)}
                  onClick={() =>
                    act((current) => setAdventureDeck(current, stone.id))
                  }
                >
                  <StoneCard
                    stone={stone}
                    selected={run.deck.includes(stone.id)}
                  />
                  <span>
                    {run.deck.includes(stone.id) ? "In battle deck" : "In pack"}
                  </span>
                </button>
                <button className="text-button" onClick={() => setCard(stone)}>
                  Inspect {stone.name}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
      {run.phase === "map" && (
        <section className="run-map">
          <div className="section-heading">
            <h2>
              Act {adventureAct(run.floor)} ·{" "}
              {adventureAct(run.floor) === 1
                ? "Throne of Chaos"
                : "The Golden Isles"}
            </h2>
            <Map size={20} />
          </div>
          {!deckReady && (
            <p className="adventure-error">
              Choose exactly {count} stones in your expedition deck before the
              next battle.
            </p>
          )}
          {ROUTE.map((row, floor) => (
            <div
              key={floor}
              className={`run-map-row ${floor === run.floor ? "current" : floor < run.floor ? "completed" : "future"}`}
            >
              <span className="floor-marker">
                {floor < run.floor
                  ? "✓"
                  : `${adventureAct(floor)}.${adventureStop(floor)}`}
              </span>
              <div className="run-route-options">
                {row.map((node) => (
                  <button
                    key={node.id}
                    className={`run-node node-${node.kind}`}
                    disabled={
                      floor !== run.floor ||
                      (!deckReady &&
                        ["battle", "elite", "boss"].includes(node.kind))
                    }
                    onClick={() => {
                      setDeckOpen(false);
                      act((current) => enterAdventureNode(current, node.id));
                    }}
                  >
                    {nodeIcon(node.kind)}
                    <span>
                      <strong>{node.name}</strong>
                      <small>{node.description}</small>
                    </span>
                    {floor === run.floor && <ArrowRight size={17} />}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
      {run.phase === "battle" && battle && (
        <section className="run-battle">
          <div className="run-battle-heading">
            <div>
              <div className="eyebrow">
                {battle.boss || run.node?.kind === "boss"
                  ? `ACT ${adventureAct(run.floor)} BOSS`
                  : run.node?.kind === "elite"
                    ? "ELITE KEEPER"
                    : "STONE KEEPER"}
              </div>
              <h2>{battle.name}</h2>
              <p>
                {ai
                  ? "The keeper is thinking…"
                  : "Your turn — select a stone, then an empty square."}
              </p>
            </div>
            <div className="run-score">
              <span>
                You <strong>{scores[0]}</strong>
              </span>
              <span>
                Keeper <strong>{scores[1]}</strong>
              </span>
            </div>
          </div>
          {battle.objective !== undefined && (
            <p className="run-objective">
              <Crown size={17} />
              {battle.objectiveKind === "chest"
                ? `Hold the chest at ${coordinate(battle.objective, run.size)} at the finish: +${45 + (hasRelic(run, "treasure-magnet") ? 30 : 0)} gold before percentage bonuses.`
                : battle.boss === "golden-queen"
                  ? `Win the score, hold Golden Queen’s shielded throne at ${coordinate(battle.objective, run.size)}, and control at least two corners.`
                  : `Win the score AND hold Kaos’s throne at ${coordinate(battle.objective, run.size)}. No extra guard starts on the board.`}
            </p>
          )}
          <div
            className={`adventure-board adventure-board-${run.size}`}
            role="group"
            aria-label={`Adventure ${run.size} by ${run.size} game board`}
          >
            {battle.board.map((cell, index) => (
              <button
                id={`adventure-board-${index}`}
                key={index}
                className={`adventure-square ${cell ? "occupied" : "vacant"} ${battle.objective === index ? "objective-square" : ""} ${battle.lastCaptured.includes(index) ? "run-captured" : ""}`}
                disabled={!cell && (ai || selected === null)}
                aria-label={
                  cell
                    ? `${coordinate(index, run.size)}: ${cell.stone.name}, ${cell.owner === 0 ? "You" : "Keeper"}, north ${(cell.edges || cell.stone.edges)[0]}, east ${(cell.edges || cell.stone.edges)[1]}, south ${(cell.edges || cell.stone.edges)[2]}, west ${(cell.edges || cell.stone.edges)[3]}`
                    : `${coordinate(index, run.size)}, empty adventure square`
                }
                onClick={(event) =>
                  cell
                    ? look(cell.stone, event.currentTarget, index, true)
                    : play(index)
                }
                onPointerEnter={(event) =>
                  cell &&
                  event.pointerType !== "touch" &&
                  look(cell.stone, event.currentTarget, index)
                }
                onPointerLeave={() => setInspection(null)}
                onFocus={(event) =>
                  cell &&
                  event.currentTarget.matches(":focus-visible") &&
                  look(cell.stone, event.currentTarget, index)
                }
                onBlur={() => setInspection(null)}
              >
                {cell ? (
                  <CaptureFlip
                    key={`${index}-${cell.owner}`}
                    captured={battle.lastCaptured.includes(index)}
                    owner={cell.owner}
                  >
                    <StoneCard
                      stone={cell.stone}
                      owner={cell.owner}
                      edges={cell.edges || cell.stone.edges}
                      shields={cell.shields}
                      silenced={cell.silenced}
                    />
                  </CaptureFlip>
                ) : (
                  <span>
                    {coordinate(index, run.size)}
                    <small>Place stone</small>
                  </span>
                )}
                {battle.objective === index && (
                  <span className="objective-badge">
                    {battle.objectiveKind === "chest" ? "CHEST" : "THRONE"}
                  </span>
                )}
              </button>
            ))}
          </div>
          {hasRelic(run, "oracles-eye") && (
            <section className="oracle-hand">
              <h3>Oracle’s Eye · keeper’s hand</h3>
              <div className="run-hand">
                {battle.hands[1].map((stone) => (
                  <button
                    className="run-enemy-card"
                    key={stone.id}
                    onClick={(e) =>
                      look(stone, e.currentTarget, undefined, true, 1)
                    }
                    onPointerEnter={(e) =>
                      e.pointerType !== "touch" &&
                      look(stone, e.currentTarget, undefined, false, 1)
                    }
                    onPointerLeave={() => setInspection(null)}
                    onFocus={(e) =>
                      e.currentTarget.matches(":focus-visible") &&
                      look(stone, e.currentTarget, undefined, false, 1)
                    }
                    onBlur={() => setInspection(null)}
                  >
                    <StoneCard
                      stone={stone}
                      owner={1}
                      edges={evaluateKeywords(stone, battle.board, 1).edges}
                      shields={evaluateKeywords(stone, battle.board, 1).shields}
                    />
                  </button>
                ))}
              </div>
            </section>
          )}
          <div className="run-hand-heading">
            <h3>Your hand · {battle.hands[0].length} cards</h3>
            <span>{battle.hands[1].length} keeper cards remain</span>
          </div>
          <div className="run-hand">
            {battle.hands[0].map((stone, index) => (
              <button
                id={`adventure-hand-${stone.id}`}
                className="run-hand-card"
                key={stone.id}
                aria-label={`Select ${stone.name}, adventure card ${index + 1}`}
                aria-pressed={selected === index}
                disabled={ai}
                onClick={() => setSelected(selected === index ? null : index)}
                onPointerEnter={(event) =>
                  event.pointerType !== "touch" &&
                  look(stone, event.currentTarget)
                }
                onPointerLeave={() => setInspection(null)}
                onFocus={(event) =>
                  event.currentTarget.matches(":focus-visible") &&
                  look(stone, event.currentTarget)
                }
                onBlur={() => setInspection(null)}
              >
                <StoneCard
                  stone={stone}
                  edges={
                    evaluateKeywords(
                      adventureStoneForPlay(run, stone),
                      battle.board,
                      0,
                    ).edges
                  }
                  selected={selected === index}
                  shields={
                    evaluateKeywords(
                      adventureStoneForPlay(run, stone),
                      battle.board,
                      0,
                    ).shields
                  }
                />
              </button>
            ))}
          </div>
          {selected !== null && battle.hands[0][selected] && (
            <button
              className="text-button"
              onClick={() => {
                const stone = battle.hands[0][selected],
                  anchor = document.getElementById(
                    `adventure-hand-${stone.id}`,
                  );
                if (anchor) look(stone, anchor, undefined, true);
              }}
            >
              Inspect selected adventure card
            </button>
          )}
          <details className="run-journal">
            <summary>Battle journal</summary>
            {battle.log.map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </details>
        </section>
      )}
      {run.phase === "event" && run.node && (
        <section className="run-panel run-event">
          <div className="event-symbol">{nodeIcon(run.node.kind)}</div>
          <h2>
            {run.spireEvent
              ? getSpireEvent(run.spireEvent.id)!.sourceName
              : run.node.name}
          </h2>
          <p>
            {run.spireEvent
              ? getSpireEvent(run.spireEvent.id)!.text
              : run.node.description}
          </p>
          <div className="event-options">
            {run.spireEvent ? (
              <SpireEncounter
                key={`${run.spireEvent.id}-${run.spireEvent.stage}`}
                run={run}
                onInspect={setCard}
                onResolve={(action, first, second) =>
                  act((current) =>
                    resolveAdventureEvent(current, action, first, second),
                  )
                }
              />
            ) : run.node.kind === "chest" ? (
              <>
                <button
                  className="button button-dark"
                  disabled={!deckReady}
                  onClick={() =>
                    act((current) => resolveAdventureEvent(current, "fight"))
                  }
                >
                  Challenge the chest keeper · hold chest for +
                  {45 + (hasRelic(run, "treasure-magnet") ? 30 : 0)} gold
                </button>
                <button
                  className="button button-outline"
                  onClick={() =>
                    act((current) => resolveAdventureEvent(current, "leave"))
                  }
                >
                  Leave the chest
                </button>
              </>
            ) : adventureEventId(run.node.id) === "well" ? (
              <>
                <button
                  className="button button-dark"
                  disabled={run.lives >= maxLives(run) || run.healingLocked}
                  onClick={() =>
                    act((current) => resolveAdventureEvent(current, "heal"))
                  }
                >
                  Drink from the well · recover 1 life
                </button>
                <button
                  className="button button-outline"
                  disabled={run.lives <= 1}
                  onClick={() =>
                    act((current) => resolveAdventureEvent(current, "gold"))
                  }
                >
                  Offer 1 life · gain {earnedGold(run, 40)} gold
                </button>
                <button
                  className="text-button"
                  onClick={() =>
                    act((current) => resolveAdventureEvent(current, "leave"))
                  }
                >
                  Walk away
                </button>
              </>
            ) : adventureEventId(run.node.id) === "whirling-idol" ? (
              <div className="dizzy-event-card">
                <StoneCard stone={dizzyEventCard(run)} />
                <KeywordDetails stone={dizzyEventCard(run)} />
                <button
                  className="button button-dark"
                  onClick={() =>
                    act((current) =>
                      resolveAdventureEvent(current, "dizzy-card"),
                    )
                  }
                >
                  Claim Whirling Idol · 12 pips
                </button>
                <button
                  className="button button-outline"
                  onClick={() =>
                    act((current) => resolveAdventureEvent(current, "leave"))
                  }
                >
                  Leave the idol
                </button>
              </div>
            ) : adventureEventId(run.node.id) === "rune-shrine" ? (
              <InscriptionEvent
                run={run}
                onInspect={setCard}
                onLeave={() =>
                  act((current) => resolveAdventureEvent(current, "leave"))
                }
                onClaim={(id, index) =>
                  act((current) =>
                    resolveAdventureEvent(current, `inscribe:${index}`, id),
                  )
                }
              />
            ) : adventureEventId(run.node.id) === "fusion-forge" ? (
              <FusionEvent
                run={run}
                onInspect={setCard}
                onLeave={() =>
                  act((current) => resolveAdventureEvent(current, "leave"))
                }
                onCombine={(base, donor) =>
                  act((current) =>
                    resolveAdventureEvent(current, "combine", base, donor),
                  )
                }
              />
            ) : adventureEventId(run.node.id) === "reliquary" ? (
              relicChoices(true)
            ) : run.node.kind === "camp" ? (
              <>
                <button
                  className="button button-dark"
                  disabled={run.lives >= maxLives(run) || run.healingLocked}
                  onClick={() =>
                    act((current) => resolveAdventureEvent(current, "heal"))
                  }
                >
                  Rest · recover 1 life
                </button>
                <label>
                  Stone to train
                  <select
                    aria-label="Camp training card"
                    value={selectedService.id}
                    onChange={(event) => setServiceCard(event.target.value)}
                  >
                    {run.inventory.map((stone) => (
                      <option value={stone.id} key={stone.id}>
                        {stone.name} · {stone.edges.reduce((a, b) => a + b, 0)}{" "}
                        pips
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="button button-outline"
                  onClick={() =>
                    act((current) =>
                      resolveAdventureEvent(
                        current,
                        "train",
                        selectedService.id,
                      ),
                    )
                  }
                >
                  Train · permanently add 1 pip
                </button>
                <button
                  className="text-button"
                  onClick={() =>
                    act((current) => resolveAdventureEvent(current, "leave"))
                  }
                >
                  Continue without resting
                </button>
              </>
            ) : (
              <>
                {(Object.keys(POTIONS) as (keyof typeof POTIONS)[]).map(
                  (type) => (
                    <button
                      className="button button-outline potion-event"
                      key={type}
                      disabled={run.potions.length >= beltSize}
                      onClick={() =>
                        act((current) => resolveAdventureEvent(current, type))
                      }
                    >
                      <strong>{POTIONS[type].name}</strong>
                      <span>{potionDescription(run, type)}</span>
                    </button>
                  ),
                )}
                <button
                  className="text-button"
                  onClick={() =>
                    act((current) => resolveAdventureEvent(current, "leave"))
                  }
                >
                  Continue without a potion
                </button>
              </>
            )}
          </div>
        </section>
      )}
      {run.phase === "shop" && (
        <section className="run-shop">
          <div className="shop-banner">
            <Store size={34} />
            <div>
              <div className="eyebrow">THE MERCHANT’S RUG</div>
              <h2>{run.node?.name}</h2>
              <p>Cards, bottled surprises, and a better stone for the road.</p>
            </div>
          </div>
          <div className="shop-reroll-panel" aria-label="Refresh shop stock">
            <div>
              <h3>A fresh selection</h3>
              <p>
                Refresh all cards, the relic, and workshop offers. Restock all
                potions. Your bought cards and upgrades stay with you.
              </p>
              <small>
                {run.shopRerolls || 0} reroll
                {(run.shopRerolls || 0) === 1 ? "" : "s"} used at this shop
                {hasRelic(run, "merchants-die")
                  ? run.shopFreeRerollUsed
                    ? " · Free reroll used"
                    : " · Merchant’s Die: one free reroll ready"
                  : ""}
              </small>
            </div>
            <button
              className="button button-outline"
              disabled={run.gold < adventureShopRerollPrice(run)}
              onClick={() => act(rerollAdventureShop)}
            >
              <RefreshCw size={16} />
              {adventureShopRerollPrice(run) === 0
                ? "Reroll shop · Free"
                : `Reroll shop · ${adventureShopRerollPrice(run)} gold`}
            </button>
          </div>
          <h3>Stones for sale</h3>
          <div
            className={`shop-stock ${hasRelic(run, "market-map") ? "expanded-stock" : ""}`}
          >
            {run.shopCards.map((stone) => (
              <article className="shop-card" key={stone.id}>
                <button
                  className="run-card-preview"
                  aria-label={`Inspect shop ${stone.name}`}
                  onClick={() => setCard(stone)}
                >
                  <StoneCard stone={stone} />
                </button>
                <button
                  className="button button-outline"
                  disabled={run.gold < cardPrice(stone, run)}
                  onClick={() =>
                    act((current) => buyAdventureCard(current, stone.id))
                  }
                >
                  Buy card · {cardPrice(stone, run)} gold
                </button>
              </article>
            ))}
            {!run.shopCards.length && <p>Every stone has found a traveler.</p>}
          </div>
          <h3>A relic for the road</h3>
          {run.shopRelic ? (
            <div className="shop-relic-stock">
              <RelicCard id={run.shopRelic}>
                <button
                  className="button button-outline"
                  disabled={run.gold < shopPrice(run, RELIC_PRICE)}
                  onClick={() =>
                    act((current) => buyAdventureRelic(current, run.shopRelic!))
                  }
                >
                  Buy relic · {shopPrice(run, RELIC_PRICE)} gold
                </button>
              </RelicCard>
            </div>
          ) : (
            <p>No relic remains for sale at this shop.</p>
          )}
          <h3>Potions · belt capacity {beltSize}</h3>
          <div className="shop-potions">
            {run.shopPotions.map((item) => (
              <article key={item.id}>
                <FlaskConical size={24} />
                <h4>{POTIONS[item.type].name}</h4>
                <p>{potionDescription(run, item.type)}</p>
                <button
                  className="button button-outline"
                  disabled={
                    run.gold < shopPrice(run, POTIONS[item.type].price) ||
                    run.potions.length >= beltSize
                  }
                  onClick={() =>
                    act((current) => buyAdventurePotion(current, item.id))
                  }
                >
                  Buy potion · {shopPrice(run, POTIONS[item.type].price)} gold
                </button>
              </article>
            ))}
          </div>
          <form
            className="stone-workshop"
            onSubmit={(event) => {
              event.preventDefault();
              workshop();
            }}
          >
            <div>
              <div className="eyebrow">THE STONE WORKSHOP</div>
              <h3>Make a favorite stronger.</h3>
              <p>
                Upgrades last for the whole adventure. Printed edges stay within
                5 pips each and a 12-pip total.
              </p>
            </div>
            <label>
              Workshop service
              <select
                aria-label="Workshop service"
                value={service}
                onChange={(event) => {
                  setService(event.target.value as typeof service);
                }}
              >
                <option value="pip">
                  Sharpen · +{hasRelic(run, "whetstone-ring") ? 2 : 1}{" "}
                  {SIDE_NAMES[shopOffer.pipSide]} pips · {shopPrice(run, 25)}{" "}
                  gold
                </option>
                <option value="element">
                  Reforge · change element{" "}
                  {hasRelic(run, "elemental-prism") ? "+ weakest-edge pip" : ""}{" "}
                  · {shopPrice(run, 20)} gold
                </option>
                <option value="keyword">
                  Inscribe · {KEYWORD_RULES[offeredKeyword.type].name} ·{" "}
                  {keywordDirection} · {shopPrice(run, 35)} gold
                </option>
              </select>
            </label>
            <label>
              Stone to upgrade
              <select
                aria-label="Workshop card"
                value={selectedService.id}
                onChange={(event) => setServiceCard(event.target.value)}
              >
                {run.inventory.map((stone) => (
                  <option key={stone.id} value={stone.id}>
                    {stone.name} · {stone.edges.join("/")}
                  </option>
                ))}
              </select>
            </label>
            {service === "keyword" && (
              <section
                className="workshop-offer"
                aria-label="Shop keyword offer"
              >
                <div className="eyebrow">THIS SHOP’S INSCRIPTION</div>
                <h4>
                  {KEYWORD_RULES[offeredKeyword.type].name} · {keywordDirection}
                </h4>
                <p>
                  Randomly rolled on entering or rerolling this shop. Choose a
                  stone to receive this exact keyword and direction.{" "}
                  {hasRelic(run, "rune-echo") &&
                    "Rune Echo also inscribes the opposite edge when available."}
                </p>
                <KeywordDetails
                  stone={{ ...selectedService, keywords: [offeredKeyword] }}
                  size={run.size}
                />
                {!canInscribe && (
                  <p className="workshop-unavailable">
                    This stone already has the offered keyword. Choose another
                    stone.
                  </p>
                )}
              </section>
            )}
            {service === "pip" && (
              <section className="workshop-offer" aria-label="Shop pip offer">
                <div className="eyebrow">THIS SHOP’S SHARPENING</div>
                <h4>
                  +{hasRelic(run, "whetstone-ring") ? 2 : 1} pips ·{" "}
                  {SIDE_NAMES[shopOffer.pipSide]}
                </h4>
                <p>
                  This direction was randomly rolled for the visit. Choose which
                  stone gains the pip.
                </p>
                {!canSharpen && (
                  <p className="workshop-unavailable">
                    This stone has no room for the offered pip. Choose another
                    stone.
                  </p>
                )}
              </section>
            )}
            {service === "element" && (
              <label>
                New element
                <select
                  aria-label="Workshop element"
                  value={element}
                  onChange={(event) =>
                    setElement(event.target.value as Element)
                  }
                >
                  {Object.entries(ELEMENTS).map(([value, details]) => (
                    <option key={value} value={value}>
                      {details.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button
              className="button button-dark"
              disabled={
                run.gold < shopPrice(run, SERVICE_PRICES[service]) ||
                (service === "keyword" && !canInscribe) ||
                (service === "pip" && !canSharpen)
              }
            >
              Buy upgrade · {shopPrice(run, SERVICE_PRICES[service])} gold
            </button>
          </form>
          <button
            className="button button-dark leave-shop"
            onClick={() => act(leaveAdventureShop)}
          >
            Leave shop
            <ArrowRight size={16} />
          </button>
        </section>
      )}
      {run.phase === "reward" && (
        <section className="run-panel run-rewards">
          {pendingRelic ? (
            relicChoices()
          ) : (
            <>
              <div className="eyebrow">THE ROAD REWARDS THE BRAVE</div>
              <h2>
                {run.rewards.length
                  ? `Choose ${picksLeft > 1 ? `${picksLeft} stones` : "a stone"} for your pack.`
                  : "A lesson for the road."}
              </h2>
              <p>
                Gold is already in your purse. Card rewards grow stronger as you
                climb. New stones must be swapped into your expedition deck.
              </p>
              {!!run.rewards.length && (
                <p className="reward-picks" role="status">
                  {picksLeft} card pick{picksLeft === 1 ? "" : "s"} remaining ·{" "}
                  {run.rewards.length} choices
                </p>
              )}
              <div className="reward-options">
                {run.rewards.map((stone) => (
                  <article key={stone.id}>
                    <button
                      className="run-card-preview"
                      onClick={() => setCard(stone)}
                      aria-label={`Inspect reward ${stone.name}`}
                    >
                      <StoneCard stone={stone} />
                    </button>
                    <span>
                      {stone.edges.reduce((a, b) => a + b, 0)} printed pips
                    </span>
                    <button
                      className="button button-dark"
                      onClick={() => {
                        setDeckOpen(picksLeft <= 1);
                        act((current) =>
                          claimAdventureReward(current, stone.id),
                        );
                      }}
                    >
                      Take {stone.name}
                    </button>
                  </article>
                ))}
              </div>
              <button
                className="button button-outline"
                onClick={() =>
                  act((current) => claimAdventureReward(current, null))
                }
              >
                {run.rewards.length
                  ? "Skip card reward"
                  : "Continue expedition"}
              </button>
            </>
          )}
        </section>
      )}
      {run.phase === "ended" && (
        <section className="run-panel run-ending">
          <Crown size={50} />
          <div className="eyebrow">
            {run.victory
              ? "THE CROWN IS YOURS"
              : "EVERY ROAD TEACHES SOMETHING"}
          </div>
          <h2>
            {run.victory
              ? "A little legend, crowned."
              : "Your expedition ends here."}
          </h2>
          <p>
            {run.victory
              ? "You defeated Kaos and Golden Queen. The Golden Isles are free."
              : "Your lives are spent. A new journey begins with a new little deck."}
          </p>
          <p>
            {run.gold} gold · {run.inventory.length} stones collected ·{" "}
            {run.size}×{run.size} board
          </p>
          <button className="button button-dark" onClick={() => setSetup(true)}>
            Plan another adventure
          </button>
        </section>
      )}
      {target && battle && (
        <RunDialog
          title="Adventure keyword target"
          onClose={() => setTarget(null)}
        >
          <TargetPicker
            owner={0}
            key={target.targets.length}
            board={battle.board}
            stone={battle.hands[0][target.cardIndex]}
            placement={target.placement}
            targets={target.targets}
            names={["You", "Keeper"]}
            onChoose={chooseTarget}
            onCancel={() => setTarget(null)}
          />
        </RunDialog>
      )}
      {potionTarget !== null && battle && run.potions[potionTarget] && (
        <RunDialog
          title="Choose potion target"
          onClose={() => setPotionTarget(null)}
        >
          <PotionPicker
            key={`${potionTarget}-${run.potions[potionTarget]}`}
            run={run}
            index={potionTarget}
            onCancel={() => setPotionTarget(null)}
            onUse={(target, choice) => {
              act((current) =>
                useAdventurePotion(current, potionTarget, target, choice),
              );
              setPotionTarget(null);
            }}
          />
        </RunDialog>
      )}
      {eventGuide && (
        <RunDialog
          title="Spire event guide"
          onClose={() => setEventGuide(false)}
        >
          <SpireEventGuide />
        </RunDialog>
      )}
      {potionGuide && (
        <RunDialog title="Potion guide" onClose={() => setPotionGuide(false)}>
          <PotionGuide run={run} />
        </RunDialog>
      )}
      {card && (
        <RunDialog
          title={`Adventure card ${card.name}`}
          onClose={() => setCard(null)}
        >
          <div className="run-detail-card">
            <StoneCard stone={card} />
          </div>
          <h2>{card.name}</h2>
          <p>
            North {card.edges[0]} · East {card.edges[1]} · South {card.edges[2]}{" "}
            · West {card.edges[3]}
          </p>
          <KeywordDetails stone={card} size={run.size} />
          <p className="field-note">{card.description}</p>
        </RunDialog>
      )}
      {inspected && (
        <RunDialog
          title={`Inspect adventure ${inspected.stone.name}`}
          onClose={() => setInspected(null)}
        >
          <div className="run-detail-card">
            <StoneCard
              stone={inspected.stone}
              edges={inspected.edges}
              shields={inspected.shields}
              silenced={inspected.silenced}
            />
          </div>
          <h2>{inspected.stone.name}</h2>
          <InspectionDetails inspection={inspected} />
        </RunDialog>
      )}
      {relicGuide && (
        <RunDialog title="Relic guide" onClose={() => setRelicGuide(false)}>
          <div className="eyebrow">{RELIC_IDS.length} ANCIENT TREASURES</div>
          <h2>Relics for the road.</h2>
          <p>
            Earn relics from your first victory, secured chests, elite
            victories, and the Reliquary, or buy one from a merchant. You can
            own each relic once.
          </p>
          <div className="relic-guide-grid">
            {RELIC_IDS.map((id) => (
              <RelicCard
                key={id}
                id={id}
                owned={hasRelic(run, id)}
                spent={run.spentRelics?.includes(id)}
              />
            ))}
          </div>
        </RunDialog>
      )}
      {relicDetail && (
        <RunDialog
          title={`Relic ${RELICS[relicDetail].name}`}
          onClose={() => setRelicDetail(null)}
        >
          <RelicCard
            id={relicDetail}
            owned
            spent={run.spentRelics?.includes(relicDetail)}
          />
        </RunDialog>
      )}
      {inspection &&
        !target &&
        !card &&
        !inspected &&
        !eventGuide &&
        !potionGuide &&
        !relicGuide &&
        !relicDetail &&
        potionTarget === null && <CardInspector inspection={inspection} />}
      <p className="field-note adventure-save-note">
        Your progress saves after each choice and move. You can return to normal
        play and resume this adventure later.
      </p>
    </div>
  );
}
