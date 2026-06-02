import { StyleSheet } from 'react-native';
import { SPACING } from '../../constants/ui';
import { getFocusTheme } from '../../styles/focusCardTheme';

export function createPsychoeducationLibraryStyles(colors, resolvedScheme) {
  const t = getFocusTheme(colors, resolvedScheme);
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: {
      paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
      paddingTop: 8,
      paddingBottom: 48,
    },
    hero: {
      ...t.FOCUS_PANEL,
      marginBottom: 20,
      paddingVertical: 20,
    },
    heroRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
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
      paddingHorizontal: 10,
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
      paddingVertical: 14,
      paddingHorizontal: 14,
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
    moduleText: { flex: 1, paddingRight: 4 },
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
      gap: 8,
    },
    readPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: darkTint(colors, 0.05),
    },
    readPillText: {
      fontSize: 11,
      fontWeight: '600',
      color: t.FOCUS_META,
    },
    centerBox: {
      paddingVertical: 32,
      alignItems: 'center',
    },
    errorText: { color: colors.error, fontSize: 14, marginBottom: 12, textAlign: 'center' },
    retryBtn: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: colors.primary,
    },
    retryText: { color: colors.textOnPrimary, fontWeight: '600', fontSize: 14 },
    emptyText: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingVertical: 24,
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
      paddingBottom: 60,
    },
    hero: {
      ...t.FOCUS_PANEL,
      marginBottom: 18,
      alignItems: 'center',
      paddingVertical: 24,
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
    callout: {
      borderRadius: 18,
      padding: 14,
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
      paddingVertical: 4,
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
      paddingLeft: 4,
    },
    sourcesPanel: {
      ...t.FOCUS_INNER_ROW,
      flexDirection: 'column',
      alignItems: 'stretch',
      paddingVertical: 14,
      marginTop: 8,
    },
    sourceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
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
    loadingWrap: { paddingVertical: 40, alignItems: 'center' },
  });
}
