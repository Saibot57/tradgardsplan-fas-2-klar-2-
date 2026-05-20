/**
 * Right panel of the catalog. Header + the seven detail sections from
 * handoff §5. Mutation buttons (Planera toggle, Lägg till i bädd ▾) are
 * deferred to step 7; "Visa på canvas →" lives inside InMyGardenSection
 * and is just navigation (no mutation).
 */
import type { Rect } from "@kolonitradgard/spatial-core";
import type { PlantCareProfile } from "../plants/types.js";
interface PlantDetailCardProps {
    plant: PlantCareProfile;
    beds: readonly Rect[];
    plannedPlantIds: readonly string[];
    onShowOnCanvas: (plantId: string) => void;
    onTogglePlan: (plantId: string) => void;
    onAddToBed: (plantId: string, bedId: string) => void;
}
export declare function PlantDetailCard({ plant, beds, plannedPlantIds, onShowOnCanvas, onTogglePlan, onAddToBed, }: PlantDetailCardProps): import("react/jsx-runtime").JSX.Element;
export {};
