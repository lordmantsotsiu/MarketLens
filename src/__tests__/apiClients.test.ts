import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchFXRates, fetchTopCrypto, toDailyPoints } from '@/lib/apiClients';

const okJson = (payload: unknown) => ({ ok: true, status: 200, json: async () => payload });

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

    (global.fetch as any).mockResolvedValueOnce(okJson(mockFXResponse));

    const data = await fetchFXRates('USD');
    expect(data.base).toBe('USD');
    expect(data.rates.EUR).toBe(0.92);
    // First argument is the request URL (an abort signal is passed as options).
    expect((global.fetch as any).mock.calls[0][0]).toBe(
      'https://api.frankfurter.app/latest?from=USD'
    );
  });

  it('rejects malformed FX payloads instead of returning them', async () => {
    (global.fetch as any).mockResolvedValueOnce(okJson({ unexpected: true }));
    await expect(fetchFXRates('USD')).rejects.toThrow('unexpected response');
  });

  it('falls back to CoinLore API when CoinGecko keeps rate-limiting (429)', async () => {
    // CoinGecko: initial request + 2 retries = 3 attempts, all rate-limited.
    (global.fetch as any)
      .mockResolvedValueOnce({ status: 429, ok: false })
      .mockResolvedValueOnce({ status: 429, ok: false })
      .mockResolvedValueOnce({ status: 429, ok: false });

    // CoinLore Fallback payload
    const mockCoinLoreResponse = {
      data: [
        {
          nameid: 'bitcoin',
          symbol: 'BTC',
          name: 'Bitcoin',
          price_usd: '65000.00',
          percent_change_24h: '2.5',
        },
      ],
    };
    (global.fetch as any).mockResolvedValueOnce(okJson(mockCoinLoreResponse));

    const cryptoData = await fetchTopCrypto();

    expect(cryptoData.length).toBe(1);
    expect(cryptoData[0].symbol).toBe('btc');
    expect(cryptoData[0].current_price).toBe(65000.0);
    // 3 CoinGecko attempts + 1 CoinLore fallback
    expect(global.fetch).toHaveBeenCalledTimes(4);
  });

  it('maps unparseable fallback numbers to null instead of NaN', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({ status: 429, ok: false })
      .mockResolvedValueOnce({ status: 429, ok: false })
      .mockResolvedValueOnce({ status: 429, ok: false })
      .mockResolvedValueOnce(
        okJson({
          data: [
            {
              nameid: 'weirdcoin',
              symbol: 'WEIRD',
              name: 'Weird Coin',
              price_usd: 'not-a-number',
              percent_change_24h: '',
            },
          ],
        })
      );

    const [coin] = await fetchTopCrypto();
    expect(coin.current_price).toBeNull();
    expect(coin.price_change_percentage_24h).toBeNull();
  });
});

describe('toDailyPoints (chart safety net)', () => {
  it('produces strictly ascending, duplicate-free timestamps', () => {
    // 48 hourly samples = 2 days; chart libs throw on duplicate timestamps.
    const hourly = Array.from({ length: 48 }, (_, i) => 100 + i);
    const end = new Date('2026-09-22T00:00:00Z');
    const points = toDailyPoints(hourly, end);

    expect(points.length).toBeGreaterThan(0);
    for (let i = 1; i < points.length; i++) {
      expect(points[i].time > points[i - 1].time).toBe(true);
    }
    const times = new Set(points.map((p) => p.time));
    expect(times.size).toBe(points.length);
  });

  it('drops non-finite values', () => {
    const points = toDailyPoints([NaN, Infinity, 42], new Date('2026-09-22T00:00:00Z'));
    expect(points).toEqual([{ time: '2026-09-22', value: 42 }]);
  });
});
