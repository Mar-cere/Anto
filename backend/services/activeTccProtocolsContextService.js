/**
 * Puente chat ↔ protocolos TCC in-app (#6): snippet interno para el prompt.
 */
import ExposurePlan from '../models/ExposurePlan.js';
import { normalizeApiLanguage } from '../utils/apiLanguage.js';
import { findWeekPlanForUser, getWeekDayLabels } from './behavioralActivationWeekPlanService.js';

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

  if (lines.length === 0) return null;

  if (en) {
    return (
      '\n\n### Active in-app CBT tools (internal)\n' +
      'The user has structured tools outside chat:\n' +
      `${lines.join('\n')}\n` +
      '- You may briefly reference these if emotionally relevant; do not list screens or menus.\n' +
      '- Invite them to resume a tool only when it clearly supports what they are sharing.'
    );
  }

  return (
    '\n\n### Herramientas TCC activas en la app (interno)\n' +
    'El usuario tiene protocolos estructurados fuera del chat:\n' +
    `${lines.join('\n')}\n` +
    '- Puedes mencionarlos brevemente si encaja emocionalmente; no enumeres pantallas ni menús.\n' +
    '- Invita a retomarlos solo cuando apoye claramente lo que está compartiendo.'
  );
}

export default {
  buildActiveTccProtocolsPromptSnippet,
  pickActiveExposureStep,
  pickNextBaWeekSlot,
};
