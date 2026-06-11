/**
 * Franja de continuidad TCC en el chat (retomar BA, exposición, etc.).
 */
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { SPACING } from '../../constants/ui';
import { getFocusTheme } from '../../styles/focusCardTheme';

const DEFAULT_TEXTS = {
  KICKER: 'Retoma tu proceso',
  OPEN: 'Abrir',
  DISMISS_A11Y: 'Ocultar sugerencia',
};

export default function TccContinuityStrip({ items, onOpen, onDismiss, style }) {
  const { colors, resolvedScheme } = useTheme();
  const translated = useSectionTranslations('CHAT');
  const t = useMemo(() => getFocusTheme(colors, resolvedScheme), [colors, resolvedScheme]);

  const TEXTS = useMemo(
    () => ({
      KICKER: translated?.TCC_CONTINUITY_KICKER || DEFAULT_TEXTS.KICKER,
      OPEN: translated?.TCC_CONTINUITY_OPEN || DEFAULT_TEXTS.OPEN,
      DISMISS_A11Y: translated?.TCC_CONTINUITY_DISMISS_A11Y || DEFAULT_TEXTS.DISMISS_A11Y,
    }),
    [translated],
  );

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
        item: {
          ...t.FOCUS_INNER_ROW,
          alignItems: 'flex-start',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_BORDER_SUBTLE,
        },
        itemBody: { flex: 1, paddingRight: SPACING.sm },
        itemTitle: {
          fontSize: 14,
          fontWeight: '700',
          color: colors.text,
          lineHeight: 19,
        },
        itemSubtitle: {
          fontSize: 13,
          lineHeight: 18,
          color: t.FOCUS_META,
          marginTop: 2,
        },
        itemActions: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
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
        iconRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginBottom: 2,
        },
        icon: { fontSize: 18 },
      }),
    [colors, t],
  );

  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.panel}>
        <Text style={styles.kicker}>{TEXTS.KICKER}</Text>
        {items.map((item) => (
          <View key={item.id} style={styles.item}>
            <View style={styles.itemBody}>
              <View style={styles.iconRow}>
                {item.icon ? <Text style={styles.icon}>{item.icon}</Text> : null}
                <Text style={styles.itemTitle}>{item.title}</Text>
              </View>
              {item.subtitle ? (
                <Text style={styles.itemSubtitle} numberOfLines={2}>
                  {item.subtitle}
                </Text>
              ) : null}
            </View>
            <View style={styles.itemActions}>
              <TouchableOpacity
                style={styles.openBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  onOpen?.(item);
                }}
                accessibilityRole="button"
                accessibilityLabel={`${TEXTS.OPEN}: ${item.title}`}
              >
                <Text style={styles.openText}>{TEXTS.OPEN}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  onDismiss?.(item);
                }}
                accessibilityRole="button"
                accessibilityLabel={TEXTS.DISMISS_A11Y}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
