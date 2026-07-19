/**
 * Selector unificado de intensidad / ánimo (1–10, SUDS, etc.).
 * Slider discreto en JS puro (sin módulo nativo RNCSlider).
 */
import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { SPACING } from '../../constants/ui';
import { buildScaleValues } from '../../utils/intensityScale';

const THUMB_SIZE = 26;
const THUMB_INSET = THUMB_SIZE / 2;
const TRACK_HEIGHT = 8;
const TRACK_HIT_HEIGHT = 44;

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
  const [trackWidth, setTrackWidth] = useState(0);

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
        wrap: {
          marginTop: SPACING.md,
          marginBottom: SPACING.lg,
        },
        headerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: SPACING.sm,
          marginBottom: hint ? SPACING.xs : SPACING.sm,
          minHeight: 32,
        },
        label: {
          flex: 1,
          flexShrink: 1,
          fontSize: 15,
          fontWeight: '700',
          color: colors.text,
          lineHeight: 20,
        },
        valuePill: {
          flexShrink: 0,
          minWidth: 44,
          paddingHorizontal: SPACING.CHIP_INSET_COMPACT,
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
          marginBottom: SPACING.sm,
        },
        trackHit: {
          height: TRACK_HIT_HEIGHT,
          justifyContent: 'center',
        },
        trackInner: {
          position: 'relative',
          height: TRACK_HIT_HEIGHT,
          justifyContent: 'center',
          paddingHorizontal: THUMB_INSET,
        },
        trackShell: {
          height: TRACK_HEIGHT,
          borderRadius: TRACK_HEIGHT / 2,
          backgroundColor: colors.accentLineSoft,
          overflow: 'hidden',
        },
        trackFill: {
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          backgroundColor: colors.primary,
          borderRadius: TRACK_HEIGHT / 2,
        },
        thumb: {
          position: 'absolute',
          top: (TRACK_HIT_HEIGHT - THUMB_SIZE) / 2,
          width: THUMB_SIZE,
          height: THUMB_SIZE,
          borderRadius: THUMB_SIZE / 2,
          backgroundColor: colors.primary,
          borderWidth: 2,
          borderColor: resolvedScheme === 'dark' ? colors.background : '#fff',
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 3,
          shadowOffset: { width: 0, height: 1 },
          elevation: 2,
        },
        scaleEndsRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: THUMB_INSET + 2,
          marginTop: SPACING.xs,
        },
        scaleEndNumber: {
          fontSize: 12,
          fontWeight: '700',
          color: colors.textSecondary,
        },
        anchorsRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: SPACING.xs,
          paddingHorizontal: THUMB_INSET + 2,
        },
        anchorText: {
          fontSize: 12,
          fontWeight: '600',
          color: colors.textSecondary,
        },
      }),
    [colors, resolvedScheme, hint],
  );

  const indexFromLocationX = useCallback(
    (locationX) => {
      if (!trackWidth || sliderMax <= 0) return 0;
      const usable = Math.max(1, trackWidth - THUMB_SIZE);
      const ratio = Math.max(0, Math.min(1, (locationX - THUMB_INSET - THUMB_SIZE / 2) / usable));
      return Math.round(ratio * sliderMax);
    },
    [sliderMax, trackWidth],
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

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          emitChange(indexFromLocationX(evt.nativeEvent.locationX));
        },
        onPanResponderMove: (evt) => {
          emitChange(indexFromLocationX(evt.nativeEvent.locationX));
        },
        onPanResponderRelease: () => {
          lastHapticIndex.current = -1;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        },
      }),
    [emitChange, indexFromLocationX],
  );

  const fillPercent = sliderMax <= 0 ? 100 : (selectedIndex / sliderMax) * 100;
  const thumbLeft =
    trackWidth > 0 && sliderMax > 0
      ? THUMB_INSET + (selectedIndex / sliderMax) * Math.max(0, trackWidth - THUMB_SIZE)
      : THUMB_INSET;

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
      <View style={styles.headerRow}>
        {label ? <Text style={styles.label}>{label}</Text> : <View style={{ flex: 1 }} />}
        <View style={styles.valuePill}>
          <Text style={styles.valueText}>{resolvedValue}</Text>
        </View>
      </View>

      {hint ? <Text style={styles.hint}>{hint}</Text> : null}

      <View style={styles.trackHit} {...panResponder.panHandlers}>
        <View
          style={styles.trackInner}
          onLayout={(e) => {
            setTrackWidth(e.nativeEvent.layout.width);
          }}
        >
          <View style={styles.trackShell}>
            <View style={[styles.trackFill, { width: `${fillPercent}%` }]} />
          </View>
          <View style={[styles.thumb, { left: thumbLeft }]} pointerEvents="none" />
        </View>
      </View>

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
