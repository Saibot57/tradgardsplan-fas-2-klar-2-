# ADR-007: History/undo-redo via snapshots

- **Status:** Accepted
- **Datum:** 2025
- **Beslutstagare:** Projektägare

## Kontext

Vi behöver undo/redo-funktionalitet i Sandbox. Två vanliga mönster finns: command-pattern och snapshot-baserad history. Vi väljer det senare för enkelhet och robusthet.

## Beslut

**Snapshot-baserad undo/redo** används (inte command-pattern).

- Endast **canonicalized state** (heltal mm) sparas i historiken.
- Max 50 snapshots i `past`.
- Snapshots tas **efter** interaction-end-actions (t.ex. `moveSelected`, `rotateSelected`, `resizeSelected`, `addRect`, `removeSelected`, `setWallHeight`).
- Snapshots tas **inte** vid mid-drag (float-värden tillåtna internt).
- Snapshots tas **inte** vid viewport-ändringar (`setViewport`).
- Keyboard-genvägar: ⌘Z / Ctrl+Z (undo) och ⌘⇧Z / Ctrl+Shift+Z (redo).

`HistoryState` lever i `SandboxState` som:
```ts
past: SandboxState[]
present: SandboxState
future: SandboxState[]
```

## Konsekvens

- Enkel implementation med `withHistory`-higher-order reducer.
- Stark garanti att sparad historik aldrig innehåller float-koordinater.
- Viewport och sol-tid (interactive preview) återställs inte vid undo.