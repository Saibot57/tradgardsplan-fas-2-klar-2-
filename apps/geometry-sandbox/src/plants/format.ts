/**
 * Plant-specific formatters. Wraps the shared `fmtInt` / `fmtNum` from
 * `../format.js` so the catalog UI stays consistent with the rest of the
 * sandbox (decimal comma, thin-space thousands).
 */

import { fmtInt, fmtNum } from "../format.js";

export function fmtLux(n: number): string {
  return `${fmtInt(n)} lux`;
}

export function fmtTemp(n: number): string {
  return `${fmtNum(n, 0)} °C`;
}

export function fmtPct(n: number): string {
  return `${fmtNum(n, 0)} %`;
}

export function fmtMicroS(n: number): string {
  return `${fmtInt(n)} µS/cm`;
}

/**
 * Plain-language label for a nutrient EC maximum.
 *
 * Boundaries (µS/cm):
 *   < 800      → "Låg näring"
 *   800–1600   → "Medelhög näring"
 *   > 1600     → "Hög näring"
 */
export function ecLabel(maxMicroS: number): string {
  if (maxMicroS < 800) return "Låg näring";
  if (maxMicroS <= 1600) return "Medelhög näring";
  return "Hög näring";
}

export type SunCategoryToken = "full" | "partial" | "shade";

/**
 * Parse a free-text sun category (e.g. "Full sol / Halvskugga") into one or
 * more canonical tokens. Returns an empty array for `undefined` / unknown
 * strings. Order of the input is preserved.
 */
export function parseSunCategory(s: string | undefined): SunCategoryToken[] {
  if (!s) return [];
  const seen = new Set<SunCategoryToken>();
  const out: SunCategoryToken[] = [];
  for (const part of s.split("/")) {
    const p = part.trim().toLowerCase();
    let token: SunCategoryToken | null = null;
    if (p === "full sol" || p === "full sun") token = "full";
    else if (p === "halvskugga" || p === "partial shade" || p === "partial") token = "partial";
    else if (p === "skugga" || p === "shade") token = "shade";
    if (token && !seen.has(token)) {
      seen.add(token);
      out.push(token);
    }
  }
  return out;
}

/** Display the raw sun category string, falling back to an em-dash. */
export function sunCategoryLabel(s: string | undefined): string {
  if (!s) return "—";
  return s;
}
