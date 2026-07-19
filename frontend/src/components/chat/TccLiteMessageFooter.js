/**
 * Pie de progreso TCC lite dentro de la burbuja del asistente (#201).
 */
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { useTheme } from '../../context/ThemeContext';
import { SPACING } from '../../constants/ui';
import {
  resolveTccLiteBubbleDisplay,
  shouldShowTccLiteBubbleFooter,
  TCC_LITE_STEP_ORDER,
} from '../../utils/chatTccLiteDisplay';

export default function TccLiteMessageFooter({ tccLite }) {
  const { language } = useLanguage();
  const translated = useSectionTranslations('CHAT');
  const { colors } = useTheme();

  const display = useMemo(
    () => resolveTccLiteBubbleDisplay(tccLite, language, translated),
    [tccLite, language, translated],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          marginTop: 10,
          paddingTop: SPACING.CHIP_INSET_COMPACT,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.borderSubtle || 'rgba(0,0,0,0.08)',
          gap: 6,
        },
        progressRow: {
          flexDirection: 'row',
          gap: 4,
        },
        segment: {
          flex: 1,
          height: 3,
          borderRadius: 999,
          backgroundColor: colors.borderSubtle || 'rgba(0,0,0,0.1)',
        },
        segmentDone: {
          backgroundColor: colors.primary,
          opacity: 0.45,
        },
        segmentActive: {
          backgroundColor: colors.primary,
          opacity: 1,
        },
        line: {
          fontSize: 12,
          lineHeight: 16,
          color: colors.textSecondary,
        },
        lineStrong: {
          fontWeight: '600',
          color: colors.textPrimary,
        },
        meta: {
          fontSize: 11,
          lineHeight: 15,
          color: colors.textSecondary,
          opacity: 0.85,
        },
      }),
    [colors],
  );

  if (!shouldShowTccLiteBubbleFooter(tccLite) || !display) return null;

  const { frameLabel, stepShort, progressLabel, stepIndex, stepTotal, distortionLabel } = display;

  return (
    <View
      style={styles.wrap}
      accessibilityRole="text"
      accessibilityLabel={`${frameLabel}. ${progressLabel}. ${stepShort}`}
    >
      <View style={styles.progressRow}>
        {TCC_LITE_STEP_ORDER.slice(0, stepTotal).map((_, index) => {
          const isDone = index < stepIndex;
          const isActive = index === stepIndex;
          return (
            <View
              key={index}
              style={[
                styles.segment,
                isDone && styles.segmentDone,
                isActive && styles.segmentActive,
              ]}
            />
          );
        })}
      </View>
      <Text style={styles.line}>
        <Text style={styles.lineStrong}>{frameLabel}</Text>
        {` · ${progressLabel} · ${stepShort}`}
      </Text>
      {distortionLabel ? <Text style={styles.meta}>{distortionLabel}</Text> : null}
    </View>
  );
}
