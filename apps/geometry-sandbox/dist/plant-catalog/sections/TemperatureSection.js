import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { IconThermometer } from "../../icons.js";
import { Section } from "../../shared/Section.js";
import { Row } from "../../shared/Row.js";
import { RangeBar } from "../primitives/RangeBar.js";
import { fmtNum } from "../../format.js";
const SCALE_MIN = -10;
const SCALE_MAX = 45;
export function TemperatureSection({ plant }) {
    return (_jsxs(Section, { title: "Temperatur", icon: _jsx(IconThermometer, { size: 14 }), children: [_jsx(Row, { label: "Klarar", value: _jsxs(_Fragment, { children: [fmtNum(plant.temperature.minC, 0), " \u2013 ", fmtNum(plant.temperature.maxC, 0), " ", _jsx("span", { style: { color: "var(--ink-2)" }, children: "\u00B0C" })] }) }), _jsx(RangeBar, { min: plant.temperature.minC, max: plant.temperature.maxC, scaleMin: SCALE_MIN, scaleMax: SCALE_MAX, unit: " \u00B0C", format: (n) => fmtNum(n, 0), accent: "var(--accent-soil)" })] }));
}
//# sourceMappingURL=TemperatureSection.js.map