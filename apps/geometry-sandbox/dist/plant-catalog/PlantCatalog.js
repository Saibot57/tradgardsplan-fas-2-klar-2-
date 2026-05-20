import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PlantList } from "./PlantList.js";
import { PlantDetailCard } from "./PlantDetailCard.js";
import { PlantDetailEmpty } from "./PlantDetailEmpty.js";
export function PlantCatalog({ plants, beds, selectedPlantId, plannedPlantIds, onSelectPlant, onShowOnCanvas, onTogglePlan, onAddToBed, }) {
    const selected = selectedPlantId
        ? plants.find((p) => p.id === selectedPlantId) ?? null
        : null;
    return (_jsxs("div", { role: "tabpanel", id: "tabpanel-vaxter", "aria-labelledby": "tab-vaxter", style: {
            display: "flex",
            flex: 1,
            minHeight: 0,
            background: "var(--bg-paper)",
        }, children: [_jsx("aside", { style: {
                    width: "var(--layout-sidepanel-w)",
                    flexShrink: 0,
                    borderRight: "1px solid var(--line-1)",
                    background: "var(--bg-surface)",
                    overflowY: "auto",
                }, children: _jsx(PlantList, { plants: plants, beds: beds, selectedPlantId: selectedPlantId, plannedPlantIds: plannedPlantIds, onSelectPlant: onSelectPlant }) }), _jsx("main", { style: {
                    flex: 1,
                    overflowY: "auto",
                    background: "var(--bg-paper)",
                }, children: selected ? (_jsx(PlantDetailCard, { plant: selected, beds: beds, plannedPlantIds: plannedPlantIds, onShowOnCanvas: onShowOnCanvas, onTogglePlan: onTogglePlan, onAddToBed: onAddToBed })) : (_jsx(PlantDetailEmpty, {})) })] }));
}
//# sourceMappingURL=PlantCatalog.js.map