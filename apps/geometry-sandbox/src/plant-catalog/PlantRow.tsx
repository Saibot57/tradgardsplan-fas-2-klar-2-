/**
 * One row in the catalog list. Renders a thumbnail, common + scientific
 * names, and an optional right-aligned badge (e.g. "×3" total count).
 *
 * `dim` (italic, faded) is used for the "Planerade" section.
 */

import type { PlantCareProfile } from "../plants/types.js";
import { PlantThumbnail } from "./primitives/PlantThumbnail.js";

interface PlantRowProps {
  plant: PlantCareProfile;
  active: boolean;
  onClick: () => void;
  badge?: string;
  dim?: boolean;
}

const baseStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  width: "100%",
  padding: "8px 12px 8px 9px",
  background: "transparent",
  border: 0,
  borderLeft: "3px solid transparent",
  cursor: "pointer",
  textAlign: "left",
  fontFamily: "var(--font-sans)",
  color: "var(--ink-1)",
};

const activeStyle: React.CSSProperties = {
  ...baseStyle,
  background: "var(--bed-100)",
  borderLeft: "3px solid var(--accent-bed)",
};

const nameStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const scientificStyle: React.CSSProperties = {
  fontSize: 11,
  color: "var(--ink-2)",
  fontStyle: "italic",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const badgeStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  color: "var(--ink-2)",
  fontVariantNumeric: "tabular-nums",
  flexShrink: 0,
};

export function PlantRow({ plant, active, onClick, badge, dim }: PlantRowProps) {
  const style: React.CSSProperties = {
    ...(active ? activeStyle : baseStyle),
    opacity: dim ? 0.62 : 1,
    fontStyle: dim ? "italic" : "normal",
  };
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onClick={onClick}
      style={style}
    >
      <PlantThumbnail
        category={plant.category}
        size={28}
        {...(plant.imageUrl !== undefined ? { imageUrl: plant.imageUrl } : {})}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={nameStyle}>{plant.commonName}</div>
        <div style={scientificStyle}>{plant.scientificName}</div>
      </div>
      {badge !== undefined && <span style={badgeStyle}>{badge}</span>}
    </button>
  );
}
