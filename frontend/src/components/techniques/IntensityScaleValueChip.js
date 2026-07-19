/**
 * Marcador compacto de un valor en escala (1–10, SUDS, etc.) para listas e historial.
 */
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { SPACING } from '../../constants/ui';
import { scaleFillPercent } from '../../utils/intensityScaleDisplay';

export default function IntensityScaleValueChip({
  value,
  min = 1,
  max = 10,
  compact = false,
  showBar = true,
  suffix,
  accessibilityLabel,
  style,
}) {
  const { colors, resolvedScheme } = useTheme();
  const resolved = Number(value);
  const displayValue = Number.isFinite(resolved) ? resolved : '—';
  const fill = scaleFillPercent(resolved, min, max);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: compact ? 6 : 8,
        },
        pill: {
          minWidth: compact ? 32 : 36,
          paddingHorizontal: compact ? SPACING.sm : SPACING.CHIP_INSET_COMPACT,
          paddingVertical: compact ? 3 : 4,
          borderRadius: 8,
          backgroundColor:
            resolvedScheme === 'dark' ? 'rgba(91, 141, 255, 0.2)' : 'rgba(91, 141, 255, 0.12)',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.primary,
          alignItems: 'center',
        },
        value: {
          fontSize: compact ? 12 : 13,
          fontWeight: '800',
          color: colors.primary,
        },
        suffix: {
          fontSize: compact ? 10 : 11,
          fontWeight: '600',
          color: colors.textSecondary,
        },
        barTrack: {
          width: compact ? 40 : 48,
          height: compact ? 4 : 5,
          borderRadius: 3,
          backgroundColor: colors.accentLineSoft,
          overflow: 'hidden',
        },
        barFill: {
          height: '100%',
          borderRadius: 3,
          backgroundColor: colors.primary,
        },
      }),
    [colors, compact, resolvedScheme],
  );

  const a11y =
    accessibilityLabel ||
    (Number.isFinite(resolved)
      ? `Intensidad ${resolved} de ${max}`
      : 'Intensidad no registrada');

  return (
    <View
      style={[styles.row, style]}
      accessibilityRole="text"
      accessibilityLabel={a11y}
    >
      <View style={styles.pill}>
        <Text style={styles.value}>{displayValue}</Text>
      </View>
      {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      {showBar && Number.isFinite(resolved) ? (
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${fill}%` }]} />
        </View>
      ) : null}
    </View>
  );
}
