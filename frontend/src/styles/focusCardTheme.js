/**
 * Bloque "foco" del dashboard: tokens y estilos compartidos según tema (claro / oscuro).
 */
import { StyleSheet } from 'react-native';
import { lightColors } from './themePalettes';
import { SPACING } from '../constants/ui';

/**
 * @param {typeof lightColors} colors
 * @param {'light'|'dark'} resolvedScheme
 */
export function getFocusTheme(colors, resolvedScheme = 'light') {
  const dark = resolvedScheme === 'dark';
  return {
    FOCUS_CHEVRON_MUTED: dark ? 'rgba(245, 247, 255, 0.36)' : 'rgba(36, 35, 79, 0.28)',
    /** Misma familia cromática que el resto del dashboard (primary / acentos). */
    FOCUS_KICKER_COLOR: colors.primary,
    FOCUS_KICKER_SOFT: dark ? colors.primaryBright : colors.primary,
    FOCUS_META: dark ? 'rgba(245, 247, 255, 0.58)' : 'rgba(36, 35, 79, 0.52)',
    FOCUS_META_SOFT: dark ? 'rgba(245, 247, 255, 0.46)' : 'rgba(36, 35, 79, 0.42)',
    FOCUS_BODY_SOFT: dark ? 'rgba(245, 247, 255, 0.9)' : 'rgba(36, 35, 79, 0.82)',
    FOCUS_BORDER_SUBTLE: colors.border,
    FOCUS_ACCENT_BORDER: colors.accentLine,
    FOCUS_PANEL: {
      alignSelf: 'stretch',
      marginBottom: 20,
      paddingVertical: 22,
      paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
      borderRadius: 22,
      backgroundColor: colors.cardBackground,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.glassOutline,
    },
    FOCUS_INNER_ROW: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 14,
      backgroundColor: dark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(36, 35, 79, 0.035)',
    },
    FOCUS_ICON_WRAP: {
      width: 40,
      height: 40,
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
  const rowBg = t.FOCUS_INNER_ROW.backgroundColor;
  const badgeBg = resolvedScheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(36, 35, 79, 0.06)';

  return StyleSheet.create({
    card: {
      ...t.FOCUS_PANEL,
      paddingVertical: 12,
      paddingHorizontal: 12,
    },
    kicker: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 2,
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
      backgroundColor: rowBg,
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
    lastSessionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'nowrap',
      width: '100%',
    },
    lastSessionHeadline: {
      flex: 1,
      minWidth: 0,
    },
    lastSessionBadge: {
      fontSize: 10,
      fontWeight: '600',
      color: t.FOCUS_META,
      backgroundColor: badgeBg,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      overflow: 'hidden',
      marginLeft: 8,
    },
    protocolRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 16,
      paddingRight: 4,
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
      fontWeight: '400',
      letterSpacing: -0.2,
      marginBottom: 18,
    },
    sparseLink: {
      alignSelf: 'flex-start',
      marginTop: -10,
      marginBottom: 14,
    },
    sparseLinkText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '500',
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
    commitmentRow: {
      marginBottom: 12,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: rowBg,
    },
    commitmentLabel: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 20,
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
