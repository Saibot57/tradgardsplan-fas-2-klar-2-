/**
 * Selection handles: 8 resize + 1 rotate.
 *
 * Resize math is performed in local space so rotation is preserved
 * automatically. The anchor (corner or edge midpoint opposite the dragged
 * handle) stays fixed in world space; cx/cy are recomputed accordingly.
 *
 * MIN_RECT_DIMENSION_MM is enforced; rotationDeg is float (precision_policy §1).
 */
import { rectCorners, type Point, type Rect, type Viewport } from "@kolonitradgard/spatial-core";
import type { CanvasPalette } from "./palette.js";
export declare const HANDLE_SIZE_PX = 10;
export declare const ROTATE_HANDLE_OFFSET_PX = 30;
export declare const ROTATE_HANDLE_RADIUS_PX = 7;
export type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
export type HandleId = ResizeHandle | "rotate";
interface HandleScreenInfo {
    id: HandleId;
    screen: Point;
}
/** Screen-space position of each handle for a given rect + viewport. */
export declare function getHandleScreenPositions(rect: Rect, vp: Viewport): HandleScreenInfo[];
/** Hit-test against the 9 handles. Pointer in screen-px. Returns null if no handle hit. */
export declare function hitTestHandle(screenPoint: Point, rect: Rect, vp: Viewport): HandleId | null;
/**
 * Compute new rect geometry when a resize handle is dragged to pointerWorld.
 *
 * Logic:
 *   1. Pointer → local space of oldRect (rotation un-applied).
 *   2. New width/height derived from the local pointer position along
 *      the dimensions this handle controls.
 *   3. MIN_RECT_DIMENSION_MM enforced. Edge handles only affect one axis.
 *   4. New cx/cy chosen so that the anchor (corner or edge midpoint
 *      opposite this handle) keeps its world-space position.
 *
 * Returns floats; reducer rounds them.
 */
export declare function computeResizedRect(oldRect: Rect, handle: ResizeHandle, pointerWorld: Point): {
    cx: number;
    cy: number;
    width: number;
    height: number;
};
/**
 * Compute rotationDeg from pointer position.
 *
 * rotationDeg = 0 should leave the rotate handle pointing straight up
 * (-Y in world). Atan2(dy, dx) returns 0 for +X axis, so we subtract 90°
 * to align with the top-mid handle position.
 */
export declare function computeRotation(rect: Rect, pointerWorld: Point): number;
/** Draw all 9 handles on the 2D canvas. Called after rect rendering for the selected rect. */
export declare function drawHandles(ctx: CanvasRenderingContext2D, rect: Rect, vp: Viewport, palette: CanvasPalette): void;
export { rectCorners };
