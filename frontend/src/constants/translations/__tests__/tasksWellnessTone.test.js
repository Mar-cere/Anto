/**
 * Guardrails de tono en tareas/hábitos — sin lenguaje punitivo.
 */
import en from '../en';
import es from '../es';

const HARSH_ES = /\b(caducad|vencid|atrasad)\w*/i;
const HARSH_EN = /\b(overdue|expired|past due|late)\b/i;

const TASKS_WELLNESS_KEYS = [
  'FIELD_TITLE',
  'FIELD_DESCRIPTION',
  'FIELD_DATE_TIME',
  'FIELD_PRIORITY',
  'SECTION_OVERDUE',
  'STATUS_OVERDUE',
  'STATUS_ATTENTION_NOTE',
  'OVERDUE_TASK',
  'SUBTASKS_CREATE_HINT',
  'SUBTASKS_SUGGEST_CTA',
  'SUBTASKS_GENERATED_TOAST',
];

const TASKS_AND_HABITS_WELLNESS_KEYS = [
  'SECTION_ATTENTION',
  'SECTION_TO_COMPLETE',
];

const HABITS_WELLNESS_KEYS = [
  'CREATE_MODAL_TITLE_LABEL',
  'CREATE_MODAL_DESCRIPTION_LABEL',
  'STATUS_PENDING',
];

function assertNoHarshCopy(section, harshPattern, keys, lang) {
  const hits = keys.filter((key) => {
    const text = String(section[key] || '');
    return harshPattern.test(text);
  });
  expect(hits).toEqual([]);
  if (hits.length) {
    throw new Error(`Harsh copy in ${lang}: ${hits.join(', ')}`);
  }
}

describe('tasksWellnessTone', () => {
  it('TASKS es/en: claves de bienestar presentes', () => {
    TASKS_WELLNESS_KEYS.forEach((key) => {
      expect(es.TASKS[key]?.trim?.()).toBeTruthy();
      expect(en.TASKS[key]?.trim?.()).toBeTruthy();
    });
  });

  it('TASKS_AND_HABITS es/en: secciones unificadas presentes', () => {
    TASKS_AND_HABITS_WELLNESS_KEYS.forEach((key) => {
      expect(es.TASKS_AND_HABITS[key]?.trim?.()).toBeTruthy();
      expect(en.TASKS_AND_HABITS[key]?.trim?.()).toBeTruthy();
    });
  });

  it('HABITS es/en: claves conversacionales presentes', () => {
    HABITS_WELLNESS_KEYS.forEach((key) => {
      expect(es.HABITS[key]?.trim?.()).toBeTruthy();
      expect(en.HABITS[key]?.trim?.()).toBeTruthy();
    });
  });

  it('TASKS es: sin copy punitivo en claves de bienestar', () => {
    assertNoHarshCopy(es.TASKS, HARSH_ES, TASKS_WELLNESS_KEYS, 'es');
  });

  it('TASKS_AND_HABITS es: sin copy punitivo en secciones', () => {
    assertNoHarshCopy(
      es.TASKS_AND_HABITS,
      HARSH_ES,
      TASKS_AND_HABITS_WELLNESS_KEYS,
      'es',
    );
  });

  it('TASKS en: sin copy punitivo en claves de bienestar', () => {
    assertNoHarshCopy(en.TASKS, HARSH_EN, TASKS_WELLNESS_KEYS, 'en');
  });

  it('labels de tarea no usan mayúsculas tipo formulario', () => {
    expect(es.TASKS.FIELD_TITLE).not.toMatch(/\*/);
    expect(es.TASKS.FIELD_TITLE).toMatch(/\?$/);
    expect(en.TASKS.FIELD_TITLE).toMatch(/\?$/);
  });
});
