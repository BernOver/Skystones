import { boardTrap, trapKeywordMultiplier } from "./traps.ts";
import type { Trap } from "./traps.ts";
import { scaleEffect } from "./amplify.ts";
import { placedKeywords as liveKeywords, finishingCard } from "./game.ts";
import type { Board, Edges, Owner, Side, Stone, StoneKeyword } from "./game.ts";

export type BuffSpec = {
  pips?: { side: Side; amount: number }[];
  shields?: { side: Side; amount: number }[];
};
export type DiscardKeyword =
  | {
      type: "discard";
      mode: "chosen" | "random";
      recipient: "self" | "opponent" | "both";
      count: number;
    }
  | ({ type: "scavenge"; from: "self" | "opponent" | "both" } & BuffSpec)
  | ({
      type: "parting-gift";
      target: "discarder" | "allies" | "hand";
    } & BuffSpec)
  | { type: "discard-priority"; priority?: number };
export interface DiscardBuffs {
  pips: Edges;
  shields: Edges;
}
export interface DiscardChoice {
  keywordIndex: number;
  owner: Owner;
  cardIds: string[];
}
export interface DiscardPending {
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
  cards: { id: string; name: string }[];
  skipped: number;
  buffs: { source: string; target: string; pips: Edges; shields: Edges }[];
}
export class DiscardSelectionRequired extends Error {
  pending: DiscardPending;
  constructor(pending: DiscardPending) {
    super("Choose cards to discard.");
    this.name = "DiscardSelectionRequired";
    this.pending = pending;
  }
}
export function validBuffSpec(value: BuffSpec): boolean {
  const valid = (pips: unknown) =>
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
          pip.amount >= 1 &&
          pip.amount <= 5,
      ));
  return (
    valid(value.pips) &&
    valid(value.shields) &&
    !!(value.pips?.length || value.shields?.length)
  );
}
export function validDiscardKeyword(value: DiscardKeyword): boolean {
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
      return (
        ["discarder", "allies", "hand"].includes(value.target) &&
        validBuffSpec(value)
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
const edgeArray = (value: unknown) =>
  Array.isArray(value) &&
  value.length === 4 &&
  value.every((n) => Number.isInteger(n) && n >= 0 && n <= 99);
export function validDiscardBuffs(value: unknown): value is DiscardBuffs {
  if (!value || typeof value !== "object") return false;
  const buff = value as DiscardBuffs;
  return (
    edgeArray(buff.pips) &&
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
): DiscardBuffs {
  return {
    pips: extra.pips.map((n, side) =>
      Math.min(99, n + (old?.pips[side] || 0)),
    ) as Edges,
    shields: extra.shields.map((n, side) =>
      Math.min(99, n + (old?.shields[side] || 0)),
    ) as Edges,
  };
}
export function discardPriority(stone: Stone, trap?: Trap): number {
  const multiplier = (stone.keywords || []).reduce(
    (n, k) =>
      n *
      (k.type === "amplify" &&
      k.duration === "always" &&
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
): {
  board: Board;
  hands: [Stone[], Stone[]];
  records: DiscardRecord[];
  pending?: DiscardPending;
} {
  const caster = board[index];
  if (!caster || caster.discards) return { board, hands, records: [] };
  const keywords = placedKeywords(caster),
    actor = caster.playedBy ?? caster.owner;
  if (!keywords.some((keyword) => keyword.type === "discard")) {
    if (choices.length) throw new Error("This card has no discard choices.");
    return { board, hands, records: [] };
  }
  const required = finishCardsRequired(
    board,
    (keywords.some((k) => k.type === "flash") ? actor : 1 - actor) as Owner,
    passEmptyHands ? hands : undefined,
  );
  let nextBoard = [...board];
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
    const extra = specifiedBuffs(spec),
      edges = [...(cell.edges || cell.stone.edges)] as Edges,
      shields = [...(cell.shields || [0, 0, 0, 0])] as Edges;
    for (const side of [0, 1, 2, 3] as Side[]) {
      edges[side] = Math.min(99, edges[side] + extra.pips[side]);
      shields[side] = Math.min(198, shields[side] + extra.shields[side]);
    }
    nextBoard[target] = {
      ...cell,
      edges,
      shields,
      discardBuffs: addBuffs(cell.discardBuffs, extra),
    };
    record.buffs.push({ source, target: cell.stone.name, ...extra });
  };
  for (const [keywordIndex, keyword] of keywords.entries()) {
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
          choice.keywordIndex === keywordIndex && choice.owner === owner,
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
      for (const id of ids) {
        const card = nextHands[owner].find((card) => card.id === id)!;
        nextHands[owner].splice(
          nextHands[owner].findIndex((card) => card.id === id),
          1,
        );
        record.cards.push({ id: card.id, name: card.name });
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
            (k.effect === "all" || k.effect === "parting-gift")
              ? 2
              : 1),
          1,
        );
        for (const gift of (card.keywords || []).flatMap((k) =>
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
        )) {
          if (gift.type !== "parting-gift") continue;
          if (gift.target === "hand") {
            const extra = specifiedBuffs(gift);
            nextHands[owner] = nextHands[owner].map((recipient) => {
              record.buffs.push({
                source: card.name,
                target: recipient.name,
                ...extra,
              });
              return {
                ...recipient,
                discardBuffs: addBuffs(recipient.discardBuffs, extra),
              };
            });
          } else if (gift.target === "discarder")
            buffBoard(index, gift, card.name, record);
          else
            nextBoard.forEach((cell, target) => {
              if (cell?.owner === owner)
                buffBoard(target, gift, card.name, record);
            });
        }
      }
      records.push(record);
    }
  }
  if (choices.some((choice) => !used.has(choice)))
    throw new Error("Unexpected discard choice.");
  nextBoard[index] = { ...nextBoard[index]!, discards: records };
  return { board: nextBoard, hands: nextHands, records };
}
export function discardSummary(
  records: DiscardRecord[],
  names: string[],
): string {
  return records
    .map(
      (record) =>
        `${names[record.owner]} discarded ${record.cards.length}${record.cards.length ? `: ${record.cards.map((card) => card.name).join(", ")}` : ""}${record.skipped ? ` · ${record.skipped} protected to finish the board` : ""}${record.buffs.length ? ` · ${record.buffs.length} buffs` : ""}`,
    )
    .join(" · ");
}
export function buffText(spec: BuffSpec): string {
  return (["pips", "shields"] as const)
    .flatMap((kind) =>
      (spec[kind] || []).map(
        (pip) =>
          `+${pip.amount} ${["North", "East", "South", "West"][pip.side]} ${kind === "pips" ? "pip" : "Shield"}${pip.amount === 1 ? "" : "s"}`,
      ),
    )
    .join(" · ");
}
export function discardText(keyword: DiscardKeyword): string {
  switch (keyword.type) {
    case "discard":
      return `Discard up to ${keyword.count} ${keyword.mode === "chosen" ? "chosen" : "random"} card${keyword.count === 1 ? "" : "s"} from ${keyword.recipient === "both" ? "both hands" : keyword.recipient === "self" ? "your hand" : "the opponent’s hand"} after captures and Conjure. Keep enough cards for every remaining turn.`;
    case "scavenge":
      return `When a card is discarded from ${keyword.from === "both" ? "either hand" : keyword.from === "self" ? "your hand" : "the opponent’s hand"}, this board card gains ${buffText(keyword)} per card discarded. Buffs apply after captures. Silence disables this ability and its discard bonuses.`;
    case "parting-gift":
      return `When this card is discarded, give ${buffText(keyword)} to ${keyword.target === "discarder" ? "the card that caused the discard" : keyword.target === "hand" ? "the remaining cards in its owner’s hand" : "all cards its owner controls on the board"}. Buffs last for this battle and are disabled by Silence on board cards.`;
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
        record.requested >= 1 &&
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
        Array.isArray(record.buffs) &&
        record.buffs.length <= 512 &&
        record.buffs.every(
          (buff: {
            source: string;
            target: string;
            pips: Edges;
            shields: Edges;
          }) =>
            buff &&
            typeof buff.source === "string" &&
            typeof buff.target === "string" &&
            edgeArray(buff.pips) &&
            edgeArray(buff.shields),
        ),
    )
  );
}
