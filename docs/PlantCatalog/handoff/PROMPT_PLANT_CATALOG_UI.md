# Prompt: PlantCatalog UI-design för Koloniträdgårdsplaneraren

## Kontext för designern

Du ska designa en **PlantCatalog**-vy — en separat sida/flik i en befintlig koloniträdgårdsplanerings-app. Appen är byggd i React + TypeScript + Canvas och har idag en interaktiv 2D-editor för odlingsbäddar med sol/skugga-beräkning. PlantCatalog är den nya "andra fliken" där användaren hanterar och utforskar växter.

### App-kontext

- **Stack:** React 18, TypeScript (strict), Vite, pnpm monorepo
- **Befintlig arkitektur:** `useReducer`-baserad state (ingen Redux/Zustand), snapshot-baserad undo/redo, adapter-mönster för persistens
- **Befintliga teman:** Paper (ljust) och Evening (mörkt), via CSS-variabler. Designa för båda.
- **Befintliga CSS-variabler** (måste användas, ej nya):
  ```
  --bg-canvas, --bg-surface
  --ink-1 (primär text), --ink-2 (sekundär text)
  --line-1 (borders)
  --accent-bed (#6E8C5A, grön), --accent-sun (#D4A24C, gul/guld)
  --accent-wall (#8C8478), --accent-plant (#4CAF50, växtgrön)
  --state-danger (#B23A2A), --state-success (#4CAF50)
  --font-sans, --font-mono
  ```
- **Existerande UI-karaktär:** Stram, professionell verktygskänsla med inline-styles (inga CSS-filer för komponenter). Kompassen, grid, subtila skuggor, tabular-nums i monospace. Tänk CAD-verktyg med varm papper-palett — inte flashigt, inte heller sterilt.

### Datamodell

Varje växt i systemet har denna struktur (förenklad):

```typescript
interface PlantCareProfile {
  id: string;                    // "solanum-lycopersicum"
  commonName: string;            // "Tomat" (svenska)
  commonNameEn?: string;         // "Tomato"
  scientificName: string;        // "Solanum lycopersicum"
  
  // Numeriska ranges
  temperature: { minC: number; maxC: number };
  light: { minLux: number; maxLux: number };
  soilMoisture: { minPct: number; maxPct: number };
  nutrientEC: { minMicroS: number; maxMicroS: number };
  humidity: { minPct: number; maxPct: number };
  
  // Kategorisk data
  soilTypes?: string[];          // ["Well-drained", "Loamy"]
  sowingMethod?: string;         // "Förså inomhus, plantera ut efter frost"
  spreadMm?: number;             // 500 (radavstånd)
  rowSpacingMm?: number;         // 600
  daysToMaturity?: number;       // 75
  sunCategory?: string;          // "Full sun"
  waterFrequency?: string;       // "Var 2-3:e dag"
  imageUrl?: string;
  
  // Typ/kategori (för filtrering)
  category?: "vegetable" | "herb" | "berry" | "flower";
}

// En växt placerad i en bädd (på canvas):
interface PlantPlacement {
  placementId: string;
  plantId: string;       // → PlantCareProfile.id
  displayName: string;
  offsetX: number;       // mm i bäddens lokala koordinatsystem
  offsetY: number;
  count: number;         // antal individer
}

// Bädden (Rect) har: plants?: PlantPlacement[]
```

Datan kommer från en lokal `crops.json` (ca 60–200 svenska grödor, sökning sker mot denna, inget extern-API i UI:t).

---

## Krav på PlantCatalog-vyn

### 1. Navigation: Flikar i toppen

Appen får **två huvudflikar** i en tunn tab-bar högst upp (ovanför allt annat):

```
┌─────────────────────────────────────────────────────────────┐
│  🌿 PlotPlaner    [ Planera ]  [ Växter ]                   │
└─────────────────────────────────────────────────────────────┘
```

- **"Planera"** = befintlig canvas-vy (standard)
- **"Växter"** = PlantCatalog (ny)
- Aktiv flik markeras med `--accent-plant` underline eller bakgrund
- Flikbytet ska vara instant (inte routing, bara conditional render)
- Canvas pausar rendering när den inte är synlig (performance)

### 2. Övergripande layout: Master-Detail (split view)

