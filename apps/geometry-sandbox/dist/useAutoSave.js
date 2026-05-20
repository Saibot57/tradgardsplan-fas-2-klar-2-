import { useEffect, useRef, useState } from "react";
import { serializeScene, parseScene, migrateScene, SceneParseError } from "@kolonitradgard/spatial-core";
const DEBOUNCE_MS = 500;
/**
 * Observerar scen-relevant state (rectangles + plot) och persistar via adapter.
 * Session-state (viewport, sun, selectedId, snapToGrid) ignoreras avsiktligt
 * — de är inte del av SceneV6 (ADR-008/009).
 */
export function useAutoSave(state, adapter, enabled = true) {
    const [status, setStatus] = useState({ kind: "idle" });
    const lastSavedJsonRef = useRef("");
    const timerRef = useRef(null);
    useEffect(() => {
        if (!enabled)
            return;
        const scene = serializeScene({
            plot: { northRotationDeg: state.plot.northRotationDeg, location: state.plot.location },
            boundary: state.plot.boundaryRect,
            rectangles: state.rectangles,
            plannedPlantIds: state.plannedPlantIds,
        });
        const json = JSON.stringify(scene);
        if (json === lastSavedJsonRef.current)
            return;
        if (timerRef.current)
            clearTimeout(timerRef.current);
        setStatus({ kind: "saving" });
        timerRef.current = setTimeout(() => {
            adapter
                .save(scene)
                .then(() => {
                lastSavedJsonRef.current = json;
                setStatus({ kind: "saved", at: Date.now() });
            })
                .catch((err) => {
                setStatus({ kind: "error", message: err.message });
            });
        }, DEBOUNCE_MS);
        return () => {
            if (timerRef.current)
                clearTimeout(timerRef.current);
        };
    }, [state.rectangles, state.plot, state.plannedPlantIds, adapter, enabled]);
    return {
        status,
        resetBaseline: () => {
            lastSavedJsonRef.current = "";
        },
    };
}
/**
 * Bootstrap: ladda persistad scen vid mount. Returnerar parsad SceneV6 eller null.
 * Hanterar fel tyst — vid migration/parse-fel returneras null så appen startar
 * med default-state istället för att krascha.
 */
export async function bootstrapFromAdapter(adapter) {
    const raw = await adapter.load();
    if (!raw)
        return null;
    try {
        return migrateScene(parseScene(raw));
    }
    catch (err) {
        if (err instanceof SceneParseError) {
            console.warn("[autosave] kunde inte läsa persistad scen — startar tom:", err.message);
        }
        return null;
    }
}
//# sourceMappingURL=useAutoSave.js.map