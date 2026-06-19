/**
 * Pantalla de registro de usuario
 * Refactor: hook + subcomponentes en screens/register/
 */
import React from 'react';
import {
  ActivityIndicator,
  Animated,
  ImageBackground,
  StatusBar,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useNavigation } from '@react-navigation/native';
import ParticleBackground from '../components/ParticleBackground';
import OfflineBanner from '../components/OfflineBanner';
import { useTheme } from '../context/ThemeContext';
import { useRegisterScreen } from './register/useRegisterScreen';
import { RegisterForm } from './register/RegisterForm';
import { NameInfoModal } from './register/NameInfoModal';
import { TermsModal } from './register/TermsModal';
import { useRegisterScreenStyles } from './register/registerScreenStyles';
import { getAuthKeyboardScrollProps } from '../utils/authFormInputUtils';
const RegisterScreen = () => {
  const navigation = useNavigation();
  const { colors, statusBarStyle } = useTheme();
  const styles = useRegisterScreenStyles();
  const {
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
    passwordRef,
    confirmPasswordRef,
  } = useRegisterScreen(navigation);

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.container}
      {...getAuthKeyboardScrollProps()}
    >
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
      <OfflineBanner />
      <ImageBackground source={require('../images/back.png')} style={styles.background} imageStyle={styles.imageStyle}>
        <ParticleBackground />
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loadingIndicator} />
        ) : (
          <RegisterForm
            formData={formData}
            errors={errors}
            isSubmitting={isSubmitting}
            isOffline={isOffline}
            isPasswordVisible={isPasswordVisible}
            setPasswordVisible={setPasswordVisible}
            isConfirmPasswordVisible={isConfirmPasswordVisible}
            setConfirmPasswordVisible={setConfirmPasswordVisible}
            isTermsAccepted={isTermsAccepted}
            setTermsAccepted={setTermsAccepted}
            isPrivacyAccepted={isPrivacyAccepted}
            setPrivacyAccepted={setPrivacyAccepted}
            hasViewedTerms={hasViewedTerms}
            setHasViewedTerms={setHasViewedTerms}
            onInputChange={handleInputChange}
            onRegister={handleRegister}
            onOpenNameInfo={() => setNameInfoModalVisible(true)}
            onOpenTerms={() => setTermsModalVisible(true)}
            onOpenPrivacy={openPrivacyUrl}
            onSignInLink={() => navigation.navigate('SignIn')}
            fadeAnim={fadeAnim}
            translateYAnim={translateYAnim}
            AnimatedView={Animated.View}
            passwordRef={passwordRef}
            confirmPasswordRef={confirmPasswordRef}
          />
        )}
      </ImageBackground>
      <NameInfoModal visible={isNameInfoModalVisible} onClose={() => setNameInfoModalVisible(false)} />
      <TermsModal
        visible={isTermsModalVisible}
        onClose={() => setTermsModalVisible(false)}
        onAccept={acceptTermsAndClose}
      />
    </KeyboardAwareScrollView>
  );
};

export default RegisterScreen;
