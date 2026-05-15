/**
 * Pure search & filter functions over a `PlantCareProfile[]`. No state,
 * no bed-awareness — bed-side derivations (planted summary, in-garden ids)
 * live in `selectors/plantSelectors.ts` once the UI lands.
 */

import type { PlantCareProfile, PlantCategory } from "./types.js";
import { parseSunCategory, type SunCategoryToken } from "./format.js";

export const MIN_QUERY_LENGTH = 2;

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
export function matchesQuery(plant: PlantCareProfile, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (needle.length < MIN_QUERY_LENGTH) return true;
  if (plant.commonName.toLowerCase().includes(needle)) return true;
  if (plant.commonNameEn && plant.commonNameEn.toLowerCase().includes(needle)) return true;
  if (plant.scientificName.toLowerCase().includes(needle)) return true;
  return false;
}

export function matchesCategory(plant: PlantCareProfile, category: CategoryFilter): boolean {
  if (category === "all") return true;
  return plant.category === category;
}

export function matchesSun(plant: PlantCareProfile, sun: SunFilter): boolean {
  if (sun === "all") return true;
  return parseSunCategory(plant.sunCategory).includes(sun);
}

export function applyPlantFilters(
  plants: readonly PlantCareProfile[],
  filters: PlantFilters,
): PlantCareProfile[] {
  const query = filters.query ?? "";
  const category = filters.category ?? "all";
  const sun = filters.sun ?? "all";
  return plants.filter(
    (p) => matchesQuery(p, query) && matchesCategory(p, category) && matchesSun(p, sun),
  );
}

const SV_COLLATOR = new Intl.Collator("sv");

/** Stable copy sorted by Swedish locale comparison of `commonName`. */
export function sortByCommonName(plants: readonly PlantCareProfile[]): PlantCareProfile[] {
  return [...plants].sort((a, b) => SV_COLLATOR.compare(a.commonName, b.commonName));
}
