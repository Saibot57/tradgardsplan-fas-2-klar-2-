# FAS 2 Plan — Revisionsnoteringar

*Genererat vid revidering av fas2-plan-arena-agent.md baserat på FAS 1.5-feedback.*

---

## Changelog — vad som ändrats

### 1. northRotationDeg-semantik (kritisk)

**Vad ändrades:**
- Hela planen omformulerad kring principen "world space rotates never"
- Arkitekturkontrakt tillagt i toppen av dokumentet med explicit formulering
- Sektion 1 (shadow.ts-refaktorering) omformulerad:
  *"Rotate the solar reference frame using northRotationDeg without rotating world coordinates."*
- Sektion 2 (Canvas.tsx) specificerar explicit vad som INTE görs:
  viewport roteras inte, world-koordinater påverkas inte, `setTransform` ändras inte
- Kompassens rendering specificeras som visuell rotation utan koordinatpåverkan
- ADR-006 specificerar nu exakt detta beslut

**Var det fanns fel i ursprungsplanen:**
Sektion 2 antydde att "kompassen roterar" utan att klargöra att det är en
ren visuell transform. Sektion 1 beskrev inte shadow.ts-refaktoreringen
i termer av "solar reference frame vs world space".

---

### 2. worldToLocal/localToWorld dependency-check

**Vad ändrades:**
- Sektion 3 inleds nu med explicit dependency-check (3a) som måste vara grön
  innan handles-implementation börjar
- Handles-implementation i 3c specificerar att resize sker i local space
  med steg-för-steg-algoritm
- Explicit formulering: "handles får INTE byggas på felaktiga transforms"

**Var det saknades i ursprungsplanen:**
Ursprungsplanen nämnde inte att FAS 1 hade semantiskt felaktiga local transforms,
och hade ingen säkerhetsmekanism mot att bygga handles på fel grund.

---

### 3. Precision policy genomgående

**Vad ändrades:**
- Precision-policy-tabell tillagd i toppen av dokumentet (gäller alla sektioner)
- Sektion 2 (state.ts): kommentar om att canonicalization-policy är oförändrad från FAS 1.5
- Sektion 3 (handles): explicit float-OK under drag, `roundToWorldMm()` på `onPointerUp`
- Sektion 3 (history): snapshot-policy definierad — snapshots tas aldrig mid-drag
- Sektion 4 (io.ts): explicit att `serializeScene` garanterar integer mm i JSON

**Var det saknades i ursprungsplanen:**
Ursprungsplanen nämnde canonicalization men inte konsekvent — det var spritt utan
tydlig policy. Undo/redo-historia angav inte att snapshots måste vara canonicalized.

---

### 4. JSON scene-format med explicit version

**Vad ändrades:**
- ADR-008 specificerar nu `version`-fält från dag ett
- `SceneParseError` specificeras som explicit feltyp (aldrig tyst fail, aldrig `null`)
- Valideringsregler tillagda: `width > 0`, `height > 0`, NaN/Infinity förbjudna
- `migrateScene()` nämns i context av io.ts

**Var det saknades i ursprungsplanen:**
Ursprungsplanen nämnde `migrateScene` men inte att version-fältet måste vara
obligatoriskt från v1, och inte att saknat version-fält ska kasta ett fel.

---

### 5. Shadow system constraints refererade

**Vad ändrades:**
- Sektion 1a refererar explicit att `MIN_ALTITUDE_DEG = 4` och `MAX_SHADOW_LENGTH_MM = 100_000`
  ska vara exporterade konstanter (de är det från FAS 1.5)
- DoD-item #11 verifierar dessa konstanter explicit

**Var det saknades i ursprungsplanen:**
Shadow hardening från FAS 1.5 nämndes inte alls i ursprungsplanen.

---

### 6. TimeSlider semantik separerad

**Vad ändrades:**
- Sektion 3d har nu en explicit "Semantisk distinktion"-box
- Tydlig separation mellan:
  - *interactive preview time* (TimeSlider → `state.sun.dateIso`)
  - *aggregate summer analysis* (SidePanel → `bedSunHours()` på fast referensdatum)
- Sektion 4b specificerar att de aldrig delar state-fält

