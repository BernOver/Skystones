import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, Check, Flag, Info, RotateCcw } from "lucide-react";
import { StoneCard } from "./Artwork";
import { KEYWORD_RULES, SIDE_NAMES } from "./game";
import type { Edges, KeywordType, Stone, StoneKeyword } from "./game";

export interface Inspection {
  stone: Stone;
  sourceId: string;
  anchor: { left: number; right: number; top: number };
  anchorElement: HTMLElement;
  edges: Edges;
  activeKeywords: StoneKeyword[];
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
  activeKeywords?: StoneKeyword[];
  played?: boolean;
}) {
  return (
    <div className="keyword-details">
      {(Object.keys(KEYWORD_RULES) as KeywordType[]).map((type) => {
        const keywords = (stone.keywords || []).filter(
          (keyword) => keyword.type === type,
        );
        if (!keywords.length) return null;
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
          Check once, before placing the stone. Tied scores activate neither
          keyword. Captures and later score changes never remove an activated
          bonus.
        </p>
      )}
    </div>
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
              <span>{stone.edges[index]} + 1</span>
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
