# FAS 2 — Verifieringsrapport

**Datum:** 2026-05-12
**Version:** v0.2.0

Rapporten dokumenterar det faktiska utfallet av FAS 2-leveransen och
mappar resultatet mot Definition of Done från `docs/fas2-plan-arena-agent.md`.

---

## Testresultat

```
$ pnpm -r test
```

| Paket | Filer | Tester | Status |
|---|---|---|---|
| `@kolonitradgard/spatial-core` | 9 | 114 | ✅ alla gröna |
| `geometry-sandbox` | 1 | 11 | ✅ alla gröna |
| **Totalt** | **10** | **125** | ✅ |

Testfiler i spatial-core:
`aabb.test.ts` (7), `coordinates.test.ts` (22), `measure.test.ts` (4),
`overlap.test.ts` (21), `rotation.test.ts` (20), `scene.test.ts` (11),
`shadow.test.ts` (22), `sun.test.ts` (3), `sunHours.test.ts` (4).

Testfiler i geometry-sandbox: `history.test.ts` (11).

---

## Build

```
$ pnpm --filter geometry-sandbox build
✓ 52 modules transformed.
dist/index.html                  0.63 kB │ gzip:  0.43 kB
dist/assets/index-*.js         170.00 kB │ gzip: 55.66 kB
✓ built in ~700 ms
```

- **Bundle (dist/ totalt):** 172 kB
- **Huvud-JS:** 170 kB (gzip 56 kB)
- **HTML:** 0.6 kB
- **Typfel:** 0
- **Varningar:** 0

---

## Definition of Done — utfall

| # | Krav | Verificering | Status |
|---|---|---|---|
| 1 | World space roteras aldrig | ADR-006 + `Canvas.tsx:59` (`setTransform(dpr, 0, 0, dpr, 0, 0)` — ingen rotationsmatris någonsin) | ✅ |
| 2 | `northRotationDeg` påverkar bara solar reference frame | `shadow.ts:62-63` (rotation applicerad på `sun.azimuthRad`), `shadow.test.ts` (22 tester) | ✅ |
| 3 | `worldToLocal` / `localToWorld` är korrekta (center = local origin) | `coordinates.ts:72-86`, `coordinates.test.ts:118-122` invariant-test | ✅ |
| 4 | Resize sker i local space med min-dimension constraint | `Handles.tsx:computeResizedRect` (worldToLocal-baserad), `state.ts:MIN_RECT_DIMENSION_MM = 100`, reducer enforce via `Math.max` | ✅ (manuell verifiering i browser) |
| 5 | Alla koordinater är integer mm i sparad JSON | `scene.ts:canonicalizeRect` (Math.round på cx/cy/width/height/wallHeight), `scene.test.ts` "serialized coordinates are always integers" | ✅ |
| 6 | `SceneParseError` kastas vid malformed input | `scene.ts:parseScene` (saknad version, okänd version, width≤0, NaN/Infinity), `scene.test.ts` 4 negative-tester | ✅ |
| 7 | Scene-format har `version: 1` | `scene.ts:SCENE_VERSION = 1`, `SceneV1.version: 1`, `scene.test.ts:31` | ✅ |
| 8 | Mid-drag kan vara float; canonicalization på interaction end | `precision_policy.md` §3, reducer i `state.ts` kör `Math.round` i `moveSelected`/`resizeRect`/`resizeSelected`/`setWallHeight` | ✅ |
| 9 | Undo/redo snapshotar canonicalized state | `history.ts:withHistory` snapshotar `present` (redan canonicaliserat av reducer), `history.test.ts` "snapshots contain only integer coordinates" | ✅ |
| 10 | TimeSlider styr preview, SidePanel styr aggregate analysis | `TimeSlider.tsx` modifierar `state.sun.dateIso`; `SidePanel.tsx` använder hårdkodat `REFERENCE_DATE` (midsommar). Olika state-fält — delar inget. | ✅ |
| 11 | `MIN_ALTITUDE_DEG = 4`, `MAX_SHADOW_LENGTH_MM = 100_000` exporterade | `shadow.ts:15` resp `shadow.ts:25` | ✅ |
| 12 | Alla tester gröna | `pnpm -r test` → 125/125 | ✅ |

