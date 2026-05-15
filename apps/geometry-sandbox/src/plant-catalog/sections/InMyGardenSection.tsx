/**
 * "I min trädgård" — visible only when the plant is placed in at least one
 * bed OR present in plannedPlantIds. Planted state takes priority over
 * planned in the copy (handoff §5).
 */

import type { Rect } from "@kolonitradgard/spatial-core";
import type { PlantCareProfile } from "../../plants/types.js";
import { IconArrowRight, IconMapPin } from "../../icons.js";
import { Section } from "../../shared/Section.js";
import { plantedSummary } from "../../selectors/plantSelectors.js";
import { fmtInt } from "../../format.js";

interface InMyGardenSectionProps {
  plant: PlantCareProfile;
  beds: readonly Rect[];
  plannedPlantIds: readonly string[];
  onShowOnCanvas: (plantId: string) => void;
}

export function InMyGardenSection({
  plant,
  beds,
  plannedPlantIds,
  onShowOnCanvas,
}: InMyGardenSectionProps) {
  const summary = plantedSummary(beds, plant.id);
  const planted = summary.bedCount > 0;
  const planned = plannedPlantIds.includes(plant.id);

  if (!planted && !planned) return null;

  return (
    <Section title="I min trädgård" icon={<IconMapPin size={14} />} accent>
      {planted ? (
        <>
          <p style={{ margin: 0, fontSize: 13, color: "var(--ink-1)" }}>
            Planterad i <strong>{fmtInt(summary.bedCount)}</strong>{" "}
            {summary.bedCount === 1 ? "bädd" : "bäddar"}, totalt{" "}
            <strong>{fmtInt(summary.total)}</strong> st.
          </p>
          <div style={{ marginTop: 12 }}>
            <button
              data-pp-btn
              data-variant="primary"
              onClick={() => onShowOnCanvas(plant.id)}
              title="Hoppa till Planera-fliken och markera bädden"
            >
              Visa på canvas <IconArrowRight size={14} />
            </button>
          </div>
        </>
      ) : (
        <p style={{ margin: 0, fontSize: 13, color: "var(--ink-1)", fontStyle: "italic" }}>
          Planerad — inte placerad i någon bädd ännu.
        </p>
      )}
    </Section>
  );
}
