export const DELETED_CONTENT_STORAGE = "skystones-deleted-content-v1";
export type DeletedKind = "card" | "trap";
export interface DeletedContent {
  kind: DeletedKind;
  id: string;
  name: string;
}
export function readDeletedContent(): DeletedContent[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const data: unknown = JSON.parse(
      localStorage.getItem(DELETED_CONTENT_STORAGE) || "[]",
    );
    if (!Array.isArray(data) || data.length > 1000) return [];
    return data.filter(
      (item): item is DeletedContent =>
        !!item &&
        ["card", "trap"].includes(item.kind) &&
        typeof item.id === "string" &&
        item.id.length > 0 &&
        item.id.length <= 200 &&
        typeof item.name === "string" &&
        item.name.length <= 80,
    );
  } catch {
    return [];
  }
}
export function availableCards<T extends { id: string }>(
  cards: readonly T[],
): T[] {
  const removed = new Set(
    readDeletedContent()
      .filter((item) => item.kind === "card")
      .map((item) => item.id),
  );
  return cards.filter((card) => !removed.has(card.id));
}
export function contentDeleted(kind: DeletedKind, id: string): boolean {
  return readDeletedContent().some(
    (item) => item.kind === kind && item.id === id,
  );
}
function writeDeletedContent(items: DeletedContent[]) {
  localStorage.setItem(DELETED_CONTENT_STORAGE, JSON.stringify(items));
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event(DELETED_CONTENT_STORAGE));
}
export function deleteDefault(kind: DeletedKind, id: string, name: string) {
  const items = readDeletedContent().filter(
    (item) => item.kind !== kind || item.id !== id,
  );
  if (items.length >= 1000)
    throw new Error("The deleted-content list is full. Restore an item first.");
  writeDeletedContent([...items, { kind, id, name: name.slice(0, 80) }]);
}
export function restoreDefault(kind: DeletedKind, id: string) {
  writeDeletedContent(
    readDeletedContent().filter((item) => item.kind !== kind || item.id !== id),
  );
}
export function restoreDeletedDefaults() {
  writeDeletedContent([]);
}