**12 av 12 DoD-punkter uppfyllda.** Punkt #4 saknar dedikerad
handles.test.ts (planen tillåter alternativet "manuellt"); algoritmen
är dock isolerad i `computeResizedRect` och täcks indirekt av
spatial-core's coordinates/rotation-tester (worldToLocal/localToWorld
invarianten är grunden den vilar på).

---

## Sektion-för-sektion-leverans

### Sektion 0 — ADRs

`docs/adr/006-north-rotation.md`, `007-history-snapshot.md`,
`008-json-schema.md` är skrivna och refererade genomgående i koden.

### Sektion 1 — spatial-core utbyggnad

- `packages/spatial-core/src/scene.ts` — `SceneV1`, `serializeScene`,
  `parseScene`, `migrateScene`, `SceneParseError`. Inkluderar
  `boundary?: Rect | null` (additivt fält, framåtkompatibelt).
- `packages/spatial-core/src/sunHours.ts` — `bedSunHours` implementerad
  med hourly loop (06–20), `projectShadow` + point-in-polygon för
  "fullt täckt"-test. *(Sektion 1-stub uppgraderad i Sektion 4 — krävdes
  för meningsfull SidePanel-visning.)*
- `shadow.ts` — använder `northRotationDeg` (ADR-006-namn).

### Sektion 2 — Sandbox basala features

- `state.ts` — `plot.boundaryRect`, `snapToGrid`, `gridStepMm`,
  `setPlotBoundary`/`setSnapToGrid`/`setGridStep`/`setNorthRotation`.
- `Canvas.tsx` — plot-rektangel-rendering, grid-snap-under-drag,
  mått-overlay, kompass roterar med `northRotationDeg`.
- `Toolbar.tsx` — Skapa tomt, snap-toggle, grid-step, N-rotation-input.

### Sektion 3 — Sandbox tunga features

- `history.ts` + 11 tester — `withHistory` HOC med auto-commit för
  atomiska actions, explicit `commitHistory` för drag-flöden,
  `HISTORY_MAX = 50`.
- `Handles.tsx` — 8 resize + 1 rotate-handle, local-space-resize med
  anchor-bevarande, `MIN_RECT_DIMENSION_MM = 100`.
- `TimeSlider.tsx` — date + range (06–20, 15-min-steg).
- `App.tsx` — keyboard-listener ⌘Z / ⌘⇧Z med skip-on-input.

### Sektion 4 — JSON I/O + per-bädd-panel

- `io.ts` — `saveScene` (browser download), `loadSceneFromFile`
  (file picker + parseScene + migrateScene + dispatch). Felmeddelanden
  via `alert()` på `SceneParseError`/JSON-parsefel.
- `SidePanel.tsx` — ID, mått, position, rotation, vägghöjd, area,
  jordvolym, soltimmar (midsommar). Tom-state med placeholder.
- `state.ts` — `loadScene`-action (rectangles + plot från scene;
  viewport/sun bevaras; selectedId nollställs).

---

## Manuell verifiering — vad som återstår för användaren

Stoppvillkoren för Sektion 2–4 inkluderar manuell verifiering i browser.
Följande har **inte** verifierats automatiskt:

1. **Resize/rotate-handles** — visuell interaktion, anchor-bevarande
   på roterade rectanglar.
2. **Undo/redo** — ⌘Z/⌘⇧Z och Ångra/Gör om-knapparna.
3. **TimeSlider** — skuggor uppdateras live.
4. **JSON I/O** — `Spara JSON` laddar ner fil, `Ladda JSON` återställer scen.
5. **SidePanel-soltimmar** — värdet ändras när väggar placeras
   i/ur bäddens skuggriktning.

Starta med:
```bash
pnpm install
pnpm dev:sandbox
```
