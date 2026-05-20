import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getKind } from "@kolonitradgard/spatial-core";
import { KIND_LABELS } from "./Toolbar.js";
import { fmtNum } from "./format.js";
import { IconCopy, IconRotateCCW, IconRotateCW, IconTrash, IconWall } from "./icons.js";
/** Default vägghöjd (mm) när man togglar bädd → vägg via pillret. */
const TOGGLE_WALL_HEIGHT_MM = 1500;
const sepStyle = {
    width: 1,
    alignSelf: "stretch",
    margin: "6px 2px",
    background: "var(--line-1)",
};
export function FloatingSelectionToolbar({ rect, selectedCount, placement, dispatch }) {
    const isWall = rect.wallHeight > 0;
    const kindLabel = isWall ? "Vägg" : KIND_LABELS[getKind(rect)];
    const label = `${kindLabel} · ${fmtNum(rect.width / 1000, 2)} × ${fmtNum(rect.height / 1000, 2)} m · ` +
        `${Math.round(rect.rotationDeg)}°${selectedCount > 1 ? `  (+${selectedCount - 1})` : ""}`;
    return (_jsxs("div", { role: "toolbar", "aria-label": "Markerat objekt", style: {
            position: "absolute",
            left: placement.left,
            top: placement.top,
            transform: "translateX(-50%)",
            zIndex: 20,
            height: 36,
            display: "flex",
            alignItems: "center",
            gap: 2,
            padding: "0 6px",
            background: "var(--bg-surface)",
            border: "1px solid var(--line-1)",
            borderRadius: "var(--radius-2)",
            boxShadow: "var(--shadow-2)",
            fontFamily: "var(--font-sans)",
            whiteSpace: "nowrap",
        }, children: [_jsx("span", { style: {
                    fontFamily: "var(--font-mono)",
                    fontVariantNumeric: "tabular-nums",
                    fontSize: 11.5,
                    color: "var(--ink-1)",
                    padding: "0 6px",
                }, children: label }), _jsx("span", { style: sepStyle }), _jsx("button", { "data-pp-btn": true, "data-variant": "ghost", "data-icon-only": "true", onClick: () => dispatch({ type: "rotateSelected", deltaDeg: -15 }), title: "Rotera -15\u00B0 (Shift+R)", children: _jsx(IconRotateCCW, { size: 15 }) }), _jsx("button", { "data-pp-btn": true, "data-variant": "ghost", "data-icon-only": "true", onClick: () => dispatch({ type: "rotateSelected", deltaDeg: 15 }), title: "Rotera +15\u00B0 (R)", children: _jsx(IconRotateCW, { size: 15 }) }), _jsx("span", { style: sepStyle }), _jsx("button", { "data-pp-btn": true, "data-variant": "ghost", "data-icon-only": "true", onClick: () => dispatch({
                    type: "setWallHeight",
                    id: rect.id,
                    mm: isWall ? 0 : TOGGLE_WALL_HEIGHT_MM,
                }), title: isWall ? "Gör om till bädd (vägghöjd 0)" : "Gör om till vägg", "aria-pressed": isWall, style: isWall ? { color: "var(--accent-wall)" } : undefined, children: _jsx(IconWall, { size: 15 }) }), _jsx("button", { "data-pp-btn": true, "data-variant": "ghost", "data-icon-only": "true", onClick: () => dispatch({ type: "duplicateSelected" }), title: "Duplicera (\u2318D / Ctrl+D)", children: _jsx(IconCopy, { size: 15 }) }), _jsx("span", { style: sepStyle }), _jsx("button", { "data-pp-btn": true, "data-variant": "ghost", "data-icon-only": "true", "data-danger-hover": "true", onClick: () => dispatch({ type: "removeSelected" }), title: "Ta bort (Backspace)", children: _jsx(IconTrash, { size: 15 }) })] }));
}
//# sourceMappingURL=FloatingSelectionToolbar.js.map