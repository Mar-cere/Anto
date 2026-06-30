/**
 * Tests para biblioteca de límites IA (#194).
 */
import {
  AI_LIMIT_LIBRARY_ORDER,
  AI_LIMIT_TOPIC,
  isValidAiLimitTopicId,
} from '../aiCompetenceLimits';
import { INFO as INFO_ES } from '../translations/es';
import { INFO as INFO_EN } from '../translations/en';

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

  it('AI_LIMIT_LIBRARY_ORDER cubre todos los AI_LIMIT_TOPIC', () => {
    expect(AI_LIMIT_LIBRARY_ORDER).toHaveLength(Object.keys(AI_LIMIT_TOPIC).length);
    Object.values(AI_LIMIT_TOPIC).forEach((id) => {
      expect(AI_LIMIT_LIBRARY_ORDER).toContain(id);
    });
  });

  it.each([
    ['es', INFO_ES],
    ['en', INFO_EN],
  ])('traducciones %s tienen copy completo para cada tema', (_lang, info) => {
    const topics = info.AI_LIMITS_LIBRARY.TOPICS;
    AI_LIMIT_LIBRARY_ORDER.forEach((id) => {
      const topic = topics[id];
      expect(topic?.title?.trim()).toBeTruthy();
      expect(topic?.body?.trim()).toBeTruthy();
    });
  });
});
