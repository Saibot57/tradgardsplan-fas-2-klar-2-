import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { IconWind } from "../../icons.js";
import { Section } from "../../shared/Section.js";
import { Row } from "../../shared/Row.js";
import { RangeBar } from "../primitives/RangeBar.js";
import { fmtNum } from "../../format.js";
export function HumiditySection({ plant }) {
    return (_jsxs(Section, { title: "Luftfuktighet", icon: _jsx(IconWind, { size: 14 }), children: [_jsx(Row, { label: "Intervall", value: _jsxs(_Fragment, { children: [fmtNum(plant.humidity.minPct, 0), " \u2013 ", fmtNum(plant.humidity.maxPct, 0), " ", _jsx("span", { style: { color: "var(--ink-2)" }, children: "%" })] }) }), _jsx(RangeBar, { min: plant.humidity.minPct, max: plant.humidity.maxPct, scaleMin: 0, scaleMax: 100, unit: " %", format: (n) => fmtNum(n, 0), accent: "var(--accent-sky)" })] }));
}
//# sourceMappingURL=HumiditySection.js.map