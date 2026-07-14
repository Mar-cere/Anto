/**
 * Copy y metadatos del check-in diario (ES/EN).
 */
import { DAILY_MOOD_VALUES } from '../models/DailyMoodCheckIn.js';

const COPY = {
  es: {
    calm: {
      label: 'Calma',
      acknowledgments: [
        'Qué bueno. Si quieres, podemos mantener ese ritmo hoy.',
        'Se nota esa calma. No hace falta forzar nada.',
        'Bien que llegues así. Podemos apoyarnos en eso.',
        'Esa tranquilidad cuenta. Estoy aquí si quieres usarla.',
      ],
      antoSnippet: '¿Quieres contarme qué te ayuda a sentirte así de tranquilo?',
      suggestChat: false,
      chatEmotion: 'tranquilidad',
    },
    anxious: {
      label: 'Tenso',
      acknowledgments: [
        'Gracias por contarlo. No tienes que afrontarlo solo.',
        'Lo nombro contigo: estás tenso, y eso importa.',
        'Tiene sentido que te cueste ahora. Aquí puedes ir despacio.',
        'Gracias por avisarlo. Podemos mirarlo juntos, sin apuro.',
      ],
      antoSnippet: 'Puedo acompañarte ahora con calma, sin apuro.',
      suggestChat: true,
      chatEmotion: 'ansiedad',
    },
    tired: {
      label: 'Fatiga',
      acknowledgments: [
        'Tiene sentido. Hoy podemos ir despacio.',
        'La fatiga también merece espacio. No tienes que rendir ahora.',
        'Gracias por decirlo. Podemos elegir algo pequeño y amable.',
        'Cuando el cuerpo pide pausa, escucharlo ya es un cuidado.',
      ],
      antoSnippet: 'Si quieres, vemos juntos qué te está pesando.',
      suggestChat: true,
      chatEmotion: 'cansancio',
    },
    good: {
      label: 'Bien',
      acknowledgments: [
        'Me alegra leer eso. ¿Quieres aprovechar ese impulso?',
        'Qué bueno escucharlo. Podemos sostenerlo un rato.',
        'Bienvenido ese ánimo. Si quieres, lo usamos con cuidado.',
        'Me alegra que estés bien. Hoy puede bastar con notarlo.',
      ],
      antoSnippet: '¿Quieres contarme qué está ayudando hoy?',
      suggestChat: false,
      chatEmotion: 'bienestar',
    },
  },
  en: {
    calm: {
      label: 'Calm',
      acknowledgments: [
        'Good to hear. We can keep that pace today if you want.',
        'That calm comes through. No need to force anything.',
        'Nice that you’re arriving like this. We can lean on it.',
        'That quiet matters. I’m here if you want to use it.',
      ],
      antoSnippet: 'Want to share what helps you feel this calm?',
      suggestChat: false,
      chatEmotion: 'calm',
    },
    anxious: {
      label: 'Tense',
      acknowledgments: [
        'Thanks for sharing. You do not have to face this alone.',
        'I’ll name it with you: you’re tense, and that matters.',
        'It makes sense this feels hard. We can go slowly here.',
        'Thanks for saying so. We can look at it together, without rushing.',
      ],
      antoSnippet: 'I can be with you now, calmly and without rushing.',
      suggestChat: true,
      chatEmotion: 'anxiety',
    },
    tired: {
      label: 'Tired',
      acknowledgments: [
        'That makes sense. We can take it slow today.',
        'Fatigue deserves space too. You don’t have to perform right now.',
        'Thanks for saying it. We can choose something small and kind.',
        'When your body asks for pause, listening is already care.',
      ],
      antoSnippet: 'If you want, we can look at what feels heavy together.',
      suggestChat: true,
      chatEmotion: 'fatigue',
    },
    good: {
      label: 'Good',
      acknowledgments: [
        'Glad to read that. Want to build on that momentum?',
        'Good to hear it. We can hold onto that for a bit.',
        'Welcome that mood. If you want, we can use it gently.',
        'I’m glad you’re doing well. Today it may be enough to notice it.',
      ],
      antoSnippet: 'Want to tell me what is helping today?',
      suggestChat: false,
      chatEmotion: 'wellbeing',
    },
  },
};

/**
 * Saludo de bienvenida cuando ya existe check-in del día (alineado al puente del frontend).
 * No vuelve a preguntar el ánimo.
 */
const MOOD_BRIDGE_WELCOME = {
  es: {
    calm: [
      'Vi que llegas en calma. Si quieres, cuéntame qué te está sosteniendo.',
      'Noté tu calma en el home. ¿Quieres usar ese espacio para algo concreto?',
    ],
    anxious: [
      'Vi que llegas tenso. Si quieres, cuéntame qué te está pesando, sin apuro.',
      'Gracias por marcarlo en el home. Estoy aquí contigo; ¿por dónde empezamos?',
    ],
    tired: [
      'Vi que llegas con fatiga. Podemos ir despacio: ¿qué te está quitando energía?',
      'Noté tu cansancio en el home. Si quieres, vemos juntos qué pesa hoy.',
    ],
    good: [
      'Vi que estás bien. Si quieres, cuéntame qué está ayudando hoy.',
      'Qué bueno leerte así en el home. ¿Hay algo que quieras sostener o celebrar?',
    ],
  },
  en: {
    calm: [
      'I saw you arrived calm. If you want, tell me what’s holding you up.',
      'I noticed your calm on home. Want to use that space for something concrete?',
    ],
    anxious: [
      'I saw you arrived tense. If you want, tell me what’s weighing on you — no rush.',
      'Thanks for marking it on home. I’m here with you; where should we start?',
    ],
    tired: [
      'I saw you’re tired. We can go slowly — what’s draining you?',
      'I noticed your fatigue on home. If you want, we can look at what feels heavy.',
    ],
    good: [
      'I saw you’re doing well. If you want, tell me what’s helping today.',
      'Good to read that on home. Anything you’d like to hold onto or celebrate?',
    ],
  },
};

