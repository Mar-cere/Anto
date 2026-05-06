/**
 * Tarjeta: resumen persistido de la última sesión de chat (#4 + #47).
 * Usada en Perfil y en Inicio.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TEXTS } from '../screens/profileScreen/profileScreenConstants';
import { colors } from '../styles/globalStyles';

const CARD = {
  BG: 'rgba(29, 43, 95, 0.8)',
  BORDER: 'rgba(26, 221, 219, 0.1)',
  KICKER: colors.primary,
  BADGE_BG: 'rgba(29, 43, 95, 0.5)',
  META: '#A3B8E8',
};

function formatGeneratedAt(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  card: {
    backgroundColor: CARD.BG,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: CARD.BORDER,
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
    color: CARD.KICKER,
    textTransform: 'uppercase',
  },
  badge: {
    fontSize: 10,
    fontWeight: '600',
    color: CARD.META,
    backgroundColor: CARD.BADGE_BG,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  snippet: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.white,
  },
  meta: {
    fontSize: 11,
    color: CARD.META,
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
    backgroundColor: CARD.BADGE_BG,
    borderWidth: 1,
    borderColor: CARD.BORDER,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '600',
    color: CARD.KICKER,
  },
});

export function LastSessionSummaryCard({ summary, onOpenChat }) {
  const text = useMemo(() => {
    if (!summary) return '';
    const s = String(summary.snippet || '').trim();
    if (s) return s;
    return String(summary.bridge || '').trim();
  }, [summary]);

  if (!summary || !text) return null;

  const dateLabel = formatGeneratedAt(summary.generatedAt);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.kickerRow}>
          <Text style={styles.kicker}>{TEXTS.LAST_SESSION_TITLE}</Text>
          {summary.placeholder ? (
            <Text style={styles.badge}>{TEXTS.LAST_SESSION_PLACEHOLDER_BADGE}</Text>
          ) : null}
        </View>
        <Text style={styles.snippet}>{text}</Text>
        {dateLabel ? <Text style={styles.meta}>{dateLabel}</Text> : null}
        {typeof onOpenChat === 'function' ? (
          <TouchableOpacity
            style={styles.cta}
            onPress={onOpenChat}
            accessibilityRole="button"
            accessibilityLabel={TEXTS.LAST_SESSION_OPEN_CHAT}
          >
            <MaterialCommunityIcons
              name="chat-outline"
              size={18}
              color={CARD.KICKER}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.ctaText}>{TEXTS.LAST_SESSION_OPEN_CHAT}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}
