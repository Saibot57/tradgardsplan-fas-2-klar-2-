/**
 * Top-of-app strip: brand, tab navigation, theme toggle. Visible in both
 * tabs (Planera / Växter). Tabs follow the a11y pattern from
 * shared/Tabs.tsx (role=tablist + role=tab + aria-selected).
 */

import type { ReactNode } from "react";
import { IconMoon, IconSun } from "./icons.js";
import { Tab, TabBar } from "./shared/Tabs.js";
import type { ActiveTab } from "./state.js";

interface AppHeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  /** Scen-meny (namngivna scener) — visas i topbaren bredvid varumärket. */
  sceneMenu?: ReactNode;
}

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 24,
  padding: "0 18px",
  height: 48,
  flexShrink: 0,
  background: "var(--bg-surface)",
  borderBottom: "1px solid var(--line-1)",
  fontFamily: "var(--font-sans)",
};

const brandStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const brandLabelStyle: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: 15,
  fontWeight: 500,
  letterSpacing: "-0.01em",
  color: "var(--ink-1)",
};

export function AppHeader({
  activeTab,
  onTabChange,
  theme,
  onToggleTheme,
  sceneMenu,
}: AppHeaderProps) {
  return (
    <header style={headerStyle}>
      <div style={brandStyle}>
        <img src="/logo-mark.svg" alt="" style={{ height: 20, display: "block" }} />
        <strong style={brandLabelStyle}>PlotPlaner</strong>
      </div>
      {sceneMenu}
      <TabBar ariaLabel="Huvudvy">
        <Tab
          id="tab-planera"
          controls="tabpanel-planera"
          active={activeTab === "planera"}
          onSelect={() => onTabChange("planera")}
        >
          Planera
        </Tab>
        <Tab
          id="tab-vaxter"
          controls="tabpanel-vaxter"
          active={activeTab === "vaxter"}
          onSelect={() => onTabChange("vaxter")}
        >
          Växter
        </Tab>
      </TabBar>
      <div style={{ flex: 1 }} />
      <button
        data-pp-btn
        data-variant="ghost"
        data-icon-only="true"
        onClick={onToggleTheme}
        title={theme === "dark" ? "Byt till dagläge (paper)" : "Byt till kvällsläge (evening)"}
        aria-label="Byt tema"
      >
        {theme === "dark" ? <IconSun size={14} /> : <IconMoon size={14} />}
      </button>
    </header>
  );
}
