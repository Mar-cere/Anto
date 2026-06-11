/**
 * Continuidad chat ↔ protocolos TCC: ítems accionables (BA, exposición).
 */
import ExposurePlan from '../models/ExposurePlan.js';
import { normalizeApiLanguage } from '../utils/apiLanguage.js';
import { tccContinuityCopy } from '../utils/tccContinuityCopy.js';
import {
  pickActiveExposureStep,
  pickBaFocusSlot,
} from './activeTccProtocolsContextService.js';
import { findWeekPlanForUser } from './behavioralActivationWeekPlanService.js';

const MAX_ITEMS = 2;

function truncate(text, max = 100) {
  const t = String(text || '').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

function buildBaContinuityItem(picked, dayLabels, copy) {
  if (!picked?.slotId || !String(picked.activityDescription || '').trim()) return null;

  let title = copy.baUpcoming;
  if (picked.isToday) title = copy.baToday;
  else if (picked.isTomorrow) title = copy.baTomorrow;
  else if (picked.isOverdue) title = copy.baOverdue;

  const day = dayLabels?.[picked.dayOffset] || '';
  let subtitle = truncate(picked.activityDescription, 120);
  if (picked.isToday && picked.pendingCount > 1) {
    subtitle = `${subtitle} · ${picked.pendingCount - 1} ${copy.baMoreSuffix}`;
  } else if (day && !picked.isToday) {
    subtitle = `${day} · ${subtitle}`;
  }

  return {
    id: `ba:${picked.slotId}`,
    kind: 'behavioral_activation',
    interventionId: 'behavioral_activation',
    title,
    subtitle,
    screen: 'BehavioralActivation',
    params: { openWeekSlotId: picked.slotId },
    icon: '🚶',
  };
}

function buildExposureContinuityItem(plan, step, copy, lang = 'es') {
  if (!plan?._id || !step?.description) return null;
  let subtitle = truncate(step.description, 120);
  const stepIndex = (plan.currentStepIndex ?? 0) + 1;
  const total = plan.steps?.length || 0;
  const parts = [];
  if (total > 0) parts.push(lang === 'en' ? `Step ${stepIndex}/${total}` : `Paso ${stepIndex}/${total}`);
  parts.push(subtitle);
  const attempts = step.attempts?.length || 0;
  if (attempts > 0) parts.push(`${attempts} ${copy.exposureAttemptsSuffix}`);
  subtitle = parts.join(' · ');

  return {
    id: `exposure:${plan._id}`,
    kind: 'exposure_hierarchy',
    interventionId: 'exposure_hierarchy',
    title: copy.exposureTitle,
    subtitle,
    screen: 'ExposureHierarchy',
    params: { openPlanId: String(plan._id), mode: 'practice' },
    icon: '🪜',
  };
}

/**
 * @returns {Promise<{ items: object[], generatedAt: string }>}
 */
export async function buildChatTccContinuity({ userId, language = 'es' }) {
  if (!userId) {
    return { items: [], generatedAt: new Date().toISOString() };
  }

  const lang = normalizeApiLanguage(language);
  const copy = tccContinuityCopy(lang);
  const items = [];

  try {
    const weekCtx = await findWeekPlanForUser(userId, null, lang);
    if (weekCtx) {
      const picked = pickBaFocusSlot({
        plan: weekCtx.plan,
        weekStart: weekCtx.weekStart,
        dayLabels: weekCtx.dayLabels,
      });
      const baItem = buildBaContinuityItem(picked, weekCtx.dayLabels, copy);
      if (baItem) items.push(baItem);
    }
  } catch {
    // best-effort
  }

  if (items.length < MAX_ITEMS) {
    try {
      const plans = await ExposurePlan.findByUser(userId, { archived: false, limit: 3 });
      for (const plan of plans || []) {
        const step = pickActiveExposureStep(plan);
        if (!step) continue;
        const exposureItem = buildExposureContinuityItem(plan, step, copy, lang);
        if (exposureItem && !items.some((i) => i.id === exposureItem.id)) {
          items.push(exposureItem);
          break;
        }
      }
    } catch {
      // best-effort
    }
  }

  return {
    items: items.slice(0, MAX_ITEMS),
    generatedAt: new Date().toISOString(),
  };
}

export async function loadExposureFocus(userId) {
  try {
    const plans = await ExposurePlan.findByUser(userId, { archived: false, limit: 1 });
    const plan = plans?.[0];
    const step = plan ? pickActiveExposureStep(plan) : null;
    if (!plan || !step) return null;
    return {
      planId: String(plan._id),
      planTitle: truncate(plan.title, 80),
      stepDescription: truncate(step.description, 120),
      stepIndex: (plan.currentStepIndex ?? 0) + 1,
      stepTotal: plan.steps?.length || 0,
      attemptCount: step.attempts?.length || 0,
    };
  } catch {
    return null;
  }
}

export default {
  buildChatTccContinuity,
  loadExposureFocus,
};
