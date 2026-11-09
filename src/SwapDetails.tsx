import { KEYWORD_RULES } from "./game";
import type { Stone, Edges } from "./game";
import { isSwapForce, swapIdentity, halfKeywords } from "./swapForce";
export function SwapDetails({
  stone,
  edges = stone.edges,
}: {
  stone: Stone;
  edges?: Edges;
}) {
  if (!isSwapForce(stone)) return null;
  return (
    <section className="swap-halves-info" aria-label="SWAP Force halves">
      {(["top", "bottom"] as const).map((half) => {
        const identity = swapIdentity(stone, half);
        return (
          <div key={half}>
            <strong>
              {half === "top" ? "Top · North / West" : "Bottom · South / East"}
            </strong>
            <span>
              {identity.name} ·{" "}
              {half === "top"
                ? `${edges[0]} / ${edges[3]}`
                : `${edges[2]} / ${edges[1]}`}
            </span>
            <small>
              {halfKeywords(stone, half)
                .map((keyword) => KEYWORD_RULES[keyword.type].name)
                .join(" · ") || "No keywords"}
            </small>
          </div>
        );
      })}
      <p>
        The top half sets the element. Swap only while both cards are in your
        hand.
      </p>
    </section>
  );
}
