/**
 * Marcador antes → después con delta visual (ánimo BA, SUDS, etc.).
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { SPACING } from '../../constants/ui';
import {
  formatScaleDelta,
  getDeltaTone,
  scaleFillPercent,
} from '../../utils/intensityScaleDisplay';

function ScaleDot({ value, min, max, colors, resolvedScheme, compact }) {
  const fill = scaleFillPercent(value, min, max);
  const display = Number.isFinite(Number(value)) ? Number(value) : '—';

  return (
    <View style={{ alignItems: 'center', minWidth: compact ? 28 : 32 }}>
      <View
        style={{
          minWidth: compact ? 30 : 34,
          paddingHorizontal: 8,
          paddingVertical: compact ? 2 : 3,
          borderRadius: 8,
          backgroundColor:
            resolvedScheme === 'dark' ? 'rgba(91, 141, 255, 0.2)' : 'rgba(91, 141, 255, 0.12)',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.primary,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontSize: compact ? 12 : 13,
            fontWeight: '800',
            color: colors.primary,
          }}
        >
          {display}
        </Text>
      </View>
      {Number.isFinite(Number(value)) ? (
        <View
          style={{
            width: compact ? 28 : 32,
            height: 3,
            borderRadius: 2,
            backgroundColor: colors.accentLineSoft,
            marginTop: 4,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: `${fill}%`,
              height: '100%',
              backgroundColor: colors.primary,
              borderRadius: 2,
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

export default function IntensityBeforeAfterMarker({
  beforeValue,
  afterValue,
  min = 1,
  max = 10,
  deltaMode = 'higher-is-better',
  deltaLabel,
  compact = false,
  style,
  accessibilityLabel,
}) {
  const { colors, resolvedScheme } = useTheme();
  const before = Number(beforeValue);
  const after = Number(afterValue);
  const delta = (Number.isFinite(after) ? after : 0) - (Number.isFinite(before) ? before : 0);
  const tone = getDeltaTone(delta, deltaMode);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          flexDirection: 'row',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: SPACING.sm,
        },
        flow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: compact ? 4 : 6,
        },
        deltaChip: {
          paddingHorizontal: compact ? 8 : 10,
          paddingVertical: compact ? 3 : 4,
          borderRadius: 8,
          borderWidth: StyleSheet.hairlineWidth,
        },
        deltaText: {
          fontSize: compact ? 11 : 12,
          fontWeight: '800',
        },
        deltaLabel: {
          fontSize: 11,
          fontWeight: '600',
          color: colors.textSecondary,
        },
      }),
    [colors, compact],
  );

  const deltaColors = useMemo(() => {
    if (tone === 'positive') {
      return {
        bg: colors.successSoft ?? 'rgba(76, 175, 80, 0.15)',
        border: colors.successBorder ?? 'rgba(76, 175, 80, 0.4)',
        text: colors.success ?? '#4CAF50',
      };
    }
    if (tone === 'negative') {
      return {
        bg: colors.dangerSoft ?? 'rgba(255, 107, 107, 0.12)',
        border: colors.dangerBorder ?? 'rgba(255, 107, 107, 0.32)',
        text: colors.error ?? '#e74c3c',
      };
    }
    return {
      bg: colors.glassFill,
      border: colors.accentLineSoft,
      text: colors.textSecondary,
    };
  }, [colors, tone]);

  const a11y =
    accessibilityLabel ||
    `De ${beforeValue} a ${afterValue}, cambio ${formatScaleDelta(delta)}`;

  return (
    <View style={[styles.wrap, style]} accessibilityRole="text" accessibilityLabel={a11y}>
      <View style={styles.flow}>
        <ScaleDot
          value={before}
          min={min}
          max={max}
          colors={colors}
          resolvedScheme={resolvedScheme}
          compact={compact}
        />
        <MaterialCommunityIcons
          name="arrow-right"
          size={compact ? 14 : 16}
          color={colors.textSecondary}
        />
        <ScaleDot
          value={after}
          min={min}
          max={max}
          colors={colors}
          resolvedScheme={resolvedScheme}
          compact={compact}
        />
        <View
          style={[
            styles.deltaChip,
            {
              backgroundColor: deltaColors.bg,
              borderColor: deltaColors.border,
            },
          ]}
        >
          <Text style={[styles.deltaText, { color: deltaColors.text }]}>
            {formatScaleDelta(delta)}
          </Text>
        </View>
      </View>
      {deltaLabel ? <Text style={styles.deltaLabel}>{deltaLabel}</Text> : null}
    </View>
  );
}
