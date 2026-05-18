import { describe, it, expect } from "vitest";
import {
  makeInitialState,
  nextId,
  reducer,
  type SandboxState,
} from "../src/state.js";
import type { Rect, SceneV6 } from "@kolonitradgard/spatial-core";

function bareState(): SandboxState {
  return makeInitialState(new Date(2026, 4, 15, 12, 0, 0));
}

/** Helper: build a state with a single empty bed for placement tests. */
function stateWithBed(): { state: SandboxState; bedId: string } {
  const bed: Rect = {
    id: nextId(),
    cx: 0,
    cy: 0,
    width: 2000,
    height: 1000,
    rotationDeg: 0,
    wallHeight: 0,
  };
  const base = bareState();
  return {
    state: { ...base, rectangles: [bed] },
    bedId: bed.id,
  };
}

describe("switchTab", () => {
  it("changes activeTab", () => {
    const s = bareState();
    expect(s.activeTab).toBe("planera");
    const next = reducer(s, { type: "switchTab", tab: "vaxter" });
    expect(next.activeTab).toBe("vaxter");
  });

  it("is a no-op when target tab is already active (returns same reference)", () => {
    const s = bareState();
    expect(reducer(s, { type: "switchTab", tab: "planera" })).toBe(s);
  });
});

describe("selectPlant", () => {
  it("sets selectedPlantId", () => {
    const s = bareState();
    expect(s.selectedPlantId).toBeNull();
    const next = reducer(s, { type: "selectPlant", plantId: "tomat" });
    expect(next.selectedPlantId).toBe("tomat");
  });

  it("clears with null", () => {
    const s1 = reducer(bareState(), { type: "selectPlant", plantId: "tomat" });
    const s2 = reducer(s1, { type: "selectPlant", plantId: null });
    expect(s2.selectedPlantId).toBeNull();
  });

  it("is a no-op when same plantId is selected (returns same reference)", () => {
    const s1 = reducer(bareState(), { type: "selectPlant", plantId: "tomat" });
    expect(reducer(s1, { type: "selectPlant", plantId: "tomat" })).toBe(s1);
  });
});

describe("togglePlannedPlant", () => {
  it("adds plantId when not present", () => {
    const s = bareState();
    const next = reducer(s, { type: "togglePlannedPlant", plantId: "chili" });
    expect(next.plannedPlantIds).toEqual(["chili"]);
  });

  it("removes plantId when already present", () => {
    const s = { ...bareState(), plannedPlantIds: ["chili", "tomat"] };
    const next = reducer(s, { type: "togglePlannedPlant", plantId: "chili" });
    expect(next.plannedPlantIds).toEqual(["tomat"]);
  });

  it("preserves order of remaining ids", () => {
    const s = { ...bareState(), plannedPlantIds: ["a", "b", "c", "d"] };
    const next = reducer(s, { type: "togglePlannedPlant", plantId: "c" });
    expect(next.plannedPlantIds).toEqual(["a", "b", "d"]);
  });
});

describe("addPlantToBed — new placement", () => {
  it("appends a new placement when bed has none", () => {
    const { state, bedId } = stateWithBed();
    const next = reducer(state, {
      type: "addPlantToBed",
      bedId,
      plantId: "tomat",
      displayName: "Tomat",
    });
    const bed = next.rectangles.find((r) => r.id === bedId)!;
    expect(bed.plants?.length).toBe(1);
    expect(bed.plants?.[0]?.plantId).toBe("tomat");
    expect(bed.plants?.[0]?.displayName).toBe("Tomat");
    expect(bed.plants?.[0]?.count).toBe(1);
    expect(bed.plants?.[0]?.offsetX).toBe(0);
    expect(bed.plants?.[0]?.offsetY).toBe(0);
  });

  it("rounds float offsets to integer mm", () => {
    const { state, bedId } = stateWithBed();
    const next = reducer(state, {
      type: "addPlantToBed",
      bedId,
      plantId: "tomat",
      displayName: "Tomat",
      offsetX: 123.7,
      offsetY: -45.4,
    });
    const placement = next.rectangles[0]?.plants?.[0];
    expect(placement?.offsetX).toBe(124);
    expect(placement?.offsetY).toBe(-45);
  });

  it("no-ops when bedId doesn't exist (returns same reference)", () => {
    const { state } = stateWithBed();
    const next = reducer(state, {
      type: "addPlantToBed",
      bedId: "rect-does-not-exist",
      plantId: "tomat",
      displayName: "Tomat",
    });
    expect(next).toBe(state);
  });
});

