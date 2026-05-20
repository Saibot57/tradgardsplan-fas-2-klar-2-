/**
 * Pluggbar persistens-adapter för auto-save.
 *
 * Designval: adapter-mönster istället för middleware. Reducern förblir ren
 * (CLAUDE.md: inget state-management-bibliotek). FAS 3 kan svänga in en
 * HttpAdapter utan att röra reducer eller App.
 */
import type { SceneV6 } from "@kolonitradgard/spatial-core";
export interface ScenePersistence {
    save(scene: SceneV6): Promise<void>;
    load(): Promise<SceneV6 | null>;
    clear(): Promise<void>;
    /** Mänskligt läsbar identifierare (för status-chip i UI). */
    readonly label: string;
}
/** localStorage-adapter — default offline-persistens. ~5 MB-cap. */
export declare function localStorageAdapter(key?: string): ScenePersistence;
/** No-op adapter — för tester/SSR där localStorage saknas. */
export declare function memoryAdapter(): ScenePersistence;
