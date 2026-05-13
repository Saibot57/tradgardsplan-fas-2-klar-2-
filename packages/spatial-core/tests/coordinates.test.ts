import { describe, it, expect } from "vitest";
import {
  worldToScreen,
  screenToWorld,
  roundToWorldMm,
  snapToWorldMm,
  worldToLocal,
  localToWorld,
  snapToGrid,
  type Viewport,
} from "../src/coordinates.js";
import type { Rect } from "../src/types.js";

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) <= eps;

// ---------------------------------------------------------------------------
// world ↔ screen
// ---------------------------------------------------------------------------
describe("world ↔ screen", () => {
  const vp: Viewport = { panX: 50, panY: 100, pixelsPerMm: 0.1 };

  it("world (0,0) maps to (panX, panY)", () => {
    expect(worldToScreen({ x: 0, y: 0 }, vp)).toEqual({ x: 50, y: 100 });
  });

  it("round-trip world → screen → world is exact", () => {
    const w = { x: 1234, y: -567 };
    const s = worldToScreen(w, vp);
    const back = screenToWorld(s, vp);
    expect(close(back.x, w.x)).toBe(true);
    expect(close(back.y, w.y)).toBe(true);
  });

  it("zoom scales correctly", () => {
    const vp2: Viewport = { panX: 0, panY: 0, pixelsPerMm: 2 };
    expect(worldToScreen({ x: 100, y: 50 }, vp2)).toEqual({ x: 200, y: 100 });
  });

  it("very large coordinates round-trip", () => {
    const vp3: Viewport = { panX: 0, panY: 0, pixelsPerMm: 0.07 };
    const w = { x: 1_000_000, y: 1_000_000 };
    const s = worldToScreen(w, vp3);
    const back = screenToWorld(s, vp3);
    expect(close(back.x, w.x, 1e-6)).toBe(true);
    expect(close(back.y, w.y, 1e-6)).toBe(true);
  });

  it("very small zoom does not produce NaN", () => {
    const vp4: Viewport = { panX: 0, panY: 0, pixelsPerMm: 1e-10 };
    const result = worldToScreen({ x: 1000, y: 1000 }, vp4);
    expect(isFinite(result.x)).toBe(true);
    expect(isFinite(result.y)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// roundToWorldMm / snapToWorldMm alias
// ---------------------------------------------------------------------------
describe("roundToWorldMm", () => {
  it("rounds to nearest integer", () => {
    expect(roundToWorldMm({ x: 10.4, y: -2.7 })).toEqual({ x: 10, y: -3 });
  });

  it("0.5 rounds up (JS Math.round behaviour)", () => {
    const r = roundToWorldMm({ x: 0.5, y: -0.5 });
    expect(r.x).toBe(1);
    // Math.round(-0.5) === -0 in JS; accept both 0 and -0
    expect(r.y === 0 || Object.is(r.y, -0)).toBe(true);
  });

  it("integers are unchanged", () => {
    expect(roundToWorldMm({ x: 100, y: -200 })).toEqual({ x: 100, y: -200 });
  });

  it("snapToWorldMm is an alias for roundToWorldMm", () => {
    // Backwards compatibility — same function
    expect(snapToWorldMm({ x: 10.6, y: 20.3 })).toEqual(
      roundToWorldMm({ x: 10.6, y: 20.3 }),
    );
  });
});

// ---------------------------------------------------------------------------
// snapToGrid
// ---------------------------------------------------------------------------
describe("snapToGrid", () => {
  it("snaps to default 10mm grid", () => {
    expect(snapToGrid({ x: 14, y: 26 })).toEqual({ x: 10, y: 30 });
  });

  it("snaps to 50mm grid", () => {
    expect(snapToGrid({ x: 74, y: 126 }, 50)).toEqual({ x: 50, y: 150 });
  });

  it("already-on-grid point is unchanged", () => {
    expect(snapToGrid({ x: 100, y: 500 }, 100)).toEqual({ x: 100, y: 500 });
  });

  it("negative coordinates snap correctly", () => {
    expect(snapToGrid({ x: -14, y: -26 }, 10)).toEqual({ x: -10, y: -30 });
  });
});

// ---------------------------------------------------------------------------
// worldToLocal / localToWorld — corrected local coordinate frame
// ---------------------------------------------------------------------------
describe("world ↔ local frame — corrected (center = local origin)", () => {
  const rect: Rect = {
    id: "r",
    cx: 1000,
    cy: 2000,
    width: 200,
    height: 100,
    rotationDeg: 30,
    wallHeight: 0,
  };

  it("rect center maps to local (0, 0)", () => {
    const local = worldToLocal({ x: rect.cx, y: rect.cy }, rect);
    expect(close(local.x, 0)).toBe(true);
    expect(close(local.y, 0)).toBe(true);
  });

  it("localToWorld(0,0) returns rect center", () => {
    const world = localToWorld({ x: 0, y: 0 }, rect);
    expect(close(world.x, rect.cx)).toBe(true);
    expect(close(world.y, rect.cy)).toBe(true);
  });

  it("round-trip world → local → world is exact", () => {
    const w = { x: 1100, y: 1950 };
    const l = worldToLocal(w, rect);
    const back = localToWorld(l, rect);
    expect(close(back.x, w.x, 1e-9)).toBe(true);
    expect(close(back.y, w.y, 1e-9)).toBe(true);
  });

  it("round-trip local → world → local is exact", () => {
    const l = { x: 80, y: -30 };
    const w = localToWorld(l, rect);
    const back = worldToLocal(w, rect);
    expect(close(back.x, l.x, 1e-9)).toBe(true);
    expect(close(back.y, l.y, 1e-9)).toBe(true);
  });

  it("0° rotation: worldToLocal = translate to center-relative", () => {
    const r0: Rect = { ...rect, rotationDeg: 0 };
    const w = { x: 1100, y: 2050 };
    const l = worldToLocal(w, r0);
    expect(close(l.x, 100)).toBe(true);
    expect(close(l.y, 50)).toBe(true);
  });

  it("90° rotation: x-axis becomes y-axis in world", () => {
    const r90: Rect = { ...rect, rotationDeg: 90, cx: 0, cy: 0 };
    // A point at local (100, 0) after 90° CW rotation should be at world (0, 100)
    const w = localToWorld({ x: 100, y: 0 }, r90);
    expect(close(w.x, 0, 1e-9)).toBe(true);
    expect(close(w.y, 100, 1e-9)).toBe(true);
  });

  it("180° rotation: axes flip", () => {
    const r180: Rect = { ...rect, rotationDeg: 180, cx: 0, cy: 0 };
    const w = localToWorld({ x: 100, y: 50 }, r180);
    expect(close(w.x, -100, 1e-9)).toBe(true);
    expect(close(w.y, -50, 1e-9)).toBe(true);
  });

  it("360° rotation same as 0°", () => {
    const r360: Rect = { ...rect, rotationDeg: 360 };
    const r0: Rect = { ...rect, rotationDeg: 0 };
    const w = { x: 1050, y: 2030 };
    const l360 = worldToLocal(w, r360);
    const l0 = worldToLocal(w, r0);
    expect(close(l360.x, l0.x, 1e-9)).toBe(true);
    expect(close(l360.y, l0.y, 1e-9)).toBe(true);
  });

  it("very large rotation (360000°) same as 0°", () => {
    const rBig: Rect = { ...rect, rotationDeg: 360_000, cx: 0, cy: 0 };
    const r0: Rect = { ...rect, rotationDeg: 0, cx: 0, cy: 0 };
    const w = { x: 50, y: 30 };
    const lBig = worldToLocal(w, rBig);
    const l0 = worldToLocal(w, r0);
    // Large angles may have slightly less precision — use 1e-6
    expect(close(lBig.x, l0.x, 1e-6)).toBe(true);
    expect(close(lBig.y, l0.y, 1e-6)).toBe(true);
  });
});
