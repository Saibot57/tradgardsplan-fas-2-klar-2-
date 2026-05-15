# 🌱 Växtdata-integration — Fullständig specifikation

## Översikt

Det här dokumentet specificerar exakt hur växtdata (från Open Plantbook + Perenual) 
integreras i Koloniträdgårdsplaneraren. Det täcker:

1. **Typändringar** i `spatial-core` och `state.ts`
2. **Nytt package** `packages/plant-data/`
3. **Nya reducer-actions** för grödor
4. **Canvas-rendering** av grödor i bäddar
5. **Ny UI-komponent** `PlantSearchPanel` (söka + lägga till)
6. **Utökat `SidePanel`** (klicka gröda → detaljinfo + solmatchning)
7. **Scene-migrering** (v3 → v4)
8. **Cachning** i localStorage

---

## 1. Typer — `packages/spatial-core/src/types.ts`

### 1.1 Ny: `PlantPlacement` (gröda placerad i en bädd)

```typescript
/**
 * En växt placerad i en bädd. Refererar till sin växtprofil via plantId.
 * Positionen (offsetX/offsetY) är relativ till bäddens lokala centrum (0,0),
 * i mm, precis som all annan geometri i spatial-core.
 *
 * count tillåter "3 st tomatplantor" utan att skapa separata objekt.
 */
export interface PlantPlacement {
  /** Unikt ID för just denna placering. */
  placementId: string;
  /** Referens till PlantCareProfile.id (ex: "solanum-lycopersicum"). */
  plantId: string;
  /** Visat namn — cachat från API-svaret så att det fungerar offline. */
  displayName: string;
  /** Position i bäddens lokala koordinatsystem (mm från bäddens centrum). */
  offsetX: number;
  offsetY: number;
  /** Antal individer på denna plats. Default 1. */
  count: number;
}
```

### 1.2 Utökat: `Rect` — ny optional-array `plants`

```typescript
export interface Rect {
  id: string;
  cx: number;
  cy: number;
  width: number;
  height: number;
  rotationDeg: number;
  wallHeight: number;
  label?: string;
  notes?: string;
  kind?: ObjectKind;
  /** Placerade grödor i denna bädd (scene v4). Bara meningsfullt för kind="bed". */
  plants?: PlantPlacement[];
}
```

> **Varför på Rect?** Allt bädd-state lever redan på `Rect`. Att lägga `plants[]` 
> där följer mönstret med `label`, `notes`, `kind` — optionella fält som utelämnas 
> i JSON om tomma. Det gör att scene-serialisering, undo/redo (snapshot-baserad) 
> och `loadScene` fungerar utan extra hantering.

---

## 2. Nytt package: `packages/plant-data/`

Ren TypeScript — noll React-beroenden (precis som `spatial-core`).

### Filstruktur:

```
packages/plant-data/
  package.json
  tsconfig.json
  src/
    types.ts              ← PlantCareProfile (normaliserad datamodell)
    plantbook-adapter.ts  ← Open Plantbook REST-klient
    perenual-adapter.ts   ← Perenual REST-klient (komplement)
    merged-lookup.ts      ← Slår ihop data från båda API:erna
    cache.ts              ← localStorage-cache med TTL
    sunlight-match.ts     ← Matchar lux-data mot bedSunHours
    index.ts
  __tests__/
    cache.test.ts
    sunlight-match.test.ts
```

### 2.1 `types.ts` — normaliserad växtprofil

