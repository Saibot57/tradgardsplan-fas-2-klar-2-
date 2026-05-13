import { describe, it, expect } from "vitest";
import {
  DEFAULT_OBJECT_KIND,
  KIND_RULES,
  OBJECT_KINDS,
  getKind,
  isObjectKind,
  bedSoilVolumeLitres,
} from "../src/index.js";
import type { Rect } from "../src/types.js";

const baseRect: Rect = {
  id: "r1",
  cx: 0, cy: 0,
  width: 1000, height: 1000,
  rotationDeg: 0,
  wallHeight: 0,
};

describe("kind — defaults och enum", () => {
  it("DEFAULT_OBJECT_KIND är 'bed'", () => {
    expect(DEFAULT_OBJECT_KIND).toBe("bed");
  });

  it("OBJECT_KINDS innehåller exakt fyra värden", () => {
    expect([...OBJECT_KINDS].sort()).toEqual(["bed", "building", "hedge", "surface"].sort());
  });

  it("getKind defaultar till 'bed' när kind saknas", () => {
    expect(getKind(baseRect)).toBe("bed");
  });

  it("getKind returnerar explicit kind när angiven", () => {
    expect(getKind({ ...baseRect, kind: "building" })).toBe("building");
  });

  it("isObjectKind känner igen giltiga värden", () => {
    expect(isObjectKind("bed")).toBe(true);
    expect(isObjectKind("building")).toBe(true);
    expect(isObjectKind("wall")).toBe(false);
    expect(isObjectKind(null)).toBe(false);
    expect(isObjectKind(42)).toBe(false);
  });
});

describe("KIND_RULES — semantik per typ", () => {
  it("bara bed har hasSoil", () => {
    expect(KIND_RULES.bed.hasSoil).toBe(true);
    expect(KIND_RULES.building.hasSoil).toBe(false);
    expect(KIND_RULES.hedge.hasSoil).toBe(false);
    expect(KIND_RULES.surface.hasSoil).toBe(false);
  });

  it("building och hedge markeras castsShadow", () => {
    expect(KIND_RULES.building.castsShadow).toBe(true);
    expect(KIND_RULES.hedge.castsShadow).toBe(true);
    expect(KIND_RULES.bed.castsShadow).toBe(false);
    expect(KIND_RULES.surface.castsShadow).toBe(false);
  });
});

describe("bedSoilVolumeLitres — guard mot icke-bädd-typer", () => {
  it("returnerar volym för bed (default)", () => {
    expect(bedSoilVolumeLitres(baseRect, 300)).toBe(300);
  });

  it("returnerar volym för explicit kind='bed'", () => {
    expect(bedSoilVolumeLitres({ ...baseRect, kind: "bed" }, 300)).toBe(300);
  });

  it("returnerar 0 för building", () => {
    expect(bedSoilVolumeLitres({ ...baseRect, kind: "building" }, 300)).toBe(0);
  });

  it("returnerar 0 för hedge", () => {
    expect(bedSoilVolumeLitres({ ...baseRect, kind: "hedge" }, 300)).toBe(0);
  });

  it("returnerar 0 för surface", () => {
    expect(bedSoilVolumeLitres({ ...baseRect, kind: "surface" }, 300)).toBe(0);
  });
});
