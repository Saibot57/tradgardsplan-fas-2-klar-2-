/**
 * Single-select row of `<Chip>` toggles. Generic over the value type so
 * callers can pass strongly-typed filter unions (category / sun token).
 */
interface FilterOption<T> {
    value: T;
    label: string;
}
interface FilterChipGroupProps<T> {
    label: string;
    options: ReadonlyArray<FilterOption<T>>;
    value: T;
    onChange: (next: T) => void;
}
export declare function FilterChipGroup<T extends string>({ label, options, value, onChange, }: FilterChipGroupProps<T>): import("react/jsx-runtime").JSX.Element;
export {};
