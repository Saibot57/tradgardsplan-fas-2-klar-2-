# 🌱 Växtdata-integration — Reviderad specifikation v2

## Revideringslogg (diff mot v1)

Denna version korrigerar faktafel, luckor och osäkerheter som hittades 
vid detaljerad kodgranskning av hela repot + API-verifiering.

---

## ⚠️ KRITISKA KORRIGERINGAR

### K1. CLAUDE.md förbjuder explicit "plant catalog"

**Citat ur CLAUDE.md rad ~70:**
> *Explicit ut-scope: 3D, polygoner, **plant catalog**, persistens-backend, auth, multi-user. 
> Om du tror något kräver detta — fråga först.*

**Konsekvens:** Innan implementation påbörjas **måste en ny ADR skrivas** 
(t.ex. `docs/adr/010-plant-catalog-integration.md`) som uttryckligen lyfter 
ut "plant catalog" från ut-scope. Utan det bryter implementationen mot det 
normativa kontraktet. CLAUDE.md ska uppdateras med den nya ADR-referensen.

---

### K2. Open Plantbook auth-flöde — specen hade fel content-type

**Faktiskt API-beteende (verifierat via Postman-docs + Python SDK):**

```bash
# Korrekt — form-data, INTE application/x-www-form-urlencoded
curl --location 'https://open.plantbook.io/api/v1/token/' \
  --form 'grant_type="client_credentials"' \
  --form 'client_id="XXX"' \
  --form 'client_secret="YYY"'
```

Responsen:
```json
{
  "access_token": "HZzB1P....PrDYxYO2Mt",
  "expires_in": 86400,           // ← 24h, INTE 30 min som v1 antog
  "token_type": "Bearer",
  "scope": "read write"
}
```

**Korrigeringar i adapter-koden:**
- Content-Type ska vara `multipart/form-data` (eller `FormData`-objekt i `fetch`).
- `expires_in` är 86 400 sekunder (24h), inte 1 800 (30 min). TTL-marginalen 
  bör vara ~300s, inte 60s.

**Alternativ (enklare):** Open Plantbook stödjer även **API-key auth** för 
`search` + `detail` — en permanent token med header `Authorization: Token <key>`. 
Inget OAuth-flöde behövs. **Rekommendation: Använd API-key-auth istället.** 
Det eliminerar token-förnyelse helt. Enda nackdelen: fungerar inte för 
`create`/`update`/`delete` endpoints, men de behövs inte i denna integration.

Ny env-variabel:
```env
VITE_PLANTBOOK_API_KEY=228d654c09c6a17006d5421eba175a9a15dca07e
```

Adapter:
```typescript
headers: { Authorization: `Token ${apiKey}` }
```

---

### K3. Open Plantbook detail-response har fler fält — `image_url` och `pid`

**Faktiskt svar (verifierat):**
```json
{
  "pid": "acanthus ilicifolius",
  "display_pid": "Acanthus ilicifolius",
  "alias": "acanthus ilicifolius",
  "max_light_mmol": 2500,
  "min_light_mmol": 1200,
  "max_light_lux": 6000,
  "min_light_lux": 1500,
  "max_temp": 32,
  "min_temp": 10,
  "max_env_humid": 80,
  "min_env_humid": 30,
  "max_soil_moist": 60,
  "min_soil_moist": 15,
  "max_soil_ec": 2000,
  "min_soil_ec": 350,
  "image_url": "https://opb-img.plantbook.io/acanthus%20ilicifolius.jpg"
}
```

**Konsekvens:** Open Plantbook HAR bilder (`image_url`). V1-specen sa "saknar 
bilder" — det är fel sedan release 1.02. Perenual behövs därmed **inte** som 
bildkälla. Bilderna ska cachas/inte hårdkodas (API-docs varnar att URL:er kan 
ändras).

---

### K4. Open Plantbook search endpoint — korrekt URL och svarformat

**Korrekt endpoint:**
```
GET https://open.plantbook.io/api/v1/plant/search?alias=<query>&limit=20&offset=0
```

**Svar (verifierat via .NET SDK + Python SDK):**
```json
{
  "count": 3,
  "next": null,
  "previous": null,
  "results": [
    {
      "pid": "monstera deliciosa",
      "display_pid": "Monstera deliciosa",
      "alias": "Swiss Cheese Plant",
      "category": "...",
      "image_url": "..."
    }
  ]
}
```

**Korrigering:** Sökresultatet är paginerat med `count`/`next`/`previous` 
och varje träff har `pid` (inte `display_pid` som unikt ID). Detail-anrop 
görs med `pid` (gemener): `/api/v1/plant/detail/{pid}/`.

