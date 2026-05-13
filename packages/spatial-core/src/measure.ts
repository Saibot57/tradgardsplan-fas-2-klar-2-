import type { Rect } from "./types.js";
import { getKind, KIND_RULES } from "./kind.js";

/** Area in mm². Independent of rotation. */
export function rectAreaMm2(rect: Rect): number {
  return rect.width * rect.height;
}

/** Area in m². */
export function rectAreaM2(rect: Rect): number {
  return rectAreaMm2(rect) / 1_000_000;
}

/**
 * Soil volume estimation given a bed depth in mm.
 *
 * Endast objekt med `kind === "bed"` (eller utelämnad kind, som tolkas som bed)
 * bidrar med jord. Andra typer returnerar 0 — ADR-009.
 */
export function bedSoilVolumeLitres(rect: Rect, bedDepthMm: number): number {
  if (bedDepthMm <= 0) return 0;
  if (!KIND_RULES[getKind(rect)].hasSoil) return 0;
  // 1 dm³ = 1 litre. 1 dm = 100 mm. So mm³ → litre = / 1_000_000.
  return (rect.width * rect.height * bedDepthMm) / 1_000_000;
}
