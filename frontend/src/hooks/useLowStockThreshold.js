import { useQuery } from '@tanstack/react-query';
import * as adminApi from '../services/adminApi.js';

/** "Low stock" limit from Admin > Settings (falls back to 5 while loading). */
export default function useLowStockThreshold() {
  const { data } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => adminApi.getSettings().then((res) => res.settings),
    staleTime: 5 * 60 * 1000,
  });
  return data?.lowStockThreshold ?? 5;
}