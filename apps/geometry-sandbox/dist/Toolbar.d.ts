import { type Dispatch } from "react";
import type { Action, SandboxState } from "./state.js";
import type { ObjectKind } from "@kolonitradgard/spatial-core";
import type { HistoryAction } from "./history.js";
import type { AutoSaveStatus } from "./useAutoSave.js";
import type { ScenePersistence } from "./persistence.js";
interface Props {
    state: SandboxState;
    dispatch: Dispatch<Action | HistoryAction>;
    bedDepth: number;
    setBedDepth: (mm: number) => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    autoSaveStatus: AutoSaveStatus;
    onResetAutoSaveBaseline: () => void;
    adapter: ScenePersistence;
}
/** Default-mått (mm) per objekttyp för Lägg-till-popovern. */
interface KindDefaults {
    width: number;
    height: number;
    wallHeight: number;
}
export declare const KIND_DEFAULTS: Readonly<Record<ObjectKind, KindDefaults>>;
export declare const KIND_LABELS: Readonly<Record<ObjectKind, string>>;
export declare function Toolbar({ state, dispatch, bedDepth, setBedDepth, onUndo, onRedo, canUndo, canRedo, autoSaveStatus, onResetAutoSaveBaseline, adapter, }: Props): import("react/jsx-runtime").JSX.Element;
export {};
