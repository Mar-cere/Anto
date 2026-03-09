/**
 * Tests unitarios para el hook useCrisisDashboardScreen
 * @author AntoApp Team
 */

jest.mock('../../../config/api', () => ({
  api: { get: jest.fn() },
  ENDPOINTS: {
    CRISIS_SUMMARY: '/api/crisis/summary',
    CRISIS_TRENDS: '/api/crisis/trends',
    CRISIS_BY_MONTH: '/api/crisis/by-month',
    CRISIS_EMOTION_DISTRIBUTION: '/api/crisis/emotion-distribution',
    CRISIS_HISTORY: '/api/crisis/history',
  },
}));
jest.mock('../../../styles/globalStyles', () => ({ colors: {} }));

import { renderHook, act } from '@testing-library/react-native';
import { api } from '../../../config/api';
import { useCrisisDashboardScreen } from '../useCrisisDashboardScreen';

describe('useCrisisDashboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.get.mockImplementation((path) => {
      const base = { success: true, data: null };
      if (path === '/api/crisis/summary') return Promise.resolve({ ...base, data: { totalCrises: 0, averageRiskLevel: 'LOW' } });
      if (path === '/api/crisis/trends') return Promise.resolve({ ...base, data: { dataPoints: [], trend: 'stable' } });
      if (path === '/api/crisis/by-month') return Promise.resolve({ ...base, data: [] });
      if (path === '/api/crisis/emotion-distribution') return Promise.resolve({ ...base, data: { distribution: {}, total: 0 } });
      if (path === '/api/crisis/history') return Promise.resolve({ ...base, data: { crises: [] } });
      return Promise.resolve(base);
    });
  });

  it('debe retornar las claves esperadas', async () => {
    const { result } = renderHook(() => useCrisisDashboardScreen());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 80));
    });
    expect(result.current).toMatchObject({
      loading: expect.any(Boolean),
      refreshing: expect.any(Boolean),
      error: null,
      summary: expect.anything(),
      trends: expect.anything(),
      crisisByMonth: expect.any(Array),
      emotionDistribution: expect.anything(),
      history: expect.any(Array),
      trendPeriod: expect.any(String),
    });
    expect(typeof result.current.loadData).toBe('function');
    expect(typeof result.current.onRefresh).toBe('function');
    expect(typeof result.current.setTrendPeriod).toBe('function');
    expect(typeof result.current.formatTrendData).toBe('function');
    expect(typeof result.current.formatMonthlyData).toBe('function');
    expect(typeof result.current.formatEmotionDistribution).toBe('function');
    expect(typeof result.current.getRiskLevelColor).toBe('function');
    expect(typeof result.current.getRiskLevelText).toBe('function');
    expect(typeof result.current.formatDate).toBe('function');
    expect(typeof result.current.getTrendLabel).toBe('function');
    expect(typeof result.current.getTrendIcon).toBe('function');
    expect(typeof result.current.getTrendIconColor).toBe('function');
  });

  it('al montar debe llamar a los 5 endpoints de crisis', async () => {
    renderHook(() => useCrisisDashboardScreen());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });
    expect(api.get).toHaveBeenCalledWith('/api/crisis/summary', { days: '30' });
    expect(api.get).toHaveBeenCalledWith('/api/crisis/trends', { period: '30d' });
    expect(api.get).toHaveBeenCalledWith('/api/crisis/by-month', { months: '6' });
    expect(api.get).toHaveBeenCalledWith('/api/crisis/emotion-distribution', { days: '30' });
    expect(api.get).toHaveBeenCalledWith('/api/crisis/history', { limit: '5' });
  });

  it('después de cargar, loading es false y summary está poblado', async () => {
    const { result } = renderHook(() => useCrisisDashboardScreen());
    expect(result.current.loading).toBe(true);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.summary).toMatchObject({ totalCrises: 0, averageRiskLevel: 'LOW' });
    expect(result.current.history).toEqual([]);
  });

  it('onRefresh pone refreshing y vuelve a llamar loadData', async () => {
    const { result } = renderHook(() => useCrisisDashboardScreen());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });
    const callCount = api.get.mock.calls.length;
    act(() => {
      result.current.onRefresh();
    });
    expect(result.current.refreshing).toBe(true);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });
    expect(api.get.mock.calls.length).toBeGreaterThan(callCount);
    expect(result.current.refreshing).toBe(false);
  });

  it('setTrendPeriod actualiza trendPeriod', async () => {
    const { result } = renderHook(() => useCrisisDashboardScreen());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(result.current.trendPeriod).toBe('30d');
    act(() => {
      result.current.setTrendPeriod('7d');
    });
    expect(result.current.trendPeriod).toBe('7d');
  });

  it('getRiskLevelColor devuelve color para LOW y fallback para desconocido', async () => {
    const { result } = renderHook(() => useCrisisDashboardScreen());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(result.current.getRiskLevelColor('LOW')).toBe('#4ECDC4');
    expect(result.current.getRiskLevelColor('HIGH')).toBe('#E74C3C');
    expect(result.current.getRiskLevelColor('UNKNOWN')).toBe('#4ECDC4');
  });

  it('getRiskLevelText devuelve texto para LOW y el level para desconocido', async () => {
    const { result } = renderHook(() => useCrisisDashboardScreen());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(result.current.getRiskLevelText('LOW')).toBe('Bajo');
    expect(result.current.getRiskLevelText('unknown')).toBe('unknown');
  });

  it('formatDate formatea fecha en es-ES', async () => {
    const { result } = renderHook(() => useCrisisDashboardScreen());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    const formatted = result.current.formatDate('2025-06-15T10:30:00.000Z');
    expect(formatted).toMatch(/\d{2}/);
    expect(formatted).toMatch(/jun|june|06/i);
    expect(formatted).toMatch(/2025/);
  });

  it('formatTrendData sin datos retorna Sin datos', async () => {
    const { result } = renderHook(() => useCrisisDashboardScreen());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    const data = result.current.formatTrendData();
    expect(data.labels).toEqual(['Sin datos']);
    expect(data.datasets).toEqual([{ data: [0] }]);
  });

  it('formatMonthlyData sin crisisByMonth retorna Sin datos', async () => {
    const { result } = renderHook(() => useCrisisDashboardScreen());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    const data = result.current.formatMonthlyData();
    expect(data.labels).toEqual(['Sin datos']);
    expect(data.datasets).toEqual([{ data: [0] }]);
  });

  it('formatEmotionDistribution sin distribution retorna array vacío', async () => {
    const { result } = renderHook(() => useCrisisDashboardScreen());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(result.current.formatEmotionDistribution()).toEqual([]);
  });

  it('en error de carga debe setear error y loading false', async () => {
    api.get.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useCrisisDashboardScreen());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Network error');
  });

  it('getTrendLabel/getTrendIcon/getTrendIconColor con trend improving', async () => {
    api.get.mockImplementation((path) => {
      if (path === '/api/crisis/trends') {
        return Promise.resolve({ success: true, data: { trend: 'improving', dataPoints: [] } });
      }
      const base = { success: true, data: null };
      if (path === '/api/crisis/summary') return Promise.resolve({ ...base, data: { totalCrises: 0, averageRiskLevel: 'LOW' } });
      if (path === '/api/crisis/by-month') return Promise.resolve({ ...base, data: [] });
      if (path === '/api/crisis/emotion-distribution') return Promise.resolve({ ...base, data: { distribution: {}, total: 0 } });
      if (path === '/api/crisis/history') return Promise.resolve({ ...base, data: { crises: [] } });
      return Promise.resolve(base);
    });
    const { result } = renderHook(() => useCrisisDashboardScreen());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });
    expect(result.current.getTrendLabel()).toMatch(/Tendencia:/);
    expect(result.current.getTrendLabel()).toMatch(/Mejorando/);
    expect(result.current.getTrendIcon()).toBe('trending-down');
    expect(result.current.getTrendIconColor()).toBe('#4ECDC4');
  });

  it('getTrendLabel/getTrendIcon/getTrendIconColor con trend declining', async () => {
    api.get.mockImplementation((path) => {
      if (path === '/api/crisis/trends') {
        return Promise.resolve({ success: true, data: { trend: 'declining', dataPoints: [] } });
      }
      const base = { success: true, data: null };
      if (path === '/api/crisis/summary') return Promise.resolve({ ...base, data: { totalCrises: 0, averageRiskLevel: 'LOW' } });
      if (path === '/api/crisis/by-month') return Promise.resolve({ ...base, data: [] });
      if (path === '/api/crisis/emotion-distribution') return Promise.resolve({ ...base, data: { distribution: {}, total: 0 } });
      if (path === '/api/crisis/history') return Promise.resolve({ ...base, data: { crises: [] } });
      return Promise.resolve(base);
    });
    const { result } = renderHook(() => useCrisisDashboardScreen());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });
    expect(result.current.getTrendLabel()).toMatch(/Deteriorando/);
    expect(result.current.getTrendIcon()).toBe('trending-up');
    expect(result.current.getTrendIconColor()).toBe('#FF6B6B');
  });

  it('getTrendLabel/getTrendIcon con trend stable', async () => {
    const { result } = renderHook(() => useCrisisDashboardScreen());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });
    expect(result.current.getTrendLabel()).toMatch(/Estable/);
    expect(result.current.getTrendIcon()).toBe('trending-neutral');
    expect(result.current.getTrendIconColor()).toBe(null);
  });
});
