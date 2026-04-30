import { describe, expect, it, jest } from '@jest/globals';

describe('openai constants - chat turn policy env', () => {
  const original = {
    maxQuestions: process.env.CHAT_MAX_CONSECUTIVE_QUESTIONS,
    shortStreak: process.env.CHAT_SHORT_REPLY_STREAK_THRESHOLD,
    shortWords: process.env.CHAT_SHORT_REPLY_MAX_WORDS,
    distEarly: process.env.CHAT_DISTORTION_CONFIDENCE_MIN_EARLY,
    distMin: process.env.CHAT_DISTORTION_CONFIDENCE_MIN
  };

  afterEach(() => {
    jest.resetModules();
    Object.entries(original).forEach(([key, value]) => {
      const envKeyMap = {
        maxQuestions: 'CHAT_MAX_CONSECUTIVE_QUESTIONS',
        shortStreak: 'CHAT_SHORT_REPLY_STREAK_THRESHOLD',
        shortWords: 'CHAT_SHORT_REPLY_MAX_WORDS',
        distEarly: 'CHAT_DISTORTION_CONFIDENCE_MIN_EARLY',
        distMin: 'CHAT_DISTORTION_CONFIDENCE_MIN'
      };
      const envKey = envKeyMap[key];
      if (value === undefined) delete process.env[envKey];
      else process.env[envKey] = value;
    });
  });

  it('usa defaults conservadores/equilibrados', async () => {
    jest.resetModules();
    delete process.env.CHAT_MAX_CONSECUTIVE_QUESTIONS;
    delete process.env.CHAT_SHORT_REPLY_STREAK_THRESHOLD;
    delete process.env.CHAT_SHORT_REPLY_MAX_WORDS;
    delete process.env.CHAT_DISTORTION_CONFIDENCE_MIN_EARLY;
    delete process.env.CHAT_DISTORTION_CONFIDENCE_MIN;

    const { CHAT_TURN_POLICY, CONTEXT_INFERENCE_THRESHOLDS } = await import('../../../constants/openai.js');
    expect(CHAT_TURN_POLICY.MAX_CONSECUTIVE_QUESTIONS).toBe(2);
    expect(CHAT_TURN_POLICY.SHORT_REPLY_STREAK_THRESHOLD).toBe(2);
    expect(CHAT_TURN_POLICY.SHORT_REPLY_MAX_WORDS).toBe(4);
    expect(CONTEXT_INFERENCE_THRESHOLDS.DISTORTION_CONFIDENCE_MIN_EARLY).toBe(0.7);
    expect(CONTEXT_INFERENCE_THRESHOLDS.DISTORTION_CONFIDENCE_MIN).toBe(0.65);
  });
});