describe("addPlantToBed — duplicate plantId increments count", () => {
  it("increments count on the existing placement", () => {
    const { state, bedId } = stateWithBed();
    const s1 = reducer(state, {
      type: "addPlantToBed",
      bedId,
      plantId: "tomat",
      displayName: "Tomat",
    });
    const s2 = reducer(s1, {
      type: "addPlantToBed",
      bedId,
      plantId: "tomat",
      displayName: "Tomat",
    });
    const bed = s2.rectangles.find((r) => r.id === bedId)!;
    expect(bed.plants?.length).toBe(1);
    expect(bed.plants?.[0]?.count).toBe(2);
  });

  it("treats different plantIds as separate placements in the same bed", () => {
    const { state, bedId } = stateWithBed();
    const s1 = reducer(state, {
      type: "addPlantToBed",
      bedId,
      plantId: "tomat",
      displayName: "Tomat",
    });
    const s2 = reducer(s1, {
      type: "addPlantToBed",
      bedId,
      plantId: "sallad",
      displayName: "Sallad",
    });
    const bed = s2.rectangles.find((r) => r.id === bedId)!;
    expect(bed.plants?.length).toBe(2);
    expect(new Set(bed.plants!.map((p) => p.plantId))).toEqual(
      new Set(["tomat", "sallad"]),
    );
  });
});

describe("addPlantToBed — plannedPlantIds cleanup is atomic with placement", () => {
  it("removes plantId from plannedPlantIds in the same dispatch", () => {
    const { state: base, bedId } = stateWithBed();
    const state: SandboxState = { ...base, plannedPlantIds: ["chili", "tomat", "morot"] };
    const next = reducer(state, {
      type: "addPlantToBed",
      bedId,
      plantId: "tomat",
      displayName: "Tomat",
    });
    // Single reducer result: both effects must be visible.
    expect(next.plannedPlantIds).toEqual(["chili", "morot"]);
    expect(next.rectangles[0]?.plants?.[0]?.plantId).toBe("tomat");
  });

  it("preserves plannedPlantIds when the plantId was not planned", () => {
    const { state: base, bedId } = stateWithBed();
    const state: SandboxState = { ...base, plannedPlantIds: ["chili"] };
    const next = reducer(state, {
      type: "addPlantToBed",
      bedId,
      plantId: "tomat",
      displayName: "Tomat",
    });
    expect(next.plannedPlantIds).toBe(state.plannedPlantIds);
  });
});

describe("removePlantFromBed", () => {
  it("decrements count when count > 1", () => {
    const { state, bedId } = stateWithBed();
    const s1 = reducer(state, {
      type: "addPlantToBed",
      bedId,
      plantId: "tomat",
      displayName: "Tomat",
    });
    const s2 = reducer(s1, {
      type: "addPlantToBed",
      bedId,
      plantId: "tomat",
      displayName: "Tomat",
    });
    // count == 2 now
    const placementId = s2.rectangles[0]!.plants![0]!.placementId;
    const s3 = reducer(s2, { type: "removePlantFromBed", bedId, placementId });
    expect(s3.rectangles[0]?.plants?.[0]?.count).toBe(1);
  });

  it("removes the placement when count drops to 0", () => {
    const { state, bedId } = stateWithBed();
    const s1 = reducer(state, {
      type: "addPlantToBed",
      bedId,
      plantId: "tomat",
      displayName: "Tomat",
    });
    const placementId = s1.rectangles[0]!.plants![0]!.placementId;
    const s2 = reducer(s1, { type: "removePlantFromBed", bedId, placementId });
    expect(s2.rectangles[0]?.plants?.length).toBe(0);
  });

  it("no-ops when the placement doesn't exist", () => {
    const { state, bedId } = stateWithBed();
    const next = reducer(state, {
      type: "removePlantFromBed",
      bedId,
      placementId: "placement-does-not-exist",
    });
    expect(next).toBe(state);
  });

  it("no-ops when the bed doesn't exist", () => {
    const { state } = stateWithBed();
    const next = reducer(state, {
      type: "removePlantFromBed",
      bedId: "rect-does-not-exist",
      placementId: "placement-1",
    });
    expect(next).toBe(state);
  });
});

