import type { SVGProps } from "react";

type IconProps = Omit<SVGProps<SVGSVGElement>, "ref"> & { size?: number };

function Svg({ size = 16, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconPlus = (p: IconProps) => (
  <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>
);

export const IconTrash = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 6h18" />
    <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
  </Svg>
);

export const IconUndo = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 14L4 9l5-5" />
    <path d="M4 9h11a5 5 0 0 1 0 10h-4" />
  </Svg>
);

export const IconRedo = (p: IconProps) => (
  <Svg {...p}>
    <path d="M15 14l5-5-5-5" />
    <path d="M20 9H9a5 5 0 0 0 0 10h4" />
  </Svg>
);

export const IconRotateCCW = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
  </Svg>
);

export const IconRotateCW = (p: IconProps) => (
  <Svg {...p}>
    <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
    <path d="M21 3v5h-5" />
  </Svg>
);

export const IconSave = (p: IconProps) => (
  <Svg {...p}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <path d="M17 21v-8H7v8M7 3v5h8" />
  </Svg>
);

export const IconFolderOpen = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v1" />
    <path d="M3 9h18l-2 9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" />
  </Svg>
);

export const IconSquare = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
  </Svg>
);

export const IconGrid = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
  </Svg>
);

export const IconCompass = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M14.5 9.5l-2 5-5 2 2-5 5-2z" />
  </Svg>
);

export const IconSun = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </Svg>
);

export const IconMoon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
  </Svg>
);

export const IconLayers = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </Svg>
);

export const IconTriangleAlert = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <path d="M12 9v4M12 17h.01" />
  </Svg>
);

export const IconCheck = (p: IconProps) => (
  <Svg {...p}><path d="M20 6L9 17l-5-5" /></Svg>
);

export const IconRuler = (p: IconProps) => (
  <Svg {...p}>
    <path d="M16.5 3l4.5 4.5L7.5 21 3 16.5 16.5 3z" />
    <path d="M14 6l1.5 1.5M11 9l1.5 1.5M8 12l1.5 1.5M5 15l1.5 1.5" />
  </Svg>
);

// ── Plant catalog (step 5) ──────────────────────────────────────────

export const IconSearch = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </Svg>
);

export const IconX = (p: IconProps) => (
  <Svg {...p}><path d="M18 6L6 18M6 6l12 12" /></Svg>
);

export const IconChevronDown = (p: IconProps) => (
  <Svg {...p}><path d="M6 9l6 6 6-6" /></Svg>
);

export const IconLeaf = (p: IconProps) => (
  <Svg {...p}>
    <path d="M11 20A7 7 0 0 1 4 13c0-5 5-9 11-9 0 5-2 11-4 11" />
    <path d="M4 4l16 16" />
  </Svg>
);

export const IconSprout = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 20h10" />
    <path d="M12 20V9" />
    <path d="M12 9C12 6 14 4 17 4c0 4-3 6-5 6" />
    <path d="M12 9C12 7 10 5 7 5c0 3 2 5 5 5" />
  </Svg>
);

export const IconFlower = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="2.5" />
    <path d="M12 9.5c-1-2.5 0-5 2.5-5 .5 2.5-.5 5-2.5 5z" />
    <path d="M14.5 12c2.5-1 5 0 5 2.5-2.5.5-5-.5-5-2.5z" />
    <path d="M12 14.5c1 2.5 0 5-2.5 5-.5-2.5.5-5 2.5-5z" />
    <path d="M9.5 12c-2.5 1-5 0-5-2.5 2.5-.5 5 .5 5 2.5z" />
  </Svg>
);

export const IconCarrot = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 21l5-5" />
    <path d="M17 4c-3 0-5 1-7 3l-6 6 4 4 6-6c2-2 3-4 3-6l-0.5-1z" />
    <path d="M14.5 3.5l1-1M17 6l1-1M18 9l1 0" />
  </Svg>
);

export const IconCherry = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="7" cy="17" r="3.5" />
    <circle cx="17" cy="17" r="3.5" />
    <path d="M7 13.5c0-5 4-9 9-9" />
    <path d="M17 13.5c0-4-3-7-7-8" />
  </Svg>
);
