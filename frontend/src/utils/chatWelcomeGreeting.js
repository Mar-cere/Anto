/**
 * Saludos iniciales del chat (es/en) por franja horaria — alineado a backend GREETING_VARIATIONS.
 */

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
 * @param {object[]} messages
 * @param {string} language
 * @returns {object[]}
 */
export function localizeChatWelcomeMessages(messages, language = 'es') {
  if (!Array.isArray(messages) || messages.length === 0) return messages;
  return messages.map((message) => {
    if (!isChatWelcomeMessage(message)) return message;
    return {
      ...message,
      content: pickChatWelcomeGreeting(language),
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
 * Filtra quickReplies, aplica idioma al welcome persistido y reconstruye las
 * sugerencias del último turno guardadas en metadata.
 * @param {object[]} messages
 * @param {string} language
 * @returns {object[]}
 */
export function finalizeLoadedChatMessages(messages, language = 'es') {
  const filtered = (messages || []).filter((m) => m.type !== 'quickReplies');
  const localized = localizeChatWelcomeMessages(filtered, language);
  return reconstructPersistedSuggestions(localized);
}
