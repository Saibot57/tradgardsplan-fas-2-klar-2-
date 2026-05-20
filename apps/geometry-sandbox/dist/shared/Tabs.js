import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const tabBarStyle = {
    display: "inline-flex",
    alignItems: "stretch",
    gap: 4,
    fontFamily: "var(--font-sans)",
};
const tabBaseStyle = {
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
const tabActiveStyle = {
    ...tabBaseStyle,
    color: "var(--ink-1)",
};
const underlineStyle = {
    position: "absolute",
    left: 6,
    right: 6,
    bottom: 0,
    height: 2,
    borderRadius: 1,
    background: "var(--accent-bed)",
};
export function TabBar({ children, ariaLabel }) {
    return (_jsx("div", { role: "tablist", ...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {}), style: tabBarStyle, children: children }));
}
export function Tab({ active, onSelect, children, id, controls }) {
    return (_jsxs("button", { type: "button", role: "tab", "aria-selected": active, tabIndex: active ? 0 : -1, onClick: onSelect, ...(id !== undefined ? { id } : {}), ...(controls !== undefined ? { "aria-controls": controls } : {}), style: active ? tabActiveStyle : tabBaseStyle, children: [children, active && _jsx("span", { style: underlineStyle, "aria-hidden": "true" })] }));
}
//# sourceMappingURL=Tabs.js.map