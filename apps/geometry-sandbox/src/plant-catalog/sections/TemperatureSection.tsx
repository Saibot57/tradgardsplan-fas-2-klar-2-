import type { PlantCareProfile } from "../../plants/types.js";
import { IconThermometer } from "../../icons.js";
import { Section } from "../../shared/Section.js";
import { Row } from "../../shared/Row.js";
import { RangeBar } from "../primitives/RangeBar.js";
import { fmtNum } from "../../format.js";

const SCALE_MIN = -10;
const SCALE_MAX = 45;

export function TemperatureSection({ plant }: { plant: PlantCareProfile }) {
  return (
    <Section title="Temperatur" icon={<IconThermometer size={14} />}>
      <Row
        label="Klarar"
        value={
          <>
            {fmtNum(plant.temperature.minC, 0)} – {fmtNum(plant.temperature.maxC, 0)}{" "}
            <span style={{ color: "var(--ink-2)" }}>°C</span>
          </>
        }
      />
      <RangeBar
        min={plant.temperature.minC}
        max={plant.temperature.maxC}
        scaleMin={SCALE_MIN}
        scaleMax={SCALE_MAX}
        unit=" °C"
        format={(n) => fmtNum(n, 0)}
        accent="var(--accent-soil)"
      />
    </Section>
  );
}
