import type { Dispatch } from "react";
import {
  parseScene,
  serializeScene,
  migrateScene,
  SceneParseError,
} from "@kolonitradgard/spatial-core";
import type { Action, SandboxState } from "./state.js";
import type { HistoryAction } from "./history.js";

const SAVE_FILENAME = "scene.json";

/** Trigger browser file-download of the current scene as JSON (integer mm). */
export function saveScene(state: SandboxState): void {
  const scene = serializeScene({
    plot: { northRotationDeg: state.plot.northRotationDeg, location: state.plot.location },
    boundary: state.plot.boundaryRect,
    rectangles: state.rectangles,
  });
  const json = JSON.stringify(scene, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = SAVE_FILENAME;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Defer revoke so Safari/Firefox don't cancel the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Open a file picker, parse + migrate scene, dispatch loadScene. Shows alert on error. */
export async function loadSceneFromFile(
  dispatch: Dispatch<Action | HistoryAction>,
): Promise<void> {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json,.json";

  const file = await new Promise<File | null>((resolve) => {
    input.addEventListener(
      "change",
      () => resolve(input.files && input.files[0] ? input.files[0] : null),
      { once: true },
    );
    input.click();
  });

  if (!file) return;

  let text: string;
  try {
    text = await file.text();
  } catch (err) {
    window.alert(`Kunde inte läsa filen: ${(err as Error).message}`);
    return;
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (err) {
    window.alert(`Filen är inte giltig JSON: ${(err as Error).message}`);
    return;
  }

  try {
    const scene = migrateScene(parseScene(raw));
    dispatch({ type: "commitHistory" });
    dispatch({ type: "loadScene", scene });
  } catch (err) {
    if (err instanceof SceneParseError) {
      window.alert(`Ogiltig scen-fil: ${err.message}`);
    } else {
      window.alert(`Oväntat fel vid laddning: ${(err as Error).message}`);
    }
  }
}
