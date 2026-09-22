'use client';

import React, { useState } from 'react';
import { useFXRates, useCryptoPrices } from '@/hooks/useMarketData';
import { useWatchlistStore } from '@/store/useWatchlistStore';
import { MarketChart } from '@/components/MarketChart';

export default function Dashboard() {
  const [baseFiat, setBaseFiat] = useState('USD');
  const [amount, setAmount] = useState<number>(100);
  const [targetFiat, setTargetFiat] = useState('EUR');

  const { data: fxData, isLoading: fxLoading } = useFXRates(baseFiat);
  const { data: cryptoData, isLoading: cryptoLoading } = useCryptoPrices();
  const { symbols, toggleSymbol } = useWatchlistStore();

  // Calculate conversion
  const convertedAmount = fxData?.rates[targetFiat]
    ? (amount * fxData.rates[targetFiat]).toFixed(2)
    : '---';

  // Format mock trend points from sparkline data if available
  const sampleChartData = cryptoData?.[0]?.sparkline_in_7d?.price.map((val, idx) => ({
    time: `2026-09-${String((idx % 28) + 1).padStart(2, '0')}`,
    value: val,
  })) || [];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 space-y-8">
      {/* Header */}
      <header className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-blue-400">MarketLens</h1>
          <p className="text-xs text-slate-400">Open Financial & Crypto Intelligence</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FX Converter Section */}
        <section className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
          <h2 className="text-lg font-semibold text-slate-200">FX Converter</h2>
          {fxLoading ? (
            <p className="text-slate-500 text-sm">Fetching ECB Rates...</p>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Amount & Source</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                  />
                  <select
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
                <label className="text-xs text-slate-400 block mb-1">Target Currency</label>
                <select
                  value={targetFiat}
                  onChange={(e) => setTargetFiat(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                >
                  {fxData &&
                    Object.keys(fxData.rates).map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                </select>
              </div>

              <div className="p-3 bg-slate-950/50 rounded border border-slate-800/80 text-center">
                <span className="text-xs text-slate-500 block">Converted Value</span>
                <span className="text-xl font-mono font-bold text-emerald-400">
                  {convertedAmount} {targetFiat}
                </span>
              </div>
            </div>
          )}
        </section>

        {/* Top Crypto Markets */}
        <section className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <h2 className="text-lg font-semibold text-slate-200 mb-4">Top Cryptocurrencies</h2>
          {cryptoLoading ? (
            <p className="text-slate-500 text-sm">Loading market pairs...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs">
                    <th className="pb-2">Asset</th>
                    <th className="pb-2">Price (USD)</th>
                    <th className="pb-2">24h Change</th>
                    <th className="pb-2 text-right">Watchlist</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {cryptoData?.map((coin) => {
                    const isStarred = symbols.includes(coin.symbol.toLowerCase());
                    return (
                      <tr key={coin.id} className="hover:bg-slate-800/30">
                        <td className="py-2.5 font-medium flex items-center gap-2">
                          <span className="uppercase font-bold">{coin.symbol}</span>
                          <span className="text-xs text-slate-500">{coin.name}</span>
                        </td>
                        <td className="py-2.5 font-mono">${coin.current_price.toLocaleString()}</td>
                        <td
                          className={`py-2.5 font-mono ${
                            coin.price_change_percentage_24h >= 0
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {coin.price_change_percentage_24h.toFixed(2)}%
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => toggleSymbol(coin.symbol)}
                            className={`text-xs px-2 py-1 rounded transition ${
                              isStarred
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {isStarred ? 'Saved' : '+ Add'}
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
      {sampleChartData.length > 0 && (
        <section>
          <MarketChart
            data={sampleChartData}
            title={`${cryptoData?.[0]?.name || 'Bitcoin'} 7-Day Trend Canvas`}
          />
        </section>
      )}
    </main>
  );
}