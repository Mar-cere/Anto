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

  it('enforceSingleQuestion parte "¿A y qué B?" en una sola intención', () => {
    const input =
      'Eso suele dejarte con sueño cortado. ¿Desde hace cuánto te está pasando y qué sueles hacer justo antes de acostarte?';
    const output = openaiService.enforceSingleQuestion(input);
    expect((output.match(/\?/g) || []).length).toBe(1);
    expect(output).toMatch(/Desde hace cuánto te está pasando\?/);
    expect(output).not.toMatch(/qué sueles hacer/);
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

  it('enforceSessionClosureBridge agrega puente en inglés solo con señal fuerte', () => {
    const input = 'Thanks for sharing all of this with me.';
    const output = openaiService.enforceSessionClosureBridge(input, {
      sessionRetention: { suggestFatigueClosing: true, userTurnCount: 12 },
      conversationPattern: { closureRisk: false },
      profile: { preferences: { language: 'en' } },
      crisis: { riskLevel: 'LOW' }
    });
    expect(output).toMatch(/close this segment|pick it up whenever|leave it here for today/i);
    expect(output).not.toMatch(/cerrar aqu[ií] este tramo/i);
  });

  it('enforceSessionClosureBridge no aplica con suggestBridgeClosing ni pregunta abierta', () => {
    const input =
      'That is good to hear. What has been making today feel good for you?';
    const output = openaiService.enforceSessionClosureBridge(input, {
      userMessage: 'I feel good today',
      sessionRetention: { suggestBridgeClosing: true, userTurnCount: 8 },
      conversationPattern: { closureRisk: false },
      profile: { preferences: { language: 'en' } },
      crisis: { riskLevel: 'LOW' }
    });
    expect(output).toBe(input);
    expect(output).not.toMatch(/close this segment/i);
  });

  it('enforceSessionClosureBridge sí aplica con señal de fatiga y hilo sustantivo', () => {
    const input = 'Gracias por contarme todo esto.';
    const output = openaiService.enforceSessionClosureBridge(input, {
      sessionRetention: { suggestFatigueClosing: true, userTurnCount: 12 },
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
      'That is good to hear. What has been making today feel good for you? If it helps, we can close this segment here and pick it up whenever you want from this point.';
    const ctx = {
      userMessage: 'I feel good today',
      sessionRetention: { userTurnCount: 8, suggestBridgeClosing: true },
      crisis: { riskLevel: 'LOW' }
    };
    const stripped = stripPrematureSessionClosurePhrases(input, ctx);
    const output = openaiService.enforceSessionClosureBridge(stripped, ctx);
    expect(stripped).not.toMatch(/close this segment/i);
    expect(output).not.toMatch(/close this segment/i);
  });

  it('trimDanglingResponseTail quita colas condicionales incompletas', () => {
    const input =
      'Sí, puede pasar al iniciar sertralina. Cuéntaselo a tu psiquiatra, sobre todo si';
    const output = openaiService.trimDanglingResponseTail(input);
    expect(output).not.toMatch(/sobre todo si\s*$/i);
    expect(output).toContain('sertralina');
  });

  it('reducirRespuesta respeta límites ampliados para tips', () => {
    const input =
      'Sí. Prueba esto: - Nómbralo como pensamiento intrusivo. - Vuelve a lo que hacías. - Repite "pensar no es hacer". - Busca un ancla visual. - Avísale a tu psiquiatra si empeora.';
    const output = openaiService.reducirRespuesta(input, {
      maxChars: 720,
      maxWords: 95,
      maxSentencesReduce: 4
    });
    expect(output.length).toBeGreaterThan(100);
    expect(output).toMatch(/pensar no es hacer|Nómbralo|ancla/i);
  });
});
