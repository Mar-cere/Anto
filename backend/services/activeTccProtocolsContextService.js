/**
 * Puente chat ↔ protocolos TCC in-app (#6): snippet interno para el prompt.
 */
import AbcRecord from '../models/AbcRecord.js';
import ExposurePlan from '../models/ExposurePlan.js';
import { normalizeApiLanguage } from '../utils/apiLanguage.js';
import {
  findWeekPlanForUser,
  normalizeWeekStart,
} from './behavioralActivationWeekPlanService.js';

const ABC_LOOKBACK_DAYS = 14;
const MAX_PROTOCOL_LINES = 3;

function truncate(text, max = 100) {
  const t = String(text || '').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

export function pickActiveExposureStep(plan) {
  const steps = Array.isArray(plan?.steps) ? plan.steps : [];
  if (steps.length === 0) return null;
  return (
    steps.find((s) => s?.status === 'in_progress') ||
    steps.find((s) => s?.status === 'pending') ||
    null
  );
}

export function pickNextBaWeekSlot(plan, dayLabels) {
  const slots = Array.isArray(plan?.slots) ? plan.slots : [];
  const pending = slots
    .filter((s) => s?.status === 'planned')
    .sort((a, b) => (a.dayOffset ?? 0) - (b.dayOffset ?? 0));
  if (pending.length === 0) return null;
  const next = pending[0];
  return {
    pendingCount: pending.length,
    activityDescription: truncate(next.activityDescription, 90),
    dayLabel: dayLabels?.[next.dayOffset] || '',
  };
}

/** Día 0–6 dentro de la semana del plan (lunes = 0); null si hoy cae fuera de esa semana. */
export function getTodayDayOffsetInWeek(weekStartKey, now = new Date()) {
  const start = normalizeWeekStart(weekStartKey);
  const startLocal = new Date(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((todayLocal.getTime() - startLocal.getTime()) / 86400000);
  if (diffDays < 0 || diffDays > 6) return null;
  return diffDays;
}

function formatBaFocusSlot(slot, dayLabels, { isToday, isOverdue, pendingCount }) {
  return {
    slotId: String(slot.slotId || ''),
    activityDescription: truncate(slot.activityDescription, 90),
    dayLabel: dayLabels?.[slot.dayOffset] || '',
    dayOffset: slot.dayOffset ?? 0,
    isToday,
    isOverdue,
    pendingCount,
  };
}

/**
 * Slot del plan BA más relevante para el foco del dashboard: hoy → próximo en la semana → atrasado.
 */
export function pickBaFocusSlot({ plan, weekStart, dayLabels, now = new Date() }) {
  const slots = Array.isArray(plan?.slots) ? plan.slots : [];
  const pending = slots
    .filter((s) => s?.status === 'planned')
    .sort((a, b) => (a.dayOffset ?? 0) - (b.dayOffset ?? 0));
  if (pending.length === 0) return null;

  const todayOffset = getTodayDayOffsetInWeek(weekStart, now);
  const meta = { pendingCount: pending.length };

  if (todayOffset !== null) {
    const todaySlot = pending.find((s) => (s.dayOffset ?? 0) === todayOffset);
    if (todaySlot) {
      return formatBaFocusSlot(todaySlot, dayLabels, { ...meta, isToday: true, isOverdue: false });
    }

    const upcoming = pending.find((s) => (s.dayOffset ?? 0) > todayOffset);
    if (upcoming) {
      return formatBaFocusSlot(upcoming, dayLabels, { ...meta, isToday: false, isOverdue: false });
    }

    const overdue = pending[0];
    return formatBaFocusSlot(overdue, dayLabels, { ...meta, isToday: false, isOverdue: true });
  }

  return formatBaFocusSlot(pending[0], dayLabels, { ...meta, isToday: false, isOverdue: false });
}

function stripControlChars(text) {
  return String(text || '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim();
}

export function summarizeRecentAbcRecord(record) {
  if (!record) return null;
  const activatingEvent = truncate(stripControlChars(record.activatingEvent), 70);
  const beliefs = truncate(stripControlChars(record.beliefs), 70);
  if (!activatingEvent && !beliefs) return null;
  return { activatingEvent, beliefs };
}

/**
 * @returns {Promise<string|null>}
 */
export async function buildActiveTccProtocolsPromptSnippet({ userId, language = 'es' }) {
  if (!userId) return null;

  const lang = normalizeApiLanguage(language);
  const en = lang === 'en';
  const lines = [];

  try {
    const weekCtx = await findWeekPlanForUser(userId, null, lang);
    const baNext = weekCtx ? pickNextBaWeekSlot(weekCtx.plan, weekCtx.dayLabels) : null;
    if (baNext) {
      const dayPart = baNext.dayLabel ? ` (${baNext.dayLabel})` : '';
      lines.push(
        en
          ? `- Behavioral activation weekly plan: ${baNext.pendingCount} pending; next suggested activity «${baNext.activityDescription}»${dayPart}.`
          : `- Plan semanal de activación conductual: ${baNext.pendingCount} pendiente(s); próxima actividad sugerida «${baNext.activityDescription}»${dayPart}.`,
      );
    }
  } catch {
    // best-effort
  }

  try {
    const exposurePlans = await ExposurePlan.findByUser(userId, { archived: false, limit: 1 });
    const plan = exposurePlans?.[0];
    const step = plan ? pickActiveExposureStep(plan) : null;
    if (plan && step) {
      const title = truncate(plan.title, 60);
      const stepDesc = truncate(step.description, 80);
      const statusLabel =
        step.status === 'in_progress'
          ? en
            ? 'in progress'
            : 'en progreso'
          : en
            ? 'pending'
            : 'pendiente';
      lines.push(
        en
          ? `- Exposure hierarchy «${title}»: current step «${stepDesc}» (${statusLabel}).`
          : `- Jerarquía de exposición «${title}»: paso actual «${stepDesc}» (${statusLabel}).`,
      );
    }
  } catch {
    // best-effort
  }

  try {
    const since = new Date(Date.now() - ABC_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
    const records = await AbcRecord.findByUser(userId, {
      startDate: since,
      archived: false,
      limit: 1,
      sortOrder: 'desc',
    });
    const abcSummary = summarizeRecentAbcRecord(records?.[0]);
    if (abcSummary) {
      lines.push(
        en
          ? `- Recent ABC log: situation «${abcSummary.activatingEvent}»; thought «${abcSummary.beliefs}».`
          : `- Autorregistro ABC reciente: situación «${abcSummary.activatingEvent}»; pensamiento «${abcSummary.beliefs}».`,
      );
    }
  } catch {
    // best-effort
  }

  if (lines.length === 0) return null;

  const capped = lines.slice(0, MAX_PROTOCOL_LINES);

  if (en) {
    return (
      '\n\n### Active in-app CBT tools (internal)\n' +
      'The user has structured tools outside chat:\n' +
      `${capped.join('\n')}\n` +
      '- You may briefly reference these if emotionally relevant; do not list screens or menus.\n' +
      '- Invite them to resume a tool only when it clearly supports what they are sharing.'
    );
  }

  return (
    '\n\n### Herramientas TCC activas en la app (interno)\n' +
    'El usuario tiene protocolos estructurados fuera del chat:\n' +
    `${capped.join('\n')}\n` +
    '- Puedes mencionarlos brevemente si encaja emocionalmente; no enumeres pantallas ni menús.\n' +
    '- Invita a retomarlos solo cuando apoye claramente lo que está compartiendo.'
  );
}

export default {
  buildActiveTccProtocolsPromptSnippet,
  pickActiveExposureStep,
  pickNextBaWeekSlot,
  pickBaFocusSlot,
  getTodayDayOffsetInWeek,
  summarizeRecentAbcRecord,
};
