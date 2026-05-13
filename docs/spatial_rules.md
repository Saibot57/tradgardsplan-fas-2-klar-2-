# Spatial Rules

Detta dokument är **normativt**. All spatial matematik i `packages/spatial-core` och alla
visualiseringar i `apps/geometry-sandbox` följer dessa regler. Om koden avviker — koden
har fel, inte dokumentet.

*Uppdaterat i FAS 1.5: Geografisk orientering separerad från world space.
Local coordinates korrigerade. Canonicalization-policy definierad.*

---

## 1. Enheter

- **All world-koordinat lagras som heltal i millimeter (`mm`).**
- Inga floats i lagrad data. Floats används **endast** tillfälligt i intern matematik.
- Vinklar lagras som **grader** (heltal eller flyt — beslut: flyt tillåtet, då rotation
  sällan är hel grad).
- Tid lagras som ISO 8601 UTC.

Rationale: heltal eliminerar avrundningsdrift mellan sessioner och gör overlap-tester
exakta vid edge-touch.

---

## 2. Koordinatsystem (World Space)

```
 +X →
+Y
↓  (origin = top-left)
```

- Origin är **top-left** av världen.
- X ökar åt **höger**.
- Y ökar **nedåt**.

**FAS 1.5: World space är ett rent spatialt/canvas-system utan geografisk semantik.**
World space vet ingenting om norr, söder, öster eller väster.
Geografisk orientering hanteras explicit via `northOffsetDeg` på Plot-nivå.

Detta matchar canvas/SVG-konventionen och undviker en transformation i renderingslagret.

---

## 3. Coordinate Spaces (FAS 1.5)

Systemet definierar fyra separata koordinatrum:

| Space | Enhet | Ursprung | Syfte |
|---|---|---|---|
| **World space** | mm (heltal) | Top-left, fix | Sann fysisk plats, inga geografiska antaganden |
| **Screen space** | px (flyt) | Canvas top-left | Renderingslager, beror av zoom + pan |
| **Local/object space** | mm (flyt) | Rektangelns center (0,0) | Hittar, resize handles, lokal snapping |
| **Geographic space** | grader | N/A | Solberäkningar via `northOffsetDeg` |

### Transforms

| Funktion | Från → Till |
|---|---|
| `worldToScreen(p, vp)` | World → Screen |
| `screenToWorld(p, vp)` | Screen → World |
| `worldToLocal(p, rect)` | World → Local |
| `localToWorld(p, rect)` | Local → World |

Geografisk orientering hanteras inte av en transformfunktion utan via `northOffsetDeg`
som skickas till `shadowVector()` och `projectShadow()`.

---

## 4. Rotation

- Vinkel mäts i **grader**.
- Positiv rotation är **medurs (clockwise)** i världen.
  - Notera: i ett matematiskt y-uppåt-system skulle medurs vara negativ. I vårt
    y-nedåt-system är medurs *positiv* via standard matrismatematik
    `[cos θ, -sin θ; sin θ, cos θ]`. Se `rotation.test.ts` för verifiering.
- Rotation sker kring objektets **centerpunkt**, aldrig kring hörnet.
- 0° = orörd; rektangelns lokala +X-axel pekar mot världens +X.

---

## 5. Objekttyper (v1)

Endast **roterade rektanglar (OBB — oriented bounding boxes)**.

```ts
interface Rect {
  id: string;
  cx: number;        // centrum X i mm (heltal)
  cy: number;        // centrum Y i mm (heltal)
  width: number;     // lokal +X-extent i mm (heltal, > 0)
  height: number;    // lokal +Y-extent i mm (heltal, > 0)
  rotationDeg: number; // grader, medurs
  wallHeight: number;  // mm, för skuggprojektion (0 = ingen skugga)
}
```

**Terminologiklarläggning (FAS 1.5):**
- `width` = utsträckning längs rektangelns **lokala +X-axel** (innan rotation)
- `height` = utsträckning längs rektangelns **lokala +Y-axel** (innan rotation)
- `wallHeight` = **vertikal extruderings-höjd** för skuggkastning. Detta är INTE
  rektangelns height i planet.

Inga polygoner, cirklar eller fri-form. Beslut låst i ADR-002.

---

## 6. Local Coordinates (FAS 1.5)

`worldToLocal()` och `localToWorld()` definierar ett lokalt koordinatrum där:

- **Origo = rektangelns center** `(cx, cy)` i world space
- **Lokal +X-axel** = rektangelns bredd-riktning (längs `width`)
- **Lokal +Y-axel** = rektangelns höjd-riktning (längs `height`)

En punkt `(lx, ly)` i local space är **inuti** rektangeln om:
```
|lx| <= width/2  AND  |ly| <= height/2
```

### worldToLocal — algoritm

1. Translatera: `dx = worldPoint.x - rect.cx`, `dy = worldPoint.y - rect.cy`
2. Rotera invers (−rotationDeg):
   ```
   lx = dx * cos(-θ) - dy * sin(-θ)
   ly = dx * sin(-θ) + dy * cos(-θ)
   ```

