import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { REGISTER as TEXTS } from '../../constants/translations';
import { colors, globalStyles } from '../../styles/globalStyles';
import { styles } from './registerScreenStyles';
import { EYE_ICON_SIZE, BUTTON_ICON_SIZE, BUTTON_ICON_MARGIN, ACTIVE_OPACITY, BUTTON_ACTIVE_OPACITY, CHECKBOX_ICON_SIZE } from './registerScreenConstants';

export function RegisterForm({
  formData,
  errors,
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
  onInputChange,
  onRegister,
  onOpenNameInfo,
  onOpenTerms,
  onOpenPrivacy,
  onSignInLink,
  fadeAnim,
  translateYAnim,
  AnimatedView,
}) {
  return (
    <AnimatedView
      style={[
        styles.content,
        {
          opacity: fadeAnim,
          transform: [{ translateY: translateYAnim }],
        },
      ]}
    >
      <Text style={styles.title}>{TEXTS.TITLE}</Text>
      <Text style={styles.subtitle}>{TEXTS.SUBTITLE}</Text>

      <View style={globalStyles.inputWrapper}>
        <View style={[globalStyles.inputContainer, errors.name && globalStyles.inputError]}>
          <Ionicons name="person" size={20} color={colors.primary} style={globalStyles.inputIcon} />
          <TextInput
            style={globalStyles.input}
            placeholder={TEXTS.NAME_PLACEHOLDER}
            placeholderTextColor={colors.accent}
            autoCapitalize="words"
            onChangeText={(t) => onInputChange('name', t)}
            value={formData.name}
            accessibilityLabel={TEXTS.NAME_PLACEHOLDER}
          />
        </View>
        {errors.name ? <Text style={globalStyles.errorText}>{errors.name}</Text> : null}
        <TouchableOpacity onPress={onOpenNameInfo} style={styles.nameInfoLink} activeOpacity={ACTIVE_OPACITY}>
          <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
          <Text style={styles.nameInfoLinkText}>{TEXTS.NAME_INFO_LINK}</Text>
        </TouchableOpacity>
      </View>

      <View style={globalStyles.inputWrapper}>
        <View style={[globalStyles.inputContainer, errors.username && globalStyles.inputError]}>
          <Ionicons name="person-outline" size={20} color={colors.primary} style={globalStyles.inputIcon} />
          <TextInput
            style={globalStyles.input}
            placeholder={TEXTS.USERNAME_PLACEHOLDER}
            placeholderTextColor={colors.accent}
            autoCapitalize="none"
            onChangeText={(t) => onInputChange('username', t)}
            value={formData.username}
            accessibilityLabel={TEXTS.USERNAME_PLACEHOLDER}
          />
        </View>
        {errors.username ? <Text style={globalStyles.errorText}>{errors.username}</Text> : null}
      </View>

      <View style={globalStyles.inputWrapper}>
        <View style={[globalStyles.inputContainer, errors.email && globalStyles.inputError]}>
          <Ionicons name="mail-outline" size={20} color={colors.primary} style={globalStyles.inputIcon} />
          <TextInput
            style={globalStyles.input}
            placeholder={TEXTS.EMAIL_PLACEHOLDER}
            placeholderTextColor={colors.accent}
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={(t) => onInputChange('email', t)}
            value={formData.email}
            accessibilityLabel={TEXTS.EMAIL_PLACEHOLDER}
          />
        </View>
        {errors.email ? <Text style={globalStyles.errorText}>{errors.email}</Text> : null}
      </View>

      <View style={globalStyles.inputWrapper}>
        <View style={[globalStyles.inputContainer, errors.password && globalStyles.inputError]}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.primary} style={globalStyles.inputIcon} />
          <TextInput
            style={globalStyles.input}
            placeholder={TEXTS.PASSWORD_PLACEHOLDER}
            placeholderTextColor={colors.accent}
            secureTextEntry={!isPasswordVisible}
            onChangeText={(t) => onInputChange('password', t)}
            value={formData.password}
            accessibilityLabel={TEXTS.PASSWORD_PLACEHOLDER}
          />
          <TouchableOpacity onPress={() => setPasswordVisible(!isPasswordVisible)} style={globalStyles.inputIcon} accessibilityLabel={isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
            <Ionicons name={isPasswordVisible ? 'eye-off' : 'eye'} size={EYE_ICON_SIZE} color={colors.primary} />
          </TouchableOpacity>
        </View>
        {errors.password ? <Text style={globalStyles.errorText}>{errors.password}</Text> : null}
      </View>

      <View style={globalStyles.inputWrapper}>
        <View style={[globalStyles.inputContainer, errors.confirmPassword && globalStyles.inputError]}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.primary} style={globalStyles.inputIcon} />
          <TextInput
            style={globalStyles.input}
            placeholder={TEXTS.CONFIRM_PASSWORD_PLACEHOLDER}
            placeholderTextColor={colors.accent}
            secureTextEntry={!isConfirmPasswordVisible}
            onChangeText={(t) => onInputChange('confirmPassword', t)}
            value={formData.confirmPassword}
            accessibilityLabel={TEXTS.CONFIRM_PASSWORD_PLACEHOLDER}
          />
          <TouchableOpacity onPress={() => setConfirmPasswordVisible(!isConfirmPasswordVisible)} style={globalStyles.inputIcon} accessibilityLabel={isConfirmPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
            <Ionicons name={isConfirmPasswordVisible ? 'eye-off' : 'eye'} size={EYE_ICON_SIZE} color={colors.primary} />
          </TouchableOpacity>
        </View>
        {errors.confirmPassword ? <Text style={globalStyles.errorText}>{errors.confirmPassword}</Text> : null}
      </View>

      <TouchableOpacity style={styles.checkboxContainer} onPress={() => { onOpenTerms(); setHasViewedTerms(true); }} activeOpacity={ACTIVE_OPACITY}>
        <View style={[styles.checkbox, isTermsAccepted && styles.checkboxChecked]}>
          {isTermsAccepted && <Ionicons name="checkmark" size={CHECKBOX_ICON_SIZE} color={colors.white} />}
        </View>
        <Text style={styles.termsText}>
          {TEXTS.TERMS_TEXT}
          <Text style={styles.termsLink} onPress={() => { onOpenTerms(); setHasViewedTerms(true); }}>{TEXTS.TERMS_LINK}</Text>.
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.checkboxContainer} onPress={() => setTermsAccepted(!isTermsAccepted)} activeOpacity={ACTIVE_OPACITY} disabled={!hasViewedTerms}>
        <View style={[styles.checkbox, isTermsAccepted && styles.checkboxChecked, !hasViewedTerms && styles.checkboxDisabled]}>
          {isTermsAccepted && <Ionicons name="checkmark" size={CHECKBOX_ICON_SIZE} color={colors.white} />}
        </View>
        <Text style={[styles.termsText, !hasViewedTerms && styles.termsTextDisabled]}>Acepto los términos y condiciones</Text>
      </TouchableOpacity>
      {errors.terms && <Text style={globalStyles.errorText}>{errors.terms}</Text>}

      <TouchableOpacity style={styles.checkboxContainer} onPress={() => setPrivacyAccepted(!isPrivacyAccepted)} activeOpacity={ACTIVE_OPACITY}>
        <View style={[styles.checkbox, isPrivacyAccepted && styles.checkboxChecked]}>
          {isPrivacyAccepted && <Ionicons name="checkmark" size={CHECKBOX_ICON_SIZE} color={colors.white} />}
        </View>
        <Text style={styles.termsText}>
          Acepto la <Text style={styles.termsLink} onPress={onOpenPrivacy}>{TEXTS.PRIVACY_LINK.toLowerCase()}</Text>.
        </Text>
      </TouchableOpacity>
      {errors.privacy && <Text style={globalStyles.errorText}>{errors.privacy}</Text>}

      <TouchableOpacity
        style={[globalStyles.modernButton, isSubmitting && globalStyles.disabledButton]}
        onPress={onRegister}
        disabled={isSubmitting || isOffline}
        activeOpacity={BUTTON_ACTIVE_OPACITY}
        accessibilityLabel={TEXTS.REGISTER_BUTTON}
        testID="registerButton"
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <>
            <Ionicons name="person-add-outline" size={BUTTON_ICON_SIZE} color={colors.white} style={{ marginRight: BUTTON_ICON_MARGIN }} />
            <Text style={globalStyles.buttonText}>{TEXTS.REGISTER_BUTTON}</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={onSignInLink} style={styles.linkContainer} activeOpacity={ACTIVE_OPACITY}>
        <Text style={styles.linkText}>{TEXTS.SIGN_IN_LINK}</Text>
      </TouchableOpacity>
    </AnimatedView>
  );
}
