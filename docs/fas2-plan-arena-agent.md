# FAS 2 — Exekveringsplan för Arena.ai Agent Mode

> **Förutsättning:** Workspacen `kolonitradgardsplaneraren/` är öppen i Arena Agent Mode.
> Referera `docs/fas2-scope.md` och detta dokument per sektion.
> Planen är skriven för EN agent i single-session-flöde.

---

## Arkitekturkontrakt — läs detta först

Följande dokument är **normativa**. De styr alla beslut i FAS 2.
Om implementation avviker från dessa — implementationen har fel.

| Dokument | Vad det styr |
|---|---|
| `docs/spatial_rules.md` | Koordinatsystem, rotation, kollision, skuggor |
| `docs/precision_policy.md` | Integer mm i lagring, float OK internt, canonicalization-tidpunkter |
| `docs/state_architecture.md` | State-shape, reducer-mönster, sidoeffekter |
| `docs/adr/005-fas15-spatial-hardening.md` | FAS 1.5-beslut om local transforms, northOffsetDeg, shadow clamping |
| `docs/adr/006-north-rotation.md` | (skrivs i Sektion 0) Auktoritativt beslut om northRotationDeg-semantik |
| `docs/adr/007-history-snapshot.md` | (skrivs i Sektion 0) Undo/redo-strategi |
| `docs/adr/008-json-schema.md` | (skrivs i Sektion 0) Scene-format och versionering |

**Dessa dokument ändras inte per sektion utan att ett nytt ADR skrivs.**

---

## Fundamentalt spatial-kontrakt (FAS 1.5 — ej förhandlingsbart)

```
WORLD SPACE ROTATES NEVER.
```

World coordinates är ett stabilt canvas-koordinatsystem:
- Origin = top-left
- X → höger
- Y → nedåt
- Inga geografiska semantiker inbyggda

`northRotationDeg` (alias `northOffsetDeg` i FAS 1.5-koden) beskriver
**hur solarreferensramen förhåller sig till world space** — den roterar
aldrig world space självt. Skugg- och solberäkningar transformerar
sin input via `northRotationDeg`. Canvas, Rect-koordinater och
viewport förblir opåverkade.

**Compass-rendering:** Kompassen roteras visuellt med `northRotationDeg`
för att visa geografisk orientering — den påverkar inte koordinater.

**Refaktoreringsformuläring för shadow.ts:**
> "Rotate the solar reference frame using northRotationDeg
> without rotating world coordinates."

---

## Precision-policy (FAS 1.5 — genomgående i FAS 2)

Från `docs/precision_policy.md`:

| Fas | Koordinattyp | Regel |
|---|---|---|
| Mid-drag | float | OK — ger smidig rörelse |
| onPointerUp / interaction end | integer mm | `roundToWorldMm()` obligatorisk |
| Undo/redo-snapshot | integer mm | Endast canonicalized state snapshotas |
| JSON persistence | integer mm | Inga floats i sparad fil |
| Grid snapping | separat | `snapToGrid()` ≠ `roundToWorldMm()` |

Dessa regler gäller i Sektion 2, 3 och 4 utan undantag.

---

## Skillnader mot en multi-agent-plan

| Aspekt | Multi-agent | Arena Agent Mode |
|---|---|---|
| Parallellism | Flera terminaler | Parallella `write_file` i ett `<function_calls>`-block |
| Modellval | Explicit per agent | Implicit — routern väljer |
| Kontextbärare | REPO_MAP + `.claude/CLAUDE.md` | `docs/fas2-*.md` i workspacen |
| Sektion-storlek | Liten per agent | Hel feature per turn |
| Verifiering | Subagent rapporterar | Agent fixar direkt inom turn |

**Optimerings-spelplan:**
1. Korta specifika prompts. Optimal: *"Kör sektion 2 enligt fas2-plan-arena-agent.md"*.
2. Läs aldrig hela repot per turn — öppna bara filer som faktiskt ändras.
3. En turn = ett commit-bart leveransblock.
4. Parallella `write_file` i samma block för relaterade filer.
5. Kör `pnpm test` i slutet av varje sektion, inte per fil.

