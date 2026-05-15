/**
 * Tab primitives for the app's top-level navigation (Planera / Växter).
 * A11y per handoff §11: role="tablist" on container, role="tab" +
 * aria-selected on each tab. Active tab is marked with a `--accent-bed`
 * underline.
 */

import type { ReactNode } from "react";

const tabBarStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "stretch",
  gap: 4,
  fontFamily: "var(--font-sans)",
};

const tabBaseStyle: React.CSSProperties = {
  position: "relative",
  appearance: "none",
  background: "transparent",
  border: "none",
  padding: "10px 14px 12px",
  fontSize: 13,
  fontWeight: 500,
  color: "var(--ink-2)",
  cursor: "pointer",
  letterSpacing: "0.02em",
  lineHeight: 1.1,
};

const tabActiveStyle: React.CSSProperties = {
  ...tabBaseStyle,
  color: "var(--ink-1)",
};

const underlineStyle: React.CSSProperties = {
  position: "absolute",
  left: 6,
  right: 6,
  bottom: 0,
  height: 2,
  borderRadius: 1,
  background: "var(--accent-bed)",
};

interface TabBarProps {
  children: ReactNode;
  /** Accessible name for the tablist, e.g. "Huvudvy". */
  ariaLabel?: string;
}

export function TabBar({ children, ariaLabel }: TabBarProps) {
  return (
    <div
      role="tablist"
      {...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {})}
      style={tabBarStyle}
    >
      {children}
    </div>
  );
}

interface TabProps {
  active: boolean;
  onSelect: () => void;
  children: ReactNode;
  /** Optional id, lets aria-controls in callers point at the tabpanel. */
  id?: string;
  controls?: string;
}

export function Tab({ active, onSelect, children, id, controls }: TabProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      tabIndex={active ? 0 : -1}
      onClick={onSelect}
      {...(id !== undefined ? { id } : {})}
      {...(controls !== undefined ? { "aria-controls": controls } : {})}
      style={active ? tabActiveStyle : tabBaseStyle}
    >
      {children}
      {active && <span style={underlineStyle} aria-hidden="true" />}
    </button>
  );
}
