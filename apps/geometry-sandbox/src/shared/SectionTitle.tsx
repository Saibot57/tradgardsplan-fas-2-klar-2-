/**
 * The standalone uppercase section title used in SidePanel sections.
 * For a richer block with icon + hairline + children, use `<Section>`.
 */

import type { ReactNode } from "react";

export const sectionTitleStyle: React.CSSProperties = {
  fontSize: 11.5,
  color: "var(--ink-2)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontWeight: 500,
  marginBottom: 6,
};

export function SectionTitle({ children }: { children: ReactNode }) {
  return <div style={sectionTitleStyle}>{children}</div>;
}
