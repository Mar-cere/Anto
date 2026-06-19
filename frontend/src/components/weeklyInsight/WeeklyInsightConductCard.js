import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function WeeklyInsightConductCard({ title, body, ctaLabel, onPress }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: 18,
          padding: 16,
          marginBottom: 14,
          backgroundColor: colors.primary,
        },
        kicker: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 1,
          color: colors.textOnPrimary,
          opacity: 0.85,
          marginBottom: 6,
        },
        body: {
          fontSize: 15,
          lineHeight: 22,
          color: colors.textOnPrimary,
          marginBottom: 12,
        },
        cta: {
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 999,
          backgroundColor: 'rgba(255,255,255,0.16)',
        },
        ctaText: {
          fontSize: 13,
          fontWeight: '700',
          color: colors.textOnPrimary,
        },
      }),
    [colors],
  );

  if (!body) return null;

  return (
    <View style={styles.card} accessibilityRole="summary">
      <Text style={styles.kicker}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {onPress ? (
        <TouchableOpacity
          style={styles.cta}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            onPress();
          }}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
        >
          <Text style={styles.ctaText}>{ctaLabel}</Text>
          <MaterialCommunityIcons name="chat-outline" size={16} color={colors.textOnPrimary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