```typescript
/**
 * Normaliserad växtprofil — sammanslagen från Open Plantbook + Perenual.
 * Alla numeriska fält i SI-enheter. Textuella fält normaliserade till engelska
 * kategorier (kan översättas i UI-lagret).
 */
export interface PlantCareProfile {
  /** Unikt ID — baserat på vetenskapligt namn, slug-format. */
  id: string;
  commonName: string;
  scientificName: string;

  // ── Numeriska ranges (Open Plantbook primärkälla) ──
  /** Tolererad temperatur i °C. */
  temperature: { minC: number; maxC: number };
  /** Ljusbehov i lux. */
  light: { minLux: number; maxLux: number };
  /** Jordfuktighet i %. */
  soilMoisture: { minPct: number; maxPct: number };
  /** Näringsbehov — electrical conductivity, µS/cm. */
  nutrientEC: { minMicroS: number; maxMicroS: number };
  /** Luftfuktighet i %. */
  humidity: { minPct: number; maxPct: number };

  // ── Kategorisk data (Perenual-källa, valfria) ──
  /** Jordtyper: ["Well-drained", "Sandy", "Loamy"] */
  soilTypes?: string[];
  /** Vattningsfrekvens textuellt: "Every 5-7 days" */
  wateringFrequency?: string;
  /** Solkategori: ["Full sun", "Part shade"] */
  sunCategory?: string[];
  /** Tillväxthastighet: "High" | "Medium" | "Low" */
  growthRate?: string;
  /** Skötselgrad: "Low" | "Medium" | "High" */
  maintenance?: string;
  /** Skadedjur: ["Aphids", "Spider mites"] */
  pests?: string[];
  /** Beskärningsmånader: ["March", "April"] */
  pruningMonths?: string[];
  /** Blomningssäsong */
  floweringSeason?: string;
  /** Skördesäsong */
  harvestSeason?: string;
  /** Giftig för husdjur */
  poisonousForPets?: boolean;
  /** Klarar torka */
  droughtTolerant?: boolean;

  /** Bild-URL (från Perenual). */
  imageUrl?: string;

  /** Timestamp då profilen hämtades/cachades. */
  fetchedAt: number;
}
```

### 2.2 `plantbook-adapter.ts`

```typescript
import type { PlantCareProfile } from "./types.js";

const BASE = "https://open.plantbook.io/api/v1";

interface PlantBookSearchResult {
  display_pid: string;  // ex: "solanum lycopersicum"
  alias: string;        // ex: "Tomato"
}

interface PlantBookDetail {
  display_pid: string;
  alias: string;
  min_temp: number;
  max_temp: number;
  min_light_lux: number;
  max_light_lux: number;
  min_light_mmol: number;
  max_light_mmol: number;
  min_soil_moist: number;
  max_soil_moist: number;
  min_soil_ec: number;
  max_soil_ec: number;
  min_env_humid: number;
  max_env_humid: number;
}

/** Slug-ifierar display_pid till ett stabilt ID. */
function toId(displayPid: string): string {
  return displayPid.toLowerCase().replace(/\s+/g, "-");
}

/**
 * Auth: Open Plantbook använder OAuth2 client_credentials-flöde.
 * 1. POST /api/v1/token/ med client_id + secret → access_token (30 min TTL)
 * 2. Skicka Bearer-token i alla requests.
 *
 * Tokenen cachas i minnet och förnyss vid 401.
 */
export class PlantBookClient {
  private token: string | null = null;
  private tokenExpiresAt = 0;

  constructor(
    private clientId: string,
    private clientSecret: string,
  ) {}

  private async authenticate(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiresAt) return this.token;

    const res = await fetch(`${BASE}/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });
    if (!res.ok) throw new Error(`PlantBook auth failed: ${res.status}`);
    const data = await res.json();
    this.token = data.access_token;
    // Default: 30 min. Subtrahera 60s marginal.
    this.tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
    return this.token!;
  }

  async search(query: string): Promise<PlantBookSearchResult[]> {
    const token = await this.authenticate();
    const res = await fetch(
      `${BASE}/plant/search?alias=${encodeURIComponent(query)}&limit=20`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) throw new Error(`PlantBook search failed: ${res.status}`);
    const data = await res.json();
    return data.results ?? [];
  }

  async getDetail(displayPid: string): Promise<PlantCareProfile> {
    const token = await this.authenticate();
    const res = await fetch(
      `${BASE}/plant/detail/${encodeURIComponent(displayPid)}/`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) throw new Error(`PlantBook detail failed: ${res.status}`);
    const d: PlantBookDetail = await res.json();
    return {
      id: toId(d.display_pid),
      commonName: d.alias,
      scientificName: d.display_pid,
      temperature: { minC: d.min_temp, maxC: d.max_temp },
      light: { minLux: d.min_light_lux, maxLux: d.max_light_lux },
      soilMoisture: { minPct: d.min_soil_moist, maxPct: d.max_soil_moist },
      nutrientEC: { minMicroS: d.min_soil_ec, maxMicroS: d.max_soil_ec },
      humidity: { minPct: d.min_env_humid, maxPct: d.max_env_humid },
      fetchedAt: Date.now(),
    };
  }
}
```

### 2.3 `cache.ts` — localStorage med TTL

```typescript
import type { PlantCareProfile } from "./types.js";

