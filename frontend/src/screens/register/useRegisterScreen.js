/**
 * Hook para RegisterScreen: estado del formulario, validación y registro.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Animated } from 'react-native';
import { api, ENDPOINTS, getAppLanguage } from '../../config/api';
import { ROUTES } from '../../constants/routes';
import {
  ANIMATION_DELAYS,
  ANIMATION_DURATIONS,
  ANIMATION_VALUES,
} from '../../constants/animations';
import { VALIDATION_LENGTHS, VALIDATION_REGEX } from '../../constants/validation';
import { checkServerStatus } from '../../utils/networkUtils';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { openRegisterPrivacyUrl } from './openPrivacyLink';
import chatService from '../../services/chatService';
import { STORAGE_KEYS, SERVER_CHECK_TIMEOUT } from './registerScreenConstants';
import {
  isRegisterDuplicateError,
  resolveRegisterErrorMessage,
} from './registerErrorUtils';
const { NAME_MIN, NAME_MAX, USERNAME_MIN, USERNAME_MAX, PASSWORD_MIN } = VALIDATION_LENGTHS;
const { EMAIL } = VALIDATION_REGEX;

const validateEmail = (email) => EMAIL.test(email);

const validateField = (field, value, formData = {}, errorMessages = {}) => {
  switch (field) {
    case 'name':
      if (value && value.trim()) {
        if (value.length < NAME_MIN) return errorMessages.NAME_MIN;
        if (value.length > NAME_MAX) return errorMessages.NAME_MAX;
      }
      return '';
    case 'username':
      if (!value.trim()) return errorMessages.USERNAME_REQUIRED;
      if (value.length < USERNAME_MIN) return errorMessages.USERNAME_MIN_SHORT;
      if (value.length > USERNAME_MAX) return errorMessages.USERNAME_MAX_SHORT;
      return '';
    case 'email':
      if (!value.trim()) return errorMessages.EMAIL_REQUIRED;
      if (!validateEmail(value)) return errorMessages.EMAIL_INVALID;
      return '';
    case 'password':
      if (!value) return errorMessages.PASSWORD_REQUIRED;
      if (value.length < PASSWORD_MIN) return errorMessages.PASSWORD_MIN;
      if (formData.confirmPassword && value !== formData.confirmPassword) return '';
      return '';
    case 'confirmPassword':
      if (!value) return errorMessages.CONFIRM_PASSWORD_REQUIRED;
      if (formData.password && value !== formData.password) return errorMessages.PASSWORDS_MISMATCH;
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
  try {
    await chatService.prepareGuestHandoffBeforeClear();
  } catch (_) {}
  try {
    await chatService.clearGuestChat();
  } catch (_) {}
};

export function useRegisterScreen(navigation) {
  const TEXTS = useSectionTranslations('REGISTER');
  const { language } = useLanguage();
  const ERROR_MESSAGES = useMemo(() => TEXTS.ERRORS || {}, [TEXTS.ERRORS]);
  const { refreshSession } = useAuth();
  const { showToast } = useToast();
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

    const error = validateField(field, value, updated, ERROR_MESSAGES);
    const nextErrors = { ...errors };
    if (error) nextErrors[field] = error;
    else delete nextErrors[field];
    if (field === 'password' && updated.confirmPassword) {
      const confirmErr = validateField('confirmPassword', updated.confirmPassword, updated, ERROR_MESSAGES);
      if (confirmErr) nextErrors.confirmPassword = confirmErr;
      else delete nextErrors.confirmPassword;
    }
    if (field === 'confirmPassword' && updated.password) {
      const pwdErr = validateField('password', updated.password, updated, ERROR_MESSAGES);
      if (pwdErr) nextErrors.password = pwdErr;
      else delete nextErrors.password;
    }
    setErrors(nextErrors);
  }, [formData, errors, ERROR_MESSAGES]);

  const validateForm = useCallback(() => {
    const newErrors = {
      name: validateField('name', formData.name, formData, ERROR_MESSAGES),
      username: validateField('username', formData.username, formData, ERROR_MESSAGES),
      email: validateField('email', formData.email, formData, ERROR_MESSAGES),
      password: validateField('password', formData.password, formData, ERROR_MESSAGES),
      confirmPassword: validateField('confirmPassword', formData.confirmPassword, formData, ERROR_MESSAGES),
    };
    Object.keys(newErrors).forEach((k) => { if (!newErrors[k]) delete newErrors[k]; });
    if (!isTermsAccepted) newErrors.terms = ERROR_MESSAGES.TERMS_REQUIRED;
    if (!isPrivacyAccepted) {
      newErrors.privacy =
        ERROR_MESSAGES.PRIVACY_REQUIRED ||
        ERROR_MESSAGES.TERMS_REQUIRED;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, isTermsAccepted, isPrivacyAccepted, ERROR_MESSAGES]);

  const handleRegister = useCallback(async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      if (isOffline) {
        showToast({
          message:
            ERROR_MESSAGES.NETWORK_ERROR ||
            ERROR_MESSAGES.CONNECTION_ERROR ||
            ERROR_MESSAGES.GENERIC_ERROR ||
            TEXTS.ERROR_TITLE,
          type: 'warning',
          duration: 4500,
        });
        return;
      }
      const isServerAvailable = await checkServerStatus(SERVER_CHECK_TIMEOUT);
      if (!isServerAvailable) {
        showToast({ message: ERROR_MESSAGES.SERVER_ERROR, type: 'error', duration: 5000 });
        return;
      }
      const appLanguage = await getAppLanguage();
      const userData = {
        email: formData.email.toLowerCase().trim(),
        username: formData.username.toLowerCase().trim(),
        password: formData.password,
        termsAccepted: isTermsAccepted,
        termsAcceptedAt: new Date().toISOString(),
        privacyAccepted: isPrivacyAccepted,
        privacyAcceptedAt: new Date().toISOString(),
        termsVersion: '1.0',
        language: appLanguage,
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
        navigation.reset({ index: 0, routes: [{ name: ROUTES.MAIN_TABS }] });
        return;
      }
      throw new Error(ERROR_MESSAGES.NO_TOKEN);
    } catch (error) {
      console.error('Error en registro:', error);
      const message = resolveRegisterErrorMessage({
        error,
        errorMessages: ERROR_MESSAGES,
        texts: TEXTS,
        isOffline,
      });
      if (isRegisterDuplicateError(error) && message) {
        setErrors((prev) => ({
          ...prev,
          email: message,
          username: message,
        }));
      }
      if (typeof message === 'string' && message.trim().length > 0) {
        showToast({
          message,
          type: 'error',
          duration: 5000,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isTermsAccepted, isPrivacyAccepted, isOffline, validateForm, navigation, refreshSession, showToast, ERROR_MESSAGES, TEXTS]);

  const openPrivacyUrl = useCallback(
    () => openRegisterPrivacyUrl(showToast, language),
    [showToast, language],
  );

  const acceptTermsAndClose = useCallback(() => {
    setHasViewedTerms(true);
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
    isPrivacyAccepted,
    setPrivacyAccepted,
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
    openPrivacyUrl,
  };
}
