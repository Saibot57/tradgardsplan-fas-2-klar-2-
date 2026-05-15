# PlantCatalog — Implementation Handoff

> **Audience:** Claude Code (or human developer) implementing this UI in the
> existing `Saibot57/tradgardsplan-fas-2-klar-2-` monorepo.
> **Source of truth for visuals:** `PlantCatalog.html` in this package (open
> in any browser — no build required). It is a fully wired React+JSX
> prototype using the same tokens, type, and inline-style conventions as the
> live geometry-sandbox.

---

## 0. TL;DR

You are adding a second top-level tab to the existing planner app — **Växter**
(PlantCatalog) — sitting next to the existing **Planera** (canvas) view.

It is a master-detail browser of `crops.json`:

- Left: a 320 px list with three sections (Mina växter / Planerade / Alla
  växter), plus search + filter chips.
- Right: a scrollable plant detail card with range-bar visualisations for
  light, temperature, soil moisture, humidity; plain-text labels for everything
  else; and an "I min trädgård" action that round-trips back to the canvas
  and selects the bed.

Selection state, planned-state, and bed-membership are kept in the same
`useReducer` store that already powers Planera. Plants placed in beds appear
in `Rect.plants[]` on the existing rectangle shape.

---

## 1. Inputs in this package

```
plant-catalog-handoff/
├── plant_catalog_ui_implementation.md   ← this file
├── PROMPT_PLANT_CATALOG_UI.md           ← original product brief from the team
├── PlantCatalog.html                    ← working prototype, open in a browser
├── reference-source/                    ← un-inlined source of the prototype
│   ├── data.jsx                         ← seed plants + bed scene
│   ├── icons.jsx                        ← Lucide-style stroke icons
│   ├── ui.jsx                           ← Button, Row, SectionTitle, Chip,
│   │                                       CategoryBadge, RangeBar, PlantThumb,
│   │                                       TabBar, SunCategoryGlyph
│   ├── planera-tab.jsx                  ← stand-in for the existing Canvas+SidePanel
│   ├── catalog.jsx                      ← the main work (list + card)
│   ├── app.jsx                          ← shell with tab routing + reducer
│   └── tweaks-panel.jsx                 ← (prototype-only, do not port)
├── tokens/
│   └── colors_and_type.css              ← canonical design tokens — should
│                                          already exist in your repo; diff if
│                                          you've added vars locally
└── assets/
    └── logo-mark.svg                    ← header brand mark
```

> **The `.jsx` files are loaded as plain JS by Babel-standalone in the
> prototype.** They use inline styles and `var(--token)` references — same as
> `SidePanel.tsx` and `Toolbar.tsx` in your repo. Port them to `.tsx` with
> explicit types; the runtime shape doesn't change.

---

## 2. Target file tree (in your repo)

All paths are relative to `apps/geometry-sandbox/src/`.