---

## Sektionsöversikt

| Sektion | Innehåll | Turn-storlek |
|---|---|---|
| 0 | ADRs (006, 007, 008) | Liten |
| 1 | spatial-core utbyggnad | Stor |
| 2 | Sandbox basala features | Medelstor |
| 3 | Sandbox tunga features | Stor |
| 4 | JSON I/O + per-bädd-panel | Medelstor |
| 5 | Verifiering, README, CHANGELOG | Liten |

---

## Sektion 0 — ADRs (1 turn, liten)

**Användarprompt-mall:**
> *"Skriv ADR-006, 007 och 008 enligt fas2-plan-arena-agent.md."*

**OBS:** ADR-005 är redan skriven i FAS 1.5 (`docs/adr/005-fas15-spatial-hardening.md`).
Börja på 006.

### Vad agenten gör

Läs `docs/adr/001-2d-first.md` för formatreferens, skriv sedan tre ADRs parallellt:

**ADR-006 — northRotationDeg semantik**

Beslutar:
- `northRotationDeg` är ett geografiskt referensramorientering, inte en world-space-rotation
- World space roteras aldrig
- Skuggberäkningar roterar sin indata (solar azimuth) via `northRotationDeg`
- Canvas och Rect-koordinater påverkas inte
- `northRotationDeg = 0` (default) = world +Y pekar mot geografisk syd (bakåtkompatibelt med FAS 1 och FAS 1.5)
- Kompassen renderas roterad visuellt men påverkar inga koordinater
- Refererar ADR-005 som prejudikat

**ADR-007 — History/undo-redo**

Beslutar:
- Snapshot-baserad undo/redo (inte command-pattern)
- Snapshotar **canonicalized state** (integer mm, aldrig mid-drag-floats)
- Max 50 snapshots i historiken
- Keyboard: ⌘Z / ⌘⇧Z (Mac) och Ctrl+Z / Ctrl+Shift+Z (Win/Linux)
- History lever i `SandboxState` som `past: SandboxState[]` + `future: SandboxState[]`
- Snapshot tas **efter** `roundToWorldMm()` har körts — aldrig mitt i en drag-operation

**ADR-008 — JSON scene-format**

Beslutar:
- Scene-filen har explicit `version`-fält från v1
- Schemastruktur (se Sektion 1 för implementation)
- `migrateScene(raw)` hanterar äldre versioner
- Malformed input kastar `SceneParseError` (aldrig tyst fail)
- Inga floats i sparad fil — integer mm obligatoriskt

### Output

```
docs/adr/006-north-rotation.md
docs/adr/007-history-snapshot.md
docs/adr/008-json-schema.md
```

**Token-budget:** ~6k in, ~4k ut.

---

## Sektion 1 — spatial-core utbyggnad (1 turn, stor)

**Användarprompt-mall:**
> *"Bygg spatial-core-utbyggnaden enligt sektion 1."*

**Läs innan du börjar:**
- `docs/adr/006-north-rotation.md`
- `docs/adr/008-json-schema.md`
- `docs/precision_policy.md`
- `packages/spatial-core/src/shadow.ts` (befintlig implementation)
- `packages/spatial-core/src/types.ts` (befintlig, inkl. `PlotConfig`)

### 1a — Refaktorera shadow.ts

**Befintlig kod** har redan `northOffsetDeg`-parameter i `shadowVector()` och
`projectShadow()` från FAS 1.5. Uppgiften är att:

- Byta namn `northOffsetDeg` → `northRotationDeg` i signaturerna för tydlighet
  (ADR-006 använder detta namn)
- Säkerställa att JSDoc-kommentaren explicit säger:
  *"Rotates the solar reference frame using northRotationDeg — world coordinates are never modified."*
- Verifiera att `MIN_ALTITUDE_DEG = 4` och `MAX_SHADOW_LENGTH_MM = 100_000`
  fortfarande är exporterade konstanter (de ska vara det från FAS 1.5)
