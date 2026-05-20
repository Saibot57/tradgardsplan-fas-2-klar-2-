/**
 * FloatingSelectionToolbar — a small pill that floats above the selected
 * rectangle and carries the per-object verbs (rotate, bädd↔vägg, duplicate,
 * delete). Rendered inside the Canvas container; positioned in screen px by
 * the caller, who already has the viewport transform.
 *
 * Per-object verbs belong to the object, not the chrome (migration table §11).
 */

import type { Dispatch } from "react";
import { getKind, type Rect } from "@kolonitradgard/spatial-core";
import type { Action } from "./state.js";
import type { HistoryAction } from "./history.js";
import { KIND_LABELS } from "./Toolbar.js";
import { fmtNum } from "./format.js";
import { IconCopy, IconRotateCCW, IconRotateCW, IconTrash, IconWall } from "./icons.js";

/** Default vägghöjd (mm) när man togglar bädd → vägg via pillret. */
const TOGGLE_WALL_HEIGHT_MM = 1500;

export interface FloatingPlacement {
  left: number;
  top: number;
}

interface Props {
  rect: Rect;
  selectedCount: number;
  placement: FloatingPlacement;
  dispatch: Dispatch<Action | HistoryAction>;
}

const sepStyle: React.CSSProperties = {
  width: 1,
  alignSelf: "stretch",
  margin: "6px 2px",
  background: "var(--line-1)",
};

export function FloatingSelectionToolbar({ rect, selectedCount, placement, dispatch }: Props) {
  const isWall = rect.wallHeight > 0;
  const kindLabel = isWall ? "Vägg" : KIND_LABELS[getKind(rect)];
  const label =
    `${kindLabel} · ${fmtNum(rect.width / 1000, 2)} × ${fmtNum(rect.height / 1000, 2)} m · ` +
    `${Math.round(rect.rotationDeg)}°${selectedCount > 1 ? `  (+${selectedCount - 1})` : ""}`;

  return (
    <div
      role="toolbar"
      aria-label="Markerat objekt"
      style={{
        position: "absolute",
        left: placement.left,
        top: placement.top,
        transform: "translateX(-50%)",
        zIndex: 20,
        height: 36,
        display: "flex",
        alignItems: "center",
        gap: 2,
        padding: "0 6px",
        background: "var(--bg-surface)",
        border: "1px solid var(--line-1)",
        borderRadius: "var(--radius-2)",
        boxShadow: "var(--shadow-2)",
        fontFamily: "var(--font-sans)",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontVariantNumeric: "tabular-nums",
          fontSize: 11.5,
          color: "var(--ink-1)",
          padding: "0 6px",
        }}
      >
        {label}
      </span>

      <span style={sepStyle} />

      <button
        data-pp-btn
        data-variant="ghost"
        data-icon-only="true"
        onClick={() => dispatch({ type: "rotateSelected", deltaDeg: -15 })}
        title="Rotera -15° (Shift+R)"
      >
        <IconRotateCCW size={15} />
      </button>
      <button
        data-pp-btn
        data-variant="ghost"
        data-icon-only="true"
        onClick={() => dispatch({ type: "rotateSelected", deltaDeg: 15 })}
        title="Rotera +15° (R)"
      >
        <IconRotateCW size={15} />
      </button>

      <span style={sepStyle} />

      <button
        data-pp-btn
        data-variant="ghost"
        data-icon-only="true"
        onClick={() =>
          dispatch({
            type: "setWallHeight",
            id: rect.id,
            mm: isWall ? 0 : TOGGLE_WALL_HEIGHT_MM,
          })
        }
        title={isWall ? "Gör om till bädd (vägghöjd 0)" : "Gör om till vägg"}
        aria-pressed={isWall}
        style={isWall ? { color: "var(--accent-wall)" } : undefined}
      >
        <IconWall size={15} />
      </button>
      <button
        data-pp-btn
        data-variant="ghost"
        data-icon-only="true"
        onClick={() => dispatch({ type: "duplicateSelected" })}
        title="Duplicera (⌘D / Ctrl+D)"
      >
        <IconCopy size={15} />
      </button>

      <span style={sepStyle} />

      <button
        data-pp-btn
        data-variant="ghost"
        data-icon-only="true"
        data-danger-hover="true"
        onClick={() => dispatch({ type: "removeSelected" })}
        title="Ta bort (Backspace)"
      >
        <IconTrash size={15} />
      </button>
    </div>
  );
}
