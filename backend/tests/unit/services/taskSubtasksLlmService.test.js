/**
 * Tests unitarios para taskSubtasksLlmService (sin llamadas a red).
 */
import {
  pickNewSubtaskTitles,
  MAX_SUBTASKS_TOTAL
} from '../../../services/taskSubtasksLlmService.js';

describe('taskSubtasksLlmService.pickNewSubtaskTitles', () => {
  it('deduplica respecto a subtareas existentes y respeta el máximo por llamada', () => {
    const existing = [{ title: 'Comprar pan' }, { title: 'Llamar al médico' }];
    const raw = [
      'comprar pan',
      'Nuevo paso único',
      'Otro paso',
      'Llamar al médico',
      'Tercero',
      'Cuarto',
      'Quinto',
      'Sexto'
    ];
    const out = pickNewSubtaskTitles(existing, raw, { maxGenerate: 5, maxTotal: 25 });
    expect(out).toEqual(['Nuevo paso único', 'Otro paso', 'Tercero', 'Cuarto', 'Quinto']);
  });

  it('respeta el límite total de subtareas en la tarea', () => {
    const existing = Array.from({ length: MAX_SUBTASKS_TOTAL - 1 }, (_, i) => ({
      title: `Paso ${i}`
    }));
    const raw = ['Uno más', 'Dos más'];
    const out = pickNewSubtaskTitles(existing, raw, { maxGenerate: 5, maxTotal: MAX_SUBTASKS_TOTAL });
    expect(out).toEqual(['Uno más']);
  });

  it('filtra títulos demasiado cortos', () => {
    const out = pickNewSubtaskTitles([], ['a', '  ', 'OK largo'], { maxGenerate: 5 });
    expect(out).toEqual(['OK largo']);
  });
});
