import { CHARACTER_PORTRAITS } from "./characters";
const images = import.meta.glob<string>("./assets/characters/*.webp", {
  eager: true,
  query: "?inline",
  import: "default",
});
export function portraitImage(id?: string): string | undefined {
  return id ? images[`./assets/characters/${id}.webp`] : undefined;
}
export const PORTRAIT_OPTIONS = CHARACTER_PORTRAITS;
