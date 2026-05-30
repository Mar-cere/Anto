import { API_URL, ENDPOINTS } from '../../config/api';
import { DEFAULT_APP_TRIAL_DAYS } from '../../constants/subscription';
import {
  clearAppConfigCache,
  fetchAppTrialDays,
} from '../appConfigService';

describe('appConfigService', () => {
  beforeEach(() => {
    clearAppConfigCache();
    global.fetch = jest.fn();
  });

  it('usa caché en memoria tras la primera petición exitosa', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, trialDays: 1 }),
    });

    const first = await fetchAppTrialDays();
    const second = await fetchAppTrialDays();

    expect(first).toBe(1);
    expect(second).toBe(1);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      `${API_URL}${ENDPOINTS.HEALTH_APP_CONFIG}`
    );
  });

  it('devuelve DEFAULT_APP_TRIAL_DAYS si el servidor no responde', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false });

    const days = await fetchAppTrialDays();
    expect(days).toBe(DEFAULT_APP_TRIAL_DAYS);
  });

  it('devuelve DEFAULT_APP_TRIAL_DAYS si fetch lanza error', async () => {
    global.fetch.mockRejectedValueOnce(new Error('offline'));

    const days = await fetchAppTrialDays();
    expect(days).toBe(DEFAULT_APP_TRIAL_DAYS);
  });
});
