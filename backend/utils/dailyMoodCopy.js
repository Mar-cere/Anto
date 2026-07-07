/**
 * Copy y metadatos del check-in diario (ES/EN).
 */
import { DAILY_MOOD_VALUES } from '../models/DailyMoodCheckIn.js';

const COPY = {
  es: {
    calm: {
      label: 'Calma',
      acknowledgment: 'Qué bueno. Si quieres, podemos mantener ese ritmo hoy.',
      antoSnippet: '¿Quieres contarme qué te ayuda a sentirte así de tranquilo?',
      suggestChat: false,
      chatEmotion: 'tranquilidad',
    },
    anxious: {
      label: 'Tenso',
      acknowledgment: 'Gracias por contarlo. No tienes que afrontarlo solo.',
      antoSnippet: 'Puedo acompañarte ahora con calma, sin apuro.',
      suggestChat: true,
      chatEmotion: 'ansiedad',
    },
    tired: {
      label: 'Fatiga',
      acknowledgment: 'Tiene sentido. Hoy podemos ir despacio.',
      antoSnippet: 'Si quieres, vemos juntos qué te está pesando.',
      suggestChat: true,
      chatEmotion: 'cansancio',
    },
    good: {
      label: 'Bien',
      acknowledgment: 'Me alegra leer eso. ¿Quieres aprovechar ese impulso?',
      antoSnippet: '¿Quieres contarme qué está ayudando hoy?',
      suggestChat: false,
      chatEmotion: 'bienestar',
    },
  },
  en: {
    calm: {
      label: 'Calm',
      acknowledgment: 'Good to hear. We can keep that pace today if you want.',
      antoSnippet: 'Want to share what helps you feel this calm?',
      suggestChat: false,
      chatEmotion: 'calm',
    },
    anxious: {
      label: 'Tense',
      acknowledgment: 'Thanks for sharing. You do not have to face this alone.',
      antoSnippet: 'I can be with you now, calmly and without rushing.',
      suggestChat: true,
      chatEmotion: 'anxiety',
    },
    tired: {
      label: 'Tired',
      acknowledgment: 'That makes sense. We can take it slow today.',
      antoSnippet: 'If you want, we can look at what feels heavy together.',
      suggestChat: true,
      chatEmotion: 'fatigue',
    },
    good: {
      label: 'Good',
      acknowledgment: 'Glad to read that. Want to build on that momentum?',
      antoSnippet: 'Want to tell me what is helping today?',
      suggestChat: false,
      chatEmotion: 'wellbeing',
    },
  },
};

export function normalizeDailyMoodLanguage(language) {
  return language === 'en' ? 'en' : 'es';
}

export function isValidDailyMood(mood) {
  return DAILY_MOOD_VALUES.includes(String(mood || '').trim());
}

export function getDailyMoodCopy(mood, language = 'es') {
  const lang = normalizeDailyMoodLanguage(language);
  const key = isValidDailyMood(mood) ? mood : null;
  if (!key) return null;
  return COPY[lang][key];
}

/**
 * Snippet para el system prompt del chat (no mencionar el check-in de forma clínica).
 */
export function buildDailyMoodPromptSnippet(checkIn, language = 'es') {
  if (!checkIn?.mood) return '';
  const meta = getDailyMoodCopy(checkIn.mood, language);
  if (!meta) return '';

  if (language === 'en') {
    return (
      '\n\n### Morning check-in (internal)\n' +
      `The user reported feeling "${meta.label.toLowerCase()}" when opening the app today. ` +
      'Acknowledge with warmth if it fits naturally; do not repeat the check-in question or sound clinical. ' +
      (checkIn.mood === 'anxious' || checkIn.mood === 'tired'
        ? 'Prioritize grounding and validation before problem-solving.'
        : 'Match their energy without forcing depth.')
    );
  }

  return (
    '\n\n### Check-in del día (interno)\n' +
    `La persona reportó sentirse "${meta.label.toLowerCase()}" al abrir la app hoy. ` +
    'Reconócelo con calidez si encaja de forma natural; no repitas la pregunta del check-in ni suenes clínico. ' +
    (checkIn.mood === 'anxious' || checkIn.mood === 'tired'
      ? 'Prioriza contención y validación antes de resolver.'
      : 'Acompaña su energía sin forzar profundidad.')
  );
}

export function toClientDailyMoodCheckIn(doc, language = 'es') {
  if (!doc) return null;
  const meta = getDailyMoodCopy(doc.mood, language);
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
