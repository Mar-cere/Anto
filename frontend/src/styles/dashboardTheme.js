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
      backgroundColor: dark ? colors.chromeCard : colors.surface,
      borderRadius: 22,
      borderWidth: dark ? StyleSheet.hairlineWidth : 1,
      borderColor: dark ? colors.glassOutline : 'rgba(36, 35, 79, 0.1)',
      shadowColor: colors.glassShadow,
      shadowOffset: { width: 0, height: dark ? 4 : 6 },
      shadowOpacity: dark ? 0.35 : 0.14,
      shadowRadius: dark ? 12 : 16,
      elevation: dark ? 4 : 5,
    },
    GROUPED_SURFACE: {
      backgroundColor: dark ? colors.chromeCard : colors.chromeInput,
      borderRadius: 20,
      borderWidth: dark ? StyleSheet.hairlineWidth : 1,
      borderColor: dark ? colors.glassOutline : 'rgba(36, 35, 79, 0.08)',
      overflow: 'hidden',
    },
    HERO_SURFACE: {
      borderRadius: 24,
      overflow: 'hidden',
      backgroundColor: dark ? '#0D2A5C' : colors.primary,
    },
    HERO_ORB: {
      position: 'absolute',
      width: 148,
      height: 148,
      borderRadius: 74,
      backgroundColor: dark ? 'rgba(68, 215, 251, 0.22)' : 'rgba(255, 255, 255, 0.18)',
      bottom: -44,
      right: -28,
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
    heroCardStreakOnly: {
      minHeight: 88,
      paddingVertical: 18,
      paddingHorizontal: 20,
      justifyContent: 'center',
      overflow: 'hidden',
      backgroundColor: 'transparent',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255, 255, 255, 0.14)',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: dark ? 0.28 : 0.18,
      shadowRadius: 16,
      elevation: 6,
    },
    heroGradientBase: {
      ...StyleSheet.absoluteFillObject,
    },
    heroGradientFade: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: '62%',
      opacity: 0.92,
    },
    heroStreakDynamicRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      zIndex: 1,
    },
    heroStreakIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255, 255, 255, 0.18)',
    },
    heroStreakCopy: {
      flex: 1,
      minWidth: 0,
    },
    heroStreakMainLine: {
      flexDirection: 'row',
      alignItems: 'baseline',
      flexWrap: 'wrap',
      gap: 6,
    },
    heroStreakNumber: {
      color: colors.white,
      fontSize: 30,
      fontWeight: '800',
      letterSpacing: -0.8,
      lineHeight: 34,
    },
    heroStreakUnit: {
      color: 'rgba(255, 255, 255, 0.94)',
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: -0.2,
      lineHeight: 22,
    },
    heroStreakMeta: {
      marginTop: 4,
      color: 'rgba(255, 255, 255, 0.72)',
      fontSize: 13,
      fontWeight: '500',
      lineHeight: 18,
      letterSpacing: 0.1,
    },
    heroStreakOnlyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      zIndex: 1,
    },
    streakStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      flexWrap: 'wrap',
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 999,
      marginBottom: t.SECTION_GAP,
      borderWidth: StyleSheet.hairlineWidth,
    },
    streakStripText: {
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    streakStripSep: {
      fontSize: 12,
      fontWeight: '600',
      opacity: 0.55,
    },
    streakStripTier: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.2,
    },
    heroOrb: t.HERO_ORB,
    heroStreakChipStreakOnly: {
      marginBottom: 0,
      alignSelf: 'flex-start',
      paddingVertical: 10,
      paddingHorizontal: 16,
      gap: 7,
      minHeight: 44,
    },
    heroStreakChipTextLarge: {
      color: colors.white,
      fontSize: 15,
      fontWeight: '700',
      letterSpacing: 0.15,
      lineHeight: 20,
    },
    heroStreakChipSepLarge: {
      color: 'rgba(255, 255, 255, 0.55)',
      fontSize: 13,
      fontWeight: '600',
    },
    heroStreakChipTierLarge: {
      color: 'rgba(255, 255, 255, 0.92)',
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.15,
      lineHeight: 20,
    },
    heroStreakChip: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      flexWrap: 'wrap',
      gap: 5,
      marginBottom: 10,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor: 'rgba(255, 255, 255, 0.16)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255, 255, 255, 0.22)',
    },
    heroStreakChipText: {
      color: colors.white,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    heroStreakChipSep: {
      color: 'rgba(255, 255, 255, 0.55)',
      fontSize: 12,
      fontWeight: '600',
    },
    heroStreakChipTier: {
      color: 'rgba(255, 255, 255, 0.92)',
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.2,
    },
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
    statCardSolo: {
      flex: 1,
      maxWidth: '100%',
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
    statTierLabel: {
      marginTop: 2,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '600',
      letterSpacing: 0.2,
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
    moodAckText: {
      marginTop: 14,
      fontSize: 15,
      lineHeight: 22,
      color: colors.primary,
      fontWeight: '500',
    },
    homeInsightCard: {
      padding: 18,
    },
    homeInsightRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      marginTop: 10,
    },
    homeInsightIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: dark ? 'rgba(232, 155, 184, 0.14)' : 'rgba(232, 155, 184, 0.12)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: dark ? 'rgba(232, 155, 184, 0.22)' : 'rgba(232, 155, 184, 0.2)',
    },
    homeInsightCopy: {
      flex: 1,
      minWidth: 0,
    },
    homeInsightText: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.text,
      fontWeight: '500',
    },
    homeInsightCta: {
      marginTop: 8,
      fontSize: 14,
      lineHeight: 20,
      color: colors.primary,
      fontWeight: '600',
    },
  });
}
