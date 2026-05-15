// PlantCatalog — shared UI primitives. Mirrors the style language of the
// existing SidePanel.tsx / Toolbar.tsx in geometry-sandbox (inline styles,
// CSS variables, tabular-nums numerics).

const { useState: pcUseState, useEffect: pcUseEffect, useRef: pcUseRef, useMemo: pcUseMemo } = React;

// ─── Button ────────────────────────────────────────────────────
function PCButton({ variant = "secondary", size = "md", iconOnly, disabled, onClick, title, children, style, type = "button" }) {
  const h = size === "sm" ? 26 : 32;
  const padX = iconOnly ? (size === "sm" ? 6 : 8) : (size === "sm" ? 10 : 12);
  const base = {
    fontFamily: "var(--font-sans)",
    fontSize: size === "sm" ? 12.5 : 13,
    fontWeight: 500,
    height: h,
    padding: `0 ${padX}px`,
    borderRadius: 4,
    border: "1px solid transparent",
    cursor: disabled ? "default" : "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    lineHeight: 1,
    transition: "background 120ms cubic-bezier(0.2,0.6,0.2,1), border-color 120ms",
    opacity: disabled ? 0.45 : 1,
    whiteSpace: "nowrap",
    ...style,
  };
  const variants = {
    primary:   { background: "var(--button-bg)", color: "var(--button-fg)" },
    secondary: { background: "var(--button-secondary-bg)", color: "var(--button-secondary-fg)", borderColor: "var(--button-secondary-border)" },
    ghost:     { background: "transparent", color: "var(--ink-1)" },
    accent:    { background: "var(--accent-bed)", color: "#FBF8F2", fontWeight: 600 },
    danger:    { background: "var(--state-danger)", color: "#FBF8F2" },
  };
  return (
    <button type={type} title={title} disabled={disabled} onClick={onClick} style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  );
}

// ─── Section label (inspector-style small caps) ────────────────
function PCSectionTitle({ icon, children, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 8 }}>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 7,
        fontSize: 11.5, color: "var(--ink-2)",
        textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500,
      }}>
        {icon ? <span style={{ display: "inline-flex", color: "var(--ink-2)" }}>{icon}</span> : null}
        {children}
      </div>
      {action}
    </div>
  );
}

// ─── Row: label left, value right (mono numerics) ──────────────
function PCRow({ label, value, mono = true }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, padding: "5px 0" }}>
      <div style={{ fontSize: 12.5, color: "var(--ink-2)", flexShrink: 0 }}>{label}</div>
      <div style={{
        fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
        fontSize: 13,
        color: "var(--ink-1)",
        fontVariantNumeric: "tabular-nums",
        textAlign: "right",
        lineHeight: 1.45,
      }}>{value}</div>
    </div>
  );
}

// ─── Chip (filter toggle) ──────────────────────────────────────
function PCChip({ active, onClick, children, size = "md", style }) {
  const h = size === "sm" ? 24 : 28;
  return (
    <button
      onClick={onClick}
      style={{
        height: h,
        padding: "0 12px",
        borderRadius: 999,
        border: active ? "1px solid var(--accent-bed)" : "1px solid var(--line-1)",
        background: active ? "var(--bed-100)" : "var(--bg-surface)",
        color: active ? "var(--bed-700)" : "var(--ink-1)",
        fontFamily: "var(--font-sans)",
        fontSize: 12.5,
        fontWeight: active ? 600 : 500,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        whiteSpace: "nowrap",
        transition: "background 120ms cubic-bezier(0.2,0.6,0.2,1), border-color 120ms",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ─── Category badge (small pill) ───────────────────────────────
function PCCategoryBadge({ category, size = "md" }) {
  const tint = window.PC_CATEGORY_TINT[category] || window.PC_CATEGORY_TINT.vegetable;
  const label = window.PC_CATEGORY_LABELS[category] || category;
  const h = size === "sm" ? 18 : 22;
  return (
    <span style={{
      height: h,
      padding: size === "sm" ? "0 6px" : "0 8px",
      borderRadius: 999,
      background: tint.bg,
      color: tint.fg,
      fontFamily: "var(--font-sans)",
      fontSize: size === "sm" ? 10.5 : 11.5,
      fontWeight: 500,
      letterSpacing: "0.02em",
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      lineHeight: 1,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: tint.dot }} />
      {label}
    </span>
  );
}

// ─── Range bar ──────────────────────────────────────────────────
// Segmented track: muted out-of-range / accent in-range. min/max labels
// in mono below. Same drafting-table feel as the canvas dimension labels.
function PCRangeBar({ min, max, scaleMin, scaleMax, unit, format = (n) => window.fmtInt(n), accent = "var(--accent-bed)" }) {
  const span = scaleMax - scaleMin;
  const leftPct = Math.max(0, ((min - scaleMin) / span) * 100);
  const rightPct = Math.min(100, ((max - scaleMin) / span) * 100);
  const widthPct = Math.max(2, rightPct - leftPct);

  // 5 tick stops for the muted track gradient
  return (
    <div style={{ marginTop: 6, marginBottom: 4 }}>
      {/* Scale labels — anchor + range */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--ink-3)",
        marginBottom: 4, fontVariantNumeric: "tabular-nums",
      }}>
        <span>{format(scaleMin)}{unit ? <span style={{ marginLeft: 1 }}>{unit}</span> : null}</span>
        <span>{format(scaleMax)}{unit ? <span style={{ marginLeft: 1 }}>{unit}</span> : null}</span>
      </div>

      {/* Track */}
      <div style={{ position: "relative", height: 12 }}>
        {/* Out-of-range muted track */}
        <div style={{
          position: "absolute", left: 0, right: 0, top: 4, height: 4,
          background: "var(--line-1)",
          borderRadius: 2,
        }}/>
        {/* In-range accent */}
        <div style={{
          position: "absolute", left: `${leftPct}%`, width: `${widthPct}%`, top: 3, height: 6,
          background: accent,
          borderRadius: 2,
        }}/>
        {/* Tick marks at boundaries */}
        <div style={{
          position: "absolute", left: `${leftPct}%`, top: 0, width: 1, height: 12,
          background: "var(--ink-1)", transform: "translateX(-0.5px)",
        }}/>
        <div style={{
          position: "absolute", left: `${rightPct}%`, top: 0, width: 1, height: 12,
          background: "var(--ink-1)", transform: "translateX(-0.5px)",
        }}/>
      </div>

      {/* Min/Max numeric labels under the ticks */}
      <div style={{ position: "relative", height: 16, marginTop: 2 }}>
        <span style={{
          position: "absolute", left: `${leftPct}%`, transform: "translateX(-50%)",
          fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-1)",
          fontVariantNumeric: "tabular-nums",
        }}>{format(min)}</span>
        <span style={{
          position: "absolute", left: `${rightPct}%`, transform: "translateX(-50%)",
          fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-1)",
          fontVariantNumeric: "tabular-nums",
        }}>{format(max)}</span>
      </div>
    </div>
  );
}