PlantCatalog-vyn delas i **vänster lista** + **höger detaljpanel**:

```
┌──────────────────────────────────────────────────────────────────┐
│  🌿 PlotPlaner    [ Planera ]  [•Växter•]                        │
├────────────────────────────┬─────────────────────────────────────┤
│                            │                                     │
│   MINA VÄXTER (7 st)       │   (välj en växt i listan            │
│   ────────────────         │    för att se detaljer)              │
│   🍅 Tomat         ×5     │                                     │
│   🥬 Sallad        ×10    │                                     │
│   🥕 Morot         ×15    │                                     │
│   ───                      │                                     │
│   PLANERADE (2 st)         │                                     │
│   🌶️ Chili                 │                                     │
│   🫛 Ärtor                 │                                     │
│                            │                                     │
│   ────────────────         │                                     │
│   🔍 Sök växt...           │                                     │
│   ────────────────         │                                     │
│   Filter: [Alla▾]  [Sol▾]  │                                     │
│                            │                                     │
│   ALLA VÄXTER              │                                     │
│   ────────────────         │                                     │
│   🍅 Tomat                 │                                     │
│   🥒 Gurka                 │                                     │
│   🥬 Sallad                │                                     │
│   🫑 Paprika               │                                     │
│   🌽 Majs                  │                                     │
│   ...                      │                                     │
│                            │                                     │
└────────────────────────────┴─────────────────────────────────────┘
```

#### Vänsterpanelen (lista):

- **Bredd:** ~320px (liknande befintlig SidePanel)
- **Översta sektionen: "Mina växter"**
  - Visar alla växter som **finns placerade i minst en bädd** på canvas
  - Varje rad: emoji/ikon + svenskt namn + totalt antal (summa av count i alla bäddar)
  - Sorterade efter namn
  - Om en växt lagts till i katalogen (markerad som planerad) men inte placerats i någon bädd visas den under **"Planerade"** med en distinkt stil (t.ex. dimmat/italic/streckad border)
- **Sökfält** (under "Mina växter"):
  - Placeholder: "Sök växt..."
  - Filtrerar listan under i realtid (substring match på svenskt namn, engelskt namn, latinskt namn)
  - Minst 2 tecken för att aktivera
- **Filter-knappar** (enkel filtrering):
  - **Typ:** Alla / Grönsaker / Kryddor / Bär / Blommor (dropdown eller chip-toggle)
  - **Sol:** Alla / Full sol / Halvskugga / Skugga (dropdown eller chip-toggle)
- **"Alla växter"** (under filter):
  - Listar alla ~60–200 grödor från `crops.json`
  - Scrollbar
  - Filtreras av sök + filter ovan
  - Klick → öppnar detaljvy till höger

#### Högerpanelen (detalj):

- **Default (inget valt):** Centrerat placeholder-meddelande med växtikon, t.ex. "Välj en växt i listan för att se detaljer"
- **När en växt är vald:** Fullständigt växt-kort (se §3)

### 3. Växtkortet (höger panel, scrollbart)

När en växt klickas i listan visas detta i högerpanelen:

```
┌─────────────────────────────────────────┐
│                                         │
│  [Bild om tillgänglig, annars           │
│   färgad placeholder med ikon]          │
│                                         │
│  TOMAT                                  │
│  Solanum lycopersicum                   │
│  Kategori: Grönsak                      │
│                                         │
│  [+ Planera] [+ Lägg till i bädd ▾]     │
│                                         │
│  ─────────────────────────────────      │
│                                         │
│  ☀️ SOL & LJUS                          │
│  ─────────────────────────────────      │
│  Solbehov        Full sol               │
│  Ljusintervall   3 000 – 55 000 lux     │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░ ← visuell bar    │
│                                         │
│  🌡️ TEMPERATUR                         │
│  ─────────────────────────────────      │
│  Klarar          12 – 33 °C            │
│  ▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒           │
│  0°        12°         33°       40°    │
│                                         │
│  💧 VATTEN & JORD                       │
│  ─────────────────────────────────      │
│  Vattning        Var 2–3:e dag          │
│  Jordfuktighet   20 – 60 %             │
│  Jordtyp         Well-drained, Loamy    │
│                                         │
│  🧪 NÄRING                              │
│  ─────────────────────────────────      │
│  EC              350 – 2 000 µS/cm      │
│  (Medelhög till hög näring)             │
│                                         │
│  💨 LUFTFUKTIGHET                       │
│  ─────────────────────────────────      │
│  Intervall       15 – 80 %             │
│                                         │
│  🌱 ODLINGSTIPS                         │
│  ─────────────────────────────────      │
│  Sådd             Förså inomhus,        │
│                   plantera ut efter      │
│                   frost                  │
│  Plantavstånd     50 cm                 │
│  Radavstånd       60 cm                 │
│  Dagar till skörd 75 dagar              │
│                                         │
│  📍 I MIN TRÄDGÅRD                      │
│  ─────────────────────────────────      │
│  Planterad i 2 bäddar, totalt 5 st      │
│  [Visa på canvas →]                     │
│                                         │
└─────────────────────────────────────────┘
```

