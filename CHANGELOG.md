# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioner följer [SemVer](https://semver.org/).

## [0.2.0] — 2026-05-12

FAS 2 — interaktiv sandbox.

### Added

#### spatial-core
- `scene.ts` — `SceneV1`-format med `version: 1`, `serializeScene`,
  `parseScene` (kastar `SceneParseError` på malformed input),
  `migrateScene` (identity för v1). Inkluderar `boundary?: Rect | null`
  (additivt, framåtkompatibelt).
- `sunHours.ts` — `bedSunHours(bed, casters, date, loc, northRotationDeg)`
  med hourly loop 06–20, point-in-polygon "fullt täckt"-test,
  honorerar `northRotationDeg`.
- ADR-006/007/008 är beslutsstyrande för FAS 2-implementationen.

#### geometry-sandbox
- **Plot-rektangel** — `plot.boundaryRect` renderas med streckad
  kontur, separat från beds.
- **Grid-snap** — under aktiv drag, konfigurerbar `gridStepMm`.
- **Mått-overlay** — visar `width × height mm` under drag.
- **Kompass** — roteras visuellt med `northRotationDeg`; world space
  påverkas aldrig (ADR-006).
- **Resize-handles** — 8 stycken (nw/n/ne/e/se/s/sw/w), local-space-resize
  med anchor-bevarande, `MIN_RECT_DIMENSION_MM = 100`.
- **Rotate-handle** — fri rotation runt rect-center, `rotationDeg`
  bevaras som float.
- **Undo/redo** — snapshot-baserad, max 50 historik-poster, ⌘Z / Ctrl+Z
  och ⌘⇧Z / Ctrl+Shift+Z (skip på input-fält).
- **TimeSlider** — date-input + range-slider (06–20, 15-min-steg) styr
  `state.sun.dateIso` (interaktiv preview-tid).
- **SidePanel** — per-bädd-inspektor med ID, mått, position, rotation,
  vägghöjd, area, jordvolym, soltimmar (aggregate analys på fast
  referensdatum, oberoende av TimeSlider).
- **JSON I/O** — Spara/Ladda-knappar; `saveScene` triggar browser-download
  av `scene.json`, `loadSceneFromFile` öppnar file picker och dispatchar
  `loadScene`-action. Felmeddelanden via `alert()` på `SceneParseError`.

### Changed

#### spatial-core
- `PlotConfig` använder nu `northRotationDeg` (ADR-006-namnet);
  tidigare `northOffsetDeg` (FAS 1.5) är fasat ut.
- `bedSunHours` uppgraderad från stub till verklig implementation
  (FAS 2 SidePanel kräver meningsfullt värde).

#### geometry-sandbox
- Reducer wrappas av `withHistory` HOC från `history.ts`. Auto-commit
  för atomiska actions (`addRect`, `removeSelected`, `setWallHeight`,
  `setNorthRotation`, `setLocation`, `setPlotBoundary`, `loadScene`);
  drag-flöden dispatchar explicit `commitHistory` på pointerDown.
- `App.tsx` layout: Canvas + SidePanel sida vid sida under Toolbar.
- Toolbar har nya sektioner för Undo/Redo och JSON I/O. Befintlig
  `datetime-local`-input ersatt av `TimeSlider`-komponenten.

### Verifiering
- 125 tester (114 spatial-core + 11 sandbox), alla gröna.
- Bundle: 170 kB / gzip 56 kB.
- Definition of Done: 12/12 punkter uppfyllda (se `docs/fas2-verification.md`).

---

## [0.1.0] — FAS 1 / 1.5

Initial leverans: spatial-core matematik, geometry-sandbox bas,
ADR-001 t.o.m. ADR-005, spatial_rules.md, precision_policy.md,
state_architecture.md.
