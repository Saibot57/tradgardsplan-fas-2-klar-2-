import type {
  Rect,
  GeoLocation,
  PlotConfig,
  DEFAULT_PLOT_CONFIG,
  SceneV1,
} from "@kolonitradgard/spatial-core";

/** Minimum width/height for any Rect in the sandbox (precision_policy §7). */
export const MIN_RECT_DIMENSION_MM = 100;

export interface SandboxState {
  rectangles: Rect[];
  selectedId: string | null;
  viewport: { panX: number; panY: number; pixelsPerMm: number };
  sun: { dateIso: string };
  showShadows: boolean;
  /** ADR-006: Geographic orientation separated from world space. */
  plot: {
    northRotationDeg: number;
    location: GeoLocation;
    boundaryRect: Rect | null; // tomtens yttre rektangel
  };
  snapToGrid: boolean;
  gridStepMm: number;
}

export type Action =
  | { type: "addRect"; rect: Rect }
  | { type: "removeSelected" }
  | { type: "select"; id: string | null }
  | { type: "moveSelected"; dx: number; dy: number } // world mm
  | { type: "rotateSelected"; deltaDeg: number }
  | { type: "resizeSelected"; dWidth: number; dHeight: number }
  | { type: "resizeRect"; id: string; cx: number; cy: number; width: number; height: number }
  | { type: "rotateRect"; id: string; rotationDeg: number }
  | { type: "setWallHeight"; id: string; mm: number }
  | { type: "setViewport"; viewport: SandboxState["viewport"] }
  | { type: "setSun"; dateIso: string }
  | { type: "toggleShadows" }
  | { type: "setNorthRotation"; deg: number }
  | { type: "setLocation"; loc: GeoLocation }
  | { type: "setPlotBoundary"; rect: Rect | null }
  | { type: "setSnapToGrid"; enabled: boolean }
  | { type: "setGridStep"; mm: number }
  | { type: "loadScene"; scene: SceneV1 };

let _id = 0;
export const nextId = (): string => `rect-${++_id}`;

export const initialState: SandboxState = {
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
  selectedId: null,
  viewport: { panX: 40, panY: 40, pixelsPerMm: 0.07 },
  sun: { dateIso: new Date(2025, 5, 21, 12, 0, 0).toISOString() },
  showShadows: true,
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
};

export function reducer(state: SandboxState, action: Action): SandboxState {
  switch (action.type) {
    case "addRect":
      return { ...state, rectangles: [...state.rectangles, action.rect] };

    case "removeSelected":
      if (!state.selectedId) return state;
      return {
        ...state,
        rectangles: state.rectangles.filter((r) => r.id !== state.selectedId),
        selectedId: null,
      };

    case "select":
      return { ...state, selectedId: action.id };

    case "moveSelected":
      if (!state.selectedId) return state;
      return {
        ...state,
        rectangles: state.rectangles.map((r) =>
          r.id === state.selectedId
            ? { ...r, cx: Math.round(r.cx + action.dx), cy: Math.round(r.cy + action.dy) }
            : r,
        ),
      };

    case "rotateSelected":
      if (!state.selectedId) return state;
      return {
        ...state,
        rectangles: state.rectangles.map((r) =>
          r.id === state.selectedId
            ? { ...r, rotationDeg: (r.rotationDeg + action.deltaDeg) % 360 }
            : r,
        ),
      };

    case "resizeSelected":
      if (!state.selectedId) return state;
      return {
        ...state,
        rectangles: state.rectangles.map((r) =>
          r.id === state.selectedId
            ? {
                ...r,
                width: Math.max(MIN_RECT_DIMENSION_MM, Math.round(r.width + action.dWidth)),
                height: Math.max(MIN_RECT_DIMENSION_MM, Math.round(r.height + action.dHeight)),
              }
            : r,
        ),
      };

    case "resizeRect":
      return {
        ...state,
        rectangles: state.rectangles.map((r) =>
          r.id === action.id
            ? {
                ...r,
                cx: Math.round(action.cx),
                cy: Math.round(action.cy),
                width: Math.max(MIN_RECT_DIMENSION_MM, Math.round(action.width)),
                height: Math.max(MIN_RECT_DIMENSION_MM, Math.round(action.height)),
              }
            : r,
        ),
      };

    case "rotateRect":
      return {
        ...state,
        rectangles: state.rectangles.map((r) =>
          r.id === action.id ? { ...r, rotationDeg: action.rotationDeg % 360 } : r,
        ),
      };

    case "setWallHeight":
      return {
        ...state,
        rectangles: state.rectangles.map((r) =>
          r.id === action.id ? { ...r, wallHeight: Math.max(0, Math.round(action.mm)) } : r,
        ),
      };

    case "setViewport":
      return { ...state, viewport: action.viewport };

    case "setSun":
      return { ...state, sun: { dateIso: action.dateIso } };

    case "toggleShadows":
      return { ...state, showShadows: !state.showShadows };

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

    case "loadScene":
      return {
        ...state,
        rectangles: action.scene.rectangles,
        selectedId: null,
        plot: {
          northRotationDeg: action.scene.plot.northRotationDeg,
          location: action.scene.plot.location,
          boundaryRect: action.scene.boundary ?? null,
        },
        // viewport och sun bevaras (session-state, inte scene-state — ADR-007/008)
      };
  }
}
