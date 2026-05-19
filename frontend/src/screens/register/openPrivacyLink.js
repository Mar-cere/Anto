import { Alert, Linking } from 'react-native';
import { URLS } from './registerScreenConstants';

const DEFAULT_TEXTS = {
  UNAVAILABLE_TITLE: 'No disponible',
  OPEN_LINK_UNAVAILABLE: 'No se pudo abrir el enlace en este dispositivo.',
  ERROR_TITLE: 'Error',
  OPEN_LINK_FALLBACK:
    'No se pudo abrir el enlace. Puedes visitar antoapps.com desde el navegador.',
  OPEN_LINK_TOAST_FALLBACK:
    'No se pudo abrir el enlace. Visita antoapps.com desde el navegador.',
};

/**
 * Abre la política de privacidad en el navegador del sistema (evita envolver el enlace en un Touchable que capture el toque).
 * @param {(opts: { message: string; type?: string }) => void} [showToast] - Feedback no modal; si no hay, se usa Alert.
 * @param {object} [texts] - Textos opcionales para i18n.
 */
export async function openRegisterPrivacyUrl(showToast, texts = DEFAULT_TEXTS) {
  const url = URLS.PRIVACY;
  const t = { ...DEFAULT_TEXTS, ...(texts || {}) };
  try {
    await Linking.openURL(url);
  } catch (e) {
    console.warn('[Register] openPrivacyUrl', e);
    try {
      const can = await Linking.canOpenURL(url);
      if (can) await Linking.openURL(url);
      else if (typeof showToast === 'function') {
        showToast({ message: t.OPEN_LINK_UNAVAILABLE, type: 'default' });
      } else {
        Alert.alert(t.UNAVAILABLE_TITLE, t.OPEN_LINK_UNAVAILABLE);
      }
    } catch (e2) {
      console.warn('[Register] openPrivacyUrl fallback', e2);
      if (typeof showToast === 'function') {
        showToast({
          message: t.OPEN_LINK_TOAST_FALLBACK,
          type: 'error',
        });
      } else {
        Alert.alert(t.ERROR_TITLE, t.OPEN_LINK_FALLBACK);
      }
    }
  }
}
