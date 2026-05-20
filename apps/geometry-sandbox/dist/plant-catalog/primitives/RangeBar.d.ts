/**
 * Horizontal range visualization. Renders a viewport `[scaleMin, scaleMax]`
 * with the plant's `[min, max]` interval highlighted as an accent-colored
 * fill on top of a muted track. Tick marks + numeric labels mark `min` and
 * `max`; small mono anchor labels mark `scaleMin` / `scaleMax` underneath.
 *
 * Math is in `clampPercent` so it can be unit-tested without rendering.
 */
interface RangeBarProps {
    /** Plant's acceptable range floor. */
    min: number;
    /** Plant's acceptable range ceiling. */
    max: number;
    /** Visual viewport floor (e.g. 0 lux). */
    scaleMin: number;
    /** Visual viewport ceiling (e.g. 60 000 lux). */
    scaleMax: number;
    /** Unit suffix; recommended to include the leading space (e.g. " lux"). */
    unit: string;
    /** Tick label formatter. Defaults to `fmtInt` (thin-space thousands). */
    format?: (n: number) => string;
    /** CSS color for the in-range fill. Defaults to `--accent-bed`. */
    accent?: string;
}
/**
 * Map a `value` inside `[scaleMin, scaleMax]` to a 0–100 percentage.
 * Out-of-range values are clamped. Returns 0 when the scale is degenerate
 * (scaleMin === scaleMax) so the caller doesn't blow up on bad data.
 */
export declare function clampPercent(value: number, scaleMin: number, scaleMax: number): number;
export declare function RangeBar({ min, max, scaleMin, scaleMax, unit, format, accent, }: RangeBarProps): import("react/jsx-runtime").JSX.Element;
export {};
