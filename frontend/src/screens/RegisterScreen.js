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
  Alert,
  Linking,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useNavigation } from '@react-navigation/native';
import ParticleBackground from '../components/ParticleBackground';
import OfflineBanner from '../components/OfflineBanner';
import { colors } from '../styles/globalStyles';
import { useRegisterScreen } from './register/useRegisterScreen';
import { RegisterForm } from './register/RegisterForm';
import { NameInfoModal } from './register/NameInfoModal';
import { TermsModal } from './register/TermsModal';
import { styles } from './register/registerScreenStyles';
import { STATUS_BAR_STYLE, STATUS_BAR_BACKGROUND } from './register/registerScreenConstants';
import { URLS } from './register/registerScreenConstants';

const openPrivacyUrl = async () => {
  try {
    const canOpen = await Linking.canOpenURL(URLS.PRIVACY);
    if (canOpen) await Linking.openURL(URLS.PRIVACY);
    else Alert.alert('Error', 'No se pudo abrir el enlace');
  } catch {
    Alert.alert('Error', 'No se pudo abrir el enlace');
  }
};

const RegisterScreen = () => {
  const navigation = useNavigation();
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
  } = useRegisterScreen(navigation);

  return (
    <KeyboardAwareScrollView contentContainerStyle={styles.container}>
      <StatusBar barStyle={STATUS_BAR_STYLE} backgroundColor={STATUS_BAR_BACKGROUND} />
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