const CACHE_KEY = "pp-plant-cache";
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dagar

interface CacheStore {
  [plantId: string]: PlantCareProfile;
}

export function getCached(plantId: string): PlantCareProfile | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const store: CacheStore = JSON.parse(raw);
    const entry = store[plantId];
    if (!entry) return null;
    if (Date.now() - entry.fetchedAt > DEFAULT_TTL_MS) return null;
    return entry;
  } catch {
    return null;
  }
}

export function setCache(profile: PlantCareProfile): void {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const store: CacheStore = raw ? JSON.parse(raw) : {};
    store[profile.id] = profile;
    localStorage.setItem(CACHE_KEY, JSON.stringify(store));
  } catch { /* quota */ }
}

export function getAllCached(): PlantCareProfile[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    return Object.values(JSON.parse(raw) as CacheStore);
  } catch {
    return [];
  }
}
```

### 2.4 `sunlight-match.ts` — koppling till din sol-motor

```typescript
import type { PlantCareProfile } from "./types.js";

/**
 * Konverterar soltimmar (bedSunHours, 0–15 h vid midsommar i Landskrona)
 * till en uppskattad lux-kategori.
 *
 * Förenklad modell:
 *   - Full sol = 6+ h direkt sol ≈ 25 000–50 000 lux
 *   - Partiell sol = 3–6 h ≈ 10 000–25 000 lux
 *   - Skugga = <3 h ≈ 2 500–10 000 lux
 *
 * Returnerar en { estimatedLux, status } för UI-rendering.
 */
export interface SunlightMatch {
  /** Uppskattat lux-intervall för bäddens sol-situation. */
  estimatedLux: { min: number; max: number };
  /** Status relativt växtens behov. */
  status: "optimal" | "acceptable" | "too-little" | "too-much";
  /** Mänskligt läsbar sammanfattning. */
  summary: string;
}

export function matchSunlight(
  sunHours: number,
  plant: PlantCareProfile,
): SunlightMatch {
  // Enkel lux-uppskattning baserad på soltimmar
  let estMin: number, estMax: number;
  if (sunHours >= 8) {
    estMin = 35_000; estMax = 55_000;
  } else if (sunHours >= 6) {
    estMin = 25_000; estMax = 40_000;
  } else if (sunHours >= 4) {
    estMin = 15_000; estMax = 25_000;
  } else if (sunHours >= 2) {
    estMin = 5_000; estMax = 15_000;
  } else {
    estMin = 1_000; estMax = 5_000;
  }

  const pMin = plant.light.minLux;
  const pMax = plant.light.maxLux;

  let status: SunlightMatch["status"];
  let summary: string;

  if (estMax < pMin) {
    status = "too-little";
    summary = `Bädden får ~${sunHours}h sol (≈${estMin.toLocaleString()}–${estMax.toLocaleString()} lux). ${plant.commonName} behöver ${pMin.toLocaleString()}–${pMax.toLocaleString()} lux. ⚠️ För lite ljus.`;
  } else if (estMin > pMax) {
    status = "too-much";
    summary = `Bädden får ~${sunHours}h sol (≈${estMin.toLocaleString()}–${estMax.toLocaleString()} lux). ${plant.commonName} behöver max ${pMax.toLocaleString()} lux. ⚠️ Kan vara för starkt.`;
  } else if (estMin >= pMin && estMax <= pMax) {
    status = "optimal";
    summary = `Bädden får ~${sunHours}h sol. ✅ Perfekt för ${plant.commonName}.`;
  } else {
    status = "acceptable";
    summary = `Bädden får ~${sunHours}h sol. 🟡 Kan fungera för ${plant.commonName}, men inte optimalt.`;
  }

  return { estimatedLux: { min: estMin, max: estMax }, status, summary };
}
```

---

## 3. Nya reducer-actions i `state.ts`

```typescript
// Lägg till i Action-unionen:

