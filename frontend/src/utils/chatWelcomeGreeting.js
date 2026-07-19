/**
 * Saludos iniciales del chat (es/en) por franja horaria — alineado a backend GREETING_VARIATIONS.
 */
import { getTranslations } from '../constants/translations';
import { sanitizeProposedCommitments } from './sanitizeProposedCommitments.js';
import { isUsableCommitmentFollowUpLabel } from './commitmentLabelUtils.js';

const GREETING_VARIATIONS_ES = {
  morning: [
    '¡Buenos días! ¿Cómo puedo ayudarte hoy?',
    '¡Hola! ¿Cómo amaneciste hoy?',
    'Buenos días, ¿cómo te sientes hoy?',
  ],
  afternoon: [
    '¡Hola! ¿Cómo va tu día?',
    '¡Buenas tardes! ¿En qué puedo ayudarte?',
    '¡Hola! ¿Cómo te sientes en este momento?',
  ],
  evening: [
    '¡Buenas tardes! ¿Cómo ha ido tu día?',
    '¡Hola! ¿Cómo te encuentras esta tarde?',
    '¡Hola! ¿Qué tal va todo?',
  ],
  night: [
    '¡Buenas noches! ¿Cómo te sientes?',
    '¡Hola! ¿Cómo ha ido tu día?',
    '¡Buenas noches! ¿En qué puedo ayudarte?',
  ],
};

const GREETING_VARIATIONS_EN = {
  morning: [
    'Good morning! How can I help you today?',
    'Hi! How did you wake up feeling today?',
    'Good morning — how are you feeling today?',
  ],
  afternoon: [
    'Hi! How is your day going?',
    'Good afternoon! What can I help you with?',
    'Hi! How are you feeling right now?',
  ],
  evening: [
    'Good evening! How has your day been?',
    'Hi! How are you doing this evening?',
    'Hi! How is everything going?',
  ],
  night: [
    'Good evening! How are you feeling?',
    'Hi! How did your day go?',
    'Good evening! What can I help you with?',
  ],
};

/** @returns {'morning'|'afternoon'|'evening'|'night'} */
export function getChatWelcomeTimePeriod(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  if (hour >= 22 || hour < 5) return 'night';
  return 'morning';
}

/**
 * @param {string} [language='es']
 * @param {Date} [date]
 * @returns {string}
 */
export function pickChatWelcomeGreeting(language = 'es', date = new Date()) {
  const lang = String(language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es';
  const period = getChatWelcomeTimePeriod(date);
  const pool = lang === 'en' ? GREETING_VARIATIONS_EN : GREETING_VARIATIONS_ES;
  const greetings = pool[period] || pool.morning;
  return greetings[Math.floor(Math.random() * greetings.length)];
}

const MOOD_BRIDGE_MOODS = ['calm', 'anxious', 'tired', 'good'];

/**
 * Saludo al abrir el chat desde el check-in del home (no vuelve a preguntar el ánimo).
 * @param {string} mood
 * @param {string} [language='es']
 * @param {string} [dateKey]
 * @returns {string|null}
 */
export function pickMoodBridgeWelcomeGreeting(mood, language = 'es', dateKey = '') {
  const key = String(mood || '').trim();
  if (!MOOD_BRIDGE_MOODS.includes(key)) return null;
  const lang = String(language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es';
  const pool = getTranslations(lang).DASH?.MOOD_BRIDGE_GREETINGS?.[key] || [];
  if (pool.length === 0) return null;
  let hash = 0;
  const seed = `${dateKey}|${key}|bridge`;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return pool[hash % pool.length];
}

/**
 * @param {object} message
 * @returns {boolean}
 */
export function isChatWelcomeMessage(message) {
  if (!message || message.role !== 'assistant') return false;
  if (message.metadata?.type === 'welcome') return true;
  if (message.type === 'welcome') return true;
  const id = String(message.id || message._id || '');
  return id.startsWith('welcome-');
}

/**
 * Reemplaza el texto de mensajes welcome persistidos (p. ej. en español) por el idioma actual.
 * Conserva el puente de check-in de ánimo si vino del home.
 * @param {object[]} messages
 * @param {string} language
 * @returns {object[]}
 */
export function localizeChatWelcomeMessages(messages, language = 'es') {
  if (!Array.isArray(messages) || messages.length === 0) return messages;
  return messages.map((message) => {
    if (!isChatWelcomeMessage(message)) return message;
    const moodKey = String(message.metadata?.moodCheckInMood || '').trim();
    const moodDateKey = String(message.metadata?.moodCheckInDateKey || '').trim();
    const bridge =
      message.metadata?.fromMoodCheckIn === true && moodKey
        ? pickMoodBridgeWelcomeGreeting(moodKey, language, moodDateKey)
        : null;
    return {
      ...message,
      content: bridge || pickChatWelcomeGreeting(language),
    };
  });
}

/**
 * Reconstruye la tarjeta de sugerencias del último turno con sugerencias persistidas
 * (metadata.suggestions). Así, al reabrir la conversación, las sugerencias del chat
 * no desaparecen. Solo el último turno, como en vivo.
 * @param {object[]} messages
 * @returns {object[]}
 */
export function reconstructPersistedSuggestions(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return messages;
  // Si ya hay un bloque de sugerencias en vivo, no duplicar.
  if (messages.some((m) => m?.type === 'suggestions')) return messages;

  let lastIdx = -1;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const suggestions = messages[i]?.metadata?.suggestions;
    if (Array.isArray(suggestions) && suggestions.length > 0) {
      lastIdx = i;
      break;
    }
  }
  if (lastIdx === -1) return messages;

  const source = messages[lastIdx];
  const block = {
    id: `suggestions-loaded-${source._id || source.id || lastIdx}`,
    role: 'suggestions',
    type: 'suggestions',
    suggestions: source.metadata.suggestions,
    metadata: {
      timestamp: source.metadata?.timestamp || new Date().toISOString(),
      rankingPersonalized: source.metadata?.suggestionsPersonalized === true,
    },
  };
  const next = [...messages];
  next.splice(lastIdx + 1, 0, block);
  return next;
}

/**
 * Reconstruye el bloque de follow-up de compromiso (#202) desde el último
 * mensaje del asistente con metadata.commitmentFollowUp, para que los chips no
 * desaparezcan al recargar. Solo el último, como en vivo.
 * @param {object[]} messages
 * @returns {object[]}
 */
export function reconstructPersistedCommitmentFollowUp(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return messages;
  if (messages.some((m) => m?.type === 'commitment_follow_up')) return messages;

  let lastIdx = -1;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const cf = messages[i]?.metadata?.commitmentFollowUp;
    if (cf?.id) {
      lastIdx = i;
      break;
    }
  }
  if (lastIdx === -1) return messages;

  const source = messages[lastIdx];
  const cf = source.metadata?.commitmentFollowUp;
  if (!cf?.id || !isUsableCommitmentFollowUpLabel(cf.label)) return messages;

  const block = {
    id: `commitment-follow-up-loaded-${source._id || source.id || lastIdx}`,
    role: 'suggestions',
    type: 'commitment_follow_up',
    commitmentFollowUp: source.metadata.commitmentFollowUp,
    metadata: {
      timestamp: source.metadata?.timestamp || new Date().toISOString(),
    },
  };
  const next = [...messages];
  next.splice(lastIdx + 1, 0, block);
  return next;
}

