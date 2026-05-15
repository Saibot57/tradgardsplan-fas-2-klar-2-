/**
 * Left panel of the catalog. Three stacked sections:
 *
 *   1. Mina växter  — plants present in at least one bed.plants[]
 *   2. Planerade    — plannedPlantIds minus inGardenIds
 *   3. Alla växter  — full catalog, filtered by search/category/sun
 *
 * Search field and filter chips sit between Planerade and Alla.
 * Selection lives on the parent — we only emit `onSelectPlant`.
 */

import { useMemo, useState } from "react";
import type { Rect } from "@kolonitradgard/spatial-core";
import {
  applyPlantFilters,
  sortByCommonName,
  type CategoryFilter,
  type SunFilter,
} from "../plants/plantQueries.js";
import type { PlantCareProfile } from "../plants/types.js";
import { SectionTitle } from "../shared/SectionTitle.js";
import { inGardenIds, plantedSummary } from "../selectors/plantSelectors.js";
import { PlantRow } from "./PlantRow.js";
import { SearchInput } from "./controls/SearchInput.js";
import { FilterChipGroup } from "./controls/FilterChipGroup.js";

interface PlantListProps {
  plants: readonly PlantCareProfile[];
  beds: readonly Rect[];
  selectedPlantId: string | null;
  plannedPlantIds: readonly string[];
  onSelectPlant: (id: string) => void;
}

const CATEGORY_OPTIONS: ReadonlyArray<{ value: CategoryFilter; label: string }> = [
  { value: "all", label: "Alla" },
  { value: "vegetable", label: "Grönsaker" },
  { value: "herb", label: "Kryddor" },
  { value: "berry", label: "Bär" },
  { value: "flower", label: "Blommor" },
];

const SUN_OPTIONS: ReadonlyArray<{ value: SunFilter; label: string }> = [
  { value: "all", label: "Alla" },
  { value: "full", label: "Full sol" },
  { value: "partial", label: "Halvskugga" },
  { value: "shade", label: "Skugga" },
];

const blockStyle: React.CSSProperties = {
  padding: "16px 14px 0",
};

const rowsStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

const emptyHintStyle: React.CSSProperties = {
  padding: "4px 14px 8px",
  fontSize: 12,
  color: "var(--ink-2)",
  fontStyle: "italic",
};

const controlsStyle: React.CSSProperties = {
  padding: "16px 14px 12px",
  display: "flex",
  flexDirection: "column",
  gap: 10,
  borderTop: "1px solid var(--line-1)",
  borderBottom: "1px solid var(--line-1)",
  marginTop: 12,
};

export function PlantList({
  plants,
  beds,
  selectedPlantId,
  plannedPlantIds,
  onSelectPlant,
}: PlantListProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [sun, setSun] = useState<SunFilter>("all");

  const inGarden = useMemo(() => inGardenIds(beds), [beds]);

  const myPlants = useMemo(
    () => sortByCommonName(plants.filter((p) => inGarden.has(p.id))),
    [plants, inGarden],
  );

  const plannedOnly = useMemo(() => {
    const planned = new Set(plannedPlantIds);
    return sortByCommonName(
      plants.filter((p) => planned.has(p.id) && !inGarden.has(p.id)),
    );
  }, [plants, plannedPlantIds, inGarden]);

  const filtered = useMemo(
    () => sortByCommonName(applyPlantFilters(plants, { query, category, sun })),
    [plants, query, category, sun],
  );

  return (
    <div role="listbox" aria-label="Växter">
      <div style={blockStyle}>
        <SectionTitle>Mina växter ({myPlants.length})</SectionTitle>
      </div>
      {myPlants.length === 0 ? (
        <div style={emptyHintStyle}>Inga växter i bäddar ännu.</div>
      ) : (
        <div style={rowsStyle}>
          {myPlants.map((p) => {
            const summary = plantedSummary(beds, p.id);
            return (
              <PlantRow
                key={p.id}
                plant={p}
                active={p.id === selectedPlantId}
                onClick={() => onSelectPlant(p.id)}
                badge={`×${summary.total}`}
              />
            );
          })}
        </div>
      )}

      {plannedOnly.length > 0 && (
        <>
          <div style={blockStyle}>
            <SectionTitle>Planerade ({plannedOnly.length})</SectionTitle>
          </div>
          <div style={rowsStyle}>
            {plannedOnly.map((p) => (
              <PlantRow
                key={p.id}
                plant={p}
                active={p.id === selectedPlantId}
                onClick={() => onSelectPlant(p.id)}
                dim
              />
            ))}
          </div>
        </>
      )}

      <div style={controlsStyle}>
        <SearchInput value={query} onChange={setQuery} />
        <FilterChipGroup<CategoryFilter>
          label="Typ"
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={setCategory}
        />
        <FilterChipGroup<SunFilter>
          label="Sol"
          options={SUN_OPTIONS}
          value={sun}
          onChange={setSun}
        />
      </div>

      <div style={blockStyle}>
        <SectionTitle>Alla växter ({filtered.length})</SectionTitle>
      </div>
      {filtered.length === 0 ? (
        <div style={emptyHintStyle}>Inga växter matchar sökningen.</div>
      ) : (
        <div style={rowsStyle}>
          {filtered.map((p) => (
            <PlantRow
              key={p.id}
              plant={p}
              active={p.id === selectedPlantId}
              onClick={() => onSelectPlant(p.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

