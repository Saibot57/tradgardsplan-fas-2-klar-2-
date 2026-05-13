import { describe, it, expect } from "vitest";
import { rectContainedIn } from "../src/containment.js";
import type { Rect } from "../src/types.js";

const plot: Rect = {
  id: "plot",
  cx: 5000, cy: 5000,
  width: 10000, height: 8000,
  rotationDeg: 0,
  wallHeight: 0,
};

function rectAt(cx: number, cy: number, w: number, h: number, deg = 0): Rect {
  return { id: "r", cx, cy, width: w, height: h, rotationDeg: deg, wallHeight: 0 };
}

describe("rectContainedIn", () => {
  it("returnerar 'inside' för litet objekt i mitten", () => {
    expect(rectContainedIn(rectAt(5000, 5000, 1000, 1000), plot)).toBe("inside");
  });

  it("returnerar 'outside' för objekt helt utanför", () => {
    expect(rectContainedIn(rectAt(20000, 20000, 1000, 1000), plot)).toBe("outside");
  });

  it("returnerar 'partial' för objekt som korsar kant", () => {
    // Plot is x ∈ [0, 10000]. Lägg objektet centrerat på x=10000 (kanten).
    expect(rectContainedIn(rectAt(10000, 5000, 1000, 1000), plot)).toBe("partial");
  });

  it("returnerar 'inside' när objektet exakt fyller tomten", () => {
    expect(rectContainedIn(rectAt(5000, 5000, 10000, 8000), plot)).toBe("inside");
  });

  it("hanterar roterad inner-rect", () => {
    // Litet objekt mitt i, roterat — alla hörn ska fortfarande vara inne.
    expect(rectContainedIn(rectAt(5000, 5000, 500, 500, 45), plot)).toBe("inside");
  });

  it("hanterar roterad outer-rect (tomten)", () => {
    const rotatedPlot: Rect = { ...plot, rotationDeg: 30 };
    expect(rectContainedIn(rectAt(5000, 5000, 1000, 1000), rotatedPlot)).toBe("inside");
  });
});