```
src/
├── plant-catalog/                       ← NEW
│   ├── PlantCatalog.tsx                 ← top-level for the Växter tab
│   ├── PlantList.tsx                    ← left panel (Mina / Planerade / Alla)
│   ├── PlantRow.tsx                     ← list row, dense-prop, dim variant
│   ├── PlantDetailCard.tsx              ← right detail (scrollable)
│   ├── PlantDetailEmpty.tsx             ← empty state
│   ├── sections/
│   │   ├── SunLightSection.tsx
│   │   ├── TemperatureSection.tsx
│   │   ├── WaterSoilSection.tsx
│   │   ├── NutrientsSection.tsx
│   │   ├── HumiditySection.tsx
│   │   ├── GrowingTipsSection.tsx
│   │   └── InMyGardenSection.tsx
│   ├── controls/
│   │   ├── SearchInput.tsx
│   │   ├── FilterChipGroup.tsx
│   │   └── AddToBedDropdown.tsx
│   └── primitives/
│       ├── RangeBar.tsx                 ← segmented track + min/max ticks
│       ├── CategoryBadge.tsx
│       ├── PlantThumbnail.tsx
│       └── SunCategoryGlyph.tsx
│
├── shared/                              ← NEW (or extend existing)
│   ├── Tabs.tsx                         ← <TabBar>, <Tab>
│   ├── Row.tsx                          ← lifted from SidePanel.tsx
│   ├── SectionTitle.tsx                 ← lifted from SidePanel.tsx
│   ├── Button.tsx                       ← lifted from Toolbar.tsx (variant=…)
│   ├── Chip.tsx
│   └── icons/
│       ├── index.ts                     ← re-exports from lucide-react
│       └── CategoryIcon.tsx             ← category → icon
│
├── plants/                              ← NEW (data layer)
│   ├── types.ts                         ← PlantCareProfile, PlantPlacement, PlantCategory
│   ├── crops.json                       ← your full ~60–200 plants (see §6)
│   ├── PlantRepository.ts               ← adapter, mirror existing persistence pattern
│   ├── plantQueries.ts                  ← search, filter, summary — pure fns
│   └── format.ts                        ← fmtLux, ecLabel, sunCategoryLabel, etc.
│
├── selectors/
│   └── plantSelectors.ts                ← inGardenIds, plantedSummary, firstBedFor
│
└── App.tsx                              ← MODIFIED: tab routing
└── state.ts                             ← MODIFIED: plant-related actions
└── Canvas.tsx                           ← MODIFIED: pause rAF when not active
└── SidePanel.tsx                        ← MODIFIED: "Växter i bädden" section
└── Toolbar.tsx                          ← MODIFIED: tabs above existing toolbar
                                            (or split into AppHeader.tsx + Toolbar.tsx)
```

---

## 3. Types

Drop into `plants/types.ts`:

```ts
export type PlantCategory = "vegetable" | "herb" | "berry" | "flower";

export interface PlantCareProfile {
  id: string;                              // kebab-case scientific, e.g. "solanum-lycopersicum"
  commonName: string;                      // Swedish, e.g. "Tomat"
  commonNameEn?: string;                   // "Tomato"
  scientificName: string;                  // "Solanum lycopersicum"
  category: PlantCategory;

  temperature: { minC: number; maxC: number };
  light: { minLux: number; maxLux: number };
  soilMoisture: { minPct: number; maxPct: number };
  nutrientEC: { minMicroS: number; maxMicroS: number };
  humidity: { minPct: number; maxPct: number };

  soilTypes?: string[];
  sowingMethod?: string;
  spreadMm?: number;
  rowSpacingMm?: number;
  daysToMaturity?: number;
  sunCategory?: string;                    // "Full sol" | "Halvskugga" | "Skugga" | combos
  waterFrequency?: string;
  imageUrl?: string;
}

export interface PlantPlacement {
  placementId: string;
  plantId: string;                         // → PlantCareProfile.id
  displayName: string;
  offsetX: number;                         // mm, bed-local
  offsetY: number;
  count: number;
}

// Extend existing Rect:
//   interface Rect { …; plants?: PlantPlacement[]; }
```

---

## 4. State changes (`state.ts`)

Add to your existing reducer:

```ts
interface AppState {
  // …existing fields…
  activeTab: "planera" | "vaxter";
  selectedPlantId: string | null;
  plannedPlantIds: string[];               // plant ids the user has "planned"
                                           // but not placed in a bed yet
}

type Action =
  // …existing…
  | { type: "switchTab"; tab: AppState["activeTab"] }
  | { type: "selectPlant"; plantId: string | null }
  | { type: "togglePlannedPlant"; plantId: string }
  | { type: "addPlantToBed"; plantId: string; bedId: string; offsetX?: number; offsetY?: number }
  | { type: "removePlantFromBed"; bedId: string; placementId: string }
  | { type: "showPlantOnCanvas"; plantId: string };
```

### Reducer semantics

