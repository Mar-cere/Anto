import { describe, expect, it } from '@jest/globals';
import openaiService from '../../../services/openaiService.js';

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

  it('enforceSessionClosureBridge agrega cierre suave cuando hay señal de cierre', () => {
    const input = 'Gracias por contarme todo esto.';
    const output = openaiService.enforceSessionClosureBridge(input, {
      sessionRetention: { suggestBridgeClosing: true },
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
});
