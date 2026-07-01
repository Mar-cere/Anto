/**
 * Continuidad chat ↔ protocolos TCC: ítems accionables (BA, exposición, AT, ABC).
 */
import mongoose from 'mongoose';
import AbcRecord from '../models/AbcRecord.js';
import AutomaticThoughtLog from '../models/AutomaticThoughtLog.js';
import ExposurePlan from '../models/ExposurePlan.js';
import Message from '../models/Message.js';
import { normalizeApiLanguage } from '../utils/apiLanguage.js';
import { tccContinuityCopy } from '../utils/tccContinuityCopy.js';
import {
  pickActiveExposureStep,
  pickBaFocusSlot,
  summarizeRecentAbcRecord,
} from './activeTccProtocolsContextService.js';
import { findWeekPlanForUser } from './behavioralActivationWeekPlanService.js';
import { getAutomaticThoughtDistortionLabel } from '../constants/automaticThoughtDistortionPicker.js';

const MAX_ITEMS = 2;
const ABC_LOOKBACK_DAYS = 7;
const AT_LOOKBACK_DAYS = 14;
const ALLOWED_KINDS = new Set([
  'behavioral_activation',
  'exposure_hierarchy',
  'automatic_thought_record',
  'abc_record',
]);
const ALLOWED_SCREENS = new Set([
  'BehavioralActivation',
  'ExposureHierarchy',
  'AutomaticThoughtRecord',
  'AbcRecord',
]);

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

function buildAtContinuityItem(log, copy, lang = 'es') {
  const thought = truncate(stripControlChars(log?.automaticThought), 120);
  if (!log?._id || !thought) return null;
  const distortionType = String(log.distortionType || '').trim().toLowerCase();
  const params = {
    fromChat: true,
    prefillSituation: truncate(stripControlChars(log.situation), 500),
    prefillAutomaticThought: truncate(stripControlChars(log.automaticThought), 500),
  };
  if (log.emotionIntensity != null) params.prefillEmotionIntensity = log.emotionIntensity;
  if (distortionType) {
    params.prefillDistortionType = distortionType;
    params.prefillDistortionName =
      getAutomaticThoughtDistortionLabel(distortionType, lang) ||
      String(log.distortionName || '').trim();
  }
  return {
    id: `at:${log._id}`,
    kind: 'automatic_thought_record',
    interventionId: 'automatic_thought_record',
    title: copy.atIncompleteTitle,
    subtitle: `${thought} · ${copy.atIncompleteSuffix}`,
    screen: 'AutomaticThoughtRecord',
    params,
    icon: '💭',
  };
}

function buildAbcContinuityItem(record, copy) {
  const summary = summarizeRecentAbcRecord(record);
  if (!record?._id || !summary?.activatingEvent) return null;
  return {
    id: `abc:${record._id}`,
    kind: 'abc_record',
    interventionId: 'abc_record',
    title: copy.abcRecentTitle,
    subtitle: summary.activatingEvent,
    screen: 'AbcRecord',
    params: {
      fromChat: true,
      prefillActivatingEvent: summary.activatingEvent,
      ...(summary.beliefs ? { prefillBeliefs: summary.beliefs } : {}),
    },
    icon: '📝',
  };
}

export async function loadAtContinuityFocus(userId, language = 'es') {
  try {
    const since = new Date(Date.now() - AT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
    const logs = await AutomaticThoughtLog.findByUser(userId, {
      startDate: since,
      archived: false,
      limit: 5,
      sortOrder: 'desc',
    });
    const incomplete = (logs || []).find(
      (log) =>
        String(log?.automaticThought || '').trim() &&
        !String(log?.balancedThought || '').trim(),
    );
    if (!incomplete) return null;
    const lang = normalizeApiLanguage(language);
    const copy = tccContinuityCopy(lang);
    return buildAtContinuityItem(incomplete, copy, lang);
  } catch {
    return null;
  }
}

export async function loadAbcContinuityFocus(userId, language = 'es') {
  try {
    const since = new Date(Date.now() - ABC_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
    const records = await AbcRecord.findByUser(userId, {
      startDate: since,
      archived: false,
      limit: 1,
      sortOrder: 'desc',
    });
    const record = records?.[0];
    if (!record) return null;
    const copy = tccContinuityCopy(normalizeApiLanguage(language));
    return buildAbcContinuityItem(record, copy);
  } catch {
    return null;
  }
}

async function conversationHasUserMessages(conversationId, userId) {
  if (!conversationId || !userId) return false;
  if (!mongoose.Types.ObjectId.isValid(String(conversationId))) return false;
  const cid = new mongoose.Types.ObjectId(String(conversationId));
  const uid = new mongoose.Types.ObjectId(String(userId));
  return Boolean(
    await Message.exists({
      conversationId: cid,
      userId: uid,
      role: 'user',
      content: { $regex: /\S/ },
    }),
  );
}

/**
 * @returns {Promise<{ items: object[], generatedAt: string }>}
 */
export async function buildChatTccContinuity({ userId, language = 'es', conversationId = null } = {}) {
  if (!userId) {
    return { items: [], generatedAt: new Date().toISOString() };
  }

  if (!(await conversationHasUserMessages(conversationId, userId))) {
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

  if (items.length < MAX_ITEMS) {
    try {
      const atItem = await loadAtContinuityFocus(userId, lang);
      if (atItem && !items.some((i) => i.id === atItem.id)) items.push(atItem);
    } catch {
      // best-effort
    }
  }

  if (items.length < MAX_ITEMS) {
    try {
      const abcItem = await loadAbcContinuityFocus(userId, lang);
      if (abcItem && !items.some((i) => i.id === abcItem.id)) items.push(abcItem);
    } catch {
      // best-effort
    }
  }

  return {
    items: sanitizeContinuityItems(items),
    generatedAt: new Date().toISOString(),
  };
}

function sanitizeContinuityItem(item) {
  if (!item?.id || !item?.title || !item?.screen) return null;
  const kind = String(item.kind || '').trim();
  const screen = String(item.screen || '').trim();
  if (!ALLOWED_KINDS.has(kind) || !ALLOWED_SCREENS.has(screen)) return null;

  return {
    id: String(item.id).slice(0, 120),
    kind,
    interventionId: String(item.interventionId || kind).slice(0, 80),
    title: truncate(stripControlChars(item.title), 120),
    subtitle: truncate(stripControlChars(item.subtitle), 160),
    screen,
    params: item.params && typeof item.params === 'object' ? item.params : {},
    icon: String(item.icon || '').slice(0, 8),
  };
}

function stripControlChars(text) {
  return String(text || '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim();
}

export function sanitizeContinuityItems(items) {
  if (!Array.isArray(items)) return [];
  const out = [];
  for (const item of items) {
    const safe = sanitizeContinuityItem(item);
    if (safe && !out.some((i) => i.id === safe.id)) out.push(safe);
    if (out.length >= MAX_ITEMS) break;
  }
  return out;
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
  loadAtContinuityFocus,
  loadAbcContinuityFocus,
  sanitizeContinuityItems,
};
