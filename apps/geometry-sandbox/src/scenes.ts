/**
 * Named multi-scene store on top of localStorage.
 *
 * Layout:
 *   plotplaner.scenes.index        → ScenesIndex (metadata + currentId)
 *   plotplaner.scenes.<id>         → SceneV7 (serialized scene data)
 *
 * This is the layer *above* SandboxState described in README §6: the reducer
 * still owns one scene at a time; this module decides which scene's bytes are
 * loaded into / saved from the reducer. No reducer changes needed.
 *
 * The legacy single-key store (`pp-scene-v1`, used before named scenes) is
 * migrated into a first scene on first read so existing users keep their work.
 */

import {
  migrateScene,
  parseScene,
  SceneParseError,
  type SceneV7,
} from "@kolonitradgard/spatial-core";

export interface SceneMeta {
  id: string;
  name: string;
  /** epoch ms of last successful save. */
  lastSaved: number;
  plotWidthMm: number | null;
  plotHeightMm: number | null;
  bedCount: number;
}

export interface ScenesIndex {
  scenes: SceneMeta[];
  currentId: string | null;
}

const INDEX_KEY = "plotplaner.scenes.index";
const sceneKey = (id: string) => `plotplaner.scenes.${id}`;
const LEGACY_KEY = "pp-scene-v1";

const EMPTY_INDEX: ScenesIndex = { scenes: [], currentId: null };

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / disabled — autosave-status ytan visar redan fel separat */
  }
}

export function nextSceneId(): string {
  return `scene-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Härled meta-fält ur scen-data. */
export function metaFromScene(scene: SceneV7): Pick<SceneMeta, "plotWidthMm" | "plotHeightMm" | "bedCount"> {
  return {
    plotWidthMm: scene.boundary ? scene.boundary.width : null,
    plotHeightMm: scene.boundary ? scene.boundary.height : null,
    bedCount: scene.rectangles.length,
  };
}

/** Parsa + migrera rå-data till en giltig SceneV7, eller null vid fel. */
export function parseSceneData(raw: unknown): SceneV7 | null {
  try {
    return migrateScene(parseScene(raw));
  } catch (err) {
    if (err instanceof SceneParseError) {
      console.warn("[scenes] kunde inte läsa scen — hoppar över:", err.message);
    }
    return null;
  }
}

export function readSceneData(id: string): SceneV7 | null {
  const raw = readJson<unknown>(sceneKey(id));
  if (raw == null) return null;
  return parseSceneData(raw);
}

export function writeSceneData(id: string, scene: SceneV7): void {
  writeJson(sceneKey(id), scene);
}

export function deleteSceneData(id: string): void {
  try {
    localStorage.removeItem(sceneKey(id));
  } catch {
    /* ignore */
  }
}

export function saveScenesIndex(index: ScenesIndex): void {
  writeJson(INDEX_KEY, index);
}

/**
 * Läs scen-indexet. Migrerar legacy-nyckeln (`pp-scene-v1`) till en första
 * namngiven scen om indexet saknas men gammal data finns.
 */
export function loadScenesIndex(): ScenesIndex {
  const existing = readJson<ScenesIndex>(INDEX_KEY);
  if (existing && Array.isArray(existing.scenes)) return existing;

  // Migrera legacy single-scene-store om den finns.
  const legacyRaw = readJson<unknown>(LEGACY_KEY);
  const legacyScene = legacyRaw != null ? parseSceneData(legacyRaw) : null;
  if (legacyScene) {
    const id = nextSceneId();
    writeSceneData(id, legacyScene);
    const index: ScenesIndex = {
      scenes: [
        {
          id,
          name: "Min trädgård",
          lastSaved: Date.now(),
          ...metaFromScene(legacyScene),
        },
      ],
      currentId: id,
    };
    saveScenesIndex(index);
    try {
      localStorage.removeItem(LEGACY_KEY);
    } catch {
      /* ignore */
    }
    return index;
  }

  return { ...EMPTY_INDEX };
}

/** Returnera ett unikt namn baserat på `base` (lägger till " 2", " 3", …). */
export function uniqueSceneName(index: ScenesIndex, base: string): string {
  const names = new Set(index.scenes.map((s) => s.name));
  if (!names.has(base)) return base;
  let n = 2;
  while (names.has(`${base} ${n}`)) n += 1;
  return `${base} ${n}`;
}

export function findMeta(index: ScenesIndex, id: string | null): SceneMeta | null {
  if (!id) return null;
  return index.scenes.find((s) => s.id === id) ?? null;
}
