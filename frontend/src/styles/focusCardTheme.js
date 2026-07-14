/**
 * Bloque "foco" del dashboard: tokens y estilos compartidos según tema (claro / oscuro).
 */
import { StyleSheet } from 'react-native';
import { SPACING } from '../constants/ui';
import { lightColors } from './themePalettes';
import { getDashboardTheme } from './dashboardTheme';

/**
 * @param {typeof lightColors} colors
 * @param {'light'|'dark'} resolvedScheme
 */
export function getFocusTheme(colors, resolvedScheme = 'light') {
  const dark = resolvedScheme === 'dark';
  const dash = getDashboardTheme(colors, resolvedScheme);

  return {
    FOCUS_CHEVRON_MUTED: dark ? 'rgba(245, 247, 255, 0.36)' : 'rgba(36, 35, 79, 0.28)',
    FOCUS_KICKER_COLOR: colors.textMuted,
    FOCUS_KICKER_SOFT: colors.textMuted,
    FOCUS_META: dark ? 'rgba(245, 247, 255, 0.58)' : 'rgba(36, 35, 79, 0.52)',
    FOCUS_META_SOFT: dark ? 'rgba(245, 247, 255, 0.46)' : 'rgba(36, 35, 79, 0.42)',
    FOCUS_BODY_SOFT: dark ? 'rgba(245, 247, 255, 0.9)' : 'rgba(36, 35, 79, 0.82)',
    FOCUS_BORDER_SUBTLE: colors.border,
    FOCUS_ACCENT_BORDER: colors.accentLine,
    FOCUS_PANEL: {
      alignSelf: 'stretch',
      ...dash.SURFACE,
      paddingVertical: 18,
      paddingHorizontal: 18,
    },
    FOCUS_INNER_ROW: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      minHeight: 68,
    },
    FOCUS_ICON_WRAP: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.accentLineSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
  };
}

/**
 * @param {typeof lightColors} colors
 * @param {'light'|'dark'} resolvedScheme
 */
