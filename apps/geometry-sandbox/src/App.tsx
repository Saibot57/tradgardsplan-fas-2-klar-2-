import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Canvas } from "./Canvas.js";
import { Toolbar } from "./Toolbar.js";
import { SidePanel } from "./SidePanel.js";
import { makeInitialState, reducer, type Action, type SandboxState } from "./state.js";
import {
  aabbOverlap,
  bedSoilVolumeLitres,
  rectAABB,
  rectAreaM2,
  rectEdgeTouch,
  rectOverlap,
  sunPositionAt,
} from "@kolonitradgard/spatial-core";
import {
  canRedo,
  canUndo,
  withHistory,
  type HistoryAction,
  type HistoryState,
} from "./history.js";
import { localStorageAdapter } from "./persistence.js";
import { bootstrapFromAdapter, useAutoSave } from "./useAutoSave.js";

const AUTO_COMMIT_ACTIONS: ReadonlySet<Action["type"]> = new Set<Action["type"]>([
  "addRect",
  "removeSelected",
  "setWallHeight",
  "setNorthRotation",
  "setLocation",
  "setPlotBoundary",
  "loadScene",
  "newScene",
  "setRectMeta",
  "setRectKind",
  "duplicateSelected",
]);

const wrappedReducer = withHistory<SandboxState, Action>(reducer, AUTO_COMMIT_ACTIONS);

function makeInitialHistory(): HistoryState<SandboxState> {
  return {
    past: [],
    present: makeInitialState(),
    future: [],
  };
}

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

// Singleton-adapter — instans-stabil mellan renders.
const persistenceAdapter = localStorageAdapter();

