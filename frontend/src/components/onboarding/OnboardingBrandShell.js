import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING } from '../../constants/ui';
import { useTheme } from '../../context/ThemeContext';
import { resolveInsightsHeroGradient } from '../../utils/insightsHeroGradient';
import DashboardBrandBackdrop from '../dashboard/DashboardBrandBackdrop';
import SheetBrandGradient from '../common/SheetBrandGradient';

/**
 * Contenedor visual del onboarding alineado al home/resumen (backdrop + tarjeta con gradiente).
 */
export default function OnboardingBrandShell({ children, footer, scroll = false }) {
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
          flex: scroll ? undefined : 1,
          flexGrow: scroll ? 0 : 1,
          borderRadius: 22,
          overflow: 'hidden',
          borderWidth: dark ? StyleSheet.hairlineWidth : 1,
          borderColor: dark ? colors.glassOutline : 'rgba(36, 35, 79, 0.1)',
          backgroundColor: dark ? colors.chromeCard : colors.surface,
        },
        ambientGlow: {
          position: 'absolute',
          left: '12%',
          right: '12%',
          bottom: -40,
          height: 120,
          borderRadius: 60,
          backgroundColor: dark
            ? 'rgba(68, 215, 251, 0.08)'
            : 'rgba(30, 131, 211, 0.06)',
        },
        inner: {
          flex: scroll ? undefined : 1,
          padding: 20,
        },
        footer: {
          marginTop: 14,
        },
      }),
    [colors, dark, insets.bottom, insets.top, scroll],
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
          {dark ? <View style={styles.ambientGlow} pointerEvents="none" /> : null}
          <View style={styles.inner}>{children}</View>
        </View>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>
    </View>
  );
}
