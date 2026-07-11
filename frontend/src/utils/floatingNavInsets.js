import { Platform } from 'react-native';
import { SPACING } from '../constants/ui';

/** Debe coincidir con FloatingNavBar (barChrome + padding inferior interno). */
const NAV_BAR_STACK_HEIGHT = 64 + 8;
/** Botón central con marginTop negativo que sobresale hacia el contenido. */
const NAV_CENTER_BUTTON_PROTRUSION = 22;
/** Respiro extra para que el último bloque no quede bajo la barra al hacer scroll. */
const NAV_SCROLL_BREATHING_ROOM = 36;

/**
 * `bottom` del dock (misma fórmula que FloatingNavBar).
 * @param {number} safeBottomInset
 */
export function getFloatingNavDockBottom(safeBottomInset = 0) {
  const raw = Number(safeBottomInset);
  const bottom = Number.isFinite(raw) && raw >= 0 ? raw : 0;
  const webFallback = Math.max(0, Number(SPACING.FLOATING_NAV_DOCK_FALLBACK_BOTTOM_WEB) || 0);
  const bottomInsetEffective =
    bottom > 0 ? bottom : Platform.OS === 'web' ? webFallback : 0;
  const relief = Math.max(0, Number(SPACING.FLOATING_NAV_DOCK_INSET_RELIEF) || 0);
  const aboveSafe = Number(SPACING.FLOATING_NAV_DOCK_ABOVE_SAFE) || 0;
  const minDock = Math.max(0, Number(SPACING.FLOATING_NAV_DOCK_MIN_FROM_BOTTOM) || 0);
  return Math.max(minDock, bottomInsetEffective - relief + aboveSafe);
}

/**
 * Altura de spacer / padding inferior para ScrollView con FloatingNavBar.
 * @param {number} safeBottomInset — `useSafeAreaInsets().bottom`
 */
export function getFloatingNavScrollBottomInset(safeBottomInset = 0) {
  const dockBottom = getFloatingNavDockBottom(safeBottomInset);
  const geometry =
    dockBottom + NAV_BAR_STACK_HEIGHT + NAV_CENTER_BUTTON_PROTRUSION + NAV_SCROLL_BREATHING_ROOM;
  const raw = Number(safeBottomInset);
  const bottom = Number.isFinite(raw) && raw >= 0 ? raw : 0;
  const legacy = bottom + SPACING.FLOATING_NAV_SCROLL_BOTTOM_EXTRA;
  return Math.max(geometry, legacy);
}
