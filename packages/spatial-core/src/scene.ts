import type { PlantPlacement, PlotConfig, Rect } from "./types.js";
import { isObjectKind } from "./kind.js";

/** Current scene format version. Bump when schema changes. */
export const SCENE_VERSION = 6;

export interface SceneV1 {
  version: 1;
  plot: PlotConfig;
  /** Optional outer plot boundary rectangle. Additive in v1 (forward-compatible). */
  boundary?: Rect | null;
  rectangles: Rect[];
}

/**
 * v2 — additivt schema: rectangles kan ha valfria `label` och `notes`.
 * Det fysiska JSON-formatet är bakåtkompatibelt med v1 (extra optional-fält
 * läses ignorerade av v1-parsers), men `version`-fältet bumpas så att skrivna
 * filer markeras tydligt och migrationen kan tilldela defaults vid behov.
 */
export interface SceneV2 {
  version: 2;
  plot: PlotConfig;
  boundary?: Rect | null;
  rectangles: Rect[];
}

/**
 * v3 — additivt: `Rect.kind` kan anges (ADR-009). Saknad `kind` tolkas
 * som "bed" via `getKind()`. Strukturellt identiskt med v2.
 */
export interface SceneV3 {
  version: 3;
  plot: PlotConfig;
  boundary?: Rect | null;
  rectangles: Rect[];
}

/**
 * v4 — växtkatalog (PlantCatalog).
 *  - `Rect.plants?: PlantPlacement[]` valfritt per bädd. Saknat == inga växter.
 *  - `plannedPlantIds: string[]` obligatoriskt på scen-nivå: katalog-växter som
 *    användaren markerat "planera" men inte placerat i någon bädd ännu.
 *
 * Migrering v1/v2/v3 → v4 är transparent: rektanglar lämnas oförändrade,
 * `plannedPlantIds` defaultar till tom array.
 */
export interface SceneV4 {
  version: 4;
  plot: PlotConfig;
  boundary?: Rect | null;
  rectangles: Rect[];
  plannedPlantIds: string[];
}

/**
 * v5 — additivt: `Rect.kind` accepterar nu också `"rabatt"` (plantbar friland).
 * Strukturellt identiskt med v4; ingen migration utöver versionsbumpning krävs.
 * v4-filer utan kind=rabatt parsar oförändrat som v5.
 */
export interface SceneV5 {
  version: 5;
  plot: PlotConfig;
  boundary?: Rect | null;
  rectangles: Rect[];
  plannedPlantIds: string[];
}

/**
 * v6 — additivt:
 *  - `Rect.kind` accepterar fyra nya värden: "grass", "paved", "gravel", "deck"
 *  - `Rect.color?` — egendefinierad fyllnadsfärg ("#RRGGBB"), overridar default
 *
 * Strukturellt identiskt med v5; ingen migration utöver versionsbumpning krävs.
 */
export interface SceneV6 {
  version: 6;
  plot: PlotConfig;
  boundary?: Rect | null;
  rectangles: Rect[];
  plannedPlantIds: string[];
}

/** Union type for all known versions — utökas vid framtida migrering. */
export type Scene = SceneV1 | SceneV2 | SceneV3 | SceneV4 | SceneV5 | SceneV6;

/** Validate that a string is a #RRGGBB hex color (lowercase or uppercase). */
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;
export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR_REGEX.test(value);
}

export class SceneParseError extends Error {
  constructor(message: string, public readonly raw: unknown) {
    super(message);
    this.name = "SceneParseError";
  }
}

function canonicalizePlacement(p: PlantPlacement): PlantPlacement {
  return {
    placementId: p.placementId,
    plantId: p.plantId,
    displayName: p.displayName,
    offsetX: Math.round(p.offsetX),
    offsetY: Math.round(p.offsetY),
    count: Math.max(1, Math.round(p.count)),
  };
}

function canonicalizeRect(r: Rect): Rect {
  const out: Rect = {
    id: r.id,
    cx: Math.round(r.cx),
    cy: Math.round(r.cy),
    width: Math.round(r.width),
    height: Math.round(r.height),
    rotationDeg: r.rotationDeg, // rotation får vara float
    wallHeight: Math.round(r.wallHeight),
  };
  // exactOptionalPropertyTypes: assigna bara om värdet är en icke-tom sträng
  if (typeof r.label === "string" && r.label.length > 0) out.label = r.label;
  if (typeof r.notes === "string" && r.notes.length > 0) out.notes = r.notes;
  // kind utelämnas om värdet är default ("bed") — kompakt JSON och V2-kompatibel form
  if (r.kind !== undefined && r.kind !== "bed") out.kind = r.kind;
  // plants (v4): tomma listor utelämnas — minimal JSON och bakåt-läsbar för v1–v3.
  if (Array.isArray(r.plants) && r.plants.length > 0) {
    out.plants = r.plants.map(canonicalizePlacement);
  }
  // color (v6): utelämnas om null/saknat. Format valideras vid parse.
  if (typeof r.color === "string" && r.color.length > 0) {
    out.color = r.color;
  }
  return out;
}

