import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING } from '../../constants/ui';
import { useTheme } from '../../context/ThemeContext';
import { resolveInsightsHeroGradient } from '../../utils/insightsHeroGradient';
import DashboardBrandBackdrop from '../dashboard/DashboardBrandBackdrop';
import SheetBrandGradient from '../common/SheetBrandGradient';

/**
 * Contenedor visual del onboarding: tarjeta a altura completa con CTA integrado.
 */
export default function OnboardingBrandShell({ children, footer }) {
  const { colors, resolvedScheme } = useTheme();
  const dark = resolvedScheme === 'dark';
  const insets = useSafeAreaInsets();
  const heroGradient = useMemo(
    () => resolveInsightsHeroGradient(colors, dark),
    [colors, dark],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: colors.background,
        },
        safe: {
          flex: 1,
          paddingTop: Math.max(insets.top, 12),
          paddingBottom: Math.max(insets.bottom, 12),
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
        },
        card: {
          flex: 1,
          borderRadius: 22,
          overflow: 'hidden',
          borderWidth: dark ? StyleSheet.hairlineWidth : 1,
          borderColor: dark ? colors.glassOutline : 'rgba(36, 35, 79, 0.1)',
          backgroundColor: dark ? colors.chromeCard : colors.surface,
        },
        inner: {
          flex: 1,
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 18,
        },
        body: {
          flex: 1,
          minHeight: 0,
        },
        footer: {
          marginTop: 12,
        },
      }),
    [colors, dark, insets.bottom, insets.top],
  );

  return (
    <View style={styles.root}>
      <DashboardBrandBackdrop />
      <View style={styles.safe}>
        <View style={styles.card}>
          <SheetBrandGradient
            topColor={heroGradient.top}
            bottomColor={heroGradient.bottom}
          />
          <View style={styles.inner}>
            <View style={styles.body}>{children}</View>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </View>
        </View>
      </View>
    </View>
  );
}