| { type: "addPlant"; bedId: string; plant: PlantPlacement }
| { type: "removePlant"; bedId: string; placementId: string }
| { type: "movePlant"; bedId: string; placementId: string; offsetX: number; offsetY: number }
| { type: "updatePlantCount"; bedId: string; placementId: string; count: number }
| { type: "selectPlant"; bedId: string; placementId: string | null }
```

### Reducer-cases:

```typescript
case "addPlant": {
  return {
    ...state,
    rectangles: state.rectangles.map((r) => {
      if (r.id !== action.bedId) return r;
      const existing = r.plants ?? [];
      return { ...r, plants: [...existing, action.plant] };
    }),
  };
}

case "removePlant": {
  return {
    ...state,
    rectangles: state.rectangles.map((r) => {
      if (r.id !== action.bedId) return r;
      const filtered = (r.plants ?? []).filter(
        (p) => p.placementId !== action.placementId,
      );
      return { ...r, plants: filtered.length > 0 ? filtered : undefined };
    }),
  };
}

case "movePlant": {
  return {
    ...state,
    rectangles: state.rectangles.map((r) => {
      if (r.id !== action.bedId) return r;
      return {
        ...r,
        plants: (r.plants ?? []).map((p) =>
          p.placementId === action.placementId
            ? { ...p, offsetX: Math.round(action.offsetX), offsetY: Math.round(action.offsetY) }
            : p,
        ),
      };
    }),
  };
}

case "updatePlantCount": {
  return {
    ...state,
    rectangles: state.rectangles.map((r) => {
      if (r.id !== action.bedId) return r;
      return {
        ...r,
        plants: (r.plants ?? []).map((p) =>
          p.placementId === action.placementId
            ? { ...p, count: Math.max(1, action.count) }
            : p,
        ),
      };
    }),
  };
}
```

### Lägg till i `AUTO_COMMIT_ACTIONS` (App.tsx):

```typescript
const AUTO_COMMIT_ACTIONS: ReadonlySet<string> = new Set([
  // ... existerande ...
  "addPlant",
  "removePlant",
  "movePlant",
  "updatePlantCount",
]);
```

---

## 4. Scene-format v4

### `scene.ts` — ny version

```typescript
export interface SceneV4 {
  version: 4;
  plot: PlotConfig;
  boundary?: Rect | null;
  rectangles: Rect[];  // Rect kan nu ha plants?: PlantPlacement[]
}

