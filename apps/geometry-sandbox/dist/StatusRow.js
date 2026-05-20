import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { fmtInt, fmtNum } from "./format.js";
function collisionText(overlap, touch) {
    if (overlap === 0 && touch === 0)
        return "Inga objekt krockar";
    const overlapLabel = overlap === 0 ? "" : overlap === 1 ? "1 objekt krockar" : `${overlap} objekt krockar`;
    const touchLabel = touch === 0 ? "" : touch === 1 ? "1 snuddar" : `${touch} snuddar`;
    if (overlap > 0 && touch > 0)
        return `${overlapLabel} · ${touchLabel}`;
    return overlapLabel || touchLabel;
}
function autoSaveText(s) {
    switch (s.kind) {
        case "idle":
            return "Ej sparat ännu";
        case "saving":
            return "Sparas…";
        case "saved": {
            const d = new Date(s.at);
            return `Sparat ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
        }
        case "error":
            return `Sparfel: ${s.message}`;
    }
}
const monoStyle = {
    fontFamily: "var(--font-mono)",
    fontVariantNumeric: "tabular-nums",
    fontSize: 11.5,
    color: "var(--ink-2)",
};
export function StatusRow({ bedCount, totalAreaM2, totalSoilL, overlapCount, touchCount, collisionIds, autoSaveStatus, latitudeDeg, dispatch, }) {
    const hasCollision = overlapCount > 0 || touchCount > 0;
    const tone = overlapCount > 0 ? "var(--state-danger)" : touchCount > 0 ? "var(--accent-sun)" : "var(--state-success)";
    const latLabel = `${fmtNum(Math.abs(latitudeDeg), 2)}° ${latitudeDeg >= 0 ? "N" : "S"}`;
    return (_jsxs("div", { style: {
            display: "flex",
            alignItems: "center",
            gap: 10,
            height: "var(--layout-statusbar-h, 28px)",
            flexShrink: 0,
            padding: "0 18px",
            background: "var(--bg-surface)",
            borderTop: "1px solid var(--line-1)",
        }, children: [_jsx("button", { type: "button", onClick: () => hasCollision && dispatch({ type: "selectMany", ids: collisionIds }), disabled: !hasCollision, title: hasCollision ? "Markera objekt som krockar" : undefined, style: {
                    ...monoStyle,
                    color: tone,
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    cursor: hasCollision ? "pointer" : "default",
                }, children: collisionText(overlapCount, touchCount) }), _jsx("span", { style: { ...monoStyle, color: "var(--line-2)" }, children: "\u00B7" }), _jsxs("span", { style: monoStyle, children: [bedCount, " ", bedCount === 1 ? "objekt" : "objekt", " \u00B7 ", fmtNum(totalAreaM2, 2), " m\u00B2 \u00B7", " ", fmtInt(totalSoilL), " L"] }), _jsx("span", { style: { flex: 1 } }), _jsxs("span", { style: monoStyle, children: [autoSaveText(autoSaveStatus), " \u00B7 Lat ", latLabel] })] }));
}
//# sourceMappingURL=StatusRow.js.map