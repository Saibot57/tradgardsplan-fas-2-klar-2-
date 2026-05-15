import type { PlantCareProfile } from "../../plants/types.js";
import { IconWind } from "../../icons.js";
import { Section } from "../../shared/Section.js";
import { Row } from "../../shared/Row.js";
import { RangeBar } from "../primitives/RangeBar.js";
import { fmtNum } from "../../format.js";

export function HumiditySection({ plant }: { plant: PlantCareProfile }) {
  return (
    <Section title="Luftfuktighet" icon={<IconWind size={14} />}>
      <Row
        label="Intervall"
        value={
          <>
            {fmtNum(plant.humidity.minPct, 0)} – {fmtNum(plant.humidity.maxPct, 0)}{" "}
            <span style={{ color: "var(--ink-2)" }}>%</span>
          </>
        }
      />
      <RangeBar
        min={plant.humidity.minPct}
        max={plant.humidity.maxPct}
        scaleMin={0}
        scaleMax={100}
        unit=" %"
        format={(n) => fmtNum(n, 0)}
        accent="var(--accent-sky)"
      />
    </Section>
  );
}
