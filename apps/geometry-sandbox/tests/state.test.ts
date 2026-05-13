import { describe, it, expect } from "vitest";
import { makeInitialState, SUN_HOUR_MIN, SUN_HOUR_MAX } from "../src/state.js";

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
