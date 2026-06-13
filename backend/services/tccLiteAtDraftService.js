/**
 * Borrador AT desde cierre TCC lite (#89 / #201).
 */
import mongoose from 'mongoose';
import AutomaticThoughtLog from '../models/AutomaticThoughtLog.js';
import { buildAtHandoffFromTccLiteSession } from './chatTccLiteService.js';
import { getAutomaticThoughtDistortionLabel } from '../constants/automaticThoughtDistortionPicker.js';
import { normalizeApiLanguage } from '../utils/apiLanguage.js';

function clamp(text, max) {
  const t = String(text || '').trim();
  if (!t) return '';
  return t.length <= max ? t : `${t.slice(0, max - 1).trim()}…`;
}

/**
 * @param {object} params
 * @param {string} params.userId
 * @param {Array} params.conversationHistory
 * @param {string} [params.distortionType]
 * @param {string} [params.language='es']
 * @param {object} [params.handoffParams] — prefill ya calculado en cliente
 */
export async function createAtDraftFromTccLite({
  userId,
  conversationHistory,
  distortionType,
  language = 'es',
  handoffParams,
}) {
  if (!userId) return null;

  const lang = normalizeApiLanguage(language);
  const params =
    handoffParams && typeof handoffParams === 'object'
      ? handoffParams
      : buildAtHandoffFromTccLiteSession({
          conversationHistory: conversationHistory || [],
          distortionType,
          language: lang,
        })?.params;

  if (!params?.prefillAutomaticThought && !params?.prefillSituation) return null;

  const dtype = String(params.prefillDistortionType || distortionType || '').trim().toLowerCase();
  const log = await AutomaticThoughtLog.create({
    userId: new mongoose.Types.ObjectId(String(userId)),
    situation: clamp(params.prefillSituation || 'Desde chat TCC', 500),
    automaticThought: clamp(params.prefillAutomaticThought, 500),
    emotionIntensity: params.prefillEmotionIntensity ?? 5,
    distortionType: dtype,
    distortionName:
      clamp(params.prefillDistortionName, 200) ||
      getAutomaticThoughtDistortionLabel(dtype, lang) ||
      '',
    balancedThought: clamp(params.prefillBalancedThought, 500),
    notes: lang === 'en' ? 'Draft from in-chat CBT frame' : 'Borrador desde marco TCC en chat',
    entryDate: new Date(),
  });

  return {
    logId: String(log._id),
    screen: 'AutomaticThoughtRecord',
    params: {
      fromChat: true,
      fromTccLite: true,
      prefillSituation: log.situation,
      prefillAutomaticThought: log.automaticThought,
      prefillEmotionIntensity: log.emotionIntensity,
      prefillDistortionType: log.distortionType || undefined,
      prefillDistortionName: log.distortionName || undefined,
      prefillBalancedThought: log.balancedThought || undefined,
      openLogId: String(log._id),
    },
  };
}

export default { createAtDraftFromTccLite };
