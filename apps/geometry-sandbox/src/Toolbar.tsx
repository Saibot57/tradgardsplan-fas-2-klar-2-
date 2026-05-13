import { useState, type Dispatch } from "react";
import type { Action, SandboxState } from "./state.js";
import { MIN_RECT_DIMENSION_MM, nextId } from "./state.js";
import type { ObjectKind, SunPosition } from "@kolonitradgard/spatial-core";
import type { HistoryAction } from "./history.js";
import { TimeSlider } from "./TimeSlider.js";
import { exportCanvasAsPng, loadSceneFromFile, saveScene } from "./io.js";
import { fmtInt, fmtNum } from "./format.js";
import type { AutoSaveStatus } from "./useAutoSave.js";
import type { ScenePersistence } from "./persistence.js";
import {
  IconCheck,
  IconCompass,
  IconFolderOpen,
  IconGrid,
  IconLayers,
  IconMoon,
  IconPlus,
  IconRotateCCW,
  IconRotateCW,
  IconRuler,
  IconSave,
  IconSquare,
  IconSun,
  IconTrash,
  IconTriangleAlert,
  IconUndo,
  IconRedo,
} from "./icons.js";

interface Props {
  state: SandboxState;
  dispatch: Dispatch<Action | HistoryAction>;
  bedDepth: number;
  setBedDepth: (mm: number) => void;
  sun: SunPosition;
  totalAreaM2: number;
  totalSoilL: number;
  overlapCount: number;
  touchCount: number;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  autoSaveStatus: AutoSaveStatus;
  onResetAutoSaveBaseline: () => void;
  adapter: ScenePersistence;
}

function formatAutoSaveStatus(s: AutoSaveStatus): { text: string; tone: "ok" | "warn" | "muted" } {
  switch (s.kind) {
    case "idle":
      return { text: "Ej sparat ännu", tone: "muted" };
    case "saving":
      return { text: "Sparar…", tone: "muted" };
    case "saved": {
      const d = new Date(s.at);
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return { text: `Sparad · ${hh}:${mm}`, tone: "ok" };
    }
    case "error":
      return { text: `Fel: ${s.message}`, tone: "warn" };
  }
}

const sectionStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "0 14px",
  height: "100%",
  borderRight: "1px solid var(--line-1)",
};

const lastSectionStyle: React.CSSProperties = {
  ...sectionStyle,
  borderRight: "none",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: 12,
  color: "var(--ink-2)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  fontWeight: 500,
};

const inlineLabelStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontFamily: "var(--font-sans)",
  fontSize: 12.5,
  color: "var(--ink-1)",
  cursor: "pointer",
};

const valueStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontVariantNumeric: "tabular-nums",
  fontSize: 12.5,
  color: "var(--ink-1)",
};

function formatCollisionStatus(overlap: number, touch: number): string {
  if (overlap === 0 && touch === 0) return "Inga objekt krockar";
  const overlapLabel =
    overlap === 0 ? "" : overlap === 1 ? "1 objekt krockar" : `${overlap} objekt krockar`;
  const touchLabel =
    touch === 0 ? "" : touch === 1 ? "1 snuddar" : `${touch} snuddar`;
  if (overlap > 0 && touch > 0) return `${overlapLabel} · ${touchLabel}`;
  return overlapLabel || touchLabel;
}

/** Default-mått (mm) per objekttyp för Lägg-till-popovern. */
interface KindDefaults {
  width: number;
  height: number;
  wallHeight: number;
}
export const KIND_DEFAULTS: Readonly<Record<ObjectKind, KindDefaults>> = {
  bed:      { width: 1500, height: 800,  wallHeight: 0    },
  building: { width: 3000, height: 2500, wallHeight: 2400 },
  hedge:    { width: 3000, height: 500,  wallHeight: 1500 },
  surface:  { width: 2000, height: 2000, wallHeight: 0    },
};

const KIND_LABELS: Readonly<Record<ObjectKind, string>> = {
  bed: "Bädd",
  building: "Byggnad",
  hedge: "Häck",
  surface: "Underlag",
};

