import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { sunCategoryLabel } from "../../plants/format.js";
import { IconSun } from "../../icons.js";
import { Section } from "../../shared/Section.js";
import { Row } from "../../shared/Row.js";
import { RangeBar } from "../primitives/RangeBar.js";
import { fmtInt } from "../../format.js";
const SCALE_MIN = 0;
const SCALE_MAX = 60_000;
export function SunLightSection({ plant }) {
    return (_jsxs(Section, { title: "Sol & ljus", icon: _jsx(IconSun, { size: 14 }), children: [_jsx(Row, { label: "Solbehov", value: sunCategoryLabel(plant.sunCategory) }), _jsx(Row, { label: "Ljusintervall", value: _jsxs(_Fragment, { children: [fmtInt(plant.light.minLux), " \u2013 ", fmtInt(plant.light.maxLux), " ", _jsx("span", { style: { color: "var(--ink-2)" }, children: "lux" })] }) }), _jsx(RangeBar, { min: plant.light.minLux, max: plant.light.maxLux, scaleMin: SCALE_MIN, scaleMax: SCALE_MAX, unit: " lux", accent: "var(--accent-sun)" })] }));
}
//# sourceMappingURL=SunLightSection.js.map