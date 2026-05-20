/**
 * Section block for the PlantDetailCard layout (and any future tall-form
 * surfaces that want the same anatomy):
 *
 *   [icon] TITLE TEXT                                  [optional action]
 *   ─── 1 px --line-1 ───
 *   children
 *
 * `accent` switches the wrapper to a sage-tinted card (used by the
 * "I min trädgård" section).
 */
import type { ReactNode } from "react";
interface SectionProps {
    title: string;
    icon?: ReactNode;
    /** Right-aligned widget on the title row (e.g. a small toggle). */
    action?: ReactNode;
    /** Sage-tinted card variant. */
    accent?: boolean;
    children: ReactNode;
}
export declare function Section({ title, icon, action, accent, children }: SectionProps): import("react/jsx-runtime").JSX.Element;
export {};
