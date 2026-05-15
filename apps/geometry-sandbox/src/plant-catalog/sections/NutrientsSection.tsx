import type { PlantCareProfile } from "../../plants/types.js";
import { ecLabel } from "../../plants/format.js";
import { IconFlask } from "../../icons.js";
import { Section } from "../../shared/Section.js";
import { Row } from "../../shared/Row.js";
import { fmtInt } from "../../format.js";

export function NutrientsSection({ plant }: { plant: PlantCareProfile }) {
  return (
    <Section title="Näring" icon={<IconFlask size={14} />}>
      <Row
        label="EC"
        value={
          <>
            {fmtInt(plant.nutrientEC.minMicroS)} – {fmtInt(plant.nutrientEC.maxMicroS)}{" "}
            <span style={{ color: "var(--ink-2)" }}>µS/cm</span>
          </>
        }
      />
      <div style={{ fontSize: 12, color: "var(--ink-2)", fontStyle: "italic", marginTop: 4 }}>
        ({ecLabel(plant.nutrientEC.maxMicroS)})
      </div>
    </Section>
  );
}
