import { DEFAULT_IMAGE_TRANSFORM } from "./imageLayout";
import type { ImageTransform } from "./imageLayout";
import "./image-layout.css";
export function ImageLayoutControls({
  value,
  onChange,
  label,
  defaultFit = "contain",
}: {
  value?: ImageTransform;
  onChange: (value: ImageTransform | undefined) => void;
  label: "Stone" | "Trap";
  defaultFit?: "contain" | "cover";
}) {
  const current = value || DEFAULT_IMAGE_TRANSFORM;
  return (
    <fieldset className="image-layout-controls">
      <legend>Resize and position picture</legend>
      <label>
        Picture size <output>{Math.round(current.scale * 100)}%</output>
        <input
          type="range"
          aria-label={`${label} image size`}
          min={25}
          max={300}
          step={1}
          value={Math.round(current.scale * 100)}
          onChange={(e) =>
            onChange({ ...current, scale: Number(e.target.value) / 100 })
          }
        />
      </label>
      <label>
        Left / right <output>{current.x}%</output>
        <input
          type="range"
          aria-label={`${label} image horizontal position`}
          min={-100}
          max={100}
          step={1}
          value={current.x}
          onChange={(e) => onChange({ ...current, x: Number(e.target.value) })}
        />
      </label>
      <label>
        Up / down <output>{current.y}%</output>
        <input
          type="range"
          aria-label={`${label} image vertical position`}
          min={-100}
          max={100}
          step={1}
          value={current.y}
          onChange={(e) => onChange({ ...current, y: Number(e.target.value) })}
        />
      </label>
      <label>
        Picture fit
        <select
          aria-label={`${label} image fit`}
          value={current.fit || defaultFit}
          onChange={(e) =>
            onChange({
              ...current,
              fit: e.target.value as ImageTransform["fit"],
            })
          }
        >
          <option value="contain">Fit whole picture</option>
          <option value="cover">Fill frame</option>
        </select>
      </label>
      <button
        type="button"
        className="text-button"
        disabled={!value}
        onClick={() => onChange(undefined)}
      >
        Reset {label.toLowerCase()} picture
      </button>
    </fieldset>
  );
}
