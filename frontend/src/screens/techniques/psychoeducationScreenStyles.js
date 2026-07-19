import { StyleSheet } from 'react-native';
import { SPACING } from '../../constants/ui';
import { getFocusTheme } from '../../styles/focusCardTheme';

export function createPsychoeducationLibraryStyles(colors, resolvedScheme) {
  const t = getFocusTheme(colors, resolvedScheme);
  /** Ancho del icono del footer (MaterialCommunityIcons size={17}). */
  const FOOTER_ICON_SIZE = 17;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: {
      paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
      paddingTop: SPACING.sm,
      paddingBottom: SPACING.xxl,
    },
    hero: {
      ...t.FOCUS_PANEL,
      marginBottom: 20,
      paddingVertical: SPACING.HERO_INSET,
    },
    heroRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: SPACING.CHIP_INSET,
    },
    heroIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: colors.accentLineSoft ?? 'rgba(30, 131, 211, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroKicker: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: t.FOCUS_KICKER_COLOR,
      marginBottom: 6,
    },
    heroTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      lineHeight: 22,
      flex: 1,
    },
    countPill: {
      alignSelf: 'flex-start',
      marginTop: 14,
      paddingHorizontal: SPACING.CHIP_INSET_COMPACT,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: darkTint(colors, 0.06),
    },
    countPillText: {
      fontSize: 12,
      fontWeight: '600',
      color: t.FOCUS_META,
    },
    moduleCard: {
      backgroundColor: colors.cardBackground ?? colors.card,
      borderRadius: 22,
      paddingVertical: SPACING.CARD_INNER_INSET,
      paddingHorizontal: SPACING.CARD_INNER_INSET,
      marginBottom: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_BORDER_SUBTLE,
      borderLeftWidth: 3,
      shadowColor: colors.glassShadow ?? colors.shadowAmbient,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 8,
      elevation: 2,
    },
    moduleRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconTile: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    moduleText: { flex: 1, paddingRight: SPACING.xs },
    moduleTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 5,
    },
    moduleSummary: {
      fontSize: 13,
      lineHeight: 19,
      color: colors.textSecondary,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 10,
      gap: SPACING.sm,
    },
    readPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xs,
      borderRadius: 999,
      backgroundColor: darkTint(colors, 0.05),
    },
    readPillText: {
      fontSize: 11,
      fontWeight: '600',
      color: t.FOCUS_META,
    },
    centerBox: {
      paddingVertical: SPACING.xl,
      alignItems: 'center',
    },
    errorText: { color: colors.error, fontSize: 14, marginBottom: 12, textAlign: 'center' },
    retryBtn: {
      paddingHorizontal: SPACING.HERO_INSET,
      paddingVertical: SPACING.CHIP_INSET_COMPACT,
      borderRadius: 999,
      backgroundColor: colors.primary,
    },
    retryText: { color: colors.textOnPrimary, fontWeight: '600', fontSize: 14 },
    emptyText: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingVertical: SPACING.HERO_INSET,
    },
  });
}

function darkTint(colors, alpha) {
  return colors.accentLineSoft ?? `rgba(30, 131, 211, ${alpha})`;
}

