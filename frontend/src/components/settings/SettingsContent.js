/**
 * Contenido scroll de Configuración: sistema, chat, cuenta y suscripción, soporte.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Animated,
  LayoutAnimation,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { SPACING, TYPOGRAPHY } from '../../constants/ui';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import {
  buildSettingsCOLORS,
  ICON_SIZE,
  NAVIGATION_ROUTES,
  RESPONSE_STYLE_LABELS,
  normalizeResponseStyle,
  SCROLL_PADDING_BOTTOM,
  DEFAULT_RESPONSE_STYLE,
  TEXTS,
} from '../../screens/settings/settingsScreenConstants';
import SettingsResponseStyleModal from './SettingsResponseStyleModal';

const DEFAULT_CHAT_PREFS = {
  reduceStockEmpathy: false,
  avoidApologyOpenings: false,
  preferQuestions: false,
};

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/** Opacidad al pulsar filas y chips (retroalimentación táctil uniforme). */
const LIST_PRESS_OPACITY = 0.74;

export default function SettingsContent({
  navigation,
  user,
  expandChatCustomizationRequest = 0,
  pushNotificationsEnabled,
  onTogglePushNotifications,
  onUpdateNotificationPreferences,
  onSetResponseStyle,
  onChatPreferenceChange,
  onShowLogoutModal,
  onShowDeleteModal,
  onTestNotification,
  onSetThemePreference,
}) {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { colors: themePalette, preference, resolvedScheme } = useTheme();
  const COLORS = useMemo(() => buildSettingsCOLORS(themePalette), [themePalette]);
  const INSTAGRAM_URL =
    'https://www.instagram.com/antoapp.es?igsh=YjU3MDB5bTkycjAz&utm_source=qr';
  const currentResponseStyle = normalizeResponseStyle(
    user?.preferences?.responseStyle,
  );
  const responseStyleLabel =
    RESPONSE_STYLE_LABELS[currentResponseStyle] ||
    RESPONSE_STYLE_LABELS[DEFAULT_RESPONSE_STYLE];
  const chatPrefs = {
    ...DEFAULT_CHAT_PREFS,
    ...(user?.preferences?.chatPreferences || {}),
  };

  const [responseStyleModalVisible, setResponseStyleModalVisible] =
    useState(false);
  const [notificationsExpanded, setNotificationsExpanded] = useState(false);
  const [notificationsAdvancedExpanded, setNotificationsAdvancedExpanded] =
    useState(false);
  const [chatCustomizationExpanded, setChatCustomizationExpanded] =
    useState(false);
  const [themePickerVisible, setThemePickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState(null); // 'morning' | 'evening' | null
  const [notificationPrefsSaving, setNotificationPrefsSaving] = useState(false);
  const [notificationPrefsSavedFlash, setNotificationPrefsSavedFlash] =
    useState(false);
  const savedFlashTimerRef = useRef(null);
  const savedOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(savedOpacity, {
      toValue: notificationPrefsSavedFlash ? 1 : 0,
      duration: notificationPrefsSavedFlash ? 220 : 280,
      useNativeDriver: true,
    }).start();
  }, [notificationPrefsSavedFlash, savedOpacity]);

  useEffect(() => {
    return () => {
      if (savedFlashTimerRef.current) clearTimeout(savedFlashTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (expandChatCustomizationRequest <= 0) return;
    setChatCustomizationExpanded(true);
  }, [expandChatCustomizationRequest]);

  const notificationPreferences = useMemo(() => {
    const base = user?.notificationPreferences || {};
    return {
      enabled: base.enabled !== false,
      morning: {
        enabled: base?.morning?.enabled === true,
        hour: typeof base?.morning?.hour === 'number' ? base.morning.hour : 9,
        minute:
          typeof base?.morning?.minute === 'number' ? base.morning.minute : 0,
      },
      evening: {
        enabled: base?.evening?.enabled === true,
        hour: typeof base?.evening?.hour === 'number' ? base.evening.hour : 20,
        minute:
          typeof base?.evening?.minute === 'number' ? base.evening.minute : 0,
      },
      types: {
        dailyReminders: base?.types?.dailyReminders !== false,
        habitReminders: base?.types?.habitReminders !== false,
        taskReminders: base?.types?.taskReminders !== false,
        motivationalMessages: base?.types?.motivationalMessages !== false,
        betweenSessionsMessages: base?.types?.betweenSessionsMessages !== false,
      },
    };
  }, [user]);

  const allNotificationsEnabled = pushNotificationsEnabled;
  const routineControlsEnabled =
    allNotificationsEnabled &&
    notificationPreferences.types.motivationalMessages;
  const prefsControlsLocked = notificationPrefsSaving;

  const persistNotificationPrefs = useCallback(
    async (patch) => {
      if (!onUpdateNotificationPreferences) return false;
      if (savedFlashTimerRef.current) clearTimeout(savedFlashTimerRef.current);
      setNotificationPrefsSavedFlash(false);
      setNotificationPrefsSaving(true);
      let ok = false;
      try {
        ok = (await onUpdateNotificationPreferences(patch)) === true;
        if (ok) {
          setNotificationPrefsSavedFlash(true);
          savedFlashTimerRef.current = setTimeout(() => {
            setNotificationPrefsSavedFlash(false);
          }, 2200);
        }
      } finally {
        setNotificationPrefsSaving(false);
      }
      return ok;
    },
    [onUpdateNotificationPreferences],
  );

  const toggleNotificationsExpanded = useCallback(() => {
    if (prefsControlsLocked) return;
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        240,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity,
      ),
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotificationsExpanded((prev) => {
      if (prev) setNotificationsAdvancedExpanded(false);
      return !prev;
    });
  }, [prefsControlsLocked]);

  const toggleNotificationsAdvancedExpanded = useCallback(() => {
    if (!notificationsExpanded) return;
    if (prefsControlsLocked) return;
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        240,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity,
      ),
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotificationsAdvancedExpanded((v) => !v);
  }, [notificationsExpanded, prefsControlsLocked]);

  const toggleChatCustomizationExpanded = useCallback(() => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        240,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity,
      ),
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setChatCustomizationExpanded((v) => !v);
  }, []);

  const currentThemeLabel = useMemo(() => {
    if (preference === 'dark') return TEXTS.THEME_DARK;
    if (preference === 'system') return TEXTS.THEME_SYSTEM;
    return TEXTS.THEME_LIGHT;
  }, [preference]);

  const openThemePicker = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setThemePickerVisible(true);
  }, []);

  const closeThemePicker = useCallback(() => {
    setThemePickerVisible(false);
  }, []);

  const selectThemePreference = useCallback(
    (key) => {
      onSetThemePreference?.(key);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setThemePickerVisible(false);
    },
    [onSetThemePreference],
  );

  const setType = useCallback(
    async (key, value) => {
      const ok = await persistNotificationPrefs({ types: { [key]: value } });
      if (ok) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [persistNotificationPrefs],
  );

  const setBundleType = useCallback(
    async (keys, value) => {
      const typesPatch = {};
      keys.forEach((k) => {
        typesPatch[k] = value;
      });
      const ok = await persistNotificationPrefs({ types: typesPatch });
      if (ok) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [persistNotificationPrefs],
  );

  const setScheduleEnabled = useCallback(
    async (slot, enabled) => {
      const ok = await persistNotificationPrefs({ [slot]: { enabled } });
      if (ok) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [persistNotificationPrefs],
  );

  const openTimePicker = useCallback(
    (slot) => {
      if (!routineControlsEnabled || prefsControlsLocked) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPickerTarget(slot);
    },
    [routineControlsEnabled, prefsControlsLocked],
  );

  const formatTimeLabel = useCallback((hour, minute) => {
    const d = new Date();
    d.setHours(hour);
    d.setMinutes(minute);
    return d.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const handleTimeChange = useCallback(
    async (event, selectedTime) => {
      // Android cierra el picker al elegir/cancelar; iOS puede mantenerlo.
      if (Platform.OS === 'android') {
        setPickerTarget(null);
      }
      if (!selectedTime || !pickerTarget) return;
      const hour = selectedTime.getHours();
      const minute = selectedTime.getMinutes();
      const ok = await persistNotificationPrefs({
        [pickerTarget]: { hour, minute },
      });
      if (ok) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [persistNotificationPrefs, pickerTarget],
  );

  const handleOpenInstagram = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const canOpen = await Linking.canOpenURL(INSTAGRAM_URL);
      if (!canOpen) {
        showToast({
          message: TEXTS.INSTAGRAM_OPEN_ERROR,
          type: 'warning',
        });
        return;
      }
      await Linking.openURL(INSTAGRAM_URL);
    } catch (error) {
      showToast({ message: TEXTS.LINK_OPEN_ERROR, type: 'default' });
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: COLORS.BACKGROUND,
        },
        scrollContent: {
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingTop: 12,
          paddingBottom: SCROLL_PADDING_BOTTOM,
        },
        settingsBlock: {
          padding: 14,
          marginBottom: 18,
          borderRadius: 18,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: COLORS.ITEM_BORDER,
          backgroundColor: themePalette.settingsSectionSurface,
          shadowColor: themePalette.glassShadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: resolvedScheme === 'dark' ? 0.35 : 0.1,
          shadowRadius: 10,
          elevation: resolvedScheme === 'dark' ? 4 : 2,
        },
        sectionTitle: {
          fontSize: TYPOGRAPHY.SUBTITLE,
          fontWeight: '600',
          color: themePalette.text,
          marginBottom: 10,
          marginTop: 2,
          letterSpacing: 0.2,
        },
        sectionTitleSpaced: {
          marginTop: 22,
          marginBottom: 10,
        },
        sectionIntro: {
          fontSize: TYPOGRAPHY.SMALL,
          lineHeight: 18,
          color: themePalette.textSecondary,
          marginBottom: 14,
          marginTop: -2,
        },
        subsectionTitle: {
          fontSize: TYPOGRAPHY.BODY,
          fontWeight: '600',
          color: themePalette.text,
          marginTop: 18,
          marginBottom: 8,
        },
        /** Tras un aviso o bloque colapsable, menos aire antes del siguiente subtítulo. */
        subsectionTitleTightTop: {
          marginTop: 10,
        },
        sectionHint: {
          fontSize: TYPOGRAPHY.SMALL,
          lineHeight: 18,
          color: themePalette.textSecondary,
          marginBottom: 10,
          marginTop: -4,
        },
        secondaryHint: {
          fontSize: TYPOGRAPHY.SMALL,
          lineHeight: 18,
          color: themePalette.textSecondary,
          marginBottom: 8,
          marginTop: -4,
          paddingHorizontal: 2,
        },
        rowPreviewHint: {
          fontSize: TYPOGRAPHY.SMALL,
          lineHeight: 18,
          color: COLORS.ACCENT,
          opacity: 0.88,
          marginTop: 8,
        },
        rowTrailing: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          flexShrink: 0,
          maxWidth: '38%',
        },
        item: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: COLORS.ITEM_BACKGROUND,
          borderRadius: 12,
          padding: 12,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: COLORS.ITEM_BORDER,
        },
        itemText: {
          flex: 1,
          marginLeft: 16,
          fontSize: TYPOGRAPHY.BODY,
          fontWeight: '500',
          color: themePalette.text,
        },
        /** Título dentro de `itemTextContainer` / `itemContent`: sin margen extra (ya hay gap desde el icono). */
        itemTextNested: {
          fontSize: TYPOGRAPHY.BODY,
          fontWeight: '500',
          color: themePalette.text,
          alignSelf: 'stretch',
        },
        itemTextContainer: { flex: 1, marginLeft: 16, minWidth: 0 },
        itemSubtext: {
          fontSize: TYPOGRAPHY.SMALL,
          color: themePalette.textSecondary,
          marginTop: 4,
          lineHeight: 18,
          alignSelf: 'stretch',
        },
        itemContent: { flex: 1, marginLeft: 16, minWidth: 0 },
        /** Lista tipo ajustes iOS: un borde, filas con separador interno. */
        settingsLinkGroup: {
          borderRadius: 12,
          borderWidth: 1,
          borderColor: COLORS.ITEM_BORDER,
          backgroundColor: COLORS.ITEM_BACKGROUND,
          overflow: 'hidden',
        },
        settingsLinkGroupSpaced: {
          marginTop: 12,
        },
        /** Tras el aviso del chat expandido, separa el grupo de enlaces del panel de tono. */
        settingsLinkGroupChatExpanded: {
          marginBottom: 10,
        },
        settingsLinkRow: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          paddingHorizontal: 12,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: COLORS.ITEM_BORDER,
        },
        settingsLinkRowLast: {
          borderBottomWidth: 0,
        },
        languageText: {
          color: COLORS.PRIMARY,
          fontSize: TYPOGRAPHY.BODY,
          fontWeight: '600',
          flexShrink: 1,
          textAlign: 'right',
        },
        testButtonsContainer: {
          backgroundColor:
            resolvedScheme === 'dark'
              ? 'rgba(255, 255, 255, 0.06)'
              : 'rgba(36, 35, 79, 0.06)',
          borderRadius: 12,
          padding: SPACING.SCREEN_EDGE_INSET,
          marginTop: 8,
          marginBottom: 16,
          marginLeft: 56,
        },
        testSectionTitle: {
          color: COLORS.ACCENT,
          fontSize: 14,
          fontWeight: '600',
          marginBottom: 12,
        },
        testButton: {
          backgroundColor: COLORS.PRIMARY,
          borderRadius: 8,
          padding: 12,
          marginBottom: 8,
          alignItems: 'center',
        },
        testButtonText: { color: COLORS.WHITE, fontSize: 14, fontWeight: '600' },

        notificationsRight: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          flexShrink: 0,
        },
        notificationsStatusSlot: {
          minWidth: 0,
          maxWidth: 88,
          minHeight: 28,
          alignItems: 'center',
          justifyContent: 'center',
        },
        savedChipWrap: {},
        savedChipText: {
          color: COLORS.PRIMARY,
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: 0.3,
        },
        chevronBtn: {
          width: 34,
          height: 34,
          borderRadius: 10,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: themePalette.accentLineSoft,
          marginLeft: 6,
        },
        chevronBtnDisabled: { opacity: 0.45 },
        notificationsExpanded: {
          marginTop: -4,
          marginBottom: 12,
          marginLeft: 56,
          padding: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: COLORS.ITEM_BORDER,
          backgroundColor: themePalette.cardBackground,
        },
        /** Agrupa título, pista y switches de tono dentro de la sección Chat. */
        chatTonePanel: {
          marginTop: 4,
          marginBottom: 8,
          padding: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: COLORS.ITEM_BORDER,
          backgroundColor: themePalette.cardBackground,
        },
        chatCustomizeChevronWrap: {
          flexDirection: 'row',
          alignItems: 'center',
          flexShrink: 0,
        },
        expandedDisclaimerWrap: {
          marginTop: 4,
          marginBottom: 12,
          paddingVertical: 10,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingRight: 10,
          borderRadius: 10,
          borderLeftWidth: 3,
          borderLeftColor: themePalette.accentLine,
          backgroundColor:
            resolvedScheme === 'dark'
              ? 'rgba(30, 131, 211, 0.1)'
              : 'rgba(30, 131, 211, 0.07)',
        },
        subSectionTitle: {
          color: themePalette.textSecondary,
          fontSize: TYPOGRAPHY.SMALL,
          fontWeight: '600',
          marginBottom: 10,
          letterSpacing: 0.2,
        },
        subItem: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 10,
        },
        subSectionToggleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 10,
          gap: 10,
        },
        subSectionToggleLeft: {
          flex: 1,
          minWidth: 0,
          paddingRight: 10,
        },
        subSectionToggleTitle: {
          color: themePalette.text,
          fontSize: 14,
          fontWeight: '600',
          marginBottom: 3,
        },
        subSectionToggleSub: {
          color: themePalette.textSecondary,
          fontSize: 12,
          lineHeight: 16,
        },
        subItemLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          flex: 1,
          paddingRight: 10,
        },
        subItemText: {
          color: themePalette.text,
          fontSize: 14,
          flex: 1,
        },
        subSeparator: {
          height: 1,
          backgroundColor: COLORS.ITEM_BORDER,
          marginVertical: 12,
        },
        timePill: {
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: 999,
          backgroundColor:
            resolvedScheme === 'dark'
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(36, 35, 79, 0.07)',
          borderWidth: 1,
          borderColor: themePalette.border,
        },
        timePillDisabled: { opacity: 0.55 },
        timePillText: { color: COLORS.ACCENT, fontSize: 13, fontWeight: '600' },
        notificationsHint: {
          color: COLORS.ACCENT,
          fontSize: 12,
          opacity: 0.7,
          marginTop: 6,
          lineHeight: 16,
        },
        timeDoneBtn: {
          marginTop: 10,
          alignSelf: 'flex-end',
          backgroundColor: COLORS.PRIMARY,
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 10,
        },
        timeDoneText: { color: COLORS.WHITE, fontWeight: '700' },
        themeModalRoot: {
          flex: 1,
          backgroundColor: COLORS.MODAL_OVERLAY,
        },
        themeModalSheet: {
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingTop: 16,
          backgroundColor: themePalette.modalSurface,
          borderWidth: StyleSheet.hairlineWidth,
          borderBottomWidth: 0,
          borderColor: COLORS.ITEM_BORDER,
        },
        themeModalTitle: {
          fontSize: 17,
          fontWeight: '700',
          color: themePalette.text,
          marginBottom: 8,
        },
        themeModalHint: {
          fontSize: TYPOGRAPHY.SMALL,
          lineHeight: 18,
          color: themePalette.textSecondary,
          marginBottom: 16,
        },
        themeModalOption: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 14,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: COLORS.ITEM_BORDER,
        },
        themeModalOptionLabel: {
          flex: 1,
          fontSize: 16,
          fontWeight: '500',
          color: themePalette.text,
        },
        themeModalClose: {
          marginTop: 16,
          alignSelf: 'center',
          paddingVertical: 12,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
        },
        themeModalCloseText: {
          fontSize: 16,
          fontWeight: '600',
          color: COLORS.PRIMARY,
        },
      }),
    [COLORS, themePalette, resolvedScheme],
  );

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps='handled'
      >
        <View style={styles.settingsBlock}>
          <Text style={styles.sectionTitle} accessibilityRole='header'>
            {TEXTS.SECTION_SYSTEM}
          </Text>
          <Text style={styles.sectionIntro}>{TEXTS.SECTION_SYSTEM_INTRO}</Text>

          <TouchableOpacity activeOpacity={LIST_PRESS_OPACITY}
            style={styles.item}
            onPress={openThemePicker}
            accessibilityRole='button'
            accessibilityLabel={`${TEXTS.APPEARANCE}, ${currentThemeLabel}`}
            accessibilityHint={TEXTS.THEME_HINT}
          >
            <MaterialCommunityIcons
              name='palette-outline'
              size={ICON_SIZE}
              color={COLORS.PRIMARY}
            />
            <View style={styles.itemTextContainer}>
              <Text style={styles.itemTextNested}>{TEXTS.APPEARANCE}</Text>
              <Text style={styles.itemSubtext} numberOfLines={1}>
                {TEXTS.APPEARANCE_ROW_SUB}
              </Text>
            </View>
            <View style={styles.rowTrailing}>
              <Text style={styles.languageText}>{currentThemeLabel}</Text>
              <MaterialCommunityIcons
                name='chevron-right'
                size={22}
                color={COLORS.ACCENT}
              />
            </View>
          </TouchableOpacity>

          <View style={styles.item} accessibilityRole='none'>
            <View accessible={false} importantForAccessibility='no'>
              <MaterialCommunityIcons
                name='bell-ring'
                size={ICON_SIZE}
                color={COLORS.PRIMARY}
              />
            </View>
            <TouchableOpacity activeOpacity={LIST_PRESS_OPACITY}
              style={styles.itemTextContainer}
              onPress={toggleNotificationsExpanded}
              disabled={prefsControlsLocked}
              accessibilityRole='button'
              accessibilityState={{
                expanded: notificationsExpanded,
                disabled: prefsControlsLocked,
              }}
              accessibilityLabel={
                notificationsExpanded
                  ? TEXTS.NOTIFICATIONS_A11Y_EXPANDED
                  : TEXTS.NOTIFICATIONS_A11Y_COLLAPSED
              }
              accessibilityHint={TEXTS.NOTIFICATIONS_A11Y_HINT}
            >
              <Text style={styles.itemTextNested}>{TEXTS.NOTIFICATIONS}</Text>
              <Text style={styles.itemSubtext} numberOfLines={2}>
                {notificationsExpanded
                  ? TEXTS.NOTIFICATIONS_SUB_EXPANDED
                  : TEXTS.NOTIFICATIONS_SUB_COLLAPSED_HINT}
              </Text>
            </TouchableOpacity>
            <View style={styles.notificationsRight}>
              <View style={styles.notificationsStatusSlot}>
                {notificationPrefsSaving ? (
                  <ActivityIndicator
                    size='small'
                    color={COLORS.ACCENT}
                    accessibilityLabel={TEXTS.NOTIFICATIONS_SAVING_A11Y}
                  />
                ) : (
                  <Animated.View
                    style={[styles.savedChipWrap, { opacity: savedOpacity }]}
                    pointerEvents='none'
                    accessibilityElementsHidden
                    importantForAccessibility='no'
                  >
                    <Text style={styles.savedChipText}>
                      {TEXTS.NOTIFICATIONS_SAVED}
                    </Text>
                  </Animated.View>
                )}
              </View>
              <Switch
                value={pushNotificationsEnabled}
                onValueChange={onTogglePushNotifications}
                disabled={prefsControlsLocked}
                thumbColor={
                  pushNotificationsEnabled
                    ? COLORS.PRIMARY
                    : COLORS.SWITCH_DISABLED
                }
                accessibilityLabel={TEXTS.NOTIFICATIONS_A11Y_PUSH_TOGGLE}
              />
              <TouchableOpacity activeOpacity={LIST_PRESS_OPACITY}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={[
                  styles.chevronBtn,
                  prefsControlsLocked && styles.chevronBtnDisabled,
                ]}
                onPress={toggleNotificationsExpanded}
                disabled={prefsControlsLocked}
                accessibilityElementsHidden
                importantForAccessibility='no'
              >
                <MaterialCommunityIcons
                  name={notificationsExpanded ? 'chevron-up' : 'chevron-down'}
                  size={22}
                  color={COLORS.ACCENT}
                />
              </TouchableOpacity>
            </View>
          </View>

          {notificationsExpanded ? (
            <View
              style={styles.notificationsExpanded}
              accessibilityRole='none'
              {...(notificationPrefsSavedFlash
                ? { accessibilityLiveRegion: 'polite' }
                : {})}
            >
              <Text style={styles.subSectionTitle} accessibilityRole='header'>
                {TEXTS.NOTIFICATIONS_TYPES_TITLE}
              </Text>
              <View style={styles.subItem}>
                <Text style={styles.subItemText}>{TEXTS.NOTIFICATIONS_TYPE_DAILY}</Text>
                <Switch
                  value={
                    notificationPreferences.types.dailyReminders &&
                    notificationPreferences.types.motivationalMessages
                  }
                  onValueChange={(v) =>
                    setBundleType(['dailyReminders', 'motivationalMessages'], v)
                  }
                  disabled={!allNotificationsEnabled || prefsControlsLocked}
                  thumbColor={
                    notificationPreferences.types.dailyReminders &&
                    notificationPreferences.types.motivationalMessages
                      ? COLORS.PRIMARY
                      : COLORS.SWITCH_DISABLED
                  }
                  accessibilityLabel={TEXTS.NOTIFICATIONS_TYPE_DAILY}
                  accessibilityState={{
                    disabled: !allNotificationsEnabled || prefsControlsLocked,
                    checked:
                      notificationPreferences.types.dailyReminders &&
                      notificationPreferences.types.motivationalMessages,
                  }}
                />
              </View>
              <View style={styles.subItem}>
                <Text style={styles.subItemText}>{TEXTS.NOTIFICATIONS_TYPE_TASKS}</Text>
                <Switch
                  value={
                    notificationPreferences.types.taskReminders &&
                    notificationPreferences.types.habitReminders
                  }
                  onValueChange={(v) =>
                    setBundleType(['taskReminders', 'habitReminders'], v)
                  }
                  disabled={!allNotificationsEnabled || prefsControlsLocked}
                  thumbColor={
                    notificationPreferences.types.taskReminders &&
                    notificationPreferences.types.habitReminders
                      ? COLORS.PRIMARY
                      : COLORS.SWITCH_DISABLED
                  }
                  accessibilityLabel={TEXTS.NOTIFICATIONS_TYPE_TASKS}
                  accessibilityState={{
                    disabled: !allNotificationsEnabled || prefsControlsLocked,
                    checked:
                      notificationPreferences.types.taskReminders &&
                      notificationPreferences.types.habitReminders,
                  }}
                />
              </View>
              <View style={styles.subItem}>
                <Text style={styles.subItemText}>
                  {TEXTS.NOTIFICATIONS_TYPE_BETWEEN_SESSIONS}
                </Text>
                <Switch
                  value={notificationPreferences.types.betweenSessionsMessages}
                  onValueChange={(v) => setType('betweenSessionsMessages', v)}
                  disabled={!allNotificationsEnabled || prefsControlsLocked}
                  thumbColor={
                    notificationPreferences.types.betweenSessionsMessages
                      ? COLORS.PRIMARY
                      : COLORS.SWITCH_DISABLED
                  }
                  accessibilityLabel={TEXTS.NOTIFICATIONS_TYPE_BETWEEN_SESSIONS}
                  accessibilityState={{
                    disabled: !allNotificationsEnabled || prefsControlsLocked,
                    checked:
                      notificationPreferences.types.betweenSessionsMessages,
                  }}
                />
              </View>

              <View style={styles.subSeparator} />
              <View style={styles.subSectionToggleRow}>
                <TouchableOpacity
                  activeOpacity={LIST_PRESS_OPACITY}
                  style={styles.subSectionToggleLeft}
                  onPress={toggleNotificationsAdvancedExpanded}
                  disabled={prefsControlsLocked}
                  accessibilityRole='button'
                  accessibilityState={{
                    expanded: notificationsAdvancedExpanded,
                    disabled: prefsControlsLocked,
                  }}
                  accessibilityLabel={
                    notificationsAdvancedExpanded
                      ? TEXTS.NOTIFICATIONS_ADVANCED_A11Y_EXPANDED
                      : TEXTS.NOTIFICATIONS_ADVANCED_A11Y_COLLAPSED
                  }
                >
                  <Text style={styles.subSectionToggleTitle}>
                    {TEXTS.NOTIFICATIONS_ADVANCED_TITLE}
                  </Text>
                  <Text style={styles.subSectionToggleSub} numberOfLines={2}>
                    {TEXTS.NOTIFICATIONS_ADVANCED_SUB}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={LIST_PRESS_OPACITY}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={[
                    styles.chevronBtn,
                    prefsControlsLocked && styles.chevronBtnDisabled,
                  ]}
                  onPress={toggleNotificationsAdvancedExpanded}
                  disabled={prefsControlsLocked}
                  accessibilityElementsHidden
                  importantForAccessibility='no'
                >
                  <MaterialCommunityIcons
                    name={
                      notificationsAdvancedExpanded
                        ? 'chevron-up'
                        : 'chevron-down'
                    }
                    size={22}
                    color={COLORS.ACCENT}
                  />
                </TouchableOpacity>
              </View>

              {notificationsAdvancedExpanded ? (
                <>
                  <Text style={styles.subSectionTitle} accessibilityRole='header'>
                    {TEXTS.NOTIFICATIONS_SCHEDULES_TITLE}
                  </Text>
                  <View style={styles.subItem}>
                    <View style={styles.subItemLeft}>
                      <Text style={styles.subItemText}>{TEXTS.NOTIFICATIONS_MORNING}</Text>
                      <TouchableOpacity
                        activeOpacity={LIST_PRESS_OPACITY}
                        style={[
                          styles.timePill,
                          (!routineControlsEnabled || prefsControlsLocked) &&
                            styles.timePillDisabled,
                        ]}
                        onPress={() => openTimePicker('morning')}
                        disabled={!routineControlsEnabled || prefsControlsLocked}
                        accessibilityLabel={`${TEXTS.NOTIFICATIONS_A11Y_MORNING_TIME_PREFIX}, ${formatTimeLabel(notificationPreferences.morning.hour, notificationPreferences.morning.minute)}`}
                        accessibilityRole='button'
                      >
                        <Text style={styles.timePillText}>
                          {formatTimeLabel(
                            notificationPreferences.morning.hour,
                            notificationPreferences.morning.minute,
                          )}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <Switch
                      value={notificationPreferences.morning.enabled}
                      onValueChange={(v) => setScheduleEnabled('morning', v)}
                      disabled={!routineControlsEnabled || prefsControlsLocked}
                      thumbColor={
                        notificationPreferences.morning.enabled
                          ? COLORS.PRIMARY
                          : COLORS.SWITCH_DISABLED
                      }
                      accessibilityLabel={TEXTS.NOTIFICATIONS_A11Y_ENABLE_MORNING}
                      accessibilityState={{
                        disabled: !routineControlsEnabled || prefsControlsLocked,
                        checked: notificationPreferences.morning.enabled,
                      }}
                    />
                  </View>

                  <View style={styles.subItem}>
                    <View style={styles.subItemLeft}>
                      <Text style={styles.subItemText}>{TEXTS.NOTIFICATIONS_EVENING}</Text>
                      <TouchableOpacity
                        activeOpacity={LIST_PRESS_OPACITY}
                        style={[
                          styles.timePill,
                          (!routineControlsEnabled || prefsControlsLocked) &&
                            styles.timePillDisabled,
                        ]}
                        onPress={() => openTimePicker('evening')}
                        disabled={!routineControlsEnabled || prefsControlsLocked}
                        accessibilityLabel={`${TEXTS.NOTIFICATIONS_A11Y_EVENING_TIME_PREFIX}, ${formatTimeLabel(notificationPreferences.evening.hour, notificationPreferences.evening.minute)}`}
                        accessibilityRole='button'
                      >
                        <Text style={styles.timePillText}>
                          {formatTimeLabel(
                            notificationPreferences.evening.hour,
                            notificationPreferences.evening.minute,
                          )}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <Switch
                      value={notificationPreferences.evening.enabled}
                      onValueChange={(v) => setScheduleEnabled('evening', v)}
                      disabled={!routineControlsEnabled || prefsControlsLocked}
                      thumbColor={
                        notificationPreferences.evening.enabled
                          ? COLORS.PRIMARY
                          : COLORS.SWITCH_DISABLED
                      }
                      accessibilityLabel={TEXTS.NOTIFICATIONS_A11Y_ENABLE_EVENING}
                      accessibilityState={{
                        disabled: !routineControlsEnabled || prefsControlsLocked,
                        checked: notificationPreferences.evening.enabled,
                      }}
                    />
                  </View>
                </>
              ) : null}

              {!allNotificationsEnabled ? (
                <Text style={styles.notificationsHint}>
                  {TEXTS.NOTIFICATIONS_HINT_DISABLED}
                </Text>
              ) : !notificationPreferences.types.motivationalMessages ? (
                <Text style={styles.notificationsHint}>
                  {TEXTS.NOTIFICATIONS_HINT_SCHEDULE}
                </Text>
              ) : null}

              {pickerTarget && notificationsAdvancedExpanded ? (
                <DateTimePicker
                  value={(() => {
                    const d = new Date();
                    const slot = notificationPreferences[pickerTarget];
                    d.setHours(slot.hour);
                    d.setMinutes(slot.minute);
                    d.setSeconds(0);
                    d.setMilliseconds(0);
                    return d;
                  })()}
                  mode='time'
                  is24Hour={true}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleTimeChange}
                />
              ) : null}
              {Platform.OS === 'ios' && pickerTarget && notificationsAdvancedExpanded ? (
                <TouchableOpacity activeOpacity={LIST_PRESS_OPACITY}
                  style={styles.timeDoneBtn}
                  onPress={() => setPickerTarget(null)}
                  accessibilityLabel={TEXTS.NOTIFICATIONS_TIME_PICKER_CLOSE_A11Y}
                >
                  <Text style={styles.timeDoneText}>{TEXTS.NOTIFICATIONS_TIME_DONE}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          {__DEV__ && pushNotificationsEnabled && (
            <View style={styles.testButtonsContainer}>
              <Text style={styles.testSectionTitle}>
                {TEXTS.DEV_NOTIFICATIONS_TEST_SECTION}
              </Text>
              <TouchableOpacity activeOpacity={LIST_PRESS_OPACITY}
                style={styles.testButton}
                onPress={() => onTestNotification('TEST_NOTIFICATION_WARNING')}
              >
                <Text style={styles.testButtonText}>{TEXTS.DEV_NOTIFICATIONS_TEST_WARNING}</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={LIST_PRESS_OPACITY}
                style={styles.testButton}
                onPress={() => onTestNotification('TEST_NOTIFICATION_MEDIUM')}
              >
                <Text style={styles.testButtonText}>{TEXTS.DEV_NOTIFICATIONS_TEST_MEDIUM}</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={LIST_PRESS_OPACITY}
                style={styles.testButton}
                onPress={() => onTestNotification('TEST_NOTIFICATION_FOLLOWUP')}
              >
                <Text style={styles.testButtonText}>{TEXTS.DEV_NOTIFICATIONS_TEST_FOLLOWUP}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.settingsBlock}>
          <Text style={styles.sectionTitle} accessibilityRole='header'>
            {TEXTS.SECTION_CHAT}
          </Text>
          <Text style={styles.sectionIntro}>{TEXTS.SECTION_CHAT_INTRO}</Text>

          <View style={styles.item} accessibilityRole='none'>
            <View accessible={false} importantForAccessibility='no'>
              <MaterialCommunityIcons
                name='message-text'
                size={ICON_SIZE}
                color={COLORS.PRIMARY}
              />
            </View>
            <TouchableOpacity activeOpacity={LIST_PRESS_OPACITY}
              style={styles.itemTextContainer}
              onPress={toggleChatCustomizationExpanded}
              accessibilityRole='button'
              accessibilityState={{ expanded: chatCustomizationExpanded }}
              accessibilityLabel={
                chatCustomizationExpanded
                  ? TEXTS.CHAT_CUSTOMIZATION_A11Y_EXPANDED
                  : TEXTS.CHAT_CUSTOMIZATION_A11Y_COLLAPSED
              }
              accessibilityHint={TEXTS.CHAT_CUSTOMIZATION_A11Y_HINT}
            >
              <Text style={styles.itemTextNested}>
                {TEXTS.CHAT_CUSTOMIZATION_TITLE}
              </Text>
              <Text style={styles.itemSubtext} numberOfLines={2}>
                {chatCustomizationExpanded
                  ? TEXTS.CHAT_SUMMARY_EXPANDED_HINT
                  : `${TEXTS.CHAT_SUMMARY_STYLE_PREFIX} ${responseStyleLabel}`}
              </Text>
            </TouchableOpacity>
            <View style={styles.chatCustomizeChevronWrap}>
              <TouchableOpacity activeOpacity={LIST_PRESS_OPACITY}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.chevronBtn}
                onPress={toggleChatCustomizationExpanded}
                accessibilityElementsHidden
                importantForAccessibility='no'
              >
                <MaterialCommunityIcons
                  name={chatCustomizationExpanded ? 'chevron-up' : 'chevron-down'}
                  size={22}
                  color={COLORS.ACCENT}
                />
              </TouchableOpacity>
            </View>
          </View>

          {chatCustomizationExpanded ? (
            <>
              <View style={styles.expandedDisclaimerWrap} accessibilityRole='text'>
                <Text style={[styles.secondaryHint, { marginTop: 0, marginBottom: 0 }]}>
                  {TEXTS.CHAT_EXPANDED_DISCLAIMER}
                </Text>
              </View>
              <View
                style={[
                  styles.settingsLinkGroup,
                  styles.settingsLinkGroupChatExpanded,
                ]}
              >
                <TouchableOpacity activeOpacity={LIST_PRESS_OPACITY}
                  style={styles.settingsLinkRow}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setResponseStyleModalVisible(true);
                  }}
                  accessibilityRole='button'
                  accessibilityLabel={TEXTS.RESPONSE_STYLE_A11Y_LABEL}
                  accessibilityHint={TEXTS.RESPONSE_STYLE_A11Y_HINT}
                >
                  <MaterialCommunityIcons
                    name='robot'
                    size={ICON_SIZE}
                    color={COLORS.PRIMARY}
                  />
                  <View style={styles.itemTextContainer}>
                    <Text style={styles.itemTextNested}>
                      {TEXTS.CHAT_SUBSECTION_RESPONSE_STYLE}
                    </Text>
                    <Text style={styles.itemSubtext} numberOfLines={2}>
                      {TEXTS.RESPONSE_STYLE_ROW_SUB}
                    </Text>
                  </View>
                  <View style={styles.rowTrailing}>
                    <Text style={styles.languageText}>{responseStyleLabel}</Text>
                    <MaterialCommunityIcons
                      name='chevron-right'
                      size={22}
                      color={COLORS.ACCENT}
                    />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={LIST_PRESS_OPACITY}
                  style={[styles.settingsLinkRow, styles.settingsLinkRowLast]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate('TherapeuticTechniques');
                  }}
                  accessibilityLabel={TEXTS.THERAPEUTIC_TECHNIQUES}
                >
                  <MaterialCommunityIcons
                    name='book-open-variant'
                    size={ICON_SIZE}
                    color={COLORS.PRIMARY}
                  />
                  <View style={styles.itemContent}>
                    <Text style={styles.itemTextNested}>
                      {TEXTS.THERAPEUTIC_TECHNIQUES}
                    </Text>
                  </View>
                  <View style={styles.rowTrailing}>
                    <MaterialCommunityIcons
                      name='chevron-right'
                      size={22}
                      color={COLORS.ACCENT}
                    />
                  </View>
                </TouchableOpacity>
              </View>
              <View style={styles.chatTonePanel} accessibilityRole='none'>
                <Text
                  style={[styles.subsectionTitle, { marginTop: 0 }]}
                  accessibilityRole='header'
                >
                  {TEXTS.CHAT_TONE_TITLE}
                </Text>
                <Text style={styles.sectionHint}>{TEXTS.CHAT_TONE_SUB}</Text>
                <View style={styles.item}>
                  <MaterialCommunityIcons
                    name='text-short'
                    size={ICON_SIZE}
                    color={COLORS.PRIMARY}
                  />
                  <View style={styles.itemTextContainer}>
                    <Text style={styles.itemTextNested}>
                      {TEXTS.CHAT_PREF_LESS_VALIDATION}
                    </Text>
                    <Text style={styles.itemSubtext}>
                      {TEXTS.CHAT_PREF_LESS_VALIDATION_DESC}
                    </Text>
                  </View>
                  <Switch
                    value={chatPrefs.reduceStockEmpathy}
                    onValueChange={(v) =>
                      onChatPreferenceChange('reduceStockEmpathy', v)
                    }
                    thumbColor={
                      chatPrefs.reduceStockEmpathy
                        ? COLORS.PRIMARY
                        : COLORS.SWITCH_DISABLED
                    }
                    accessibilityLabel={TEXTS.CHAT_PREF_LESS_VALIDATION}
                  />
                </View>
                <View style={styles.item}>
                  <MaterialCommunityIcons
                    name='close-circle-outline'
                    size={ICON_SIZE}
                    color={COLORS.PRIMARY}
                  />
                  <View style={styles.itemTextContainer}>
                    <Text style={styles.itemTextNested}>
                      {TEXTS.CHAT_PREF_NO_APOLOGY}
                    </Text>
                    <Text style={styles.itemSubtext}>
                      {TEXTS.CHAT_PREF_NO_APOLOGY_DESC}
                    </Text>
                  </View>
                  <Switch
                    value={chatPrefs.avoidApologyOpenings}
                    onValueChange={(v) =>
                      onChatPreferenceChange('avoidApologyOpenings', v)
                    }
                    thumbColor={
                      chatPrefs.avoidApologyOpenings
                        ? COLORS.PRIMARY
                        : COLORS.SWITCH_DISABLED
                    }
                    accessibilityLabel={TEXTS.CHAT_PREF_NO_APOLOGY}
                  />
                </View>
                <View style={styles.item}>
                  <MaterialCommunityIcons
                    name='comment-question'
                    size={ICON_SIZE}
                    color={COLORS.PRIMARY}
                  />
                  <View style={styles.itemTextContainer}>
                    <Text style={styles.itemTextNested}>
                      {TEXTS.CHAT_PREF_MORE_QUESTIONS}
                    </Text>
                    <Text style={styles.itemSubtext}>
                      {TEXTS.CHAT_PREF_MORE_QUESTIONS_DESC}
                    </Text>
                  </View>
                  <Switch
                    value={chatPrefs.preferQuestions}
                    onValueChange={(v) =>
                      onChatPreferenceChange('preferQuestions', v)
                    }
                    thumbColor={
                      chatPrefs.preferQuestions
                        ? COLORS.PRIMARY
                        : COLORS.SWITCH_DISABLED
                    }
                    accessibilityLabel={TEXTS.CHAT_PREF_MORE_QUESTIONS}
                  />
                </View>
                <Text style={styles.secondaryHint} accessibilityRole='text'>
                  {TEXTS.CHAT_TONE_APPLIES_HINT}
                </Text>
              </View>
            </>
          ) : null}
        </View>

        <View style={styles.settingsBlock}>
          <Text style={styles.sectionTitle} accessibilityRole='header'>
            {TEXTS.SECTION_ACCOUNT_AND_PLAN}
          </Text>
          <Text style={styles.sectionIntro}>{TEXTS.SECTION_ACCOUNT_INTRO}</Text>
          <View style={styles.settingsLinkGroup}>
            <TouchableOpacity activeOpacity={LIST_PRESS_OPACITY}
              style={styles.settingsLinkRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('Subscription');
              }}
              accessibilityLabel={TEXTS.SUBSCRIPTION}
            >
              <MaterialCommunityIcons
                name='crown'
                size={ICON_SIZE}
                color={COLORS.PRIMARY}
              />
              <View style={styles.itemContent}>
                <Text style={styles.itemTextNested}>{TEXTS.SUBSCRIPTION}</Text>
              </View>
              <View style={styles.rowTrailing}>
                <MaterialCommunityIcons
                  name='chevron-right'
                  size={22}
                  color={COLORS.ACCENT}
                />
              </View>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={LIST_PRESS_OPACITY}
              style={styles.settingsLinkRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('TransactionHistory');
              }}
              accessibilityLabel={TEXTS.TRANSACTION_HISTORY}
            >
              <MaterialCommunityIcons
                name='receipt'
                size={ICON_SIZE}
                color={COLORS.PRIMARY}
              />
              <View style={styles.itemContent}>
                <Text style={styles.itemTextNested}>{TEXTS.TRANSACTION_HISTORY}</Text>
              </View>
              <View style={styles.rowTrailing}>
                <MaterialCommunityIcons
                  name='chevron-right'
                  size={22}
                  color={COLORS.ACCENT}
                />
              </View>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={LIST_PRESS_OPACITY}
              style={[styles.settingsLinkRow, styles.settingsLinkRowLast]}
              onPress={() =>
                navigation.navigate(NAVIGATION_ROUTES.CHANGE_PASSWORD)
              }
              accessibilityLabel='Cambiar contraseña'
              testID='button-change-password'
            >
              <MaterialCommunityIcons
                name='lock-reset'
                size={ICON_SIZE}
                color={COLORS.PRIMARY}
              />
              <Text style={styles.itemText}>{TEXTS.CHANGE_PASSWORD}</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.settingsLinkGroup, styles.settingsLinkGroupSpaced]}>
            <TouchableOpacity activeOpacity={LIST_PRESS_OPACITY}
              style={styles.settingsLinkRow}
              onPress={onShowLogoutModal}
              accessibilityLabel='Cerrar sesión'
              testID='button-logout'
            >
              <MaterialCommunityIcons
                name='logout'
                size={ICON_SIZE}
                color={COLORS.ERROR}
              />
              <Text style={[styles.itemText, { color: COLORS.ERROR }]}>
                {TEXTS.LOGOUT}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={LIST_PRESS_OPACITY}
              style={[styles.settingsLinkRow, styles.settingsLinkRowLast]}
              onPress={onShowDeleteModal}
              accessibilityLabel='Eliminar cuenta'
              testID='button-delete-account'
            >
              <MaterialCommunityIcons
                name='delete'
                size={ICON_SIZE}
                color={COLORS.ERROR}
              />
              <Text style={[styles.itemText, { color: COLORS.ERROR }]}>
                {TEXTS.DELETE_ACCOUNT}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.settingsBlock}>
          <Text style={styles.sectionTitle} accessibilityRole='header'>
            {TEXTS.SUPPORT}
          </Text>
          <View style={styles.settingsLinkGroup}>
            <TouchableOpacity activeOpacity={LIST_PRESS_OPACITY}
              style={styles.settingsLinkRow}
              onPress={() => navigation.navigate(NAVIGATION_ROUTES.FAQ_ALT)}
              accessibilityLabel='Preguntas frecuentes'
              testID='button-faq'
            >
              <MaterialCommunityIcons
                name='help-circle'
                size={ICON_SIZE}
                color={COLORS.PRIMARY}
              />
              <View style={styles.itemTextContainer}>
                <Text style={styles.itemTextNested}>{TEXTS.FAQ}</Text>
              </View>
              <View style={styles.rowTrailing}>
                <MaterialCommunityIcons
                  name='chevron-right'
                  size={22}
                  color={COLORS.ACCENT}
                />
              </View>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={LIST_PRESS_OPACITY}
              style={styles.settingsLinkRow}
              onPress={handleOpenInstagram}
              accessibilityLabel='Instagram'
              testID='button-instagram'
            >
              <MaterialCommunityIcons
                name='instagram'
                size={ICON_SIZE}
                color={COLORS.PRIMARY}
              />
              <View style={styles.itemTextContainer}>
                <Text style={styles.itemTextNested}>{TEXTS.INSTAGRAM}</Text>
              </View>
              <View style={styles.rowTrailing}>
                <MaterialCommunityIcons
                  name='open-in-new'
                  size={22}
                  color={COLORS.ACCENT}
                />
              </View>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={LIST_PRESS_OPACITY}
              style={[styles.settingsLinkRow, styles.settingsLinkRowLast]}
              onPress={() => navigation.navigate(NAVIGATION_ROUTES.AI_PRIVACY)}
              accessibilityLabel={TEXTS.AI_PRIVACY}
              testID='button-ai-privacy'
            >
              <MaterialCommunityIcons
                name='shield-account'
                size={ICON_SIZE}
                color={COLORS.PRIMARY}
              />
              <View style={styles.itemContent}>
                <Text style={styles.itemTextNested}>{TEXTS.AI_PRIVACY}</Text>
              </View>
              <View style={styles.rowTrailing}>
                <MaterialCommunityIcons
                  name='chevron-right'
                  size={22}
                  color={COLORS.ACCENT}
                />
              </View>
            </TouchableOpacity>
          </View>
          <Text
            style={[styles.sectionTitle, styles.sectionTitleSpaced]}
            accessibilityRole='header'
          >
            {TEXTS.ABOUT}
          </Text>
          <View style={styles.settingsLinkGroup}>
            <TouchableOpacity activeOpacity={LIST_PRESS_OPACITY}
              style={[styles.settingsLinkRow, styles.settingsLinkRowLast]}
              onPress={() => navigation.navigate(NAVIGATION_ROUTES.ABOUT)}
              accessibilityLabel='Información de la aplicación'
              testID='button-about'
            >
              <MaterialCommunityIcons
                name='information'
                size={ICON_SIZE}
                color={COLORS.PRIMARY}
              />
              <View style={styles.itemTextContainer}>
                <Text style={styles.itemTextNested}>{TEXTS.APP_INFO}</Text>
              </View>
              <View style={styles.rowTrailing}>
                <MaterialCommunityIcons
                  name='chevron-right'
                  size={22}
                  color={COLORS.ACCENT}
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <Modal
        visible={themePickerVisible}
        transparent
        animationType='slide'
        onRequestClose={closeThemePicker}
      >
        <View style={styles.themeModalRoot}>
          <TouchableOpacity
            activeOpacity={1}
            style={{ flex: 1 }}
            onPress={closeThemePicker}
            accessibilityRole='button'
            accessibilityLabel={TEXTS.CLOSE}
          />
          <View
            style={[
              styles.themeModalSheet,
              { paddingBottom: 20 + insets.bottom },
            ]}
          >
            <Text style={styles.themeModalTitle}>{TEXTS.THEME_MODAL_TITLE}</Text>
            <Text style={styles.themeModalHint}>{TEXTS.THEME_HINT}</Text>
            {[
              { key: 'light', label: TEXTS.THEME_LIGHT },
              { key: 'dark', label: TEXTS.THEME_DARK },
              { key: 'system', label: TEXTS.THEME_SYSTEM },
            ].map(({ key, label }) => {
              const selected = preference === key;
              return (
                <TouchableOpacity activeOpacity={LIST_PRESS_OPACITY}
                  key={key}
                  style={styles.themeModalOption}
                  onPress={() => selectThemePreference(key)}
                  accessibilityRole='radio'
                  accessibilityState={{ selected }}
                >
                  <Text style={styles.themeModalOptionLabel}>{label}</Text>
                  {selected ? (
                    <MaterialCommunityIcons
                      name='check'
                      size={22}
                      color={COLORS.PRIMARY}
                    />
                  ) : (
                    <View style={{ width: 22 }} />
                  )}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity activeOpacity={LIST_PRESS_OPACITY}
              style={styles.themeModalClose}
              onPress={closeThemePicker}
            >
              <Text style={styles.themeModalCloseText}>{TEXTS.CLOSE}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <SettingsResponseStyleModal
        visible={responseStyleModalVisible}
        currentStyle={currentResponseStyle}
        onClose={() => setResponseStyleModalVisible(false)}
        onApply={onSetResponseStyle ?? (async () => false)}
      />
    </>
  );
}
