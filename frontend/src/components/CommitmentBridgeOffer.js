/**
 * Oferta opcional de guardar como compromiso tras crear tarea/hábito desde chat (#202 v1.1).
 */
import React, { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { SPACING } from '../constants/ui';

function CommitmentBridgeOffer({
  title,
  subtitle,
  saveLabel,
  dismissLabel,
  saving = false,
  onSave,
  onDismiss,
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          marginHorizontal: SPACING.SCREEN_EDGE_INSET,
          marginTop: 12,
          marginBottom: 8,
          padding: 14,
          borderRadius: 12,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          backgroundColor: colors.cardBackground ?? colors.surface,
        },
        title: {
          fontSize: 14,
          fontWeight: '600',
          color: colors.text,
          marginBottom: 4,
        },
        subtitle: {
          fontSize: 12.5,
          color: colors.textSecondary,
          marginBottom: 10,
          lineHeight: 18,
        },
        row: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
        },
        primary: {
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 10,
          backgroundColor: colors.primary,
        },
        primaryText: {
          color: colors.onPrimary ?? '#fff',
          fontSize: 13,
          fontWeight: '600',
        },
        ghost: {
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 10,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        ghostText: {
          color: colors.textSecondary,
          fontSize: 13,
          fontWeight: '600',
        },
      }),
    [colors],
  );

  if (!title) return null;

  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.row}>
        <Pressable
          onPress={onSave}
          disabled={saving}
          style={({ pressed }) => [styles.primary, pressed && { opacity: 0.88 }, saving && { opacity: 0.6 }]}
          accessibilityRole="button"
        >
          <Text style={styles.primaryText}>{saveLabel}</Text>
        </Pressable>
        <Pressable
          onPress={onDismiss}
          disabled={saving}
          style={({ pressed }) => [styles.ghost, pressed && { opacity: 0.88 }]}
          accessibilityRole="button"
        >
          <Text style={styles.ghostText}>{dismissLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default memo(CommitmentBridgeOffer);
