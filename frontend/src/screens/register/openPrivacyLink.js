import { Alert, Linking } from 'react-native';
import { URLS } from './registerScreenConstants';

/**
 * Abre la política de privacidad en el navegador del sistema (evita envolver el enlace en un Touchable que capture el toque).
 * @param {(opts: { message: string; type?: string }) => void} [showToast] - Feedback no modal; si no hay, se usa Alert.
 */
export async function openRegisterPrivacyUrl(showToast) {
  const url = URLS.PRIVACY;
  try {
    await Linking.openURL(url);
  } catch (e) {
    console.warn('[Register] openPrivacyUrl', e);
    try {
      const can = await Linking.canOpenURL(url);
      if (can) await Linking.openURL(url);
      else if (typeof showToast === 'function') {
        showToast({ message: 'No se pudo abrir el enlace en este dispositivo.', type: 'default' });
      } else {
        Alert.alert('No disponible', 'No se pudo abrir el enlace en este dispositivo.');
      }
    } catch (e2) {
      console.warn('[Register] openPrivacyUrl fallback', e2);
      if (typeof showToast === 'function') {
        showToast({
          message: 'No se pudo abrir el enlace. Visita antoapps.com desde el navegador.',
          type: 'error',
        });
      } else {
        Alert.alert('Error', 'No se pudo abrir el enlace. Puedes visitar antoapps.com desde el navegador.');
      }
    }
  }
}
