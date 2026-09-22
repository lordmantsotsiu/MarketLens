import { useQuery } from '@tanstack/react-query';
import { fetchFXRates, fetchTopCrypto } from '@/lib/apiClients';

export function useFXRates(baseCurrency: string = 'USD') {
  return useQuery({
    queryKey: ['fxRates', baseCurrency],
    queryFn: () => fetchFXRates(baseCurrency),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    gcTime: 1000 * 60 * 120,
  });
}

export function useCryptoPrices() {
  return useQuery({
    queryKey: ['cryptoPrices'],
    queryFn: fetchTopCrypto,
    refetchInterval: 30000, // Poll every 30 seconds
    staleTime: 15000,
  });
}