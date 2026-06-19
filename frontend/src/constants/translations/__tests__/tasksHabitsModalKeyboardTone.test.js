/**
 * Guardrails de teclado en modales de tareas/hábitos.
 */
import en from '../en';
import es from '../es';

const TASK_MODAL_KEYBOARD_KEYS = ['KEYBOARD_DONE'];
const HABIT_MODAL_KEYBOARD_KEYS = ['CREATE_MODAL_DONE'];

describe('tasksHabitsModalKeyboardTone', () => {
  it('TASKS es/en: botón Listo/Done presente', () => {
    TASK_MODAL_KEYBOARD_KEYS.forEach((key) => {
      expect(es.TASKS[key]?.trim?.()).toBeTruthy();
      expect(en.TASKS[key]?.trim?.()).toBeTruthy();
    });
  });

  it('HABITS es/en: botón Listo/Done presente', () => {
    HABIT_MODAL_KEYBOARD_KEYS.forEach((key) => {
      expect(es.HABITS[key]?.trim?.()).toBeTruthy();
      expect(en.HABITS[key]?.trim?.()).toBeTruthy();
    });
  });

  it('es: copy Listo sin voseo', () => {
    expect(es.TASKS.KEYBOARD_DONE).toMatch(/listo/i);
    expect(es.HABITS.CREATE_MODAL_DONE).toMatch(/listo/i);
  });
});
