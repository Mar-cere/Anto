/**
 * CTA compacto post marco TCC lite: guardar en registro de pensamiento automático.
 * Solo visible al completar el marco (paso 4).
 */
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { SPACING } from '../../constants/ui';

export default function TccLiteAtHandoffStrip({ atHandoff, onOpen, onDismiss, style }) {
  const { colors } = useTheme();
  const translated = useSectionTranslations('CHAT');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          marginHorizontal: SPACING.SCREEN_EDGE_INSET,
          marginBottom: SPACING.sm,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.sm,
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 12,
          backgroundColor: colors.accentLineSoft,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.borderSubtle || 'rgba(0,0,0,0.06)',
        },
        body: {
          flex: 1,
          fontSize: 13,
          lineHeight: 18,
          color: colors.textSecondary,
        },
        openBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingVertical: 4,
          paddingHorizontal: 2,
        },
        openText: {
          fontSize: 13,
          fontWeight: '700',
          color: colors.primary,
        },
      }),
    [colors],
  );

  if (!atHandoff?.screen) return null;

  const title =
    translated?.TCC_LITE_HANDOFF_TITLE ||
    'Puedes registrar lo que exploraste en el pensamiento automático.';
  const openLabel = translated?.TCC_LITE_HANDOFF_OPEN || 'Abrir registro';

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.row}>
        <Text style={styles.body} numberOfLines={2}>
          {title}
        </Text>
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
          <Ionicons name="arrow-forward" size={14} color={colors.primary} />
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
            <Ionicons name="close" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}
