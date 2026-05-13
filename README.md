# Koloniträdgårdsplaneraren

Spatialt 2D-planeringsverktyg för köksträdgårdar.

## Status: FAS 2 — Interaktiv sandbox

FAS 2 bygger på FAS 1/1.5:s spatiala kärna och levererar en
fullt interaktiv geometry sandbox med:

- Plot-rektangel (tomtens gräns) och grid-snap
- 8 resize-handles + rotate-handle (local-space-resize med
  anchor-bevarande)
- Undo/redo (⌘Z / ⌘⇧Z) — snapshot-baserad, integer mm
- TimeSlider för interaktiv skugg-förhandsgranskning (06–20)
- JSON I/O — spara/ladda hela scenen (`scene.json`, version 1)
- Per-bädd-panel med dimensioner, area, jordvolym och soltimmar
- `northRotationDeg` — roterar solar reference frame utan att
  rotera world space (ADR-006)

Spatial-core (ren matematik, noll runtime-deps utöver `suncalc`):
rotation, kollision (OBB SAT), AABB, coordinate transforms (world ↔
local ↔ screen), skugga, soltimmar, scene-serialisering.

## Snabbstart

```bash
pnpm install
pnpm test                 # kör alla tester (125 stycken)
pnpm dev:sandbox          # starta geometry-sandbox på http://localhost:5173
pnpm build                # bygg sandbox till dist/ (~172 kB)
```

## Tangentbordsgenvägar (sandbox)

| Genväg | Funktion |
|---|---|
| ⌘Z / Ctrl+Z | Ångra |
| ⌘⇧Z / Ctrl+Shift+Z | Gör om |

## Struktur

```
/docs                     spatiala regler, produkt-scope, state-arkitektur
/docs/adr                 arkitekturbeslut (immutable historik)
/docs/fas2-*.md           FAS 2-plan och verifieringsrapport
/packages/spatial-core    ren TypeScript-matematik
/apps/geometry-sandbox    React + Canvas-app
```

## Arkitekturkontrakt

Följande dokument är **normativa** — implementation som avviker har fel:

| Dokument | Vad det styr |
|---|---|
| `docs/spatial_rules.md` | Koordinatsystem, rotation, kollision, skuggor |
| `docs/precision_policy.md` | Integer mm i lagring, float OK internt |
| `docs/state_architecture.md` | State-shape, reducer-mönster |
| `docs/adr/005` | FAS 1.5 spatial hardening (local transforms) |
| `docs/adr/006` | `northRotationDeg`-semantik |
| `docs/adr/007` | Undo/redo via snapshots |
| `docs/adr/008` | JSON scene-format |

## Principer (kort)

1. Enkelhet före flexibilitet
2. Spatial stabilitet före features
3. Explicit matematik före "smart abstrahering"
4. Testbar logik före UI
5. 2D-first, permanent strategi

Se `docs/spatial_rules.md` för detaljer och `CHANGELOG.md` för release-historik.
