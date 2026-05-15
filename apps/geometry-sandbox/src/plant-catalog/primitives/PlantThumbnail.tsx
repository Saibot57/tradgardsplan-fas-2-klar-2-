/**
 * Square category-tinted thumbnail with a centered icon. Used in:
 *   - list rows (28 px)
 *   - detail card header (120 px)
 *   - thumb badges anywhere else (any size)
 *
 * Real photos arrive once product provides them — when `imageUrl` is set,
 * render the photo instead of the tinted glyph.
 */

import type { PlantCategory } from "../../plants/types.js";
import {
  IconCarrot,
  IconCherry,
  IconFlower,
  IconLeaf,
} from "../../icons.js";

const TINT: Readonly<Record<PlantCategory, { bg: string; fg: string }>> = {
  vegetable: { bg: "var(--bed-100)", fg: "var(--bed-700)" },
  herb: { bg: "var(--success-100)", fg: "var(--success-700)" },
  berry: { bg: "var(--soil-100)", fg: "var(--soil-700)" },
  flower: { bg: "var(--sun-100)", fg: "var(--sun-700)" },
};

function CategoryGlyph({ category, size }: { category: PlantCategory; size: number }) {
  switch (category) {
    case "vegetable":
      return <IconCarrot size={size} />;
    case "herb":
      return <IconLeaf size={size} />;
    case "berry":
      return <IconCherry size={size} />;
    case "flower":
      return <IconFlower size={size} />;
  }
}

interface PlantThumbnailProps {
  category: PlantCategory;
  size?: number;
  imageUrl?: string;
}

export function PlantThumbnail({ category, size = 40, imageUrl }: PlantThumbnailProps) {
  const radius = Math.max(4, Math.round(size * 0.15));
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          objectFit: "cover",
          flexShrink: 0,
          display: "block",
        }}
      />
    );
  }
  const tint = TINT[category];
  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: tint.bg,
        color: tint.fg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <CategoryGlyph category={category} size={Math.round(size * 0.5)} />
    </div>
  );
}
