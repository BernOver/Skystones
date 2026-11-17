import {
  castSpell,
  chooseKeywordTargets,
  playHistory,
  placedKeywords,
  boardFinished,
  playableHand,
  withArenaElement,
} from "./game.ts";
import type { Board, Stone, StoneKeyword, Owner, Element } from "./game.ts";
import { applyConjure, CONJURE_CARDS } from "./conjure.ts";
import { assembleParts } from "./assemble.ts";
import { resolveDiscards, discardSummary } from "./discard.ts";
import {
  boardTrap,
  trapMatches,
  trapNullifies,
  trapStateFromBoard,
} from "./traps.ts";
import { cardMatches } from "./cardFilters.ts";
import { keywordSeed } from "./randomKeywords.ts";
import { characterDefault } from "./cardDefaults.ts";
import type { SuperchargerRecipe } from "./recipes.ts";

export interface TurnState {
  started?: string;
  control: [number, number];
  controlledBy?: Owner;
  controlOrder?: number;
}
export function validTurnState(value: unknown): value is TurnState {
  const v = value as TurnState;
  return (
    !!v &&
    typeof v === "object" &&
    Array.isArray(v.control) &&
    v.control.length === 2 &&
    v.control.every((n) => Number.isInteger(n) && n >= 0 && n <= 10000) &&
    (v.started === undefined || /^\d+:[01]$/.test(v.started)) &&
    (v.controlledBy === undefined || [0, 1].includes(v.controlledBy)) &&
    (v.controlOrder === undefined ||
      (Number.isInteger(v.controlOrder) &&
        v.controlOrder >= 0 &&
        v.controlOrder <= 10000))
  );
}
export function collectCommands(
  board: Board,
  state: TurnState = { control: [0, 0] },
): TurnState {
  const control: [number, number] = [...state.control];
  const plays = playHistory(board),
    after = state.controlOrder || 0;
  for (const cell of plays)
    if ((cell.playedOrder || 0) > after) {
      const actor = cell.playedBy ?? cell.owner;
      control[actor] = Math.min(
        10000,
        control[actor] + (cell.commandTurns || 0),
      );
    }
  return {
    ...state,
    control,
    controlOrder: Math.max(
      after,
      ...plays.map((cell) => cell.playedOrder || 0),
    ),
  };
}
type Hands = [Stone[], Stone[]];
function triggeredEffects(
  board: Board,
  hands: Hands,
  owner: Owner,
  keywords: StoneKeyword[],
  name: string,
  seed: number,
  recipes?: readonly SuperchargerRecipe[],
  identity?: Pick<Stone, "element" | "tribes">,
) {
  const source: Stone = {
    id: `custom-trigger-${seed >>> 0}-${playHistory(board).length}`,
    name: name.slice(0, 40),
    origin: "skylanders",
    description: "Triggered battlefield effect.",
    creature: "golem",
    element: identity?.element || "neutral",
    ...(identity?.tribes ? { tribes: identity.tribes } : {}),
    edges: [0, 0, 0, 0],
    keywords,
    spell: "discard",
    token: true,
    conjured: true,
    runtimeEffects: true,
  };
  const move = castSpell(
    board,
    source,
    owner,
    chooseKeywordTargets(board, -1, source, owner),
    true,
  );
  const conjured = applyConjure(
    move.board,
    move.sourceIndex!,
    hands,
    () => CONJURE_CARDS.map((card) => characterDefault(card)),
    seed ^ 0x27d4eb2d,
    undefined,
    undefined,
    recipes,
  );
  const assembled = assembleParts(
    conjured.board,
    move.sourceIndex!,
    conjured.hands,
    seed ^ 0x71ab,
    undefined,
    recipes,
  );
  const result = resolveDiscards(
    assembled.board,
    move.sourceIndex!,
    assembled.hands,
    seed ^ 0x6d2b79f5,
    [],
    true,
    false,
    [],
    0,
    owner,
  );
  return {
    board: result.board,
    hands: result.hands,
    messages: [
      name,
      ...assembled.messages,
      discardSummary(result.records, ["Player one", "Player two"]),
    ].filter(Boolean),
  };
}
export function resolveTrapGrants(
  board: Board,
  hands: Hands,
  seed: number,
  options: {
    timing: "placed" | "enter" | "turn-start";
    previousOrder?: number;
    previousHands?: Hands;
    entered?: { index: number; owner: Owner };
    current?: Owner;
    recipes?: readonly SuperchargerRecipe[];
  },
) {
  const active = trapStateFromBoard(board)?.active;
  if (
    !active ||
    (options.timing === "placed" &&
      (active.order || 0) <= (options.previousOrder || 0))
  )
    return { board, hands, messages: [] as string[] };
  let next = { board, hands, messages: [] as string[] };
  const effects = active.trap.effects.filter(
    (e) => e.kind === "grant" && e.timing === options.timing,
  );
  for (const [effectIndex, e] of effects.entries()) {
    if (e.kind !== "grant") continue;
    for (const owner of [0, 1] as Owner[]) {
      if (
        e.timing === "turn-start" &&
        e.recipients === "active" &&
        owner !== options.current
      )
        continue;
      for (const location of ["board", "hand"] as const) {
        if (e.target !== "both" && e.target !== location) continue;
        const ids =
          location === "board"
            ? next.board.flatMap((cell, index) =>
                cell &&
                cell.owner === owner &&
                trapMatches(active.trap, cell.stone) &&
                cardMatches(
                  cell.stone,
                  e.condition,
                  cell.edges || cell.stone.edges,
                ) &&
                (options.timing !== "enter" ||
                  (index === options.entered?.index &&
                    owner === options.entered?.owner))
                  ? [cell.stone.id]
                  : [],
              )
            : next.hands[owner]
                .filter(
                  (card) =>
                    trapMatches(active.trap, card) &&
                    cardMatches(
                      card,
                      e.condition,
                      card.edges.map((n, s) =>
                        Math.max(0, n + (card.discardBuffs?.pips[s] || 0)),
                      ) as Stone["edges"],
                    ) &&
                    (options.timing !== "enter" ||
                      !options.previousHands?.[owner].some(
                        (old) => old.id === card.id,
                      )),
                )
                .map((card) => card.id);
        if (!ids.length) continue;
        const result = triggeredEffects(
          next.board,
          next.hands,
          owner,
          [
            {
              type: "enchant",
              target: location === "board" ? "allies" : "hand",
              mode: "all",
              filter: { ids },
              ...(e.keywords?.length
                ? { keywords: structuredClone(e.keywords) }
                : {}),
              ...(e.randomKeywords
                ? { randomKeywords: structuredClone(e.randomKeywords) }
                : {}),
            },
          ],
          active.trap.name,
          keywordSeed(
            `${active.order}:${effectIndex}:${owner}:${location}:${options.timing}`,
            seed,
          ),
          options.recipes,
        );
        next = {
          board: result.board,
          hands: result.hands,
          messages: [...next.messages, ...result.messages],
        };
      }
    }
  }
  return next;
}
export function postPlayTrapGrants(
  board: Board,
  hands: Hands,
  oldBoard: Board,
  oldHands: Hands,
  sourceIndex: number,
  seed: number,
  recipes?: readonly SuperchargerRecipe[],
) {
  const previousOrder = Math.max(
    0,
    ...playHistory(oldBoard).map((cell) => cell.playedOrder || 0),
  );
  const placed = resolveTrapGrants(board, hands, seed, {
    timing: "placed",
    previousOrder,
    recipes,
  });
  const entered =
    sourceIndex >= 0 && board[sourceIndex]
      ? {
          index: sourceIndex,
          owner: board[sourceIndex]!.playedBy ?? board[sourceIndex]!.owner,
        }
      : undefined;
  const result = resolveTrapGrants(placed.board, placed.hands, seed ^ 0x3851, {
    timing: "enter",
    previousHands: oldHands,
    entered,
    recipes,
  });
  return { ...result, messages: [...placed.messages, ...result.messages] };
}
export function beginTurn(
  board: Board,
  hands: Hands,
  owner: Owner,
  turnNumber: number,
  seed: number,
  oldState?: TurnState,
  options: {
    botOwners?: Owner[];
    recipes?: readonly SuperchargerRecipe[];
    arenaCycle?: Element[];
  } = {},
) {
  let state = collectCommands(board, oldState),
    next = { board, hands, messages: [] as string[] };
  const key = `${turnNumber}:${owner}`;
  if (state.started === key || boardFinished(board)) return { ...next, state };
  state = { ...state, started: key };
  delete state.controlledBy;
  if (options.arenaCycle?.length)
    next.board = withArenaElement(
      next.board,
      options.arenaCycle[turnNumber % options.arenaCycle.length],
    );
  // Snapshot before any grants so a new Turn Start keyword waits for the next boundary.
  const sources = [
    ...next.board.flatMap((cell) =>
      cell ? [{ cell, actor: cell.owner }] : [],
    ),
    ...(next.board.spellHistory || [])
      .filter((cell) =>
        placedKeywords(cell).some((k) => k.type === "turn-start"),
      )
      .map((cell) => ({ cell, actor: cell.playedBy ?? cell.owner })),
  ];
  const scheduled = sources.flatMap(({ cell, actor }) =>
    !cell.silenced &&
    !trapNullifies(boardTrap(next.board), cell.stone, "turn-start")
      ? placedKeywords(cell).flatMap((keyword, i) =>
          keyword.type === "turn-start" &&
          (keyword.when === "both" ||
            (keyword.when === "self" ? owner === actor : owner !== actor))
            ? [
                {
                  keyword,
                  actor,
                  name: cell.stone.name,
                  order: cell.playedOrder || i,
                  element: cell.stone.element,
                  tribes: cell.stone.tribes,
                },
              ]
            : [],
        )
      : [],
  );
  next = resolveTrapGrants(next.board, next.hands, seed, {
    timing: "turn-start",
    current: owner,
    recipes: options.recipes,
  });
  for (const [i, source] of scheduled.entries()) {
    const before = next;
    const result = triggeredEffects(
      next.board,
      next.hands,
      source.actor,
      source.keyword.keywords,
      source.name,
      keywordSeed(`${turnNumber}:${owner}:${source.order}:${i}`, seed),
      options.recipes,
      source,
    );
    const grants = postPlayTrapGrants(
      result.board,
      result.hands,
      before.board,
      before.hands,
      -1,
      seed ^ i,
      options.recipes,
    );
    next = {
      board: grants.board,
      hands: grants.hands,
      messages: [...next.messages, ...result.messages, ...grants.messages],
    };
  }
  state = collectCommands(next.board, state);
  const controller = (1 - owner) as Owner;
  if (
    options.botOwners?.includes(owner) &&
    playableHand(next.hands[owner]) &&
    state.control[controller] > 0
  ) {
    state.control = [...state.control];
    state.control[controller]--;
    state.controlledBy = controller;
  }
  return { ...next, state };
}
export function advanceTurn(
  board: Board,
  hands: Hands,
  owner: Owner,
  turnNumber: number,
  keepsTurn: boolean,
  seed: number,
  oldState?: TurnState,
  options: {
    botOwners?: Owner[];
    recipes?: readonly SuperchargerRecipe[];
    arenaCycle?: Element[];
  } = {},
) {
  let state = collectCommands(board, oldState),
    next = { board, hands, owner, turnNumber, state, messages: [] as string[] };
  if (keepsTurn && playableHand(hands[owner])) return next;
  for (let pass = 0; pass < 2; pass++) {
    const current = (1 - next.owner) as Owner,
      number = next.turnNumber + 1;
    const started = beginTurn(
      next.board,
      next.hands,
      current,
      number,
      seed ^ Math.imul(number, 0x9e3779b1),
      next.state,
      options,
    );
    next = {
      ...started,
      owner: current,
      turnNumber: number,
      messages: [...next.messages, ...started.messages],
    };
    if (boardFinished(next.board) || playableHand(next.hands[current]))
      return next;
  }
  return next;
}
