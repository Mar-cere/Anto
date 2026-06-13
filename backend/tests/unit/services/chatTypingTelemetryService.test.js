import {
  computeCognitiveLoadScore,
  sanitizeTypingTelemetryPayload,
} from '../../../services/chatTypingTelemetryService.js';
import { extractTypingMetricsPayload } from '../../../utils/signalValidators.js';

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

  it('sanitizeTypingTelemetryPayload acota valores válidos', () => {
    const sanitized = sanitizeTypingTelemetryPayload({
      draftDurationMs: 5000,
      avgFlightTimeMs: 200,
      backspaceRate: 0.2,
      revisionCount: 1,
      charCountFinal: 120,
    });
    expect(sanitized.draftDurationMs).toBe(5000);
    expect(sanitized.backspaceRate).toBeLessThanOrEqual(1);
    expect(sanitized.cognitiveLoadScore).toBeLessThanOrEqual(1);
  });

  it('sanitizeTypingTelemetryPayload devuelve null sin señal mínima', () => {
    expect(sanitizeTypingTelemetryPayload({ draftDurationMs: 100 })).toBeNull();
    expect(extractTypingMetricsPayload({ metrics: { text: 'hola' } })).toBeNull();
  });
});
