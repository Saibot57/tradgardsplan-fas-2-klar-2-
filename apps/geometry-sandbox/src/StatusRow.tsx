/**
 * StatusRow — 28 px quiet truth strip at the bottom edge, below the TimeBar.
 *
 * Layout: collision pill (clickable → markerar krockande objekt) · separator ·
 * "N bäddar · X m² · Y L" · spacer · "Sparat HH:mm · Lat 55,87° N".
 */

import type { Dispatch } from "react";
import type { Action } from "./state.js";
import type { HistoryAction } from "./history.js";
import type { AutoSaveStatus } from "./useAutoSave.js";
import { fmtInt, fmtNum } from "./format.js";

interface Props {
  bedCount: number;
  totalAreaM2: number;
  totalSoilL: number;
  overlapCount: number;
  touchCount: number;
  collisionIds: string[];
  autoSaveStatus: AutoSaveStatus;
  latitudeDeg: number;
  dispatch: Dispatch<Action | HistoryAction>;
}

function collisionText(overlap: number, touch: number): string {
  if (overlap === 0 && touch === 0) return "Inga objekt krockar";
  const overlapLabel =
    overlap === 0 ? "" : overlap === 1 ? "1 objekt krockar" : `${overlap} objekt krockar`;
  const touchLabel = touch === 0 ? "" : touch === 1 ? "1 snuddar" : `${touch} snuddar`;
  if (overlap > 0 && touch > 0) return `${overlapLabel} · ${touchLabel}`;
  return overlapLabel || touchLabel;
}

function autoSaveText(s: AutoSaveStatus): string {
  switch (s.kind) {
    case "idle":
      return "Ej sparat ännu";
    case "saving":
      return "Sparas…";
    case "saved": {
      const d = new Date(s.at);
      return `Sparat ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }
    case "error":
      return `Sparfel: ${s.message}`;
  }
}

const monoStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontVariantNumeric: "tabular-nums",
  fontSize: 11.5,
  color: "var(--ink-2)",
};

export function StatusRow({
  bedCount,
  totalAreaM2,
  totalSoilL,
  overlapCount,
  touchCount,
  collisionIds,
  autoSaveStatus,
  latitudeDeg,
  dispatch,
}: Props) {
  const hasCollision = overlapCount > 0 || touchCount > 0;
  const tone = overlapCount > 0 ? "var(--state-danger)" : touchCount > 0 ? "var(--accent-sun)" : "var(--state-success)";
  const latLabel = `${fmtNum(Math.abs(latitudeDeg), 2)}° ${latitudeDeg >= 0 ? "N" : "S"}`;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        height: "var(--layout-statusbar-h, 28px)",
        flexShrink: 0,
        padding: "0 18px",
        background: "var(--bg-surface)",
        borderTop: "1px solid var(--line-1)",
      }}
    >
      <button
        type="button"
        onClick={() => hasCollision && dispatch({ type: "selectMany", ids: collisionIds })}
        disabled={!hasCollision}
        title={hasCollision ? "Markera objekt som krockar" : undefined}
        style={{
          ...monoStyle,
          color: tone,
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: hasCollision ? "pointer" : "default",
        }}
      >
        {collisionText(overlapCount, touchCount)}
      </button>

      <span style={{ ...monoStyle, color: "var(--line-2)" }}>·</span>

      <span style={monoStyle}>
        {bedCount} {bedCount === 1 ? "objekt" : "objekt"} · {fmtNum(totalAreaM2, 2)} m² ·{" "}
        {fmtInt(totalSoilL)} L
      </span>

      <span style={{ flex: 1 }} />

      <span style={monoStyle}>
        {autoSaveText(autoSaveStatus)} · Lat {latLabel}
      </span>
    </div>
  );
}
