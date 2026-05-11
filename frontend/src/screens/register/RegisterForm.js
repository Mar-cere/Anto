import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { REGISTER as TEXTS } from '../../constants/translations';
import { useTheme } from '../../context/ThemeContext';
import { useRegisterScreenStyles } from './registerScreenStyles';
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
  const { colors, globalStyles: gs } = useTheme();
  const styles = useRegisterScreenStyles();

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

      <View style={gs.inputWrapper}>
        <View style={[gs.inputContainer, errors.name && gs.inputError]}>
          <Ionicons name="person" size={20} color={colors.primary} style={gs.inputIcon} />
          <TextInput
            style={gs.input}
            placeholder={TEXTS.NAME_PLACEHOLDER}
            placeholderTextColor={colors.accent}
            autoCapitalize="words"
            onChangeText={(t) => onInputChange('name', t)}
            value={formData.name}
            accessibilityLabel={TEXTS.NAME_PLACEHOLDER}
          />
        </View>
        {errors.name ? <Text style={gs.errorText}>{errors.name}</Text> : null}
        <TouchableOpacity onPress={onOpenNameInfo} style={styles.nameInfoLink} activeOpacity={ACTIVE_OPACITY}>
          <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
          <Text style={styles.nameInfoLinkText}>{TEXTS.NAME_INFO_LINK}</Text>
        </TouchableOpacity>
      </View>

      <View style={gs.inputWrapper}>
        <View style={[gs.inputContainer, errors.username && gs.inputError]}>
          <Ionicons name="person-outline" size={20} color={colors.primary} style={gs.inputIcon} />
          <TextInput
            style={gs.input}
            placeholder={TEXTS.USERNAME_PLACEHOLDER}
            placeholderTextColor={colors.accent}
            autoCapitalize="none"
            onChangeText={(t) => onInputChange('username', t)}
            value={formData.username}
            accessibilityLabel={TEXTS.USERNAME_PLACEHOLDER}
          />
        </View>
        {errors.username ? <Text style={gs.errorText}>{errors.username}</Text> : null}
      </View>

      <View style={gs.inputWrapper}>
        <View style={[gs.inputContainer, errors.email && gs.inputError]}>
          <Ionicons name="mail-outline" size={20} color={colors.primary} style={gs.inputIcon} />
          <TextInput
            style={gs.input}
            placeholder={TEXTS.EMAIL_PLACEHOLDER}
            placeholderTextColor={colors.accent}
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={(t) => onInputChange('email', t)}
            value={formData.email}
            accessibilityLabel={TEXTS.EMAIL_PLACEHOLDER}
          />
        </View>
        {errors.email ? <Text style={gs.errorText}>{errors.email}</Text> : null}
      </View>

      <View style={gs.inputWrapper}>
        <View style={[gs.inputContainer, errors.password && gs.inputError]}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.primary} style={gs.inputIcon} />
          <TextInput
            style={gs.input}
            placeholder={TEXTS.PASSWORD_PLACEHOLDER}
            placeholderTextColor={colors.accent}
            secureTextEntry={!isPasswordVisible}
            onChangeText={(t) => onInputChange('password', t)}
            value={formData.password}
            accessibilityLabel={TEXTS.PASSWORD_PLACEHOLDER}
          />
          <TouchableOpacity onPress={() => setPasswordVisible(!isPasswordVisible)} style={gs.inputIcon} accessibilityLabel={isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
            <Ionicons name={isPasswordVisible ? 'eye-off' : 'eye'} size={EYE_ICON_SIZE} color={colors.primary} />
          </TouchableOpacity>
        </View>
        {errors.password ? <Text style={gs.errorText}>{errors.password}</Text> : null}
      </View>

      <View style={gs.inputWrapper}>
        <View style={[gs.inputContainer, errors.confirmPassword && gs.inputError]}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.primary} style={gs.inputIcon} />
          <TextInput
            style={gs.input}
            placeholder={TEXTS.CONFIRM_PASSWORD_PLACEHOLDER}
            placeholderTextColor={colors.accent}
            secureTextEntry={!isConfirmPasswordVisible}
            onChangeText={(t) => onInputChange('confirmPassword', t)}
            value={formData.confirmPassword}
            accessibilityLabel={TEXTS.CONFIRM_PASSWORD_PLACEHOLDER}
          />
          <TouchableOpacity onPress={() => setConfirmPasswordVisible(!isConfirmPasswordVisible)} style={gs.inputIcon} accessibilityLabel={isConfirmPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
            <Ionicons name={isConfirmPasswordVisible ? 'eye-off' : 'eye'} size={EYE_ICON_SIZE} color={colors.primary} />
          </TouchableOpacity>
        </View>
        {errors.confirmPassword ? <Text style={gs.errorText}>{errors.confirmPassword}</Text> : null}
      </View>

      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          onPress={() => {
            if (!hasViewedTerms) {
              onOpenTerms();
              setHasViewedTerms(true);
              return;
            }
            setTermsAccepted(!isTermsAccepted);
          }}
          activeOpacity={ACTIVE_OPACITY}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isTermsAccepted }}
        >
          <View style={[styles.checkbox, isTermsAccepted && styles.checkboxChecked, !hasViewedTerms && styles.checkboxDisabled]}>
            {isTermsAccepted && <Ionicons name="checkmark" size={CHECKBOX_ICON_SIZE} color={colors.white} />}
          </View>
        </TouchableOpacity>
        <Text style={[styles.termsText, styles.termsTextFlex, !hasViewedTerms && styles.termsTextDisabled]}>
          {TEXTS.TERMS_TEXT}
          <Text
            style={styles.termsLink}
            onPress={() => {
              onOpenTerms();
              setHasViewedTerms(true);
            }}
          >
            {TEXTS.TERMS_LINK}
          </Text>
          .
        </Text>
      </View>
      {errors.terms && <Text style={gs.errorText}>{errors.terms}</Text>}

      <View style={styles.checkboxContainer}>
        <TouchableOpacity onPress={() => setPrivacyAccepted(!isPrivacyAccepted)} activeOpacity={ACTIVE_OPACITY} accessibilityRole="checkbox" accessibilityState={{ checked: isPrivacyAccepted }}>
          <View style={[styles.checkbox, isPrivacyAccepted && styles.checkboxChecked]}>
            {isPrivacyAccepted && <Ionicons name="checkmark" size={CHECKBOX_ICON_SIZE} color={colors.white} />}
          </View>
        </TouchableOpacity>
        <Text style={[styles.termsText, styles.termsTextFlex]}>
          Acepto la{' '}
          <Text style={styles.termsLink} onPress={onOpenPrivacy}>
            {TEXTS.PRIVACY_LINK}
          </Text>
          .
        </Text>
      </View>
      {errors.privacy && <Text style={gs.errorText}>{errors.privacy}</Text>}

      <TouchableOpacity
        style={[gs.modernButton, isSubmitting && gs.disabledButton]}
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
            <Text style={gs.buttonText}>{TEXTS.REGISTER_BUTTON}</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={onSignInLink} style={styles.linkContainer} activeOpacity={ACTIVE_OPACITY}>
        <Text style={styles.linkText}>{TEXTS.SIGN_IN_LINK}</Text>
      </TouchableOpacity>
    </AnimatedView>
  );
}
