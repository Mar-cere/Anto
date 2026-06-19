/**
 * Guardrails estáticos: modales de tareas/hábitos y racha del dashboard.
 */
import fs from 'fs';
import path from 'path';

const FRONTEND_SRC = path.resolve(__dirname, '..', '..');

function readSrc(relativePath) {
  return fs.readFileSync(path.join(FRONTEND_SRC, relativePath), 'utf8');
}

describe('tasksHabitsModals guard', () => {
  it('CreateTaskModal usa hook de teclado sin setKeyboardVisible local', () => {
    const src = readSrc('components/tasks/CreateTaskModal.js');
    expect(src).toMatch(/useModalKeyboardVisible/);
    expect(src).toMatch(/ModalKeyboardScroll/);
    expect(src).toMatch(/syncModalKeyboardWithVisibility/);
    expect(src).not.toMatch(/setKeyboardVisible/);
    expect(src).not.toMatch(/KeyboardAvoidingView/);
  });

  it('CreateHabitModal usa hook de teclado sin setKeyboardVisible local', () => {
    const src = readSrc('components/habits/CreateHabitModal.js');
    expect(src).toMatch(/useModalKeyboardVisible/);
    expect(src).toMatch(/ModalKeyboardScroll/);
    expect(src).toMatch(/syncModalKeyboardWithVisibility/);
    expect(src).not.toMatch(/setKeyboardVisible/);
    expect(src).not.toMatch(/KeyboardAvoidingView/);
  });

  it('DashboardStreakHero usa gradiente SVG, no capas cortadas', () => {
    const src = readSrc('components/dashboard/DashboardStreakHero.js');
    expect(src).toMatch(/SheetBrandGradient/);
    expect(src).not.toMatch(/heroGradientFade/);
    expect(src).not.toMatch(/heroGradientBase/);
  });

  it('SheetBrandGradient exporta componente de gradiente', () => {
    const src = readSrc('components/common/SheetBrandGradient.js');
    expect(src).toMatch(/LinearGradient/);
    expect(src).toMatch(/topColor/);
    expect(src).toMatch(/bottomColor/);
  });

  it('ModalKeyboardScroll puentea innerRef con assignForwardedRef', () => {
    const src = readSrc('components/common/ModalKeyboardScroll.js');
    expect(src).toMatch(/assignForwardedRef/);
    expect(src).not.toMatch(/innerRef=\{ref\}/);
  });
});
