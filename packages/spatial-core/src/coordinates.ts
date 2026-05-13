import type { Point, Rect } from "./types.js";
import { rotatePoint } from "./rotation.js";

/**
 * Viewport state for the sandbox. Pure data; no DOM references.
 *
 * Screen coordinates are pixels with origin at the canvas top-left.
 * pixelsPerMm is uniform (no anisotropic scaling — keeps math sane).
 */
export interface Viewport {
  /** Pan offset in pixels: where world (0,0) lands on the screen. */
  panX: number;
  panY: number;
  /** Zoom: how many screen pixels represent one world millimetre. */
  pixelsPerMm: number;
}

/** World mm → screen px. */
export function worldToScreen(p: Point, vp: Viewport): Point {
  return {
    x: p.x * vp.pixelsPerMm + vp.panX,
    y: p.y * vp.pixelsPerMm + vp.panY,
  };
}

/** Screen px → world mm (returns floats; canonicalize with roundToWorldMm if needed). */
export function screenToWorld(p: Point, vp: Viewport): Point {
  return {
    x: (p.x - vp.panX) / vp.pixelsPerMm,
    y: (p.y - vp.panY) / vp.pixelsPerMm,
  };
}

/**
 * Round a world coordinate to integer mm — the canonical storage form.
 *
 * Named roundToWorldMm (not snapToWorldMm) to avoid confusion with
 * grid snapping, which is a separate, configurable operation.
 *
 * Use this:
 *   - onDragEnd (before storing position)
 *   - on persistence boundary
 *
 * Do NOT use this during active drag (floats are fine mid-drag).
 */
export function roundToWorldMm(p: Point): Point {
  return { x: Math.round(p.x), y: Math.round(p.y) };
}

/**
 * @deprecated Use roundToWorldMm instead.
 * Kept for backwards compatibility during FAS 1.5 transition.
 * Will be removed before FAS 2.
 */
export const snapToWorldMm = roundToWorldMm;

/**
 * Transform a world point into the rectangle's local coordinate frame.
 *
 * Local frame definition:
 *   - origin = rectangle center (cx, cy)
 *   - +X axis = rectangle's local width direction
 *   - +Y axis = rectangle's local height direction
 *
 * Algorithm:
 *   1. Translate so rect center becomes origin
 *   2. Apply inverse rotation (un-rotate by -rotationDeg)
 *
 * Result: a point expressed in local coordinates, centered at (0,0).
 * Inside the rect: |lx| <= width/2, |ly| <= height/2.
 */
export function worldToLocal(worldPoint: Point, rect: Rect): Point {
  // Step 1: translate to center-relative
  const dx = worldPoint.x - rect.cx;
  const dy = worldPoint.y - rect.cy;

  // Step 2: inverse rotation (negate the angle)
  const angleRad = (-rect.rotationDeg * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  return {
    x: dx * cos - dy * sin,
    y: dx * sin + dy * cos,
  };
}

/**
 * Inverse of worldToLocal.
 *
 * Converts a point in the rectangle's local frame (centered at 0,0)
 * back into world space.
 *
 * Algorithm:
 *   1. Apply rotation
 *   2. Translate back to world position (add rect center)
 */
export function localToWorld(localPoint: Point, rect: Rect): Point {
  // Step 1: apply rotation
  const angleRad = (rect.rotationDeg * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  const rx = localPoint.x * cos - localPoint.y * sin;
  const ry = localPoint.x * sin + localPoint.y * cos;

  // Step 2: translate back to world origin
  return {
    x: rx + rect.cx,
    y: ry + rect.cy,
  };
}

/**
 * Snap a world coordinate to a grid.
 *
 * This is UI grid snapping — separate from roundToWorldMm.
 * Default grid: 10mm. Common alternative: 50mm.
 *
 * Grid snapping is applied during drag (optional) or onDragEnd.
 * roundToWorldMm should still be applied after snapping to ensure
 * integer mm storage.
 */
export function snapToGrid(p: Point, gridMm: number = 10): Point {
  return {
    x: Math.round(p.x / gridMm) * gridMm,
    y: Math.round(p.y / gridMm) * gridMm,
  };
}