export function Toolbar({
  state,
  dispatch,
  bedDepth,
  setBedDepth,
  sun,
  totalAreaM2,
  totalSoilL,
  overlapCount,
  touchCount,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  theme,
  onToggleTheme,
  autoSaveStatus,
  onResetAutoSaveBaseline,
  adapter,
}: Props) {
  const autoSave = formatAutoSaveStatus(autoSaveStatus);
  const primaryId = state.selectedIds[0] ?? null;
  const selected = state.rectangles.find((r) => r.id === primaryId);
  const multiCount = state.selectedIds.length;

  const [addOpen, setAddOpen] = useState(false);
  const [addKind, setAddKind] = useState<ObjectKind>("bed");
  const [addWidth, setAddWidth] = useState(KIND_DEFAULTS.bed.width);
  const [addHeight, setAddHeight] = useState(KIND_DEFAULTS.bed.height);
  const [addWallHeight, setAddWallHeight] = useState(KIND_DEFAULTS.bed.wallHeight);

  const onPickKind = (k: ObjectKind) => {
    setAddKind(k);
    setAddWidth(KIND_DEFAULTS[k].width);
    setAddHeight(KIND_DEFAULTS[k].height);
    setAddWallHeight(KIND_DEFAULTS[k].wallHeight);
  };

  const commitAddRect = () => {
    const w = Math.max(MIN_RECT_DIMENSION_MM, Math.round(addWidth));
    const h = Math.max(MIN_RECT_DIMENSION_MM, Math.round(addHeight));
    const wh = Math.max(0, Math.round(addWallHeight));
    // Auto-offset så nya objekt inte staplas på samma punkt: gå snett 600 mm
    // åt höger/ned per existerande objekt, modulo en ruta.
    const offset = (state.rectangles.length % 8) * 600;
    const rect: import("@kolonitradgard/spatial-core").Rect = {
      id: nextId(),
      cx: 5000 + offset,
      cy: 5000 + offset,
      width: w,
      height: h,
      rotationDeg: 0,
      wallHeight: wh,
    };
    // Utelämna kind för default ("bed") — håll JSON minimal.
    if (addKind !== "bed") rect.kind = addKind;
    dispatch({ type: "addRect", rect });
    setAddOpen(false);
  };

  const commitLocation = (lat: number, lon: number) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    const clampedLat = Math.max(-90, Math.min(90, lat));
    const clampedLon = Math.max(-180, Math.min(180, lon));
    dispatch({
      type: "setLocation",
      loc: { latitudeDeg: clampedLat, longitudeDeg: clampedLon },
    });
  };

  const sunAltDeg = (sun.altitudeRad * 180) / Math.PI;
  const sunAzDeg = (sun.azimuthRad * 180) / Math.PI;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--line-1)",
        height: "var(--layout-toolbar-h)",
        overflowX: "auto",
        flexShrink: 0,
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* Brand */}
      <div style={{ ...sectionStyle, paddingLeft: 18 }}>
        <img src="/logo-mark.svg" alt="" style={{ height: 22, display: "block" }} />
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
          <strong
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 17,
              color: "var(--ink-1)",
              fontWeight: 500,
              letterSpacing: "-0.01em",
            }}
          >
            PlotPlaner
          </strong>
          <span
            style={{
              fontSize: 10.5,
              color: "var(--ink-2)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontWeight: 500,
            }}
          >
            Sandbox
          </span>
        </div>
      </div>

      {/* Add / remove */}
      <div style={sectionStyle}>
        <button
          data-pp-btn
          data-variant="primary"
          onClick={() => setAddOpen((v) => !v)}
          title="Lägg till objekt"
          aria-expanded={addOpen}
        >
          <IconPlus size={14} /> Lägg till
        </button>
        <button
          data-pp-btn
          data-icon-only="true"
          disabled={!selected}
          onClick={() => dispatch({ type: "removeSelected" })}
          title="Ta bort valt objekt"
        >
          <IconTrash size={14} />
        </button>
      </div>

      {addOpen && (
        <AddRectPopover
          kind={addKind}
          onKind={onPickKind}
          width={addWidth}
          height={addHeight}
          wallHeight={addWallHeight}
          onWidth={setAddWidth}
          onHeight={setAddHeight}
          onWallHeight={setAddWallHeight}
          onCancel={() => setAddOpen(false)}
          onConfirm={commitAddRect}
        />
      )}

      {/* Undo / redo */}
      <div style={sectionStyle}>
        <button
          data-pp-btn
          data-icon-only="true"
          onClick={onUndo}
          disabled={!canUndo}
          title="Ångra (⌘Z / Ctrl+Z)"
        >
          <IconUndo size={14} />
        </button>
        <button
          data-pp-btn
          data-icon-only="true"
          onClick={onRedo}
          disabled={!canRedo}
          title="Gör om (⌘⇧Z / Ctrl+Shift+Z)"
        >
          <IconRedo size={14} />
        </button>
      </div>

      {/* JSON I/O */}
      <div style={sectionStyle}>
        <button data-pp-btn onClick={() => saveScene(state)} title="Ladda ner scen.json">
          <IconSave size={14} /> Spara
        </button>
        <button
          data-pp-btn
          onClick={() => loadSceneFromFile(dispatch, onResetAutoSaveBaseline)}
          title="Ladda scen.json"
        >
          <IconFolderOpen size={14} /> Ladda
        </button>
        <button
          data-pp-btn
          data-variant="ghost"
          onClick={() => exportCanvasAsPng()}
          title="Exportera arbetsytan som PNG"
        >
          PNG
        </button>
        <button
          data-pp-btn
          data-variant="ghost"
          onClick={() => {
            if (!window.confirm("Starta om med en tom scen? Nuvarande scen sparas över.")) return;
            adapter.clear().finally(() => {
              onResetAutoSaveBaseline();
              dispatch({ type: "newScene" });
            });
          }}
          title="Skapa ny tom scen (rensar persistens)"
        >
          Ny
        </button>
        <span
          data-pp-status
          data-tone={autoSave.tone}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color:
              autoSave.tone === "warn"
                ? "var(--state-danger)"
                : autoSave.tone === "ok"
                  ? "var(--state-success)"
                  : "var(--ink-2)",
            marginLeft: 4,
            whiteSpace: "nowrap",
          }}
          title={
            autoSaveStatus.kind === "saved"
              ? `Senast sparat ${new Date(autoSaveStatus.at).toLocaleString("sv-SE")}`
              : autoSave.text
          }
        >
          {autoSave.text}
        </span>
      </div>

      {/* Selected rect controls */}
      {selected && (
        <div style={sectionStyle}>
          <span style={valueStyle}>
            {selected.label || selected.id}
            {multiCount > 1 ? ` +${multiCount - 1}` : ""}
          </span>
          <button
            data-pp-btn
            data-icon-only="true"
            onClick={() => dispatch({ type: "duplicateSelected" })}
            title={`Duplicera vald${multiCount > 1 ? "a" : ""} bädd${multiCount > 1 ? "ar" : ""} (⌘D / Ctrl+D)`}
          >
            <IconPlus size={14} />
          </button>
          <button
            data-pp-btn
            data-icon-only="true"
            onClick={() => dispatch({ type: "rotateSelected", deltaDeg: -15 })}
            title="Rotera -15°"
          >
            <IconRotateCCW size={14} />
          </button>
          <button
            data-pp-btn
            data-icon-only="true"
            onClick={() => dispatch({ type: "rotateSelected", deltaDeg: 15 })}
            title="Rotera +15°"
          >
            <IconRotateCW size={14} />
          </button>
          <span style={labelStyle}>Vägghöjd</span>
          <input
            type="number"
            value={selected.wallHeight}
            onChange={(e) =>
              dispatch({
                type: "setWallHeight",
                id: selected.id,
                mm: Number(e.target.value) || 0,
              })
            }
            data-pp-input
            data-mono="true"
            style={{ width: 72 }}
          />
          <span style={{ ...labelStyle, marginLeft: -2 }}>mm</span>
        </div>
      )}

      {/* Sun / time */}
      <div style={sectionStyle}>
        <TimeSlider
          dateIso={state.sun.dateIso}
          onChange={(iso) => dispatch({ type: "setSun", dateIso: iso })}
        />
        <label style={{ ...inlineLabelStyle, marginLeft: 4 }} title="Visa skuggor på arbetsytan">
          <input
            type="checkbox"
            checked={state.showShadows}
            onChange={() => dispatch({ type: "toggleShadows" })}
            data-pp-input
          />
          <IconLayers size={13} /> Skuggor
        </label>
        <label style={inlineLabelStyle} title="Visa skuggsvep 06–20 vid valt datum">
          <input
            type="checkbox"
            checked={state.showSunPath}
            onChange={() => dispatch({ type: "toggleSunPath" })}
            data-pp-input
          />
          Sol-svep
        </label>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontVariantNumeric: "tabular-nums",
            fontSize: 11.5,
            color: "var(--ink-2)",
          }}
          title="Solens position (altitud, azimut)"
        >
          {fmtNum(sunAltDeg, 1)}° / {fmtNum(sunAzDeg, 1)}°
        </span>
      </div>

      {/* Plot boundary + Grid + North rotation */}
      <div style={sectionStyle}>
        <button
          data-pp-btn
          onClick={() =>
            dispatch({
              type: "setPlotBoundary",
              rect: {
                id: "plot-boundary",
                cx: 6000,
                cy: 5000,
                width: 12000,
                height: 8000,
                rotationDeg: 0,
                wallHeight: 0,
              },
            })
          }
          title="Skapa tomtens yttre gräns"
        >
          <IconSquare size={14} /> Tomt
        </button>

        <label style={inlineLabelStyle} title="Snappa till rutnät">
          <input
            type="checkbox"
            checked={state.snapToGrid}
            onChange={(e) => dispatch({ type: "setSnapToGrid", enabled: e.target.checked })}
            data-pp-input
          />
          <IconGrid size={13} /> Snap
        </label>

        <input
          type="number"
          value={state.gridStepMm}
          onChange={(e) =>
            dispatch({ type: "setGridStep", mm: Number(e.target.value) || 100 })
          }
          data-pp-input
          data-mono="true"
          style={{ width: 64 }}
          title="Rutnätssteg i mm"
        />

        <IconCompass size={14} style={{ color: "var(--ink-2)" }} />
        <input
          type="number"
          value={state.plot.northRotationDeg}
          step={15}
          onChange={(e) =>
            dispatch({ type: "setNorthRotation", deg: Number(e.target.value) || 0 })
          }
          data-pp-input
          data-mono="true"
          style={{ width: 60 }}
          title="Norr-rotation i grader (ADR-006 — roterar enbart solreferensramen)"
        />
        <span style={{ ...labelStyle, marginLeft: -2 }}>N°</span>
      </div>

      {/* Location (lat/lon) */}
      <div style={sectionStyle}>
        <span style={labelStyle}>Plats</span>
        <input
          type="number"
          value={state.plot.location.latitudeDeg}
          step={0.0001}
          min={-90}
          max={90}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n)) commitLocation(n, state.plot.location.longitudeDeg);
          }}
          data-pp-input
          data-mono="true"
          style={{ width: 84 }}
          title="Latitud (°)"
        />
        <span style={{ ...labelStyle, marginLeft: -2 }}>lat</span>
        <input
          type="number"
          value={state.plot.location.longitudeDeg}
          step={0.0001}
          min={-180}
          max={180}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n)) commitLocation(state.plot.location.latitudeDeg, n);
          }}
          data-pp-input
          data-mono="true"
          style={{ width: 84 }}
          title="Longitud (°)"
        />
        <span style={{ ...labelStyle, marginLeft: -2 }}>lon</span>
      </div>

      {/* Measurements */}
      <div style={sectionStyle}>
        <IconRuler size={14} style={{ color: "var(--ink-2)" }} />
        <span style={labelStyle}>Bäddhöjd</span>
        <input
          type="number"
          value={bedDepth}
          onChange={(e) => setBedDepth(Number(e.target.value) || 0)}
          data-pp-input
          data-mono="true"
          style={{ width: 72 }}
          title="Bäddhöjd i mm (för jordvolymberäkning)"
        />
        <span style={{ ...labelStyle, marginLeft: -2 }}>mm</span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontVariantNumeric: "tabular-nums",
            fontSize: 12.5,
            color: "var(--ink-1)",
            marginLeft: 6,
          }}
        >
          Σ {fmtNum(totalAreaM2, 2)} m² · {fmtInt(totalSoilL)} L
        </span>
      </div>

      {/* Overlap / touch status */}
      <div style={sectionStyle}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: overlapCount
              ? "var(--state-danger)"
              : touchCount
                ? "var(--accent-sun)"
                : "var(--state-success)",
            fontSize: 12.5,
          }}
        >
          {overlapCount || touchCount ? <IconTriangleAlert size={14} /> : <IconCheck size={14} />}
          {formatCollisionStatus(overlapCount, touchCount)}
        </span>
      </div>

      {/* Theme toggle */}
      <div style={lastSectionStyle}>
        <button
          data-pp-btn
          data-variant="ghost"
          data-icon-only="true"
          onClick={onToggleTheme}
          title={theme === "dark" ? "Byt till dagläge (paper)" : "Byt till kvällsläge (evening)"}
          aria-label="Byt tema"
        >
          {theme === "dark" ? <IconSun size={14} /> : <IconMoon size={14} />}
        </button>
      </div>
    </div>
  );
}

