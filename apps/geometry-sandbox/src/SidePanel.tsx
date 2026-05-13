/**
 * SidePanel — per-bed inspector.
 *
 * Aggregate summer sun hours use a fixed reference date (midsummer)
 * and are INDEPENDENT of TimeSlider (which controls interactive shadow
 * preview). The two are never collapsed into a shared state field.
 */

import { useMemo, type Dispatch } from "react";
import {
  bedSoilVolumeLitres,
  bedSunHours,
  getKind,
  KIND_RULES,
  OBJECT_KINDS,
  rectAreaM2,
  rectContainedIn,
  type Containment,
  type ObjectKind,
  type Rect,
} from "@kolonitradgard/spatial-core";
import { MIN_RECT_DIMENSION_MM, type Action, type SandboxState } from "./state.js";
import type { HistoryAction } from "./history.js";
import { IconTrash } from "./icons.js";
import { fmtInt, fmtNum } from "./format.js";

// Midsummer near Landskrona — fixed reference date for aggregate analysis.
const REFERENCE_DATE = new Date(2025, 5, 21);

const KIND_LABEL: Readonly<Record<ObjectKind, string>> = {
  bed: "Bädd",
  building: "Byggnad",
  hedge: "Häck",
  surface: "Underlag",
};

const KIND_LABEL_PLURAL: Readonly<Record<ObjectKind, string>> = {
  bed: "Bäddar",
  building: "Byggnader",
  hedge: "Häckar",
  surface: "Underlag",
};

function containmentLabel(c: Containment): { text: string; color: string } {
  switch (c) {
    case "inside":
      return { text: "Innanför tomten", color: "var(--state-success)" };
    case "partial":
      return { text: "Delvis utanför tomten", color: "var(--accent-sun)" };
    case "outside":
      return { text: "Utanför tomten", color: "var(--state-danger)" };
  }
}

interface Props {
  state: SandboxState;
  bedDepth: number;
  dispatch: Dispatch<Action | HistoryAction>;
  overlappingIds: Set<string>;
  touchingIds: Set<string>;
}

const panelStyle: React.CSSProperties = {
  width: "var(--layout-sidepanel-w)",
  flexShrink: 0,
  background: "var(--bg-surface)",
  borderLeft: "1px solid var(--line-1)",
  color: "var(--ink-1)",
  padding: "20px 22px",
  display: "flex",
  flexDirection: "column",
  gap: 22,
  overflowY: "auto",
  fontFamily: "var(--font-sans)",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 11.5,
  color: "var(--ink-2)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontWeight: 500,
  marginBottom: 6,
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  gap: 12,
  padding: "5px 0",
};

const rowLabelStyle: React.CSSProperties = {
  fontSize: 11.5,
  color: "var(--ink-2)",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  fontWeight: 500,
};

const rowValueStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 13.5,
  color: "var(--ink-1)",
  fontVariantNumeric: "tabular-nums",
  textAlign: "right",
};

const unitStyle: React.CSSProperties = { color: "var(--ink-2)" };

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={rowStyle}>
      <div style={rowLabelStyle}>{label}</div>
      <div style={rowValueStyle}>{value}</div>
    </div>
  );
}

const boundaryInputStyle: React.CSSProperties = {
  width: 88,
  textAlign: "right",
  fontSize: 13,
};

function BoundaryNumberRow({
  label,
  value,
  unit,
  step,
  min,
  onCommit,
}: {
  label: string;
  value: number;
  unit: string;
  step: number;
  min?: number;
  onCommit: (next: number) => void;
}) {
  return (
    <div style={rowStyle}>
      <div style={rowLabelStyle}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <input
          type="number"
          value={value}
          step={step}
          {...(min !== undefined ? { min } : {})}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n)) onCommit(n);
          }}
          data-pp-input
          data-mono="true"
          style={boundaryInputStyle}
        />
        <span style={{ ...unitStyle, fontSize: 12.5 }}>{unit}</span>
      </div>
    </div>
  );
}

