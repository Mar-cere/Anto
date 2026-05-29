/**
 * Tarjeta: continuidad del último chat (#4 + #47); nombre de producto distinto del resumen semanal/mensual.
 * Usada en Perfil y en Inicio.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useProfileTexts } from '../screens/profileScreen/profileScreenConstants';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { SPACING } from '../constants/ui';

function formatGeneratedAt(iso, language) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const locale = language === 'en' ? 'en-US' : 'es-ES';
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

export function LastSessionSummaryCard({ summary, onOpenChat, flushWithParentGutter = false }) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const TEXTS = useProfileTexts();
  const text = useMemo(() => {
    if (!summary) return '';
    const s = String(summary.snippet || '').trim();
    if (s) return s;
    return String(summary.bridge || '').trim();
  }, [summary]);
  const dateLabel = formatGeneratedAt(summary?.generatedAt, language);
  const card = useMemo(
    () => ({
      bg: colors.chromeCard,
      border: colors.chromeCardBorder,
      kicker: colors.primary,
      badgeBg: colors.glassFill,
      meta: colors.textSecondary,
    }),
    [colors],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingHorizontal: flushWithParentGutter ? 0 : SPACING.SCREEN_EDGE_INSET,
          paddingBottom: 8,
        },
        card: {
          backgroundColor: card.bg,
          borderRadius: 12,
          padding: SPACING.SCREEN_EDGE_INSET,
          borderWidth: 1,
          borderColor: card.border,
        },
        kickerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        },
        kicker: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 1.2,
          color: card.kicker,
          textTransform: 'uppercase',
        },
        badge: {
          fontSize: 10,
          fontWeight: '600',
          color: card.meta,
          backgroundColor: card.badgeBg,
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 8,
          overflow: 'hidden',
        },
        snippet: {
          fontSize: 15,
          lineHeight: 22,
          color: colors.text,
        },
        meta: {
          fontSize: 11,
          color: card.meta,
          marginTop: 10,
        },
        cta: {
          marginTop: 12,
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 8,
          paddingHorizontal: 14,
          borderRadius: 12,
          backgroundColor: card.badgeBg,
          borderWidth: 1,
          borderColor: card.border,
        },
        ctaText: {
          fontSize: 14,
          fontWeight: '600',
          color: card.kicker,
        },
      }),
    [card, colors.text, flushWithParentGutter],
  );

  if (!summary || !text) return null;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.kickerRow}>
          <Text style={styles.kicker}>{TEXTS.CHAT_CONTINUITY_TITLE}</Text>
          {summary.placeholder ? (
            <Text style={styles.badge}>{TEXTS.CHAT_CONTINUITY_QUICK_BADGE}</Text>
          ) : null}
        </View>
        <Text style={styles.snippet}>{text}</Text>
        {dateLabel ? <Text style={styles.meta}>{dateLabel}</Text> : null}
        {typeof onOpenChat === 'function' ? (
          <TouchableOpacity
            style={styles.cta}
            onPress={onOpenChat}
            accessibilityRole="button"
            accessibilityLabel={TEXTS.CHAT_CONTINUITY_OPEN_CHAT}
          >
            <MaterialCommunityIcons
              name="chat-outline"
              size={18}
              color={card.kicker}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.ctaText}>{TEXTS.CHAT_CONTINUITY_OPEN_CHAT}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}