export function normalizeDailyMoodLanguage(language) {
  return language === 'en' ? 'en' : 'es';
}

export function isValidDailyMood(mood) {
  return DAILY_MOOD_VALUES.includes(String(mood || '').trim());
}

function stableIndex(seed, length) {
  const raw = String(seed || '');
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
  }
  return length > 0 ? hash % length : 0;
}

/**
 * @param {string[]} list
 * @param {string} [dateKey]
 * @param {string} [mood]
 */
export function pickRotatingAcknowledgment(list, dateKey, mood) {
  const items = Array.isArray(list) ? list.filter((s) => String(s || '').trim()) : [];
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  return items[stableIndex(`${dateKey || ''}|${mood || ''}`, items.length)];
}

/**
 * @param {string} mood
 * @param {'es'|'en'} [language]
 * @param {string|null} [dateKey]
 */
export function getDailyMoodCopy(mood, language = 'es', dateKey = null) {
  const lang = normalizeDailyMoodLanguage(language);
  const key = isValidDailyMood(mood) ? mood : null;
  if (!key) return null;
  const base = COPY[lang][key];
  const acknowledgment = pickRotatingAcknowledgment(base.acknowledgments, dateKey, key);
  return {
    label: base.label,
    acknowledgment,
    acknowledgments: base.acknowledgments,
    antoSnippet: base.antoSnippet,
    suggestChat: base.suggestChat,
    chatEmotion: base.chatEmotion,
  };
}

/**
 * Welcome del chat cuando el usuario ya registró su ánimo hoy (puente home→chat).
 * Rotación estable por dateKey; null si no hay mood válido.
 * @param {{ mood?: string, dateKey?: string }|null} checkIn
 * @param {'es'|'en'} [language]
 * @returns {string|null}
 */
export function buildMoodBridgeWelcome(checkIn, language = 'es') {
  const mood = String(checkIn?.mood || '').trim();
  if (!isValidDailyMood(mood)) return null;
  const lang = normalizeDailyMoodLanguage(language);
  const list = MOOD_BRIDGE_WELCOME[lang][mood] || [];
  if (list.length === 0) return null;
  return list[stableIndex(`${checkIn?.dateKey || ''}|${mood}|bridge`, list.length)];
}

/**
 * Snippet para el system prompt del chat (no mencionar el check-in de forma clínica).
 */
export function buildDailyMoodPromptSnippet(checkIn, language = 'es') {
  if (!checkIn?.mood) return '';
  const meta = getDailyMoodCopy(checkIn.mood, language, checkIn.dateKey);
  if (!meta) return '';

  if (language === 'en') {
    return (
      '\n\n### Morning check-in (internal)\n' +
      `The user already reported feeling "${meta.label.toLowerCase()}" in the app home check-in today. ` +
      'Acknowledge with warmth if it fits naturally. Do NOT ask how they feel again or repeat the check-in. ' +
      'If they just opened chat from that check-in, continue from that state. ' +
      (checkIn.mood === 'anxious' || checkIn.mood === 'tired'
        ? 'Prioritize grounding and validation before problem-solving.'
        : 'Match their energy without forcing depth.')
    );
  }

  return (
    '\n\n### Check-in del día (interno)\n' +
    `La persona ya indicó sentirse "${meta.label.toLowerCase()}" en el check-in del home hoy. ` +
    'Reconócelo con calidez si encaja de forma natural. NO preguntes cómo se siente ni repitas el check-in. ' +
    'Si acaba de abrir el chat desde ese check-in, continúa desde ese estado. ' +
    (checkIn.mood === 'anxious' || checkIn.mood === 'tired'
      ? 'Prioriza contención y validación antes de resolver.'
      : 'Acompaña su energía sin forzar profundidad.')
  );
}

export function toClientDailyMoodCheckIn(doc, language = 'es') {
  if (!doc) return null;
  const meta = getDailyMoodCopy(doc.mood, language, doc.dateKey);
  return {
    mood: doc.mood,
    dateKey: doc.dateKey,
    label: meta?.label || doc.mood,
    acknowledgment: meta?.acknowledgment || '',
    antoSnippet: meta?.antoSnippet || '',
    suggestChat: Boolean(meta?.suggestChat),
    chatEmotion: meta?.chatEmotion || null,
    recordedAt: doc.updatedAt || doc.createdAt || null,
    source: doc.source || 'dashboard',
  };
}
