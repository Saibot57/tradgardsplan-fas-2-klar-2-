/**
 * Bed-aware derivations over the spatial state's `rectangles`. These are
 * the bridge between the spatial world (Rect[] with optional plants[]) and
 * the plant catalog UI.
 *
 * All pure. No memoization here — callers wrap in useMemo at the React
 * boundary if needed.
 */
import type { Rect } from "@kolonitradgard/spatial-core";
/** Set of plantIds that appear in at least one bed's `plants[]`. */
export declare function inGardenIds(beds: readonly Rect[]): Set<string>;
/**
 * Aggregate planting summary for one plantId:
 *   bedCount = number of beds that hold this plant
 *   total    = sum of `count` across those beds
 */
export declare function plantedSummary(beds: readonly Rect[], plantId: string): {
    bedCount: number;
    total: number;
};
/**
 * First bed (in array order) that contains a placement of `plantId`,
 * or `null` when no bed contains it. Used by `showPlantOnCanvas` to
 * pick a selection target.
 */
export declare function firstBedFor(beds: readonly Rect[], plantId: string): Rect | null;
