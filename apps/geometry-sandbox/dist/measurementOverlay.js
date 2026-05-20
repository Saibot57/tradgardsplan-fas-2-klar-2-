/**
 * Pure helpers for the realtime measurement overlay drawn during drag/resize.
 *
 * These produce the data the canvas needs (point pairs + distance values) so
 * the render code stays a thin formatter. Keeping them DOM-free makes them
 * unit-testable in isolation.
 */
import { closestPointsBetweenRects, distancesToBoundaryEdges, obbDistance, } from "@kolonitradgard/spatial-core";
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
export function computeNeighborMeasurements(primary, others, thresholdMm, showAll = false) {
    const out = [];
    for (const other of others) {
        if (other.id === primary.id)
            continue;
        const distance = obbDistance(primary, other);
        if (!showAll && distance > thresholdMm)
            continue;
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
export function computeBoundaryMeasurements(primary, boundary) {
    if (!boundary)
        return null;
    return distancesToBoundaryEdges(primary, boundary);
}
/** Default threshold för grann-mått under drag (mm). */
export const NEIGHBOR_DISTANCE_THRESHOLD_MM = 2000;
//# sourceMappingURL=measurementOverlay.js.map