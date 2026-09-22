import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WatchlistState {
  symbols: string[];
  addSymbol: (symbol: string) => void;
  removeSymbol: (symbol: string) => void;
  toggleSymbol: (symbol: string) => void;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      symbols: ['btc', 'eth', 'sol'],
      addSymbol: (symbol) => set({ symbols: [...get().symbols, symbol.toLowerCase()] }),
      removeSymbol: (symbol) =>
        set({ symbols: get().symbols.filter((s) => s !== symbol.toLowerCase()) }),
      toggleSymbol: (symbol) => {
        const sym = symbol.toLowerCase();
        const exists = get().symbols.includes(sym);
        if (exists) {
          get().removeSymbol(sym);
        } else {
          get().addSymbol(sym);
        }
      },
    }),
    { name: 'marketlens-watchlist' }
  )
);