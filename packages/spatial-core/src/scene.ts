import type { PlotConfig, Rect } from "./types.js";

/** Current scene format version. Bump when schema changes. */
export const SCENE_VERSION = 1;

export interface SceneV1 {
  version: 1;
  plot: PlotConfig;
  /** Optional outer plot boundary rectangle. Additive in v1 (forward-compatible). */
  boundary?: Rect | null;
  rectangles: Rect[];
}

/** Union type for all known versions — utökas vid framtida migrering. */
export type Scene = SceneV1;

export class SceneParseError extends Error {
  constructor(message: string, public readonly raw: unknown) {
    super(message);
    this.name = "SceneParseError";
  }
}

function canonicalizeRect(r: Rect): Rect {
  return {
    ...r,
    cx: Math.round(r.cx),
    cy: Math.round(r.cy),
    width: Math.round(r.width),
    height: Math.round(r.height),
    rotationDeg: r.rotationDeg, // rotation får vara float
    wallHeight: Math.round(r.wallHeight),
  };
}

/** Serialize state → JSON-compatible scene object. */
export function serializeScene(state: {
  plot: PlotConfig;
  boundary?: Rect | null;
  rectangles: Rect[];
}): SceneV1 {
  return {
    version: 1,
    plot: {
      northRotationDeg: Math.round(state.plot.northRotationDeg),
      location: state.plot.location,
    },
    boundary: state.boundary ? canonicalizeRect(state.boundary) : null,
    rectangles: state.rectangles.map(canonicalizeRect),
  };
}

/** Parse and validate raw JSON. Throws SceneParseError on malformed input. */
export function parseScene(raw: unknown): Scene {
  if (typeof raw !== "object" || raw === null) {
    throw new SceneParseError("Input is not an object", raw);
  }

  const obj = raw as Record<string, unknown>;

  if (obj.version !== 1) {
    throw new SceneParseError(
      `Unsupported or missing version: ${obj.version}`,
      raw,
    );
  }

  const scene = obj as unknown as SceneV1;

  // Basic validation
  if (!scene.plot || typeof scene.plot.northRotationDeg !== "number") {
    throw new SceneParseError("Invalid plot configuration", raw);
  }

  if (!Array.isArray(scene.rectangles)) {
    throw new SceneParseError("rectangles must be an array", raw);
  }

  for (const rect of scene.rectangles) {
    validateRect(rect, raw);
  }

  if (scene.boundary != null) {
    validateRect(scene.boundary, raw);
  }

  return scene;
}

function validateRect(rect: Rect, raw: unknown): void {
  if (
    typeof rect.cx !== "number" ||
    typeof rect.cy !== "number" ||
    typeof rect.width !== "number" ||
    typeof rect.height !== "number"
  ) {
    throw new SceneParseError("Invalid rectangle coordinates", raw);
  }
  if (rect.width <= 0 || rect.height <= 0) {
    throw new SceneParseError("width and height must be > 0", raw);
  }
  if (
    Number.isNaN(rect.cx) ||
    Number.isNaN(rect.cy) ||
    !Number.isFinite(rect.cx) ||
    !Number.isFinite(rect.cy)
  ) {
    throw new SceneParseError("NaN or Infinity in coordinates", raw);
  }
}

/** Migrate older scene versions to current. Currently identity for v1. */
export function migrateScene(scene: Scene): SceneV1 {
  return scene as SceneV1;
}
