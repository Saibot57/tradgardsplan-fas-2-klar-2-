# ADR-006: northRotationDeg-semantik

- **Status:** Accepted
- **Datum:** 2025
- **Beslutstagare:** Projektägare

## Kontext

Under FAS 1.5 infördes `northOffsetDeg` (senare döpt till `northRotationDeg`) för att hantera sol- och skuggberäkningar relativt till en trädgårds geografiska orientering. Det uppstod oklarhet kring huruvida detta värde roterar world space eller enbart solar reference frame.

## Beslut

`northRotationDeg` är **ett geografiskt referensramorientering**, inte en world-space-rotation.

- World space roteras **aldrig**.
- Skugg- och solberäkningar transformerar sin indata (solar azimuth) via `northRotationDeg`.
- Canvas-, Rect- och viewport-koordinater påverkas inte.
- `northRotationDeg = 0` (default) innebär att world space +Y pekar mot geografisk syd (bakåtkompatibelt med FAS 1 och FAS 1.5).
- Kompassen renderas visuellt roterad för att visa geografisk orientering, men påverkar inga koordinater.

## Konsekvens

- `shadowVector()` och `projectShadow()` tar `northRotationDeg` som parameter men modifierar aldrig world-koordinater.
- `drawCompass()` tar `northRotationDeg` endast för visuell rotation.
- Alla spatiala operationer (move, resize, rotate) sker i world space.
- ADR-005 (FAS 1.5 spatial hardening) gäller som prejudikat.