| Action | Behaviour |
|---|---|
| `switchTab` | Just swaps `activeTab`. Not in undo stack. |
| `selectPlant` | Highlights the row + opens detail card. Not in undo stack. |
| `togglePlannedPlant` | Adds/removes from `plannedPlantIds`. **Is** in undo stack. |
| `addPlantToBed` | If a `PlantPlacement` with same `plantId` already exists in that bed, increment `count`. Otherwise append a new placement, centered in the bed (or at `offsetX/Y` if provided). Removes `plantId` from `plannedPlantIds` since it's now planted. **Is** in undo stack. |
| `removePlantFromBed` | Decrements count; deletes placement when count hits 0. **Is** in undo stack. |
| `showPlantOnCanvas` | Sets `activeTab = "planera"` + sets `selectedId` (your existing bed selection) to the first bed that contains this plant. Not in undo stack — pure navigation. |

### Persistence

`scene.json` schema bumps to v2:

```jsonc
{
  "version": 2,
  "plot": { … },
  "rectangles": [
    { "id": "rect-1", …, "plants": [ { "placementId": …, "plantId": …, … } ] }
  ],
  "plannedPlantIds": ["capsicum-frutescens"]
}
```

Provide a v1→v2 migrator that adds `plants: []` to every Rect and an empty
`plannedPlantIds: []`. Reject saves without `version`.

---

## 5. Components — API contracts

The reference source uses inline styles + `window.X` exports because it's a
single-file demo. Port to real ES module exports with typed props.

### `<PlantCatalog>` — `PlantCatalog.tsx`

```ts
interface PlantCatalogProps {
  plants: PlantCareProfile[];
  beds: Rect[];                            // your existing Rect type w/ plants?: PlantPlacement[]
  selectedPlantId: string | null;
  plannedPlantIds: string[];
  onSelectPlant: (id: string | null) => void;
  onTogglePlan: (id: string) => void;
  onAddToBed: (plantId: string, bedId: string) => void;
  onShowOnCanvas: (plantId: string) => void;
  dense?: boolean;                         // from user preferences
}
```

Layout: flex row, `flex: 1`, `minHeight: 0`. Left = 320 px fixed, right =
`flex: 1` with `overflowY: auto`.

### `<PlantList>` — `PlantList.tsx`

Internal state: `query`, `categoryFilter`, `sunFilter`. Three blocks:

1. **Mina växter** — derived from `inGardenIds = unique(plantId for bed.plants[])`. Each row gets `badge={`×${total}`}`.
2. **Planerade** — `plannedPlantIds` minus `inGardenIds`. Rows are `dim` + italic.
3. **Alla växter** — `plants` filtered by `query` (substring on `commonName | commonNameEn | scientificName`, only when `query.length >= 2`) + `categoryFilter` + `sunFilter`. Sort by `commonName.localeCompare(_, "sv")`.

Empty states (exact copy):

- No `inGardenIds`: *"Inga växter i bäddar ännu."* (small italic, under Mina växter heading)
- Search has 0 hits: *"Inga växter matchar sökningen."*

### `<PlantDetailCard>` — `PlantDetailCard.tsx`

Sections, top → bottom (each a `<Section icon title>` from `shared/`):

1. **Sol & ljus** (`<Sun>`) — Solbehov row, ljusintervall + RangeBar (scale 0–60 000 lux, accent `--accent-sun`)
2. **Temperatur** (`<Thermometer>`) — range row + RangeBar (scale -10 to 45, accent `--accent-soil`)
3. **Vatten & jord** (`<Droplet>`) — Vattning, Jordtyp, Jordfukt + RangeBar (0–100 %, accent `--accent-sky`)
4. **Näring** (`<FlaskConical>`) — EC range + plain-language label (`ecLabel(maxEC)` — see `format.ts`)
5. **Luftfuktighet** (`<Wind>`) — range + RangeBar (0–100 %, accent `--accent-sky`)
6. **Odlingstips** (`<Sprout>`) — Sådd, Plantavstånd (mm), Radavstånd (mm), Dagar till skörd
7. **I min trädgård** (`<MapPin>`) — **only if planted-in-bed or planned**. If planted: *"Planterad i N bäddar, totalt M st."* + primary button "Visa på canvas →". If only planned: *"Planerad — inte placerad i någon bädd ännu."* No button.