**Minimum söklängd: 3 tecken.** UI bör inte skicka API-anrop förrän 
inputen har ≥3 tecken.

---

### K5. Open Plantbook rate limit — 200 req/dag

**Från nov 2025** gäller: max 200 requests per user per dag. 

**Konsekvens:** Caching är inte bara "nice-to-have" utan **obligatoriskt**. 
Utan cache kan en användare som söker aktivt slå i taket på <1h. 
Rekommendation: cache search-resultat (5 min TTL) och detail-resultat (7 dagar TTL).

---

### K6. `localToWorld` finns redan — behöver inte importeras separat

V1-specens Canvas-kod hade `localToWorld(...)` utan import. Verifierat: 
`localToWorld` exporteras redan från `@kolonitradgard/spatial-core` via 
`coordinates.ts`. ✅ Det stämmer, men den importeras inte i nuvarande 
`Canvas.tsx` — importen måste läggas till:

```typescript
import {
  rectCorners,
  projectShadow,
  sampleSunHourly,
  snapToGrid,
  worldToScreen,
  screenToWorld,
  worldToLocal,
  localToWorld,     // ← LÄGG TILL
  type Rect,
  type SunPosition,
  type Point,
} from "@kolonitradgard/spatial-core";
```

---

## 🟡 DESIGN-JUSTERINGAR

### D1. `selectedPlantId` ska INTE ligga i `SandboxState`

**Problem:** V1-specen lade `selectedPlantId` och `plantProfiles` i 
`SandboxState`. Men:

1. `selectedPlantId` är UI-selection-state — det ska **inte undo:as** 
   (precis som `selectedIds` inte undo:as vid `select`-actions, som inte 
   finns i `AUTO_COMMIT_ACTIONS`).
2. `plantProfiles` är cache-data — det ska inte serialiseras i snapshots 
   (kan bli tiotals KB per snapshot × 50 = MB-nivå).

**Korrigering:** 

- `selectedPlantId`: Lägg som **vanlig `useState`** i `App.tsx` 
  (parallellt med `bedDepth`, `theme`). Proppa ned till `SidePanel`/`Canvas`.
- `plantProfiles`: Lägg i en **React Context** (`PlantDataContext`) eller 
  `useState` i `App.tsx`. Cachas i localStorage via `cache.ts` men lever 
  aldrig i reducer-state.

```typescript
// App.tsx
const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
const [plantProfiles, setPlantProfiles] = useState<Record<string, PlantCareProfile>>({});
```

---

### D2. `PlantPlacement.offsetX/offsetY` — integer mm-kontrakt

V1-specen nämnde "integer mm" men enforcade det inte i reducern. 
Korrigering:

```typescript
case "addPlant": {
  return {
    ...state,
    rectangles: state.rectangles.map((r) => {
      if (r.id !== action.bedId) return r;
      const existing = r.plants ?? [];
      const p = action.plant;
      // Canonicalize till integer mm
      const canonPlant: PlantPlacement = {
        ...p,
        offsetX: Math.round(p.offsetX),
        offsetY: Math.round(p.offsetY),
      };
      return { ...r, plants: [...existing, canonPlant] };
    }),
  };
}
```

Dessutom: `canonicalizeRect` i `scene.ts` måste uppdateras för att 
round:a `plants[].offsetX/offsetY` också:

```typescript
function canonicalizeRect(r: Rect): Rect {
  const out: Rect = { /* ... befintligt ... */ };
  // ... label, notes, kind ...
  if (r.plants && r.plants.length > 0) {
    out.plants = r.plants.map((p) => ({
      ...p,
      offsetX: Math.round(p.offsetX),
      offsetY: Math.round(p.offsetY),
      count: Math.max(1, Math.round(p.count)),
    }));
  }
  return out;
}
```

---

### D3. `parseScene` validering av `PlantPlacement`

V1-specen missade att `parseScene()` måste validera plants-arrayen. 
Utan det kan korrupta scene.json-filer krascha appen:

```typescript
// I validateRect():
if (rect.plants !== undefined) {
  if (!Array.isArray(rect.plants)) {
    throw new SceneParseError("plants must be an array when present", raw);
  }
  for (const p of rect.plants) {
    if (typeof p.placementId !== "string" || p.placementId.length === 0) {
      throw new SceneParseError("plant placementId must be non-empty string", raw);
    }
    if (typeof p.plantId !== "string") {
      throw new SceneParseError("plant plantId must be a string", raw);
    }
    if (typeof p.displayName !== "string") {
      throw new SceneParseError("plant displayName must be a string", raw);
    }
    if (typeof p.offsetX !== "number" || typeof p.offsetY !== "number") {
      throw new SceneParseError("plant offset must be numbers", raw);
    }
    if (typeof p.count !== "number" || p.count < 1) {
      throw new SceneParseError("plant count must be >= 1", raw);
    }
  }
}
```

