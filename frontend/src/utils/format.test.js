import { formatCurrency, monthLabel, recentMonths, titleCase, toMonthString } from './format';

describe('format utilities', () => {
  it('formats currency with two decimals and grouping', () => {
    expect(formatCurrency(1234.5)).toContain('1,234.50');
  });

  it('formats amounts with different currency codes', () => {
    const inr = formatCurrency(5000, 'INR');
    expect(inr).toMatch(/5,000\.00|₹/);

    const eur = formatCurrency(120.5, 'EUR');
    expect(eur).toMatch(/120\.50|€/);

    const gbp = formatCurrency(99.99, 'GBP');
    expect(gbp).toMatch(/99\.99|£/);
  });

  it('handles invalid currency code gracefully by falling back to USD', () => {
    const fallback = formatCurrency(100, 'INVALID_CODE');
    expect(fallback).toContain('100.00');
  });

  it('treats missing or invalid currency values as zero', () => {
    expect(formatCurrency(null)).toContain('0.00');
    expect(formatCurrency('abc')).toContain('0.00');
  });

  it('returns the last months newest first', () => {
    const months = recentMonths(3, new Date(2026, 9, 11));
    expect(months).toEqual(['2026-10', '2026-09', '2026-08']);
  });

  it('pads single-digit months', () => {
    expect(toMonthString(new Date(2026, 0, 5))).toBe('2026-01');
  });

  it('labels a year-month and converts enum names', () => {
    expect(monthLabel('2026-10')).toMatch(/October 2026/);
    expect(titleCase('OTHER_INCOME')).toBe('Other income');
  });
});
