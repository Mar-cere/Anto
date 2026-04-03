/**
 * Apertura de política de privacidad en registro (Linking + fallback).
 */
import { Alert, Linking } from 'react-native';
import { openRegisterPrivacyUrl } from '../openPrivacyLink';

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

  it('si no puede abrir, muestra alerta', async () => {
    Linking.openURL.mockRejectedValue(new Error('fail'));
    Linking.canOpenURL.mockResolvedValue(false);
    await openRegisterPrivacyUrl();
    expect(Alert.alert).toHaveBeenCalledWith('No disponible', expect.any(String));
  });
});
