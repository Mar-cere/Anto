/**
 * Selector de intención de sesión (#72): desahogar, ordenar, técnica o planificar.
 */
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { CHAT_COLORS, SESSION_INTENTION_OPTIONS, TEXTS } from '../../screens/chat/chatScreenConstants';

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(8, 14, 40, 0.92)',
  },
  title: {
    color: CHAT_COLORS.ACCENT,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  chip: {
    width: '48%',
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(163, 184, 232, 0.35)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  chipPressed: {
    opacity: 0.85,
    borderColor: 'rgba(26, 221, 219, 0.55)',
  },
  chipDisabled: {
    opacity: 0.45,
  },
  chipLabel: {
    color: CHAT_COLORS.WHITE,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  chipHint: {
    color: CHAT_COLORS.ACCENT,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 14,
  },
  skip: {
    alignSelf: 'center',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipText: {
    color: CHAT_COLORS.ACCENT,
    fontSize: 12,
    opacity: 0.85,
    textDecorationLine: 'underline',
  },
  loading: {
    alignSelf: 'center',
    marginVertical: 8,
  },
});

export default function SessionIntentionBanner({
  visible,
  submitting,
  onSelect,
  onSkip,
}) {
  if (!visible) return null;

  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <Text style={styles.title}>{TEXTS.SESSION_INTENTION_TITLE}</Text>
      {submitting ? (
        <ActivityIndicator style={styles.loading} color={CHAT_COLORS.ACCENT} />
      ) : (
        <View style={styles.row}>
          {SESSION_INTENTION_OPTIONS.map((opt) => (
            <Pressable
              key={opt.id}
              style={({ pressed }) => [
                styles.chip,
                pressed && styles.chipPressed,
                submitting && styles.chipDisabled,
              ]}
              onPress={() => onSelect(opt.id)}
              disabled={submitting}
              accessibilityRole="button"
              accessibilityLabel={`${opt.label}. ${opt.hint}`}
            >
              <Text style={styles.chipLabel}>{opt.label}</Text>
              <Text style={styles.chipHint}>{opt.hint}</Text>
            </Pressable>
          ))}
        </View>
      )}
      {!submitting && (
        <Pressable style={styles.skip} onPress={onSkip} accessibilityRole="button">
          <Text style={styles.skipText}>{TEXTS.SESSION_INTENTION_SKIP}</Text>
        </Pressable>
      )}
    </View>
  );
}
