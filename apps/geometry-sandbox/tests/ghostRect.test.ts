import { describe, it, expect } from "vitest";
import { computeGhostRect } from "../src/ghostRect.js";

describe("computeGhostRect", () => {
  it("returns positive width/height regardless of drag direction", () => {
    const a = computeGhostRect({ x: 100, y: 100 }, { x: 500, y: 400 });
    const b = computeGhostRect({ x: 500, y: 400 }, { x: 100, y: 100 });
    expect(a.width).toBe(400);
    expect(a.height).toBe(300);
    expect(b.width).toBe(400);
    expect(b.height).toBe(300);
    expect(a.cx).toBe(b.cx);
    expect(a.cy).toBe(b.cy);
  });

  it("centers the rect between the two endpoints", () => {
    const g = computeGhostRect({ x: 0, y: 0 }, { x: 400, y: 200 });
    expect(g.cx).toBe(200);
    expect(g.cy).toBe(100);
  });

  it("yields zero dimensions when start === current", () => {
    const g = computeGhostRect({ x: 50, y: 50 }, { x: 50, y: 50 });
    expect(g.width).toBe(0);
    expect(g.height).toBe(0);
    expect(g.cx).toBe(50);
    expect(g.cy).toBe(50);
  });

  it("snaps endpoints to grid when snap.enabled", () => {
    const g = computeGhostRect(
      { x: 13, y: 27 },
      { x: 487, y: 312 },
      { enabled: true, stepMm: 100 },
    );
    // 13 → 0, 27 → 0, 487 → 500, 312 → 300
    expect(g.width).toBe(500);
    expect(g.height).toBe(300);
    expect(g.cx).toBe(250);
    expect(g.cy).toBe(150);
  });

  it("does not snap when snap.enabled is false", () => {
    const g = computeGhostRect(
      { x: 13, y: 27 },
      { x: 487, y: 312 },
      { enabled: false, stepMm: 100 },
    );
    expect(g.width).toBe(474);
    expect(g.height).toBe(285);
  });

  it("respects custom stepMm", () => {
    const g = computeGhostRect(
      { x: 0, y: 0 },
      { x: 175, y: 99 },
      { enabled: true, stepMm: 50 },
    );
    // 175 → 200, 99 → 100
    expect(g.width).toBe(200);
    expect(g.height).toBe(100);
  });
});
