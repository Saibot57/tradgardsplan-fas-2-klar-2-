# PlantCatalog Handoff

Drop-in package for implementing the **Växter** tab in the existing
`Saibot57/tradgardsplan-fas-2-klar-2-` planner app.

## Read order

1. **`plant_catalog_ui_implementation.md`** — the implementation guide. Start here.
2. **`PROMPT_PLANT_CATALOG_UI.md`** — original product brief (Swedish).
3. **`PlantCatalog.html`** — open in any browser; no build, no server.
   Click around to feel the interactions.
4. **`reference-source/`** — the prototype's React/JSX source, modular.
   Port to TypeScript per §2 of the implementation guide.

## Files

```
handoff/
├── README.md                              this file
├── plant_catalog_ui_implementation.md     ★ implementation guide
├── PROMPT_PLANT_CATALOG_UI.md             original brief
├── PlantCatalog.html                      working prototype (self-contained)
├── reference-source/                      un-inlined source of the prototype
│   ├── data.jsx                           sample plants + bed scene
│   ├── icons.jsx                          Lucide-style stroke icons
│   ├── ui.jsx                             Button, Row, SectionTitle, Chip,
│   │                                      CategoryBadge, RangeBar, PlantThumb,
│   │                                      TabBar, SunCategoryGlyph
│   ├── planera-tab.jsx                    placeholder for existing Canvas+SidePanel
│   ├── catalog.jsx                        the main work (list + detail card)
│   ├── app.jsx                            shell with tab routing + reducer
│   └── tweaks-panel.jsx                   prototype-only host integration
│                                          (DO NOT PORT — see §9.11)
├── tokens/
│   └── colors_and_type.css                canonical design tokens; diff
│                                          against your repo's copy
└── assets/
    ├── logo-mark.svg
    └── logo-mark-dark.svg
```

## License / origin

These are reference artefacts for a single feature. Treat the prototype as
an executable spec, not as code to import — port the patterns into your
TypeScript codebase using the implementation guide's file tree.
