/**
 * Navegación tolerante a fallos desde pantallas del dashboard de crisis.
 * @param {{ navigate?: Function; canGoBack?: Function; goBack?: Function } | undefined | null} navigation
 */

export function crisisSafeNavigate(navigation, routeName, params) {
  if (!navigation || typeof navigation.navigate !== 'function' || !routeName) {
    return false;
  }
  try {
    if (params !== undefined) {
      navigation.navigate(routeName, params);
    } else {
      navigation.navigate(routeName);
    }
    return true;
  } catch (e) {
    const msg = e && typeof e === 'object' && 'message' in e ? String(e.message) : String(e);
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn('[CrisisDashboard] crisisSafeNavigate:', msg);
    }
    return false;
  }
}

export function crisisSafeGoBack(navigation) {
  if (!navigation || typeof navigation.canGoBack !== 'function' || typeof navigation.goBack !== 'function') {
    return false;
  }
  try {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return true;
    }
  } catch (e) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn('[CrisisDashboard] crisisSafeGoBack:', e);
    }
  }
  return false;
}
