# State Architecture

*Uppdaterat i FAS 1.5: PlotConfig tillagd i SandboxState, northOffsetDeg dokumenterad.*

## Princip

> Inget state management library i FAS 1. Ingen Redux, ingen Zustand, ingen Jotai.

State hanteras med **React-inbyggda primitiver** (`useState`, `useReducer`, context där
absolut nödvändigt). Detta är ett medvetet val för att hålla FAS 1 fokuserat på
spatial matematik, inte på arkitekturpussel.

Beslut låst i **ADR-004**.

---

## Lager

```
┌─────────────────────────────────────────┐
│ apps/geometry-sandbox (React + Canvas)│
│  - useState för rektangellista          │
│  - useReducer för redo/undo (om behövs) │
│  - Canvas är ren render av state        │
└─────────────────────────────────────────┘
          │ importerar
          ▼
┌─────────────────────────────────────────┐
│ packages/spatial-core (rena funktioner)│
│  - inget state                          │
│  - inga sidoeffekter                    │
│  - inga deps utöver suncalc             │
└─────────────────────────────────────────┘
```

---

## Dataflödet i sandboxen

```
user input
     │
     ▼
reducer / setState ─────► immutable state-snapshot
     │
     ▼
spatial-core funktioner
(overlap?, shadows?, sun-hours?)
     │
     ▼
derived data (memo)
     │
     ▼
Canvas render
```

---

## State-shape (sandbox, FAS 1.5)

```ts
interface SandboxState {
  rectangles: Rect[];           // user-placed objects
  selectedId: string | null;
  viewport: {
    panX: number;
    panY: number;
    pixelsPerMm: number;
  };
  sun: {
    dateIso: string;            // ISO 8601 UTC
  };
  showShadows: boolean;
  plot: PlotConfig;             // FAS 1.5: geografisk orientering
}

interface PlotConfig {
  northOffsetDeg: number;       // geografisk orientering av world space
  location: GeoLocation;        // lat/lon för solberäkningar
}
```

**FAS 1.5 — PlotConfig:**
`northOffsetDeg` separerar geografisk orientering från world space.
Solskuggberäkningar tar explicit hänsyn till detta värde.
Default `northOffsetDeg = 0` är bakåtkompatibelt med FAS 1.

---

## Canonicalization i reducern

Alla koordinat-mutationer i reducern **canonicaliserar till integer mm**:

```ts
case "moveSelected":
  return {
    rectangles: state.rectangles.map((r) =>
      r.id === state.selectedId
        ? { ...r, cx: Math.round(r.cx + action.dx), cy: Math.round(r.cy + action.dy) }
        : r
    ),
  };
```

Se `docs/precision_policy.md` för fullständig policy.

---

## Actions

```ts
type Action =
  | { type: "addRect"; rect: Rect }
  | { type: "removeSelected" }
  | { type: "select"; id: string | null }
  | { type: "moveSelected"; dx: number; dy: number }    // world mm, float OK mid-drag
  | { type: "rotateSelected"; deltaDeg: number }
  | { type: "resizeSelected"; dWidth: number; dHeight: number }
  | { type: "setWallHeight"; id: string; mm: number }
  | { type: "setViewport"; viewport: SandboxState["viewport"] }
  | { type: "setSun"; dateIso: string }
  | { type: "toggleShadows" }
  | { type: "setNorthOffset"; deg: number }              // FAS 1.5
  | { type: "setLocation"; loc: GeoLocation }            // FAS 1.5
```

---

## När får vi införa ett library?

Ej i FAS 1. Vid FAS 2, om och endast om:

- Vi behöver delat state mellan ≥3 orelaterade komponentträd, *och*
- React Context har visat sig orsaka mätbara render-problem.

Innan dess: prop drilling och `useReducer` räcker.

---

## Sidoeffekter

- Persistence: ingen i FAS 1.
- Nätverk: ingen i FAS 1.
- Solberäkningar: rena (suncalc är pure given Date+lat+lon).
