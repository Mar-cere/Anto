import { describe, expect, it } from '@jest/globals';
import {
  CLARIFY_MIN_USER_MESSAGE_CHARS,
  LOW_INTENT_CONFIDENCE_THRESHOLD,
  buildLowConfidenceClarifySnippet,
  shouldUseLowConfidenceClarifySnippet
} from '../../../services/chat/lowConfidenceClarifyTemplate.js';

const longMsg = 'a'.repeat(Math.max(CLARIFY_MIN_USER_MESSAGE_CHARS + 5, 50));

describe('lowConfidenceClarifyTemplate (#57)', () => {
  it('rechaza contexto inválido o mensaje corto', () => {
    expect(shouldUseLowConfidenceClarifySnippet(null)).toBe(false);
    expect(shouldUseLowConfidenceClarifySnippet([])).toBe(false);
    expect(
      shouldUseLowConfidenceClarifySnippet({
        currentMessage: 'corto',
        contextual: { intencion: { tipo: 'CONVERSACION_GENERAL', confianza: 0.3 } }
      })
    ).toBe(false);
  });

  it('activa con confianza bajo umbral, mensaje largo e intención no crisis', () => {
    expect(
      shouldUseLowConfidenceClarifySnippet({
        currentMessage: longMsg,
        contextual: { intencion: { tipo: 'CONVERSACION_GENERAL', confianza: 0.5 } }
      })
    ).toBe(true);
  });

  it('no activa con confianza alta (match fuerte del clasificador)', () => {
    expect(
      shouldUseLowConfidenceClarifySnippet({
        currentMessage: longMsg,
        contextual: { intencion: { tipo: 'AYUDA_EMOCIONAL', confianza: 0.8 } }
      })
    ).toBe(false);
  });

  it('no activa en crisis MEDIUM/HIGH ni intención CRISIS ni fase aguda', () => {
    expect(
      shouldUseLowConfidenceClarifySnippet({
        currentMessage: longMsg,
        crisis: { riskLevel: 'HIGH' },
        contextual: { intencion: { tipo: 'CONVERSACION_GENERAL', confianza: 0.4 } }
      })
    ).toBe(false);
    expect(
      shouldUseLowConfidenceClarifySnippet({
        currentMessage: longMsg,
        contextual: { intencion: { tipo: 'CRISIS', confianza: 0.9 } }
      })
    ).toBe(false);
    expect(
      shouldUseLowConfidenceClarifySnippet({
        currentMessage: longMsg,
        sessionPhase: 'acute',
        contextual: { intencion: { tipo: 'CONVERSACION_GENERAL', confianza: 0.4 } }
      })
    ).toBe(false);
  });

  it('acepta confianza como string numérico', () => {
    expect(
      shouldUseLowConfidenceClarifySnippet({
        currentMessage: longMsg,
        contextual: { intencion: { tipo: 'CONVERSACION_GENERAL', confianza: '0.5' } }
      })
    ).toBe(true);
  });

  it('no activa si falta confianza parseable', () => {
    expect(
      shouldUseLowConfidenceClarifySnippet({
        currentMessage: longMsg,
        contextual: { intencion: { tipo: 'CONVERSACION_GENERAL', confianza: NaN } }
      })
    ).toBe(false);
  });

  it('buildLowConfidenceClarifySnippet incluye anclas y respeta umbral', () => {
    const sn = buildLowConfidenceClarifySnippet({
      currentMessage: longMsg,
      contextual: { intencion: { tipo: 'CONVERSACION_GENERAL', confianza: 0.5 } }
    });
    expect(sn).toContain('Baja certeza interpretativa');
    expect(sn).toContain('una sola pregunta');
    expect(sn.length).toBeLessThanOrEqual(620);
  });

  it('el umbral documentado es coherente con el clasificador por defecto (0.5)', () => {
    expect(0.5).toBeLessThan(LOW_INTENT_CONFIDENCE_THRESHOLD);
  });
});
