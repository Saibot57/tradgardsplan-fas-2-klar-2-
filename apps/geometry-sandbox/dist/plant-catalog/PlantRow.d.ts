/**
 * One row in the catalog list. Renders a thumbnail, common + scientific
 * names, and an optional right-aligned badge (e.g. "×3" total count).
 *
 * `dim` (italic, faded) is used for the "Planerade" section.
 */
import type { PlantCareProfile } from "../plants/types.js";
interface PlantRowProps {
    plant: PlantCareProfile;
    active: boolean;
    onClick: () => void;
    badge?: string;
    dim?: boolean;
}
export declare function PlantRow({ plant, active, onClick, badge, dim }: PlantRowProps): import("react/jsx-runtime").JSX.Element;
export {};
