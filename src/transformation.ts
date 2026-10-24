import { ELEMENTS } from "./game.ts";
import type { Edges, Element, Side, Stone, StoneKeyword } from "./game.ts";
import type { Adventure } from "./adventure.ts";
import { hasRelic } from "./relics.ts";
export type RunCardFactory = (
  seed: number,
  budget: number,
  id: string,
  tier?: number,
  bonus?: number,
) => Stone;
export function transformedCard(
  run: Pick<Adventure, "seed" | "floor" | "relics">,
  old: Stone,
  salt: number,
  make: RunCardFactory,
): Stone {
  let state =
    (run.seed ^
      Math.imul(run.floor + 1, 0x85ebca6b) ^
      Math.imul(salt + 1, 0x9e3779b1) ^
      Array.from(old.id).reduce(
        (a, c) => Math.imul(a, 31) + c.charCodeAt(0),
        0,
      )) >>>
      0 || 1;
  const rng = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  };
  const seed = Math.floor(rng() * 0x7fffffff),
    budget = Math.min(
      12,
      Math.max(
        old.edges.reduce((a, b) => a + b, 0),
        4 + run.floor,
      ) + (rng() < 0.4 ? 1 : 0),
    );
  let card = make(
    seed,
    budget,
    `transformed-${run.seed}-${run.floor}-${salt}`,
    0,
  );
  for (let attempt = 1; card.name === old.name && attempt < 16; attempt++)
    card = make(
      seed + 101 * attempt,
      budget,
      `transformed-${run.seed}-${run.floor}-${salt}`,
      0,
    );
  const elements = Object.keys(ELEMENTS) as Element[],
    candidates: StoneKeyword[] = [
      { type: "silence" },
      { type: "dizzy" },
      { type: "sunder", side: "any", amount: 1 + Math.floor(rng() * 3) },
    ];
  for (const side of [0, 1, 2, 3] as Side[])
    candidates.push(
      { type: "head-start", side },
      { type: "comeback", side },
      {
        type: "resonance",
        side,
        element: elements[Math.floor(rng() * elements.length)],
      },
      { type: "sunder", side, amount: 1 + Math.floor(rng() * 3) },
    );
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  let count = 0;
  if (rng() < (hasRelic(run, "runesmiths-quill") ? 1 : 0.9)) {
    const roll = rng();
    count =
      roll < 0.5 ? 1 : roll < 0.78 ? 2 : roll < 0.92 ? 3 : roll < 0.98 ? 4 : 5;
  }
  return {
    ...card,
    id: old.id,
    custom: true,
    edges: [...card.edges] as Edges,
    keywords: candidates
      .filter(
        (keyword, index) =>
          candidates.findIndex((other) => other.type === keyword.type) ===
          index,
      )
      .slice(0, count),
    description:
      "A stone reshaped by an encounter. Its new form and keywords are permanent.",
  };
}