// Migrering:
export function migrateScene(scene: Scene): SceneV4 {
  if (scene.version === 4) return scene;
  // v1/v2/v3 → v4: identity — plants-fältet saknas legitimt.
  return {
    version: 4,
    plot: scene.plot,
    boundary: scene.boundary ?? null,
    rectangles: scene.rectangles,
  };
}
```

> `serializeScene` skriver `plants` bara om arrayen har >0 element (samma 
> minimalism-princip som `kind`/`label`).

---

## 5. Canvas-rendering — grödor i bäddar

### I `Canvas.tsx`, efter rectangle-rendering, före handles:

```typescript
// ── Render plant placements ──
for (const rect of state.rectangles) {
  if (!rect.plants || rect.plants.length === 0) continue;
  if (getKind(rect) !== "bed") continue;

  for (const plant of rect.plants) {
    // Konvertera lokal (bädd) → world → screen
    const worldPos = localToWorld(
      { x: plant.offsetX, y: plant.offsetY },
      rect,
    );
    const screenPos = worldToScreen(worldPos, state.viewport);

    const isSelectedPlant =
      state.selectedPlantId === plant.placementId &&
      state.selectedIds.includes(rect.id);

    // Cirkel med blad-ikon
    const radius = Math.max(6, 100 * state.viewport.pixelsPerMm);
    ctx.beginPath();
    ctx.arc(screenPos.x, screenPos.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = isSelectedPlant
      ? palette.accentPlantSelected   // ny palette-nyckel
      : palette.accentPlant;          // ny palette-nyckel
    ctx.fill();
    ctx.strokeStyle = isSelectedPlant ? palette.accentSun : palette.accentBed;
    ctx.lineWidth = isSelectedPlant ? 2 : 1;
    ctx.stroke();

    // Växtnamn-etikett
    if (state.viewport.pixelsPerMm > 0.03) {  // bara vid rimlig zoom
      ctx.fillStyle = palette.labelText;
      ctx.font = "10px var(--font-sans)";
      ctx.textAlign = "center";
      ctx.fillText(
        plant.displayName + (plant.count > 1 ? ` ×${plant.count}` : ""),
        screenPos.x,
        screenPos.y + radius + 12,
      );
      ctx.textAlign = "start";  // reset
    }
  }
}
```

### Ny palette-nyckel (i `palette.ts`):

```typescript
accentPlant: "rgba(76, 175, 80, 0.65)",         // grön
accentPlantSelected: "rgba(76, 175, 80, 0.90)",  // starkt grön
```

---

## 6. UI-flöde — tre nya/utökade komponenter

### 6.1 `PlantSearchPanel.tsx` — söka + lägga till

Visas som ett popover/modal från Toolbar eller SidePanel (när en bädd är vald).

```
┌──────────────────────────────────────────┐
│  🔍 Sök växt...  [tomat___________] [🔍] │
│                                          │
│  ┌──────────────────────────────────────┐ │
│  │ 🍅 Tomato (Solanum lycopersicum)    │ │
│  │    12–33°C · 3000–55000 lux         │ │
│  │    [+ Lägg till i bädd]             │ │
│  ├──────────────────────────────────────┤ │
│  │ 🌶️ Pepper (Capsicum annuum)         │ │
│  │    15–35°C · 4000–60000 lux         │ │
│  │    [+ Lägg till i bädd]             │ │
│  └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

**Flöde:**

1. Användaren markerar en bädd (kind=bed) → knappen "🌱 Lägg till gröda" 
   blir aktiv i Toolbar.
2. Klickar → `PlantSearchPanel` öppnas.
3. Skriver "tomat" → debounced (300ms) anrop till 
   `plantBookClient.search("tomat")`.
4. Sökresultaten visas som kort med sammanfattning.
5. Klickar "Lägg till" → `plantBookClient.getDetail(displayPid)` hämtas,
   cachas, och en `addPlant`-action dispatchas:

```typescript
dispatch({
  type: "addPlant",
  bedId: selectedBedId,
  plant: {
    placementId: nextPlantId(),
    plantId: profile.id,
    displayName: profile.commonName,
    offsetX: 0,   // centrerad initialt
    offsetY: 0,
    count: 1,
  },
});
```

### 6.2 Utökad `SidePanel.tsx` — växtlista + detaljinfo

När en bädd är vald och har `plants[]`:

```
┌─────────────────────────────────────────┐
│  BÄDD · rect-1                          │
│  ─────────────────────────────────      │
│  Dimensioner     2000 × 1000 mm         │
│  Area            2.00 m²                │
│  Jordvolym       600 L                  │
│  Soltimmar ☀️    11 h (midsommar)       │
│                                         │
│  GRÖDOR I BÄDDEN (2 st)                 │
│  ─────────────────────────────────      │
│  ┌─────────────────────────────────┐    │
│  │ 🍅 Tomat               ×3  [🗑] │    │
│  │ ✅ Sol: Perfekt (11h, beh. 6+h) │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ 🥬 Sallad              ×5  [🗑] │    │
│  │ 🟡 Sol: Kan vara för starkt     │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [🌱 Lägg till gröda...]                │
└─────────────────────────────────────────┘
```

### 6.3 Klicka på gröda → `PlantDetailPanel`

När användaren klickar en gröda (antingen i listan eller på canvas-cirkeln)
expanderas detaljinfo:

```
┌─────────────────────────────────────────┐
│  ← Tillbaka till bädd                   │
│                                         │
│  🍅 TOMAT                               │
│  Solanum lycopersicum                   │
│  ─────────────────────────────────      │
│                                         │
│  SOL & PLATS                            │
│  Bädden ger      ~11 h sol              │
│  Behöver         3 000 – 55 000 lux     │
│  Bedömning       ✅ Perfekt match       │
│                                         │
│  TEMPERATUR                             │
│  Klarar          12 – 33 °C             │
│  Optimal         18 – 27 °C  (approx)  │
│                                         │
│  VATTEN & JORD                          │
│  Jordfuktighet   20 – 60 %              │
│  Vattning        Var 5–7:e dag          │
│  Jordtyp         Well-drained, Loamy    │
│                                         │
│  NÄRING                                 │
│  EC-konduktivitet  350 – 2000 µS/cm     │
│  (Motsvarar medelhög – hög näring)      │
│                                         │
│  ÖVRIGT                                 │
│  Luftfuktighet   15 – 80 %              │
│  Tillväxthastighet  Hög                 │
│  Skötselgrad     Medel                  │
│  Skadedjur       Bladlöss, rotröta      │
│  Blomning        Sommar                 │
│  Skörd           Höst                   │
│  Giftig          Nej                    │
│                                         │
│  Antal i bädd    [3  ▼]  [🗑 Ta bort]   │
└─────────────────────────────────────────┘
```

---

## 7. State-tillägg i `SandboxState`

```typescript
export interface SandboxState {
  // ... allt befintligt ...

  /** ID för vald gröda-placering (null = ingen gröda vald). */
  selectedPlantId: string | null;

  /** 
   * Cachade växtprofiler, indexerade på plantId. 
   * Lever i state (→ tillgängligt överallt) men persisteras SEPARAT 
   * i localStorage (inte i scene.json) — se cache.ts.
   * Fylls på vid sökning/laddning.
   */
  plantProfiles: Record<string, PlantCareProfile>;
}
```

> **Designbeslut:** `plantProfiles` lever i runtime-state för enkel access 
> men **sparas inte i scene.json** (skulle göra filen enorm). Scene-filen 
> sparar bara `PlantPlacement[]` (plantId + displayName). Vid load hämtas 
> profiler on-demand eller från localStorage-cache.

### Nya actions:

```typescript
| { type: "selectPlant"; placementId: string | null }
| { type: "cachePlantProfile"; profile: PlantCareProfile }
| { type: "cachePlantProfiles"; profiles: PlantCareProfile[] }
```

---

## 8. Dataflödes-diagram

```
┌───────────────────┐     debounced search
│  PlantSearchPanel │ ──────────────────────→ ┌──────────────────┐
│  (sökfält i UI)   │                         │  PlantBookClient │
│                   │ ←─── sökresultat ─────  │  (REST API)      │
└───────┬───────────┘                         └────────┬─────────┘
        │ "Lägg till"                                  │ getDetail()
        │                                              ↓
        │                                    ┌──────────────────┐
        │                                    │  cache.ts        │
        │                                    │  (localStorage)  │
        │                                    └────────┬─────────┘
        ↓                                             │
┌───────────────────┐                                  │
│     reducer       │ ← cachePlantProfile ─────────────┘
│   (state.ts)      │
│                   │ ← addPlant { bedId, plant }
│                   │
│   Rect.plants[]   │ ──→ ┌────────────┐
│   updated         │     │ Canvas.tsx  │  ritar gröda-cirklar
│                   │     └────────────┘
│                   │ ──→ ┌────────────┐
│                   │     │ SidePanel   │  visar grödlista +
│                   │     │            │  sol-matchning
│                   │     └────────────┘
│                   │ ──→ ┌────────────┐
│                   │     │ scene.json  │  plants[] serialiseras
│                   │     │ (SceneV4)   │  i serializeScene()
│                   │     └────────────┘
└───────────────────┘

Klick på gröda ──→ selectPlant ──→ PlantDetailPanel
                                   (hämtar PlantCareProfile
                                    från state.plantProfiles
                                    eller cache/API fallback)
                                   
                                   + bedSunHours() från
                                     spatial-core/sunHours.ts
                                   
                                   → matchSunlight() →
                                     visar ✅/🟡/⚠️
```

---

## 9. Canvas interaktion — klicka gröda

### Hit-test i `Canvas.tsx` `onPointerDown`:

```typescript
// EFTER handle-test och rect-test, FÖRE pan:

// 3. Plant hit-test (bara om en bädd redan är vald)
if (primaryId) {
  const bed = state.rectangles.find((r) => r.id === primaryId);
  if (bed?.plants) {
    for (const plant of bed.plants) {
      const plantWorld = localToWorld({ x: plant.offsetX, y: plant.offsetY }, bed);
      const plantScreen = worldToScreen(plantWorld, state.viewport);
      const dist = Math.hypot(screenP.x - plantScreen.x, screenP.y - plantScreen.y);
      const hitRadius = Math.max(8, 100 * state.viewport.pixelsPerMm);
      if (dist <= hitRadius) {
        dispatch({ type: "selectPlant", placementId: plant.placementId });
        return;  // konsumera klicket
      }
    }
  }
}
```

### Drag-to-move för grödor (framtida):

Samma mönster som bädd-drag, men opererar på `plant.offsetX/offsetY` och 
clampar till bäddens halva bredd/höjd så grödan inte hamnar utanför.

---

## 10. Konfiguration & API-nycklar

API-nycklar hanteras via environment-variabler (Vite):

```env
# .env.local (gitignored)
VITE_PLANTBOOK_CLIENT_ID=din-client-id
VITE_PLANTBOOK_CLIENT_SECRET=din-client-secret
VITE_PERENUAL_API_KEY=din-perenual-nyckel
```

```typescript
// I App.tsx eller en context:
const plantBookClient = new PlantBookClient(
  import.meta.env.VITE_PLANTBOOK_CLIENT_ID ?? "",
  import.meta.env.VITE_PLANTBOOK_CLIENT_SECRET ?? "",
);
```

---

## 11. Undo/redo — fungerar automatiskt

Eftersom `addPlant`, `removePlant` etc. ligger i `AUTO_COMMIT_ACTIONS` och 
undo/redo bygger på snapshot av hela `SandboxState`, fungerar det per 
automatik: Ctrl+Z ångrar en tillagd gröda precis som det ångrar en tillagd bädd.

---

## 12. Implementationsordning (förslag)

| Steg | Vad | Uppskattning |
|------|-----|-------------|
| 1 | `PlantPlacement` + `plants?` på `Rect` i types.ts | 30 min |
| 2 | Scene v4 migration + serialisering | 1 h |
| 3 | `packages/plant-data/` med types + cache + plantbook-adapter | 2–3 h |
| 4 | Nya reducer-actions (add/remove/move/selectPlant) | 1 h |
| 5 | `PlantSearchPanel` UI med sök + lägg-till-knapp | 2–3 h |
| 6 | Canvas-rendering av gröda-cirklar + hit-test | 2 h |
| 7 | `SidePanel` grödlista + sol-matchning | 2 h |
| 8 | `PlantDetailPanel` fullständig info-vy | 2 h |
| 9 | Perenual-adapter (komplettera jord/bilder) | 1–2 h |
| 10 | Tester | 2–3 h |
| **Totalt** | | **~15–20 h** |

---

## 13. Vad som INTE ändras

- **`spatial-core` matematik** — rotation, kollision, skugga, sunHours förblir oförändrade.
- **Reducer-mönster** — fortfarande ren funktion, inget state-library.
- **Adapter-arkitektur** — ScenePersistence-interfacet utökas inte; scene.json 
  innehåller plants via Rect.
- **Koordinatsystem** — plant-positioner använder mm-grid, integer, i lokal-space 
  (precis som allt annat).
