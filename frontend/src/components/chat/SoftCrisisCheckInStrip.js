/**
 * Franja de check-in de crisis suave (#19): validación + técnicas de regulación.
 */
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { SPACING } from '../../constants/ui';
import { pickLocalizedDefaults } from '../../utils/localizedFallback';
import { getFocusTheme } from '../../styles/focusCardTheme';

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
  const { colors, resolvedScheme } = useTheme();
  const { language } = useLanguage();
  const translated = useSectionTranslations('CHAT');
  const t = useMemo(() => getFocusTheme(colors, resolvedScheme), [colors, resolvedScheme]);

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
        wrap: {
          marginHorizontal: SPACING.SCREEN_EDGE_INSET,
          marginBottom: SPACING.sm,
        },
        panel: {
          ...t.FOCUS_PANEL,
          padding: SPACING.md,
          gap: SPACING.sm,
        },
        kicker: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color: t.FOCUS_KICKER_COLOR,
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
          color: t.FOCUS_META,
        },
        technique: {
          ...t.FOCUS_INNER_ROW,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_BORDER_SUBTLE,
        },
        techniqueLabel: {
          flex: 1,
          fontSize: 14,
          fontWeight: '600',
          color: colors.text,
          paddingRight: SPACING.sm,
        },
        openBtn: {
          paddingVertical: 6,
          paddingHorizontal: 10,
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
          color: t.FOCUS_META,
        },
        headerRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: SPACING.sm,
        },
        dismissBtn: {
          padding: 4,
        },
      }),
    [colors, t],
  );

  if (!checkIn?.active) return null;

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
              <Ionicons name="close" size={18} color={t.FOCUS_META} />
            </TouchableOpacity>
          ) : null}
        </View>
        {checkIn.validation ? (
          <Text style={styles.validation}>{checkIn.validation}</Text>
        ) : null}
        {checkIn.subtitle ? <Text style={styles.subtitle}>{checkIn.subtitle}</Text> : null}
        {checkIn.techniques.map((technique) => (
          <View key={technique.id} style={styles.technique}>
            <Text style={styles.techniqueLabel}>{technique.label}</Text>
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
