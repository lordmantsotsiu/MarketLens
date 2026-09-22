import { FXRatesResponse, CryptoPrice } from './types';

// Frankfurter FX API (No API Key Required)
export async function fetchFXRates(baseCurrency: string = 'USD'): Promise<FXRatesResponse> {
  const res = await fetch(`https://api.frankfurter.app/latest?from=${baseCurrency}`);
  if (!res.ok) throw new Error('Failed to fetch FX rates');
  return res.json();
}

// CoinGecko Primary Crypto API with CoinLore Fallback
export async function fetchTopCrypto(): Promise<CryptoPrice[]> {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=true'
    );
    if (res.status === 429) {
      throw new Error('CoinGecko Rate Limit');
    }
    if (!res.ok) throw new Error('CoinGecko Request Failed');
    return await res.json();
  } catch (error) {
    console.warn('Falling back to CoinLore API due to rate limit or error:', error);
    
    // Fallback: CoinLore Public API
    const fallbackRes = await fetch('https://api.coinlore.net/api/tickers/?limit=10');
    if (!fallbackRes.ok) throw new Error('Failed to fetch fallback crypto data');
    const data = await fallbackRes.json();
    
    return data.data.map((coin: any) => ({
      id: coin.nameid,
      symbol: coin.symbol.toLowerCase(),
      name: coin.name,
      current_price: parseFloat(coin.price_usd),
      price_change_percentage_24h: parseFloat(coin.percent_change_24h),
    }));
  }
}