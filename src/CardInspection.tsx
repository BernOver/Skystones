import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowUpRight,
  Check,
  Flag,
  Info,
  RotateCcw,
  Waves,
} from "lucide-react";
import { ELEMENT_ICONS, StoneCard } from "./Artwork";
import { ELEMENTS, KEYWORD_RULES, SIDE_NAMES } from "./game";
import type { ActiveKeyword, Edges, KeywordType, Stone } from "./game";

export interface Inspection {
  stone: Stone;
  sourceId: string;
  anchor: { left: number; right: number; top: number };
  anchorElement: HTMLElement;
  edges: Edges;
  activeKeywords: ActiveKeyword[];
  played: boolean;
  playerName: string;
  controllerName?: string;
}

export function KeywordDetails({
  stone,
  activeKeywords,
  played = false,
}: {
  stone: Stone;
  activeKeywords?: ActiveKeyword[];
  played?: boolean;
}) {
  return (
    <div className="keyword-details">
      {(Object.keys(KEYWORD_RULES) as KeywordType[]).map((type) => {
        const keywords = (stone.keywords || []).filter(
          (keyword) => keyword.type === type,
        );
        if (!keywords.length) return null;
        if (type === "resonance")
          return (
            <ResonanceDetails
              key={type}
              stone={stone}
              activeKeywords={activeKeywords}
              played={played}
            />
          );
        const rule = KEYWORD_RULES[type];
        const active = activeKeywords?.some((keyword) => keyword.type === type);
        const Icon = type === "head-start" ? Flag : RotateCcw;
        const sides = keywords
          .map((keyword) => SIDE_NAMES[keyword.side])
          .join(", ");
        return (
          <section
            className={`keyword-rule ${active ? "keyword-active" : ""}`}
            key={type}
          >
            <div className="keyword-rule-heading">
              <Icon size={15} />
              <strong>{rule.name}</strong>
              <span>{sides}</span>
            </div>
            <p>
              If its player is{" "}
              <strong>{rule.condition} before placement</strong>,{" "}
              {keywords.length === 1 ? "this edge gains" : "these edges gain"}{" "}
              <strong>+1 pip</strong> for the rest of the match.
            </p>
            {activeKeywords !== undefined && (
              <span className={`keyword-status ${active ? "is-active" : ""}`}>
                {active ? <Check size={12} /> : <Info size={12} />}
                {played
                  ? active
                    ? "Activated when played · bonus locked in"
                    : "Did not activate when played"
                  : active
                    ? "Will activate if played now"
                    : "Will not activate with the current score"}
              </span>
            )}
          </section>
        );
      })}
      {!stone.keywords?.length && (
        <p className="no-keywords">
          No keywords. This stone uses its printed edge strengths.
        </p>
      )}
      {!!stone.keywords?.length && (
        <p className="keyword-timing">
          <Info size={12} />
          Check once, before placement. Ties block Head Start and Comeback only.
          Bonuses remain through captures and score changes.
        </p>
      )}
    </div>
  );
}

