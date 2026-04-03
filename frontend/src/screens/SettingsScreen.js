/**
 * Pantalla de Configuración
 *
 * Preferencias, notificaciones, estilo de respuesta, cuenta, soporte. Lógica en useSettingsScreen;
 * UI en SettingsHeader, SettingsContent, SettingsConfirmModal.
 *
 * @author AntoApp Team
 */

import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import SettingsConfirmModal from '../components/settings/SettingsConfirmModal';
import SettingsContent from '../components/settings/SettingsContent';
import SettingsHeader from '../components/settings/SettingsHeader';
import { useSettingsScreen } from '../hooks/useSettingsScreen';
import { COLORS, TEXTS } from './settings/settingsScreenConstants';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {
    user,
    showLogoutModal,
    setShowLogoutModal,
    showDeleteModal,
    setShowDeleteModal,
    pushNotificationsEnabled,
    handleLogout,
    handleDeleteAccount,
    handleTogglePushNotifications,
    handleCycleResponseStyle,
    handleChatPreferenceChange,
    handleTestNotification,
  } = useSettingsScreen({ navigation });

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
      <SettingsHeader onBack={() => navigation.goBack()} />
      <SettingsContent
        navigation={navigation}
        user={user}
        pushNotificationsEnabled={pushNotificationsEnabled}
        onTogglePushNotifications={handleTogglePushNotifications}
        onCycleResponseStyle={handleCycleResponseStyle}
        onChatPreferenceChange={handleChatPreferenceChange}
        onShowLogoutModal={() => setShowLogoutModal(true)}
        onShowDeleteModal={() => setShowDeleteModal(true)}
        onTestNotification={handleTestNotification}
      />
      <SettingsConfirmModal
        visible={showLogoutModal}
        onRequestClose={() => setShowLogoutModal(false)}
        title={TEXTS.LOGOUT_TITLE}
        message={TEXTS.LOGOUT_MESSAGE}
        confirmText={TEXTS.CONFIRM}
        cancelText={TEXTS.CANCEL}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
      <SettingsConfirmModal
        visible={showDeleteModal}
        onRequestClose={() => setShowDeleteModal(false)}
        title={TEXTS.DELETE_TITLE}
        message={TEXTS.DELETE_MESSAGE}
        confirmText={TEXTS.DELETE}
        cancelText={TEXTS.CANCEL}
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteModal(false)}
        destructive
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
});
