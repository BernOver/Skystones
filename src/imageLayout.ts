export interface ImageTransform {
  scale: number;
  x: number;
  y: number;
  fit?: "contain" | "cover";
}
export const DEFAULT_IMAGE_TRANSFORM: ImageTransform = { scale: 1, x: 0, y: 0 };
export function validImageTransform(value: unknown): value is ImageTransform {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const t = value as ImageTransform;
  return (
    Number.isFinite(t.scale) &&
    t.scale >= 0.25 &&
    t.scale <= 3 &&
    Number.isFinite(t.x) &&
    Math.abs(t.x) <= 100 &&
    Number.isFinite(t.y) &&
    Math.abs(t.y) <= 100 &&
    (t.fit === undefined || t.fit === "contain" || t.fit === "cover")
  );
}
export function imageLayoutStyle(value?: ImageTransform) {
  if (!value) return undefined;
  return {
    transform: `translate(${value.x}%, ${value.y}%) scale(${value.scale})`,
    transformOrigin: "center",
    ...(value.fit ? { objectFit: value.fit } : {}),
  };
}
export function trapImageLayout(value?: ImageTransform) {
  const t = value || DEFAULT_IMAGE_TRANSFORM;
  return {
    x: 50 - 25 * t.scale + t.x / 2,
    y: 53 - 25 * t.scale + t.y / 2,
    width: 50 * t.scale,
    height: 50 * t.scale,
    preserveAspectRatio:
      t.fit === "contain" ? "xMidYMid meet" : "xMidYMid slice",
  };
}
