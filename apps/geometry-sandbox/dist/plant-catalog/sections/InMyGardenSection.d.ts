/**
 * "I min trädgård" — visible only when the plant is placed in at least one
 * bed OR present in plannedPlantIds. Planted state takes priority over
 * planned in the copy (handoff §5).
 */
import type { Rect } from "@kolonitradgard/spatial-core";
import type { PlantCareProfile } from "../../plants/types.js";
interface InMyGardenSectionProps {
    plant: PlantCareProfile;
    beds: readonly Rect[];
    plannedPlantIds: readonly string[];
    onShowOnCanvas: (plantId: string) => void;
}
export declare function InMyGardenSection({ plant, beds, plannedPlantIds, onShowOnCanvas, }: InMyGardenSectionProps): import("react/jsx-runtime").JSX.Element | null;
export {};
