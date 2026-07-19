/**
 * Pantalla de edición de perfil — rediseño moderno.
 * Avatar con iniciales, campos agrupados en card, botón de guardado prominente.
 */
import { Ionicons } from '@expo/vector-icons';
import { SPACING } from '../constants/ui';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
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
import { useEditProfileScreen } from './editProfileScreen/useEditProfileScreen';
import { useEditProfileTexts } from './editProfileScreen/editProfileScreenConstants';

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
}

export default function EditProfileScreen({ navigation }) {
  const { colors } = useTheme();
  const TEXTS = useEditProfileTexts();
  const {
    loading,
    editing,
    setEditing,
    saving,
    saveSuccess,
    formData,
    errors,
    fadeAnim,
    handleSave,
    handleFormChange,
  } = useEditProfileScreen(navigation);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: colors.background },
        scroll: { flexGrow: 1 },
        container: { padding: SPACING.SCREEN_EDGE_INSET },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 24,
        },
        backBtn: {
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: colors.glassFill ?? colors.accentLineSoft,
          alignItems: 'center',
          justifyContent: 'center',
        },
        headerTitle: {
          flex: 1,
          marginLeft: 12,
          fontSize: 20,
          fontWeight: '700',
          color: colors.text,
          letterSpacing: -0.3,
        },
        editBtn: {
          paddingHorizontal: SPACING.INPUT_INSET,
          paddingVertical: SPACING.sm,
          borderRadius: 10,
          backgroundColor: colors.accentLineSoft,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        editBtnText: {
          fontSize: 13,
          fontWeight: '600',
          color: colors.primary,
        },
        avatarWrap: {
          alignItems: 'center',
          marginBottom: 28,
        },
        avatar: {
          width: 88,
          height: 88,
          borderRadius: 44,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
        },
        avatarText: {
          fontSize: 32,
          fontWeight: '700',
          color: colors.textOnPrimary ?? '#fff',
        },
        avatarName: {
          fontSize: 20,
          fontWeight: '700',
          color: colors.text,
        },
        avatarUsername: {
          fontSize: 14,
          color: colors.textSecondary,
          marginTop: 2,
        },
        card: {
          backgroundColor: colors.cardBackground ?? colors.surface,
          borderRadius: 16,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          padding: SPACING.HERO_INSET,
          marginBottom: 20,
        },
        cardTitle: {
          fontSize: 13,
          fontWeight: '700',
          color: colors.textSecondary,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          marginBottom: 18,
        },
        fieldGroup: { marginBottom: 18 },
        fieldGroupLast: { marginBottom: 0 },
        label: {
          fontSize: 12,
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
          paddingHorizontal: SPACING.INPUT_INSET,
        },
        inputRowDisabled: {
          opacity: 0.6,
          backgroundColor: colors.chromeInputDisabled ?? colors.chromeInput ?? colors.surface,
        },
        inputRowError: { borderColor: colors.error },
        input: {
          flex: 1,
          fontSize: 16,
          color: colors.text,
          paddingVertical: SPACING.HERO_INSET_COMPACT,
        },
        inputIcon: { marginRight: 10 },
        helperText: {
          fontSize: 11,
          color: colors.textSecondary,
          marginTop: 4,
          marginLeft: 4,
        },
        errorText: {
          fontSize: 11,
          color: colors.error,
          marginTop: 4,
          marginLeft: 4,
        },
        saveBtn: {
          backgroundColor: colors.primary,
          borderRadius: 14,
          paddingVertical: SPACING.HERO_INSET_COMPACT,
          alignItems: 'center',
          marginTop: 8,
        },
        saveBtnDisabled: { opacity: 0.55 },
        saveBtnText: {
          color: colors.textOnPrimary ?? '#fff',
          fontSize: 16,
          fontWeight: '700',
        },
        successBanner: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.successSoft ?? '#e8fce8',
          borderRadius: 12,
          paddingVertical: SPACING.CHIP_INSET_COMPACT,
          marginBottom: 16,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.success ?? '#4BB543',
        },
        successText: {
          marginLeft: 8,
          fontSize: 14,
          fontWeight: '600',
          color: colors.success ?? '#4BB543',
        },
        loadingWrap: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
        loadingLabel: {
          marginTop: 12,
          fontSize: 14,
          color: colors.textSecondary,
        },
      }),
    [colors],
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingLabel}>{TEXTS.LOADING}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              accessibilityLabel={TEXTS.BACK}
            >
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{TEXTS.PROFILE_TITLE}</Text>
            {!editing && (
              <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
                <Text style={styles.editBtnText}>{TEXTS.EDIT_PROFILE}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(formData.name)}</Text>
            </View>
            <Text style={styles.avatarName}>{formData.name || '—'}</Text>
            <Text style={styles.avatarUsername}>@{formData.username}</Text>
          </View>

          {/* Success banner */}
          {saveSuccess && (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success ?? '#4BB543'} />
              <Text style={styles.successText}>{TEXTS.SAVED}</Text>
            </View>
          )}

          {/* Form card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{TEXTS.PERSONAL_INFO}</Text>

            {/* Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{TEXTS.NAME}</Text>
              <View style={[styles.inputRow, !editing && styles.inputRowDisabled, errors.name && styles.inputRowError]}>
                <Ionicons name="person-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(t) => handleFormChange('name', t)}
                  editable={editing}
                  placeholder={TEXTS.ADD_NAME}
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="words"
                />
              </View>
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
            </View>

            {/* Username (read-only) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{TEXTS.USERNAME}</Text>
              <View style={[styles.inputRow, styles.inputRowDisabled]}>
                <Ionicons name="at" size={18} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.username}
                  editable={false}
                />
              </View>
              <Text style={styles.helperText}>{TEXTS.USERNAME_HELPER}</Text>
            </View>

            {/* Email */}
            <View style={[styles.fieldGroup, styles.fieldGroupLast]}>
              <Text style={styles.label}>{TEXTS.EMAIL}</Text>
              <View style={[styles.inputRow, !editing && styles.inputRowDisabled, errors.email && styles.inputRowError]}>
                <Ionicons name="mail-outline" size={18} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(t) => handleFormChange('email', t)}
                  editable={editing}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder={TEXTS.EMAIL_PLACEHOLDER}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>
          </View>

          {/* Save button */}
          {editing && (
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color={colors.textOnPrimary ?? '#fff'} size="small" />
              ) : (
                <Text style={styles.saveBtnText}>{TEXTS.SAVE_CHANGES}</Text>
              )}
            </TouchableOpacity>
          )}
        </Animated.View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
