import { useEffect, useRef, type Dispatch } from "react";
import type { Action, SandboxState } from "./state.js";
import {
  rectCorners,
  projectShadow,
  worldToScreen,
  screenToWorld,
  worldToLocal,
  type Rect,
  type SunPosition,
  type Point,
} from "@kolonitradgard/spatial-core";
import {
  computeResizedRect,
  computeRotation,
  drawHandles,
  hitTestHandle,
  type ResizeHandle,
} from "./Handles.js";
import type { HistoryAction } from "./history.js";
import { readCanvasPalette, type CanvasPalette } from "./palette.js";

interface Props {
  state: SandboxState;
  dispatch: Dispatch<Action | HistoryAction>;
  sun: SunPosition;
  overlappingIds: Set<string>;
  theme: "light" | "dark";
}

/** Hit-test */
function pointInRect(p: Point, rect: Rect): boolean {
  const local = worldToLocal(p, rect);
  return Math.abs(local.x) <= rect.width / 2 && Math.abs(local.y) <= rect.height / 2;
}

/** Simple grid snap in world space */
function snapToGrid(p: Point, stepMm: number): Point {
  return {
    x: Math.round(p.x / stepMm) * stepMm,
    y: Math.round(p.y / stepMm) * stepMm,
  };
}

type DragMode =
  | { kind: "move"; startWorld: Point }
  | { kind: "pan" }
  | { kind: "resize"; handle: ResizeHandle; oldRect: Rect; rectId: string }
  | { kind: "rotate"; oldRect: Rect; rectId: string };

