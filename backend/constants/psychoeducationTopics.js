/**
 * Metadatos de temas de psicoeducación (#85): títulos, resúmenes, IDs de intervención.
 */

export const PSYCHOEDUCATION_VERSION = '1.0.0';

/** #111: governance visible; sustituir `reviewedAt` tras revisión clínica formal. */
export const PSYCHOEDUCATION_CLINICAL_REVIEW = {
  status: 'editorial_review',
  version: PSYCHOEDUCATION_VERSION,
  reviewedAt: '2026-06-01',
  noteEs: 'Revisión editorial de contenido; no constituye validación clínica individual.',
  noteEn: 'Editorial content review; not individual clinical validation.',
};

export const PSYCHOEDUCATION_ESTIMATED_MINUTES = 2;

export const PSYCHOEDUCATION_TOPIC_ORDER = [
  'anxiety',
  'depression',
  'stress',
  'anger',
  'sleep',
  'emotionRegulation',
  'trauma',
];

export const PSYCHOEDUCATION_TOPIC_META = {
  anxiety: {
    interventionId: 'psychoeducation_anxiety',
    tags: ['ansiedad', 'miedo'],
    titleEs: 'Ansiedad',
    titleEn: 'Anxiety',
    summaryEs: 'Qué es, señales frecuentes y cuándo pedir apoyo.',
    summaryEn: 'What it is, common signs, and when to seek support.',
    mechanismLineEs: 'Nombrar la alarma del cuerpo suele bajar la lucha contra la ansiedad.',
    mechanismLineEn: 'Naming the body’s alarm often reduces fighting the anxiety.',
  },
  depression: {
    interventionId: 'psychoeducation_depression',
    tags: ['tristeza'],
    titleEs: 'Bajo ánimo',
    titleEn: 'Low mood',
    summaryEs: 'Información sobre ánimo bajo persistente sin etiquetar diagnósticos.',
    summaryEn: 'About persistent low mood without diagnostic labels.',
    mechanismLineEs: 'Pequeños pasos de activación ayudan a romper el ciclo de inercia.',
    mechanismLineEn: 'Small activation steps help break the inertia cycle.',
  },
  stress: {
    interventionId: 'psychoeducation_stress',
    tags: ['estres'],
    titleEs: 'Estrés',
    titleEn: 'Stress',
    summaryEs: 'Cómo el cuerpo responde al estrés y formas de cuidarte.',
    summaryEn: 'How the body responds to stress and ways to care for yourself.',
    mechanismLineEs: 'Separar lo controlable de lo no controlable reduce la carga mental.',
    mechanismLineEn: 'Separating what you can control from what you cannot eases mental load.',
  },
  anger: {
    interventionId: 'psychoeducation_anger',
    tags: ['enojo', 'ira'],
    titleEs: 'Enojo e ira',
    titleEn: 'Anger',
    summaryEs: 'La ira como señal y formas de expresarla con más seguridad.',
    summaryEn: 'Anger as a signal and safer ways to express it.',
    mechanismLineEs: 'La ira suele señalar un límite o una necesidad no atendida.',
    mechanismLineEn: 'Anger often signals a boundary or an unmet need.',
  },
  sleep: {
    interventionId: 'psychoeducation_sleep',
    tags: ['sueño', 'insomnio'],
    titleEs: 'Sueño',
    titleEn: 'Sleep',
    summaryEs: 'Higiene del sueño y cuándo consultar a un profesional.',
    summaryEn: 'Sleep hygiene and when to talk to a professional.',
    mechanismLineEs: 'La regularidad del horario refuerza el reloj biológico del sueño.',
    mechanismLineEn: 'A steady schedule strengthens your sleep clock.',
  },
  emotionRegulation: {
    interventionId: 'psychoeducation_emotion_regulation',
    tags: ['regulacion', 'emociones'],
    titleEs: 'Regulación emocional',
    titleEn: 'Emotion regulation',
    summaryEs: 'Habilidades para reconocer y modular emociones.',
    summaryEn: 'Skills to recognize and modulate emotions.',
    mechanismLineEs: 'Nombrar la emoción con precisión facilita elegir la respuesta.',
    mechanismLineEn: 'Naming the emotion precisely makes it easier to choose your response.',
  },
  trauma: {
    interventionId: 'psychoeducation_trauma',
    tags: ['trauma'],
    titleEs: 'Experiencias difíciles',
    titleEn: 'Difficult experiences',
    summaryEs: 'Enfoque informado en trauma, sin sustituir terapia especializada.',
    summaryEn: 'Trauma-informed overview; not a substitute for specialized therapy.',
    mechanismLineEs: 'La estabilización antes de revivir recuerdos protege tu sistema nervioso.',
    mechanismLineEn: 'Stabilization before revisiting memories protects your nervous system.',
  },
};

export function getPsychoeducationCardFields(topic, language = 'es') {
  const meta = getTopicMeta(topic);
  if (!meta) return null;
  const lang = String(language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es';
  return {
    previewTitle: lang === 'en' ? meta.titleEn : meta.titleEs,
    previewSummary: lang === 'en' ? meta.summaryEn : meta.summaryEs,
    mechanismLine: lang === 'en' ? meta.mechanismLineEn : meta.mechanismLineEs,
    estimatedMinutes: PSYCHOEDUCATION_ESTIMATED_MINUTES,
    clinicalReview: PSYCHOEDUCATION_CLINICAL_REVIEW,
    cardVariant: 'psychoeducation_native',
  };
}

const DISCLAIMERS = {
  es: 'Este contenido es educativo y no sustituye evaluación, diagnóstico ni tratamiento por un profesional de salud mental. Si estás en crisis o en riesgo, busca ayuda inmediata en tu país.',
  en: 'This content is educational and does not replace assessment, diagnosis, or treatment by a mental health professional. If you are in crisis or at risk, seek immediate help in your country.',
};

export function getPsychoeducationDisclaimer(language = 'es') {
  const lang = String(language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es';
  return DISCLAIMERS[lang];
}

export function getTopicMeta(topic) {
  const key = String(topic || '').trim();
  return PSYCHOEDUCATION_TOPIC_META[key] || null;
}

export function getPsychoeducationBrowseItems(language = 'es') {
  const lang = String(language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es';
  return PSYCHOEDUCATION_TOPIC_ORDER.map((topic) => {
    const meta = PSYCHOEDUCATION_TOPIC_META[topic];
    if (!meta) return null;
    return {
      topic,
      interventionId: meta.interventionId,
      title: lang === 'en' ? meta.titleEn : meta.titleEs,
      summary: lang === 'en' ? meta.summaryEn : meta.summaryEs,
      tags: meta.tags,
      version: PSYCHOEDUCATION_VERSION,
      estimatedMinutes: PSYCHOEDUCATION_ESTIMATED_MINUTES,
      clinicalReview: PSYCHOEDUCATION_CLINICAL_REVIEW,
      mechanismLine: lang === 'en' ? meta.mechanismLineEn : meta.mechanismLineEs,
    };
  }).filter(Boolean);
}
