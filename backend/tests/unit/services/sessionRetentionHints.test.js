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
  stripRepeatedSessionClosurePhrase,
  hasActiveCrisisRecoveryInThread,
  shouldSuppressSessionClosure,
  responseHasSessionClosureBridge,
  isGreetingOrCheckInMessage,
  getSessionClosureBridge,
  isOngoingEmotionalShareMessage,
  shouldForceSessionClosureBridge
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

  describe('isGreetingOrCheckInMessage', () => {
    it('detecta saludos breves en es y en', () => {
      expect(isGreetingOrCheckInMessage('Hi')).toBe(true);
      expect(isGreetingOrCheckInMessage('Hello!')).toBe(true);
      expect(isGreetingOrCheckInMessage('Hola')).toBe(true);
      expect(isGreetingOrCheckInMessage('Estoy muy cansada hoy')).toBe(false);
    });
  });

  describe('getSessionClosureBridge', () => {
    it('devuelve puente en el idioma pedido', () => {
      expect(getSessionClosureBridge('en', false)).toMatch(/close this segment/i);
      expect(getSessionClosureBridge('es', false)).toMatch(/cerrar aqu[ií] este tramo/i);
    });
  });

  describe('isOngoingEmotionalShareMessage', () => {
    it('detecta compartir estado sin despedida', () => {
      expect(isOngoingEmotionalShareMessage('I feel good today')).toBe(true);
      expect(isOngoingEmotionalShareMessage('Hoy me siento mejor')).toBe(true);
      expect(isOngoingEmotionalShareMessage('chau gracias')).toBe(false);
    });

    it('detecta recuperación tras crisis de pánico', () => {
      expect(isOngoingEmotionalShareMessage('Todo, tuve crisis de panico')).toBe(true);
      expect(isOngoingEmotionalShareMessage('Acaba de pasar')).toBe(true);
      expect(isOngoingEmotionalShareMessage('Ya va bajando')).toBe(true);
    });
  });

  describe('hasActiveCrisisRecoveryInThread', () => {
    it('detecta pánico reciente aunque el turno actual sea breve', () => {
      expect(
        hasActiveCrisisRecoveryInThread('Ya va bajando', [
          { role: 'user', content: 'Todo, tuve crisis de panico' },
          { role: 'assistant', content: 'Eso puede dejarte muy sacudido.' },
        ]),
      ).toBe(true);
    });
  });

  describe('shouldSuppressSessionClosure', () => {
    it('bloquea cierre en fase acute sin despedida', () => {
      expect(
        shouldSuppressSessionClosure({
          sessionPhase: 'acute',
          sessionRetention: { likelyFarewell: false },
        }),
      ).toBe(true);
    });

    it('permite cierre en despedida explícita aunque la fase sea acute', () => {
      expect(
        shouldSuppressSessionClosure({
          sessionPhase: 'acute',
          sessionRetention: { likelyFarewell: true },
        }),
      ).toBe(false);
    });
  });

  describe('buildSessionRetentionPayload', () => {
    it('no sugiere cierre por puente en saludo aunque el hilo sea largo', () => {
      const history = [];
      for (let i = 0; i < 5; i++) {
        history.push({ role: 'user', content: `u${i}` });
        history.push({ role: 'assistant', content: `a${i}` });
      }
      const p = buildSessionRetentionPayload({
        conversationHistoryNewestFirst: history,
        userContent: 'Hi',
        priorConversationCount: 2,
        threadMessageLimit: 100
      });
      expect(p.userTurnCount).toBe(5);
      expect(p.suggestBridgeClosing).toBe(false);
    });

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
      for (let i = 0; i < 7; i++) {
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
      expect(p.userTurnCount).toBe(7);
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
        { role: 'assistant', content: 'e' },
        { role: 'user', content: 'm6', metadata: { context: { emotional: { intensity: 7 } } } },
        { role: 'assistant', content: 'f6' },
        { role: 'user', content: 'm7', metadata: { context: { emotional: { intensity: 7 } } } },
        { role: 'assistant', content: 'f7' }
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
        { role: 'assistant', content: 'e' },
        { role: 'user', content: 'm6', metadata: { context: { emotional: { intensity: 7 } } } },
        { role: 'assistant', content: 'f6' },
        { role: 'user', content: 'm7', metadata: { context: { emotional: { intensity: 7 } } } },
        { role: 'assistant', content: 'f7' }
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
      for (let t = 0; t < 12; t++) {
        chrono.push({
          role: 'user',
          content: t === 11 ? 'por ahora estoy ok' : `m${t}`,
          metadata: { context: { emotional: { intensity: t === 11 ? 5 : 9 } } }
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

    it('marca may_close con señales fuertes de cierre tras mínimo de turnos', () => {
      const r = evaluateConversationClosureReadiness({
        sessionRetention: { userTurnCount: 12, suggestFatigueClosing: true },
        conversationPattern: {}
      });
      expect(r.phase).toBe('may_close');
      expect(r.reasons).toContain('senal_cierre');
    });

    it('suggestBridgeClosing solo mantiene developing, no may_close', () => {
      const r = evaluateConversationClosureReadiness({
        sessionRetention: { userTurnCount: 8, suggestBridgeClosing: true },
        conversationPattern: {}
      });
      expect(r.phase).toBe('developing');
    });

    it('marca opening al compartir estado emocional breve', () => {
      expect(
        evaluateConversationClosureReadiness({
          sessionRetention: { userTurnCount: 8, suggestBridgeClosing: true },
          userMessage: 'I feel good today'
        }).phase
      ).toBe('opening');
    });

    it('marca developing con 7+ turnos pero sin señal de cierre', () => {
      expect(
        evaluateConversationClosureReadiness({
          sessionRetention: { userTurnCount: 8 },
          conversationPattern: {},
          sessionPhase: 'default'
        }).phase
      ).toBe('developing');
    });

    it('shouldForceSessionClosureBridge solo con despedida, fatiga o closureRisk', () => {
      expect(
        shouldForceSessionClosureBridge({
          userMessage: 'I feel good today',
          sessionRetention: { suggestBridgeClosing: true, userTurnCount: 8 },
          conversationPattern: { closureRisk: false },
          crisis: { riskLevel: 'LOW' }
        })
      ).toBe(false);
      expect(
        shouldForceSessionClosureBridge({
          userMessage: 'Hi',
          sessionRetention: { suggestFatigueClosing: true, userTurnCount: 12 },
          conversationPattern: { closureRisk: false },
          crisis: { riskLevel: 'LOW' }
        })
      ).toBe(false);
      expect(
        shouldForceSessionClosureBridge({
          userMessage: 'Thanks, bye for now',
          sessionRetention: { likelyFarewell: true, userTurnCount: 4 },
          conversationPattern: { closureRisk: false },
          crisis: { riskLevel: 'LOW' }
        })
      ).toBe(true);
      expect(
        shouldForceSessionClosureBridge({
          userMessage: 'Still thinking about it',
          sessionRetention: { suggestFatigueClosing: true, userTurnCount: 12 },
          conversationPattern: { closureRisk: false },
          crisis: { riskLevel: 'LOW' }
        })
      ).toBe(true);
      expect(
        shouldForceSessionClosureBridge({
          userMessage: 'Still thinking about it',
          sessionRetention: { userTurnCount: 8 },
          conversationPattern: { closureRisk: true },
          crisis: { riskLevel: 'LOW' }
        })
      ).toBe(true);
      expect(
        shouldForceSessionClosureBridge({
          userMessage: 'chau',
          sessionRetention: { likelyFarewell: true },
          crisis: { riskLevel: 'HIGH' }
        })
      ).toBe(false);
    });

    it('shouldOrientSessionClosure respeta crisis y no cierra solo por bridge suave', () => {
      expect(
        shouldOrientSessionClosure({
          crisis: { riskLevel: 'HIGH' },
          sessionRetention: { userTurnCount: 8, suggestBridgeClosing: true }
        })
      ).toBe(false);
      expect(
        shouldOrientSessionClosure({
          crisis: { riskLevel: 'LOW' },
          sessionRetention: { userTurnCount: 8, suggestBridgeClosing: true }
        })
      ).toBe(false);
      expect(
        shouldOrientSessionClosure({
          crisis: { riskLevel: 'LOW' },
          sessionRetention: { userTurnCount: 12, suggestFatigueClosing: true }
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
        sessionRetention: { userTurnCount: 12, suggestFatigueClosing: true },
        crisis: { riskLevel: 'LOW' }
      });
      expect(responseHasSessionClosureBridge(out)).toBe(true);
    });

    it('elimina cierre repetido en crisis de pánico (hilo corto)', () => {
      const raw =
        'Bien, eso ya indica que está cediendo; si quieres, dime qué fue lo que más te ayudó a que bajara. Si te sirve, podemos cerrar aquí este tramo y retomarlo cuando quieras desde este punto.';
      const out = stripPrematureSessionClosurePhrases(raw, {
        userMessage: 'Ya va bajando',
        crisis: { riskLevel: 'LOW' },
        sessionRetention: { userTurnCount: 5 },
        sessionPhase: 'default',
        conversationHistory: [
          { role: 'assistant', content: 'Entonces tu cuerpo sigue en alerta. Si te sirve, podemos cerrar aquí este tramo y retomarlo cuando quieras desde este punto.' },
        ],
      });
      expect(responseHasSessionClosureBridge(out)).toBe(false);
      expect(out).toMatch(/cediendo/i);
    });
  });

  describe('stripRepeatedSessionClosurePhrase', () => {
    it('quita puente si el turno anterior del asistente ya lo usó', () => {
      const raw =
        'Bien, eso ya indica que está cediendo. Si te sirve, podemos cerrar aquí este tramo y retomarlo cuando quieras desde este punto.';
      const out = stripRepeatedSessionClosurePhrase(raw, [
        'Entonces tu cuerpo sigue en alerta. Si te sirve, podemos cerrar aquí este tramo y retomarlo cuando quieras desde este punto.',
      ]);
      expect(responseHasSessionClosureBridge(out)).toBe(false);
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
      for (let i = 0; i < 7; i++) {
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

    it('cabecera en inglés cuando language es en', () => {
      const p = buildSessionRetentionPayload({
        conversationHistoryNewestFirst: [{ role: 'user', content: 'hello' }],
        userContent: 'Thanks, bye for now',
        priorConversationCount: 2,
        threadMessageLimit: 100
      });
      const s = buildSessionRetentionSystemSnippet(p, { language: 'en' });
      expect(s).toContain('Session and return');
      expect(s).toMatch(/goodbye or wrap-up/i);
    });
  });
});
