import { describe, it, expect } from "vitest";
import {
  PlantValidationError,
  loadDefaultPlantCatalog,
  parsePlant,
  parsePlantCatalog,
} from "../../src/plants/PlantRepository.js";

function validRawPlant(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "test-plant",
    commonName: "Testväxt",
    scientificName: "Testus plantus",
    category: "vegetable",
    temperature: { minC: 0, maxC: 30 },
    light: { minLux: 1000, maxLux: 40000 },
    soilMoisture: { minPct: 30, maxPct: 70 },
    nutrientEC: { minMicroS: 300, maxMicroS: 1500 },
    humidity: { minPct: 40, maxPct: 80 },
    ...overrides,
  };
}

describe("parsePlant — required fields", () => {
  it("accepts a minimal valid plant", () => {
    const p = parsePlant(validRawPlant(), 0);
    expect(p.id).toBe("test-plant");
    expect(p.category).toBe("vegetable");
    expect(p.temperature).toEqual({ minC: 0, maxC: 30 });
  });

  it.each([
    ["id", { id: "" }],
    ["id", { id: 42 }],
    ["commonName", { commonName: "" }],
    ["scientificName", { scientificName: undefined }],
  ])("rejects missing/invalid %s", (_field, overrides) => {
    expect(() => parsePlant(validRawPlant(overrides), 0)).toThrow(PlantValidationError);
  });

  it("rejects unknown category", () => {
    expect(() => parsePlant(validRawPlant({ category: "fungus" }), 0)).toThrow(
      /invalid category/,
    );
  });

  it("rejects non-object input", () => {
    expect(() => parsePlant(null, 0)).toThrow(/expected object/);
    expect(() => parsePlant("nope", 0)).toThrow(/expected object/);
  });
});

describe("parsePlant — numeric ranges", () => {
  it("rejects missing min/max", () => {
    expect(() =>
      parsePlant(validRawPlant({ temperature: { minC: 5 } }), 0),
    ).toThrow(/missing\/invalid maxC/);
  });

  it("rejects NaN/Infinity in ranges", () => {
    expect(() =>
      parsePlant(validRawPlant({ light: { minLux: NaN, maxLux: 1000 } }), 0),
    ).toThrow(/missing\/invalid minLux/);
    expect(() =>
      parsePlant(validRawPlant({ humidity: { minPct: 0, maxPct: Infinity } }), 0),
    ).toThrow(/missing\/invalid maxPct/);
  });

  it("rejects ranges where min > max", () => {
    expect(() =>
      parsePlant(validRawPlant({ soilMoisture: { minPct: 80, maxPct: 20 } }), 0),
    ).toThrow(/minPct > maxPct/);
  });

  it("includes path on errors", () => {
    let caught: PlantValidationError | null = null;
    try {
      parsePlant(validRawPlant({ nutrientEC: { minMicroS: 100 } }), 3);
    } catch (e) {
      caught = e as PlantValidationError;
    }
    expect(caught).not.toBeNull();
    expect(caught!.path).toBe("plants[3].nutrientEC");
  });
});

describe("parsePlant — optional fields", () => {
  it("preserves optional fields when provided", () => {
    const p = parsePlant(
      validRawPlant({
        commonNameEn: "Test plant",
        soilTypes: ["Sandy", "Loam"],
        spreadMm: 300,
        rowSpacingMm: 400,
        daysToMaturity: 65,
        sunCategory: "Full sol",
        waterFrequency: "Var 3:e dag",
        sowingMethod: "Direktså maj",
      }),
      0,
    );
    expect(p.commonNameEn).toBe("Test plant");
    expect(p.soilTypes).toEqual(["Sandy", "Loam"]);
    expect(p.spreadMm).toBe(300);
    expect(p.sunCategory).toBe("Full sol");
  });

  it("omits optional fields when absent (exactOptionalPropertyTypes)", () => {
    const p = parsePlant(validRawPlant(), 0);
    expect("commonNameEn" in p).toBe(false);
    expect("soilTypes" in p).toBe(false);
    expect("spreadMm" in p).toBe(false);
  });

  it("rejects invalid optional types", () => {
    expect(() => parsePlant(validRawPlant({ spreadMm: "300" }), 0)).toThrow(/expected number/);
    expect(() => parsePlant(validRawPlant({ soilTypes: ["ok", 5] }), 0)).toThrow(/non-string/);
  });
});

describe("parsePlantCatalog", () => {
  it("rejects non-array input", () => {
    expect(() => parsePlantCatalog({})).toThrow(/expected top-level array/);
  });

  it("rejects duplicate ids", () => {
    const a = validRawPlant({ id: "dup" });
    const b = validRawPlant({ id: "dup" });
    expect(() => parsePlantCatalog([a, b])).toThrow(/duplicate id "dup"/);
  });

  it("accepts an empty array", () => {
    expect(parsePlantCatalog([])).toEqual([]);
  });

  it("propagates index in error path", () => {
    const ok = validRawPlant({ id: "ok" });
    const bad = validRawPlant({ id: "bad", category: "fungus" });
    let caught: PlantValidationError | null = null;
    try {
      parsePlantCatalog([ok, bad]);
    } catch (e) {
      caught = e as PlantValidationError;
    }
    expect(caught?.path).toBe("plants[1].category");
  });
});

describe("loadDefaultPlantCatalog", () => {
  it("loads and validates the bundled crops.json", () => {
    const plants = loadDefaultPlantCatalog();
    expect(plants.length).toBeGreaterThanOrEqual(23);
    for (const p of plants) {
      expect(p.id).toBeTruthy();
      expect(["vegetable", "herb", "berry", "flower"]).toContain(p.category);
      expect(p.temperature.minC).toBeLessThanOrEqual(p.temperature.maxC);
      expect(p.light.minLux).toBeLessThanOrEqual(p.light.maxLux);
    }
  });

  it("caches the result (same array reference on repeat call)", () => {
    const a = loadDefaultPlantCatalog();
    const b = loadDefaultPlantCatalog();
    expect(a).toBe(b);
  });

  it("contains the expected seed plants", () => {
    const ids = new Set(loadDefaultPlantCatalog().map((p) => p.id));
    expect(ids.has("solanum-lycopersicum")).toBe(true);
    expect(ids.has("fragaria-ananassa")).toBe(true);
    expect(ids.has("calendula-officinalis")).toBe(true);
  });
});
