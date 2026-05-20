/**
 * SidePanel — per-bed inspector.
 *
 * Shows dimensions, area, soil volume, rotation, wall height, and
 * **aggregate summer sun hours** for the selected bed.
 *
 * Aggregate sun hours uses a fixed reference date (midsummer) and is
 * INDEPENDENT of TimeSlider, which controls interactive shadow preview.
 * These two never share a state field (ADR-007/008 distinction).
 */

import { useMemo } from "react";
import {
  bedSoilVolumeLitres,
  bedSunHours,
  rectAreaM2,
  type Rect,
} from "@kolonitradgard/spatial-core";
import type { SandboxState } from "./state.js";

// Midsummer near Landskrona — fixed reference date for aggregate analysis.
const REFERENCE_DATE = new Date(2025, 5, 21);

interface Props {
  state: SandboxState;
  bedDepth: number;
}

const panelStyle: React.CSSProperties = {
  width: 240,
  background: "#1e1e1e",
  borderLeft: "1px solid #333",
  color: "#ddd",
  padding: 12,
  fontSize: 12,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  flexShrink: 0,
  overflowY: "auto",
};

const labelStyle: React.CSSProperties = {
  color: "#888",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: 0.5,
};

const valueStyle: React.CSSProperties = {
  color: "#eee",
  fontSize: 13,
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>{value}</div>
    </div>
  );
}

export function SidePanel({ state, bedDepth }: Props) {
  const selected: Rect | undefined = state.rectangles.find(
    (r) => r.id === state.selectedId,
  );

  const sunHoursValue = useMemo(() => {
    if (!selected) return null;
    const others = state.rectangles.filter((r) => r.id !== selected.id);
    return bedSunHours(
      selected,
      others,
      REFERENCE_DATE,
      state.plot.location,
      state.plot.northRotationDeg,
    );
  }, [
    selected,
    state.rectangles,
    state.plot.location,
    state.plot.northRotationDeg,
  ]);

  if (!selected) {
    return (
      <div style={panelStyle}>
        <strong style={{ color: "#eee", fontSize: 13 }}>Bädd-inspektor</strong>
        <div style={{ color: "#888", fontStyle: "italic", marginTop: 6 }}>
          Markera en bädd för att se detaljer.
        </div>
      </div>
    );
  }

  const areaM2 = rectAreaM2(selected);
  const soilL = bedSoilVolumeLitres(selected, bedDepth);

  return (
    <div style={panelStyle}>
      <strong style={{ color: "#eee", fontSize: 13 }}>Bädd-inspektor</strong>
      <Row label="ID" value={selected.id} />
      <Row
        label="Mått"
        value={`${selected.width} × ${selected.height} mm`}
      />
      <Row
        label="Position (center)"
        value={`(${selected.cx}, ${selected.cy}) mm`}
      />
      <Row
        label="Rotation"
        value={`${selected.rotationDeg.toFixed(1)}°`}
      />
      <Row
        label="Vägghöjd"
        value={selected.wallHeight > 0 ? `${selected.wallHeight} mm` : "—"}
      />
      <Row label="Area" value={`${areaM2.toFixed(2)} m²`} />
      <Row label={`Jordvolym (${bedDepth} mm djup)`} value={`${soilL.toFixed(0)} L`} />
      <div style={{ borderTop: "1px solid #333", marginTop: 8, paddingTop: 8 }}>
        <Row
          label="Soltimmar (midsommar)"
          value={
            sunHoursValue == null ? "—" : `${sunHoursValue.toFixed(0)} h`
          }
        />
        <div style={{ color: "#666", fontSize: 10, marginTop: 4 }}>
          Aggregerad analys över 06–20 på fast referensdatum
          (oberoende av tidsreglaget).
        </div>
      </div>
    </div>
  );
}
