/**
 * Contenido scroll de Configuración: preferencias, cuenta, soporte, acerca de.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import {
  COLORS,
  ICON_SIZE,
  NAVIGATION_ROUTES,
  RESPONSE_STYLE_LABELS,
  TEXTS,
} from '../../screens/settings/settingsScreenConstants';

const DEFAULT_CHAT_PREFS = {
  reduceStockEmpathy: false,
  avoidApologyOpenings: false,
  preferQuestions: false,
};
import { SCROLL_PADDING_BOTTOM } from '../../screens/settings/settingsScreenConstants';

export default function SettingsContent({
  navigation,
  user,
  pushNotificationsEnabled,
  onTogglePushNotifications,
  onCycleResponseStyle,
  onChatPreferenceChange,
  onShowLogoutModal,
  onShowDeleteModal,
  onTestNotification,
}) {
  const currentResponseStyle = user?.preferences?.responseStyle || 'balanced';
  const responseStyleLabel = RESPONSE_STYLE_LABELS[currentResponseStyle] || 'Equilibrado';
  const chatPrefs = { ...DEFAULT_CHAT_PREFS, ...(user?.preferences?.chatPreferences || {}) };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: SCROLL_PADDING_BOTTOM }}
    >
      <Text style={styles.sectionTitle}>{TEXTS.PREFERENCES}</Text>
      <Text style={styles.personalizationIntro}>{TEXTS.PERSONALIZATION_INTRO}</Text>
      <View style={styles.item}>
        <MaterialCommunityIcons name="bell-ring" size={ICON_SIZE} color={COLORS.PRIMARY} />
        <View style={styles.itemTextContainer}>
          <Text style={styles.itemText}>Notificaciones</Text>
          <Text style={styles.itemSubtext}>Alertas sobre crisis y seguimientos</Text>
        </View>
        <Switch
          value={pushNotificationsEnabled}
          onValueChange={onTogglePushNotifications}
          thumbColor={pushNotificationsEnabled ? COLORS.PRIMARY : COLORS.SWITCH_DISABLED}
          accessibilityLabel="Activar o desactivar notificaciones"
        />
      </View>
      {__DEV__ && pushNotificationsEnabled && (
        <View style={styles.testButtonsContainer}>
          <Text style={styles.testSectionTitle}>Pruebas (Solo Desarrollo)</Text>
          <TouchableOpacity style={styles.testButton} onPress={() => onTestNotification('TEST_NOTIFICATION_WARNING')}>
            <Text style={styles.testButtonText}>Probar WARNING</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.testButton} onPress={() => onTestNotification('TEST_NOTIFICATION_MEDIUM')}>
            <Text style={styles.testButtonText}>Probar MEDIUM</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.testButton} onPress={() => onTestNotification('TEST_NOTIFICATION_FOLLOWUP')}>
            <Text style={styles.testButtonText}>Probar Seguimiento</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.item}>
        <MaterialCommunityIcons name="robot" size={ICON_SIZE} color={COLORS.PRIMARY} />
        <View style={styles.itemTextContainer}>
          <Text style={styles.itemText}>Personalización de Respuesta de Anto</Text>
          <Text style={styles.itemSubtext}>{TEXTS.RESPONSE_STYLE_EXPLAINER}</Text>
        </View>
        <TouchableOpacity onPress={onCycleResponseStyle} accessibilityLabel="Cambiar estilo de respuesta">
          <Text style={styles.languageText}>{responseStyleLabel}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.sectionTitle}>{TEXTS.CHAT_TONE_TITLE}</Text>
      <Text style={styles.chatToneIntro}>{TEXTS.CHAT_TONE_SUB}</Text>
      <View style={styles.item}>
        <MaterialCommunityIcons name="text-short" size={ICON_SIZE} color={COLORS.PRIMARY} />
        <View style={styles.itemTextContainer}>
          <Text style={styles.itemText}>{TEXTS.CHAT_PREF_LESS_VALIDATION}</Text>
          <Text style={styles.itemSubtext}>{TEXTS.CHAT_PREF_LESS_VALIDATION_DESC}</Text>
        </View>
        <Switch
          value={chatPrefs.reduceStockEmpathy}
          onValueChange={(v) => onChatPreferenceChange('reduceStockEmpathy', v)}
          thumbColor={chatPrefs.reduceStockEmpathy ? COLORS.PRIMARY : COLORS.SWITCH_DISABLED}
          accessibilityLabel={TEXTS.CHAT_PREF_LESS_VALIDATION}
        />
      </View>
      <View style={styles.item}>
        <MaterialCommunityIcons name="close-circle-outline" size={ICON_SIZE} color={COLORS.PRIMARY} />
        <View style={styles.itemTextContainer}>
          <Text style={styles.itemText}>{TEXTS.CHAT_PREF_NO_APOLOGY}</Text>
          <Text style={styles.itemSubtext}>{TEXTS.CHAT_PREF_NO_APOLOGY_DESC}</Text>
        </View>
        <Switch
          value={chatPrefs.avoidApologyOpenings}
          onValueChange={(v) => onChatPreferenceChange('avoidApologyOpenings', v)}
          thumbColor={chatPrefs.avoidApologyOpenings ? COLORS.PRIMARY : COLORS.SWITCH_DISABLED}
          accessibilityLabel={TEXTS.CHAT_PREF_NO_APOLOGY}
        />
      </View>
      <View style={styles.item}>
        <MaterialCommunityIcons name="comment-question" size={ICON_SIZE} color={COLORS.PRIMARY} />
        <View style={styles.itemTextContainer}>
          <Text style={styles.itemText}>{TEXTS.CHAT_PREF_MORE_QUESTIONS}</Text>
          <Text style={styles.itemSubtext}>{TEXTS.CHAT_PREF_MORE_QUESTIONS_DESC}</Text>
        </View>
        <Switch
          value={chatPrefs.preferQuestions}
          onValueChange={(v) => onChatPreferenceChange('preferQuestions', v)}
          thumbColor={chatPrefs.preferQuestions ? COLORS.PRIMARY : COLORS.SWITCH_DISABLED}
          accessibilityLabel={TEXTS.CHAT_PREF_MORE_QUESTIONS}
        />
      </View>
      <TouchableOpacity
        style={styles.item}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate('TherapeuticTechniques');
        }}
        accessibilityLabel={TEXTS.THERAPEUTIC_TECHNIQUES}
      >
        <MaterialCommunityIcons name="book-open-variant" size={ICON_SIZE} color={COLORS.PRIMARY} />
        <View style={styles.itemContent}>
          <Text style={styles.itemText}>{TEXTS.THERAPEUTIC_TECHNIQUES}</Text>
          <Text style={styles.itemSubtext}>{TEXTS.THERAPEUTIC_TECHNIQUES_DESC}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.ACCENT} />
      </TouchableOpacity>
      <View style={styles.separator} />
      <Text style={styles.sectionTitle}>Suscripción</Text>
      <TouchableOpacity
        style={styles.item}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate('Subscription');
        }}
        accessibilityLabel={TEXTS.SUBSCRIPTION}
      >
        <MaterialCommunityIcons name="crown" size={ICON_SIZE} color={COLORS.PRIMARY} />
        <View style={styles.itemContent}>
          <Text style={styles.itemText}>{TEXTS.SUBSCRIPTION}</Text>
          <Text style={styles.itemSubtext}>{TEXTS.SUBSCRIPTION_DESC}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.ACCENT} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.item}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate('TransactionHistory');
        }}
        accessibilityLabel={TEXTS.TRANSACTION_HISTORY}
      >
        <MaterialCommunityIcons name="receipt" size={ICON_SIZE} color={COLORS.PRIMARY} />
        <View style={styles.itemContent}>
          <Text style={styles.itemText}>{TEXTS.TRANSACTION_HISTORY}</Text>
          <Text style={styles.itemSubtext}>{TEXTS.TRANSACTION_HISTORY_DESC}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.ACCENT} />
      </TouchableOpacity>
      <View style={styles.separator} />
      <Text style={styles.sectionTitle}>{TEXTS.ACCOUNT}</Text>
      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate(NAVIGATION_ROUTES.CHANGE_PASSWORD)}
        accessibilityLabel="Cambiar contraseña"
        testID="button-change-password"
      >
        <MaterialCommunityIcons name="lock-reset" size={ICON_SIZE} color={COLORS.PRIMARY} />
        <Text style={styles.itemText}>{TEXTS.CHANGE_PASSWORD}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.item} onPress={onShowLogoutModal} accessibilityLabel="Cerrar sesión" testID="button-logout">
        <MaterialCommunityIcons name="logout" size={ICON_SIZE} color={COLORS.ERROR} />
        <Text style={[styles.itemText, { color: COLORS.ERROR }]}>{TEXTS.LOGOUT}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.item}
        onPress={onShowDeleteModal}
        accessibilityLabel="Eliminar cuenta"
        testID="button-delete-account"
      >
        <MaterialCommunityIcons name="delete" size={ICON_SIZE} color={COLORS.ERROR} />
        <Text style={[styles.itemText, { color: COLORS.ERROR }]}>{TEXTS.DELETE_ACCOUNT}</Text>
      </TouchableOpacity>
      <View style={styles.separator} />
      <Text style={styles.sectionTitle}>{TEXTS.SUPPORT}</Text>
      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate(NAVIGATION_ROUTES.FAQ)}
        accessibilityLabel="Preguntas frecuentes"
        testID="button-faq"
      >
        <MaterialCommunityIcons name="help-circle" size={ICON_SIZE} color={COLORS.PRIMARY} />
        <Text style={styles.itemText}>{TEXTS.FAQ}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate(NAVIGATION_ROUTES.AI_PRIVACY)}
        accessibilityLabel={TEXTS.AI_PRIVACY}
        testID="button-ai-privacy"
      >
        <MaterialCommunityIcons name="shield-account" size={ICON_SIZE} color={COLORS.PRIMARY} />
        <View style={styles.itemContent}>
          <Text style={styles.itemText}>{TEXTS.AI_PRIVACY}</Text>
          <Text style={styles.itemSubtext}>{TEXTS.AI_PRIVACY_DESC}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.ACCENT} />
      </TouchableOpacity>
      <View style={styles.separator} />
      <Text style={styles.sectionTitle}>{TEXTS.ABOUT}</Text>
      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate(NAVIGATION_ROUTES.ABOUT)}
        accessibilityLabel="Información de la aplicación"
        testID="button-about"
      >
        <MaterialCommunityIcons name="information" size={ICON_SIZE} color={COLORS.PRIMARY} />
        <Text style={styles.itemText}>{TEXTS.APP_INFO}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND, padding: 16 },
  sectionTitle: {
    color: COLORS.ACCENT,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 8,
  },
  chatToneIntro: {
    color: COLORS.ACCENT,
    fontSize: 13,
    opacity: 0.75,
    marginBottom: 8,
    marginTop: -4,
  },
  personalizationIntro: {
    color: COLORS.ACCENT,
    fontSize: 13,
    lineHeight: 19,
    opacity: 0.88,
    marginBottom: 14,
    marginTop: -4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.ITEM_BACKGROUND,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.ITEM_BORDER,
  },
  itemText: { flex: 1, marginLeft: 16, fontSize: 16, color: COLORS.WHITE },
  itemTextContainer: { flex: 1, marginLeft: 16 },
  itemSubtext: { fontSize: 12, color: COLORS.ACCENT, marginTop: 4, opacity: 0.7 },
  itemContent: { flex: 1, marginLeft: 16 },
  languageText: { color: COLORS.ACCENT, fontSize: 16 },
  separator: { height: 1, backgroundColor: COLORS.ITEM_BORDER, marginVertical: 16 },
  testButtonsContainer: {
    backgroundColor: 'rgba(163, 184, 232, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
    marginLeft: 56,
  },
  testSectionTitle: { color: COLORS.ACCENT, fontSize: 14, fontWeight: '600', marginBottom: 12 },
  testButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  testButtonText: { color: COLORS.WHITE, fontSize: 14, fontWeight: '600' },
});
