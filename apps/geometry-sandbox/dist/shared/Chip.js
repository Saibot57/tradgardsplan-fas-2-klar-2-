import { jsx as _jsx } from "react/jsx-runtime";
const baseStyle = {
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
const interactiveStyle = {
    ...baseStyle,
    cursor: "pointer",
};
const activeStyle = {
    ...interactiveStyle,
    background: "var(--accent-bed)",
    borderColor: "var(--accent-bed)",
    color: "var(--bg-surface)",
};
export function Chip({ children, onToggle, active, tone }) {
    if (onToggle) {
        return (_jsx("button", { type: "button", "aria-pressed": !!active, onClick: onToggle, style: active ? activeStyle : interactiveStyle, children: children }));
    }
    const style = tone === "accent"
        ? { ...baseStyle, background: "var(--bed-100)", borderColor: "var(--accent-bed)", color: "var(--ink-1)" }
        : baseStyle;
    return _jsx("span", { style: style, children: children });
}
//# sourceMappingURL=Chip.js.map