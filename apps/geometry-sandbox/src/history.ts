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

export type HistoryAction =
  | { type: "undo" }
  | { type: "redo" }
  | { type: "commitHistory" };

export const HISTORY_MAX = 50;

function pushBounded<T>(arr: readonly T[], item: T): T[] {
  const next = arr.length >= HISTORY_MAX ? arr.slice(arr.length - HISTORY_MAX + 1) : arr.slice();
  next.push(item);
  return next;
}

export function withHistory<S, A extends { type: string }>(
  reducer: (state: S, action: A) => S,
  autoCommitTypes: ReadonlySet<A["type"]>,
): (state: HistoryState<S>, action: A | HistoryAction) => HistoryState<S> {
  return function historyReducer(state, action) {
    if (action.type === "undo") {
      if (state.past.length === 0) return state;
      const prev = state.past[state.past.length - 1]!;
      return {
        past: state.past.slice(0, -1),
        present: prev,
        future: [...state.future, state.present],
      };
    }
    if (action.type === "redo") {
      if (state.future.length === 0) return state;
      const next = state.future[state.future.length - 1]!;
      return {
        past: pushBounded(state.past, state.present),
        present: next,
        future: state.future.slice(0, -1),
      };
    }
    if (action.type === "commitHistory") {
      return {
        past: pushBounded(state.past, state.present),
        present: state.present,
        future: [],
      };
    }

    const innerAction = action as A;
    const nextPresent = reducer(state.present, innerAction);
    if (nextPresent === state.present) return state;

    if (autoCommitTypes.has(innerAction.type)) {
      return {
        past: pushBounded(state.past, state.present),
        present: nextPresent,
        future: [],
      };
    }
    return { ...state, present: nextPresent };
  };
}

export function canUndo<S>(state: HistoryState<S>): boolean {
  return state.past.length > 0;
}

export function canRedo<S>(state: HistoryState<S>): boolean {
  return state.future.length > 0;
}
