/**
 * Right panel of the catalog. Header + the seven detail sections from
 * handoff §5. Mutation buttons (Planera toggle, Lägg till i bädd ▾) are
 * deferred to step 7; "Visa på canvas →" lives inside InMyGardenSection
 * and is just navigation (no mutation).
 */

import type { Rect } from "@kolonitradgard/spatial-core";
import type { PlantCareProfile } from "../plants/types.js";
import { CategoryBadge } from "./primitives/CategoryBadge.js";
import { PlantThumbnail } from "./primitives/PlantThumbnail.js";
import { SunLightSection } from "./sections/SunLightSection.js";
import { TemperatureSection } from "./sections/TemperatureSection.js";
import { WaterSoilSection } from "./sections/WaterSoilSection.js";
import { NutrientsSection } from "./sections/NutrientsSection.js";
import { HumiditySection } from "./sections/HumiditySection.js";
import { GrowingTipsSection } from "./sections/GrowingTipsSection.js";
import { InMyGardenSection } from "./sections/InMyGardenSection.js";

interface PlantDetailCardProps {
  plant: PlantCareProfile;
  beds: readonly Rect[];
  plannedPlantIds: readonly string[];
  onShowOnCanvas: (plantId: string) => void;
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

export function PlantDetailCard({
  plant,
  beds,
  plannedPlantIds,
  onShowOnCanvas,
}: PlantDetailCardProps) {
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
      <SunLightSection plant={plant} />
      <TemperatureSection plant={plant} />
      <WaterSoilSection plant={plant} />
      <NutrientsSection plant={plant} />
      <HumiditySection plant={plant} />
      <GrowingTipsSection plant={plant} />
      <InMyGardenSection
        plant={plant}
        beds={beds}
        plannedPlantIds={plannedPlantIds}
        onShowOnCanvas={onShowOnCanvas}
      />
    </article>
  );
}
