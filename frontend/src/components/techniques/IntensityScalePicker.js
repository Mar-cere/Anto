/**
 * Selector unificado de intensidad / ánimo (1–10, SUDS, etc.).
 * Slider discreto con valor visible junto al título; sin chips ni segmentos.
 */
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo, useRef } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { SPACING } from '../../constants/ui';
import { buildScaleValues } from '../../utils/intensityScale';

const DEFAULT_TEXTS = {
  LOW: 'Bajo',
  HIGH: 'Alto',
};

export default function IntensityScalePicker({
  label,
  hint,
  value,
  onChange,
  values: valuesProp,
  min = 1,
  max = 10,
  step = 1,
  lowLabel,
  highLabel,
  accessibilityLabelPrefix,
  style,
}) {
  const { colors, resolvedScheme } = useTheme();
  const translated = useSectionTranslations('TECHNIQUES');
  const lastHapticIndex = useRef(-1);

  const TEXTS = useMemo(
    () => ({
      LOW: translated?.INTENSITY_SCALE_LOW || DEFAULT_TEXTS.LOW,
      HIGH: translated?.INTENSITY_SCALE_HIGH || DEFAULT_TEXTS.HIGH,
    }),
    [translated],
  );

  const scaleValues = useMemo(
    () => buildScaleValues({ values: valuesProp, min, max, step }),
    [valuesProp, min, max, step],
  );

  const selectedIndex = Math.max(0, scaleValues.indexOf(value));
  const resolvedValue = scaleValues[selectedIndex] ?? scaleValues[0];
  const sliderMax = Math.max(0, scaleValues.length - 1);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: { marginTop: SPACING.sm },
        headerRow: {
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: hint ? 4 : 10,
        },
        label: {
          flex: 1,
          fontSize: 15,
          fontWeight: '700',
          color: colors.text,
          lineHeight: 20,
        },
        valuePill: {
          minWidth: 44,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 10,
          backgroundColor:
            resolvedScheme === 'dark' ? 'rgba(91, 141, 255, 0.22)' : 'rgba(91, 141, 255, 0.14)',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.primary,
          alignItems: 'center',
        },
        valueText: {
          fontSize: 18,
          fontWeight: '800',
          color: colors.primary,
        },
        hint: {
          fontSize: 13,
          lineHeight: 18,
          color: colors.textSecondary,
          marginBottom: 10,
        },
        slider: {
          width: '100%',
          height: Platform.OS === 'ios' ? 36 : 40,
        },
        scaleEndsRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: -4,
          paddingHorizontal: 4,
        },
        scaleEndNumber: {
          fontSize: 12,
          fontWeight: '700',
          color: colors.textSecondary,
        },
        anchorsRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 6,
          paddingHorizontal: 2,
        },
        anchorText: {
          fontSize: 12,
          fontWeight: '600',
          color: colors.textSecondary,
        },
      }),
    [colors, resolvedScheme, hint],
  );

  const emitChange = useCallback(
    (index) => {
      const clamped = Math.max(0, Math.min(sliderMax, Math.round(index)));
      const next = scaleValues[clamped];
      if (next === resolvedValue) return;
      if (lastHapticIndex.current !== clamped) {
        lastHapticIndex.current = clamped;
        Haptics.selectionAsync().catch(() => {});
      }
      onChange(next);
    },
    [onChange, resolvedValue, scaleValues, sliderMax],
  );

  const a11yPrefix = accessibilityLabelPrefix || label || 'Intensidad';
  const rangeMin = scaleValues[0];
  const rangeMax = scaleValues[scaleValues.length - 1];

  return (
    <View
      style={[styles.wrap, style]}
      accessibilityRole="adjustable"
      accessibilityLabel={`${a11yPrefix}: ${resolvedValue}`}
      accessibilityValue={{
        min: rangeMin,
        max: rangeMax,
        now: resolvedValue,
        text: `${resolvedValue} de ${rangeMax}`,
      }}
    >
      {label ? (
        <View style={styles.headerRow}>
          <Text style={styles.label}>{label}</Text>
          <View style={styles.valuePill}>
            <Text style={styles.valueText}>{resolvedValue}</Text>
          </View>
        </View>
      ) : (
        <View style={[styles.headerRow, { justifyContent: 'flex-end', marginBottom: 8 }]}>
          <View style={styles.valuePill}>
            <Text style={styles.valueText}>{resolvedValue}</Text>
          </View>
        </View>
      )}

      {hint ? <Text style={styles.hint}>{hint}</Text> : null}

      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={sliderMax}
        step={1}
        value={selectedIndex}
        onValueChange={emitChange}
        onSlidingComplete={(idx) => {
          lastHapticIndex.current = -1;
          emitChange(idx);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.accentLineSoft}
        thumbTintColor={colors.primary}
      />

      <View style={styles.scaleEndsRow}>
        <Text style={styles.scaleEndNumber}>{rangeMin}</Text>
        <Text style={styles.scaleEndNumber}>{rangeMax}</Text>
      </View>

      <View style={styles.anchorsRow}>
        <Text style={styles.anchorText}>{lowLabel || TEXTS.LOW}</Text>
        <Text style={styles.anchorText}>{highLabel || TEXTS.HIGH}</Text>
      </View>
    </View>
  );
}
