import { describe, expect, it } from '@jest/globals';
import openaiService from '../../../services/openaiService.js';

describe('openaiService — protocolo estructurado de crisis', () => {
  it('agrega bloque mínimo cuando el riesgo es HIGH y faltan elementos clave', () => {
    const result = openaiService.enforceStructuredCrisisProtocol(
      'Estoy aquí contigo.',
      {
        crisis: { riskLevel: 'HIGH' },
        emotional: { intensity: 9 },
        contextual: { intencion: { tipo: 'CRISIS' } },
        userMessage: 'me quiero morir'
      }
    );

    expect(result).toContain('Protocolo de seguridad urgente');
    expect(result).toContain('¿Estás a salvo en este momento?');
    expect(result).toContain('¿Tienes cerca algo con lo que podrías hacerte daño ahora?');
    expect(result).toContain('Paso inmediato (5 minutos)');
  });

  it('no agrega bloque cuando no hay riesgo estructurado', () => {
    const base = 'Entiendo cómo te sientes. ¿Quieres contarme más?';
    const result = openaiService.enforceStructuredCrisisProtocol(base, {
      crisis: { riskLevel: 'LOW' },
      emotional: { intensity: 5 },
      contextual: { intencion: { tipo: 'CONVERSACION_GENERAL' } },
      userMessage: 'hoy me siento confundida'
    });
    expect(result).toBe(base);
  });
});
