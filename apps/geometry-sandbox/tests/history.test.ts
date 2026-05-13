import { describe, it, expect } from "vitest";
import {
  withHistory,
  HISTORY_MAX,
  type HistoryState,
  type HistoryAction,
} from "../src/history.js";

interface S {
  count: number;
  rects: Array<{ id: string; cx: number; cy: number }>;
}

type A =
  | { type: "inc" } // auto-commit
  | { type: "addRect"; rect: S["rects"][number] } // auto-commit
  | { type: "move"; dx: number } // NOT auto-commit (drag-aktig)
  | { type: "noop" };

function baseReducer(state: S, action: A): S {
  switch (action.type) {
    case "inc":
      return { ...state, count: state.count + 1 };
    case "addRect":
      return { ...state, rects: [...state.rects, action.rect] };
    case "move":
      return {
        ...state,
        rects: state.rects.map((r) => ({ ...r, cx: Math.round(r.cx + action.dx) })),
      };
    case "noop":
      return state;
  }
}

const auto: ReadonlySet<A["type"]> = new Set(["inc", "addRect"]);
const reducer = withHistory<S, A>(baseReducer, auto);

function makeInitial(): HistoryState<S> {
  return { past: [], present: { count: 0, rects: [] }, future: [] };
}

function dispatch(
  state: HistoryState<S>,
  ...actions: Array<A | HistoryAction>
): HistoryState<S> {
  return actions.reduce((s, a) => reducer(s, a), state);
}

describe("withHistory", () => {
  it("auto-commits on listed action types", () => {
    const s = dispatch(makeInitial(), { type: "inc" });
    expect(s.past.length).toBe(1);
    expect(s.past[0]!.count).toBe(0); // pre-action state
    expect(s.present.count).toBe(1);
  });

  it("does not auto-commit on non-listed actions", () => {
    const start: HistoryState<S> = {
      past: [],
      present: { count: 0, rects: [{ id: "r1", cx: 100, cy: 0 }] },
      future: [],
    };
    const s = dispatch(start, { type: "move", dx: 50 });
    expect(s.past.length).toBe(0);
    expect(s.present.rects[0]!.cx).toBe(150);
  });

  it("drag burst: commitHistory + 5x move ⇒ 1 past entry", () => {
    const start: HistoryState<S> = {
      past: [],
      present: { count: 0, rects: [{ id: "r1", cx: 100, cy: 0 }] },
      future: [],
    };
    const s = dispatch(
      start,
      { type: "commitHistory" },
      { type: "move", dx: 10 },
      { type: "move", dx: 10 },
      { type: "move", dx: 10 },
      { type: "move", dx: 10 },
      { type: "move", dx: 10 },
    );
    expect(s.past.length).toBe(1);
    expect(s.past[0]!.rects[0]!.cx).toBe(100); // pre-drag
    expect(s.present.rects[0]!.cx).toBe(150); // post-drag
  });

  it("undo restores previous state", () => {
    const s = dispatch(makeInitial(), { type: "inc" }, { type: "inc" }, { type: "undo" });
    expect(s.present.count).toBe(1);
    expect(s.past.length).toBe(1);
    expect(s.future.length).toBe(1);
    expect(s.future[0]!.count).toBe(2);
  });

  it("redo after undo restores forward state", () => {
    const s = dispatch(
      makeInitial(),
      { type: "inc" },
      { type: "inc" },
      { type: "undo" },
      { type: "redo" },
    );
    expect(s.present.count).toBe(2);
    expect(s.future.length).toBe(0);
  });

  it("new action after undo clears future", () => {
    const s = dispatch(
      makeInitial(),
      { type: "inc" },
      { type: "inc" },
      { type: "undo" },
      { type: "inc" },
    );
    expect(s.future.length).toBe(0);
    expect(s.present.count).toBe(2);
  });

  it("undo on empty past is a no-op", () => {
    const s = dispatch(makeInitial(), { type: "undo" });
    expect(s.past.length).toBe(0);
    expect(s.present.count).toBe(0);
    expect(s.future.length).toBe(0);
  });

  it("redo on empty future is a no-op", () => {
    const s = dispatch(makeInitial(), { type: "redo" });
    expect(s.future.length).toBe(0);
  });

  it("respects HISTORY_MAX cap", () => {
    let s = makeInitial();
    for (let i = 0; i < HISTORY_MAX + 5; i++) {
      s = reducer(s, { type: "inc" });
    }
    expect(s.past.length).toBe(HISTORY_MAX);
    // Oldest snapshots dropped — earliest remaining past entry has count > 0
    expect(s.past[0]!.count).toBeGreaterThan(0);
    expect(s.present.count).toBe(HISTORY_MAX + 5);
  });

  it("snapshots contain only integer coordinates after canonicalization", () => {
    const start: HistoryState<S> = {
      past: [],
      present: { count: 0, rects: [{ id: "r1", cx: 100, cy: 0 }] },
      future: [],
    };
    // Drag with float deltas; reducer rounds before storing.
    const s = dispatch(
      start,
      { type: "commitHistory" },
      { type: "move", dx: 0.7 },
      { type: "move", dx: 0.3 },
    );
    expect(Number.isInteger(s.present.rects[0]!.cx)).toBe(true);
    expect(Number.isInteger(s.past[0]!.rects[0]!.cx)).toBe(true);
  });

  it("does not duplicate snapshot when reducer returns same state", () => {
    const s = dispatch(makeInitial(), { type: "noop" });
    expect(s.past.length).toBe(0);
  });
});
