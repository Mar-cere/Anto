/**
 * Estilos para EmergencyAlertsHistoryScreen y subcomponentes
 */
import { StyleSheet } from 'react-native';
import { colors } from '../../styles/globalStyles';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1533',
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
    marginBottom: 24,
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
    borderBottomColor: '#1D2B5F',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1D2B5F',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  summaryCard: {
    backgroundColor: '#1D2B5F',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  summaryTitle: {
    color: '#999',
    fontSize: 14,
    marginBottom: 8,
  },
  summaryValue: {
    color: colors.primary,
    fontSize: 32,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: '#1D2B5F',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  chart: {
    borderRadius: 12,
  },
  historyItem: {
    backgroundColor: '#1D2B5F',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    backgroundColor: '#1D2B5F',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    backgroundColor: '#1D2B5F',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    backgroundColor: '#1D2B5F',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
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
