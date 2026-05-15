/**
 * Label-on-left, mono-value-on-right row. Lifted from SidePanel.tsx so the
 * Bädd-inspektor and the upcoming PlantDetailCard share the exact visual.
 */

import type { ReactNode } from "react";

export const rowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  gap: 12,
  padding: "5px 0",
};

export const rowLabelStyle: React.CSSProperties = {
  fontSize: 11.5,
  color: "var(--ink-2)",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  fontWeight: 500,
};

export const rowValueStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 13.5,
  color: "var(--ink-1)",
  fontVariantNumeric: "tabular-nums",
  textAlign: "right",
};

export function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={rowStyle}>
      <div style={rowLabelStyle}>{label}</div>
      <div style={rowValueStyle}>{value}</div>
    </div>
  );
}
