# ADR-005: FAS 1.5 — Spatial Consistency & Mathematical Hardening

**Status:** Accepted  
**Date:** 2025-05-12  
**Context:** Between FAS 1 (Foundations) and FAS 2 (Production Build)

---

## Beslut och rationale

### 1. World space separeras från geografisk orientering

**Beslut:** World space definieras som ett rent canvas-koordinatsystem utan
geografisk semantik. Geografisk orientering hanteras via `PlotConfig.northOffsetDeg`.

**Rationale:** Om world +Y implicit = geografisk syd riskerar vi buggar vid
roterade tomter, bakgrundsbilder och framtida north-offset-stöd. Explicit är
bättre än implicit.

**Default:** `northOffsetDeg = 0` bevarar FAS 1-beteendet (bakåtkompatibelt).

---

### 2. Local coordinates korrigerade

**Beslut:** `worldToLocal()` och `localToWorld()` definierar nu ett korrekt
lokalt koordinatrum med:
- Origo = rektangelns center (inte en absolut punkt i world space)
- Axlar = rektangelns lokala riktningar

**Problem med FAS 1:** `worldToLocal()` roterade runt center men returnerade
absolutkoordinater (fortfarande i world space). Det var semantiskt felaktigt —
en "local coordinate" ska ha center som (0,0).

**Konsekvens:** Hit-testing, snapping och framtida resize handles fungerar nu
korrekt med local coordinates.

---

### 3. Rounding vs snapping — separata begrepp

**Beslut:**
- `snapToWorldMm()` → deprecated, döps om till `roundToWorldMm()`
- `snapToGrid()` = ny funktion för UI grid snapping

**Rationale:** "snap" är UI-terminologi. Avrundning till integer mm är en
matematisk invariant, inte en UI-inställning. Att blanda dem orsakar
begreppsförvirring.

**Bakåtkompatibilitet:** `snapToWorldMm` bevaras som deprecated alias till FAS 2.

---

### 4. Shadow hardening med altitude clamping

**Beslut:**
```ts
MIN_ALTITUDE_DEG = 4
MAX_SHADOW_LENGTH_MM = 100_000
```

**Problem:** `wallHeight / tan(altitude)` → ∞ när altitude → 0.
Vid 1° och wallHeight=2000mm är skuggan ~115m, vid 0.1° är den ~1150m.
Dessa är orealistiska för en trädgård och numeriskt instabila.

**Approximation:** Detta är en medveten förenkling. Skuggmodellen är redan
förenklad (hårda skuggor, rektangulär extrusion). Extrema låg-solvärden är
inte det primära use caset.

---

### 5. Precision policy låst

**Beslut:** `docs/precision_policy.md` är nu det normativa dokumentet för:
- Integer mm i lagring
- Float OK i beräkningar
- `roundToWorldMm()` onDragEnd och vid persistens
- Grid snapping separat från rounding

---

## Vad FAS 1.5 INTE ändrar

- Ingen ny produktfunktionalitet
- Ingen backend
- Ingen persistens
- Inga polygoner
- Inga nya renderingsfeatures
- State management library introduceras inte

FAS 1.5 är en stabiliseringsfas. FAS 2 byggs på denna grund.
