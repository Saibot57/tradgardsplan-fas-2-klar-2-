/**
 * Plant-specific formatters. Wraps the shared `fmtInt` / `fmtNum` from
 * `../format.js` so the catalog UI stays consistent with the rest of the
 * sandbox (decimal comma, thin-space thousands).
 */
export declare function fmtLux(n: number): string;
export declare function fmtTemp(n: number): string;
export declare function fmtPct(n: number): string;
export declare function fmtMicroS(n: number): string;
/**
 * Plain-language label for a nutrient EC maximum.
 *
 * Boundaries (µS/cm):
 *   < 800      → "Låg näring"
 *   800–1600   → "Medelhög näring"
 *   > 1600     → "Hög näring"
 */
export declare function ecLabel(maxMicroS: number): string;
export type SunCategoryToken = "full" | "partial" | "shade";
/**
 * Parse a free-text sun category (e.g. "Full sol / Halvskugga") into one or
 * more canonical tokens. Returns an empty array for `undefined` / unknown
 * strings. Order of the input is preserved.
 */
export declare function parseSunCategory(s: string | undefined): SunCategoryToken[];
/** Display the raw sun category string, falling back to an em-dash. */
export declare function sunCategoryLabel(s: string | undefined): string;
