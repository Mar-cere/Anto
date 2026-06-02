/**
 * Normalización de topic, hidratación de sugerencias de chat (#85 / #78 / i18n).
 */
import { INTERVENTION_LABELS_EN } from '../constants/interventionCatalogLabels.en';

const TOPIC_BY_KEY = {
  anxiety: 'anxiety',
  depression: 'depression',
  stress: 'stress',
  anger: 'anger',
  sleep: 'sleep',
  emotionregulation: 'emotionRegulation',
  trauma: 'trauma',
};

const ID_TO_TOPIC = {
  psychoeducation_anxiety: 'anxiety',
  psychoeducation_depression: 'depression',
  psychoeducation_stress: 'stress',
  psychoeducation_anger: 'anger',
  psychoeducation_sleep: 'sleep',
  psychoeducation_emotion_regulation: 'emotionRegulation',
  psychoeducation_trauma: 'trauma',
};

const CARD_COPY = {
  es: {
    anxiety: {
      previewTitle: 'Ansiedad',
      previewSummary: 'Qué es, señales frecuentes y cuándo pedir apoyo.',
      mechanismLine: 'Nombrar la alarma del cuerpo suele bajar la lucha contra la ansiedad.',
    },
    depression: {
      previewTitle: 'Bajo ánimo',
      previewSummary: 'Información sobre ánimo bajo persistente sin etiquetar diagnósticos.',
      mechanismLine: 'Pequeños pasos de activación ayudan a romper el ciclo de inercia.',
    },
    stress: {
      previewTitle: 'Estrés',
      previewSummary: 'Cómo el cuerpo responde al estrés y formas de cuidarte.',
      mechanismLine: 'Separar lo controlable de lo no controlable reduce la carga mental.',
    },
    anger: {
      previewTitle: 'Enojo e ira',
      previewSummary: 'La ira como señal y formas de expresarla con más seguridad.',
      mechanismLine: 'La ira suele señalar un límite o una necesidad no atendida.',
    },
    sleep: {
      previewTitle: 'Sueño',
      previewSummary: 'Higiene del sueño y cuándo consultar a un profesional.',
      mechanismLine: 'La regularidad del horario refuerza el reloj biológico del sueño.',
    },
    emotionRegulation: {
      previewTitle: 'Regulación emocional',
      previewSummary: 'Habilidades para reconocer y modular emociones.',
      mechanismLine: 'Nombrar la emoción con precisión facilita elegir la respuesta.',
    },
    trauma: {
      previewTitle: 'Experiencias difíciles',
      previewSummary: 'Enfoque informado en trauma, sin sustituir terapia especializada.',
      mechanismLine: 'La estabilización antes de revivir recuerdos protege tu sistema nervioso.',
    },
  },
  en: {
    anxiety: {
      previewTitle: 'Anxiety',
      previewSummary: 'What it is, common signs, and when to seek support.',
      mechanismLine: 'Naming the body’s alarm often reduces fighting the anxiety.',
    },
    depression: {
      previewTitle: 'Low mood',
      previewSummary: 'About persistent low mood without diagnostic labels.',
      mechanismLine: 'Small activation steps help break the inertia cycle.',
    },
    stress: {
      previewTitle: 'Stress',
      previewSummary: 'How the body responds to stress and ways to care for yourself.',
      mechanismLine: 'Separating what you can control from what you cannot eases mental load.',
    },
    anger: {
      previewTitle: 'Anger',
      previewSummary: 'Anger as a signal and safer ways to express it.',
      mechanismLine: 'Anger often signals a boundary or an unmet need.',
    },
    sleep: {
      previewTitle: 'Sleep',
      previewSummary: 'Sleep hygiene and when to talk to a professional.',
      mechanismLine: 'A steady schedule strengthens your sleep clock.',
    },
    emotionRegulation: {
      previewTitle: 'Emotion regulation',
      previewSummary: 'Skills to recognize and modulate emotions.',
      mechanismLine: 'Naming the emotion precisely makes it easier to choose your response.',
    },
    trauma: {
      previewTitle: 'Difficult experiences',
      previewSummary: 'Trauma-informed overview; not a substitute for specialized therapy.',
      mechanismLine: 'Stabilization before revisiting memories protects your nervous system.',
    },
  },
};

