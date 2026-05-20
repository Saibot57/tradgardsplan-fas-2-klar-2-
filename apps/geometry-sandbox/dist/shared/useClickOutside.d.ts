/**
 * Calls `onOutside` when a mousedown lands outside the referenced element.
 * Listener is mouse-only; consumers handle Escape locally so the hook stays
 * narrow.
 */
import { type RefObject } from "react";
export declare function useClickOutside(ref: RefObject<HTMLElement>, onOutside: () => void, enabled?: boolean): void;
