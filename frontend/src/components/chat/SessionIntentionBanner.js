/**
 * Selector de intención de sesión (#72): desahogar, ordenar, técnica o planificar.
 */
import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SESSION_INTENTION_OPTIONS, TEXTS } from '../../screens/chat/chatScreenConstants';
import { useTheme } from '../../context/ThemeContext';
import { SPACING } from '../../constants/ui';

export default function SessionIntentionBanner({
  visible,
  submitting,
  onSelect,
  onSkip,
}) {
  if (!visible) return null;
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingTop: 12,
          paddingBottom: 10,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.chromeHeaderBorder,
          backgroundColor: colors.cardBackground,
        },
        kicker: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: colors.primary,
          marginBottom: 8,
          textAlign: 'center',
        },
        title: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '600',
          lineHeight: 21,
          marginBottom: 12,
          textAlign: 'center',
        },
        row: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        },
        chip: {
          width: '48%',
          marginBottom: 10,
          paddingVertical: 12,
          paddingHorizontal: 10,
          borderRadius: 14,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.chromeHeaderBorder,
          backgroundColor: colors.glassFill,
        },
        chipPressed: {
          borderColor: colors.accentLine,
          backgroundColor: colors.accentLineSoft,
        },
        chipDisabled: {
          opacity: 0.45,
        },
        chipLabel: {
          color: colors.text,
          fontSize: 13,
          fontWeight: '600',
          textAlign: 'center',
        },
        chipHint: {
          color: colors.textSecondary,
          fontSize: 11,
          marginTop: 6,
          textAlign: 'center',
          lineHeight: 15,
        },
        skip: {
          alignSelf: 'center',
          marginTop: 10,
          paddingVertical: 8,
          paddingHorizontal: 14,
        },
        skipText: {
          color: colors.primary,
          fontSize: 13,
          fontWeight: '500',
          textDecorationLine: 'underline',
        },
        loading: {
          alignSelf: 'center',
          marginVertical: 10,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <Text style={styles.kicker}>{TEXTS.SESSION_INTENTION_KICKER}</Text>
      <Text style={styles.title}>{TEXTS.SESSION_INTENTION_TITLE}</Text>
      {submitting ? (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
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
        <Pressable
          style={styles.skip}
          onPress={onSkip}
          accessibilityRole="button"
          accessibilityLabel={TEXTS.SESSION_INTENTION_SKIP}
          accessibilityHint="Continúa el chat sin elegir un enfoque"
        >
          <Text style={styles.skipText}>{TEXTS.SESSION_INTENTION_SKIP}</Text>
        </Pressable>
      )}
    </View>
  );
}
