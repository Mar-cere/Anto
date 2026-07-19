/**
 * Estilos compartidos para pantallas en screens/techniques (alineados al tema foco).
 */
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { getFocusTheme } from '../../styles/focusCardTheme';
import { lightColors } from '../../styles/themePalettes';
import { SPACING } from '../../constants/ui';

export function createTechniqueScreenStyles(colors, resolvedScheme = 'light') {
  const t = getFocusTheme(colors, resolvedScheme);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
      paddingTop: SPACING.sm,
      paddingBottom: SPACING.FLOATING_NAV_SCROLL_BOTTOM_EXTRA - SPACING.CHIP_INSET,
    },
    introPanel: {
      ...t.FOCUS_PANEL,
      marginBottom: 16,
    },
    introKicker: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 2,
      textTransform: 'uppercase',
      color: t.FOCUS_KICKER_COLOR,
      marginBottom: 10,
    },
    introTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      lineHeight: 26,
    },
    introText: {
      fontSize: 15,
      color: t.FOCUS_META,
      lineHeight: 22,
    },
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: 22,
      padding: SPACING.CARD_INNER_INSET,
      marginBottom: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_BORDER_SUBTLE,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    cardMeta: {
      fontSize: 13,
      color: t.FOCUS_META,
      marginBottom: 10,
    },
    cardBody: {
      fontSize: 15,
      color: t.FOCUS_META,
      lineHeight: 22,
      marginBottom: 14,
    },
    primaryButton: {
      alignSelf: 'flex-start',
      paddingVertical: SPACING.CHIP_INSET_COMPACT,
      paddingHorizontal: SPACING.HERO_INSET,
      borderRadius: 14,
      backgroundColor: colors.accentLineSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_ACCENT_BORDER,
    },
    primaryButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
    },
    stopButton: {
      marginTop: 8,
      paddingVertical: SPACING.CHIP_INSET_COMPACT,
      paddingHorizontal: SPACING.CHIP_INSET,
      borderRadius: 14,
      backgroundColor: colors.dangerSoft ?? 'rgba(255, 107, 107, 0.16)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.dangerBorder ?? 'rgba(255, 107, 107, 0.35)',
      alignItems: 'center',
    },
    stopButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      opacity: 0.92,
    },
    iconTile: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: colors.accentLineSoft,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    rowHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    infoColumn: {
      flex: 1,
      minWidth: 0,
    },
    cardCategory: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: t.FOCUS_KICKER_COLOR,
    },
    cardSelected: {
      borderWidth: 2,
      borderColor: colors.primary,
    },
    activePanel: {
      backgroundColor: colors.cardBackground,
      borderRadius: 22,
      padding: SPACING.HERO_INSET,
      alignItems: 'center',
      alignSelf: 'stretch',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_ACCENT_BORDER,
    },
    timerText: {
      fontSize: 44,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: 8,
    },
    timerLabel: {
      fontSize: 14,
      color: t.FOCUS_META,
    },
    selectedRow: {
      marginTop: 12,
      paddingTop: SPACING.CHIP_INSET,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.FOCUS_BORDER_SUBTLE,
      flexDirection: 'row',
      alignItems: 'center',
    },
    selectedRowText: {
      fontSize: 14,
      color: colors.success,
      marginLeft: 8,
      fontWeight: '600',
    },
    formBlock: {
      marginTop: 8,
    },
    formSectionHeading: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      lineHeight: 24,
    },
    formHint: {
      fontSize: 14,
      color: t.FOCUS_META,
      lineHeight: 20,
      marginBottom: 12,
    },
    textInput: {
      backgroundColor: colors.chromeInput,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_BORDER_SUBTLE,
      padding: SPACING.INPUT_INSET,
      color: colors.text,
      fontSize: 15,
      lineHeight: 22,
      minHeight: 120,
      marginBottom: 14,
    },
    textInputTall: {
      minHeight: 160,
    },
    saveButton: {
      paddingVertical: SPACING.CHIP_INSET,
      paddingHorizontal: SPACING.CHIP_INSET,
      borderRadius: 14,
      backgroundColor: colors.accentLineSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_ACCENT_BORDER,
      alignItems: 'center',
    },
    saveButtonDisabled: {
      opacity: 0.45,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    secondaryButton: {
      flex: 1,
      paddingVertical: SPACING.CHIP_INSET_COMPACT,
      paddingHorizontal: SPACING.CHIP_INSET,
      borderRadius: 14,
      backgroundColor: colors.glassFill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_BORDER_SUBTLE,
      alignItems: 'center',
    },
    secondaryButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: t.FOCUS_KICKER_COLOR,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: SPACING.CHIP_INSET,
      alignItems: 'stretch',
    },
    promptText: {
      fontSize: 14,
      fontWeight: '600',
      color: t.FOCUS_KICKER_COLOR,
      marginBottom: 10,
      lineHeight: 20,
    },
    cardCompleted: {
      borderColor: colors.success,
      opacity: 0.95,
    },
    actionButton: {
      paddingVertical: SPACING.CHIP_INSET_COMPACT,
      paddingHorizontal: SPACING.CHIP_INSET,
      borderRadius: 14,
      backgroundColor: colors.accentLineSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_ACCENT_BORDER,
      alignItems: 'center',
    },
    actionButtonCompleted: {
      backgroundColor: colors.successSoft ?? 'rgba(76, 175, 80, 0.15)',
      borderColor: colors.successBorder ?? 'rgba(76, 175, 80, 0.4)',
    },
    actionButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
    },
    actionButtonTextCompleted: {
      color: colors.success,
    },
    navRow: {
      flexDirection: 'row',
      gap: SPACING.CHIP_INSET,
      alignSelf: 'stretch',
      marginBottom: 16,
    },
    navButton: {
      flex: 1,
      paddingVertical: SPACING.CHIP_INSET,
      paddingHorizontal: SPACING.CHIP_INSET,
      borderRadius: 14,
      backgroundColor: colors.glassFill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_BORDER_SUBTLE,
      alignItems: 'center',
    },
    navButtonDisabled: {
      opacity: 0.45,
    },
    navButtonPrimary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    navButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textOnPrimary,
    },
    navButtonTextMuted: {
      fontSize: 15,
      fontWeight: '600',
      color: t.FOCUS_KICKER_COLOR,
    },
    ctaHero: {
      marginTop: 8,
      paddingVertical: SPACING.HERO_INSET,
      paddingHorizontal: SPACING.HERO_INSET,
      borderRadius: 22,
      backgroundColor: colors.accentLineSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_ACCENT_BORDER,
      alignItems: 'center',
      alignSelf: 'stretch',
    },
    ctaHeroTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginTop: 12,
      textAlign: 'center',
    },
    ctaHeroSub: {
      fontSize: 14,
      color: t.FOCUS_META,
      marginTop: 8,
      textAlign: 'center',
    },
    stepMeta: {
      fontSize: 13,
      color: t.FOCUS_META,
      fontWeight: '600',
      marginBottom: 8,
    },
    stepTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
    },
    stepDescription: {
      fontSize: 15,
      color: t.FOCUS_META,
      lineHeight: 22,
    },
    stepIconLarge: {
      width: 56,
      height: 56,
      borderRadius: 16,
      backgroundColor: colors.accentLineSoft,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    inlineBackRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: SPACING.sm,
    },
    inlineBackLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
    },
    practiceBlock: {
      ...t.FOCUS_PANEL,
      padding: SPACING.CARD_INNER_INSET,
    },
    practiceExample: {
      fontSize: 14,
      color: t.FOCUS_META,
      fontStyle: 'italic',
      textAlign: 'center',
      marginBottom: 20,
      paddingVertical: SPACING.CARD_INNER_INSET,
      paddingHorizontal: SPACING.CARD_INNER_INSET,
      backgroundColor: colors.chromeInput,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_BORDER_SUBTLE,
    },
    listGap: {
      gap: SPACING.HERO_INSET_COMPACT,
    },
  });
}

export function useTechniqueScreenStyles() {
  const { colors, resolvedScheme } = useTheme();
  return useMemo(
    () => createTechniqueScreenStyles(colors, resolvedScheme),
    [colors, resolvedScheme],
  );
}

/** Compatibilidad legacy (tema claro) para pantallas no migradas. */
export const techniqueScreenStyles = createTechniqueScreenStyles(lightColors, 'light');