**Var det saknades i ursprungsplanen:**
Ursprungsplanen hade F7 (TimeSlider) och F9 (soltimmar) i skilda sektioner men
förklarade inte den semantiska distinktionen — risk för att de blandas i state.

---

### 7. Resize constraints specificerade

**Vad ändrades:**
- Sektion 3c har explicit algoritm för resize i local space
- `MIN_RECT_DIMENSION_MM = 100` specificerad
- Negativa dimensioner förbjudna — explicit formulerat
- Float OK under drag, `Math.round()` på `onPointerUp` — konsekvent med precision policy

**Var det saknades i ursprungsplanen:**
Resize nämndes som "8 handles" utan specifikation av local-space-algoritm
eller minimum-dimensions-policy.

---

### 8. ADR-numrering justerad

**Vad ändrades:**
- ADR-005 existerar redan från FAS 1.5 (`005-fas15-spatial-hardening.md`)
- FAS 2 skriver ADR-006, 007, 008 (inte 005, 006, 007 som ursprungsplanen angav)
- Arkitekturkontrakts-tabell hänvisar till rätt filnamn

---

### 9. Arkitekturkontrakt-tabell tillagd

**Vad ändrades:**
- Nytt intro-avsnitt "Arkitekturkontrakt" listar alla normativa dokument
- Förtydligar att FAS 2 inte ändrar dessa utan ett nytt ADR

---

## Kvarstående riskområden

### R1 — northRotationDeg vs northOffsetDeg namnkonflikt (medelhög risk)

FAS 1.5-koden använder `northOffsetDeg` i `types.ts` (`PlotConfig`),
`shadow.ts`, `Canvas.tsx` och `state.ts`.

FAS 2-planen och ADR-006 använder `northRotationDeg`.

**Risk:** Agenten byter namn inkonsekvent — en fil använder `northOffsetDeg`,
en annan `northRotationDeg`, och bygget går sönder eller tests missar en fil.

**Mitigation:** Sektion 1a specificerar att namnbytet ska göras konsekvent
i `types.ts`, `shadow.ts` och `PlotConfig`. Sektion 2a specificerar detsamma
för `state.ts`. Kör en grep-kontroll i slutet av Sektion 1:
```bash
grep -r "northOffsetDeg" packages/ apps/ --include="*.ts" --include="*.tsx"
```
Noll träffar = klart.

---

### R2 — Handles-komplexitet (hög risk)

Resize- och rotate-handles är den mest komplexa UI-biten.
Interaktion med:
- drag-pan (same pointer-events)
- undo/redo (mid-drag ska inte snapshotas)
- snap-to-grid (ska snap gälla vid resize?)
- local-space transform (måste vara korrekt)

**Mitigation:** Sektion 3a dependency-check. KNOWN_ISSUES.md-strategi
för UI-polish-buggar. Prioritet: korrekthet > polish.

---

### R3 — sunHours beräkningstid (låg-medel risk)

`bedSunHours()` kör 15 timsamples med SAT-kollision för varje sample.
Vid många bäddar kan detta bli märkbart långsamt på UI-tråden.

**Mitigation i FAS 2:** Beräkna `bedSunHours` bara när selection ändras
(inte vid varje render). Ingen Web Worker i FAS 2. Om det är för långsamt:
dokumentera i KNOWN_ISSUES.md och spara Web Worker till FAS 3.

---

### R4 — Scene migration edge cases (låg risk)

`migrateScene` är identity för v1 → v1 (enda versionen). Vid framtida
versioner måste migration testas ordentligt. I FAS 2 är risken låg
eftersom vi bara har en version.

**Mitigation:** `scene.test.ts` testar att `migrateScene` är identity
och att okänd version kastar `SceneParseError`.

---

### R5 — Token-budget överskridning i Sektion 3 (medelhög risk)

Sektion 3 är den tyngsta (handles + history + timeslider). Om agenten
fastnar i handles-buggar kan turn-budgeten sprängas.

**Mitigation:** KNOWN_ISSUES.md-strategi är explicit i planen.
Agenten instrueras att dokumentera och gå vidare snarare än att lägga
hela budget på UI-polish.
