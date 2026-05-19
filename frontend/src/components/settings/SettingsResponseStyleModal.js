/**
 * Modal para elegir estilo de respuesta del chat con vista previa por opción.
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
import { useTheme } from '../../context/ThemeContext';
import {
  buildSettingsCOLORS,
  RESPONSE_STYLE_LABELS,
  RESPONSE_STYLE_PREVIEW,
  RESPONSE_STYLES,
  useSettingsTexts,
} from '../../screens/settings/settingsScreenConstants';

function fireHaptics(fn) {
  try {
    const out = fn();
    if (out && typeof out.then === 'function') {
      out.catch(() => {});
    }
  } catch {
    /* dispositivos sin vibración / modo silencioso */
  }
}

export default function SettingsResponseStyleModal({
  visible,
  currentStyle,
  onClose,
  onApply,
}) {
  const TEXTS = useSettingsTexts();
  const insets = useSafeAreaInsets();
  const [submitting, setSubmitting] = useState(false);
  const { colors: palette } = useTheme();
  const COLORS = useMemo(() => buildSettingsCOLORS(palette), [palette]);

  useEffect(() => {
    if (!visible) setSubmitting(false);
  }, [visible]);

  const safeClose = useCallback(() => {
    if (!submitting) onClose?.();
  }, [submitting, onClose]);

  const handleSelect = useCallback(
    async (styleKey) => {
      if (submitting) return;
      if (styleKey === currentStyle) {
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
          ok = (await onApply?.(styleKey)) === true;
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
    [submitting, currentStyle, onApply, onClose],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        modalRoot: {
          flex: 1,
        },
        backdrop: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: COLORS.MODAL_OVERLAY,
        },
        sheetWrap: {
          flex: 1,
          justifyContent: 'flex-end',
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
        },
        sheet: {
          maxHeight: '88%',
          backgroundColor: COLORS.MODAL_BACKGROUND,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: COLORS.ITEM_BORDER,
          paddingTop: 18,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
        },
        sheetHeader: {
          marginBottom: 14,
        },
        sheetTitle: {
          fontSize: TYPOGRAPHY.SUBTITLE,
          fontWeight: '600',
          color: palette.text,
          marginBottom: 6,
        },
        sheetSub: {
          fontSize: TYPOGRAPHY.SMALL,
          lineHeight: 18,
          color: palette.textSecondary,
        },
        list: {
          maxHeight: 440,
        },
        optionRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          paddingVertical: 12,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          marginBottom: 8,
          borderRadius: 14,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: palette.border,
          backgroundColor: palette.chromeListRow,
        },
        optionRowSelected: {
          borderColor: palette.accentLine,
          backgroundColor: palette.accentLineSoft,
        },
        radioOuter: {
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 2,
          borderColor: COLORS.ACCENT,
          marginRight: 12,
          marginTop: 2,
          justifyContent: 'center',
          alignItems: 'center',
        },
        radioInner: {
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: 'transparent',
        },
        radioInnerOn: {
          backgroundColor: COLORS.PRIMARY,
        },
        optionBody: {
          flex: 1,
        },
        optionTitle: {
          fontSize: TYPOGRAPHY.BODY,
          fontWeight: '600',
          color: palette.text,
          marginBottom: 6,
        },
        previewLabel: {
          fontSize: TYPOGRAPHY.SMALL,
          fontWeight: '600',
          color: palette.textSecondary,
          marginBottom: 4,
        },
        previewText: {
          fontSize: TYPOGRAPHY.CAPTION,
          lineHeight: 20,
          color: COLORS.ACCENT,
          opacity: 0.92,
        },
        closeBtn: {
          marginTop: 12,
          marginBottom: 4,
          paddingVertical: 14,
          borderRadius: 12,
          backgroundColor: COLORS.MODAL_BUTTON_CANCEL,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 48,
        },
        closeBtnText: {
          color: palette.text,
          fontSize: TYPOGRAPHY.BODY,
          fontWeight: '600',
        },
      }),
    [COLORS, palette],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType='fade'
      onRequestClose={safeClose}
    >
      <View style={styles.modalRoot}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={submitting ? undefined : safeClose}
          accessibilityRole='button'
          accessibilityLabel={TEXTS.CLOSE}
        />
        <View
          style={[
            styles.sheetWrap,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
          pointerEvents='box-none'
        >
          <View style={styles.sheet} accessibilityViewIsModal>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle} accessibilityRole='header'>
                {TEXTS.RESPONSE_STYLE_MODAL_TITLE}
              </Text>
              <Text style={styles.sheetSub}>
                {TEXTS.RESPONSE_STYLE_MODAL_SUB}
              </Text>
            </View>

            <ScrollView
              style={styles.list}
              keyboardShouldPersistTaps='handled'
              showsVerticalScrollIndicator={false}
            >
              {RESPONSE_STYLES.map((key) => {
                const selected = currentStyle === key;
                const preview =
                  TEXTS[`RESPONSE_STYLE_PREVIEW_${key.toUpperCase()}`] ||
                  RESPONSE_STYLE_PREVIEW[key] ||
                  '';
                const title =
                  TEXTS[`RESPONSE_STYLE_LABEL_${key.toUpperCase()}`] ||
                  RESPONSE_STYLE_LABELS[key] ||
                  key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.optionRow,
                      selected && styles.optionRowSelected,
                    ]}
                    onPress={() => handleSelect(key)}
                    disabled={submitting}
                    accessibilityRole='radio'
                    accessibilityState={{ selected, disabled: submitting }}
                    accessibilityLabel={`${title}. ${TEXTS.RESPONSE_STYLE_PREVIEW_LABEL}: ${preview}`}
                  >
                    <View style={styles.radioOuter}>
                      <View
                        style={[
                          styles.radioInner,
                          selected && styles.radioInnerOn,
                        ]}
                      />
                    </View>
                    <View style={styles.optionBody}>
                      <Text style={styles.optionTitle}>{title}</Text>
                      <Text style={styles.previewLabel}>
                        {TEXTS.RESPONSE_STYLE_PREVIEW_LABEL}
                      </Text>
                      <Text style={styles.previewText}>{preview}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={safeClose}
              disabled={submitting}
              accessibilityRole='button'
              accessibilityLabel={TEXTS.CLOSE}
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.PRIMARY} />
              ) : (
                <Text style={styles.closeBtnText}>{TEXTS.CLOSE}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