---

### D4. Scene v4 — `serializeScene` returnerar `SceneV4` men `useAutoSave` förväntar `SceneV3`

Hela kedjan `serializeScene → ScenePersistence.save → useAutoSave → bootstrapFromAdapter` 
typas mot `SceneV3`. Vid version-bump till v4 måste **samtliga** dessa uppdateras:

- `ScenePersistence` interface: `save(scene: SceneV4)`, `load(): SceneV4 | null`
- `useAutoSave.ts`: importera `SceneV4` istället för `SceneV3`
- `bootstrapFromAdapter`: returnerar `SceneV4`
- `io.ts` `loadScene`/`saveScene`: typas mot `SceneV4`
- `state.ts` `loadScene` action: `scene: SceneV4`

Alternativt kan man göra en mer generaliserad type:

```typescript
export type CurrentScene = SceneV4;
```

Och använda den överallt istället för hårdkodad version.

---

### D5. `nextPlantId()` — separat ID-räknare

V1-specen nämnde `nextPlantId()` men definierade den inte. Den **ska inte** 
återanvända `nextId()` (som genererar `rect-N`) — ID:n ska vara distinkt 
namnrymd:

```typescript
// state.ts
let _plantId = 0;
export const nextPlantId = (): string => `plant-${++_plantId}`;
```

**OBS:** vid `loadScene` nollställs inte räknarna, så efter laddning kan 
nya ID:n kollidera med laddade. Lösning: parsa max-suffixet vid load, 
eller använd UUID/nano-id. Samma problem finns redan med `nextId()` i 
befintlig kod — det är en känd svaghet men inte en ny regression.

---

### D6. Canvas hit-test ordning för grödor

V1-specen placerade plant-hit-test *efter* rect-hit-test. Men det innebär 
att klick på en gröda i en redan-vald bädd inte når plant-hittestet 
eftersom rect-hittestet konsumerar klicket först (det matchar bädden).

**Korrigering:** Plant hit-test ska ske **innan** rect hit-test, 
men bara om den klickade bädden redan är primary-selected:

```typescript
// I onPointerDown, EFTER handle-test men FÖRE rect-test:

// 2. Plant hit-test (bara i primary-selected bed)
const primaryRect = primaryId
  ? state.rectangles.find((r) => r.id === primaryId)
  : null;
if (primaryRect?.plants && pointInRect(worldP, primaryRect)) {
  for (const plant of primaryRect.plants) {
    const plantWorld = localToWorld(
      { x: plant.offsetX, y: plant.offsetY },
      primaryRect,
    );
    const plantScreen = worldToScreen(plantWorld, state.viewport);
    const dist = Math.hypot(screenP.x - plantScreen.x, screenP.y - plantScreen.y);
    const hitRadius = Math.max(8, 100 * state.viewport.pixelsPerMm);
    if (dist <= hitRadius) {
      setSelectedPlantId(plant.placementId);
      return;
    }
  }
}

// 3. Rect hit-test (befintlig kod)
```

---

### D7. Perenual-rollen reducerad

Eftersom Open Plantbook nu har `image_url` behövs Perenual **bara** för:
- Jordtyp (`soil[]`)
- Beskärning (`pruning_month`)
- Skadedjur (`pest_susceptibility`)
- Giftighetsflaggor
- `watering_general_benchmark` (dagar)

**Rekommendation:** Gör Perenual-adaptern till ett **framtida steg** (Steg 9 i 
implementationsordningen), inte en del av MVP. Open Plantbook ensam täcker 
allt utom jordtyp.

---

## 🔴 OSÄKERHETER (kräver manuell verifiering)

### O1. Open Plantbook — täckning av svenska köksträdgårdsgrödor

**Osäkerhet:** Databasen har ~10 000+ växter, men det är oklart hur bra 
täckningen är för just **svenska grönsaker/bär/kryddor** (morot, potatis, 
jordgubbe, rabarber, dill, etc). Den verkar bygga på MiFlora-sensor-data 
från krukväxter + community-bidrag.

**Risk:** Användaren söker "morot" (eller "carrot" / "daucus carota") 
och får noll träffar.

**Åtgärd innan implementation:**
1. Registrera ett Open Plantbook-konto.
2. Testa manuellt med: `tomat`, `morot`, `potatis`, `gurka`, `jordgubbe`, 
   `dill`, `persilja`, `rabarber`, `lök`, `pumpa`, `bönor`, `ärtor`.
