# Handoff: PlotPlaner UI streamlining

A bold IA refactor of the `geometry-sandbox` planner UI in
[`Saibot57/tradgardsplan-fas-2-klar-2-`](https://github.com/Saibot57/tradgardsplan-fas-2-klar-2-).
The goal is to take today's single 14-control top toolbar and split it into four
single-purpose surfaces, move per-selection controls onto the canvas, promote the
sun/time scrubber to a full-width bottom strip, replace JSON save/load with
local-first autosave + named scenes, and add a proper empty / onboarding state.

---

## 0. Read this first — this is not a greenfield design

The HTML file in `spec/` is a **design reference**, not code to copy.

It is a visual spec built to show **what each surface of the planner should
look and behave like after the refactor**. The actual implementation lives in
the existing React + TypeScript codebase
[`Saibot57/tradgardsplan-fas-2-klar-2-`](https://github.com/Saibot57/tradgardsplan-fas-2-klar-2-)
under `apps/geometry-sandbox/src/` — that's the codebase you will be modifying
in place. The repo is a pnpm workspace; the planner is one of two apps.

What you should do, in order:

1. **Clone the repo.** Confirm `pnpm install && pnpm dev` runs the
   `geometry-sandbox` app locally.
2. **Open `spec/PlotPlaner – Streamlining Audit.html` in a browser.** That
   document is the source of truth — read it cover to cover. It contains the
   rationale, the new IA diagram, before/after annotated mockups for every
   surface, and a migration table that maps every current control to its new
   home.
3. **Read `reference/current-source/`** — copies of the current `Toolbar.tsx`,
   `SidePanel.tsx`, `App.tsx`, `Canvas.tsx`, `Handles.tsx`, `TimeSlider.tsx`,
   `state.ts`, `io.ts`. These are pinned snapshots of the files you will be
   modifying; use them to orient before opening the real repo, but trust the
   live repo over these snapshots if they drift.
4. **Read `design-system/`** — the visual language. `colors_and_type.css` is
   the design-token sheet (119 CSS custom properties); `README.md` is the
   design-system guide that explains the voice, the colours, the spacing, the
   icon stance ("no icon font; standardise on Lucide"), etc. Use these tokens
   verbatim. Do not invent colours.
5. **Implement in the order given in §13 of the audit.** Each of the seven
   steps is independently shippable. Don't attempt the whole refactor as one
   patch.

---

## 1. Fidelity

**High-fidelity for the destination, prose-described for the journey.**

All mockups in `spec/PlotPlaner – Streamlining Audit.html` are pixel-fidelity
recreations using the real design tokens — final colours, spacing, type, and
layout. Treat them as the visual target. The rotation handle, resize handles,
snapping behaviour, hover/press states, and animation timings are described in
prose in the audit (mostly §06 and the design-system stance); implement against
the prose, since the visuals show resting states only.

In-product copy in the mockups is **Swedish but illustrative** — final Swedish
wording should be reviewed with a native speaker before shipping user-visible
text. The English here in this README is for the dev.

---

## 2. The seven shippable slices (rollout order)

This is the recommended sequence, reproduced from §13 of the audit. Each slice
is independently mergeable; ship them one at a time. Estimates assume one
developer.

| # | Slice | Touches | Estimate |
|---|---|---|---|
| 1 | **Visual refresh** — apply the design-system tokens to today's layout. Same controls, just calmer. Dark mode becomes opt-in "evening" mode; default is "paper" light. | `Toolbar.tsx`, `SidePanel.tsx`, `App.tsx`, plus a new tokens stylesheet. | ~1 day |
| 2 | **Bottom time bar** — extract the date input + time slider from the toolbar and promote to a full-width 64 px strip docked to the bottom. Add the eye-toggle (shadow on/off) and the Space-to-animate-the-day affordance. | New `TimeBar.tsx`; remove sun/time bits from `Toolbar.tsx`. | ~1 day |
| 3 | **Floating selection toolbar** — when a bed is selected, render a small pill above it with rotate / wall-toggle / duplicate / delete. Remove per-selection controls from `Toolbar.tsx`. Add the rotation handle and 8 resize handles on canvas (the codebase already has hit-targets via `Handles.tsx`; make them visible). | New `FloatingSelectionToolbar.tsx`; `Canvas.tsx`; `Handles.tsx`; remove per-bed controls from `Toolbar.tsx`. | ~1 day |
| 4 | **Left tool rail** — 56 px vertical rail with Select / Bed / Wall / Plot / Measure tools, plus Grid + North as quiet modifiers below a divider. One-key shortcuts (V/B/W/P/M/G/N). | New `ToolRail.tsx`; new `currentTool` field in `state.ts`; keyboard handler in `App.tsx`. | ~2 days |
| 5 | **Inspector rebuild** — sun-hours becomes a 48 px mono hero; field rows accept direct numeric input; the empty state turns into a Scene panel listing every bed with its sun-hours and the plot totals. | `SidePanel.tsx`; small additions to state for editable rows. | ~2 days |
| 6 | **Local autosave + scene menu** — wire `localStorage` autosave on a 600 ms debounce, add a named-scene model, expose the scene-menu dropdown in the new top bar. "Spara JSON" / "Ladda JSON" become "Exportera som JSON" / "Importera JSON" inside the menu. | `io.ts`; new `scenes.ts`; new `SceneMenu.tsx`; small top-bar additions. | ~3 days |
| 7 | **Empty state + onboarding** — when there's no plot, the canvas overlays the "Börja med att rita din tomt." hero with three preset sizes. When there's a plot but no beds, a quieter prompt. | `Canvas.tsx` (overlay layer), small additions to `App.tsx`. | ~1 day |

**Slices 1–3 alone already reduce the top bar from 14 controls to about 6** and
ship in a single weekend. Stop after slice 3 if budget is tight.

---

## 3. What's in this bundle

```
handoff_planner_streamlining/
├── README.md                                 ← this file
├── migration-table.md                        ← every current control, mapped to its new home
├── keyboard-shortcuts.md                     ← shortcut grid (tools, selection, time)
├── design-tokens.md                          ← extracted token reference
├── spec/
│   └── PlotPlaner – Streamlining Audit.html  ← THE design spec; open this in a browser
├── reference/
│   └── current-source/                       ← pinned snapshot of the files you'll modify
│       ├── App.tsx                           ← the reducer host + layout
│       ├── Toolbar.tsx                       ← the 14-control top bar being dismantled
│       ├── SidePanel.tsx                     ← the inspector being rebuilt
│       ├── TimeSlider.tsx                    ← the inline range being promoted
│       ├── Canvas.tsx                        ← where shadows render, where the rail lives
│       ├── Handles.tsx                       ← existing handle code, to be made visible
│       ├── state.ts                          ← the reducer + action types
│       └── io.ts                             ← the JSON save/load helpers
└── design-system/
    ├── README.md                             ← design-system guide (voice, colour, type, etc.)
    ├── colors_and_type.css                   ← 119 CSS custom properties — the only source of style truth
    ├── assets/                               ← logo SVGs to use in the wordmark
    └── fonts/                                ← Montserrat + Cabin .ttf (self-host these)
```

---

## 4. Design tokens & visual stance — the non-negotiables

Read `design-system/README.md` cover to cover, but the headline rules:

- **Light "paper" mode is the brand.** Dark mode is opt-in "evening" mode for late-evening planning.
- **No gradients on chrome.** No backdrop-blur. No 16 px blob radii. This is a drafting tool.
- **Type:** Montserrat (display / wordmark / hero numbers), Cabin (UI), JetBrains Mono (measurements). All self-hosted.
- **Colour roles:** sage `--accent-bed` for beds & plants, terracotta `--accent-soil` for soil & primary actions, ochre `--accent-sun` for sun & focus rings, slate-blue `--accent-sky` for information, warm grey `--accent-wall` for walls. **Selection outline uses `--accent-sun`, same as keyboard focus.**
- **Icons:** Lucide, 1.5 px stroke, 16 / 20 / 24 px. The current Unicode glyphs (↶ ↷ ↺ ↻ ⚠ ✓) are replaced. The mapping table is in `design-system/README.md` under Iconography.
- **Voice:** Swedish, "du"-form, sentence case, drafting-book tone. No emoji in chrome. No hype copy. See `design-system/README.md` "Content fundamentals" for a do/don't table.
- **Numbers** carry their unit and use a thin space: `2 000 mm`, `12,3 m²`, `06:00`. Decimal comma (sv-SE), period in EN. Mono font for any number the gardener might compare or copy.

The 119 CSS custom properties in `colors_and_type.css` define the entire token surface. Implementation should ship that stylesheet once at the root and consume `var(--*)` from every component.

See `design-tokens.md` for a quick-reference list of just the tokens the new components use.

---

## 5. Behaviour & interaction details

### Tool rail

- 56 px wide, `--bg-surface`, `1 px --line-1` right border.
- Each tool is a 40 × 40 px square with a 1.5 px Lucide icon and a 9 px mono shortcut in the bottom-right corner.
- Active tool: `--ink-1` background, `--bg-surface` foreground.
- Tools: V Select · B Bed · W Wall · P Plot · M Measure · (divider) · G Snap · N North.
- Pressing the key letter activates the tool. Esc returns to Select.
- The "P" tool dims (not hides) after the plot is drawn.

### Floating selection toolbar

- Appears 8 px above the selected rectangle's top edge.
- 36 px tall, `--bg-surface` background, `1 px --line-1` border, `--shadow-2`.
- Contents (left → right): mono label "Bädd · 2,00 × 1,00 m · 15°" → separator → rotate −15° / rotate +15° → separator → bädd/vägg toggle / duplicate → separator → delete (hover turns the delete cell `--danger-100` / `--danger-700`).
- Disappears when nothing is selected.
- Position: kept inside the canvas viewport; if the selection is near the top, the toolbar flips below the rectangle.

### Canvas handles

- 8 resize handles: `8 × 8 px`, `--bg-surface` fill, `1.5 px --accent-sun` stroke.
- 1 rotation handle: a `10 px` circle attached to a `36 px` lead-line above the top edge, both `--accent-sun`.
- During drag, render live mm dimension labels (mono, 11 px, on a `--bg-surface` pill with `--line-1` border) next to the affected edge.

### Snapping

- **Default ON** (today it ships off; we flip the default in `initialState`).
- Hold `Alt` to suspend snap mid-drag (do not toggle the persisted setting).
- Hold `Shift` while rotating for free rotation; release to snap to 15° detents.
- Hold `Shift` while resizing to keep aspect ratio.

### Time bar

- 64 px tall, full width, docked above the 28 px status row.
- Date pill (left) is a button; clicking opens a small popover with a normal date input + named-date chips (midsommar / vårdagjämning / höstdagjämning).
- Scrubber centre: 4 px track, ochre `now-arc` from 06:00 to current time, hour ticks at 06 / 09 / 12 / 15 / 18 / 20 with mono labels under the ticks, 14 px ochre marker handle.
- Right: plain-language readout "13:30 · sol 41° över horisonten · söder" (mono, 12.5 px). Hover the readout for raw alt/az degrees.
- Eye-icon button (S key) toggles `state.showShadows`. Sun-icon button starts a 4-second animation that scrubs 06→20.

### Status row

- 28 px tall, `--bg-surface`, mono 11.5 px, `--ink-2`.
- Layout: collision pill (clickable to highlight offending beds) · separator · "N bäddar · X m² · Y L" · spacer · "Sparat HH:mm · Lat 55,87° N".
- Sage `--state-success` for "Inga kollisioner"; terracotta `--state-danger` for "N bäddar krockar".

### Autosave + scenes

- Persist the scene to `localStorage` under `plotplaner.scenes.<id>` on a 600 ms debounce after any committed reducer action.
- A `plotplaner.scenes.index` key holds the list of scene metadata (id, name, lastSaved, plotDimensions, bedCount).
- The scene menu in the top bar drives create / rename / duplicate / delete; import/export JSON live in the same menu but visually demoted.
- Show "Sparat HH:mm" in the status row whenever the debounce has fired. If it hasn't (the scene has unsaved edits), show "Sparas…" instead.
- **Honesty cue**: a small mono note in the corner reads *"Allt sparas i din webbläsare. Exportera JSON för säkerhetskopia."* Don't pretend this is cloud sync.

### Empty state

- When `state.plot.boundaryRect == null`: overlay the canvas with a centred hero. Headline (Montserrat 36 px, `--ink-1`), one paragraph of explanatory copy, a primary "Rita en tomt" button, and three named-preset secondary buttons (Kolonilott 10 × 10 m / Radhusträdgård 8 × 5 m / Villaträdgård 15 × 12 m). Under them, a quiet "P" kbd hint.
- When `state.plot.boundaryRect != null` and `state.rectangles.length === 0`: a quieter centred overlay reading *"Bra. Klicka var som helst för att lägga till en bädd."* with a "B" kbd hint.
- Once there's at least one bed, no overlay.

---

## 6. State changes needed

The audit doesn't redesign the data model; it redesigns the surface. But a few small additions are needed in `state.ts`:

- `currentTool: "select" | "bed" | "wall" | "plot" | "measure"` — drives the rail's active state and the cursor's behaviour. Default `"select"`.
- `snapToGrid` default flips from `false` → `true`.
- Scenes are a new layer above the existing `SandboxState` — see `scenes.ts` to be written; today the reducer assumes one current scene.
- The existing `state.sun.dateIso` (preview time) and the inspector's `REFERENCE_DATE` for `bedSunHours` (aggregate) must remain decoupled — they're already ADR-007/008-separated; do not unify them.

The reducer's existing `AUTO_COMMIT_ACTIONS` set in `App.tsx` is the right place to add the autosave-debounce hook; that's also the right place to trigger the scenes-index update.

---

## 7. Migration table — every current control, accounted for

See `migration-table.md` for the full table, or §11 of the audit HTML for the
same content with annotated visuals.

Headline: no control disappears silently. Every entry in today's `Toolbar.tsx`
maps to either a left-rail tool, a floating-selection toolbar button, an
inspector row, the time bar, the scene menu, the status row, or a keyboard
shortcut. The table is the migration plan.

---

## 8. Keyboard shortcuts

See `keyboard-shortcuts.md`. Highlights:

- V / B / W / P / M to switch tool. G to toggle snap. N opens the north dial. S toggles shadows. Esc deselects + returns to Select.
- R / Shift+R to rotate selected ±15°. Backspace deletes. ⌘D duplicates. Arrow keys nudge one grid step (Shift = 1 mm).
- ⌘Z / ⌘⇧Z already implemented — keep.
- `[` / `]` scrub time ±15 min. Space animates 06→20.
- ⌘/ shows the full shortcut sheet.

Implementation note: the existing keyboard handler in `App.tsx` already guards
against editable targets (`isEditableTarget`). Extend that pattern; do not add
listeners on individual components.

---

## 9. Out of scope

- **Account system, cloud sync, sharing.** The audit assumes local-only storage. The "Dela" button in the top bar is currently a no-op affordance for a future feature; until you build accounts, treat it as the export-JSON entry point or hide it.
- **`apps/solar-prototype`.** This audit only covers `apps/geometry-sandbox`. The solar prototype is referenced in the design-system README as planned but not shipping.
- **Marketing site.** A marketing UI kit exists under `design-system/ui_kits/marketing/` but is out of scope for this slice of work.
- **Mobile / tablet layout.** This is a desktop tool. Below ~960 px viewport, gracefully tell the user to use a larger screen; don't try to reflow the four-surface IA at small sizes.

---

## 10. Verification checklist

When each slice is done, eyeball these against the audit before merging:

- [ ] **Slice 1** — toolbar still has all original controls, but uses paper-light tokens; collision/totals text uses semantic colour vars.
- [ ] **Slice 2** — time scrubber no longer in top bar; bottom strip renders with arc, ticks, plain-language readout.
- [ ] **Slice 3** — clicking a bed shows the floating toolbar above it; rotation handle visible; resize handles visible; per-selection controls removed from top bar.
- [ ] **Slice 4** — left rail with 7 tools + divider; one-letter shortcuts wired; active tool indicates state correctly; default tool is Select.
- [ ] **Slice 5** — inspector sun-hours hero at 48 px mono; rows editable; empty state shows Scene panel with bed list + totals.
- [ ] **Slice 6** — opening the planner in a fresh browser shows recent scenes; making an edit and refreshing preserves it; "Spara JSON" is gone from the toolbar.
- [ ] **Slice 7** — fresh `localStorage` shows the empty-state overlay; preset buttons draw a boundary and dismiss the overlay; "B"-key state shows the second-stage overlay.

Per-slice console: no warnings or errors. Per-slice a11y: every focusable
element has a visible focus ring (`--shadow-focus` / `--accent-sun` 2 px outline,
2 px offset). Per-slice motion: respects `prefers-reduced-motion: reduce`.

---

## 11. Quick start

```bash
git clone https://github.com/Saibot57/tradgardsplan-fas-2-klar-2-.git
cd tradgardsplan-fas-2-klar-2-
pnpm install
pnpm dev        # geometry-sandbox should open in your browser

# In another tab:
open "spec/PlotPlaner – Streamlining Audit.html"   # read the spec

# Then, slice 1 first:
#   - drop `design-system/colors_and_type.css` into apps/geometry-sandbox/src/
#   - import it at the top of main.tsx
#   - replace the inline styles in Toolbar.tsx, SidePanel.tsx, App.tsx with
#     var(--*) tokens (no behaviour changes)
#   - ship.
```

Good luck. The biggest UX win in this whole plan isn't the rail or the time
bar — it's slice 6 (autosave + named scenes). If you have time for only one
slice past the visual refresh, do that one.
