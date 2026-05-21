import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { AppHeader } from "./AppHeader.js";
import { Canvas } from "./Canvas.js";
import { Toolbar } from "./Toolbar.js";
import { ToolRail } from "./ToolRail.js";
import { TimeBar } from "./TimeBar.js";
import { StatusRow } from "./StatusRow.js";
import { SidePanel } from "./SidePanel.js";
import { AddRectPopover, KIND_DEFAULTS } from "./addObject.js";
import { SceneMenu } from "./SceneMenu.js";
import type { ObjectKind, Rect, SceneV7 } from "@kolonitradgard/spatial-core";
import { PlantCatalog } from "./plant-catalog/PlantCatalog.js";
import { loadDefaultPlantCatalog } from "./plants/PlantRepository.js";
import {
  AUTO_COMMIT_ACTIONS,
  makeInitialState,
  MIN_RECT_DIMENSION_MM,
  nextId,
  reducer,
  type Action,
  type ActiveTab,
  type SandboxState,
} from "./state.js";
import {
  aabbOverlap,
  bedSoilVolumeLitres,
  rectAABB,
  rectAreaM2,
  rectEdgeTouch,
  rectOverlap,
  serializeScene,
  sunPositionAt,
} from "@kolonitradgard/spatial-core";
import {
  canRedo,
  canUndo,
  withHistory,
  type HistoryAction,
  type HistoryState,
} from "./history.js";
import type { ScenePersistence } from "./persistence.js";
import { useAutoSave } from "./useAutoSave.js";
import { saveScene, loadSceneFromFile, exportCanvasAsPng } from "./io.js";
import {
  deleteSceneData,
  findMeta,
  loadScenesIndex,
  metaFromScene,
  nextSceneId,
  readSceneData,
  saveScenesIndex,
  uniqueSceneName,
  writeSceneData,
  type ScenesIndex,
} from "./scenes.js";

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

// Plant-katalogen laddas en gång vid modulen — den är statiskt bundlad och
// rena pure data. PlantRepository cachar internt, men ge bundle:n ett tidigt
// validate-pass så ev. JSON-fel kraschar nära mount istället för vid val.
const PLANT_CATALOG = loadDefaultPlantCatalog();

