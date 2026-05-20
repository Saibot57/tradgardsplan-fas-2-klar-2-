/**
 * Tab primitives for the app's top-level navigation (Planera / Växter).
 * A11y per handoff §11: role="tablist" on container, role="tab" +
 * aria-selected on each tab. Active tab is marked with a `--accent-bed`
 * underline.
 */
import type { ReactNode } from "react";
interface TabBarProps {
    children: ReactNode;
    /** Accessible name for the tablist, e.g. "Huvudvy". */
    ariaLabel?: string;
}
export declare function TabBar({ children, ariaLabel }: TabBarProps): import("react/jsx-runtime").JSX.Element;
interface TabProps {
    active: boolean;
    onSelect: () => void;
    children: ReactNode;
    /** Optional id, lets aria-controls in callers point at the tabpanel. */
    id?: string;
    controls?: string;
}
export declare function Tab({ active, onSelect, children, id, controls }: TabProps): import("react/jsx-runtime").JSX.Element;
export {};
