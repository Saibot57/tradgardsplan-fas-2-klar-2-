/**
 * Pluggbar persistens-adapter för auto-save.
 *
 * Designval: adapter-mönster istället för middleware. Reducern förblir ren
 * (CLAUDE.md: inget state-management-bibliotek). FAS 3 kan svänga in en
 * HttpAdapter utan att röra reducer eller App.
 */
const DEFAULT_KEY = "pp-scene-v1";
/** localStorage-adapter — default offline-persistens. ~5 MB-cap. */
export function localStorageAdapter(key = DEFAULT_KEY) {
    return {
        label: "localStorage",
        async save(scene) {
            try {
                localStorage.setItem(key, JSON.stringify(scene));
            }
            catch (err) {
                // QuotaExceededError (Safari private mode) eller storage disabled.
                // Fångas och kastas vidare så useAutoSave kan flagga error-state.
                throw new Error(`localStorage save failed: ${err.message}`);
            }
        },
        async load() {
            try {
                const raw = localStorage.getItem(key);
                if (!raw)
                    return null;
                return JSON.parse(raw);
            }
            catch {
                return null;
            }
        },
        async clear() {
            try {
                localStorage.removeItem(key);
            }
            catch {
                /* ignore */
            }
        },
    };
}
/** No-op adapter — för tester/SSR där localStorage saknas. */
export function memoryAdapter() {
    let store = null;
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
//# sourceMappingURL=persistence.js.map