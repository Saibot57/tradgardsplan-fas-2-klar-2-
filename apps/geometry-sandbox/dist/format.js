const THIN_SPACE = " ";
export function fmtInt(n) {
    const rounded = Math.round(n);
    return String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, THIN_SPACE);
}
export function fmtNum(n, decimals = 1) {
    return Number(n).toFixed(decimals).replace(".", ",");
}
//# sourceMappingURL=format.js.map