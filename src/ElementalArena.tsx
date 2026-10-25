import { ArrowRight, Orbit } from "lucide-react";
import { ELEMENT_ICONS } from "./Artwork";
import { ELEMENTS } from "./game";
import type { Element } from "./game";
export function ElementalArena({
  current,
  next,
}: {
  current: Element;
  next: Element;
}) {
  const Current = ELEMENT_ICONS[current],
    Next = ELEMENT_ICONS[next];
  return (
    <section
      className="elemental-arena"
      aria-label="Elemental Vortex arena"
      aria-live="polite"
    >
      <div className="elemental-arena-title">
        <Orbit size={20} />
        <div>
          <strong>Elemental Vortex</strong>
          <span>Win the score to defeat Kaos.</span>
        </div>
      </div>
      <div className="elemental-forecast">
        <div
          className="elemental-current"
          aria-label={`Current element: ${ELEMENTS[current].name}`}
        >
          <Current size={30} />
          <span>
            <small>NOW</small>
            <strong>{ELEMENTS[current].name}</strong>
            <b>Matching cards: +1 on every edge</b>
          </span>
        </div>
        <ArrowRight size={20} aria-hidden="true" />
        <div
          className="elemental-next"
          aria-label={`Next element: ${ELEMENTS[next].name}`}
          style={{ color: ELEMENTS[next].ink, background: ELEMENTS[next].pale }}
        >
          <Next size={28} />
          <span>
            <small>NEXT ELEMENT</small>
            <strong>{ELEMENTS[next].name}</strong>
          </span>
        </div>
      </div>
      <p>
        Both players’ matching cards gain +1 for attacks and defense. The
        element changes after each placement; the bonus never stacks and does
        not change printed stats. Sunder and Silence cannot remove the arena
        bonus.
      </p>
    </section>
  );
}
