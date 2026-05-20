import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PlantThumbnail } from "./primitives/PlantThumbnail.js";
const baseStyle = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    padding: "8px 12px 8px 9px",
    background: "transparent",
    border: 0,
    borderLeft: "3px solid transparent",
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "var(--font-sans)",
    color: "var(--ink-1)",
};
const activeStyle = {
    ...baseStyle,
    background: "var(--bed-100)",
    borderLeft: "3px solid var(--accent-bed)",
};
const nameStyle = {
    fontSize: 13,
    fontWeight: 500,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
};
const scientificStyle = {
    fontSize: 11,
    color: "var(--ink-2)",
    fontStyle: "italic",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
};
const badgeStyle = {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    color: "var(--ink-2)",
    fontVariantNumeric: "tabular-nums",
    flexShrink: 0,
};
export function PlantRow({ plant, active, onClick, badge, dim }) {
    const style = {
        ...(active ? activeStyle : baseStyle),
        opacity: dim ? 0.62 : 1,
        fontStyle: dim ? "italic" : "normal",
    };
    return (_jsxs("button", { type: "button", role: "option", "aria-selected": active, onClick: onClick, style: style, children: [_jsx(PlantThumbnail, { category: plant.category, size: 28, ...(plant.imageUrl !== undefined ? { imageUrl: plant.imageUrl } : {}) }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("div", { style: nameStyle, children: plant.commonName }), _jsx("div", { style: scientificStyle, children: plant.scientificName })] }), badge !== undefined && _jsx("span", { style: badgeStyle, children: badge })] }));
}
//# sourceMappingURL=PlantRow.js.map