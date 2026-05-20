# Design tokens — quick reference

The full token sheet is `design-system/colors_and_type.css` (119 CSS custom
properties, light + dark variants). This file lists only the tokens consumed
by the new components in this refactor, with their light-mode values, so you
can sanity-check against the spec without grepping the whole CSS.

Never invent a colour. If a token doesn't exist for a use case, ask before
adding one.

## Surfaces

| Token            | Light       | Used for                                                     |
|------------------|-------------|--------------------------------------------------------------|
| `--bg-paper`     | `#F4EFE6`   | Page background (the document underneath all chrome)         |
| `--bg-surface`   | `#FBF8F2`   | Top bar, left rail, inspector, time bar, status row, popovers |
| `--bg-hover`     | `#ECE5D4`   | Hover background on icon buttons, menu items                 |
| `--bg-canvas`    | `#ECE5D4`   | The drawing area itself (faintly distinct from chrome)       |

## Ink

| Token        | Light      | Used for                                          |
|--------------|------------|---------------------------------------------------|
| `--ink-1`    | `#1F2419`  | Primary text, wordmark, primary buttons           |
| `--ink-2`    | `#5B5C50`  | Secondary text, uppercase labels, captions        |
| `--ink-3`    | `#7D7E70`  | Tertiary text (timestamps, hints, dim states)     |

## Lines

| Token       | Light      | Used for                                          |
|-------------|------------|---------------------------------------------------|
| `--line-1`  | `#D8D1C0`  | Hairlines, dividers, button borders, card borders |
| `--line-2`  | `#B8B19E`  | Stronger hairlines (time-bar ticks)               |

## Accents (role-based)

Use only for the role they're named for. **The selection outline uses `--accent-sun`** — same colour as keyboard focus.

| Token            | Light      | Role                                                          |
|------------------|------------|---------------------------------------------------------------|
| `--accent-bed`   | `#6E8C5A`  | Sage — plants, raised beds                                    |
| `--accent-soil`  | `#B5562E`  | Terracotta — soil, walls, primary actions, "now" indicators   |
| `--accent-sun`   | `#D4A24C`  | Ochre — sun, plot boundary, selection outline, focus ring     |
| `--accent-sky`   | `#6B8A9E`  | Slate-blue — information, sun-azimuth axis                    |
| `--accent-wall`  | `#8C8478`  | Warm grey — walls, inert structure                            |

## State

| Token              | Light      | Role                                             |
|--------------------|------------|--------------------------------------------------|
| `--state-success`  | `#4F7A3F`  | "Inga kollisioner", "Sparat"                     |
| `--state-danger`   | `#B23A2A`  | Collision warnings                               |
| `--danger-100`     | `#F4D9D2`  | Delete-button hover background                   |
| `--danger-700`     | `#80261B`  | Delete-button hover foreground                   |

## Buttons

The primary button is `--ink-1` background, `--bg-surface` foreground. Use these for the "Dela" and "Rita en tomt" buttons.

| Token                            | Light      | Role                                 |
|----------------------------------|------------|--------------------------------------|
| `--button-bg`                    | `--ink-1`  | Primary button background            |
| `--button-fg`                    | `--bg-surface` | Primary button foreground       |
| `--button-bg-hover`              | `#2F3527`  | Primary button hover                 |
| `--button-bg-press`              | `#14180F`  | Primary button pressed               |
| `--button-secondary-bg`          | `--bg-surface` | Secondary button background      |
| `--button-secondary-fg`          | `--ink-1`  | Secondary button foreground          |
| `--button-secondary-border`      | `--line-1` | Secondary button border              |
| `--button-secondary-bg-hover`    | `--bg-hover` | Secondary button hover background  |

## Type

| Token                       | Family stack                                                  | Used for                                  |
|-----------------------------|---------------------------------------------------------------|-------------------------------------------|
| `--font-display`            | Montserrat → Cabin → system                                   | Wordmark, headings, big numbers (48 px hero) |
| `--font-sans`               | Cabin → system                                                | UI chrome, panels, dialogs, body text    |
| `--font-mono`               | JetBrains Mono → ui-monospace                                 | Measurements, coordinates, key glyphs, timestamps |
| `--font-display-editorial`  | Instrument Serif → Iowan → Times                              | Italic pull quotes (audit doc only)      |

### Type scale (1.2 minor-third ratio)

