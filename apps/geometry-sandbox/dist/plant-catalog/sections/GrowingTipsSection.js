import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { IconSprout } from "../../icons.js";
import { Section } from "../../shared/Section.js";
import { Row } from "../../shared/Row.js";
import { fmtInt } from "../../format.js";
export function GrowingTipsSection({ plant }) {
    return (_jsxs(Section, { title: "Odlingstips", icon: _jsx(IconSprout, { size: 14 }), children: [_jsx(Row, { label: "S\u00E5dd", value: plant.sowingMethod ?? "—" }), _jsx(Row, { label: "Plantavst\u00E5nd", value: plant.spreadMm !== undefined ? (_jsxs(_Fragment, { children: [fmtInt(plant.spreadMm), " ", _jsx("span", { style: { color: "var(--ink-2)" }, children: "mm" })] })) : ("—") }), _jsx(Row, { label: "Radavst\u00E5nd", value: plant.rowSpacingMm !== undefined ? (_jsxs(_Fragment, { children: [fmtInt(plant.rowSpacingMm), " ", _jsx("span", { style: { color: "var(--ink-2)" }, children: "mm" })] })) : ("—") }), _jsx(Row, { label: "Dagar till sk\u00F6rd", value: plant.daysToMaturity !== undefined ? (_jsxs(_Fragment, { children: [fmtInt(plant.daysToMaturity), " ", _jsx("span", { style: { color: "var(--ink-2)" }, children: "dagar" })] })) : ("—") })] }));
}
//# sourceMappingURL=GrowingTipsSection.js.map