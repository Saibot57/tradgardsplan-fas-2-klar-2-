import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * SidePanel — per-bed inspector.
 *
 * Aggregate summer sun hours use a fixed reference date (midsummer)
 * and are INDEPENDENT of the TimeBar (which controls interactive shadow
 * preview). The two are never collapsed into a shared state field.
 */
import { useMemo } from "react";
import { bedSoilVolumeLitres, bedSunHours, getKind, KIND_RULES, OBJECT_KINDS, rectAreaM2, rectContainedIn, } from "@kolonitradgard/spatial-core";
import { MIN_RECT_DIMENSION_MM } from "./state.js";
import { IconTrash } from "./icons.js";
import { fmtInt, fmtNum } from "./format.js";
import { Row, rowLabelStyle, rowStyle } from "./shared/Row.js";
import { sectionTitleStyle } from "./shared/SectionTitle.js";
import { PlantThumbnail } from "./plant-catalog/primitives/PlantThumbnail.js";
// Midsummer near Landskrona — fixed reference date for aggregate analysis.
const REFERENCE_DATE = new Date(2025, 5, 21);
/**
 * Default-färg per kind — speglar palette.ts. Används av color-pickern som
 * fallback-värde när Rect.color saknas, så användaren ser den faktiska
 * default-färgen i stället för "svart".
 */
