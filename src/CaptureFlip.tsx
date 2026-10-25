import { cloneElement, useState } from "react";
import type { ReactElement } from "react";
import type { Owner } from "./game";
// The old owner is visible until the card turns edge-on, then the new face appears.
export function CaptureFlip({
  captured,
  owner,
  children,
}: {
  captured: boolean;
  owner: Owner;
  children: ReactElement<{ owner?: Owner }>;
}) {
  const [flipping, setFlipping] = useState(captured);
  return (
    <span
      className={`capture-flip ${flipping ? "is-flipping" : ""}`}
      onAnimationEnd={(event) => {
        if (event.animationName === "card-capture-flip") setFlipping(false);
      }}
    >
      <span className="capture-flip-inner">
        {flipping && (
          <span className="capture-flip-front" aria-hidden="true">
            {cloneElement(children, { owner: owner === 0 ? 1 : 0 })}
          </span>
        )}
        <span className="capture-flip-back">{children}</span>
      </span>
    </span>
  );
}