export function createPsychoeducationModuleStyles(colors, resolvedScheme) {
  const t = getFocusTheme(colors, resolvedScheme);
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: {
      paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
      paddingBottom: SPACING.xxl + SPACING.CHIP_INSET,
    },
    hero: {
      ...t.FOCUS_PANEL,
      marginBottom: 18,
      alignItems: 'center',
      paddingVertical: SPACING.HERO_INSET,
    },
    heroIcon: {
      width: 56,
      height: 56,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    heroTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      letterSpacing: -0.3,
    },
    heroMinutes: {
      marginTop: 8,
      fontSize: 12,
      fontWeight: '600',
      color: t.FOCUS_META,
    },
    heroLead: {
      marginTop: 14,
      paddingHorizontal: SPACING.xs,
      fontSize: 15,
      lineHeight: 23,
      color: t.FOCUS_BODY_SOFT,
      textAlign: 'center',
    },
    sectionsStack: {
      gap: SPACING.CARD_INNER_INSET,
      marginTop: 4,
    },
    accordionWrap: {
      ...t.FOCUS_INNER_ROW,
      flexDirection: 'column',
      alignItems: 'stretch',
      paddingVertical: 0,
      overflow: 'hidden',
    },
    accordionHighlight: {
      borderLeftWidth: 3,
      paddingLeft: SPACING.CHIP_INSET,
    },
    accordionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: SPACING.CHIP_INSET,
      paddingHorizontal: SPACING.CARD_INNER_INSET,
    },
    accordionIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    accordionHeaderText: {
      flex: 1,
      minWidth: 0,
      paddingRight: SPACING.sm,
    },
    accordionTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    accordionPreview: {
      marginTop: 3,
      fontSize: 12,
      lineHeight: 17,
      color: t.FOCUS_META,
    },
    accordionContent: {
      paddingHorizontal: SPACING.CARD_INNER_INSET,
      paddingBottom: SPACING.CARD_INNER_INSET,
      paddingTop: 0,
    },
    accordionBody: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.textSecondary,
    },
    bulletList: {
      gap: SPACING.CARD_INNER_INSET,
    },
    bulletRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    bulletDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginTop: 8,
      marginRight: 10,
    },
    bulletText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 21,
      color: colors.textSecondary,
    },
    highlightCard: {
      borderRadius: 18,
      padding: SPACING.CARD_INNER_INSET,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_BORDER_SUBTLE,
      backgroundColor: darkTint(colors, 0.06),
    },
    highlightHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    highlightTitle: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    highlightSubheader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    highlightSubtitle: {
      flex: 1,
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.2,
      textTransform: 'uppercase',
      color: t.FOCUS_KICKER_COLOR,
    },
    highlightDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: t.FOCUS_BORDER_SUBTLE,
      marginVertical: 12,
    },
    highlightSeekText: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    footerPanel: {
      marginTop: 20,
      borderRadius: 16,
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.CARD_INNER_INSET,
      backgroundColor: darkTint(colors, 0.04),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_BORDER_SUBTLE,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: SPACING.CHIP_INSET,
      gap: SPACING.CARD_INNER_INSET,
    },
    footerRowText: {
      flex: 1,
      minWidth: 0,
    },
    footerRowTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    footerRowMeta: {
      marginTop: 2,
      fontSize: 12,
      color: t.FOCUS_META,
    },
    footerBody: {
      paddingBottom: SPACING.CHIP_INSET,
      // icono 17 + gap del footerRow
      paddingLeft: FOOTER_ICON_SIZE + SPACING.CARD_INNER_INSET,
      fontSize: 13,
      lineHeight: 20,
      color: colors.textSecondary,
    },
    footerLinks: {
      paddingBottom: SPACING.sm,
      paddingLeft: FOOTER_ICON_SIZE + SPACING.CARD_INNER_INSET,
      gap: 6,
    },
    footerLinkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      paddingVertical: 6,
    },
    footerLinkText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 19,
      color: colors.primary,
      fontWeight: '500',
    },
    footerDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: t.FOCUS_BORDER_SUBTLE,
      marginHorizontal: 4,
    },
    callout: {
      borderRadius: 18,
      padding: SPACING.CARD_INNER_INSET,
      marginBottom: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_BORDER_SUBTLE,
    },
    calloutDisclaimer: {
      backgroundColor: darkTint(colors, 0.08),
    },
    calloutMechanism: {
      backgroundColor: colors.cardBackground ?? colors.card,
      borderLeftWidth: 3,
    },
    calloutTitle: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.3,
      textTransform: 'uppercase',
      color: t.FOCUS_KICKER_COLOR,
      marginBottom: 8,
    },
    calloutBody: {
      fontSize: 14,
      lineHeight: 21,
      color: t.FOCUS_BODY_SOFT,
    },
    sectionBlock: {
      marginBottom: 14,
      paddingVertical: SPACING.xs,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 10,
    },
    body: { fontSize: 14, lineHeight: 21, color: colors.textSecondary },
    bullet: {
      fontSize: 14,
      lineHeight: 21,
      color: colors.textSecondary,
      marginBottom: 8,
      paddingLeft: SPACING.xs,
    },
    sourcesPanel: {
      ...t.FOCUS_INNER_ROW,
      flexDirection: 'column',
      alignItems: 'stretch',
      paddingVertical: SPACING.CHIP_INSET,
      marginTop: 8,
    },
    sourceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: SPACING.CHIP_INSET_COMPACT,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.FOCUS_BORDER_SUBTLE,
    },
    sourceRowFirst: { borderTopWidth: 0, paddingTop: 0 },
    sourceLink: {
      flex: 1,
      fontSize: 14,
      lineHeight: 20,
      color: colors.primary,
      fontWeight: '500',
    },
    reviewFooter: {
      fontSize: 11,
      lineHeight: 17,
      color: t.FOCUS_META,
      marginTop: 20,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    error: { color: colors.error, fontSize: 14, lineHeight: 20, textAlign: 'center' },
    loadingWrap: { paddingVertical: SPACING.xxl, alignItems: 'center' },
  });
}
