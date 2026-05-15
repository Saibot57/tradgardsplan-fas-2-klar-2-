/**
 * Hand-rolled validator for the bundled `crops.json`. No external dep — the
 * sandbox keeps its dep surface tiny, matching the spatial-core convention.
 *
 * `parsePlantCatalog` rejects on the first error with a `PlantValidationError`
 * carrying the offending path (e.g. `plants[7].temperature`). Silent fallback
 * to `null` is forbidden — duplicates the no-tysta-fel policy from
 * `parseScene()` in spatial-core.
 */

import type {
  LightRange,
  NutrientRange,
  PercentRange,
  PlantCareProfile,
  PlantCategory,
  TemperatureRange,
} from "./types.js";
import cropsRaw from "./crops.json";

export class PlantValidationError extends Error {
  readonly path: string | undefined;
  constructor(message: string, path?: string) {
    super(path ? `${path}: ${message}` : message);
    this.name = "PlantValidationError";
    this.path = path;
  }
}

const VALID_CATEGORIES: ReadonlySet<PlantCategory> = new Set<PlantCategory>([
  "vegetable",
  "herb",
  "berry",
  "flower",
]);

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.length > 0;
}

function parseRange<MinK extends string, MaxK extends string>(
  raw: unknown,
  minKey: MinK,
  maxKey: MaxK,
  path: string,
): Record<MinK | MaxK, number> {
  if (!raw || typeof raw !== "object") {
    throw new PlantValidationError("missing or non-object range", path);
  }
  const r = raw as Record<string, unknown>;
  const min = r[minKey];
  const max = r[maxKey];
  if (!isFiniteNumber(min)) throw new PlantValidationError(`missing/invalid ${minKey}`, path);
  if (!isFiniteNumber(max)) throw new PlantValidationError(`missing/invalid ${maxKey}`, path);
  if (min > max) throw new PlantValidationError(`${minKey} > ${maxKey}`, path);
  return { [minKey]: min, [maxKey]: max } as Record<MinK | MaxK, number>;
}

function parseStringArray(v: unknown, path: string): string[] {
  if (!Array.isArray(v)) throw new PlantValidationError("expected string[]", path);
  const out: string[] = [];
  for (let i = 0; i < v.length; i++) {
    const s = v[i];
    if (!isNonEmptyString(s)) {
      throw new PlantValidationError(`non-string at index ${i}`, path);
    }
    out.push(s);
  }
  return out;
}

export function parsePlant(raw: unknown, index: number): PlantCareProfile {
  const path = `plants[${index}]`;
  if (!raw || typeof raw !== "object") {
    throw new PlantValidationError("expected object", path);
  }
  const r = raw as Record<string, unknown>;

  if (!isNonEmptyString(r.id)) {
    throw new PlantValidationError("missing/invalid id", `${path}.id`);
  }
  if (!isNonEmptyString(r.commonName)) {
    throw new PlantValidationError("missing/invalid commonName", `${path}.commonName`);
  }
  if (!isNonEmptyString(r.scientificName)) {
    throw new PlantValidationError("missing/invalid scientificName", `${path}.scientificName`);
  }
  if (!isNonEmptyString(r.category) || !VALID_CATEGORIES.has(r.category as PlantCategory)) {
    throw new PlantValidationError(`invalid category: ${String(r.category)}`, `${path}.category`);
  }

  const temperature = parseRange(r.temperature, "minC", "maxC", `${path}.temperature`) as TemperatureRange;
  const light = parseRange(r.light, "minLux", "maxLux", `${path}.light`) as LightRange;
  const soilMoisture = parseRange(r.soilMoisture, "minPct", "maxPct", `${path}.soilMoisture`) as PercentRange;
  const nutrientEC = parseRange(r.nutrientEC, "minMicroS", "maxMicroS", `${path}.nutrientEC`) as NutrientRange;
  const humidity = parseRange(r.humidity, "minPct", "maxPct", `${path}.humidity`) as PercentRange;

  const out: PlantCareProfile = {
    id: r.id,
    commonName: r.commonName,
    scientificName: r.scientificName,
    category: r.category as PlantCategory,
    temperature,
    light,
    soilMoisture,
    nutrientEC,
    humidity,
  };

  // Optional fields — added conditionally to honor exactOptionalPropertyTypes.
  if (r.commonNameEn !== undefined) {
    if (!isNonEmptyString(r.commonNameEn)) {
      throw new PlantValidationError("expected non-empty string", `${path}.commonNameEn`);
    }
    out.commonNameEn = r.commonNameEn;
  }
  if (r.soilTypes !== undefined) {
    out.soilTypes = parseStringArray(r.soilTypes, `${path}.soilTypes`);
  }
  if (r.sowingMethod !== undefined) {
    if (!isNonEmptyString(r.sowingMethod)) {
      throw new PlantValidationError("expected non-empty string", `${path}.sowingMethod`);
    }
    out.sowingMethod = r.sowingMethod;
  }
  if (r.spreadMm !== undefined) {
    if (!isFiniteNumber(r.spreadMm)) {
      throw new PlantValidationError("expected number", `${path}.spreadMm`);
    }
    out.spreadMm = r.spreadMm;
  }
  if (r.rowSpacingMm !== undefined) {
    if (!isFiniteNumber(r.rowSpacingMm)) {
      throw new PlantValidationError("expected number", `${path}.rowSpacingMm`);
    }
    out.rowSpacingMm = r.rowSpacingMm;
  }
  if (r.daysToMaturity !== undefined) {
    if (!isFiniteNumber(r.daysToMaturity)) {
      throw new PlantValidationError("expected number", `${path}.daysToMaturity`);
    }
    out.daysToMaturity = r.daysToMaturity;
  }
  if (r.sunCategory !== undefined) {
    if (!isNonEmptyString(r.sunCategory)) {
      throw new PlantValidationError("expected non-empty string", `${path}.sunCategory`);
    }
    out.sunCategory = r.sunCategory;
  }
  if (r.waterFrequency !== undefined) {
    if (!isNonEmptyString(r.waterFrequency)) {
      throw new PlantValidationError("expected non-empty string", `${path}.waterFrequency`);
    }
    out.waterFrequency = r.waterFrequency;
  }
  if (r.imageUrl !== undefined) {
    if (!isNonEmptyString(r.imageUrl)) {
      throw new PlantValidationError("expected non-empty string", `${path}.imageUrl`);
    }
    out.imageUrl = r.imageUrl;
  }

  return out;
}

export function parsePlantCatalog(raw: unknown): PlantCareProfile[] {
  if (!Array.isArray(raw)) {
    throw new PlantValidationError("expected top-level array");
  }
  const seen = new Set<string>();
  const out: PlantCareProfile[] = [];
  for (let i = 0; i < raw.length; i++) {
    const plant = parsePlant(raw[i], i);
    if (seen.has(plant.id)) {
      throw new PlantValidationError(`duplicate id "${plant.id}"`, `plants[${i}]`);
    }
    seen.add(plant.id);
    out.push(plant);
  }
  return out;
}

let _cached: PlantCareProfile[] | null = null;

/**
 * Load and validate the bundled `crops.json`. The result is cached after
 * the first call; subsequent calls return the same array reference.
 */
export function loadDefaultPlantCatalog(): PlantCareProfile[] {
  if (_cached) return _cached;
  _cached = parsePlantCatalog(cropsRaw);
  return _cached;
}