const KIND_DEFAULT_COLOR = {
    bed: "#6E8C5A",
    rabatt: "#C2B49A",
    building: "#8C8478",
    hedge: "#8C8478",
    grass: "#8AAE5D",
    paved: "#9A9890",
    gravel: "#B5A98B",
    deck: "#8A6E4F",
    surface: "#B5B0A0",
};
function defaultColorForKind(kind) {
    if (!kind)
        return KIND_DEFAULT_COLOR.bed;
    return KIND_DEFAULT_COLOR[kind];
}
const KIND_LABEL = {
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
const KIND_LABEL_PLURAL = {
    bed: "Bäddar",
    rabatt: "Rabatter",
    building: "Byggnader",
    hedge: "Häckar",
    grass: "Gräsmattor",
    paved: "Stenlagda",
    gravel: "Grusytor",
    deck: "Trädäck",
    surface: "Övriga ytor",
};
function containmentLabel(c) {
    switch (c) {
        case "inside":
            return { text: "Innanför tomten", color: "var(--state-success)" };
        case "partial":
            return { text: "Delvis utanför tomten", color: "var(--accent-sun)" };
        case "outside":
            return { text: "Utanför tomten", color: "var(--state-danger)" };
    }
}
const panelStyle = {
    width: "var(--layout-sidepanel-w)",
    flexShrink: 0,
    background: "var(--bg-surface)",
    borderLeft: "1px solid var(--line-1)",
    color: "var(--ink-1)",
    padding: "20px 22px",
    display: "flex",
    flexDirection: "column",
    gap: 22,
    overflowY: "auto",
    fontFamily: "var(--font-sans)",
};
const unitStyle = { color: "var(--ink-2)" };
const boundaryInputStyle = {
    width: 88,
    textAlign: "right",
    fontSize: 13,
};
function BoundaryNumberRow({ label, value, unit, step, min, onCommit, }) {
    return (_jsxs("div", { style: rowStyle, children: [_jsx("div", { style: rowLabelStyle, children: label }), _jsxs("div", { style: { display: "flex", alignItems: "baseline", gap: 4 }, children: [_jsx("input", { type: "number", value: value, step: step, ...(min !== undefined ? { min } : {}), onChange: (e) => {
                            const n = Number(e.target.value);
                            if (Number.isFinite(n))
                                onCommit(n);
                        }, "data-pp-input": true, "data-mono": "true", style: boundaryInputStyle }), _jsx("span", { style: { ...unitStyle, fontSize: 12.5 }, children: unit })] })] }));
}
export function SidePanel({ state, bedDepth, dispatch, overlappingIds, touchingIds, plants, }) {
    const primaryId = state.selectedIds[0] ?? null;
    const selected = state.rectangles.find((r) => r.id === primaryId);
    const selectedKind = selected ? getKind(selected) : null;
    const multiCount = state.selectedIds.length;
    const sunHoursValue = useMemo(() => {
        if (!selected)
            return null;
        if (getKind(selected) !== "bed")
            return null;
        const others = state.rectangles.filter((r) => r.id !== selected.id);
        return bedSunHours(selected, others, REFERENCE_DATE, state.plot.location, state.plot.northRotationDeg);
    }, [
        selected,
        state.rectangles,
        state.plot.location,
        state.plot.northRotationDeg,
    ]);
    const plot = state.plot.boundaryRect;
    /** Per-typ-grupperad sammanställning. */
    const summary = useMemo(() => {
        const totals = {
            bed: { count: 0, areaM2: 0, soilL: 0 },
            rabatt: { count: 0, areaM2: 0, soilL: 0 },
            building: { count: 0, areaM2: 0, soilL: 0 },
            hedge: { count: 0, areaM2: 0, soilL: 0 },
            grass: { count: 0, areaM2: 0, soilL: 0 },
            paved: { count: 0, areaM2: 0, soilL: 0 },
            gravel: { count: 0, areaM2: 0, soilL: 0 },
            deck: { count: 0, areaM2: 0, soilL: 0 },
            surface: { count: 0, areaM2: 0, soilL: 0 },
        };
        let outsideCount = 0;
        for (const r of state.rectangles) {
            const k = getKind(r);
            totals[k].count += 1;
            totals[k].areaM2 += rectAreaM2(r);
            totals[k].soilL += bedSoilVolumeLitres(r, bedDepth);
            if (plot && rectContainedIn(r, plot) === "outside")
                outsideCount += 1;
        }
        return { totals, outsideCount };
    }, [state.rectangles, bedDepth, plot]);
    const totalArea = summary.totals.bed.areaM2 +
        summary.totals.rabatt.areaM2 +
        summary.totals.building.areaM2 +
        summary.totals.hedge.areaM2 +
        summary.totals.grass.areaM2 +
        summary.totals.paved.areaM2 +
        summary.totals.gravel.areaM2 +
        summary.totals.deck.areaM2 +
        summary.totals.surface.areaM2;
    const selectedContainment = useMemo(() => {
        if (!selected || !plot)
            return null;
        return rectContainedIn(selected, plot);
    }, [selected, plot]);
    return (_jsxs("aside", { style: panelStyle, children: [_jsxs("div", { children: [_jsx("div", { style: {
                            fontFamily: "var(--font-display)",
                            fontSize: 22,
                            color: "var(--ink-1)",
                            letterSpacing: "-0.01em",
                            lineHeight: 1.15,
                            fontWeight: 500,
                        }, children: selected ? "Objektinspektor" : "Inget objekt valt" }), _jsx("div", { style: { fontSize: 12.5, color: "var(--ink-2)", marginTop: 4, lineHeight: 1.5 }, children: multiCount > 1
                            ? `${multiCount} objekt valda — visar primär.`
                            : selected
                                ? `${KIND_LABEL[getKind(selected)]} — mått och relevanta beräkningar.`
                                : "Klicka på ett objekt i ritningen för att se detaljer." })] }), selected && (_jsxs("section", { children: [_jsx("div", { style: sectionTitleStyle, children: "Identitet" }), _jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: [_jsx("input", { type: "text", placeholder: "Namn (t.ex. Tomater 2026)", value: selected.label ?? "", onChange: (e) => dispatch({ type: "setRectMeta", id: selected.id, label: e.target.value }), "data-pp-input": true, style: { fontSize: 13, padding: "5px 8px" } }), _jsx("textarea", { placeholder: "Anteckningar\u2026", value: selected.notes ?? "", onChange: (e) => dispatch({ type: "setRectMeta", id: selected.id, notes: e.target.value }), "data-pp-input": true, rows: 3, style: { fontSize: 12.5, padding: "5px 8px", resize: "vertical", fontFamily: "var(--font-sans)" } }), _jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }, role: "radiogroup", "aria-label": "Objekttyp", children: OBJECT_KINDS.map((k) => (_jsx("button", { type: "button", role: "radio", "aria-checked": selectedKind === k, "data-pp-btn": true, "data-variant": selectedKind === k ? "primary" : "ghost", onClick: () => dispatch({ type: "setRectKind", id: selected.id, kind: k }), style: { fontSize: 12, padding: "4px 6px" }, title: `Byt typ till ${KIND_LABEL[k]}`, children: KIND_LABEL[k] }, k))) }), _jsxs("div", { style: {
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    fontSize: 12.5,
                                    color: "var(--ink-2)",
                                }, children: [_jsx("span", { style: { textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }, children: "F\u00E4rg" }), _jsx("input", { type: "color", value: selected.color ?? defaultColorForKind(selectedKind), onChange: (e) => dispatch({ type: "setRectColor", id: selected.id, color: e.target.value }), title: "Egen f\u00E4rg f\u00F6r detta objekt", style: {
                                            width: 36,
                                            height: 28,
                                            padding: 0,
                                            border: "1px solid var(--line-1)",
                                            borderRadius: 4,
                                            background: "transparent",
                                            cursor: "pointer",
                                        } }), _jsx("button", { "data-pp-btn": true, "data-variant": "ghost", disabled: !selected.color, onClick: () => dispatch({ type: "setRectColor", id: selected.id, color: null }), style: { fontSize: 12, padding: "4px 8px" }, title: "\u00C5terst\u00E4ll till default-f\u00E4rgen f\u00F6r objekttypen", children: "\u00C5terst\u00E4ll" }), selected.color && (_jsx("span", { style: {
                                            fontFamily: "var(--font-mono)",
                                            fontSize: 11,
                                            color: "var(--ink-2)",
                                            fontVariantNumeric: "tabular-nums",
                                        }, children: selected.color }))] })] })] })), selected && (_jsxs("section", { children: [_jsx("div", { style: sectionTitleStyle, children: "Geometri" }), _jsx(Row, { label: "ID", value: selected.id }), _jsx(Row, { label: "Status", value: overlappingIds.has(selected.id) ? (_jsx("span", { style: { color: "var(--state-danger)" }, children: "Krockar" })) : touchingIds.has(selected.id) ? (_jsx("span", { style: { color: "var(--accent-sun)" }, children: "Snuddar kant" })) : (_jsx("span", { style: { color: "var(--state-success)" }, children: "Frist\u00E5ende" })) }), _jsx(Row, { label: "M\u00E5tt", value: _jsxs(_Fragment, { children: [fmtInt(selected.width), " \u00D7 ", fmtInt(selected.height), " ", _jsx("span", { style: unitStyle, children: "mm" })] }) }), _jsx(Row, { label: "Position", value: _jsxs(_Fragment, { children: ["(", fmtInt(selected.cx), ", ", fmtInt(selected.cy), ")"] }) }), _jsx(Row, { label: "Rotation", value: _jsxs(_Fragment, { children: [fmtNum(selected.rotationDeg, 1), "\u00B0"] }) }), selectedKind && (selectedKind === "building" || selectedKind === "hedge") && (_jsx(Row, { label: "V\u00E4ggh\u00F6jd", value: selected.wallHeight > 0 ? (_jsxs(_Fragment, { children: [fmtInt(selected.wallHeight), " ", _jsx("span", { style: unitStyle, children: "mm" })] })) : ("—") })), selectedContainment && (_jsx(Row, { label: "Tomt", value: _jsx("span", { style: { color: containmentLabel(selectedContainment).color }, children: containmentLabel(selectedContainment).text }) }))] })), selected && (_jsxs("section", { children: [_jsx("div", { style: sectionTitleStyle, children: "Ber\u00E4kningar" }), _jsx(Row, { label: "Area", value: _jsxs(_Fragment, { children: [fmtNum(rectAreaM2(selected), 2), " ", _jsx("span", { style: unitStyle, children: "m\u00B2" })] }) }), selectedKind && KIND_RULES[selectedKind].hasSoil && (_jsx(Row, { label: `Jordvolym (${bedDepth} mm)`, value: _jsxs(_Fragment, { children: [fmtInt(bedSoilVolumeLitres(selected, bedDepth)), " ", _jsx("span", { style: unitStyle, children: "L" })] }) }))] })), selected && (selectedKind === "bed" || selectedKind === "rabatt") && (_jsxs("section", { children: [_jsx("div", { style: sectionTitleStyle, children: "Soltimmar" }), _jsxs("div", { style: {
                            fontFamily: "var(--font-mono)",
                            fontSize: 32,
                            color: "var(--ink-1)",
                            letterSpacing: "-0.01em",
                            fontVariantNumeric: "tabular-nums",
                            lineHeight: 1.1,
                        }, children: [sunHoursValue == null ? "—" : fmtNum(sunHoursValue, 1), _jsx("span", { style: { fontSize: 15, color: "var(--ink-2)", marginLeft: 4 }, children: "h" })] }), _jsx("div", { style: { fontSize: 11.5, color: "var(--ink-2)", marginTop: 6, lineHeight: 1.5 }, children: "Aggregerad analys 06\u201320 vid midsommar. Oberoende av tidsreglaget." })] })), selected && (selectedKind === "bed" || selectedKind === "rabatt") && (_jsx(BedPlantsSection, { placements: selected.plants ?? [], plants: plants, onOpenInCatalog: (plantId) => {
                    dispatch({ type: "selectPlant", plantId });
                    dispatch({ type: "switchTab", tab: "vaxter" });
                }, onRemove: (placementId) => dispatch({
                    type: "removePlantFromBed",
                    bedId: selected.id,
                    placementId,
                }) })), _jsx("div", { style: { height: 1, background: "var(--line-1)" } }), _jsxs("section", { children: [_jsx("div", { style: sectionTitleStyle, children: "Tomtgr\u00E4ns" }), plot ? (_jsxs(_Fragment, { children: [_jsx(BoundaryNumberRow, { label: "Bredd", value: plot.width, unit: "mm", step: 100, min: MIN_RECT_DIMENSION_MM, onCommit: (w) => dispatch({
                                    type: "setPlotBoundary",
                                    rect: { ...plot, width: Math.max(MIN_RECT_DIMENSION_MM, Math.round(w)) },
                                }) }), _jsx(BoundaryNumberRow, { label: "H\u00F6jd", value: plot.height, unit: "mm", step: 100, min: MIN_RECT_DIMENSION_MM, onCommit: (h) => dispatch({
                                    type: "setPlotBoundary",
                                    rect: { ...plot, height: Math.max(MIN_RECT_DIMENSION_MM, Math.round(h)) },
                                }) }), _jsx(BoundaryNumberRow, { label: "X (centrum)", value: plot.cx, unit: "mm", step: 100, onCommit: (cx) => dispatch({
                                    type: "setPlotBoundary",
                                    rect: { ...plot, cx: Math.round(cx) },
                                }) }), _jsx(BoundaryNumberRow, { label: "Y (centrum)", value: plot.cy, unit: "mm", step: 100, onCommit: (cy) => dispatch({
                                    type: "setPlotBoundary",
                                    rect: { ...plot, cy: Math.round(cy) },
                                }) }), _jsx(BoundaryNumberRow, { label: "Rotation", value: Number(plot.rotationDeg.toFixed(1)), unit: "\u00B0", step: 1, onCommit: (deg) => dispatch({
                                    type: "setPlotBoundary",
                                    rect: { ...plot, rotationDeg: deg },
                                }) }), _jsx("div", { style: { display: "flex", justifyContent: "flex-end", marginTop: 10 }, children: _jsxs("button", { "data-pp-btn": true, "data-variant": "ghost", onClick: () => dispatch({ type: "setPlotBoundary", rect: null }), title: "Ta bort tomtgr\u00E4nsen", children: [_jsx(IconTrash, { size: 13 }), " Ta bort tomt"] }) })] })) : (_jsxs("div", { style: { fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.5 }, children: ["Ingen tomt definierad. Tryck p\u00E5 ", _jsx("strong", { style: { color: "var(--ink-1)" }, children: "Tomt" }), " ", "i verktygsf\u00E4ltet f\u00F6r att l\u00E4gga till en yttre rektangel."] }))] }), _jsxs("section", { children: [_jsx("div", { style: sectionTitleStyle, children: "Sammanst\u00E4llning" }), _jsx(Row, { label: "Tomt", value: plot ? (_jsxs(_Fragment, { children: [fmtNum(plot.width / 1000, 1), " \u00D7 ", fmtNum(plot.height / 1000, 1), " ", _jsx("span", { style: unitStyle, children: "m" })] })) : ("—") }), OBJECT_KINDS.map((k) => {
                        const t = summary.totals[k];
                        if (t.count === 0)
                            return null;
                        return (_jsx(Row, { label: KIND_LABEL_PLURAL[k], value: _jsxs(_Fragment, { children: [t.count, " \u00B7 ", fmtNum(t.areaM2, 2), _jsx("span", { style: unitStyle, children: " m\u00B2" }), KIND_RULES[k].hasSoil && (_jsxs(_Fragment, { children: [" · ", fmtInt(t.soilL), _jsx("span", { style: unitStyle, children: " L" })] }))] }) }, k));
                    }), _jsx(Row, { label: "\u03A3 Area", value: _jsxs(_Fragment, { children: [fmtNum(totalArea, 2), " ", _jsx("span", { style: unitStyle, children: "m\u00B2" })] }) }), plot && summary.outsideCount > 0 && (_jsx(Row, { label: "Utanf\u00F6r tomt", value: _jsxs("span", { style: { color: "var(--state-danger)" }, children: [summary.outsideCount, " objekt"] }) }))] })] }));
}
const bedPlantRowStyle = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    padding: "6px 0",
    background: "transparent",
    border: 0,
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "var(--font-sans)",
    color: "var(--ink-1)",
};
function BedPlantsSection({ placements, plants, onOpenInCatalog, onRemove }) {
    return (_jsxs("section", { children: [_jsxs("div", { style: sectionTitleStyle, children: ["V\u00E4xter i b\u00E4dden (", placements.length, ")"] }), placements.length === 0 ? (_jsxs("div", { style: { fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.5, fontStyle: "italic" }, children: ["Inga v\u00E4xter \u00E4nnu. \u00D6ppna ", _jsx("strong", { style: { color: "var(--ink-1)" }, children: "V\u00E4xter" }), "-fliken f\u00F6r att l\u00E4gga till."] })) : (_jsx("div", { style: { display: "flex", flexDirection: "column" }, children: placements.map((p) => {
                    const catalogEntry = plants.find((c) => c.id === p.plantId);
                    const category = catalogEntry?.category ?? "vegetable";
                    const scientific = catalogEntry?.scientificName ?? "";
                    return (_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [_jsxs("button", { type: "button", onClick: () => onOpenInCatalog(p.plantId), title: "\u00D6ppna i V\u00E4xter-katalogen", style: { ...bedPlantRowStyle, flex: 1 }, children: [_jsx(PlantThumbnail, { category: category, size: 28 }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("div", { style: {
                                                    fontSize: 13,
                                                    fontWeight: 500,
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                }, children: p.displayName }), scientific && (_jsx("div", { style: {
                                                    fontSize: 11,
                                                    color: "var(--ink-2)",
                                                    fontStyle: "italic",
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                }, children: scientific }))] }), _jsxs("span", { style: {
                                            fontFamily: "var(--font-mono)",
                                            fontSize: 11,
                                            color: "var(--ink-2)",
                                            fontVariantNumeric: "tabular-nums",
                                            flexShrink: 0,
                                        }, children: ["\u00D7", p.count] })] }), _jsx("button", { type: "button", onClick: (e) => {
                                    e.stopPropagation();
                                    onRemove(p.placementId);
                                }, title: `Ta bort ${p.displayName} från bädden`, "aria-label": `Ta bort ${p.displayName}`, style: {
                                    background: "transparent",
                                    border: 0,
                                    cursor: "pointer",
                                    color: "var(--ink-2)",
                                    fontSize: 16,
                                    lineHeight: 1,
                                    padding: "4px 6px",
                                    flexShrink: 0,
                                }, children: "\u00D7" })] }, p.placementId));
                }) }))] }));
}
//# sourceMappingURL=SidePanel.js.map