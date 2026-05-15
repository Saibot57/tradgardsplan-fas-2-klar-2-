/**
 * "+ Lägg till i bädd ▾" trigger + dropdown panel. Lists the rectangles
 * that count as beds (see bedFilter.ts) with their dimensions. Click a
 * row → onSelect(bedId), panel closes. Disabled when no beds exist.
 *
 * Escape closes the panel; mousedown outside the wrapper closes it via
 * `useClickOutside`.
 */

import { useEffect, useRef, useState } from "react";
import type { Rect } from "@kolonitradgard/spatial-core";
import { IconChevronDown, IconPlus } from "../../icons.js";
import { useClickOutside } from "../../shared/useClickOutside.js";
import { bedsAvailableForPlanting, formatBedOption } from "./bedFilter.js";

interface AddToBedDropdownProps {
  beds: readonly Rect[];
  onSelect: (bedId: string) => void;
}

const wrapperStyle: React.CSSProperties = {
  position: "relative",
  display: "inline-block",
};

const panelStyle: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 4px)",
  left: 0,
  zIndex: 30,
  minWidth: 240,
  background: "var(--bg-surface)",
  border: "1px solid var(--line-1)",
  borderRadius: "var(--radius-3)",
  boxShadow: "var(--shadow-2)",
  padding: 4,
  display: "flex",
  flexDirection: "column",
  fontFamily: "var(--font-sans)",
};

const optionStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: 12,
  padding: "8px 12px",
  background: "transparent",
  border: 0,
  cursor: "pointer",
  textAlign: "left",
  borderRadius: "var(--radius-2)",
  fontSize: 13,
  color: "var(--ink-1)",
};

const dimsStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  color: "var(--ink-2)",
  fontVariantNumeric: "tabular-nums",
};

export function AddToBedDropdown({ beds, onSelect }: AddToBedDropdownProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useClickOutside(wrapperRef, () => setOpen(false), open);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const available = bedsAvailableForPlanting(beds);
  const disabled = available.length === 0;

  return (
    <div style={wrapperStyle} ref={wrapperRef}>
      <button
        type="button"
        data-pp-btn
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={disabled ? "Skapa en bädd i Planera-fliken först" : "Lägg till i bädd"}
      >
        <IconPlus size={14} /> Lägg till i bädd <IconChevronDown size={12} />
      </button>
      {open && available.length > 0 && (
        <div role="listbox" style={panelStyle}>
          {available.map((bed) => {
            const opt = formatBedOption(bed);
            return (
              <button
                key={opt.id}
                type="button"
                role="option"
                aria-selected="false"
                onClick={() => {
                  onSelect(opt.id);
                  setOpen(false);
                }}
                style={optionStyle}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--bed-100)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <span>{opt.label}</span>
                <span style={dimsStyle}>{opt.dims}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
