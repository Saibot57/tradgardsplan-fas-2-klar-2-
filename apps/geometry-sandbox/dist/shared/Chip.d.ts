/**
 * Small chip used for filter toggles in the catalog and for static
 * category badges. Clickable when `onToggle` is provided; static label
 * otherwise.
 */
import type { ReactNode } from "react";
interface ChipProps {
    children: ReactNode;
    /** When provided, the chip is clickable and uses the active visual. */
    onToggle?: () => void;
    active?: boolean;
    /** Static-only override for callers that want a fixed visual (e.g. a category badge). */
    tone?: "muted" | "accent";
}
export declare function Chip({ children, onToggle, active, tone }: ChipProps): import("react/jsx-runtime").JSX.Element;
export {};
