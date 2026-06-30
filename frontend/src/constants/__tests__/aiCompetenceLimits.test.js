/**
 * Tests para biblioteca de límites IA (#194).
 */
import {
  AI_LIMIT_LIBRARY_ORDER,
  AI_LIMIT_TOPIC,
  isValidAiLimitTopicId,
} from '../aiCompetenceLimits';

describe('aiCompetenceLimits', () => {
  it('isValidAiLimitTopicId acepta ids conocidos', () => {
    expect(isValidAiLimitTopicId(AI_LIMIT_TOPIC.CRISIS)).toBe(true);
    expect(isValidAiLimitTopicId('unknown')).toBe(false);
    expect(isValidAiLimitTopicId(null)).toBe(false);
  });

  it('AI_LIMIT_LIBRARY_ORDER incluye temas clave de producto', () => {
    expect(AI_LIMIT_LIBRARY_ORDER).toEqual(
      expect.arrayContaining([
        AI_LIMIT_TOPIC.NOT_THERAPY,
        AI_LIMIT_TOPIC.CRISIS,
        AI_LIMIT_TOPIC.EMERGENCY_CONTACTS,
        AI_LIMIT_TOPIC.CHAT_ACTIONS,
      ]),
    );
  });
});
