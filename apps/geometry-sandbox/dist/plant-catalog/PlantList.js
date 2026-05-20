import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Left panel of the catalog. Three stacked sections:
 *
 *   1. Mina växter  — plants present in at least one bed.plants[]
 *   2. Planerade    — plannedPlantIds minus inGardenIds
 *   3. Alla växter  — full catalog, filtered by search/category/sun
 *
 * Search field and filter chips sit between Planerade and Alla.
 * Selection lives on the parent — we only emit `onSelectPlant`.
 */
import { useMemo, useState } from "react";
import { applyPlantFilters, sortByCommonName, } from "../plants/plantQueries.js";
import { SectionTitle } from "../shared/SectionTitle.js";
import { inGardenIds, plantedSummary } from "../selectors/plantSelectors.js";
import { PlantRow } from "./PlantRow.js";
import { SearchInput } from "./controls/SearchInput.js";
import { FilterChipGroup } from "./controls/FilterChipGroup.js";
const CATEGORY_OPTIONS = [
    { value: "all", label: "Alla" },
    { value: "vegetable", label: "Grönsaker" },
    { value: "herb", label: "Kryddor" },
    { value: "berry", label: "Bär" },
    { value: "flower", label: "Blommor" },
];
const SUN_OPTIONS = [
    { value: "all", label: "Alla" },
    { value: "full", label: "Full sol" },
    { value: "partial", label: "Halvskugga" },
    { value: "shade", label: "Skugga" },
];
const blockStyle = {
    padding: "16px 14px 0",
};
const rowsStyle = {
    display: "flex",
    flexDirection: "column",
};
const emptyHintStyle = {
    padding: "4px 14px 8px",
    fontSize: 12,
    color: "var(--ink-2)",
    fontStyle: "italic",
};
const controlsStyle = {
    padding: "16px 14px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    borderTop: "1px solid var(--line-1)",
    borderBottom: "1px solid var(--line-1)",
    marginTop: 12,
};
export function PlantList({ plants, beds, selectedPlantId, plannedPlantIds, onSelectPlant, }) {
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("all");
    const [sun, setSun] = useState("all");
    const inGarden = useMemo(() => inGardenIds(beds), [beds]);
    const myPlants = useMemo(() => sortByCommonName(plants.filter((p) => inGarden.has(p.id))), [plants, inGarden]);
    const plannedOnly = useMemo(() => {
        const planned = new Set(plannedPlantIds);
        return sortByCommonName(plants.filter((p) => planned.has(p.id) && !inGarden.has(p.id)));
    }, [plants, plannedPlantIds, inGarden]);
    const filtered = useMemo(() => sortByCommonName(applyPlantFilters(plants, { query, category, sun })), [plants, query, category, sun]);
    return (_jsxs("div", { role: "listbox", "aria-label": "V\u00E4xter", children: [_jsx("div", { style: blockStyle, children: _jsxs(SectionTitle, { children: ["Mina v\u00E4xter (", myPlants.length, ")"] }) }), myPlants.length === 0 ? (_jsx("div", { style: emptyHintStyle, children: "Inga v\u00E4xter i b\u00E4ddar \u00E4nnu." })) : (_jsx("div", { style: rowsStyle, children: myPlants.map((p) => {
                    const summary = plantedSummary(beds, p.id);
                    return (_jsx(PlantRow, { plant: p, active: p.id === selectedPlantId, onClick: () => onSelectPlant(p.id), badge: `×${summary.total}` }, p.id));
                }) })), plannedOnly.length > 0 && (_jsxs(_Fragment, { children: [_jsx("div", { style: blockStyle, children: _jsxs(SectionTitle, { children: ["Planerade (", plannedOnly.length, ")"] }) }), _jsx("div", { style: rowsStyle, children: plannedOnly.map((p) => (_jsx(PlantRow, { plant: p, active: p.id === selectedPlantId, onClick: () => onSelectPlant(p.id), dim: true }, p.id))) })] })), _jsxs("div", { style: controlsStyle, children: [_jsx(SearchInput, { value: query, onChange: setQuery }), _jsx(FilterChipGroup, { label: "Typ", options: CATEGORY_OPTIONS, value: category, onChange: setCategory }), _jsx(FilterChipGroup, { label: "Sol", options: SUN_OPTIONS, value: sun, onChange: setSun })] }), _jsx("div", { style: blockStyle, children: _jsxs(SectionTitle, { children: ["Alla v\u00E4xter (", filtered.length, ")"] }) }), filtered.length === 0 ? (_jsx("div", { style: emptyHintStyle, children: "Inga v\u00E4xter matchar s\u00F6kningen." })) : (_jsx("div", { style: rowsStyle, children: filtered.map((p) => (_jsx(PlantRow, { plant: p, active: p.id === selectedPlantId, onClick: () => onSelectPlant(p.id) }, p.id))) }))] }));
}
//# sourceMappingURL=PlantList.js.map