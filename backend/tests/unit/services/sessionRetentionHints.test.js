import { describe, it, expect } from '@jest/globals';
import {
  detectLikelyFarewell,
  buildSessionRetentionPayload,
  buildSessionRetentionSystemSnippet,
  detectEmotionalIntensityWindDown,
  withThematicMicroClosureRetention,
  coerceEmotionalIntensity01to10,
  evaluateConversationClosureReadiness,
  shouldOrientSessionClosure,
  stripPrematureSessionClosurePhrases,
  responseHasSessionClosureBridge
} from '../../../services/sessionRetentionHints.js';

describe('sessionRetentionHints', () => {
  describe('detectLikelyFarewell', () => {
    it('detecta despedidas comunes', () => {
      expect(detectLikelyFarewell('Bueno chau, gracias')).toBe(true);
      expect(detectLikelyFarewell('Hasta luego')).toBe(true);
      expect(detectLikelyFarewell('me tengo que ir')).toBe(true);
    });
    it('no marca conversación normal', () => {
      expect(detectLikelyFarewell('Estoy muy cansada hoy')).toBe(false);
      expect(detectLikelyFarewell('')).toBe(false);
    });
  });

  describe('buildSessionRetentionPayload', () => {
    it('primera conversación en la app: solo tras varios turnos y hilo sustantivo', () => {
      const history = [];
      for (let i = 0; i < 5; i++) {
        history.push({ role: 'user', content: `u${i}` });
        history.push({ role: 'assistant', content: `a${i}` });
      }
      const p = buildSessionRetentionPayload({
        conversationHistoryNewestFirst: history,
        userContent: 'sigo igual',
        priorConversationCount: 0,
        threadMessageLimit: 100
      });
      expect(p.userTurnCount).toBe(5);
      expect(p.totalMessages).toBeGreaterThanOrEqual(10);
      expect(p.suggestFirstTimeExpectation).toBe(true);
      expect(p.likelyFarewell).toBe(false);
    });

    it('primera conversación: no dispara en los primeros turnos', () => {
      const history = [];
      for (let i = 0; i < 2; i++) {
        history.push({ role: 'user', content: `u${i}` });
        history.push({ role: 'assistant', content: `a${i}` });
      }
      const p = buildSessionRetentionPayload({
        conversationHistoryNewestFirst: history,
        userContent: 'hola',
        priorConversationCount: 0,
        threadMessageLimit: 100
      });
      expect(p.suggestFirstTimeExpectation).toBe(false);
    });

    it('despedida activa prioridad de cierre', () => {
      const p = buildSessionRetentionPayload({
        conversationHistoryNewestFirst: [{ role: 'user', content: 'x' }],
        userContent: 'chau gracias por todo',
        priorConversationCount: 2,
        threadMessageLimit: 100
      });
      expect(p.likelyFarewell).toBe(true);
    });

    it('usuario que vuelve: sugiere apertura cálida solo al inicio del hilo', () => {
      const p = buildSessionRetentionPayload({
        conversationHistoryNewestFirst: [{ role: 'user', content: 'hola de nuevo' }],
        userContent: 'hola de nuevo',
        priorConversationCount: 3,
        threadMessageLimit: 100
      });
      expect(p.suggestReturningUserWarmOpen).toBe(true);
    });

    it('usuario que vuelve: no dispara apertura tras varios turnos', () => {
      const history = [];
      for (let i = 0; i < 3; i++) {
        history.push({ role: 'user', content: `u${i}` });
        history.push({ role: 'assistant', content: `a${i}` });
      }
      const p = buildSessionRetentionPayload({
        conversationHistoryNewestFirst: history,
        userContent: 'sigo',
        priorConversationCount: 2,
        threadMessageLimit: 100
      });
      expect(p.userTurnCount).toBe(3);
      expect(p.suggestReturningUserWarmOpen).toBe(false);
    });

    it('checkpoint de pausa cuando hay racha de preguntas del asistente', () => {
      const history = [];
      for (let i = 0; i < 5; i++) {
        history.push({ role: 'user', content: `u${i}` });
        history.push({ role: 'assistant', content: `a${i} ¿sigue?` });
      }
      const p = buildSessionRetentionPayload({
        conversationHistoryNewestFirst: history,
        userContent: 'sigo',
        priorConversationCount: 1,
        threadMessageLimit: 100,
        conversationPattern: { questionStreakCount: 2 }
      });
      expect(p.userTurnCount).toBe(5);
      expect(p.suggestCheckpointPause).toBe(true);
    });

    it('incluye suggestThematicMicroClosure en false por defecto', () => {
      const p = buildSessionRetentionPayload({
        conversationHistoryNewestFirst: [{ role: 'user', content: 'hola' }],
        userContent: 'hola',
        priorConversationCount: 0,
        threadMessageLimit: 100
      });
      expect(p.suggestThematicMicroClosure).toBe(false);
    });

    it('normaliza threadMessageLimit inválido a 100', () => {
      const p = buildSessionRetentionPayload({
        conversationHistoryNewestFirst: [{ role: 'user', content: 'hola' }],
        userContent: 'hola',
        priorConversationCount: 0,
        threadMessageLimit: Number.NaN
      });
      expect(p.threadMessageLimit).toBe(100);
    });
  });

  describe('coerceEmotionalIntensity01to10', () => {
    it('acepta números y strings numéricos válidos', () => {
      expect(coerceEmotionalIntensity01to10(8)).toBe(8);
      expect(coerceEmotionalIntensity01to10(' 9 ')).toBe(9);
      expect(coerceEmotionalIntensity01to10(0)).toBe(1);
      expect(coerceEmotionalIntensity01to10(11)).toBe(10);
    });
    it('rechaza valores no finitos o no numéricos', () => {
      expect(coerceEmotionalIntensity01to10(NaN)).toBeNull();
      expect(coerceEmotionalIntensity01to10('x')).toBeNull();
      expect(coerceEmotionalIntensity01to10(null)).toBeNull();
    });
  });

  describe('detectEmotionalIntensityWindDown', () => {
    it('detecta caída clara entre turnos del usuario', () => {
      const newestFirst = [
        { role: 'user', content: 'x', metadata: { context: { emotional: { intensity: 5 } } } },
        { role: 'assistant', content: 'a' },
        { role: 'user', content: 'y', metadata: { context: { emotional: { intensity: 9 } } } },
        { role: 'assistant', content: 'b' },
        { role: 'user', content: 'z', metadata: { context: { emotional: { intensity: 9 } } } },
        { role: 'assistant', content: 'c' },
        { role: 'user', content: 'w', metadata: { context: { emotional: { intensity: 8 } } } },
        { role: 'assistant', content: 'd' }
      ];
      expect(detectEmotionalIntensityWindDown(newestFirst)).toBe(true);
    });

    it('no dispara con un solo valor de intensidad', () => {
      const newestFirst = [
        { role: 'user', content: 'x', metadata: { context: { emotional: { intensity: 5 } } } },
        { role: 'assistant', content: 'a' }
      ];
      expect(detectEmotionalIntensityWindDown(newestFirst)).toBe(false);
    });

    it('usa intensidades almacenadas como string', () => {
      const newestFirst = [
        { role: 'user', content: 'x', metadata: { context: { emotional: { intensity: '5' } } } },
        { role: 'assistant', content: 'a' },
        { role: 'user', content: 'y', metadata: { context: { emotional: { intensity: '9' } } } },
        { role: 'assistant', content: 'b' },
        { role: 'user', content: 'z', metadata: { context: { emotional: { intensity: '9' } } } },
        { role: 'assistant', content: 'c' },
        { role: 'user', content: 'w', metadata: { context: { emotional: { intensity: '8' } } } },
        { role: 'assistant', content: 'd' }
      ];
      expect(detectEmotionalIntensityWindDown(newestFirst)).toBe(true);
    });
  });

  describe('withThematicMicroClosureRetention', () => {
    it('activa micro-cierre temático en fase settled con hilo sustantivo y caída de intensidad', () => {
      const newestFirst = [
        { role: 'user', content: 'por ahora estoy ok', metadata: { context: { emotional: { intensity: 5 } } } },
        { role: 'assistant', content: 'a' },
        { role: 'user', content: 'mal', metadata: { context: { emotional: { intensity: 9 } } } },
        { role: 'assistant', content: 'b' },
        { role: 'user', content: 'peor', metadata: { context: { emotional: { intensity: 9 } } } },
        { role: 'assistant', content: 'c' },
        { role: 'user', content: 'uf', metadata: { context: { emotional: { intensity: 8 } } } },
        { role: 'assistant', content: 'd' },
        { role: 'user', content: 'antes peor', metadata: { context: { emotional: { intensity: 9 } } } },
        { role: 'assistant', content: 'e' }
      ];
      const base = buildSessionRetentionPayload({
        conversationHistoryNewestFirst: newestFirst,
        userContent: 'por ahora estoy ok',
        priorConversationCount: 1,
        threadMessageLimit: 100
      });
      const enriched = withThematicMicroClosureRetention(base, {
        sessionPhase: 'settled',
        conversationHistoryNewestFirst: newestFirst
      });
      expect(enriched.suggestThematicMicroClosure).toBe(true);
    });

    it('acepta sessionPhase con espacios', () => {
      const newestFirst = [
        { role: 'user', content: 'por ahora estoy ok', metadata: { context: { emotional: { intensity: 5 } } } },
        { role: 'assistant', content: 'a' },
        { role: 'user', content: 'mal', metadata: { context: { emotional: { intensity: 9 } } } },
        { role: 'assistant', content: 'b' },
        { role: 'user', content: 'peor', metadata: { context: { emotional: { intensity: 9 } } } },
        { role: 'assistant', content: 'c' },
        { role: 'user', content: 'uf', metadata: { context: { emotional: { intensity: 8 } } } },
        { role: 'assistant', content: 'd' },
        { role: 'user', content: 'antes peor', metadata: { context: { emotional: { intensity: 9 } } } },
        { role: 'assistant', content: 'e' }
      ];
      const base = buildSessionRetentionPayload({
        conversationHistoryNewestFirst: newestFirst,
        userContent: 'por ahora estoy ok',
        priorConversationCount: 1,
        threadMessageLimit: 100
      });
      const enriched = withThematicMicroClosureRetention(base, {
        sessionPhase: '  settled  ',
        conversationHistoryNewestFirst: newestFirst
      });
      expect(enriched.suggestThematicMicroClosure).toBe(true);
    });

    it('no activa si ya aplica cierre por fatiga (evita duplicar instrucciones)', () => {
      const chrono = [];
      for (let t = 0; t < 9; t++) {
        chrono.push({
          role: 'user',
          content: t === 8 ? 'por ahora estoy ok' : `m${t}`,
          metadata: { context: { emotional: { intensity: t === 8 ? 5 : 9 } } }
        });
        chrono.push({ role: 'assistant', content: 'ok' });
      }
      const newestFirst = chrono.slice().reverse();
      const base = buildSessionRetentionPayload({
        conversationHistoryNewestFirst: newestFirst,
        userContent: 'por ahora estoy ok',
        priorConversationCount: 1,
        threadMessageLimit: 200
      });
      expect(base.suggestFatigueClosing).toBe(true);
      const enriched = withThematicMicroClosureRetention(base, {
        sessionPhase: 'settled',
        conversationHistoryNewestFirst: newestFirst
      });
      expect(enriched.suggestThematicMicroClosure).toBe(false);
    });

    it('no activa si la fase no es settled', () => {
      const newestFirst = [
        { role: 'user', content: 'x', metadata: { context: { emotional: { intensity: 5 } } } },
        { role: 'assistant', content: 'a' },
        { role: 'user', content: 'y', metadata: { context: { emotional: { intensity: 9 } } } },
        { role: 'assistant', content: 'b' },
        { role: 'user', content: 'z', metadata: { context: { emotional: { intensity: 9 } } } },
        { role: 'assistant', content: 'c' },
        { role: 'user', content: 'w', metadata: { context: { emotional: { intensity: 8 } } } },
        { role: 'assistant', content: 'd' }
      ];
      const base = buildSessionRetentionPayload({
        conversationHistoryNewestFirst: newestFirst,
        userContent: 'x',
        priorConversationCount: 1,
        threadMessageLimit: 100
      });
      const enriched = withThematicMicroClosureRetention(base, {
        sessionPhase: 'default',
        conversationHistoryNewestFirst: newestFirst
      });
      expect(enriched.suggestThematicMicroClosure).toBe(false);
    });
  });

  describe('evaluateConversationClosureReadiness', () => {
    it('marca opening en saludo o hilo reciente', () => {
      expect(
        evaluateConversationClosureReadiness({
          sessionRetention: { userTurnCount: 2, suggestReturningUserWarmOpen: true },
          contextual: { intencion: { tipo: 'CONVERSACION_GENERAL' } }
        }).phase
      ).toBe('opening');
      expect(
        evaluateConversationClosureReadiness({
          sessionRetention: { userTurnCount: 3 },
          conversationPattern: {}
        }).phase
      ).toBe('opening');
    });

    it('marca may_close con señales de retención tras mínimo orientativo de turnos', () => {
      const r = evaluateConversationClosureReadiness({
        sessionRetention: { userTurnCount: 5, suggestBridgeClosing: true },
        conversationPattern: {}
      });
      expect(r.phase).toBe('may_close');
      expect(r.reasons).toContain('senal_retencion');
    });

    it('marca developing con 5+ turnos pero sin señal de cierre', () => {
      expect(
        evaluateConversationClosureReadiness({
          sessionRetention: { userTurnCount: 5 },
          conversationPattern: {},
          sessionPhase: 'default'
        }).phase
      ).toBe('developing');
    });

    it('shouldOrientSessionClosure respeta crisis y fase may_close', () => {
      expect(
        shouldOrientSessionClosure({
          crisis: { riskLevel: 'HIGH' },
          sessionRetention: { userTurnCount: 6, suggestBridgeClosing: true }
        })
      ).toBe(false);
      expect(
        shouldOrientSessionClosure({
          crisis: { riskLevel: 'LOW' },
          sessionRetention: { userTurnCount: 6, suggestBridgeClosing: true }
        })
      ).toBe(true);
    });

    it('fase acute bloquea cierre salvo despedida explícita', () => {
      expect(
        evaluateConversationClosureReadiness({
          sessionRetention: { userTurnCount: 8, suggestBridgeClosing: true },
          sessionPhase: 'acute'
        }).phase
      ).toBe('opening');
      expect(
        evaluateConversationClosureReadiness({
          sessionRetention: { userTurnCount: 2, likelyFarewell: true },
          conversationPattern: {},
          sessionPhase: 'acute'
        }).phase
      ).toBe('may_close');
    });
  });

  describe('stripPrematureSessionClosurePhrases', () => {
    it('elimina puente de cierre en hilo reciente', () => {
      const raw =
        'Me alegra leerte. Si te sirve, podemos cerrar aquí este tramo y retomarlo cuando quieras desde este punto.';
      const out = stripPrematureSessionClosurePhrases(raw, {
        sessionRetention: { userTurnCount: 2 },
        contextual: { intencion: { tipo: 'GREETING' } }
      });
      expect(out).not.toMatch(/cerrar aqu[ií] este tramo/i);
      expect(responseHasSessionClosureBridge(out)).toBe(false);
    });

    it('conserva puente cuando may_close aplica', () => {
      const raw = 'Gracias por compartir. Si te sirve, podemos cerrar aquí este tramo y retomarlo cuando quieras.';
      const out = stripPrematureSessionClosurePhrases(raw, {
        sessionRetention: { userTurnCount: 6, suggestBridgeClosing: true },
        crisis: { riskLevel: 'LOW' }
      });
      expect(responseHasSessionClosureBridge(out)).toBe(true);
    });
  });

  describe('buildSessionRetentionSystemSnippet', () => {
    it('vacío si no hay banderas', () => {
      const p = buildSessionRetentionPayload({
        conversationHistoryNewestFirst: [{ role: 'user', content: 'hola' }],
        userContent: 'hola',
        priorConversationCount: 0,
        threadMessageLimit: 100
      });
      expect(buildSessionRetentionSystemSnippet(p)).toBe('');
    });

    it('incluye bloque si hay despedida', () => {
      const p = buildSessionRetentionPayload({
        conversationHistoryNewestFirst: [],
        userContent: 'nos vemos',
        priorConversationCount: 0,
        threadMessageLimit: 100
      });
      const s = buildSessionRetentionSystemSnippet(p);
      expect(s).toContain('Sesión y retorno');
      expect(s).toContain('despedida');
    });

    it('incluye checkpoint si aplica patrón de preguntas', () => {
      const history = [];
      for (let i = 0; i < 5; i++) {
        history.push({ role: 'user', content: `u${i}` });
        history.push({ role: 'assistant', content: `a${i}?` });
      }
      const p = buildSessionRetentionPayload({
        conversationHistoryNewestFirst: history,
        userContent: 'x',
        priorConversationCount: 1,
        threadMessageLimit: 100,
        conversationPattern: { questionStreakCount: 2 }
      });
      expect(p.suggestCheckpointPause).toBe(true);
      const s = buildSessionRetentionSystemSnippet(p);
      expect(s).toContain('preguntas seguidas');
    });

    it('incluye guía de micro-cierre temático cuando aplica', () => {
      const p = buildSessionRetentionPayload({
        conversationHistoryNewestFirst: [],
        userContent: 'x',
        priorConversationCount: 0,
        threadMessageLimit: 100
      });
      const p2 = { ...p, suggestThematicMicroClosure: true };
      const s = buildSessionRetentionSystemSnippet(p2);
      expect(s).toContain('aterrizar el tramo');
      expect(s).toContain('listas numeradas');
    });

    it('en fase acute omite cierres reflexivos aunque el payload los pida', () => {
      const p = {
        likelyFarewell: false,
        nearThreadLimit: false,
        suggestBridgeClosing: true,
        suggestFatigueClosing: true,
        suggestThematicMicroClosure: true,
        suggestCheckpointPause: true,
        suggestReturningUserWarmOpen: false,
        suggestFirstTimeExpectation: false
      };
      const s = buildSessionRetentionSystemSnippet(p, { sessionPhase: 'acute' });
      expect(s).toBe('');
    });

    it('en fase acute mantiene despedida sin viñetas de cierre reflexivo', () => {
      const p = {
        likelyFarewell: true,
        nearThreadLimit: false,
        suggestBridgeClosing: true,
        suggestFatigueClosing: true
      };
      const s = buildSessionRetentionSystemSnippet(p, { sessionPhase: 'acute' });
      expect(s).toContain('Prioridad de seguridad');
      expect(s).toContain('despedida');
      expect(s).not.toContain('Varios turnos ya compartidos');
    });

    it('en fase acute mantiene aviso de límite técnico del hilo', () => {
      const p = {
        likelyFarewell: false,
        nearThreadLimit: true,
        totalMessages: 40,
        threadMessageLimit: 50,
        suggestBridgeClosing: true
      };
      const s = buildSessionRetentionSystemSnippet(p, { sessionPhase: 'acute' });
      expect(s).toContain('Prioridad de seguridad');
      expect(s).toContain('límite del chat');
      expect(s).not.toContain('Varios turnos ya compartidos');
    });

    it('sanitiza contadores en aviso de límite de hilo', () => {
      const p = {
        likelyFarewell: false,
        nearThreadLimit: true,
        totalMessages: 9e20,
        threadMessageLimit: Number.NaN,
        suggestThematicMicroClosure: false
      };
      const s = buildSessionRetentionSystemSnippet(p);
      expect(s).toContain('500000');
      expect(s).toMatch(/límite del chat es ~0\)/);
    });

    it('usuario que vuelve: cabecera de apertura sin presión de cierre de tramo', () => {
      const p = buildSessionRetentionPayload({
        conversationHistoryNewestFirst: [{ role: 'user', content: 'hola' }],
        userContent: 'Hoy estoy bien',
        priorConversationCount: 3,
        threadMessageLimit: 100
      });
      expect(p.suggestReturningUserWarmOpen).toBe(true);
      const s = buildSessionRetentionSystemSnippet(p);
      expect(s).toContain('Sesión y retorno (apertura)');
      expect(s).toContain('bienvenida de vuelta');
      expect(s).not.toContain('sentir que el tramo tuvo una conclusión');
      expect(s).toMatch(/No\*\*\s*invites a cerrar el tramo/i);
    });
  });
});
