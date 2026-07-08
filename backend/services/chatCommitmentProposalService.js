/**
 * Propuestas de compromiso entre sesiones (#202, CONTRATO_COMPROMISOS_V1).
 * Solo borradores validados en servidor; persistencia tras confirmación en cliente.
 */
import crypto from 'crypto';
import mongoose from 'mongoose';
import { normalizeSessionIntention } from '../constants/sessionIntention.js';
import {
  failsClinicalGuardrails,
  sanitizeObservationalText,
} from '../utils/clinicalContentGuardrails.js';
import { countActiveSessionCommitments, FOCUS_VISIBLE_LIMIT } from './sessionCommitmentService.js';
import {
  getProductActionNeedLevel,
  isLowValueEmotionalCheckout,
  shouldOfferProductActions,
} from './chatProductActionProposalService.js';
import conversationCommitmentProposalCapService from './conversationCommitmentProposalCapService.js';
import metricsService from './metricsService.js';
import { isUserInPostCrisisCommitmentCooldown } from '../utils/commitmentPostCrisisGuard.js';

const MAX_LABEL = 240;

const COMMITMENT_AGREEMENT_CUES =
  /\b(voy\s+a\s+(?:intentar|probar|retomar|hacer|dejar|empezar)|esta\s+semana\s+(?:voy|probar[eé]|intentar[eé])|lo\s+dejamos\s+para\s+retomar|quedamos\s+en|un\s+paso\s+(?:pequeño|chico|concreto)|micro\s*-?\s*paso|retomar(?:lo|é|e)?\s+(?:cuando|mañana|esta\s+semana)|antes\s+de\s+dormir\s+(?:voy|probar[eé])|cuando\s+me\s+venga\s+bien)\b/i;

const ASSISTANT_COMMITMENT_CLOSE =
  /\b(lo\s+dejamos\s+para\s+retomar|quedamos\s+en|un\s+paso\s+pequeño|algo\s+concreto\s+para\s+retomar|cuando\s+te\s+venga\s+bien\s+retomar)\b/i;

const NO_COMMITMENT_INTENT =
  /\b(no\s+quiero\s+compromisos?|sin\s+compromisos?|no\s+me\s+sugieras?\s+compromisos?|solo\s+escuchar|solo\s+desahogar)\b/i;

const EXPLICIT_COMMITMENT_REQUEST =
  /\b(gu[aá]rd(?:a|ar)(?:me|lo)?\s+como\s+compromiso|dej[aá]rlo\s+como\s+compromiso|compromiso\s+de\s+sesi[oó]n)\b/i;

function isValidObjectIdParam(v) {
  if (v == null) return false;
  const s = String(v).trim();
  return s.length > 0 && mongoose.Types.ObjectId.isValid(s);
}

function clampLabel(raw) {
  const t = String(raw || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, MAX_LABEL);
  if (t.length < 2) return '';
  if (failsClinicalGuardrails(t)) return '';
  return sanitizeObservationalText(t, MAX_LABEL) || '';
}

function deriveCommitmentLabel(userContent, assistantContent) {
  const userLine = String(userContent || '')
    .trim()
    .split('\n')[0]
    .trim();
  const assistantLine = String(assistantContent || '')
    .trim()
    .split('\n')
    .slice(-1)[0]
    .trim();

  const candidates = [userLine, assistantLine].filter(Boolean);
  for (const line of candidates) {
    if (COMMITMENT_AGREEMENT_CUES.test(line)) {
      const label = clampLabel(line);
      if (label) return label;
    }
  }

  if (ASSISTANT_COMMITMENT_CLOSE.test(assistantContent || '')) {
    return clampLabel('Retomar el paso que acordamos en el chat');
  }

  return '';
}

function sessionAllowsCommitmentDraft(intention, userContent, assistantContent) {
  if (EXPLICIT_COMMITMENT_REQUEST.test(userContent)) return true;
  if (NO_COMMITMENT_INTENT.test(userContent)) return false;
  if (isLowValueEmotionalCheckout(userContent)) return false;

  const combined = `${userContent}\n${assistantContent}`;
  if (COMMITMENT_AGREEMENT_CUES.test(combined)) return true;
  if (ASSISTANT_COMMITMENT_CLOSE.test(assistantContent || '')) return true;

  const needLevel = getProductActionNeedLevel(userContent);
  if (intention === 'plan' || intention === 'organize') {
    return needLevel !== 'low';
  }
  if (intention === 'technique' && needLevel !== 'low') return true;
  if (intention === 'vent') return false;
  return needLevel === 'high';
}

/**
 * @param {{ riskLevel?: string, isCrisis?: boolean }} p
 */
export function shouldOfferCommitmentProposals({ riskLevel, isCrisis }) {
  return shouldOfferProductActions({ riskLevel, isCrisis });
}

