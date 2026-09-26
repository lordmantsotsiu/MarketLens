import { FXRatesResponse, CryptoPrice } from './types';

const DEFAULT_TIMEOUT_MS = 10_000;

export class TimeoutError extends Error {
  constructor(label: string) {
    super(`${label}: request timed out after ${DEFAULT_TIMEOUT_MS}ms`);
    this.name = 'TimeoutError';
  }
}

/**
 * Fetch with a hard timeout so a hanging third-party API can never leave the
 * page stuck on a loading state indefinitely.
 */
export async function fetchWithTimeout(
  input: string,
  init: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError(input);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Retry transient failures (network errors, 429/5xx) with exponential backoff.
 * Never retries client errors like 404.
 */
export async function fetchWithRetry(
  input: string,
  init: RequestInit = {},
  { retries = 2, timeoutMs }: { retries?: number; timeoutMs?: number } = {}
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(input, init, timeoutMs);
      // Retry on rate limiting and server errors.
      if (res.status === 429 || res.status >= 500) {
        throw new Error(`${input}: HTTP ${res.status}`);
      }
      return res;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        const delayMs = 750 * Math.pow(2, attempt) + Math.random() * 250;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

// Frankfurter FX API (No API Key Required)
export async function fetchFXRates(baseCurrency: string = 'USD'): Promise<FXRatesResponse> {
  const currency = encodeURIComponent(baseCurrency.toUpperCase());
  const res = await fetchWithRetry(`https://api.frankfurter.app/latest?from=${currency}`);
  if (!res.ok) throw new Error('Failed to fetch FX rates');
  const data = (await res.json()) as FXRatesResponse;
  if (!data || typeof data.rates !== 'object' || data.rates === null) {
    throw new Error('FX API returned an unexpected response');
  }
  return data;
}

type CoinLoreTicker = {
  nameid: string;
  symbol: string;
  name: string;
  price_usd: string;
  percent_change_24h: string;
};

/**
 * CoinGecko Primary Crypto API with CoinLore Fallback.
 * Returns null values through untouched — the UI renders "—" for them
 * instead of crashing.
 */
export async function fetchTopCrypto(): Promise<CryptoPrice[]> {
  try {
    const res = await fetchWithRetry(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=true'
    );
    if (!res.ok) throw new Error('CoinGecko Request Failed');
    const data = (await res.json()) as CryptoPrice[];
    if (!Array.isArray(data)) throw new Error('CoinGecko returned an unexpected response');
    return data;
  } catch (error) {
    console.warn('Falling back to CoinLore API due to rate limit or error:', error);

    // Fallback: CoinLore Public API
    const fallbackRes = await fetchWithRetry('https://api.coinlore.net/api/tickers/?limit=10');
    if (!fallbackRes.ok) throw new Error('Failed to fetch fallback crypto data');
    const fallback = await fallbackRes.json();
    if (!fallback || !Array.isArray(fallback.data)) {
      throw new Error('Fallback crypto API returned an unexpected response');
    }

    return (fallback.data as CoinLoreTicker[]).map((coin) => ({
      id: coin.nameid,
      symbol: coin.symbol.toLowerCase(),
      name: coin.name,
      current_price: Number.isFinite(parseFloat(coin.price_usd))
        ? parseFloat(coin.price_usd)
        : null,
      price_change_percentage_24h: Number.isFinite(parseFloat(coin.percent_change_24h))
        ? parseFloat(coin.percent_change_24h)
        : null,
    }));
  }
}

/**
 * Convert an ordered price series into ascending, deduplicated daily points.
 * lightweight-charts throws on duplicate or non-ascending timestamps, so this
 * is the load-bearing safety net for the primary chart data path.
 */
export function toDailyPoints(
  prices: number[],
  endDate = new Date()
): { time: string; value: number }[] {
  const points: { time: string; value: number }[] = [];
  let lastKey: string | null = null;

  prices.forEach((value, idx) => {
    if (!Number.isFinite(value)) return;
    const dayOffset = Math.floor(idx / 24); // hourly series → 24 samples per day
    const day = new Date(endDate.getTime() - dayOffset * 86_400_000);
    const time = day.toISOString().slice(0, 10);
    if (time === lastKey) return; // keep the latest sample of each day
    lastKey = time;
    points.push({ time, value });
  });

  return points.reverse(); // ascending order, as the chart requires
}
