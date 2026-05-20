/**
 * Pure helpers for the "+ Lägg till i bädd ▾" dropdown.
 *
 * Filtering and option-formatting are split out so they can be unit-tested
 * without a DOM. The actual menu component sits next to this file.
 */
import { type Rect } from "@kolonitradgard/spatial-core";
/**
 * Rectangles that the user can plant into. Inkluderar både `kind === "bed"`
 * (odlingsbädd, eller default när kind saknas) och `kind === "rabatt"`
 * (plantbar friland — scene v5). Buildings, hedges och surfaces exkluderas.
 *
 * Funktionsnamnet behålls trots utvidgningen — "bed" i denna kontext betyder
 * "plantbar yta", inte specifikt en odlingsbädd.
 */
export declare function bedsAvailableForPlanting(rectangles: readonly Rect[]): Rect[];
export interface BedOption {
    id: string;
    /** Display label — `bed.label` if set, otherwise `bed.id`. */
    label: string;
    /** Dimensions formatted as "WxH mm" without thin-spaces (compact). */
    dims: string;
}
/**
 * Render-ready summary of a bed. Dimensions are integer-rounded.
 */
export declare function formatBedOption(bed: Rect): BedOption;
