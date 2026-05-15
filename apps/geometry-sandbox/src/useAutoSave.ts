import { useEffect, useRef, useState } from "react";
import { serializeScene, parseScene, migrateScene, SceneParseError, type SceneV4 } from "@kolonitradgard/spatial-core";
import type { SandboxState } from "./state.js";
import type { ScenePersistence } from "./persistence.js";

export type AutoSaveStatus =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: number }
  | { kind: "error"; message: string };

const DEBOUNCE_MS = 500;

/**
 * Observerar scen-relevant state (rectangles + plot) och persistar via adapter.
 * Session-state (viewport, sun, selectedId, snapToGrid) ignoreras avsiktligt
 * — de är inte del av SceneV4 (ADR-008/009).
 */
export function useAutoSave(
  state: SandboxState,
  adapter: ScenePersistence,
  enabled: boolean = true,
): {
  status: AutoSaveStatus;
  /** Återställ dirty-tracking efter manuell loadScene/clear så nästa change sparas. */
  resetBaseline: () => void;
} {
  const [status, setStatus] = useState<AutoSaveStatus>({ kind: "idle" });
  const lastSavedJsonRef = useRef<string>("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const scene = serializeScene({
      plot: { northRotationDeg: state.plot.northRotationDeg, location: state.plot.location },
      boundary: state.plot.boundaryRect,
      rectangles: state.rectangles,
    });
    const json = JSON.stringify(scene);

    if (json === lastSavedJsonRef.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    setStatus({ kind: "saving" });

    timerRef.current = setTimeout(() => {
      adapter
        .save(scene)
        .then(() => {
          lastSavedJsonRef.current = json;
          setStatus({ kind: "saved", at: Date.now() });
        })
        .catch((err: Error) => {
          setStatus({ kind: "error", message: err.message });
        });
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state.rectangles, state.plot, adapter, enabled]);

  return {
    status,
    resetBaseline: () => {
      lastSavedJsonRef.current = "";
    },
  };
}

/**
 * Bootstrap: ladda persistad scen vid mount. Returnerar parsad SceneV4 eller null.
 * Hanterar fel tyst — vid migration/parse-fel returneras null så appen startar
 * med default-state istället för att krascha.
 */
export async function bootstrapFromAdapter(adapter: ScenePersistence): Promise<SceneV4 | null> {
  const raw = await adapter.load();
  if (!raw) return null;
  try {
    return migrateScene(parseScene(raw));
  } catch (err) {
    if (err instanceof SceneParseError) {
      console.warn("[autosave] kunde inte läsa persistad scen — startar tom:", err.message);
    }
    return null;
  }
}
