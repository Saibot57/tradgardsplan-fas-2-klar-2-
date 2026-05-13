# ADR-008: JSON scene-format och versionering

- **Status:** Accepted
- **Datum:** 2025
- **Beslutstagare:** Projektägare

## Kontext

Vi behöver ett stabilt, versionshanterat format för att spara och ladda trädgårdsscener som JSON-filer.

## Beslut

Scene-filen har ett explicit `version`-fält från version 1.

- Aktuell version: `1`
- `serializeScene()` skriver **aldrig** floats — alla koordinater är integer mm.
- `parseScene()` kastar `SceneParseError` vid:
  - saknat `version`-fält
  - okänd version
  - ogiltiga dimensioner (`width/height ≤ 0`)
  - NaN eller Infinity i koordinater
- `migrateScene()` hanterar framtida versioner (idag identity för v1).
- Inget tyst fail — `return null` är förbjudet.

## Schema (v1)

```ts
interface SceneV1 {
  version: 1
  plot: PlotConfig
  rectangles: Rect[]
}
```

## Konsekvens

- Stark validering vid inläsning.
- Bakåtkompatibilitet via migrationsfunktion.
- JSON-filer är alltid canonicalized (integer mm).