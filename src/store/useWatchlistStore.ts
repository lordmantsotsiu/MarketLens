import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface WatchlistState {
  symbols: string[];
  hydrated: boolean;
  addSymbol: (symbol: string) => void;
  removeSymbol: (symbol: string) => void;
  toggleSymbol: (symbol: string) => void;
  setHydrated: (v: boolean) => void;
}

/**
 * The persisted watchlist rehydrates from localStorage on the client only.
 * We gate rehydration behind `setHydrated` so the server-rendered HTML and the
 * first client render always agree — otherwise React logs a hydration error
 * and re-renders the whole tree.
 */
export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      symbols: [],
      hydrated: false,
      addSymbol: (symbol) =>
        set((state) => ({
          symbols: state.symbols.includes(symbol.toLowerCase())
            ? state.symbols
            : [...state.symbols, symbol.toLowerCase()],
        })),
      removeSymbol: (symbol) =>
        set((state) => ({
          symbols: state.symbols.filter((s) => s !== symbol.toLowerCase()),
        })),
      toggleSymbol: (symbol) => {
        const sym = symbol.toLowerCase();
        const exists = get().symbols.includes(sym);
        if (exists) {
          get().removeSymbol(sym);
        } else {
          get().addSymbol(sym);
        }
      },
      setHydrated: (v) => set({ hydrated: v }),
    }),
    {
      name: 'marketlens-watchlist',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true, // hydrate manually after mount (see page.tsx)
    }
  )
);
