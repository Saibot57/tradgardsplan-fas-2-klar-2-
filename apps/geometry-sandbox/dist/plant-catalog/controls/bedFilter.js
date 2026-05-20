/**
 * Pure helpers for the "+ Lägg till i bädd ▾" dropdown.
 *
 * Filtering and option-formatting are split out so they can be unit-tested
 * without a DOM. The actual menu component sits next to this file.
 */
import { getKind } from "@kolonitradgard/spatial-core";
/**
 * Rectangles that the user can plant into. Inkluderar både `kind === "bed"`
 * (odlingsbädd, eller default när kind saknas) och `kind === "rabatt"`
 * (plantbar friland — scene v5). Buildings, hedges och surfaces exkluderas.
 *
 * Funktionsnamnet behålls trots utvidgningen — "bed" i denna kontext betyder
 * "plantbar yta", inte specifikt en odlingsbädd.
 */
export function bedsAvailableForPlanting(rectangles) {
    return rectangles.filter((r) => {
        const k = getKind(r);
        return k === "bed" || k === "rabatt";
    });
}
/**
 * Render-ready summary of a bed. Dimensions are integer-rounded.
 */
export function formatBedOption(bed) {
    const w = Math.round(bed.width);
    const h = Math.round(bed.height);
    return {
        id: bed.id,
        label: bed.label && bed.label.length > 0 ? bed.label : bed.id,
        dims: `${w}×${h} mm`,
    };
}
//# sourceMappingURL=bedFilter.js.map