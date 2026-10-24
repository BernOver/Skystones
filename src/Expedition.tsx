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
} from "lucide-react";
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
} from "./game";
import type {
  BoardSize,
  Element,
  KeywordTarget,
  KeywordType,
  Side,
  Stone,
  StoneKeyword,
} from "./game";
import {
  ADVENTURE_STORAGE,
  POTIONS,
  ROUTE,
  SERVICE_PRICES,
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
  validateAdventure,
} from "./adventure";
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
    return validateAdventure(value) ? value : null;
  } catch {
    return null;
  }
}
function RunDialog({
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
  const [target, setTarget] = useState<{
    placement: number;
    cardIndex: number;
    targets: KeywordTarget[];
  } | null>(null);
  const [service, setService] = useState<"pip" | "element" | "keyword">("pip"),
    [serviceCard, setServiceCard] = useState(""),
    [side, setSide] = useState<Side | "any">(0),
    [element, setElement] = useState<Element>("fire"),
    [keywordType, setKeywordType] = useState<KeywordType>("head-start"),
    [amount, setAmount] = useState(1);
  useEffect(() => {
    if (!run) return;
    try {
      localStorage.setItem(ADVENTURE_STORAGE, JSON.stringify(run));
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
    setRun(newAdventure(size));
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
          Climb a nine-stop path of battles, strange events, treasure, and
          merchants. Start small, build stronger stones, and seize the Crown
          Warden’s throne.
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
  function look(
    stone: Stone,
    anchor: HTMLElement,
    boardIndex?: number,
    modal = false,
  ) {
    const cell = boardIndex !== undefined ? battle?.board[boardIndex] : null;
    const resolved = cell
      ? {
          edges: cell.edges || stone.edges,
          activeKeywords: cell.activeKeywords || [],
        }
      : evaluateKeywords(stone, battle?.board || [], 0);
    const rect = anchor.getBoundingClientRect();
    const value: Inspection = {
      stone,
      sourceId: anchor.id,
      anchor: { left: rect.left, right: rect.right, top: rect.top },
      anchorElement: anchor,
      ...resolved,
      played: !!cell,
      playerName: cell?.playedBy === 1 ? "Keeper" : "You",
      controllerName: cell?.owner === 1 ? "Keeper" : "You",
      silenced: cell?.silenced,
      reductions: cell?.reductions,
      effects: cell?.effects,
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
    if (prepareTargeting(battle.board, stone).pending) {
      setTarget({ placement, cardIndex: selected, targets: [] });
      setInspection(null);
    } else act((current) => playAdventureCard(current, placement, selected));
  }
  function chooseTarget(boardIndex: number, chosenSide?: Side) {
    if (!target || !battle) return;
    const stone = battle.hands[0][target.cardIndex],
      state = prepareTargeting(battle.board, stone, target.targets);
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
    if (prepareTargeting(battle.board, stone, targets).pending)
      setTarget({ ...target, targets });
    else {
      act((current) =>
        playAdventureCard(current, target.placement, target.cardIndex, targets),
      );
      setTarget(null);
    }
  }
  function workshop() {
    const fixed = side === "any" ? 0 : side;
    if (service === "pip")
      act((current) =>
        buyAdventureService(current, {
          type: "pip",
          cardId: selectedService.id,
          side: fixed,
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
      const keyword: StoneKeyword =
        keywordType === "silence"
          ? { type: "silence" }
          : keywordType === "resonance"
            ? { type: "resonance", side: fixed, element }
            : keywordType === "sunder"
              ? { type: "sunder", side, amount }
              : { type: keywordType, side: fixed };
      act((current) =>
        buyAdventureService(current, {
          type: "keyword",
          cardId: selectedService.id,
          keyword,
        }),
      );
    }
  }
  function potion(index: number) {
    if (run!.potions[index] === "heal")
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
  return (
    <div className="adventure">
      <div className="page-heading">
        <div>
          <div className="eyebrow">THE ROAD TO THE CROWN</div>
          <h1>
            Your expedition<span className="orange-period">.</span>
          </h1>
          <p>
            {run.size}×{run.size} board · {count}-card battle hand · stop{" "}
            {run.floor + 1} of {ROUTE.length}
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
          <strong>{run.lives}/3</strong> lives
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
              title={POTIONS[type].description}
              aria-label={`Use ${POTIONS[type].name}`}
              disabled={
                ai ||
                run.phase === "ended" ||
                (type === "heal" && run.lives === 3) ||
                (type !== "heal" && run.phase !== "battle")
              }
              onClick={() => potion(index)}
            >
              <FlaskConical size={17} />
              {POTIONS[type].name}
            </button>
          ))}
          {!run.potions.length && <small>Empty potion belt · 0/3</small>}
        </div>
      </div>
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
            <h2>Choose your path</h2>
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
                {floor < run.floor ? "✓" : floor + 1}
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
                {run.node?.kind === "boss"
                  ? "FINAL BOSS"
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
                ? `Hold the chest at ${coordinate(battle.objective, run.size)} at the finish: +45 gold.`
                : `Win the score AND hold the throne at ${coordinate(battle.objective, run.size)}. The Warden starts with two guards.`}
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
                  <StoneCard
                    stone={cell.stone}
                    owner={cell.owner}
                    edges={cell.edges || cell.stone.edges}
                    silenced={cell.silenced}
                  />
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
                  edges={evaluateKeywords(stone, battle.board, 0).edges}
                  selected={selected === index}
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
          <h2>{run.node.name}</h2>
          <p>{run.node.description}</p>
          <div className="event-options">
            {run.node.kind === "chest" ? (
              <>
                <button
                  className="button button-dark"
                  disabled={!deckReady}
                  onClick={() =>
                    act((current) => resolveAdventureEvent(current, "fight"))
                  }
                >
                  Challenge the chest keeper · hold chest for +45 gold
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
            ) : run.node.id === "well" ? (
              <>
                <button
                  className="button button-dark"
                  disabled={run.lives === 3}
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
                  Offer 1 life · gain 40 gold
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
            ) : run.node.kind === "camp" ? (
              <>
                <button
                  className="button button-dark"
                  disabled={run.lives === 3}
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
                      disabled={run.potions.length >= 3}
                      onClick={() =>
                        act((current) => resolveAdventureEvent(current, type))
                      }
                    >
                      <strong>{POTIONS[type].name}</strong>
                      <span>{POTIONS[type].description}</span>
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
          <h3>Stones for sale</h3>
          <div className="shop-stock">
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
                  disabled={run.gold < cardPrice(stone)}
                  onClick={() =>
                    act((current) => buyAdventureCard(current, stone.id))
                  }
                >
                  Buy card · {cardPrice(stone)} gold
                </button>
              </article>
            ))}
            {!run.shopCards.length && <p>Every stone has found a traveler.</p>}
          </div>
          <h3>Potions · belt capacity 3</h3>
          <div className="shop-potions">
            {run.shopPotions.map((item) => (
              <article key={item.id}>
                <FlaskConical size={24} />
                <h4>{POTIONS[item.type].name}</h4>
                <p>{POTIONS[item.type].description}</p>
                <button
                  className="button button-outline"
                  disabled={
                    run.gold < POTIONS[item.type].price ||
                    run.potions.length >= 3
                  }
                  onClick={() =>
                    act((current) => buyAdventurePotion(current, item.id))
                  }
                >
                  Buy potion · {POTIONS[item.type].price} gold
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
                  setSide(0);
                }}
              >
                <option value="pip">Sharpen · +1 pip · 25 gold</option>
                <option value="element">
                  Reforge · change element · 20 gold
                </option>
                <option value="keyword">
                  Inscribe · add a keyword · 35 gold
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
              <label>
                Keyword
                <select
                  aria-label="Workshop keyword"
                  value={keywordType}
                  onChange={(event) => {
                    setKeywordType(event.target.value as KeywordType);
                    setSide(0);
                  }}
                >
                  {Object.entries(KEYWORD_RULES).map(([type, rule]) => (
                    <option key={type} value={type}>
                      {rule.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {service === "pip" ||
            (service === "keyword" && keywordType !== "silence") ? (
              <label>
                Affected edge
                <select
                  aria-label="Workshop edge"
                  value={side}
                  onChange={(event) =>
                    setSide(
                      event.target.value === "any"
                        ? "any"
                        : (Number(event.target.value) as Side),
                    )
                  }
                >
                  {SIDE_NAMES.map((name, index) => (
                    <option key={name} value={index}>
                      {name}
                    </option>
                  ))}
                  {service === "keyword" && keywordType === "sunder" && (
                    <option value="any">Any · choose when played</option>
                  )}
                </select>
              </label>
            ) : null}
            {service === "element" ||
            (service === "keyword" && keywordType === "resonance") ? (
              <label>
                {service === "element" ? "New element" : "Counted element"}
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
            ) : null}
            {service === "keyword" && keywordType === "sunder" && (
              <label>
                Pips removed
                <input
                  aria-label="Workshop Sunder strength"
                  type="number"
                  min={1}
                  max={99}
                  value={amount}
                  onChange={(event) =>
                    setAmount(
                      Math.max(
                        1,
                        Math.min(99, Number(event.target.value) || 1),
                      ),
                    )
                  }
                />
              </label>
            )}
            <button
              className="button button-dark"
              disabled={run.gold < SERVICE_PRICES[service]}
            >
              Buy upgrade · {SERVICE_PRICES[service]} gold
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
          <div className="eyebrow">THE ROAD REWARDS THE BRAVE</div>
          <h2>
            {run.rewards.length
              ? "Choose a stone for your pack."
              : "A lesson for the road."}
          </h2>
          <p>
            Gold is already in your purse. Card rewards grow stronger as you
            climb. New stones must be swapped into your expedition deck.
          </p>
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
                    setDeckOpen(true);
                    act((current) => claimAdventureReward(current, stone.id));
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
            {run.rewards.length ? "Skip card reward" : "Continue expedition"}
          </button>
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
              ? "You won the score and seized the throne. The Warden yields."
              : "Your three lives are spent. A new journey begins with a new little deck."}
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
      {potionTarget !== null && battle && (
        <RunDialog
          title="Choose potion target"
          onClose={() => setPotionTarget(null)}
        >
          <h2>{POTIONS[run.potions[potionTarget]].name}</h2>
          <p>{POTIONS[run.potions[potionTarget]].description}</p>
          <div className="potion-targets">
            {run.potions[potionTarget] === "power"
              ? battle.hands[0].map((stone) => (
                  <button
                    className="button button-outline"
                    key={stone.id}
                    onClick={() => {
                      act((current) =>
                        useAdventurePotion(current, potionTarget, stone.id),
                      );
                      setPotionTarget(null);
                    }}
                  >
                    Empower {stone.name}
                  </button>
                ))
              : battle.board.flatMap((cell, index) =>
                  cell?.owner === 1 &&
                  (cell.edges || cell.stone.edges).some((edge) => edge > 0)
                    ? [
                        <button
                          className="button button-outline"
                          key={index}
                          onClick={() => {
                            act((current) =>
                              useAdventurePotion(current, potionTarget, index),
                            );
                            setPotionTarget(null);
                          }}
                        >
                          Hex {coordinate(index, run.size)} · {cell.stone.name}
                        </button>,
                      ]
                    : [],
                )}
          </div>
          <button className="text-button" onClick={() => setPotionTarget(null)}>
            Cancel potion
          </button>
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
              silenced={inspected.silenced}
            />
          </div>
          <h2>{inspected.stone.name}</h2>
          <InspectionDetails inspection={inspected} />
        </RunDialog>
      )}
      {inspection &&
        !target &&
        !card &&
        !inspected &&
        potionTarget === null && <CardInspector inspection={inspection} />}
      <p className="field-note adventure-save-note">
        Your progress saves after each choice and move. You can return to normal
        play and resume this adventure later.
      </p>
    </div>
  );
}
