import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { IconArrowRight, IconMapPin } from "../../icons.js";
import { Section } from "../../shared/Section.js";
import { plantedSummary } from "../../selectors/plantSelectors.js";
import { fmtInt } from "../../format.js";
export function InMyGardenSection({ plant, beds, plannedPlantIds, onShowOnCanvas, }) {
    const summary = plantedSummary(beds, plant.id);
    const planted = summary.bedCount > 0;
    const planned = plannedPlantIds.includes(plant.id);
    if (!planted && !planned)
        return null;
    return (_jsx(Section, { title: "I min tr\u00E4dg\u00E5rd", icon: _jsx(IconMapPin, { size: 14 }), accent: true, children: planted ? (_jsxs(_Fragment, { children: [_jsxs("p", { style: { margin: 0, fontSize: 13, color: "var(--ink-1)" }, children: ["Planterad i ", _jsx("strong", { children: fmtInt(summary.bedCount) }), " ", summary.bedCount === 1 ? "bädd" : "bäddar", ", totalt", " ", _jsx("strong", { children: fmtInt(summary.total) }), " st."] }), _jsx("div", { style: { marginTop: 12 }, children: _jsxs("button", { "data-pp-btn": true, "data-variant": "primary", onClick: () => onShowOnCanvas(plant.id), title: "Hoppa till Planera-fliken och markera b\u00E4dden", children: ["Visa p\u00E5 canvas ", _jsx(IconArrowRight, { size: 14 })] }) })] })) : (_jsx("p", { style: { margin: 0, fontSize: 13, color: "var(--ink-1)", fontStyle: "italic" }, children: "Planerad \u2014 inte placerad i n\u00E5gon b\u00E4dd \u00E4nnu." })) }));
}
//# sourceMappingURL=InMyGardenSection.js.map