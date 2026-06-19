/**
 * Navegación del hub de técnicas y retorno desde Pomodoro.
 */

export const TECHNIQUES_HUB_ROUTE = 'Techniques';
export const POMODORO_ROUTE = 'Pomodoro';
export const THERAPEUTIC_TECHNIQUES_ROUTE = 'TherapeuticTechniques';

/**
 * @param {import('@react-navigation/native').NavigationProp<Record<string, object | undefined>>} navigation
 * @param {string} routeName
 * @param {object} [params]
 */
export function openTechniquesHubScreen(navigation, routeName, params) {
  if (!navigation || typeof navigation.navigate !== 'function') return;
  try {
    navigation.navigate(routeName, params);
  } catch (e) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn('[TechniquesHub] navigate failed:', routeName, e);
    }
  }
}

/**
 * Vuelve atrás si hay historial; si no, abre el hub de técnicas (deep link directo a Pomodoro).
 * @param {import('@react-navigation/native').NavigationProp<Record<string, object | undefined>>} navigation
 * @param {(() => void) | null | undefined} customHandler
 */
export function resolvePomodoroBackHandler(navigation, customHandler) {
  if (typeof customHandler === 'function') return customHandler;
  return () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }
    openTechniquesHubScreen(navigation, TECHNIQUES_HUB_ROUTE);
  };
}

/**
 * @param {import('@react-navigation/native').NavigationProp<Record<string, object | undefined>>} navigation
 */
export function openPomodoroFromTechniquesHub(navigation) {
  openTechniquesHubScreen(navigation, POMODORO_ROUTE);
}