export function Canvas({ state, dispatch, sun, overlappingIds, theme }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    lastX: number;
    lastY: number;
    mode: DragMode;
  } | null>(null);

  // Render
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth;
    const h = container.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const palette = readCanvasPalette();

    // Background
    ctx.fillStyle = palette.bgCanvas;
    ctx.fillRect(0, 0, w, h);

    // World grid
    drawGrid(ctx, w, h, state.viewport, palette);

    // Plot boundary (if defined)
    if (state.plot.boundaryRect) {
      drawPlotBoundary(ctx, state.plot.boundaryRect, state.viewport, palette);
    }

    // Compass — uses northRotationDeg (ADR-006)
    drawCompass(ctx, w, palette, state.plot.northRotationDeg);

    // Shadows
    if (state.showShadows) {
      ctx.fillStyle = palette.shadowCanvas;
      for (const rect of state.rectangles) {
        const poly = projectShadow(rect, sun, state.plot.northRotationDeg);
        if (!poly) continue;
        ctx.beginPath();
        for (let i = 0; i < poly.length; i++) {
          const s = worldToScreen(poly[i]!, state.viewport);
          if (i === 0) ctx.moveTo(s.x, s.y);
          else ctx.lineTo(s.x, s.y);
        }
        ctx.closePath();
        ctx.fill();
      }
    }

    // Rectangles
    let selectedRect: Rect | null = null;
    for (const rect of state.rectangles) {
      const corners = rectCorners(rect);
      const sc = corners.map((c) => worldToScreen(c, state.viewport));

      const isSelected = rect.id === state.selectedId;
      if (isSelected) selectedRect = rect;
      const isOverlap = overlappingIds.has(rect.id);
      const isWall = rect.wallHeight > 0;

      ctx.beginPath();
      for (let i = 0; i < sc.length; i++) {
        if (i === 0) ctx.moveTo(sc[i]!.x, sc[i]!.y);
        else ctx.lineTo(sc[i]!.x, sc[i]!.y);
      }
      ctx.closePath();

      ctx.fillStyle = isOverlap
        ? palette.stateDangerFill
        : isWall
          ? palette.accentWallFill
          : palette.accentBedFill;
      ctx.fill();

      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeStyle = isOverlap
        ? palette.stateDanger
        : isSelected
          ? palette.accentSun
          : isWall
            ? palette.accentWall
            : palette.accentBed;
      ctx.stroke();

      // Center marker
      const center = worldToScreen({ x: rect.cx, y: rect.cy }, state.viewport);
      ctx.fillStyle = palette.centerDot;
      ctx.beginPath();
      ctx.arc(center.x, center.y, 2, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.fillStyle = palette.labelText;
      ctx.font = "11px var(--font-mono, ui-monospace, Menlo, monospace)";
      ctx.fillText(
        `${rect.id}  ${rect.width}×${rect.height} mm  ${rect.rotationDeg.toFixed(0)}°${
          isWall ? `  H=${rect.wallHeight}` : ""
        }`,
        center.x + 6,
        center.y - 6,
      );
    }

    // Mått-overlay under drag (move/resize)
    const drag = dragRef.current;
    if (drag && state.selectedId && (drag.mode.kind === "move" || drag.mode.kind === "resize")) {
      const selected = state.rectangles.find((r) => r.id === state.selectedId);
      if (selected) {
        const c = worldToScreen({ x: selected.cx, y: selected.cy }, state.viewport);
        ctx.fillStyle = palette.measurementText;
        ctx.font = "600 13px var(--font-mono, ui-monospace, Menlo, monospace)";
        ctx.fillText(`${selected.width} × ${selected.height} mm`, c.x + 12, c.y - 20);
      }
    }

    // Handles for selected rect (drawn last so they sit on top)
    if (selectedRect) {
      drawHandles(ctx, selectedRect, state.viewport, palette);
    }
  }, [state, sun, overlappingIds, theme]);

  // Pointer interactions
  const onPointerDown = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const screenP = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const worldP = screenToWorld(screenP, state.viewport);

    // 1. Handle hit-test (only if something is currently selected).
    if (state.selectedId) {
      const selected = state.rectangles.find((r) => r.id === state.selectedId);
      if (selected) {
        const handle = hitTestHandle(screenP, selected, state.viewport);
        if (handle === "rotate") {
          dispatch({ type: "commitHistory" });
          dragRef.current = {
            lastX: e.clientX,
            lastY: e.clientY,
            mode: { kind: "rotate", oldRect: selected, rectId: selected.id },
          };
          (e.target as Element).setPointerCapture(e.pointerId);
          return;
        }
        if (handle) {
          dispatch({ type: "commitHistory" });
          dragRef.current = {
            lastX: e.clientX,
            lastY: e.clientY,
            mode: { kind: "resize", handle, oldRect: selected, rectId: selected.id },
          };
          (e.target as Element).setPointerCapture(e.pointerId);
          return;
        }
      }
    }

    // 2. Rect hit-test.
    let hitId: string | null = null;
    for (let i = state.rectangles.length - 1; i >= 0; i--) {
      if (pointInRect(worldP, state.rectangles[i]!)) {
        hitId = state.rectangles[i]!.id;
        break;
      }
    }

    if (hitId) {
      dispatch({ type: "select", id: hitId });
      // Commit pre-move state so undo restores starting position.
      dispatch({ type: "commitHistory" });
      dragRef.current = {
        lastX: e.clientX,
        lastY: e.clientY,
        mode: { kind: "move", startWorld: worldP },
      };
    } else {
      dispatch({ type: "select", id: null });
      dragRef.current = { lastX: e.clientX, lastY: e.clientY, mode: { kind: "pan" } };
    }
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const cRect = canvas.getBoundingClientRect();
    const screenP = { x: e.clientX - cRect.left, y: e.clientY - cRect.top };

    const dxPx = e.clientX - drag.lastX;
    const dyPx = e.clientY - drag.lastY;
    drag.lastX = e.clientX;
    drag.lastY = e.clientY;

    const mode = drag.mode;

    if (mode.kind === "resize") {
      const pointerWorld = screenToWorld(screenP, state.viewport);
      const next = computeResizedRect(mode.oldRect, mode.handle, pointerWorld);
      dispatch({
        type: "resizeRect",
        id: mode.rectId,
        cx: next.cx,
        cy: next.cy,
        width: next.width,
        height: next.height,
      });
      return;
    }

    if (mode.kind === "rotate") {
      const pointerWorld = screenToWorld(screenP, state.viewport);
      const deg = computeRotation(mode.oldRect, pointerWorld);
      dispatch({ type: "rotateRect", id: mode.rectId, rotationDeg: deg });
      return;
    }

    if (mode.kind === "move" && state.selectedId) {
      let dx = dxPx / state.viewport.pixelsPerMm;
      let dy = dyPx / state.viewport.pixelsPerMm;

      // Grid snap (only during drag, before roundToWorldMm on up)
      if (state.snapToGrid) {
        const selected = state.rectangles.find((r) => r.id === state.selectedId);
        if (selected) {
          const newPos = {
            x: selected.cx + dx,
            y: selected.cy + dy,
          };
          const snapped = snapToGrid(newPos, state.gridStepMm);
          dx = snapped.x - selected.cx;
          dy = snapped.y - selected.cy;
        }
      }

      dispatch({ type: "moveSelected", dx, dy });
      return;
    }

    if (mode.kind === "pan") {
      dispatch({
        type: "setViewport",
        viewport: {
          ...state.viewport,
          panX: state.viewport.panX + dxPx,
          panY: state.viewport.panY + dyPx,
        },
      });
    }
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const onWheel = (e: React.WheelEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const screenP = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const worldBefore = screenToWorld(screenP, state.viewport);

    const factor = Math.exp(-e.deltaY * 0.001);
    const newZoom = Math.max(0.005, Math.min(5, state.viewport.pixelsPerMm * factor));

    const newPanX = screenP.x - worldBefore.x * newZoom;
    const newPanY = screenP.y - worldBefore.y * newZoom;

    dispatch({
      type: "setViewport",
      viewport: { panX: newPanX, panY: newPanY, pixelsPerMm: newZoom },
    });
  };

  return (
    <div
      ref={containerRef}
      style={{ flex: 1, overflow: "hidden", position: "relative" }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: "block" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
      />
    </div>
  );
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  vp: { panX: number; panY: number; pixelsPerMm: number },
  palette: CanvasPalette,
) {
  const stepMm = 1000;
  const stepPx = stepMm * vp.pixelsPerMm;
  if (stepPx < 4) return;

  ctx.strokeStyle = palette.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();

  const startX = vp.panX % stepPx;
  for (let x = startX; x < w; x += stepPx) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  const startY = vp.panY % stepPx;
  for (let y = startY; y < h; y += stepPx) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();
}