export function createDashboardFocusStyles(colors, resolvedScheme = 'light') {
  const t = getFocusTheme(colors, resolvedScheme);
  const dash = getDashboardTheme(colors, resolvedScheme);
  const badgeBg = resolvedScheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(36, 35, 79, 0.06)';

  return StyleSheet.create({
    section: {
      marginBottom: dash.SECTION_GAP,
    },
    card: {
      ...t.FOCUS_PANEL,
      paddingBottom: 14,
    },
    groupLabel: {
      ...dash.SECTION_TITLE,
      marginBottom: 10,
    },
    groupedList: {
      ...dash.GROUPED_SURFACE,
    },
    actionRow: {
      ...t.FOCUS_INNER_ROW,
    },
    actionRowBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    actionIconWrap: {
      ...t.FOCUS_ICON_WRAP,
      marginRight: 12,
    },
    actionCopy: {
      flex: 1,
      minWidth: 0,
    },
    actionTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 21,
    },
    actionMeta: {
      marginTop: 3,
      color: t.FOCUS_META,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '400',
    },
    actionChevron: {
      marginLeft: 6,
    },
    lastSessionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'nowrap',
      width: '100%',
    },
    lastSessionTitleBlock: {
      width: '100%',
    },
    lastSessionHeadline: {
      flex: 1,
      minWidth: 0,
    },
    lastSessionBadge: {
      alignSelf: 'flex-start',
      marginTop: 4,
      fontSize: 10,
      fontWeight: '600',
      color: t.FOCUS_META,
      backgroundColor: badgeBg,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      overflow: 'hidden',
    },
    protocolRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 16,
      paddingHorizontal: 2,
    },
    protocolDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
      marginTop: 7,
      marginRight: 10,
      opacity: 0.9,
    },
    protocolText: {
      flex: 1,
      color: t.FOCUS_BODY_SOFT,
      fontSize: 14,
      lineHeight: 21,
      fontWeight: '400',
    },
    focusHero: {
      color: colors.text,
      fontSize: 17,
      lineHeight: 26,
      fontWeight: '600',
      letterSpacing: -0.2,
      marginBottom: 16,
    },
    sparseLink: {
      alignSelf: 'flex-start',
      marginBottom: 14,
    },
    sparseLinkText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '600',
    },
    insetSection: {
      marginBottom: 0,
      paddingTop: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.FOCUS_BORDER_SUBTLE,
    },
    insetLabel: {
      ...dash.SECTION_TITLE,
      marginBottom: 8,
    },
    insetTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '500',
      lineHeight: 22,
    },
    insetMeta: {
      marginTop: 4,
      fontSize: 13,
      color: t.FOCUS_META_SOFT,
      lineHeight: 18,
    },
    commitmentRow: {
      marginBottom: 8,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 14,
      backgroundColor: resolvedScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(36, 35, 79, 0.035)',
    },
    commitmentRowLast: {
      marginBottom: 0,
    },
    commitmentRowPressed: {
      opacity: 0.88,
    },
    commitmentRowInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    commitmentRowCopy: {
      flex: 1,
      minWidth: 0,
    },
    commitmentChevron: {
      marginLeft: 4,
    },
    commitmentLabel: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500',
    },
    commitmentLinkHint: {
      marginTop: 4,
      fontSize: 11.5,
      color: t.FOCUS_META,
      fontWeight: '500',
    },
    commitmentActions: {
      marginTop: 8,
    },
    commitmentPrompt: {
      fontSize: 12,
      color: t.FOCUS_META,
      marginBottom: 8,
    },
    commitmentRenegotiateInput: {
      fontSize: 13,
      color: colors.text,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_ACCENT_BORDER,
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 10,
      marginBottom: 8,
      backgroundColor: colors.chromeInputDisabled ?? colors.surface,
    },
    commitmentButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    commitmentChip: {
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_ACCENT_BORDER,
      backgroundColor: colors.accentLineSoft,
    },
    commitmentChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
    },
    commitmentOmitLink: {
      alignSelf: 'flex-start',
      marginTop: 4,
      paddingVertical: 4,
    },
    commitmentOmitLinkText: {
      fontSize: 12,
      fontWeight: '500',
      color: t.FOCUS_META,
      textDecorationLine: 'underline',
    },
    ctaSecondary: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'stretch',
      marginTop: SPACING.md,
      paddingVertical: 11,
      paddingHorizontal: 16,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.accentLine,
      backgroundColor: resolvedScheme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : colors.surface,
    },
    ctaSecondaryText: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: '600',
    },
    ctaSecondaryIcon: {
      marginLeft: 8,
    },
    /** @deprecated filas sueltas con fondo — mantener por compat de imports */
    kicker: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 1.6,
      textTransform: 'uppercase',
      color: t.FOCUS_KICKER_COLOR,
      marginBottom: 14,
    },
    reminderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 14,
      backgroundColor: resolvedScheme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(36, 35, 79, 0.035)',
    },
    reminderRowPressable: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.FOCUS_ACCENT_BORDER,
    },
    reminderIconWrap: {
      ...t.FOCUS_ICON_WRAP,
      marginRight: 12,
    },
    reminderCopy: {
      flex: 1,
      minWidth: 0,
    },
    reminderTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '500',
      lineHeight: 20,
    },
    reminderMeta: {
      marginTop: 4,
      color: t.FOCUS_META,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '400',
    },
    reminderChevron: {
      marginLeft: 6,
    },
    lastSessionRow: {
      marginBottom: 16,
    },
    nextTask: {
      marginBottom: 18,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.FOCUS_BORDER_SUBTLE,
    },
    nextTaskLabel: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: t.FOCUS_KICKER_SOFT,
      marginBottom: 6,
    },
    nextTaskTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '400',
    },
    nextTaskDue: {
      marginTop: 4,
      fontSize: 13,
      color: t.FOCUS_META_SOFT,
    },
    commitmentsBlock: {
      marginBottom: 18,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.FOCUS_BORDER_SUBTLE,
    },
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'stretch',
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 999,
    },
    ctaText: {
      color: colors.textOnPrimary,
      fontSize: 15,
      fontWeight: '600',
      letterSpacing: 0.2,
    },
    ctaArrow: {
      marginLeft: 8,
    },
    // Active Focus Theme Display (#2)
    activeFocusContainer: {
      marginBottom: 20,
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: colors.chromeInput,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.accentLineSoft,
    },
    activeFocusHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    activeFocusIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.accentLineSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    activeFocusTitleRow: {
      flex: 1,
      minWidth: 0,
    },
    activeFocusTheme: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '600',
      lineHeight: 22,
      marginBottom: 2,
    },
    activeFocusWeek: {
      color: t.FOCUS_META,
      fontSize: 13,
      lineHeight: 17,
      fontWeight: '400',
    },
    activeFocusGoal: {
      color: t.FOCUS_BODY_SOFT,
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 12,
      fontStyle: 'italic',
    },
    activeFocusProgressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    activeFocusProgressTrack: {
      flex: 1,
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      overflow: 'hidden',
    },
    activeFocusProgressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 3,
    },
    activeFocusProgressLabel: {
      color: t.FOCUS_META,
      fontSize: 12,
      fontWeight: '600',
      minWidth: 32,
      textAlign: 'right',
    },
  });
}

/** Compatibilidad: tokens tema claro (imports legacy hasta migrar pantallas). */
const _light = getFocusTheme(lightColors, 'light');
export const FOCUS_CHEVRON_MUTED = _light.FOCUS_CHEVRON_MUTED;
export const FOCUS_KICKER_COLOR = _light.FOCUS_KICKER_COLOR;
export const FOCUS_KICKER_SOFT = _light.FOCUS_KICKER_SOFT;
export const FOCUS_META = _light.FOCUS_META;
export const FOCUS_META_SOFT = _light.FOCUS_META_SOFT;
export const FOCUS_BODY_SOFT = _light.FOCUS_BODY_SOFT;
export const FOCUS_BORDER_SUBTLE = _light.FOCUS_BORDER_SUBTLE;
export const FOCUS_ACCENT_BORDER = _light.FOCUS_ACCENT_BORDER;
export const FOCUS_PANEL = _light.FOCUS_PANEL;
export const FOCUS_INNER_ROW = _light.FOCUS_INNER_ROW;
export const FOCUS_ICON_WRAP = _light.FOCUS_ICON_WRAP;

/** @deprecated Preferir createDashboardFocusStyles(useTheme().colors, scheme) */
export const dashboardFocusStyles = createDashboardFocusStyles(lightColors, 'light');
