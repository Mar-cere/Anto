/**
 * Tests — util de completed (#127)
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import chatService from '../../services/chatService';
import {
  createInterventionCompletedRecorder,
  recordInterventionCompleted,
  recordInterventionCompletedIfInlineSuggestion,
  recordLibraryInterventionOpened,
  shouldRecordInterventionCompletedOnSuggestionPress,
} from '../recordInterventionCompleted';
import { CHAT_SESSION_KEYS } from '../chatSessionStorage';

jest.mock('../../services/chatService', () => ({
  __esModule: true,
  default: {
    submitInterventionEvent: jest.fn(() => Promise.resolve()),
    submitUserInterventionEvent: jest.fn(() => Promise.resolve()),
  },
}));

describe('recordInterventionCompleted', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('no envía si el id es inválido', async () => {
    recordInterventionCompleted('INVALID!');
    await new Promise((r) => setTimeout(r, 0));
    expect(chatService.submitInterventionEvent).not.toHaveBeenCalled();
  });

  it('no envía sin conversationId', async () => {
    recordInterventionCompleted('breathing_exercise');
    await new Promise((r) => setTimeout(r, 0));
    expect(chatService.submitInterventionEvent).not.toHaveBeenCalled();
  });

  it('envía completed con conversationId válido', async () => {
    const convId = '507f1f77bcf86cd799439011';
    await AsyncStorage.setItem(CHAT_SESSION_KEYS.CONVERSATION_ID, convId);
    recordInterventionCompleted('breathing_exercise');
    await new Promise((r) => setTimeout(r, 0));
    expect(chatService.submitInterventionEvent).toHaveBeenCalledWith(convId, {
      interventionId: 'breathing_exercise',
      eventType: 'completed',
    });
    expect(chatService.submitUserInterventionEvent).not.toHaveBeenCalled();
  });

  it('usa fallback de usuario sin conversationId', async () => {
    recordInterventionCompleted('breathing_exercise');
    await new Promise((r) => setTimeout(r, 0));
    expect(chatService.submitInterventionEvent).not.toHaveBeenCalled();
    expect(chatService.submitUserInterventionEvent).toHaveBeenCalledWith({
      interventionId: 'breathing_exercise',
      eventType: 'completed',
    });
  });
});

describe('recordLibraryInterventionOpened', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('envía opened vía API de usuario', async () => {
    recordLibraryInterventionOpened('abc_record', { topicTag: 'patrones' });
    await new Promise((r) => setTimeout(r, 0));
    expect(chatService.submitUserInterventionEvent).toHaveBeenCalledWith({
      interventionId: 'abc_record',
      eventType: 'opened',
      source: 'library_v1',
      topicTag: 'patrones',
    });
  });
});

describe('createInterventionCompletedRecorder', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('solo registra una vez por instancia', async () => {
    const convId = '507f1f77bcf86cd799439011';
    await AsyncStorage.setItem(CHAT_SESSION_KEYS.CONVERSATION_ID, convId);
    const record = createInterventionCompletedRecorder();
    record('self_care');
    record('self_care');
    await new Promise((r) => setTimeout(r, 0));
    expect(chatService.submitInterventionEvent).toHaveBeenCalledTimes(1);
  });
});

describe('shouldRecordInterventionCompletedOnSuggestionPress', () => {
  it('devuelve true para micro_guide', () => {
    expect(
      shouldRecordInterventionCompletedOnSuggestionPress({
        id: 'reframing_tool',
        interventionType: 'micro_guide',
        screen: null,
      }),
    ).toBe(true);
  });

  it('devuelve true para support con pantalla', () => {
    expect(
      shouldRecordInterventionCompletedOnSuggestionPress({
        id: 'support_contact',
        interventionType: 'support',
        screen: 'Profile',
      }),
    ).toBe(true);
  });

  it('devuelve false para exercise con pantalla', () => {
    expect(
      shouldRecordInterventionCompletedOnSuggestionPress({
        id: 'behavioral_activation',
        interventionType: 'exercise',
        screen: 'BehavioralActivation',
      }),
    ).toBe(false);
  });
});

describe('recordInterventionCompletedIfInlineSuggestion', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('envía completed para micro_guide con conversationId', async () => {
    const convId = '507f1f77bcf86cd799439011';
    await AsyncStorage.setItem(CHAT_SESSION_KEYS.CONVERSATION_ID, convId);
    recordInterventionCompletedIfInlineSuggestion({
      id: 'reframing_tool',
      interventionType: 'micro_guide',
    });
    await new Promise((r) => setTimeout(r, 0));
    expect(chatService.submitInterventionEvent).toHaveBeenCalledWith(convId, {
      interventionId: 'reframing_tool',
      eventType: 'completed',
    });
  });
});