/** Draw the plot boundary rectangle */
function drawPlotBoundary(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  vp: { panX: number; panY: number; pixelsPerMm: number },
  palette: CanvasPalette,
) {
  const corners = rectCorners(rect);
  const sc = corners.map((c) => worldToScreen(c, vp));

  ctx.strokeStyle = palette.accentSun;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 3]);
  ctx.beginPath();
  for (let i = 0; i < sc.length; i++) {
    if (i === 0) ctx.moveTo(sc[i]!.x, sc[i]!.y);
    else ctx.lineTo(sc[i]!.x, sc[i]!.y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);
}

/** Draw compass rose — rotates visually with northRotationDeg (ADR-006) */
function drawCompass(
  ctx: CanvasRenderingContext2D,
  w: number,
  palette: CanvasPalette,
  northRotationDeg: number = 0,
) {
  const cx = w - 50;
  const cy = 50;
  const r = 24;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((northRotationDeg * Math.PI) / 180);

  ctx.strokeStyle = palette.ink2;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.font = "11px var(--font-mono, ui-monospace, Menlo, monospace)";
  ctx.fillStyle = palette.compassN;
  ctx.fillText("N", -4, -r + 12);
  ctx.fillStyle = palette.ink1;
  ctx.fillText("S", -4, r - 4);
  ctx.fillText("E", r - 10, 4);
  ctx.fillText("W", -r + 2, 4);

  ctx.restore();
}
