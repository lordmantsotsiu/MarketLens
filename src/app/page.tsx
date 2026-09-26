'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useFXRates, useCryptoPrices } from '@/hooks/useMarketData';
import { useWatchlistStore } from '@/store/useWatchlistStore';
import { MarketChart } from '@/components/MarketChart';
import { toDailyPoints } from '@/lib/apiClients';

function formatPrice(price: number | null): string {
  if (price === null || !Number.isFinite(price)) return '—';
  if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(6)}`;
}

function formatPercent(pct: number | null): string {
  if (pct === null || !Number.isFinite(pct)) return '—';
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

export default function Dashboard() {
  const [baseFiat, setBaseFiat] = useState('USD');
  const [amount, setAmount] = useState<number>(100);
  const [amountText, setAmountText] = useState('100');
  const [targetFiat, setTargetFiat] = useState('EUR');
  const [chartCoinId, setChartCoinId] = useState<string | null>(null);

  const { data: fxData, isLoading: fxLoading, isError: fxError, refetch: fxRefetch } = useFXRates(baseFiat);
  const { data: cryptoData, isLoading: cryptoLoading, isError: cryptoError, refetch: cryptoRefetch } = useCryptoPrices();
  const { symbols, toggleSymbol, hydrated, setHydrated } = useWatchlistStore();

  // Rehydrate the persisted watchlist AFTER mount so server HTML and first
  // client render match (no hydration mismatch warning/flash).
  useEffect(() => {
    useWatchlistStore.persist.rehydrate();
    setHydrated(true);
  }, [setHydrated]);

  const coins = useMemo(() => cryptoData ?? [], [cryptoData]);

  const chartCoin = useMemo(
    () => coins.find((c) => c.id === chartCoinId) ?? coins[0],
    [coins, chartCoinId]
  );

  const chartData = useMemo(
    () => toDailyPoints(chartCoin?.sparkline_in_7d?.price ?? []),
    [chartCoin]
  );

  // Conversion — guarded against missing rate or invalid amount.
  const rate = fxData?.rates?.[targetFiat];
  const parsedAmount = Number.isFinite(amount) ? amount : 0;
  const convertedAmount = rate ? (parsedAmount * rate).toLocaleString('en-US', { maximumFractionDigits: 2 }) : null;

  const visibleCoins = useMemo(() => {
    if (!hydrated || symbols.length === 0) return coins;
    return coins.filter((c) => symbols.includes(c.symbol.toLowerCase()));
  }, [coins, symbols, hydrated]);

  const showAll = !hydrated || symbols.length === 0;
  const displayedCoins = showAll ? coins : visibleCoins;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 space-y-8">
      {/* Header */}
      <header className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-blue-400">MarketLens</h1>
          <p className="text-xs text-slate-400">Open Financial &amp; Crypto Intelligence</p>
        </div>
        <span className="text-xs text-slate-500">
          Data: Frankfurter (ECB) · CoinGecko / CoinLore
        </span>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FX Converter Section */}
        <section className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
          <h2 className="text-lg font-semibold text-slate-200">FX Converter</h2>
          {fxLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-10 bg-slate-800 rounded" />
              <div className="h-10 bg-slate-800 rounded" />
              <div className="h-16 bg-slate-800 rounded" />
            </div>
          ) : fxError || !fxData ? (
            <div className="space-y-3 text-center">
              <p className="text-sm text-rose-400">Could not load FX rates.</p>
              <button
                onClick={() => fxRefetch()}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sm transition"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label htmlFor="fx-amount" className="text-xs text-slate-400 block mb-1">
                  Amount &amp; Source
                </label>
                <div className="flex gap-2">
                  <input
                    id="fx-amount"
                    type="number"
                    min="0"
                    value={amountText}
                    onChange={(e) => {
                      setAmountText(e.target.value);
                      setAmount(parseFloat(e.target.value));
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                  />
                  <select
                    aria-label="Source currency"
                    value={baseFiat}
                    onChange={(e) => setBaseFiat(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="ZAR">ZAR</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="fx-target" className="text-xs text-slate-400 block mb-1">
                  Target Currency
                </label>
                <select
                  id="fx-target"
                  value={targetFiat}
                  onChange={(e) => setTargetFiat(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                >
                  {Object.keys(fxData.rates).map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-slate-950/50 rounded border border-slate-800/80 text-center">
                <span className="text-xs text-slate-500 block">Converted Value</span>
                <span className="text-xl font-mono font-bold text-emerald-400">
                  {convertedAmount !== null ? `${convertedAmount} ${targetFiat}` : '—'}
                </span>
              </div>
            </div>
          )}
        </section>

        {/* Top Crypto Markets */}
        <section className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="text-lg font-semibold text-slate-200">
              {showAll ? 'Top Cryptocurrencies' : `Watchlist (${displayedCoins.length})`}
            </h2>
            {cryptoData && (
              <button
                onClick={() => cryptoRefetch()}
                className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Refresh prices"
              >
                ⟳ Refresh
              </button>
            )}
          </div>

          {cryptoLoading ? (
            <div className="space-y-2 animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-9 bg-slate-800/80 rounded" />
              ))}
            </div>
          ) : cryptoError ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-sm text-rose-400">Market data is unavailable right now.</p>
              <button
                onClick={() => cryptoRefetch()}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sm transition"
              >
                Retry
              </button>
            </div>
          ) : displayedCoins.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">
              No assets match your watchlist yet — add some from the table below.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs">
                    <th scope="col" className="pb-2">Asset</th>
                    <th scope="col" className="pb-2">Price (USD)</th>
                    <th scope="col" className="pb-2">24h Change</th>
                    <th scope="col" className="pb-2 text-right">Watchlist</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {displayedCoins.map((coin) => {
                    const sym = coin.symbol.toLowerCase();
                    const isStarred = symbols.includes(sym);
                    const change = coin.price_change_percentage_24h;
                    return (
                      <tr
                        key={coin.id}
                        onClick={() => setChartCoinId(coin.id)}
                        className={`cursor-pointer transition ${
                          chartCoin?.id === coin.id ? 'bg-blue-950/40' : 'hover:bg-slate-800/30'
                        }`}
                      >
                        <td className="py-2.5 font-medium">
                          <div className="flex items-center gap-2">
                            <span className="uppercase font-bold">{coin.symbol}</span>
                            <span className="text-xs text-slate-500 hidden sm:inline">{coin.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 font-mono">{formatPrice(coin.current_price)}</td>
                        <td
                          className={`py-2.5 font-mono ${
                            change === null || !Number.isFinite(change)
                              ? 'text-slate-500'
                              : change >= 0
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                          }`}
                        >
                          {formatPercent(change)}
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSymbol(sym);
                            }}
                            className={`text-xs px-2 py-1 rounded transition ${
                              isStarred
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                          >
                            {isStarred ? '★ Saved' : '+ Add'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Chart Section */}
      <section>
        <MarketChart
          data={chartData}
          title={`${chartCoin?.name ?? 'Market'} — 7-Day Trend`}
        />
      </section>
    </main>
  );
}