// ─── Plant thumbnail (placeholder w/ category icon) ────────────
// No real photos available, so we render a tinted card with the Lucide
// category icon. Looks intentional, on-brand, and reads at any size.
function PCPlantThumb({ plant, size = 64, rounded = 8, big }) {
  const tint = window.PC_CATEGORY_TINT[plant.category] || window.PC_CATEGORY_TINT.vegetable;
  // Use bg-tint as background, dot/fg as foreground icon
  return (
    <div style={{
      width: size, height: size,
      flexShrink: 0,
      borderRadius: rounded,
      background: tint.bg,
      color: tint.fg,
      display: "flex", alignItems: "center", justifyContent: "center",
      border: "1px solid var(--line-1)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Subtle radial vignette to hint at "paper card" depth */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.5), transparent 60%)",
        pointerEvents: "none",
      }}/>
      <div style={{ position: "relative" }}>
        {window.categoryIcon(plant.category, Math.round(size * (big ? 0.55 : 0.5)))}
      </div>
    </div>
  );
}

// ─── Tab bar ───────────────────────────────────────────────────
function PCTabBar({ tabs, value, onChange }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "stretch",
      height: "100%",
      gap: 0,
    }}>
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              position: "relative",
              height: "100%",
              padding: "0 16px",
              border: "none",
              background: "transparent",
              color: active ? "var(--ink-1)" : "var(--ink-2)",
              fontFamily: "var(--font-sans)",
              fontSize: 13.5,
              fontWeight: active ? 600 : 500,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              letterSpacing: "0.005em",
              transition: "color 120ms cubic-bezier(0.2,0.6,0.2,1)",
            }}
          >
            {t.icon ? <span style={{ display: "inline-flex" }}>{t.icon}</span> : null}
            {t.label}
            {/* Active underline */}
            <span style={{
              position: "absolute", left: 12, right: 12, bottom: -1, height: 2,
              background: active ? "var(--accent-bed)" : "transparent",
              borderRadius: "2px 2px 0 0",
              transition: "background 120ms cubic-bezier(0.2,0.6,0.2,1)",
            }}/>
          </button>
        );
      })}
    </div>
  );
}

// ─── Sun-category visual cue (small icon + label) ──────────────
function PCSunCategoryGlyph({ value, size = 14 }) {
  // Three states: full sol / halv / skugga. We don't enumerate beyond that.
  const isFull = /full sol/i.test(value || "");
  const isHalf = /halvskugga/i.test(value || "");
  const fill = isFull ? "var(--sun-500)" : isHalf ? "var(--sun-300)" : "var(--wall-300)";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="4" fill={fill}/>
      {isFull && (
        <g stroke={fill} strokeWidth="1.5" strokeLinecap="round">
          <path d="M12 3v2"/><path d="M12 19v2"/>
          <path d="M3 12h2"/><path d="M19 12h2"/>
          <path d="m5.6 5.6 1.4 1.4"/><path d="m17 17 1.4 1.4"/>
          <path d="m5.6 18.4 1.4-1.4"/><path d="M17 7l1.4-1.4"/>
        </g>
      )}
      {isHalf && (
        <g stroke="var(--wall-500)" strokeWidth="1.5" strokeLinecap="round">
          <path d="M12 3v2"/><path d="M3 12h2"/><path d="m5.6 5.6 1.4 1.4"/>
        </g>
      )}
    </svg>
  );
}

Object.assign(window, {
  PCButton, PCSectionTitle, PCRow, PCChip, PCCategoryBadge, PCRangeBar, PCPlantThumb, PCTabBar, PCSunCategoryGlyph,
});