export function App() {
  const [historyState, dispatch] = useReducer(wrappedReducer, undefined, makeInitialHistory);
  const state = historyState.present;
  const [bedDepth, setBedDepth] = useState(300); // mm
  const [theme, setTheme] = useState<"light" | "dark">(readInitialTheme);
  const [bootstrapped, setBootstrapped] = useState(false);
  const didBootstrap = useRef(false);

  // Bootstrap från persistens vid mount. Default-state visas tills load är klar.
  useEffect(() => {
    if (didBootstrap.current) return;
    didBootstrap.current = true;
    bootstrapFromAdapter(persistenceAdapter)
      .then((scene) => {
        if (scene) {
          dispatch({ type: "loadScene", scene });
        }
      })
      .finally(() => setBootstrapped(true));
  }, []);

  const { status: autoSaveStatus, resetBaseline } = useAutoSave(
    state,
    persistenceAdapter,
    bootstrapped,
  );

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

  // State-ref så keyboard-handlern inte rebinds vid varje render.
  const stateRef = useRef(state);
  stateRef.current = state;
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;
      const mod = e.metaKey || e.ctrlKey;
      const s = stateRef.current;

      // Undo / redo
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        dispatch({ type: e.shiftKey ? "redo" : "undo" } satisfies HistoryAction);
        return;
      }

      // Cmd/Ctrl+D — duplicate selected
      if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        if (s.selectedIds.length > 0) dispatch({ type: "duplicateSelected" });
        return;
      }

      // Cmd/Ctrl+A — select all
      if (mod && e.key.toLowerCase() === "a") {
        e.preventDefault();
        dispatch({ type: "selectMany", ids: s.rectangles.map((r) => r.id) });
        return;
      }

      if (mod) return;

      // Hjälp-modal: ?
      if (e.key === "?") {
        e.preventDefault();
        setShowShortcuts((v) => !v);
        return;
      }

      if (e.key === "Escape") {
        if (showShortcuts) setShowShortcuts(false);
        else if (s.selectedIds.length > 0) dispatch({ type: "select", id: null });
        return;
      }

      // Delete vald bädd
      if ((e.key === "Delete" || e.key === "Backspace") && s.selectedIds.length > 0) {
        e.preventDefault();
        dispatch({ type: "removeSelected" });
        return;
      }

      // Snap-toggle
      if (e.key.toLowerCase() === "g") {
        e.preventDefault();
        dispatch({ type: "setSnapToGrid", enabled: !s.snapToGrid });
        return;
      }

      // Zoom in/ut centrerat på canvas-mitten (eller cursor om vi hade den)
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        zoomBy(1.2);
        return;
      }
      if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        zoomBy(1 / 1.2);
        return;
      }

      // Fit-to-view
      if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        fitToView();
        return;
      }

      // Piltangenter — nudge vald bädd 1× eller 10× grid-step
      const arrows: Record<string, [number, number]> = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      };
      const dir = arrows[e.key];
      if (dir && s.selectedIds.length > 0) {
        e.preventDefault();
        const step = s.gridStepMm * (e.shiftKey ? 10 : 1);
        dispatch({ type: "commitHistory" });
        dispatch({ type: "moveSelected", dx: dir[0] * step, dy: dir[1] * step });
        return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showShortcuts]);

  const zoomBy = useCallback((factor: number) => {
    const s = stateRef.current;
    const newZoom = Math.max(0.005, Math.min(5, s.viewport.pixelsPerMm * factor));
    // Bevara world-mittpunkt: zoom kring viewport-centrum.
    const centerScreen = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const worldBefore = {
      x: (centerScreen.x - s.viewport.panX) / s.viewport.pixelsPerMm,
      y: (centerScreen.y - s.viewport.panY) / s.viewport.pixelsPerMm,
    };
    const newPanX = centerScreen.x - worldBefore.x * newZoom;
    const newPanY = centerScreen.y - worldBefore.y * newZoom;
    dispatch({
      type: "setViewport",
      viewport: { panX: newPanX, panY: newPanY, pixelsPerMm: newZoom },
    });
  }, []);

  const fitToView = useCallback(() => {
    const s = stateRef.current;
    if (s.rectangles.length === 0) return;
    const aabbs = s.rectangles.map(rectAABB);
    let minX = aabbs[0]!.minX, minY = aabbs[0]!.minY;
    let maxX = aabbs[0]!.maxX, maxY = aabbs[0]!.maxY;
    for (let i = 1; i < aabbs.length; i++) {
      const b = aabbs[i]!;
      if (b.minX < minX) minX = b.minX;
      if (b.minY < minY) minY = b.minY;
      if (b.maxX > maxX) maxX = b.maxX;
      if (b.maxY > maxY) maxY = b.maxY;
    }
    const w = maxX - minX;
    const h = maxY - minY;
    if (w <= 0 || h <= 0) return;
    // Approximera viewport-storlek (toolbar tar ~50px, sidopanel ~varies).
    // Använd window minus en liten marginal — exakt fit görs vid nästa render.
    const vpW = window.innerWidth * 0.7;
    const vpH = window.innerHeight - 80;
    const padding = 0.9;
    const scale = Math.min(vpW / w, vpH / h) * padding;
    const newZoom = Math.max(0.005, Math.min(5, scale));
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    dispatch({
      type: "setViewport",
      viewport: {
        pixelsPerMm: newZoom,
        panX: vpW / 2 - cx * newZoom,
        panY: vpH / 2 - cy * newZoom,
      },
    });
  }, []);

  // Derived: pairwise overlap + edge-touch.
  // AABB-pre-filter (broadphase) skippar par vars axis-aligned bounding-boxes
  // är åtskilda — de kan varken krocka eller snudda. SAT (rectOverlap /
  // rectEdgeTouch) körs bara på par som passerar broadphase.
  const { overlappingIds, touchingIds } = useMemo(() => {
    const overlap = new Set<string>();
    const touch = new Set<string>();
    const aabbs = state.rectangles.map(rectAABB);
    for (let i = 0; i < state.rectangles.length; i++) {
      for (let j = i + 1; j < state.rectangles.length; j++) {
        if (!aabbOverlap(aabbs[i]!, aabbs[j]!)) continue;
        const a = state.rectangles[i]!;
        const b = state.rectangles[j]!;
        if (rectOverlap(a, b)) {
          overlap.add(a.id);
          overlap.add(b.id);
        } else if (rectEdgeTouch(a, b)) {
          touch.add(a.id);
          touch.add(b.id);
        }
      }
    }
    return { overlappingIds: overlap, touchingIds: touch };
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
        touchCount={touchingIds.size / 2}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo(historyState)}
        canRedo={canRedo(historyState)}
        theme={theme}
        onToggleTheme={onToggleTheme}
        autoSaveStatus={autoSaveStatus}
        onResetAutoSaveBaseline={resetBaseline}
        adapter={persistenceAdapter}
      />
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <Canvas
          state={state}
          dispatch={dispatch}
          sun={sun}
          overlappingIds={overlappingIds}
          touchingIds={touchingIds}
          theme={theme}
        />
        <SidePanel
          state={state}
          bedDepth={bedDepth}
          dispatch={dispatch}
          overlappingIds={overlappingIds}
          touchingIds={touchingIds}
        />
      </div>
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
    </div>
  );
}

