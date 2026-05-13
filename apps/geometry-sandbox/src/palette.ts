export interface CanvasPalette {
  bgCanvas: string;
  grid: string;
  ink1: string;
  ink2: string;
  line1: string;
  accentSun: string;
  accentSunFill: string;
  accentBed: string;
  accentBedFill: string;
  accentWall: string;
  accentWallFill: string;
  stateDanger: string;
  stateDangerFill: string;
  shadowCanvas: string;
  compassN: string;
  handleFill: string;
  handleStroke: string;
  rotateHandleFill: string;
  centerDot: string;
  measurementText: string;
  labelText: string;
}

function readVar(styles: CSSStyleDeclaration, name: string, fallback: string): string {
  const v = styles.getPropertyValue(name).trim();
  return v || fallback;
}

/**
 * Convert "#RRGGBB" or "#RGB" to "rgba(r,g,b,a)". Non-hex inputs are returned unchanged.
 */
function withAlpha(hex: string, alpha: number): string {
  const m = hex.trim();
  if (!m.startsWith("#")) return m;
  let r = 0;
  let g = 0;
  let b = 0;
  if (m.length === 7) {
    r = parseInt(m.slice(1, 3), 16);
    g = parseInt(m.slice(3, 5), 16);
    b = parseInt(m.slice(5, 7), 16);
  } else if (m.length === 4) {
    r = parseInt(m[1]! + m[1]!, 16);
    g = parseInt(m[2]! + m[2]!, 16);
    b = parseInt(m[3]! + m[3]!, 16);
  } else {
    return m;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function readCanvasPalette(): CanvasPalette {
  const s = getComputedStyle(document.documentElement);
  const bed = readVar(s, "--accent-bed", "#6E8C5A");
  const wall = readVar(s, "--accent-wall", "#8C8478");
  const danger = readVar(s, "--state-danger", "#B23A2A");
  const sun = readVar(s, "--accent-sun", "#D4A24C");
  return {
    bgCanvas: readVar(s, "--bg-canvas", "#ECE5D4"),
    grid: readVar(s, "--line-1", "#D8D1C0"),
    ink1: readVar(s, "--ink-1", "#1F2419"),
    ink2: readVar(s, "--ink-2", "#5B5C50"),
    line1: readVar(s, "--line-1", "#D8D1C0"),
    accentSun: sun,
    accentSunFill: withAlpha(sun, 0.28),
    accentBed: bed,
    accentBedFill: withAlpha(bed, 0.32),
    accentWall: wall,
    accentWallFill: withAlpha(wall, 0.45),
    stateDanger: danger,
    stateDangerFill: withAlpha(danger, 0.3),
    shadowCanvas: readVar(s, "--shadow-canvas", "rgba(31, 36, 25, 0.28)"),
    compassN: danger,
    handleFill: readVar(s, "--bg-surface", "#FBF8F2"),
    handleStroke: readVar(s, "--ink-1", "#1F2419"),
    rotateHandleFill: sun,
    centerDot: readVar(s, "--ink-1", "#1F2419"),
    measurementText: readVar(s, "--ink-1", "#1F2419"),
    labelText: readVar(s, "--ink-2", "#5B5C50"),
  };
}
