// PlantCatalog — Planera-tab placeholder.
// This is a stand-in for the existing geometry-sandbox Canvas + SidePanel.
// Just enough to make tab-switching feel real and let "Visa på canvas →"
// highlight a target bed.

function PCPlaneraTab({ beds, plot, selectedBedId, onSelectBed, plantsById }) {
  // World → screen scale (~ 1 mm = 0.04 px so a 12×8m plot ~ 480×320)
  const SCALE = 0.05;
  const sel = beds.find((b) => b.id === selectedBedId);

  return (
    <div style={{ display: "flex", flex: 1, minHeight: 0, background: "var(--bg-canvas)" }}>
      {/* Canvas area */}
      <div style={{
        flex: 1,
        position: "relative",
        overflow: "hidden",
        background: "var(--bg-canvas)",
        backgroundImage: `
          linear-gradient(to right, var(--line-1) 1px, transparent 1px),
          linear-gradient(to bottom, var(--line-1) 1px, transparent 1px)
        `,
        backgroundSize: "50px 50px",
        backgroundPosition: "0 0",
      }}>
        {/* Compass — top-right */}
        <div style={{
          position: "absolute", top: 16, right: 16,
          width: 56, height: 56, borderRadius: 999,
          background: "var(--bg-surface)",
          border: "1px solid var(--line-1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--ink-2)",
          boxShadow: "var(--shadow-1)",
        }}>
          <IconCompass size={28} />
          <span style={{
            position: "absolute", top: 4, fontFamily: "var(--font-mono)",
            fontSize: 10, color: "var(--ink-2)", letterSpacing: "0.1em",
          }}>N</span>
        </div>

        {/* World group, centered */}
        <svg
          viewBox={`0 0 ${plot.boundaryRect.width * SCALE + 200} ${plot.boundaryRect.height * SCALE + 200}`}
          style={{ width: "100%", height: "100%", display: "block" }}
        >
          <g transform={`translate(100, 100)`}>
            {/* Plot boundary — dashed sun-ochre line */}
            <rect
              x={0} y={0}
              width={plot.boundaryRect.width * SCALE}
              height={plot.boundaryRect.height * SCALE}
              fill="transparent"
              stroke="var(--accent-sun)"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
            {/* Plot dimension label */}
            <text
              x={plot.boundaryRect.width * SCALE / 2}
              y={-12}
              textAnchor="middle"
              fill="var(--ink-2)"
              fontFamily="var(--font-mono)"
              fontSize="11"
            >
              {window.fmtInt(plot.boundaryRect.width / 1000)} × {window.fmtInt(plot.boundaryRect.height / 1000)} m
            </text>

            {/* Beds */}
            {beds.map((b) => {
              const isSel = b.id === selectedBedId;
              const x = (b.cx - b.width / 2) * SCALE;
              const y = (b.cy - b.height / 2) * SCALE;
              const w = b.width * SCALE;
              const h = b.height * SCALE;
              const cx = b.cx * SCALE;
              const cy = b.cy * SCALE;

              return (
                <g
                  key={b.id}
                  transform={`rotate(${b.rotationDeg} ${cx} ${cy})`}
                  onClick={() => onSelectBed(b.id)}
                  style={{ cursor: "pointer" }}
                >
                  <rect
                    x={x} y={y} width={w} height={h}
                    fill={isSel ? "var(--bed-100)" : "var(--paper-50)"}
                    stroke={isSel ? "var(--accent-sun)" : "var(--accent-wall)"}
                    strokeWidth={isSel ? 2 : 1.2}
                  />
                  {/* Bed label */}
                  <text
                    x={cx} y={cy - 5}
                    textAnchor="middle"
                    fill="var(--ink-1)"
                    fontFamily="var(--font-sans)"
                    fontSize="11"
                    fontWeight="500"
                  >{b.label}</text>
                  <text
                    x={cx} y={cy + 10}
                    textAnchor="middle"
                    fill="var(--ink-2)"
                    fontFamily="var(--font-mono)"
                    fontSize="9.5"
                  >
                    {window.fmtInt(b.width)} × {window.fmtInt(b.height)} mm
                  </text>
                  {/* Plant count badge */}
                  {b.plants && b.plants.length > 0 && (
                    <g transform={`translate(${x + w - 18}, ${y + 4})`}>
                      <circle cx="7" cy="7" r="7" fill="var(--bed-500)" />
                      <text x="7" y="10" textAnchor="middle" fill="#FBF8F2" fontFamily="var(--font-sans)" fontSize="9" fontWeight="600">
                        {b.plants.reduce((s, p) => s + p.count, 0)}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* "Placeholder" stamp — bottom-left, very small */}
        <div style={{
          position: "absolute", left: 16, bottom: 16,
          padding: "6px 10px",
          background: "var(--bg-surface)",
          border: "1px solid var(--line-1)",
          borderRadius: 4,
          fontSize: 11.5,
          color: "var(--ink-2)",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.02em",
        }}>
          Planera-vyn (befintlig canvas) — placeholder
        </div>
      </div>

      {/* Right inspector — abbreviated SidePanel */}
      <aside style={{
        width: 320, flexShrink: 0,
        background: "var(--bg-surface)",
        borderLeft: "1px solid var(--line-1)",
        padding: "20px 22px",
        display: "flex", flexDirection: "column", gap: 20,
        overflowY: "auto",
      }}>
        <div>
          <div style={{
            fontFamily: "var(--font-display)", fontSize: 22, color: "var(--ink-1)",
            letterSpacing: "-0.01em", lineHeight: 1.15,
          }}>
            {sel ? sel.label : "Ingen bädd vald"}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--ink-2)", marginTop: 4, lineHeight: 1.5 }}>
            {sel
              ? "Mått, jord och växter för den valda bädden."
              : "Klicka på en bädd i ritningen för att se detaljer."}
          </div>
        </div>

        {sel && (
          <>
            <section>
              <PCSectionTitle icon={<IconRuler size={12}/>}>Geometri</PCSectionTitle>
              <PCRow label="ID" value={sel.id} />
              <PCRow label="Mått" value={<>{window.fmtInt(sel.width)} × {window.fmtInt(sel.height)} <span style={{ color: "var(--ink-2)" }}>mm</span></>}/>
              <PCRow label="Rotation" value={<>{window.fmtNum(sel.rotationDeg, 0)}°</>}/>
              <PCRow label="Area" value={<>{window.fmtNum((sel.width * sel.height) / 1_000_000, 2)} <span style={{ color: "var(--ink-2)" }}>m²</span></>}/>
            </section>

            <section>
              <PCSectionTitle icon={<IconLeaf size={12}/>}>
                Växter i bädden ({sel.plants ? sel.plants.length : 0})
              </PCSectionTitle>
              {sel.plants && sel.plants.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {sel.plants.map((p) => {
                    const plant = plantsById[p.plantId];
                    if (!plant) return null;
                    return (
                      <div key={p.placementId} style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "6px 8px",
                        background: "var(--bg-paper)",
                        border: "1px solid var(--line-1)",
                        borderRadius: 4,
                      }}>
                        <PCPlantThumb plant={plant} size={28} rounded={4} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: "var(--ink-1)", fontWeight: 500, lineHeight: 1.2 }}>
                            {plant.commonName}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--ink-2)", fontStyle: "italic", marginTop: 1 }}>
                            {plant.scientificName}
                          </div>
                        </div>
                        <div style={{
                          fontFamily: "var(--font-mono)", fontSize: 12.5,
                          color: "var(--ink-1)", fontVariantNumeric: "tabular-nums",
                        }}>×{p.count}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: 12.5, color: "var(--ink-2)", fontStyle: "italic" }}>
                  Inga växter placerade i bädden ännu.
                </div>
              )}
            </section>
          </>
        )}
      </aside>
    </div>
  );
}

window.PCPlaneraTab = PCPlaneraTab;
