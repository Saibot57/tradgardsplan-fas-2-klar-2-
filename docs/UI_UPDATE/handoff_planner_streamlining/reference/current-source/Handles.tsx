/**
 * Selection handles: 8 resize + 1 rotate.
 *
 * Resize math is performed in local space so rotation is preserved
 * automatically. The anchor (corner or edge midpoint opposite the dragged
 * handle) stays fixed in world space; cx/cy are recomputed accordingly.
 *
 * MIN_RECT_DIMENSION_MM is enforced; rotationDeg is float (precision_policy §1).
 */

import {
  localToWorld,
  rectCorners,
  worldToLocal,
  worldToScreen,
  type Point,
  type Rect,
  type Viewport,
} from "@kolonitradgard/spatial-core";
import { MIN_RECT_DIMENSION_MM } from "./state.js";

export const HANDLE_SIZE_PX = 10;
export const ROTATE_HANDLE_OFFSET_PX = 30;
export const ROTATE_HANDLE_RADIUS_PX = 7;

export type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
export type HandleId = ResizeHandle | "rotate";

interface SignPair {
  sx: -1 | 0 | 1;
  sy: -1 | 0 | 1;
}

const HANDLE_SIGNS: Record<ResizeHandle, SignPair> = {
  nw: { sx: -1, sy: -1 },
  n: { sx: 0, sy: -1 },
  ne: { sx: 1, sy: -1 },
  e: { sx: 1, sy: 0 },
  se: { sx: 1, sy: 1 },
  s: { sx: 0, sy: 1 },
  sw: { sx: -1, sy: 1 },
  w: { sx: -1, sy: 0 },
};

