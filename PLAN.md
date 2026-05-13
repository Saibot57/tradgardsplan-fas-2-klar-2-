# Trädgårdsplan — Produkt- & UX-analys

## 1. Nuvarande Funktionalitet

Sandboxen (`apps/geometry-sandbox`) är en kanvasbaserad 2D-redaktör för odlingsbäddar med en isolerad matematisk kärna (`packages/spatial-core`). Användaren kan idag:

**Geometri & manipulation**
- Lägga till rektangulära bäddar via `Toolbar` (popover med bredd/höjd i mm), `Canvas.tsx:182` hanterar select/move/resize/rotate-handtag.
- Flytta, rotera (±15°-knappar eller rotate-handle) och skalförändra bäddar — alla mutationer canonicaliseras till integer mm i reducern (`state.ts:107-167`).
- Ta bort vald bädd, sätta `wallHeight` (för skugga) och definiera en yttre **tomtgräns** (boundaryRect).

**Sol & skugga**
- `TimeSlider` (06:00–20:00, 15-min-steg) styr `state.sun.dateIso` för interaktiv skuggförhandsgranskning. Datumväljare ger valfritt datum.
- Toggle `Skuggor`, läsbar sol-altitud/azimut i toolbar.
- `SidePanel` visar **aggregerade soltimmar** för vald bädd vid midsommar (oberoende av sliden, `SidePanel.tsx:139-154`).
- Norr-rotation (`northRotationDeg`) som roterar enbart sol-referensramen — visualiseras i kompassen `Canvas.tsx:404`.

**Mätning & validering**
- Live-beräknad area (m²) och jordvolym (L) per bädd och totalt; konfigurerbar bäddhöjd.
- SAT-kollisionsdetektering med AABB-broadphase visar rött vid overlap, gult vid edge-touch, grönt fristående.

**Workflow**
- Snap-to-grid (toggle + steg i mm).
- Manuell **Spara/Ladda** scen.json (`io.ts`) med versionerad migration.
- Undo/redo via snapshots (`history.ts`, ⌘Z/⌘⇧Z), drag-bursts blir ett snapshot.
- Tema-toggle (paper/evening), pan via drag-på-tomrum, zoom via wheel.

**Vad saknas explicit:** inget persistent state mellan reloads, hårdkodat startdatum (`new Date(2025, 5, 21, 12, 0, 0)` i `state.ts:77`), inga kortkommandon utöver undo/redo, inga multi-select, inga duplikat-funktioner, inga linjaler eller mätverktyg.

---

## 2. Implementationsplan för Auto-save & Tid

### 2.1 Kontextuell tidsmedvetenhet (enklast först)

**Problem:** `state.ts:77` hårdkodar `new Date(2025, 5, 21, 12, 0, 0)`. När appen öppnas 2026 ger det missvisande sol-position.

**Förslag:** Konvertera `initialState` från en konstant till en factory-funktion:

```ts
// state.ts
export function makeInitialState(now: Date = new Date()): SandboxState {
  // Clamp till TimeSlider-fönstret 06–20 så slidern inte börjar utanför range.
  const clamped = new Date(now);
  const h = clamped.getHours();
  if (h < 6) clamped.setHours(12, 0, 0, 0);
  if (h > 20) clamped.setHours(20, 0, 0, 0);
  return {
    /* ... */
    sun: { dateIso: clamped.toISOString() },
    /* ... */
  };
}
```

Sedan i `App.tsx:35`: `const initialHistory = { past: [], present: makeInitialState(), future: [] }` (lazy-init via `useReducer(reducer, undefined, () => initialHistory)` så `Date()` inte körs vid varje render).

**Viktigt:** `REFERENCE_DATE` i `SidePanel.tsx:22` (midsommar) ska **inte** ändras — den är medvetet fixerad för aggregerad sommaranalys (jämför kommentaren i filen). Bara den interaktiva slidern ska följa "nu".

**Tester att lägga till** i `apps/geometry-sandbox/tests/`: `makeInitialState(new Date('2026-12-01T03:00:00Z'))` → ISO ska ligga inom 06–20-fönstret.

### 2.2 Automatisk synkronisering till lokal backend

