/**
 * Pure helpers for the "+ Lägg till i bädd ▾" dropdown.
 *
 * Filtering and option-formatting are split out so they can be unit-tested
 * without a DOM. The actual menu component sits next to this file.
 */

import { getKind, type Rect } from "@kolonitradgard/spatial-core";

/**
 * Rectangles that the user can plant into. A rect counts as a bed when
 * `getKind(rect) === "bed"` — i.e. either `kind === "bed"` or `kind`
 * absent (default). Buildings, hedges, and surfaces are excluded.
 */
export function bedsAvailableForPlanting(rectangles: readonly Rect[]): Rect[] {
  return rectangles.filter((r) => getKind(r) === "bed");
}

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
export function formatBedOption(bed: Rect): BedOption {
  const w = Math.round(bed.width);
  const h = Math.round(bed.height);
  return {
    id: bed.id,
    label: bed.label && bed.label.length > 0 ? bed.label : bed.id,
    dims: `${w}×${h} mm`,
  };
}
