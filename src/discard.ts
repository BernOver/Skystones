import { hasTribe } from "./tribes.ts";
import { characterDefault } from "./cardDefaults.ts";
import { applyConjure, CONJURE_CARDS } from "./conjure.ts";
import { assembleParts } from "./assemble.ts";
import { castSpell, chooseKeywordTargets } from "./game.ts";
import { boardContext, playSource, updatePlaySource } from "./playSources.ts";
import type { TileEnvironment } from "./effects.ts";
import { boardTrap, trapKeywordMultiplier, trapNullifies } from "./traps.ts";
import type { Trap } from "./traps.ts";
import { scaleEffect, validRuntimeEffects } from "./amplify.ts";
import {
  placedKeywords as liveKeywords,
  finishingCard,
  validateKeywords,
  mergeKeywordGrants,
  keywordShieldEdges,
  shieldEdges,
  cardEdges,
  score,
} from "./game.ts";
import type {
  Board,
  Edges,
  Owner,
  Side,
  Stone,
  StoneKeyword,
  BasicKeyword,
  KeywordTarget,
} from "./game.ts";

export type BuffSpec = {
  pips?: { side: Side; amount: number }[];
  shields?: { side: Side; amount: number }[];
};
export type PartingGiftKeyword = {
  type: "parting-gift";
  target:
    | "discarder"
    | "allies"
    | "enemies"
    | "board"
    | "hand"
    | "enemy-hand"
    | "hands";
  mode?: "all" | "chosen" | "random";
  count?: number;
  keywords?: StoneKeyword[];
} & BuffSpec;
export type EnchantKeyword = Omit<PartingGiftKeyword, "type"> & {
  type: "enchant";
};
export type DiscardKeyword =
  | {
      type: "discard";
      mode: "chosen" | "random";
      recipient: "self" | "opponent" | "both";
      count: number;
    }
  | ({ type: "scavenge"; from: "self" | "opponent" | "both" } & BuffSpec)
  | PartingGiftKeyword
  | EnchantKeyword
  | { type: "discard-priority"; priority?: number };
export interface GiftOption {
  id: string;
  stone: Stone;
  owner: Owner;
  location: "hand" | "board";
  boardIndex?: number;
  edges: Edges;
  shields?: Edges;
  keywordShields?: Edges;
  environment?: TileEnvironment;
}
export interface DiscardBuffs {
  pips: Edges;
  shields: Edges;
}
export interface DiscardChoice {
  giftId?: string;
  keywordIndex: number;
  owner: Owner;
  cardIds: string[];
}
export interface DiscardPending {
  gift?: {
    kind?: "enchant";
    id: string;
    source: string;
    text: string;
    options: GiftOption[];
  };
  trap?: Trap;
  keywordIndex: number;
  owner: Owner;
  count: number;
  requested: number;
  required: number;
  cards: Stone[];
}
export interface DiscardRecord {
  keywordIndex: number;
  owner: Owner;
  requested: number;
  spells?: string[];
  enchant?: true;
  cards: { id: string; name: string }[];
  skipped: number;
  buffs: {
    source: string;
    target: string;
    pips: Edges;
    shields: Edges;
    keywords?: StoneKeyword[];
    owner?: Owner;
    location?: "hand" | "board";
  }[];
}
export class DiscardSelectionRequired extends Error {
  move?: { index: number; cardIndex: number; targets: KeywordTarget[] };
  pending: DiscardPending;
  constructor(pending: DiscardPending) {
    super("Choose cards to discard.");
    this.name = "DiscardSelectionRequired";
    this.pending = pending;
  }
}
export function validBuffSpec(
  value: BuffSpec,
  signed = false,
  allowEmpty = false,
): boolean {
  const valid = (pips: unknown, negative = false) =>
    pips === undefined ||
    (Array.isArray(pips) &&
      pips.length <= 4 &&
      new Set(pips.map((pip) => pip?.side)).size === pips.length &&
      pips.every(
        (pip) =>
          pip &&
          Number.isInteger(pip.side) &&
          pip.side >= 0 &&
          pip.side <= 3 &&
          Number.isInteger(pip.amount) &&
          pip.amount >= (negative ? -5 : 1) &&
          pip.amount !== 0 &&
          pip.amount <= 5,
      ));
  return (
    valid(value.pips, signed) &&
    valid(value.shields) &&
    (allowEmpty || !!(value.pips?.length || value.shields?.length))
  );
}
export function validDiscardKeyword(value: DiscardKeyword, depth = 0): boolean {
  switch (value.type) {
    case "discard":
      return (
        ["chosen", "random"].includes(value.mode) &&
        ["self", "opponent", "both"].includes(value.recipient) &&
        Number.isInteger(value.count) &&
        value.count >= 1 &&
        value.count <= 5
      );
    case "scavenge":
      return (
        ["self", "opponent", "both"].includes(value.from) &&
        validBuffSpec(value)
      );
    case "parting-gift":
    case "enchant":
      return (
        (value.type !== "enchant" ||
          (value.target !== "discarder" && !!value.keywords?.length)) &&
        [
          "discarder",
          "allies",
          "enemies",
          "board",
          "hand",
          "enemy-hand",
          "hands",
        ].includes(value.target) &&
        (value.mode === undefined ||
          ["all", "chosen", "random"].includes(value.mode)) &&
        (value.mode === undefined || value.mode === "all"
          ? value.count === undefined
          : value.target !== "discarder" &&
            Number.isInteger(value.count) &&
            value.count! >= 1 &&
            value.count! <= 5) &&
        (value.keywords === undefined ||
          (Array.isArray(value.keywords) &&
            value.keywords.length > 0 &&
            value.keywords.length <= 5 &&
            validateKeywords(value.keywords, depth + 1))) &&
        validBuffSpec(value, true, !!value.keywords?.length)
      );
    case "discard-priority":
      return (
        value.priority === undefined ||
        (Number.isInteger(value.priority) &&
          value.priority >= 1 &&
          value.priority <= 99)
      );
  }
}
const edgeArray = (value: unknown, signed = false) =>
  Array.isArray(value) &&
  value.length === 4 &&
  value.every((n) => Number.isInteger(n) && n >= (signed ? -99 : 0) && n <= 99);
