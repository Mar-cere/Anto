import { describe, it, expect } from '@jest/globals';
import {
  maxRiskTierFromLevels,
  getSummaryLimitsForRiskTier,
  collectRiskLevelsFromMessages,
  countUserTurnStats,
  scheduleLastSessionSummary,
  sanitizeContinuationText,
  reconcileChatContinuitySummary,
} from '../../../services/lastSessionSummaryService.js';

describe('lastSessionSummaryService', () => {
  describe('maxRiskTierFromLevels', () => {
    it('elige el riesgo máximo', () => {
      expect(maxRiskTierFromLevels(['LOW', 'MEDIUM'])).toBe('medium');
      expect(maxRiskTierFromLevels(['WARNING', 'HIGH'])).toBe('high');
    });
    it('devuelve low sin niveles', () => {
      expect(maxRiskTierFromLevels([])).toBe('low');
    });
  });

  describe('getSummaryLimitsForRiskTier', () => {
    it('acorta en crisis alta', () => {
      const h = getSummaryLimitsForRiskTier('high');
      expect(h.maxBullets).toBe(1);
      expect(h.bridgeMaxChars).toBeLessThan(200);
      const l = getSummaryLimitsForRiskTier('low');
      expect(l.maxBullets).toBeGreaterThanOrEqual(3);
    });
  });

  describe('collectRiskLevelsFromMessages', () => {
    it('extrae riskLevel de metadata', () => {
      const msgs = [
        { role: 'user', metadata: {} },
        { role: 'assistant', metadata: { crisis: { riskLevel: 'MEDIUM' } } }
      ];
      expect(collectRiskLevelsFromMessages(msgs)).toContain('MEDIUM');
    });

    it('lee metadata.context.crisis y normaliza espacios', () => {
      const msgs = [{ role: 'user', metadata: { context: { crisis: { riskLevel: '  high  ' } } } }];
      expect(collectRiskLevelsFromMessages(msgs)).toEqual(['HIGH']);
    });

    it('valores desconocidos se normalizan a LOW', () => {
      const msgs = [{ role: 'assistant', metadata: { crisis: { riskLevel: 'INJECTED' } } }];
      expect(collectRiskLevelsFromMessages(msgs)).toEqual(['LOW']);
    });

    it('sin array devuelve vacío', () => {
      expect(collectRiskLevelsFromMessages(null)).toEqual([]);
    });
  });

  describe('scheduleLastSessionSummary', () => {
    it('rechaza ids inválidos antes de consultar', async () => {
      await expect(scheduleLastSessionSummary('not-an-id', 'also-invalid')).rejects.toMatchObject({
        code: 'INVALID_IDS'
      });
    });
  });

  describe('sanitizeContinuationText', () => {
    it('elimina caracteres de control y respeta maxLen', () => {
      expect(sanitizeContinuationText('hola\u0000mundo', 100)).toBe('holamundo');
      expect(sanitizeContinuationText('abcdef', 3)).toBe('abc');
    });
    it('recorta en límite de palabra cuando es posible', () => {
      const text = 'Es normal sentirse así a veces, recuerda que cada intento es una oportunidad de aprendizaje';
      const out = sanitizeContinuationText(text, 90);
      expect(out.length).toBeLessThanOrEqual(90);
      expect(out.endsWith('aprendizaj')).toBe(false);
    });
  });

  describe('countUserTurnStats', () => {
    it('cuenta solo mensajes de usuario', () => {
      const { userTurns, userChars } = countUserTurnStats([
        { role: 'user', content: 'ab' },
        { role: 'assistant', content: 'xxx' },
        { role: 'user', content: 'cd' }
      ]);
      expect(userTurns).toBe(2);
      expect(userChars).toBe(4);
    });

    it('entrada no array devuelve ceros', () => {
      expect(countUserTurnStats(undefined)).toEqual({ userTurns: 0, userChars: 0 });
    });
  });

  describe('reconcileChatContinuitySummary', () => {
    const recent = [
      {
        conversationId: 'conv-new',
        updatedAt: '2026-06-30T12:00:00.000Z',
        lastMessagePreview: 'Me siento agotado hoy',
        lastMessageRole: 'user',
        messageCount: 12,
      },
    ];

    it('devuelve stored si sigue alineado con la conversación más reciente', () => {
      const stored = {
        conversationId: 'conv-new',
        snippet: 'Resumen LLM reciente',
        bridge: '',
        placeholder: false,
        sessionEndedAt: '2026-06-30T11:59:00.000Z',
        generatedAt: '2026-06-30T11:59:00.000Z',
      };
      expect(reconcileChatContinuitySummary(stored, recent, { language: 'es' })).toBe(stored);
    });

    it('genera continuidad provisional cuando la conversación reciente es distinta', () => {
      const stored = {
        conversationId: 'conv-old',
        snippet: 'Tema anterior',
        bridge: '',
        placeholder: false,
        sessionEndedAt: '2026-06-28T10:00:00.000Z',
        generatedAt: '2026-06-28T10:00:00.000Z',
      };
      const out = reconcileChatContinuitySummary(stored, recent, { language: 'es' });
      expect(out.conversationId).toBe('conv-new');
      expect(out.recentActivityPending).toBe(true);
      expect(out.snippet).toContain('Compartiste hace poco');
    });

    it('crea continuidad cuando no hay resumen persistido', () => {
      const out = reconcileChatContinuitySummary(null, recent, { language: 'en' });
      expect(out.conversationId).toBe('conv-new');
      expect(out.snippet).toMatch(/You recently shared/i);
    });
  });
});
