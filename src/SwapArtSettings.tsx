import { useEffect, useState, useSyncExternalStore } from "react";
export const SWAP_ART_STORAGE = "skystones-swap-art-v1";
const CHANGED = "skystones-swap-art-changed";
function readStyle() {
  try {
    return localStorage.getItem(SWAP_ART_STORAGE) === "horizontal"
      ? "horizontal"
      : "diagonal";
  } catch {
    return "diagonal";
  }
}
function subscribe(update: () => void) {
  window.addEventListener(CHANGED, update);
  window.addEventListener("storage", update);
  return () => {
    window.removeEventListener(CHANGED, update);
    window.removeEventListener("storage", update);
  };
}
export function useSwapArt() {
  const style = useSyncExternalStore(subscribe, readStyle, () => "diagonal");
  useEffect(() => {
    document.documentElement.dataset.swapArt = style;
  }, [style]);
  return style;
}
export function SwapArtSettings() {
  const style = useSwapArt(),
    [error, setError] = useState("");
  return (
    <div className="swap-art-setting">
      <label>
        <input
          type="checkbox"
          aria-label="Show SWAP Force artwork as top and bottom"
          checked={style === "horizontal"}
          onChange={(event) => {
            try {
              localStorage.setItem(
                SWAP_ART_STORAGE,
                event.target.checked ? "horizontal" : "diagonal",
              );
              window.dispatchEvent(new Event(CHANGED));
              setError("");
            } catch {
              setError(
                "The artwork preference could not be saved in this browser.",
              );
            }
          }}
        />
        Show SWAP Force artwork as top and bottom
      </label>
      <small>
        Off: diagonal cut. Pips and keywords keep the same halves in either
        view.
      </small>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
