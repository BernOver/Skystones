import data from "./giants-data.json";
import type { Stone, Element, Creature } from "./game";
const images = import.meta.glob<string>("./assets/giants/*.png", {
  eager: true,
  query: "?inline",
  import: "default",
});
export const GIANTS_STONES: Stone[] = data.map(({ art, ...stone }): Stone => ({
  ...stone,
  element: stone.element as Element,
  creature: stone.creature as Creature,
  edges: [stone.edges[0], stone.edges[1], stone.edges[2], stone.edges[3]],
  origin: "giants",
  ...(art ? { image: images[`./assets/giants/${art}.png`] } : {}),
}));
export const GIANTS_REFERENCE =
  "https://github.com/NicMineDude/Skystones-JAVA-Edition/blob/7c9282237973099d8fa3975b4572c2d810a6e2f4/src/main/resources/cardBase.csv";
