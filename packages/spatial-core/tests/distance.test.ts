import { describe, it, expect } from "vitest";
import {
  obbDistance,
  closestPointsBetweenRects,
  distancesToBoundaryEdges,
} from "../src/distance.js";
import type { Rect } from "../src/types.js";

const r = (
  id: string,
  cx: number,
  cy: number,
  w: number,
  h: number,
  rot = 0,
): Rect => ({ id, cx, cy, width: w, height: h, rotationDeg: rot, wallHeight: 0 });

describe("obbDistance — axis-aligned", () => {
  it("returns positive gap for separated rectangles along X", () => {
    const a = r("a", 0, 0, 100, 100);
    const b = r("b", 300, 0, 100, 100);
    // Edges: a.right=50, b.left=250 → gap = 200
    expect(obbDistance(a, b)).toBeCloseTo(200, 6);
  });

  it("returns positive gap for separated rectangles along Y", () => {
    const a = r("a", 0, 0, 100, 100);
    const b = r("b", 0, 500, 100, 100);
    // gap = 500 - 50 - 50 = 400
    expect(obbDistance(a, b)).toBeCloseTo(400, 6);
  });

  it("returns 0 (within epsilon) for edge-touch", () => {
    const a = r("a", 0, 0, 100, 100);
    const b = r("b", 100, 0, 100, 100); // a.right = 50, b.left = 50
    expect(Math.abs(obbDistance(a, b))).toBeLessThan(1e-3);
  });

  it("returns 0 (within epsilon) for corner-touch", () => {
    const a = r("a", 0, 0, 100, 100);
    const b = r("b", 100, 100, 100, 100);
    expect(Math.abs(obbDistance(a, b))).toBeLessThan(1e-3);
  });

  it("returns negative value when overlapping", () => {
    const a = r("a", 0, 0, 100, 100);
    const b = r("b", 50, 0, 100, 100); // overlap of 50 mm on X
    const d = obbDistance(a, b);
    expect(d).toBeLessThan(0);
    expect(d).toBeCloseTo(-50, 6);
  });

  it("returns Euclidean diagonal distance for diagonal-separated rects", () => {
    const a = r("a", 0, 0, 100, 100);
    const b = r("b", 250, 250, 100, 100);
    // Closest corners: (50,50) and (200,200) → sqrt(150² + 150²) ≈ 212.13
    const expected = Math.sqrt(150 * 150 + 150 * 150);
    expect(obbDistance(a, b)).toBeCloseTo(expected, 4);
  });
});

describe("obbDistance — rotated", () => {
  it("returns positive distance for 45°-rotated rect separated from axis-aligned", () => {
    // a is rotated 45° — its corners extend further than axis-aligned bounds
    // half-diagonal = 50 * sqrt(2) ≈ 70.71
    const a = r("a", 0, 0, 100, 100, 45);
    const b = r("b", 300, 0, 100, 100);
    // a's rightmost point: ~70.71; b's leftmost: 250 → gap ≈ 179.29
    expect(obbDistance(a, b)).toBeCloseTo(300 - 50 - 50 * Math.SQRT2, 3);
  });

  it("returns negative penetration for rotated overlap", () => {
    const a = r("a", 0, 0, 200, 100, 45);
    const b = r("b", 100, 0, 100, 100);
    // a's right-tip extends to x ≈ 100 * cos(45°) = ~70.71
    // overlap exists; distance must be negative
    expect(obbDistance(a, b)).toBeLessThan(0);
  });
});

describe("closestPointsBetweenRects", () => {
  it("returns the obvious closest pair for axis-aligned separated rects", () => {
    const a = r("a", 0, 0, 100, 100);
    const b = r("b", 300, 0, 100, 100);
    const { pA, pB, distance } = closestPointsBetweenRects(a, b);
    expect(distance).toBeCloseTo(200, 6);
    // pA on a's right edge (x = 50), pB on b's left edge (x = 250)
    expect(pA.x).toBeCloseTo(50, 6);
    expect(pB.x).toBeCloseTo(250, 6);
  });

  it("returns a corner-corner pair for diagonally-offset rects", () => {
    const a = r("a", 0, 0, 100, 100);
    const b = r("b", 250, 250, 100, 100);
    const { pA, pB, distance } = closestPointsBetweenRects(a, b);
    expect(distance).toBeCloseTo(Math.sqrt(150 * 150 + 150 * 150), 4);
    // a's bottom-right corner (50,50) and b's top-left corner (200,200)
    expect(pA.x).toBeCloseTo(50, 6);
    expect(pA.y).toBeCloseTo(50, 6);
    expect(pB.x).toBeCloseTo(200, 6);
    expect(pB.y).toBeCloseTo(200, 6);
  });

  it("distance is consistent with obbDistance for separated rects", () => {
    const a = r("a", 0, 0, 200, 150, 17);
    const b = r("b", 800, 500, 300, 200, -42);
    expect(closestPointsBetweenRects(a, b).distance).toBeCloseTo(
      obbDistance(a, b),
      4,
    );
  });
});

describe("distancesToBoundaryEdges", () => {
  const boundary: Rect = r("plot", 0, 0, 1000, 800);

  it("returns positive distances when inner is fully inside", () => {
    const inner = r("inner", 0, 0, 200, 100);
    const d = distancesToBoundaryEdges(inner, boundary);
    // boundary: left=-500, right=+500, top=-400, bottom=+400
    // inner extent: x ∈ [-100, 100], y ∈ [-50, 50]
    expect(d.n).toBeCloseTo(350, 6); // top: -50 - (-400) = 350
    expect(d.e).toBeCloseTo(400, 6); // right: 500 - 100 = 400
    expect(d.s).toBeCloseTo(350, 6); // bottom: 400 - 50 = 350
    expect(d.w).toBeCloseTo(400, 6); // left: -100 - (-500) = 400
  });

  it("returns negative distance on the side that sticks out", () => {
    const inner = r("inner", 450, 0, 200, 100);
    // inner.x ∈ [350, 550] → sticks out 50 mm on the east side
    const d = distancesToBoundaryEdges(inner, boundary);
    expect(d.e).toBeCloseTo(-50, 6);
    expect(d.w).toBeCloseTo(850, 6); // far from west
  });

  it("works with rotated boundary", () => {
    const rotatedBoundary = r("plot", 0, 0, 1000, 800, 30);
    const inner = r("inner", 0, 0, 100, 100, 30);
    const d = distancesToBoundaryEdges(inner, rotatedBoundary);
    // Inner shares rotation with boundary, so in boundary-frame it's
    // axis-aligned at origin with extent ±50.
    expect(d.n).toBeCloseTo(350, 4);
    expect(d.e).toBeCloseTo(450, 4);
    expect(d.s).toBeCloseTo(350, 4);
    expect(d.w).toBeCloseTo(450, 4);
  });

  it("rotated inner: AABB-in-local-frame bounds expand correctly", () => {
    const inner = r("inner", 0, 0, 100, 100, 45);
    const d = distancesToBoundaryEdges(inner, boundary);
    // Inner rotated 45°: half-diagonal = 50 * sqrt(2) ≈ 70.71
    const half = 50 * Math.SQRT2;
    expect(d.n).toBeCloseTo(400 - half, 4);
    expect(d.e).toBeCloseTo(500 - half, 4);
    expect(d.s).toBeCloseTo(400 - half, 4);
    expect(d.w).toBeCloseTo(500 - half, 4);
  });
});
