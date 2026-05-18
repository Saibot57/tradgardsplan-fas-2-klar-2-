/**
 * Distance and clearance queries for OBB rectangles.
 *
 * Used by realtime measurement overlays: when the user drags or resizes a
 * rectangle, the sandbox needs to display gaps to neighboring rects and
 * to the plot boundary.
 *
 * Returns float mm. Inputs are integer mm Rects (per precision_policy.md).
 */

import type { Point, Rect } from "./types.js";
import { rectAxes, rectCorners } from "./rotation.js";
import { worldToLocal } from "./coordinates.js";

/** Tolerance for "touch" / "zero gap" decisions. Matches overlap.ts. */
const EDGE_TOUCH_EPSILON = 1e-6;

interface Projection {
  min: number;
  max: number;
}

function projectOntoAxis(corners: readonly Point[], axis: Point): Projection {
  let min = corners[0]!.x * axis.x + corners[0]!.y * axis.y;
  let max = min;
  for (let i = 1; i < corners.length; i++) {
    const v = corners[i]!.x * axis.x + corners[i]!.y * axis.y;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return { min, max };
}

/**
 * Closest point on the segment [a, b] to a given point p.
 * Returns a point on the segment (clamped at endpoints).
 */
function closestPointOnSegment(p: Point, a: Point, b: Point): Point {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 < EDGE_TOUCH_EPSILON) return { x: a.x, y: a.y };
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
  return { x: a.x + t * dx, y: a.y + t * dy };
}

function pointDistance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Closest point pair between two OBB rectangles, with the resulting distance.
 *
 * For separated OBBs: tests each corner of A against each edge of B (and vice
 * versa) — 16 point-segment tests total — and returns the minimum pair.
 *
 * For overlapping OBBs: distance is 0, and the returned points are the centers
 * (caller should not draw a guide line in that case).
 *
 * Edge-touch returns distance ≈ 0 (within EDGE_TOUCH_EPSILON).
 */
export function closestPointsBetweenRects(
  a: Rect,
  b: Rect,
): { pA: Point; pB: Point; distance: number } {
  const ca = rectCorners(a);
  const cb = rectCorners(b);

  let best: { pA: Point; pB: Point; distance: number } = {
    pA: ca[0],
    pB: cb[0],
    distance: Infinity,
  };

  // Corner of A vs edge of B
  for (let i = 0; i < 4; i++) {
    const pA = ca[i]!;
    for (let j = 0; j < 4; j++) {
      const bStart = cb[j]!;
      const bEnd = cb[(j + 1) % 4]!;
      const pB = closestPointOnSegment(pA, bStart, bEnd);
      const d = pointDistance(pA, pB);
      if (d < best.distance) best = { pA, pB, distance: d };
    }
  }

  // Corner of B vs edge of A
  for (let i = 0; i < 4; i++) {
    const pB = cb[i]!;
    for (let j = 0; j < 4; j++) {
      const aStart = ca[j]!;
      const aEnd = ca[(j + 1) % 4]!;
      const pA = closestPointOnSegment(pB, aStart, aEnd);
      const d = pointDistance(pA, pB);
      if (d < best.distance) best = { pA, pB, distance: d };
    }
  }

  return best;
}

/**
 * Signed minimum distance between two OBB rectangles.
 *
 *   > 0  separated by this many mm
 *   = 0  edge-touch (within epsilon)
 *   < 0  overlapping — magnitude is the smallest SAT penetration depth
 *
 * Separation distance is computed via {@link closestPointsBetweenRects}.
 * Penetration depth is the minimum projection overlap over the 4 SAT axes —
 * matches the convention used by physics collision-resolution code.
 */
export function obbDistance(a: Rect, b: Rect): number {
  const axes: Point[] = [...rectAxes(a), ...rectAxes(b)];
  const ca = rectCorners(a);
  const cb = rectCorners(b);

  let maxSeparation = -Infinity;
  let separated = false;
  let minOverlap = Infinity;

  for (const axis of axes) {
    const pa = projectOntoAxis(ca, axis);
    const pb = projectOntoAxis(cb, axis);
    const gap = Math.max(pa.min - pb.max, pb.min - pa.max);
    if (gap > EDGE_TOUCH_EPSILON) {
      separated = true;
      if (gap > maxSeparation) maxSeparation = gap;
    } else {
      const overlap = -gap; // >= 0
      if (overlap < minOverlap) minOverlap = overlap;
    }
  }

  if (separated) {
    return closestPointsBetweenRects(a, b).distance;
  }
  if (minOverlap <= EDGE_TOUCH_EPSILON) return 0;
  return -minOverlap;
}

/**
 * Perpendicular distances from `inner`'s extent to each of `boundary`'s four
 * edges, measured in `boundary`'s local frame.
 *
 * Positive value: `inner` lies that many mm inside the boundary on that side.
 * Negative value: `inner` sticks out by that much.
 *
 * The local frame is set so:
 *   - `n` = distance to the +Y-negative edge (top in boundary-local coords)
 *   - `e` = distance to the +X-positive edge (right)
 *   - `s` = distance to the +Y-positive edge (bottom)
 *   - `w` = distance to the +X-negative edge (left)
 *
 * Compass labels (N/E/S/W) refer to boundary-local axes — not geographic
 * north — but that is the convention the sandbox UI uses for boundary mått.
 */
export function distancesToBoundaryEdges(
  inner: Rect,
  boundary: Rect,
): { n: number; e: number; s: number; w: number } {
  const corners = rectCorners(inner);
  const localCorners = corners.map((c) => worldToLocal(c, boundary));

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const lc of localCorners) {
    if (lc.x < minX) minX = lc.x;
    if (lc.x > maxX) maxX = lc.x;
    if (lc.y < minY) minY = lc.y;
    if (lc.y > maxY) maxY = lc.y;
  }

  const hw = boundary.width / 2;
  const hh = boundary.height / 2;
  return {
    n: minY + hh,
    e: hw - maxX,
    s: hh - maxY,
    w: minX + hw,
  };
}
