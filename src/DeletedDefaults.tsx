import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  DELETED_CONTENT_STORAGE,
  readDeletedContent,
  restoreDefault,
  restoreDeletedDefaults,
} from "./deletedContent";
export function DeletedDefaults() {
  const [items, setItems] = useState(readDeletedContent);
  const [error, setError] = useState("");
  useEffect(() => {
    const refresh = () => setItems(readDeletedContent());
    window.addEventListener(DELETED_CONTENT_STORAGE, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(DELETED_CONTENT_STORAGE, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  function restore(action: () => void) {
    try {
      action();
      setError("");
    } catch {
      setError(
        "Your browser could not restore this content. Check storage availability.",
      );
    }
  }
  return (
    <details className="deleted-defaults">
      <summary>Deleted content · {items.length}</summary>
      <p>
        Deleted defaults are excluded from your collection and new generation.
        Existing games keep their copies. Restoring preserves saved edits; add
        restored cards to your decks again.
      </p>
      {items.length ? (
        <>
          <button
            type="button"
            className="text-button"
            onClick={() => restore(restoreDeletedDefaults)}
          >
            <RotateCcw size={14} /> Restore all deleted content
          </button>
          <ul>
            {items.map((item) => (
              <li key={`${item.kind}:${item.id}`}>
                <span>
                  {item.name}{" "}
                  <small>
                    · {item.kind === "trap" ? "Trap" : "Card template"}
                  </small>
                </span>
                <button
                  type="button"
                  className="text-button"
                  onClick={() =>
                    restore(() => restoreDefault(item.kind, item.id))
                  }
                >
                  Restore {item.name}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>No deleted defaults.</p>
      )}
      {error && <p role="alert">{error}</p>}
    </details>
  );
}
