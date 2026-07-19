import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, TYPOGRAPHY } from '../../constants/ui';
import { getFocusTheme } from '../../styles/focusCardTheme';
import { lightColors } from '../../styles/themePalettes';

export function createTherapeuticTechniquesStyles(colors, resolvedScheme = 'light') {
  const t = getFocusTheme(colors, resolvedScheme);
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
      paddingTop: 6,
      paddingBottom: SPACING.CHIP_INSET_COMPACT,
      gap: SPACING.CHIP_INSET,
    },
    topBarDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border ?? 'rgba(36, 35, 79, 0.07)',
    },
    topBarTextBlock: {
      flex: 1,
      minWidth: 0,
    },
    subtitle: {
      fontSize: 14,
      color: t.FOCUS_KICKER_COLOR,
      lineHeight: 20,
    },
    statsButtonIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accentLineSoft ?? 'rgba(30, 131, 211, 0.12)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_ACCENT_BORDER,
    },
    emotionToggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      paddingVertical: SPACING.sm,
      paddingLeft: SPACING.sm,
      paddingRight: SPACING.CHIP_INSET,
      borderRadius: 22,
      backgroundColor: colors.cardBackground,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_BORDER_SUBTLE,
      gap: 6,
    },
    emotionToggleRowEmbedded: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      paddingVertical: SPACING.sm,
      paddingLeft: SPACING.sm,
      paddingRight: SPACING.CHIP_INSET,
      borderRadius: 22,
      backgroundColor: colors.cardBackground,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_BORDER_SUBTLE,
      gap: 6,
    },
    sectionEyebrowEmbedded: {
      marginBottom: 10,
      paddingHorizontal: 2,
    },
    topBarEmbedded: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: SPACING.CHIP_INSET,
      gap: SPACING.CHIP_INSET,
    },
    emotionToggleMain: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.CARD_INNER_INSET,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.sm,
      minWidth: 0,
    },
    emotionToggleLabel: {
      flex: 1,
      fontSize: TYPOGRAPHY.CAPTION,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    emotionToggleValue: {
      fontSize: TYPOGRAPHY.CAPTION,
      color: colors.text,
      fontWeight: '600',
      maxWidth: '38%',
    },
    clearFilterLink: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.xs,
    },
    emotionFilter: {
      maxHeight: 64,
      marginBottom: 12,
    },
    emotionFilterContent: {
      paddingBottom: SPACING.xs,
      gap: SPACING.sm,
    },
    emotionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.CHIP_INSET_COMPACT,
      paddingVertical: SPACING.sm,
      borderRadius: 14,
      backgroundColor: colors.cardBackground,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_BORDER_SUBTLE,
      gap: 6,
    },
    emotionButtonActive: {
      backgroundColor: colors.primary,
      borderColor: t.FOCUS_ACCENT_BORDER,
    },
    emotionButtonText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '500',
    },
    emotionButtonTextActive: {
      color: colors.textOnPrimary,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
      paddingTop: SPACING.sm,
    },
    listIntro: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: SPACING.CARD_INNER_INSET,
      paddingVertical: SPACING.CHIP_INSET,
      paddingHorizontal: SPACING.CARD_INNER_INSET,
      marginBottom: 12,
      borderRadius: 22,
      backgroundColor: colors.accentLineSoft ?? 'rgba(30, 131, 211, 0.1)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_ACCENT_BORDER,
    },
    listIntroText: {
      flex: 1,
      fontSize: TYPOGRAPHY.CAPTION,
      color: colors.textSecondary,
      lineHeight: 19,
    },
    psychoedCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.CARD_INNER_INSET,
      paddingVertical: SPACING.CHIP_INSET,
      paddingHorizontal: SPACING.CARD_INNER_INSET,
      marginBottom: 14,
      borderRadius: 14,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_BORDER_SUBTLE,
    },
    psychoedCardText: { flex: 1 },
    psychoedCardTitle: {
      fontSize: TYPOGRAPHY.BODY,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2,
    },
    psychoedCardHint: {
      fontSize: TYPOGRAPHY.CAPTION,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    categorySection: {
      marginBottom: 8,
    },
    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'stretch',
      paddingVertical: SPACING.CHIP_INSET,
      paddingRight: SPACING.sm,
      paddingLeft: SPACING.CHIP_INSET,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.FOCUS_BORDER_SUBTLE,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    categoryHeaderCollapsed: {
      paddingVertical: SPACING.CHIP_INSET,
    },
    categoryHeaderInner: {
      flex: 1,
      minWidth: 0,
    },
    categoryHeaderTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: SPACING.sm,
    },
    categoryHeaderMain: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.CARD_INNER_INSET,
      flex: 1,
      minWidth: 0,
    },
    categoryHint: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 16,
      marginTop: 6,
      paddingRight: SPACING.HERO_INSET,
    },
    categoryTitleShort: {
      fontSize: TYPOGRAPHY.BODY,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: 0.2,
    },
    categoryCountBadge: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
      backgroundColor: `${colors.primary}22`,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 3,
      borderRadius: 8,
      overflow: 'hidden',
    },
    categoryCards: {
      paddingTop: SPACING.CHIP_INSET,
    },
    categoryCardsGrouped: {
      marginTop: 8,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: SPACING.HERO_INSET,
    },
    loadingText: {
      marginTop: 15,
      fontSize: TYPOGRAPHY.BODY,
      color: colors.textSecondary,
    },
    errorText: {
      marginTop: 15,
      fontSize: TYPOGRAPHY.BODY,
      color: colors.error,
      textAlign: 'center',
    },
    emptyText: {
      marginTop: 15,
      fontSize: TYPOGRAPHY.BODY,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    retryButton: {
      marginTop: 20,
      paddingHorizontal: SPACING.HERO_INSET,
      paddingVertical: SPACING.CHIP_INSET_COMPACT,
      borderRadius: 14,
      backgroundColor: colors.accentLineSoft ?? 'rgba(30, 131, 211, 0.2)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_ACCENT_BORDER,
    },
    retryButtonText: {
      color: colors.primary,
      fontSize: TYPOGRAPHY.BODY,
      fontWeight: '600',
    },
  });
}

export function useTherapeuticTechniquesStyles() {
  const { colors, resolvedScheme } = useTheme();
  return useMemo(
    () => createTherapeuticTechniquesStyles(colors, resolvedScheme),
    [colors, resolvedScheme],
  );
}

/** Compatibilidad legacy (imports estáticos) */
export const styles = createTherapeuticTechniquesStyles(lightColors, 'light');
