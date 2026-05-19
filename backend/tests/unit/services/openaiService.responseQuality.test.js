import { describe, expect, it } from '@jest/globals';
import openaiService from '../../../services/openaiService.js';
import { stripPrematureSessionClosurePhrases } from '../../../services/sessionRetentionHints.js';

describe('openaiService — guardrails de calidad de respuesta', () => {
  it('enforceSingleQuestion deja solo una pregunta', () => {
    const input = 'Te entiendo. ¿Qué pasó hoy? ¿Y cómo te sentiste después?';
    const output = openaiService.enforceSingleQuestion(input);
    const qCount = (output.match(/\?/g) || []).length;
    expect(qCount).toBe(1);
  });

  it('enforceShortResponseQuality limita longitud y frases', () => {
    const input =
      'Primero quiero decirte que te leo con mucha atención. Lo que cuentas suena pesado y válido. Si te parece, podemos ordenar esto en pasos para hoy. ¿Qué parte te pesa más en este momento?';
    const output = openaiService.enforceShortResponseQuality(input);
    const sentenceCount = output.split(/(?<=[.!?])\s+/).filter(Boolean).length;
    expect(output.length).toBeLessThanOrEqual(181);
    expect(sentenceCount).toBeLessThanOrEqual(2);
  });

  it('enforceFactualCaution agrega cautela cuando falta', () => {
    const input = 'Tina Turner nació el 26 de noviembre de 1939.';
    const output = openaiService.enforceFactualCaution(input);
    expect(output).toContain('puedo verificar este dato');
  });

  it('reduceStockEmpathyDensity limpia repeticiones de empatía mecánica', () => {
    const input =
      'Entiendo. Comprendo. Es válido lo que sientes, es válido. Estoy aquí contigo, estoy aquí contigo. ¿Qué pasó hoy?';
    const output = openaiService.reduceStockEmpathyDensity(input);
    expect(output.toLowerCase()).not.toContain('entiendo. comprendo.');
    expect(output.toLowerCase()).not.toContain('estoy aquí contigo, estoy aquí contigo');
    expect(output).toContain('¿Qué pasó hoy?');
  });

  it('enforceSessionClosureBridge agrega cierre suave en despedida explícita', () => {
    const input = 'Gracias por contarme todo esto.';
    const output = openaiService.enforceSessionClosureBridge(input, {
      sessionRetention: { userTurnCount: 2, likelyFarewell: false },
      conversationPattern: { closureRisk: true },
      crisis: { riskLevel: 'LOW' }
    });
    expect(output).toContain('retom');
  });

  it('enforceSessionClosureBridge no aplica en crisis MEDIUM/HIGH', () => {
    const input = 'Estoy aquí contigo y vamos paso a paso.';
    const output = openaiService.enforceSessionClosureBridge(input, {
      sessionRetention: { suggestBridgeClosing: true },
      crisis: { riskLevel: 'HIGH' }
    });
    expect(output).toBe(input);
  });

  it('enforceSessionClosureBridge no aplica en saludo ni primeros turnos', () => {
    const input = 'Hola, ¿qué tal estás hoy?';
    const output = openaiService.enforceSessionClosureBridge(input, {
      sessionRetention: { suggestBridgeClosing: true, userTurnCount: 1 },
      conversationPattern: { closureRisk: false },
      contextual: { intencion: { tipo: 'GREETING' } },
      crisis: { riskLevel: 'LOW' }
    });
    expect(output).toBe(input);
  });

  it('enforceSessionClosureBridge no aplica en "Hi" aunque el hilo sea largo', () => {
    const input = 'Hi. How are you feeling right now?';
    const output = openaiService.enforceSessionClosureBridge(input, {
      userMessage: 'Hi',
      sessionRetention: { suggestBridgeClosing: true, userTurnCount: 6 },
      conversationPattern: { closureRisk: false },
      profile: { preferences: { language: 'en' } },
      crisis: { riskLevel: 'LOW' }
    });
    expect(output).toBe(input);
    expect(output).not.toMatch(/close this segment|cerrar aqu[ií] este tramo/i);
  });

  it('enforceSessionClosureBridge agrega puente en inglés cuando aplica', () => {
    const input = 'Thanks for sharing all of this with me.';
    const output = openaiService.enforceSessionClosureBridge(input, {
      sessionRetention: { suggestBridgeClosing: true, userTurnCount: 6 },
      conversationPattern: { closureRisk: false },
      profile: { preferences: { language: 'en' } },
      crisis: { riskLevel: 'LOW' }
    });
    expect(output).toMatch(/close this segment|pick it up whenever/i);
    expect(output).not.toMatch(/cerrar aqu[ií] este tramo/i);
  });

  it('enforceSessionClosureBridge sí aplica con señal de retención y hilo sustantivo', () => {
    const input = 'Gracias por contarme todo esto.';
    const output = openaiService.enforceSessionClosureBridge(input, {
      sessionRetention: { suggestBridgeClosing: true, userTurnCount: 5 },
      conversationPattern: { closureRisk: false },
      crisis: { riskLevel: 'LOW' }
    });
    expect(output).toContain('retom');
  });

  it('enforceSessionClosureBridge no aplica solo por flag sin hilo sustantivo', () => {
    const input = 'Gracias por contarme todo esto.';
    const output = openaiService.enforceSessionClosureBridge(input, {
      sessionRetention: { suggestBridgeClosing: true, userTurnCount: 3 },
      conversationPattern: { closureRisk: false },
      crisis: { riskLevel: 'LOW' }
    });
    expect(output).toBe(input);
  });

  it('stripPrematureSessionClosurePhrases quita cierre prematuro del modelo en saludo', () => {
    const input =
      'Hola, ¿qué tal? Si te sirve, podemos cerrar aquí este tramo y retomarlo cuando quieras desde este punto.';
    const ctx = {
      sessionRetention: { userTurnCount: 1, suggestReturningUserWarmOpen: true },
      contextual: { intencion: { tipo: 'GREETING' } },
      crisis: { riskLevel: 'LOW' }
    };
    const stripped = stripPrematureSessionClosurePhrases(input, ctx);
    const output = openaiService.enforceSessionClosureBridge(stripped, ctx);
    expect(stripped).not.toMatch(/cerrar aqu[ií] este tramo/i);
    expect(output).not.toMatch(/cerrar aqu[ií] este tramo/i);
  });
});
