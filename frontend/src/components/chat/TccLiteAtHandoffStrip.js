/**
 * CTA post marco TCC lite: guardar en registro de pensamiento automático.
 */
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { SPACING } from '../../constants/ui';
import { getFocusTheme } from '../../styles/focusCardTheme';

export default function TccLiteAtHandoffStrip({ atHandoff, onOpen, onDismiss, style }) {
  const { colors, resolvedScheme } = useTheme();
  const translated = useSectionTranslations('CHAT');
  const t = useMemo(() => getFocusTheme(colors, resolvedScheme), [colors, resolvedScheme]);

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
        body: {
          fontSize: 13,
          lineHeight: 18,
          color: t.FOCUS_META,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: SPACING.sm,
        },
        openBtn: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: 12,
          backgroundColor: colors.accentLineSoft,
        },
        openText: {
          fontSize: 14,
          fontWeight: '700',
          color: colors.primary,
        },
      }),
    [colors, t],
  );

  if (!atHandoff?.screen) return null;

  const kicker = translated?.TCC_LITE_HANDOFF_KICKER || 'Guarda tu avance';
  const title = translated?.TCC_LITE_HANDOFF_TITLE || 'Registrar pensamiento automático';
  const openLabel = translated?.TCC_LITE_HANDOFF_OPEN || 'Abrir registro';

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.panel}>
        <Text style={styles.kicker}>{kicker}</Text>
        <Text style={styles.body}>{title}</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.openBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              onOpen?.(atHandoff);
            }}
            accessibilityRole="button"
            accessibilityLabel={openLabel}
          >
            <Text style={styles.openText}>{openLabel}</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
          {onDismiss ? (
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                onDismiss();
              }}
              accessibilityRole="button"
              accessibilityLabel={translated?.TCC_LITE_HANDOFF_DISMISS_A11Y || 'Ocultar'}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}
