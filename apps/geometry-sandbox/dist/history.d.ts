/**
 * Snapshot-based undo/redo (ADR-007).
 *
 * Snapshots store canonicalized state (integer mm). Auto-commit fires for
 * atomic mutations; drag flows dispatch `commitHistory` explicitly on
 * pointerDown so a single drag burst becomes one snapshot.
 */
export interface HistoryState<S> {
    past: S[];
    present: S;
    future: S[];
}
export type HistoryAction = {
    type: "undo";
} | {
    type: "redo";
} | {
    type: "commitHistory";
};
export declare const HISTORY_MAX = 50;
export declare function withHistory<S, A extends {
    type: string;
}>(reducer: (state: S, action: A) => S, autoCommitTypes: ReadonlySet<A["type"]>): (state: HistoryState<S>, action: A | HistoryAction) => HistoryState<S>;
export declare function canUndo<S>(state: HistoryState<S>): boolean;
export declare function canRedo<S>(state: HistoryState<S>): boolean;
