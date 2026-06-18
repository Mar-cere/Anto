/**
 * Tokens visuales del home/dashboard (estilo premium, agrupado tipo iOS).
 */
import { StyleSheet } from 'react-native';
import { SPACING } from '../constants/ui';

/**
 * @param {import('./themePalettes').lightColors} colors
 * @param {'light'|'dark'} resolvedScheme
 */
export function getDashboardTheme(colors, resolvedScheme = 'light') {
  const dark = resolvedScheme === 'dark';

  return {
    SECTION_GAP: 16,
    CARD_RADIUS: 22,
    GROUPED_RADIUS: 20,
    ROW_RADIUS: 0,
    EYEBROW: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 1.6,
      textTransform: 'uppercase',
      color: colors.textMuted,
    },
    SECTION_TITLE: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: colors.textMuted,
    },
    SURFACE: {
      backgroundColor: colors.chromeCard,
      borderRadius: 22,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.glassOutline,
      shadowColor: colors.glassShadow,
      shadowOffset: { width: 0, height: dark ? 4 : 8 },
      shadowOpacity: dark ? 0.35 : 0.12,
      shadowRadius: dark ? 12 : 18,
      elevation: dark ? 4 : 6,
    },
    GROUPED_SURFACE: {
      backgroundColor: colors.chromeCard,
      borderRadius: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.glassOutline,
      overflow: 'hidden',
    },
    HERO_SURFACE: {
      borderRadius: 24,
      overflow: 'hidden',
      backgroundColor: dark ? '#0D2A5C' : colors.primary,
    },
    HERO_ORB: {
      position: 'absolute',
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: dark ? 'rgba(68, 215, 251, 0.22)' : 'rgba(255, 255, 255, 0.18)',
      bottom: -36,
      right: -24,
    },
    PILL_SELECTED: {
      backgroundColor: dark ? 'rgba(30, 131, 211, 0.22)' : 'rgba(30, 131, 211, 0.1)',
      borderColor: colors.primary,
    },
    PILL_DEFAULT: {
      backgroundColor: dark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(36, 35, 79, 0.04)',
      borderColor: colors.border,
    },
    SCREEN_PADDING: SPACING.SCREEN_EDGE_INSET,
    STAT_ACCENT: colors.primary,
  };
}

/**
 * @param {import('./themePalettes').lightColors} colors
 * @param {'light'|'dark'} resolvedScheme
 */
export function createDashboardStyles(colors, resolvedScheme = 'light') {
  const t = getDashboardTheme(colors, resolvedScheme);
  const dark = resolvedScheme === 'dark';

  return StyleSheet.create({
    section: {
      marginBottom: t.SECTION_GAP,
    },
    surfaceCard: {
      ...t.SURFACE,
      padding: 18,
    },
    groupedCard: {
      ...t.GROUPED_SURFACE,
    },
    eyebrow: t.EYEBROW,
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
      paddingHorizontal: 2,
    },
    sectionTitle: t.SECTION_TITLE,
    sectionLink: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.primary,
    },
    sectionHint: {
      fontSize: 13,
      lineHeight: 19,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    sectionFooterLink: {
      alignSelf: 'center',
      paddingVertical: 12,
      marginTop: 4,
    },
    sectionFooterLinkText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    groupedList: {
      ...t.GROUPED_SURFACE,
    },
    rowChevron: {
      marginLeft: 6,
    },
    inlineState: {
      paddingVertical: 20,
      paddingHorizontal: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroCard: {
      ...t.HERO_SURFACE,
      padding: 22,
      minHeight: 148,
      marginBottom: t.SECTION_GAP,
    },
    heroOrb: t.HERO_ORB,
    heroTitle: {
      color: colors.white,
      fontSize: 22,
      fontWeight: '700',
      letterSpacing: -0.4,
      lineHeight: 28,
      maxWidth: '78%',
    },
    heroSubtitle: {
      color: dark ? 'rgba(245, 247, 255, 0.82)' : 'rgba(255, 255, 255, 0.88)',
      fontSize: 15,
      lineHeight: 21,
      marginTop: 6,
      maxWidth: '80%',
    },
    heroCta: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 18,
      paddingVertical: 11,
      paddingHorizontal: 16,
      borderRadius: 999,
      backgroundColor: dark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.22)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255, 255, 255, 0.28)',
    },
    heroCtaText: {
      color: colors.white,
      fontSize: 15,
      fontWeight: '600',
    },
    statsRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: t.SECTION_GAP,
    },
    statCard: {
      flex: 1,
      ...t.SURFACE,
      paddingVertical: 18,
      paddingHorizontal: 16,
    },
    statValue: {
      fontSize: 34,
      fontWeight: '700',
      letterSpacing: -1,
      color: colors.text,
      lineHeight: 38,
    },
    statLabel: {
      marginTop: 4,
      fontSize: 13,
      lineHeight: 18,
      color: colors.textSecondary,
      fontWeight: '400',
    },
    statAccent: {
      marginTop: 14,
      height: 3,
      borderRadius: 2,
      width: 28,
      backgroundColor: t.STAT_ACCENT,
    },
    groupedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      minHeight: 68,
    },
    groupedRowBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    rowIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accentLineSoft,
      marginRight: 12,
    },
    rowCopy: {
      flex: 1,
      minWidth: 0,
    },
    rowTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      lineHeight: 21,
    },
    rowMeta: {
      marginTop: 3,
      fontSize: 13,
      lineHeight: 18,
      color: colors.textSecondary,
    },
    checkButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
    },
    moodPill: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
    },
    moodPillSelected: {
      ...t.PILL_SELECTED,
      borderWidth: StyleSheet.hairlineWidth,
    },
    moodPillDefault: {
      ...t.PILL_DEFAULT,
      borderWidth: StyleSheet.hairlineWidth,
    },
    moodPillText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    moodPillTextSelected: {
      color: colors.primary,
      fontWeight: '600',
    },
    moodRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 14,
    },
    antoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    antoAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accentLineSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.accentLine,
    },
    antoCopy: {
      flex: 1,
      minWidth: 0,
    },
    antoName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    antoSnippet: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.textSecondary,
    },
    antoCta: {
      paddingVertical: 9,
      paddingHorizontal: 14,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.accentLine,
      backgroundColor: dark ? 'rgba(255, 255, 255, 0.06)' : colors.surface,
    },
    antoCtaText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    questionTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
      lineHeight: 24,
      letterSpacing: -0.2,
    },
  });
}
