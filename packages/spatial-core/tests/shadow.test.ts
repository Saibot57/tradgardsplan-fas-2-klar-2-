import { describe, it, expect } from "vitest";
import {
  shadowVector,
  projectShadow,
  convexHull,
  MIN_ALTITUDE_DEG,
  MIN_ALTITUDE_RAD,
  MAX_SHADOW_LENGTH_MM,
} from "../src/shadow.js";
import type { Rect, SunPosition } from "../src/types.js";

const close = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) <= eps;

// ---------------------------------------------------------------------------
// shadowVector — basic cases
// ---------------------------------------------------------------------------
describe("shadowVector — basic cases", () => {
  it("returns null when wallHeight is 0", () => {
    const sun: SunPosition = { altitudeRad: Math.PI / 4, azimuthRad: 0 };
    expect(shadowVector(0, sun)).toBeNull();
  });

  it("returns null when sun is below horizon (altitude < 0)", () => {
    const sun: SunPosition = { altitudeRad: -0.1, azimuthRad: 0 };
    expect(shadowVector(2000, sun)).toBeNull();
  });

  it("returns null when altitude is exactly 0", () => {
    const sun: SunPosition = { altitudeRad: 0, azimuthRad: 0 };
    expect(shadowVector(2000, sun)).toBeNull();
  });

  it("at 45° altitude, shadow length equals wall height (sun south, northRotationDeg=0)", () => {
    const sun: SunPosition = { altitudeRad: Math.PI / 4, azimuthRad: 0 };
    const v = shadowVector(2000, sun)!;
    expect(close(v.x, 0)).toBe(true);
    expect(close(v.y, -2000, 1e-9)).toBe(true);
  });

  it("sun in west (azimuth +π/2) → shadow points east (+X)", () => {
    const sun: SunPosition = { altitudeRad: Math.PI / 4, azimuthRad: Math.PI / 2 };
    const v = shadowVector(1000, sun)!;
    expect(close(v.x, 1000, 1e-9)).toBe(true);
    expect(close(v.y, 0, 1e-9)).toBe(true);
  });

  it("sun in east (azimuth -π/2) → shadow points west (-X)", () => {
    const sun: SunPosition = { altitudeRad: Math.PI / 4, azimuthRad: -Math.PI / 2 };
    const v = shadowVector(1000, sun)!;
    expect(close(v.x, -1000, 1e-9)).toBe(true);
    expect(close(v.y, 0, 1e-9)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// shadowVector — altitude clamping
// ---------------------------------------------------------------------------
describe("shadowVector — altitude clamping (FAS 1.5 hardening)", () => {
  it("altitude below MIN_ALTITUDE_RAD is clamped, not null", () => {
    const sun: SunPosition = { altitudeRad: 0.01, azimuthRad: 0 };
    // 0.01 rad ≈ 0.57° — below MIN_ALTITUDE_DEG (4°)
    const v = shadowVector(1000, sun);
    expect(v).not.toBeNull();
  });

  it("shadow length is clamped to MAX_SHADOW_LENGTH_MM", () => {
    // Very low sun, very tall wall → without clamping would be astronomical
    const sun: SunPosition = { altitudeRad: 0.001, azimuthRad: 0 };
    const v = shadowVector(100_000, sun)!;
    const len = Math.sqrt(v.x ** 2 + v.y ** 2);
    expect(len).toBeLessThanOrEqual(MAX_SHADOW_LENGTH_MM + 1); // +1 for FP rounding
  });

  it("altitude exactly at MIN_ALTITUDE_RAD — shadow does not exceed cap badly", () => {
    const sun: SunPosition = { altitudeRad: MIN_ALTITUDE_RAD, azimuthRad: 0 };
    const v = shadowVector(2000, sun)!;
    const len = Math.sqrt(v.x ** 2 + v.y ** 2);
    // At 4°, tan(4°) ≈ 0.0699, so length ≈ 2000/0.0699 ≈ 28600mm — under cap
    expect(len).toBeLessThanOrEqual(MAX_SHADOW_LENGTH_MM);
    expect(len).toBeGreaterThan(0);
  });

  it("altitude just above MIN_ALTITUDE_RAD — produces plausible shadow", () => {
    const justAbove = MIN_ALTITUDE_RAD * 1.01;
    const sun: SunPosition = { altitudeRad: justAbove, azimuthRad: 0 };
    const v = shadowVector(2000, sun)!;
    expect(v).not.toBeNull();
    expect(Math.sqrt(v.x ** 2 + v.y ** 2)).toBeGreaterThan(0);
  });

  it("high sun (70°) — short shadow", () => {
    const sun: SunPosition = { altitudeRad: (70 * Math.PI) / 180, azimuthRad: 0 };
    const v = shadowVector(2000, sun)!;
    // tan(70°) ≈ 2.747 → length ≈ 728mm
    const len = Math.sqrt(v.x ** 2 + v.y ** 2);
    expect(len).toBeLessThan(1000);
    expect(len).toBeGreaterThan(500);
  });
});

// ---------------------------------------------------------------------------
// shadowVector — northRotationDeg (ADR-006 naming)
// ---------------------------------------------------------------------------
describe("shadowVector — northRotationDeg (ADR-006)", () => {
  it("function accepts northRotationDeg parameter (renamed from northOffsetDeg)", () => {
    const sun: SunPosition = { altitudeRad: Math.PI / 4, azimuthRad: 0 };
    const v = shadowVector(1000, sun, 45);
    expect(v).not.toBeNull();
  });

  it("MIN_ALTITUDE_DEG and MAX_SHADOW_LENGTH_MM are exported constants", () => {
    expect(MIN_ALTITUDE_DEG).toBe(4);
    expect(MAX_SHADOW_LENGTH_MM).toBe(100_000);
  });
});

// ---------------------------------------------------------------------------
// projectShadow
// ---------------------------------------------------------------------------
describe("projectShadow", () => {
  it("returns null when no shadow (wallHeight=0)", () => {
    const rect: Rect = {
      id: "r",
      cx: 0, cy: 0, width: 100, height: 100,
      rotationDeg: 0, wallHeight: 0,
    };
    const sun: SunPosition = { altitudeRad: Math.PI / 4, azimuthRad: 0 };
    expect(projectShadow(rect, sun)).toBeNull();
  });

  it("returns null when sun is below horizon", () => {
    const rect: Rect = {
      id: "r",
      cx: 0, cy: 0, width: 100, height: 100,
      rotationDeg: 0, wallHeight: 2000,
    };
    const sun: SunPosition = { altitudeRad: -0.1, azimuthRad: 0 };
    expect(projectShadow(rect, sun)).toBeNull();
  });

  it("returns a polygon ≥ 4 vertices containing the original rectangle corners", () => {
    const rect: Rect = {
      id: "r",
      cx: 0, cy: 0, width: 100, height: 100,
      rotationDeg: 0, wallHeight: 1000,
    };
    const sun: SunPosition = { altitudeRad: Math.PI / 4, azimuthRad: 0 };
    const poly = projectShadow(rect, sun);
    expect(poly).not.toBeNull();
    expect(poly!.length).toBeGreaterThanOrEqual(4);
    const minY = Math.min(...poly!.map((p) => p.y));
    expect(minY).toBeCloseTo(-1050, 6);
  });

  it("very low sun: shadow is clamped — polygon is finite", () => {
    const rect: Rect = {
      id: "r",
      cx: 0, cy: 0, width: 100, height: 100,
      rotationDeg: 0, wallHeight: 50_000,
    };
    const sun: SunPosition = { altitudeRad: 0.001, azimuthRad: 0 };
    const poly = projectShadow(rect, sun);
    expect(poly).not.toBeNull();
    poly!.forEach((p) => {
      expect(isFinite(p.x)).toBe(true);
      expect(isFinite(p.y)).toBe(true);
    });
  });

  it("extreme wall height: shadow polygon is still finite and bounded by cap", () => {
    const rect: Rect = {
      id: "r",
      cx: 0, cy: 0, width: 100, height: 100,
      rotationDeg: 0, wallHeight: 999_999_999,
    };
    const sun: SunPosition = { altitudeRad: Math.PI / 6, azimuthRad: 0 };
    const poly = projectShadow(rect, sun);
    expect(poly).not.toBeNull();
    const maxExtent = Math.max(...poly!.map((p) => Math.abs(p.y)));
    expect(maxExtent).toBeLessThanOrEqual(MAX_SHADOW_LENGTH_MM + 1000); // rect half-size buffer
  });

  it("no-shadow condition: altitude exactly 0", () => {
    const rect: Rect = {
      id: "r",
      cx: 0, cy: 0, width: 100, height: 100,
      rotationDeg: 0, wallHeight: 1000,
    };
    const sun: SunPosition = { altitudeRad: 0, azimuthRad: 0 };
    expect(projectShadow(rect, sun)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// convexHull
// ---------------------------------------------------------------------------
describe("convexHull", () => {
  it("returns the hull of a square's points", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
      { x: 5, y: 5 }, // interior — should be discarded
    ];
    const hull = convexHull(points);
    expect(hull.length).toBe(4);
    expect(hull).not.toContainEqual({ x: 5, y: 5 });
  });

  it("handles collinear points on edge", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    const hull = convexHull(points);
    expect(hull.length).toBe(4);
  });

  it("< 3 points: returns all points unchanged", () => {
    expect(convexHull([{ x: 0, y: 0 }, { x: 1, y: 1 }]).length).toBe(2);
    expect(convexHull([{ x: 0, y: 0 }]).length).toBe(1);
  });
});
