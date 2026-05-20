import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Horizontal range visualization. Renders a viewport `[scaleMin, scaleMax]`
 * with the plant's `[min, max]` interval highlighted as an accent-colored
 * fill on top of a muted track. Tick marks + numeric labels mark `min` and
 * `max`; small mono anchor labels mark `scaleMin` / `scaleMax` underneath.
 *
 * Math is in `clampPercent` so it can be unit-tested without rendering.
 */
import { fmtInt } from "../../format.js";
/**
 * Map a `value` inside `[scaleMin, scaleMax]` to a 0–100 percentage.
 * Out-of-range values are clamped. Returns 0 when the scale is degenerate
 * (scaleMin === scaleMax) so the caller doesn't blow up on bad data.
 */
export function clampPercent(value, scaleMin, scaleMax) {
    if (!Number.isFinite(value) || !Number.isFinite(scaleMin) || !Number.isFinite(scaleMax)) {
        return 0;
    }
    if (scaleMax === scaleMin)
        return 0;
    const t = (value - scaleMin) / (scaleMax - scaleMin);
    if (t <= 0)
        return 0;
    if (t >= 1)
        return 100;
    return t * 100;
}
const containerStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginTop: 6,
};
const trackWrapperStyle = {
    position: "relative",
    height: 16,
};
const mutedTrackStyle = {
    position: "absolute",
    top: 6,
    left: 0,
    right: 0,
    height: 4,
    background: "var(--line-1)",
    borderRadius: 2,
};
const tickLabelsRowStyle = {
    position: "relative",
    height: 14,
};
const anchorRowStyle = {
    display: "flex",
    justifyContent: "space-between",
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: "var(--ink-3)",
    fontVariantNumeric: "tabular-nums",
};
const tickLabelStyle = {
    position: "absolute",
    transform: "translateX(-50%)",
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    color: "var(--ink-1)",
    fontVariantNumeric: "tabular-nums",
    whiteSpace: "nowrap",
};
export function RangeBar({ min, max, scaleMin, scaleMax, unit, format = fmtInt, accent = "var(--accent-bed)", }) {
    const minPct = clampPercent(min, scaleMin, scaleMax);
    const maxPct = clampPercent(max, scaleMin, scaleMax);
    const left = Math.min(minPct, maxPct);
    const width = Math.abs(maxPct - minPct);
    const fillStyle = {
        position: "absolute",
        top: 5,
        left: `${left}%`,
        width: `${width}%`,
        height: 6,
        background: accent,
        borderRadius: 3,
    };
    const tickStyle = (pct) => ({
        position: "absolute",
        top: 0,
        left: `${pct}%`,
        width: 1,
        height: 16,
        background: "var(--ink-1)",
        transform: "translateX(-0.5px)",
    });
    return (_jsxs("div", { style: containerStyle, children: [_jsxs("div", { style: trackWrapperStyle, children: [_jsx("div", { style: mutedTrackStyle, "aria-hidden": "true" }), _jsx("div", { style: fillStyle, "aria-hidden": "true" }), _jsx("div", { style: tickStyle(minPct), "aria-hidden": "true" }), _jsx("div", { style: tickStyle(maxPct), "aria-hidden": "true" })] }), _jsxs("div", { style: tickLabelsRowStyle, "aria-hidden": "true", children: [_jsx("span", { style: { ...tickLabelStyle, left: `${minPct}%` }, children: format(min) }), _jsx("span", { style: { ...tickLabelStyle, left: `${maxPct}%` }, children: format(max) })] }), _jsxs("div", { style: anchorRowStyle, "aria-hidden": "true", children: [_jsxs("span", { children: [format(scaleMin), unit] }), _jsxs("span", { children: [format(scaleMax), unit] })] })] }));
}
//# sourceMappingURL=RangeBar.js.map