export function normalizePsychoeducationTopic(raw) {
  const key = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[-_\s]/g, '');
  return TOPIC_BY_KEY[key] || null;
}

export function topicFromInterventionId(interventionId) {
  return ID_TO_TOPIC[String(interventionId || '').trim().toLowerCase()] || null;
}

export function isSafeHttpsUrl(url) {
  return typeof url === 'string' && /^https:\/\//i.test(url.trim());
}

/**
 * Normaliza respuesta GET /psychoeducation (evita confundir res.data.data).
 * @param {unknown} res body JSON del cliente API
 * @returns {{ topic: string, title?: string, summary?: string }[]}
 */
export function parsePsychoeducationBrowseResponse(res) {
  if (res && typeof res === 'object' && res.success === false) {
    return [];
  }
  const raw = Array.isArray(res?.data) ? res.data : [];
  return raw
    .map((item) => {
      if (item && typeof item === 'object' && item.topic) {
        const topic = normalizePsychoeducationTopic(item.topic);
        return topic ? { ...item, topic } : null;
      }
      if (typeof item === 'string') {
        const topic = normalizePsychoeducationTopic(item);
        return topic ? { topic, title: item, summary: '' } : null;
      }
      return null;
    })
    .filter((item) => item?.topic && normalizePsychoeducationTopic(item.topic));
}

function applyEnglishCatalogLabel(suggestion) {
  const id = String(suggestion?.id || '').trim().toLowerCase();
  const enLabel = INTERVENTION_LABELS_EN[id];
  if (!enLabel) return suggestion;
  return { ...suggestion, label: enLabel };
}

function applyPsychoeducationCardFields(suggestion, language) {
  const isPsychoed =
    suggestion.interventionType === 'psychoeducation' ||
    String(suggestion.id || '').startsWith('psychoeducation_');
  if (!isPsychoed) return suggestion;

  const lang = String(language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es';
  const topic =
    normalizePsychoeducationTopic(suggestion.params?.topic) ||
    topicFromInterventionId(suggestion.id);
  if (!topic) return suggestion;

  const copy = CARD_COPY[lang]?.[topic];
  if (!copy) return suggestion;

  return {
    ...suggestion,
    ...copy,
    label: copy.previewTitle || suggestion.label,
    params: { ...(suggestion.params || {}), topic },
    interventionType: 'psychoeducation',
    screen: suggestion.screen || 'PsychoeducationModule',
    cardVariant: 'psychoeducation_native',
    estimatedMinutes: suggestion.estimatedMinutes || 2,
    description: suggestion.description || copy.previewSummary,
  };
}

/**
 * Rellena etiquetas/campos si el payload del chat viene sin enriquecer (histórico).
 */
export function hydrateInterventionSuggestion(suggestion, language = 'es') {
  if (!suggestion) return suggestion;
  const lang = String(language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es';

  let next = suggestion;
  if (lang === 'en') {
    next = applyEnglishCatalogLabel(next);
  }
  if (
    next.cardVariant !== 'psychoeducation_native' &&
    (next.interventionType === 'psychoeducation' ||
      String(next.id || '').startsWith('psychoeducation_'))
  ) {
    next = applyPsychoeducationCardFields(next, lang);
  } else if (lang === 'en' && next.cardVariant === 'psychoeducation_native') {
    next = applyPsychoeducationCardFields(next, lang);
  }
  return next;
}

/** @deprecated usar hydrateInterventionSuggestion */
export const hydratePsychoeducationSuggestion = hydrateInterventionSuggestion;
