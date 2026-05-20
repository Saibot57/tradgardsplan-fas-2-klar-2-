/**
 * Hand-rolled validator for the bundled `crops.json`. No external dep — the
 * sandbox keeps its dep surface tiny, matching the spatial-core convention.
 *
 * `parsePlantCatalog` rejects on the first error with a `PlantValidationError`
 * carrying the offending path (e.g. `plants[7].temperature`). Silent fallback
 * to `null` is forbidden — duplicates the no-tysta-fel policy from
 * `parseScene()` in spatial-core.
 */
import cropsRaw from "./crops.json";
export class PlantValidationError extends Error {
    path;
    constructor(message, path) {
        super(path ? `${path}: ${message}` : message);
        this.name = "PlantValidationError";
        this.path = path;
    }
}
const VALID_CATEGORIES = new Set([
    "vegetable",
    "herb",
    "berry",
    "flower",
]);
function isFiniteNumber(v) {
    return typeof v === "number" && Number.isFinite(v);
}
function isNonEmptyString(v) {
    return typeof v === "string" && v.length > 0;
}
function parseRange(raw, minKey, maxKey, path) {
    if (!raw || typeof raw !== "object") {
        throw new PlantValidationError("missing or non-object range", path);
    }
    const r = raw;
    const min = r[minKey];
    const max = r[maxKey];
    if (!isFiniteNumber(min))
        throw new PlantValidationError(`missing/invalid ${minKey}`, path);
    if (!isFiniteNumber(max))
        throw new PlantValidationError(`missing/invalid ${maxKey}`, path);
    if (min > max)
        throw new PlantValidationError(`${minKey} > ${maxKey}`, path);
    return { [minKey]: min, [maxKey]: max };
}
function parseStringArray(v, path) {
    if (!Array.isArray(v))
        throw new PlantValidationError("expected string[]", path);
    const out = [];
    for (let i = 0; i < v.length; i++) {
        const s = v[i];
        if (!isNonEmptyString(s)) {
            throw new PlantValidationError(`non-string at index ${i}`, path);
        }
        out.push(s);
    }
    return out;
}
export function parsePlant(raw, index) {
    const path = `plants[${index}]`;
    if (!raw || typeof raw !== "object") {
        throw new PlantValidationError("expected object", path);
    }
    const r = raw;
    if (!isNonEmptyString(r.id)) {
        throw new PlantValidationError("missing/invalid id", `${path}.id`);
    }
    if (!isNonEmptyString(r.commonName)) {
        throw new PlantValidationError("missing/invalid commonName", `${path}.commonName`);
    }
    if (!isNonEmptyString(r.scientificName)) {
        throw new PlantValidationError("missing/invalid scientificName", `${path}.scientificName`);
    }
    if (!isNonEmptyString(r.category) || !VALID_CATEGORIES.has(r.category)) {
        throw new PlantValidationError(`invalid category: ${String(r.category)}`, `${path}.category`);
    }
    const temperature = parseRange(r.temperature, "minC", "maxC", `${path}.temperature`);
    const light = parseRange(r.light, "minLux", "maxLux", `${path}.light`);
    const soilMoisture = parseRange(r.soilMoisture, "minPct", "maxPct", `${path}.soilMoisture`);
    const nutrientEC = parseRange(r.nutrientEC, "minMicroS", "maxMicroS", `${path}.nutrientEC`);
    const humidity = parseRange(r.humidity, "minPct", "maxPct", `${path}.humidity`);
    const out = {
        id: r.id,
        commonName: r.commonName,
        scientificName: r.scientificName,
        category: r.category,
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
export function parsePlantCatalog(raw) {
    if (!Array.isArray(raw)) {
        throw new PlantValidationError("expected top-level array");
    }
    const seen = new Set();
    const out = [];
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
let _cached = null;
/**
 * Load and validate the bundled `crops.json`. The result is cached after
 * the first call; subsequent calls return the same array reference.
 */
export function loadDefaultPlantCatalog() {
    if (_cached)
        return _cached;
    _cached = parsePlantCatalog(cropsRaw);
    return _cached;
}
//# sourceMappingURL=PlantRepository.js.map