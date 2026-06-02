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
      paddingBottom: 10,
      gap: 12,
    },
    topBarDivider: {
      height: StyleSheet.hairlineWidth,
      marginHorizontal: SPACING.SCREEN_EDGE_INSET,
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
      marginHorizontal: SPACING.SCREEN_EDGE_INSET,
      marginBottom: 10,
      paddingVertical: 8,
      paddingLeft: 8,
      paddingRight: 12,
      borderRadius: 22,
      backgroundColor: colors.cardBackground,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_BORDER_SUBTLE,
      gap: 6,
    },
    emotionToggleMain: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 8,
      paddingHorizontal: 8,
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
      paddingVertical: 4,
      paddingHorizontal: 4,
    },
    emotionFilter: {
      maxHeight: 64,
      marginBottom: 12,
    },
    emotionFilterContent: {
      paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
      paddingBottom: 4,
      gap: 8,
    },
    emotionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
      paddingVertical: 8,
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
      paddingTop: 8,
    },
    listIntro: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      paddingVertical: 14,
      paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
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
      gap: 10,
      paddingVertical: 14,
      paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
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
      marginBottom: 10,
    },
    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'stretch',
      paddingVertical: 14,
      paddingRight: 8,
      paddingLeft: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.FOCUS_BORDER_SUBTLE,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    categoryHeaderInner: {
      flex: 1,
      minWidth: 0,
    },
    categoryHeaderTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    categoryHeaderMain: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
      minWidth: 0,
    },
    categoryHint: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 16,
      marginTop: 8,
      paddingRight: 28,
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
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      overflow: 'hidden',
    },
    categoryCards: {
      paddingTop: 12,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.SCREEN_EDGE_INSET,
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
      paddingHorizontal: 22,
      paddingVertical: 12,
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
