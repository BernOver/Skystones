import type { Stone, Owner, Board } from "./game.ts";
import { evaluateKeywords } from "./game.ts";
import { cardMatches, validCardFilter } from "./cardFilters.ts";
import type { CardFilter } from "./cardFilters.ts";
export interface AIProfile {
  order?: "tactical" | "low-pips" | "high-pips";
  priority?: CardFilter;
  controlTurns?: number;
}
export function validAIProfile(value: unknown): value is AIProfile {
  const v = value as AIProfile;
  return (
    !!v &&
    typeof v === "object" &&
    (v.order === undefined ||
      ["tactical", "low-pips", "high-pips"].includes(v.order)) &&
    (v.priority === undefined || validCardFilter(v.priority)) &&
    (v.controlTurns === undefined ||
      (Number.isInteger(v.controlTurns) &&
        v.controlTurns >= 0 &&
        v.controlTurns <= 99))
  );
}
export function aiCandidates(
  board: Board,
  hand: Stone[],
  owner: Owner,
  profile?: AIProfile,
  forced?: number,
): Set<number> {
  let cards = hand
    .map((card, i) => ({ card, i }))
    .filter(({ card }) => !card.part && card.spell !== "discard");
  if (forced !== undefined) {
    if (!cards.some(({ i }) => i === forced))
      throw new Error("Choose a playable bot card.");
    return new Set([forced]);
  }
  const preferred = profile?.priority
    ? cards.filter(({ card }) =>
        cardMatches(
          card,
          profile.priority,
          card.edges.map((n, s) =>
            Math.max(0, n + (card.discardBuffs?.pips[s] || 0)),
          ) as Stone["edges"],
        ),
      )
    : [];
  if (preferred.length) cards = preferred;
  if (profile?.order && profile.order !== "tactical" && cards.length) {
    const value = (card: Stone) =>
      card.spell
        ? 0
        : evaluateKeywords(card, board, owner).edges.reduce((a, b) => a + b);
    const target = (profile.order === "low-pips" ? Math.min : Math.max)(
      ...cards.map(({ card }) => value(card)),
    );
    cards = cards.filter(({ card }) => value(card) === target);
  }
  return new Set(cards.map(({ i }) => i));
}
