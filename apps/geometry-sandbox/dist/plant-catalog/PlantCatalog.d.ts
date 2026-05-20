/**
 * Top-level for the Växter tab — flex row split into a fixed-width left
 * list and a scrollable right detail pane.
 */
import type { Rect } from "@kolonitradgard/spatial-core";
import type { PlantCareProfile } from "../plants/types.js";
interface PlantCatalogProps {
    plants: readonly PlantCareProfile[];
    beds: readonly Rect[];
    selectedPlantId: string | null;
    plannedPlantIds: readonly string[];
    onSelectPlant: (id: string | null) => void;
    onShowOnCanvas: (plantId: string) => void;
    onTogglePlan: (plantId: string) => void;
    onAddToBed: (plantId: string, bedId: string) => void;
}
export declare function PlantCatalog({ plants, beds, selectedPlantId, plannedPlantIds, onSelectPlant, onShowOnCanvas, onTogglePlan, onAddToBed, }: PlantCatalogProps): import("react/jsx-runtime").JSX.Element;
export {};