- **Uppdatera** `PlotConfig` i `types.ts` om fältnamnet ändras

**Bakåtkompatibilitet:** Default `northRotationDeg = 0` behålls.

### 1b — Skapa scene.ts

```ts
// packages/spatial-core/src/scene.ts

/** Current scene format version. Bump when schema changes. */
export const SCENE_VERSION = 1;

export interface SceneV1 {
  version: 1;
  plot: PlotConfig;
  rectangles: Rect[];
}

/** Union type for all known versions — utökas vid framtida migrering. */
export type Scene = SceneV1;

export class SceneParseError extends Error {
  constructor(message: string, public readonly raw: unknown) {
    super(message);
    this.name = "SceneParseError";
  }
}

/** Serialize SandboxState → JSON-compatible scene object. */
export function serializeScene(state: { plot: PlotConfig; rectangles: Rect[] }): SceneV1

/** Parse and validate raw JSON. Throws SceneParseError on malformed input. */
export function parseScene(raw: unknown): Scene

/** Migrate older scene versions to current. Returns current-version Scene. */
export function migrateScene(scene: Scene): SceneV1
```

**Viktigt:**
- `serializeScene` skriver **aldrig floats** — alla koordinater är integer mm
- `parseScene` kastar `SceneParseError` vid saknat `version`-fält, okänd version,
  ogiltiga dimensioner (width/height ≤ 0), eller NaN/Infinity i koordinater
- Validering inkluderar: `width > 0`, `height > 0`, `wallHeight >= 0`
- Inget tyst fail — aldrig `return null` på malformed input

### 1c — Skapa sunHours.ts

```ts
// packages/spatial-core/src/sunHours.ts

/**
 * Compute the number of direct-sun hours for a rectangle on a given day.
 *
 * Uses hourly samples (06–20) from suncalc.
 * A sample counts as "sun" if the rectangle's footprint is NOT fully covered
 * by any other rectangle's shadow at that hour.
 *
 * northRotationDeg: from PlotConfig — rotates solar reference frame,
 * NOT world coordinates.
 *
 * Returns hours as a float (e.g. 6.0 = 6 full hours).
 */
export function bedSunHours(
  bed: Rect,
  casters: Rect[],
  date: Date,
  loc: GeoLocation,
  northRotationDeg: number,
): number
```

**Semantisk notering:**
`northRotationDeg` passas explicit — `bedSunHours` antar aldrig ett globalt default.
Detta speglar att sunHours-beräkningar är en del av **aggregate summer analysis**,
inte interactive preview (se Sektion 3 för TimeSlider-distinktion).

### 1d — Tester (parallellt med 1a–1c)

Skapa/uppdatera dessa testfiler i ett parallellt block:

**`tests/scene.test.ts`**
- `serializeScene` → `parseScene` round-trip (alla fält bevarade)
- `parseScene` kastar `SceneParseError` vid saknat `version`
- `parseScene` kastar `SceneParseError` vid okänd version (t.ex. `{ version: 999 }`)
- `parseScene` kastar `SceneParseError` vid `width: 0` eller `width: -100`
- `parseScene` kastar `SceneParseError` vid `NaN` eller `Infinity` i koordinater
- `migrateScene` är identity för nuvarande version
- Serialiserade koordinater är aldrig floats (`Number.isInteger` check)

**`tests/sunHours.test.ts`**
- `bedSunHours` vid midsommar nära Landskrona ger > 6 timmar för en ostört placerad bädd
- `bedSunHours` = 0 om en annan bädd med `wallHeight > 0` fullständigt täcker solen alla timmar
- `northRotationDeg = 0` vs `northRotationDeg = 180` ger skild fördelning

**`tests/shadow.test.ts` — utökas med:**
- Namnbytestest: `shadowVector(h, sun, northRotationDeg)` — signatur fungerar
- Bekräfta att `MIN_ALTITUDE_DEG` och `MAX_SHADOW_LENGTH_MM` är exporterade

### 1e — Uppdatera index.ts

