/**
 * Country → currency mapping for the country/currency selectors.
 * Each entry: { code: ISO 3166-1 alpha-2, name, currency: ISO 4217 code, currencyName, symbol }.
 * This is a curated list of commonly-used countries/currencies; the backend validates the
 * currency code against the full Java ISO 4217 database, so users can also type custom codes.
 */
const COUNTRIES = [
  { code: 'US', name: 'United States', currency: 'USD', currencyName: 'US Dollar', symbol: '$' },
  { code: 'IN', name: 'India', currency: 'INR', currencyName: 'Indian Rupee', symbol: '₹' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', currencyName: 'British Pound', symbol: '£' },
  { code: 'CA', name: 'Canada', currency: 'CAD', currencyName: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'AU', name: 'Australia', currency: 'AUD', currencyName: 'Australian Dollar', symbol: 'A$' },
  { code: 'DE', name: 'Germany', currency: 'EUR', currencyName: 'Euro', symbol: '€' },
  { code: 'FR', name: 'France', currency: 'EUR', currencyName: 'Euro', symbol: '€' },
  { code: 'IT', name: 'Italy', currency: 'EUR', currencyName: 'Euro', symbol: '€' },
  { code: 'ES', name: 'Spain', currency: 'EUR', currencyName: 'Euro', symbol: '€' },
  { code: 'NL', name: 'Netherlands', currency: 'EUR', currencyName: 'Euro', symbol: '€' },
  { code: 'PT', name: 'Portugal', currency: 'EUR', currencyName: 'Euro', symbol: '€' },
  { code: 'BE', name: 'Belgium', currency: 'EUR', currencyName: 'Euro', symbol: '€' },
  { code: 'AT', name: 'Austria', currency: 'EUR', currencyName: 'Euro', symbol: '€' },
  { code: 'IE', name: 'Ireland', currency: 'EUR', currencyName: 'Euro', symbol: '€' },
  { code: 'FI', name: 'Finland', currency: 'EUR', currencyName: 'Euro', symbol: '€' },
  { code: 'JP', name: 'Japan', currency: 'JPY', currencyName: 'Japanese Yen', symbol: '¥' },
  { code: 'CN', name: 'China', currency: 'CNY', currencyName: 'Chinese Yuan', symbol: '¥' },
  { code: 'KR', name: 'South Korea', currency: 'KRW', currencyName: 'South Korean Won', symbol: '₩' },
  { code: 'BR', name: 'Brazil', currency: 'BRL', currencyName: 'Brazilian Real', symbol: 'R$' },
  { code: 'MX', name: 'Mexico', currency: 'MXN', currencyName: 'Mexican Peso', symbol: 'MX$' },
  { code: 'AR', name: 'Argentina', currency: 'ARS', currencyName: 'Argentine Peso', symbol: 'AR$' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', currencyName: 'South African Rand', symbol: 'R' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN', currencyName: 'Nigerian Naira', symbol: '₦' },
  { code: 'KE', name: 'Kenya', currency: 'KES', currencyName: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'EG', name: 'Egypt', currency: 'EGP', currencyName: 'Egyptian Pound', symbol: 'E£' },
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED', currencyName: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SA', name: 'Saudi Arabia', currency: 'SAR', currencyName: 'Saudi Riyal', symbol: 'ر.س' },
  { code: 'SG', name: 'Singapore', currency: 'SGD', currencyName: 'Singapore Dollar', symbol: 'S$' },
  { code: 'MY', name: 'Malaysia', currency: 'MYR', currencyName: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'TH', name: 'Thailand', currency: 'THB', currencyName: 'Thai Baht', symbol: '฿' },
  { code: 'ID', name: 'Indonesia', currency: 'IDR', currencyName: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'PH', name: 'Philippines', currency: 'PHP', currencyName: 'Philippine Peso', symbol: '₱' },
  { code: 'VN', name: 'Vietnam', currency: 'VND', currencyName: 'Vietnamese Dong', symbol: '₫' },
  { code: 'PK', name: 'Pakistan', currency: 'PKR', currencyName: 'Pakistani Rupee', symbol: '₨' },
  { code: 'BD', name: 'Bangladesh', currency: 'BDT', currencyName: 'Bangladeshi Taka', symbol: '৳' },
  { code: 'LK', name: 'Sri Lanka', currency: 'LKR', currencyName: 'Sri Lankan Rupee', symbol: 'Rs' },
  { code: 'NP', name: 'Nepal', currency: 'NPR', currencyName: 'Nepalese Rupee', symbol: 'रू' },
  { code: 'RU', name: 'Russia', currency: 'RUB', currencyName: 'Russian Ruble', symbol: '₽' },
  { code: 'TR', name: 'Turkey', currency: 'TRY', currencyName: 'Turkish Lira', symbol: '₺' },
  { code: 'PL', name: 'Poland', currency: 'PLN', currencyName: 'Polish Zloty', symbol: 'zł' },
  { code: 'SE', name: 'Sweden', currency: 'SEK', currencyName: 'Swedish Krona', symbol: 'kr' },
  { code: 'NO', name: 'Norway', currency: 'NOK', currencyName: 'Norwegian Krone', symbol: 'kr' },
  { code: 'DK', name: 'Denmark', currency: 'DKK', currencyName: 'Danish Krone', symbol: 'kr' },
  { code: 'CH', name: 'Switzerland', currency: 'CHF', currencyName: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CZ', name: 'Czech Republic', currency: 'CZK', currencyName: 'Czech Koruna', symbol: 'Kč' },
  { code: 'HU', name: 'Hungary', currency: 'HUF', currencyName: 'Hungarian Forint', symbol: 'Ft' },
  { code: 'RO', name: 'Romania', currency: 'RON', currencyName: 'Romanian Leu', symbol: 'lei' },
  { code: 'NZ', name: 'New Zealand', currency: 'NZD', currencyName: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'CL', name: 'Chile', currency: 'CLP', currencyName: 'Chilean Peso', symbol: 'CL$' },
  { code: 'CO', name: 'Colombia', currency: 'COP', currencyName: 'Colombian Peso', symbol: 'CO$' },
  { code: 'PE', name: 'Peru', currency: 'PEN', currencyName: 'Peruvian Sol', symbol: 'S/' },
  { code: 'IL', name: 'Israel', currency: 'ILS', currencyName: 'Israeli Shekel', symbol: '₪' },
  { code: 'HK', name: 'Hong Kong', currency: 'HKD', currencyName: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'TW', name: 'Taiwan', currency: 'TWD', currencyName: 'New Taiwan Dollar', symbol: 'NT$' },
  { code: 'GH', name: 'Ghana', currency: 'GHS', currencyName: 'Ghanaian Cedi', symbol: 'GH₵' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS', currencyName: 'Tanzanian Shilling', symbol: 'TSh' },
  { code: 'UG', name: 'Uganda', currency: 'UGX', currencyName: 'Ugandan Shilling', symbol: 'USh' },
];

/** Deduplicated list of currencies (some countries share a currency like EUR). */
export const CURRENCIES = (() => {
  const seen = new Set();
  return COUNTRIES
    .filter((c) => { if (seen.has(c.currency)) return false; seen.add(c.currency); return true; })
    .map((c) => ({ code: c.currency, name: c.currencyName, symbol: c.symbol }))
    .sort((a, b) => a.code.localeCompare(b.code));
})();

export default COUNTRIES;

/** Get the default currency for a country code. */
export function defaultCurrencyForCountry(countryCode) {
  const entry = COUNTRIES.find((c) => c.code === countryCode);
  return entry ? entry.currency : 'USD';
}
