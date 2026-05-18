import { useEffect, useRef, useState, type Dispatch } from "react";
import type { Action, SandboxState } from "./state.js";
import {
  getKind,
  localToWorld,
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
  computeBoundaryMeasurements,
  computeNeighborMeasurements,
  NEIGHBOR_DISTANCE_THRESHOLD_MM,
} from "./measurementOverlay.js";
import { computeGhostRect, type GhostRectGeometry } from "./ghostRect.js";
import { MIN_RECT_DIMENSION_MM, nextId } from "./state.js";
import type { ObjectKind } from "@kolonitradgard/spatial-core";
import { KIND_DEFAULTS } from "./Toolbar.js";
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

/**
 * Konvertera "#RRGGBB" till rgba(...) med given alpha. Returnerar input
 * oförändrat om strängen inte är giltig hex.
 */
function hexToRgba(hex: string, alpha: number): string {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Färg-routing för en rektangel. Prioritetsordning:
 *   1. rect.color (custom override) — om satt
 *   2. wallHeight > 0 → wall
 *   3. kind-specifik default
 *   4. fallback → bed
 *
 * isOverlap/isTouching/isSelected appliceras i render-koden (utanför).
 */
function pickRectStyle(
  rect: Rect,
  isWall: boolean,
  palette: CanvasPalette,
): { fill: string; stroke: string } {
  if (rect.color) {
    return { fill: hexToRgba(rect.color, 0.32), stroke: rect.color };
  }
  if (isWall) {
    return { fill: palette.accentWallFill, stroke: palette.accentWall };
  }
  switch (getKind(rect)) {
    case "rabatt":
      return { fill: palette.accentRabattFill, stroke: palette.accentRabatt };
    case "grass":
      return { fill: palette.accentGrassFill, stroke: palette.accentGrass };
    case "paved":
      return { fill: palette.accentPavedFill, stroke: palette.accentPaved };
    case "gravel":
      return { fill: palette.accentGravelFill, stroke: palette.accentGravel };
    case "deck":
      return { fill: palette.accentDeckFill, stroke: palette.accentDeck };
    case "surface":
      return { fill: palette.accentSurfaceFill, stroke: palette.accentSurface };
    case "bed":
    case "building":
    case "hedge":
    default:
      return { fill: palette.accentBedFill, stroke: palette.accentBed };
  }
}

type Viewport = { panX: number; panY: number; pixelsPerMm: number };

function drawDashedLineWithLabel(
  ctx: CanvasRenderingContext2D,
  pA: Point,
  pB: Point,
  label: string,
  vp: Viewport,
  strokeStyle: string,
  textStyle: string,
): void {
  const sA = worldToScreen(pA, vp);
  const sB = worldToScreen(pB, vp);
  ctx.save();
  ctx.setLineDash([4, 3]);
  ctx.lineWidth = 1;
  ctx.strokeStyle = strokeStyle;
  ctx.beginPath();
  ctx.moveTo(sA.x, sA.y);
  ctx.lineTo(sB.x, sB.y);
  ctx.stroke();
  ctx.restore();

  const midX = (sA.x + sB.x) / 2;
  const midY = (sA.y + sB.y) / 2;
  ctx.font = "500 11px var(--font-mono, ui-monospace, Menlo, monospace)";
  const metrics = ctx.measureText(label);
  const padX = 4;
  const padY = 2;
  const boxW = metrics.width + padX * 2;
  const boxH = 14 + padY * 2;
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.fillRect(midX - boxW / 2, midY - boxH / 2, boxW, boxH);
  ctx.fillStyle = textStyle;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(label, midX, midY);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "start";
}

/**
 * Ritar dashed avståndsstreck från `primary` till närliggande rektanglar och
 * 4 perpendikulära streck till tomtgränsens kanter. Anropas under drag/resize.
 */
function drawMeasurementOverlay(
  ctx: CanvasRenderingContext2D,
  primary: Rect,
  allRects: readonly Rect[],
  boundary: Rect | null,
  vp: Viewport,
  showAll: boolean,
  palette: CanvasPalette,
): void {
  // 1. Grannmått
  const neighbors = computeNeighborMeasurements(
    primary,
    allRects,
    NEIGHBOR_DISTANCE_THRESHOLD_MM,
    showAll,
  );
  for (const n of neighbors) {
    const label = `${Math.round(n.distanceMm)} mm`;
    drawDashedLineWithLabel(
      ctx,
      n.pA,
      n.pB,
      label,
      vp,
      palette.ink2,
      palette.measurementText,
    );
  }

  // 2. Boundary-mått (4 perpendikulära streck i boundary-lokal frame)
  if (!boundary) return;
  const b = computeBoundaryMeasurements(primary, boundary);
  if (!b) return;

  // Hitta primary-rect:s AABB i boundary-lokal frame
  const corners = rectCorners(primary);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const c of corners) {
    const lc = worldToLocal(c, boundary);
    if (lc.x < minX) minX = lc.x;
    if (lc.x > maxX) maxX = lc.x;
    if (lc.y < minY) minY = lc.y;
    if (lc.y > maxY) maxY = lc.y;
  }
  const midLocalX = (minX + maxX) / 2;
  const midLocalY = (minY + maxY) / 2;
  const bhw = boundary.width / 2;
  const bhh = boundary.height / 2;

  const edges: Array<{ from: Point; to: Point; dist: number }> = [
    // N: top edge in boundary-frame is y = -bhh
    { from: { x: midLocalX, y: minY }, to: { x: midLocalX, y: -bhh }, dist: b.n },
    // E: right edge is x = +bhw
    { from: { x: maxX, y: midLocalY }, to: { x: bhw, y: midLocalY }, dist: b.e },
    // S: bottom edge is y = +bhh
    { from: { x: midLocalX, y: maxY }, to: { x: midLocalX, y: bhh }, dist: b.s },
    // W: left edge is x = -bhw
    { from: { x: minX, y: midLocalY }, to: { x: -bhw, y: midLocalY }, dist: b.w },
  ];

  for (const e of edges) {
    const wFrom = localToWorld(e.from, boundary);
    const wTo = localToWorld(e.to, boundary);
    const label = `${Math.round(e.dist)} mm`;
    drawDashedLineWithLabel(
      ctx,
      wFrom,
      wTo,
      label,
      vp,
      palette.accentSun,
      palette.measurementText,
    );
  }
}

