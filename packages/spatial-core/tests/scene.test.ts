import { describe, it, expect } from "vitest";
import {
  serializeScene,
  parseScene,
  migrateScene,
  SceneParseError,
} from "../src/scene.js";
import type { PlantPlacement, PlotConfig, Rect } from "../src/types.js";

const validPlot: PlotConfig = {
  northRotationDeg: 0,
  location: { latitudeDeg: 55.87, longitudeDeg: 12.83 },
};

const validRect: Rect = {
  id: "r1",
  cx: 1000,
  cy: 2000,
  width: 300,
  height: 400,
  rotationDeg: 15,
  wallHeight: 2000,
};

describe("scene — serialize/parse roundtrip", () => {
  it("serializeScene → parseScene round-trip preserves all fields", () => {
    const state = { plot: validPlot, rectangles: [validRect] };
    const serialized = serializeScene(state);
    const parsed = parseScene(serialized);

    expect(parsed.version).toBe(4);
    expect(parsed.rectangles[0]!.cx).toBe(1000);
    expect(parsed.rectangles[0]!.width).toBe(300);
  });

  it("serialized coordinates are always integers", () => {
    const state = {
      plot: { ...validPlot, northRotationDeg: 12.7 },
      rectangles: [validRect],
    };
    const serialized = serializeScene(state);
    expect(Number.isInteger(serialized.plot.northRotationDeg)).toBe(true);
    expect(Number.isInteger(serialized.rectangles[0]!.cx)).toBe(true);
  });
});

describe("scene — parseScene validation", () => {
  it("throws SceneParseError when version is missing", () => {
    expect(() => parseScene({ plot: validPlot, rectangles: [] })).toThrow(
      SceneParseError,
    );
  });

  it("throws SceneParseError on unknown version", () => {
    expect(() =>
      parseScene({ version: 999, plot: validPlot, rectangles: [] }),
    ).toThrow(SceneParseError);
  });

  it("throws SceneParseError when width <= 0", () => {
    const bad = { ...validRect, width: 0 };
    expect(() =>
      parseScene({ version: 1, plot: validPlot, rectangles: [bad] }),
    ).toThrow(SceneParseError);
  });

  it("throws SceneParseError on NaN in coordinates", () => {
    const bad = { ...validRect, cx: NaN };
    expect(() =>
      parseScene({ version: 1, plot: validPlot, rectangles: [bad] }),
    ).toThrow(SceneParseError);
  });
});

describe("scene — boundary round-trip", () => {
  const boundary: Rect = {
    id: "plot-boundary",
    cx: 6000,
    cy: 5000,
    width: 12000,
    height: 8000,
    rotationDeg: 0,
    wallHeight: 0,
  };

  it("serializeScene preserves boundary as integer mm", () => {
    const state = { plot: validPlot, boundary, rectangles: [validRect] };
    const serialized = serializeScene(state);
    expect(serialized.boundary).toBeTruthy();
    expect(Number.isInteger(serialized.boundary!.cx)).toBe(true);
    expect(serialized.boundary!.width).toBe(12000);
  });

  it("serializeScene → parseScene round-trip preserves boundary", () => {
    const state = { plot: validPlot, boundary, rectangles: [] };
    const parsed = parseScene(serializeScene(state));
    expect(parsed.boundary!.id).toBe("plot-boundary");
    expect(parsed.boundary!.width).toBe(12000);
  });

  it("null boundary is preserved", () => {
    const state = { plot: validPlot, boundary: null, rectangles: [] };
    const parsed = parseScene(serializeScene(state));
    expect(parsed.boundary).toBeNull();
  });

  it("throws SceneParseError when boundary has width <= 0", () => {
    const badBoundary = { ...boundary, width: 0 };
    expect(() =>
      parseScene({
        version: 1,
        plot: validPlot,
        boundary: badBoundary,
        rectangles: [],
      }),
    ).toThrow(SceneParseError);
  });
});

