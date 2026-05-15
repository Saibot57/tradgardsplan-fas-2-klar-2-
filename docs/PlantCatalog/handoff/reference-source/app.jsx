// PlantCatalog — top-level App.
// Two tabs (Planera / Växter), Tweaks integration, theme handling.

const { useReducer: aUseReducer, useState: aUseState, useMemo: aUseMemo, useEffect: aUseEffect } = React;

// ─── State reducer ─────────────────────────────────────────────
function appReducer(state, action) {
  switch (action.type) {
    case "switchTab":
      return { ...state, activeTab: action.tab };

    case "selectPlant":
      return { ...state, selectedPlantId: action.plantId };

    case "selectBed":
      return { ...state, selectedBedId: action.bedId };

    case "togglePlan": {
      const next = new Set(state.plannedPlantIds);
      if (next.has(action.plantId)) next.delete(action.plantId);
      else next.add(action.plantId);
      return { ...state, plannedPlantIds: Array.from(next) };
    }

    case "addPlantToBed": {
      const { plantId, bedId } = action;
      const plant = window.PC_PLANTS.find((p) => p.id === plantId);
      if (!plant) return state;

      // Remove from plannedPlantIds since it's now in a bed
      const planned = state.plannedPlantIds.filter((id) => id !== plantId);

      const beds = state.beds.map((b) => {
        if (b.id !== bedId) return b;
        const existing = (b.plants || []).find((p) => p.plantId === plantId);
        if (existing) {
          // Increment count rather than add a duplicate placement
          return {
            ...b,
            plants: b.plants.map((p) =>
              p.plantId === plantId ? { ...p, count: p.count + 1 } : p
            ),
          };
        }
        const placementId = `place-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        return {
          ...b,
          plants: [...(b.plants || []), {
            placementId,
            plantId,
            displayName: plant.commonName,
            offsetX: 0, offsetY: 0,
            count: 1,
          }],
        };
      });
      return { ...state, beds, plannedPlantIds: planned };
    }

    case "showOnCanvas": {
      const { plantId } = action;
      const bed = state.beds.find((b) => b.plants && b.plants.some((p) => p.plantId === plantId));
      return {
        ...state,
        activeTab: "planera",
        selectedBedId: bed ? bed.id : state.selectedBedId,
      };
    }

    default:
      return state;
  }
}

// ─── App shell ─────────────────────────────────────────────────
function App() {
  // Tweak defaults — wrapped in EDITMODE markers so the host can persist.
  const tweakDefaults = /*EDITMODE-BEGIN*/{
    "theme": "light",
    "density": "comfortable",
    "iconStyle": "lucide"
  }/*EDITMODE-END*/;
  const [tweaks, setTweak] = useTweaks(tweakDefaults);

  const [state, dispatch] = aUseReducer(appReducer, {
    activeTab: "vaxter",                // start in PlantCatalog (the new work)
    selectedPlantId: "solanum-lycopersicum", // pre-select Tomat so the card is visible
    selectedBedId: "rect-1",
    beds: window.PC_BEDS,
    plannedPlantIds: window.PC_INITIAL_PLANNED,
  });

  // Theme — drive [data-theme="dark"] on <html>
  aUseEffect(() => {
    if (tweaks.theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, [tweaks.theme]);

  const plantsById = aUseMemo(() => {
    const m = {};
    for (const p of window.PC_PLANTS) m[p.id] = p;
    return m;
  }, []);

  const dense = tweaks.density === "compact";

  return (
    <div
      className="pp"
      style={{
        display: "flex", flexDirection: "column",
        height: "100vh",
        background: "var(--bg-paper)",
        color: "var(--ink-1)",
      }}
    >
      {/* ─── Top bar ─── */}
      <header style={{
        flexShrink: 0,
        height: 56,
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--line-1)",
        display: "flex",
        alignItems: "stretch",
      }}>
        {/* Brand */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "0 18px",
          borderRight: "1px solid var(--line-1)",
          flexShrink: 0,
        }}>
          <img src="assets/logo-mark.svg" alt="" style={{ height: 24, display: "block" }} />
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
            <strong style={{
              fontFamily: "var(--font-display)", fontSize: 17,
              color: "var(--ink-1)", fontWeight: 500, letterSpacing: "-0.01em",
            }}>PlotPlaner</strong>
            <span style={{
              fontSize: 10.5, color: "var(--ink-2)",
              textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500,
            }}>Koloniträdgård</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", alignItems: "stretch", borderRight: "1px solid var(--line-1)" }}>
          <PCTabBar
            tabs={[
              { id: "planera", label: "Planera", icon: <IconGrid size={14}/> },
              { id: "vaxter", label: "Växter", icon: <IconLeaf size={14}/> },
            ]}
            value={state.activeTab}
            onChange={(t) => dispatch({ type: "switchTab", tab: t })}
          />
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }}/>

        {/* Tab-specific summary */}
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "0 18px",
          fontSize: 12, color: "var(--ink-2)",
          fontFamily: "var(--font-mono)",
        }}>
          {state.activeTab === "planera" ? (
            <>
              <span><span style={{ color: "var(--ink-1)" }}>{state.beds.length}</span> bäddar</span>
              <span style={{ width: 1, height: 14, background: "var(--line-1)" }}/>
              <span>Lat 55,87° N · Lon 12,83° E</span>
            </>
          ) : (
            <>
              <span>
                <span style={{ color: "var(--ink-1)" }}>{window.PC_PLANTS.length}</span> växter
              </span>
              <span style={{ width: 1, height: 14, background: "var(--line-1)" }}/>
              <span>
                <span style={{ color: "var(--ink-1)" }}>{state.plannedPlantIds.length}</span> planerade
              </span>
            </>
          )}
        </div>

        {/* Theme toggle */}
        <div style={{ display: "flex", alignItems: "center", padding: "0 12px", borderLeft: "1px solid var(--line-1)" }}>
          <button
            onClick={() => setTweak("theme", tweaks.theme === "dark" ? "light" : "dark")}
            title={tweaks.theme === "dark" ? "Byt till dagläge" : "Byt till kvällsläge"}
            style={{
              height: 32, width: 32, padding: 0,
              background: "transparent",
              border: "1px solid var(--line-1)",
              borderRadius: 4,
              color: "var(--ink-1)",
              cursor: "pointer",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              transition: "background 120ms cubic-bezier(0.2,0.6,0.2,1)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            {tweaks.theme === "dark" ? <IconSun size={14}/> : <IconMoon size={14}/>}
          </button>
        </div>
      </header>

      {/* ─── Active tab ─── */}
      {state.activeTab === "planera" ? (
        <PCPlaneraTab
          beds={state.beds}
          plot={window.PC_PLOT}
          selectedBedId={state.selectedBedId}
          onSelectBed={(id) => dispatch({ type: "selectBed", bedId: id })}
          plantsById={plantsById}
        />
      ) : (
        <PCCatalogTab
          plants={window.PC_PLANTS}
          beds={state.beds}
          plantsById={plantsById}
          selectedPlantId={state.selectedPlantId}
          onSelectPlant={(id) => dispatch({ type: "selectPlant", plantId: id })}
          plannedIds={state.plannedPlantIds}
          onTogglePlan={(id) => dispatch({ type: "togglePlan", plantId: id })}
          onAddToBed={(plantId, bedId) => dispatch({ type: "addPlantToBed", plantId, bedId })}
          onShowOnCanvas={(plantId) => dispatch({ type: "showOnCanvas", plantId })}
          dense={dense}
        />
      )}

      {/* ─── Tweaks panel ─── */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Utseende">
          <TweakRadio
            label="Tema"
            value={tweaks.theme}
            options={[
              { value: "light", label: "Paper" },
              { value: "dark", label: "Evening" },
            ]}
            onChange={(v) => setTweak("theme", v)}
          />
          <TweakRadio
            label="Listdensitet"
            value={tweaks.density}
            options={[
              { value: "comfortable", label: "Luftig" },
              { value: "compact", label: "Kompakt" },
            ]}
            onChange={(v) => setTweak("density", v)}
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
