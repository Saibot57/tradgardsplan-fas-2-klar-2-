/**
 * Spatial core types.
 *
 * All world-coordinates are millimeters (integers, see spatial_rules.md).
 * Angles are degrees, clockwise, around the rectangle's center.
 *
 * ADR-006: northRotationDeg describes how the solar reference frame
 * relates to world space. World space itself is NEVER rotated.
 */

/** A 2D point in world space. mm. */
export interface Point {
  x: number;
  y: number;
}

/** A 2D vector in world space. mm. */
export interface Vec2 {
  x: number;
  y: number;
}

/**
 * An axis-aligned rectangle. Used internally for AABB tests.
 * mm.
 */
export interface AABB {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Trädgårdsobjekt-typ (ADR-009, scene v3; "rabatt" tillagd scene v5;
 * "grass"/"paved"/"gravel"/"deck" tillagda scene v6).
 *
 * `kind` är valfri på Rect; saknas värdet tolkas objektet som "bed".
 * Värdet `"wall"` slås medvetet ihop med `"building"` — vi särskiljer dem
 * inte i v1.
 *
 * - "bed":      odlingsbädd (upphöjd/avgränsad). Plantbar, ingen skugga.
 * - "rabatt":   plantbar friland — markområde där växter kan planteras direkt.
 * - "building": byggnad. Ej plantbar, kastar skugga.
 * - "hedge":    häck. Ej plantbar, kastar skugga.
 * - "grass":    gräsmatta. Ej plantbar, ingen skugga.
 * - "paved":    stenlagd yta. Ej plantbar, ingen skugga.
 * - "gravel":   grusyta. Ej plantbar, ingen skugga.
 * - "deck":     trädäck. Ej plantbar, ingen skugga.
 * - "surface":  generisk yta (fallback). Ej plantbar, ingen skugga.
 */
export type ObjectKind =
  | "bed"
  | "rabatt"
  | "building"
  | "hedge"
  | "grass"
  | "paved"
  | "gravel"
  | "deck"
  | "surface";

/**
 * The primary spatial object in v1: an oriented (rotated) rectangle.
 *
 * - Position is the *center* (cx, cy), not a corner.
 * - rotationDeg is clockwise in world coordinates (y-down).
 * - wallHeight is used for shadow projection. 0 means no shadow.
 *
 * Terminology:
 * - width  = extent along the rectangle's local +X axis (before rotation)
 * - height = extent along the rectangle's local +Y axis (before rotation)
 * - wallHeight = vertical extrusion height for shadow casting (NOT rectangle height)
 */
export interface Rect {
  id: string;
  cx: number;     // center X in world space, mm (integer)
  cy: number;     // center Y in world space, mm (integer)
  width: number;  // local +X extent, mm (integer, > 0)
  height: number; // local +Y extent, mm (integer, > 0)
  rotationDeg: number; // clockwise degrees in world space
  /** Vertical wall/extrusion height in mm for shadow casting. 0 = no shadow. */
  wallHeight: number;
  /** Valfritt mänskligt namn (scene v2). */
  label?: string;
  /** Valfria fri-text-anteckningar (scene v2). */
  notes?: string;
  /** Objekttyp (scene v3). Saknas == "bed". Se ADR-009. */
  kind?: ObjectKind;
  /** Växter placerade i denna bädd (scene v4). Tomt eller saknat == inga växter. */
  plants?: PlantPlacement[];
  /**
   * Egendefinierad fyllnadsfärg (scene v6). Saknas == använd kind:s default.
   * Format: "#RRGGBB" (6 hex-tecken, små bokstäver ok). Validation sker i
   * scene.parseScene; canvas-renderaren applicerar färgen med alpha-blending.
   */
  color?: string;
  /**
   * Per-bädd jorddjup i mm (scene v7). Saknas == använd det globala
   * default-djupet (UI-state). Endast objekt med `hasSoil` använder fältet;
   * för övriga kinds ignoreras det. Skild från `wallHeight` (skuggextrudering).
   */
  soilDepthMm?: number;
}

/**
 * En växt placerad i en bädd. `offsetX`/`offsetY` är bädd-lokala mm
 * (origo i rect-center, samma axlar som worldToLocal). `count` är antalet
 * individer på platsen — alltid >= 1.
 *
 * Plain data: typen är ren scene-data som canonicaliseras vid serialize
 * (offset rundas till integer mm, count clampas till >= 1). Beteende lever
 * i sandbox-reducern, inte här.
 */
export interface PlantPlacement {
  placementId: string;
  /** PlantCareProfile.id (kebab-case scientific). */
  plantId: string;
  /** Visningsnamn för UI (oftast PlantCareProfile.commonName vid skapandet). */
  displayName: string;
  offsetX: number;
  offsetY: number;
  count: number;
}

/** A geographic location. */
export interface GeoLocation {
  latitudeDeg: number;
  longitudeDeg: number;
}

/** Sun position relative to the observer. */
export interface SunPosition {
  /** Radians above the horizon. <= 0 means the sun is below the horizon. */
  altitudeRad: number;
  /**
   * Radians, measured from south, clockwise (suncalc convention):
   * 0 = south, +π/2 = west, ±π = north, -π/2 = east.
   */
  azimuthRad: number;
}

/**
 * Plot-level metadata for geographic orientation.
 *
 * ADR-006: northRotationDeg rotates the solar reference frame,
 * NOT world coordinates.
 */
export interface PlotConfig {
  /** Degrees clockwise rotation of the solar reference frame. Default 0. */
  northRotationDeg: number;
  location: GeoLocation;
}

/** Default plot config: world +Y = geographic south, location = Landskrona. */
export const DEFAULT_PLOT_CONFIG: PlotConfig = {
  northRotationDeg: 0,
  location: {
    latitudeDeg: 55.8708,
    longitudeDeg: 12.83,
  },
};
