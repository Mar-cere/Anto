import {
  computeNextPromptAt,
  getNotificationsPromptNextAtKey,
  getNotificationsPromptVisitsKey,
  shouldShowNotificationsPrompt,
} from '../notificationsPromptPolicy';

describe('notificationsPromptPolicy', () => {
  describe('keys', () => {
    it('debe construir keys por usuario (y anon por defecto)', () => {
      expect(getNotificationsPromptVisitsKey('u1')).toBe('notificationsPromptVisits:u1');
      expect(getNotificationsPromptNextAtKey('u1')).toBe('notificationsPromptNextAt:u1');
      expect(getNotificationsPromptVisitsKey()).toBe('notificationsPromptVisits:anon');
      expect(getNotificationsPromptNextAtKey()).toBe('notificationsPromptNextAt:anon');
    });
  });

  describe('computeNextPromptAt', () => {
    it('debe elegir 2 días cuando random < 0.5', () => {
      const now = 1_000_000;
      const next = computeNextPromptAt({ now, random: () => 0.1, days: [2, 3] });
      expect(next).toBe(now + 2 * 24 * 60 * 60 * 1000);
    });

    it('debe elegir 3 días cuando random >= 0.5', () => {
      const now = 1_000_000;
      const next = computeNextPromptAt({ now, random: () => 0.9, days: [2, 3] });
      expect(next).toBe(now + 3 * 24 * 60 * 60 * 1000);
    });
  });

  describe('shouldShowNotificationsPrompt', () => {
    it('no debe mostrar sin usuario', () => {
      expect(shouldShowNotificationsPrompt({ hasUser: false }).show).toBe(false);
    });

    it('no debe mostrar si hay overlays bloqueando', () => {
      const res = shouldShowNotificationsPrompt({
        hasUser: true,
        isOverlayBlocking: true,
        dashVisitsCount: 10,
        notificationsEnabled: false,
      });
      expect(res).toEqual({ show: false, reason: 'overlay-blocking' });
    });

    it('no debe mostrar en 1ra visita (dashVisitsCount=1)', () => {
      const res = shouldShowNotificationsPrompt({
        hasUser: true,
        isOverlayBlocking: false,
        dashVisitsCount: 1,
        notificationsEnabled: false,
      });
      expect(res.show).toBe(false);
      expect(res.reason).toBe('too-early');
    });

    it('debe poder mostrar desde la 2da visita si no hay permisos y no hay cooldown', () => {
      const res = shouldShowNotificationsPrompt({
        hasUser: true,
        isOverlayBlocking: false,
        dashVisitsCount: 2,
        notificationsEnabled: false,
        nextAt: 0,
        legacyDismissed: false,
        now: 1_000,
      });
      expect(res).toEqual({ show: true, reason: 'eligible' });
    });

    it('no debe mostrar si hay cooldown activo', () => {
      const res = shouldShowNotificationsPrompt({
        hasUser: true,
        isOverlayBlocking: false,
        dashVisitsCount: 3,
        notificationsEnabled: false,
        nextAt: 10_000,
        now: 1_000,
      });
      expect(res).toEqual({ show: false, reason: 'cooldown' });
    });

    it('no debe mostrar si legacyDismissed=true (para migración)', () => {
      const res = shouldShowNotificationsPrompt({
        hasUser: true,
        isOverlayBlocking: false,
        dashVisitsCount: 3,
        notificationsEnabled: false,
        legacyDismissed: true,
      });
      expect(res).toEqual({ show: false, reason: 'legacy-dismissed' });
    });

    it('no debe mostrar si ya están habilitadas', () => {
      const res = shouldShowNotificationsPrompt({
        hasUser: true,
        isOverlayBlocking: false,
        dashVisitsCount: 3,
        notificationsEnabled: true,
      });
      expect(res).toEqual({ show: false, reason: 'already-enabled' });
    });
  });
});

