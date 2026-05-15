/**
 * Default state of the right panel when no plant is selected.
 */

import { IconLeaf } from "../icons.js";

export function PlantDetailEmpty() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        color: "var(--ink-2)",
        fontFamily: "var(--font-sans)",
        padding: 32,
        textAlign: "center",
      }}
    >
      <div style={{ opacity: 0.4 }}>
        <IconLeaf size={56} />
      </div>
      <p style={{ fontSize: 14, margin: 0, lineHeight: 1.5 }}>
        Välj en växt i listan för att se detaljer.
      </p>
    </div>
  );
}