Header above sections:

- `<PlantThumbnail size={120}>` left
- Category badge → display name (`var(--font-display)`, 36 px) → scientific name (`var(--font-display-editorial)` italic) → action buttons row: `[Planera | ✓ Planerad]` toggle + `[+ Lägg till i bädd ▾]`

### `<RangeBar>` — `primitives/RangeBar.tsx`

```ts
interface RangeBarProps {
  min: number;
  max: number;
  scaleMin: number;                        // viewport floor
  scaleMax: number;                        // viewport ceiling
  unit: string;                            // " °C", " %", " lux"
  format?: (n: number) => string;          // defaults to fmtInt
  accent?: string;                         // CSS var fallback to --accent-bed
}
```

Render order top → bottom:
1. Scale anchors (mono, `--ink-3`) `scaleMin` left / `scaleMax` right
2. Muted track (`--line-1`, 4 px tall) full width
3. In-range fill (accent, 6 px tall, slightly taller)
4. Tick marks at `min` and `max` (1 px ink, 12 px tall)
5. Tick value labels (mono, `--ink-1`) under each tick, centered

See `ui.jsx` `PCRangeBar` for the exact pixel layout.

### `<Section>` — shared primitive

Layout:
```
icon + uppercase title (11.5px, --ink-2, tracking-caps)    [optional action right]
─── (1 px --line-1) ───
children
```

Variant `accent`: renders inside a sage-tinted box (`--bed-100` bg, `--line-1` border, 8 px radius, 16/18 px padding) — used by `<InMyGardenSection>` only.

---

## 6. Data: `crops.json`

The prototype ships 23 plants in `data.jsx`. For the real app, populate
`plants/crops.json` with your full Swedish dataset. Schema must match
`PlantCareProfile`. **All numeric ranges required**; categorical fields
optional. Validate on load.

If you don't have a `crops.json` yet, lift the 23 entries from
`reference-source/data.jsx` (in `window.PC_PLANTS`) as a starting set —
they're realistic Swedish growing data.

---

## 7. Tokens, fonts, icons

### Tokens

`tokens/colors_and_type.css` in this package is the canonical token sheet.
Diff against your repo's copy. Specifically:

- `--accent-bed: #6E8C5A` (sage) — **use this** for the catalog's primary
  accent (active tab underline, "Planerade" outline, active row pill, list
  badge dots for `vegetable`). The brief mentions `--accent-plant: #4CAF50`;
  in the prototype I mapped that to `--accent-bed` because the brand palette
  is intentionally warm-muted and `#4CAF50` reads as harsh next to it. If
  product still wants a distinct token, add `--accent-plant: var(--bed-500)`
  as an alias in `tokens.css` rather than introducing a new hex.
- Category tints (used in `<PlantThumbnail>`, `<CategoryBadge>`, list-row dots):
  - `vegetable` → `--bed-{100,500,700}`
  - `herb` → `--success-{100,500,700}`
  - `berry` → `--soil-{100,500,700}`
  - `flower` → `--sun-{100,500,700}`

### Fonts

Already declared in `colors_and_type.css`. No changes.

### Icons

Replace the hand-rolled SVG icons in `reference-source/icons.jsx` with
`lucide-react` imports:

