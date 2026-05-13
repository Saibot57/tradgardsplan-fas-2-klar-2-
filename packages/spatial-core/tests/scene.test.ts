import { describe, it, expect } from "vitest";
import {
  serializeScene,
  parseScene,
  migrateScene,
  SceneParseError,
} from "../src/scene.js";
import type { PlotConfig, Rect } from "../src/types.js";

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

    expect(parsed.version).toBe(3);
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
  it("migrateScene v1 → v3 bumps version", () => {
    const v1 = { version: 1 as const, plot: validPlot, rectangles: [validRect] };
    const v3 = migrateScene(v1);
    expect(v3.version).toBe(3);
    expect(v3.rectangles[0]?.cx).toBe(validRect.cx);
  });

  it("migrateScene v2 → v3 bumps version", () => {
    const v2 = { version: 2 as const, plot: validPlot, rectangles: [validRect] };
    const v3 = migrateScene(v2);
    expect(v3.version).toBe(3);
  });

  it("migrateScene is identity for v3", () => {
    const v3 = { version: 3 as const, plot: validPlot, rectangles: [] };
    expect(migrateScene(v3)).toBe(v3);
  });

  it("migrateScene v1 → v3 bevarar boundary", () => {
    const boundary: Rect = {
      id: "plot-boundary",
      cx: 6000, cy: 5000, width: 12000, height: 8000,
      rotationDeg: 0, wallHeight: 0,
    };
    const v1 = { version: 1 as const, plot: validPlot, boundary, rectangles: [] };
    const v3 = migrateScene(v1);
    expect(v3.boundary?.id).toBe("plot-boundary");
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
