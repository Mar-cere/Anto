import { Alert, Linking } from 'react-native';
import { getAppLanguage } from '../../config/api';
import { getSectionCopy } from '../../utils/serviceCopy';
import { URLS } from './registerScreenConstants';

/**
 * Abre la política de privacidad en el navegador del sistema.
 * @param {(opts: { message: string; type?: string }) => void} [showToast]
 * @param {string} [language] - Código de idioma ('es' | 'en'); si no se pasa, se resuelve del dispositivo.
 */
export async function openRegisterPrivacyUrl(showToast, language) {
  const lang = language || (await getAppLanguage());
  const url = URLS.PRIVACY;
  const texts = {
    UNAVAILABLE_TITLE: getSectionCopy('REGISTER', 'LINK_UNAVAILABLE_TITLE', lang),
    OPEN_LINK_UNAVAILABLE: getSectionCopy('REGISTER', 'PRIVACY_OPEN_UNAVAILABLE', lang),
    ERROR_TITLE: getSectionCopy('REGISTER', 'ERROR_TITLE', lang),
    OPEN_LINK_FALLBACK: getSectionCopy('REGISTER', 'PRIVACY_OPEN_FALLBACK_ALERT', lang),
    OPEN_LINK_TOAST_FALLBACK: getSectionCopy('REGISTER', 'PRIVACY_OPEN_FALLBACK_TOAST', lang),
  };
  try {
    await Linking.openURL(url);
  } catch (e) {
    console.warn('[Register] openPrivacyUrl', e);
    try {
      const can = await Linking.canOpenURL(url);
      if (can) await Linking.openURL(url);
      else if (typeof showToast === 'function') {
        showToast({ message: texts.OPEN_LINK_UNAVAILABLE, type: 'default' });
      } else {
        Alert.alert(texts.UNAVAILABLE_TITLE, texts.OPEN_LINK_UNAVAILABLE);
      }
    } catch (e2) {
      console.warn('[Register] openPrivacyUrl fallback', e2);
      if (typeof showToast === 'function') {
        showToast({
          message: texts.OPEN_LINK_TOAST_FALLBACK,
          type: 'error',
        });
      } else {
        Alert.alert(texts.ERROR_TITLE, texts.OPEN_LINK_FALLBACK);
      }
    }
  }
}
