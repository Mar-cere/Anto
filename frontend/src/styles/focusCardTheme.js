/**
 * Estilo del bloque "foco" del dashboard: tokens y StyleSheet compartidos
 * para paneles, filas internas y tipografía homogéneos.
 */
import { StyleSheet } from 'react-native';
import { colors } from './globalStyles';

export const FOCUS_CHEVRON_MUTED = 'rgba(255,255,255,0.35)';
export const FOCUS_KICKER_COLOR = 'rgba(163, 184, 232, 0.85)';
export const FOCUS_KICKER_SOFT = 'rgba(163, 184, 232, 0.75)';
export const FOCUS_META = 'rgba(255,255,255,0.55)';
export const FOCUS_META_SOFT = 'rgba(255,255,255,0.45)';
export const FOCUS_BODY_SOFT = 'rgba(255,255,255,0.72)';
export const FOCUS_BORDER_SUBTLE = 'rgba(255,255,255,0.08)';
export const FOCUS_ACCENT_BORDER = 'rgba(26, 221, 219, 0.22)';

/** Contenedor principal (misma superficie que DashboardFocusCard). */
export const FOCUS_PANEL = {
  alignSelf: 'stretch',
  marginBottom: 20,
  paddingVertical: 22,
  paddingHorizontal: 20,
  borderRadius: 22,
  backgroundColor: 'rgba(255,255,255,0.04)',
  borderWidth: StyleSheet.hairlineWidth,
  borderColor: 'rgba(255,255,255,0.1)',
};

/** Fila tipo recordatorio / ítem dentro del panel. */
export const FOCUS_INNER_ROW = {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 12,
  paddingHorizontal: 12,
  borderRadius: 14,
  backgroundColor: 'rgba(255,255,255,0.03)',
};

export const FOCUS_ICON_WRAP = {
  width: 40,
  height: 40,
  borderRadius: 12,
  backgroundColor: 'rgba(26, 221, 219, 0.1)',
  alignItems: 'center',
  justifyContent: 'center',
};

export const dashboardFocusStyles = StyleSheet.create({
  card: FOCUS_PANEL,
  kicker: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: FOCUS_KICKER_COLOR,
    marginBottom: 14,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  reminderRowPressable: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FOCUS_ACCENT_BORDER,
  },
  reminderIconWrap: {
    ...FOCUS_ICON_WRAP,
    marginRight: 12,
  },
  reminderCopy: {
    flex: 1,
    minWidth: 0,
  },
  reminderTitle: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  reminderMeta: {
    marginTop: 4,
    color: FOCUS_META,
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
    color: FOCUS_META,
    backgroundColor: 'rgba(255,255,255,0.06)',
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
    opacity: 0.85,
  },
  protocolText: {
    flex: 1,
    color: FOCUS_BODY_SOFT,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
  },
  focusHero: {
    color: 'rgba(255,255,255,0.94)',
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '300',
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
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: FOCUS_BORDER_SUBTLE,
  },
  nextTaskLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: FOCUS_KICKER_SOFT,
    marginBottom: 6,
  },
  nextTaskTitle: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '400',
  },
  nextTaskDue: {
    marginTop: 4,
    fontSize: 13,
    color: FOCUS_META_SOFT,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 999,
  },
  ctaText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  ctaArrow: {
    marginLeft: 8,
  },
});
