import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { IconCheck, IconPlus } from "../icons.js";
import { CategoryBadge } from "./primitives/CategoryBadge.js";
import { PlantThumbnail } from "./primitives/PlantThumbnail.js";
import { AddToBedDropdown } from "./controls/AddToBedDropdown.js";
import { SunLightSection } from "./sections/SunLightSection.js";
import { TemperatureSection } from "./sections/TemperatureSection.js";
import { WaterSoilSection } from "./sections/WaterSoilSection.js";
import { NutrientsSection } from "./sections/NutrientsSection.js";
import { HumiditySection } from "./sections/HumiditySection.js";
import { GrowingTipsSection } from "./sections/GrowingTipsSection.js";
import { InMyGardenSection } from "./sections/InMyGardenSection.js";
const cardStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 28,
    padding: "32px 32px 48px",
    maxWidth: 720,
    fontFamily: "var(--font-sans)",
};
const headerStyle = {
    display: "flex",
    gap: 24,
    alignItems: "flex-start",
};
const titleStyle = {
    fontFamily: "var(--font-display)",
    fontSize: 32,
    fontWeight: 500,
    letterSpacing: "-0.01em",
    color: "var(--ink-1)",
    margin: "8px 0 4px",
    lineHeight: 1.1,
};
const scientificStyle = {
    fontFamily: "var(--font-display)",
    fontStyle: "italic",
    fontSize: 16,
    color: "var(--ink-2)",
    margin: "0 0 12px",
};
const actionRowStyle = {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
};
export function PlantDetailCard({ plant, beds, plannedPlantIds, onShowOnCanvas, onTogglePlan, onAddToBed, }) {
    const planned = plannedPlantIds.includes(plant.id);
    return (_jsxs("article", { style: cardStyle, children: [_jsxs("header", { style: headerStyle, children: [_jsx(PlantThumbnail, { category: plant.category, size: 120, ...(plant.imageUrl !== undefined ? { imageUrl: plant.imageUrl } : {}) }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx(CategoryBadge, { category: plant.category }), _jsx("h2", { style: titleStyle, children: plant.commonName }), _jsx("p", { style: scientificStyle, children: plant.scientificName }), _jsxs("div", { style: actionRowStyle, children: [_jsxs("button", { type: "button", "data-pp-btn": true, "data-variant": planned ? "primary" : "ghost", "aria-pressed": planned, onClick: () => onTogglePlan(plant.id), title: planned ? "Ta bort från planerade" : "Markera som planerad", children: [planned ? _jsx(IconCheck, { size: 14 }) : _jsx(IconPlus, { size: 14 }), planned ? " Planerad" : " Planera"] }), _jsx(AddToBedDropdown, { beds: beds, onSelect: (bedId) => onAddToBed(plant.id, bedId) })] })] })] }), _jsx(SunLightSection, { plant: plant }), _jsx(TemperatureSection, { plant: plant }), _jsx(WaterSoilSection, { plant: plant }), _jsx(NutrientsSection, { plant: plant }), _jsx(HumiditySection, { plant: plant }), _jsx(GrowingTipsSection, { plant: plant }), _jsx(InMyGardenSection, { plant: plant, beds: beds, plannedPlantIds: plannedPlantIds, onShowOnCanvas: onShowOnCanvas })] }));
}
//# sourceMappingURL=PlantDetailCard.js.map