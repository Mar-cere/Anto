/**
 * Tests unitarios para constantes de la pantalla Suscripción.
 * @author AntoApp Team
 */

jest.mock('../../../styles/globalStyles', () => ({
  colors: {
    background: '#030A24',
    primary: '#1ADDDB',
    white: '#FFFFFF',
    textSecondary: '#A3B8E8',
    error: '#FF6B6B',
    cardBackground: 'rgba(29, 43, 95, 0.8)',
  },
}));

import {
  LEGAL_URLS,
  TEXTS,
  HARDCODED_PLANS,
  PLAN_ORDER,
  COLORS,
} from '../subscriptionScreenConstants';

describe('subscriptionScreenConstants', () => {
  describe('LEGAL_URLS', () => {
    it('debe tener URLs de términos y privacidad', () => {
      expect(LEGAL_URLS.TERMS_EULA).toContain('terminos');
      expect(LEGAL_URLS.PRIVACY).toContain('privacidad');
      expect(LEGAL_URLS.TERMS_EULA).toMatch(/^https?:\/\//);
      expect(LEGAL_URLS.PRIVACY).toMatch(/^https?:\/\//);
    });
  });

  describe('TEXTS', () => {
    it('debe tener título y textos de sección', () => {
      expect(TEXTS.TITLE).toBe('Suscripción Premium');
      expect(TEXTS.CURRENT_SUBSCRIPTION).toBe('Tu Suscripción');
      expect(TEXTS.AVAILABLE_PLANS).toBe('Planes Disponibles');
      expect(TEXTS.LOADING).toBeDefined();
      expect(TEXTS.ERROR).toBeDefined();
      expect(TEXTS.RETRY).toBe('Reintentar');
    });
    it('debe tener textos de cancelación y legal', () => {
      expect(TEXTS.CANCEL_SUBSCRIPTION).toBeDefined();
      expect(TEXTS.CANCEL_CONFIRM).toContain('cancelar');
      expect(TEXTS.LEGAL_TITLE).toBeDefined();
      expect(TEXTS.TERMS_EULA_LABEL).toBeDefined();
      expect(TEXTS.PRIVACY_LABEL).toBeDefined();
    });
    it('debe tener texto de acuerdo al suscribir', () => {
      expect(TEXTS.SUBSCRIBE_AGREEMENT).toContain('aceptas');
      expect(TEXTS.SUBSCRIBE_AGREEMENT_TERMS).toBeDefined();
      expect(TEXTS.SUBSCRIBE_AGREEMENT_PRIVACY).toBeDefined();
    });
  });

  describe('HARDCODED_PLANS', () => {
    it('debe ser un array con al menos 4 planes', () => {
      expect(Array.isArray(HARDCODED_PLANS)).toBe(true);
      expect(HARDCODED_PLANS.length).toBeGreaterThanOrEqual(4);
    });
    it('cada plan debe tener id, name, amount, formattedAmount, interval, currency, features', () => {
      const required = ['id', 'name', 'amount', 'formattedAmount', 'interval', 'currency', 'features'];
      HARDCODED_PLANS.forEach((plan) => {
        required.forEach((key) => expect(plan).toHaveProperty(key));
        expect(Array.isArray(plan.features)).toBe(true);
      });
    });
    it('debe incluir planes monthly, quarterly, semestral, yearly', () => {
      const ids = HARDCODED_PLANS.map((p) => p.id);
      expect(ids).toContain('monthly');
      expect(ids).toContain('quarterly');
      expect(ids).toContain('semestral');
      expect(ids).toContain('yearly');
    });
  });

  describe('PLAN_ORDER', () => {
    it('debe tener orden numérico para monthly, quarterly, semestral, yearly', () => {
      expect(PLAN_ORDER.monthly).toBe(1);
      expect(PLAN_ORDER.quarterly).toBe(2);
      expect(PLAN_ORDER.semestral).toBe(3);
      expect(PLAN_ORDER.yearly).toBe(4);
    });
  });

  describe('COLORS', () => {
    it('debe tener background, primary, white, textSecondary, error, cardBackground', () => {
      expect(COLORS.background).toBeDefined();
      expect(COLORS.primary).toBeDefined();
      expect(COLORS.white).toBeDefined();
      expect(COLORS.textSecondary).toBeDefined();
      expect(COLORS.error).toBeDefined();
      expect(COLORS.cardBackground).toBeDefined();
    });
  });
});