Exportera `scene.ts` och `sunHours.ts` från `packages/spatial-core/src/index.ts`.

### Stoppvillkor Sektion 1

`pnpm --filter @kolonitradgard/spatial-core test` — alla tester gröna.
Om något fallerar: fixa inom samma turn (max 2 iterationer), annars rapportera.

**Token-budget:** ~12k in, ~14k ut.

---

## Sektion 2 — Sandbox basala features (1 turn, medelstor)

**Inkluderar:** Plot-rektangel (F1), grid-snap (F4), northRotationDeg i UI (F8), mått-overlay (F10).

**Användarprompt-mall:**
> *"Bygg sandbox basala features enligt sektion 2."*

**Läs innan du börjar:**
- `docs/adr/006-north-rotation.md`
- `docs/precision_policy.md`
- `apps/geometry-sandbox/src/state.ts` (befintlig — har redan `plot.northOffsetDeg`)
- `apps/geometry-sandbox/src/Canvas.tsx`
- `apps/geometry-sandbox/src/Toolbar.tsx`

### 2a — Utöka state.ts

Befintlig `SandboxState` har redan `plot: { northOffsetDeg, location }` från FAS 1.5.

**Uppdateringar:**
- Byt namn `northOffsetDeg` → `northRotationDeg` i state-shape för att matcha ADR-006
  (om ADR-006 väljer det namnet — annars behåll konsekvent med ADR-006)
- Lägg till `plot.boundaryRect: Rect | null` — tomtens yttre rektangel (null = ingen tomt definierad)
- Lägg till `snapToGrid: boolean` (default `false`)
- Lägg till `gridStepMm: number` (default `100`)

**Nya actions:**
```ts
| { type: "setPlotBoundary"; rect: Rect | null }
| { type: "setSnapToGrid"; enabled: boolean }
| { type: "setGridStep"; mm: number }
| { type: "setNorthRotation"; deg: number }  // ersätter setNorthOffset
```

**Precision-policy i reducer:**
`moveSelected` och all annan koordinatmutation canonicaliserar med `Math.round()`
(integer mm) direkt i reducer. Denna policy är **oförändrad från FAS 1.5** —
explicit dokumenteras i en kommentar i reducer-filen.

### 2b — Canvas.tsx — plot-rektangel + snap + mått-overlay

**Plot-rektangel:**
- Om `state.plot.boundaryRect != null`, rendera den med distinkt stil
  (streckad linje, annan färg än beds)
- Plot-rektangeln är inte selekterbar som övriga rects utan hanteras separat

**Grid snap:**
- Om `state.snapToGrid`, applicera `snapToGrid(worldPos, state.gridStepMm)`
  **under** drag, sedan `roundToWorldMm()` **på** `onPointerUp`
- Grid snapping är ett UI-lager ovanpå, aldrig inbyggt i spatial-core-matematik

**Mått-overlay:**
- Under aktiv drag av en bädd: rendera `width × height mm` som text-tooltip nära bäddens center
- Tooltip försvinner när drag slutar

**northRotationDeg → kompass:**
- Kompassen renderas roterad med `northRotationDeg` (visuell rotation av kompassen, ej world)
- Uppdatera `drawCompass()` att ta `northRotationDeg` som parameter (befintlig funktion
  i Canvas.tsx tar redan `northOffsetDeg` från FAS 1.5 — byt namn konsekvent)

**Explicit att INTE göra:**
- Viewport roteras inte
- World-koordinater påverkas inte av `northRotationDeg`
- `setTransform` på canvas-context ändras inte

### 2c — Toolbar.tsx

- "Skapa tomt"-knapp → dispatchat som `setPlotBoundary` med standardstorlek
- Grid-snap toggle + gridStep-input
- `northRotationDeg`-input (befintlig "N-offset"-kontroll — byt label till "N-rotation°")

### Stoppvillkor Sektion 2

`pnpm --filter geometry-sandbox build` utan typfel.
Manuell verifiering: sandbox öppnas, plot-rektangel syns, snap fungerar, kompass roterar.

