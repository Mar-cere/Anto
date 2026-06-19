/**
 * Redirige al resumen unificado (compatibilidad de rutas y deep links).
 */
import { useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { resolveMonthlyInsightKey } from '../utils/monthKeys';

export default function WeeklyInsightScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  useEffect(() => {
    const period = route?.params?.period === 'month' ? 'month' : 'week';
    const params = { initialPeriod: period };
    if (period === 'month') {
      const monthKey = resolveMonthlyInsightKey(route?.params?.monthKey, {
        year: route?.params?.year,
        month: route?.params?.month,
      });
      if (monthKey) params.monthKey = monthKey;
      if (route?.params?.year != null) params.year = route.params.year;
      if (route?.params?.month != null) params.month = route.params.month;
    } else if (typeof route?.params?.weekKey === 'string' && route.params.weekKey.trim()) {
      params.weekKey = route.params.weekKey.trim();
    }
    navigation.replace('ActivitySummary', params);
  }, [navigation, route.params]);

  return null;
}
