import type { CSSProperties } from "react";
import { boardSize, coordinate } from "./game";
import type { Board } from "./game";
import {
  ENVIRONMENTS,
  boardEnvironments,
  environmentText,
  pendingPipEffects,
  nextEffectText,
  nextRequirementText,
} from "./effects";
import type { TileEnvironment } from "./effects";

export function TileMark({ environment }: { environment?: TileEnvironment }) {
  if (!environment) return null;
  const info = ENVIRONMENTS[environment.kind];
  return (
    <span
      className="tile-environment-mark"
      style={{ "--terrain-color": info.color } as CSSProperties}
      title={`${info.name}: ${environmentText(environment)}`}
      aria-label={`${info.name}: ${environmentText(environment)}`}
    >
      <b aria-hidden="true">{info.mark}</b>
      <span>{info.name}</span>
    </span>
  );
}
export function EnvironmentLegend({ board }: { board: Board }) {
  const tiles = boardEnvironments(board),
    size = boardSize(board);
  if (!tiles.some(Boolean)) return null;
  return (
    <details className="environment-legend" open>
      <summary>Tile environments · {tiles.filter(Boolean).length}</summary>
      {tiles.map(
        (environment, index) =>
          environment && (
            <p key={index}>
              <strong>
                {coordinate(index, size)} ·{" "}
                {ENVIRONMENTS[environment.kind].name}
              </strong>{" "}
              {environmentText(environment)}
            </p>
          ),
      )}
      <small>
        Applies to either player. New terrain replaces the previous environment
        on that tile. Captures and Silence do not remove it.
      </small>
    </details>
  );
}
export function NextPlayStatus({
  board,
  names,
}: {
  board: Board;
  names: string[];
}) {
  const effects = ([0, 1] as const)
    .map((owner) => ({ owner, effects: pendingPipEffects(board, owner) }))
    .filter((entry) => entry.effects.length);
  if (!effects.length) return null;
  return (
    <div
      className="next-play-status"
      aria-label="Pending next-card effects"
      aria-live="polite"
    >
      {effects.map((entry) => (
        <p key={entry.owner}>
          <strong>
            {names[entry.owner]} ·{" "}
            {entry.effects.some((effect) => effect.tribe || effect.element)
              ? "queued effects"
              : "next card"}
          </strong>
          {entry.effects.map((effect, index) => (
            <span key={index}>
              {nextEffectText(effect)}
              {nextRequirementText(effect)
                ? ` on next ${nextRequirementText(effect)} card`
                : ""}{" "}
              <small>from {effect.source}</small>
            </span>
          ))}
        </p>
      ))}
      <small>
        Pending changes stack. Element and tribe requirements wait for the next
        matching card, before any element changes.
      </small>
    </div>
  );
}
