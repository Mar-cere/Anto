import { CommonActions } from '@react-navigation/native';
import {
  CHAT_BACK_TARGET,
  dispatchResetToMainTabsWithChat,
  dispatchRootReset,
  getResetToMainTabsWithChatState,
  getRootNavigation,
} from '../navigationHelpers';

describe('navigationHelpers', () => {
  it('getRootNavigation sube hasta el padre raíz', () => {
    const root = { dispatch: jest.fn() };
    const child = { getParent: () => root };
    const leaf = { getParent: () => child };
    expect(getRootNavigation(leaf)).toBe(root);
  });

  it('dispatchRootReset envuelve CommonActions.reset', () => {
    const dispatch = jest.fn();
    const navigation = { getParent: () => null, dispatch };
    const state = { index: 0, routes: [{ name: 'Home' }] };

    expect(dispatchRootReset(navigation, state)).toBe(true);
    expect(dispatch).toHaveBeenCalledWith(CommonActions.reset(state));
  });

  it('dispatchRootReset rechaza estado inválido', () => {
    const dispatch = jest.fn();
    const navigation = { getParent: () => null, dispatch };
    expect(dispatchRootReset(navigation, null)).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('dispatchResetToMainTabsWithChat abre Chat con params', () => {
    const dispatch = jest.fn();
    const navigation = { getParent: () => null, dispatch };
    const resume = { eligible: true, distortionType: 'catastrophizing' };

    expect(
      dispatchResetToMainTabsWithChat(navigation, {
        chatBackTarget: CHAT_BACK_TARGET.DASH,
        resumeTccLite: resume,
      }),
    ).toBe(true);

    const action = dispatch.mock.calls[0][0];
    expect(action.type).toBe('RESET');
    const chatRoute = action.payload.routes[0].state.routes.find((r) => r.name === 'Chat');
    expect(chatRoute.params.resumeTccLite).toEqual(resume);
  });

  it('getResetToMainTabsWithChatState devuelve estado válido', () => {
    const state = getResetToMainTabsWithChatState({ chatBackTarget: CHAT_BACK_TARGET.HOME });
    expect(state.routes[0].state.index).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(state.routes[0].state.routes)).toBe(true);
  });

  it('getResetToMainTabsWithChatState acepta chatParams de sesión programada', () => {
    const state = getResetToMainTabsWithChatState({
      chatParams: {
        scheduledSessionId: 'sess-1',
        source: 'scheduled_session_notification',
        responseLatency: 1200,
      },
    });
    const chatRoute = state.routes[0].state.routes.find((r) => r.name === 'Chat');
    expect(chatRoute.params).toEqual({
      scheduledSessionId: 'sess-1',
      source: 'scheduled_session_notification',
      responseLatency: 1200,
    });
  });
});
