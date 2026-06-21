/**
 * Formats a number with thousands comma separator and 2 decimal places.
 * Example: 18500 → "18,500.00"
 */
export function fmtNum(value: number): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Formats a monetary value with currency symbol.
 * Example: fmtMoney(18500, 'L.') → "L. 18,500.00"
 */
export function fmtMoney(value: number, simbolo = 'L.'): string {
  return `${simbolo} ${fmtNum(value)}`;
}
