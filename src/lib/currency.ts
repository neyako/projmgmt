export const DEFAULT_CURRENCY = "VND";

export const SUPPORTED_CURRENCIES = [
  { code: "VND", label: "Vietnamese Dong" },
  { code: "USD", label: "US Dollar" },
  { code: "EUR", label: "Euro" },
  { code: "GBP", label: "British Pound" },
  { code: "AUD", label: "Australian Dollar" },
  { code: "CAD", label: "Canadian Dollar" },
  { code: "SGD", label: "Singapore Dollar" },
  { code: "THB", label: "Thai Baht" },
  { code: "JPY", label: "Japanese Yen" },
  { code: "KRW", label: "Korean Won" },
  { code: "CNY", label: "Chinese Yuan" },
  { code: "PHP", label: "Philippine Peso" },
] as const;

export const SUPPORTED_CURRENCY_CODES = SUPPORTED_CURRENCIES.map(
  (currency) => currency.code
);

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"];
export type CurrencyRateMap = Record<string, number>;
export type CurrencyRateSnapshot = {
  rates: CurrencyRateMap;
  fetchedAt: string | null;
  provider: string;
  providerUrl: string;
  missingRateCount: number;
};

const zeroFractionCurrencies = new Set(["VND", "JPY", "KRW"]);

export function isSupportedCurrency(value: string | null | undefined): value is CurrencyCode {
  return SUPPORTED_CURRENCY_CODES.includes(value as CurrencyCode);
}

export function normalizeCurrency(value: string | null | undefined): CurrencyCode {
  const upper = value?.toUpperCase();
  return isSupportedCurrency(upper) ? upper : DEFAULT_CURRENCY;
}

export function currencyRateKey(baseCurrency: string, targetCurrency: string): string {
  return `${baseCurrency.toUpperCase()}:${targetCurrency.toUpperCase()}`;
}

export function convertCurrencyAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: CurrencyRateMap
): number | null {
  if (!Number.isFinite(amount)) return null;

  const from = normalizeCurrency(fromCurrency);
  const to = normalizeCurrency(toCurrency);

  if (from === to) return amount;

  const rate = rates[currencyRateKey(from, to)];
  return typeof rate === "number" && Number.isFinite(rate) ? amount * rate : null;
}

export function formatCurrencyAmount(
  amount: number,
  currency: string,
  locale = "en-US"
): string {
  const normalized = normalizeCurrency(currency);
  const fractionDigits = zeroFractionCurrencies.has(normalized) ? 0 : 2;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: normalized,
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
}
