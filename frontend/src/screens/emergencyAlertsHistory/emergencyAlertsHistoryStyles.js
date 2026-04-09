/**
 * Estilos para EmergencyAlertsHistoryScreen y subcomponentes
 * Alineados con globalStyles (misma base que dashboard de crisis / perfil).
 */
import { StyleSheet } from 'react-native';
import { colors } from '../../styles/globalStyles';
import { TYPOGRAPHY } from '../../constants/ui';

const CARD_SURFACE = colors.cardBackground;
const CARD_BORDER = colors.border;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  errorDetailText: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: CARD_BORDER,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: colors.white,
    fontSize: TYPOGRAPHY.SUBTITLE,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: CARD_BORDER,
    backgroundColor: CARD_SURFACE,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    minHeight: 48,
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  tabErrorDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  tabCountBadge: {
    backgroundColor: 'rgba(26, 221, 219, 0.18)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabCountBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  tabCountBadgeTextActive: {
    color: colors.white,
  },
  tabCountBadgeActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: TYPOGRAPHY.SMALL,
    fontWeight: '500',
    textAlign: 'center',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  tabContent: {
    padding: 20,
  },
  summaryCard: {
    backgroundColor: CARD_SURFACE,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  summaryTitle: {
    color: colors.textSecondary,
    fontSize: TYPOGRAPHY.SMALL,
    marginBottom: 8,
  },
  summaryValue: {
    color: colors.primary,
    fontSize: 32,
    fontWeight: 'bold',
  },
  summaryHint: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 17,
    paddingHorizontal: 8,
  },
  tabErrorContainer: {
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  tabErrorText: {
    color: colors.white,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  tabRetryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  tabRetryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: TYPOGRAPHY.SUBTITLE,
    fontWeight: '600',
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: CARD_SURFACE,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  chart: {
    borderRadius: 12,
  },
  historyItem: {
    backgroundColor: CARD_SURFACE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyItemInfo: {
    marginLeft: 12,
    flex: 1,
  },
  historyItemContact: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  historyItemDate: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  historyItemDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    color: '#999',
    fontSize: 14,
    marginRight: 8,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  riskBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  channelsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  channelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A1533',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  channelText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  noChannelsText: {
    color: '#FF6B6B',
    fontSize: 12,
  },
  testBadge: {
    backgroundColor: '#1ADDDB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  testBadgeText: {
    color: '#0A1533',
    fontSize: 12,
    fontWeight: '600',
  },
  contactCard: {
    backgroundColor: CARD_SURFACE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  contactName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  contactStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  contactStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactStatLabel: {
    color: '#999',
    fontSize: 14,
    marginRight: 4,
  },
  contactStatValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  patternCard: {
    backgroundColor: CARD_SURFACE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  patternRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  patternText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  patternSubtitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  patternItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#0A1533',
  },
  patternItemText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  reliabilityStats: {
    marginTop: 8,
  },
  reliabilityText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 4,
  },
  recommendationCard: {
    backgroundColor: CARD_SURFACE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  recommendationText: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  statsTabEmptyWrap: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  emptyCtaButton: {
    marginTop: 24,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyCtaButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
