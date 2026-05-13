import { describe, it, expect } from "vitest";
import { degToRad, radToDeg, rotatePoint, rectCorners, rectAxes } from "../src/rotation.js";
import type { Rect } from "../src/types.js";

const close = (a: number, b: number, eps = 1e-9): boolean => Math.abs(a - b) <= eps;

// ---------------------------------------------------------------------------
// degToRad / radToDeg
// ---------------------------------------------------------------------------
describe("degToRad / radToDeg", () => {
  it("round-trips standard angles", () => {
    for (const d of [0, 1, 45, 90, 180, 359.999]) {
      expect(close(radToDeg(degToRad(d)), d)).toBe(true);
    }
  });

  it("0° = 0 rad", () => {
    expect(degToRad(0)).toBe(0);
  });

  it("180° = π", () => {
    expect(close(degToRad(180), Math.PI)).toBe(true);
  });

  it("360° = 2π", () => {
    expect(close(degToRad(360), 2 * Math.PI)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// rotatePoint
// ---------------------------------------------------------------------------
describe("rotatePoint", () => {
  it("0° is identity", () => {
    const p = { x: 100, y: 200 };
    const r = rotatePoint(p, { x: 0, y: 0 }, 0);
    expect(close(r.x, 100)).toBe(true);
    expect(close(r.y, 200)).toBe(true);
  });

  it("rotates clockwise in y-down world (90° → +X becomes +Y)", () => {
    const p = { x: 1000, y: 0 };
    const r = rotatePoint(p, { x: 0, y: 0 }, 90);
    expect(close(r.x, 0)).toBe(true);
    expect(close(r.y, 1000)).toBe(true);
  });

  it("180° flips through pivot", () => {
    const p = { x: 500, y: -300 };
    const pivot = { x: 100, y: 100 };
    const r = rotatePoint(p, pivot, 180);
    expect(close(r.x, -300)).toBe(true);
    expect(close(r.y, 500)).toBe(true);
  });

  it("360° returns to original position", () => {
    const p = { x: 17, y: 23 };
    const r = rotatePoint(p, { x: 0, y: 0 }, 360);
    expect(close(r.x, 17, 1e-9)).toBe(true);
    expect(close(r.y, 23, 1e-9)).toBe(true);
  });

  it("rotation around non-origin pivot", () => {
    const p = { x: 200, y: 100 };
    const pivot = { x: 100, y: 100 };
    const r = rotatePoint(p, pivot, 90);
    expect(close(r.x, 100)).toBe(true);
    expect(close(r.y, 200)).toBe(true);
  });

  it("360000° is near-identity (large angle FP tolerance)", () => {
    const p = { x: 500, y: 300 };
    const r = rotatePoint(p, { x: 0, y: 0 }, 360_000);
    expect(close(r.x, 500, 1e-6)).toBe(true);
    expect(close(r.y, 300, 1e-6)).toBe(true);
  });

  it("negative rotation is counter-clockwise", () => {
    // -90° CCW: +X (1000, 0) → -Y (0, -1000)
    const r = rotatePoint({ x: 1000, y: 0 }, { x: 0, y: 0 }, -90);
    expect(close(r.x, 0)).toBe(true);
    expect(close(r.y, -1000)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// rectCorners
// ---------------------------------------------------------------------------
describe("rectCorners", () => {
  it("axis-aligned rectangle has expected corners", () => {
    const rect: Rect = {
      id: "r",
      cx: 1000,
      cy: 1000,
      width: 600,
      height: 400,
      rotationDeg: 0,
      wallHeight: 0,
    };
    const c = rectCorners(rect);
    expect(c[0]).toEqual({ x: 700, y: 800 });  // top-left
    expect(c[1]).toEqual({ x: 1300, y: 800 }); // top-right
    expect(c[2]).toEqual({ x: 1300, y: 1200 }); // bottom-right
    expect(c[3]).toEqual({ x: 700, y: 1200 });  // bottom-left
  });

  it("90° rotation swaps width and height in AABB sense", () => {
    const rect: Rect = {
      id: "r",
      cx: 0,
      cy: 0,
      width: 600,
      height: 400,
      rotationDeg: 90,
      wallHeight: 0,
    };
    const c = rectCorners(rect);
    // After 90° CW, top-left (-300, -200) becomes (200, -300)
    expect(close(c[0].x, 200)).toBe(true);
    expect(close(c[0].y, -300)).toBe(true);
  });

  it("180° rotation flips all corners", () => {
    const rect: Rect = {
      id: "r",
      cx: 0,
      cy: 0,
      width: 200,
      height: 100,
      rotationDeg: 180,
      wallHeight: 0,
    };
    const c0 = rectCorners({ ...rect, rotationDeg: 0 });
    const c180 = rectCorners(rect);
    // Each corner should be negated (rotated 180° around origin)
    for (let i = 0; i < 4; i++) {
      expect(close(c180[i]!.x, -c0[i]!.x, 1e-9)).toBe(true);
      expect(close(c180[i]!.y, -c0[i]!.y, 1e-9)).toBe(true);
    }
  });

  it("360° rotation = identity", () => {
    const rect: Rect = {
      id: "r",
      cx: 500,
      cy: 300,
      width: 200,
      height: 100,
      rotationDeg: 0,
      wallHeight: 0,
    };
    const c0 = rectCorners(rect);
    const c360 = rectCorners({ ...rect, rotationDeg: 360 });
    for (let i = 0; i < 4; i++) {
      expect(close(c360[i]!.x, c0[i]!.x, 1e-9)).toBe(true);
      expect(close(c360[i]!.y, c0[i]!.y, 1e-9)).toBe(true);
    }
  });

  it("very small rectangle still has valid corners", () => {
    const rect: Rect = {
      id: "tiny",
      cx: 0,
      cy: 0,
      width: 1,    // 1mm
      height: 1,   // 1mm
      rotationDeg: 45,
      wallHeight: 0,
    };
    const c = rectCorners(rect);
    expect(c.length).toBe(4);
    c.forEach((p) => {
      expect(isFinite(p.x)).toBe(true);
      expect(isFinite(p.y)).toBe(true);
    });
  });

  it("very large coordinates produce finite corners", () => {
    const rect: Rect = {
      id: "big",
      cx: 1_000_000,
      cy: 1_000_000,
      width: 500_000,
      height: 300_000,
      rotationDeg: 37,
      wallHeight: 0,
    };
    const c = rectCorners(rect);
    c.forEach((p) => {
      expect(isFinite(p.x)).toBe(true);
      expect(isFinite(p.y)).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// rectAxes
// ---------------------------------------------------------------------------
describe("rectAxes", () => {
  it("0° axes are (1,0) and (0,1)", () => {
    const rect: Rect = { id: "r", cx: 0, cy: 0, width: 100, height: 100, rotationDeg: 0, wallHeight: 0 };
    const [ax1, ax2] = rectAxes(rect);
    expect(close(ax1!.x, 1)).toBe(true);
    expect(close(ax1!.y, 0)).toBe(true);
    expect(close(ax2!.x, 0)).toBe(true);
    expect(close(ax2!.y, 1)).toBe(true);
  });

  it("axes are always unit vectors", () => {
    for (const deg of [0, 30, 45, 90, 135, 180, 270]) {
      const rect: Rect = { id: "r", cx: 0, cy: 0, width: 100, height: 100, rotationDeg: deg, wallHeight: 0 };
      const [ax1, ax2] = rectAxes(rect);
      const len1 = Math.sqrt(ax1!.x ** 2 + ax1!.y ** 2);
      const len2 = Math.sqrt(ax2!.x ** 2 + ax2!.y ** 2);
      expect(close(len1, 1)).toBe(true);
      expect(close(len2, 1)).toBe(true);
    }
  });

  it("axes are perpendicular", () => {
    for (const deg of [0, 30, 45, 90, 135]) {
      const rect: Rect = { id: "r", cx: 0, cy: 0, width: 100, height: 100, rotationDeg: deg, wallHeight: 0 };
      const [ax1, ax2] = rectAxes(rect);
      const dot = ax1!.x * ax2!.x + ax1!.y * ax2!.y;
      expect(close(dot, 0)).toBe(true);
    }
  });
});
