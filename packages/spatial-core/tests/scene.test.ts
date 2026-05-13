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

    expect(parsed.version).toBe(1);
    expect(parsed.rectangles[0].cx).toBe(1000);
    expect(parsed.rectangles[0].width).toBe(300);
  });

  it("serialized coordinates are always integers", () => {
    const state = {
      plot: { ...validPlot, northRotationDeg: 12.7 },
      rectangles: [validRect],
    };
    const serialized = serializeScene(state);
    expect(Number.isInteger(serialized.plot.northRotationDeg)).toBe(true);
    expect(Number.isInteger(serialized.rectangles[0].cx)).toBe(true);
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
  it("migrateScene is identity for v1", () => {
    const scene = { version: 1 as const, plot: validPlot, rectangles: [] };
    expect(migrateScene(scene)).toBe(scene);
  });
});