### localToWorld — algoritm

1. Rotera (rotationDeg):
   ```
   rx = localPoint.x * cos(θ) - localPoint.y * sin(θ)
   ry = localPoint.x * sin(θ) + localPoint.y * cos(θ)
   ```
2. Translatera tillbaka: `x = rx + rect.cx`, `y = ry + rect.cy`

---

## 7. Kollision

- **Overlap är förbjudet.**
- **Edge-touch är tillåtet.** Två rektanglar som delar exakt en kant eller ett hörn
  räknas inte som överlappande.
- Kollision avgörs med **Separating Axis Theorem (SAT)** över de fyra unika axlarna
  (två per rektangel).
- Tolerans: 0 mm (heltalsaritmetik gör tolerans onödig). Floating-point-mellanresultat
  jämförs med epsilon = `1e-6` för edge-touch-detektion.

---

## 8. Precision & Canonicalization (FAS 1.5)

Se `docs/precision_policy.md` för fullständig policy.

Kort sammanfattning:
- World coordinates lagras som **integer mm**
- Floats tillåtna **internt** i beräkningar
- `roundToWorldMm()` används vid persistens och onDragEnd
- `snapToGrid()` är **separat** från `roundToWorldMm()` (grid snapping ≠ rounding)

---

## 9. Skuggor

### Modellen

Systemet modellerar:
- **Hårda skuggor** (umbra, ingen halvskugga/penumbra)
- Från **vertikalt extruderade rektanglar** (OBBs)

Systemet modellerar **INTE**:
- Halvskugga eller penumbra
- Diffus eller reflekterad belysning
- Växtblad eller oregelbundna former
- Atmosfärisk spridning
- Lutande väggar

### Geografisk orientering

**FAS 1.5:** Skuggberäkningar kräver explicit `northOffsetDeg`:

```ts
northOffsetDeg: number  // grader, hur mycket world +Y avviker från geografisk syd
```

Default `northOffsetDeg = 0` innebär att world +Y pekar mot geografisk syd —
samma som i FAS 1. Parametern kan ändras per tomt.

### Beräkning

Shadow displacement vector (mm):
```
effectiveAltitude = max(sunAltitude, MIN_ALTITUDE_RAD)  // 4° minimum
effectiveAzimuth  = sunAzimuth - northOffsetRad
length = min(wallHeight / tan(effectiveAltitude), MAX_SHADOW_LENGTH_MM)
shadowVec = { x: sin(effectiveAzimuth) * length,
              y: -cos(effectiveAzimuth) * length }
```

### Extremvärden (FAS 1.5 hardening)

```ts
MIN_ALTITUDE_DEG = 4      // minimum solhöjd
MAX_SHADOW_LENGTH_MM = 100_000  // 100m tak
```

Nära horisonten (`wallHeight / tan(altitude)`) divergerar mot oändligheten.
`MIN_ALTITUDE_DEG` och `MAX_SHADOW_LENGTH_MM` är praktiska approximationer —
inte fysikaliskt exakta. Skuggmodellen är redan förenklad på många andra sätt.

Om `solarAltitude <= 0` (sol under horisonten) → ingen skugga.

### Skuggpolygon

Skuggan är ett **konvext polygonprojection** av rektangeln längs skuggvektorn,
union:ad med originalrektangeln. Beräknas med Andrews monotone chain convex hull.
I v1 returneras de 4–8 punkter som utgör konvexa höljet.

---

## 10. Solmodell

- Bibliotek: **`suncalc`** (JS-port av NOAA-formler, ungefärlig).
- Sampling: **var 60:e minut**, från **06:00 till 20:00 lokal tid**.
- Ingen reflekterad eller diffus belysning.
- Default-plats: **Landskrona, Sverige** (lat ≈ 55.8708, lon ≈ 12.8300).

---

## 11. Geografisk orientering (FAS 1.5 — ny sektion)

World space har **ingen** geografisk semantik.

Geografisk orientering specificeras via `PlotConfig.northOffsetDeg`:

```ts
interface PlotConfig {
  northOffsetDeg: number;  // grader medurs från geografisk syd till world +Y
  location: GeoLocation;
}
```

| northOffsetDeg | Tolkning |
|---|---|
| 0 (default) | World +Y pekar mot geografisk **syd** |
| 90 | World +Y pekar mot geografisk **väst** |
| 180 | World +Y pekar mot geografisk **norr** |
| -90 | World +Y pekar mot geografisk **öst** |

Sandboxen visar en kompass som ritas baserat på `northOffsetDeg`.
Default 0° matchar FAS 1-beteendet (bakåtkompatibelt).

---

## 12. Vad som **inte** är spatial-cores ansvar

- Persistens / disk
- Nätverk / API
- Rendering / DOM
- Användarval av enheter (alltid mm)
- Tidszoner (lämnas till anropare; suncalc tar JS Date i UTC)
