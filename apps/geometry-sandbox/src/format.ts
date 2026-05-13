const THIN_SPACE = " ";

export function fmtInt(n: number): string {
  const rounded = Math.round(n);
  return String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, THIN_SPACE);
}

export function fmtNum(n: number, decimals = 1): string {
  return Number(n).toFixed(decimals).replace(".", ",");
}
