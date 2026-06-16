/**
 * Modal para elegir país o región (números de emergencia en crisis). Sin GPS.
 */
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING, TYPOGRAPHY } from '../../constants/ui';
import {
  COUNTRY_PREFERENCE_AUTO,
  getSortedEmergencyCountries,
} from '../../constants/emergencyCountries';
import { useTheme } from '../../context/ThemeContext';
import {
  buildSettingsCOLORS,
  useSettingsTexts,
} from '../../screens/settings/settingsScreenConstants';

const LIST_PRESS_OPACITY = 0.74;

function fireHaptics(fn) {
  try {
    const out = fn();
    if (out && typeof out.then === 'function') {
      out.catch(() => {});
    }
  } catch {
    // noop
  }
}

export default function SettingsCountryModal({
  visible,
  currentIso = COUNTRY_PREFERENCE_AUTO,
  language = 'es',
  onClose,
  onApply,
}) {
  const TEXTS = useSettingsTexts();
  const insets = useSafeAreaInsets();
  const [submitting, setSubmitting] = useState(false);
  const { colors: palette } = useTheme();
  const COLORS = useMemo(() => buildSettingsCOLORS(palette), [palette]);
  const countries = useMemo(
    () => getSortedEmergencyCountries(language),
    [language],
  );

  useEffect(() => {
    if (!visible) setSubmitting(false);
  }, [visible]);

  const safeClose = useCallback(() => {
    if (!submitting) onClose?.();
  }, [submitting, onClose]);

  const handleSelect = useCallback(
    async (iso) => {
      if (submitting) return;
      const next = iso || COUNTRY_PREFERENCE_AUTO;
      if (next === (currentIso || COUNTRY_PREFERENCE_AUTO)) {
        fireHaptics(() =>
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        );
        onClose?.();
        return;
      }
      setSubmitting(true);
      try {
        let ok = false;
        try {
          ok = (await onApply?.(next)) === true;
        } catch {
          ok = false;
        }
        if (ok) {
          fireHaptics(() =>
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
          );
          onClose?.();
        }
      } finally {
        setSubmitting(false);
      }
    },
    [submitting, currentIso, onApply, onClose],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: COLORS.MODAL_OVERLAY,
        },
        sheet: {
          backgroundColor: COLORS.MODAL_BACKGROUND,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          paddingHorizontal: SPACING.lg,
          paddingTop: SPACING.lg,
          maxHeight: '82%',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: COLORS.ITEM_BORDER,
        },
        title: {
          fontSize: TYPOGRAPHY.SUBTITLE,
          fontWeight: '700',
          color: palette.text,
          marginBottom: SPACING.xs,
        },
        hint: {
          fontSize: TYPOGRAPHY.SMALL,
          lineHeight: 18,
          color: palette.textSecondary,
          marginBottom: SPACING.md,
        },
        list: {
          maxHeight: 420,
        },
        option: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: SPACING.md,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: COLORS.ITEM_BORDER,
        },
        optionLabel: {
          fontSize: TYPOGRAPHY.BODY,
          color: palette.text,
          flex: 1,
          paddingRight: SPACING.sm,
        },
        optionSub: {
          fontSize: TYPOGRAPHY.SMALL,
          color: palette.textSecondary,
          marginTop: 2,
        },
        close: {
          alignItems: 'center',
          paddingVertical: SPACING.lg,
          marginTop: SPACING.sm,
        },
        closeText: {
          fontSize: TYPOGRAPHY.BODY,
          fontWeight: '600',
          color: COLORS.PRIMARY,
        },
        loading: {
          position: 'absolute',
          right: SPACING.lg,
          top: SPACING.lg,
        },
      }),
    [COLORS, palette],
  );

  const selectedKey = currentIso || COUNTRY_PREFERENCE_AUTO;

  return (
    <Modal
      visible={visible}
      transparent
      animationType='slide'
      onRequestClose={safeClose}
    >
      <View style={styles.root}>
        <TouchableOpacity
          activeOpacity={1}
          style={{ flex: 1 }}
          onPress={safeClose}
          accessibilityRole='button'
          accessibilityLabel={TEXTS.CLOSE}
        />
        <View style={[styles.sheet, { paddingBottom: 20 + insets.bottom }]}>
          {submitting ? (
            <ActivityIndicator
              style={styles.loading}
              color={COLORS.PRIMARY}
              accessibilityLabel={TEXTS.COUNTRY_SAVING_A11Y}
            />
          ) : null}
          <Text style={styles.title}>{TEXTS.COUNTRY_MODAL_TITLE}</Text>
          <Text style={styles.hint}>{TEXTS.COUNTRY_HINT}</Text>
          <ScrollView
            style={styles.list}
            keyboardShouldPersistTaps='handled'
            showsVerticalScrollIndicator
          >
            <TouchableOpacity
              activeOpacity={LIST_PRESS_OPACITY}
              style={styles.option}
              onPress={() => handleSelect(COUNTRY_PREFERENCE_AUTO)}
              accessibilityRole='radio'
              accessibilityState={{
                selected: selectedKey === COUNTRY_PREFERENCE_AUTO,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.optionLabel}>{TEXTS.COUNTRY_AUTO_LABEL}</Text>
                <Text style={styles.optionSub}>{TEXTS.COUNTRY_AUTO_DESC}</Text>
              </View>
              {selectedKey === COUNTRY_PREFERENCE_AUTO ? (
                <Text style={{ color: COLORS.PRIMARY }}>✓</Text>
              ) : (
                <View style={{ width: 16 }} />
              )}
            </TouchableOpacity>
            {countries.map((entry) => {
              const selected = selectedKey === entry.iso;
              const label =
                language === 'en' ? entry.nameEn : entry.nameEs;
              return (
                <TouchableOpacity
                  activeOpacity={LIST_PRESS_OPACITY}
                  key={entry.iso}
                  style={styles.option}
                  onPress={() => handleSelect(entry.iso)}
                  accessibilityRole='radio'
                  accessibilityState={{ selected }}
                >
                  <Text style={styles.optionLabel}>{label}</Text>
                  {selected ? (
                    <Text style={{ color: COLORS.PRIMARY }}>✓</Text>
                  ) : (
                    <View style={{ width: 16 }} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity
            activeOpacity={LIST_PRESS_OPACITY}
            style={styles.close}
            onPress={safeClose}
          >
            <Text style={styles.closeText}>{TEXTS.CLOSE}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
