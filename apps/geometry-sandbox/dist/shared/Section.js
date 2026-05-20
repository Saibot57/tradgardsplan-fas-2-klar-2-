import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { sectionTitleStyle } from "./SectionTitle.js";
const containerStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 10,
};
const accentContainerStyle = {
    ...containerStyle,
    background: "var(--bed-100)",
    border: "1px solid var(--line-1)",
    borderRadius: 8,
    padding: "16px 18px",
};
const headerStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
};
const titleClusterStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: "var(--ink-2)",
};
const dividerStyle = {
    height: 1,
    background: "var(--line-1)",
};
export function Section({ title, icon, action, accent, children }) {
    return (_jsxs("section", { style: accent ? accentContainerStyle : containerStyle, children: [_jsxs("div", { style: headerStyle, children: [_jsxs("div", { style: titleClusterStyle, children: [icon, _jsx("span", { style: { ...sectionTitleStyle, marginBottom: 0 }, children: title })] }), action ?? null] }), !accent && _jsx("div", { style: dividerStyle, "aria-hidden": "true" }), _jsx("div", { children: children })] }));
}
//# sourceMappingURL=Section.js.map