export function App() {
  const [historyState, dispatch] = useReducer(wrappedReducer, undefined, makeInitialHistory);
  const state = historyState.present;
  const [bedDepth, setBedDepth] = useState(300); // mm
  const [theme, setTheme] = useState<"light" | "dark">(readInitialTheme);
  const [bootstrapped, setBootstrapped] = useState(false);
  const didBootstrap = useRef(false);

  // Namngivna scener (lagret ovanför reducern). currentSceneIdRef läses av
  // autosave-adaptern; scenesIndexRef speglar menyns lista utan re-render.
  const [scenesIndex, setScenesIndex] = useState<ScenesIndex>({ scenes: [], currentId: null });
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
  const currentSceneIdRef = useRef<string | null>(null);
  const scenesIndexRef = useRef<ScenesIndex>(scenesIndex);
  scenesIndexRef.current = scenesIndex;

  // stateRef behövs av handlers (duplicera) — sätts längre ned, men deklareras
  // här så adaptern kan refereras innan render-ordningen.
  const stateRefForScenes = useRef(state);
  stateRefForScenes.current = state;

  // Autosave-adapter som riktar mot aktuell scen-id och uppdaterar dess meta.
  const adapter = useMemo<ScenePersistence>(
    () => ({
      label: "scenes",
      async save(scene: SceneV7) {
        const id = currentSceneIdRef.current;
        if (!id) return;
        writeSceneData(id, scene);
        const idx = scenesIndexRef.current;
        const updated: ScenesIndex = {
          ...idx,
          scenes: idx.scenes.map((m) =>
            m.id === id ? { ...m, lastSaved: Date.now(), ...metaFromScene(scene) } : m,
          ),
        };
        scenesIndexRef.current = updated;
        saveScenesIndex(updated);
      },
      async load() {
        const id = currentSceneIdRef.current;
        return id ? readSceneData(id) : null;
      },
      async clear() {
        const id = currentSceneIdRef.current;
        if (id) deleteSceneData(id);
      },
    }),
    [],
  );

  // Bootstrap: ladda scen-indexet (migrerar legacy) och aktiv scen vid mount.
  useEffect(() => {
    if (didBootstrap.current) return;
    didBootstrap.current = true;
    let idx = loadScenesIndex();
    if (idx.currentId == null && idx.scenes.length > 0) {
      idx = { ...idx, currentId: idx.scenes[0]!.id };
      saveScenesIndex(idx);
    }
    if (idx.scenes.length === 0) {
      // Helt ny användare — skapa en default-scen, behåll demo-state (present).
      const id = nextSceneId();
      idx = {
        scenes: [
          { id, name: "Min trädgård", lastSaved: Date.now(), plotWidthMm: null, plotHeightMm: null, bedCount: 0 },
        ],
        currentId: id,
      };
      saveScenesIndex(idx);
    } else if (idx.currentId) {
      const scene = readSceneData(idx.currentId);
      if (scene) dispatch({ type: "loadScene", scene });
    }
    currentSceneIdRef.current = idx.currentId;
    scenesIndexRef.current = idx;
    setScenesIndex(idx);
    setCurrentSceneId(idx.currentId);
    setBootstrapped(true);
  }, []);

  const { status: autoSaveStatus, resetBaseline } = useAutoSave(state, adapter, bootstrapped);

  const applyIndex = useCallback((idx: ScenesIndex) => {
    saveScenesIndex(idx);
    scenesIndexRef.current = idx;
    setScenesIndex(idx);
    currentSceneIdRef.current = idx.currentId;
    setCurrentSceneId(idx.currentId);
  }, []);

  const refreshScenes = useCallback(() => {
    const idx = loadScenesIndex();
    scenesIndexRef.current = idx;
    setScenesIndex(idx);
  }, []);

  const switchScene = useCallback(
    (id: string) => {
      if (id === currentSceneIdRef.current) return;
      const scene = readSceneData(id);
      applyIndex({ ...scenesIndexRef.current, currentId: id });
      dispatch({ type: "commitHistory" });
      if (scene) dispatch({ type: "loadScene", scene });
      else dispatch({ type: "newScene" });
      resetBaseline();
    },
    [applyIndex, resetBaseline],
  );

  const createScene = useCallback(() => {
    const idx0 = scenesIndexRef.current;
    const id = nextSceneId();
    const name = uniqueSceneName(idx0, "Ny trädgård");
    applyIndex({
      scenes: [
        ...idx0.scenes,
        { id, name, lastSaved: Date.now(), plotWidthMm: null, plotHeightMm: null, bedCount: 0 },
      ],
      currentId: id,
    });
    dispatch({ type: "commitHistory" });
    dispatch({ type: "newScene" });
    resetBaseline();
  }, [applyIndex, resetBaseline]);

  const renameScene = useCallback(
    (name: string) => {
      const id = currentSceneIdRef.current;
      if (!id) return;
      const idx0 = scenesIndexRef.current;
      applyIndex({
        ...idx0,
        scenes: idx0.scenes.map((m) => (m.id === id ? { ...m, name } : m)),
      });
    },
    [applyIndex],
  );

  const duplicateScene = useCallback(() => {
    const idx0 = scenesIndexRef.current;
    const srcId = currentSceneIdRef.current;
    const srcMeta = findMeta(idx0, srcId);
    const s = stateRefForScenes.current;
    const scene = serializeScene({
      plot: { northRotationDeg: s.plot.northRotationDeg, location: s.plot.location },
      boundary: s.plot.boundaryRect,
      rectangles: s.rectangles,
      plannedPlantIds: s.plannedPlantIds,
    });
    const id = nextSceneId();
    const name = uniqueSceneName(idx0, `${srcMeta?.name ?? "Scen"} (kopia)`);
    writeSceneData(id, scene);
    applyIndex({
      scenes: [
        ...idx0.scenes,
        { id, name, lastSaved: Date.now(), ...metaFromScene(scene) },
      ],
      currentId: id,
    });
    resetBaseline();
  }, [applyIndex, resetBaseline]);

  const deleteScene = useCallback(
    (id: string) => {
      deleteSceneData(id);
      const remaining = scenesIndexRef.current.scenes.filter((m) => m.id !== id);
      if (remaining.length === 0) {
        const newId = nextSceneId();
        applyIndex({
          scenes: [
            { id: newId, name: "Min trädgård", lastSaved: Date.now(), plotWidthMm: null, plotHeightMm: null, bedCount: 0 },
          ],
          currentId: newId,
        });
        dispatch({ type: "commitHistory" });
        dispatch({ type: "newScene" });
      } else {
        const nextId2 = remaining[0]!.id;
        applyIndex({ scenes: remaining, currentId: nextId2 });
        const scene = readSceneData(nextId2);
        dispatch({ type: "commitHistory" });
        if (scene) dispatch({ type: "loadScene", scene });
        else dispatch({ type: "newScene" });
      }
      resetBaseline();
    },
    [applyIndex, resetBaseline],
  );

  const currentSceneName = findMeta(scenesIndex, currentSceneId)?.name ?? "Min trädgård";

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

  // Lägg-till-dialog (delas av rail-knappen B och B-tangenten) + norr-dialen (N).
  const [addOpen, setAddOpen] = useState(false);
  const [addKind, setAddKind] = useState<ObjectKind>("bed");
  const [addWidth, setAddWidth] = useState(KIND_DEFAULTS.bed.width);
  const [addHeight, setAddHeight] = useState(KIND_DEFAULTS.bed.height);
  const [addWallHeight, setAddWallHeight] = useState(KIND_DEFAULTS.bed.wallHeight);
  const [northOpen, setNorthOpen] = useState(false);

  const onPickAddKind = useCallback((k: ObjectKind) => {
    setAddKind(k);
    setAddWidth(KIND_DEFAULTS[k].width);
    setAddHeight(KIND_DEFAULTS[k].height);
    setAddWallHeight(KIND_DEFAULTS[k].wallHeight);
  }, []);

  const commitAddRect = useCallback(() => {
    const s = stateRef.current;
    const w = Math.max(MIN_RECT_DIMENSION_MM, Math.round(addWidth));
    const h = Math.max(MIN_RECT_DIMENSION_MM, Math.round(addHeight));
    const wh = Math.max(0, Math.round(addWallHeight));
    const offset = (s.rectangles.length % 8) * 600;
    const rect: Rect = {
      id: nextId(),
      cx: 5000 + offset,
      cy: 5000 + offset,
      width: w,
      height: h,
      rotationDeg: 0,
      wallHeight: wh,
    };
    if (addKind !== "bed") rect.kind = addKind;
    dispatch({ type: "addRect", rect });
    setAddOpen(false);
  }, [addKind, addWidth, addHeight, addWallHeight]);

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
        else if (addOpen) setAddOpen(false);
        else if (northOpen) setNorthOpen(false);
        else if (s.tool !== "select") dispatch({ type: "setTool", tool: "select" });
        else if (s.selectedIds.length > 0) dispatch({ type: "select", id: null });
        return;
      }

      // Verktygsval (rail). V/B/P/M/N — guardas redan mot editbara mål ovan.
      if (e.key.toLowerCase() === "v") {
        e.preventDefault();
        dispatch({ type: "setTool", tool: "select" });
        return;
      }
      if (e.key.toLowerCase() === "b") {
        e.preventDefault();
        setAddOpen((v) => !v);
        return;
      }
      if (e.key.toLowerCase() === "p") {
        e.preventDefault();
        dispatch({ type: "setTool", tool: "plot" });
        return;
      }
      if (e.key.toLowerCase() === "m") {
        e.preventDefault();
        dispatch({ type: "setTool", tool: "measure" });
        return;
      }
      if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        setNorthOpen((v) => !v);
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

      // Skuggor på/av
      if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        dispatch({ type: "toggleShadows" });
        return;
      }

      // Skrubba förhandsgranskningstid ±15 min (clampat till 06–20)
      if (e.key === "[" || e.key === "]") {
        e.preventDefault();
        const d = new Date(s.sun.dateIso);
        const deltaH = (e.key === "]" ? 15 : -15) / 60;
        let dec = d.getHours() + d.getMinutes() / 60 + deltaH;
        dec = Math.min(20, Math.max(6, dec));
        const hh = Math.floor(dec);
        const mm = Math.round((dec - hh) * 60);
        d.setHours(hh, mm, 0, 0);
        dispatch({ type: "setSun", dateIso: d.toISOString() });
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
  }, [showShortcuts, addOpen, northOpen]);

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
    (s, r) => s + bedSoilVolumeLitres(r, r.soilDepthMm ?? bedDepth),
    0,
  );

  const onUndo = useCallback(() => dispatch({ type: "undo" }), []);
  const onRedo = useCallback(() => dispatch({ type: "redo" }), []);

  const onTabChange = useCallback((tab: ActiveTab) => {
    dispatch({ type: "switchTab", tab });
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg-paper)" }}>
      <AppHeader
        activeTab={state.activeTab}
        onTabChange={onTabChange}
        theme={theme}
        onToggleTheme={onToggleTheme}
        sceneMenu={
          <SceneMenu
            currentName={currentSceneName}
            scenes={scenesIndex.scenes}
            currentId={currentSceneId}
            onOpen={refreshScenes}
            onSwitch={switchScene}
            onCreate={createScene}
            onRename={renameScene}
            onDuplicate={duplicateScene}
            onDelete={deleteScene}
            onExportJson={() => saveScene(state)}
            onImportJson={() => loadSceneFromFile(dispatch, resetBaseline)}
            onExportPng={() => exportCanvasAsPng()}
          />
        }
      />
      {state.activeTab === "planera" ? (
        <>
          <Toolbar
            state={state}
            dispatch={dispatch}
            bedDepth={bedDepth}
            setBedDepth={setBedDepth}
            onUndo={onUndo}
            onRedo={onRedo}
            canUndo={canUndo(historyState)}
            canRedo={canRedo(historyState)}
          />
          <div
            role="tabpanel"
            id="tabpanel-planera"
            aria-labelledby="tab-planera"
            style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
          >
            <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
              <ToolRail
                tool={state.tool}
                snapToGrid={state.snapToGrid}
                northRotationDeg={state.plot.northRotationDeg}
                hasBoundary={state.plot.boundaryRect != null}
                addActive={addOpen}
                northOpen={northOpen}
                onNorthOpenChange={setNorthOpen}
                onAdd={() => setAddOpen((v) => !v)}
                dispatch={dispatch}
              />
              <Canvas
                state={state}
                dispatch={dispatch}
                sun={sun}
                overlappingIds={overlappingIds}
                touchingIds={touchingIds}
                theme={theme}
                onRequestAddBed={() => setAddOpen(true)}
              />
              <SidePanel
                state={state}
                bedDepth={bedDepth}
                dispatch={dispatch}
                overlappingIds={overlappingIds}
                touchingIds={touchingIds}
                plants={PLANT_CATALOG}
              />
            </div>
            <TimeBar
              dateIso={state.sun.dateIso}
              onChange={(iso) => dispatch({ type: "setSun", dateIso: iso })}
              showShadows={state.showShadows}
              onToggleShadows={() => dispatch({ type: "toggleShadows" })}
              sun={sun}
            />
            <StatusRow
              bedCount={state.rectangles.length}
              totalAreaM2={totalAreaM2}
              totalSoilL={totalSoilL}
              overlapCount={overlappingIds.size / 2}
              touchCount={touchingIds.size / 2}
              collisionIds={Array.from(new Set([...overlappingIds, ...touchingIds]))}
              autoSaveStatus={autoSaveStatus}
              latitudeDeg={state.plot.location.latitudeDeg}
              dispatch={dispatch}
            />
          </div>
        </>
      ) : (
        <PlantCatalog
          plants={PLANT_CATALOG}
          beds={state.rectangles}
          selectedPlantId={state.selectedPlantId}
          plannedPlantIds={state.plannedPlantIds}
          onSelectPlant={(id) => dispatch({ type: "selectPlant", plantId: id })}
          onShowOnCanvas={(plantId) => dispatch({ type: "showPlantOnCanvas", plantId })}
          onTogglePlan={(plantId) => dispatch({ type: "togglePlannedPlant", plantId })}
          onAddToBed={(plantId, bedId) => {
            const plant = PLANT_CATALOG.find((p) => p.id === plantId);
            dispatch({
              type: "addPlantToBed",
              plantId,
              bedId,
              displayName: plant?.commonName ?? plantId,
            });
          }}
        />
      )}
      {addOpen && (
        <AddRectPopover
          kind={addKind}
          onKind={onPickAddKind}
          width={addWidth}
          height={addHeight}
          wallHeight={addWallHeight}
          onWidth={setAddWidth}
          onHeight={setAddHeight}
          onWallHeight={setAddWallHeight}
          onCancel={() => setAddOpen(false)}
          onConfirm={commitAddRect}
          onStartDrawing={() => {
            dispatch({ type: "setCreateKind", kind: addKind });
            dispatch({ type: "setTool", tool: "create" });
            setAddOpen(false);
          }}
        />
      )}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
    </div>
  );
}

const SHORTCUT_GROUPS: Array<{ title: string; rows: Array<[string, string]> }> = [
  {
    title: "Verktyg",
    rows: [
      ["V", "Markera"],
      ["B", "Lägg till objekt"],
      ["P", "Rita tomtgräns"],
      ["M", "Mät avstånd"],
      ["G", "Snap till rutnät"],
      ["N", "Norr-rotation"],
    ],
  },
  {
    title: "Tid",
    rows: [
      ["[ / ]", "Tid −15 / +15 min"],
      ["S", "Visa / dölj skuggor"],
    ],
  },
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
