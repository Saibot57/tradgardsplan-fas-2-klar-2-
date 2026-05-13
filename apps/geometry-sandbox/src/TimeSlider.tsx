/**
 * TimeSlider controls state.sun.dateIso — interactive preview time
 * for Canvas shadow rendering. Aggregate summer analysis (bedSunHours,
 * see Sektion 4) uses a separate fixed reference date and is not
 * affected by this slider.
 */

interface Props {
  dateIso: string;
  onChange: (dateIso: string) => void;
}

const HOUR_MIN = 6;
const HOUR_MAX = 20;
const HOUR_STEP = 0.25; // 15 min

function hourFromDate(d: Date): number {
  return d.getHours() + d.getMinutes() / 60;
}

function setHourOnDate(d: Date, decimalHour: number): Date {
  const next = new Date(d);
  const hour = Math.floor(decimalHour);
  const minute = Math.round((decimalHour - hour) * 60);
  next.setHours(hour, minute, 0, 0);
  return next;
}

function dateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatHourLabel(decimalHour: number): string {
  const h = Math.floor(decimalHour);
  const m = Math.round((decimalHour - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function TimeSlider({ dateIso, onChange }: Props) {
  const current = new Date(dateIso);
  const hour = Math.min(HOUR_MAX, Math.max(HOUR_MIN, hourFromDate(current)));
  const dateValue = dateInputValue(current);

  const onDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [y, m, d] = e.target.value.split("-").map(Number);
    if (!y || !m || !d) return;
    const next = new Date(current);
    next.setFullYear(y, m - 1, d);
    onChange(next.toISOString());
  };

  const onHour = (e: React.ChangeEvent<HTMLInputElement>) => {
    const h = Number(e.target.value);
    onChange(setHourOnDate(current, h).toISOString());
  };

  return (
    <>
      <span style={{ color: "#aaa", fontSize: 12 }}>Datum</span>
      <input
        type="date"
        value={dateValue}
        onChange={onDate}
        style={{
          width: 130,
          background: "#111",
          color: "#eee",
          border: "1px solid #444",
          padding: 3,
          fontSize: 12,
        }}
      />
      <span style={{ color: "#aaa", fontSize: 12 }}>Soltid</span>
      <input
        type="range"
        min={HOUR_MIN}
        max={HOUR_MAX}
        step={HOUR_STEP}
        value={hour}
        onChange={onHour}
        style={{ width: 140 }}
        title="Tidpunkt för skuggförhandsgranskning (06:00–20:00)"
      />
      <span style={{ color: "#ddd", fontSize: 12, minWidth: 44, textAlign: "right" }}>
        {formatHourLabel(hour)}
      </span>
    </>
  );
}