3. Om täckningen är <70% behöver planen kompletteras med en 
   **lokal fallback-databas** (handkurerad JSON med ~30–50 vanliga 
   skandinaviska grödor).

### O2. Open Plantbook — sökning på svenska namn

**Osäkerhet:** Sökfältet (`alias`) söker i `display_pid` (vetenskapligt 
namn) och `alias` (engelskt common name). Sökning på "tomat" kanske inte 
matchar "Tomato" — det beror på om API:t gör substring-match eller exakt.

**Testat via SDK-docs:** "Search any occurrences of text in `display_pid` 
and `alias` fields." — tyder på substring. Men om alias enbart innehåller 
engelska namn hittar "tomat" det inte (det är inte en substring av "Tomato").

**Lösning:** UI:t bör visa tips "Sök på engelska eller latinska namn" 
och/eller använda en lokal svensk→latinsk/engelsk översättningstabell.

### O3. Perenual gratisnivå — godkännandeprocess

Det rapporteras att det tar tid att bli godkänd för Perenual API-nyckel. 
Gratisnivån har 100 req/dag och premium börjar på $3/mån. Osäkert om 
Perenual fortfarande godkänner nya gratis-nycklar.

### O4. CORS — Open Plantbook från webbläsare

**Kritisk osäkerhet:** Open Plantbook API:t är byggt för server-till-server-
kommunikation (Home Assistant, Python-klienter). Det är **oklart** om API:t 
sätter `Access-Control-Allow-Origin`-headers för cross-origin-anrop från 
en webbläsare.

**Om CORS blockerar** (troligt) behövs en av dessa lösningar:
1. **Proxy-server** — en minimal backend (Cloudflare Worker, Vercel Edge 
   Function, etc.) som vidarebefodrar anrop.
2. **Build-time prefetch** — hämta all data vid build och bädda in som 
   JSON (fungerar bara för en fast grödlista).
3. **Lokal dataset** — skippa API:t helt och bundla en handkurerad 
   JSON-fil.

**Rekommendation:** Testa CORS manuellt först. Om det blockerar, gå med 
option 3 (lokal JSON) för MVP och lägg till proxy som FAS 4-uppgift.

### O5. `exactOptionalPropertyTypes` — TypeScript-strikthet

`tsconfig.base.json` har `exactOptionalPropertyTypes: true`. Det betyder:

```typescript
// DETTA ÄR FEL:
const r: Rect = { ...r, plants: undefined };  // ❌ undefined !== saknad

// KORREKT:
const r: Rect = { ...r };  // plants-nyckeln utelämnas
delete next.plants;         // eller explicit delete
```

Alla reducer-cases som sätter `plants` till `undefined` måste istället 
använda `delete`:

```typescript
case "removePlant": {
  return {
    ...state,
    rectangles: state.rectangles.map((r) => {
      if (r.id !== action.bedId) return r;
      const filtered = (r.plants ?? []).filter(
        (p) => p.placementId !== action.placementId,
      );
      const next: Rect = { ...r };
      if (filtered.length > 0) {
        next.plants = filtered;
      } else {
        delete next.plants;  // ← inte `plants: undefined`
      }
      return next;
    }),
  };
}
```

---

## 📋 UPPDATERAD CHECKLISTA (pre-implementation)

| # | Uppgift | Status |
|---|---------|--------|
| 1 | Skriv ADR-010 som lyfter "plant catalog" ur ut-scope | 🔴 Måste göras |
| 2 | Uppdatera CLAUDE.md med referens till ADR-010 | 🔴 Måste göras |
| 3 | Registrera Open Plantbook-konto och generera API-key | 🔴 Måste göras |
| 4 | Testa CORS från webbläsare (`fetch` mot API:t) | 🔴 Måste göras |
| 5 | Testa täckning: sök 15 vanliga svenska grödor | 🔴 Måste göras |
| 6 | Testa sökning med svenska vs engelska termer | 🔴 Måste göras |
| 7 | Besluta: API-key auth vs OAuth2 (rekommendation: API-key) | 🟡 Beslut |
| 8 | Besluta: proxy-server eller lokal JSON vid CORS-block | 🟡 Beslut |
| 9 | Besluta: Perenual i MVP eller framtida steg | 🟡 Beslut |

---

## 📐 UPPDATERAD ARKITEKTUR