**Token-budget:** ~12k in, ~10k ut.

---

## Sektion 3 — Sandbox tunga features (1 turn, stor)

**Inkluderar:** Resize handles (F2), rotate handle (F3), undo/redo (F5), TimeSlider (F7).

**Användarprompt-mall:**
> *"Bygg sandbox tunga features enligt sektion 3."*

**Läs innan du börjar:**
- `docs/adr/007-history-snapshot.md`
- `docs/precision_policy.md`
- `packages/spatial-core/src/coordinates.ts` — verifiera att `worldToLocal` / `localToWorld`
  är de **korrigerade FAS 1.5-versionerna** (center = local origin) innan du fortsätter.
  Om de inte är det: stoppas och rapportera — handles får INTE byggas på felaktiga transforms.

### 3a — Dependency-check: local transforms

**Innan något annat i Sektion 3 skrivs**, verifiera att:

```ts
// worldToLocal({ x: rect.cx, y: rect.cy }, rect) === { x: 0, y: 0 }
// localToWorld({ x: 0, y: 0 }, rect) === { x: rect.cx, y: rect.cy }
```

Dessa invarianter testas redan i `tests/coordinates.test.ts` (FAS 1.5).
Kör `pnpm --filter @kolonitradgard/spatial-core test` och bekräfta grönt
**innan** handles-implementationen börjar.

### 3b — history.ts

```ts
// apps/geometry-sandbox/src/history.ts

/**
 * Wraps a reducer to add undo/redo capability.
 *
 * Snapshots are taken ONLY on canonicalized state (integer mm).
 * Never snapshot mid-drag state (floats).
 * Max history depth: 50 snapshots.
 */
export function withHistory<S, A>(
  reducer: (state: S, action: A) => S,
  snapshotActions: A["type"][]  // actions that trigger a snapshot
): (state: HistoryState<S>, action: A | HistoryAction) => HistoryState<S>

export type HistoryAction =
  | { type: "undo" }
  | { type: "redo" }

export interface HistoryState<S> {
  past: S[];
  present: S;
  future: S[];
}
```

**Snapshot-policy (ADR-007):**
- Snapshot tas **efter** interaction-end-actions (t.ex. `moveSelected`, `rotateSelected`,
  `resizeSelected`, `addRect`, `removeSelected`, `setWallHeight`)
- Snapshot tas **inte** vid `setViewport` (pan/zoom) — dessa är viewport-state, inte scene-state
- Snapshot tas **aldrig** vid mid-drag (floats är ej canonicalized)
- All state i snapshot är integer mm (canonicalized av reducer)

**I App.tsx:**
- Wrappa reducer med `withHistory`
- Lägg keyboard-listener: `⌘Z` / `Ctrl+Z` → undo, `⌘⇧Z` / `Ctrl+Shift+Z` → redo

### 3c — Handles.tsx

**Resize handles — local space (explicit):**

```
Resize sker i local space.
```

Algoritm per handle-drag:
1. Konvertera pointer-position till world space med `screenToWorld()`
2. Konvertera till local space med `worldToLocal(worldPos, rect)`
3. Beräkna ny `width` / `height` baserat på delta i local space
4. **Enforce constraints:**
   - `width = Math.max(MIN_RECT_DIMENSION_MM, newWidth)`
   - `height = Math.max(MIN_RECT_DIMENSION_MM, newHeight)`
   - `MIN_RECT_DIMENSION_MM = 100` (10 cm minimum)
   - Negativa dimensioner förbjuds — aldrig `width < 0`
5. Under drag: float OK internt
6. `onPointerUp`: `width = Math.round(width)`, `height = Math.round(height)`
   (`roundToWorldMm`-policy)

**8 resize handles + 1 rotate handle.**

Rotate handle:
1. Konvertera pointer → world
2. Beräkna vinkel från rect center till pointer i world space
3. `rotationDeg` uppdateras som float under drag
4. `onPointerUp`: float bevaras (rotationDeg behöver inte vara integer per precision_policy)

