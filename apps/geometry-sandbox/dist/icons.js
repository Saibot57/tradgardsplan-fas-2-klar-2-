import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function Svg({ size = 16, children, ...rest }) {
    return (_jsx("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", ...rest, children: children }));
}
export const IconPlus = (p) => (_jsx(Svg, { ...p, children: _jsx("path", { d: "M12 5v14M5 12h14" }) }));
export const IconTrash = (p) => (_jsxs(Svg, { ...p, children: [_jsx("path", { d: "M3 6h18" }), _jsx("path", { d: "M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" }), _jsx("path", { d: "M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" }), _jsx("path", { d: "M10 11v6M14 11v6" })] }));
export const IconUndo = (p) => (_jsxs(Svg, { ...p, children: [_jsx("path", { d: "M9 14L4 9l5-5" }), _jsx("path", { d: "M4 9h11a5 5 0 0 1 0 10h-4" })] }));
export const IconRedo = (p) => (_jsxs(Svg, { ...p, children: [_jsx("path", { d: "M15 14l5-5-5-5" }), _jsx("path", { d: "M20 9H9a5 5 0 0 0 0 10h4" })] }));
export const IconRotateCCW = (p) => (_jsxs(Svg, { ...p, children: [_jsx("path", { d: "M3 12a9 9 0 1 0 3-6.7L3 8" }), _jsx("path", { d: "M3 3v5h5" })] }));
export const IconRotateCW = (p) => (_jsxs(Svg, { ...p, children: [_jsx("path", { d: "M21 12a9 9 0 1 1-3-6.7L21 8" }), _jsx("path", { d: "M21 3v5h-5" })] }));
export const IconSave = (p) => (_jsxs(Svg, { ...p, children: [_jsx("path", { d: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" }), _jsx("path", { d: "M17 21v-8H7v8M7 3v5h8" })] }));
export const IconFolderOpen = (p) => (_jsxs(Svg, { ...p, children: [_jsx("path", { d: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v1" }), _jsx("path", { d: "M3 9h18l-2 9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" })] }));
export const IconSquare = (p) => (_jsx(Svg, { ...p, children: _jsx("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }) }));
export const IconGrid = (p) => (_jsxs(Svg, { ...p, children: [_jsx("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }), _jsx("path", { d: "M3 9h18M3 15h18M9 3v18M15 3v18" })] }));
export const IconCompass = (p) => (_jsxs(Svg, { ...p, children: [_jsx("circle", { cx: "12", cy: "12", r: "9" }), _jsx("path", { d: "M14.5 9.5l-2 5-5 2 2-5 5-2z" })] }));
export const IconSun = (p) => (_jsxs(Svg, { ...p, children: [_jsx("circle", { cx: "12", cy: "12", r: "4" }), _jsx("path", { d: "M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" })] }));
export const IconMoon = (p) => (_jsx(Svg, { ...p, children: _jsx("path", { d: "M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" }) }));
export const IconLayers = (p) => (_jsxs(Svg, { ...p, children: [_jsx("path", { d: "M12 2L2 7l10 5 10-5-10-5z" }), _jsx("path", { d: "M2 17l10 5 10-5" }), _jsx("path", { d: "M2 12l10 5 10-5" })] }));
export const IconEye = (p) => (_jsxs(Svg, { ...p, children: [_jsx("path", { d: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" }), _jsx("circle", { cx: "12", cy: "12", r: "3" })] }));
export const IconEyeOff = (p) => (_jsxs(Svg, { ...p, children: [_jsx("path", { d: "M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a13.2 13.2 0 0 1-2.16 2.95" }), _jsx("path", { d: "M6.6 6.6A13.3 13.3 0 0 0 2 12s3.5 7 10 7a9.1 9.1 0 0 0 4.06-.94" }), _jsx("path", { d: "M9.9 9.9a3 3 0 0 0 4.2 4.2" }), _jsx("path", { d: "M2 2l20 20" })] }));
export const IconCalendar = (p) => (_jsxs(Svg, { ...p, children: [_jsx("rect", { x: "3", y: "4", width: "18", height: "18", rx: "2" }), _jsx("path", { d: "M16 2v4M8 2v4M3 10h18" })] }));
export const IconTriangleAlert = (p) => (_jsxs(Svg, { ...p, children: [_jsx("path", { d: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" }), _jsx("path", { d: "M12 9v4M12 17h.01" })] }));
export const IconCheck = (p) => (_jsx(Svg, { ...p, children: _jsx("path", { d: "M20 6L9 17l-5-5" }) }));
export const IconRuler = (p) => (_jsxs(Svg, { ...p, children: [_jsx("path", { d: "M16.5 3l4.5 4.5L7.5 21 3 16.5 16.5 3z" }), _jsx("path", { d: "M14 6l1.5 1.5M11 9l1.5 1.5M8 12l1.5 1.5M5 15l1.5 1.5" })] }));
// ── Plant catalog (step 5) ──────────────────────────────────────────
export const IconSearch = (p) => (_jsxs(Svg, { ...p, children: [_jsx("circle", { cx: "11", cy: "11", r: "7" }), _jsx("path", { d: "M21 21l-4.3-4.3" })] }));
export const IconX = (p) => (_jsx(Svg, { ...p, children: _jsx("path", { d: "M18 6L6 18M6 6l12 12" }) }));
export const IconChevronDown = (p) => (_jsx(Svg, { ...p, children: _jsx("path", { d: "M6 9l6 6 6-6" }) }));
export const IconLeaf = (p) => (_jsxs(Svg, { ...p, children: [_jsx("path", { d: "M11 20A7 7 0 0 1 4 13c0-5 5-9 11-9 0 5-2 11-4 11" }), _jsx("path", { d: "M4 4l16 16" })] }));
export const IconSprout = (p) => (_jsxs(Svg, { ...p, children: [_jsx("path", { d: "M7 20h10" }), _jsx("path", { d: "M12 20V9" }), _jsx("path", { d: "M12 9C12 6 14 4 17 4c0 4-3 6-5 6" }), _jsx("path", { d: "M12 9C12 7 10 5 7 5c0 3 2 5 5 5" })] }));
export const IconFlower = (p) => (_jsxs(Svg, { ...p, children: [_jsx("circle", { cx: "12", cy: "12", r: "2.5" }), _jsx("path", { d: "M12 9.5c-1-2.5 0-5 2.5-5 .5 2.5-.5 5-2.5 5z" }), _jsx("path", { d: "M14.5 12c2.5-1 5 0 5 2.5-2.5.5-5-.5-5-2.5z" }), _jsx("path", { d: "M12 14.5c1 2.5 0 5-2.5 5-.5-2.5.5-5 2.5-5z" }), _jsx("path", { d: "M9.5 12c-2.5 1-5 0-5-2.5 2.5-.5 5 .5 5 2.5z" })] }));
export const IconCarrot = (p) => (_jsxs(Svg, { ...p, children: [_jsx("path", { d: "M3 21l5-5" }), _jsx("path", { d: "M17 4c-3 0-5 1-7 3l-6 6 4 4 6-6c2-2 3-4 3-6l-0.5-1z" }), _jsx("path", { d: "M14.5 3.5l1-1M17 6l1-1M18 9l1 0" })] }));
export const IconCherry = (p) => (_jsxs(Svg, { ...p, children: [_jsx("circle", { cx: "7", cy: "17", r: "3.5" }), _jsx("circle", { cx: "17", cy: "17", r: "3.5" }), _jsx("path", { d: "M7 13.5c0-5 4-9 9-9" }), _jsx("path", { d: "M17 13.5c0-4-3-7-7-8" })] }));
// ── Plant detail sections (step 6) ──────────────────────────────────
export const IconThermometer = (p) => (_jsx(Svg, { ...p, children: _jsx("path", { d: "M14 4a2 2 0 0 0-4 0v10.5a4 4 0 1 0 4 0V4z" }) }));
export const IconDroplet = (p) => (_jsx(Svg, { ...p, children: _jsx("path", { d: "M12 3l5 7a6 6 0 1 1-10 0l5-7z" }) }));
export const IconFlask = (p) => (_jsxs(Svg, { ...p, children: [_jsx("path", { d: "M9 3h6" }), _jsx("path", { d: "M10 3v6L4 19a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-6-10V3" }), _jsx("path", { d: "M7 14h10" })] }));
export const IconWind = (p) => (_jsxs(Svg, { ...p, children: [_jsx("path", { d: "M3 8h11a3 3 0 1 0-3-3" }), _jsx("path", { d: "M3 12h15a3 3 0 1 1-3 3" }), _jsx("path", { d: "M3 16h8" })] }));
export const IconMapPin = (p) => (_jsxs(Svg, { ...p, children: [_jsx("path", { d: "M12 22s-7-7-7-13a7 7 0 1 1 14 0c0 6-7 13-7 13z" }), _jsx("circle", { cx: "12", cy: "9", r: "2.5" })] }));
export const IconArrowRight = (p) => (_jsx(Svg, { ...p, children: _jsx("path", { d: "M4 12h16M14 6l6 6-6 6" }) }));
//# sourceMappingURL=icons.js.map