/**
 * Pantalla de Cambio de Contraseña (usuario autenticado).
 * Solicita contraseña actual + nueva contraseña con confirmación.
 * @author AntoApp Team
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useSectionTranslations } from '../hooks/useTranslations';
import { api, ENDPOINTS } from '../config/api';

const MIN_PASSWORD_LENGTH = 6;

const DEFAULT_TEXTS = {
  TITLE: 'Cambiar contraseña',
  SUBTITLE: 'Ingresa la contraseña actual y la nueva contraseña.',
  CURRENT_PASSWORD: 'Contraseña actual',
  NEW_PASSWORD: 'Nueva contraseña',
  CONFIRM_PASSWORD: 'Confirmar nueva contraseña',
  BUTTON_SAVE: 'Guardar cambios',
  SUCCESS_TITLE: 'Contraseña actualizada',
  SUCCESS_MESSAGE: 'La contraseña se actualizó correctamente.',
  ERROR_TITLE: 'No se pudo cambiar la contraseña',
  ERROR_CURRENT_REQUIRED: 'Ingresa la contraseña actual',
  ERROR_NEW_REQUIRED: 'Ingresa la nueva contraseña',
  ERROR_NEW_MIN: 'La nueva contraseña debe tener al menos 6 caracteres',
  ERROR_CONFIRM_REQUIRED: 'Confirma la nueva contraseña',
  ERROR_MISMATCH: 'Las contraseñas no coinciden',
  ERROR_WRONG_CURRENT: 'La contraseña actual es incorrecta',
  ERROR_SAME_AS_CURRENT: 'La nueva contraseña debe ser diferente a la actual',
  ERROR_NETWORK: 'Sin conexión. Verifica tu conexión e inténtalo de nuevo.',
  ERROR_GENERIC: 'Ocurrió un error. Inténtalo más tarde.',
  BACK: 'Volver',
};

export default function ChangePasswordScreen({ navigation }) {
  const AUTH = useSectionTranslations('SETTINGS');
  const TEXTS = useMemo(
    () => ({ ...DEFAULT_TEXTS, ...(AUTH?.CHANGE_PASSWORD_SCREEN || {}) }),
    [AUTH],
  );
  const { colors } = useTheme();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const buttonScale = useRef(new Animated.Value(1)).current;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: { flex: 1, backgroundColor: colors.background },
        scroll: { flexGrow: 1 },
        container: { flex: 1, padding: 24 },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 28,
          gap: 12,
        },
        backBtn: {
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: colors.glassFill ?? colors.accentLineSoft,
          alignItems: 'center',
          justifyContent: 'center',
        },
        titleWrap: { flex: 1 },
        title: {
          fontSize: 22,
          fontWeight: '700',
          color: colors.text,
          letterSpacing: -0.3,
        },
        subtitle: {
          marginTop: 4,
          fontSize: 13,
          color: colors.textSecondary,
          lineHeight: 18,
        },
        fieldGroup: { marginBottom: 18 },
        label: {
          fontSize: 13,
          fontWeight: '600',
          color: colors.textSecondary,
          marginBottom: 6,
        },
        inputRow: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.chromeInput ?? colors.surface,
          borderRadius: 12,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          paddingHorizontal: 14,
        },
        inputRowError: { borderColor: colors.error },
        input: {
          flex: 1,
          fontSize: 16,
          color: colors.text,
          paddingVertical: 14,
        },
        eyeBtn: { padding: 8 },
        errorText: {
          color: colors.error,
          fontSize: 12,
          marginTop: 4,
          marginLeft: 4,
        },
        button: {
          marginTop: 12,
          backgroundColor: colors.primary,
          borderRadius: 14,
          paddingVertical: 16,
          alignItems: 'center',
        },
        buttonDisabled: { opacity: 0.55 },
        buttonText: {
          color: colors.textOnPrimary ?? '#fff',
          fontSize: 16,
          fontWeight: '700',
        },
        successCard: {
          marginTop: 40,
          alignItems: 'center',
          padding: 24,
          borderRadius: 16,
          backgroundColor: colors.accentLineSoft,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.accentLine,
        },
        successTitle: {
          marginTop: 16,
          fontSize: 18,
          fontWeight: '700',
          color: colors.text,
          textAlign: 'center',
        },
        successMessage: {
          marginTop: 8,
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 20,
        },
        successButton: {
          marginTop: 24,
          backgroundColor: colors.primary,
          borderRadius: 14,
          paddingVertical: 14,
          paddingHorizontal: 32,
        },
        successButtonText: {
          color: colors.textOnPrimary ?? '#fff',
          fontSize: 15,
          fontWeight: '600',
        },
      }),
    [colors],
  );

  const validate = useCallback(() => {
    const e = {};
    if (!currentPassword.trim()) e.current = TEXTS.ERROR_CURRENT_REQUIRED;
    if (!newPassword) e.new = TEXTS.ERROR_NEW_REQUIRED;
    else if (newPassword.length < MIN_PASSWORD_LENGTH) e.new = TEXTS.ERROR_NEW_MIN;
    else if (newPassword === currentPassword) e.new = TEXTS.ERROR_SAME_AS_CURRENT;
    if (!confirmPassword) e.confirm = TEXTS.ERROR_CONFIRM_REQUIRED;
    else if (confirmPassword !== newPassword) e.confirm = TEXTS.ERROR_MISMATCH;
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [currentPassword, newPassword, confirmPassword, TEXTS]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await api.put(ENDPOINTS.CHANGE_PASSWORD, {
        currentPassword: currentPassword.trim(),
        newPassword,
      });
      setSuccess(true);
    } catch (err) {
      const errorCode = String(err?.response?.data?.errorCode || '').toUpperCase();
      const status = err?.response?.status;

      let msg = TEXTS.ERROR_GENERIC;
      if (errorCode === 'WRONG_CURRENT_PASSWORD' || status === 401) {
        msg = TEXTS.ERROR_WRONG_CURRENT;
      } else if (errorCode === 'PASSWORD_SAME_AS_CURRENT') {
        msg = TEXTS.ERROR_SAME_AS_CURRENT;
      } else if (!err?.response || errorCode === 'NETWORK_ERROR') {
        msg = TEXTS.ERROR_NETWORK;
      }
      Alert.alert(TEXTS.ERROR_TITLE, msg);
    } finally {
      setSubmitting(false);
    }
  }, [validate, currentPassword, newPassword, TEXTS]);

  const handlePressIn = () => {
    Animated.spring(buttonScale, { toValue: 0.96, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start();
  };

  if (success) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.container}>
          <View style={styles.successCard}>
            <Ionicons name="checkmark-circle" size={56} color={colors.primary} />
            <Text style={styles.successTitle}>{TEXTS.SUCCESS_TITLE}</Text>
            <Text style={styles.successMessage}>{TEXTS.SUCCESS_MESSAGE}</Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.successButtonText}>{TEXTS.BACK}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              accessibilityLabel={TEXTS.BACK}
            >
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.titleWrap}>
              <Text style={styles.title}>{TEXTS.TITLE}</Text>
              <Text style={styles.subtitle}>{TEXTS.SUBTITLE}</Text>
            </View>
          </View>

          {/* Current password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{TEXTS.CURRENT_PASSWORD}</Text>
            <View style={[styles.inputRow, errors.current && styles.inputRowError]}>
              <TextInput
                style={styles.input}
                secureTextEntry={!showCurrent}
                value={currentPassword}
                onChangeText={(t) => { setCurrentPassword(t); setErrors((e) => ({ ...e, current: undefined })); }}
                placeholder="••••••"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoComplete="current-password"
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowCurrent(!showCurrent)}>
                <Ionicons name={showCurrent ? 'eye-off' : 'eye'} size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {errors.current ? <Text style={styles.errorText}>{errors.current}</Text> : null}
          </View>

          {/* New password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{TEXTS.NEW_PASSWORD}</Text>
            <View style={[styles.inputRow, errors.new && styles.inputRowError]}>
              <TextInput
                style={styles.input}
                secureTextEntry={!showNew}
                value={newPassword}
                onChangeText={(t) => { setNewPassword(t); setErrors((e) => ({ ...e, new: undefined })); }}
                placeholder="••••••"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoComplete="new-password"
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowNew(!showNew)}>
                <Ionicons name={showNew ? 'eye-off' : 'eye'} size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {errors.new ? <Text style={styles.errorText}>{errors.new}</Text> : null}
          </View>

          {/* Confirm password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{TEXTS.CONFIRM_PASSWORD}</Text>
            <View style={[styles.inputRow, errors.confirm && styles.inputRowError]}>
              <TextInput
                style={styles.input}
                secureTextEntry={!showConfirm}
                value={confirmPassword}
                onChangeText={(t) => { setConfirmPassword(t); setErrors((e) => ({ ...e, confirm: undefined })); }}
                placeholder="••••••"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoComplete="new-password"
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(!showConfirm)}>
                <Ionicons name={showConfirm ? 'eye-off' : 'eye'} size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {errors.confirm ? <Text style={styles.errorText}>{errors.confirm}</Text> : null}
          </View>

          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[styles.button, submitting && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color={colors.textOnPrimary ?? '#fff'} size="small" />
              ) : (
                <Text style={styles.buttonText}>{TEXTS.BUTTON_SAVE}</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
