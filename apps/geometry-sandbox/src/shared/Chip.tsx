/**
 * Small chip used for filter toggles in the catalog and for static
 * category badges. Clickable when `onToggle` is provided; static label
 * otherwise.
 */

import type { ReactNode } from "react";

const baseStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "3px 10px",
  borderRadius: 999,
  border: "1px solid var(--line-1)",
  background: "transparent",
  color: "var(--ink-2)",
  fontFamily: "var(--font-sans)",
  fontSize: 12,
  letterSpacing: "0.02em",
  lineHeight: 1.4,
  whiteSpace: "nowrap",
  cursor: "default",
  appearance: "none",
};

const interactiveStyle: React.CSSProperties = {
  ...baseStyle,
  cursor: "pointer",
};

const activeStyle: React.CSSProperties = {
  ...interactiveStyle,
  background: "var(--accent-bed)",
  borderColor: "var(--accent-bed)",
  color: "var(--bg-surface)",
};

interface ChipProps {
  children: ReactNode;
  /** When provided, the chip is clickable and uses the active visual. */
  onToggle?: () => void;
  active?: boolean;
  /** Static-only override for callers that want a fixed visual (e.g. a category badge). */
  tone?: "muted" | "accent";
}

export function Chip({ children, onToggle, active, tone }: ChipProps) {
  if (onToggle) {
    return (
      <button
        type="button"
        aria-pressed={!!active}
        onClick={onToggle}
        style={active ? activeStyle : interactiveStyle}
      >
        {children}
      </button>
    );
  }
  const style =
    tone === "accent"
      ? { ...baseStyle, background: "var(--bed-100)", borderColor: "var(--accent-bed)", color: "var(--ink-1)" }
      : baseStyle;
  return <span style={style}>{children}</span>;
}
