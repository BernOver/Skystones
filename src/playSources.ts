import type { Board, PlacedStone } from "./game.ts";

// Spells have play history without occupying a board tile. Negative source IDs
// identify those records through the same Conjure/Discard pipeline as stones.
export function boardContext(next: Board, source: Board): Board {
  if (source.spellHistory) next.spellHistory = source.spellHistory;
  return next;
}
export function playSource(
  board: Board,
  index: number,
): PlacedStone | undefined {
  return index < 0
    ? board.spellHistory?.find((cell) => cell.playedOrder === -index)
    : board[index] || undefined;
}
export function updatePlaySource(
  board: Board,
  index: number,
  cell: PlacedStone,
): Board {
  const next = boardContext([...board], board);
  if (index < 0)
    next.spellHistory = (board.spellHistory || []).map((old) =>
      old.playedOrder === -index ? cell : old,
    );
  else next[index] = cell;
  return next;
}
