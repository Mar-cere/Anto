import { describe, expect, it } from '@jest/globals';
import {
  normalizeTccLiteState,
  saveTccLiteStateToConversation,
} from '../../../services/tccLiteConversationStateService.js';

describe('tccLiteConversationStateService', () => {
  it('normalizeTccLiteState rechaza pasos inválidos', () => {
    expect(normalizeTccLiteState({ step: 'invalid' })).toBeNull();
    expect(normalizeTccLiteState({ step: 'capture_thought' })?.step).toBe('capture_thought');
  });

  it('normalizeTccLiteState conserva completed', () => {
    expect(normalizeTccLiteState({ step: 'wrap_up', completed: true })?.completed).toBe(true);
  });

  it('saveTccLiteStateToConversation no lanza sin conversationId', async () => {
    await expect(saveTccLiteStateToConversation(null, { active: true, step: 'capture_thought' })).resolves.toBeUndefined();
  });
});
