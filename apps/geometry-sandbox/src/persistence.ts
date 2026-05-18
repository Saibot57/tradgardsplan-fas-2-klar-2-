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

const DEFAULT_KEY = "pp-scene-v1";

/** localStorage-adapter — default offline-persistens. ~5 MB-cap. */
export function localStorageAdapter(key: string = DEFAULT_KEY): ScenePersistence {
  return {
    label: "localStorage",
    async save(scene) {
      try {
        localStorage.setItem(key, JSON.stringify(scene));
      } catch (err) {
        // QuotaExceededError (Safari private mode) eller storage disabled.
        // Fångas och kastas vidare så useAutoSave kan flagga error-state.
        throw new Error(`localStorage save failed: ${(err as Error).message}`);
      }
    },
    async load() {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        return JSON.parse(raw) as SceneV6;
      } catch {
        return null;
      }
    },
    async clear() {
      try {
        localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    },
  };
}

/** No-op adapter — för tester/SSR där localStorage saknas. */
export function memoryAdapter(): ScenePersistence {
  let store: SceneV6 | null = null;
  return {
    label: "memory",
    async save(scene) {
      store = scene;
    },
    async load() {
      return store;
    },
    async clear() {
      store = null;
    },
  };
}
