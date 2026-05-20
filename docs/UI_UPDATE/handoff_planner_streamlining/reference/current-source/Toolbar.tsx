import type { Dispatch } from "react";
import type { Action, SandboxState } from "./state.js";
import { nextId } from "./state.js";
import type { SunPosition } from "@kolonitradgard/spatial-core";
import type { HistoryAction } from "./history.js";
import { TimeSlider } from "./TimeSlider.js";
import { loadSceneFromFile, saveScene } from "./io.js";

interface Props {
  state: SandboxState;
  dispatch: Dispatch<Action | HistoryAction>;
  bedDepth: number;
  setBedDepth: (mm: number) => void;
  sun: SunPosition;
  totalAreaM2: number;
  totalSoilL: number;
  overlapCount: number;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const btn: React.CSSProperties = {
  background: "#2a2a2a",
  color: "#eee",
  border: "1px solid #444",
  padding: "6px 10px",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 13,
};

const sectionStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "0 12px",
  borderRight: "1px solid #333",
};

const inputStyle: React.CSSProperties = {
  width: 70,
  background: "#111",
  color: "#eee",
  border: "1px solid #444",
  padding: 3,
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
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: Props) {
  const selected = state.rectangles.find((r) => r.id === state.selectedId);

  const addRect = () =>
    dispatch({
      type: "addRect",
      rect: {
        id: nextId(),
        cx: 5000,
        cy: 5000,
        width: 1500,
        height: 800,
        rotationDeg: 0,
        wallHeight: 0,
      },
    });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        background: "#1e1e1e",
        borderBottom: "1px solid #333",
        height: 44,
        overflowX: "auto",
        flexShrink: 0,
      }}
    >
      {/* Title */}
      <div style={{ ...sectionStyle, paddingLeft: 16 }}>
        <strong style={{ color: "#eee", fontSize: 13 }}>Koloniträdgårdsplaneraren</strong>
        <span style={{ color: "#666", fontSize: 11 }}>geometry sandbox</span>
      </div>

      {/* Add/Remove */}
      <div style={sectionStyle}>
        <button style={btn} onClick={addRect}>+ Rektangel</button>
        <button
          style={{ ...btn, opacity: selected ? 1 : 0.4 }}
          onClick={() => dispatch({ type: "removeSelected" })}
          disabled={!selected}
        >
          – Ta bort
        </button>
      </div>

      {/* Undo/Redo */}
      <div style={sectionStyle}>
        <button
          style={{ ...btn, opacity: canUndo ? 1 : 0.4 }}
          onClick={onUndo}
          disabled={!canUndo}
          title="Ångra (⌘Z / Ctrl+Z)"
        >
          ↶ Ångra
        </button>
        <button
          style={{ ...btn, opacity: canRedo ? 1 : 0.4 }}
          onClick={onRedo}
          disabled={!canRedo}
          title="Gör om (⌘⇧Z / Ctrl+Shift+Z)"
        >
          ↷ Gör om
        </button>
      </div>

      {/* JSON I/O */}
      <div style={sectionStyle}>
        <button style={btn} onClick={() => saveScene(state)} title="Ladda ner scene.json">
          Spara JSON
        </button>
        <button style={btn} onClick={() => loadSceneFromFile(dispatch)} title="Ladda scene.json">
          Ladda JSON
        </button>
      </div>

      {/* Selected rect controls */}
      {selected && (
        <div style={sectionStyle}>
          <span style={{ color: "#aaa", fontSize: 12 }}>Vald: {selected.id}</span>
          <button style={btn} onClick={() => dispatch({ type: "rotateSelected", deltaDeg: -15 })}>
            ↺ -15°
          </button>
          <button style={btn} onClick={() => dispatch({ type: "rotateSelected", deltaDeg: 15 })}>
            ↻ +15°
          </button>
          <span style={{ color: "#aaa", fontSize: 12 }}>wallHeight (mm)</span>
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
            style={inputStyle}
          />
        </div>
      )}

      {/* Sun / time */}
      <div style={sectionStyle}>
        <TimeSlider
          dateIso={state.sun.dateIso}
          onChange={(iso) => dispatch({ type: "setSun", dateIso: iso })}
        />
        <input
          type="checkbox"
          checked={state.showShadows}
          onChange={() => dispatch({ type: "toggleShadows" })}
        />
        <span style={{ color: "#aaa", fontSize: 12 }}>Skuggor</span>
        <span style={{ color: "#888", fontSize: 11 }}>
          Sol: alt {((sun.altitudeRad * 180) / Math.PI).toFixed(1)}°, az{" "}
          {((sun.azimuthRad * 180) / Math.PI).toFixed(1)}°
        </span>
      </div>

      {/* Plot boundary + Grid + North rotation */}
      <div style={sectionStyle}>
        <button
          style={btn}
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
        >
          Skapa tomt
        </button>

        <label style={{ color: "#aaa", fontSize: 12 }}>
          <input
            type="checkbox"
            checked={state.snapToGrid}
            onChange={(e) =>
              dispatch({ type: "setSnapToGrid", enabled: e.target.checked })
            }
          />{" "}
          Snap
        </label>

        <input
          type="number"
          value={state.gridStepMm}
          onChange={(e) =>
            dispatch({ type: "setGridStep", mm: Number(e.target.value) || 100 })
          }
          style={{ ...inputStyle, width: 55 }}
          title="Grid-steg i mm"
        />

        <span style={{ color: "#aaa", fontSize: 12 }}>N-rotation°</span>
        <input
          type="number"
          value={state.plot.northRotationDeg}
          step={15}
          onChange={(e) =>
            dispatch({ type: "setNorthRotation", deg: Number(e.target.value) || 0 })
          }
          style={{ ...inputStyle, width: 55 }}
          title="Grader CW — roterar solreferensramen (ADR-006)"
        />
      </div>

      {/* Measurements */}
      <div style={sectionStyle}>
        <span style={{ color: "#aaa", fontSize: 12 }}>Bäddhöjd (mm)</span>
        <input
          type="number"
          value={bedDepth}
          onChange={(e) => setBedDepth(Number(e.target.value) || 0)}
          style={inputStyle}
        />
        <span style={{ color: "#ddd", fontSize: 12 }}>
          Σ {totalAreaM2.toFixed(2)} m² · {totalSoilL.toFixed(0)} L jord
        </span>
      </div>

      {/* Overlap status */}
      <div style={{ ...sectionStyle, borderRight: "none" }}>
        <span
          style={{
            color: overlapCount ? "#ff8080" : "#80cc80",
            fontSize: 12,
          }}
        >
          {overlapCount ? `⚠ ${overlapCount} kollision(er)` : "✓ inga kollisioner"}
        </span>
      </div>
    </div>
  );
}
