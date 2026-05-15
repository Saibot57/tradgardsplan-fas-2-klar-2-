/**
 * Horizontal range visualization. Renders a viewport `[scaleMin, scaleMax]`
 * with the plant's `[min, max]` interval highlighted as an accent-colored
 * fill on top of a muted track. Tick marks + numeric labels mark `min` and
 * `max`; small mono anchor labels mark `scaleMin` / `scaleMax` underneath.
 *
 * Math is in `clampPercent` so it can be unit-tested without rendering.
 */

import { fmtInt } from "../../format.js";

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
export function clampPercent(value: number, scaleMin: number, scaleMax: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(scaleMin) || !Number.isFinite(scaleMax)) {
    return 0;
  }
  if (scaleMax === scaleMin) return 0;
  const t = (value - scaleMin) / (scaleMax - scaleMin);
  if (t <= 0) return 0;
  if (t >= 1) return 100;
  return t * 100;
}

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  marginTop: 6,
};

const trackWrapperStyle: React.CSSProperties = {
  position: "relative",
  height: 16,
};

const mutedTrackStyle: React.CSSProperties = {
  position: "absolute",
  top: 6,
  left: 0,
  right: 0,
  height: 4,
  background: "var(--line-1)",
  borderRadius: 2,
};

const tickLabelsRowStyle: React.CSSProperties = {
  position: "relative",
  height: 14,
};

const anchorRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  fontFamily: "var(--font-mono)",
  fontSize: 10,
  color: "var(--ink-3)",
  fontVariantNumeric: "tabular-nums",
};

const tickLabelStyle: React.CSSProperties = {
  position: "absolute",
  transform: "translateX(-50%)",
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  color: "var(--ink-1)",
  fontVariantNumeric: "tabular-nums",
  whiteSpace: "nowrap",
};

export function RangeBar({
  min,
  max,
  scaleMin,
  scaleMax,
  unit,
  format = fmtInt,
  accent = "var(--accent-bed)",
}: RangeBarProps) {
  const minPct = clampPercent(min, scaleMin, scaleMax);
  const maxPct = clampPercent(max, scaleMin, scaleMax);
  const left = Math.min(minPct, maxPct);
  const width = Math.abs(maxPct - minPct);

  const fillStyle: React.CSSProperties = {
    position: "absolute",
    top: 5,
    left: `${left}%`,
    width: `${width}%`,
    height: 6,
    background: accent,
    borderRadius: 3,
  };

  const tickStyle = (pct: number): React.CSSProperties => ({
    position: "absolute",
    top: 0,
    left: `${pct}%`,
    width: 1,
    height: 16,
    background: "var(--ink-1)",
    transform: "translateX(-0.5px)",
  });

  return (
    <div style={containerStyle}>
      <div style={trackWrapperStyle}>
        <div style={mutedTrackStyle} aria-hidden="true" />
        <div style={fillStyle} aria-hidden="true" />
        <div style={tickStyle(minPct)} aria-hidden="true" />
        <div style={tickStyle(maxPct)} aria-hidden="true" />
      </div>
      <div style={tickLabelsRowStyle} aria-hidden="true">
        <span style={{ ...tickLabelStyle, left: `${minPct}%` }}>{format(min)}</span>
        <span style={{ ...tickLabelStyle, left: `${maxPct}%` }}>{format(max)}</span>
      </div>
      <div style={anchorRowStyle} aria-hidden="true">
        <span>
          {format(scaleMin)}
          {unit}
        </span>
        <span>
          {format(scaleMax)}
          {unit}
        </span>
      </div>
    </div>
  );
}
