/**
 * TimeBar — full-width bottom strip (64 px) that owns the day/time scrub.
 *
 * Controls state.sun.dateIso (interactive preview time for Canvas shadows).
 * Aggregate summer analysis (bedSunHours in SidePanel) uses a SEPARATE fixed
 * reference date and is intentionally NOT affected by this scrubber
 * (ADR-007/008 distinction — do not unify the two).
 */
import type { SunPosition } from "@kolonitradgard/spatial-core";
interface Props {
    dateIso: string;
    onChange: (dateIso: string) => void;
    showShadows: boolean;
    onToggleShadows: () => void;
    sun: SunPosition;
}
export declare function TimeBar({ dateIso, onChange, showShadows, onToggleShadows, sun }: Props): import("react/jsx-runtime").JSX.Element;
export {};