| Token        | Value | Role                                          |
|--------------|-------|-----------------------------------------------|
| `--text-xs`  | 12 px | Labels, helper text                           |
| `--text-sm`  | 13 px | Toolbar buttons, small UI                     |
| `--text-base`| 15 px | Body, panel rows                              |
| `--text-md`  | 17 px | Lead paragraphs, h4                           |
| `--text-lg`  | 21 px | h4 (display)                                  |
| `--text-xl`  | 28 px | h3                                            |
| `--text-2xl` | 38 px | h2                                            |
| `--text-3xl` | 52 px | h1, marketing hero                            |
| `--text-4xl` | 72 px | Display, cover                                |

The inspector's sun-hours hero is **48 px JetBrains Mono** (custom, between md and 2xl) with `letter-spacing: -0.02em` and `font-variant-numeric: tabular-nums`.

### Tracking

| Token                | Value     | Use                                  |
|----------------------|-----------|--------------------------------------|
| `--tracking-display` | -0.02em   | Display & large headings             |
| `--tracking-tight`   | -0.01em   | Small headings, wordmark, scene name |
| `--tracking-normal`  | 0         | Body                                 |
| `--tracking-caps`    | 0.08em    | Uppercase mini-labels, status row    |

## Spacing (4 px base)

| Token       | Value | Common use                                |
|-------------|-------|-------------------------------------------|
| `--space-1` | 4 px  | Inline gap                                |
| `--space-2` | 8 px  | Tight gaps, inline-flex                   |
| `--space-3` | 12 px | Row padding, button x-padding             |
| `--space-4` | 16 px | Card padding (small), surface gutter      |
| `--space-5` | 20 px | Card padding (default), section gutter    |
| `--space-6` | 24 px | Block separation                          |
| `--space-7` | 32 px | Large block separation, between sections  |
| `--space-8` | 40 px | Big rhythm                                |
| `--space-9` | 48 px | Cover & marketing                         |
| `--space-10`| 64 px | Cover & marketing                         |
| `--space-11`| 80 px | Cover & marketing                         |
| `--space-12`| 96 px | Cover & marketing                         |

## Radii

| Token            | Value   | Use                                  |
|------------------|---------|--------------------------------------|
| `--radius-1`     | 2 px    | Inputs, chips, dimension pills       |
| `--radius-2`     | 4 px    | Buttons, kbd keys                    |
| `--radius-3`     | 8 px    | Cards, panels, popovers              |
| `--radius-4`     | 12 px   | Dialogs, modals                      |
| `--radius-pill`  | 999 px  | Pills (date pill, status pills)      |

## Shadows

| Token            | Value                                                                     | Use                              |
|------------------|---------------------------------------------------------------------------|----------------------------------|
| `--shadow-1`     | `0 1px 2px rgba(15, 17, 12, 0.06)`                                        | Subtle hover lift, time-bar marker |
| `--shadow-2`     | `0 4px 16px rgba(15,17,12,0.08), 0 1px 3px rgba(15,17,12,0.04)`            | Menus, popovers, floating toolbar |
| `--shadow-3`     | `0 16px 48px rgba(15,17,12,0.14), 0 2px 6px rgba(15,17,12,0.06)`           | Modals                           |
| `--shadow-focus` | `0 0 0 2px var(--accent-sun)`                                              | Focus ring                       |

No inner shadows. No coloured shadows. No glows.

## Layout constants

| Token                    | Value    | Use                                  |
|--------------------------|----------|--------------------------------------|
| `--layout-toolbar-h`     | 56 px    | Top bar height                       |
| `--layout-sidepanel-w`   | 320 px   | Inspector width                      |
| `--layout-statusbar-h`   | 32 px    | (today's status bar; we use 28 px — minor override) |
| `--layout-page-max`      | 1200 px  | Marketing content max width          |

Additional layout constants the new components establish (not yet in the token sheet — fine to inline as magic numbers for now, but worth promoting later):
- Left rail width: **56 px**
- Tool square: **40 × 40 px**
- Time bar height: **64 px**
- Status row height: **28 px**

## Motion

| Token              | Value                                  | Use                              |
|--------------------|----------------------------------------|----------------------------------|
| `--duration-fast`  | 120 ms                                 | Hover/press transitions          |
| `--duration-base`  | 180 ms                                 | Panel open, dialog enter         |
| `--duration-slow`  | 260 ms                                 | Larger choreography              |
| `--ease-out`       | `cubic-bezier(0.2, 0.6, 0.2, 1)`        | Default easing                   |
| `--ease-out-soft`  | `cubic-bezier(0.16, 0.84, 0.44, 1)`     | Softer landing                   |

All transitions respect `@media (prefers-reduced-motion: reduce)`. The canvas itself never animates.

## Dark "evening" mode

The token sheet defines `[data-theme="dark"]` overrides for every semantic
token. Apply `data-theme="dark"` to `<html>` or `<body>` to opt in. Light mode
is the brand; dark is for late-evening planning.
