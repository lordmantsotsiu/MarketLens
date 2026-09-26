import { useQuery } from '@tanstack/react-query';
import { fetchFXRates, fetchTopCrypto } from '@/lib/apiClients';

export function useFXRates(baseCurrency: string = 'USD') {
  return useQuery({
    queryKey: ['fxRates', baseCurrency],
    queryFn: () => fetchFXRates(baseCurrency),
    staleTime: 1000 * 60 * 60, // ECB rates update ~daily; cache for 1 hour
    gcTime: 1000 * 60 * 120,
    retry: 1, // apiClients already retries with backoff — don't double-retry
  });
}

export function useCryptoPrices() {
  return useQuery({
    queryKey: ['cryptoPrices'],
    queryFn: fetchTopCrypto,
    staleTime: 15_000,
    refetchInterval: 120_000, // poll every 2 min (was 30s — invited rate limits)
    refetchIntervalInBackground: false, // stop polling when tab is hidden
    retry: 1,
  });
}
