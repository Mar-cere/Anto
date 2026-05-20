/**
 * Tests unitarios para pools de copy de notificaciones push
 */

import {
  PUSH_NOTIFICATION_COPY as C,
  buildWeeklyProgressBody,
  pickRandom,
  getPushNotificationCopy,
  normalizeNotificationLanguage,
} from '../../../services/pushNotificationCopyPools.js';

describe('pushNotificationCopyPools', () => {
  describe('getPushNotificationCopy', () => {
    it('devuelve copy en inglés cuando language es en', () => {
      const en = getPushNotificationCopy('en');
      expect(en.crisisWarning.titles[0]).toMatch(/wellbeing|care/i);
      expect(en.crisisWarning.titles[0]).not.toMatch(/bienestar/i);
    });

    it('normaliza idiomas desconocidos a español', () => {
      expect(normalizeNotificationLanguage('fr')).toBe('es');
      expect(normalizeNotificationLanguage('en')).toBe('en');
    });
  });

  describe('pickRandom', () => {
    it('devuelve fallback si el arreglo está vacío o no es arreglo', () => {
      expect(pickRandom([], 'x')).toBe('x');
      expect(pickRandom(null, 'y')).toBe('y');
      expect(pickRandom(undefined, 'z')).toBe('z');
    });

    it('devuelve un elemento del arreglo', () => {
      const arr = ['a', 'b', 'c'];
      for (let i = 0; i < 20; i++) {
        expect(arr).toContain(pickRandom(arr, 'fallback'));
      }
    });
  });

  describe('trialExpiringTitles / trialExpiringBodies', () => {
    it('normaliza días inválidos a 1 sin "undefined" en el texto', () => {
      const tBad = C.trialExpiringTitles(undefined).join(' ');
      const bBad = C.trialExpiringBodies(null).join(' ');
      expect(tBad).not.toMatch(/undefined/i);
      expect(bBad).not.toMatch(/undefined/i);
      expect(tBad).toMatch(/mañana|1/);
    });
  });

  describe('buildWeeklyProgressBody', () => {
    it('coacciona hábitos/tareas no numéricos a 0', () => {
      const body = buildWeeklyProgressBody('x', {}, 'stable');
      expect(body).toMatch(/0 hábitos/);
      expect(body).toMatch(/0 tareas/);
    });

    it('genera resumen semanal en inglés', () => {
      const body = buildWeeklyProgressBody(2, 3, 'stable', 'en');
      expect(body).toMatch(/2 habits/i);
      expect(body).toMatch(/3 tasks/i);
      expect(body).not.toMatch(/hábitos/);
    });

    it('añade texto de tendencia emocional variado', () => {
      const b1 = buildWeeklyProgressBody(1, 1, 'improving');
      const b2 = buildWeeklyProgressBody(1, 1, 'declining');
      expect(b1).toMatch(
        /mejorando|favorable|alza|aflojó|mejor|sube|celebrar|acompañado|tendencia|mejora|curva|hostil|límite|vergüenza|laboratorio|dormiste|sueño|termómetro|insulté|risas|pediste ayuda|datos a favor|a favor|bitácora|menos tenso/i
      );
      expect(b2).toMatch(
        /cuidado|contención|ánimo|pesó|ajustar|malestar|apoyo|descanso|baj|ruidos|exigencia|peso|profesional|fiebre|ola|vara|plan|concreto|dolió|herramientas|terapia|aislamiento|compasión|culpa|peor|crisis/i
      );
    });
  });

  describe('motivational.midday', () => {
    it('tiene mensajes propios para mediodía', () => {
      expect(Array.isArray(C.motivational.midday)).toBe(true);
      expect(C.motivational.midday.length).toBeGreaterThanOrEqual(25);
    });
  });

  describe('pool EN (plantillas paramétricas)', () => {
    const EN = getPushNotificationCopy('en');

    it('followUpWithHours conserva ${h} en el fuente', () => {
      const src = EN.followUpWithHours.toString();
      expect(src).toMatch(/\$\{h\}/);
      expect(src).not.toMatch(/\b4 hours\b/);
    });

    it('trialExpiring usa ${days} y rama de 1 día', () => {
      const src = EN.trialExpiringTitles.toString();
      expect(src).toMatch(/days === 1/);
      const multi = EN.trialExpiringTitles(5).join(' ');
      expect(multi).toMatch(/5/);
      expect(multi).not.toMatch(/\b3 days\b/);
    });

    it('taskReminder y emergency usan variables, no Sample', () => {
      const tr = EN.taskReminder.bodies('Task A', 'Friday').join(' ');
      expect(tr).toContain('Task A');
      expect(tr).not.toMatch(/\bSample\b/);
      const live = EN.emergencySent.liveBodies(2, 5).join(' ');
      expect(live).toMatch(/2/);
      expect(live).toMatch(/5/);
      expect(live).not.toMatch(/\bSample\b/);
    });

    it('buildWeeklyProgressBody en inglés sin español', () => {
      const body = buildWeeklyProgressBody(1, 2, 'stable', 'en');
      expect(body).toMatch(/1 habits?/i);
      expect(body).not.toMatch(/hábitos/i);
    });

    it('incluye wellbeingCheckIn y techniqueTitles', () => {
      expect(Array.isArray(EN.wellbeingCheckIn?.titles)).toBe(true);
      expect(EN.wellbeingCheckIn.titles.length).toBeGreaterThan(10);
      expect(Array.isArray(EN.techniqueTitles)).toBe(true);
      expect(EN.techniqueTitles[0]).toMatch(/technique|regulation|exercise/i);
    });

    it('taskReminder EN sin Vence ni fallbacks ES', () => {
      const text = EN.taskReminder.bodies('Task A', 'Friday').join(' ');
      expect(text).toContain('Task A');
      expect(text).not.toMatch(/\bVence\b/);
      expect(text).not.toMatch(/olvides completarla/i);
    });
  });
});