describe("scene — migrateScene", () => {
  it("migrateScene v1 → v4 bumps version and adds plannedPlantIds: []", () => {
    const v1 = { version: 1 as const, plot: validPlot, rectangles: [validRect] };
    const v4 = migrateScene(v1);
    expect(v4.version).toBe(4);
    expect(v4.rectangles[0]?.cx).toBe(validRect.cx);
    expect(v4.plannedPlantIds).toEqual([]);
  });

  it("migrateScene v2 → v4 bumps version", () => {
    const v2 = { version: 2 as const, plot: validPlot, rectangles: [validRect] };
    const v4 = migrateScene(v2);
    expect(v4.version).toBe(4);
    expect(v4.plannedPlantIds).toEqual([]);
  });

  it("migrateScene v3 → v4 adds plannedPlantIds without touching rectangles", () => {
    const v3 = { version: 3 as const, plot: validPlot, rectangles: [validRect] };
    const v4 = migrateScene(v3);
    expect(v4.version).toBe(4);
    expect(v4.plannedPlantIds).toEqual([]);
    // Same rectangle data — migration is transparent at the Rect level.
    expect(v4.rectangles[0]).toEqual(v3.rectangles[0]);
  });

  it("migrateScene is identity for v4", () => {
    const v4 = {
      version: 4 as const,
      plot: validPlot,
      rectangles: [],
      plannedPlantIds: ["tomat"],
    };
    expect(migrateScene(v4)).toBe(v4);
  });

  it("migrateScene v1 → v4 bevarar boundary", () => {
    const boundary: Rect = {
      id: "plot-boundary",
      cx: 6000, cy: 5000, width: 12000, height: 8000,
      rotationDeg: 0, wallHeight: 0,
    };
    const v1 = { version: 1 as const, plot: validPlot, boundary, rectangles: [] };
    const v4 = migrateScene(v1);
    expect(v4.boundary?.id).toBe("plot-boundary");
  });
});

describe("scene v4 — plannedPlantIds", () => {
  it("serializeScene emits version 4", () => {
    const s = serializeScene({ plot: validPlot, rectangles: [validRect] });
    expect(s.version).toBe(4);
  });

  it("serializeScene defaults plannedPlantIds to []", () => {
    const s = serializeScene({ plot: validPlot, rectangles: [validRect] });
    expect(s.plannedPlantIds).toEqual([]);
  });

  it("serializeScene preserves plannedPlantIds order", () => {
    const s = serializeScene({
      plot: validPlot,
      rectangles: [],
      plannedPlantIds: ["chili", "tomat", "morot"],
    });
    expect(s.plannedPlantIds).toEqual(["chili", "tomat", "morot"]);
  });

  it("round-trip preserves plannedPlantIds", () => {
    const parsed = parseScene(
      serializeScene({
        plot: validPlot,
        rectangles: [],
        plannedPlantIds: ["pisum-sativum", "capsicum-frutescens"],
      }),
    );
    expect(parsed.version).toBe(4);
    if (parsed.version !== 4) throw new Error("expected v4");
    expect(parsed.plannedPlantIds).toEqual(["pisum-sativum", "capsicum-frutescens"]);
  });

  it("rejects v4 with non-array plannedPlantIds", () => {
    expect(() =>
      parseScene({
        version: 4,
        plot: validPlot,
        rectangles: [],
        plannedPlantIds: "tomat",
      }),
    ).toThrow(SceneParseError);
  });

  it("rejects v4 with non-string entries in plannedPlantIds", () => {
    expect(() =>
      parseScene({
        version: 4,
        plot: validPlot,
        rectangles: [],
        plannedPlantIds: ["ok", 42],
      }),
    ).toThrow(SceneParseError);
  });

  it("rejects v4 with missing plannedPlantIds", () => {
    expect(() =>
      parseScene({
        version: 4,
        plot: validPlot,
        rectangles: [],
      }),
    ).toThrow(SceneParseError);
  });
});

