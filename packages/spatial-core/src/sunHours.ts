import type { GeoLocation, Point, Rect } from "./types.js";
import { rectCorners } from "./rotation.js";
import { projectShadow } from "./shadow.js";
import { sunPositionAt } from "./sun.js";

const DEFAULT_START_HOUR = 6;
const DEFAULT_END_HOUR = 20;

/**
 * Compute the number of direct-sun hours for a rectangle on a given day.
 *
 * Hourly samples between DEFAULT_START_HOUR and DEFAULT_END_HOUR (inclusive).
 * A sample counts as "sun" if the sun is above the horizon AND the bed's
 * footprint is NOT fully covered by any other rectangle's shadow at that hour.
 *
 * "Fully covered" approximation: all four corners of the bed lie inside
 * a single caster's projected shadow polygon. This is exact for axis-aligned
 * convex shadows and a tight approximation for rotated rectangular shadows
 * (the shadow polygon from projectShadow is convex).
 *
 * northRotationDeg: from PlotConfig — rotates solar reference frame,
 * NOT world coordinates (ADR-006).
 *
 * Returns hours as a float (whole hours given the hourly sampling).
 */
export function bedSunHours(
  bed: Rect,
  casters: Rect[],
  date: Date,
  loc: GeoLocation,
  northRotationDeg: number,
): number {
  const bedCorners = rectCorners(bed);
  let hours = 0;

  for (let h = DEFAULT_START_HOUR; h <= DEFAULT_END_HOUR; h++) {
    const sample = new Date(date);
    sample.setHours(h, 0, 0, 0);
    const sun = sunPositionAt(sample, loc);
    if (sun.altitudeRad <= 0) continue;

    let coveredByAny = false;
    for (const caster of casters) {
      if (caster.id === bed.id) continue;
      if (caster.wallHeight <= 0) continue;
      const shadow = projectShadow(caster, sun, northRotationDeg);
      if (!shadow) continue;
      if (bedCorners.every((c) => pointInPolygon(c, shadow))) {
        coveredByAny = true;
        break;
      }
    }
    if (!coveredByAny) hours++;
  }
  return hours;
}

/**
 * Ray-casting point-in-polygon test.
 * Edge inclusion is not strictly defined; for solar-hour approximation
 * boundary cases are negligible.
 */
function pointInPolygon(point: Point, polygon: readonly Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const pi = polygon[i]!;
    const pj = polygon[j]!;
    const intersect =
      pi.y > point.y !== pj.y > point.y &&
      point.x < ((pj.x - pi.x) * (point.y - pi.y)) / (pj.y - pi.y) + pi.x;
    if (intersect) inside = !inside;
  }
  return inside;
}
