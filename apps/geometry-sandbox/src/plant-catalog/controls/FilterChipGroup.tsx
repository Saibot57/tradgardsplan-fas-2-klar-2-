/**
 * Single-select row of `<Chip>` toggles. Generic over the value type so
 * callers can pass strongly-typed filter unions (category / sun token).
 */

import { Chip } from "../../shared/Chip.js";

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

const headerStyle: React.CSSProperties = {
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--ink-2)",
  fontWeight: 500,
  marginBottom: 4,
};

export function FilterChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: FilterChipGroupProps<T>) {
  return (
    <div>
      <div style={headerStyle}>{label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }} role="group" aria-label={label}>
        {options.map((opt) => (
          <Chip
            key={opt.value}
            active={opt.value === value}
            onToggle={() => onChange(opt.value)}
          >
            {opt.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}
