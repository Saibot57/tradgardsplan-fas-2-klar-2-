/**
 * Hand-rolled validator for the bundled `crops.json`. No external dep — the
 * sandbox keeps its dep surface tiny, matching the spatial-core convention.
 *
 * `parsePlantCatalog` rejects on the first error with a `PlantValidationError`
 * carrying the offending path (e.g. `plants[7].temperature`). Silent fallback
 * to `null` is forbidden — duplicates the no-tysta-fel policy from
 * `parseScene()` in spatial-core.
 */
import type { PlantCareProfile } from "./types.js";
export declare class PlantValidationError extends Error {
    readonly path: string | undefined;
    constructor(message: string, path?: string);
}
export declare function parsePlant(raw: unknown, index: number): PlantCareProfile;
export declare function parsePlantCatalog(raw: unknown): PlantCareProfile[];
/**
 * Load and validate the bundled `crops.json`. The result is cached after
 * the first call; subsequent calls return the same array reference.
 */
export declare function loadDefaultPlantCatalog(): PlantCareProfile[];