| Prototype | lucide-react |
|---|---|
| `IconLeaf` | `Leaf` |
| `IconSprout` | `Sprout` |
| `IconFlower` | `Flower2` |
| `IconCarrot` | `Carrot` |
| `IconCherry` | `Cherry` |
| `IconSun` | `Sun` |
| `IconThermometer` | `Thermometer` |
| `IconDroplet` | `Droplet` |
| `IconFlask` | `FlaskConical` |
| `IconWind` | `Wind` |
| `IconMapPin` | `MapPin` |
| `IconRuler` | `Ruler` |
| `IconSearch` | `Search` |
| `IconX` | `X` |
| `IconChevronDown` | `ChevronDown` |
| `IconArrowRight` | `ArrowRight` |
| `IconPlus` | `Plus` |
| `IconCheck` | `Check` |
| `IconBookmark` | `Bookmark` |
| `IconCompass` | `Compass` |
| `IconGrid` | `Grid3x3` |
| `IconMoon` | `Moon` |
| `IconTrash` | `Trash2` |

Stroke 1.5, size 16 (toolbar) / 20 (side panel) / 24 (marketing). Same
convention as the design system spec.

---

## 8. Integration with the existing app (`App.tsx`)

```tsx
const [state, dispatch] = useReducer(reducer, initialState);

return (
  <div className="pp" style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
    <AppHeader
      activeTab={state.activeTab}
      onTabChange={(t) => dispatch({ type: "switchTab", tab: t })}
      // …pass theme toggle etc.
    />

    {state.activeTab === "planera" ? (
      <PlaneraView state={state} dispatch={dispatch} />        // your existing Canvas + SidePanel
    ) : (
      <PlantCatalog
        plants={crops}
        beds={state.rectangles}
        selectedPlantId={state.selectedPlantId}
        plannedPlantIds={state.plannedPlantIds}
        onSelectPlant={(id) => dispatch({ type: "selectPlant", plantId: id })}
        onTogglePlan={(id) => dispatch({ type: "togglePlannedPlant", plantId: id })}
        onAddToBed={(plantId, bedId) => dispatch({ type: "addPlantToBed", plantId, bedId })}
        onShowOnCanvas={(plantId) => dispatch({ type: "showPlantOnCanvas", plantId })}
        dense={prefs.dense}
      />
    )}

    <StatusBar state={state} />
  </div>
);
```

### `Canvas.tsx` pause

When `state.activeTab !== "planera"`, return `null` (or a stable cached node)
and cancel any running `requestAnimationFrame`. Selection state is
preserved through the swap because it lives in the reducer.

### `SidePanel.tsx` extension

Add a new section *Växter i bädden (N)* listing `selected.plants[]`:

```
PlantThumb 28×28 | Common name + scientific (italic)  | ×count
```

Each row clickable → `dispatch({ type: "selectPlant", plantId })` +
`dispatch({ type: "switchTab", tab: "vaxter" })`. Provides the inverse
hop of "Visa på canvas →".

---

## 9. Adjustments to make from the prototype

Things I cut corners on for prototype speed — please correct in prod:

1. **Lift `Row` / `SectionTitle` out of `SidePanel.tsx`** into `shared/` and
   have both the Bädd-inspektor and the PlantDetailCard import from there.
   I duplicated the styles in the prototype.
2. **Move `fmtNum` / `fmtInt` into a shared `format.ts`** (or
   `packages/spatial-core/src/format.ts` if you want it shared across apps).
3. **Undo/redo:** wire the three plant-mutating actions
   (`togglePlannedPlant`, `addPlantToBed`, `removePlantFromBed`) into your
   snapshot stack. Tab-switch and selection do **not** push snapshots.
4. **Virtualise the All-list** with `react-window` if your real `crops.json`
   pushes past ~80 entries — search-filter + scroll starts to chug.
5. **A11y:**
   - `role="tablist"` on `<TabBar>`, `role="tab"` + `aria-selected` on each tab
   - `role="listbox"` on the plant list, `role="option"` on each row,
     `aria-selected` mirroring `active`
   - `⌘F` / `Ctrl+F` (or `/`) focuses the search input when Växter is active
   - Empty state is focusable; tab key cycles into the list
6. **i18n-prep:** wrap all strings in `t("key")` (even if `t()` is a
   trivial passthrough today). Keys: `catalog.empty.detail.title`,
   `catalog.empty.detail.body`, `catalog.section.sunLight`, etc.