**Visuell rendering:** Handles ritas i Canvas.tsx (eller separat SVG overlay — välj det enklaste).

**Defensiv strategi:** Om handles interagerar problematiskt med pan-drag, dokumentera
kompromissen i `KNOWN_ISSUES.md` och fortsätt. Stoppas inte av UI-polish-buggar.

### 3d — TimeSlider.tsx

**Semantisk distinktion (kritisk — från feedback):**

TimeSlider styr **interactive preview time** — inte aggregate summer analysis.

```
interactive preview time:
  En specifik tidpunkt (datum + timme) för att visa skuggor just nu.
  Styr: state.sun.dateIso
  Används av: Canvas shadow rendering

aggregate summer analysis:
  Per-bädd-beräkning av totala soltimmar en hel sommardag.
  Styr: bedSunHours() i SidePanel (Sektion 4)
  Används av: SidePanel, inte TimeSlider
```

Dessa blandas **aldrig** i samma state-fält.

**TimeSlider implementation:**
- Slider för timme (06–20) på valt datum
- Ändrar `state.sun.dateIso`
- Visar aktuell soltid i UI
- Påverkar **inte** `bedSunHours`-beräkningar (de är separata)

### Stoppvillkor Sektion 3

`pnpm --filter geometry-sandbox build` utan typfel.
Manuell verifiering:
- Resize handles fungerar och respekterar minimum dimensions
- Undo/redo fungerar med ⌘Z/⌘⇧Z
- TimeSlider ändrar skuggor i realtid

**Token-budget:** ~16k in, ~15k ut.

---

## Sektion 4 — JSON I/O + per-bädd-panel (1 turn, medelstor)

**Inkluderar:** JSON persistence (F6), per-bädd soltimmar (F9).

**Användarprompt-mall:**
> *"Bygg JSON I/O och per-bädd-panel enligt sektion 4."*

**Läs innan du börjar:**
- `docs/adr/008-json-schema.md`
- `docs/precision_policy.md`
- `packages/spatial-core/src/scene.ts` (från Sektion 1)
- `packages/spatial-core/src/sunHours.ts` (från Sektion 1)

### 4a — io.ts

```ts
// apps/geometry-sandbox/src/io.ts

/** Trigger browser file-download of the current scene as JSON. */
export function saveScene(state: SandboxState): void

/** Open file picker, parse scene, dispatch loadScene action. */
export async function loadSceneFromFile(
  dispatch: Dispatch<Action>
): Promise<void>
```

**Precision-policy i io.ts:**
- `saveScene` anropar `serializeScene(state)` från spatial-core
- `serializeScene` garanterar integer mm — inga floats i JSON
- `loadSceneFromFile` anropar `parseScene(raw)` som kastar `SceneParseError` vid ogiltigt format
- Vid `SceneParseError`: visa ett tydligt felmeddelande i UI (alert eller inline), aldrig tyst fail
- `migrateScene()` anropas efter parse för att hantera äldre versioner

**Ny action i state.ts:**
```ts
| { type: "loadScene"; scene: SceneV1 }
```

Reducer sätter `rectangles`, `plot` från scene. Viewport och sun-inställningar
behålls (de är session-state, inte scene-state).

### 4b — SidePanel.tsx

```tsx
// apps/geometry-sandbox/src/SidePanel.tsx
```

Visar för markerad bädd:
- `width × height mm` (dimensioner)
- `wallHeight mm` (om satt)
- `rotationDeg°`
- Area i m²
- Jordvolym i liter (givet `bedDepth`)
- **Soltimmar per sommardag** (aggregate analysis — se nedan)

**Soltimmar — aggregate summer analysis:**

```ts
// Körs inte i realtid — beräknas en gång när selection ändras
const hours = bedSunHours(
  selectedRect,
  allOtherRects,
  new Date(2025, 5, 21),   // midsommar, fast referensdatum
  state.plot.location,
  state.plot.northRotationDeg,
);
```