function ResonanceDetails({
  stone,
  activeKeywords,
  played,
}: {
  stone: Stone;
  activeKeywords?: ActiveKeyword[];
  played: boolean;
}) {
  const keywords = (stone.keywords || []).filter(
    (keyword) => keyword.type === "resonance",
  );
  const anyActive = activeKeywords?.some(
    (keyword) => keyword.type === "resonance" && keyword.bonus > 0,
  );
  return (
    <section
      className={`keyword-rule resonance-rule ${anyActive ? "keyword-active" : ""}`}
    >
      <div className="keyword-rule-heading">
        <Waves size={15} />
        <strong>Resonance</strong>
        <span>Element count</span>
      </div>
      <p>
        Each listed edge gains{" "}
        <strong>+1 pip per card of its chosen element</strong> already on the
        board. Count both players’ cards <strong>before placement</strong>; this
        card does not count.
      </p>
      <div className="resonance-rule-list">
        {keywords.map((keyword) => {
          const active = activeKeywords?.find(
            (candidate) =>
              candidate.type === "resonance" &&
              candidate.side === keyword.side &&
              candidate.element === keyword.element,
          );
          const bonus = active?.type === "resonance" ? active.bonus : 0;
          const Icon = ELEMENT_ICONS[keyword.element];
          return (
            <div className="resonance-rule-row" key={keyword.side}>
              <Icon
                size={14}
                style={{ color: ELEMENTS[keyword.element].color }}
              />
              <div>
                <strong>{ELEMENTS[keyword.element].name}</strong>
                <span>{SIDE_NAMES[keyword.side]} edge</span>
              </div>
              <div
                className={`resonance-amount ${bonus > 0 ? "is-active" : ""}`}
              >
                {activeKeywords === undefined ? (
                  <b>+1 per card</b>
                ) : (
                  <>
                    <b>+{bonus}</b>
                    <small>
                      {played
                        ? `${bonus} matching · locked in`
                        : `${bonus} matching · if played now`}
                    </small>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <span className="keyword-status">
        <Info size={12} />
        {played
          ? "The count is locked. Later cards and captures do not change it."
          : "No matching cards means +0. The count is locked when played."}
      </span>
    </section>
  );
}

export function InspectionDetails({ inspection }: { inspection: Inspection }) {
  const { stone, edges, played, playerName, controllerName, activeKeywords } =
    inspection;
  return (
    <>
      <div className="inspection-context">
        {played
          ? `Played by ${playerName}`
          : playerName === "You"
            ? "Your hand"
            : `${playerName}’s hand`}
        {played && controllerName !== playerName && (
          <span> · Controlled by {controllerName}</span>
        )}
      </div>
      <div className="inspection-stats">
        {SIDE_NAMES.map((side, index) => (
          <div
            key={side}
            className={edges[index] > stone.edges[index] ? "stat-boosted" : ""}
          >
            <small>{side}</small>
            <strong>{edges[index]}</strong>
            {edges[index] > stone.edges[index] && (
              <span>
                {stone.edges[index]} + {edges[index] - stone.edges[index]}
              </span>
            )}
          </div>
        ))}
      </div>
      <KeywordDetails
        stone={stone}
        activeKeywords={activeKeywords}
        played={played}
      />
      {stone.description && (
        <div className="inspection-story">
          <span>BACKSTORY</span>
          <p>{stone.description}</p>
          <small>Flavor text — no gameplay effect.</small>
        </div>
      )}
      <p className="inspection-capture-note">
        <ArrowUpRight size={13} />A higher facing edge captures an adjacent
        rival. Equal pips do not capture.
      </p>
    </>
  );
}

export function CardInspector({ inspection }: { inspection: Inspection }) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);
  useLayoutEffect(() => {
    const update = () => {
      if (!ref.current) return;
      const width = ref.current.offsetWidth;
      const height = ref.current.offsetHeight;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const anchor = inspection.anchorElement.isConnected
        ? inspection.anchorElement.getBoundingClientRect()
        : inspection.anchor;
      const preferredLeft =
        anchor.right + 16 + width <= viewportWidth - 12
          ? anchor.right + 16
          : anchor.left - width - 16;
      setPosition({
        left: Math.max(12, Math.min(preferredLeft, viewportWidth - width - 12)),
        top: Math.max(12, Math.min(anchor.top, viewportHeight - height - 12)),
      });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [inspection]);
  return createPortal(
    <div
      ref={ref}
      id="card-inspector"
      role="tooltip"
      className="card-inspector"
      style={{
        left: position?.left || 0,
        top: position?.top || 0,
        visibility: position ? "visible" : "hidden",
      }}
    >
      <div className="inspector-card">
        <StoneCard stone={inspection.stone} edges={inspection.edges} />
      </div>
      <h2>{inspection.stone.name}</h2>
      <InspectionDetails inspection={inspection} />
    </div>,
    document.body,
  );
}