7. **Lucide-react** instead of hand-rolled SVGs (see §7).
8. **Mobile (<768 px):** the prototype skips this. Use a `useMediaQuery`
   hook. Below the breakpoint, route between list and detail with a
   back-pill in the header.
9. **Real images:** when product gives you photos, host them under
   `public/plants/{id}.webp` and fill `imageUrl` per plant. Keep the
   tinted `<PlantThumbnail>` as fallback when `!imageUrl`.
10. **Click-outside hook** for `<AddToBedDropdown>` should be a reusable
    `useClickOutside(ref, onClose)` in `shared/`.
11. **The `<TweaksPanel>`** in `reference-source/tweaks-panel.jsx` is a
    prototype-only host integration — **do not port**. Wire `dense` and
    `theme` through your real preferences/settings flow.

---

## 10. Test plan

`vitest` files I'd add under `__tests__/`:

```
plants/__tests__/
├── plantQueries.test.ts        ← search (substring sv/en/sci), filter combos,
│                                  summary (bedCount + total)
└── format.test.ts              ← fmtNum decimal-comma, fmtInt thin space,
                                   ecLabel boundary cases, sunCategory parsing

plant-catalog/__tests__/
├── PlantCatalog.test.tsx       ← user flow: search "tom" → row appears →
│                                  click → detail opens → "Planera" toggles
├── PlantDetailCard.test.tsx    ← RangeBar tick positions match min/max within
│                                  the scale window; "I min trädgård" only when
│                                  planted or planned
├── AddToBedDropdown.test.tsx   ← opens, lists beds with dims, click closes +
│                                  emits onSelect, disabled when no beds
└── PlantList.test.tsx          ← my-plants section reflects bed.plants[];
                                   planned section excludes plants in beds

state.test.ts                    ← addPlantToBed increments count on duplicate
                                   plantId; removes from plannedPlantIds
                                   showPlantOnCanvas selects first matching bed
                                   undo/redo round-trip
```

---

## 11. Done criteria

- [ ] Two tabs in the header; tab swap is instant; Canvas pauses when inactive
- [ ] `crops.json` validates on load (zod or runtime check)
- [ ] Search + 2 filter strips work in real time
- [ ] List rows hover/active styles match prototype
- [ ] All 7 detail sections render with correct icons + tokens
- [ ] RangeBar accents per metric (sun/soil/sky)
- [ ] "+ Planera" toggles `plannedPlantIds`
- [ ] "+ Lägg till i bädd" dropdown places a plant + removes from planned
- [ ] "Visa på canvas →" switches tab AND selects bed
- [ ] Both themes render correctly (Paper + Evening)
- [ ] Scene save/load round-trips plants + planned IDs (schema v2)
- [ ] Undo/redo works for plant mutations
- [ ] Keyboard navigation: Tab cycles into list, arrows nav rows, Enter opens
- [ ] `prefers-reduced-motion: reduce` kills all transitions
- [ ] Unit tests in §10 pass
- [ ] No `console.error`/`warn` in browser dev tools on initial load

---

## 12. Where to start

1. Drop `plant_catalog_ui_implementation.md` + `PlantCatalog.html` somewhere
   the team can reach (`docs/handoffs/2026-05-plant-catalog/`).
2. Open `PlantCatalog.html` in a browser to play with the prototype. Click
   around, try search, try Tweaks (toggle in the toolbar).
3. Read `reference-source/catalog.jsx` and `reference-source/app.jsx` —
   that's where 80 % of the logic lives.
4. Start by extending `state.ts` (§4) and adding `plants/types.ts` (§3).
5. Then scaffold `plant-catalog/PlantCatalog.tsx` + `PlantList.tsx` +
   `PlantDetailCard.tsx` skeletons, wire to the reducer, and fill in
   sections incrementally.
6. Lift `Row` / `SectionTitle` out of `SidePanel.tsx` last — once both
   sides need them, you'll know the right shape.

Good luck.
