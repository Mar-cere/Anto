/**
 * Guardrails: foco desde tarea pendiente debe iniciar o reanudar el temporizador.
 */
import fs from 'fs';
import path from 'path';

const FRONTEND_SRC = path.resolve(__dirname, '..', '..');

function readSrc(relativePath) {
  return fs.readFileSync(path.join(FRONTEND_SRC, relativePath), 'utf8');
}

describe('pomodoroFocus guard', () => {
  it('usePomodoroScreen expone activateTimer y lo usa al enfocar tarea', () => {
    const src = readSrc('hooks/usePomodoroScreen.js');
    expect(src).toMatch(/const activateTimer = useCallback/);
    expect(src).toMatch(/startFocusFromPendingTask/);
    expect(src).toMatch(/if \(focusTask\?\._id === task\._id\)/);
    expect(src).toMatch(/if \(!isActive\) \{\s*\n\s*activateTimer\(\)/);
    expect(src).toMatch(/activateTimer\(\);\s*\n\s*Haptics\.impactAsync\(Haptics\.ImpactFeedbackStyle\.Medium\)/);
  });

  it('PomodoroPendingTasksSection distingue Iniciar vs En temporizador según timerActive', () => {
    const src = readSrc('components/pomodoro/PomodoroPendingTasksSection.js');
    expect(src).toMatch(/timerActive = false/);
    expect(src).toMatch(/timerActive \? TEXTS\.TASK_FOCUS_ACTIVE : TEXTS\.START/);
    expect(src).toMatch(/isFocused && timerActive/);
  });

  it('PomodoroScreen pasa timerActive desde isActive', () => {
    const src = readSrc('screens/PomodoroScreen.js');
    expect(src).toMatch(/timerActive=\{isActive\}/);
  });
});
