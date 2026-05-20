import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { ecLabel } from "../../plants/format.js";
import { IconFlask } from "../../icons.js";
import { Section } from "../../shared/Section.js";
import { Row } from "../../shared/Row.js";
import { fmtInt } from "../../format.js";
export function NutrientsSection({ plant }) {
    return (_jsxs(Section, { title: "N\u00E4ring", icon: _jsx(IconFlask, { size: 14 }), children: [_jsx(Row, { label: "EC", value: _jsxs(_Fragment, { children: [fmtInt(plant.nutrientEC.minMicroS), " \u2013 ", fmtInt(plant.nutrientEC.maxMicroS), " ", _jsx("span", { style: { color: "var(--ink-2)" }, children: "\u00B5S/cm" })] }) }), _jsxs("div", { style: { fontSize: 12, color: "var(--ink-2)", fontStyle: "italic", marginTop: 4 }, children: ["(", ecLabel(plant.nutrientEC.maxMicroS), ")"] })] }));
}
//# sourceMappingURL=NutrientsSection.js.map