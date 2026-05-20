/**
 * EmptyState — onboarding overlay drawn over the canvas.
 *
 *  - "no-plot"  (boundaryRect == null): a hero inviting the gardener to draw
 *    the plot, with three named preset sizes.
 *  - "no-beds"  (boundary present, no rectangles): a quieter prompt to add the
 *    first bed.
 *
 * Once at least one bed exists, the overlay is not rendered (caller decides).
 * The scrim is pointer-transparent so the canvas stays usable around the card;
 * only the card itself captures clicks.
 */

import type { Dispatch, ReactNode } from "react";
import type { Action } from "./state.js";
import type { HistoryAction } from "./history.js";

interface Props {
  stage: "no-plot" | "no-beds";
  dispatch: Dispatch<Action | HistoryAction>;
  onRequestAddBed: () => void;
}

interface Preset {
  label: string;
  widthM: number;
  heightM: number;
}

const PRESETS: Preset[] = [
  { label: "Kolonilott", widthM: 10, heightM: 10 },
  { label: "Radhusträdgård", widthM: 8, heightM: 5 },
  { label: "Villaträdgård", widthM: 15, heightM: 12 },
];

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        lineHeight: 1,
        padding: "2px 6px 3px",
        background: "var(--bg-surface)",
        border: "1px solid var(--line-1)",
        borderBottomWidth: 2,
        borderRadius: 4,
        color: "var(--ink-2)",
      }}
    >
      {children}
    </kbd>
  );
}

export function EmptyState({ stage, dispatch, onRequestAddBed }: Props) {
  const makeBoundary = (widthM: number, heightM: number) => {
    const width = Math.round(widthM * 1000);
    const height = Math.round(heightM * 1000);
    dispatch({
      type: "setPlotBoundary",
      rect: {
        id: "plot-boundary",
        cx: Math.round(width / 2),
        cy: Math.round(height / 2),
        width,
        height,
        rotationDeg: 0,
        wallHeight: 0,
      },
    });
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          pointerEvents: "auto",
          maxWidth: 420,
          textAlign: "center",
          background: "var(--bg-surface)",
          border: "1px solid var(--line-1)",
          borderRadius: "var(--radius-3)",
          boxShadow: "var(--shadow-2)",
          padding: "32px 36px",
          fontFamily: "var(--font-sans)",
        }}
      >
        {stage === "no-plot" ? (
          <>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 36,
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                fontWeight: 600,
                color: "var(--ink-1)",
                margin: "0 0 12px",
              }}
            >
              Börja med att rita din tomt.
            </h1>
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.55,
                color: "var(--ink-2)",
                margin: "0 0 24px",
              }}
            >
              Tomtgränsen är ramen för planeringen. Rita den för hand eller välj en
              vanlig storlek nedan — du kan ändra måtten när som helst.
            </p>
            <button
              data-pp-btn
              data-variant="primary"
              onClick={() => dispatch({ type: "setTool", tool: "plot" })}
              style={{ marginBottom: 16 }}
            >
              Rita en tomt
            </button>
            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "center",
                flexWrap: "wrap",
                marginBottom: 18,
              }}
            >
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  data-pp-btn
                  onClick={() => makeBoundary(p.widthM, p.heightM)}
                  style={{ flexDirection: "column", height: "auto", padding: "8px 12px", gap: 2 }}
                >
                  <span style={{ fontWeight: 600 }}>{p.label}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-2)" }}>
                    {p.widthM} × {p.heightM} m
                  </span>
                </button>
              ))}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--ink-2)" }}>
              Eller tryck <Kbd>P</Kbd> för att rita.
            </div>
          </>
        ) : (
          <>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 24,
                lineHeight: 1.2,
                fontWeight: 600,
                color: "var(--ink-1)",
                margin: "0 0 10px",
              }}
            >
              Bra. Nu lägger vi till en bädd.
            </h2>
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.55,
                color: "var(--ink-2)",
                margin: "0 0 20px",
              }}
            >
              Lägg till din första bädd för att se mått, jordvolym och soltimmar.
            </p>
            <button data-pp-btn data-variant="primary" onClick={onRequestAddBed} style={{ marginBottom: 14 }}>
              Lägg till bädd
            </button>
            <div style={{ fontSize: 12.5, color: "var(--ink-2)" }}>
              Eller tryck <Kbd>B</Kbd>.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
