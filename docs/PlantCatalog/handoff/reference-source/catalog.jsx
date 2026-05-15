// PlantCatalog — main "Växter" tab.
// Master-detail split: left list (320px), right detail panel.

const { useState: csUseState, useMemo: csUseMemo, useRef: csUseRef, useEffect: csUseEffect } = React;

// ─── Stats helpers ─────────────────────────────────────────────
function plantedSummary(plantId, beds) {
  let bedCount = 0;
  let total = 0;
  for (const b of beds) {
    if (!b.plants) continue;
    const hits = b.plants.filter((p) => p.plantId === plantId);
    if (hits.length > 0) {
      bedCount += 1;
      total += hits.reduce((s, p) => s + p.count, 0);
    }
  }
  return { bedCount, total };
}

function firstBedFor(plantId, beds) {
  return beds.find((b) => b.plants && b.plants.some((p) => p.plantId === plantId));
}

// ─── Left list row ─────────────────────────────────────────────
function PlantRow({ plant, badge, active, dim, onClick, dense }) {
  const tint = window.PC_CATEGORY_TINT[plant.category] || window.PC_CATEGORY_TINT.vegetable;
  const padY = dense ? 6 : 9;
  return (
    <button
      onClick={onClick}
      data-pp-input="plant-row"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: `${padY}px 10px ${padY}px 12px`,
        background: active ? "var(--bed-100)" : "transparent",
        borderLeft: active ? "3px solid var(--accent-bed)" : "3px solid transparent",
        border: "none",
        borderBottom: "1px solid transparent",
        textAlign: "left",
        cursor: "pointer",
        color: "var(--ink-1)",
        opacity: dim ? 0.7 : 1,
        transition: "background 100ms cubic-bezier(0.2,0.6,0.2,1)",
        fontFamily: "var(--font-sans)",
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--bg-hover)"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      <span style={{
        width: dense ? 22 : 26, height: dense ? 22 : 26, flexShrink: 0,
        borderRadius: 4,
        background: tint.bg,
        color: tint.fg,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        border: `1px solid ${active ? tint.dot : "var(--line-1)"}`,
        fontStyle: dim ? "italic" : "normal",
      }}>
        {window.categoryIcon(plant.category, dense ? 13 : 14)}
      </span>
      <span style={{ flex: 1, minWidth: 0, lineHeight: 1.25 }}>
        <span style={{
          display: "block",
          fontSize: dense ? 13 : 13.5,
          fontWeight: 500,
          color: "var(--ink-1)",
          fontStyle: dim ? "italic" : "normal",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{plant.commonName}</span>
        {!dense && (
          <span style={{
            display: "block",
            fontSize: 11, color: "var(--ink-2)", fontStyle: "italic",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>{plant.scientificName}</span>
        )}
      </span>
      {badge && (
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11.5,
          color: "var(--ink-2)",
          fontVariantNumeric: "tabular-nums",
          flexShrink: 0,
        }}>{badge}</span>
      )}
    </button>
  );
}

// ─── Filter dropdown — single-select chip-toggle group ─────────
function FilterStrip({ label, value, options, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 5 }}>
      {options.map((o) => (
        <PCChip
          key={o.value}
          size="sm"
          active={value === o.value}
          onClick={() => onChange(o.value)}
        >{o.label}</PCChip>
      ))}
    </div>
  );
}

