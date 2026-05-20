/**
 * "+ Lägg till i bädd ▾" trigger + dropdown panel. Lists the rectangles
 * that count as beds (see bedFilter.ts) with their dimensions. Click a
 * row → onSelect(bedId), panel closes. Disabled when no beds exist.
 *
 * Escape closes the panel; mousedown outside the wrapper closes it via
 * `useClickOutside`.
 */
import type { Rect } from "@kolonitradgard/spatial-core";
interface AddToBedDropdownProps {
    beds: readonly Rect[];
    onSelect: (bedId: string) => void;
}
export declare function AddToBedDropdown({ beds, onSelect }: AddToBedDropdownProps): import("react/jsx-runtime").JSX.Element;
export {};
