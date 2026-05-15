// Lucide-style stroke icons.
// Stroke: 1.5px, currentColor, no fills. Sized by `size` prop.

function makeIcon(paths) {
  return function Icon({ size = 16, style, strokeWidth = 1.5, title }) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ display: "inline-block", flexShrink: 0, ...style }}
        aria-hidden={title ? undefined : true}
        role={title ? "img" : undefined}
      >
        {title ? <title>{title}</title> : null}
        {paths}
      </svg>
    );
  };
}

// ── Plant ──────────────────────────────────────────────────────
const IconLeaf = makeIcon(
  <React.Fragment>
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6"/>
  </React.Fragment>
);
const IconSprout = makeIcon(
  <React.Fragment>
    <path d="M7 20h10"/>
    <path d="M10 20c5.5-2.5.8-6.4 3-10"/>
    <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/>
    <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>
  </React.Fragment>
);
const IconFlower = makeIcon(
  <React.Fragment>
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5"/>
    <path d="M12 7.5V9"/>
    <path d="M7.5 12H9"/>
    <path d="M16.5 12H15"/>
    <path d="M12 16.5V15"/>
  </React.Fragment>
);
const IconCarrot = makeIcon(
  <React.Fragment>
    <path d="M2.27 21.7s9.87-3.5 12.73-6.36a4.5 4.5 0 0 0-6.36-6.37C5.77 11.84 2.27 21.7 2.27 21.7zM8.64 14l-2.05-2.04M15.34 15l-2.46-2.46"/>
    <path d="M22 9s-1.33-2-3.5-2C16.86 7 15 9 15 9s1.33 2 3.5 2S22 9 22 9z"/>
    <path d="M15 2s-2 1.33-2 3.5S15 9 15 9s2-1.84 2-3.5C17 3.33 15 2 15 2z"/>
  </React.Fragment>
);
const IconCherry = makeIcon(
  <React.Fragment>
    <path d="M2 17a5 5 0 0 0 10 0c0-2.76-2.5-5-5-3-2.5-2-5 .24-5 3Z"/>
    <path d="M12 17a5 5 0 0 0 10 0c0-2.76-2.5-5-5-3-2.5-2-5 .24-5 3Z"/>
    <path d="M7 14c3.22-2.91 4.29-8.75 5-12 1.66 2.38 4.94 9 5 12"/>
    <path d="M22 9c-4.29 0-7.14-2.33-10-7 5.71 0 10 4.67 10 7Z"/>
  </React.Fragment>
);

// ── Sections ───────────────────────────────────────────────────
const IconSun = makeIcon(
  <React.Fragment>
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2"/>
    <path d="M12 20v2"/>
    <path d="m4.93 4.93 1.41 1.41"/>
    <path d="m17.66 17.66 1.41 1.41"/>
    <path d="M2 12h2"/>
    <path d="M20 12h2"/>
    <path d="m6.34 17.66-1.41 1.41"/>
    <path d="m19.07 4.93-1.41 1.41"/>
  </React.Fragment>
);
const IconThermometer = makeIcon(
  <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>
);
const IconDroplet = makeIcon(
  <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>
);
const IconFlask = makeIcon(
  <React.Fragment>
    <path d="M10 2v7.31"/>
    <path d="M14 9.3V1.99"/>
    <path d="M8.5 2h7"/>
    <path d="M14 9.3a6.5 6.5 0 1 1-4 0"/>
    <path d="M5.52 16h12.96"/>
  </React.Fragment>
);
const IconWind = makeIcon(
  <React.Fragment>
    <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/>
    <path d="M9.6 4.6A2 2 0 1 1 11 8H2"/>
    <path d="M12.6 19.4A2 2 0 1 0 14 16H2"/>
  </React.Fragment>
);
const IconMapPin = makeIcon(
  <React.Fragment>
    <path d="M20 10c0 7-8 12-8 12s-8-5-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </React.Fragment>
);
const IconCalendar = makeIcon(
  <React.Fragment>
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
    <line x1="16" x2="16" y1="2" y2="6"/>
    <line x1="8" x2="8" y1="2" y2="6"/>
    <line x1="3" x2="21" y1="10" y2="10"/>
  </React.Fragment>
);
const IconRuler = makeIcon(
  <path d="M21.3 8.7 8.7 21.3a2.41 2.41 0 0 1-3.4 0l-2.6-2.6a2.41 2.41 0 0 1 0-3.4L15.3 2.7a2.41 2.41 0 0 1 3.4 0l2.6 2.6a2.41 2.41 0 0 1 0 3.4ZM7 17l-3-3M11 13l-2-2M15 9l-3-3M19 5l-2-2"/>
);

// ── UI ─────────────────────────────────────────────────────────
const IconSearch = makeIcon(
  <React.Fragment>
    <circle cx="11" cy="11" r="7"/>
    <path d="m21 21-4.3-4.3"/>
  </React.Fragment>
);
const IconX = makeIcon(
  <React.Fragment>
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
  </React.Fragment>
);
const IconChevronDown = makeIcon(<path d="m6 9 6 6 6-6"/>);
const IconChevronRight = makeIcon(<path d="m9 18 6-6-6-6"/>);
const IconArrowRight = makeIcon(
  <React.Fragment>
    <path d="M5 12h14"/>
    <path d="m12 5 7 7-7 7"/>
  </React.Fragment>
);
const IconPlus = makeIcon(
  <React.Fragment>
    <path d="M5 12h14"/>
    <path d="M12 5v14"/>
  </React.Fragment>
);
const IconCheck = makeIcon(<path d="M20 6 9 17l-5-5"/>);
const IconLayers = makeIcon(
  <React.Fragment>
    <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/>
    <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/>
    <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/>
  </React.Fragment>
);
const IconCompass = makeIcon(
  <React.Fragment>
    <circle cx="12" cy="12" r="10"/>
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
  </React.Fragment>
);
const IconGrid = makeIcon(
  <React.Fragment>
    <rect width="7" height="7" x="3" y="3" rx="1"/>
    <rect width="7" height="7" x="14" y="3" rx="1"/>
    <rect width="7" height="7" x="14" y="14" rx="1"/>
    <rect width="7" height="7" x="3" y="14" rx="1"/>
  </React.Fragment>
);
const IconMoon = makeIcon(<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>);
const IconSunSmall = IconSun;
const IconBookmark = makeIcon(<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>);
const IconInbox = makeIcon(
  <React.Fragment>
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
  </React.Fragment>
);
const IconTrash = makeIcon(
  <React.Fragment>
    <path d="M3 6h18"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </React.Fragment>
);

// Category-icon resolver — used for plant rows and the card placeholder.
function categoryIcon(category, size = 16) {
  const map = {
    vegetable: IconCarrot,
    herb: IconSprout,
    berry: IconCherry,
    flower: IconFlower,
  };
  const Cmp = map[category] || IconLeaf;
  return <Cmp size={size} />;
}

Object.assign(window, {
  IconLeaf, IconSprout, IconFlower, IconCarrot, IconCherry,
  IconSun, IconThermometer, IconDroplet, IconFlask, IconWind, IconMapPin, IconCalendar, IconRuler,
  IconSearch, IconX, IconChevronDown, IconChevronRight, IconArrowRight, IconPlus, IconCheck,
  IconLayers, IconCompass, IconGrid, IconMoon, IconSunSmall, IconBookmark, IconInbox, IconTrash,
  categoryIcon,
});
