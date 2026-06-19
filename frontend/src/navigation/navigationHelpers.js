/**
 * Estado de reset para abrir MainTabs con la pestaña Chat enfocada.
 * Evita fallos de navigate anidado desde Home u otras pantallas del stack raíz.
 */
import { CommonActions } from '@react-navigation/native';
import { ROUTES } from '../constants/routes';
import { setChatEntryBackTarget } from '../utils/chatEntryContext';

const MAIN_TAB_ROUTE_NAMES = ['Inicio', 'Chat', 'Perfil', 'Ajustes', 'FaQ'];
const CHAT_TAB_INDEX = MAIN_TAB_ROUTE_NAMES.indexOf('Chat');
const INICIO_TAB_INDEX = MAIN_TAB_ROUTE_NAMES.indexOf('Inicio');

/** AsyncStorage legacy key (ya no usado). */
export const NAV_STORAGE_OPEN_CHAT_AFTER_LOGIN = 'openChatAfterLogin';

/**
 * A dónde debe volver el botón atrás del chat.
 * - `home`: entrada tipo emergencia desde HomeScreen (pantalla de bienvenida).
 * - `dash`: flujo normal logueado (tabs / Dash como inicio).
 */
export const CHAT_BACK_TARGET = {
  HOME: 'home',
  DASH: 'dash',
};

/**
 * @param {{ startGuest?: boolean, chatBackTarget?: 'home' | 'dash' }} [options]
 *   — `startGuest`: modo invitado. `chatBackTarget`: solo `home` se persiste en params (dash es el default).
 */
export function getResetToMainTabsWithChatState(options = {}) {
  const { startGuest, chatBackTarget, resumeTccLite } = options;
  return {
    index: 0,
    routes: [
      {
        name: ROUTES.MAIN_TABS,
        state: {
          routes: MAIN_TAB_ROUTE_NAMES.map((name) => {
            if (name !== 'Chat') return { name };
            const params = {};
            if (startGuest) params.startGuest = true;
            if (chatBackTarget === CHAT_BACK_TARGET.HOME) {
              params.chatBackTarget = CHAT_BACK_TARGET.HOME;
            }
            if (resumeTccLite && typeof resumeTccLite === 'object') {
              params.resumeTccLite = resumeTccLite;
            }
            return Object.keys(params).length ? { name: 'Chat', params } : { name: 'Chat' };
          }),
          index: CHAT_TAB_INDEX,
        },
      },
    ],
  };
}

/**
 * Vuelve al área logueada con la pestaña Inicio (Dash) activa.
 * Útil al salir del chat: evita `goBack()` que dejaba el stack o tabs en estado incoherente.
 */
export function getResetToMainTabsWithInicioState() {
  return {
    index: 0,
    routes: [
      {
        name: ROUTES.MAIN_TABS,
        state: {
          routes: MAIN_TAB_ROUTE_NAMES.map((name) => ({ name })),
          index: INICIO_TAB_INDEX,
        },
      },
    ],
  };
}

/**
 * Navegador raíz (stack principal) desde cualquier pantalla anidada.
 * @param {import('@react-navigation/native').NavigationProp<Record<string, unknown>>} navigation
 */
export function getRootNavigation(navigation) {
  let nav = navigation;
  while (nav?.getParent?.()) nav = nav.getParent();
  return nav;
}

/**
 * Reset en el stack raíz. Siempre envuelve con CommonActions.reset.
 * @param {import('@react-navigation/native').NavigationProp<Record<string, unknown>>} navigation
 * @param {object} state
 * @returns {boolean} true si se despachó la acción
 */
export function dispatchRootReset(navigation, state) {
  if (!state || typeof state !== 'object') return false;
  const root = getRootNavigation(navigation);
  if (!root?.dispatch) return false;
  root.dispatch(CommonActions.reset(state));
  return true;
}

/**
 * Reset a MainTabs con Chat activo (TCC lite, emergencia, etc.).
 * @param {import('@react-navigation/native').NavigationProp<Record<string, unknown>>} navigation
 * @param {Parameters<typeof getResetToMainTabsWithChatState>[0]} [options]
 * @returns {boolean}
 */
export function dispatchResetToMainTabsWithChat(navigation, options = {}) {
  return dispatchRootReset(navigation, getResetToMainTabsWithChatState(options));
}
