/**
 * Top-of-app strip: brand, tab navigation, theme toggle. Visible in both
 * tabs (Planera / Växter). Tabs follow the a11y pattern from
 * shared/Tabs.tsx (role=tablist + role=tab + aria-selected).
 */
import type { ActiveTab } from "./state.js";
interface AppHeaderProps {
    activeTab: ActiveTab;
    onTabChange: (tab: ActiveTab) => void;
    theme: "light" | "dark";
    onToggleTheme: () => void;
}
export declare function AppHeader({ activeTab, onTabChange, theme, onToggleTheme }: AppHeaderProps): import("react/jsx-runtime").JSX.Element;
export {};
