import { jsx as _jsx } from "react/jsx-runtime";
const LABELS = {
    vegetable: "Grönsak",
    herb: "Krydda",
    berry: "Bär",
    flower: "Blomma",
};
const TINT = {
    vegetable: { bg: "var(--bed-100)", fg: "var(--bed-700)", border: "var(--bed-500)" },
    herb: { bg: "var(--success-100)", fg: "var(--success-700)", border: "var(--success-500)" },
    berry: { bg: "var(--soil-100)", fg: "var(--soil-700)", border: "var(--soil-500)" },
    flower: { bg: "var(--sun-100)", fg: "var(--sun-700)", border: "var(--sun-500)" },
};
export function CategoryBadge({ category }) {
    const tint = TINT[category];
    return (_jsx("span", { style: {
            display: "inline-flex",
            alignItems: "center",
            padding: "2px 10px",
            borderRadius: 999,
            background: tint.bg,
            color: tint.fg,
            border: `1px solid ${tint.border}`,
            fontFamily: "var(--font-sans)",
            fontSize: 11,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            fontWeight: 500,
            lineHeight: 1.4,
        }, children: LABELS[category] }));
}
//# sourceMappingURL=CategoryBadge.js.map