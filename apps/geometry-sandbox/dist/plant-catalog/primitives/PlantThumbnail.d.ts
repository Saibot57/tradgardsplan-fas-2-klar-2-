/**
 * Square category-tinted thumbnail with a centered icon. Used in:
 *   - list rows (28 px)
 *   - detail card header (120 px)
 *   - thumb badges anywhere else (any size)
 *
 * Real photos arrive once product provides them — when `imageUrl` is set,
 * render the photo instead of the tinted glyph.
 */
import type { PlantCategory } from "../../plants/types.js";
interface PlantThumbnailProps {
    category: PlantCategory;
    size?: number;
    imageUrl?: string;
}
export declare function PlantThumbnail({ category, size, imageUrl }: PlantThumbnailProps): import("react/jsx-runtime").JSX.Element;
export {};
