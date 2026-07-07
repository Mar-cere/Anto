/**
 * Follow-up de compromisos en chat (#202).
 *
 * Al iniciar una conversación nueva, si hay un compromiso de la sesión anterior
 * cuyo seguimiento ya venció y aún no se preguntó, se inyecta un snippet suave
 * en el prompt para que la IA lo retome (sin culpa, atendiendo primero lo que
 * trae el usuario) y se envían chips de respuesta al cliente.
 *
 * Cierre del lazo: por chips (determinista) y, como respaldo, un detector
 * heurístico conservador sobre respuestas cortas en lenguaje natural.
 */
import mongoose from 'mongoose';
import SessionCommitment from '../models/SessionCommitment.js';
import { updateSessionCommitment } from './sessionCommitmentService.js';
import { isChatObservationalContextBlocked } from '../utils/chatObservationalContext.js';
import { normalizeApiLanguage } from '../utils/apiLanguage.js';

/** Solo se pregunta al inicio del hilo (primer turno real del usuario). */
const MAX_USER_TURNS_FOR_ASK = 1;
/** Ventana para que el detector heurístico asocie una respuesta al follow-up. */
const ANSWER_LOOKBACK_HOURS = 48;
/** Respuestas largas no se infieren (se dejan a los chips) para evitar falsos positivos. */
const MAX_ANSWER_LEN_FOR_HEURISTIC = 80;

function countUserTurns(conversationHistory = []) {
  if (!Array.isArray(conversationHistory)) return 0;
  return conversationHistory.filter((m) => m?.role === 'user').length;
}

function truncateLabel(label, max = 120) {
  return String(label || '').trim().replace(/\s+/g, ' ').slice(0, max);
}

/**
 * Snippet de prompt en es/en. Tono sin culpa; la IA atiende primero al usuario.
 */
export function buildCommitmentFollowUpPromptSnippet(label, language = 'es') {
  const safe = truncateLabel(label);
  if (!safe) return null;
  const lang = normalizeApiLanguage(language);
  if (lang === 'en') {
    return (
      '\n\n### Commitment follow-up (previous session)\n' +
      `Last time the person set out to: "${safe}". ` +
      'If their current message does not bring something urgent or distressing, then — after attending to what they bring — gently revisit that commitment with curiosity and no judgment ' +
      '(e.g. "last time you wanted to ' +
      `${safe}, how did that go?"). ` +
      'If they did not do it, validate without pressure and, if it fits, offer to adjust it. ' +
      'If they bring high distress, urgency, or shift to an emotionally heavy topic, do not mention it this turn.\n'
    );
  }
  return (
    '\n\n### Seguimiento de compromiso (sesión anterior)\n' +
    `La última vez la persona se propuso: "${safe}". ` +
    'Si su mensaje de ahora no trae algo urgente o angustiante, después de atender lo que trae, retoma ese compromiso con curiosidad y sin juzgar ' +
    `(por ejemplo: "la última vez quedó ${safe}, ¿cómo te fue con eso?"). ` +
    'Si no lo hizo, valida sin presionar y, si encaja, ofrece ajustarlo. ' +
    'Si trae malestar alto, urgencia o cambia a un tema con peso emocional, no lo menciones este turno.\n'
  );
}

/**
 * Clasifica una respuesta corta a un follow-up. Conservador: devuelve null
 * salvo señal clara. Comprueba parcial → negativa → afirmativa (en ese orden).
 *
 * @returns {('yes'|'partial'|'no'|null)}
 */
