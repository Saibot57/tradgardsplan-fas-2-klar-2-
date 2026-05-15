import type { PlantCareProfile } from "../../plants/types.js";
import { sunCategoryLabel } from "../../plants/format.js";
import { IconSun } from "../../icons.js";
import { Section } from "../../shared/Section.js";
import { Row } from "../../shared/Row.js";
import { RangeBar } from "../primitives/RangeBar.js";
import { fmtInt } from "../../format.js";

const SCALE_MIN = 0;
const SCALE_MAX = 60_000;

export function SunLightSection({ plant }: { plant: PlantCareProfile }) {
  return (
    <Section title="Sol & ljus" icon={<IconSun size={14} />}>
      <Row label="Solbehov" value={sunCategoryLabel(plant.sunCategory)} />
      <Row
        label="Ljusintervall"
        value={
          <>
            {fmtInt(plant.light.minLux)} – {fmtInt(plant.light.maxLux)}{" "}
            <span style={{ color: "var(--ink-2)" }}>lux</span>
          </>
        }
      />
      <RangeBar
        min={plant.light.minLux}
        max={plant.light.maxLux}
        scaleMin={SCALE_MIN}
        scaleMax={SCALE_MAX}
        unit=" lux"
        accent="var(--accent-sun)"
      />
    </Section>
  );
}
