/**
 * Estilos para CrisisDashboardScreen y subcomponentes
 * Alineados con globalStyles y patrón de tarjetas / opciones del perfil.
 */
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, TYPOGRAPHY } from '../../constants/ui';
import { lightColors } from '../../styles/themePalettes';

export function createCrisisDashboardStyles(colors) {
  /** Superficie de tarjeta (mismo criterio que ProfileScreen: CARD_BACKGROUND) */
  const CARD_SURFACE = colors.cardBackground;
  const CARD_BORDER = colors.border;

  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 16,
    fontSize: TYPOGRAPHY.BODY,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.SCREEN_EDGE_INSET,
  },
  errorText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  errorDetail: {
    color: colors.error,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  retryButtonText: {
    color: colors.textOnPrimary,
    fontSize: TYPOGRAPHY.BODY,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: CARD_BORDER,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: TYPOGRAPHY.TITLE,
    fontWeight: 'bold',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  section: {
    paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyHeaderTextColumn: {
    flex: 1,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.SUBTITLE,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.SMALL,
    color: colors.textSecondary,
    marginTop: -6,
    marginBottom: 12,
    lineHeight: 18,
  },
  sectionEmptyText: {
    fontSize: TYPOGRAPHY.CAPTION,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 28,
    paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
    lineHeight: 20,
  },
  periodSelectorContainer: {
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: CARD_SURFACE,
    borderRadius: 12,
    padding: SPACING.SCREEN_EDGE_INSET,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.SMALL,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  riskCard: {
    backgroundColor: CARD_SURFACE,
    borderRadius: 12,
    padding: SPACING.SCREEN_EDGE_INSET,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  riskLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  riskBadge: {
    paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
    paddingVertical: 8,
    borderRadius: 20,
  },
  riskText: {
    color: colors.textOnPrimary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: CARD_SURFACE,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  periodButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 60,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
  },
  periodButtonText: {
    color: colors.textSecondary,
    fontSize: TYPOGRAPHY.SMALL,
  },
  periodButtonTextActive: {
    color: colors.textOnPrimary,
    fontWeight: 'bold',
  },
  chartContainer: {
    backgroundColor: CARD_SURFACE,
    borderRadius: 12,
    padding: SPACING.SCREEN_EDGE_INSET,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  chart: {
    borderRadius: 16,
  },
  trendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 8,
  },
  trendText: {
    color: colors.text,
    fontSize: TYPOGRAPHY.CAPTION,
    marginLeft: 8,
  },
  historyItem: {
    backgroundColor: CARD_SURFACE,
    borderRadius: 12,
    padding: SPACING.SCREEN_EDGE_INSET,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  riskIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyDate: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  historyRisk: {
    color: colors.textSecondary,
    fontSize: TYPOGRAPHY.SMALL,
    marginTop: 2,
  },
  historyPreview: {
    color: colors.textSecondary,
    fontSize: TYPOGRAPHY.CAPTION,
    marginTop: 8,
  },
  viewAllText: {
    color: colors.primary,
    fontSize: TYPOGRAPHY.CAPTION,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.SUBTITLE,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyMessage: {
    fontSize: TYPOGRAPHY.CAPTION,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 40,
  },
  /** Bloque apoyo: mismas bases que optionButton del perfil */
  supportTitle: {
    fontSize: TYPOGRAPHY.SUBTITLE,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  supportSubtitle: {
    fontSize: TYPOGRAPHY.SMALL,
    color: colors.textSecondary,
    lineHeight: 17,
    marginBottom: 14,
  },
  supportAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_SURFACE,
    borderRadius: 12,
    padding: SPACING.SCREEN_EDGE_INSET,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  supportActionLast: {
    marginBottom: 0,
  },
  supportActionIcon: {
    marginRight: 16,
  },
  supportActionTextBlock: {
    flex: 1,
  },
  supportActionTitle: {
    fontSize: TYPOGRAPHY.BODY,
    color: colors.text,
  },
  supportActionHint: {
    fontSize: TYPOGRAPHY.SMALL,
    color: colors.textSecondary,
    marginTop: 2,
  },
  supportChevron: {
    marginLeft: 8,
  },
  });
}

export function useCrisisDashboardStyles() {
  const { colors } = useTheme();
  return useMemo(() => createCrisisDashboardStyles(colors), [colors]);
}

/** Compatibilidad legacy (tema claro) para módulos no migrados. */
export const styles = createCrisisDashboardStyles(lightColors);