export function SidePanel({ state, bedDepth, dispatch, overlappingIds, touchingIds }: Props) {
  const primaryId = state.selectedIds[0] ?? null;
  const selected: Rect | undefined = state.rectangles.find(
    (r) => r.id === primaryId,
  );
  const selectedKind = selected ? getKind(selected) : null;
  const multiCount = state.selectedIds.length;

  const sunHoursValue = useMemo(() => {
    if (!selected) return null;
    if (getKind(selected) !== "bed") return null;
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

  const plot = state.plot.boundaryRect;

  /** Per-typ-grupperad sammanställning. */
  const summary = useMemo(() => {
    const totals: Record<ObjectKind, { count: number; areaM2: number; soilL: number }> = {
      bed:      { count: 0, areaM2: 0, soilL: 0 },
      building: { count: 0, areaM2: 0, soilL: 0 },
      hedge:    { count: 0, areaM2: 0, soilL: 0 },
      surface:  { count: 0, areaM2: 0, soilL: 0 },
    };
    let outsideCount = 0;
    for (const r of state.rectangles) {
      const k = getKind(r);
      totals[k].count += 1;
      totals[k].areaM2 += rectAreaM2(r);
      totals[k].soilL += bedSoilVolumeLitres(r, bedDepth);
      if (plot && rectContainedIn(r, plot) === "outside") outsideCount += 1;
    }
    return { totals, outsideCount };
  }, [state.rectangles, bedDepth, plot]);

  const totalArea =
    summary.totals.bed.areaM2 +
    summary.totals.building.areaM2 +
    summary.totals.hedge.areaM2 +
    summary.totals.surface.areaM2;

  const selectedContainment: Containment | null = useMemo(() => {
    if (!selected || !plot) return null;
    return rectContainedIn(selected, plot);
  }, [selected, plot]);

  return (
    <aside style={panelStyle}>
      <div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 22,
            color: "var(--ink-1)",
            letterSpacing: "-0.01em",
            lineHeight: 1.15,
            fontWeight: 500,
          }}
        >
          {selected ? "Objektinspektor" : "Inget objekt valt"}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--ink-2)", marginTop: 4, lineHeight: 1.5 }}>
          {multiCount > 1
            ? `${multiCount} objekt valda — visar primär.`
            : selected
              ? `${KIND_LABEL[getKind(selected)]} — mått och relevanta beräkningar.`
              : "Klicka på ett objekt i ritningen för att se detaljer."}
        </div>
      </div>

      {selected && (
        <section>
          <div style={sectionTitleStyle}>Identitet</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <input
              type="text"
              placeholder="Namn (t.ex. Tomater 2026)"
              value={selected.label ?? ""}
              onChange={(e) =>
                dispatch({ type: "setRectMeta", id: selected.id, label: e.target.value })
              }
              data-pp-input
              style={{ fontSize: 13, padding: "5px 8px" }}
            />
            <textarea
              placeholder="Anteckningar…"
              value={selected.notes ?? ""}
              onChange={(e) =>
                dispatch({ type: "setRectMeta", id: selected.id, notes: e.target.value })
              }
              data-pp-input
              rows={3}
              style={{ fontSize: 12.5, padding: "5px 8px", resize: "vertical", fontFamily: "var(--font-sans)" }}
            />
            <div style={{ display: "flex", gap: 4 }} role="radiogroup" aria-label="Objekttyp">
              {OBJECT_KINDS.map((k) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={selectedKind === k}
                  data-pp-btn
                  data-variant={selectedKind === k ? "primary" : "ghost"}
                  onClick={() => dispatch({ type: "setRectKind", id: selected.id, kind: k })}
                  style={{ flex: 1, fontSize: 12, padding: "4px 6px" }}
                  title={`Byt typ till ${KIND_LABEL[k]}`}
                >
                  {KIND_LABEL[k]}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {selected && (
        <section>
          <div style={sectionTitleStyle}>Geometri</div>
          <Row label="ID" value={selected.id} />
          <Row
            label="Status"
            value={
              overlappingIds.has(selected.id) ? (
                <span style={{ color: "var(--state-danger)" }}>Krockar</span>
              ) : touchingIds.has(selected.id) ? (
                <span style={{ color: "var(--accent-sun)" }}>Snuddar kant</span>
              ) : (
                <span style={{ color: "var(--state-success)" }}>Fristående</span>
              )
            }
          />
          <Row
            label="Mått"
            value={
              <>
                {fmtInt(selected.width)} × {fmtInt(selected.height)}{" "}
                <span style={unitStyle}>mm</span>
              </>
            }
          />
          <Row
            label="Position"
            value={<>({fmtInt(selected.cx)}, {fmtInt(selected.cy)})</>}
          />
          <Row label="Rotation" value={<>{fmtNum(selected.rotationDeg, 1)}°</>} />
          {selectedKind && (selectedKind === "building" || selectedKind === "hedge") && (
            <Row
              label="Vägghöjd"
              value={
                selected.wallHeight > 0 ? (
                  <>
                    {fmtInt(selected.wallHeight)} <span style={unitStyle}>mm</span>
                  </>
                ) : (
                  "—"
                )
              }
            />
          )}
          {selectedContainment && (
            <Row
              label="Tomt"
              value={
                <span style={{ color: containmentLabel(selectedContainment).color }}>
                  {containmentLabel(selectedContainment).text}
                </span>
              }
            />
          )}
        </section>
      )}

      {selected && (
        <section>
          <div style={sectionTitleStyle}>Beräkningar</div>
          <Row
            label="Area"
            value={
              <>
                {fmtNum(rectAreaM2(selected), 2)} <span style={unitStyle}>m²</span>
              </>
            }
          />
          {selectedKind && KIND_RULES[selectedKind].hasSoil && (
            <Row
              label={`Jordvolym (${bedDepth} mm)`}
              value={
                <>
                  {fmtInt(bedSoilVolumeLitres(selected, bedDepth))}{" "}
                  <span style={unitStyle}>L</span>
                </>
              }
            />
          )}
        </section>
      )}

      {selected && selectedKind === "bed" && (
        <section>
          <div style={sectionTitleStyle}>Soltimmar</div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 32,
              color: "var(--ink-1)",
              letterSpacing: "-0.01em",
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1.1,
            }}
          >
            {sunHoursValue == null ? "—" : fmtNum(sunHoursValue, 1)}
            <span style={{ fontSize: 15, color: "var(--ink-2)", marginLeft: 4 }}>h</span>
          </div>
          <div style={{ fontSize: 11.5, color: "var(--ink-2)", marginTop: 6, lineHeight: 1.5 }}>
            Aggregerad analys 06–20 vid midsommar. Oberoende av tidsreglaget.
          </div>
        </section>
      )}

      <div style={{ height: 1, background: "var(--line-1)" }} />

      <section>
        <div style={sectionTitleStyle}>Tomtgräns</div>
        {plot ? (
          <>
            <BoundaryNumberRow
              label="Bredd"
              value={plot.width}
              unit="mm"
              step={100}
              min={MIN_RECT_DIMENSION_MM}
              onCommit={(w) =>
                dispatch({
                  type: "setPlotBoundary",
                  rect: { ...plot, width: Math.max(MIN_RECT_DIMENSION_MM, Math.round(w)) },
                })
              }
            />
            <BoundaryNumberRow
              label="Höjd"
              value={plot.height}
              unit="mm"
              step={100}
              min={MIN_RECT_DIMENSION_MM}
              onCommit={(h) =>
                dispatch({
                  type: "setPlotBoundary",
                  rect: { ...plot, height: Math.max(MIN_RECT_DIMENSION_MM, Math.round(h)) },
                })
              }
            />
            <BoundaryNumberRow
              label="X (centrum)"
              value={plot.cx}
              unit="mm"
              step={100}
              onCommit={(cx) =>
                dispatch({
                  type: "setPlotBoundary",
                  rect: { ...plot, cx: Math.round(cx) },
                })
              }
            />
            <BoundaryNumberRow
              label="Y (centrum)"
              value={plot.cy}
              unit="mm"
              step={100}
              onCommit={(cy) =>
                dispatch({
                  type: "setPlotBoundary",
                  rect: { ...plot, cy: Math.round(cy) },
                })
              }
            />
            <BoundaryNumberRow
              label="Rotation"
              value={Number(plot.rotationDeg.toFixed(1))}
              unit="°"
              step={1}
              onCommit={(deg) =>
                dispatch({
                  type: "setPlotBoundary",
                  rect: { ...plot, rotationDeg: deg },
                })
              }
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
              <button
                data-pp-btn
                data-variant="ghost"
                onClick={() => dispatch({ type: "setPlotBoundary", rect: null })}
                title="Ta bort tomtgränsen"
              >
                <IconTrash size={13} /> Ta bort tomt
              </button>
            </div>
          </>
        ) : (
          <div style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.5 }}>
            Ingen tomt definierad. Tryck på <strong style={{ color: "var(--ink-1)" }}>Tomt</strong>{" "}
            i verktygsfältet för att lägga till en yttre rektangel.
          </div>
        )}
      </section>

      <section>
        <div style={sectionTitleStyle}>Sammanställning</div>
        <Row
          label="Tomt"
          value={
            plot ? (
              <>
                {fmtNum(plot.width / 1000, 1)} × {fmtNum(plot.height / 1000, 1)}{" "}
                <span style={unitStyle}>m</span>
              </>
            ) : (
              "—"
            )
          }
        />
        {OBJECT_KINDS.map((k) => {
          const t = summary.totals[k];
          if (t.count === 0) return null;
          return (
            <Row
              key={k}
              label={KIND_LABEL_PLURAL[k]}
              value={
                <>
                  {t.count} · {fmtNum(t.areaM2, 2)}
                  <span style={unitStyle}> m²</span>
                  {KIND_RULES[k].hasSoil && (
                    <>
                      {" · "}
                      {fmtInt(t.soilL)}
                      <span style={unitStyle}> L</span>
                    </>
                  )}
                </>
              }
            />
          );
        })}
        <Row
          label="Σ Area"
          value={
            <>
              {fmtNum(totalArea, 2)} <span style={unitStyle}>m²</span>
            </>
          }
        />
        {plot && summary.outsideCount > 0 && (
          <Row
            label="Utanför tomt"
            value={
              <span style={{ color: "var(--state-danger)" }}>
                {summary.outsideCount} objekt
              </span>
            }
          />
        )}
      </section>
    </aside>
  );
}
