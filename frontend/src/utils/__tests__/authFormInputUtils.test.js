import { Platform } from 'react-native';
import {
  createAuthTextChangeHandler,
  deriveRegisterInputErrors,
  extractWebTextInputValue,
  getAuthKeyboardScrollProps,
  getAuthPasswordAutoComplete,
  getAuthPasswordTextContentType,
  mergeWebPasswordFields,
  readWebTextInputRefValue,
  syncWebTextInputOnBlur,
  syncWebTextInputOnFocus,
  withWebAutofillInputStyle,
} from '../authFormInputUtils';

describe('authFormInputUtils', () => {
  it('expone props de teclado para pantallas de auth', () => {
    const props = getAuthKeyboardScrollProps();
    expect(props.keyboardShouldPersistTaps).toBe('handled');
    expect(props.enableOnAndroid).toBe(true);
  });

  it('asigna autocomplete según el tipo de contraseña', () => {
    expect(getAuthPasswordAutoComplete('register-password')).toBe('new-password');
    expect(getAuthPasswordAutoComplete('register-confirm-password')).toBe('off');
    expect(getAuthPasswordAutoComplete('current-password')).toBe('current-password');
  });

  it('asigna textContentType según el tipo de contraseña', () => {
    expect(getAuthPasswordTextContentType('register-password')).toBe('newPassword');
    expect(getAuthPasswordTextContentType('current-password')).toBe('password');
  });

  it('extrae valor web desde nativeEvent o target', () => {
    expect(extractWebTextInputValue({ nativeEvent: { text: 'abc' } })).toBe('abc');
    expect(extractWebTextInputValue({ target: { value: 'xyz' } })).toBe('xyz');
    expect(extractWebTextInputValue(null)).toBeNull();
  });

  it('sincroniza valor web en blur solo si cambió', () => {
    const originalOs = Platform.OS;
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    const onSync = jest.fn();
    syncWebTextInputOnBlur({ target: { value: 'secret' } }, '', onSync);
    expect(onSync).toHaveBeenCalledWith('secret');
    onSync.mockClear();
    syncWebTextInputOnBlur({ target: { value: 'secret' } }, 'secret', onSync);
    expect(onSync).not.toHaveBeenCalled();
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOs });
  });

  it('sincroniza valor web al enfocar', () => {
    const originalOs = Platform.OS;
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    const onSync = jest.fn();
    syncWebTextInputOnFocus({ target: { value: 'autofill' } }, '', onSync);
    expect(onSync).toHaveBeenCalledWith('autofill');
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOs });
  });

  it('lee valor desde ref de input web', () => {
    const originalOs = Platform.OS;
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    expect(readWebTextInputRefValue({ current: { value: 'abc' } })).toBe('abc');
    expect(readWebTextInputRefValue({
      current: { getNativeRef: () => ({ value: 'native' }) },
    })).toBe('native');
    expect(readWebTextInputRefValue({ current: null })).toBeUndefined();
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOs });
  });

  it('fusiona contraseñas del DOM antes de enviar en web', () => {
    const originalOs = Platform.OS;
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    const formData = { password: '', confirmPassword: '' };
    const merged = mergeWebPasswordFields(
      formData,
      { current: { value: 'secret123' } },
      { current: { value: 'secret123' } },
    );
    expect(merged).toEqual({ password: 'secret123', confirmPassword: 'secret123' });
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOs });
  });

  it('unifica onChangeText y onChange web', () => {
    const onValueChange = jest.fn();
    const handler = createAuthTextChangeHandler(onValueChange);
    handler('typed');
    handler({ target: { value: 'dom' } });
    expect(onValueChange).toHaveBeenNthCalledWith(1, 'typed');
    expect(onValueChange).toHaveBeenNthCalledWith(2, 'dom');
  });

  it('deriva errores cruzados entre contraseña y confirmación', () => {
    const validateField = (field, value, data) => {
      if (field === 'password' && !value) return 'required';
      if (field === 'confirmPassword' && value !== data.password) return 'mismatch';
      return '';
    };
    const next = deriveRegisterInputErrors(
      {},
      'password',
      'abc',
      { password: 'abc', confirmPassword: 'xyz' },
      {},
      validateField,
    );
    expect(next.confirmPassword).toBe('mismatch');
  });

  it('añade estilos de autofill en web', () => {
    const originalOs = Platform.OS;
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    const styled = withWebAutofillInputStyle({ flex: 1 }, { chromeInput: '#F3F5FB', text: '#24234F' });
    expect(styled.WebkitBoxShadow).toContain('#F3F5FB');
    expect(styled.WebkitTextFillColor).toBe('#24234F');
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOs });
  });

  it('no modifica estilos fuera de web', () => {
    const originalOs = Platform.OS;
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
    const base = { flex: 1 };
    expect(withWebAutofillInputStyle(base, { chromeInput: '#F3F5FB' })).toBe(base);
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOs });
  });
});
