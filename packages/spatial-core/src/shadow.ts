import type { Point, Rect, SunPosition, Vec2 } from "./types.js";
import { rectCorners } from "./rotation.js";

/**
 * Minimum solar altitude in degrees before shadows are clamped.
 *
 * Near the horizon, shadowLength = wallHeight / tan(altitude) grows
 * without bound. This is physically correct but practically useless
 * and numerically dangerous. Below MIN_ALTITUDE_DEG we clamp the
 * shadow length to MAX_SHADOW_LENGTH_MM.
 *
 * This is an intentional engineering approximation, not a physical model.
 * The shadow model is already simplified (hard shadows, vertical extrusions).
 */
export const MIN_ALTITUDE_DEG = 4;
export const MIN_ALTITUDE_RAD = (MIN_ALTITUDE_DEG * Math.PI) / 180;

/**
 * Maximum shadow length in mm.
 * At MIN_ALTITUDE_DEG (4°) and wallHeight=2000mm:
 *   tan(4°) ≈ 0.0699  →  length ≈ 28,600mm = ~28.6m
 * This is already very long for a garden plot. MAX_SHADOW_LENGTH_MM
 * acts as a safety cap for extreme wallHeights at extreme low altitudes.
 */
export const MAX_SHADOW_LENGTH_MM = 100_000;

/**
 * Compute the 2D shadow displacement vector (in mm) for an object of the
 * given wallHeight, given a sun position and northRotationDeg.
 *
 * Shadow model (explicit):
 * - Hard shadows only (umbra, no penumbra/half-shadow)
 * - From vertically extruded rectangles (not angled walls, not vegetation)
 * - No reflected or diffuse illumination
 * - No atmospheric scattering
 *
 * IMPORTANT (ADR-006):
 * northRotationDeg rotates the *solar reference frame*, NOT world coordinates.
 * World space remains a stable canvas coordinate system (origin top-left, Y down).
 *
 * Returns null if:
 *   - wallHeight <= 0
 *   - sun is at or below horizon (altitudeRad <= 0)
 */
export function shadowVector(
  wallHeight: number,
  sun: SunPosition,
  northRotationDeg: number = 0,
): Vec2 | null {
  if (wallHeight <= 0) return null;
  if (sun.altitudeRad <= 0) return null;

  // Clamp to minimum altitude to avoid extreme/infinite shadows
  const effectiveAltitudeRad = Math.max(sun.altitudeRad, MIN_ALTITUDE_RAD);

  let length = wallHeight / Math.tan(effectiveAltitudeRad);
  // Cap absolute shadow length
  length = Math.min(length, MAX_SHADOW_LENGTH_MM);

  // Apply northRotationDeg: rotate the solar reference frame.
  // This transforms the sun's azimuth into world-space shadow direction.
  const offsetRad = (northRotationDeg * Math.PI) / 180;
  const effectiveAzimuth = sun.azimuthRad - offsetRad;

  return {
    x: Math.sin(effectiveAzimuth) * length,
    y: -Math.cos(effectiveAzimuth) * length,
  };
}

/**
 * Project the rectangle's footprint into a shadow polygon on the ground.
 *
 * Returns the convex hull of:
 *   - the 4 base corners of the rectangle
 *   - the 4 displaced corners (translated by shadowVector)
 *
 * Returns null if no shadow (sun below horizon, no wall height).
 *
 * @param northRotationDeg Rotates the solar reference frame (ADR-006).
 *                         Does NOT rotate world coordinates.
 */
export function projectShadow(
  rect: Rect,
  sun: SunPosition,
  northRotationDeg: number = 0,
): Point[] | null {
  const v = shadowVector(rect.wallHeight, sun, northRotationDeg);
  if (!v) return null;

  const base = rectCorners(rect);
  const tips: Point[] = base.map((c) => ({ x: c.x + v.x, y: c.y + v.y }));
  return convexHull([...base, ...tips]);
}

/**
 * Andrew's monotone chain convex hull. O(n log n).
 * Returns the polygon vertices in counter-clockwise order;
 * collinear points are dropped.
 */
export function convexHull(points: readonly Point[]): Point[] {
  if (points.length < 3) return [...points];

  const sorted = [...points].sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));

  const cross = (o: Point, a: Point, b: Point): number =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  const lower: Point[] = [];
  for (const p of sorted) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0
    ) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: Point[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i]!;
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0
    ) {
      upper.pop();
    }
    upper.push(p);
  }

  upper.pop();
  lower.pop();
  return lower.concat(upper);
}
