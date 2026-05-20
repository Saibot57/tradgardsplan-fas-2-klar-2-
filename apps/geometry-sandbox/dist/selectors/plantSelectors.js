/**
 * Bed-aware derivations over the spatial state's `rectangles`. These are
 * the bridge between the spatial world (Rect[] with optional plants[]) and
 * the plant catalog UI.
 *
 * All pure. No memoization here — callers wrap in useMemo at the React
 * boundary if needed.
 */
/** Set of plantIds that appear in at least one bed's `plants[]`. */
export function inGardenIds(beds) {
    const ids = new Set();
    for (const bed of beds) {
        if (!bed.plants)
            continue;
        for (const p of bed.plants)
            ids.add(p.plantId);
    }
    return ids;
}
/**
 * Aggregate planting summary for one plantId:
 *   bedCount = number of beds that hold this plant
 *   total    = sum of `count` across those beds
 */
export function plantedSummary(beds, plantId) {
    let bedCount = 0;
    let total = 0;
    for (const bed of beds) {
        if (!bed.plants)
            continue;
        let present = false;
        for (const p of bed.plants) {
            if (p.plantId === plantId) {
                total += p.count;
                present = true;
            }
        }
        if (present)
            bedCount += 1;
    }
    return { bedCount, total };
}
/**
 * First bed (in array order) that contains a placement of `plantId`,
 * or `null` when no bed contains it. Used by `showPlantOnCanvas` to
 * pick a selection target.
 */
export function firstBedFor(beds, plantId) {
    for (const bed of beds) {
        if (bed.plants?.some((p) => p.plantId === plantId))
            return bed;
    }
    return null;
}
//# sourceMappingURL=plantSelectors.js.map