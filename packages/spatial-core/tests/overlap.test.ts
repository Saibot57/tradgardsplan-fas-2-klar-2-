import { describe, it, expect } from "vitest";
import { rectOverlap, rectEdgeTouch, rectIntersects } from "../src/overlap.js";
import type { Rect } from "../src/types.js";

function r(
  id: string,
  cx: number,
  cy: number,
  w: number,
  h: number,
  rot = 0,
): Rect {
  return { id, cx, cy, width: w, height: h, rotationDeg: rot, wallHeight: 0 };
}

// ---------------------------------------------------------------------------
// rectOverlap (axis-aligned)
// ---------------------------------------------------------------------------
describe("rectOverlap (axis-aligned)", () => {
  it("identical rectangles overlap", () => {
    expect(rectOverlap(r("a", 0, 0, 100, 100), r("b", 0, 0, 100, 100))).toBe(true);
  });

  it("clearly separated rectangles do not overlap", () => {
    expect(rectOverlap(r("a", 0, 0, 100, 100), r("b", 1000, 1000, 100, 100))).toBe(false);
  });

  it("partially overlapping rectangles overlap", () => {
    expect(rectOverlap(r("a", 0, 0, 100, 100), r("b", 50, 50, 100, 100))).toBe(true);
  });

  it("edge-touch is NOT overlap", () => {
    expect(rectOverlap(r("a", 0, 0, 100, 100), r("b", 100, 0, 100, 100))).toBe(false);
  });

  it("corner-touch is NOT overlap", () => {
    expect(rectOverlap(r("a", 0, 0, 100, 100), r("b", 100, 100, 100, 100))).toBe(false);
  });

  it("near-epsilon overlap: 1e-4 mm into each other — should be overlap", () => {
    // A: cx=0, w=100 → right edge at x=50. B: cx=100-1e-4, w=100 → left edge at 50-1e-4
    // They share ~1e-4 mm of overlap
    expect(rectOverlap(r("a", 0, 0, 100, 100), r("b", 100 - 1e-4, 0, 100, 100))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// rectOverlap (rotated)
// ---------------------------------------------------------------------------
describe("rectOverlap (rotated)", () => {
  it("rotated rectangles that visually overlap return true", () => {
    expect(rectOverlap(r("a", 0, 0, 200, 200), r("b", 0, 0, 200, 200, 45))).toBe(true);
  });

  it("rotated rectangle just touching another is not overlap", () => {
    const A = r("a", 0, 0, 200, 200, 0);
    const half = 100 * Math.SQRT2;
    const B = r("b", 100 + half, 0, 200, 200, 45);
    expect(rectOverlap(A, B)).toBe(false);
  });

  it("rotated rectangle clearly separated does not overlap", () => {
    expect(rectOverlap(r("a", 0, 0, 200, 200, 30), r("b", 1000, 0, 200, 200, 60))).toBe(false);
  });

  it("two same-size rectangles at 0° and 90° at same center overlap", () => {
    // Non-square at same center: must overlap (they share the center)
    expect(rectOverlap(r("a", 0, 0, 400, 100, 0), r("b", 0, 0, 400, 100, 90))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// rectEdgeTouch
// ---------------------------------------------------------------------------
describe("rectEdgeTouch", () => {
  it("returns true for shared-edge touch", () => {
    expect(rectEdgeTouch(r("a", 0, 0, 100, 100), r("b", 100, 0, 100, 100))).toBe(true);
  });

  it("returns true for corner touch", () => {
    expect(rectEdgeTouch(r("a", 0, 0, 100, 100), r("b", 100, 100, 100, 100))).toBe(true);
  });

  it("returns false when overlapping", () => {
    expect(rectEdgeTouch(r("a", 0, 0, 100, 100), r("b", 50, 0, 100, 100))).toBe(false);
  });

  it("returns false when separated", () => {
    expect(rectEdgeTouch(r("a", 0, 0, 100, 100), r("b", 1000, 0, 100, 100))).toBe(false);
  });

  it("rotated edge-touch: 45° square touching axis-aligned square at vertex", () => {
    // A square at origin 200x200. A 45° square placed so its left vertex exactly
    // touches A's right edge at x=100.
    const A = r("a", 0, 0, 200, 200, 0);
    const half = 100 * Math.SQRT2;
    const B = r("b", 100 + half, 0, 200, 200, 45);
    expect(rectEdgeTouch(A, B)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// rectIntersects
// ---------------------------------------------------------------------------
describe("rectIntersects", () => {
  it("true for both overlap and touch", () => {
    expect(rectIntersects(r("a", 0, 0, 100, 100), r("b", 50, 0, 100, 100))).toBe(true);
    expect(rectIntersects(r("a", 0, 0, 100, 100), r("b", 100, 0, 100, 100))).toBe(true);
  });

  it("false when separated", () => {
    expect(rectIntersects(r("a", 0, 0, 100, 100), r("b", 1000, 0, 100, 100))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Geometry edge cases
// ---------------------------------------------------------------------------
describe("geometry edge cases", () => {
  it("very small rectangles (1mm × 1mm) — overlap with self", () => {
    const a = r("a", 0, 0, 1, 1);
    expect(rectOverlap(a, a)).toBe(true);
  });

  it("very small rectangles — edge touch works", () => {
    const a = r("a", 0, 0, 1, 1);
    const b = r("b", 1, 0, 1, 1);
    expect(rectEdgeTouch(a, b)).toBe(true);
    expect(rectOverlap(a, b)).toBe(false);
  });

  it("very large coordinates — no false overlap far apart", () => {
    const a = r("a", 0, 0, 1000, 1000);
    const b = r("b", 1_000_000, 1_000_000, 1000, 1000);
    expect(rectOverlap(a, b)).toBe(false);
  });

  it("very large coordinates — overlap works", () => {
    const a = r("a", 0, 0, 2_000_000, 2_000_000);
    const b = r("b", 500_000, 500_000, 100, 100);
    expect(rectOverlap(a, b)).toBe(true);
  });
});
