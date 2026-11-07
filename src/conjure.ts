import { CHARACTER_STONES, ENEMY_STONES } from "./characters.ts";
import { hasTribe, validTribe, tribeName } from "./tribes.ts";
import type { Tribe } from "./tribes.ts";
import { mergeKeywordGrants, validateKeywords } from "./game.ts";
import type {
  Board,
  Element,
  Owner,
  Side,
  Stone,
  StoneKeyword,
} from "./game.ts";
import { keywordNames } from "./effects.ts";
import { readTokens, validTokenKey, tokenName } from "./tokens.ts";

export const MAX_HAND_CARDS = 20;
export const CONJURE_CARDS = [...CHARACTER_STONES, ...ENEMY_STONES];
const CARD_KEYS = new Set(CONJURE_CARDS.map((card) => card.portrait!));
export type ConjureKeyword = {
  type: "conjure";
  count: number;
  recipient: "self" | "opponent" | "both";
  pips?: { side: Side; amount: number }[];
  keywords?: StoneKeyword[];
} & (
  | { mode: "specific"; card: string }
  | { mode: "token"; token: string }
  | {
      mode: "random";
      element?: Element;
      tribe?: Tribe;
      pool?: "cards" | "tokens" | "all";
    }
);
export interface Conjuration {
  keywordIndex: number;
  recipient: Owner;
  cards: { id: string; name: string }[];
  skipped: number;
  reason?: "full" | "no-match";
}
export function validateConjure(
  input: unknown,
  depth = 0,
): input is ConjureKeyword {
  if (!input || typeof input !== "object") return false;
  const value = input as Record<string, unknown>;
  return (
    value.type === "conjure" &&
    Number.isInteger(value.count) &&
    Number(value.count) >= 1 &&
    Number(value.count) <= 5 &&
    (value.pips === undefined ||
      (Array.isArray(value.pips) &&
        value.pips.length >= 1 &&
        value.pips.length <= 4 &&
        new Set(value.pips.map((pip) => pip?.side)).size ===
          value.pips.length &&
        value.pips.every(
          (pip) =>
            pip &&
            Number.isInteger(pip.side) &&
            pip.side >= 0 &&
            pip.side <= 3 &&
            Number.isInteger(pip.amount) &&
            pip.amount >= 1 &&
            pip.amount <= 5,
        ))) &&
    (value.keywords === undefined ||
      (Array.isArray(value.keywords) &&
        value.keywords.length >= 1 &&
        value.keywords.length <= 5 &&
        validateKeywords(value.keywords, depth + 1))) &&
    ["self", "opponent", "both"].includes(String(value.recipient)) &&
    (value.mode === "specific"
      ? typeof value.card === "string" &&
        CARD_KEYS.has(value.card) &&
        value.element === undefined &&
        value.tribe === undefined &&
        value.token === undefined &&
        value.pool === undefined
      : value.mode === "token"
        ? validTokenKey(value.token) &&
          value.card === undefined &&
          value.element === undefined &&
          value.tribe === undefined &&
          value.pool === undefined
        : value.mode === "random" &&
          value.token === undefined &&
          (value.pool === undefined ||
            ["cards", "tokens", "all"].includes(String(value.pool))) &&
          value.card === undefined &&
          (value.element === undefined ||
            [
              "fire",
              "water",
              "life",
              "air",
              "magic",
              "earth",
              "tech",
              "undead",
              "light",
              "dark",
              "neutral",
            ].includes(String(value.element))) &&
          (value.tribe === undefined || validTribe(value.tribe)))
  );
}
export function conjureCardName(key: string): string {
  return CONJURE_CARDS.find((card) => card.portrait === key)?.name || key;
}
export function conjureSource(keyword: ConjureKeyword): string {
  return keyword.mode === "specific"
    ? conjureCardName(keyword.card)
    : keyword.mode === "token"
      ? `${tokenName(keyword.token)} · Token`
      : `Random${keyword.element ? ` ${keyword.element[0].toUpperCase()}${keyword.element.slice(1)}` : ""}${keyword.tribe ? ` ${tribeName(keyword.tribe)}` : ""}${keyword.pool === "tokens" ? " tokens" : keyword.pool === "all" ? " cards/tokens" : ""}`;
}
export function conjureText(keyword: ConjureKeyword): string {
  const recipient =
    keyword.recipient === "self"
      ? "your hand"
      : keyword.recipient === "opponent"
        ? "the opponent’s hand"
        : "each player’s hand";
  return `Add ${keyword.count} ${conjureSource(keyword)} card${keyword.count === 1 ? "" : "s"} to ${recipient} after this play.${conjureBuffText(keyword) ? ` Each copy: ${conjureBuffText(keyword)}. Extra pips last for this battle; added keywords activate when the copy is played.` : ""}`;
}
export function conjureBuffText(keyword: ConjureKeyword): string {
  const pips = keyword.pips || [];
  return [
    pips.length === 4 && pips.every((pip) => pip.amount === pips[0].amount)
      ? `+${pips[0].amount} per side`
      : pips
          .map(
            (pip) =>
              `+${pip.amount} ${["North", "East", "South", "West"][pip.side]}`,
          )
          .join(", "),
    keyword.keywords?.length ? `Gain ${keywordNames(keyword.keywords)}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}
export function conjurationSummary(
  records: Conjuration[],
  names: string[],
): string {
  return records
    .map(
      (record) =>
        `${names[record.recipient]} +${record.cards.length}${record.cards.length ? `: ${record.cards.map((card) => card.name).join(", ")}` : ""}${record.skipped ? ` · ${record.skipped} skipped (${record.reason === "no-match" ? "no matching cards" : "hand full"})` : ""}`,
    )
    .join(" · ");
}

// Called only after a successful placement and spending the played hand card.
// AI simulations keep using the inexpensive board rules without generating cards.
export function applyConjure(
  board: Board,
  index: number,
  hands: [Stone[], Stone[]],
  catalogue: readonly Stone[] | (() => readonly Stone[]),
  seed: number,
  tokens: readonly Stone[] | (() => readonly Stone[]) = readTokens,
): { board: Board; hands: [Stone[], Stone[]]; conjurations: Conjuration[] } {
  const cell = board[index];
  if (!cell || cell.silenced || cell.conjurations)
    return { board, hands, conjurations: [] };
  const keywords = (cell.stone.keywords || []).flatMap((keyword) =>
    keyword.type === "combo" ? cell.grantedKeywords || [] : [keyword],
  );
  if (!keywords.some((keyword) => keyword.type === "conjure"))
    return { board, hands, conjurations: [] };
  const cards = typeof catalogue === "function" ? catalogue() : catalogue;
  let tokenPool: readonly Stone[] | undefined;
  const getTokens = () =>
    (tokenPool ??= typeof tokens === "function" ? tokens() : tokens);
  const nextHands: [Stone[], Stone[]] = [[...hands[0]], [...hands[1]]];
  const usedIds = new Set([
    ...board.flatMap((placed) => (placed ? [placed.stone.id] : [])),
    ...hands.flat().map((card) => card.id),
  ]);
  const records: Conjuration[] = [];
  let state = seed >>> 0 || 0x9e3779b9;
  const random = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  };
  keywords.forEach((keyword, keywordIndex) => {
    if (keyword.type !== "conjure") return;
    const candidates =
      keyword.mode === "token" ||
      (keyword.mode === "random" && keyword.pool === "tokens")
        ? getTokens()
        : keyword.mode === "random" && keyword.pool === "all"
          ? [...cards.filter((card) => !card.token), ...getTokens()]
          : cards;
    const pool = candidates.filter((card) =>
      keyword.mode === "specific"
        ? !card.token && (card.characterKey || card.portrait) === keyword.card
        : keyword.mode === "token"
          ? card.token === true && card.id === keyword.token
          : (keyword.pool === "all" ||
              (keyword.pool === "tokens"
                ? card.token === true
                : !card.token)) &&
            (!keyword.element || card.element === keyword.element) &&
            (!keyword.tribe || hasTribe(card, keyword.tribe)),
    );
    const owner = cell.playedBy ?? cell.owner;
    const recipients: Owner[] =
      keyword.recipient === "both"
        ? [0, 1]
        : [keyword.recipient === "self" ? owner : ((1 - owner) as Owner)];
    for (const recipient of recipients) {
      const record: Conjuration = {
        keywordIndex,
        recipient,
        cards: [],
        skipped: 0,
      };
      let available = [...pool];
      for (let n = 0; n < keyword.count; n++) {
        if (!pool.length || nextHands[recipient].length >= MAX_HAND_CARDS) {
          record.skipped++;
          record.reason = pool.length ? "full" : "no-match";
          continue;
        }
        if (!available.length) available = [...pool];
        const choice =
          keyword.mode !== "random"
            ? 0
            : Math.floor(random() * available.length);
        const original = available.splice(choice, 1)[0];
        let id = `custom-conjured-${(seed >>> 0).toString(36)}-${cell.playedOrder || index + 1}-${keywordIndex}-${recipient}-${n}`;
        while (usedIds.has(id)) id += "x";
        usedIds.add(id);
        const card: Stone = {
          ...structuredClone(original),
          id,
          custom: true,
          conjured: true,
        };
        if (keyword.pips?.length) {
          for (const pip of keyword.pips)
            card.edges[pip.side] = Math.min(
              64,
              card.edges[pip.side] + pip.amount,
            );
        }
        if (keyword.keywords?.length)
          card.keywords = mergeKeywordGrants(
            card.keywords || [],
            keyword.keywords,
          ).keywords;
        nextHands[recipient].push(card);
        record.cards.push({ id, name: card.name });
      }
      records.push(record);
    }
  });
  const nextBoard = [...board];
  nextBoard[index] = { ...cell, conjurations: records };
  return { board: nextBoard, hands: nextHands, conjurations: records };
}

export function validateConjurations(value: unknown): value is Conjuration[] {
  return (
    Array.isArray(value) &&
    value.length <= 58 &&
    value.every(
      (record) =>
        record &&
        Number.isInteger(record.keywordIndex) &&
        record.keywordIndex >= 0 &&
        record.keywordIndex < 29 &&
        [0, 1].includes(record.recipient) &&
        Array.isArray(record.cards) &&
        record.cards.length <= 5 &&
        record.cards.every(
          (card: { id: string; name: string }) =>
            card &&
            typeof card.id === "string" &&
            card.id.startsWith("custom-conjured-") &&
            card.id.length <= 160 &&
            typeof card.name === "string" &&
            card.name.length > 0 &&
            card.name.length <= 40,
        ) &&
        Number.isInteger(record.skipped) &&
        record.skipped >= 0 &&
        record.cards.length + record.skipped >= 1 &&
        record.cards.length + record.skipped <= 5 &&
        (record.skipped
          ? ["full", "no-match"].includes(record.reason)
          : record.reason === undefined),
    )
  );
}
