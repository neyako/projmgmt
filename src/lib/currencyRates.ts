import { prisma } from "@/lib/prisma";
import {
  SUPPORTED_CURRENCY_CODES,
  currencyRateKey,
  type CurrencyRateSnapshot,
} from "@/lib/currency";

const PROVIDER = "ExchangeRate-API Open Access";
const PROVIDER_URL = "https://www.exchangerate-api.com";
const OPEN_ACCESS_ENDPOINT = "https://open.er-api.com/v6/latest/USD";
const RATE_TTL_MS = 24 * 60 * 60 * 1000;

type OpenAccessResponse = {
  result?: string;
  base_code?: string;
  rates?: Record<string, number>;
  "error-type"?: string;
};

const expectedRateCount =
  SUPPORTED_CURRENCY_CODES.length * (SUPPORTED_CURRENCY_CODES.length - 1);

async function fetchUsdRates(): Promise<Record<string, number>> {
  const response = await fetch(OPEN_ACCESS_ENDPOINT, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Exchange rate request failed with ${response.status}.`);
  }

  const payload = (await response.json()) as OpenAccessResponse;

  if (payload.result !== "success" || payload.base_code !== "USD" || !payload.rates) {
    throw new Error(payload["error-type"] || "Exchange rate response was invalid.");
  }

  const usdRates: Record<string, number> = {};
  for (const currency of SUPPORTED_CURRENCY_CODES) {
    const rate = currency === "USD" ? 1 : payload.rates[currency];
    if (typeof rate !== "number" || !Number.isFinite(rate)) {
      throw new Error(`Exchange rate for ${currency} is missing.`);
    }
    usdRates[currency] = rate;
  }

  return usdRates;
}

async function getCurrencyRateSnapshot(): Promise<CurrencyRateSnapshot> {
  const rows = await prisma.currencyRate.findMany({
    where: {
      baseCurrency: { in: [...SUPPORTED_CURRENCY_CODES] },
      targetCurrency: { in: [...SUPPORTED_CURRENCY_CODES] },
    },
    orderBy: { fetchedAt: "desc" },
  });

  const rates = rows.reduce<Record<string, number>>((acc, row) => {
    acc[currencyRateKey(row.baseCurrency, row.targetCurrency)] = row.rate;
    return acc;
  }, {});

  const fetchedAt = rows[0]?.fetchedAt ?? null;

  return {
    rates,
    fetchedAt: fetchedAt ? fetchedAt.toISOString() : null,
    provider: PROVIDER,
    providerUrl: PROVIDER_URL,
    missingRateCount: Math.max(expectedRateCount - rows.length, 0),
  };
}

export async function syncCurrencyRates(): Promise<{
  success: boolean;
  count: number;
  fetchedAt: string | null;
  error?: string;
}> {
  try {
    const usdRates = await fetchUsdRates();
    const fetchedAt = new Date();
    const data = [];

    for (const baseCurrency of SUPPORTED_CURRENCY_CODES) {
      for (const targetCurrency of SUPPORTED_CURRENCY_CODES) {
        if (baseCurrency === targetCurrency) continue;
        data.push({
          baseCurrency,
          targetCurrency,
          rate: usdRates[targetCurrency] / usdRates[baseCurrency],
          provider: PROVIDER,
          fetchedAt,
        });
      }
    }

    await prisma.$transaction([
      prisma.currencyRate.deleteMany({
        where: {
          baseCurrency: { in: [...SUPPORTED_CURRENCY_CODES] },
          targetCurrency: { in: [...SUPPORTED_CURRENCY_CODES] },
        },
      }),
      prisma.currencyRate.createMany({ data }),
    ]);

    return {
      success: true,
      count: data.length,
      fetchedAt: fetchedAt.toISOString(),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update exchange rates.";
    console.error("[syncCurrencyRates]", error);
    return {
      success: false,
      count: 0,
      fetchedAt: null,
      error: message,
    };
  }
}

export async function ensureFreshCurrencyRates(): Promise<CurrencyRateSnapshot> {
  const newestRate = await prisma.currencyRate.findFirst({
    where: {
      baseCurrency: { in: [...SUPPORTED_CURRENCY_CODES] },
      targetCurrency: { in: [...SUPPORTED_CURRENCY_CODES] },
    },
    orderBy: { fetchedAt: "desc" },
    select: { fetchedAt: true },
  });

  const cachedCount = await prisma.currencyRate.count({
    where: {
      baseCurrency: { in: [...SUPPORTED_CURRENCY_CODES] },
      targetCurrency: { in: [...SUPPORTED_CURRENCY_CODES] },
    },
  });

  const cacheIsFresh =
    newestRate &&
    cachedCount >= expectedRateCount &&
    Date.now() - newestRate.fetchedAt.getTime() < RATE_TTL_MS;

  if (!cacheIsFresh) {
    await syncCurrencyRates();
  }

  return getCurrencyRateSnapshot();
}
