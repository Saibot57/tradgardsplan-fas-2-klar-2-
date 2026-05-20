/**
 * StatusRow — 28 px quiet truth strip at the bottom edge, below the TimeBar.
 *
 * Layout: collision pill (clickable → markerar krockande objekt) · separator ·
 * "N bäddar · X m² · Y L" · spacer · "Sparat HH:mm · Lat 55,87° N".
 */
import type { Dispatch } from "react";
import type { Action } from "./state.js";
import type { HistoryAction } from "./history.js";
import type { AutoSaveStatus } from "./useAutoSave.js";
interface Props {
    bedCount: number;
    totalAreaM2: number;
    totalSoilL: number;
    overlapCount: number;
    touchCount: number;
    collisionIds: string[];
    autoSaveStatus: AutoSaveStatus;
    latitudeDeg: number;
    dispatch: Dispatch<Action | HistoryAction>;
}
export declare function StatusRow({ bedCount, totalAreaM2, totalSoilL, overlapCount, touchCount, collisionIds, autoSaveStatus, latitudeDeg, dispatch, }: Props): import("react/jsx-runtime").JSX.Element;
export {};
