import { describe, expect, it } from '@jest/globals';
import {
  buildSensitiveVnpSystemSnippet,
  SENSITIVE_VNP_INTENSITY_MIN,
  shouldUseSensitiveVnpTemplate
} from '../../../services/chat/sensitiveResponseTemplate.js';

describe('sensitiveResponseTemplate', () => {
  it('no activa VNP con contexto inválido o conversación general suave', () => {
    expect(shouldUseSensitiveVnpTemplate(null)).toBe(false);
    expect(shouldUseSensitiveVnpTemplate(undefined)).toBe(false);
    expect(shouldUseSensitiveVnpTemplate([])).toBe(false);
    expect(shouldUseSensitiveVnpTemplate({})).toBe(false);
    expect(
      shouldUseSensitiveVnpTemplate({
        emotional: { intensity: SENSITIVE_VNP_INTENSITY_MIN - 1, requiresAttention: false },
        contextual: { intencion: { tipo: 'CONVERSACION_GENERAL' } }
      })
    ).toBe(false);
  });

  it('no activa con riesgo LOW ni string de riesgo vacío o desconocido', () => {
    expect(
      shouldUseSensitiveVnpTemplate({
        crisis: { riskLevel: 'LOW' }
      })
    ).toBe(false);
    expect(
      shouldUseSensitiveVnpTemplate({
        crisis: { riskLevel: '' }
      })
    ).toBe(false);
    expect(
      shouldUseSensitiveVnpTemplate({
        crisis: { riskLevel: 'UNKNOWN' }
      })
    ).toBe(false);
  });

  it('normaliza nivel de riesgo (mayúsculas / espacios)', () => {
    expect(
      shouldUseSensitiveVnpTemplate({
        crisis: { riskLevel: '  warning ' }
      })
    ).toBe(true);
    expect(
      shouldUseSensitiveVnpTemplate({
        crisis: { riskLevel: 'high' }
      })
    ).toBe(true);
  });

  it('activa con intensidad umbral, requiresAttention, intención, fase aguda o riesgo', () => {
    expect(
      shouldUseSensitiveVnpTemplate({
        emotional: { intensity: SENSITIVE_VNP_INTENSITY_MIN }
      })
    ).toBe(true);
    expect(
      shouldUseSensitiveVnpTemplate({ emotional: { intensity: '8' } })
    ).toBe(true);
    expect(
      shouldUseSensitiveVnpTemplate({ emotional: { requiresAttention: true, intensity: 3 } })
    ).toBe(true);
    expect(
      shouldUseSensitiveVnpTemplate({
        contextual: { intencion: { tipo: 'AYUDA_EMOCIONAL' } }
      })
    ).toBe(true);
    expect(
      shouldUseSensitiveVnpTemplate({
        contextual: { intencion: { tipo: '  ayuda_emocional  ' } }
      })
    ).toBe(true);
    expect(shouldUseSensitiveVnpTemplate({ sessionPhase: 'acute' })).toBe(true);
    expect(
      shouldUseSensitiveVnpTemplate({ crisis: { riskLevel: 'MEDIUM' } })
    ).toBe(true);
  });

  it('ignora intención no string o tipos no VNP', () => {
    expect(
      shouldUseSensitiveVnpTemplate({
        contextual: { intencion: { tipo: 123 } }
      })
    ).toBe(false);
    expect(
      shouldUseSensitiveVnpTemplate({
        contextual: { intencion: { tipo: 'CONSULTA_IMPORTANTE' } }
      })
    ).toBe(false);
  });

  it('buildSensitiveVnpSystemSnippet devuelve string vacío si no aplica', () => {
    expect(buildSensitiveVnpSystemSnippet({ emotional: { intensity: 3 } })).toBe('');
  });

  it('buildSensitiveVnpSystemSnippet incluye anclas V–N–P cuando aplica', () => {
    const s = buildSensitiveVnpSystemSnippet({ emotional: { intensity: 9 } });
    expect(s).toContain('### Turno sensible');
    expect(s).toContain('Validar');
    expect(s).toContain('Normalizar sin minimizar');
    expect(s).toContain('Una sola pregunta');
    expect(s.length).toBeLessThanOrEqual(1200);
  });
});
