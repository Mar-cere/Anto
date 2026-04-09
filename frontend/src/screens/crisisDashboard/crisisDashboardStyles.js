/**
 * Estilos para CrisisDashboardScreen y subcomponentes
 * Alineados con globalStyles y patrón de tarjetas / opciones del perfil.
 */
import { StyleSheet } from 'react-native';
import { colors } from '../../styles/globalStyles';
import { TYPOGRAPHY } from '../../constants/ui';

/** Superficie de tarjeta (mismo criterio que ProfileScreen: CARD_BACKGROUND) */
const CARD_SURFACE = colors.cardBackground;
const CARD_BORDER = colors.border;

export const styles = StyleSheet.create({
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
    padding: 20,
  },
  errorText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  errorDetail: {
    color: '#FF6B6B',
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
    color: colors.white,
    fontSize: TYPOGRAPHY.BODY,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
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
    color: colors.white,
  },
  placeholder: {
    width: 40,
  },
  section: {
    paddingHorizontal: 20,
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
    color: colors.white,
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
    paddingHorizontal: 12,
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
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
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
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  riskLabel: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
  },
  riskBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  riskText: {
    color: colors.white,
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
    color: colors.white,
    fontWeight: 'bold',
  },
  chartContainer: {
    backgroundColor: CARD_SURFACE,
    borderRadius: 12,
    padding: 16,
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
    color: colors.white,
    fontSize: TYPOGRAPHY.CAPTION,
    marginLeft: 8,
  },
  historyItem: {
    backgroundColor: CARD_SURFACE,
    borderRadius: 12,
    padding: 16,
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
    color: colors.white,
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
    color: colors.white,
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
    color: colors.white,
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
    padding: 16,
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
    color: colors.white,
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
