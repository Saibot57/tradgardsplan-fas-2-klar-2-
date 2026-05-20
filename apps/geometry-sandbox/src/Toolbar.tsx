import type { Dispatch } from "react";
import type { Action, SandboxState } from "./state.js";
import type { HistoryAction } from "./history.js";
import { IconGrid, IconRuler, IconUndo, IconRedo } from "./icons.js";

interface Props {
  state: SandboxState;
  dispatch: Dispatch<Action | HistoryAction>;
  bedDepth: number;
  setBedDepth: (mm: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
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

export function Toolbar({
  state,
  dispatch,
  bedDepth,
  setBedDepth,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: Props) {
  const commitLocation = (lat: number, lon: number) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    const clampedLat = Math.max(-90, Math.min(90, lat));
    const clampedLon = Math.max(-180, Math.min(180, lon));
    dispatch({
      type: "setLocation",
      loc: { latitudeDeg: clampedLat, longitudeDeg: clampedLon },
    });
  };

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
      {/* Undo / redo */}
      <div style={{ ...sectionStyle, paddingLeft: 18 }}>
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

      {/* Sol-svep (skuggor + interaktiv tid bor i TimeBar) */}
      <div style={sectionStyle}>
        <label style={inlineLabelStyle} title="Visa skuggsvep 06–20 vid valt datum">
          <input
            type="checkbox"
            checked={state.showSunPath}
            onChange={() => dispatch({ type: "toggleSunPath" })}
            data-pp-input
          />
          Sol-svep
        </label>
      </div>

      {/* Rutnät + mått-visning (snap & norr bor i verktygsraden) */}
      <div style={sectionStyle}>
        <IconGrid size={14} style={{ color: "var(--ink-2)" }} />
        <span style={labelStyle}>Rutnät</span>
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
        <span style={{ ...labelStyle, marginLeft: -2 }}>mm</span>

        <label
          style={{ ...inlineLabelStyle, marginLeft: 8 }}
          title="Visa avståndsmått till alla objekt under drag, inte bara närmsta"
        >
          <input
            type="checkbox"
            checked={state.showAllMeasurements}
            onChange={(e) =>
              dispatch({ type: "setShowAllMeasurements", enabled: e.target.checked })
            }
            data-pp-input
          />
          <IconRuler size={13} /> Alla mått
        </label>
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

      {/* Measurements — bäddhöjd (totals + kollision bor i StatusRow) */}
      <div style={lastSectionStyle}>
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
      </div>
    </div>
  );
}
