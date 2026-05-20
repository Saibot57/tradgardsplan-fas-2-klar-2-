/**
 * Left panel of the catalog. Three stacked sections:
 *
 *   1. Mina växter  — plants present in at least one bed.plants[]
 *   2. Planerade    — plannedPlantIds minus inGardenIds
 *   3. Alla växter  — full catalog, filtered by search/category/sun
 *
 * Search field and filter chips sit between Planerade and Alla.
 * Selection lives on the parent — we only emit `onSelectPlant`.
 */
import type { Rect } from "@kolonitradgard/spatial-core";
import type { PlantCareProfile } from "../plants/types.js";
interface PlantListProps {
    plants: readonly PlantCareProfile[];
    beds: readonly Rect[];
    selectedPlantId: string | null;
    plannedPlantIds: readonly string[];
    onSelectPlant: (id: string) => void;
}
export declare function PlantList({ plants, beds, selectedPlantId, plannedPlantIds, onSelectPlant, }: PlantListProps): import("react/jsx-runtime").JSX.Element;
export {};
