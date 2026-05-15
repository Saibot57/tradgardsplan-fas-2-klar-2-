import type { PlantCareProfile } from "../../plants/types.js";
import { IconDroplet } from "../../icons.js";
import { Section } from "../../shared/Section.js";
import { Row } from "../../shared/Row.js";
import { RangeBar } from "../primitives/RangeBar.js";
import { fmtNum } from "../../format.js";

export function WaterSoilSection({ plant }: { plant: PlantCareProfile }) {
  const soilTypes =
    plant.soilTypes && plant.soilTypes.length > 0 ? plant.soilTypes.join(", ") : "—";
  return (
    <Section title="Vatten & jord" icon={<IconDroplet size={14} />}>
      <Row label="Vattning" value={plant.waterFrequency ?? "—"} />
      <Row label="Jordtyp" value={soilTypes} />
      <Row
        label="Jordfukt"
        value={
          <>
            {fmtNum(plant.soilMoisture.minPct, 0)} – {fmtNum(plant.soilMoisture.maxPct, 0)}{" "}
            <span style={{ color: "var(--ink-2)" }}>%</span>
          </>
        }
      />
      <RangeBar
        min={plant.soilMoisture.minPct}
        max={plant.soilMoisture.maxPct}
        scaleMin={0}
        scaleMax={100}
        unit=" %"
        format={(n) => fmtNum(n, 0)}
        accent="var(--accent-sky)"
      />
    </Section>
  );
}
