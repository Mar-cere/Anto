import React, { useEffect, useMemo, useState } from 'react';
import { Platform, View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import {
  DEFAULT_APP_TRIAL_DAYS,
  formatTrialPeriodLabel,
} from '../../constants/subscription';
import { fetchAppTrialDays } from '../../services/appConfigService';
import {
  createAuthTextChangeHandler,
  getAuthPasswordAutoComplete,
  getAuthPasswordTextContentType,
  syncWebTextInputOnBlur,
  syncWebTextInputOnFocus,
  withWebAutofillInputStyle,
} from '../../utils/authFormInputUtils';
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
  passwordRef,
  confirmPasswordRef,
}) {
  const TEXTS = useSectionTranslations('REGISTER');
  const { language } = useLanguage();
  const { colors, globalStyles: gs } = useTheme();
  const styles = useRegisterScreenStyles();
  const [trialDays, setTrialDays] = useState(DEFAULT_APP_TRIAL_DAYS);
  const [focusedField, setFocusedField] = useState(null);

  const passwordInputStyle = useMemo(
    () => withWebAutofillInputStyle(gs.input, colors),
    [gs.input, colors],
  );

  const handlePasswordChange = useMemo(
    () => createAuthTextChangeHandler((value) => onInputChange('password', value)),
    [onInputChange],
  );
  const handleConfirmPasswordChange = useMemo(
    () => createAuthTextChangeHandler((value) => onInputChange('confirmPassword', value)),
    [onInputChange],
  );

  useEffect(() => {
    let cancelled = false;
    fetchAppTrialDays().then((days) => {
      if (!cancelled) {
        setTrialDays(days);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const trialHint = useMemo(() => {
    const template = TEXTS.TRIAL_HINT;
    if (!template) {
      return null;
    }
    const label = formatTrialPeriodLabel(trialDays, language === 'en' ? 'en' : 'es');
    return template.replace('{trialPeriod}', label);
  }, [TEXTS.TRIAL_HINT, trialDays, language]);

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
      {trialHint ? (
        <Text style={[styles.subtitle, styles.trialHint]}>{trialHint}</Text>
      ) : null}

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
            autoComplete="username"
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
            autoComplete="email"
            textContentType="emailAddress"
            onChangeText={(t) => onInputChange('email', t)}
            value={formData.email}
            accessibilityLabel={TEXTS.EMAIL_PLACEHOLDER}
          />
        </View>
        {errors.email ? <Text style={gs.errorText}>{errors.email}</Text> : null}
      </View>

      <View style={gs.inputWrapper}>
        <View style={[
          gs.inputContainer,
          errors.password && gs.inputError,
          focusedField === 'password' && gs.inputContainerFocused,
        ]}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.primary} style={gs.inputIcon} />
          <TextInput
            ref={passwordRef}
            testID="register-password-input"
            style={passwordInputStyle}
            placeholder={TEXTS.PASSWORD_PLACEHOLDER}
            placeholderTextColor={colors.accent}
            secureTextEntry={!isPasswordVisible}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            autoComplete={getAuthPasswordAutoComplete('register-password')}
            textContentType={getAuthPasswordTextContentType('register-password')}
            onChangeText={handlePasswordChange}
            onChange={Platform.OS === 'web' ? handlePasswordChange : undefined}
            onFocus={(event) => {
              setFocusedField('password');
              syncWebTextInputOnFocus(event, formData.password, (value) => onInputChange('password', value));
            }}
            onBlur={(event) => {
              setFocusedField(null);
              syncWebTextInputOnBlur(event, formData.password, (value) => onInputChange('password', value));
            }}
            value={formData.password}
            accessibilityLabel={TEXTS.PASSWORD_PLACEHOLDER}
            accessibilityState={{ invalid: Boolean(errors.password) }}
          />
          <TouchableOpacity
            onPress={() => setPasswordVisible(!isPasswordVisible)}
            style={gs.inputIcon}
            accessibilityLabel={isPasswordVisible ? TEXTS.HIDE_PASSWORD : TEXTS.SHOW_PASSWORD}
            accessibilityRole="button"
          >
            <Ionicons name={isPasswordVisible ? 'eye-off' : 'eye'} size={EYE_ICON_SIZE} color={colors.primary} />
          </TouchableOpacity>
        </View>
        {errors.password ? <Text style={gs.errorText}>{errors.password}</Text> : null}
      </View>

      <View style={gs.inputWrapper}>
        <View style={[
          gs.inputContainer,
          errors.confirmPassword && gs.inputError,
          focusedField === 'confirmPassword' && gs.inputContainerFocused,
        ]}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.primary} style={gs.inputIcon} />
          <TextInput
            ref={confirmPasswordRef}
            testID="register-confirm-password-input"
            style={passwordInputStyle}
            placeholder={TEXTS.CONFIRM_PASSWORD_PLACEHOLDER}
            placeholderTextColor={colors.accent}
            secureTextEntry={!isConfirmPasswordVisible}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            autoComplete={getAuthPasswordAutoComplete('register-confirm-password')}
            textContentType={getAuthPasswordTextContentType('register-confirm-password')}
            onChangeText={handleConfirmPasswordChange}
            onChange={Platform.OS === 'web' ? handleConfirmPasswordChange : undefined}
            onFocus={(event) => {
              setFocusedField('confirmPassword');
              syncWebTextInputOnFocus(event, formData.confirmPassword, (value) => onInputChange('confirmPassword', value));
            }}
            onBlur={(event) => {
              setFocusedField(null);
              syncWebTextInputOnBlur(event, formData.confirmPassword, (value) => onInputChange('confirmPassword', value));
            }}
            value={formData.confirmPassword}
            accessibilityLabel={TEXTS.CONFIRM_PASSWORD_PLACEHOLDER}
            accessibilityState={{ invalid: Boolean(errors.confirmPassword) }}
          />
          <TouchableOpacity
            onPress={() => setConfirmPasswordVisible(!isConfirmPasswordVisible)}
            style={gs.inputIcon}
            accessibilityLabel={isConfirmPasswordVisible ? TEXTS.HIDE_PASSWORD : TEXTS.SHOW_PASSWORD}
            accessibilityRole="button"
          >
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
          {TEXTS.PRIVACY_ACCEPT_PREFIX}
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
