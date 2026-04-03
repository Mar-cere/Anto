/**
 * Estado de reset para abrir MainTabs con la pestaña Chat enfocada.
 * Evita fallos de navigate anidado desde Home u otras pantallas del stack raíz.
 */
import { ROUTES } from '../constants/routes';

const MAIN_TAB_ROUTE_NAMES = ['Inicio', 'Chat', 'Perfil', 'Ajustes', 'FaQ'];
const CHAT_TAB_INDEX = MAIN_TAB_ROUTE_NAMES.indexOf('Chat');

/** AsyncStorage: usuario llegó desde el banner de emergencia en Home sin sesión */
export const NAV_STORAGE_OPEN_CHAT_AFTER_LOGIN = 'openChatAfterLogin';

/**
 * @param {{ startGuest?: boolean }} [options] — si `startGuest`, abre Chat en modo invitado (sin cuenta).
 */
export function getResetToMainTabsWithChatState(options = {}) {
  const { startGuest } = options;
  return {
    index: 0,
    routes: [
      {
        name: ROUTES.MAIN_TABS,
        state: {
          routes: MAIN_TAB_ROUTE_NAMES.map((name) => {
            if (name === 'Chat' && startGuest) {
              return { name: 'Chat', params: { startGuest: true } };
            }
            return { name };
          }),
          index: CHAT_TAB_INDEX,
        },
      },
    ],
  };
}
