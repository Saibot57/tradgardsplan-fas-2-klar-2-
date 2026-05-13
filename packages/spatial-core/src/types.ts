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
