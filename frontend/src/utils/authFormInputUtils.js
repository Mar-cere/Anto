import { Platform } from 'react-native';

/**
 * Props de scroll para pantallas de auth con formulario largo.
 */
export function getAuthKeyboardScrollProps(overrides = {}) {
  return {
    enableOnAndroid: true,
    enableAutomaticScroll: true,
    enableResetScrollToCoords: false,
    keyboardShouldPersistTaps: 'handled',
    showsVerticalScrollIndicator: false,
    extraScrollHeight: Platform.OS === 'ios' ? 24 : 40,
    keyboardOpeningTime: Platform.OS === 'ios' ? 0 : 250,
    ...overrides,
  };
}

/**
 * @param {'register-password' | 'register-confirm-password' | 'current-password'} kind
 */
export function getAuthPasswordAutoComplete(kind) {
  switch (kind) {
    case 'register-password':
      return 'new-password';
    case 'register-confirm-password':
      return 'off';
    case 'current-password':
      return 'current-password';
    default:
      return 'off';
  }
}

/**
 * @param {'register-password' | 'register-confirm-password' | 'current-password'} kind
 */
export function getAuthPasswordTextContentType(kind) {
  switch (kind) {
    case 'register-password':
    case 'register-confirm-password':
      return 'newPassword';
    case 'current-password':
      return 'password';
    default:
      return 'none';
  }
}

/**
 * Extrae el valor del input en web (incluye autocompletado del navegador).
 * @param {import('react-native').NativeSyntheticEvent<import('react-native').TextInputChangeEventData> | { target?: { value?: string } }} event
 */
export function extractWebTextInputValue(event) {
  if (!event) return null;
  const nativeText = event.nativeEvent?.text;
  if (typeof nativeText === 'string') return nativeText;
  const targetValue = event.target?.value;
  if (typeof targetValue === 'string') return targetValue;
  return null;
}

/**
 * Sincroniza el valor del DOM en web cuando el autocompletado no dispara onChangeText.
 * @param {import('react-native').NativeSyntheticEvent<import('react-native').TextInputFocusEventData> | { target?: { value?: string } }} event
 * @param {string} currentValue
 * @param {(value: string) => void} onSync
 */
export function syncWebTextInputOnBlur(event, currentValue, onSync) {
  if (Platform.OS !== 'web') return;
  const domValue = extractWebTextInputValue(event);
  if (domValue == null) return;
  if (domValue !== currentValue) onSync(domValue);
}

/**
 * Igual que blur: algunos navegadores aplican autofill al enfocar.
 */
export function syncWebTextInputOnFocus(event, currentValue, onSync) {
  syncWebTextInputOnBlur(event, currentValue, onSync);
}

/**
 * Lee el valor actual del input nativo en web desde un ref de TextInput.
 * @param {{ current?: { value?: string, getNativeRef?: () => { value?: string } } }} ref
 */
export function readWebTextInputRefValue(ref) {
  if (Platform.OS !== 'web' || !ref?.current) return undefined;
  const current = ref.current;
  if (typeof current.value === 'string') return current.value;
  const native = typeof current.getNativeRef === 'function' ? current.getNativeRef() : null;
  if (native && typeof native.value === 'string') return native.value;
  return undefined;
}

/**
 * Fusiona contraseñas del DOM en web antes de validar o enviar el formulario.
 * @param {{ password?: string, confirmPassword?: string }} formData
 * @param {{ current?: unknown }} passwordRef
 * @param {{ current?: unknown }} confirmPasswordRef
 */
export function mergeWebPasswordFields(formData, passwordRef, confirmPasswordRef) {
  if (Platform.OS !== 'web') return formData;
  const next = { ...formData };
  const password = readWebTextInputRefValue(passwordRef);
  const confirmPassword = readWebTextInputRefValue(confirmPasswordRef);
  if (typeof password === 'string' && password !== formData.password) {
    next.password = password;
  }
  if (typeof confirmPassword === 'string' && confirmPassword !== formData.confirmPassword) {
    next.confirmPassword = confirmPassword;
  }
  return next;
}

/**
 * Handler unificado para onChangeText (móvil) y onChange (web/autofill).
 * @param {(value: string) => void} onValueChange
 */
export function createAuthTextChangeHandler(onValueChange) {
  return (eventOrValue) => {
    const value = typeof eventOrValue === 'string'
      ? eventOrValue
      : extractWebTextInputValue(eventOrValue);
    if (value != null) onValueChange(value);
  };
}

/**
 * Deriva errores de campo tras un cambio en el formulario de registro.
 * @param {Record<string, string>} prevErrors
 * @param {string} field
 * @param {string} value
 * @param {{ name?: string, username?: string, email?: string, password?: string, confirmPassword?: string }} updated
 * @param {Record<string, string>} errorMessages
 * @param {(field: string, value: string, formData: object, errorMessages: object) => string} validateField
 */
export function deriveRegisterInputErrors(
  prevErrors,
  field,
  value,
  updated,
  errorMessages,
  validateField,
) {
  const nextErrors = { ...prevErrors };
  const error = validateField(field, value, updated, errorMessages);
  if (error) nextErrors[field] = error;
  else delete nextErrors[field];
  if (field === 'password' && updated.confirmPassword) {
    const confirmErr = validateField('confirmPassword', updated.confirmPassword, updated, errorMessages);
    if (confirmErr) nextErrors.confirmPassword = confirmErr;
    else delete nextErrors.confirmPassword;
  }
  if (field === 'confirmPassword' && updated.password) {
    const pwdErr = validateField('password', updated.password, updated, errorMessages);
    if (pwdErr) nextErrors.password = pwdErr;
    else delete nextErrors.password;
  }
  return nextErrors;
}

/**
 * Estilos para que el texto autocompletado sea visible en web.
 * @param {object} baseStyle
 * @param {{ chromeInput?: string, text?: string }} colors
 */
export function withWebAutofillInputStyle(baseStyle, colors) {
  if (Platform.OS !== 'web') return baseStyle;
  const fill = colors.chromeInput || '#F3F5FB';
  const text = colors.text || '#24234F';
  return {
    ...baseStyle,
    WebkitBoxShadow: `0 0 0px 1000px ${fill} inset`,
    WebkitTextFillColor: text,
  };
}
