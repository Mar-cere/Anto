/**
 * Tests unitarios para línea de foco determinística del dashboard (#34).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  buildDeterministicFocusCaption,
  buildReminderCandidates,
  pickDisplayedReminder
} from '../../../services/dashboardFocusService.js';

const servicePath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../services/dashboardFocusService.js',
);

describe('dashboardFocusService', () => {
  it('importa listSessionCommitments (regresión /api/summary/focus)', () => {
    const src = fs.readFileSync(servicePath, 'utf8');
    expect(src).toMatch(
      /import\s*\{[^}]*\blistSessionCommitments\b[^}]*\}\s*from\s*['"]\.\/sessionCommitmentService\.js['"]/,
    );
  });

  describe('buildDeterministicFocusCaption', () => {
    it('prioriza retorno al chat si no hay mensajes en la semana', () => {
      const text = buildDeterministicFocusCaption({
        summary: { chat: { userMessages: 0, distinctActiveDays: 0 } },
        upcomingTasks: [],
        commitmentsList: [],
        recentConversations: []
      });
      expect(text).toMatch(/chat/i);
    });

    it('menciona la próxima tarea si existe', () => {
      const text = buildDeterministicFocusCaption({
        summary: { chat: { userMessages: 10, distinctActiveDays: 3 } },
        upcomingTasks: [{ title: 'Llamar al banco' }],
        commitmentsList: [],
        recentConversations: []
      });
      expect(text).toContain('Llamar al banco');
    });

    it('usa compromisos si no hay tareas próximas', () => {
      const text = buildDeterministicFocusCaption({
        summary: { chat: { userMessages: 8, distinctActiveDays: 2 } },
        upcomingTasks: [],
        commitmentsList: ['Dormir antes de medianoche'],
        recentConversations: []
      });
      expect(text).toContain('Dormir antes de medianoche');
    });

    it('prioriza pista de protocolo terapéutico si viene de registro', () => {
      const text = buildDeterministicFocusCaption({
        summary: { chat: { userMessages: 10, distinctActiveDays: 3 } },
        upcomingTasks: [{ title: 'Ignorada si hay protocolo' }],
        commitmentsList: [],
        recentConversations: [],
        protocolLine: 'Practicar exposición gradual 10 min'
      });
      expect(text).toContain('Practicar exposición');
      expect(text).not.toContain('Ignorada');
    });

    it('devuelve textos en inglés cuando language es en', () => {
      const text = buildDeterministicFocusCaption({
        summary: { chat: { userMessages: 2, distinctActiveDays: 1 } },
        upcomingTasks: [],
        commitmentsList: [],
        recentConversations: [],
        language: 'en'
      });
      expect(text).toMatch(/little activity this week/i);
      expect(text).not.toMatch(/poca actividad/i);
    });
  });

  describe('buildReminderCandidates', () => {
    const summaryBase = { chat: { userMessages: 0, distinctActiveDays: 0 } };
    const now = new Date('2026-04-30T12:00:00.000Z');

    it('ordena chat antes que tarea cuando ambos aplican', () => {
      const conv = [
        {
          conversationId: 'c1',
          updatedAt: new Date('2026-04-28T10:00:00.000Z'),
          messageCount: 3,
          lastMessagePreview: 'Hola'
        }
      ];
      const tasks = [{ _id: 't1', title: 'Comprar', dueDate: new Date('2026-05-01') }];
      const list = buildReminderCandidates({
        summary: summaryBase,
        recentConversations: conv,
        upcomingTasks: tasks,
        habitReminder: null,
        nextPushSlot: null,
        now
      });
      expect(list[0].kind).toBe('chat');
      expect(list.some((c) => c.kind === 'task')).toBe(true);
      expect(list[0].subtitle).not.toContain('Hola');
      expect(String(list[0].subtitle)).toMatch(/chat|actividad/i);
    });

    it('incluye hábito y push al final si existen', () => {
      const habitReminder = {
        id: 'h1',
        title: 'Meditar',
        nextAt: new Date('2026-04-30T20:00:00.000Z')
      };
      const push = {
        kind: 'evening',
        at: new Date('2026-05-01T19:00:00.000Z'),
        label: 'Recordatorio tarde-noche'
      };
      const list = buildReminderCandidates({
        summary: { chat: { userMessages: 20, distinctActiveDays: 5 } },
        recentConversations: [],
        upcomingTasks: [],
        habitReminder,
        nextPushSlot: push,
        now
      });
      expect(list.find((c) => c.kind === 'habit')).toBeTruthy();
      expect(list.find((c) => c.kind === 'push')).toBeTruthy();
    });

    it('etiqueta push en inglés cuando language es en', () => {
      const push = {
        kind: 'morning',
        at: new Date('2026-05-01T08:00:00.000Z'),
        label: 'Scheduled reminder (morning)'
      };
      const list = buildReminderCandidates({
        summary: { chat: { userMessages: 20, distinctActiveDays: 5 } },
        recentConversations: [],
        upcomingTasks: [],
        habitReminder: null,
        nextPushSlot: push,
        now,
        language: 'en'
      });
      const slot = list.find((c) => c.kind === 'push');
      expect(slot.title).toMatch(/Scheduled reminder \(morning\)/i);
      expect(slot.title).not.toMatch(/mañana/i);
    });

    it('etiqueta hábito en inglés cuando language es en', () => {
      const habitReminder = {
        id: 'h1',
        title: 'Tomar agua',
        nextAt: new Date('2026-04-30T18:00:00.000Z')
      };
      const list = buildReminderCandidates({
        summary: { chat: { userMessages: 20, distinctActiveDays: 5 } },
        recentConversations: [],
        upcomingTasks: [],
        habitReminder,
        nextPushSlot: null,
        now,
        language: 'en'
      });
      const habit = list.find((c) => c.kind === 'habit');
      expect(habit.title).toMatch(/^Habit:/);
      expect(habit.title).toContain('Tomar agua');
      expect(habit.subtitle).toMatch(/Reminder around/i);
    });
  });

  describe('pickDisplayedReminder', () => {
    it('en compact omite hábito si hay otra opción', () => {
      const candidates = [
        { kind: 'task', title: 'T1' },
        { kind: 'habit', title: 'H1' }
      ];
      expect(pickDisplayedReminder(candidates, { compact: true }).kind).toBe('task');
    });

    it('en compact mantiene hábito si es la única', () => {
      const candidates = [{ kind: 'habit', title: 'H1' }];
      expect(pickDisplayedReminder(candidates, { compact: true }).kind).toBe('habit');
    });
  });

  describe('buildDashboardFocus payload', () => {
    it('expone nextHabit paralelo a nextTask cuando hay recordatorio', () => {
      const src = fs.readFileSync(servicePath, 'utf8');
      expect(src).toMatch(/nextHabit:\s*habitReminder/);
      expect(src).toMatch(/nextTask:\s*firstTask/);
      expect(src).toMatch(/reminderAt:\s*habitReminder\.nextAt/);
    });

    it('expone engagementStreak con syncToday en foco', () => {
      const src = fs.readFileSync(servicePath, 'utf8');
      expect(src).toMatch(/getEngagementStreak\(userId,\s*\{\s*syncToday:\s*true\s*\}/);
      expect(src).toMatch(/engagementStreak,/);
    });
  });
});
