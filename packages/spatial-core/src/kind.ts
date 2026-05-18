/**
 * Objekttyp-semantik (ADR-009).
 *
 * `Rect.kind` är valfri. Saknas värdet behandlas objektet som "bed" — det
 * gör att SceneV1/V2-filer laddas oförändrat.
 */

import type { ObjectKind } from "./types.js";

export type { ObjectKind } from "./types.js";

export const DEFAULT_OBJECT_KIND: ObjectKind = "bed";

export const OBJECT_KINDS: readonly ObjectKind[] = [
  "bed",
  "rabatt",
  "building",
  "hedge",
  "grass",
  "paved",
  "gravel",
  "deck",
  "surface",
];

export function isObjectKind(value: unknown): value is ObjectKind {
  return (
    typeof value === "string" &&
    (OBJECT_KINDS as readonly string[]).includes(value)
  );
}

export interface KindRule {
  /** Räknas i jordvolym-summering. */
  hasSoil: boolean;
  /** Bör visuellt rendera/användas som skuggkastare. wallHeight styr fortfarande de facto. */
  castsShadow: boolean;
}

export const KIND_RULES: Readonly<Record<ObjectKind, KindRule>> = {
  bed:      { hasSoil: true,  castsShadow: false },
  rabatt:   { hasSoil: true,  castsShadow: false },
  building: { hasSoil: false, castsShadow: true  },
  hedge:    { hasSoil: false, castsShadow: true  },
  grass:    { hasSoil: false, castsShadow: false },
  paved:    { hasSoil: false, castsShadow: false },
  gravel:   { hasSoil: false, castsShadow: false },
  deck:     { hasSoil: false, castsShadow: false },
  surface:  { hasSoil: false, castsShadow: false },
};

/** Returnerar kind med default-fallback för legacy-data. */
export function getKind(r: { kind?: ObjectKind }): ObjectKind {
  return r.kind ?? DEFAULT_OBJECT_KIND;
}
