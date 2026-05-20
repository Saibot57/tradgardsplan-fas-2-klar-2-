/**
 * Label-on-left, mono-value-on-right row. Lifted from SidePanel.tsx so the
 * Bädd-inspektor and the upcoming PlantDetailCard share the exact visual.
 */
import type { ReactNode } from "react";
export declare const rowStyle: React.CSSProperties;
export declare const rowLabelStyle: React.CSSProperties;
export declare const rowValueStyle: React.CSSProperties;
export declare function Row({ label, value }: {
    label: string;
    value: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
