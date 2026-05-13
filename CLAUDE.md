# Trädgårdsplan — Claude Code-instruktioner

Spatialt 2D-planeringsverktyg för köksträdgårdar. pnpm-workspace med en ren matematik-kärna och en React/Canvas-sandbox. Repot är just nu i FAS 2.

## Workspace-layout

```
/packages/spatial-core      ren TypeScript, all spatial matematik (inget UI, inget state)
/apps/geometry-sandbox      React + Canvas — den interaktiva sandboxen
/apps/solar-prototype       prototyp, ignorera om inget annat sägs
/docs/spatial_rules.md      NORMATIVT — koordinatsystem, rotation, kollision, skuggor
/docs/precision_policy.md   NORMATIVT — integer mm vs floats
/docs/state_architecture.md NORMATIVT — state-shape, dataflöde
/docs/adr/                  arkitekturbeslut (immutable historik)
```

`spatial-core` exporteras som `@kolonitradgard/spatial-core` via `workspace:*`. Sandboxen importerar derifrån — **aldrig tvärtom**. Spatial-core har noll runtime-deps utöver `suncalc`.

## Normativa kontrakt — bryts ej utan ny ADR

Dokumenten i `/docs` och ADR:erna är **normativa**: om koden avviker har koden fel. Läs alltid det relevanta dokumentet före ändringar av spatial matematik, state-shape eller scene-formatet.

### Spatial regler (det viktigaste)

- **Enhet:** All world-koordinat i `Rect.cx/cy/width/height/wallHeight` lagras som **integer mm**. Floats är tillåtna **internt** i beräkningar men aldrig i lagrad state eller på disk.
- **World space:** origin top-left, +X höger, +Y nedåt. World space har **ingen geografisk semantik** (ADR-005, ADR-006). Norr/syd/öst/väst hanteras enbart via `PlotConfig.northRotationDeg` som roterar *solar reference frame*, aldrig world coordinates.
- **Objekttyp:** Endast roterade rektanglar (OBB) i v1 (ADR-002). Inga polygoner, cirklar eller fri-form. En L-formad bädd = två rektanglar.
- **Rotation:** Grader, **medurs (clockwise)** i vårt y-nedåt-system, kring rektangelns **centerpunkt**. Standardmatris `[cos, -sin; sin, cos]` ger visuellt clockwise i y-down — se `rotation.test.ts`.
- **Width vs height vs wallHeight:** `width` = extent längs *lokala +X* före rotation; `height` = extent längs *lokala +Y*; `wallHeight` = **vertikal extruderings-höjd för skugga**, inte rektangelns y-extent. Blanda inte ihop.
- **Local coordinates** (FAS 1.5): `worldToLocal()`/`localToWorld()` har origo i rektangelns center, axlarna längs `width`/`height`. En punkt är inuti om `|lx| ≤ width/2 && |ly| ≤ height/2`.
- **Kollision:** SAT över 4 unika axlar. Overlap förbjudet, edge-touch tillåtet. Epsilon `1e-6` mm för projektion (`rectOverlap`, `rectEdgeTouch`).
- **Skuggor:** Hårda skuggor från vertikalt extruderade OBB:er. Clampning: `MIN_ALTITUDE_DEG = 4`, `MAX_SHADOW_LENGTH_MM = 100_000`. Sol under horisonten (`altitudeRad <= 0`) → ingen skugga. `shadowVector()` tar `northRotationDeg` som parameter men modifierar **aldrig** world-koordinater.
- **Minsta dimension:** `MIN_RECT_DIMENSION_MM = 100`. `width` och `height` måste vara > 0; NaN/Infinity är förbjudna och valideras i `parseScene()`.

### Canonicalization-policy

`screen → world → [mid-drag float OK] → onDragEnd → (snapToGrid?) → roundToWorldMm → state`. Reducern kör `Math.round` på alla koordinatmutationer (`moveSelected`, `resizeSelected`, etc.); det är där canonicalization sker. `snapToGrid()` (UI) och `roundToWorldMm()` (matematisk invariant) är **separata** funktioner — blanda inte ihop. `snapToWorldMm` är en deprecated alias för `roundToWorldMm` (tas bort innan FAS 2-slut).

## State-arkitektur (ADR-004, ADR-007)

- **Inget state-management-library.** Endast `useState`, `useReducer`, `React.Context` (om prop drilling > 3 nivåer). Inte Redux, Zustand, Jotai. Att introducera ett library kräver ny ADR.
- **Sandboxens state lever i `apps/geometry-sandbox/src/state.ts`** som en `useReducer` med ren `(state, action) => state`-funktion. Hela `SandboxState` (rectangles, viewport, sun, plot, gridStep) bor där.
- **Undo/redo via snapshots, inte command-pattern** (ADR-007). `withHistory()` (`history.ts`) är en higher-order reducer kring sandboxens reducer. `past` är capped till `HISTORY_MAX = 50`. Snapshots tas:
  - **Auto-commit** för atomic actions: `addRect`, `removeSelected`, `setWallHeight`, `setNorthRotation`, `setLocation`, `setPlotBoundary`, `loadScene` (se `AUTO_COMMIT_ACTIONS` i `App.tsx`).
  - **Explicit `commitHistory`** för drag-bursts (`pointerDown` dispatchar en commit så hela draggen blir ett enda snapshot).
  - **Aldrig** vid `setViewport` eller `setSun` (interaktiva preview-värden, undo:as inte).
