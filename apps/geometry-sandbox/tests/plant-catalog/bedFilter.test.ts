import { describe, it, expect } from "vitest";
import type { Rect } from "@kolonitradgard/spatial-core";
import {
  bedsAvailableForPlanting,
  formatBedOption,
} from "../../src/plant-catalog/controls/bedFilter.js";

function rect(overrides: Partial<Rect> & { id: string }): Rect {
  return {
    cx: 0,
    cy: 0,
    width: 1000,
    height: 500,
    rotationDeg: 0,
    wallHeight: 0,
    ...overrides,
  };
}

describe("bedsAvailableForPlanting", () => {
  it("includes rects with kind absent (default = bed)", () => {
    const a = rect({ id: "a" });
    const b = rect({ id: "b" });
    expect(bedsAvailableForPlanting([a, b]).map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("includes rects with explicit kind=bed", () => {
    const a = rect({ id: "a", kind: "bed" });
    expect(bedsAvailableForPlanting([a]).map((r) => r.id)).toEqual(["a"]);
  });

  it("excludes building/hedge/surface", () => {
    const beds = [
      rect({ id: "bed1" }),
      rect({ id: "wall1", kind: "building" }),
      rect({ id: "hedge1", kind: "hedge" }),
      rect({ id: "surf1", kind: "surface" }),
      rect({ id: "bed2", kind: "bed" }),
    ];
    expect(bedsAvailableForPlanting(beds).map((r) => r.id)).toEqual(["bed1", "bed2"]);
  });

  it("preserves input order", () => {
    const beds = [rect({ id: "z" }), rect({ id: "a" }), rect({ id: "m" })];
    expect(bedsAvailableForPlanting(beds).map((r) => r.id)).toEqual(["z", "a", "m"]);
  });

  it("returns empty when there are no beds", () => {
    expect(bedsAvailableForPlanting([rect({ id: "h", kind: "hedge" })])).toEqual([]);
  });
});

describe("formatBedOption", () => {
  it("uses label when set, falls back to id otherwise", () => {
    expect(formatBedOption(rect({ id: "rect-3", label: "Tomater 2026" })).label).toBe(
      "Tomater 2026",
    );
    expect(formatBedOption(rect({ id: "rect-3" })).label).toBe("rect-3");
  });

  it("treats empty-string label as absent", () => {
    expect(formatBedOption(rect({ id: "rect-3", label: "" })).label).toBe("rect-3");
  });

  it("rounds dimensions to integer mm", () => {
    expect(formatBedOption(rect({ id: "a", width: 1999.7, height: 500.4 })).dims).toBe(
      "2000×500 mm",
    );
  });
});
