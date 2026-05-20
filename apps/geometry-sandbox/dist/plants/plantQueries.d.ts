/**
 * Pure search & filter functions over a `PlantCareProfile[]`. No state,
 * no bed-awareness — bed-side derivations (planted summary, in-garden ids)
 * live in `selectors/plantSelectors.ts` once the UI lands.
 */
import type { PlantCareProfile, PlantCategory } from "./types.js";
import { type SunCategoryToken } from "./format.js";
export declare const MIN_QUERY_LENGTH = 2;
export type CategoryFilter = PlantCategory | "all";
export type SunFilter = SunCategoryToken | "all";
export interface PlantFilters {
    query?: string;
    category?: CategoryFilter;
    sun?: SunFilter;
}
/**
 * Substring match (case-insensitive) on Swedish, English, or scientific
 * name. Queries shorter than `MIN_QUERY_LENGTH` are treated as no-op
 * (match everything).
 */
export declare function matchesQuery(plant: PlantCareProfile, query: string): boolean;
export declare function matchesCategory(plant: PlantCareProfile, category: CategoryFilter): boolean;
export declare function matchesSun(plant: PlantCareProfile, sun: SunFilter): boolean;
export declare function applyPlantFilters(plants: readonly PlantCareProfile[], filters: PlantFilters): PlantCareProfile[];
/** Stable copy sorted by Swedish locale comparison of `commonName`. */
export declare function sortByCommonName(plants: readonly PlantCareProfile[]): PlantCareProfile[];