/** Serialize state → JSON-compatible scene object. */
export function serializeScene(state: {
  plot: PlotConfig;
  boundary?: Rect | null;
  rectangles: Rect[];
  plannedPlantIds?: readonly string[];
}): SceneV6 {
  return {
    version: 6,
    plot: {
      northRotationDeg: Math.round(state.plot.northRotationDeg),
      location: state.plot.location,
    },
    boundary: state.boundary ? canonicalizeRect(state.boundary) : null,
    rectangles: state.rectangles.map(canonicalizeRect),
    plannedPlantIds: state.plannedPlantIds ? [...state.plannedPlantIds] : [],
  };
}

/** Parse and validate raw JSON. Throws SceneParseError on malformed input. */
export function parseScene(raw: unknown): Scene {
  if (typeof raw !== "object" || raw === null) {
    throw new SceneParseError("Input is not an object", raw);
  }

  const obj = raw as Record<string, unknown>;

  if (
    obj.version !== 1 &&
    obj.version !== 2 &&
    obj.version !== 3 &&
    obj.version !== 4 &&
    obj.version !== 5 &&
    obj.version !== 6
  ) {
    throw new SceneParseError(
      `Unsupported or missing version: ${obj.version}`,
      raw,
    );
  }

  const scene = obj as unknown as Scene;

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

  if (scene.version === 4 || scene.version === 5 || scene.version === 6) {
    if (!Array.isArray(scene.plannedPlantIds)) {
      throw new SceneParseError(
        `plannedPlantIds must be an array of strings (v${scene.version})`,
        raw,
      );
    }
    for (const id of scene.plannedPlantIds) {
      if (typeof id !== "string" || id.length === 0) {
        throw new SceneParseError(
          "plannedPlantIds entries must be non-empty strings",
          raw,
        );
      }
    }
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
  // label/notes är valfria — om de finns måste de vara strängar.
  if (rect.label !== undefined && typeof rect.label !== "string") {
    throw new SceneParseError("label must be a string when present", raw);
  }
  if (rect.notes !== undefined && typeof rect.notes !== "string") {
    throw new SceneParseError("notes must be a string when present", raw);
  }
  // kind (v3) — om present måste vara ett känt enum-värde.
  if (rect.kind !== undefined && !isObjectKind(rect.kind)) {
    throw new SceneParseError(
      `Invalid kind: ${String(rect.kind)}`,
      raw,
    );
  }
  // color (v6) — om present måste vara en sträng på formen "#RRGGBB".
  if (rect.color !== undefined) {
    if (typeof rect.color !== "string" || !HEX_COLOR_REGEX.test(rect.color)) {
      throw new SceneParseError(
        `Invalid color: ${String(rect.color)} — must be "#RRGGBB"`,
        raw,
      );
    }
  }
  // plants (v4) — om present måste vara en korrekt PlantPlacement[].
  if (rect.plants !== undefined) {
    if (!Array.isArray(rect.plants)) {
      throw new SceneParseError("Rect.plants must be an array when present", raw);
    }
    for (const p of rect.plants) {
      validatePlacement(p, raw);
    }
  }
}

function validatePlacement(p: PlantPlacement, raw: unknown): void {
  if (!p || typeof p !== "object") {
    throw new SceneParseError("PlantPlacement must be an object", raw);
  }
  if (typeof p.placementId !== "string" || p.placementId.length === 0) {
    throw new SceneParseError("PlantPlacement.placementId must be a non-empty string", raw);
  }
  if (typeof p.plantId !== "string" || p.plantId.length === 0) {
    throw new SceneParseError("PlantPlacement.plantId must be a non-empty string", raw);
  }
  if (typeof p.displayName !== "string" || p.displayName.length === 0) {
    throw new SceneParseError("PlantPlacement.displayName must be a non-empty string", raw);
  }
  if (
    typeof p.offsetX !== "number" ||
    typeof p.offsetY !== "number" ||
    !Number.isFinite(p.offsetX) ||
    !Number.isFinite(p.offsetY)
  ) {
    throw new SceneParseError("PlantPlacement offsets must be finite numbers", raw);
  }
  if (typeof p.count !== "number" || !Number.isFinite(p.count) || p.count < 1) {
    throw new SceneParseError("PlantPlacement.count must be >= 1", raw);
  }
}

/**
 * Migrate older scene versions to current (v6).
 * v1 → v6: identity at rect level (label/notes optional). Adds plannedPlantIds: [].
 * v2 → v6: identity (kind optional). Adds plannedPlantIds: [].
 * v3 → v6: identity at rect level. Adds plannedPlantIds: [].
 * v4 → v6: identity — bumpning bara markerar nytt kind-stöd, struktur oförändrad.
 * v5 → v6: identity — bumpning bara markerar nya kinds + valfri Rect.color.
 * v6 → v6: returnerar input (samma referens) för billig idempotency-check.
 */
export function migrateScene(scene: Scene): SceneV6 {
  if (scene.version === 6) return scene;
  if (scene.version === 4 || scene.version === 5) {
    return {
      version: 6,
      plot: scene.plot,
      ...(scene.boundary != null ? { boundary: scene.boundary } : { boundary: null }),
      rectangles: scene.rectangles,
      plannedPlantIds: scene.plannedPlantIds,
    };
  }
  return {
    version: 6,
    plot: scene.plot,
    ...(scene.boundary != null ? { boundary: scene.boundary } : { boundary: null }),
    rectangles: scene.rectangles,
    plannedPlantIds: [],
  };
}
