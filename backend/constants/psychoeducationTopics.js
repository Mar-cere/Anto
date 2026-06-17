/**
 * Metadatos de temas de psicoeducación (#85): títulos, resúmenes, IDs de intervención.
 */
import {
  PSYCHOEDUCATION_CLINICAL_REVIEW,
  normalizeClinicalReview,
} from './psychoeducationClinicalReview.js';

export { PSYCHOEDUCATION_CLINICAL_REVIEW, normalizeClinicalReview };

export const PSYCHOEDUCATION_VERSION = '1.0.0';

export const PSYCHOEDUCATION_ESTIMATED_MINUTES = 2;

export const PSYCHOEDUCATION_TOPIC_ORDER = [
  'anxiety',
  'depression',
  'stress',
  'anger',
  'sleep',
  'emotionRegulation',
  'trauma',
  'grief',
  'burnout',
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
    chatMicroStepsEs: [
      'Nombra una sensación corporal ahora (tensión, pulso, respiración).',
      'Mira 5 cosas a tu alrededor para anclarte un momento.',
    ],
    chatMicroStepsEn: [
      'Name one body sensation right now (tension, pulse, breath).',
      'Look at 5 things around you to ground yourself briefly.',
    ],
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
    chatMicroStepsEs: [
      'Elige una acción mínima de 5 minutos (ducharse, caminar, mensaje).',
      'Registra una cosa que sí salió hoy, por pequeña que sea.',
    ],
    chatMicroStepsEn: [
      'Pick one 5-minute action (shower, walk, one message).',
      'Note one thing that went okay today, however small.',
    ],
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
    chatMicroStepsEs: [
      'Separa en dos columnas: qué depende de ti hoy y qué no.',
      'Haz 3 respiraciones lentas antes de la próxima tarea.',
    ],
    chatMicroStepsEn: [
      'Split into two columns: what you can influence today and what you cannot.',
      'Take 3 slow breaths before your next task.',
    ],
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
    chatMicroStepsEs: [
      'Pausa 60 segundos antes de responder o enviar un mensaje.',
      'Identifica qué límite o necesidad está detrás del enojo.',
    ],
    chatMicroStepsEn: [
      'Pause 60 seconds before replying or sending a message.',
      'Name the boundary or need behind the anger.',
    ],
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
    chatMicroStepsEs: [
      'Fija una hora de despertar similar mañana y pasado mañana.',
      'Evita pantallas 30 minutos antes de acostarte.',
    ],
    chatMicroStepsEn: [
      'Keep a similar wake time tomorrow and the day after.',
      'Avoid screens for 30 minutes before bed.',
    ],
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
    chatMicroStepsEs: [
      'Nombra la emoción con una palabra (enojo, miedo, tristeza…).',
      'Elige una pausa de 2 minutos antes de actuar.',
    ],
    chatMicroStepsEn: [
      'Label the emotion in one word (anger, fear, sadness…).',
      'Take a 2-minute pause before acting.',
    ],
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
    chatMicroStepsEs: [
      'Mira un objeto cercano y describe su textura o color.',
      'Si te desborda, prioriza estar a salvo y pedir apoyo.',
    ],
    chatMicroStepsEn: [
      'Look at a nearby object and describe its texture or color.',
      'If overwhelmed, prioritize safety and reaching support.',
    ],
  },
  grief: {
    interventionId: 'psychoeducation_grief',
    tags: ['duelo', 'perdida'],
    titleEs: 'Duelo y pérdida',
    titleEn: 'Grief and loss',
    summaryEs: 'Cómo suele vivirse el duelo y formas de acompañarte sin apurarte.',
    summaryEn: 'How grief often unfolds and ways to support yourself without rushing.',
    mechanismLineEs: 'Nombrar la pérdida y tus necesidades reduce la soledad del proceso.',
    mechanismLineEn: 'Naming the loss and your needs can ease the loneliness of grief.',
    chatMicroStepsEs: [
      'Escribe una frase sobre lo que extrañas o agradeces.',
      'Elige un gesto pequeño de cuidado hoy (agua, descanso, contacto).',
    ],
    chatMicroStepsEn: [
      'Write one sentence about what you miss or appreciate.',
      'Pick one small act of care today (water, rest, reaching out).',
    ],
  },
  burnout: {
    interventionId: 'psychoeducation_burnout',
    tags: ['agotamiento', 'trabajo'],
    titleEs: 'Agotamiento y burnout',
    titleEn: 'Exhaustion and burnout',
    summaryEs: 'Señales de sobrecarga sostenida y primeros pasos de recuperación.',
    summaryEn: 'Signs of sustained overload and first recovery steps.',
    mechanismLineEs: 'Recuperar energía suele empezar por límites pequeños y repetibles.',
    mechanismLineEn: 'Recovering energy often starts with small, repeatable boundaries.',
    chatMicroStepsEs: [
      'Identifica una tarea que puedes posponer o delegar hoy.',
      'Programa 10 minutos sin pantallas para respirar o caminar.',
    ],
    chatMicroStepsEn: [
      'Name one task you can postpone or delegate today.',
      'Schedule 10 screen-free minutes to breathe or walk.',
    ],
  },
};

export function getPsychoeducationCardFields(topic, language = 'es') {
  const meta = getTopicMeta(topic);
  if (!meta) return null;
  const lang = String(language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es';
  const microSteps =
    lang === 'en' ? meta.chatMicroStepsEn : meta.chatMicroStepsEs;
  return {
    previewTitle: lang === 'en' ? meta.titleEn : meta.titleEs,
    previewSummary: lang === 'en' ? meta.summaryEn : meta.summaryEs,
    mechanismLine: lang === 'en' ? meta.mechanismLineEn : meta.mechanismLineEs,
    microSteps: Array.isArray(microSteps) ? microSteps.slice(0, 2) : [],
    estimatedMinutes: PSYCHOEDUCATION_ESTIMATED_MINUTES,
    clinicalReview: normalizeClinicalReview(lang),
    cardVariant: 'psychoeducation_native',
    cardSchemaVersion: 'psychoeducation_card_v1',
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
      clinicalReview: normalizeClinicalReview(lang),
      mechanismLine: lang === 'en' ? meta.mechanismLineEn : meta.mechanismLineEs,
    };
  }).filter(Boolean);
}
