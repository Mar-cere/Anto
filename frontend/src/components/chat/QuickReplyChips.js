/**
 * Chips táctiles de respuesta rápida (2–3) bajo el mensaje del asistente.
 */

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CHAT_COLORS, TEXTS } from '../../screens/chat/chatScreenConstants';

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
    paddingHorizontal: 14,
    maxWidth: '100%',
  },
  wrapCompact: {
    marginBottom: 8,
    marginTop: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: CHAT_COLORS.ACCENT,
    opacity: 0.95,
    flex: 1,
  },
  titleCompact: {
    fontSize: 12,
    marginBottom: 0,
  },
  dismissBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingLeft: 8,
  },
  dismissText: {
    fontSize: 12,
    color: CHAT_COLORS.ACCENT,
    opacity: 0.75,
    marginRight: 2,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  chip: {
    marginRight: 8,
    marginBottom: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 221, 219, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(26, 221, 219, 0.35)',
    maxWidth: '100%',
  },
  chipCompact: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  chipText: {
    color: CHAT_COLORS.WHITE,
    fontSize: 14,
    lineHeight: 18,
  },
  chipTextCompact: {
    fontSize: 13,
    lineHeight: 17,
  },
});

export default function QuickReplyChips({ replies, onSelect, compact, onDismiss }) {
  if (!replies?.length) return null;

  const title = compact ? TEXTS.QUICK_REPLIES_TITLE_COMPACT : TEXTS.QUICK_REPLIES_TITLE;

  return (
    <View
      style={[styles.wrap, compact && styles.wrapCompact]}
      accessibilityRole="none"
    >
      <View style={styles.headerRow}>
        <Text
          style={[styles.title, compact && styles.titleCompact]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {onDismiss ? (
          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={() => {
              try {
                Haptics.selectionAsync();
              } catch (_) {}
              onDismiss();
            }}
            accessibilityRole="button"
            accessibilityLabel={TEXTS.QUICK_REPLIES_DISMISS}
          >
            <Text style={styles.dismissText}>{TEXTS.QUICK_REPLIES_DISMISS}</Text>
            <Ionicons name="close-circle-outline" size={18} color={CHAT_COLORS.ACCENT} />
          </TouchableOpacity>
        ) : null}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        keyboardShouldPersistTaps="handled"
      >
        {replies.map((reply) => (
          <TouchableOpacity
            key={reply.id}
            style={[styles.chip, compact && styles.chipCompact]}
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch (_) {}
              onSelect?.(reply.text);
            }}
            accessibilityRole="button"
            accessibilityLabel={reply.label}
            accessibilityHint={TEXTS.QUICK_REPLIES_HINT}
          >
            <Text style={[styles.chipText, compact && styles.chipTextCompact]}>
              {reply.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
