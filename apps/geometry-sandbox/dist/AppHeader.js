import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Top-of-app strip: brand, tab navigation, theme toggle. Visible in both
 * tabs (Planera / Växter). Tabs follow the a11y pattern from
 * shared/Tabs.tsx (role=tablist + role=tab + aria-selected).
 */
import { IconMoon, IconSun } from "./icons.js";
import { Tab, TabBar } from "./shared/Tabs.js";
const headerStyle = {
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
const brandStyle = {
    display: "flex",
    alignItems: "center",
    gap: 8,
};
const brandLabelStyle = {
    fontFamily: "var(--font-display)",
    fontSize: 15,
    fontWeight: 500,
    letterSpacing: "-0.01em",
    color: "var(--ink-1)",
};
export function AppHeader({ activeTab, onTabChange, theme, onToggleTheme }) {
    return (_jsxs("header", { style: headerStyle, children: [_jsxs("div", { style: brandStyle, children: [_jsx("img", { src: "/logo-mark.svg", alt: "", style: { height: 20, display: "block" } }), _jsx("strong", { style: brandLabelStyle, children: "PlotPlaner" })] }), _jsxs(TabBar, { ariaLabel: "Huvudvy", children: [_jsx(Tab, { id: "tab-planera", controls: "tabpanel-planera", active: activeTab === "planera", onSelect: () => onTabChange("planera"), children: "Planera" }), _jsx(Tab, { id: "tab-vaxter", controls: "tabpanel-vaxter", active: activeTab === "vaxter", onSelect: () => onTabChange("vaxter"), children: "V\u00E4xter" })] }), _jsx("div", { style: { flex: 1 } }), _jsx("button", { "data-pp-btn": true, "data-variant": "ghost", "data-icon-only": "true", onClick: onToggleTheme, title: theme === "dark" ? "Byt till dagläge (paper)" : "Byt till kvällsläge (evening)", "aria-label": "Byt tema", children: theme === "dark" ? _jsx(IconSun, { size: 14 }) : _jsx(IconMoon, { size: 14 }) })] }));
}
//# sourceMappingURL=AppHeader.js.map