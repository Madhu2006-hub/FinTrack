/**
 * Currency formatting now uses the authenticated user's preferred currency code
 * instead of a hard-coded env variable. A formatter cache avoids creating a new
 * Intl.NumberFormat on every call while still supporting dynamic currency changes.
 */

const formatterCache = new Map();

function getFormatter(currencyCode) {
  if (!formatterCache.has(currencyCode)) {
    formatterCache.set(
      currencyCode,
      new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currencyCode,
        maximumFractionDigits: 2,
      })
    );
  }
  return formatterCache.get(currencyCode);
}

/**
 * Formats a numeric value as currency.
 * @param {number|string|null} value - The amount to format.
 * @param {string} [currencyCode='USD'] - ISO 4217 currency code (from user preferences).
 */
export function formatCurrency(value, currencyCode = 'USD') {
  const number = Number(value ?? 0);
  const code = currencyCode || 'USD';
  try {
    return getFormatter(code).format(Number.isFinite(number) ? number : 0);
  } catch {
    // Fallback if the browser doesn't recognize the code
    return getFormatter('USD').format(Number.isFinite(number) ? number : 0);
  }
}

export function formatDate(isoDate) {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Returns "yyyy-MM" for a Date (defaults to today). */
export function toMonthString(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${date.getFullYear()}-${month}`;
}

/** Turns "2026-10" into "October 2026". */
export function monthLabel(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

/** Returns the last `count` months ending at `anchor`, newest first. */
export function recentMonths(count = 12, anchor = new Date()) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1);
    return toMonthString(d);
  });
}

export function budgetStatusVariant(status, percent = null) {
  const pct = percent !== null ? Number(percent) : null;
  if (status === 'EXCEEDED' || (pct !== null && pct >= 100)) return 'danger';
  if (pct !== null && pct >= 90) return 'danger';
  if (status === 'WARNING' || (pct !== null && pct >= 75)) return 'warning';
  return 'success';
}

export function budgetStatusText(status, percent = null) {
  const pct = percent !== null ? Number(percent) : null;
  if (status === 'EXCEEDED' || (pct !== null && pct >= 100)) return 'Over budget';
  if (pct !== null && pct >= 90) return 'Near budget limit';
  if (status === 'WARNING' || (pct !== null && pct >= 75)) return 'Approaching limit';
  return 'On track';
}

export function titleCase(enumName) {
  const words = enumName.toLowerCase().replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}
