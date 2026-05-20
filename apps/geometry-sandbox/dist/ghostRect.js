/**
 * Pure helper for drag-to-create: convert two world-space pointer positions
 * into a candidate Rect (cx, cy, width, height) with optional grid-snapping.
 *
 * Rotation is always 0 for newly drawn rects; rotation is applied later via
 * the rotate-handle.
 */
import { snapToGrid } from "@kolonitradgard/spatial-core";
/**
 * Compute the candidate rect from drag start + current pointer positions.
 *
 * Snap behaviour: when `snap.enabled`, both endpoints are snapped to the
 * grid first, then width/height/center derived from the snapped corners.
 * This yields predictable grid-aligned dimensions and avoids drift.
 *
 * Width/height are always positive (drag direction does not matter).
 */
export function computeGhostRect(start, current, snap = { enabled: false, stepMm: 100 }) {
    const a = snap.enabled ? snapToGrid(start, snap.stepMm) : start;
    const b = snap.enabled ? snapToGrid(current, snap.stepMm) : current;
    const minX = Math.min(a.x, b.x);
    const maxX = Math.max(a.x, b.x);
    const minY = Math.min(a.y, b.y);
    const maxY = Math.max(a.y, b.y);
    return {
        cx: (minX + maxX) / 2,
        cy: (minY + maxY) / 2,
        width: maxX - minX,
        height: maxY - minY,
    };
}
//# sourceMappingURL=ghostRect.js.map