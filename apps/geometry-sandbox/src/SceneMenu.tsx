/**
 * SceneMenu — the named-document control in the header. Shows the current
 * scene name + chevron; the dropdown switches between scenes and exposes
 * create / rename / duplicate / delete. JSON import/export + PNG are demoted
 * here (autosave is the storage model now; JSON is the backup model).
 */

import { useState } from "react";
import type { SceneMeta } from "./scenes.js";
import { IconChevronDown } from "./icons.js";

interface Props {
  currentName: string;
  scenes: readonly SceneMeta[];
  currentId: string | null;
  onOpen: () => void;
  onSwitch: (id: string) => void;
  onCreate: () => void;
  onRename: (name: string) => void;
  onDuplicate: () => void;
  onDelete: (id: string) => void;
  onExportJson: () => void;
  onImportJson: () => void;
  onExportPng: () => void;
}

function formatSaved(ms: number): string {
  const d = new Date(ms);
  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  if (sameDay) return `${hh}:${mm}`;
  return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
}

const menuItemStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "left",
  background: "transparent",
  border: 0,
  cursor: "pointer",
  fontFamily: "var(--font-sans)",
  fontSize: 13,
  color: "var(--ink-1)",
  padding: "7px 10px",
  borderRadius: "var(--radius-2)",
};

export function SceneMenu({
  currentName,
  scenes,
  currentId,
  onOpen,
  onSwitch,
  onCreate,
  onRename,
  onDuplicate,
  onDelete,
  onExportJson,
  onImportJson,
  onExportPng,
}: Props) {
  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState("");

  const close = () => {
    setOpen(false);
    setRenaming(false);
  };

  const toggle = () => {
    if (open) {
      close();
    } else {
      onOpen();
      setOpen(true);
    }
  };

  const startRename = () => {
    setDraftName(currentName);
    setRenaming(true);
  };

  const commitRename = () => {
    const name = draftName.trim();
    if (name) onRename(name);
    setRenaming(false);
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        data-pp-btn
        data-variant="ghost"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="menu"
        title="Scen-meny"
        style={{ maxWidth: 240 }}
      >
        <span
          style={{
            maxWidth: 180,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {currentName || "Namnlös scen"}
        </span>
        <IconChevronDown size={14} />
      </button>

      {open && (
        <>
          <div
            aria-hidden="true"
            onClick={close}
            style={{ position: "fixed", inset: 0, zIndex: 40 }}
          />
          <div
            role="menu"
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              zIndex: 41,
              minWidth: 280,
              background: "var(--bg-surface)",
              border: "1px solid var(--line-1)",
              borderRadius: "var(--radius-3)",
              boxShadow: "var(--shadow-2)",
              padding: 8,
              fontFamily: "var(--font-sans)",
            }}
          >
            {renaming ? (
              <div style={{ display: "flex", gap: 6, padding: "2px 2px 8px" }}>
                <input
                  type="text"
                  value={draftName}
                  autoFocus
                  onChange={(e) => setDraftName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") setRenaming(false);
                  }}
                  data-pp-input
                  style={{ flex: 1, fontSize: 13 }}
                />
                <button data-pp-btn data-variant="primary" onClick={commitRename}>
                  Spara
                </button>
              </div>
            ) : (
              <>
                <div
                  style={{
                    fontSize: 10.5,
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    color: "var(--ink-2)",
                    fontWeight: 500,
                    padding: "2px 10px 6px",
                  }}
                >
                  Scener
                </div>
                <div style={{ maxHeight: 220, overflowY: "auto" }}>
                  {scenes.map((s) => (
                    <button
                      key={s.id}
                      role="menuitemradio"
                      aria-checked={s.id === currentId}
                      onClick={() => {
                        if (s.id !== currentId) onSwitch(s.id);
                        close();
                      }}
                      style={{
                        ...menuItemStyle,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        background: s.id === currentId ? "var(--bg-hover)" : "transparent",
                      }}
                    >
                      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.name}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 10.5,
                          color: "var(--ink-2)",
                          flexShrink: 0,
                        }}
                      >
                        {s.bedCount} · {formatSaved(s.lastSaved)}
                      </span>
                    </button>
                  ))}
                </div>

                <div style={{ height: 1, background: "var(--line-1)", margin: "6px 0" }} />

                <button role="menuitem" style={menuItemStyle} onClick={() => { onCreate(); close(); }}>
                  Ny scen
                </button>
                <button role="menuitem" style={menuItemStyle} onClick={startRename}>
                  Byt namn
                </button>
                <button role="menuitem" style={menuItemStyle} onClick={() => { onDuplicate(); close(); }}>
                  Duplicera
                </button>
                <button
                  role="menuitem"
                  style={{ ...menuItemStyle, color: "var(--state-danger)" }}
                  onClick={() => {
                    if (currentId && window.confirm(`Ta bort "${currentName}"? Detta kan inte ångras.`)) {
                      onDelete(currentId);
                      close();
                    }
                  }}
                >
                  Ta bort scen
                </button>

                <div style={{ height: 1, background: "var(--line-1)", margin: "6px 0" }} />

                <button role="menuitem" style={{ ...menuItemStyle, color: "var(--ink-2)", fontSize: 12.5 }} onClick={() => { onImportJson(); close(); }}>
                  Importera JSON
                </button>
                <button role="menuitem" style={{ ...menuItemStyle, color: "var(--ink-2)", fontSize: 12.5 }} onClick={() => { onExportJson(); close(); }}>
                  Exportera som JSON
                </button>
                <button role="menuitem" style={{ ...menuItemStyle, color: "var(--ink-2)", fontSize: 12.5 }} onClick={() => { onExportPng(); close(); }}>
                  Exportera som PNG
                </button>

                <div
                  style={{
                    fontSize: 11,
                    color: "var(--ink-2)",
                    lineHeight: 1.45,
                    padding: "8px 10px 2px",
                    borderTop: "1px solid var(--line-1)",
                    marginTop: 6,
                  }}
                >
                  Allt sparas i din webbläsare. Exportera JSON för säkerhetskopia.
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