const SHORTCUT_GROUPS: Array<{ title: string; rows: Array<[string, string]> }> = [
  {
    title: "Historik",
    rows: [
      ["⌘Z / Ctrl+Z", "Ångra"],
      ["⌘⇧Z / Ctrl+⇧Z", "Gör om"],
    ],
  },
  {
    title: "Markering",
    rows: [
      ["⌘A / Ctrl+A", "Markera alla bäddar"],
      ["⌘D / Ctrl+D", "Duplicera markerade bäddar"],
      ["⇧ + klick", "Lägg till / ta bort i markering"],
      ["Esc", "Avmarkera / stäng modal"],
      ["Delete / Backspace", "Ta bort markerade bäddar"],
      ["Piltangenter", "Nudga markerade 1× grid-step"],
      ["⇧ + Piltangenter", "Nudga 10× grid-step"],
    ],
  },
  {
    title: "Vy",
    rows: [
      ["+ / =", "Zooma in"],
      ["- / _", "Zooma ut"],
      ["F", "Fit-to-view (alla bäddar)"],
      ["G", "Toggla snap-to-grid"],
    ],
  },
  {
    title: "Hjälp",
    rows: [["?", "Visa/dölj denna ruta"]],
  },
];

function ShortcutsModal({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(15,17,12,0.30)", zIndex: 50 }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Kortkommandon"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 51,
          background: "var(--bg-surface)",
          border: "1px solid var(--line-1)",
          borderRadius: "var(--radius-3)",
          boxShadow: "var(--shadow-3)",
          padding: "22px 26px",
          minWidth: 360,
          maxWidth: 480,
          fontFamily: "var(--font-sans)",
          color: "var(--ink-1)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 18,
            fontWeight: 500,
            marginBottom: 14,
          }}
        >
          Kortkommandon
        </div>
        {SHORTCUT_GROUPS.map((group) => (
          <div key={group.title} style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-2)",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                fontWeight: 500,
                marginBottom: 6,
              }}
            >
              {group.title}
            </div>
            {group.rows.map(([keys, label]) => (
              <div
                key={keys}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  padding: "3px 0",
                }}
              >
                <span style={{ color: "var(--ink-2)" }}>{label}</span>
                <code
                  style={{
                    fontFamily: "var(--font-mono)",
                    background: "var(--bg-paper)",
                    padding: "1px 6px",
                    borderRadius: 4,
                    fontSize: 12,
                  }}
                >
                  {keys}
                </code>
              </div>
            ))}
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <button data-pp-btn onClick={onClose}>
            Stäng
          </button>
        </div>
      </div>
    </>
  );
}