interface AddRectPopoverProps {
  kind: ObjectKind;
  onKind: (k: ObjectKind) => void;
  width: number;
  height: number;
  wallHeight: number;
  onWidth: (w: number) => void;
  onHeight: (h: number) => void;
  onWallHeight: (w: number) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

function AddRectPopover({
  kind,
  onKind,
  width,
  height,
  wallHeight,
  onWidth,
  onHeight,
  onWallHeight,
  onCancel,
  onConfirm,
}: AddRectPopoverProps) {
  const showWallHeight = kind === "building" || kind === "hedge";
  const orderedKinds: ObjectKind[] = ["bed", "building", "hedge", "surface"];
  return (
    <>
      <div
        aria-hidden="true"
        onClick={onCancel}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 17, 12, 0.18)",
          zIndex: 40,
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Nytt objekt"
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
          if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") onConfirm();
        }}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 41,
          background: "var(--bg-surface)",
          border: "1px solid var(--line-1)",
          borderRadius: "var(--radius-3)",
          boxShadow: "var(--shadow-3)",
          padding: "18px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          minWidth: 300,
          fontFamily: "var(--font-sans)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 14,
            color: "var(--ink-1)",
            fontWeight: 500,
          }}
        >
          Nytt objekt
        </div>
        <div style={{ display: "flex", gap: 4 }} role="radiogroup" aria-label="Objekttyp">
          {orderedKinds.map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={kind === k}
              data-pp-btn
              data-variant={kind === k ? "primary" : "ghost"}
              onClick={() => onKind(k)}
              style={{ flex: 1, fontSize: 12.5, padding: "5px 8px" }}
            >
              {KIND_LABELS[k]}
            </button>
          ))}
        </div>
        <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--ink-2)" }}>
          <span style={{ textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>Bredd</span>
          <span style={{ display: "inline-flex", alignItems: "baseline", gap: 4 }}>
            <input
              type="number"
              value={width}
              step={100}
              min={MIN_RECT_DIMENSION_MM}
              autoFocus
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isFinite(n)) onWidth(n);
              }}
              data-pp-input
              data-mono="true"
              style={{ width: 88, textAlign: "right", fontSize: 13 }}
            />
            <span style={{ color: "var(--ink-2)", fontSize: 12.5 }}>mm</span>
          </span>
        </label>
        <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--ink-2)" }}>
          <span style={{ textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>Höjd</span>
          <span style={{ display: "inline-flex", alignItems: "baseline", gap: 4 }}>
            <input
              type="number"
              value={height}
              step={100}
              min={MIN_RECT_DIMENSION_MM}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isFinite(n)) onHeight(n);
              }}
              data-pp-input
              data-mono="true"
              style={{ width: 88, textAlign: "right", fontSize: 13 }}
            />
            <span style={{ color: "var(--ink-2)", fontSize: 12.5 }}>mm</span>
          </span>
        </label>
        {showWallHeight && (
          <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--ink-2)" }}>
            <span style={{ textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>Vägghöjd</span>
            <span style={{ display: "inline-flex", alignItems: "baseline", gap: 4 }}>
              <input
                type="number"
                value={wallHeight}
                step={100}
                min={0}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isFinite(n)) onWallHeight(n);
                }}
                data-pp-input
                data-mono="true"
                style={{ width: 88, textAlign: "right", fontSize: 13 }}
              />
              <span style={{ color: "var(--ink-2)", fontSize: 12.5 }}>mm</span>
            </span>
          </label>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 4 }}>
          <button data-pp-btn data-variant="ghost" onClick={onCancel}>
            Avbryt
          </button>
          <button data-pp-btn data-variant="primary" onClick={onConfirm}>
            Lägg till
          </button>
        </div>
      </div>
    </>
  );
}
