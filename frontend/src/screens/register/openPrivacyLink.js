import { Alert, Linking } from 'react-native';
import { URLS } from './registerScreenConstants';

/**
 * Abre la política de privacidad en el navegador del sistema (evita envolver el enlace en un Touchable que capture el toque).
 */
export async function openRegisterPrivacyUrl() {
  const url = URLS.PRIVACY;
  try {
    await Linking.openURL(url);
  } catch (e) {
    console.warn('[Register] openPrivacyUrl', e);
    try {
      const can = await Linking.canOpenURL(url);
      if (can) await Linking.openURL(url);
      else Alert.alert('No disponible', 'No se pudo abrir el enlace en este dispositivo.');
    } catch (e2) {
      console.warn('[Register] openPrivacyUrl fallback', e2);
      Alert.alert('Error', 'No se pudo abrir el enlace. Puedes visitar antoapps.com desde el navegador.');
    }
  }
}
