/**
 * Tests para crisisDashboardNavigate
 */
import { crisisSafeNavigate, crisisSafeGoBack } from '../crisisDashboardNavigate';

describe('crisisDashboardNavigate', () => {
  it('crisisSafeNavigate no lanza si navigation es null', () => {
    expect(crisisSafeNavigate(null, 'MainTabs')).toBe(false);
    expect(crisisSafeNavigate(undefined, 'MainTabs')).toBe(false);
  });

  it('crisisSafeNavigate llama navigate con params', () => {
    const navigate = jest.fn();
    expect(crisisSafeNavigate({ navigate }, 'MainTabs', { screen: 'Perfil' })).toBe(true);
    expect(navigate).toHaveBeenCalledWith('MainTabs', { screen: 'Perfil' });
  });

  it('crisisSafeNavigate captura errores de navigate', () => {
    const navigate = jest.fn(() => {
      throw new Error('nav boom');
    });
    expect(crisisSafeNavigate({ navigate }, 'X')).toBe(false);
  });

  it('crisisSafeGoBack llama goBack si canGoBack es true', () => {
    const goBack = jest.fn();
    expect(crisisSafeGoBack({ canGoBack: () => true, goBack })).toBe(true);
    expect(goBack).toHaveBeenCalled();
  });

  it('crisisSafeGoBack no llama goBack si canGoBack es false', () => {
    const goBack = jest.fn();
    expect(crisisSafeGoBack({ canGoBack: () => false, goBack })).toBe(false);
    expect(goBack).not.toHaveBeenCalled();
  });
});
