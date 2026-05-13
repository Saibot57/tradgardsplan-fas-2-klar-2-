# ADR-009: Flera objekttyper på rektanglar (`kind`)

- **Status:** Accepted
- **Datum:** 2026
- **Beslutstagare:** Projektägare

## Kontext

V1 har behandlat alla rektanglar som "bäddar", men `wallHeight`-fältet
visade redan att andra objekttyper smugits in (skuggkastande byggnader/häckar).
UX-analysen pekar ut att inspektor och sammanställning blir missvisande när
alla objekt summeras som bäddar (jordvolym för byggnader m.m.).

Vi vill formalisera fyra objekttyper utan att bryta SceneV1/V2 eller
ADR-002 (endast roterade rektanglar) — `kind` läggs som *additivt* fält och
default-tolkningen är fortsatt "bed".

## Beslut

Introducera ett valfritt `kind`-fält på `Rect`:

```ts
type ObjectKind = "bed" | "building" | "hedge" | "surface";
```

- `kind` är **valfri**. Saknas värdet tolkas objektet som `"bed"`.
- `wall` slås ihop med `building` (samma semantik: skuggkastande vertikal
  extrudering utan jordvolym). En egen "wall"-typ kan läggas till i en senare
  ADR om renderings-/material-skillnader behövs.
- Beräknings-semantik per typ:

| kind     | hasSoil | castsShadow |
|----------|---------|-------------|
| bed      | ja      | nej         |
| building | nej     | ja          |
| hedge    | nej     | ja          |
| surface  | nej     | nej         |

- `bedSoilVolumeLitres()` returnerar 0 för icke-bädd-typer (semantiskt
  ekvivalent — en byggnad har ingen jord).
- Skuggor styrs fortsatt av `wallHeight > 0`, inte av `kind`. Det betyder
  att en `bed` med wallHeight > 0 *kan* kasta skugga (kantbjälke etc.) —
  men UI:t exponerar wallHeight bara för `building`/`hedge`.
- **Kollisionsregler är fortsatt rent geometriska i core.** En SAT-träff
  mellan ett `surface` och en `bed` är inte en "olovlig" kollision men core
  rapporterar den fortfarande som en intersection. UI:t (SidePanel) får
  *tolka* träffar olika per typ — t.ex. "yta under bädd" är ok.

## Scene-format

- `SCENE_VERSION` bumpas till `3`. `SceneV3` är strukturellt identiskt med
  `SceneV2` men `Rect.kind` är tillåtet.
- `migrateScene()` är identity v2→v3 — gamla rects utan `kind` läses som
  `"bed"` via helpern `getKind()`.
- `parseScene()` validerar att `kind` (om present) är en av enumvärdena;
  annars kastas `SceneParseError`.
- `canonicalizeRect()` *utelämnar* `kind` om värdet är `"bed"` (default), för
  att hålla JSON kompakt och V2-kompatibel.

## Konsekvens

- Befintliga scener (V1/V2) laddas oförändrat och alla objekt behandlas som
  bäddar — noll regression.
- Inspektorn och sammanställningen blir typ-medvetna. Sektioner som inte är
  meningsfulla för en typ (jordvolym för byggnad) döljs.
- Skuggor påverkas inte: `bedSunHours`-filtret `wallHeight > 0` täcker både
  byggnader och häckar utan typ-koll.
- **Inte i scope för denna ADR:** snappning till tomtgräns, lager,
  per-typ-kollisionspolicy (allt detta får egna ADR:er om de blir aktuella).
