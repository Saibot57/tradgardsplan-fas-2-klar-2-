import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * TimeBar — full-width bottom strip (64 px) that owns the day/time scrub.
 *
 * Controls state.sun.dateIso (interactive preview time for Canvas shadows).
 * Aggregate summer analysis (bedSunHours in SidePanel) uses a SEPARATE fixed
 * reference date and is intentionally NOT affected by this scrubber
 * (ADR-007/008 distinction — do not unify the two).
 */
import { useEffect, useRef, useState } from "react";
import { fmtNum } from "./format.js";
import { IconEye, IconEyeOff, IconSun, IconCalendar } from "./icons.js";
const HOUR_MIN = 6;
const HOUR_MAX = 20;
const HOUR_STEP = 0.25; // 15 min
const ANIMATE_MS = 4000;
const TICK_HOURS = [6, 9, 12, 15, 18, 20];
function hourFromDate(d) {
    return d.getHours() + d.getMinutes() / 60;
}
function withHour(d, decimalHour) {
    const next = new Date(d);
    const h = Math.floor(decimalHour);
    const m = Math.round((decimalHour - h) * 60);
    next.setHours(h, m, 0, 0);
    return next;
}
function dateInputValue(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}
function formatHourLabel(decimalHour) {
    const h = Math.floor(decimalHour);
    const m = Math.round((decimalHour - h) * 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
function formatDatePill(d) {
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
function azimuthToCompassSv(azimuthRad) {
    const azDeg = (azimuthRad * 180) / Math.PI;
    const bearing = ((180 + azDeg) % 360 + 360) % 360;
    const idx = Math.round(bearing / 45) % 8;
    return COMPASS_8[idx];
}
/** Namngivna datum — sätts på aktuellt år. */
const NAMED_DATES = [
    { label: "Vårdagjämning", month: 3, day: 20 },
    { label: "Midsommar", month: 6, day: 21 },
    { label: "Höstdagjämning", month: 9, day: 22 },
];
export function TimeBar({ dateIso, onChange, showShadows, onToggleShadows, sun }) {
    const current = new Date(dateIso);
    const hour = Math.min(HOUR_MAX, Math.max(HOUR_MIN, hourFromDate(current)));
    const pct = (hour - HOUR_MIN) / (HOUR_MAX - HOUR_MIN);
    const [dateOpen, setDateOpen] = useState(false);
    const [animating, setAnimating] = useState(false);
    const rafRef = useRef(null);
    // Latest date-Y/M/D, read inside the animation loop without re-binding it.
    const dayRef = useRef(current);
    dayRef.current = current;
    useEffect(() => {
        return () => {
            if (rafRef.current != null)
                cancelAnimationFrame(rafRef.current);
        };
    }, []);
    const setHour = (h) => onChange(withHour(dayRef.current, h).toISOString());
    const onDateInput = (e) => {
        const [y, m, d] = e.target.value.split("-").map(Number);
        if (!y || !m || !d)
            return;
        const next = new Date(current);
        next.setFullYear(y, m - 1, d);
        onChange(next.toISOString());
    };
    const pickNamedDate = (month, day) => {
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
        const reduce = typeof window !== "undefined" &&
            window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        if (reduce) {
            setHour(HOUR_MAX);
            return;
        }
        setAnimating(true);
        const t0 = performance.now();
        const tick = (now) => {
            const p = Math.min(1, (now - t0) / ANIMATE_MS);
            setHour(HOUR_MIN + p * (HOUR_MAX - HOUR_MIN));
            if (p < 1) {
                rafRef.current = requestAnimationFrame(tick);
            }
            else {
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
        ? `${formatHourLabel(hour)} · sol ${Math.round(altDeg)}° över horisonten · ${azimuthToCompassSv(sun.azimuthRad)}`
        : `${formatHourLabel(hour)} · sol under horisonten`;
    return (_jsxs("div", { style: {
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
        }, children: [_jsxs("div", { style: { position: "relative" }, children: [_jsxs("button", { "data-pp-btn": true, "aria-expanded": dateOpen, onClick: () => setDateOpen((v) => !v), title: "V\u00E4lj datum", children: [_jsx(IconCalendar, { size: 14 }), " ", formatDatePill(current)] }), dateOpen && (_jsxs(_Fragment, { children: [_jsx("div", { "aria-hidden": "true", onClick: () => setDateOpen(false), style: { position: "fixed", inset: 0, zIndex: 30 } }), _jsxs("div", { role: "dialog", "aria-label": "V\u00E4lj datum", style: {
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
                                }, children: [_jsx("input", { type: "date", value: dateInputValue(current), onChange: onDateInput, "data-pp-input": true, "data-mono": "true", style: { width: "100%" } }), _jsx("div", { style: { display: "flex", flexDirection: "column", gap: 4 }, children: NAMED_DATES.map((nd) => (_jsx("button", { "data-pp-btn": true, "data-variant": "ghost", onClick: () => pickNamedDate(nd.month, nd.day), style: { justifyContent: "flex-start" }, children: nd.label }, nd.label))) })] })] }))] }), _jsxs("div", { style: { position: "relative", flex: 1, height: 40 }, children: [_jsx("div", { style: {
                            position: "absolute",
                            top: 14,
                            left: 0,
                            right: 0,
                            height: 4,
                            borderRadius: 2,
                            background: "var(--line-2)",
                        } }), _jsx("div", { style: {
                            position: "absolute",
                            top: 14,
                            left: 0,
                            width: `${pct * 100}%`,
                            height: 4,
                            borderRadius: 2,
                            background: "var(--accent-sun)",
                        } }), TICK_HOURS.map((h) => {
                        const p = (h - HOUR_MIN) / (HOUR_MAX - HOUR_MIN);
                        return (_jsxs("div", { style: { position: "absolute", left: `${p * 100}%`, top: 0 }, children: [_jsx("div", { style: {
                                        position: "absolute",
                                        top: 10,
                                        left: 0,
                                        width: 1,
                                        height: 12,
                                        background: "var(--line-2)",
                                        transform: "translateX(-0.5px)",
                                    } }), _jsx("div", { style: {
                                        position: "absolute",
                                        top: 24,
                                        left: 0,
                                        transform: "translateX(-50%)",
                                        fontFamily: "var(--font-mono)",
                                        fontSize: 10,
                                        color: "var(--ink-2)",
                                        whiteSpace: "nowrap",
                                    }, children: String(h).padStart(2, "0") })] }, h));
                    }), _jsx("div", { style: {
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
                        } }), _jsx("input", { type: "range", min: HOUR_MIN, max: HOUR_MAX, step: HOUR_STEP, value: hour, onChange: (e) => setHour(Number(e.target.value)), "aria-label": "Tidpunkt f\u00F6r skuggf\u00F6rhandsgranskning", style: {
                            position: "absolute",
                            top: 8,
                            left: 0,
                            width: "100%",
                            height: 16,
                            margin: 0,
                            opacity: 0,
                            cursor: "pointer",
                        } })] }), _jsx("span", { title: `Altitud ${fmtNum(altDeg, 1)}° · Azimut ${fmtNum(azDeg, 1)}°`, style: {
                    fontFamily: "var(--font-mono)",
                    fontVariantNumeric: "tabular-nums",
                    fontSize: 12.5,
                    color: "var(--ink-2)",
                    whiteSpace: "nowrap",
                }, children: readout }), _jsx("button", { "data-pp-btn": true, "data-icon-only": "true", "data-variant": showShadows ? "primary" : undefined, onClick: onToggleShadows, title: "Visa / d\u00F6lj skuggor (S)", "aria-pressed": showShadows, children: showShadows ? _jsx(IconEye, { size: 15 }) : _jsx(IconEyeOff, { size: 15 }) }), _jsx("button", { "data-pp-btn": true, "data-icon-only": "true", "data-variant": animating ? "primary" : undefined, onClick: animateDay, title: "Animera dagen 06\u201320", "aria-pressed": animating, children: _jsx(IconSun, { size: 15 }) })] }));
}
//# sourceMappingURL=TimeBar.js.map