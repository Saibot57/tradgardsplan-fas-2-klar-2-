/**
 * Top-level for the Växter tab — flex row split into a fixed-width left
 * list and a scrollable right detail pane.
 */

import type { Rect } from "@kolonitradgard/spatial-core";
import type { PlantCareProfile } from "../plants/types.js";
import { PlantList } from "./PlantList.js";
import { PlantDetailCard } from "./PlantDetailCard.js";
import { PlantDetailEmpty } from "./PlantDetailEmpty.js";

interface PlantCatalogProps {
  plants: readonly PlantCareProfile[];
  beds: readonly Rect[];
  selectedPlantId: string | null;
  plannedPlantIds: readonly string[];
  onSelectPlant: (id: string | null) => void;
  onShowOnCanvas: (plantId: string) => void;
}

export function PlantCatalog({
  plants,
  beds,
  selectedPlantId,
  plannedPlantIds,
  onSelectPlant,
  onShowOnCanvas,
}: PlantCatalogProps) {
  const selected = selectedPlantId
    ? plants.find((p) => p.id === selectedPlantId) ?? null
    : null;

  return (
    <div
      role="tabpanel"
      id="tabpanel-vaxter"
      aria-labelledby="tab-vaxter"
      style={{
        display: "flex",
        flex: 1,
        minHeight: 0,
        background: "var(--bg-paper)",
      }}
    >
      <aside
        style={{
          width: "var(--layout-sidepanel-w)",
          flexShrink: 0,
          borderRight: "1px solid var(--line-1)",
          background: "var(--bg-surface)",
          overflowY: "auto",
        }}
      >
        <PlantList
          plants={plants}
          beds={beds}
          selectedPlantId={selectedPlantId}
          plannedPlantIds={plannedPlantIds}
          onSelectPlant={onSelectPlant}
        />
      </aside>
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          background: "var(--bg-paper)",
        }}
      >
        {selected ? (
          <PlantDetailCard
            plant={selected}
            beds={beds}
            plannedPlantIds={plannedPlantIds}
            onShowOnCanvas={onShowOnCanvas}
          />
        ) : (
          <PlantDetailEmpty />
        )}
      </main>
    </div>
  );
}
