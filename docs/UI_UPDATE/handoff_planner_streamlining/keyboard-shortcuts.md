# Keyboard shortcuts

Reproduced from §12 of the audit. Every primary verb gets a single-key
shortcut, shown on its tool icon (not just in a tooltip). This is what makes
the rail and the floating toolbar feel like a workshop instead of a website.

The existing keyboard handler in `App.tsx` already guards against editable
targets via `isEditableTarget(e.target)` — preserve that pattern. Do not attach
key listeners on individual components.

## Tools

| Key  | Action                                                        |
|------|---------------------------------------------------------------|
| `V`  | Markera (Select) — default cursor                             |
| `B`  | Lägg till bädd (Add bed) — primary verb of the app            |
| `W`  | Lägg till vägg (Add wall) — bed with `wallHeight > 0`         |
| `P`  | Tomtgräns (Plot boundary) — draw / redraw the dashed plot     |
| `M`  | Mät (Measure) — two-click ruler                               |
| `G`  | Snap till rutnät (toggle snap)                                |
| `N`  | Norr-rotation (open the small north dial)                     |
| `S`  | Visa / dölj skuggor (toggle shadows)                          |
| `Esc`| Deselect any selection and return to Markera                  |

## Selection

| Key            | Action                                                     |
|----------------|------------------------------------------------------------|
| `R`            | Rotera +15°                                                |
| `Shift+R`      | Rotera -15°                                                |
| `Backspace`    | Ta bort vald (delete selection)                            |
| `Cmd+D`        | Duplicera                                                  |
| Arrow keys     | Nudga ett rutsteg. Shift+arrow = 1 mm.                     |
| `Alt` (hold)   | Tillfalligt av snap (suspend snap during the current drag) |
| `Shift` (hold) | Free rotation while rotating; aspect-locked while resizing |

## Time and scene

| Key      | Action                                                     |
|----------|------------------------------------------------------------|
| `[`      | Tid -15 min (preview time backwards)                       |
| `]`      | Tid +15 min (preview time forwards)                        |
| `Space`  | Animera dagen 06->20 (4-second sweep of the time scrubber) |
| `Cmd+Z`  | Angra — already implemented; keep                          |
| `Cmd+Shift+Z` | Gor om — already implemented; keep                    |
| `Cmd+/`  | Visa alla genvagar (open this sheet as a modal)            |

## Discoverability

- Tool keys (V/B/W/P/M/G/N) render in 9 px JetBrains Mono at the bottom-right of each tool square.
- Cmd+Z / Cmd+Shift+Z render quietly under the scene name in the top bar.
- All other shortcuts are reachable via Cmd+/, which opens a modal cheat-sheet styled like the inspector — same uppercase mini-labels, same mono key glyphs as `kbd-key` (1 px border, 2 px bottom border, 4 px radius, `--bg-surface` background).
