import { describe, it, expect } from "vitest";
import {
  AUTO_COMMIT_ACTIONS,
  makeInitialState,
  nextId,
  reducer,
  type Action,
  type SandboxState,
} from "../src/state.js";
import { withHistory, type HistoryAction, type HistoryState } from "../src/history.js";
import type { Rect } from "@kolonitradgard/spatial-core";

const wrapped = withHistory<SandboxState, Action>(reducer, AUTO_COMMIT_ACTIONS);

function initialHistory(): HistoryState<SandboxState> {
  const base = makeInitialState(new Date(2026, 4, 15, 12, 0, 0));
  const bed: Rect = {
    id: nextId(),
    cx: 0,
    cy: 0,
    width: 2000,
    height: 1000,
    rotationDeg: 0,
    wallHeight: 0,
  };
  return { past: [], present: { ...base, rectangles: [bed] }, future: [] };
}

function dispatch(
  state: HistoryState<SandboxState>,
  ...actions: Array<Action | HistoryAction>
): HistoryState<SandboxState> {
  return actions.reduce((s, a) => wrapped(s, a), state);
}

describe("plant actions in undo stack — auto-commit set", () => {
  it("togglePlannedPlant auto-commits", () => {
    const s = dispatch(initialHistory(), {
      type: "togglePlannedPlant",
      plantId: "tomat",
    });
    expect(s.past.length).toBe(1);
    expect(s.present.plannedPlantIds).toEqual(["tomat"]);
  });

  it("addPlantToBed auto-commits", () => {
    const start = initialHistory();
    const bedId = start.present.rectangles[0]!.id;
    const s = dispatch(start, {
      type: "addPlantToBed",
      bedId,
      plantId: "tomat",
      displayName: "Tomat",
    });
    expect(s.past.length).toBe(1);
  });

  it("removePlantFromBed auto-commits", () => {
    const start = initialHistory();
    const bedId = start.present.rectangles[0]!.id;
    const s1 = dispatch(start, {
      type: "addPlantToBed",
      bedId,
      plantId: "tomat",
      displayName: "Tomat",
    });
    const placementId = s1.present.rectangles[0]!.plants![0]!.placementId;
    const s2 = dispatch(s1, { type: "removePlantFromBed", bedId, placementId });
    // s1 had 1 past entry (addPlantToBed). s2 should have 2 (addPlantToBed + removePlantFromBed).
    expect(s2.past.length).toBe(2);
  });
});

describe("non-undoable plant/tab actions don't push snapshots", () => {
  it("switchTab does NOT push a snapshot", () => {
    const s = dispatch(initialHistory(), { type: "switchTab", tab: "vaxter" });
    expect(s.past.length).toBe(0);
    expect(s.present.activeTab).toBe("vaxter");
  });

  it("selectPlant does NOT push a snapshot", () => {
    const s = dispatch(initialHistory(), {
      type: "selectPlant",
      plantId: "tomat",
    });
    expect(s.past.length).toBe(0);
    expect(s.present.selectedPlantId).toBe("tomat");
  });

  it("showPlantOnCanvas does NOT push a snapshot", () => {
    const start = initialHistory();
    const bedId = start.present.rectangles[0]!.id;
    const placed = dispatch(start, {
      type: "addPlantToBed",
      bedId,
      plantId: "tomat",
      displayName: "Tomat",
    });
    // placed has 1 past entry. showPlantOnCanvas should not add another.
    const s = dispatch(placed, { type: "showPlantOnCanvas", plantId: "tomat" });
    expect(s.past.length).toBe(placed.past.length);
    expect(s.present.activeTab).toBe("planera");
    expect(s.present.selectedIds).toEqual([bedId]);
  });
});

describe("addPlantToBed snapshot is atomic with plannedPlantIds cleanup", () => {
  it("undo reverts BOTH the placement AND the plannedPlantIds entry in one step", () => {
    const start = initialHistory();
    const bedId = start.present.rectangles[0]!.id;
    // Mark plantId as planned first (this is a separate snapshot).
    const planned = dispatch(start, {
      type: "togglePlannedPlant",
      plantId: "tomat",
    });
    expect(planned.present.plannedPlantIds).toEqual(["tomat"]);
    expect(planned.past.length).toBe(1);

    // Now place it. addPlantToBed must produce ONE snapshot that contains
    // both effects: the placement appears AND plannedPlantIds becomes [].
    const placed = dispatch(planned, {
      type: "addPlantToBed",
      bedId,
      plantId: "tomat",
      displayName: "Tomat",
    });
    expect(placed.past.length).toBe(2);
    expect(placed.present.plannedPlantIds).toEqual([]);
    expect(placed.present.rectangles[0]?.plants?.[0]?.plantId).toBe("tomat");

    // Single undo: both effects revert atomically.
    const undone = dispatch(placed, { type: "undo" });
    expect(undone.present.plannedPlantIds).toEqual(["tomat"]);
    expect(undone.present.rectangles[0]?.plants ?? []).toEqual([]);

    // Redo replays the atomic snapshot.
    const redone = dispatch(undone, { type: "redo" });
    expect(redone.present.plannedPlantIds).toEqual([]);
    expect(redone.present.rectangles[0]?.plants?.[0]?.plantId).toBe("tomat");
  });
});

describe("undo/redo round-trip for plant mutations", () => {
  it("togglePlannedPlant — toggle, undo, redo", () => {
    const s1 = dispatch(initialHistory(), {
      type: "togglePlannedPlant",
      plantId: "chili",
    });
    expect(s1.present.plannedPlantIds).toEqual(["chili"]);
    const undone = dispatch(s1, { type: "undo" });
    expect(undone.present.plannedPlantIds).toEqual([]);
    const redone = dispatch(undone, { type: "redo" });
    expect(redone.present.plannedPlantIds).toEqual(["chili"]);
  });

  it("removePlantFromBed — restores placement with original count on undo", () => {
    const start = initialHistory();
    const bedId = start.present.rectangles[0]!.id;
    const s1 = dispatch(
      start,
      { type: "addPlantToBed", bedId, plantId: "tomat", displayName: "Tomat" },
      { type: "addPlantToBed", bedId, plantId: "tomat", displayName: "Tomat" },
      { type: "addPlantToBed", bedId, plantId: "tomat", displayName: "Tomat" },
    );
    expect(s1.present.rectangles[0]?.plants?.[0]?.count).toBe(3);
    const placementId = s1.present.rectangles[0]!.plants![0]!.placementId;
    const s2 = dispatch(s1, { type: "removePlantFromBed", bedId, placementId });
    expect(s2.present.rectangles[0]?.plants?.[0]?.count).toBe(2);
    const undone = dispatch(s2, { type: "undo" });
    expect(undone.present.rectangles[0]?.plants?.[0]?.count).toBe(3);
  });
});
