/**
 * Pure helpers for the realtime measurement overlay drawn during drag/resize.
 *
 * These produce the data the canvas needs (point pairs + distance values) so
 * the render code stays a thin formatter. Keeping them DOM-free makes them
 * unit-testable in isolation.
 */

import {
  closestPointsBetweenRects,
  distancesToBoundaryEdges,
  obbDistance,
  type Point,
  type Rect,
} from "@kolonitradgard/spatial-core";

export interface NeighborMeasurement {
  /** The other rect's id — for stable rendering and tests. */
  otherId: string;
  pA: Point;
  pB: Point;
  distanceMm: number;
}

export interface BoundaryMeasurements {
  /** Perpendicular distances to each boundary edge in boundary-local frame. */
  n: number;
  e: number;
  s: number;
  w: number;
}

/**
 * Avstånds-streck till andra objekt under drag/resize.
 *
 * - `primary` är rektangeln användaren manipulerar
 * - `others` är alla andra rectanglar (måste filtreras från primary av anroparen)
 * - `thresholdMm` bestämmer vilket maxavstånd som inkluderas. När
 *   `showAll === true` ignoreras threshold och alla separerade par returneras.
 * - Overlappande grannar (negativ obbDistance) inkluderas alltid när de
 *   är inom (eller passerar) threshold, eftersom överlapp är ett hjälpsamt
 *   visuellt varningstecken.
 */
export function computeNeighborMeasurements(
  primary: Rect,
  others: readonly Rect[],
  thresholdMm: number,
  showAll: boolean = false,
): NeighborMeasurement[] {
  const out: NeighborMeasurement[] = [];
  for (const other of others) {
    if (other.id === primary.id) continue;
    const distance = obbDistance(primary, other);
    if (!showAll && distance > thresholdMm) continue;
    const { pA, pB } = closestPointsBetweenRects(primary, other);
    out.push({ otherId: other.id, pA, pB, distanceMm: distance });
  }
  return out;
}

/**
 * Avstånd från `primary` till tomtgränsens 4 kanter.
 *
 * Returnerar `null` om ingen boundary är satt. Annars de fyra perpendikulära
 * avstånden i boundary-lokal frame (se {@link distancesToBoundaryEdges}).
 */
export function computeBoundaryMeasurements(
  primary: Rect,
  boundary: Rect | null,
): BoundaryMeasurements | null {
  if (!boundary) return null;
  return distancesToBoundaryEdges(primary, boundary);
}

/** Default threshold för grann-mått under drag (mm). */
export const NEIGHBOR_DISTANCE_THRESHOLD_MM = 2000;
