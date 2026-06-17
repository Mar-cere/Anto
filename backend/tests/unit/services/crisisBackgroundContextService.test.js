/**
 * Tests unitarios para contexto de acciones de crisis.
 */
import {
  buildConversationContextForCrisis,
  fetchCrisisTrendContext,
} from '../../../services/crisisBackgroundContextService.js';

describe('crisisBackgroundContextService', () => {
  it('buildConversationContextForCrisis devuelve señales conversacionales', () => {
    const history = [
      { role: 'user', content: 'estoy mal' },
      { role: 'assistant', content: 'te escucho' },
    ];
    const ctx = buildConversationContextForCrisis(history, 'no quiero seguir', {
      mainEmotion: 'tristeza',
      intensity: 8,
    });
    expect(ctx).toEqual(
      expect.objectContaining({
        emotionalEscalation: expect.any(Boolean),
        helpRejected: expect.any(Boolean),
        abruptToneChange: expect.any(Boolean),
        frequencyAnalysis: expect.anything(),
        silenceAfterNegative: expect.any(Boolean),
      }),
    );
  });

  it('fetchCrisisTrendContext omite trabajo en LOW sin intensidad alta', async () => {
    const result = await fetchCrisisTrendContext('507f1f77bcf86cd799439011', {
      basicRiskLevel: 'LOW',
      emotionalIntensity: 3,
    });
    expect(result).toEqual({ trendAnalysis: null, crisisHistory: null });
  });
});
