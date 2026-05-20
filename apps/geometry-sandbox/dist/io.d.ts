import type { Dispatch } from "react";
import type { Action, SandboxState } from "./state.js";
import type { HistoryAction } from "./history.js";
/** Trigger browser file-download of the current scene as JSON (integer mm). */
export declare function saveScene(state: SandboxState): void;
/** Open a file picker, parse + migrate scene, dispatch loadScene. Shows alert on error.
 *  onLoaded körs efter lyckad dispatch — används för att resetta auto-save baseline. */
export declare function loadSceneFromFile(dispatch: Dispatch<Action | HistoryAction>, onLoaded?: () => void): Promise<void>;
/** Exportera nuvarande canvas (första <canvas>-elementet) som PNG-nedladdning. */
export declare function exportCanvasAsPng(filename?: string): void;
