/**
 * Precarga config pública del servidor (p. ej. trialDays) al iniciar la app.
 */
import { useEffect } from 'react';
import { fetchAppTrialDays } from '../services/appConfigService';

export default function AppConfigPreload() {
  useEffect(() => {
    fetchAppTrialDays().catch(() => {});
  }, []);
  return null;
}
