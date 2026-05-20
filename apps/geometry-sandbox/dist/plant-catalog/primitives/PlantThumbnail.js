import { jsx as _jsx } from "react/jsx-runtime";
import { IconCarrot, IconCherry, IconFlower, IconLeaf, } from "../../icons.js";
const TINT = {
    vegetable: { bg: "var(--bed-100)", fg: "var(--bed-700)" },
    herb: { bg: "var(--success-100)", fg: "var(--success-700)" },
    berry: { bg: "var(--soil-100)", fg: "var(--soil-700)" },
    flower: { bg: "var(--sun-100)", fg: "var(--sun-700)" },
};
function CategoryGlyph({ category, size }) {
    switch (category) {
        case "vegetable":
            return _jsx(IconCarrot, { size: size });
        case "herb":
            return _jsx(IconLeaf, { size: size });
        case "berry":
            return _jsx(IconCherry, { size: size });
        case "flower":
            return _jsx(IconFlower, { size: size });
    }
}
export function PlantThumbnail({ category, size = 40, imageUrl }) {
    const radius = Math.max(4, Math.round(size * 0.15));
    if (imageUrl) {
        return (_jsx("img", { src: imageUrl, alt: "", style: {
                width: size,
                height: size,
                borderRadius: radius,
                objectFit: "cover",
                flexShrink: 0,
                display: "block",
            } }));
    }
    const tint = TINT[category];
    return (_jsx("div", { "aria-hidden": "true", style: {
            width: size,
            height: size,
            borderRadius: radius,
            background: tint.bg,
            color: tint.fg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
        }, children: _jsx(CategoryGlyph, { category: category, size: Math.round(size * 0.5) }) }));
}
//# sourceMappingURL=PlantThumbnail.js.map