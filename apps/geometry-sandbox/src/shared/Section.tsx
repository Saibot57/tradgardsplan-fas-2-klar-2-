/**
 * Section block for the PlantDetailCard layout (and any future tall-form
 * surfaces that want the same anatomy):
 *
 *   [icon] TITLE TEXT                                  [optional action]
 *   ─── 1 px --line-1 ───
 *   children
 *
 * `accent` switches the wrapper to a sage-tinted card (used by the
 * "I min trädgård" section).
 */

import type { ReactNode } from "react";
import { sectionTitleStyle } from "./SectionTitle.js";

interface SectionProps {
  title: string;
  icon?: ReactNode;
  /** Right-aligned widget on the title row (e.g. a small toggle). */
  action?: ReactNode;
  /** Sage-tinted card variant. */
  accent?: boolean;
  children: ReactNode;
}

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const accentContainerStyle: React.CSSProperties = {
  ...containerStyle,
  background: "var(--bed-100)",
  border: "1px solid var(--line-1)",
  borderRadius: 8,
  padding: "16px 18px",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

const titleClusterStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  color: "var(--ink-2)",
};

const dividerStyle: React.CSSProperties = {
  height: 1,
  background: "var(--line-1)",
};

export function Section({ title, icon, action, accent, children }: SectionProps) {
  return (
    <section style={accent ? accentContainerStyle : containerStyle}>
      <div style={headerStyle}>
        <div style={titleClusterStyle}>
          {icon}
          <span style={{ ...sectionTitleStyle, marginBottom: 0 }}>{title}</span>
        </div>
        {action ?? null}
      </div>
      {!accent && <div style={dividerStyle} aria-hidden="true" />}
      <div>{children}</div>
    </section>
  );
}
