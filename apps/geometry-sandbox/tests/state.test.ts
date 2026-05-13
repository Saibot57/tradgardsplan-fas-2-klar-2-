import { describe, it, expect } from "vitest";
import { makeInitialState, nextId, reducer, SUN_HOUR_MIN, SUN_HOUR_MAX } from "../src/state.js";
import { getKind, type Rect } from "@kolonitradgard/spatial-core";

function hourOf(iso: string): number {
  const d = new Date(iso);
  return d.getHours() + d.getMinutes() / 60;
}

describe("makeInitialState — kontextuell tidsmedvetenhet", () => {
  it("clampar tidigt klockslag (03:00) till SUN_HOUR_MIN (06:00)", () => {
    const earlyMorning = new Date(2026, 4, 13, 3, 0, 0);
    const state = makeInitialState(earlyMorning);
    expect(hourOf(state.sun.dateIso)).toBeGreaterThanOrEqual(SUN_HOUR_MIN);
    expect(hourOf(state.sun.dateIso)).toBeLessThanOrEqual(SUN_HOUR_MAX);
  });

  it("clampar sent klockslag (23:30) till SUN_HOUR_MAX (20:00)", () => {
    const lateNight = new Date(2026, 4, 13, 23, 30, 0);
    const state = makeInitialState(lateNight);
    expect(hourOf(state.sun.dateIso)).toBeLessThanOrEqual(SUN_HOUR_MAX);
    expect(hourOf(state.sun.dateIso)).toBeGreaterThanOrEqual(SUN_HOUR_MIN);
  });

  it("bevarar klockslag inom 06–20-fönstret oförändrat", () => {
    const noon = new Date(2026, 4, 13, 14, 30, 0);
    const state = makeInitialState(noon);
    expect(hourOf(state.sun.dateIso)).toBeCloseTo(14.5, 5);
  });

  it("bevarar datumet även när klockslaget clampas", () => {
    const early = new Date(2026, 11, 1, 3, 0, 0); // 1 dec 2026
    const state = makeInitialState(early);
    const d = new Date(state.sun.dateIso);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(11);
    expect(d.getDate()).toBe(1);
  });

  it("default-anrop använder Date.now (ingen kastning)", () => {
    const state = makeInitialState();
    expect(state.sun.dateIso).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(state.rectangles.length).toBeGreaterThan(0);
  });
});

describe("reducer — kind på Rect (ADR-009)", () => {
  function buildingRect(id: string): Rect {
    return {
      id,
      cx: 1000, cy: 1000,
      width: 2000, height: 2000,
      rotationDeg: 0,
      wallHeight: 2400,
      kind: "building",
    };
  }

  it("addRect bevarar kind när angiven", () => {
    const start = makeInitialState();
    const next = reducer(start, { type: "addRect", rect: buildingRect(nextId()) });
    const added = next.rectangles[next.rectangles.length - 1]!;
    expect(getKind(added)).toBe("building");
  });

  it("setRectKind byter typ på vald rect", () => {
    const start = makeInitialState();
    const id = start.rectangles[0]!.id;
    const next = reducer(start, { type: "setRectKind", id, kind: "hedge" });
    const updated = next.rectangles.find((r) => r.id === id)!;
    expect(getKind(updated)).toBe("hedge");
  });

  it("setRectKind till 'bed' utelämnar kind-fältet (default-form)", () => {
    const start = makeInitialState();
    const id = start.rectangles[0]!.id;
    const withBuilding = reducer(start, { type: "setRectKind", id, kind: "building" });
    const backToBed = reducer(withBuilding, { type: "setRectKind", id, kind: "bed" });
    const updated = backToBed.rectangles.find((r) => r.id === id)!;
    expect(updated.kind).toBeUndefined();
    expect(getKind(updated)).toBe("bed");
  });
});
