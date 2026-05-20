import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const rowStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 12,
    padding: "5px 0",
};
export const rowLabelStyle = {
    fontSize: 11.5,
    color: "var(--ink-2)",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    fontWeight: 500,
};
export const rowValueStyle = {
    fontFamily: "var(--font-mono)",
    fontSize: 13.5,
    color: "var(--ink-1)",
    fontVariantNumeric: "tabular-nums",
    textAlign: "right",
};
export function Row({ label, value }) {
    return (_jsxs("div", { style: rowStyle, children: [_jsx("div", { style: rowLabelStyle, children: label }), _jsx("div", { style: rowValueStyle, children: value })] }));
}
//# sourceMappingURL=Row.js.map