/**
 * Right panel of the catalog. Header is implemented here; per-attribute
 * sections (Sol & ljus, Temperatur, Vatten & jord, etc.) land in step 6.
 */

import type { PlantCareProfile } from "../plants/types.js";
import { CategoryBadge } from "./primitives/CategoryBadge.js";
import { PlantThumbnail } from "./primitives/PlantThumbnail.js";

interface PlantDetailCardProps {
  plant: PlantCareProfile;
}

const cardStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 28,
  padding: "32px 32px 48px",
  maxWidth: 720,
  fontFamily: "var(--font-sans)",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  gap: 24,
  alignItems: "flex-start",
};

const titleStyle: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: 32,
  fontWeight: 500,
  letterSpacing: "-0.01em",
  color: "var(--ink-1)",
  margin: "8px 0 4px",
  lineHeight: 1.1,
};

const scientificStyle: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontStyle: "italic",
  fontSize: 16,
  color: "var(--ink-2)",
  margin: 0,
};

const placeholderStyle: React.CSSProperties = {
  fontSize: 13,
  color: "var(--ink-2)",
  fontStyle: "italic",
  padding: "16px 0",
  borderTop: "1px solid var(--line-1)",
};

export function PlantDetailCard({ plant }: PlantDetailCardProps) {
  return (
    <article style={cardStyle}>
      <header style={headerStyle}>
        <PlantThumbnail
          category={plant.category}
          size={120}
          {...(plant.imageUrl !== undefined ? { imageUrl: plant.imageUrl } : {})}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <CategoryBadge category={plant.category} />
          <h2 style={titleStyle}>{plant.commonName}</h2>
          <p style={scientificStyle}>{plant.scientificName}</p>
        </div>
      </header>
      <div style={placeholderStyle}>
        Sektioner (sol & ljus, temperatur, vatten, näring …) landar i nästa steg.
      </div>
    </article>
  );
}