export function classifyFollowUpAnswerFromText(text) {
  const raw = String(text || '').trim().toLowerCase();
  if (!raw || raw.length > MAX_ANSWER_LEN_FOR_HEURISTIC) return null;
  // Normaliza acentos para emparejar "sí"/"si", "olvidé"/"olvide", etc.
  const t = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const hasAny = (patterns) => patterns.some((p) => new RegExp(p).test(t));

  const partial = [
    'mas o menos', 'a medias', '\\bcasi\\b', 'en parte', 'un poco', 'algo asi',
    'sort of', 'kind of', 'partly', 'almost', 'a bit', 'half',
  ];
  const negative = [
    '\\bno\\b', 'no pude', 'no lo hice', 'no alcance', 'todavia no', 'aun no',
    'se me olvido', 'olvide', 'no tuve', 'no he',
    "didn't", 'did not', "couldn't", 'could not', 'not yet', 'forgot', "haven't",
  ];
  const affirmative = [
    '\\bsi\\b', 'lo hice', 'lo logre', 'completi', 'cumpli', '\\bhecho\\b', 'ya esta',
    '\\bpude\\b', 'termine', 'lo termine',
    '\\byes\\b', 'i did', '\\bdone\\b', 'completed', 'managed', 'finished',
  ];

  if (hasAny(partial)) return 'partial';
  if (hasAny(negative)) return 'no';
  if (hasAny(affirmative)) return 'yes';
  return null;
}

/**
 * Selecciona el compromiso vencido a retomar y arma el plan + snippet.
 * Solo al inicio del hilo, fuera de crisis, una vez por compromiso.
 *
 * @returns {Promise<{ commitmentId: string, label: string, promptSnippet: string } | null>}
 */
export async function buildCommitmentFollowUpPlan({
  userId,
  conversationHistory = [],
  riskLevel = 'LOW',
  language = 'es',
  forceFollowUp = false,
} = {}) {
  if (!userId) return null;
  // El gating de crisis nunca se omite, ni siquiera al retomar desde el dashboard.
  if (isChatObservationalContextBlocked(riskLevel)) return null;
  // Por defecto solo al inicio del hilo; forceFollowUp lo permite al "retomar
  // conversación" desde el dashboard aunque el hilo ya tenga historial (#202).
  if (!forceFollowUp && countUserTurns(conversationHistory) > MAX_USER_TURNS_FOR_ASK) {
    return null;
  }

  const uid = new mongoose.Types.ObjectId(String(userId));
  const doc = await SessionCommitment.findOne({
    userId: uid,
    status: 'active',
    followUpAnswer: 'pending',
    followUpAskedAt: null,
    followUpAt: { $ne: null, $lte: new Date() },
  })
    .sort({ followUpAt: 1 })
    .lean();

  if (!doc) return null;

  const promptSnippet = buildCommitmentFollowUpPromptSnippet(doc.label, language);
  if (!promptSnippet) return null;

  return {
    commitmentId: String(doc._id),
    label: truncateLabel(doc.label),
    promptSnippet,
  };
}

/**
 * Marca que ya se preguntó por el compromiso (una sola vez). Best-effort.
 */
export async function markCommitmentFollowUpAsked(commitmentId) {
  if (!commitmentId || !mongoose.Types.ObjectId.isValid(String(commitmentId))) return;
  await SessionCommitment.updateOne(
    { _id: new mongoose.Types.ObjectId(String(commitmentId)) },
    { $set: { followUpAskedAt: new Date() } },
  );
}

/**
 * Respaldo de inferencia: si el usuario respondió por texto (no por chips) a un
 * follow-up reciente, actualiza el estado. Conservador y best-effort.
 *
 * @returns {Promise<{ commitmentId: string, followUpAnswer: string } | null>}
 */
export async function detectCommitmentFollowUpAnswer({ userId, userContent } = {}) {
  if (!userId) return null;
  const answer = classifyFollowUpAnswerFromText(userContent);
  if (!answer) return null;

  const uid = new mongoose.Types.ObjectId(String(userId));
  const since = new Date(Date.now() - ANSWER_LOOKBACK_HOURS * 60 * 60 * 1000);
  const pending = await SessionCommitment.findOne({
    userId: uid,
    followUpAnswer: 'pending',
    followUpAskedAt: { $ne: null, $gte: since },
  })
    .sort({ followUpAskedAt: -1 })
    .lean();

  if (!pending) return null;

  const result = await updateSessionCommitment(userId, String(pending._id), {
    followUpAnswer: answer,
  });
  if (result?.error) return null;
  return { commitmentId: String(pending._id), followUpAnswer: answer };
}

export default {
  buildCommitmentFollowUpPromptSnippet,
  classifyFollowUpAnswerFromText,
  buildCommitmentFollowUpPlan,
  markCommitmentFollowUpAsked,
  detectCommitmentFollowUpAnswer,
};
