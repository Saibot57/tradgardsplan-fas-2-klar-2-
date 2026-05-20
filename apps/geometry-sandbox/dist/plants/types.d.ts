/**
 * Plant catalog data layer — pure data types.
 *
 * `PlantPlacement` (a plant placed inside a Rect bed) is intentionally NOT
 * defined here. It belongs in `packages/spatial-core/src/types.ts` together
 * with `Rect`, and is added when the scene schema bumps to v4.
 */
export type PlantCategory = "vegetable" | "herb" | "berry" | "flower";
export interface TemperatureRange {
    minC: number;
    maxC: number;
}
export interface LightRange {
    minLux: number;
    maxLux: number;
}
export interface PercentRange {
    minPct: number;
    maxPct: number;
}
export interface NutrientRange {
    minMicroS: number;
    maxMicroS: number;
}
/**
 * Care profile for one plant species. Loaded from the bundled `crops.json`
 * after validation by `PlantRepository`. All numeric ranges are required;
 * categorical fields are optional.
 */
export interface PlantCareProfile {
    /** Kebab-case scientific identifier, e.g. "solanum-lycopersicum". */
    id: string;
    /** Swedish common name, e.g. "Tomat". */
    commonName: string;
    /** Optional English common name, e.g. "Tomato". */
    commonNameEn?: string;
    /** Latin scientific name, e.g. "Solanum lycopersicum". */
    scientificName: string;
    category: PlantCategory;
    temperature: TemperatureRange;
    light: LightRange;
    soilMoisture: PercentRange;
    nutrientEC: NutrientRange;
    humidity: PercentRange;
    soilTypes?: string[];
    sowingMethod?: string;
    /** Suggested planting spacing in mm (within a row). */
    spreadMm?: number;
    /** Suggested row spacing in mm. */
    rowSpacingMm?: number;
    daysToMaturity?: number;
    /**
     * Free-text sun category, possibly compound, e.g.
     * "Full sol" | "Halvskugga" | "Skugga" | "Full sol / Halvskugga".
     * Use `parseSunCategory` (in format.ts) to extract canonical tokens.
     */
    sunCategory?: string;
    waterFrequency?: string;
    imageUrl?: string;
}