**Distinktion mot TimeSlider:**
- TimeSlider ändrar `state.sun.dateIso` och styr Canvas shadow preview
- SidePanel beräknar `bedSunHours` på fast referensdatum oberoende av TimeSlider
- De delar **inget** state-fält

**Toolbar-knappar:**
- "Spara (JSON)" → `saveScene(state)`
- "Ladda (JSON)" → `loadSceneFromFile(dispatch)`

### Stoppvillkor Sektion 4

`pnpm --filter geometry-sandbox build` utan typfel.
Manuell verifiering:
- Spara skapar en JSON-fil med `version: 1` och integer-koordinater
- Ladda återställer bäddar och plot korrekt
- SidePanel visar soltimmar för markerad bädd

**Token-budget:** ~10k in, ~9k ut.

---

## Sektion 5 — Verifiering, README, CHANGELOG (1 turn, liten)

**Användarprompt-mall:**
> *"Kör verifiering och skriv docs enligt sektion 5."*

### Vad agenten gör

1. Kör `pnpm -r test` — alla tester ska vara gröna. Rapportera exakt antal.
2. Kör `pnpm --filter geometry-sandbox build` — bygg ska lyckas utan varningar.
3. Mäta bundle-storlek (rapportera `dist/` total).
4. Mappa mot Definition of Done (nedan) — checka av varje punkt explicit.
5. Skriv `docs/fas2-verification.md` med faktiskt utfall (testantal, bundle-storlek, DoD-status).
6. Uppdatera `README.md` med FAS 2-features.
7. Skriv `CHANGELOG.md` (v0.2.0).

### Definition of Done — FAS 2

| # | Krav | Verificering |
|---|---|---|
| 1 | World space roteras aldrig | ADR-006 + kodgranskning |
| 2 | `northRotationDeg` påverkar bara solar reference frame | `shadow.test.ts` |
| 3 | `worldToLocal` / `localToWorld` är korrekta (center = local origin) | `coordinates.test.ts` |
| 4 | Resize sker i local space med min-dimension constraint | `handles.test.ts` eller manuellt |
| 5 | Alla coordinater är integer mm i sparad JSON | `scene.test.ts` |
| 6 | `SceneParseError` kastas vid malformed input | `scene.test.ts` |
| 7 | Scene-format har `version: 1` | `scene.test.ts` |
| 8 | Mid-drag kan vara float, canonicalization sker på interaction end | Kodgranskning |
| 9 | Undo/redo snapshotar canonicalized state | `history.test.ts` eller ADR-007 |
| 10 | TimeSlider styr preview, SidePanel styr aggregate analysis | Kodgranskning + manuellt |
| 11 | `MIN_ALTITUDE_DEG = 4`, `MAX_SHADOW_LENGTH_MM = 100_000` är exporterade | Befintliga tester |
| 12 | Alla tester gröna | `pnpm -r test` |

**Token-budget:** ~6k in, ~4k ut.

---

## Total token-uppskattning

| Sektion | Input ≈ | Output ≈ |
|---|---|---|
| 0. ADRs | 6k | 4k |
| 1. spatial-core | 12k | 14k |
| 2. sandbox basics | 12k | 10k |
| 3. sandbox tunga | 16k | 15k |
| 4. I/O + panel | 10k | 9k |
| 5. verifiering + docs | 6k | 4k |
| **Totalt** | **~62k** | **~56k** |

---

## Hur du som användare optimerar Arena-flödet

1. **En sektion per meddelande.** Inte "kör hela FAS 2" — då förlorar vi felsökningskontext.
2. **Be om stopp efter sektion N** för att granska innan nästa.
3. **Namnkonsistens-påminnelse är gratis:** *"Kom ihåg: northRotationDeg, inte northOffsetDeg"*
   är billigare än att agenten re-läser ADR-006.
4. **Workspace = source of truth.** Säg explicit om du ändrat något manuellt.
5. **Vid blockering:** agenten genererar `ask_user`-frågor — svara dem istället för att gissa.

---

## Kvarstående riskområden

Se separat sektion nedan.
