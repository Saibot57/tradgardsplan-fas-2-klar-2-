import type { PlantCareProfile } from "../../plants/types.js";
import { IconSprout } from "../../icons.js";
import { Section } from "../../shared/Section.js";
import { Row } from "../../shared/Row.js";
import { fmtInt } from "../../format.js";

export function GrowingTipsSection({ plant }: { plant: PlantCareProfile }) {
  return (
    <Section title="Odlingstips" icon={<IconSprout size={14} />}>
      <Row label="Sådd" value={plant.sowingMethod ?? "—"} />
      <Row
        label="Plantavstånd"
        value={
          plant.spreadMm !== undefined ? (
            <>
              {fmtInt(plant.spreadMm)} <span style={{ color: "var(--ink-2)" }}>mm</span>
            </>
          ) : (
            "—"
          )
        }
      />
      <Row
        label="Radavstånd"
        value={
          plant.rowSpacingMm !== undefined ? (
            <>
              {fmtInt(plant.rowSpacingMm)} <span style={{ color: "var(--ink-2)" }}>mm</span>
            </>
          ) : (
            "—"
          )
        }
      />
      <Row
        label="Dagar till skörd"
        value={
          plant.daysToMaturity !== undefined ? (
            <>
              {fmtInt(plant.daysToMaturity)} <span style={{ color: "var(--ink-2)" }}>dagar</span>
            </>
          ) : (
            "—"
          )
        }
      />
    </Section>
  );
}
