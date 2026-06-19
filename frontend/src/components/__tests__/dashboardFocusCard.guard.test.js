/**
 * Guardrails del bloque de foco — filas accionables (tarea y hábito).
 */
import fs from 'fs';
import path from 'path';

const FRONTEND_SRC = path.resolve(__dirname, '..', '..');

function readSrc(relativePath) {
  return fs.readFileSync(path.join(FRONTEND_SRC, relativePath), 'utf8');
}

describe('dashboardFocusCard guard', () => {
  it('DashboardFocusCard usa fila accionable para próxima tarea', () => {
    const src = readSrc('components/DashboardFocusCard.js');
    expect(src).toMatch(/onOpenNextTask/);
    expect(src).toMatch(/key: 'next-task'/);
    expect(src).toMatch(/showChevron: true/);
    expect(src).not.toMatch(/styles\.insetLabel\}>\{DASH\.FOCUS_NEXT_TASK\}/);
  });

  it('DashboardFocusCard usa fila accionable para próximo hábito', () => {
    const src = readSrc('components/DashboardFocusCard.js');
    expect(src).toMatch(/onOpenNextHabit/);
    expect(src).toMatch(/key: 'next-habit'/);
    expect(src).toMatch(/resolveFocusNextHabit/);
    expect(src).toMatch(/displayedReminder\?\.kind !== 'habit'/);
    expect(src).toMatch(/displayedReminder\?\.kind === 'habit'/);
    expect(src).toMatch(/buildFocusHabitOpenPayload/);
  });

  it('DashScreen navega a Tasks con buildFocusNextTaskNavParams', () => {
    const src = readSrc('screens/DashScreen.js');
    expect(src).toMatch(/openNextTaskFromFocus/);
    expect(src).toMatch(/buildFocusNextTaskNavParams/);
    expect(src).toMatch(/onOpenNextTask=\{openNextTaskFromFocus\}/);
  });

  it('DashScreen navega a hábitos con buildFocusNextHabitNavParams', () => {
    const src = readSrc('screens/DashScreen.js');
    expect(src).toMatch(/openNextHabitFromFocus/);
    expect(src).toMatch(/buildFocusNextHabitNavParams/);
    expect(src).toMatch(/onOpenNextHabit=\{openNextHabitFromFocus\}/);
  });

  it('focusNextHabitNavigation resuelve fallback desde candidatos', () => {
    const src = readSrc('utils/focusNextHabitNavigation.js');
    expect(src).toMatch(/resolveFocusNextHabit/);
    expect(src).toMatch(/reminder\?\.candidates/);
    expect(src).toMatch(/resolveFocusHabitId/);
  });
});