// ─── Add-to-bed dropdown ────────────────────────────────────────
function AddToBedDropdown({ beds, disabled, onSelect }) {
  const [open, setOpen] = csUseState(false);
  const ref = csUseRef(null);
  csUseEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <PCButton
        variant="secondary"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        title={disabled ? "Skapa en bädd i Planera-fliken först" : "Lägg till växt i en bädd"}
      >
        <IconPlus size={13}/> Lägg till i bädd <IconChevronDown size={12}/>
      </PCButton>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", right: 0, minWidth: 240,
          background: "var(--bg-surface)",
          border: "1px solid var(--line-1)",
          borderRadius: 8,
          boxShadow: "var(--shadow-2)",
          padding: 4,
          zIndex: 20,
        }}>
          {beds.length === 0 && (
            <div style={{ padding: "10px 12px", fontSize: 12.5, color: "var(--ink-2)" }}>
              Inga bäddar finns ännu.
            </div>
          )}
          {beds.map((b) => (
            <button
              key={b.id}
              onClick={() => { onSelect(b.id); setOpen(false); }}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                width: "100%", textAlign: "left",
                padding: "8px 10px", border: "none", borderRadius: 4,
                background: "transparent",
                color: "var(--ink-1)", fontFamily: "var(--font-sans)", fontSize: 13,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <span>{b.label}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--ink-2)", fontVariantNumeric: "tabular-nums" }}>
                {window.fmtInt(b.width)}×{window.fmtInt(b.height)} mm
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Detail card ────────────────────────────────────────────────
function PlantDetailCard({ plant, beds, planned, onTogglePlan, onAddToBed, onShowOnCanvas }) {
  const summary = plantedSummary(plant.id, beds);
  const isPlanted = summary.total > 0;
  const isPlanned = planned.has(plant.id);
  const hasBed = beds.length > 0;

  return (
    <div style={{
      flex: 1,
      overflowY: "auto",
      background: "var(--bg-surface)",
      padding: "32px 40px 64px",
    }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", gap: 22, alignItems: "flex-start", marginBottom: 18 }}>
          <PCPlantThumb plant={plant} size={120} rounded={10} big />
          <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
            <PCCategoryBadge category={plant.category} />
            <div style={{
              fontFamily: "var(--font-display)",
              fontSize: 36, lineHeight: 1.05, color: "var(--ink-1)",
              letterSpacing: "-0.02em", fontWeight: 500,
              marginTop: 10,
            }}>{plant.commonName}</div>
            <div style={{
              fontFamily: "var(--font-display-editorial)",
              fontSize: 18, fontStyle: "italic",
              color: "var(--ink-2)", marginTop: 4, lineHeight: 1.3,
            }}>{plant.scientificName}{plant.commonNameEn ? ` · ${plant.commonNameEn}` : ""}</div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
          {isPlanned ? (
            <PCButton variant="secondary" onClick={() => onTogglePlan(plant.id)}>
              <IconCheck size={13}/> Planerad
            </PCButton>
          ) : (
            <PCButton variant="secondary" disabled={isPlanted} onClick={() => onTogglePlan(plant.id)} title={isPlanted ? "Redan planterad i en bädd" : ""}>
              <IconBookmark size={13}/> Planera
            </PCButton>
          )}
          <AddToBedDropdown beds={beds} disabled={!hasBed} onSelect={(bedId) => onAddToBed(plant.id, bedId)}/>
        </div>

        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

          {/* Sol & ljus */}
          <Section icon={<IconSun size={13}/>} title="Sol & ljus">
            <PCRow label="Solbehov" value={
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <PCSunCategoryGlyph value={plant.sunCategory} />
                {plant.sunCategory || "—"}
              </span>
            } mono={false}/>
            <div style={{ paddingTop: 10 }}>
              <div style={{ fontSize: 12.5, color: "var(--ink-2)", marginBottom: 2 }}>
                Ljusintervall
              </div>
              <PCRangeBar
                min={plant.light.minLux} max={plant.light.maxLux}
                scaleMin={0} scaleMax={60000}
                unit=" lux"
                format={(n) => window.fmtInt(n)}
                accent="var(--accent-sun)"
              />
            </div>
          </Section>

          {/* Temperatur */}
          <Section icon={<IconThermometer size={13}/>} title="Temperatur">
            <PCRow label="Klarar" value={<>{plant.temperature.minC} – {plant.temperature.maxC} °C</>}/>
            <div style={{ paddingTop: 6 }}>
              <PCRangeBar
                min={plant.temperature.minC} max={plant.temperature.maxC}
                scaleMin={-10} scaleMax={45}
                unit=" °C"
                format={(n) => String(n)}
                accent="var(--accent-soil)"
              />
            </div>
          </Section>

          {/* Vatten & jord */}
          <Section icon={<IconDroplet size={13}/>} title="Vatten & jord">
            <PCRow label="Vattning" value={plant.waterFrequency || "—"} mono={false}/>
            <PCRow label="Jordtyp" value={plant.soilTypes ? plant.soilTypes.join(", ") : "—"} mono={false}/>
            <PCRow label="Jordfukt" value={<>{plant.soilMoisture.minPct} – {plant.soilMoisture.maxPct} %</>}/>
            <div style={{ paddingTop: 6 }}>
              <PCRangeBar
                min={plant.soilMoisture.minPct} max={plant.soilMoisture.maxPct}
                scaleMin={0} scaleMax={100}
                unit=" %"
                format={(n) => String(n)}
                accent="var(--accent-sky)"
              />
            </div>
          </Section>

          {/* Näring */}
          <Section icon={<IconFlask size={13}/>} title="Näring">
            <PCRow label="EC-värde" value={<>{window.fmtInt(plant.nutrientEC.minMicroS)} – {window.fmtInt(plant.nutrientEC.maxMicroS)} µS/cm</>}/>
            <div style={{
              fontSize: 12, color: "var(--ink-2)", lineHeight: 1.5,
              marginTop: 6, fontStyle: "italic",
            }}>
              {ecLabel(plant.nutrientEC.maxMicroS)}
            </div>
          </Section>

          {/* Luftfuktighet */}
          <Section icon={<IconWind size={13}/>} title="Luftfuktighet">
            <PCRow label="Intervall" value={<>{plant.humidity.minPct} – {plant.humidity.maxPct} %</>}/>
            <div style={{ paddingTop: 6 }}>
              <PCRangeBar
                min={plant.humidity.minPct} max={plant.humidity.maxPct}
                scaleMin={0} scaleMax={100}
                unit=" %"
                format={(n) => String(n)}
                accent="var(--accent-sky)"
              />
            </div>
          </Section>

          {/* Odlingstips */}
          <Section icon={<IconSprout size={13}/>} title="Odlingstips">
            {plant.sowingMethod && (
              <PCRow label="Sådd" value={plant.sowingMethod} mono={false}/>
            )}
            <PCRow label="Plantavstånd" value={plant.spreadMm ? <>{plant.spreadMm} <span style={{ color: "var(--ink-2)" }}>mm</span></> : "—"}/>
            <PCRow label="Radavstånd" value={plant.rowSpacingMm ? <>{plant.rowSpacingMm} <span style={{ color: "var(--ink-2)" }}>mm</span></> : "—"}/>
            <PCRow label="Dagar till skörd" value={plant.daysToMaturity ? <>{plant.daysToMaturity} <span style={{ color: "var(--ink-2)" }}>dagar</span></> : "—"}/>
          </Section>

          {/* I min trädgård */}
          {(isPlanted || isPlanned) && (
            <Section icon={<IconMapPin size={13}/>} title="I min trädgård" accent>
              {isPlanted ? (
                <>
                  <div style={{
                    fontSize: 14, color: "var(--ink-1)",
                    lineHeight: 1.55, marginBottom: 12,
                  }}>
                    Planterad i <strong style={{ fontWeight: 600 }}>{summary.bedCount}</strong>{" "}
                    {summary.bedCount === 1 ? "bädd" : "bäddar"}, totalt{" "}
                    <span style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{summary.total}</span>{" "}
                    st.
                  </div>
                  <PCButton variant="primary" onClick={() => onShowOnCanvas(plant.id)}>
                    Visa på canvas <IconArrowRight size={13}/>
                  </PCButton>
                </>
              ) : (
                <div style={{
                  fontSize: 14, color: "var(--ink-1)",
                  fontStyle: "italic", lineHeight: 1.55,
                }}>
                  Planerad — inte placerad i någon bädd ännu.
                </div>
              )}
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

// EC level → plain-language label (matches design-system "calm voice")
function ecLabel(maxEC) {
  if (maxEC < 1000) return "Låg till medel näring.";
  if (maxEC < 1800) return "Medelhög näring.";
  if (maxEC < 2500) return "Medelhög till hög näring — kräver regelbunden gödsling.";
  return "Hög näring — tung mat.";
}

function Section({ icon, title, accent, children }) {
  return (
    <section style={{
      padding: accent ? "16px 18px" : 0,
      background: accent ? "var(--bed-100)" : "transparent",
      border: accent ? "1px solid var(--line-1)" : "none",
      borderRadius: accent ? 8 : 0,
    }}>
      <PCSectionTitle icon={icon}>{title}</PCSectionTitle>
      <div style={{
        borderTop: accent ? "none" : "1px solid var(--line-1)",
        paddingTop: accent ? 0 : 4,
      }}>
        {children}
      </div>
    </section>
  );
}

// ─── Empty state for detail panel ──────────────────────────────
function DetailEmptyState() {
  return (
    <div style={{
      flex: 1,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg-surface)",
    }}>
      <div style={{ textAlign: "center", maxWidth: 360, padding: 32, color: "var(--ink-2)" }}>
        <div style={{
          width: 80, height: 80, margin: "0 auto 16px",
          borderRadius: 16,
          background: "var(--bed-100)",
          color: "var(--bed-700)",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "1px solid var(--line-1)",
        }}>
          <IconLeaf size={36}/>
        </div>
        <div style={{
          fontFamily: "var(--font-display)",
          fontSize: 22, color: "var(--ink-1)",
          letterSpacing: "-0.01em", lineHeight: 1.2,
          marginBottom: 8, fontWeight: 500,
        }}>
          Välj en växt i listan
        </div>
        <div style={{
          fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.55,
        }}>
          Här visas detaljer om sol, jord, näring och odlingstips. Sök eller bläddra
          i listan till vänster för att börja.
        </div>
      </div>
    </div>
  );
}

// ─── Catalog tab (the main work) ───────────────────────────────
function PCCatalogTab({
  plants, beds, plantsById,
  selectedPlantId, onSelectPlant,
  plannedIds, onTogglePlan, onAddToBed, onShowOnCanvas,
  dense,
}) {
  const [query, setQuery] = csUseState("");
  const [categoryFilter, setCategoryFilter] = csUseState("all");
  const [sunFilter, setSunFilter] = csUseState("all");

  const planned = csUseMemo(() => new Set(plannedIds), [plannedIds]);

  // "Mina växter" — those that appear in any bed
  const inGardenIds = csUseMemo(() => {
    const s = new Set();
    for (const b of beds) {
      if (!b.plants) continue;
      for (const p of b.plants) s.add(p.plantId);
    }
    return s;
  }, [beds]);

  const myPlants = csUseMemo(() => {
    return plants
      .filter((p) => inGardenIds.has(p.id))
      .map((p) => ({ plant: p, summary: plantedSummary(p.id, beds) }))
      .sort((a, b) => a.plant.commonName.localeCompare(b.plant.commonName, "sv"));
  }, [plants, beds, inGardenIds]);

  const plannedOnly = csUseMemo(() => {
    return plants
      .filter((p) => planned.has(p.id) && !inGardenIds.has(p.id))
      .sort((a, b) => a.plant?.commonName ? 0 : a.commonName.localeCompare(b.commonName, "sv"));
  }, [plants, planned, inGardenIds]);

  // Filtered list (search + filters)
  const filteredAll = csUseMemo(() => {
    const q = query.trim().toLowerCase();
    return plants.filter((p) => {
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      if (sunFilter !== "all") {
        const s = (p.sunCategory || "").toLowerCase();
        if (sunFilter === "full" && !/full sol/.test(s)) return false;
        if (sunFilter === "half" && !/halvskugga/.test(s)) return false;
        if (sunFilter === "shade" && /full sol|halvskugga/.test(s)) return false;
      }
      if (q && q.length >= 2) {
        const haystack = [p.commonName, p.commonNameEn, p.scientificName].join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => a.commonName.localeCompare(b.commonName, "sv"));
  }, [plants, query, categoryFilter, sunFilter]);

  const selectedPlant = plants.find((p) => p.id === selectedPlantId);

  return (
    <div style={{ display: "flex", flex: 1, minHeight: 0 }}>

      {/* ─── Left: list ─── */}
      <aside style={{
        width: 320, flexShrink: 0,
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--line-1)",
        display: "flex", flexDirection: "column",
        minHeight: 0,
      }}>
        {/* Mina växter */}
        <div style={{ padding: "16px 0 8px" }}>
          <div style={{ padding: "0 18px", display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
            <div style={{
              fontSize: 11.5, color: "var(--ink-2)",
              textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500,
            }}>Mina växter</div>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)",
              fontVariantNumeric: "tabular-nums",
            }}>{myPlants.length} st</div>
          </div>
          {myPlants.length === 0 ? (
            <div style={{ padding: "8px 18px 4px", fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.5, fontStyle: "italic" }}>
              Inga växter i bäddar ännu.
            </div>
          ) : (
            myPlants.map(({ plant, summary }) => (
              <PlantRow
                key={plant.id}
                plant={plant}
                badge={`×${summary.total}`}
                active={plant.id === selectedPlantId}
                onClick={() => onSelectPlant(plant.id)}
                dense={dense}
              />
            ))
          )}
        </div>

        {/* Planerade */}
        {plannedOnly.length > 0 && (
          <div style={{ padding: "10px 0 8px", borderTop: "1px dashed var(--line-1)" }}>
            <div style={{ padding: "0 18px", display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
              <div style={{
                fontSize: 11.5, color: "var(--ink-2)",
                textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500,
              }}>Planerade</div>
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)",
                fontVariantNumeric: "tabular-nums",
              }}>{plannedOnly.length} st</div>
            </div>
            {plannedOnly.map((plant) => (
              <PlantRow
                key={plant.id}
                plant={plant}
                badge={"·"}
                dim
                active={plant.id === selectedPlantId}
                onClick={() => onSelectPlant(plant.id)}
                dense={dense}
              />
            ))}
          </div>
        )}

        {/* Search + filters */}
        <div style={{
          padding: "12px 14px 10px",
          borderTop: "1px solid var(--line-1)",
          background: "var(--bg-surface)",
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          {/* Search input */}
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)",
              color: "var(--ink-2)", display: "inline-flex",
            }}><IconSearch size={14}/></span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Sök växt..."
              data-pp-input="catalog-search"
              style={{
                width: "100%",
                height: 32,
                padding: "0 30px 0 30px",
                background: "var(--bg-paper)",
                border: "1px solid var(--line-1)",
                borderRadius: 4,
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                color: "var(--ink-1)",
                outline: "none",
                transition: "border-color 120ms",
              }}
              onFocus={(e) => e.target.style.borderColor = "var(--ink-1)"}
              onBlur={(e) => e.target.style.borderColor = "var(--line-1)"}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                title="Rensa sökning"
                style={{
                  position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
                  width: 22, height: 22, padding: 0,
                  background: "transparent", border: "none", cursor: "pointer",
                  color: "var(--ink-2)", display: "inline-flex", alignItems: "center", justifyContent: "center",
                  borderRadius: 4,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <IconX size={14}/>
              </button>
            )}
          </div>

          {/* Filter chips — category */}
          <div>
            <div style={{
              fontSize: 10.5, color: "var(--ink-2)",
              textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500,
              marginBottom: 5,
            }}>Typ</div>
            <FilterStrip
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={[
                { value: "all", label: "Alla" },
                { value: "vegetable", label: "Grönsaker" },
                { value: "herb", label: "Kryddor" },
                { value: "berry", label: "Bär" },
                { value: "flower", label: "Blommor" },
              ]}
            />
          </div>

          {/* Filter chips — sun */}
          <div>
            <div style={{
              fontSize: 10.5, color: "var(--ink-2)",
              textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500,
              marginBottom: 5,
            }}>Sol</div>
            <FilterStrip
              value={sunFilter}
              onChange={setSunFilter}
              options={[
                { value: "all", label: "Alla" },
                { value: "full", label: "Full sol" },
                { value: "half", label: "Halvskugga" },
                { value: "shade", label: "Skugga" },
              ]}
            />
          </div>
        </div>

        {/* All plants list */}
        <div style={{
          flex: 1, minHeight: 0,
          borderTop: "1px solid var(--line-1)",
          overflowY: "auto",
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ padding: "12px 18px 6px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{
              fontSize: 11.5, color: "var(--ink-2)",
              textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500,
            }}>Alla växter</div>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)",
              fontVariantNumeric: "tabular-nums",
            }}>{filteredAll.length} st</div>
          </div>
          {filteredAll.length === 0 ? (
            <div style={{ padding: "16px 18px", fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.55, fontStyle: "italic" }}>
              Inga växter matchar sökningen.
            </div>
          ) : (
            filteredAll.map((plant) => (
              <PlantRow
                key={plant.id}
                plant={plant}
                active={plant.id === selectedPlantId}
                onClick={() => onSelectPlant(plant.id)}
                dense={dense}
              />
            ))
          )}
          <div style={{ flex: 1 }}/>
        </div>
      </aside>

      {/* ─── Right: detail ─── */}
      {selectedPlant ? (
        <PlantDetailCard
          plant={selectedPlant}
          beds={beds}
          planned={planned}
          plantsById={plantsById}
          onTogglePlan={onTogglePlan}
          onAddToBed={onAddToBed}
          onShowOnCanvas={onShowOnCanvas}
        />
      ) : (
        <DetailEmptyState />
      )}
    </div>
  );
}

window.PCCatalogTab = PCCatalogTab;
