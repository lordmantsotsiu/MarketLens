import { describe, it, expect, beforeEach } from 'vitest';
import { useWatchlistStore } from '@/store/useWatchlistStore';

describe('Watchlist Store (Zustand)', () => {
  beforeEach(() => {
    useWatchlistStore.setState({ symbols: ['btc', 'eth'] });
  });

  it('adds a new symbol to the watchlist', () => {
    useWatchlistStore.getState().addSymbol('SOL');
    expect(useWatchlistStore.getState().symbols).toContain('sol');
  });

  it('removes a symbol from the watchlist', () => {
    useWatchlistStore.getState().removeSymbol('BTC');
    expect(useWatchlistStore.getState().symbols).not.toContain('btc');
  });

  it('toggles symbol presence correctly', () => {
    useWatchlistStore.getState().toggleSymbol('ETH');
    expect(useWatchlistStore.getState().symbols).not.toContain('eth');

    useWatchlistStore.getState().toggleSymbol('ETH');
    expect(useWatchlistStore.getState().symbols).toContain('eth');
  });
});