**Arkitektoniskt val:** Projektet har explicit beslut (CLAUDE.md): **inget state-management-bibliotek**. Reducern är ren, undo/redo bygger på snapshots. Den naturliga integrationen är därför **inte** middleware (Redux-stil — kräver bibliotek), utan en **`useEffect` i `App.tsx` som observerar `historyState.present`** och synkroniserar via `serializeScene`.

**Rekommenderad arkitektur — tre lager:**

```
state.ts  (oförändrad, fortsatt ren)
   ↓ historyState.present
App.tsx  → useAutoSave(present)   [debounced effect]
   ↓
persistence.ts  → savePersist()/loadPersist()  [adapter]
   ↓
Backend-adapter (utbytbar)
   ├─ LocalStorageAdapter   (default, fungerar offline)
   ├─ IndexedDBAdapter      (för större scener / multi-doc)
   └─ HttpAdapter           (POST /api/scene — när backend finns)
```

**Konkret skiss för `useAutoSave`:**

```ts
// apps/geometry-sandbox/src/persistence.ts
export interface ScenePersistence {
  save(scene: SceneV1): Promise<void>;
  load(): Promise<SceneV1 | null>;
}

export function localStorageAdapter(key = "pp-scene-v1"): ScenePersistence { /* ... */ }

// apps/geometry-sandbox/src/useAutoSave.ts
export function useAutoSave(state: SandboxState, adapter: ScenePersistence) {
  const lastSavedRef = useRef<string>("");
  const timerRef = useRef<number>();
  useEffect(() => {
    const scene = serializeScene({
      plot: { northRotationDeg: state.plot.northRotationDeg, location: state.plot.location },
      boundary: state.plot.boundaryRect,
      rectangles: state.rectangles,
    });
    const json = JSON.stringify(scene);
    if (json === lastSavedRef.current) return;
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      lastSavedRef.current = json;
      adapter.save(scene).catch(/* expose status via setState */);
    }, 500); // debounce
    return () => window.clearTimeout(timerRef.current);
  }, [state.rectangles, state.plot, adapter]);
}
```

**Designval och varför:**

- **Debouncing 500 ms** — undviker write per drag-tick. Reducerns canonicalization sker redan vid varje action, så vad vi sparar är alltid integer-mm.
- **Lyssnar enbart på `state.rectangles` och `state.plot`** — `viewport`, `sun`, `selectedId`, `snapToGrid` är **session-state** (inte scen-state, ADR-007/008). Att exkludera dem speglar exakt vad `serializeScene` redan filtrerar bort.
- **Adapter-mönster** — gör att FAS 3 kan svänga in en HTTP-backend utan att röra reducern eller App.tsx. Behöver inte introducera ett state-bibliotek.
- **Dirty-detection via JSON-strängjämförelse** — billig och korrekt eftersom canonicalized state är deterministisk.
- **Bootstrap-flow:** vid mount kör `adapter.load()` → om scen finns: `dispatch({ type: "loadScene", scene })`; om inte: behåll `makeInitialState()`. Visa en spinner under load för att undvika "blink" där default-bäddarna syns och sedan ersätts.

**Synlig statusindikator i Toolbar:** "Sparad ⏵ kl 14:32" / "Sparar…" / "Offline — väntar på anslutning". Ge användaren förtroende att inget förloras. Lägg gärna till en `data-pp-status` chip vid sidan av Spara-knappen.

**Beakta:**
- LocalStorage är ~5 MB. För typiska scener (några dussin rektanglar) räcker det väl, men IndexedDB är bättre om multi-scen läggs till senare.
- **Conflict mellan auto-save och manuell "Ladda"-knapp:** efter `loadSceneFromFile` ska `lastSavedRef` resettas så scenet sparas direkt under det nya namnet/nyckeln.
- **Privacy-läge (Safari)** kastar `QuotaExceededError`. Adapter ska fånga detta och visa varning, inte krascha (mönster finns redan i `App.tsx:67` för tema-localStorage).

---

## 3. Förslag på UX-förbättringar

Rangordnat efter värde-per-arbetstimme.