#### Detaljerade krav på kortet:

**Header:**
- Bild (om `imageUrl` finns) — max ~200px hög, full bredd, rundade hörn
- Om ingen bild: färgad placeholder (`--accent-plant` bakgrund med stor växt-emoji)
- Namn (stort, `--ink-1`), latinskt namn (mindre, `--ink-2`, italic)
- Kategori-badge (liten chip: "Grönsak" / "Krydda" / "Bär" / "Blomma")

**Action-knappar:**
- **"+ Planera"** — lägger till växten i "Planerade"-listan (om den inte redan finns där eller i en bädd). Togglebar: om redan planerad visas "✓ Planerad" (toggle off = ta bort)
- **"+ Lägg till i bädd ▾"** — dropdown med lista på alla bäddar (kind=bed) på canvas: "Bädd 1 (2000×1000mm)", "Bädd 2 (1500×800mm)". Klick → `addPlant`-action dispatchas, grödan centreras i bädden.

**Sektioner (scrollbara):**

Varje sektion har:
- Emoji + rubrik i `--ink-2`, uppercase, liten text (11.5px, samma stil som befintlig SidePanel)
- Data i `Row`-format: label vänster, värde höger (monospace/tabular-nums)
- **Visuella bars** för numeriska ranges (temperatur, ljus, fuktighet):
  - En horisontell gradient-bar som visar min→max-range
  - Färgkodad: grön (inom range), gul (kantzon), grå (utanför)
  - Skalan anpassad per typ (temp: -10 till 45°C, lux: 0 till 60 000, fukt: 0–100%)

**"I min trädgård"-sektion:**
- Visas bara om växten finns i minst en bädd eller är planerad
- Visar: "Planterad i X bäddar, totalt Y st" (automatiskt beräknat)
- Om bara planerad (inte i någon bädd): "Planerad — inte placerad i någon bädd ännu"
- **"Visa på canvas →"** — byter till Planera-fliken och markerar (selects) den första bädden som innehåller denna växt

### 4. "Planerade"-logik (automatisk statusdetektering)

- **Planterad** = växtens `plantId` finns i minst en `Rect.plants[]` på canvas
- **Planerad** = användaren har klickat "Planera" i växtkortet, men grödan finns inte i någon bädd ännu. Sparas som en lista av plantId:n i state: `plannedPlantIds: string[]`
- Planerade växter försvinner från "Planerade"-sektionen när de väl läggs till i en bädd (de flyttas automatiskt till "Mina växter")

### 5. Responsivitet och storlek

- Vänster lista: fast bredd ~320px
- Höger detalj: fyller resterande bredd (flex: 1)
- Om skärmen är smalare än ~768px: dölj splitten — lista i fullbredd, klick på växt navigerar till detaljvy (med tillbaka-knapp)
- Scrollbar detalj-panel, lista har egen scroll

### 6. Interaktioner och mikro-UX

- **Hover på växtrad i listan:** Lätt bakgrundsmarkering (`--bg-surface` → lite ljusare/mörkare)
- **Aktiv växt i listan:** Vänsterkant-markering med `--accent-plant` (3px solid)
- **Sökfält:** Rensa-knapp (×) synlig när text finns
- **Filter-chips:** Toggle-stil, aktiv = fylld med `--accent-plant`, inaktiv = outline
- **"Lägg till i bädd"-dropdown:** Stängs vid klick utanför, visar bäddnamn (label om satt, annars id) + dimensioner
- **Tomma states:**
  - Ingen sök-träff: "Inga växter matchar sökningen"
  - Inga växter i trädgården: "Du har inte lagt till några växter ännu. Sök eller bläddra bland växter nedan."
  - Ingen bädd finns: "Lägg till i bädd"-knappen disabled med tooltip "Skapa en bädd i Planera-fliken först"