describe("scene v4 — Rect.plants[]", () => {
  const placement: PlantPlacement = {
    placementId: "p1",
    plantId: "solanum-lycopersicum",
    displayName: "Tomat",
    offsetX: -400,
    offsetY: 0,
    count: 3,
  };

  it("round-trips a rect with plants[]", () => {
    const rectWithPlants: Rect = { ...validRect, plants: [placement] };
    const parsed = parseScene(
      serializeScene({ plot: validPlot, rectangles: [rectWithPlants] }),
    );
    expect(parsed.rectangles[0]?.plants?.length).toBe(1);
    expect(parsed.rectangles[0]?.plants?.[0]?.plantId).toBe("solanum-lycopersicum");
    expect(parsed.rectangles[0]?.plants?.[0]?.count).toBe(3);
  });

  it("canonicalizes placement offsets to integers", () => {
    const r: Rect = {
      ...validRect,
      plants: [{ ...placement, offsetX: 123.7, offsetY: -45.4 }],
    };
    const s = serializeScene({ plot: validPlot, rectangles: [r] });
    expect(s.rectangles[0]?.plants?.[0]?.offsetX).toBe(124);
    expect(s.rectangles[0]?.plants?.[0]?.offsetY).toBe(-45);
  });

  it("clamps placement count to >= 1", () => {
    const r: Rect = { ...validRect, plants: [{ ...placement, count: 0 }] };
    const s = serializeScene({ plot: validPlot, rectangles: [r] });
    expect(s.rectangles[0]?.plants?.[0]?.count).toBe(1);
  });

  it("omits empty plants array from serialized output", () => {
    const r: Rect = { ...validRect, plants: [] };
    const s = serializeScene({ plot: validPlot, rectangles: [r] });
    expect(s.rectangles[0]?.plants).toBeUndefined();
  });

  it("rejects placement with non-string plantId", () => {
    expect(() =>
      parseScene({
        version: 4,
        plot: validPlot,
        rectangles: [{ ...validRect, plants: [{ ...placement, plantId: 7 }] }],
        plannedPlantIds: [],
      }),
    ).toThrow(SceneParseError);
  });

  it("rejects placement with NaN offsets", () => {
    expect(() =>
      parseScene({
        version: 4,
        plot: validPlot,
        rectangles: [{ ...validRect, plants: [{ ...placement, offsetX: NaN }] }],
        plannedPlantIds: [],
      }),
    ).toThrow(SceneParseError);
  });

  it("rejects placement with count < 1", () => {
    expect(() =>
      parseScene({
        version: 4,
        plot: validPlot,
        rectangles: [{ ...validRect, plants: [{ ...placement, count: 0 }] }],
        plannedPlantIds: [],
      }),
    ).toThrow(SceneParseError);
  });

  it("accepts v3 file without plants[] (forward-compatible read)", () => {
    const v3 = { version: 3, plot: validPlot, rectangles: [validRect] };
    const parsed = parseScene(v3);
    expect(parsed.rectangles[0]?.plants).toBeUndefined();
  });
});

describe("scene v3 — kind-fält", () => {
  it("serializeScene bevarar kind när det är satt", () => {
    const r: Rect = { ...validRect, kind: "building" };
    const parsed = parseScene(serializeScene({ plot: validPlot, rectangles: [r] }));
    expect(parsed.rectangles[0]?.kind).toBe("building");
  });

  it("serializeScene utelämnar kind när värdet är 'bed' (default)", () => {
    const r: Rect = { ...validRect, kind: "bed" };
    const s = serializeScene({ plot: validPlot, rectangles: [r] });
    expect(s.rectangles[0]?.kind).toBeUndefined();
  });

  it("parseScene kastar på okänd kind", () => {
    expect(() =>
      parseScene({
        version: 3,
        plot: validPlot,
        rectangles: [{ ...validRect, kind: "spaceship" }],
      }),
    ).toThrow(SceneParseError);
  });

  it("parseScene accepterar v2-fil utan kind", () => {
    const v2 = { version: 2, plot: validPlot, rectangles: [validRect] };
    const parsed = parseScene(v2);
    expect(parsed.rectangles[0]?.kind).toBeUndefined();
  });
});

describe("scene — label/notes (v2/v3)", () => {
  it("serializeScene bevarar label och notes", () => {
    const labelled: Rect = { ...validRect, label: "Tomater 2026", notes: "v.18" };
    const parsed = parseScene(serializeScene({ plot: validPlot, rectangles: [labelled] }));
    expect(parsed.rectangles[0]?.label).toBe("Tomater 2026");
    expect(parsed.rectangles[0]?.notes).toBe("v.18");
  });

  it("serializeScene utelämnar tomma label/notes", () => {
    const empty: Rect = { ...validRect, label: "", notes: "" };
    const serialized = serializeScene({ plot: validPlot, rectangles: [empty] });
    expect(serialized.rectangles[0]?.label).toBeUndefined();
    expect(serialized.rectangles[0]?.notes).toBeUndefined();
  });

  it("parseScene kastar om label är fel typ", () => {
    expect(() =>
      parseScene({
        version: 2,
        plot: validPlot,
        rectangles: [{ ...validRect, label: 42 }],
      }),
    ).toThrow(SceneParseError);
  });

  it("parseScene accepterar v1-fil utan label/notes", () => {
    const v1 = { version: 1, plot: validPlot, rectangles: [validRect] };
    const parsed = parseScene(v1);
    expect(parsed.rectangles[0]?.label).toBeUndefined();
  });
});