```
packages/
  spatial-core/             ← befintlig (tillägg: PlantPlacement type, scene v4)
  plant-data/               ← NY
    src/
      types.ts              ← PlantCareProfile
      plantbook-client.ts   ← Open Plantbook (API-key auth, inte OAuth)
      cache.ts              ← localStorage med TTL (7d detail, 5min search)
      sunlight-match.ts     ← bedSunHours → lux → match
      index.ts
    __tests__/

apps/
  geometry-sandbox/
    src/
      state.ts              ← +addPlant, +removePlant, +movePlant, +updatePlantCount
                               (selectedPlantId lever UTANFÖR state, i App.tsx)
      App.tsx                ← +selectedPlantId useState, +PlantDataContext
      Canvas.tsx             ← +plant-rendering, +plant hit-test
      SidePanel.tsx          ← +grödlista per bädd, +sol-matchning
      PlantSearchPanel.tsx   ← NY: sökfält + resultat + "lägg till"-knapp
      PlantDetailView.tsx    ← NY: fullständig detaljvy (inline i SidePanel)
      palette.ts             ← +accentPlant, +accentPlantSelected
      io.ts                  ← typändringar SceneV3 → SceneV4
      persistence.ts         ← typändringar SceneV3 → SceneV4
      useAutoSave.ts         ← typändringar SceneV3 → SceneV4

docs/
  adr/
    010-plant-catalog.md    ← NY ADR som lyfter plant catalog ur ut-scope
```

---

## 🔧 KORRIGERAD IMPLEMENTATIONSORDNING

| Steg | Vad | Förutsättning |
|------|-----|---------------|
| **0** | **ADR-010 + CLAUDE.md-uppdatering** | — |
| **0b** | **Registrera Open Plantbook + testa CORS + täckning** | — |
| 1 | `PlantPlacement` type i types.ts, `plants?` på Rect | ADR-010 |
| 2 | Scene v4: migration, serialisering, parse-validering | Steg 1 |
| 3 | Typändringar: persistence/useAutoSave/io → SceneV4 | Steg 2 |
| 4 | `packages/plant-data/` med types + cache + plantbook-client (API-key auth) | Steg 0b |
| 5 | Reducer: addPlant/removePlant/movePlant/updatePlantCount | Steg 1 |
| 6 | `App.tsx`: selectedPlantId + plantProfiles state + PlantDataContext | Steg 4,5 |
| 7 | `PlantSearchPanel` UI | Steg 6 |
| 8 | Canvas: plant-rendering + hit-test + palette-utökning | Steg 5,6 |
| 9 | SidePanel: grödlista + `PlantDetailView` + sol-matchning | Steg 4,8 |
| 10 | Tester: plant-data cache, sunlight-match, reducer, scene v4 parse | Löpande |
| 11* | *(Framtid)* Perenual-adapter för jordtyp | Steg 9 klar |
| 12* | *(Framtid)* Lokal svensk grödtabell (fallback vid dålig API-täckning) | Steg 0b visar behov |

---

## SAMMANFATTNING AV ÄNDRINGAR v1 → v2

| Ämne | V1 (fel/lucka) | V2 (korrigerat) |
|------|----------------|-----------------|
| CLAUDE.md scope | Inte nämnt | ⚠️ Kräver ADR-010 |
| Auth-flöde | OAuth2 med `x-www-form-urlencoded`, 30 min TTL | API-key auth (enklare), eller OAuth med `form-data` + 24h TTL |
| Bilder | "Open Plantbook saknar bilder" | ✅ Har `image_url` sedan release 1.02 |
| Sök-svar | `data.results` | `{ count, next, previous, results: [...] }` med `pid`-fält |
| Detail-URL | `/api/v1/plant/detail/${displayPid}/` | `/api/v1/plant/detail/${pid}/` (lowercase) |
| Rate limit | Inte nämnt | 200 req/dag — cache obligatoriskt |
| Min söklängd | Inte nämnt | ≥3 tecken |
| selectedPlantId | I SandboxState (undo:as) | I App.tsx useState (undo:as ej) |
| plantProfiles | I SandboxState (snapshots) | Utanför state, i Context/useState |
| `plants: undefined` | `plants: undefined` i reducer | `delete next.plants` (exactOptionalPropertyTypes) |
| parseScene | Validerade inte plants | Validerar alla PlantPlacement-fält |
| Hit-test ordning | Plant efter rect | Plant före rect (i already-selected bed) |
| CORS | Inte nämnt | ⚠️ Kritisk osäkerhet — måste testas |
| Svenska namn | Inte nämnt | ⚠️ API söker engelska/latinska — behöver mappning |
| Perenual | I MVP | Framtida steg |
| ID-räknare | Inte specificerad | `nextPlantId()` separat, kollisionsrisk noterad |
| canonicalizeRect | Hanterade inte plants | Rundar offsetX/offsetY/count |
