/**
 * Hook para EditProfileScreen: sesión, carga de usuario, validación, guardado y cambios sin guardar.
 */
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Alert, Animated } from 'react-native';
import { api, ENDPOINTS } from '../../config/api';
import { ROUTES } from '../../constants/routes';
import {
  TEXTS,
  MIN_NAME_LENGTH,
  EMAIL_REGEX,
  DEFAULT_FORM_DATA,
  STORAGE_KEYS,
  FADE_ANIMATION_DURATION,
  FADE_ANIMATION_TO_VALUE,
  SAVE_SUCCESS_DELAY,
} from './editProfileScreenConstants';

export function useEditProfileScreen(navigation) {
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [errors, setErrors] = useState({});
  const [fadeAnim] = useState(new Animated.Value(0));

  const checkSession = useCallback(async () => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.USER_TOKEN);
    if (!token) {
      Alert.alert(TEXTS.SESSION_EXPIRED, TEXTS.SESSION_EXPIRED_MESSAGE);
      navigation.replace(ROUTES.SIGN_IN);
      return null;
    }
    return token;
  }, [navigation]);

  const handleError = useCallback((error, onRetry) => {
    console.error('Error:', error);
    let errorMessage = TEXTS.ERROR_DEFAULT;
    if (error.message?.includes('network')) {
      errorMessage = TEXTS.ERROR_NETWORK;
    } else if (error.message?.includes('timeout')) {
      errorMessage = TEXTS.ERROR_TIMEOUT;
    } else if (error.message) {
      errorMessage = error.message;
    }
    Alert.alert(TEXTS.ERROR, errorMessage, [
      ...(typeof onRetry === 'function' ? [{ text: TEXTS.RETRY, onPress: onRetry }] : []),
      { text: TEXTS.OK, style: 'cancel' },
    ]);
  }, []);

  const loadUserData = useCallback(async () => {
    try {
      const token = await checkSession();
      if (!token) return;
      const response = await api.get(ENDPOINTS.ME);
      const userData = response.data || response;
      setFormData({
        name: userData.name || '',
        username: userData.username || '',
        email: userData.email || '',
      });
    } catch (error) {
      console.error('Error al cargar datos:', error);
      handleError(error, loadUserData);
    } finally {
      setLoading(false);
    }
  }, [checkSession, handleError]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: FADE_ANIMATION_TO_VALUE,
      duration: FADE_ANIMATION_DURATION,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    if (formData.name && formData.name.length < MIN_NAME_LENGTH) {
      newErrors.name = TEXTS.NAME_MIN_LENGTH;
    }
    if (!formData.email) {
      newErrors.email = TEXTS.EMAIL_REQUIRED;
    } else if (!EMAIL_REGEX.test(formData.email)) {
      newErrors.email = TEXTS.EMAIL_INVALID;
    }
    if (Object.keys(newErrors).length > 0) {
      Alert.alert(
        TEXTS.VALIDATION_ERRORS,
        Object.values(newErrors).join('\n'),
        [{ text: TEXTS.OK }]
      );
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.name, formData.email]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const requestData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
      };
      const response = await api.put(ENDPOINTS.UPDATE_PROFILE, requestData);
      const updatedUser = response.data || response;
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
      Alert.alert(TEXTS.SUCCESS, TEXTS.PROFILE_UPDATED, [
        { text: TEXTS.OK, onPress: () => setEditing(false) },
      ]);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), SAVE_SUCCESS_DELAY);
      setHasChanges(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error al guardar:', error);
      handleError(error, handleSave);
    } finally {
      setSaving(false);
    }
  }, [validateForm, formData.name, formData.email, handleError]);

  const handleFormChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!hasChanges) return;
      e.preventDefault();
      Alert.alert(TEXTS.UNSAVED_CHANGES, TEXTS.UNSAVED_CHANGES_MESSAGE, [
        { text: TEXTS.CANCEL, style: 'cancel', onPress: () => {} },
        {
          text: TEXTS.DISCARD,
          style: 'destructive',
          onPress: () => navigation.dispatch(e.data.action),
        },
      ]);
    });
    return unsubscribe;
  }, [hasChanges, navigation]);

  return {
    loading,
    editing,
    setEditing,
    saving,
    saveSuccess,
    hasChanges,
    formData,
    errors,
    fadeAnim,
    navigation,
    handleSave,
    handleFormChange,
  };
}
