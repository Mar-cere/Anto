/**
 * Indicador de progreso del marco TCC lite in-chat (#201 MVP).
 */
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { SPACING } from '../../constants/ui';
import { getFocusTheme } from '../../styles/focusCardTheme';

const STEP_KEYS = ['capture_thought', 'check_evidence', 'build_alternative', 'wrap_up'];

export default function TccLiteProgressStrip({ tccLite, style }) {
  const { colors, resolvedScheme } = useTheme();
  const translated = useSectionTranslations('CHAT');
  const t = useMemo(() => getFocusTheme(colors, resolvedScheme), [colors, resolvedScheme]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          marginHorizontal: SPACING.SCREEN_EDGE_INSET,
          marginBottom: SPACING.sm,
        },
        panel: {
          ...t.FOCUS_PANEL,
          padding: SPACING.md,
          gap: SPACING.sm,
        },
        kicker: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color: t.FOCUS_KICKER_COLOR,
        },
        stepRow: {
          flexDirection: 'row',
          gap: 6,
          flexWrap: 'wrap',
        },
        stepChip: {
          paddingVertical: 4,
          paddingHorizontal: 8,
          borderRadius: 999,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_BORDER_SUBTLE,
        },
        stepChipActive: {
          backgroundColor: colors.accentLineSoft,
          borderColor: colors.primary,
        },
        stepText: {
          fontSize: 11,
          fontWeight: '600',
          color: t.FOCUS_META,
        },
        stepTextActive: {
          color: colors.primary,
        },
        meta: {
          fontSize: 12,
          lineHeight: 17,
          color: t.FOCUS_META,
        },
      }),
    [colors, t],
  );

  if (!tccLite?.active) return null;

  const kicker = tccLite.kicker || translated?.TCC_LITE_KICKER || 'Marco TCC';
  const stepLabels = {
    capture_thought: translated?.TCC_LITE_STEP_THOUGHT || 'Pensamiento',
    check_evidence: translated?.TCC_LITE_STEP_EVIDENCE || 'Evidencia',
    build_alternative: translated?.TCC_LITE_STEP_ALTERNATIVE || 'Alternativa',
    wrap_up: translated?.TCC_LITE_STEP_WRAP || 'Cierre',
  };

  const activeStep = tccLite.step || 'capture_thought';
  const activeIndex = STEP_KEYS.indexOf(activeStep);

  return (
    <View style={[styles.wrap, style]} accessibilityRole="summary">
      <View style={styles.panel}>
        <Text style={styles.kicker}>{kicker}</Text>
        <View style={styles.stepRow}>
          {STEP_KEYS.map((key, index) => {
            const isActive = key === activeStep;
            const isDone = activeIndex >= 0 && index < activeIndex;
            return (
              <View
                key={key}
                style={[styles.stepChip, (isActive || isDone) && styles.stepChipActive]}
              >
                <Text style={[styles.stepText, (isActive || isDone) && styles.stepTextActive]}>
                  {stepLabels[key]}
                </Text>
              </View>
            );
          })}
        </View>
        {tccLite.stepShort ? (
          <Text style={styles.meta}>
            {tccLite.stepShort}
            {tccLite.distortionLabel ? ` · ${tccLite.distortionLabel}` : ''}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
