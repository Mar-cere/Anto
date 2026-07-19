/**
 * Franja de continuidad TCC en el chat (retomar BA, exposición, etc.).
 */
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { resolveTccContinuityVisual, resolveVisualAccent } from '../../constants/interventionVisuals';
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
    KICKER: 'Retoma tu proceso',
    OPEN: 'Abrir',
    DISMISS_A11Y: 'Ocultar sugerencia',
  },
  en: {
    KICKER: 'Pick up where you left off',
    OPEN: 'Open',
    DISMISS_A11Y: 'Hide suggestion',
  },
};

export default function TccContinuityStrip({ items, onOpen, onDismiss, style }) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const translated = useSectionTranslations('CHAT');

  const TEXTS = useMemo(() => {
    const defaults = pickLocalizedDefaults(language, DEFAULT_TEXTS_BY_LANG);
    return {
      KICKER: translated?.TCC_CONTINUITY_KICKER || defaults.KICKER,
      OPEN: translated?.TCC_CONTINUITY_OPEN || defaults.OPEN,
      DISMISS_A11Y: translated?.TCC_CONTINUITY_DISMISS_A11Y || defaults.DISMISS_A11Y,
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
        item: createChatStripItemStyle(colors),
        itemBody: { flex: 1, paddingRight: SPACING.sm },
        titleRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
        },
        itemTitle: {
          flex: 1,
          fontSize: 14,
          fontWeight: '700',
          color: colors.text,
          lineHeight: 19,
        },
        itemSubtitle: {
          fontSize: 13,
          lineHeight: 18,
          color: colors.textSecondary,
          marginTop: 2,
        },
        itemActions: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
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
      }),
    [colors],
  );

  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.panel}>
        <Text style={styles.kicker}>{TEXTS.KICKER}</Text>
        {items.map((item) => {
          const visual = resolveTccContinuityVisual(item.kind || item.interventionId);
          const { accent, iconBg } = resolveVisualAccent(colors, visual.accentKey);
          const iconWrapStyle = createChatStripIconWrapStyle(colors, visual.accentKey);
          return (
            <View key={item.id} style={styles.item}>
              <View style={styles.itemBody}>
                <View style={styles.titleRow}>
                  <View style={[iconWrapStyle, { backgroundColor: iconBg }]}>
                    <MaterialCommunityIcons
                      name={visual.mciIcon}
                      size={18}
                      color={accent}
                    />
                  </View>
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
          );
        })}
      </View>
    </View>
  );
}
