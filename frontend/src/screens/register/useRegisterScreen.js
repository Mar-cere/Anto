/**
 * Hook para RegisterScreen: estado del formulario, validación y registro.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Animated } from 'react-native';
import { api, ENDPOINTS } from '../../config/api';
import { ROUTES } from '../../constants/routes';
import { REGISTER as TEXTS } from '../../constants/translations';
import {
  ANIMATION_DELAYS,
  ANIMATION_DURATIONS,
  ANIMATION_SCALES,
  ANIMATION_VALUES,
} from '../../constants/animations';
import { VALIDATION_LENGTHS, VALIDATION_REGEX } from '../../constants/validation';
import { checkServerStatus } from '../../utils/networkUtils';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { getApiErrorMessage } from '../../utils/apiErrorHandler';
import { useAuth } from '../../context/AuthContext';
import { STORAGE_KEYS, SERVER_CHECK_TIMEOUT } from './registerScreenConstants';

const ERROR_MESSAGES = TEXTS.ERRORS;
const { NAME_MIN, NAME_MAX, USERNAME_MIN, USERNAME_MAX, PASSWORD_MIN } = VALIDATION_LENGTHS;
const { EMAIL, USERNAME } = VALIDATION_REGEX;

const validateEmail = (email) => EMAIL.test(email);

const validateField = (field, value, formData = {}) => {
  switch (field) {
    case 'name':
      if (value && value.trim()) {
        if (value.length < NAME_MIN) return ERROR_MESSAGES.NAME_MIN;
        if (value.length > NAME_MAX) return ERROR_MESSAGES.NAME_MAX;
      }
      return '';
    case 'username':
      if (!value.trim()) return ERROR_MESSAGES.USERNAME_REQUIRED;
      if (value.length < USERNAME_MIN) return ERROR_MESSAGES.USERNAME_MIN_SHORT;
      if (value.length > USERNAME_MAX) return ERROR_MESSAGES.USERNAME_MAX_SHORT;
      return '';
    case 'email':
      if (!value.trim()) return ERROR_MESSAGES.EMAIL_REQUIRED;
      if (!validateEmail(value)) return ERROR_MESSAGES.EMAIL_INVALID;
      return '';
    case 'password':
      if (!value) return ERROR_MESSAGES.PASSWORD_REQUIRED;
      if (value.length < PASSWORD_MIN) return ERROR_MESSAGES.PASSWORD_MIN;
      if (formData.confirmPassword && value !== formData.confirmPassword) return '';
      return '';
    case 'confirmPassword':
      if (!value) return ERROR_MESSAGES.CONFIRM_PASSWORD_REQUIRED;
      if (formData.password && value !== formData.password) return ERROR_MESSAGES.PASSWORDS_MISMATCH;
      return '';
    default:
      return '';
  }
};

const saveAuthData = async (tokens, user, email) => {
  const items = [
    [STORAGE_KEYS.USER_TOKEN, tokens.accessToken || tokens.token],
    [STORAGE_KEYS.USER_DATA, JSON.stringify(user)],
    [STORAGE_KEYS.SAVED_EMAIL, email],
  ];
  if (tokens.refreshToken) items.push([STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken]);
  await Promise.all(items.map(([k, v]) => AsyncStorage.setItem(k, v)));
};

export function useRegisterScreen(navigation) {
  const { refreshSession } = useAuth();
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const isOffline = !isConnected || isInternetReachable === false;

  const fadeAnim = useRef(new Animated.Value(ANIMATION_VALUES.INITIAL_OPACITY)).current;
  const translateYAnim = useRef(new Animated.Value(ANIMATION_VALUES.INITIAL_TRANSLATE_Y)).current;

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [isTermsAccepted, setTermsAccepted] = useState(false);
  const [isPrivacyAccepted, setPrivacyAccepted] = useState(false);
  const [hasViewedTerms, setHasViewedTerms] = useState(false);
  const [isNameInfoModalVisible, setNameInfoModalVisible] = useState(false);
  const [isTermsModalVisible, setTermsModalVisible] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setIsLoading(false);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: ANIMATION_VALUES.FINAL_OPACITY,
          duration: ANIMATION_DURATIONS.SLOW,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: ANIMATION_VALUES.FINAL_TRANSLATE_Y,
          duration: ANIMATION_DURATIONS.SLOW,
          useNativeDriver: true,
        }),
      ]).start();
    }, ANIMATION_DELAYS.LONG);
    return () => clearTimeout(t);
  }, [fadeAnim, translateYAnim]);

  const handleInputChange = useCallback((field, value) => {
    if (field === 'email') value = value.toLowerCase().trim();
    if (field === 'username') value = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    const updated = { ...formData, [field]: value };
    setFormData(updated);

    const error = validateField(field, value, updated);
    const nextErrors = { ...errors };
    if (error) nextErrors[field] = error;
    else delete nextErrors[field];
    if (field === 'password' && updated.confirmPassword) {
      const confirmErr = validateField('confirmPassword', updated.confirmPassword, updated);
      if (confirmErr) nextErrors.confirmPassword = confirmErr;
      else delete nextErrors.confirmPassword;
    }
    if (field === 'confirmPassword' && updated.password) {
      const pwdErr = validateField('password', updated.password, updated);
      if (pwdErr) nextErrors.password = pwdErr;
      else delete nextErrors.password;
    }
    setErrors(nextErrors);
  }, [formData, errors]);

  const validateForm = useCallback(() => {
    const newErrors = {
      name: validateField('name', formData.name, formData),
      username: validateField('username', formData.username, formData),
      email: validateField('email', formData.email, formData),
      password: validateField('password', formData.password, formData),
      confirmPassword: validateField('confirmPassword', formData.confirmPassword, formData),
    };
    Object.keys(newErrors).forEach((k) => { if (!newErrors[k]) delete newErrors[k]; });
    if (!isTermsAccepted) newErrors.terms = ERROR_MESSAGES.TERMS_REQUIRED;
    if (!isPrivacyAccepted) newErrors.privacy = 'Debes aceptar la política de privacidad';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, isTermsAccepted, isPrivacyAccepted]);

  const handleRegister = useCallback(async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    setIsLoading(true);
    try {
      if (isOffline) {
        Alert.alert('Sin conexión', 'No hay conexión a internet. Por favor, verifica tu conexión e intenta nuevamente.', [{ text: 'Entendido' }]);
        return;
      }
      const isServerAvailable = await checkServerStatus(SERVER_CHECK_TIMEOUT);
      if (!isServerAvailable) {
        Alert.alert('Error de conexión', ERROR_MESSAGES.SERVER_ERROR, [{ text: 'Entendido' }]);
        return;
      }
      const userData = {
        email: formData.email.toLowerCase().trim(),
        username: formData.username.toLowerCase().trim(),
        password: formData.password,
        termsAccepted: isTermsAccepted,
        termsAcceptedAt: new Date().toISOString(),
        privacyAccepted: isPrivacyAccepted,
        privacyAcceptedAt: new Date().toISOString(),
        termsVersion: '1.0',
        ...(formData.name?.trim() ? { name: formData.name.trim() } : {}),
      };
      const response = await api.post(ENDPOINTS.REGISTER, userData);
      if (response.requiresVerification) {
        navigation.navigate(ROUTES.VERIFY_EMAIL, { email: response.email || formData.email });
        return;
      }
      if ((response.accessToken || response.token) && response.user) {
        await saveAuthData(
          { accessToken: response.accessToken, token: response.token, refreshToken: response.refreshToken },
          response.user,
          formData.email
        );
        await refreshSession();
        navigation.reset({ index: 0, routes: [{ name: ROUTES.DASHBOARD }] });
        return;
      }
      throw new Error(ERROR_MESSAGES.NO_TOKEN);
    } catch (error) {
      console.error('Error en registro:', error);
      Alert.alert(TEXTS.ERROR_TITLE, getApiErrorMessage(error, { isOffline }), [{ text: 'Entendido' }]);
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  }, [formData, isTermsAccepted, isPrivacyAccepted, isOffline, validateForm, navigation, refreshSession]);

  const acceptTermsAndClose = useCallback(() => {
    setTermsAccepted(true);
    setTermsModalVisible(false);
  }, []);

  return {
    formData,
    errors,
    isLoading,
    isSubmitting,
    isOffline,
    isPasswordVisible,
    setPasswordVisible,
    isConfirmPasswordVisible,
    setConfirmPasswordVisible,
    isTermsAccepted,
    setTermsAccepted,
    hasViewedTerms,
    setHasViewedTerms,
    isNameInfoModalVisible,
    setNameInfoModalVisible,
    isTermsModalVisible,
    setTermsModalVisible,
    handleInputChange,
    handleRegister,
    acceptTermsAndClose,
    fadeAnim,
    translateYAnim,
  };
}