/**
 * Reconstruye chips de follow-up experiencial (#211) desde metadata.
 * @param {object[]} messages
 * @returns {object[]}
 */
export function reconstructPersistedExperientialFollowUp(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return messages;
  if (messages.some((m) => m?.type === 'experiential_follow_up')) return messages;

  let lastIdx = -1;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const ef = messages[i]?.metadata?.experientialFollowUp;
    if (ef?.id) {
      lastIdx = i;
      break;
    }
  }
  if (lastIdx === -1) return messages;

  const source = messages[lastIdx];
  const ef = source.metadata?.experientialFollowUp;
  if (!ef?.id) return messages;

  const block = {
    id: `experiential-follow-up-loaded-${source._id || source.id || lastIdx}`,
    role: 'suggestions',
    type: 'experiential_follow_up',
    experientialFollowUp: ef,
    metadata: {
      timestamp: source.metadata?.timestamp || new Date().toISOString(),
    },
  };
  const next = [...messages];
  next.splice(lastIdx + 1, 0, block);
  return next;
}

/**
 * Reconstruye la tarjeta de compromisos del último turno (metadata.proposedCommitments).
 * @param {object[]} messages
 * @returns {object[]}
 */
export function reconstructPersistedCommitmentProposals(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return messages;
  if (messages.some((m) => m?.type === 'commitment_proposals')) return messages;

  let lastIdx = -1;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const proposals = messages[i]?.metadata?.proposedCommitments;
    if (Array.isArray(proposals) && proposals.length > 0) {
      lastIdx = i;
      break;
    }
  }
  if (lastIdx === -1) return messages;

  const source = messages[lastIdx];
  const assistantMessageId = source._id || source.id;
  const block = {
    id: `commitment-proposals-loaded-${assistantMessageId || lastIdx}`,
    role: 'suggestions',
    type: 'commitment_proposals',
    proposedCommitments: sanitizeProposedCommitments(source.metadata.proposedCommitments),
    metadata: {
      timestamp: source.metadata?.timestamp || new Date().toISOString(),
      assistantMessageId: assistantMessageId ? String(assistantMessageId) : undefined,
    },
  };
  const next = [...messages];
  next.splice(lastIdx + 1, 0, block);
  return next;
}

/**
 * Filtra quickReplies, aplica idioma al welcome persistido y reconstruye las
 * sugerencias, el follow-up de compromiso y las propuestas del último turno.
 * @param {object[]} messages
 * @param {string} language
 * @returns {object[]}
 */
export function finalizeLoadedChatMessages(messages, language = 'es') {
  const filtered = (messages || []).filter((m) => m.type !== 'quickReplies');
  const localized = localizeChatWelcomeMessages(filtered, language);
  const withSuggestions = reconstructPersistedSuggestions(localized);
  const withFollowUp = reconstructPersistedCommitmentFollowUp(withSuggestions);
  const withExperiential = reconstructPersistedExperientialFollowUp(withFollowUp);
  return reconstructPersistedCommitmentProposals(withExperiential);
}