### 3.1 Multi-select + duplicera (Cmd/Ctrl+D, Cmd/Ctrl+klick)
Idag kan endast en bädd väljas. För riktiga köksträdgårdar med 10+ bäddar är duplikation av "samma bädd-typ" centralt. Konkret: utöka `selectedId: string | null` → `selectedIds: Set<string>`, lägg till `duplicateSelected`-action som offsetar 600 mm (samma offset som `commitAddRect` i `Toolbar.tsx:124`). Boxselektion via shift-drag på tomrum (idag pannar tomrums-drag — gör shift-modifier för box).

### 3.2 Kortkommandon för vanliga operationer
Idag finns endast undo/redo. Tillägg som följer redan etablerade konventioner:
- `Delete`/`Backspace` → `removeSelected`
- `R` → påbörja rotation, `Esc` → avbryt drag
- `+`/`-` → zoom in/ut centrerat på vald bädd (eller cursor)
- `F` → "fit to view" (auto-pan/zoom så alla bäddar syns) — kräver AABB-union-funktion, finns redan i `aabb.ts`
- `G` → toggla snap-to-grid
- Piltangenter → nudga vald bädd 1× grid-step (10× med shift)

Lägg en "Kortkommandon"-modal (`?`-tangent) så användaren upptäcker dem.

### 3.3 Sun-path-visualisering på canvas
För **växt­placerings­beslut** är "var faller skuggan över dagen" mer användbart än "var faller skuggan kl 14:00". Rita en svag heatmap (eller fjäder­fanade skuggor i 1-h-steg) av skuggornas svep från 06–20 vid valt datum. Datat finns redan: `sampleSunHourly` + `projectShadow` per timme. Toggle bredvid `Skuggor`-checkboxen: `Sol-svep`. Detta kompletterar `bedSunHours`-siffran i SidePanel med visuell förklaring av *varför* den är som den är.

### 3.4 Linjal/avstånd-mätare och dimensions-overlay
När man placerar en bädd vill man veta: "är det 80 cm till nästa rad så jag får plats med skottkärran?" Verktyg:
- Klicka två punkter → visa avstånd i mm/cm/m längs canvas.
- Visa **alltid** kant-till-kant-avstånd mellan vald bädd och dess närmaste granne (litet mått-tag i grått). Datat finns delvis i `overlap.ts` — projektion-overlap kan utvidgas till signed distance.
- Pil/mått-overlay under drag visar redan W×H (`Canvas.tsx:165`); utöka med Δx/Δy från startposition.

### 3.5 "Ny scen"-knapp + scen-bibliotek
Auto-save löser persistens men skapar ett nytt problem: hur **börjar man om**? Behövs:
- "Ny scen" (rensar + sparar tom scen).
- Lokala "snapshots" / namngivna scener (utöka adapter-API till `list()`/`save(name, scene)`/`load(name)`). Användare vill jämföra "köksträdgård 2026" vs "köksträdgård 2027".
- Export till PNG (canvas-snapshot) för utskrift/delning — `canvas.toDataURL("image/png")` är trivialt och ger mycket värde för odlare som vill skissera på papper bredvid.

### 3.6 (Bonus) Bädd-namn och anteckningar
`Rect` har bara `id` (`rect-1`, `rect-2`). Lägg till valfritt `label?: string` och `notes?: string` (kräver `SCENE_VERSION` bump till 2 + migration som per CLAUDE.md). I SidePanel: "Tomater 2026", "Sallad — sätts ut v.18". Det förvandlar verktyget från geometri-leksak till **planeringsdokument**.

---

## Sammanfattning för prioritering

| # | Förslag | Effort | Värde |
|---|---|---|---|
| 2.1 | Tid: `makeInitialState(now)` | XS | Hög (bug-fix-karaktär) |
| 2.2 | Auto-save via adapter + `useAutoSave` | M | Mycket hög |
| 3.2 | Kortkommandon | S | Hög |
| 3.5 | Ny scen + PNG-export | S | Hög |
| 3.1 | Multi-select + duplicate | M | Hög |
| 3.4 | Mätverktyg | M | Medel |
| 3.6 | Bädd-namn (scene v2) | S | Medel |
| 3.3 | Sun-path-visualisering | M-L | Medel-hög (signaturfeature) |

Föreslår att börja med 2.1 (trivial), sedan 2.2 (frigör user för att våga experimentera utan att förlora arbete), sedan 3.2 + 3.5 som lågt-hängande UX-frukt innan de större 3.1/3.3.
