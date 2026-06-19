/**
 * Configuración del hub de técnicas (navbar + pantalla principal).
 */

/** @typedef {{ key: string, screen: string, icon: string, iconSet?: 'ionicons'|'mci', labelKey: string, hintKey: string }} TechniquesHubItem */

export const TECHNIQUES_HUB_TEXT_KEYS = [
  'TITLE',
  'FOCUS_SECTION',
  'GUIDED_SECTION',
  'POMODORO',
  'POMODORO_HINT',
  'BA',
  'BA_HINT',
  'ABC',
  'ABC_HINT',
  'EXPOSURE',
  'EXPOSURE_HINT',
  'ALL_TECHNIQUES',
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

/** @type {TechniquesHubItem[]} */
export const TECHNIQUES_HUB_GUIDED = [
  {
    key: 'ba',
    screen: 'BehavioralActivation',
    icon: 'walk',
    iconSet: 'mci',
    labelKey: 'BA',
    hintKey: 'BA_HINT',
  },
  {
    key: 'abc',
    screen: 'AbcRecord',
    icon: 'clipboard-text-outline',
    iconSet: 'mci',
    labelKey: 'ABC',
    hintKey: 'ABC_HINT',
  },
  {
    key: 'exposure',
    screen: 'ExposureHierarchy',
    icon: 'stairs',
    iconSet: 'mci',
    labelKey: 'EXPOSURE',
    hintKey: 'EXPOSURE_HINT',
  },
];

/** @returns {TechniquesHubItem[]} */
export function getTechniquesHubItems() {
  return [...TECHNIQUES_HUB_FOCUS_TOOLS, ...TECHNIQUES_HUB_GUIDED];
}

/** Claves de copy usadas por filas del hub (label + hint). */
export const TECHNIQUES_HUB_ITEM_TEXT_KEYS = getTechniquesHubItems().flatMap((item) => [
  item.labelKey,
  item.hintKey,
]);

/** Rutas de stack que el hub puede abrir directamente. */
export const TECHNIQUES_HUB_TARGET_ROUTES = [
  'Pomodoro',
  'BehavioralActivation',
  'AbcRecord',
  'ExposureHierarchy',
  'TherapeuticTechniques',
];
