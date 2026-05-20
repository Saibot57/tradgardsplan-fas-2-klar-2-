/**
 * Compact search field with prefix icon and trailing clear button (×) that
 * appears once the user types anything.
 */
interface SearchInputProps {
    value: string;
    onChange: (next: string) => void;
    placeholder?: string;
}
export declare function SearchInput({ value, onChange, placeholder }: SearchInputProps): import("react/jsx-runtime").JSX.Element;
export {};
