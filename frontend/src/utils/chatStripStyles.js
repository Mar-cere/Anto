/**
 * Estilos compartidos para franjas inferiores del chat (opacas, legibles en dark mode).
 */
import { StyleSheet } from 'react-native';
import { SPACING } from '../constants/ui';

/**
 * @param {import('../styles/themePalettes').lightColors} colors
 */
export function createChatStripWrapStyle() {
  return {
    marginHorizontal: SPACING.SCREEN_EDGE_INSET,
    marginBottom: SPACING.md,
  };
}

/**
 * @param {import('../styles/themePalettes').lightColors} colors
 */
export function createChatStripPanelStyle(colors) {
  return {
    backgroundColor: colors.modalSurface ?? colors.surface,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: SPACING.md,
    gap: SPACING.sm,
    shadowColor: colors.shadowAmbient ?? '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  };
}

/**
 * @param {import('../styles/themePalettes').lightColors} colors
 */
export function createChatStripItemStyle(colors) {
  return {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: colors.cardBackground ?? colors.chromeInput,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  };
}

/**
 * @param {import('../styles/themePalettes').lightColors} colors
 * @param {string} accentKey
 */
/** Altura aproximada reservada bajo la lista cuando hay franjas inferiores. */
export function estimateChatStripReserveHeight({
  tccContinuityCount = 0,
  softCrisisActive = false,
  tccLiteHandoff = false,
  crisisResources = false,
} = {}) {
  const PANEL_BASE = 52;
  const ROW = 68;
  let total = 0;
  if (tccLiteHandoff) total += PANEL_BASE + ROW;
  if (tccContinuityCount > 0) total += PANEL_BASE + tccContinuityCount * ROW;
  if (softCrisisActive) total += PANEL_BASE + ROW * 2;
  if (crisisResources) total += PANEL_BASE + ROW;
  // Respiro inferior del wrap (`createChatStripWrapStyle` → marginBottom md).
  return total > 0 ? total + SPACING.md : 0;
}

export function createChatStripIconWrapStyle(colors, accentKey = 'primary') {
  const accentMap = {
    primary: colors.primary,
    warning: colors.warning,
    error: colors.error,
    success: colors.success,
  };
  const accent = accentMap[accentKey] || colors.primary;
  return {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentLineSoft ?? `${accent}22`,
    marginRight: 10,
  };
}
