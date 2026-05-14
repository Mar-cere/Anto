/**
 * Pantalla de Configuración
 *
 * Preferencias, notificaciones, estilo de respuesta, cuenta, soporte. Lógica en useSettingsScreen;
 * UI en SettingsHeader, SettingsContent, SettingsConfirmModal.
 *
 * @author AntoApp Team
 */

import React, { useCallback, useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import SettingsConfirmModal from '../components/settings/SettingsConfirmModal';
import SettingsContent from '../components/settings/SettingsContent';
import SettingsHeader from '../components/settings/SettingsHeader';
import { useTheme } from '../context/ThemeContext';
import { useSettingsScreen } from '../hooks/useSettingsScreen';
import { TEXTS } from './settings/settingsScreenConstants';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [expandChatRequest, setExpandChatRequest] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (route.params?.expandChatCustomization) {
        setExpandChatRequest((n) => n + 1);
        navigation.setParams({ expandChatCustomization: undefined });
      }
    }, [navigation, route.params?.expandChatCustomization]),
  );
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
    handleUpdateNotificationPreferences,
    handleSetResponseStyle,
    handleChatPreferenceChange,
    handleTestNotification,
    handleSetThemePreference,
  } = useSettingsScreen({ navigation });

  return (
    <SafeAreaView
      style={[styles.safeArea, { paddingTop: insets.top, backgroundColor: colors.background }]}
    >
      <SettingsHeader onBack={() => navigation.goBack()} />
      <SettingsContent
        navigation={navigation}
        user={user}
        expandChatCustomizationRequest={expandChatRequest}
        pushNotificationsEnabled={pushNotificationsEnabled}
        onTogglePushNotifications={handleTogglePushNotifications}
        onUpdateNotificationPreferences={handleUpdateNotificationPreferences}
        onSetResponseStyle={handleSetResponseStyle}
        onChatPreferenceChange={handleChatPreferenceChange}
        onShowLogoutModal={() => setShowLogoutModal(true)}
        onShowDeleteModal={() => setShowDeleteModal(true)}
        onTestNotification={handleTestNotification}
        onSetThemePreference={handleSetThemePreference}
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
  },
});
