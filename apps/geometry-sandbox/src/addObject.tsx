/**
 * Add-object model + dialog, shared between the tool rail (B) and any caller
 * that needs to create a new rectangle. Extracted from Toolbar so the rail can
 * own the "Lägg till" verb without depending on the (shrinking) toolbar.
 */

import type { ObjectKind } from "@kolonitradgard/spatial-core";
import { MIN_RECT_DIMENSION_MM } from "./state.js";

/** Default-mått (mm) per objekttyp för Lägg-till-dialogen. */
export interface KindDefaults {
  width: number;
  height: number;
  wallHeight: number;
}

export const KIND_DEFAULTS: Readonly<Record<ObjectKind, KindDefaults>> = {
  bed:      { width: 1500, height: 800,  wallHeight: 0    },
  rabatt:   { width: 2000, height: 1000, wallHeight: 0    },
  building: { width: 3000, height: 2500, wallHeight: 2400 },
  hedge:    { width: 3000, height: 500,  wallHeight: 1500 },
  grass:    { width: 3000, height: 3000, wallHeight: 0    },
  paved:    { width: 2000, height: 2000, wallHeight: 0    },
  gravel:   { width: 2000, height: 2000, wallHeight: 0    },
  deck:     { width: 3000, height: 2000, wallHeight: 0    },
  surface:  { width: 2000, height: 2000, wallHeight: 0    },
};

export const KIND_LABELS: Readonly<Record<ObjectKind, string>> = {
  bed: "Bädd",
  rabatt: "Rabatt",
  building: "Byggnad",
  hedge: "Häck",
  grass: "Gräs",
  paved: "Stenlagt",
  gravel: "Grus",
  deck: "Trädäck",
  surface: "Annan yta",
};

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
  onStartDrawing: () => void;
}

export function AddRectPopover({
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
  onStartDrawing,
}: AddRectPopoverProps) {
  const showWallHeight = kind === "building" || kind === "hedge";
  const orderedKinds: ObjectKind[] = [
    "bed",
    "rabatt",
    "building",
    "hedge",
    "grass",
    "paved",
    "gravel",
    "deck",
    "surface",
  ];
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
        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}
          role="radiogroup"
          aria-label="Objekttyp"
        >
          {orderedKinds.map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={kind === k}
              data-pp-btn
              data-variant={kind === k ? "primary" : "ghost"}
              onClick={() => onKind(k)}
              style={{ fontSize: 12.5, padding: "5px 8px" }}
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
        <div style={{ display: "flex", justifyContent: "space-between", gap: 6, marginTop: 4 }}>
          <button
            data-pp-btn
            data-variant="ghost"
            onClick={onStartDrawing}
            title="Stäng dialogen och rita rektangelns area direkt på canvasen"
          >
            Rita på canvas
          </button>
          <div style={{ display: "flex", gap: 6 }}>
            <button data-pp-btn data-variant="ghost" onClick={onCancel}>
              Avbryt
            </button>
            <button data-pp-btn data-variant="primary" onClick={onConfirm}>
              Lägg till med mått
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
