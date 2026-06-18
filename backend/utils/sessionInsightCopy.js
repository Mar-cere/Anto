/**
 * Textos localizados para insight de sesión post-chat.
 */
import { getInterventionCatalogEntry, getInterventionCatalogLabel } from '../constants/interventionCatalog.js';

const EMOTION_ES = {
  ansiedad: { label: 'Ansiedad', emoji: '💙' },
  tristeza: { label: 'Tristeza', emoji: '🌧️' },
  enojo: { label: 'Enojo', emoji: '🔥' },
  miedo: { label: 'Miedo', emoji: '😰' },
  culpa: { label: 'Culpa', emoji: '😔' },
  verguenza: { label: 'Vergüenza', emoji: '🙈' },
  soledad: { label: 'Soledad', emoji: '🫂' },
  alegria: { label: 'Alegría', emoji: '✨' },
  esperanza: { label: 'Esperanza', emoji: '🌱' },
  neutral: { label: 'Calma mixta', emoji: '🌿' },
};

const EMOTION_EN = {
  ansiedad: { label: 'Anxiety', emoji: '💙' },
  tristeza: { label: 'Sadness', emoji: '🌧️' },
  enojo: { label: 'Anger', emoji: '🔥' },
  miedo: { label: 'Fear', emoji: '😰' },
  culpa: { label: 'Guilt', emoji: '😔' },
  verguenza: { label: 'Shame', emoji: '🙈' },
  soledad: { label: 'Loneliness', emoji: '🫂' },
  alegria: { label: 'Joy', emoji: '✨' },
  esperanza: { label: 'Hope', emoji: '🌱' },
  neutral: { label: 'Mixed calm', emoji: '🌿' },
};

const DISTORTION_EN = {
  all_or_nothing: {
    name: 'All-or-nothing thinking',
    description: 'Seeing things in absolute categories, without middle ground',
  },
  overgeneralization: {
    name: 'Overgeneralization',
    description: 'Treating one negative event as a permanent pattern',
  },
  mental_filter: {
    name: 'Mental filter',
    description: 'Focusing only on negatives while filtering out positives',
  },
  disqualifying_positive: {
    name: 'Disqualifying the positive',
    description: 'Rejecting positive experiences as if they do not count',
  },
  jumping_to_conclusions: {
    name: 'Jumping to conclusions',
    description: 'Making negative interpretations without solid evidence',
  },
  mind_reading: {
    name: 'Mind reading',
    description: 'Assuming you know what others are thinking',
  },
  fortune_telling: {
    name: 'Fortune telling',
    description: 'Predicting things will turn out badly',
  },
  magnification: {
    name: 'Magnification',
    description: 'Blowing problems out of proportion',
  },
  minimization: {
    name: 'Minimization',
    description: 'Downplaying strengths or positive events',
  },
  emotional_reasoning: {
    name: 'Emotional reasoning',
    description: 'Believing something is true because it feels true',
  },
  should_statements: {
    name: '“Should” statements',
    description: 'Rigid rules about how you or others must behave',
  },
  labeling: {
    name: 'Labeling',
    description: 'Defining yourself or others with a single negative label',
  },
  personalization: {
    name: 'Personalization',
    description: 'Taking excessive responsibility for events outside your control',
  },
};

const TOPIC_ES = {
  general: 'Vida diaria',
  trabajo: 'Trabajo',
  relaciones: 'Relaciones',
  salud: 'Salud',
  pérdida: 'Pérdida',
  familia: 'Familia',
  estudios: 'Estudios',
};

const TOPIC_EN = {
  general: 'Daily life',
  trabajo: 'Work',
  relaciones: 'Relationships',
  salud: 'Health',
  pérdida: 'Loss',
  familia: 'Family',
  estudios: 'Studies',
};

const INTENTION_ES = {
  vent: 'Desahogar',
  organize: 'Ordenar pensamiento',
  technique: 'Técnica o regulación',
  plan: 'Planificar',
};

const INTENTION_EN = {
  vent: 'Vent',
  organize: 'Organize thoughts',
  technique: 'Technique or regulation',
  plan: 'Plan',
};