- Snapshots innehåller **endast canonicalized state** — float-koordinater får aldrig hamna i `past`/`present`/`future`.

## Scene-format (ADR-008)

- `SceneV1` har explicit `version: 1`. Bumpa `SCENE_VERSION` i `packages/spatial-core/src/scene.ts` vid schemaändring och skriv migration i `migrateScene()`.
- `serializeScene()` skriver **aldrig floats** — alla koordinater rundas via `canonicalizeRect`. `rotationDeg` får vara float.
- `parseScene()` kastar `SceneParseError` vid: saknad/okänd version, `width/height ≤ 0`, NaN/Infinity. **Inga tysta fel** — `return null` är förbjudet.

## Spatial-core API — orienteringskarta

| Modul | Exporterar |
|---|---|
| `types.ts` | `Point`, `Vec2`, `AABB`, `Rect`, `GeoLocation`, `SunPosition`, `PlotConfig`, `DEFAULT_PLOT_CONFIG` |
| `rotation.ts` | `degToRad`, `radToDeg`, `rotatePoint`, `rectCorners`, `rectAxes` |
| `coordinates.ts` | `worldToScreen`, `screenToWorld`, `worldToLocal`, `localToWorld`, `roundToWorldMm`, `snapToGrid`, deprecated `snapToWorldMm` |
| `overlap.ts` | `rectOverlap` (strict), `rectEdgeTouch`, `rectIntersects` |
| `aabb.ts` | AABB-helpers |
| `shadow.ts` | `shadowVector`, `projectShadow`, `convexHull`, `MIN_ALTITUDE_DEG`, `MAX_SHADOW_LENGTH_MM` |
| `sun.ts` | `sunPositionAt`, `sampleSunHourly`, `DEFAULT_LOCATION` (Landskrona) |
| `sunHours.ts` | `bedSunHours` (timsampel 06–20, full-coverage-approximation) |
| `measure.ts` | `rectAreaMm2`, `rectAreaM2`, `bedSoilVolumeLitres` |
| `scene.ts` | `SCENE_VERSION`, `SceneV1`, `parseScene`, `serializeScene`, `migrateScene`, `SceneParseError` |

Allt re-exporteras från `packages/spatial-core/src/index.ts`. Lägg till nya moduler där.

Spatial-core är **rent funktionell**: inget state, inga sidoeffekter (utom att `suncalc` kallas med en `Date`), inga DOM-referenser, ingen persistens. Det ska gå att köra varje funktion deterministiskt i en test-runner utan mocks.

## Workspace-verktyg

Node ≥ 20. Pakethanterare är **pnpm 9** (låst i `packageManager`-fältet). Använd inte npm/yarn.

```bash
pnpm install                                # installera alla deps
pnpm test                                   # kör alla tester i alla paket (Vitest)
pnpm build                                  # bygg sandboxen (tsc -b && vite build)
pnpm dev:sandbox                            # starta geometry-sandbox på http://localhost:5173

pnpm --filter @kolonitradgard/spatial-core test       # bara core-tester
pnpm --filter @kolonitradgard/spatial-core typecheck  # tsc --noEmit
pnpm --filter geometry-sandbox test                   # bara sandbox-tester
pnpm --filter geometry-sandbox dev                    # samma som dev:sandbox
```

- **Test-ramverk:** Vitest i båda paketen. Core kör i `environment: "node"`. Lägg core-tester i `packages/spatial-core/tests/*.test.ts` och sandbox-tester i `apps/geometry-sandbox/tests/*.test.ts`.
- **TypeScript:** Root `tsconfig.base.json` kör strict mode med `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noFallthroughCasesInSwitch`. Respektera dessa — undvik `as`-casts utan motivering.
- **Module-stil:** ESM (`"type": "module"`). Importer från syskon-moduler i core använder `.js`-suffix trots `.ts`-källfil (`from "./types.js"`) — det är NodeNext/Bundler-konvention, behåll det.
- **Imports från spatial-core till sandboxen:** alltid `from "@kolonitradgard/spatial-core"`, aldrig relativ sökväg in i `packages/`.

## Konventioner för ändringar

- **Lägg inte till features utanför produkt-scope** (`docs/product_scope.md`). Explicit ut-scope: 3D, polygoner, plant catalog, persistens-backend, auth, multi-user. Om du tror något kräver detta — fråga först.
- **Spatial matematik** (`packages/spatial-core`) ska skrivas testbart. Skriv en test i `tests/` innan du anser dig klar. Existerande testfiler är förebild för stil.
- **Ändrar du scene-formatet** → bumpa `SCENE_VERSION`, lägg till migration, skriv test.
- **Ändrar du state-shape eller en kärnregel** → uppdatera relevant dokument i `/docs` i samma ändring, alternativt skriv ny ADR (`docs/adr/00X-...md`) om det är ett arkitekturbeslut.
- **Default-plats:** Landskrona, Sverige (lat 55.8708, lon 12.83). Hardcoda inte andra koordinater utan anledning.
