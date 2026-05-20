/**
 * Apertura de política de privacidad en registro (Linking + fallback).
 */
import { Alert, Linking } from 'react-native';
import { openRegisterPrivacyUrl } from '../openPrivacyLink';

jest.mock('../../../config/api', () => ({
  getAppLanguage: jest.fn(() => Promise.resolve('es')),
}));

jest.spyOn(console, 'warn').mockImplementation(() => {});

describe('openRegisterPrivacyUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Linking.openURL.mockResolvedValue(undefined);
    Linking.canOpenURL.mockResolvedValue(true);
    Alert.alert.mockClear();
  });

  it('usa Linking.openURL con la URL de privacidad', async () => {
    await openRegisterPrivacyUrl();
    expect(Linking.openURL).toHaveBeenCalledWith('https://www.antoapps.com/privacidad');
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('si openURL falla, reintenta con canOpenURL', async () => {
    Linking.openURL.mockRejectedValueOnce(new Error('fail'));
    await openRegisterPrivacyUrl();
    expect(Linking.canOpenURL).toHaveBeenCalledWith('https://www.antoapps.com/privacidad');
    expect(Linking.openURL).toHaveBeenCalledTimes(2);
  });

  it('si no puede abrir, muestra alerta en español por defecto', async () => {
    Linking.openURL.mockRejectedValue(new Error('fail'));
    Linking.canOpenURL.mockResolvedValue(false);
    await openRegisterPrivacyUrl();
    expect(Alert.alert).toHaveBeenCalledWith('No disponible', expect.any(String));
  });

  it('si no puede abrir, muestra alerta en inglés cuando se pasa language', async () => {
    Linking.openURL.mockRejectedValue(new Error('fail'));
    Linking.canOpenURL.mockResolvedValue(false);
    await openRegisterPrivacyUrl(undefined, 'en');
    expect(Alert.alert).toHaveBeenCalledWith('Unavailable', expect.any(String));
  });

  it('si no puede abrir y hay showToast, usa toast en lugar de alerta', async () => {
    const showToast = jest.fn();
    Linking.openURL.mockRejectedValue(new Error('fail'));
    Linking.canOpenURL.mockResolvedValue(false);
    await openRegisterPrivacyUrl(showToast);
    expect(showToast).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String), type: 'default' })
    );
    expect(Alert.alert).not.toHaveBeenCalled();
  });
});
