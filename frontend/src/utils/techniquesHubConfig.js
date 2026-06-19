/**
 * Configuración del hub de técnicas (navbar + pantalla principal).
 */

/** @typedef {{ key: string, screen: string, icon: string, iconSet?: 'ionicons'|'mci', labelKey: string, hintKey: string }} TechniquesHubItem */

export const TECHNIQUES_HUB_TEXT_KEYS = [
  'TITLE',
  'SUBTITLE',
  'QUICK_ACCESS',
  'CATALOG_SECTION',
  'POMODORO',
  'POMODORO_HINT',
];

/** @type {TechniquesHubItem[]} */
export const TECHNIQUES_HUB_FOCUS_TOOLS = [
  {
    key: 'pomodoro',
    screen: 'Pomodoro',
    icon: 'timer-outline',
    iconSet: 'mci',
    labelKey: 'POMODORO',
    hintKey: 'POMODORO_HINT',
  },
];

/** @returns {TechniquesHubItem[]} */
export function getTechniquesHubItems() {
  return [...TECHNIQUES_HUB_FOCUS_TOOLS];
}

/** Claves de copy usadas por filas del hub (label + hint). */
export const TECHNIQUES_HUB_ITEM_TEXT_KEYS = getTechniquesHubItems().flatMap((item) => [
  item.labelKey,
  item.hintKey,
]);

/** Rutas de stack que el hub puede abrir directamente desde filas estáticas. */
export const TECHNIQUES_HUB_TARGET_ROUTES = ['Pomodoro'];
