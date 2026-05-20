import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { MIN_RECT_DIMENSION_MM, nextId } from "./state.js";
import { exportCanvasAsPng, loadSceneFromFile, saveScene } from "./io.js";
import { IconCompass, IconFolderOpen, IconGrid, IconPlus, IconRotateCCW, IconRotateCW, IconRuler, IconSave, IconSquare, IconTrash, IconUndo, IconRedo, } from "./icons.js";
function formatAutoSaveStatus(s) {
    switch (s.kind) {
        case "idle":
            return { text: "Ej sparat ännu", tone: "muted" };
        case "saving":
            return { text: "Sparar…", tone: "muted" };
        case "saved": {
            const d = new Date(s.at);
            const hh = String(d.getHours()).padStart(2, "0");
            const mm = String(d.getMinutes()).padStart(2, "0");
            return { text: `Sparad · ${hh}:${mm}`, tone: "ok" };
        }
        case "error":
            return { text: `Fel: ${s.message}`, tone: "warn" };
    }
}
const sectionStyle = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "0 14px",
    height: "100%",
    borderRight: "1px solid var(--line-1)",
};
const lastSectionStyle = {
    ...sectionStyle,
    borderRight: "none",
};
const labelStyle = {
    fontFamily: "var(--font-sans)",
    fontSize: 12,
    color: "var(--ink-2)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    fontWeight: 500,
};
const inlineLabelStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontFamily: "var(--font-sans)",
    fontSize: 12.5,
    color: "var(--ink-1)",
    cursor: "pointer",
};
const valueStyle = {
    fontFamily: "var(--font-mono)",
    fontVariantNumeric: "tabular-nums",
    fontSize: 12.5,
    color: "var(--ink-1)",
};
export const KIND_DEFAULTS = {
    bed: { width: 1500, height: 800, wallHeight: 0 },
    rabatt: { width: 2000, height: 1000, wallHeight: 0 },
    building: { width: 3000, height: 2500, wallHeight: 2400 },
    hedge: { width: 3000, height: 500, wallHeight: 1500 },
    grass: { width: 3000, height: 3000, wallHeight: 0 },
    paved: { width: 2000, height: 2000, wallHeight: 0 },
    gravel: { width: 2000, height: 2000, wallHeight: 0 },
    deck: { width: 3000, height: 2000, wallHeight: 0 },
    surface: { width: 2000, height: 2000, wallHeight: 0 },
};
const KIND_LABELS = {
    bed: "Bädd",
    rabatt: "Rabatt",
    building: "Byggnad",
    hedge: "Häck",
    grass: "Gräs",
    paved: "Stenlagt",
    gravel: "Grus",
    deck: "Trädäck",
    surface: "Annan yta",
};
export function Toolbar({ state, dispatch, bedDepth, setBedDepth, onUndo, onRedo, canUndo, canRedo, autoSaveStatus, onResetAutoSaveBaseline, adapter, }) {
    const autoSave = formatAutoSaveStatus(autoSaveStatus);
    const primaryId = state.selectedIds[0] ?? null;
    const selected = state.rectangles.find((r) => r.id === primaryId);
    const multiCount = state.selectedIds.length;
    const [addOpen, setAddOpen] = useState(false);
    const [addKind, setAddKind] = useState("bed");
    const [addWidth, setAddWidth] = useState(KIND_DEFAULTS.bed.width);
    const [addHeight, setAddHeight] = useState(KIND_DEFAULTS.bed.height);
    const [addWallHeight, setAddWallHeight] = useState(KIND_DEFAULTS.bed.wallHeight);
    const onPickKind = (k) => {
        setAddKind(k);
        setAddWidth(KIND_DEFAULTS[k].width);
        setAddHeight(KIND_DEFAULTS[k].height);
        setAddWallHeight(KIND_DEFAULTS[k].wallHeight);
    };
    const commitAddRect = () => {
        const w = Math.max(MIN_RECT_DIMENSION_MM, Math.round(addWidth));
        const h = Math.max(MIN_RECT_DIMENSION_MM, Math.round(addHeight));
        const wh = Math.max(0, Math.round(addWallHeight));
        // Auto-offset så nya objekt inte staplas på samma punkt: gå snett 600 mm
        // åt höger/ned per existerande objekt, modulo en ruta.
        const offset = (state.rectangles.length % 8) * 600;
        const rect = {
            id: nextId(),
            cx: 5000 + offset,
            cy: 5000 + offset,
            width: w,
            height: h,
            rotationDeg: 0,
            wallHeight: wh,
        };
        // Utelämna kind för default ("bed") — håll JSON minimal.
        if (addKind !== "bed")
            rect.kind = addKind;
        dispatch({ type: "addRect", rect });
        setAddOpen(false);
    };
    const commitLocation = (lat, lon) => {
        if (!Number.isFinite(lat) || !Number.isFinite(lon))
            return;
        const clampedLat = Math.max(-90, Math.min(90, lat));
        const clampedLon = Math.max(-180, Math.min(180, lon));
        dispatch({
            type: "setLocation",
            loc: { latitudeDeg: clampedLat, longitudeDeg: clampedLon },
        });
    };
    return (_jsxs("div", { style: {
            display: "flex",
            alignItems: "center",
            background: "var(--bg-surface)",
            borderBottom: "1px solid var(--line-1)",
            height: "var(--layout-toolbar-h)",
            overflowX: "auto",
            flexShrink: 0,
            fontFamily: "var(--font-sans)",
        }, children: [_jsxs("div", { style: { ...sectionStyle, paddingLeft: 18 }, children: [_jsxs("button", { "data-pp-btn": true, "data-variant": state.tool === "create" ? "primary" : "primary", onClick: () => setAddOpen((v) => !v), title: "L\u00E4gg till objekt", "aria-expanded": addOpen, children: [_jsx(IconPlus, { size: 14 }), " L\u00E4gg till"] }), _jsx("button", { "data-pp-btn": true, "data-icon-only": "true", disabled: !selected, onClick: () => dispatch({ type: "removeSelected" }), title: "Ta bort valt objekt", children: _jsx(IconTrash, { size: 14 }) }), state.tool === "create" && (_jsxs("span", { style: {
                            fontSize: 12,
                            color: "var(--accent-sun)",
                            fontFamily: "var(--font-sans)",
                            padding: "2px 8px",
                            border: "1px solid var(--accent-sun)",
                            borderRadius: 4,
                            cursor: "pointer",
                        }, onClick: () => dispatch({ type: "setTool", tool: "select" }), title: "Rita-l\u00E4get \u00E4r aktivt \u2014 klicka f\u00F6r att avbryta (eller tryck Escape)", children: ["Rita: ", KIND_LABELS[state.createKind], " \u00B7 Esc avbryter"] }))] }), addOpen && (_jsx(AddRectPopover, { kind: addKind, onKind: onPickKind, width: addWidth, height: addHeight, wallHeight: addWallHeight, onWidth: setAddWidth, onHeight: setAddHeight, onWallHeight: setAddWallHeight, onCancel: () => setAddOpen(false), onConfirm: commitAddRect, onStartDrawing: () => {
                    dispatch({ type: "setCreateKind", kind: addKind });
                    dispatch({ type: "setTool", tool: "create" });
                    setAddOpen(false);
                } })), _jsxs("div", { style: sectionStyle, children: [_jsx("button", { "data-pp-btn": true, "data-icon-only": "true", onClick: onUndo, disabled: !canUndo, title: "\u00C5ngra (\u2318Z / Ctrl+Z)", children: _jsx(IconUndo, { size: 14 }) }), _jsx("button", { "data-pp-btn": true, "data-icon-only": "true", onClick: onRedo, disabled: !canRedo, title: "G\u00F6r om (\u2318\u21E7Z / Ctrl+Shift+Z)", children: _jsx(IconRedo, { size: 14 }) })] }), _jsxs("div", { style: sectionStyle, children: [_jsxs("button", { "data-pp-btn": true, onClick: () => saveScene(state), title: "Ladda ner scen.json", children: [_jsx(IconSave, { size: 14 }), " Spara"] }), _jsxs("button", { "data-pp-btn": true, onClick: () => loadSceneFromFile(dispatch, onResetAutoSaveBaseline), title: "Ladda scen.json", children: [_jsx(IconFolderOpen, { size: 14 }), " Ladda"] }), _jsx("button", { "data-pp-btn": true, "data-variant": "ghost", onClick: () => exportCanvasAsPng(), title: "Exportera arbetsytan som PNG", children: "PNG" }), _jsx("button", { "data-pp-btn": true, "data-variant": "ghost", onClick: () => {
                            if (!window.confirm("Starta om med en tom scen? Nuvarande scen sparas över."))
                                return;
                            adapter.clear().finally(() => {
                                onResetAutoSaveBaseline();
                                dispatch({ type: "newScene" });
                            });
                        }, title: "Skapa ny tom scen (rensar persistens)", children: "Ny" }), _jsx("span", { "data-pp-status": true, "data-tone": autoSave.tone, style: {
                            fontFamily: "var(--font-mono)",
                            fontSize: 11,
                            color: autoSave.tone === "warn"
                                ? "var(--state-danger)"
                                : autoSave.tone === "ok"
                                    ? "var(--state-success)"
                                    : "var(--ink-2)",
                            marginLeft: 4,
                            whiteSpace: "nowrap",
                        }, title: autoSaveStatus.kind === "saved"
                            ? `Senast sparat ${new Date(autoSaveStatus.at).toLocaleString("sv-SE")}`
                            : autoSave.text, children: autoSave.text })] }), selected && (_jsxs("div", { style: sectionStyle, children: [_jsxs("span", { style: valueStyle, children: [selected.label || selected.id, multiCount > 1 ? ` +${multiCount - 1}` : ""] }), _jsx("button", { "data-pp-btn": true, "data-icon-only": "true", onClick: () => dispatch({ type: "duplicateSelected" }), title: `Duplicera vald${multiCount > 1 ? "a" : ""} bädd${multiCount > 1 ? "ar" : ""} (⌘D / Ctrl+D)`, children: _jsx(IconPlus, { size: 14 }) }), _jsx("button", { "data-pp-btn": true, "data-icon-only": "true", onClick: () => dispatch({ type: "rotateSelected", deltaDeg: -15 }), title: "Rotera -15\u00B0", children: _jsx(IconRotateCCW, { size: 14 }) }), _jsx("button", { "data-pp-btn": true, "data-icon-only": "true", onClick: () => dispatch({ type: "rotateSelected", deltaDeg: 15 }), title: "Rotera +15\u00B0", children: _jsx(IconRotateCW, { size: 14 }) }), _jsx("span", { style: labelStyle, children: "V\u00E4ggh\u00F6jd" }), _jsx("input", { type: "number", value: selected.wallHeight, onChange: (e) => dispatch({
                            type: "setWallHeight",
                            id: selected.id,
                            mm: Number(e.target.value) || 0,
                        }), "data-pp-input": true, "data-mono": "true", style: { width: 72 } }), _jsx("span", { style: { ...labelStyle, marginLeft: -2 }, children: "mm" })] })), _jsx("div", { style: sectionStyle, children: _jsxs("label", { style: inlineLabelStyle, title: "Visa skuggsvep 06\u201320 vid valt datum", children: [_jsx("input", { type: "checkbox", checked: state.showSunPath, onChange: () => dispatch({ type: "toggleSunPath" }), "data-pp-input": true }), "Sol-svep"] }) }), _jsxs("div", { style: sectionStyle, children: [_jsxs("button", { "data-pp-btn": true, onClick: () => dispatch({
                            type: "setPlotBoundary",
                            rect: {
                                id: "plot-boundary",
                                cx: 6000,
                                cy: 5000,
                                width: 12000,
                                height: 8000,
                                rotationDeg: 0,
                                wallHeight: 0,
                            },
                        }), title: "Skapa tomtens yttre gr\u00E4ns", children: [_jsx(IconSquare, { size: 14 }), " Tomt"] }), _jsxs("label", { style: inlineLabelStyle, title: "Snappa till rutn\u00E4t", children: [_jsx("input", { type: "checkbox", checked: state.snapToGrid, onChange: (e) => dispatch({ type: "setSnapToGrid", enabled: e.target.checked }), "data-pp-input": true }), _jsx(IconGrid, { size: 13 }), " Snap"] }), _jsx("input", { type: "number", value: state.gridStepMm, onChange: (e) => dispatch({ type: "setGridStep", mm: Number(e.target.value) || 100 }), "data-pp-input": true, "data-mono": "true", style: { width: 64 }, title: "Rutn\u00E4tssteg i mm" }), _jsxs("label", { style: inlineLabelStyle, title: "Visa avst\u00E5ndsm\u00E5tt till alla objekt under drag, inte bara n\u00E4rmsta", children: [_jsx("input", { type: "checkbox", checked: state.showAllMeasurements, onChange: (e) => dispatch({ type: "setShowAllMeasurements", enabled: e.target.checked }), "data-pp-input": true }), _jsx(IconRuler, { size: 13 }), " Alla m\u00E5tt"] }), _jsx(IconCompass, { size: 14, style: { color: "var(--ink-2)" } }), _jsx("input", { type: "number", value: state.plot.northRotationDeg, step: 15, onChange: (e) => dispatch({ type: "setNorthRotation", deg: Number(e.target.value) || 0 }), "data-pp-input": true, "data-mono": "true", style: { width: 60 }, title: "Norr-rotation i grader (ADR-006 \u2014 roterar enbart solreferensramen)" }), _jsx("span", { style: { ...labelStyle, marginLeft: -2 }, children: "N\u00B0" })] }), _jsxs("div", { style: sectionStyle, children: [_jsx("span", { style: labelStyle, children: "Plats" }), _jsx("input", { type: "number", value: state.plot.location.latitudeDeg, step: 0.0001, min: -90, max: 90, onChange: (e) => {
                            const n = Number(e.target.value);
                            if (Number.isFinite(n))
                                commitLocation(n, state.plot.location.longitudeDeg);
                        }, "data-pp-input": true, "data-mono": "true", style: { width: 84 }, title: "Latitud (\u00B0)" }), _jsx("span", { style: { ...labelStyle, marginLeft: -2 }, children: "lat" }), _jsx("input", { type: "number", value: state.plot.location.longitudeDeg, step: 0.0001, min: -180, max: 180, onChange: (e) => {
                            const n = Number(e.target.value);
                            if (Number.isFinite(n))
                                commitLocation(state.plot.location.latitudeDeg, n);
                        }, "data-pp-input": true, "data-mono": "true", style: { width: 84 }, title: "Longitud (\u00B0)" }), _jsx("span", { style: { ...labelStyle, marginLeft: -2 }, children: "lon" })] }), _jsxs("div", { style: lastSectionStyle, children: [_jsx(IconRuler, { size: 14, style: { color: "var(--ink-2)" } }), _jsx("span", { style: labelStyle, children: "B\u00E4ddh\u00F6jd" }), _jsx("input", { type: "number", value: bedDepth, onChange: (e) => setBedDepth(Number(e.target.value) || 0), "data-pp-input": true, "data-mono": "true", style: { width: 72 }, title: "B\u00E4ddh\u00F6jd i mm (f\u00F6r jordvolymber\u00E4kning)" }), _jsx("span", { style: { ...labelStyle, marginLeft: -2 }, children: "mm" })] })] }));
}
function AddRectPopover({ kind, onKind, width, height, wallHeight, onWidth, onHeight, onWallHeight, onCancel, onConfirm, onStartDrawing, }) {
    const showWallHeight = kind === "building" || kind === "hedge";
    const orderedKinds = [
        "bed",
        "rabatt",
        "building",
        "hedge",
        "grass",
        "paved",
        "gravel",
        "deck",
        "surface",
    ];
    return (_jsxs(_Fragment, { children: [_jsx("div", { "aria-hidden": "true", onClick: onCancel, style: {
                    position: "fixed",
                    inset: 0,
                    background: "rgba(15, 17, 12, 0.18)",
                    zIndex: 40,
                } }), _jsxs("div", { role: "dialog", "aria-modal": "true", "aria-label": "Nytt objekt", onKeyDown: (e) => {
                    if (e.key === "Escape")
                        onCancel();
                    if (e.key === "Enter" && e.target.tagName === "INPUT")
                        onConfirm();
                }, style: {
                    position: "fixed",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    zIndex: 41,
                    background: "var(--bg-surface)",
                    border: "1px solid var(--line-1)",
                    borderRadius: "var(--radius-3)",
                    boxShadow: "var(--shadow-3)",
                    padding: "18px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    minWidth: 300,
                    fontFamily: "var(--font-sans)",
                }, children: [_jsx("div", { style: {
                            fontFamily: "var(--font-display)",
                            fontSize: 14,
                            color: "var(--ink-1)",
                            fontWeight: 500,
                        }, children: "Nytt objekt" }), _jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }, role: "radiogroup", "aria-label": "Objekttyp", children: orderedKinds.map((k) => (_jsx("button", { type: "button", role: "radio", "aria-checked": kind === k, "data-pp-btn": true, "data-variant": kind === k ? "primary" : "ghost", onClick: () => onKind(k), style: { fontSize: 12.5, padding: "5px 8px" }, children: KIND_LABELS[k] }, k))) }), _jsxs("label", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--ink-2)" }, children: [_jsx("span", { style: { textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }, children: "Bredd" }), _jsxs("span", { style: { display: "inline-flex", alignItems: "baseline", gap: 4 }, children: [_jsx("input", { type: "number", value: width, step: 100, min: MIN_RECT_DIMENSION_MM, autoFocus: true, onChange: (e) => {
                                            const n = Number(e.target.value);
                                            if (Number.isFinite(n))
                                                onWidth(n);
                                        }, "data-pp-input": true, "data-mono": "true", style: { width: 88, textAlign: "right", fontSize: 13 } }), _jsx("span", { style: { color: "var(--ink-2)", fontSize: 12.5 }, children: "mm" })] })] }), _jsxs("label", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--ink-2)" }, children: [_jsx("span", { style: { textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }, children: "H\u00F6jd" }), _jsxs("span", { style: { display: "inline-flex", alignItems: "baseline", gap: 4 }, children: [_jsx("input", { type: "number", value: height, step: 100, min: MIN_RECT_DIMENSION_MM, onChange: (e) => {
                                            const n = Number(e.target.value);
                                            if (Number.isFinite(n))
                                                onHeight(n);
                                        }, "data-pp-input": true, "data-mono": "true", style: { width: 88, textAlign: "right", fontSize: 13 } }), _jsx("span", { style: { color: "var(--ink-2)", fontSize: 12.5 }, children: "mm" })] })] }), showWallHeight && (_jsxs("label", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--ink-2)" }, children: [_jsx("span", { style: { textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }, children: "V\u00E4ggh\u00F6jd" }), _jsxs("span", { style: { display: "inline-flex", alignItems: "baseline", gap: 4 }, children: [_jsx("input", { type: "number", value: wallHeight, step: 100, min: 0, onChange: (e) => {
                                            const n = Number(e.target.value);
                                            if (Number.isFinite(n))
                                                onWallHeight(n);
                                        }, "data-pp-input": true, "data-mono": "true", style: { width: 88, textAlign: "right", fontSize: 13 } }), _jsx("span", { style: { color: "var(--ink-2)", fontSize: 12.5 }, children: "mm" })] })] })), _jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 6, marginTop: 4 }, children: [_jsx("button", { "data-pp-btn": true, "data-variant": "ghost", onClick: onStartDrawing, title: "St\u00E4ng dialogen och rita rektangelns area direkt p\u00E5 canvasen", children: "Rita p\u00E5 canvas" }), _jsxs("div", { style: { display: "flex", gap: 6 }, children: [_jsx("button", { "data-pp-btn": true, "data-variant": "ghost", onClick: onCancel, children: "Avbryt" }), _jsx("button", { "data-pp-btn": true, "data-variant": "primary", onClick: onConfirm, children: "L\u00E4gg till med m\u00E5tt" })] })] })] })] }));
}
//# sourceMappingURL=Toolbar.js.map