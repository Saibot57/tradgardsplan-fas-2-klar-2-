import { describe, it, expect } from "vitest";
import type { PlantCareProfile } from "../../src/plants/types.js";
import {
  applyPlantFilters,
  matchesCategory,
  matchesQuery,
  matchesSun,
  MIN_QUERY_LENGTH,
  sortByCommonName,
} from "../../src/plants/plantQueries.js";

function plant(overrides: Partial<PlantCareProfile> = {}): PlantCareProfile {
  return {
    id: "x",
    commonName: "Tomat",
    commonNameEn: "Tomato",
    scientificName: "Solanum lycopersicum",
    category: "vegetable",
    sunCategory: "Full sol",
    temperature: { minC: 0, maxC: 30 },
    light: { minLux: 1000, maxLux: 50000 },
    soilMoisture: { minPct: 30, maxPct: 70 },
    nutrientEC: { minMicroS: 300, maxMicroS: 1500 },
    humidity: { minPct: 40, maxPct: 80 },
    ...overrides,
  };
}

describe("matchesQuery", () => {
  it("treats sub-MIN_QUERY_LENGTH queries as no-op (matches all)", () => {
    expect(MIN_QUERY_LENGTH).toBe(2);
    expect(matchesQuery(plant(), "")).toBe(true);
    expect(matchesQuery(plant(), "t")).toBe(true);
    expect(matchesQuery(plant(), "  ")).toBe(true);
  });

  it("matches Swedish common name (case-insensitive, substring)", () => {
    expect(matchesQuery(plant({ commonName: "Tomat" }), "tom")).toBe(true);
    expect(matchesQuery(plant({ commonName: "Tomat" }), "MAT")).toBe(true);
  });

  it("matches English common name when present", () => {
    expect(matchesQuery(plant({ commonName: "Sallad", commonNameEn: "Lettuce" }), "lettuce")).toBe(true);
  });

  it("matches scientific name", () => {
    expect(matchesQuery(plant(), "lyco")).toBe(true);
    expect(matchesQuery(plant(), "solanum")).toBe(true);
  });

  it("returns false when no axis matches", () => {
    expect(matchesQuery(plant(), "gurka")).toBe(false);
  });

  it("does not break when commonNameEn is omitted", () => {
    const p = plant();
    delete p.commonNameEn;
    expect(matchesQuery(p, "tomato")).toBe(false);
    expect(matchesQuery(p, "tomat")).toBe(true);
  });
});

describe("matchesCategory", () => {
  it("'all' is a no-op", () => {
    expect(matchesCategory(plant({ category: "herb" }), "all")).toBe(true);
  });

  it("matches exact category only", () => {
    expect(matchesCategory(plant({ category: "herb" }), "herb")).toBe(true);
    expect(matchesCategory(plant({ category: "herb" }), "vegetable")).toBe(false);
  });
});

describe("matchesSun", () => {
  it("'all' is a no-op", () => {
    expect(matchesSun(plant({ sunCategory: "Skugga" }), "all")).toBe(true);
  });

  it("matches when token is in the parsed list", () => {
    expect(matchesSun(plant({ sunCategory: "Full sol" }), "full")).toBe(true);
    expect(matchesSun(plant({ sunCategory: "Halvskugga" }), "partial")).toBe(true);
  });

  it("matches compound sun categories on either side", () => {
    expect(matchesSun(plant({ sunCategory: "Full sol / Halvskugga" }), "full")).toBe(true);
    expect(matchesSun(plant({ sunCategory: "Full sol / Halvskugga" }), "partial")).toBe(true);
  });

  it("does not match plants whose sunCategory is missing", () => {
    const p = plant();
    delete p.sunCategory;
    expect(matchesSun(p, "full")).toBe(false);
  });
});

describe("applyPlantFilters", () => {
  const corpus: PlantCareProfile[] = [
    plant({ id: "tomat", commonName: "Tomat", category: "vegetable", sunCategory: "Full sol" }),
    plant({ id: "sallad", commonName: "Sallad", commonNameEn: "Lettuce", category: "vegetable", sunCategory: "Halvskugga" }),
    plant({ id: "basilika", commonName: "Basilika", scientificName: "Ocimum basilicum", category: "herb", sunCategory: "Full sol" }),
    plant({ id: "mynta", commonName: "Mynta", category: "herb", sunCategory: "Halvskugga" }),
  ];

  it("default filters return everything", () => {
    expect(applyPlantFilters(corpus, {}).map((p) => p.id)).toEqual(["tomat", "sallad", "basilika", "mynta"]);
  });

  it("category + sun combine (AND)", () => {
    expect(
      applyPlantFilters(corpus, { category: "herb", sun: "full" }).map((p) => p.id),
    ).toEqual(["basilika"]);
  });

  it("query + category combine (AND)", () => {
    expect(
      applyPlantFilters(corpus, { query: "let", category: "vegetable" }).map((p) => p.id),
    ).toEqual(["sallad"]);
  });

  it("query that hits nothing returns empty", () => {
    expect(applyPlantFilters(corpus, { query: "kapus" })).toEqual([]);
  });
});

describe("sortByCommonName", () => {
  it("sorts using Swedish locale (Å/Ä/Ö after Z)", () => {
    const input: PlantCareProfile[] = [
      plant({ id: "ä", commonName: "Ärtor" }),
      plant({ id: "g", commonName: "Gurka" }),
      plant({ id: "ö", commonName: "Ört" }),
      plant({ id: "a", commonName: "Anis" }),
    ];
    const sorted = sortByCommonName(input).map((p) => p.commonName);
    expect(sorted).toEqual(["Anis", "Gurka", "Ärtor", "Ört"]);
  });

  it("does not mutate the input array", () => {
    const input: PlantCareProfile[] = [
      plant({ id: "b", commonName: "Beta" }),
      plant({ id: "a", commonName: "Alfa" }),
    ];
    const snapshot = input.map((p) => p.id);
    sortByCommonName(input);
    expect(input.map((p) => p.id)).toEqual(snapshot);
  });
});
