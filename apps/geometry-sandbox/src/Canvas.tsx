import { useEffect, useRef, type Dispatch } from "react";
import type { Action, SandboxState } from "./state.js";
import {
  rectCorners,
  projectShadow,
  sampleSunHourly,
  snapToGrid,
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
  touchingIds: Set<string>;
  theme: "light" | "dark";
}

/** Hit-test */
function pointInRect(p: Point, rect: Rect): boolean {
  const local = worldToLocal(p, rect);
  return Math.abs(local.x) <= rect.width / 2 && Math.abs(local.y) <= rect.height / 2;
}

type DragMode =
  | { kind: "move"; startWorld: Point; startPrimaryCx: number; startPrimaryCy: number }
  | { kind: "pan" }
  | { kind: "resize"; handle: ResizeHandle; oldRect: Rect; rectId: string }
  | { kind: "rotate"; oldRect: Rect; rectId: string };

export function Canvas({ state, dispatch, sun, overlappingIds, touchingIds, theme }: Props) {
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

    // Sun-path heatmap (06–20, 1-h-steg, svag opacity per skugga)
    if (state.showSunPath) {
      const day = new Date(state.sun.dateIso);
      day.setHours(0, 0, 0, 0);
      const samples = sampleSunHourly(day, state.plot.location, 6, 20);
      ctx.save();
      ctx.fillStyle = palette.shadowCanvas;
      ctx.globalAlpha = 0.10;
      for (const sample of samples) {
        if (sample.sun.altitudeRad <= 0) continue;
        for (const rect of state.rectangles) {
          if (rect.wallHeight <= 0) continue;
          const poly = projectShadow(rect, sample.sun, state.plot.northRotationDeg);
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
      ctx.restore();
    }

    // Shadows (interaktiv tidpunkt)
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
    const selectedSet = new Set(state.selectedIds);
    const primaryId = state.selectedIds[0] ?? null;
    let primaryRect: Rect | null = null;
    for (const rect of state.rectangles) {
      const corners = rectCorners(rect);
      const sc = corners.map((c) => worldToScreen(c, state.viewport));

      const isSelected = selectedSet.has(rect.id);
      const isPrimary = rect.id === primaryId;
      if (isPrimary) primaryRect = rect;
      const isOverlap = overlappingIds.has(rect.id);
      const isTouching = !isOverlap && touchingIds.has(rect.id);
      const isWall = rect.wallHeight > 0;

      ctx.beginPath();
      for (let i = 0; i < sc.length; i++) {
        if (i === 0) ctx.moveTo(sc[i]!.x, sc[i]!.y);
        else ctx.lineTo(sc[i]!.x, sc[i]!.y);
      }
      ctx.closePath();

      ctx.fillStyle = isOverlap
        ? palette.stateDangerFill
        : isTouching
          ? palette.accentSunFill
          : isWall
            ? palette.accentWallFill
            : palette.accentBedFill;
      ctx.fill();

      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeStyle = isOverlap
        ? palette.stateDanger
        : isSelected
          ? palette.accentSun
          : isTouching
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
    if (drag && primaryRect && (drag.mode.kind === "move" || drag.mode.kind === "resize")) {
      const c = worldToScreen({ x: primaryRect.cx, y: primaryRect.cy }, state.viewport);
      ctx.fillStyle = palette.measurementText;
      ctx.font = "600 13px var(--font-mono, ui-monospace, Menlo, monospace)";
      ctx.fillText(`${primaryRect.width} × ${primaryRect.height} mm`, c.x + 12, c.y - 20);
      if (drag.mode.kind === "move") {
        const dx = primaryRect.cx - drag.mode.startPrimaryCx;
        const dy = primaryRect.cy - drag.mode.startPrimaryCy;
        ctx.font = "500 12px var(--font-mono, ui-monospace, Menlo, monospace)";
        ctx.fillText(
          `Δ ${dx >= 0 ? "+" : ""}${dx} , ${dy >= 0 ? "+" : ""}${dy} mm`,
          c.x + 12,
          c.y - 4,
        );
      }
    }

    // Handles bara för primary-selected (resize/rotate på flera samtidigt är inte definierat)
    if (primaryRect) {
      drawHandles(ctx, primaryRect, state.viewport, palette);
    }
  }, [state, sun, overlappingIds, theme]);

  // Pointer interactions
  const onPointerDown = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const screenP = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const worldP = screenToWorld(screenP, state.viewport);

    const primaryId = state.selectedIds[0] ?? null;
    const shift = e.shiftKey;

    // 1. Handle hit-test (only on primary selected, ignoreras vid shift-klick för
    //    att inte slukas av handle istället för toggle).
    if (primaryId && !shift) {
      const selected = state.rectangles.find((r) => r.id === primaryId);
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
      // Shift-klick togglar markering; vanligt klick byter ut.
      dispatch({ type: "select", id: hitId, mode: shift ? "toggle" : "replace" });
      // Starta drag bara om vi inte just shift-togglade bort en bädd.
      const wasSelected = state.selectedIds.includes(hitId);
      const willBeSelected = !shift || !wasSelected; // efter dispatch
      if (willBeSelected) {
        dispatch({ type: "commitHistory" });
        const hitRect = state.rectangles.find((r) => r.id === hitId);
        dragRef.current = {
          lastX: e.clientX,
          lastY: e.clientY,
          mode: {
            kind: "move",
            startWorld: worldP,
            startPrimaryCx: hitRect?.cx ?? 0,
            startPrimaryCy: hitRect?.cy ?? 0,
          },
        };
      } else {
        dragRef.current = null;
      }
    } else {
      if (!shift) dispatch({ type: "select", id: null });
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

    if (mode.kind === "move" && state.selectedIds.length > 0) {
      let dx = dxPx / state.viewport.pixelsPerMm;
      let dy = dyPx / state.viewport.pixelsPerMm;

      // Grid snap baseras på primary-bädden under drag.
      if (state.snapToGrid) {
        const primaryId = state.selectedIds[0];
        const selected = state.rectangles.find((r) => r.id === primaryId);
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
