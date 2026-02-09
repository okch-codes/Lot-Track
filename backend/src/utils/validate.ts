export function isNonEmptyString(val: unknown, maxLen = 200): val is string {
  return typeof val === 'string' && val.trim().length > 0 && val.length <= maxLen;
}

export function isPositiveInt(val: unknown): val is number {
  const n = Number(val);
  return Number.isInteger(n) && n > 0;
}

export function isDateString(val: unknown): val is string {
  if (typeof val !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(val) && !isNaN(Date.parse(val));
}
