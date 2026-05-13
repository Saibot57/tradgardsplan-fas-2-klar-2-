import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { Canvas } from "./Canvas.js";
import { Toolbar } from "./Toolbar.js";
import { SidePanel } from "./SidePanel.js";
import { initialState, reducer, type Action } from "./state.js";
import {
  rectOverlap,
  bedSoilVolumeLitres,
  rectAreaM2,
  sunPositionAt,
} from "@kolonitradgard/spatial-core";
import {
  canRedo,
  canUndo,
  withHistory,
  type HistoryAction,
  type HistoryState,
} from "./history.js";

const AUTO_COMMIT_ACTIONS: ReadonlySet<Action["type"]> = new Set<Action["type"]>([
  "addRect",
  "removeSelected",
  "setWallHeight",
  "setNorthRotation",
  "setLocation",
  "setPlotBoundary",
  "loadScene",
]);

const wrappedReducer = withHistory<typeof initialState, Action>(reducer, AUTO_COMMIT_ACTIONS);

const initialHistory: HistoryState<typeof initialState> = {
  past: [],
  present: initialState,
  future: [],
};

function isEditableTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  if (t.isContentEditable) return true;
  const tag = t.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function readInitialTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

export function App() {
  const [historyState, dispatch] = useReducer(wrappedReducer, initialHistory);
  const state = historyState.present;
  const [bedDepth, setBedDepth] = useState(300); // mm
  const [theme, setTheme] = useState<"light" | "dark">(readInitialTheme);

  const onToggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      if (next === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
      try { localStorage.setItem("pp-theme", next); } catch { /* ignore quota */ }
      return next;
    });
  }, []);

  // Keyboard: ⌘Z / Ctrl+Z (undo), ⌘⇧Z / Ctrl+Shift+Z (redo)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key.toLowerCase() !== "z") return;
      e.preventDefault();
      dispatch({ type: e.shiftKey ? "redo" : "undo" } satisfies HistoryAction);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Derived: pairwise overlaps
  const overlappingIds = useMemo(() => {
    const ids = new Set<string>();
    for (let i = 0; i < state.rectangles.length; i++) {
      for (let j = i + 1; j < state.rectangles.length; j++) {
        const a = state.rectangles[i]!;
        const b = state.rectangles[j]!;
        if (rectOverlap(a, b)) {
          ids.add(a.id);
          ids.add(b.id);
        }
      }
    }
    return ids;
  }, [state.rectangles]);

  // FAS 1.5: use plot.location for sun position
  const sun = sunPositionAt(new Date(state.sun.dateIso), state.plot.location);

  const totalAreaM2 = state.rectangles.reduce((s, r) => s + rectAreaM2(r), 0);
  const totalSoilL = state.rectangles.reduce(
    (s, r) => s + bedSoilVolumeLitres(r, bedDepth),
    0,
  );

  const onUndo = useCallback(() => dispatch({ type: "undo" }), []);
  const onRedo = useCallback(() => dispatch({ type: "redo" }), []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg-paper)" }}>
      <Toolbar
        state={state}
        dispatch={dispatch}
        bedDepth={bedDepth}
        setBedDepth={setBedDepth}
        sun={sun}
        totalAreaM2={totalAreaM2}
        totalSoilL={totalSoilL}
        overlapCount={overlappingIds.size / 2}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo(historyState)}
        canRedo={canRedo(historyState)}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <Canvas
          state={state}
          dispatch={dispatch}
          sun={sun}
          overlappingIds={overlappingIds}
          theme={theme}
        />
        <SidePanel state={state} bedDepth={bedDepth} />
      </div>
    </div>
  );
}
