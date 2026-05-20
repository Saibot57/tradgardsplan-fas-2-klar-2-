import { type Dispatch } from "react";
import type { Action, SandboxState } from "./state.js";
import { type SunPosition } from "@kolonitradgard/spatial-core";
import type { HistoryAction } from "./history.js";
interface Props {
    state: SandboxState;
    dispatch: Dispatch<Action | HistoryAction>;
    sun: SunPosition;
    overlappingIds: Set<string>;
    touchingIds: Set<string>;
    theme: "light" | "dark";
}
export declare function Canvas({ state, dispatch, sun, overlappingIds, touchingIds, theme }: Props): import("react/jsx-runtime").JSX.Element;
export {};