const RESIZE_HANDLES: ResizeHandle[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

interface HandleScreenInfo {
  id: HandleId;
  screen: Point;
}

/** Screen-space position of each handle for a given rect + viewport. */
export function getHandleScreenPositions(rect: Rect, vp: Viewport): HandleScreenInfo[] {
  const result: HandleScreenInfo[] = [];

  // Resize handles in local space → world → screen.
  for (const id of RESIZE_HANDLES) {
    const { sx, sy } = HANDLE_SIGNS[id];
    const local: Point = { x: (sx * rect.width) / 2, y: (sy * rect.height) / 2 };
    result.push({ id, screen: worldToScreen(localToWorld(local, rect), vp) });
  }

  // Rotate handle: above the top-edge midpoint by ROTATE_HANDLE_OFFSET_PX in screen space.
  // To honor the rect's rotation we compute the screen direction "outward from top edge"
  // by mapping local (0, -h/2) and (0, -h/2 - 1) to screen and normalizing.
  const topMidWorld = localToWorld({ x: 0, y: -rect.height / 2 }, rect);
  const topMidOuterWorld = localToWorld({ x: 0, y: -rect.height / 2 - 1 }, rect);
  const topMidScreen = worldToScreen(topMidWorld, vp);
  const outerScreen = worldToScreen(topMidOuterWorld, vp);
  let dx = outerScreen.x - topMidScreen.x;
  let dy = outerScreen.y - topMidScreen.y;
  const len = Math.hypot(dx, dy) || 1;
  dx /= len;
  dy /= len;
  result.push({
    id: "rotate",
    screen: {
      x: topMidScreen.x + dx * ROTATE_HANDLE_OFFSET_PX,
      y: topMidScreen.y + dy * ROTATE_HANDLE_OFFSET_PX,
    },
  });

  return result;
}

/** Hit-test against the 9 handles. Pointer in screen-px. Returns null if no handle hit. */
export function hitTestHandle(
  screenPoint: Point,
  rect: Rect,
  vp: Viewport,
): HandleId | null {
  const positions = getHandleScreenPositions(rect, vp);
  // Rotate handle first (it sits outside the rect, smaller hit area but still needs priority).
  for (const { id, screen } of positions) {
    if (id === "rotate") {
      const d = Math.hypot(screen.x - screenPoint.x, screen.y - screenPoint.y);
      if (d <= ROTATE_HANDLE_RADIUS_PX + 2) return id;
    }
  }
  for (const { id, screen } of positions) {
    if (id === "rotate") continue;
    const half = HANDLE_SIZE_PX / 2 + 1;
    if (
      Math.abs(screen.x - screenPoint.x) <= half &&
      Math.abs(screen.y - screenPoint.y) <= half
    ) {
      return id;
    }
  }
  return null;
}

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
export function computeResizedRect(
  oldRect: Rect,
  handle: ResizeHandle,
  pointerWorld: Point,
): { cx: number; cy: number; width: number; height: number } {
  const { sx, sy } = HANDLE_SIGNS[handle];
  const localPointer = worldToLocal(pointerWorld, oldRect);

  let newW = oldRect.width;
  let newH = oldRect.height;
  if (sx !== 0) newW = Math.max(MIN_RECT_DIMENSION_MM, sx * 2 * localPointer.x);
  if (sy !== 0) newH = Math.max(MIN_RECT_DIMENSION_MM, sy * 2 * localPointer.y);

  // Anchor in oldRect's local space: opposite of the handle.
  const anchorLocalOld: Point = {
    x: (-sx * oldRect.width) / 2,
    y: (-sy * oldRect.height) / 2,
  };
  const anchorWorld = localToWorld(anchorLocalOld, oldRect);

  // Where anchor lives in the new (resized) local frame.
  const anchorLocalNew: Point = { x: (-sx * newW) / 2, y: (-sy * newH) / 2 };

  // Offset of the anchor from a hypothetical center=(0,0) rect with the new
  // dimensions but old rotation. localToWorld with cx=cy=0 returns the
  // rotation-only transform of the local point.
  const tempRect: Rect = {
    ...oldRect,
    cx: 0,
    cy: 0,
    width: newW,
    height: newH,
  };
  const anchorOffset = localToWorld(anchorLocalNew, tempRect);

  return {
    cx: anchorWorld.x - anchorOffset.x,
    cy: anchorWorld.y - anchorOffset.y,
    width: newW,
    height: newH,
  };
}

/**
 * Compute rotationDeg from pointer position.
 *
 * rotationDeg = 0 should leave the rotate handle pointing straight up
 * (-Y in world). Atan2(dy, dx) returns 0 for +X axis, so we subtract 90°
 * to align with the top-mid handle position.
 */
export function computeRotation(rect: Rect, pointerWorld: Point): number {
  const dx = pointerWorld.x - rect.cx;
  const dy = pointerWorld.y - rect.cy;
  const deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
  // Normalize to [-180, 180) just for sanity; reducer applies % 360.
  let n = deg;
  while (n > 180) n -= 360;
  while (n < -180) n += 360;
  return n;
}

/** Draw all 9 handles on the 2D canvas. Called after rect rendering for the selected rect. */
export function drawHandles(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  vp: Viewport,
): void {
  const positions = getHandleScreenPositions(rect, vp);

  // Tether line from top-mid to rotate handle.
  const topMidScreen = worldToScreen(localToWorld({ x: 0, y: -rect.height / 2 }, rect), vp);
  const rotatePos = positions.find((p) => p.id === "rotate")!.screen;
  ctx.strokeStyle = "#ffd166";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(topMidScreen.x, topMidScreen.y);
  ctx.lineTo(rotatePos.x, rotatePos.y);
  ctx.stroke();

  // Resize handles.
  for (const { id, screen } of positions) {
    if (id === "rotate") continue;
    const half = HANDLE_SIZE_PX / 2;
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 1;
    ctx.fillRect(screen.x - half, screen.y - half, HANDLE_SIZE_PX, HANDLE_SIZE_PX);
    ctx.strokeRect(screen.x - half, screen.y - half, HANDLE_SIZE_PX, HANDLE_SIZE_PX);
  }

  // Rotate handle.
  ctx.fillStyle = "#ffd166";
  ctx.strokeStyle = "#222";
  ctx.beginPath();
  ctx.arc(rotatePos.x, rotatePos.y, ROTATE_HANDLE_RADIUS_PX, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

// Re-export rectCorners for callers that want to draw selection edges (optional helper).
export { rectCorners };
