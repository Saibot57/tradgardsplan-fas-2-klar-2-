/**
 * SidePanel — per-bed inspector.
 *
 * Aggregate summer sun hours use a fixed reference date (midsummer)
 * and are INDEPENDENT of the TimeBar (which controls interactive shadow
 * preview). The two are never collapsed into a shared state field.
 */
import { type Dispatch } from "react";
import { type Action, type SandboxState } from "./state.js";
import type { HistoryAction } from "./history.js";
import type { PlantCareProfile } from "./plants/types.js";
interface Props {
    state: SandboxState;
    bedDepth: number;
    dispatch: Dispatch<Action | HistoryAction>;
    overlappingIds: Set<string>;
    touchingIds: Set<string>;
    /** Catalog used to look up category + scientific name per placement. */
    plants: readonly PlantCareProfile[];
}
export declare function SidePanel({ state, bedDepth, dispatch, overlappingIds, touchingIds, plants, }: Props): import("react/jsx-runtime").JSX.Element;
export {};
