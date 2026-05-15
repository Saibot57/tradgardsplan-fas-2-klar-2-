/**
 * Compact search field with prefix icon and trailing clear button (×) that
 * appears once the user types anything.
 */

import { IconSearch, IconX } from "../../icons.js";

interface SearchInputProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder = "Sök växt..." }: SearchInputProps) {
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 8,
          color: "var(--ink-2)",
          display: "flex",
          alignItems: "center",
          pointerEvents: "none",
        }}
      >
        <IconSearch size={14} />
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        data-pp-input
        aria-label="Sök växt"
        style={{
          width: "100%",
          padding: "6px 28px 6px 28px",
          fontSize: 13,
        }}
      />
      {value.length > 0 && (
        <button
          type="button"
          aria-label="Rensa sökning"
          onClick={() => onChange("")}
          style={{
            position: "absolute",
            right: 4,
            background: "transparent",
            border: "none",
            padding: 4,
            cursor: "pointer",
            color: "var(--ink-2)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <IconX size={12} />
        </button>
      )}
    </div>
  );
}
