import {
  computeCognitiveLoadScore,
  sanitizeTypingTelemetryPayload,
} from '../../../services/chatTypingTelemetryService.js';

describe('chatTypingTelemetryService', () => {
  it('computeCognitiveLoadScore sube con backspace y revisiones', () => {
    const low = computeCognitiveLoadScore({
      draftDurationMs: 1000,
      avgFlightTimeMs: 100,
      backspaceRate: 0.05,
      revisionCount: 0,
    });
    const high = computeCognitiveLoadScore({
      draftDurationMs: 60000,
      avgFlightTimeMs: 700,
      backspaceRate: 0.45,
      revisionCount: 4,
    });
    expect(high).toBeGreaterThan(low);
  });

  it('sanitizeTypingTelemetryPayload acota valores', () => {
    const sanitized = sanitizeTypingTelemetryPayload({
      draftDurationMs: 9999999,
      avgFlightTimeMs: 99999,
      backspaceRate: 2,
      revisionCount: 100,
      charCountFinal: 99999,
    });
    expect(sanitized.draftDurationMs).toBeLessThanOrEqual(600000);
    expect(sanitized.backspaceRate).toBeLessThanOrEqual(1);
    expect(sanitized.cognitiveLoadScore).toBeLessThanOrEqual(1);
  });
});
