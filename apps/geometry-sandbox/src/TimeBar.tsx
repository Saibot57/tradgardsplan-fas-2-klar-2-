/**
 * TimeBar — full-width bottom strip (64 px) that owns the day/time scrub.
 *
 * Controls state.sun.dateIso (interactive preview time for Canvas shadows).
 * Aggregate summer analysis (bedSunHours in SidePanel) uses a SEPARATE fixed
 * reference date and is intentionally NOT affected by this scrubber
 * (ADR-007/008 distinction — do not unify the two).
 */

import { useEffect, useRef, useState } from "react";
import type { SunPosition } from "@kolonitradgard/spatial-core";
import { fmtNum } from "./format.js";
import { IconEye, IconEyeOff, IconSun, IconCalendar } from "./icons.js";

interface Props {
  dateIso: string;
  onChange: (dateIso: string) => void;
  showShadows: boolean;
  onToggleShadows: () => void;
  sun: SunPosition;
}

const HOUR_MIN = 6;
const HOUR_MAX = 20;
const HOUR_STEP = 0.25; // 15 min
const ANIMATE_MS = 4000;
const TICK_HOURS = [6, 9, 12, 15, 18, 20];

function hourFromDate(d: Date): number {
  return d.getHours() + d.getMinutes() / 60;
}

function withHour(d: Date, decimalHour: number): Date {
  const next = new Date(d);
  const h = Math.floor(decimalHour);
  const m = Math.round((decimalHour - h) * 60);
  next.setHours(h, m, 0, 0);
  return next;
}

function dateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatHourLabel(decimalHour: number): string {
  const h = Math.floor(decimalHour);
  const m = Math.round((decimalHour - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatDatePill(d: Date): string {
  return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
}

const COMPASS_8 = [
  "norr",
  "nordost",
  "öster",
  "sydost",
  "söder",
  "sydväst",
  "väster",
  "nordväst",
];

/**
 * suncalc-azimut: 0 = söder, medurs (positiv mot väster). Verklig
 * kompass-bäring = (180 + az°) mod 360. Oberoende av northRotationDeg —
 * solens geografiska riktning ändras inte av hur tomten roterats (ADR-006).
 */
function azimuthToCompassSv(azimuthRad: number): string {
  const azDeg = (azimuthRad * 180) / Math.PI;
  const bearing = ((180 + azDeg) % 360 + 360) % 360;
  const idx = Math.round(bearing / 45) % 8;
  return COMPASS_8[idx]!;
}

/** Namngivna datum — sätts på aktuellt år. */
const NAMED_DATES: Array<{ label: string; month: number; day: number }> = [
  { label: "Vårdagjämning", month: 3, day: 20 },
  { label: "Midsommar", month: 6, day: 21 },
  { label: "Höstdagjämning", month: 9, day: 22 },
];

export function TimeBar({ dateIso, onChange, showShadows, onToggleShadows, sun }: Props) {
  const current = new Date(dateIso);
  const hour = Math.min(HOUR_MAX, Math.max(HOUR_MIN, hourFromDate(current)));
  const pct = (hour - HOUR_MIN) / (HOUR_MAX - HOUR_MIN);

  const [dateOpen, setDateOpen] = useState(false);
  const [animating, setAnimating] = useState(false);
  const rafRef = useRef<number | null>(null);

  // Latest date-Y/M/D, read inside the animation loop without re-binding it.
  const dayRef = useRef(current);
  dayRef.current = current;

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const setHour = (h: number) => onChange(withHour(dayRef.current, h).toISOString());

  const onDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [y, m, d] = e.target.value.split("-").map(Number);
    if (!y || !m || !d) return;
    const next = new Date(current);
    next.setFullYear(y, m - 1, d);
    onChange(next.toISOString());
  };

  const pickNamedDate = (month: number, day: number) => {
    const next = new Date(current);
    next.setFullYear(next.getFullYear(), month - 1, day);
    onChange(next.toISOString());
    setDateOpen(false);
  };

  const animateDay = () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      setAnimating(false);
      return;
    }
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setHour(HOUR_MAX);
      return;
    }
    setAnimating(true);
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ANIMATE_MS);
      setHour(HOUR_MIN + p * (HOUR_MAX - HOUR_MIN));
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
        setAnimating(false);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const altDeg = (sun.altitudeRad * 180) / Math.PI;
  const azDeg = (sun.azimuthRad * 180) / Math.PI;
  const aboveHorizon = sun.altitudeRad > 0;
  const readout = aboveHorizon
    ? `${formatHourLabel(hour)} · sol ${Math.round(altDeg)}° över horisonten · ${azimuthToCompassSv(
        sun.azimuthRad,
      )}`
    : `${formatHourLabel(hour)} · sol under horisonten`;

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 16,
        height: 64,
        flexShrink: 0,
        padding: "0 18px",
        background: "var(--bg-surface)",
        borderTop: "1px solid var(--line-1)",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* Date pill */}
      <div style={{ position: "relative" }}>
        <button
          data-pp-btn
          aria-expanded={dateOpen}
          onClick={() => setDateOpen((v) => !v)}
          title="Välj datum"
        >
          <IconCalendar size={14} /> {formatDatePill(current)}
        </button>
        {dateOpen && (
          <>
            <div
              aria-hidden="true"
              onClick={() => setDateOpen(false)}
              style={{ position: "fixed", inset: 0, zIndex: 30 }}
            />
            <div
              role="dialog"
              aria-label="Välj datum"
              style={{
                position: "absolute",
                bottom: "calc(100% + 8px)",
                left: 0,
                zIndex: 31,
                background: "var(--bg-surface)",
                border: "1px solid var(--line-1)",
                borderRadius: "var(--radius-3)",
                boxShadow: "var(--shadow-2)",
                padding: 12,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                minWidth: 200,
              }}
            >
              <input
                type="date"
                value={dateInputValue(current)}
                onChange={onDateInput}
                data-pp-input
                data-mono="true"
                style={{ width: "100%" }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {NAMED_DATES.map((nd) => (
                  <button
                    key={nd.label}
                    data-pp-btn
                    data-variant="ghost"
                    onClick={() => pickNamedDate(nd.month, nd.day)}
                    style={{ justifyContent: "flex-start" }}
                  >
                    {nd.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Scrubber */}
      <div style={{ position: "relative", flex: 1, height: 40 }}>
        {/* base track */}
        <div
          style={{
            position: "absolute",
            top: 14,
            left: 0,
            right: 0,
            height: 4,
            borderRadius: 2,
            background: "var(--line-2)",
          }}
        />
        {/* now-arc 06:00 → current */}
        <div
          style={{
            position: "absolute",
            top: 14,
            left: 0,
            width: `${pct * 100}%`,
            height: 4,
            borderRadius: 2,
            background: "var(--accent-sun)",
          }}
        />
        {/* ticks + labels */}
        {TICK_HOURS.map((h) => {
          const p = (h - HOUR_MIN) / (HOUR_MAX - HOUR_MIN);
          return (
            <div key={h} style={{ position: "absolute", left: `${p * 100}%`, top: 0 }}>
              <div
                style={{
                  position: "absolute",
                  top: 10,
                  left: 0,
                  width: 1,
                  height: 12,
                  background: "var(--line-2)",
                  transform: "translateX(-0.5px)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 24,
                  left: 0,
                  transform: "translateX(-50%)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: "var(--ink-2)",
                  whiteSpace: "nowrap",
                }}
              >
                {String(h).padStart(2, "0")}
              </div>
            </div>
          );
        })}
        {/* marker handle */}
        <div
          style={{
            position: "absolute",
            top: 16 - 7,
            left: `${pct * 100}%`,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "var(--accent-sun)",
            border: "2px solid var(--bg-surface)",
            transform: "translateX(-50%)",
            pointerEvents: "none",
          }}
        />
        {/* accessible range input on top */}
        <input
          type="range"
          min={HOUR_MIN}
          max={HOUR_MAX}
          step={HOUR_STEP}
          value={hour}
          onChange={(e) => setHour(Number(e.target.value))}
          aria-label="Tidpunkt för skuggförhandsgranskning"
          style={{
            position: "absolute",
            top: 8,
            left: 0,
            width: "100%",
            height: 16,
            margin: 0,
            opacity: 0,
            cursor: "pointer",
          }}
        />
      </div>

      {/* Readout */}
      <span
        title={`Altitud ${fmtNum(altDeg, 1)}° · Azimut ${fmtNum(azDeg, 1)}°`}
        style={{
          fontFamily: "var(--font-mono)",
          fontVariantNumeric: "tabular-nums",
          fontSize: 12.5,
          color: "var(--ink-2)",
          whiteSpace: "nowrap",
        }}
      >
        {readout}
      </span>

      {/* Shadow toggle (S) */}
      <button
        data-pp-btn
        data-icon-only="true"
        data-variant={showShadows ? "primary" : undefined}
        onClick={onToggleShadows}
        title="Visa / dölj skuggor (S)"
        aria-pressed={showShadows}
      >
        {showShadows ? <IconEye size={15} /> : <IconEyeOff size={15} />}
      </button>

      {/* Animate the day */}
      <button
        data-pp-btn
        data-icon-only="true"
        data-variant={animating ? "primary" : undefined}
        onClick={animateDay}
        title="Animera dagen 06–20"
        aria-pressed={animating}
      >
        <IconSun size={15} />
      </button>
    </div>
  );
}
