/**
 * ToolRail — 56 px vertical rail of single-purpose tools, left of the canvas.
 *
 * Verbs: Markera (V) · Lägg till (B) · Tomt (P) · Mät (M). Below a divider,
 * quiet modifiers: Snap (G) and Norr (N, opens a small rotation dial).
 *
 * Each tool carries its one-key shortcut in the corner so the rail reads like
 * a workshop, not a website (keyboard-shortcuts.md).
 */

import { type Dispatch, type ReactNode } from "react";
import type { Action, SandboxState } from "./state.js";
import type { HistoryAction } from "./history.js";
import { fmtNum } from "./format.js";
import { IconCompass, IconCursor, IconGrid, IconPlus, IconRuler, IconSquare } from "./icons.js";

type Tool = SandboxState["tool"];

interface Props {
  tool: Tool;
  snapToGrid: boolean;
  northRotationDeg: number;
  hasBoundary: boolean;
  addActive: boolean;
  northOpen: boolean;
  onNorthOpenChange: (open: boolean) => void;
  onAdd: () => void;
  dispatch: Dispatch<Action | HistoryAction>;
}

interface RailButtonProps {
  active: boolean;
  shortcut: string;
  title: string;
  onClick: () => void;
  children: ReactNode;
  dim?: boolean;
}

function RailButton({ active, shortcut, title, onClick, children, dim }: RailButtonProps) {
  return (
    <button
      data-pp-rail
      data-active={active ? "true" : undefined}
      aria-pressed={active}
      title={title}
      onClick={onClick}
      style={dim ? { opacity: 0.5 } : undefined}
    >
      {children}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          right: 3,
          bottom: 1,
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          lineHeight: 1,
          color: "currentColor",
          opacity: 0.7,
        }}
      >
        {shortcut}
      </span>
    </button>
  );
}

export function ToolRail({
  tool,
  snapToGrid,
  northRotationDeg,
  hasBoundary,
  addActive,
  northOpen,
  onNorthOpenChange,
  onAdd,
  dispatch,
}: Props) {
  const setTool = (t: Tool) => dispatch({ type: "setTool", tool: t });
  const setNorth = (deg: number) => dispatch({ type: "setNorthRotation", deg });

  return (
    <div
      role="toolbar"
      aria-label="Verktyg"
      aria-orientation="vertical"
      style={{
        width: 56,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        padding: "8px 0",
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--line-1)",
      }}
    >
      <RailButton
        active={tool === "select"}
        shortcut="V"
        title="Markera (V)"
        onClick={() => setTool("select")}
      >
        <IconCursor size={18} />
      </RailButton>

      <RailButton
        active={addActive || tool === "create"}
        shortcut="B"
        title="Lägg till objekt (B)"
        onClick={onAdd}
      >
        <IconPlus size={18} />
      </RailButton>

      <RailButton
        active={tool === "plot"}
        shortcut="P"
        title={hasBoundary ? "Rita om tomtgränsen (P)" : "Rita tomtgränsen (P)"}
        onClick={() => setTool("plot")}
        dim={hasBoundary && tool !== "plot"}
      >
        <IconSquare size={18} />
      </RailButton>

      <RailButton
        active={tool === "measure"}
        shortcut="M"
        title="Mät avstånd (M)"
        onClick={() => setTool("measure")}
      >
        <IconRuler size={18} />
      </RailButton>

      <div style={{ width: 28, height: 1, background: "var(--line-1)", margin: "4px 0" }} />

      <RailButton
        active={snapToGrid}
        shortcut="G"
        title={snapToGrid ? "Snap till rutnät: på (G)" : "Snap till rutnät: av (G)"}
        onClick={() => dispatch({ type: "setSnapToGrid", enabled: !snapToGrid })}
      >
        <IconGrid size={18} />
      </RailButton>

      <div style={{ position: "relative" }}>
        <RailButton
          active={northOpen}
          shortcut="N"
          title="Norr-rotation (N)"
          onClick={() => onNorthOpenChange(!northOpen)}
        >
          <IconCompass size={18} />
        </RailButton>
        {northOpen && (
          <>
            <div
              aria-hidden="true"
              onClick={() => onNorthOpenChange(false)}
              style={{ position: "fixed", inset: 0, zIndex: 30 }}
            />
            <div
              role="dialog"
              aria-label="Norr-rotation"
              style={{
                position: "absolute",
                left: "calc(100% + 8px)",
                top: 0,
                zIndex: 31,
                background: "var(--bg-surface)",
                border: "1px solid var(--line-1)",
                borderRadius: "var(--radius-3)",
                boxShadow: "var(--shadow-2)",
                padding: 12,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                width: 168,
                fontFamily: "var(--font-sans)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--ink-2)",
                  fontWeight: 500,
                }}
              >
                Norr-rotation
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                  data-pp-btn
                  data-variant="ghost"
                  data-icon-only="true"
                  onClick={() => setNorth(northRotationDeg - 15)}
                  title="-15°"
                >
                  −
                </button>
                <input
                  type="number"
                  value={northRotationDeg}
                  step={15}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (Number.isFinite(n)) setNorth(n);
                  }}
                  data-pp-input
                  data-mono="true"
                  style={{ width: 70, textAlign: "right" }}
                  title="Grader CW — roterar solreferensramen (ADR-006)"
                />
                <button
                  data-pp-btn
                  data-variant="ghost"
                  data-icon-only="true"
                  onClick={() => setNorth(northRotationDeg + 15)}
                  title="+15°"
                >
                  +
                </button>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {[0, 90, 180, 270].map((deg) => (
                  <button
                    key={deg}
                    data-pp-btn
                    data-variant="ghost"
                    onClick={() => setNorth(deg)}
                    style={{ flex: 1, padding: "0 4px", fontSize: 12 }}
                  >
                    {deg}°
                  </button>
                ))}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-2)" }}>
                {fmtNum(((northRotationDeg % 360) + 360) % 360, 0)}° medurs
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
