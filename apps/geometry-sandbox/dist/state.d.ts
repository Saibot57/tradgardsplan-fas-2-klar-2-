import { type GeoLocation, type ObjectKind, type Rect, type SceneV6 } from "@kolonitradgard/spatial-core";
/** Minimum width/height for any Rect in the sandbox (precision_policy §7). */
export declare const MIN_RECT_DIMENSION_MM = 100;
export type ActiveTab = "planera" | "vaxter";
export interface SandboxState {
    rectangles: Rect[];
    /**
     * Markerade bäddar (multi-select). Första elementet är "primary" — det
     * bäddinspektorn och handles agerar på. Tom array = inget valt.
     */
    selectedIds: string[];
    viewport: {
        panX: number;
        panY: number;
        pixelsPerMm: number;
    };
    sun: {
        dateIso: string;
    };
    showShadows: boolean;
    /** Visa skuggsvep 06–20 vid valt datum (sun-path heatmap). */
    showSunPath: boolean;
    /** ADR-006: Geographic orientation separated from world space. */
    plot: {
        northRotationDeg: number;
        location: GeoLocation;
        boundaryRect: Rect | null;
    };
    snapToGrid: boolean;
    gridStepMm: number;
    /**
     * Visa avståndsmått till ALLA andra objekt under drag/resize, inte bara de
     * inom default-threshold. Session-state, ej del av scene-snapshot, ej
     * undo:bart.
     */
    showAllMeasurements: boolean;
    /**
     * Aktivt verktyg. "select" är default (klicka/dra för att markera+flytta).
     * "create" → klick+dra på tom yta skapar ny rect med dimensioner enligt drag.
     * Session-state, ej i undo-stacken.
     */
    tool: "select" | "create";
    /** Vilken kind nya rect:ar får i drag-to-create-läget. Session-state. */
    createKind: ObjectKind;
    /** Aktiv toppflik. Session-state, ej del av scene-snapshot. */
    activeTab: ActiveTab;
    /** Vald växt i katalogen. Session-state, ej i undo-stacken. */
    selectedPlantId: string | null;
    /**
     * Växter som användaren markerat "planera" men inte placerat i någon bädd.
     * Persisteras i scene (SceneV6.plannedPlantIds) och ingår i undo-stacken.
     */
    plannedPlantIds: string[];
}
/** Convenience: primary selected id (eller null). */
export declare function primarySelectedId(state: SandboxState): string | null;
export type Action = {
    type: "addRect";
    rect: Rect;
} | {
    type: "removeSelected";
} | {
    type: "select";
    id: string | null;
    mode?: "replace" | "toggle" | "add";
} | {
    type: "selectMany";
    ids: string[];
} | {
    type: "duplicateSelected";
} | {
    type: "moveSelected";
    dx: number;
    dy: number;
} | {
    type: "rotateSelected";
    deltaDeg: number;
} | {
    type: "resizeSelected";
    dWidth: number;
    dHeight: number;
} | {
    type: "resizeRect";
    id: string;
    cx: number;
    cy: number;
    width: number;
    height: number;
} | {
    type: "rotateRect";
    id: string;
    rotationDeg: number;
} | {
    type: "setWallHeight";
    id: string;
    mm: number;
} | {
    type: "setViewport";
    viewport: SandboxState["viewport"];
} | {
    type: "setSun";
    dateIso: string;
} | {
    type: "toggleShadows";
} | {
    type: "toggleSunPath";
} | {
    type: "setNorthRotation";
    deg: number;
} | {
    type: "setLocation";
    loc: GeoLocation;
} | {
    type: "setPlotBoundary";
    rect: Rect | null;
} | {
    type: "setSnapToGrid";
    enabled: boolean;
} | {
    type: "setGridStep";
    mm: number;
} | {
    type: "setShowAllMeasurements";
    enabled: boolean;
} | {
    type: "setTool";
    tool: "select" | "create";
} | {
    type: "setCreateKind";
    kind: ObjectKind;
} | {
    type: "loadScene";
    scene: SceneV6;
} | {
    type: "newScene";
} | {
    type: "setRectMeta";
    id: string;
    label?: string;
    notes?: string;
} | {
    type: "setRectKind";
    id: string;
    kind: ObjectKind;
} | {
    type: "setRectColor";
    id: string;
    color: string | null;
} | {
    type: "switchTab";
    tab: ActiveTab;
} | {
    type: "selectPlant";
    plantId: string | null;
} | {
    type: "togglePlannedPlant";
    plantId: string;
} | {
    type: "addPlantToBed";
    bedId: string;
    plantId: string;
    displayName: string;
    offsetX?: number;
    offsetY?: number;
} | {
    type: "removePlantFromBed";
    bedId: string;
    placementId: string;
} | {
    type: "showPlantOnCanvas";
    plantId: string;
};
/**
 * Actions som auto-commitar ett snapshot i `withHistory`-wrappingen.
 * Importeras av App.tsx och av tester. Drag-bursts (move/rotate/resize)
 * commitar explicit via `commitHistory` på pointerDown och listas inte här.
 */
export declare const AUTO_COMMIT_ACTIONS: ReadonlySet<Action["type"]>;
export declare const nextId: () => string;
export declare const nextPlacementId: () => string;
/** Tidsfönster (06–20). Håll i synk med TimeBar.tsx HOUR_MIN/MAX. */
export declare const SUN_HOUR_MIN = 6;
export declare const SUN_HOUR_MAX = 20;
/**
 * Producerar en initial sandbox-state utifrån nuvarande tidpunkt.
 * Klockslaget clampas till tidsfönstret (06–20) så scrubbern startar
 * inom sin range; datumet bevaras alltid.
 */
export declare function makeInitialState(now?: Date): SandboxState;
/** Bevaras för bakåtkompatibilitet (tester). Använd makeInitialState() i produktionskod. */
export declare const initialState: SandboxState;
export declare function reducer(state: SandboxState, action: Action): SandboxState;
