import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { IconDroplet } from "../../icons.js";
import { Section } from "../../shared/Section.js";
import { Row } from "../../shared/Row.js";
import { RangeBar } from "../primitives/RangeBar.js";
import { fmtNum } from "../../format.js";
export function WaterSoilSection({ plant }) {
    const soilTypes = plant.soilTypes && plant.soilTypes.length > 0 ? plant.soilTypes.join(", ") : "—";
    return (_jsxs(Section, { title: "Vatten & jord", icon: _jsx(IconDroplet, { size: 14 }), children: [_jsx(Row, { label: "Vattning", value: plant.waterFrequency ?? "—" }), _jsx(Row, { label: "Jordtyp", value: soilTypes }), _jsx(Row, { label: "Jordfukt", value: _jsxs(_Fragment, { children: [fmtNum(plant.soilMoisture.minPct, 0), " \u2013 ", fmtNum(plant.soilMoisture.maxPct, 0), " ", _jsx("span", { style: { color: "var(--ink-2)" }, children: "%" })] }) }), _jsx(RangeBar, { min: plant.soilMoisture.minPct, max: plant.soilMoisture.maxPct, scaleMin: 0, scaleMax: 100, unit: " %", format: (n) => fmtNum(n, 0), accent: "var(--accent-sky)" })] }));
}
//# sourceMappingURL=WaterSoilSection.js.map