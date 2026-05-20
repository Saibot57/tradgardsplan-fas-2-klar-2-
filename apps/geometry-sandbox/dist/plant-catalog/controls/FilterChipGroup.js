import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Single-select row of `<Chip>` toggles. Generic over the value type so
 * callers can pass strongly-typed filter unions (category / sun token).
 */
import { Chip } from "../../shared/Chip.js";
const headerStyle = {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "var(--ink-2)",
    fontWeight: 500,
    marginBottom: 4,
};
export function FilterChipGroup({ label, options, value, onChange, }) {
    return (_jsxs("div", { children: [_jsx("div", { style: headerStyle, children: label }), _jsx("div", { style: { display: "flex", flexWrap: "wrap", gap: 4 }, role: "group", "aria-label": label, children: options.map((opt) => (_jsx(Chip, { active: opt.value === value, onToggle: () => onChange(opt.value), children: opt.label }, opt.value))) })] }));
}
//# sourceMappingURL=FilterChipGroup.js.map