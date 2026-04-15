import { describe, it, expect } from '@jest/globals';
import {
  detectLikelyFarewell,
  buildSessionRetentionPayload,
  buildSessionRetentionSystemSnippet
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
  });
});
