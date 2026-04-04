/**
 * Estado de reset para abrir MainTabs con la pestaña Chat enfocada.
 * Evita fallos de navigate anidado desde Home u otras pantallas del stack raíz.
 */
import { ROUTES } from '../constants/routes';
import { setChatEntryBackTarget } from '../utils/chatEntryContext';

const MAIN_TAB_ROUTE_NAMES = ['Inicio', 'Chat', 'Perfil', 'Ajustes', 'FaQ'];
const CHAT_TAB_INDEX = MAIN_TAB_ROUTE_NAMES.indexOf('Chat');
const INICIO_TAB_INDEX = MAIN_TAB_ROUTE_NAMES.indexOf('Inicio');

/** AsyncStorage: usuario llegó desde el banner de emergencia en Home sin sesión */
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
  const { startGuest, chatBackTarget } = options;
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
 * Entrada “emergencia” desde Home (o login tras banner): persiste destino del atrás
 * y resetea a MainTabs + Chat con params alineados.
 */
export async function openEmergencyChatFromHome(navigation) {
  await setChatEntryBackTarget('home');
  navigation.reset(
    getResetToMainTabsWithChatState({ chatBackTarget: CHAT_BACK_TARGET.HOME })
  );
}