export function normalizeInsightLanguage(language) {
  return String(language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es';
}

export function getEmotionInsightMeta(emotionKey, language = 'es') {
  const key = String(emotionKey || 'neutral').toLowerCase();
  const map = normalizeInsightLanguage(language) === 'en' ? EMOTION_EN : EMOTION_ES;
  return map[key] || map.neutral;
}

export function localizeDistortion(distortion, language = 'es') {
  if (!distortion?.type) return null;
  const en = DISTORTION_EN[distortion.type];
  if (normalizeInsightLanguage(language) === 'en' && en) {
    return {
      type: distortion.type,
      name: en.name,
      description: en.description,
      microTip: shortenIntervention(distortion.intervention, 'en'),
      confidence: distortion.confidence ?? null,
    };
  }
  return {
    type: distortion.type,
    name: distortion.name || en?.name || distortion.type,
    description: distortion.description || en?.description || '',
    microTip: shortenIntervention(distortion.intervention, 'es'),
    confidence: distortion.confidence ?? null,
  };
}

function shortenIntervention(text, language) {
  const raw = String(text || '').trim();
  if (!raw) return '';
  const question = raw.split(/[?.!]/).find((p) => p.includes('?'));
  if (question) return `${question.trim()}?`;
  return raw.length > 120 ? `${raw.slice(0, 117)}…` : raw;
}

export function localizeTopic(topic, language = 'es') {
  const key = String(topic || 'general').toLowerCase();
  const map = normalizeInsightLanguage(language) === 'en' ? TOPIC_EN : TOPIC_ES;
  return map[key] || key;
}

export function localizeSessionIntention(intention, language = 'es') {
  const key = String(intention || '').trim();
  if (!key) return null;
  const map = normalizeInsightLanguage(language) === 'en' ? INTENTION_EN : INTENTION_ES;
  return map[key] || null;
}

export function buildSuggestedStepFromCatalog(interventionId, language = 'es') {
  const entry = getInterventionCatalogEntry(interventionId);
  if (!entry) return null;
  return {
    id: entry.id,
    label: getInterventionCatalogLabel(entry, language),
    icon: entry.icon,
    screen: entry.screen,
    params: entry.params || {},
    interventionType: entry.type,
  };
}

export function buildInsightCopy({
  language,
  dominantEmotion,
  intensity,
  themes,
  hasPattern,
  sessionIntention,
}) {
  const lang = normalizeInsightLanguage(language);
  const emotionMeta = getEmotionInsightMeta(dominantEmotion, lang);
  const intensityRounded = Math.round(Number(intensity) || 5);

  if (lang === 'en') {
    const headline = hasPattern
      ? 'A thinking pattern showed up in this conversation'
      : `Your session centered on ${emotionMeta.label.toLowerCase()}`;
    const reflection = themes.length
      ? `You touched on ${themes.slice(0, 2).join(' and ')} with moderate emotional intensity (${intensityRounded}/10).`
      : `Emotional intensity stayed around ${intensityRounded}/10 across what you shared.`;
    const intentionLine = sessionIntention
      ? `You started wanting to ${String(sessionIntention).toLowerCase()}.`
      : null;
    return { headline, reflection, intentionLine };
  }

  const headline = hasPattern
    ? 'Detectamos un patrón de pensamiento en esta conversación'
    : `Tu sesión giró en torno a ${emotionMeta.label.toLowerCase()}`;
  const reflection = themes.length
    ? `Tocaste temas de ${themes.slice(0, 2).join(' y ')} con una intensidad emocional de ${intensityRounded}/10.`
    : `La intensidad emocional se mantuvo alrededor de ${intensityRounded}/10 en lo que compartiste.`;
  const intentionLine = sessionIntention
    ? `Empezaste buscando ${String(sessionIntention).toLowerCase()}.`
    : null;
  return { headline, reflection, intentionLine };
}

/**
 * Copy seguro cuando la sesión incluye crisis (WARNING/MEDIUM/HIGH).
 */
export function buildCrisisSessionInsightCopy({
  language,
  riskTier = 'medium',
  intensity = 7,
  sessionIntention = null,
}) {
  const lang = normalizeInsightLanguage(language);
  const tier = String(riskTier || 'medium').toLowerCase();
  const intensityRounded = Math.round(Number(intensity) || 7);

  if (lang === 'en') {
    const headline =
      tier === 'high'
        ? 'What you shared matters — your safety comes first'
        : 'You went through a difficult moment — you are not alone';
    const reflection =
      tier === 'high'
        ? `This conversation included intense distress (around ${intensityRounded}/10). Reaching out was a brave step.`
        : `This conversation touched on emotional safety with notable intensity (${intensityRounded}/10).`;
    const intentionLine = sessionIntention
      ? `You started wanting to ${String(sessionIntention).toLowerCase()}.`
      : null;
    return { headline, reflection, intentionLine };
  }

  const headline =
    tier === 'high'
      ? 'Lo que compartiste importa: tu seguridad es lo primero'
      : 'Pasaste por un momento difícil — no estás solo/a';
  const reflection =
    tier === 'high'
      ? `Esta conversación incluyó mucho malestar (alrededor de ${intensityRounded}/10). Pedir ayuda fue un paso valiente.`
      : `Esta conversación tocó tu seguridad emocional con intensidad notable (${intensityRounded}/10).`;
  const intentionLine = sessionIntention
    ? `Empezaste buscando ${String(sessionIntention).toLowerCase()}.`
    : null;
  return { headline, reflection, intentionLine };
}

/**
 * Copy cuando hubo crisis en la sesión pero el cierre es más tranquilo (fase settled).
 */
export function buildCrisisRecoverySessionInsightCopy({
  language,
  peakRiskTier = 'medium',
  intensity = 6,
  sessionIntention = null,
}) {
  const lang = normalizeInsightLanguage(language);
  const tier = String(peakRiskTier || 'medium').toLowerCase();
  const intensityRounded = Math.round(Number(intensity) || 6);

  if (lang === 'en') {
    const headline =
      tier === 'high'
        ? 'You went through a hard moment and ended a bit steadier'
        : 'A difficult stretch — and you found a calmer close';
    const reflection =
      tier === 'high'
        ? `There was intense distress in this chat (around ${intensityRounded}/10), and you also signaled relief toward the end. Both matter.`
        : `This chat touched emotional safety (${intensityRounded}/10) and you closed on a steadier note.`;
    const intentionLine = sessionIntention
      ? `You started wanting to ${String(sessionIntention).toLowerCase()}.`
      : null;
    return { headline, reflection, intentionLine };
  }

  const headline =
    tier === 'high'
      ? 'Pasaste por un momento difícil y terminaste más tranquilo/a'
      : 'Hubo un tramo difícil y cerraste con más calma';
  const reflection =
    tier === 'high'
      ? `En esta conversación hubo mucho malestar (alrededor de ${intensityRounded}/10) y también señales de alivio al final. Las dos cosas cuentan.`
      : `Esta conversación tocó tu seguridad emocional (${intensityRounded}/10) y cerraste en un tono más estable.`;
  const intentionLine = sessionIntention
    ? `Empezaste buscando ${String(sessionIntention).toLowerCase()}.`
    : null;
  return { headline, reflection, intentionLine };
}
