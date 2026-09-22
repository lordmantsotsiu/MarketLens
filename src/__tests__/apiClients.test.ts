import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchFXRates, fetchTopCrypto } from '@/lib/apiClients';

describe('MarketLens API Clients', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches FX rates successfully from Frankfurter API', async () => {
    const mockFXResponse = {
      amount: 1,
      base: 'USD',
      date: '2026-09-22',
      rates: { EUR: 0.92, GBP: 0.78 },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockFXResponse,
    });

    const data = await fetchFXRates('USD');
    expect(data.base).toBe('USD');
    expect(data.rates.EUR).toBe(0.92);
    expect(global.fetch).toHaveBeenCalledWith('https://api.frankfurter.app/latest?from=USD');
  });

  it('falls back to CoinLore API when CoinGecko responds with HTTP 429', async () => {
    // 1st Fetch: CoinGecko rate limit (429)
    (global.fetch as any).mockResolvedValueOnce({
      status: 429,
      ok: false,
    });

    // 2nd Fetch: CoinLore Fallback payload
    const mockCoinLoreResponse = {
      data: [
        { nameid: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price_usd: '65000.00', percent_change_24h: '2.5' },
      ],
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCoinLoreResponse,
    });

    const cryptoData = await fetchTopCrypto();

    expect(cryptoData.length).toBe(1);
    expect(cryptoData[0].symbol).toBe('btc');
    expect(cryptoData[0].current_price).toBe(65000.0);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});