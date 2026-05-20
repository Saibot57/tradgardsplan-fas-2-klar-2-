import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Default state of the right panel when no plant is selected.
 */
import { IconLeaf } from "../icons.js";
export function PlantDetailEmpty() {
    return (_jsxs("div", { style: {
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            color: "var(--ink-2)",
            fontFamily: "var(--font-sans)",
            padding: 32,
            textAlign: "center",
        }, children: [_jsx("div", { style: { opacity: 0.4 }, children: _jsx(IconLeaf, { size: 56 }) }), _jsx("p", { style: { fontSize: 14, margin: 0, lineHeight: 1.5 }, children: "V\u00E4lj en v\u00E4xt i listan f\u00F6r att se detaljer." })] }));
}
//# sourceMappingURL=PlantDetailEmpty.js.map