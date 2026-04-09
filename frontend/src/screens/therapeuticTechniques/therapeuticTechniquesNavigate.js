/**
 * Navegación defensiva desde la pantalla de técnicas (evita crash si la ruta no existe).
 */

export function therapeuticSafeNavigate(navigation, routeName, params) {
  if (!navigation || typeof navigation.navigate !== 'function') return;
  try {
    navigation.navigate(routeName, params);
  } catch (e) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn('[TherapeuticTechniques] navigate failed:', routeName, e);
    }
  }
}
