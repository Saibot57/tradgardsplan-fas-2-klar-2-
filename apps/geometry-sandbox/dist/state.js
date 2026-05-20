import { roundToWorldMm, } from "@kolonitradgard/spatial-core";
/** Minimum width/height for any Rect in the sandbox (precision_policy §7). */
export const MIN_RECT_DIMENSION_MM = 100;
/** Convenience: primary selected id (eller null). */
export function primarySelectedId(state) {
    return state.selectedIds[0] ?? null;
}
/**
 * Actions som auto-commitar ett snapshot i `withHistory`-wrappingen.
 * Importeras av App.tsx och av tester. Drag-bursts (move/rotate/resize)
 * commitar explicit via `commitHistory` på pointerDown och listas inte här.
 */
export const AUTO_COMMIT_ACTIONS = new Set([
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
    "setRectColor",
    "duplicateSelected",
    "togglePlannedPlant",
    "addPlantToBed",
    "removePlantFromBed",
]);
let _id = 0;
export const nextId = () => `rect-${++_id}`;
let _placementId = 0;
export const nextPlacementId = () => `placement-${++_placementId}`;
/** Tidsfönster (06–20). Håll i synk med TimeBar.tsx HOUR_MIN/MAX. */
export const SUN_HOUR_MIN = 6;
export const SUN_HOUR_MAX = 20;
/**
 * Producerar en initial sandbox-state utifrån nuvarande tidpunkt.
 * Klockslaget clampas till tidsfönstret (06–20) så scrubbern startar
 * inom sin range; datumet bevaras alltid.
 */
