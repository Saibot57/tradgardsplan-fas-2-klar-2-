/**
 * Pure helper for drag-to-create: convert two world-space pointer positions
 * into a candidate Rect (cx, cy, width, height) with optional grid-snapping.
 *
 * Rotation is always 0 for newly drawn rects; rotation is applied later via
 * the rotate-handle.
 */
import { type Point } from "@kolonitradgard/spatial-core";
export interface GhostRectGeometry {
    cx: number;
    cy: number;
    width: number;
    height: number;
}
export interface SnapOptions {
    enabled: boolean;
    stepMm: number;
}
/**
 * Compute the candidate rect from drag start + current pointer positions.
 *
 * Snap behaviour: when `snap.enabled`, both endpoints are snapped to the
 * grid first, then width/height/center derived from the snapped corners.
 * This yields predictable grid-aligned dimensions and avoids drift.
 *
 * Width/height are always positive (drag direction does not matter).
 */
export declare function computeGhostRect(start: Point, current: Point, snap?: SnapOptions): GhostRectGeometry;
