/**
 * Contexto persistente del origen del chat (botón atrás: Home vs Dash).
 *
 * Los `params` de React Navigation a veces se pierden al cambiar de foco o
 * rehidratar estado; este respaldo evita mandar al usuario al destino equivocado
 * tras una entrada de emergencia desde Home.
 *
 * Valores: 'home' | 'dash'. Se limpian al salir del chat (atrás) y en logout/login.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'chatEntryBackTarget_v1';

/**
 * @param {'home' | 'dash'} target
 */
export async function setChatEntryBackTarget(target) {
  if (target !== 'home' && target !== 'dash') return;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, target);
  } catch (e) {
    console.warn('[chatEntryContext] setChatEntryBackTarget:', e?.message);
  }
}

export async function getChatEntryBackTarget() {
  try {
    const v = await AsyncStorage.getItem(STORAGE_KEY);
    if (v === 'home' || v === 'dash') return v;
    return null;
  } catch {
    return null;
  }
}

export async function clearChatEntryBackTarget() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('[chatEntryContext] clearChatEntryBackTarget:', e?.message);
  }
}

/**
 * Prioridad: params de ruta (fuente de verdad en la misma sesión) → AsyncStorage → dash.
 * @param {{ chatBackTarget?: string } | undefined} routeParams
 * @returns {Promise<'home' | 'dash'>}
 */
export async function resolveChatBackTarget(routeParams) {
  const p = routeParams?.chatBackTarget;
  if (p === 'home' || p === 'dash') return p;
  const stored = await getChatEntryBackTarget();
  if (stored === 'home' || stored === 'dash') return stored;
  return 'dash';
}