describe("showPlantOnCanvas", () => {
  it("switches to planera tab and selects the first matching bed", () => {
    const { state: base, bedId } = stateWithBed();
    const placedState = reducer(
      { ...base, activeTab: "vaxter" },
      { type: "addPlantToBed", bedId, plantId: "tomat", displayName: "Tomat" },
    );
    const next = reducer(placedState, {
      type: "showPlantOnCanvas",
      plantId: "tomat",
    });
    expect(next.activeTab).toBe("planera");
    expect(next.selectedIds).toEqual([bedId]);
  });

  it("switches tab even when no bed contains the plant; selection unchanged", () => {
    const { state: base } = stateWithBed();
    const state: SandboxState = { ...base, activeTab: "vaxter", selectedIds: [] };
    const next = reducer(state, {
      type: "showPlantOnCanvas",
      plantId: "tomat",
    });
    expect(next.activeTab).toBe("planera");
    expect(next.selectedIds).toEqual([]);
  });

  it("picks the first bed in rectangle order when multiple contain the plant", () => {
    const a: Rect = {
      id: nextId(),
      cx: 0,
      cy: 0,
      width: 1000,
      height: 1000,
      rotationDeg: 0,
      wallHeight: 0,
    };
    const b: Rect = {
      id: nextId(),
      cx: 2000,
      cy: 0,
      width: 1000,
      height: 1000,
      rotationDeg: 0,
      wallHeight: 0,
    };
    const start: SandboxState = { ...bareState(), rectangles: [a, b] };
    const s1 = reducer(start, {
      type: "addPlantToBed",
      bedId: a.id,
      plantId: "tomat",
      displayName: "Tomat",
    });
    const s2 = reducer(s1, {
      type: "addPlantToBed",
      bedId: b.id,
      plantId: "tomat",
      displayName: "Tomat",
    });
    const next = reducer(s2, { type: "showPlantOnCanvas", plantId: "tomat" });
    expect(next.selectedIds).toEqual([a.id]);
  });
});

describe("loadScene reads plannedPlantIds (v6)", () => {
  it("replaces plannedPlantIds with scene value", () => {
    const scene: SceneV6 = {
      version: 6,
      plot: { northRotationDeg: 0, location: { latitudeDeg: 0, longitudeDeg: 0 } },
      boundary: null,
      rectangles: [],
      plannedPlantIds: ["chili"],
    };
    const start: SandboxState = { ...bareState(), plannedPlantIds: ["tomat", "morot"] };
    const next = reducer(start, { type: "loadScene", scene });
    expect(next.plannedPlantIds).toEqual(["chili"]);
  });

  it("loads rectangles with plants[] preserved", () => {
    const scene: SceneV6 = {
      version: 6,
      plot: { northRotationDeg: 0, location: { latitudeDeg: 0, longitudeDeg: 0 } },
      boundary: null,
      rectangles: [
        {
          id: "r1",
          cx: 0,
          cy: 0,
          width: 1000,
          height: 1000,
          rotationDeg: 0,
          wallHeight: 0,
          plants: [
            {
              placementId: "p1",
              plantId: "tomat",
              displayName: "Tomat",
              offsetX: 0,
              offsetY: 0,
              count: 3,
            },
          ],
        },
      ],
      plannedPlantIds: [],
    };
    const next = reducer(bareState(), { type: "loadScene", scene });
    expect(next.rectangles[0]?.plants?.[0]?.count).toBe(3);
  });
});

describe("newScene clears plannedPlantIds", () => {
  it("zeros plannedPlantIds and rectangles", () => {
    const { state: base, bedId } = stateWithBed();
    const placed = reducer(base, {
      type: "addPlantToBed",
      bedId,
      plantId: "tomat",
      displayName: "Tomat",
    });
    const withPlanned: SandboxState = { ...placed, plannedPlantIds: ["chili"] };
    const next = reducer(withPlanned, { type: "newScene" });
    expect(next.rectangles).toEqual([]);
    expect(next.plannedPlantIds).toEqual([]);
  });
});
