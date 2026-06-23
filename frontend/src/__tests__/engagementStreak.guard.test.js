/**
 * Blindaje racha de ecosistema — foco API, home y héroe.
 */
import fs from 'fs';
import path from 'path';
import {
  buildStreakHeroCopy,
  resolveDashboardStreakDays,
} from '../utils/dashboardHomeUtils';

const FRONTEND_SRC = path.resolve(__dirname, '..');

function readSrc(relativePath) {
  return fs.readFileSync(path.join(FRONTEND_SRC, relativePath), 'utf8');
}

describe('engagementStreak guard', () => {
  it('resolveDashboardStreakDays prioriza engagementStreak.current del foco', () => {
    expect(resolveDashboardStreakDays({ engagementStreak: { current: 5 } }, [])).toBe(5);
    expect(resolveDashboardStreakDays({ engagementStreak: { current: 0 } }, [{ progress: { streak: 9 } }])).toBe(0);
    expect(resolveDashboardStreakDays(null, [{ status: {}, progress: { streak: 2 } }])).toBe(2);
  });

  it('DashScreen refresca foco con force al volver al Inicio', () => {
    const src = readSrc('screens/DashScreen.js');
    const focusBlock = src.slice(src.indexOf('useFocusEffect'), src.indexOf('// Alertas de emergencia'));
    expect(focusBlock).toMatch(/refreshHomeDataOnFocus\(\{ force: true \}\)/);
    expect(src).toMatch(/resolveDashboardStreakDays\(focusPayload, habits\)/);
    expect(src).toMatch(/streakDays=\{dashboardStats\.streakDays\}/);
  });

  it('DashboardStreakHero muestra número y copy según streakDays', () => {
    const hero = readSrc('components/dashboard/DashboardStreakHero.js');
    const utils = readSrc('utils/dashboardHomeUtils.js');
    expect(hero).toMatch(/buildStreakHeroCopy/);
    expect(hero).toMatch(/heroStreakNumber/);
    expect(utils).toMatch(/streakDays >= 2/);
    expect(utils).toMatch(/streakDays === 1/);
  });

  it('buildStreakHeroCopy usa plantilla activa con días >= 2', () => {
    const copy = buildStreakHeroCopy({
      streakDays: 3,
      displayName: 'Ana',
      texts: {
        STREAK_HERO_ACTIVE_TITLE_0: '{name}, llevas {days} días seguidos',
        STREAK_HERO_ACTIVE_SUBTITLE_0: 'Sigue así.',
      },
    });
    expect(copy.title).toContain('3');
    expect(copy.title).toContain('Ana');
  });
});
