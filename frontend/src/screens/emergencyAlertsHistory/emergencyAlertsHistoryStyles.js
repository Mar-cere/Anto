/**
 * Estilos para EmergencyAlertsHistoryScreen y subcomponentes
 * Alineados con globalStyles (misma base que dashboard de crisis / perfil).
 */
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { SPACING, TYPOGRAPHY } from '../../constants/ui';
import { lightColors } from '../../styles/themePalettes';

export function createEmergencyAlertsHistoryStyles(colors) {
  const CARD_SURFACE = colors.cardBackground;
  const CARD_BORDER = colors.border;

  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.text,
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.SCREEN_EDGE_INSET,
  },
  errorText: {
    color: colors.text,
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
    lineHeight: 18,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: SPACING.CHIP_INSET,
    paddingVertical: SPACING.CHIP_INSET,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
    paddingVertical: SPACING.CHIP_INSET,
    borderBottomWidth: 1,
    borderBottomColor: CARD_BORDER,
  },
  backButton: {
    padding: SPACING.sm,
  },
  headerTitle: {
    color: colors.text,
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
    paddingVertical: SPACING.CHIP_INSET,
    paddingHorizontal: SPACING.xs,
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
    backgroundColor: colors.accentLineSoft,
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
    color: colors.textOnPrimary,
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
    paddingBottom: SPACING.xl,
  },
  tabContent: {
    padding: SPACING.SCREEN_EDGE_INSET,
  },
  summaryCard: {
    backgroundColor: CARD_SURFACE,
    borderRadius: 12,
    padding: SPACING.CARD_INNER_INSET,
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
    paddingHorizontal: SPACING.sm,
  },
  tabErrorContainer: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  tabErrorText: {
    color: colors.text,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  tabRetryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: SPACING.CHIP_INSET,
    paddingVertical: SPACING.CHIP_INSET,
    borderRadius: 8,
  },
  tabRetryButtonText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: TYPOGRAPHY.SUBTITLE,
    fontWeight: '600',
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: CARD_SURFACE,
    borderRadius: 12,
    padding: SPACING.CHIP_INSET_COMPACT,
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
    padding: SPACING.CARD_INNER_INSET,
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
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  historyItemDate: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: SPACING.CHIP_INSET_COMPACT,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: colors.textOnPrimary,
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
    color: colors.textSecondary,
    fontSize: 14,
    marginRight: 8,
  },
  riskBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
  },
  riskBadgeText: {
    color: colors.textOnPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  channelsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  channelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glassFill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    gap: 4,
  },
  channelText: {
    color: colors.text,
    fontSize: 12,
  },
  noChannelsText: {
    color: colors.error,
    fontSize: 12,
  },
  testBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  testBadgeText: {
    color: colors.textOnPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  contactCard: {
    backgroundColor: CARD_SURFACE,
    borderRadius: 12,
    padding: SPACING.CARD_INNER_INSET,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  contactName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  contactStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  contactStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactStatLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginRight: 4,
  },
  contactStatValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  patternCard: {
    backgroundColor: CARD_SURFACE,
    borderRadius: 12,
    padding: SPACING.CARD_INNER_INSET,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  patternRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.CHIP_INSET,
  },
  patternText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  patternSubtitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  patternItem: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  patternItemText: {
    color: colors.text,
    fontSize: 14,
  },
  reliabilityStats: {
    marginTop: 8,
  },
  reliabilityText: {
    color: colors.text,
    fontSize: 14,
    marginBottom: 4,
  },
  recommendationCard: {
    backgroundColor: CARD_SURFACE,
    borderRadius: 12,
    padding: SPACING.CARD_INNER_INSET,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.CHIP_INSET,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  recommendationText: {
    color: colors.text,
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl + SPACING.CHIP_INSET,
  },
  statsTabEmptyWrap: {
    alignItems: 'center',
    paddingVertical: SPACING.HERO_INSET,
    marginBottom: 8,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: SPACING.HERO_INSET,
  },
  emptyCtaButton: {
    marginTop: 24,
    backgroundColor: colors.primary,
    paddingHorizontal: SPACING.CHIP_INSET,
    paddingVertical: SPACING.CHIP_INSET,
    borderRadius: 12,
  },
  emptyCtaButtonText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  });
}

export function useEmergencyAlertsHistoryStyles() {
  const { colors } = useTheme();
  return useMemo(() => createEmergencyAlertsHistoryStyles(colors), [colors]);
}

/** Compatibilidad legacy (tema claro) para módulos no migrados. */
export const styles = createEmergencyAlertsHistoryStyles(lightColors);
