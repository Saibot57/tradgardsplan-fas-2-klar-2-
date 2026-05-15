import { describe, it, expect } from "vitest";
import { clampPercent } from "../../src/plant-catalog/primitives/RangeBar.js";

describe("clampPercent", () => {
  it("returns 0 at scaleMin", () => {
    expect(clampPercent(0, 0, 100)).toBe(0);
  });

  it("returns 100 at scaleMax", () => {
    expect(clampPercent(100, 0, 100)).toBe(100);
  });

  it("returns 50 in the middle", () => {
    expect(clampPercent(50, 0, 100)).toBe(50);
  });

  it("clamps values below scaleMin to 0", () => {
    expect(clampPercent(-50, 0, 100)).toBe(0);
  });

  it("clamps values above scaleMax to 100", () => {
    expect(clampPercent(150, 0, 100)).toBe(100);
  });

  it("handles negative scaleMin (temperature)", () => {
    // -10 to 45 scale, value 12.5 (midpoint)
    expect(clampPercent(17.5, -10, 45)).toBeCloseTo(50, 5);
  });

  it("handles offset scales (lux 0-60000)", () => {
    // 3 000 of 60 000 = 5%
    expect(clampPercent(3000, 0, 60000)).toBeCloseTo(5, 5);
    // 55 000 of 60 000 ≈ 91.67%
    expect(clampPercent(55000, 0, 60000)).toBeCloseTo((55000 / 60000) * 100, 5);
  });

  it("returns 0 on degenerate scale (scaleMin === scaleMax)", () => {
    expect(clampPercent(50, 100, 100)).toBe(0);
  });

  it("returns 0 on non-finite inputs", () => {
    expect(clampPercent(NaN, 0, 100)).toBe(0);
    expect(clampPercent(50, NaN, 100)).toBe(0);
    expect(clampPercent(50, 0, Infinity)).toBe(0);
  });
});
