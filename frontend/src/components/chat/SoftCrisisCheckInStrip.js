/**
 * Franja de check-in de crisis suave (#19): validación + técnicas de regulación.
 */
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { SPACING } from '../../constants/ui';
import { pickLocalizedDefaults } from '../../utils/localizedFallback';
import {
  createChatStripIconWrapStyle,
  createChatStripItemStyle,
  createChatStripPanelStyle,
  createChatStripWrapStyle,
} from '../../utils/chatStripStyles';

const DEFAULT_TEXTS_BY_LANG = {
  es: {
    KICKER: 'Pausa breve',
    OPEN: 'Abrir',
    DISMISS_A11Y: 'Ocultar sugerencia de regulación',
  },
  en: {
    KICKER: 'Brief pause',
    OPEN: 'Open',
    DISMISS_A11Y: 'Hide regulation suggestion',
  },
};

function fireLightHaptics() {
  try {
    const out = Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (out && typeof out.then === 'function') out.catch(() => {});
  } catch {
    /* sin motor háptico */
  }
}

export default function SoftCrisisCheckInStrip({
  checkIn,
  onOpenTechnique,
  onDismiss,
  style,
}) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const translated = useSectionTranslations('CHAT');

  const TEXTS = useMemo(() => {
    const defaults = pickLocalizedDefaults(language, DEFAULT_TEXTS_BY_LANG);
    return {
      KICKER: translated?.SOFT_CRISIS_KICKER || defaults.KICKER,
      OPEN: translated?.SOFT_CRISIS_OPEN || defaults.OPEN,
      DISMISS_A11Y: translated?.SOFT_CRISIS_DISMISS_A11Y || defaults.DISMISS_A11Y,
    };
  }, [language, translated]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: createChatStripWrapStyle(),
        panel: createChatStripPanelStyle(colors),
        kicker: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color: colors.primary,
        },
        validation: {
          fontSize: 15,
          fontWeight: '600',
          color: colors.text,
          lineHeight: 21,
        },
        subtitle: {
          fontSize: 13,
          lineHeight: 18,
          color: colors.textSecondary,
        },
        technique: createChatStripItemStyle(colors),
        techniqueLabel: {
          flex: 1,
          fontSize: 14,
          fontWeight: '600',
          color: colors.text,
          paddingRight: SPACING.sm,
        },
        openBtn: {
          paddingVertical: 6,
          paddingHorizontal: SPACING.CHIP_INSET_COMPACT,
          borderRadius: 10,
          backgroundColor: colors.accentLineSoft,
        },
        openText: {
          fontSize: 13,
          fontWeight: '700',
          color: colors.primary,
        },
        footnote: {
          fontSize: 12,
          lineHeight: 17,
          color: colors.textSecondary,
        },
        headerRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: SPACING.sm,
        },
        dismissBtn: {
          padding: SPACING.xs,
        },
        techniqueRow: {
          flexDirection: 'row',
          alignItems: 'center',
          flex: 1,
          minWidth: 0,
        },
      }),
    [colors],
  );

  if (!checkIn?.active) return null;

  const iconWrapStyle = createChatStripIconWrapStyle(colors, 'warning');

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.panel}>
        <View style={styles.headerRow}>
          <Text style={styles.kicker}>{TEXTS.KICKER}</Text>
          {checkIn.dismissible !== false && onDismiss ? (
            <TouchableOpacity
              onPress={() => {
                fireLightHaptics();
                onDismiss();
              }}
              accessibilityRole="button"
              accessibilityLabel={TEXTS.DISMISS_A11Y}
              style={styles.dismissBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
        {checkIn.validation ? (
          <Text style={styles.validation}>{checkIn.validation}</Text>
        ) : null}
        {checkIn.subtitle ? <Text style={styles.subtitle}>{checkIn.subtitle}</Text> : null}
        {checkIn.techniques.map((technique) => (
          <View key={technique.id} style={styles.technique}>
            <View style={styles.techniqueRow}>
              <View style={iconWrapStyle}>
                <MaterialCommunityIcons name="heart-pulse" size={18} color={colors.warning} />
              </View>
              <Text style={styles.techniqueLabel}>{technique.label}</Text>
            </View>
            <TouchableOpacity
              style={styles.openBtn}
              onPress={() => {
                fireLightHaptics();
                onOpenTechnique?.(technique);
              }}
              accessibilityRole="button"
              accessibilityLabel={`${TEXTS.OPEN} ${technique.label}`}
            >
              <Text style={styles.openText}>{TEXTS.OPEN}</Text>
            </TouchableOpacity>
          </View>
        ))}
        {checkIn.footnote ? <Text style={styles.footnote}>{checkIn.footnote}</Text> : null}
      </View>
    </View>
  );
}
