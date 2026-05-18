import { describe, it, expect } from "vitest";
import {
  computeBoundaryMeasurements,
  computeNeighborMeasurements,
  NEIGHBOR_DISTANCE_THRESHOLD_MM,
} from "../src/measurementOverlay.js";
import type { Rect } from "@kolonitradgard/spatial-core";

const rect = (
  id: string,
  cx: number,
  cy: number,
  w: number,
  h: number,
  rot = 0,
): Rect => ({ id, cx, cy, width: w, height: h, rotationDeg: rot, wallHeight: 0 });

describe("computeNeighborMeasurements", () => {
  it("excludes the primary rect itself", () => {
    const primary = rect("a", 0, 0, 100, 100);
    const measurements = computeNeighborMeasurements(primary, [primary], 2000);
    expect(measurements).toHaveLength(0);
  });

  it("includes neighbors within threshold", () => {
    const primary = rect("a", 0, 0, 100, 100);
    const near = rect("b", 200, 0, 100, 100); // 100 mm gap
    const measurements = computeNeighborMeasurements(primary, [primary, near], 2000);
    expect(measurements).toHaveLength(1);
    expect(measurements[0]!.otherId).toBe("b");
    expect(measurements[0]!.distanceMm).toBeCloseTo(100, 4);
  });

  it("excludes neighbors outside threshold by default", () => {
    const primary = rect("a", 0, 0, 100, 100);
    const far = rect("b", 5000, 0, 100, 100); // ~4900 mm gap, > 2000
    const measurements = computeNeighborMeasurements(primary, [primary, far], 2000);
    expect(measurements).toHaveLength(0);
  });

  it("includes far neighbors when showAll=true", () => {
    const primary = rect("a", 0, 0, 100, 100);
    const far = rect("b", 5000, 0, 100, 100);
    const measurements = computeNeighborMeasurements(primary, [primary, far], 2000, true);
    expect(measurements).toHaveLength(1);
    expect(measurements[0]!.distanceMm).toBeGreaterThan(2000);
  });

  it("includes overlapping neighbors regardless (negative distance)", () => {
    const primary = rect("a", 0, 0, 100, 100);
    const overlap = rect("b", 50, 0, 100, 100); // 50 mm penetration
    const measurements = computeNeighborMeasurements(primary, [primary, overlap], 2000);
    expect(measurements).toHaveLength(1);
    expect(measurements[0]!.distanceMm).toBeLessThan(0);
  });

  it("default threshold is 2000 mm", () => {
    expect(NEIGHBOR_DISTANCE_THRESHOLD_MM).toBe(2000);
  });
});

describe("computeBoundaryMeasurements", () => {
  it("returns null when boundary is null", () => {
    const primary = rect("a", 0, 0, 100, 100);
    expect(computeBoundaryMeasurements(primary, null)).toBeNull();
  });

  it("returns four perpendicular distances for inner rect", () => {
    const primary = rect("a", 0, 0, 200, 100);
    const boundary = rect("plot", 0, 0, 1000, 800);
    const m = computeBoundaryMeasurements(primary, boundary);
    expect(m).not.toBeNull();
    expect(m!.n).toBeCloseTo(350, 6);
    expect(m!.e).toBeCloseTo(400, 6);
    expect(m!.s).toBeCloseTo(350, 6);
    expect(m!.w).toBeCloseTo(400, 6);
  });

  it("returns negative value on edges where primary sticks out", () => {
    const primary = rect("a", 600, 0, 100, 100);
    const boundary = rect("plot", 0, 0, 1000, 800);
    const m = computeBoundaryMeasurements(primary, boundary);
    expect(m!.e).toBeLessThan(0);
  });
});