export function makeInitialState(now = new Date()) {
    const clamped = new Date(now);
    const h = clamped.getHours();
    if (h < SUN_HOUR_MIN)
        clamped.setHours(SUN_HOUR_MIN, 0, 0, 0);
    else if (h > SUN_HOUR_MAX)
        clamped.setHours(SUN_HOUR_MAX, 0, 0, 0);
    return {
        rectangles: [
            {
                id: nextId(),
                cx: 4000,
                cy: 4000,
                width: 2000,
                height: 1000,
                rotationDeg: 0,
                wallHeight: 0,
            },
            {
                id: nextId(),
                cx: 8000,
                cy: 4000,
                width: 1500,
                height: 1500,
                rotationDeg: 25,
                wallHeight: 0,
            },
            {
                id: nextId(),
                cx: 6000,
                cy: 1500,
                width: 4000,
                height: 200,
                rotationDeg: 0,
                wallHeight: 1800,
            },
        ],
        selectedIds: [],
        viewport: { panX: 40, panY: 40, pixelsPerMm: 0.07 },
        sun: { dateIso: clamped.toISOString() },
        showShadows: true,
        showSunPath: false,
        plot: {
            northRotationDeg: 0,
            location: {
                latitudeDeg: 55.8708,
                longitudeDeg: 12.83,
            },
            boundaryRect: null,
        },
        snapToGrid: false,
        gridStepMm: 100,
        showAllMeasurements: false,
        tool: "select",
        createKind: "bed",
        activeTab: "planera",
        selectedPlantId: null,
        plannedPlantIds: [],
    };
}
/** Bevaras för bakåtkompatibilitet (tester). Använd makeInitialState() i produktionskod. */
export const initialState = makeInitialState(new Date(2025, 5, 21, 12, 0, 0));
export function reducer(state, action) {
    switch (action.type) {
        case "addRect":
            return { ...state, rectangles: [...state.rectangles, action.rect] };
        case "removeSelected": {
            if (state.selectedIds.length === 0)
                return state;
            const remove = new Set(state.selectedIds);
            return {
                ...state,
                rectangles: state.rectangles.filter((r) => !remove.has(r.id)),
                selectedIds: [],
            };
        }
        case "select": {
            if (action.id === null)
                return { ...state, selectedIds: [] };
            const mode = action.mode ?? "replace";
            const existing = state.selectedIds;
            if (mode === "replace")
                return { ...state, selectedIds: [action.id] };
            if (mode === "toggle") {
                if (existing.includes(action.id)) {
                    return { ...state, selectedIds: existing.filter((id) => id !== action.id) };
                }
                return { ...state, selectedIds: [...existing, action.id] };
            }
            // mode === "add"
            if (existing.includes(action.id))
                return state;
            return { ...state, selectedIds: [...existing, action.id] };
        }
        case "selectMany":
            return { ...state, selectedIds: action.ids.slice() };
        case "duplicateSelected": {
            if (state.selectedIds.length === 0)
                return state;
            const offset = 600; // mm — samma som commitAddRect i Toolbar
            const newRects = [];
            const newIds = [];
            for (const id of state.selectedIds) {
                const original = state.rectangles.find((r) => r.id === id);
                if (!original)
                    continue;
                const copy = {
                    ...original,
                    id: nextId(),
                    cx: Math.round(original.cx + offset),
                    cy: Math.round(original.cy + offset),
                };
                newRects.push(copy);
                newIds.push(copy.id);
            }
            return {
                ...state,
                rectangles: [...state.rectangles, ...newRects],
                selectedIds: newIds,
            };
        }
        case "moveSelected": {
            if (state.selectedIds.length === 0)
                return state;
            const sel = new Set(state.selectedIds);
            return {
                ...state,
                rectangles: state.rectangles.map((r) => {
                    if (!sel.has(r.id))
                        return r;
                    const p = roundToWorldMm({ x: r.cx + action.dx, y: r.cy + action.dy });
                    return { ...r, cx: p.x, cy: p.y };
                }),
            };
        }
        case "rotateSelected": {
            const primary = state.selectedIds[0];
            if (!primary)
                return state;
            return {
                ...state,
                rectangles: state.rectangles.map((r) => r.id === primary
                    ? { ...r, rotationDeg: (r.rotationDeg + action.deltaDeg) % 360 }
                    : r),
            };
        }
        case "resizeSelected": {
            const primary = state.selectedIds[0];
            if (!primary)
                return state;
            return {
                ...state,
                rectangles: state.rectangles.map((r) => r.id === primary
                    ? {
                        ...r,
                        width: Math.max(MIN_RECT_DIMENSION_MM, Math.round(r.width + action.dWidth)),
                        height: Math.max(MIN_RECT_DIMENSION_MM, Math.round(r.height + action.dHeight)),
                    }
                    : r),
            };
        }
        case "resizeRect":
            return {
                ...state,
                rectangles: state.rectangles.map((r) => {
                    if (r.id !== action.id)
                        return r;
                    const p = roundToWorldMm({ x: action.cx, y: action.cy });
                    return {
                        ...r,
                        cx: p.x,
                        cy: p.y,
                        width: Math.max(MIN_RECT_DIMENSION_MM, Math.round(action.width)),
                        height: Math.max(MIN_RECT_DIMENSION_MM, Math.round(action.height)),
                    };
                }),
            };
        case "rotateRect":
            return {
                ...state,
                rectangles: state.rectangles.map((r) => r.id === action.id ? { ...r, rotationDeg: action.rotationDeg % 360 } : r),
            };
        case "setWallHeight":
            return {
                ...state,
                rectangles: state.rectangles.map((r) => r.id === action.id ? { ...r, wallHeight: Math.max(0, Math.round(action.mm)) } : r),
            };
        case "setViewport":
            return { ...state, viewport: action.viewport };
        case "setSun":
            return { ...state, sun: { dateIso: action.dateIso } };
        case "toggleShadows":
            return { ...state, showShadows: !state.showShadows };
        case "toggleSunPath":
            return { ...state, showSunPath: !state.showSunPath };
        case "setNorthRotation":
            return { ...state, plot: { ...state.plot, northRotationDeg: action.deg } };
        case "setLocation":
            return { ...state, plot: { ...state.plot, location: action.loc } };
        case "setPlotBoundary":
            return { ...state, plot: { ...state.plot, boundaryRect: action.rect } };
        case "setSnapToGrid":
            return { ...state, snapToGrid: action.enabled };
        case "setGridStep":
            return { ...state, gridStepMm: Math.max(10, action.mm) };
        case "setShowAllMeasurements":
            return { ...state, showAllMeasurements: action.enabled };
        case "setTool":
            if (state.tool === action.tool)
                return state;
            return { ...state, tool: action.tool };
        case "setCreateKind":
            if (state.createKind === action.kind)
                return state;
            return { ...state, createKind: action.kind };
        case "loadScene":
            return {
                ...state,
                rectangles: action.scene.rectangles,
                selectedIds: [],
                plot: {
                    northRotationDeg: action.scene.plot.northRotationDeg,
                    location: action.scene.plot.location,
                    boundaryRect: action.scene.boundary ?? null,
                },
                plannedPlantIds: action.scene.plannedPlantIds,
                // viewport, sun, activeTab och selectedPlantId bevaras
                // (session-state, inte scene-state — ADR-007/008)
            };
        case "newScene":
            return {
                ...state,
                rectangles: [],
                selectedIds: [],
                plannedPlantIds: [],
                plot: { ...state.plot, boundaryRect: null },
            };
        case "setRectMeta":
            return {
                ...state,
                rectangles: state.rectangles.map((r) => {
                    if (r.id !== action.id)
                        return r;
                    const next = { ...r };
                    if (action.label !== undefined) {
                        if (action.label === "")
                            delete next.label;
                        else
                            next.label = action.label;
                    }
                    if (action.notes !== undefined) {
                        if (action.notes === "")
                            delete next.notes;
                        else
                            next.notes = action.notes;
                    }
                    return next;
                }),
            };
        case "setRectKind":
            return {
                ...state,
                rectangles: state.rectangles.map((r) => {
                    if (r.id !== action.id)
                        return r;
                    const next = { ...r, kind: action.kind };
                    // Håll JSON minimal: "bed" är default och sparas som frånvaro.
                    if (action.kind === "bed")
                        delete next.kind;
                    return next;
                }),
            };
        case "setRectColor":
            return {
                ...state,
                rectangles: state.rectangles.map((r) => {
                    if (r.id !== action.id)
                        return r;
                    const next = { ...r };
                    if (action.color === null || action.color === "") {
                        delete next.color;
                    }
                    else {
                        next.color = action.color;
                    }
                    return next;
                }),
            };
        case "switchTab":
            if (state.activeTab === action.tab)
                return state;
            return { ...state, activeTab: action.tab };
        case "selectPlant":
            if (state.selectedPlantId === action.plantId)
                return state;
            return { ...state, selectedPlantId: action.plantId };
        case "togglePlannedPlant": {
            const exists = state.plannedPlantIds.includes(action.plantId);
            return {
                ...state,
                plannedPlantIds: exists
                    ? state.plannedPlantIds.filter((id) => id !== action.plantId)
                    : [...state.plannedPlantIds, action.plantId],
            };
        }
        case "addPlantToBed": {
            const bed = state.rectangles.find((r) => r.id === action.bedId);
            if (!bed)
                return state;
            const existing = bed.plants?.find((p) => p.plantId === action.plantId);
            let nextPlants;
            if (existing) {
                nextPlants = bed.plants.map((p) => p.placementId === existing.placementId ? { ...p, count: p.count + 1 } : p);
            }
            else {
                const placement = {
                    placementId: nextPlacementId(),
                    plantId: action.plantId,
                    displayName: action.displayName,
                    offsetX: Math.round(action.offsetX ?? 0),
                    offsetY: Math.round(action.offsetY ?? 0),
                    count: 1,
                };
                nextPlants = [...(bed.plants ?? []), placement];
            }
            // Atomic: ta bort plantId ur plannedPlantIds i samma snapshot.
            const nextPlanned = state.plannedPlantIds.includes(action.plantId)
                ? state.plannedPlantIds.filter((id) => id !== action.plantId)
                : state.plannedPlantIds;
            return {
                ...state,
                rectangles: state.rectangles.map((r) => r.id === action.bedId ? { ...r, plants: nextPlants } : r),
                plannedPlantIds: nextPlanned,
            };
        }
        case "removePlantFromBed": {
            const bed = state.rectangles.find((r) => r.id === action.bedId);
            if (!bed?.plants)
                return state;
            const placement = bed.plants.find((p) => p.placementId === action.placementId);
            if (!placement)
                return state;
            const nextPlants = placement.count > 1
                ? bed.plants.map((p) => p.placementId === action.placementId ? { ...p, count: p.count - 1 } : p)
                : bed.plants.filter((p) => p.placementId !== action.placementId);
            return {
                ...state,
                rectangles: state.rectangles.map((r) => r.id === action.bedId ? { ...r, plants: nextPlants } : r),
            };
        }
        case "showPlantOnCanvas": {
            const firstBed = state.rectangles.find((r) => r.plants?.some((p) => p.plantId === action.plantId));
            const nextSelected = firstBed ? [firstBed.id] : state.selectedIds;
            return {
                ...state,
                activeTab: "planera",
                selectedIds: nextSelected,
            };
        }
    }
}
//# sourceMappingURL=state.js.map