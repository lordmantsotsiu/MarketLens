export interface FXRatesResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

export interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number | null;
  price_change_percentage_24h: number | null;
  sparkline_in_7d?: {
    price: number[];
  };
}

export interface ChartPoint {
  time: string; // YYYY-MM-DD
  value: number;
}