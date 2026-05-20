/**
 * FloatingSelectionToolbar — a small pill that floats above the selected
 * rectangle and carries the per-object verbs (rotate, bädd↔vägg, duplicate,
 * delete). Rendered inside the Canvas container; positioned in screen px by
 * the caller, who already has the viewport transform.
 *
 * Per-object verbs belong to the object, not the chrome (migration table §11).
 */
import type { Dispatch } from "react";
import { type Rect } from "@kolonitradgard/spatial-core";
import type { Action } from "./state.js";
import type { HistoryAction } from "./history.js";
export interface FloatingPlacement {
    left: number;
    top: number;
}
interface Props {
    rect: Rect;
    selectedCount: number;
    placement: FloatingPlacement;
    dispatch: Dispatch<Action | HistoryAction>;
}
export declare function FloatingSelectionToolbar({ rect, selectedCount, placement, dispatch }: Props): import("react/jsx-runtime").JSX.Element;
export {};