### 7. Tema-stöd

Allt ska fungera i både ljust (paper) och mörkt (evening) tema.
Använd uteslutande befintliga CSS-variabler. Den nya variabeln 
`--accent-plant` (#4CAF50 ljust, #66BB6A mörkt) är redan definierad.

### 8. Exempeldata att använda

Designa med dessa exempelgrödor:

```json
[
  { "commonName": "Tomat", "scientificName": "Solanum lycopersicum", "category": "vegetable", "sunCategory": "Full sol", "temperature": { "minC": 12, "maxC": 33 }, "light": { "minLux": 3000, "maxLux": 55000 }, "waterFrequency": "Var 2–3:e dag", "soilTypes": ["Well-drained", "Loamy"], "daysToMaturity": 75 },
  { "commonName": "Morot", "scientificName": "Daucus carota", "category": "vegetable", "sunCategory": "Full sol / Halvskugga", "temperature": { "minC": 4, "maxC": 30 }, "light": { "minLux": 2000, "maxLux": 40000 }, "waterFrequency": "Var 3–4:e dag", "soilTypes": ["Sandy", "Loamy"], "daysToMaturity": 70 },
  { "commonName": "Basilika", "scientificName": "Ocimum basilicum", "category": "herb", "sunCategory": "Full sol", "temperature": { "minC": 15, "maxC": 35 }, "light": { "minLux": 4000, "maxLux": 50000 }, "waterFrequency": "Dagligen", "soilTypes": ["Well-drained"], "daysToMaturity": 30 },
  { "commonName": "Jordgubbe", "scientificName": "Fragaria × ananassa", "category": "berry", "sunCategory": "Full sol", "temperature": { "minC": 5, "maxC": 30 }, "light": { "minLux": 3000, "maxLux": 45000 }, "waterFrequency": "Var 2:a dag", "soilTypes": ["Loamy", "Acidic"], "daysToMaturity": 90 },
  { "commonName": "Dill", "scientificName": "Anethum graveolens", "category": "herb", "sunCategory": "Full sol", "temperature": { "minC": 5, "maxC": 28 }, "light": { "minLux": 3000, "maxLux": 40000 }, "waterFrequency": "Var 3:e dag", "soilTypes": ["Well-drained"], "daysToMaturity": 40 },
  { "commonName": "Ringblomma", "scientificName": "Calendula officinalis", "category": "flower", "sunCategory": "Full sol / Halvskugga", "temperature": { "minC": 3, "maxC": 30 }, "light": { "minLux": 2000, "maxLux": 45000 }, "waterFrequency": "Var 3–4:e dag", "soilTypes": ["Any"], "daysToMaturity": 55 }
]
```

Låtsas att Tomat (×5), Sallad (×10) och Morot (×15) redan finns i bäddar, 
och att Chili och Ärtor är "planerade" men inte placerade.

---

## Leverans

Producera:

1. **En fungerande React-komponent** (eller set av komponenter) som visar PlantCatalog-vyn med exempeldatan ovan. Använd inline styles med CSS-variabel-referens (samma mönster som appen). Inkludera:
   - Tab-navigation (Planera / Växter)
   - Split-view med lista + detaljpanel
   - Sökfält + filter
   - Fullständigt växtkort med alla sektioner
   - Visuella range-bars
   - "Mina växter" och "Planerade" sektioner
   - Hover/active states
   - Båda temana (paper + evening)

2. **En wireframe/skiss** (kan vara ASCII eller enkel SVG) som visar layouten i tre tillstånd:
   - Inget valt (default)
   - Växt vald (tomat-kortet öppet)
   - Sökresultat filtrerat

Designa som om detta ska bli produktionskod — inte en mockup. 
Följ appens befintliga mönster (inline styles, `var(--...)`, 
`data-pp-input`-attribut, `fmtNum`/`fmtInt`-formatering för siffror).
