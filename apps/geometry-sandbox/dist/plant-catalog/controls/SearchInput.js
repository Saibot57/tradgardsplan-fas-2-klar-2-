import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Compact search field with prefix icon and trailing clear button (×) that
 * appears once the user types anything.
 */
import { IconSearch, IconX } from "../../icons.js";
export function SearchInput({ value, onChange, placeholder = "Sök växt..." }) {
    return (_jsxs("div", { style: { position: "relative", display: "flex", alignItems: "center" }, children: [_jsx("span", { "aria-hidden": "true", style: {
                    position: "absolute",
                    left: 8,
                    color: "var(--ink-2)",
                    display: "flex",
                    alignItems: "center",
                    pointerEvents: "none",
                }, children: _jsx(IconSearch, { size: 14 }) }), _jsx("input", { type: "text", value: value, onChange: (e) => onChange(e.target.value), placeholder: placeholder, "data-pp-input": true, "aria-label": "S\u00F6k v\u00E4xt", style: {
                    width: "100%",
                    padding: "6px 28px 6px 28px",
                    fontSize: 13,
                } }), value.length > 0 && (_jsx("button", { type: "button", "aria-label": "Rensa s\u00F6kning", onClick: () => onChange(""), style: {
                    position: "absolute",
                    right: 4,
                    background: "transparent",
                    border: "none",
                    padding: 4,
                    cursor: "pointer",
                    color: "var(--ink-2)",
                    display: "flex",
                    alignItems: "center",
                }, children: _jsx(IconX, { size: 12 }) }))] }));
}
//# sourceMappingURL=SearchInput.js.map