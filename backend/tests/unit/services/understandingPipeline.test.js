import { describe, expect, it } from '@jest/globals';
import {
  UNDERSTANDING_PIPELINE_SNIPPET_MAX_CHARS,
  buildUnderstandingPipelineSnippet,
  buildUnderstandingSnapshot,
  sanitizeUnderstandingLabel
} from '../../../services/chat/understandingPipeline.js';

describe('understandingPipeline (#56)', () => {
  it('sanitizeUnderstandingLabel elimina control chars y acota longitud', () => {
    expect(sanitizeUnderstandingLabel('  hola  ')).toBe('hola');
    expect(sanitizeUnderstandingLabel('a\nb\rc')).toBe('a b c');
    expect(sanitizeUnderstandingLabel('x'.repeat(100))?.length).toBeLessThanOrEqual(73);
  });

  it('buildUnderstandingSnapshot devuelve null con contexto inválido', () => {
    expect(buildUnderstandingSnapshot(null)).toBe(null);
    expect(buildUnderstandingSnapshot([])).toBe(null);
    expect(buildUnderstandingSnapshot({})).toBe(null);
  });

  it('buildUnderstandingSnapshot agrega campos conocidos', () => {
    const s = buildUnderstandingSnapshot({
      emotional: { mainEmotion: 'ansiedad', intensity: 7 },
      contextual: {
        intencion: { tipo: 'AYUDA_EMOCIONAL', confianza: 0.8 },
        urgencia: 'ALTA',
        tema: { categoria: 'EMOCIONAL', confianza: 0.8 }
      },
      crisis: { riskLevel: 'WARNING' }
    });
    expect(s).toMatchObject({
      intencionTipo: 'AYUDA_EMOCIONAL',
      intencionConfPct: 80,
      urgencia: 'ALTA',
      emocion: 'ansiedad',
      intensidad: 7,
      temaCategoria: 'EMOCIONAL',
      crisisRisk: 'WARNING'
    });
  });

  it('no emite snippet en turno totalmente basal (ahorra tokens)', () => {
    expect(
      buildUnderstandingPipelineSnippet({
        emotional: { mainEmotion: 'neutral', intensity: 5 },
        contextual: {
          intencion: { tipo: 'CONVERSACION_GENERAL', confianza: 0.5 },
          urgencia: 'NORMAL',
          tema: { categoria: 'GENERAL', confianza: 0.5 }
        }
      })
    ).toBe('');
  });

  it('emite snippet si la intención no es conversación general', () => {
    const sn = buildUnderstandingPipelineSnippet({
      emotional: { mainEmotion: 'neutral', intensity: 5 },
      contextual: {
        intencion: { tipo: 'AYUDA_EMOCIONAL', confianza: 0.8 },
        urgencia: 'NORMAL',
        tema: { categoria: 'GENERAL' }
      }
    });
    expect(sn).toContain('Entendimiento previo');
    expect(sn).toContain('AYUDA_EMOCIONAL');
    expect(sn.length).toBeLessThanOrEqual(UNDERSTANDING_PIPELINE_SNIPPET_MAX_CHARS);
  });

  it('normaliza confianza en escala 0–1, porcentaje 1–100 y string numérico', () => {
    expect(
      buildUnderstandingSnapshot({
        contextual: { intencion: { tipo: 'CRISIS', confianza: 0.75 } }
      })?.intencionConfPct
    ).toBe(75);
    expect(
      buildUnderstandingSnapshot({
        contextual: { intencion: { tipo: 'CRISIS', confianza: 82 } }
      })?.intencionConfPct
    ).toBe(82);
    expect(
      buildUnderstandingSnapshot({
        contextual: { intencion: { tipo: 'CRISIS', confianza: '0.9' } }
      })?.intencionConfPct
    ).toBe(90);
  });

  it('acota intensidad al rango válido y urgencia en mayúsculas conocidas', () => {
    const s = buildUnderstandingSnapshot({
      emotional: { mainEmotion: 'miedo', intensity: 99 },
      contextual: { intencion: { tipo: 'AYUDA_EMOCIONAL' }, urgencia: 'alta' }
    });
    expect(s?.intensidad).toBe(10);
    expect(s?.urgencia).toBe('ALTA');
  });

  it('descarta urgencia desconocida (no inyecta etiqueta falsa)', () => {
    const s = buildUnderstandingSnapshot({
      contextual: { intencion: { tipo: 'AYUDA_EMOCIONAL' }, urgencia: 'XYZ' }
    });
    expect(s?.urgencia).toBe(null);
  });

  it('emite snippet si la intensidad supera el umbral basal (>5) aunque la intención sea general', () => {
    const sn = buildUnderstandingPipelineSnippet({
      emotional: { mainEmotion: 'neutral', intensity: 6 },
      contextual: {
        intencion: { tipo: 'CONVERSACION_GENERAL', confianza: 0.5 },
        urgencia: 'NORMAL',
        tema: { categoria: 'GENERAL' }
      }
    });
    expect(sn).toContain('Entendimiento previo');
    expect(sn).toContain('6/10');
  });

  it('emite snippet si hay riesgo crisis aunque el resto sea basal', () => {
    const sn = buildUnderstandingPipelineSnippet({
      emotional: { mainEmotion: 'neutral', intensity: 5 },
      contextual: {
        intencion: { tipo: 'CONVERSACION_GENERAL', confianza: 0.5 },
        urgencia: 'NORMAL',
        tema: { categoria: 'GENERAL' }
      },
      crisis: { riskLevel: 'WARNING' }
    });
    expect(sn).toContain('WARNING');
  });
});
