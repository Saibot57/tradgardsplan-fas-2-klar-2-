# PlotPlaner Design System

> Brand name (English-facing): **PlotPlaner**
> Native name (Swedish, in-product): **Koloniträdgårdsplaneraren**
> Tagline: *Plot your garden before the spade hits the soil.*

PlotPlaner is a **spatial 2D planning tool for kitchen gardens and allotments**. A
gardener draws their plot boundary, places raised beds and walls as rotatable
rectangles, and sees real soil-volume and sun-hour numbers come back — all before
they buy a single bag of compost.

The product is Swedish-first (Stockholm/Skåne audience). All in-product copy lives
in Swedish; the English name "PlotPlaner" is for marketing surfaces (landing page,
app store, etc.).

---

## Sources

- **Codebase:** [`Saibot57/tradgardsplan-fas-2-klar-2-`](https://github.com/Saibot57/tradgardsplan-fas-2-klar-2-)
  (monorepo: `apps/geometry-sandbox` React app + `packages/spatial-core`
  TS math library, pnpm workspace)
- **Imported reference under** `reference/` — the geometry-sandbox source
  (`App.tsx`, `Canvas.tsx`, `Toolbar.tsx`, `SidePanel.tsx`, `TimeSlider.tsx`,
  `state.ts`) and key docs (`product_scope.md`, `spatial_rules.md`).
- **No Figma file** was provided.

---

## Product surfaces represented

The codebase ships one user-facing surface today: a **geometry sandbox**
(`/apps/geometry-sandbox`). It's an interactive Canvas where a gardener:

1. Draws the plot boundary rectangle (`Skapa tomt`).
2. Adds raised beds (`+ Rektangel`) and walls (`wallHeight > 0`).
3. Resizes, rotates, and snaps them on a 1 cm grid.
4. Scrubs the **TimeSlider** (06:00–20:00) to see live shadows.
5. Reads per-bed dimensions, soil volume (L), and aggregate
   midsummer **sun hours** in the right-hand inspector.
6. Saves/loads scenes as `scene.json`.

A planned `apps/solar-prototype` exists in the tree but is not yet shipping UI.

This design system covers two surfaces:

- **App** (the planner itself — `ui_kits/app`)
- **Marketing site** (proposed — `ui_kits/marketing`)

Today the planner UI is purely **utilitarian**: dark `#1a1a1a` chrome, system-
font labels, hand-rolled `<button>` styles in `Toolbar.tsx`. There is no brand,
no design system, no marketing surface. The job of this repo is to give the
product a coherent visual + verbal identity it can grow into.

---

## Index

```
README.md                       this file
SKILL.md                        Claude Code / agent skill manifest
colors_and_type.css             CSS variables — base + semantic tokens
fonts/                          Web fonts (Instrument Serif, Hanken Grotesk, JetBrains Mono — Google Fonts links)
assets/                         Logos, icons, illustrations
preview/                        Design system tab cards (one HTML per concept)
ui_kits/
  app/                          Planner UI kit — Canvas, Toolbar, SidePanel, TimeSlider, dialogs
  marketing/                    Landing-page UI kit — hero, features, footer
reference/                      Imported source files from the codebase (read-only)
```

---

## Content fundamentals

### Voice

Calm, practical, plain-spoken — a Swedish gardening-book tone, not a SaaS
landing page. Imagine a Stockholm garden writer explaining a layout to a
neighbour over coffee: "the bed by the wall gets six hours of sun in June —
that's enough for tomatoes."

The product respects the gardener's intelligence. It does not hype. It does
not cheer ("Great job! 🎉"). It also doesn't condescend with hand-holding
copy ("Don't worry, you can always undo!"). It just labels things accurately
and gets out of the way.

### Language & casing

- **In-product copy is Swedish.** Marketing surfaces and this design system are English.
- **"du", not "ni"** — informal second person, the modern Swedish default.
- **Sentence case for everything** — buttons, labels, headings. *"Spara JSON"*, not *"Spara Json"* or *"SPARA JSON"*.
- One exception: small uppercase labels in inspector panels (`POSITION`, `AREA`) get tracking and lowercase `letter-spacing: 0.08em` — drafting-table convention, not shouting.
- Numbers always carry their unit and use a thin space: `2 000 mm`, `12,3 m²`, `06:00`. **Comma as decimal separator** in SV; period in EN.

### Examples (from the codebase, lightly polished)

| Surface | Current | Preferred |
|---|---|---|
| Add bed button | `+ Rektangel` | `+ Lägg till bädd` |
| Remove button | `– Ta bort` | `Ta bort` |
| Empty inspector | `Markera en bädd för att se detaljer.` | ✓ already good |
| Collision warning | `⚠ 2 kollision(er)` | `2 bäddar krockar` |
| Sun reading | `Sol: alt 41.2°, az 187.5°` | `Sol 41° över horisonten, sydsydväst` *(in tooltips; numeric in dev mode)* |
| Save success | *(none)* | `Scen sparad.` |

### Do / Don't

- ✅ "Bädden får 7 timmar sol vid midsommar."
- ❌ "Awesome! Your bed will get plenty of sun! ☀️"
- ✅ "Tomten är 12 × 8 meter."
- ❌ "You've created a beautiful 96 m² garden!"
- ✅ Empty states explain *what to do next* in one short sentence.
- ❌ Empty states with mascots, illustrations, or motivational quotes.

### Emoji

**No emoji in product chrome.** Buttons, labels, menus stay typographic.
The codebase currently uses `⚠` and `✓` (Unicode dingbats) in the toolbar
status — those are fine as compact glyphs but should ideally be replaced
with Lucide icons (see ICONOGRAPHY).

Marketing pages may use emoji **very sparingly** for section-intro accents
(🌱 🌞 ⛅) — but only when carrying real meaning, never as decoration.

### Numbers, units, precision

- Storage is integer mm (`precision_policy.md`). UI shows the most readable
  unit per context: bed dimensions in **mm** (`2000 × 1000 mm`), plot
  dimensions in **m** (`12 × 8 m`), area in **m²** (`12,3 m²`), soil in
  **L** (`410 L`), time in **h** (`6 h`) or **HH:mm**.
- Rotation in degrees with `°` glyph, no space: `25°`.
- One decimal max for derived values; integer for raw mm dimensions.

---

## Visual foundations

### Concept

PlotPlaner is a **drafting table for the garden**. Two ideas anchor every
visual decision:

1. **Paper, ink, and pencil** — warm off-white surface, a single deep ink for type, a few earthy accents for soils, plants, sun, sky. No gradients, no glassmorphism, no glow.
2. **Honest measurement** — dimensions, scale, north arrow, time slider are first-class citizens. The mono typeface and the grid show up everywhere these appear.

The codebase's current dark theme is preserved as a secondary **night mode** for
late-evening planning sessions, but the **default light "paper" mode is the
brand**.

### Colors

The full palette lives in `colors_and_type.css` as CSS custom properties.
Highlights:

| Role | Token | Light | Dark |
|---|---|---|---|
| Page background ("paper") | `--bg-paper` | `#F4EFE6` | `#15170F` |
| Surface (cards, panels) | `--bg-surface` | `#FBF8F2` | `#1F221A` |
| Primary ink | `--ink-1` | `#1F2419` | `#EAE5D6` |
| Soft ink (labels) | `--ink-2` | `#5B5C50` | `#A8A89A` |
| Hairline | `--line-1` | `#D8D1C0` | `#2E3225` |
| Soil (terracotta) | `--accent-soil` | `#B5562E` | `#C76A3F` |
| Bed (sage) | `--accent-bed` | `#6E8C5A` | `#8AAB72` |
| Sun (ochre) | `--accent-sun` | `#D4A24C` | `#E7B85F` |
| Sky (slate-blue) | `--accent-sky` | `#6B8A9E` | `#86A4B8` |
| Wall/structure (warm grey) | `--accent-wall` | `#8C8478` | `#A39C8E` |
| Danger / collision | `--state-danger` | `#B23A2A` | `#E2614C` |
| Success | `--state-success` | `#4F7A3F` | `#7AA968` |

All palette entries pass WCAG AA against `--bg-paper` / `--bg-paper-dark` at
14 px or larger. Use **sage** for plants and beds, **terracotta** for soil,
walls and primary actions, **ochre** for sun/light, **slate-blue** for sky
and information, **wall grey** for inert structure. Never invent a new hex
mid-design; if a use case isn't covered, ask.

### Type

- **Display:** **Montserrat** (variable, 100–900 + italic) — the brand sans. Geometric, used for the wordmark, headings, big numbers, marketing hero copy.
- **Body / UI:** **Cabin** (variable, weight + width) — humanist sans, sits comfortably at small sizes. All in-product chrome, labels, panels, dialogs.
- **Mono:** JetBrains Mono — for measurements, coordinates, code, scene-JSON. Wherever the gardener might want to copy or compare a number.
- **Optional editorial:** Instrument Serif — reserved for marketing pull quotes and the occasional italic emphasis (`.pp-quote`). Don't use in product chrome.

Both brand fonts are **self-hosted** in `fonts/` and declared as `@font-face` variable fonts in `colors_and_type.css`. Type scale ratio is `1.2` (minor third) — calm, modest, no skyscraper headings. See `colors_and_type.css` `--text-*` tokens.

### Spacing & layout

- 4 px base unit. Scale: `--space-1` (4 px) → `--space-12` (96 px).
- Toolbar height: 56 px (was 44 px — generous for hit targets).
- Side panel: 320 px (was 240 px — room for breathing).
- Canvas grid metres: 1 m primary grid line, 10 cm subgrid (shown when zoomed in).
- Page margins: 64 px on large screens, 24 px on tablet, 16 px on phone.

### Backgrounds & texture

- Light mode background is a flat warm off-white `#F4EFE6`. Optional **very subtle paper grain** (4 % opacity noise PNG) on marketing surfaces only.
- Dark mode is a deep olive-tinted near-black `#15170F` — warmer than the current `#1a1a1a` so it reads as "evening garden", not "code editor".
- **No gradients** on chrome (buttons, cards, panels). The only gradient allowed is the canvas shadow rendering itself (semi-transparent black for cast shadows).
- **No full-bleed photography on app surfaces.** The marketing site may use one anchor photograph (Nordic vegetable garden, overcast light, no people) per page.

### Borders, radii, shadows

- Hairline borders: **1 px** `--line-1`, never 2 px or thicker except for:
  - Selected rectangle outline on canvas (`2 px --accent-sun`).
  - Plot boundary (`2 px dashed --accent-sun`, matches existing canvas convention).
- Corner radius scale: `--radius-1: 2 px` (inputs, chips), `--radius-2: 4 px` (buttons), `--radius-3: 8 px` (cards, panels), `--radius-pill: 999 px`. **No 16 px+ blob radii.** This is a drafting tool.
- Shadows are **rare and small** — only used for floating menus and dialogs:
  - `--shadow-1` (subtle hover lift): `0 1px 2px rgba(15, 17, 12, 0.06)`
  - `--shadow-2` (menus, popovers): `0 4px 16px rgba(15, 17, 12, 0.08), 0 1px 3px rgba(15, 17, 12, 0.04)`
  - `--shadow-3` (modals): `0 16px 48px rgba(15, 17, 12, 0.14), 0 2px 6px rgba(15, 17, 12, 0.06)`
- No inner shadows. No coloured shadows. No glows.

### Hover, press, focus

- **Hover** on buttons: background shifts one tone darker (`color-mix` with 4 % ink), no scale, no shadow change.
- **Press** on buttons: background two tones darker (`color-mix` with 8 % ink) AND a 1 px translate-down feel via `transform: translateY(0.5px)`. Never shrink the element.
- **Focus** is `outline: 2px solid var(--accent-sun); outline-offset: 2px;` — always visible, never removed. This is a keyboard-driven tool (⌘Z, ⌘⇧Z); keyboard users matter.
- **Selected canvas rect** uses the focus ochre (`--accent-sun`) too — same affordance, same colour, same idea.

### Animation

- Hover/press transitions: **120 ms** ease-out. Just enough to feel polished, not enough to feel slow.
- Panel open / dialog enter: **180 ms** ease-out, slight upward slide (`translateY(4px) → 0`) + opacity fade.
- The Canvas itself **never animates**. Pan, zoom, resize, rotate are all 1:1 with the pointer — instant. The shadow re-render on TimeSlider scrub is also instant.
- No bouncy springs. No parallax. No scroll-jacking. No loading spinners on the canvas (operations are synchronous).
- `prefers-reduced-motion: reduce` removes all transitions.

### Transparency & blur

- Used **only** for cast shadows on the canvas (`rgba(0,0,0,0.35)` over the dark surface, `rgba(31,36,25,0.18)` over paper in the planned light mode).
- **No backdrop-filter blur anywhere.** No frosted-glass toolbars, no translucent menus. Surfaces are opaque.

### Imagery & illustration

- Photography: muted, **overcast Nordic daylight**, no warm-golden-hour shots, no people, no faces. Subject is the garden and its objects (soil, hands holding a seed packet, a watering can, raised beds, fennel going to flower).
- No 3D renders, no hand-drawn illustrations of vegetables, no isometric scenes.
- Diagrams (plot layouts, sun-path examples) are screenshots from the planner itself — eat your own dog food.

### Layout rules

- Fixed elements: top toolbar (56 px), right side panel (320 px), optional bottom status bar (32 px). Everything else is canvas.
- Toolbar groups are separated by 1 px `--line-1` dividers; no big gaps, no group titles in the toolbar itself.
- The canvas takes all remaining space; it is the protagonist.
- Marketing site: 1200 px content width on desktop, generous 96 px vertical rhythm between sections.

### Cards

A "card" in PlotPlaner is: `--bg-surface` background, `1 px --line-1` border, `--radius-3` (8 px) corners, no shadow at rest. Padding `--space-5` (20 px). Cards never get coloured left borders, never get gradient headers, never tilt.

---

## Iconography

See full notes in the relevant preview cards. Short version:

- **No icon font** ships in the codebase today. We standardise on
  **Lucide** (https://lucide.dev) — open-source, 1.5 px stroke, geometric,
  matches our restrained drafting aesthetic. Loaded from CDN.
- Stroke weight `1.5`, size `16` (toolbar) / `20` (side panel / buttons) /
  `24` (marketing). Colour always inherits `currentColor`; never apply a
  fill to a stroke icon.
- The few Unicode glyphs the codebase uses today (`↶ ↷ ↺ ↻ ⚠ ✓`) **must be
  replaced with Lucide equivalents**: `undo-2`, `redo-2`, `rotate-ccw`,
  `rotate-cw`, `triangle-alert`, `check`.
- The product logo is a typographic wordmark + a small **plot-rectangle
  glyph** (`P` formed by a rotated rectangle, see `assets/logo-mark.svg`).
- No emoji in chrome. See Content Fundamentals.

---

## Caveats & substitutions

- **Fonts:** Brand fonts (**Montserrat** + **Cabin**) are self-hosted in `fonts/`. JetBrains Mono loads from Google Fonts (replace with self-hosted if you want fully offline rendering). Instrument Serif is an optional editorial face for marketing surfaces only — if you don't need it, you can remove the Google Fonts `@import` in `colors_and_type.css`.
- **Logos:** The codebase has no logo. We've drawn a placeholder
  typographic wordmark in `assets/logo.svg` plus a simple rectangle-glyph
  mark in `assets/logo-mark.svg`. Treat both as starter directions, not
  finished marks.
- **Photography:** No brand photography exists. UI kits and marketing pages
  use placeholder image slots (`<image-slot>`) where photos belong; drop
  real photos in to fill them.
- **Marketing site:** No marketing surface exists in the codebase. The
  marketing UI kit is a proposed direction, not a recreation.
