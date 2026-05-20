import { type SceneV6 } from "@kolonitradgard/spatial-core";
import type { SandboxState } from "./state.js";
import type { ScenePersistence } from "./persistence.js";
export type AutoSaveStatus = {
    kind: "idle";
} | {
    kind: "saving";
} | {
    kind: "saved";
    at: number;
} | {
    kind: "error";
    message: string;
};
/**
 * Observerar scen-relevant state (rectangles + plot) och persistar via adapter.
 * Session-state (viewport, sun, selectedId, snapToGrid) ignoreras avsiktligt
 * — de är inte del av SceneV6 (ADR-008/009).
 */
export declare function useAutoSave(state: SandboxState, adapter: ScenePersistence, enabled?: boolean): {
    status: AutoSaveStatus;
    /** Återställ dirty-tracking efter manuell loadScene/clear så nästa change sparas. */
    resetBaseline: () => void;
};
/**
 * Bootstrap: ladda persistad scen vid mount. Returnerar parsad SceneV6 eller null.
 * Hanterar fel tyst — vid migration/parse-fel returneras null så appen startar
 * med default-state istället för att krascha.
 */
export declare function bootstrapFromAdapter(adapter: ScenePersistence): Promise<SceneV6 | null>;
