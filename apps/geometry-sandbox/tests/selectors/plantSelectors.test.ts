import { describe, it, expect } from "vitest";
import type { PlantPlacement, Rect } from "@kolonitradgard/spatial-core";
import {
  firstBedFor,
  inGardenIds,
  plantedSummary,
} from "../../src/selectors/plantSelectors.js";

function placement(plantId: string, count: number, id = `p-${plantId}-${count}`): PlantPlacement {
  return {
    placementId: id,
    plantId,
    displayName: plantId,
    offsetX: 0,
    offsetY: 0,
    count,
  };
}

function bed(id: string, plants?: PlantPlacement[]): Rect {
  const r: Rect = {
    id,
    cx: 0,
    cy: 0,
    width: 1000,
    height: 1000,
    rotationDeg: 0,
    wallHeight: 0,
  };
  if (plants !== undefined) r.plants = plants;
  return r;
}

describe("inGardenIds", () => {
  it("returns empty set when no bed has plants", () => {
    expect(inGardenIds([bed("a"), bed("b")]).size).toBe(0);
  });

  it("dedupes plantIds across beds", () => {
    const a = bed("a", [placement("tomat", 3), placement("sallad", 5)]);
    const b = bed("b", [placement("tomat", 2)]);
    const ids = inGardenIds([a, b]);
    expect(ids.size).toBe(2);
    expect(ids.has("tomat")).toBe(true);
    expect(ids.has("sallad")).toBe(true);
  });

  it("ignores beds without plants[]", () => {
    const a = bed("a");
    const b = bed("b", [placement("tomat", 1)]);
    const ids = inGardenIds([a, b]);
    expect(ids.size).toBe(1);
  });
});

describe("plantedSummary", () => {
  it("counts bedCount and sums total across beds", () => {
    const a = bed("a", [placement("tomat", 3)]);
    const b = bed("b", [placement("tomat", 2)]);
    const c = bed("c", [placement("sallad", 5)]);
    expect(plantedSummary([a, b, c], "tomat")).toEqual({ bedCount: 2, total: 5 });
  });

  it("returns zeros for an unplanted plant", () => {
    const a = bed("a", [placement("tomat", 3)]);
    expect(plantedSummary([a], "chili")).toEqual({ bedCount: 0, total: 0 });
  });

  it("aggregates multiple placements of the same plantId in one bed", () => {
    // Edge: shouldn't happen via the reducer (it merges), but the selector
    // must be robust to it for loaded scenes hand-written elsewhere.
    const a = bed("a", [
      placement("tomat", 3, "p-1"),
      placement("tomat", 2, "p-2"),
    ]);
    expect(plantedSummary([a], "tomat")).toEqual({ bedCount: 1, total: 5 });
  });
});

describe("firstBedFor", () => {
  it("returns the first bed in array order containing the plant", () => {
    const a = bed("a", [placement("sallad", 1)]);
    const b = bed("b", [placement("tomat", 1)]);
    const c = bed("c", [placement("tomat", 1)]);
    expect(firstBedFor([a, b, c], "tomat")?.id).toBe("b");
  });

  it("returns null when no bed contains the plant", () => {
    const a = bed("a", [placement("sallad", 1)]);
    expect(firstBedFor([a], "tomat")).toBeNull();
  });

  it("returns null when there are no beds", () => {
    expect(firstBedFor([], "tomat")).toBeNull();
  });
});