export function validDiscardBuffs(value: unknown): value is DiscardBuffs {
  if (!value || typeof value !== "object") return false;
  const buff = value as DiscardBuffs;
  return (
    edgeArray(buff.pips, true) &&
    edgeArray(buff.shields) &&
    [...buff.pips, ...buff.shields].some(Boolean)
  );
}
const emptyBuffs = (): DiscardBuffs => ({
  pips: [0, 0, 0, 0],
  shields: [0, 0, 0, 0],
});
function specifiedBuffs(spec: BuffSpec): DiscardBuffs {
  const value = emptyBuffs();
  for (const kind of ["pips", "shields"] as const)
    for (const pip of spec[kind] || []) value[kind][pip.side] += pip.amount;
  return value;
}
function addBuffs(
  old: DiscardBuffs | undefined,
  extra: DiscardBuffs,
): DiscardBuffs | undefined {
  const result: DiscardBuffs = {
    pips: extra.pips.map((n, side) =>
      Math.max(-99, Math.min(99, n + (old?.pips[side] || 0))),
    ) as Edges,
    shields: extra.shields.map((n, side) =>
      Math.min(99, n + (old?.shields[side] || 0)),
    ) as Edges,
  };
  return [...result.pips, ...result.shields].some(Boolean) ? result : undefined;
}
// Board gifts add abilities without replaying placement. Passive Shield and Scavenge activate immediately.
function boardKeywordGift(
  cell: NonNullable<Board[number]>,
  grants: StoneKeyword[],
  board?: Board,
) {
  const runtime =
    !!cell.stone.runtimeEffects || grants.some((k) => !validateKeywords([k]));
  const merged = mergeKeywordGrants(cell.stone.keywords || [], grants, runtime);
  if (!merged.added.length) return { cell, added: [] as StoneKeyword[] };
  const previous = liveKeywords(cell),
    oldShields = keywordShieldEdges(cell);
  const amplifiers = [...previous, ...merged.added].filter(
    (k) => k.type === "amplify" && k.duration === "always",
  );
  const multiplier = (type: string, list: StoneKeyword[]) =>
    trapNullifies(cell.trap, cell.stone, "amplify")
      ? 1
      : Math.min(
          32,
          list.reduce(
            (n, k) =>
              n *
              (k.type === "amplify" &&
              k.duration === "always" &&
              (k.effect === type || k.effect === "all")
                ? 2
                : 1),
            1,
          ),
        );
  const newEffects = merged.added.flatMap<BasicKeyword>((k) =>
    k.type === "combo" ? [] : scaleEffect(k, multiplier(k.type, amplifiers)),
  );
  const effects = [
    ...previous.flatMap<BasicKeyword>((k) =>
      k.type === "shield" || k.type === "scavenge"
        ? scaleEffect(k, multiplier(k.type, merged.added))
        : [k],
    ),
    ...newEffects,
  ];
  const stone = {
    ...cell.stone,
    keywords: merged.keywords,
    ...(runtime ? { runtimeEffects: true as const } : {}),
  };
  const native = shieldEdges({
    ...stone,
    discardBuffs: undefined,
    keywords: effects,
  });
  const shields = (
    cell.shields || shieldEdges(cell.stone, false, cell.grantedKeywords)
  ).map((n, side) =>
    Math.max(0, Math.min(198, n + native[side] - oldShields[side])),
  ) as Edges;
  const bonus: Edges = [0, 0, 0, 0],
    activated = [...(cell.activeKeywords || [])];
  if (board) {
    const scores = score(board),
      owner = cell.owner;
    for (const keyword of newEffects.flatMap((k) =>
      scaleEffect(k, trapKeywordMultiplier(boardTrap(board), stone, k.type)),
    )) {
      if (
        (keyword.type === "head-start" && scores[owner] > scores[1 - owner]) ||
        (keyword.type === "comeback" && scores[owner] < scores[1 - owner])
      ) {
        if (keyword.type !== "head-start" && keyword.type !== "comeback")
          continue;
        bonus[keyword.side] += keyword.amount ?? 1;
        activated.push(keyword);
      } else if (keyword.type === "resonance") {
        const count = board.filter(
          (c) =>
            c &&
            (keyword.tribe
              ? hasTribe(c.stone, keyword.tribe)
              : c.stone.element === keyword.element),
        ).length;
        const amount =
          count *
          ((keyword as typeof keyword & { multiplier?: number }).multiplier ||
            1);
        if (amount) {
          bonus[keyword.side] += amount;
          activated.push({ ...keyword, bonus: Math.min(99, amount) });
        }
      }
    }
  }
  return {
    cell: {
      ...cell,
      stone,
      resolvedEffects: effects,
      shields,
      ...(board
        ? {
            edges: (cell.edges || cell.stone.edges).map((n, side) =>
              Math.min(99, n + bonus[side]),
            ) as Edges,
            activeKeywords: activated,
          }
        : {}),
    },
    added: merged.added,
  };
}
export function discardPriority(stone: Stone, trap?: Trap): number {
  const multiplier = (stone.keywords || []).reduce(
    (n, k) =>
      n *
      (k.type === "amplify" &&
      k.duration === "always" &&
      !trapNullifies(trap, stone, "amplify") &&
      (k.effect === "all" || k.effect === "discard-priority")
        ? 2
        : 1),
    1,
  );
  return Math.min(
    99,
    Math.max(
      0,
      ...(stone.keywords || []).map((keyword) =>
        keyword.type === "discard-priority" ? (keyword.priority ?? 1) : 0,
      ),
    ) *
      multiplier *
      trapKeywordMultiplier(trap, stone, "discard-priority"),
  );
}
export function finishCardsRequired(
  board: Board,
  nextPlayer: Owner,
  hands?: [Stone[], Stone[]],
): [number, number] {
  const remaining = board.filter(
    (cell) => !cell || cell.stone.supercharger,
  ).length;
  if (hands) {
    const stock = hands.map((hand) => hand.filter(finishingCard).length),
      required: [number, number] = [0, 0];
    let current = nextPlayer;
    for (let left = remaining; left > 0 && stock.some(Boolean); left--) {
      if (!stock[current]) current = (1 - current) as Owner;
      stock[current]--;
      required[current]++;
      current = (1 - current) as Owner;
    }
    return required;
  }
  const count: [number, number] = [
    Math.floor(remaining / 2),
    Math.floor(remaining / 2),
  ];
  count[nextPlayer] = Math.ceil(remaining / 2);
  return count;
}
function placedKeywords(cell: NonNullable<Board[number]>): StoneKeyword[] {
  if (cell.silenced) return [];
  return liveKeywords(cell);
}
// Conjure has already resolved against the actual hand cap and available pools.
// Choosing discards is transactional: callers commit only when pending is absent.
export function resolveDiscards(
  board: Board,
  index: number,
  hands: [Stone[], Stone[]],
  seed: number,
  choices: DiscardChoice[] = [],
  automatic = true,
  passEmptyHands = false,
  manualGiftOwners?: Owner[],
  spellDepth = 0,
  nextTurnOwner?: Owner,
): {
  board: Board;
  hands: [Stone[], Stone[]];
  records: DiscardRecord[];
  pending?: DiscardPending;
} {
  if (spellDepth > 24)
    throw new Error("Too many chained discard spells in one play.");
  const caster = playSource(board, index);
  if (!caster || caster.discards) return { board, hands, records: [] };
  const keywords = placedKeywords(caster),
    actor = caster.playedBy ?? caster.owner;
  if (
    !keywords.some(
      (keyword) => keyword.type === "discard" || keyword.type === "enchant",
    )
  ) {
    if (choices.length) throw new Error("This card has no discard choices.");
    return { board, hands, records: [] };
  }
  // A discard reaction does not create a new turn: every nested spell must
  // protect placements for the player who follows the original play.
  const nextPlayer =
    nextTurnOwner ??
    ((caster.stone.spell || keywords.some((k) => k.type === "flash")
      ? actor
      : 1 - actor) as Owner);
  const required = finishCardsRequired(
    board,
    nextPlayer,
    passEmptyHands ? hands : undefined,
  );
  let nextBoard = boardContext([...board], board);
  const nextHands: [Stone[], Stone[]] = [[...hands[0]], [...hands[1]]],
    records: DiscardRecord[] = [],
    used = new Set<DiscardChoice>();
  let state = seed >>> 0 || 0x9e3779b9;
  const random = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  };
  const buffBoard = (
    target: number,
    spec: BuffSpec,
    source: string,
    record: DiscardRecord,
  ) => {
    const cell = nextBoard[target];
    if (!cell || cell.silenced) return;
    const extra = specifiedBuffs(spec);
    const before = cell.edges || cell.stone.edges;
    const edges = before.map((n, side) =>
      Math.max(0, Math.min(99, n + extra.pips[side])),
    ) as Edges;
    const shields = (cell.shields || [0, 0, 0, 0]).map((n, side) =>
      Math.min(198, n + extra.shields[side]),
    ) as Edges;
    const actual = {
      pips: edges.map((n, s) => n - before[s]) as Edges,
      shields: shields.map((n, s) => n - (cell.shields?.[s] || 0)) as Edges,
    };
    let updated: NonNullable<Board[number]> = {
      ...cell,
      edges,
      shields,
      discardBuffs: addBuffs(cell.discardBuffs, actual),
    };
    const grants = (spec as PartingGiftKeyword).keywords || [];
    const result = boardKeywordGift(
      updated,
      grants,
      record.enchant ? nextBoard : undefined,
    );
    updated = result.cell;
    nextBoard[target] = updated;
    record.buffs.push({
      source,
      target: cell.stone.name,
      ...actual,
      ...(result.added.length ? { keywords: result.added } : {}),
      owner: cell.owner,
      location: "board",
    });
  };
  const applyGift = (
    card: Stone,
    owner: Owner,
    gift: PartingGiftKeyword,
    keywordIndex: number,
    giftId: string,
    record: DiscardRecord,
  ): DiscardPending | undefined => {
    const options: GiftOption[] = [];
    const handTarget = ["hand", "enemy-hand", "hands"].includes(gift.target);
    if (handTarget)
      for (const recipientOwner of [0, 1] as Owner[]) {
        if (
          (gift.target === "hand" && recipientOwner !== owner) ||
          (gift.target === "enemy-hand" && recipientOwner === owner)
        )
          continue;
        for (const target of nextHands[recipientOwner])
          options.push({
            id: `hand:${recipientOwner}:${target.id}`,
            stone: target,
            owner: recipientOwner,
            location: "hand",
            edges: target.edges.map((n, s) =>
              Math.max(
                0,
                Math.min(99, n + (target.discardBuffs?.pips[s] || 0)),
              ),
            ) as Edges,
          });
      }
    else
      nextBoard.forEach((cell, target) => {
        if (
          !cell ||
          cell.silenced ||
          (gift.target === "discarder" && target !== index) ||
          (gift.target === "allies" && cell.owner !== owner) ||
          (gift.target === "enemies" && cell.owner === owner)
        )
          return;
        options.push({
          id: `board:${target}`,
          stone: cell.stone,
          owner: cell.owner,
          location: "board",
          boardIndex: target,
          edges: cardEdges(cell),
          shields: cell.shields,
          keywordShields: keywordShieldEdges(cell),
          environment: cell.environment,
        });
      });
    const matches = choices.filter(
      (c) =>
        c.giftId === giftId &&
        c.keywordIndex === keywordIndex &&
        c.owner === owner,
    );
    if (matches.length > 1)
      throw new Error("Choose each Parting Gift only once.");
    const mode = gift.mode || "all",
      count =
        mode === "all"
          ? options.length
          : Math.min(gift.count || 1, options.length);
    let selected: GiftOption[] = [];
    if (mode === "chosen" && count) {
      const choice = matches[0];
      const manual = manualGiftOwners
        ? manualGiftOwners.includes(owner)
        : !automatic && owner === actor;
      if (!choice && manual)
        return {
          keywordIndex,
          owner,
          count,
          requested: gift.count || 1,
          required: 0,
          cards: options.map((o) => o.stone),
          trap: boardTrap(nextBoard),
          gift: {
            id: giftId,
            ...(record.enchant ? { kind: "enchant" as const } : {}),
            source: card.name,
            text: record.enchant
              ? enchantText({ ...gift, type: "enchant" })
              : discardText(gift),
            options,
          },
        };
      if (choice) {
        if (
          choice.cardIds.length !== count ||
          new Set(choice.cardIds).size !== count ||
          choice.cardIds.some((id) => !options.some((o) => o.id === id))
        )
          throw new Error(
            `Choose exactly ${count} eligible Parting Gift targets.`,
          );
        used.add(choice);
        selected = choice.cardIds.map(
          (id) => options.find((o) => o.id === id)!,
        );
      } else {
        const value = (o: GiftOption) =>
          (o.owner === owner ? 1 : -1) *
          ((gift.pips || []).reduce(
            (sum, p) =>
              sum +
              Math.max(0, Math.min(99, o.edges[p.side] + p.amount)) -
              o.edges[p.side],
            0,
          ) +
            (gift.shields || []).reduce((sum, p) => sum + p.amount, 0) +
            (gift.keywords?.length || 0) * 2);
        selected = [...options]
          .sort((a, b) => value(b) - value(a))
          .slice(0, count);
      }
    } else if (mode === "random") {
      if (matches.length)
        throw new Error("Random Parting Gift cannot take a chosen target.");
      const pool = [...options];
      for (let n = 0; n < count; n++)
        selected.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
    } else selected = options;
    for (const option of selected) {
      if (option.location === "board") {
        buffBoard(option.boardIndex!, gift, card.name, record);
        continue;
      }
      const recipient = nextHands[option.owner].find(
        (s) => s.id === option.stone.id,
      )!;
      const extra = specifiedBuffs(gift);
      const before = recipient.edges.map((n, s) =>
        Math.max(0, Math.min(99, n + (recipient.discardBuffs?.pips[s] || 0))),
      ) as Edges;
      extra.pips = before.map(
        (n, s) => Math.max(0, Math.min(99, n + extra.pips[s])) - n,
      ) as Edges;
      const netBuff: DiscardBuffs = {
        pips: before.map(
          (n, s) => n + extra.pips[s] - recipient.edges[s],
        ) as Edges,
        shields: extra.shields.map((n, s) =>
          Math.min(99, n + (recipient.discardBuffs?.shields[s] || 0)),
        ) as Edges,
      };
      extra.shields = netBuff.shields.map(
        (n, s) => n - (recipient.discardBuffs?.shields[s] || 0),
      ) as Edges;
      const runtime =
        !!recipient.runtimeEffects ||
        (gift.keywords || []).some((k) => !validateKeywords([k]));
      const merged = mergeKeywordGrants(
        recipient.keywords || [],
        gift.keywords || [],
        runtime,
      );
      const updated = {
        ...recipient,
        keywords: merged.keywords,
        discardBuffs: [...netBuff.pips, ...netBuff.shields].some(Boolean)
          ? netBuff
          : undefined,
        ...(runtime ? { runtimeEffects: true as const } : {}),
      };
      nextHands[option.owner] = nextHands[option.owner].map((s) =>
        s.id === recipient.id ? updated : s,
      );
      record.buffs.push({
        source: card.name,
        target: recipient.name,
        ...extra,
        ...(merged.added.length ? { keywords: merged.added } : {}),
        owner: option.owner,
        location: "hand",
      });
    }
    return undefined;
  };
  for (const [keywordIndex, keyword] of keywords.entries()) {
    if (keyword.type === "enchant") {
      const record: DiscardRecord = {
        keywordIndex,
        owner: actor,
        requested: 0,
        cards: [],
        skipped: 0,
        buffs: [],
        enchant: true,
      };
      const pending = applyGift(
        caster.stone,
        actor,
        { ...keyword, type: "parting-gift" },
        keywordIndex,
        `enchant:${keywordIndex}:${actor}`,
        record,
      );
      if (pending)
        return { board: nextBoard, hands: nextHands, records, pending };
      records.push(record);
      continue;
    }
    if (keyword.type !== "discard") continue;
    const owners: Owner[] =
      keyword.recipient === "both"
        ? [0, 1]
        : [keyword.recipient === "self" ? actor : ((1 - actor) as Owner)];
    for (const owner of owners) {
      const excess = () =>
        Math.max(
          0,
          nextHands[owner].filter(finishingCard).length - required[owner],
        );
      const disposable = () =>
        nextHands[owner].filter((c) => !finishingCard(c) || excess() > 0);
      const count = Math.min(
        keyword.count,
        nextHands[owner].filter((c) => !finishingCard(c)).length + excess(),
      );
      const record: DiscardRecord = {
        keywordIndex,
        owner,
        requested: keyword.count,
        cards: [],
        skipped: keyword.count - count,
        buffs: [],
      };
      const matches = choices.filter(
        (choice) =>
          choice.keywordIndex === keywordIndex &&
          choice.owner === owner &&
          choice.giftId === undefined,
      );
      if (matches.length > 1)
        throw new Error("Choose each discard group only once.");
      let ids: string[];
      if (keyword.mode === "chosen" && count) {
        const choice = matches[0];
        if (!choice && !automatic)
          return {
            board: nextBoard,
            hands: nextHands,
            records,
            pending: {
              keywordIndex,
              owner,
              count,
              requested: keyword.count,
              required: required[owner],
              cards: disposable(),
              ...(boardTrap(nextBoard) ? { trap: boardTrap(nextBoard) } : {}),
            },
          };
        if (choice) {
          if (
            choice.cardIds.length !== count ||
            new Set(choice.cardIds).size !== count ||
            choice.cardIds.some(
              (id) => !nextHands[owner].some((card) => card.id === id),
            ) ||
            choice.cardIds.filter((id) =>
              nextHands[owner].some((c) => c.id === id && finishingCard(c)),
            ).length > excess()
          )
            throw new Error(`Choose exactly ${count} cards from this hand.`);
          used.add(choice);
          ids = [...choice.cardIds];
        } else
          ids = [...disposable()]
            .sort((a, b) => {
              const strength = (card: Stone) =>
                card.edges.reduce((a, b) => a + b, 0) +
                (card.discardBuffs?.pips.reduce((a, b) => a + b, 0) || 0) +
                (card.discardBuffs?.shields.reduce((a, b) => a + b, 0) || 0) +
                (card.keywords?.length || 0);
              return (
                Number(finishingCard(a)) - Number(finishingCard(b)) ||
                (strength(a) - strength(b)) * (owner === actor ? 1 : -1)
              );
            })
            .slice(0, count)
            .map((card) => card.id);
      } else {
        if (matches.length)
          throw new Error("That discard group cannot take a chosen target.");
        ids = [];
        const available = [...nextHands[owner]];
        for (let n = 0; n < count; n++) {
          const finishingChosen = ids.filter(
            (id) =>
              available.every((c) => c.id !== id) &&
              nextHands[owner].some((c) => c.id === id && finishingCard(c)),
          ).length;
          const safe = available.filter(
            (c) => !finishingCard(c) || finishingChosen < excess(),
          );
          const priority = Math.max(
              ...safe.map((card) =>
                discardPriority(card, boardTrap(nextBoard)),
              ),
            ),
            candidates = safe.filter(
              (card) =>
                discardPriority(card, boardTrap(nextBoard)) === priority,
            ),
            chosen = candidates[Math.floor(random() * candidates.length)];
          ids.push(chosen.id);
          available.splice(
            available.findIndex((card) => card.id === chosen.id),
            1,
          );
        }
      }
      const discardedCards = ids.map(
        (id) => nextHands[owner].find((card) => card.id === id)!,
      );
      nextHands[owner] = nextHands[owner].filter(
        (card) => !ids.includes(card.id),
      );
      record.cards = discardedCards.map((card) => ({
        id: card.id,
        name: card.name,
      }));
      for (const [discardIndex, card] of discardedCards.entries()) {
        // Snapshot observers so a reward cannot retroactively trigger itself.
        const observers = nextBoard.flatMap((cell, target) =>
          cell
            ? placedKeywords(cell).flatMap((ability) =>
                ability.type === "scavenge" &&
                (ability.from === "both" ||
                  (ability.from === "self"
                    ? owner === cell.owner
                    : owner !== cell.owner))
                  ? [{ target, ability, name: cell.stone.name }]
                  : [],
              )
            : [],
        );
        for (const observer of observers)
          for (const ability of scaleEffect(
            observer.ability,
            trapKeywordMultiplier(
              boardTrap(nextBoard),
              nextBoard[observer.target]!.stone,
              "scavenge",
            ),
          ))
            buffBoard(observer.target, ability, observer.name, record);
        const giftMultiplier = (card.keywords || []).reduce(
          (n, k) =>
            n *
            (k.type === "amplify" &&
            k.duration === "always" &&
            !trapNullifies(boardTrap(nextBoard), card, "amplify") &&
            (k.effect === "all" || k.effect === "parting-gift")
              ? 2
              : 1),
          1,
        );
        const gifts = (card.keywords || []).flatMap((k) =>
          k.type === "parting-gift"
            ? scaleEffect(
                k,
                Math.min(
                  32,
                  giftMultiplier *
                    trapKeywordMultiplier(
                      boardTrap(nextBoard),
                      card,
                      "parting-gift",
                    ),
                ),
              )
            : [],
        );
        for (const [giftIndex, gift] of gifts.entries()) {
          if (gift.type !== "parting-gift") continue;
          const pending = applyGift(
            card,
            owner,
            gift,
            keywordIndex,
            `${keywordIndex}:${owner}:${discardIndex}:${giftIndex}`,
            record,
          );
          if (pending)
            return { board: nextBoard, hands: nextHands, records, pending };
        }
        if (card.spell === "discard") {
          const targets = chooseKeywordTargets(nextBoard, -1, card, owner);
          const triggered = castSpell(nextBoard, card, owner, targets, true);
          const sourceIndex = triggered.sourceIndex!;
          const conjured = applyConjure(
            triggered.board,
            sourceIndex,
            nextHands,
            () => CONJURE_CARDS.map((card) => characterDefault(card)),
            seed ^
              Math.imul(spellDepth + 1, 0x27d4eb2d) ^
              (triggered.board.spellHistory?.length || 0),
          );
          const assembled = assembleParts(
            conjured.board,
            sourceIndex,
            conjured.hands,
            seed ^ 0x71ab,
          );
          const nested = resolveDiscards(
            assembled.board,
            sourceIndex,
            assembled.hands,
            seed ^ 0x61ab ^ (triggered.board.spellHistory?.length || 0),
            [],
            true,
            passEmptyHands,
            [],
            spellDepth + 1,
            nextPlayer,
          );
          nextBoard = nested.board;
          nextHands[0] = nested.hands[0];
          nextHands[1] = nested.hands[1];
          (record.spells ||= []).push(card.name);
        }
      }
      records.push(record);
    }
  }
  if (choices.some((choice) => !used.has(choice)))
    throw new Error("Unexpected discard choice.");
  nextBoard = updatePlaySource(nextBoard, index, {
    ...playSource(nextBoard, index)!,
    discards: records,
  });
  return { board: nextBoard, hands: nextHands, records };
}
export function discardSummary(
  records: DiscardRecord[],
  names: string[],
): string {
  return records
    .map((record) =>
      record.enchant
        ? `${names[record.owner]} Enchant: ${record.buffs.length} card${record.buffs.length === 1 ? "" : "s"} affected`
        : `${names[record.owner]} discarded ${record.cards.length}${record.cards.length ? `: ${record.cards.map((card) => card.name).join(", ")}` : ""}${record.skipped ? ` · ${record.skipped} protected to finish the board` : ""}${record.buffs.length ? ` · ${record.buffs.length} buffs` : ""}${record.spells?.length ? ` · Discard spells: ${record.spells.join(", ")}` : ""}`,
    )
    .join(" · ");
}
export function buffText(spec: BuffSpec): string {
  return (["pips", "shields"] as const)
    .flatMap((kind) =>
      (spec[kind] || []).map(
        (pip) =>
          `${pip.amount > 0 ? "+" : ""}${pip.amount} ${["North", "East", "South", "West"][pip.side]} ${kind === "pips" ? "pip" : "Shield"}${Math.abs(pip.amount) === 1 ? "" : "s"}`,
      ),
    )
    .join(" · ");
}
export function partingGiftSummary(
  k: PartingGiftKeyword | EnchantKeyword,
): string {
  const target = {
    discarder: "CASTER",
    allies: "ALLY BOARD",
    enemies: "ENEMY BOARD",
    board: "BOARD",
    hand: "OWN HAND",
    "enemy-hand": "ENEMY HAND",
    hands: "BOTH HANDS",
  }[k.target];
  const selection =
    k.mode && k.mode !== "all" ? `${k.mode.toUpperCase()} ${k.count || 1}` : "";
  const stats = (["pips", "shields"] as const).flatMap((kind) =>
    (k[kind] || []).map(
      (p) =>
        `${p.amount > 0 ? "+" : ""}${p.amount}${["N", "E", "S", "W"][p.side]}${kind === "shields" ? " SH" : ""}`,
    ),
  );
  return [
    target,
    selection,
    ...stats,
    ...(k.keywords || []).map((g) => g.type.replaceAll("-", " ")),
  ]
    .filter(Boolean)
    .join(" · ");
}
export function enchantText(keyword: EnchantKeyword): string {
  return `On play, ${partingGiftSummary(keyword)}. Resolve after Conjure. Hand recipients use granted keywords on their later plays or discards. Board Shield and conditional pip bonuses activate immediately for their controller; on-play effects are attached without replaying them or captures.`;
}
export function discardText(keyword: DiscardKeyword): string {
  switch (keyword.type) {
    case "enchant":
      return enchantText(keyword);
    case "discard":
      return `Discard up to ${keyword.count} ${keyword.mode === "chosen" ? "chosen" : "random"} card${keyword.count === 1 ? "" : "s"} from ${keyword.recipient === "both" ? "both hands" : keyword.recipient === "self" ? "your hand" : "the opponent’s hand"} after captures and Conjure. Keep enough cards for every remaining turn.`;
    case "scavenge":
      return `When a card is discarded from ${keyword.from === "both" ? "either hand" : keyword.from === "self" ? "your hand" : "the opponent’s hand"}, this board card gains ${buffText(keyword)} per card discarded. Buffs apply after captures. Silence disables this ability and its discard bonuses.`;
    case "parting-gift": {
      const target = {
        discarder: "the card causing the discard",
        allies: "its owner’s board cards",
        enemies: "the opponent’s board cards",
        board: "both players’ board cards",
        hand: "its owner’s remaining hand",
        "enemy-hand": "the opponent’s hand",
        hands: "both remaining hands",
      }[keyword.target];
      const effects = [
        buffText(keyword),
        keyword.keywords?.length
          ? `gain ${keyword.keywords
              .map((k) =>
                k.type
                  .split("-")
                  .map((w) => w[0].toUpperCase() + w.slice(1))
                  .join(" "),
              )
              .join(", ")}`
          : "",
      ]
        .filter(Boolean)
        .join("; ");
      return `When discarded, ${effects} for ${keyword.mode && keyword.mode !== "all" ? `${keyword.count || 1} ${keyword.mode} card${keyword.count === 1 ? "" : "s"} among ` : ""}${target}. Chosen targets are selected by the discarded card’s owner. Pips stay between 0 and 99. Board gifts activate passive abilities without replaying on-play effects; Silence disables them. These changes last for this battle.`;
    }
    case "discard-priority":
      return `Random discards select this card before cards with lower priority (${keyword.priority ?? 1}). Equal priority is random. Chosen discards can select any eligible card. The finishing-card safeguard still applies.`;
  }
}
export function validateDiscardRecords(
  value: unknown,
  runtime = false,
): value is DiscardRecord[] {
  return (
    Array.isArray(value) &&
    value.length <= (runtime ? 8192 : 58) &&
    value.every(
      (record) =>
        record &&
        Number.isInteger(record.keywordIndex) &&
        record.keywordIndex >= 0 &&
        record.keywordIndex < (runtime ? 4096 : 29) &&
        [0, 1].includes(record.owner) &&
        Number.isInteger(record.requested) &&
        (record.enchant === undefined || record.enchant === true) &&
        record.requested >= (record.enchant ? 0 : 1) &&
        record.requested <= (runtime ? 160 : 5) &&
        Array.isArray(record.cards) &&
        record.cards.length <= (runtime ? 20 : 5) &&
        record.cards.every(
          (card: { id: string; name: string }) =>
            card &&
            typeof card.id === "string" &&
            card.id.length <= 200 &&
            typeof card.name === "string" &&
            card.name.length > 0 &&
            card.name.length <= 40,
        ) &&
        Number.isInteger(record.skipped) &&
        record.skipped >= 0 &&
        record.skipped + record.cards.length === record.requested &&
        (record.spells === undefined ||
          (Array.isArray(record.spells) &&
            record.spells.length <= 20 &&
            record.spells.every(
              (name: unknown) => typeof name === "string" && name.length <= 40,
            ))) &&
        Array.isArray(record.buffs) &&
        record.buffs.length <= 32768 &&
        record.buffs.every(
          (buff: {
            source: string;
            target: string;
            pips: Edges;
            shields: Edges;
            keywords?: StoneKeyword[];
          }) =>
            buff &&
            typeof buff.source === "string" &&
            typeof buff.target === "string" &&
            edgeArray(buff.pips, true) &&
            edgeArray(buff.shields) &&
            (buff.keywords === undefined ||
              (Array.isArray(buff.keywords) &&
                buff.keywords.length <= 128 &&
                validRuntimeEffects(buff.keywords))),
        ),
    )
  );
}
