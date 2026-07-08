/**
 * Snippet de prompt para follow-up suave de compromisos en chat (#202).
 */
import { pickPendingCommitmentForChatFollowUp } from './sessionCommitmentService.js';
import { shouldOfferCommitmentProposals } from './chatCommitmentProposalService.js';
import { isUserInPostCrisisCommitmentCooldown } from '../utils/commitmentPostCrisisGuard.js';

const SNIPPETS = {
  es: (label) =>
    `\n\n## Compromisos pendientes (acompañamiento, no deberes)\n` +
    `Hay un acuerdo activo para retomar: «${label}».\n` +
    `Si encaja con el tono del usuario, puedes abrir con UNA frase suave de invitación ` +
    `(p. ej. «¿Qué tal con…?» o «¿Retomamos lo que habíamos dejado?»). ` +
    `Nunca preguntes «¿hiciste…?» ni insistas si cambia de tema.\n`,
  en: (label) =>
    `\n\n## Pending commitments (support, not homework)\n` +
    `There is an active agreement to revisit: "${label}".\n` +
    `If it fits the user's tone, you may open with ONE gentle invitation ` +
    `(e.g. "How did it go with…?" or "Shall we pick up what we left?"). ` +
    `Never ask "did you do…?" or insist if they change topic.\n`,
};

/**
 * @param {{
 *   userId: unknown,
 *   conversationId?: unknown,
 *   language?: string,
 *   riskLevel?: string,
 *   isCrisis?: boolean,
 * }} opts
 * @returns {Promise<{ snippet: string | null, commitmentId: string | null }>}
 */
export async function buildSessionCommitmentPromptSnippet(opts = {}) {
  const { userId, conversationId, language = 'es', riskLevel, isCrisis } = opts;
  if (!userId) return { snippet: null, commitmentId: null, label: null };
  if (!shouldOfferCommitmentProposals({ riskLevel, isCrisis })) {
    return { snippet: null, commitmentId: null, label: null };
  }
  if (await isUserInPostCrisisCommitmentCooldown(userId)) {
    return { snippet: null, commitmentId: null, label: null };
  }

  const pending = await pickPendingCommitmentForChatFollowUp(userId, { conversationId });
  if (!pending?.label) return { snippet: null, commitmentId: null, label: null };

  const lang = String(language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es';
  const label = String(pending.label).slice(0, 120);
  return { snippet: SNIPPETS[lang](label), commitmentId: pending.id, label };
}

export default { buildSessionCommitmentPromptSnippet };