type DragMode =
  | { kind: "move"; startWorld: Point; startPrimaryCx: number; startPrimaryCy: number }
  | { kind: "pan" }
  | { kind: "resize"; handle: ResizeHandle; oldRect: Rect; rectId: string }
  | { kind: "rotate"; oldRect: Rect; rectId: string }
  | { kind: "creating"; startWorld: Point; objectKind: ObjectKind };

export function Canvas({ state, dispatch, sun, overlappingIds, touchingIds, theme }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    lastX: number;
    lastY: number;
    mode: DragMode;
  } | null>(null);

  /**
   * Aktuell ghost-rektangel under drag-to-create. Lokal state istället för
   * reducer eftersom det är ren preview — varken canonicalized eller del
   * av scene. När den ändras triggas re-render automatiskt.
   */
  const [ghostRect, setGhostRect] = useState<GhostRectGeometry | null>(null);

  /** Space-tangenten håller pan-läge oavsett tool. */
  const spaceHeldRef = useRef<boolean>(false);

  // Tangentbordshanterare för Space (pan-overlay) och Escape (avbryt create)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        // Förhindra scrolling
        if ((e.target as HTMLElement)?.tagName !== "INPUT") {
          e.preventDefault();
          spaceHeldRef.current = true;
        }
      } else if (e.key === "Escape") {
        if (dragRef.current?.mode.kind === "creating") {
          dragRef.current = null;
          setGhostRect(null);
        }
        if (state.tool === "create") {
          dispatch({ type: "setTool", tool: "select" });
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") spaceHeldRef.current = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [state.tool, dispatch]);

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

      const baseStyle = pickRectStyle(rect, isWall, palette);
      ctx.fillStyle = isOverlap
        ? palette.stateDangerFill
        : isTouching
          ? palette.accentSunFill
          : baseStyle.fill;
      ctx.fill();

      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeStyle = isOverlap
        ? palette.stateDanger
        : isSelected
          ? palette.accentSun
          : isTouching
            ? palette.accentSun
            : baseStyle.stroke;
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

    // Mått-overlay under drag (move/resize): grann-mått + boundary-mått
    const drag = dragRef.current;
    if (drag && primaryRect && (drag.mode.kind === "move" || drag.mode.kind === "resize")) {
      drawMeasurementOverlay(
        ctx,
        primaryRect,
        state.rectangles,
        state.plot.boundaryRect,
        state.viewport,
        state.showAllMeasurements,
        palette,
      );

      // Primärt mått-tag (width×height + Δ för move) ritas ovanpå allt
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

    // Ghost-rektangel under drag-to-create
    if (ghostRect && dragRef.current?.mode.kind === "creating") {
      const objectKind = dragRef.current.mode.objectKind;
      const minDim = Math.min(ghostRect.width, ghostRect.height);
      const tooSmall = minDim < MIN_RECT_DIMENSION_MM;
      const previewRect: Rect = {
        id: "__ghost__",
        cx: ghostRect.cx,
        cy: ghostRect.cy,
        width: Math.max(1, ghostRect.width),
        height: Math.max(1, ghostRect.height),
        rotationDeg: 0,
        wallHeight: 0,
        ...(objectKind !== "bed" ? { kind: objectKind } : {}),
      };
      const corners = rectCorners(previewRect);
      const sc = corners.map((c) => worldToScreen(c, state.viewport));
      ctx.save();
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 1.5;
      const baseStyle = pickRectStyle(previewRect, false, palette);
      ctx.fillStyle = tooSmall ? palette.stateDangerFill : baseStyle.fill;
      ctx.strokeStyle = tooSmall ? palette.stateDanger : baseStyle.stroke;
      ctx.beginPath();
      for (let i = 0; i < sc.length; i++) {
        if (i === 0) ctx.moveTo(sc[i]!.x, sc[i]!.y);
        else ctx.lineTo(sc[i]!.x, sc[i]!.y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Live-mått-tag
      const center = worldToScreen({ x: ghostRect.cx, y: ghostRect.cy }, state.viewport);
      ctx.fillStyle = palette.measurementText;
      ctx.font = "600 13px var(--font-mono, ui-monospace, Menlo, monospace)";
      ctx.fillText(
        `${Math.round(ghostRect.width)} × ${Math.round(ghostRect.height)} mm`,
        center.x + 12,
        center.y - 12,
      );
    }

    // Handles bara för primary-selected (resize/rotate på flera samtidigt är inte definierat)
    if (primaryRect) {
      drawHandles(ctx, primaryRect, state.viewport, palette);
    }
  }, [state, sun, overlappingIds, touchingIds, theme, ghostRect]);

  // Pointer interactions
  const onPointerDown = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const screenP = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const worldP = screenToWorld(screenP, state.viewport);

    const primaryId = state.selectedIds[0] ?? null;
    const shift = e.shiftKey;

    // 0a. Space hålls → tvinga pan oavsett tool, så man kan panorera även i
    //     create-läge utan att råka skapa något.
    if (spaceHeldRef.current) {
      dragRef.current = { lastX: e.clientX, lastY: e.clientY, mode: { kind: "pan" } };
      (e.target as Element).setPointerCapture(e.pointerId);
      return;
    }

    // 0b. Drag-to-create: när tool === "create" startar vi creating-drag direkt
    //     — bypass:a handle/rect-hittest.
    if (state.tool === "create") {
      dragRef.current = {
        lastX: e.clientX,
        lastY: e.clientY,
        mode: { kind: "creating", startWorld: worldP, objectKind: state.createKind },
      };
      setGhostRect({ cx: worldP.x, cy: worldP.y, width: 0, height: 0 });
      (e.target as Element).setPointerCapture(e.pointerId);
      return;
    }

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

    if (mode.kind === "creating") {
      const pointerWorld = screenToWorld(screenP, state.viewport);
      const next = computeGhostRect(mode.startWorld, pointerWorld, {
        enabled: state.snapToGrid,
        stepMm: state.gridStepMm,
      });
      setGhostRect(next);
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
    const drag = dragRef.current;
    if (drag?.mode.kind === "creating" && ghostRect) {
      const w = Math.round(ghostRect.width);
      const h = Math.round(ghostRect.height);
      if (w >= MIN_RECT_DIMENSION_MM && h >= MIN_RECT_DIMENSION_MM) {
        const objectKind = drag.mode.objectKind;
        const defaults = KIND_DEFAULTS[objectKind];
        const newRect: Rect = {
          id: nextId(),
          cx: Math.round(ghostRect.cx),
          cy: Math.round(ghostRect.cy),
          width: w,
          height: h,
          rotationDeg: 0,
          wallHeight: defaults.wallHeight,
        };
        if (objectKind !== "bed") newRect.kind = objectKind;
        dispatch({ type: "addRect", rect: newRect });
      }
      setGhostRect(null);
      dispatch({ type: "setTool", tool: "select" });
    }
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