export function isExplicitCommitmentRequest(userContent) {
  return EXPLICIT_COMMITMENT_REQUEST.test(String(userContent || ''));
}

/**
 * @param {{
 *   riskLevel?: string,
 *   isCrisis?: boolean,
 *   userId: unknown,
 *   userContent: string,
 *   assistantContent?: string,
 *   sessionIntention: unknown,
 *   conversationId: unknown,
 *   assistantMessageId: unknown,
 *   interventionId?: string | null,
 * }} input
 * @returns {Promise<Array<{ id: string, label: string, rationaleShort?: string, sourceMeta?: object, suggestTask?: boolean, suggestHabit?: boolean }>>}
 */
export async function buildProposedCommitments(input) {
  const {
    riskLevel,
    isCrisis,
    userId,
    userContent,
    assistantContent = '',
    sessionIntention,
    conversationId,
    assistantMessageId,
    interventionId = null,
  } = input;

  if (!shouldOfferCommitmentProposals({ riskLevel, isCrisis })) {
    return [];
  }

  if (await isUserInPostCrisisCommitmentCooldown(userId)) {
    return [];
  }

  const content = String(userContent || '').trim();
  if (content.length < 8 && !EXPLICIT_COMMITMENT_REQUEST.test(content)) {
    return [];
  }

  const intention = normalizeSessionIntention(sessionIntention);
  const allowsDraft =
    EXPLICIT_COMMITMENT_REQUEST.test(content) ||
    sessionAllowsCommitmentDraft(intention, content, assistantContent);
  if (!allowsDraft) return [];

  if (!isValidObjectIdParam(conversationId) || !isValidObjectIdParam(assistantMessageId)) {
    return [];
  }

  const activeCount = await countActiveSessionCommitments(userId);
  if (activeCount >= FOCUS_VISIBLE_LIMIT) {
    return [];
  }

  const label = deriveCommitmentLabel(content, assistantContent);
  if (!label) return [];

  const sourceMeta = {};
  const intervention = String(interventionId || '').trim().slice(0, 64);
  if (intervention) sourceMeta.interventionId = intervention;
  sourceMeta.proposedMessageId = String(assistantMessageId);

  const needLevel = getProductActionNeedLevel(content);
  const rationaleShort =
    needLevel === 'high'
      ? 'Por lo que comentaste, puede ayudarte retomarlo entre conversaciones.'
      : 'Si te sirve, podemos dejarlo anotado para retomarlo cuando quieras.';

  return [
    {
      id: crypto.randomUUID(),
      label,
      rationaleShort,
      sourceMeta: Object.keys(sourceMeta).length > 0 ? sourceMeta : undefined,
      suggestTask: needLevel !== 'low',
      suggestHabit: /\bh[aá]bito|rutina\s+diaria|todos\s+los\s+d[ií]as\b/i.test(content),
    },
  ];
}

/**
 * Construye, filtra por cap y registra telemetría para un turno de chat.
 */
export async function resolveProposedCommitmentsForTurn(input, { transport = 'http' } = {}) {
  const {
    userId,
    riskLevel,
    isCrisis,
    userContent,
    assistantContent = '',
    sessionIntention,
    conversationId,
    assistantMessageId,
    interventionId = null,
  } = input;

  let proposedCommitments = [];
  try {
    proposedCommitments = await buildProposedCommitments({
      userId,
      riskLevel,
      isCrisis,
      userContent,
      assistantContent,
      sessionIntention,
      conversationId,
      assistantMessageId,
      interventionId,
    });
  } catch (err) {
    console.error('[chatCommitmentProposal] build:', err);
    return [];
  }

  if (proposedCommitments.length > 0) {
    try {
      proposedCommitments =
        await conversationCommitmentProposalCapService.filterProposedCommitmentsByConversationCap(
          userContent,
          conversationId,
          proposedCommitments,
        );
    } catch (capErr) {
      console.warn('[chatCommitmentProposal] cap:', capErr?.message || capErr);
      proposedCommitments = [];
    }
  }

  if (proposedCommitments.length > 0) {
    metricsService
      .recordMetric(
        'commitment_proposed',
        { count: proposedCommitments.length, transport },
        String(userId),
        { conversationId: String(conversationId) },
      )
      .catch(() => {});
    conversationCommitmentProposalCapService
      .incrementCommitmentProposalCountIfApplied(
        userContent,
        conversationId,
        proposedCommitments.length,
      )
      .catch((incErr) =>
        console.warn('[chatCommitmentProposal] cap inc:', incErr?.message || incErr),
      );
  }

  return proposedCommitments;
}

export default {
  shouldOfferCommitmentProposals,
  isExplicitCommitmentRequest,
  buildProposedCommitments,
  resolveProposedCommitmentsForTurn,
};
