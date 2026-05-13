# Precision Policy

*Skapat i FAS 1.5. Detta är ett normativt dokument.*

Definierar exakt hur koordinater lagras, avrundas och hanteras
i hela systemet. Syftet är att eliminera semantisk tvetydighet och
förhindra avrundningsdrift.

---

## 1. Intern lagring

**World coordinates lagras alltid som integer mm.**

```ts
// RÄTT
{ cx: 1000, cy: 2000, width: 1500, height: 800 }

// FEL — float i lagrad data
{ cx: 1000.5, cy: 2000.3, width: 1500.1, height: 799.9 }
```

Vinklar (`rotationDeg`) får vara floats — det är ovanligt att rotationer
är exakt hela grader.

---

## 2. Geometriska beräkningar

Floating point är tillåtet **internt** i alla beräkningar:

- `rectCorners()` returnerar floats (rotation introducerar trigonometri)
- `shadowVector()` returnerar floats
- `worldToLocal()` / `localToWorld()` returnerar floats
- `screenToWorld()` returnerar floats

Dessa värden **skrivs aldrig direkt till state** utan canonicaliseras först.

---

## 3. Canonicalization-policy

### Under drag (mid-drag)

Floats är tillåtna i state under aktiv drag-operation:
```ts
// Under drag: cx/cy kan vara floats i memory
dispatch({ type: "moveSelected", dx: 1.23, dy: 4.56 })
```

Rationale: rounding varje frame ger hackig rörelse vid låg zoom.

### onDragEnd

Vid drag-slut **canonicaliseras** till integer mm:
```ts
// Exempel i reducer — moveSelected kör Math.round
cx: Math.round(r.cx + action.dx)
```

### Persistence

Endast integer mm skrivs till disk/storage. Aldrig floats.

---

## 4. Rounding-funktion

```ts
roundToWorldMm(p: Point): Point
// Math.round på båda axlarna
```

**Namngivning (FAS 1.5):**
- `roundToWorldMm` = avrundning till integer mm (canonical form)
- `snapToWorldMm` = **deprecated alias** för `roundToWorldMm`
  (behålls tills FAS 2 för bakåtkompatibilitet)

`snapToWorldMm` bytte namn för att undvika sammanblandning med grid snapping.

---

## 5. Grid Snapping

Grid snapping är **separat** från `roundToWorldMm`.

```ts
snapToGrid(p: Point, gridMm: number = 10): Point
```

Grid snapping rundas till närmaste multipel av `gridMm`.
`roundToWorldMm` ska alltid köras **efter** `snapToGrid` vid persistens
(grid-snappad koordinat är redan integer om gridMm är heltal).

### Default grid-steg

| Kontext | Steg |
|---|---|
| Standard | 10 mm |
| Grov placering | 50 mm |
| Fri (ingen grid) | ingen snapping |

Grid snapping är en UI-inställning, inte en matematisk invariant.

---

## 6. Floating Point Tolerance (epsilon)

### Varför epsilon behövs

OBB-kollision via SAT använder floats (roterad projektion). Exakta
edge-touch-fall (`max_a == min_b`) är numeriskt instabila utan epsilon.

### Var epsilon används

| Kontext | Epsilon | Enhet |
|---|---|---|
| `rectOverlap` / `rectEdgeTouch` (SAT) | `1e-6` | mm (projektion) |
| `coordinates.test.ts` round-trip | `1e-9` | mm |
| Shadow length close-test | `1e-6` | mm |

### Var epsilon INTE används

- Aritmetik på integer-koordinater (ingen epsilon behövs — exakt)
- UI: pixel-rendering (kvantisering i screenToWorld ger ~0.5mm osäkerhet,
  men det är dokumenterat acceptabelt)

---

## 7. Negativa dimensioner

`width` och `height` på `Rect` måste vara **> 0**.

Kontroll:
- State reducer: `Math.max(100, ...)` vid resize (minst 100mm)
- Konstruktörer / fabriksfunktioner ska validera och kasta om `width <= 0`

NaN och Infinity är ogiltiga och ska aldrig hamna i lagrad state.

---

## 8. Sammanfattning — livscykel för en koordinat

```
User input (pointer event)
    │
    ▼
screenToWorld()          ← float OK
    │
    ▼
[mid-drag in memory]     ← float OK
    │
onDragEnd
    ▼
snapToGrid() [opt]       ← float → multiple of gridMm
    │
roundToWorldMm()         ← float → integer mm
    │
    ▼
State (Rect.cx / cy)     ← INTEGER mm, canonical
    │
    ▼
Persistence              ← INTEGER mm, no floats
```
